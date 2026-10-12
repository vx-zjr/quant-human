import type { Profile, Sex, Smoking } from '../types'
import { ageOf, bmi as calcBmi } from './body'
import { interp } from './stats'

/**
 * 寿命模型：Gompertz–Makeham 生命表 + 比例风险（风险比 HR）修正。
 *
 *   μ(x) = λ + α·e^(βx)·HR
 *
 * - β：死亡率随年龄指数增长的速率（约每 7.7 年翻倍）
 * - α：按性别校准，使人群出生时预期寿命匹配目标值
 * - λ：与年龄无关的背景死亡（意外等）
 * - HR：个人风险因素的综合风险比，相对于“人群典型组合”归一化
 *
 * 重要：这是教学/探索用的简化模型，不是临床工具。风险因素的 HR 来自观察性研究的荟萃分析，
 * 含混杂；多个因素之间并不独立，因此对合并后的 log HR 做了 0.7 倍收缩。
 */

export const BETA = 0.09
export const MAKEHAM = 0.0003
export const MAX_AGE = 115
/** 中国 2024 年人均预期寿命约 79 岁；性别差异按约 5.5 岁估算 */
export const TARGET_LE: Record<Sex, number> = { male: 76.3, female: 81.8 }
export const SHRINK = 0.7

export interface MortalityParams {
  alpha: number
  beta: number
  lambda: number
}

/** 累积风险 H(x) = λx + (α·hr/β)(e^(βx) − 1) */
function cumHazard(x: number, p: MortalityParams, hr: number): number {
  return p.lambda * x + ((p.alpha * hr) / p.beta) * (Math.exp(p.beta * x) - 1)
}

export function survival(x: number, p: MortalityParams, hr = 1): number {
  return Math.exp(-cumHazard(x, p, hr))
}

export function hazard(x: number, p: MortalityParams, hr = 1): number {
  return p.lambda + p.alpha * hr * Math.exp(p.beta * x)
}

/** 从 fromAge 起的剩余预期寿命（数值积分） */
export function lifeExpectancy(p: MortalityParams, hr = 1, fromAge = 0): number {
  const s0 = survival(fromAge, p, hr)
  let sum = 0
  const dx = 0.1
  for (let x = fromAge; x < MAX_AGE; x += dx) sum += survival(x + dx / 2, p, hr) * dx
  return sum / s0
}

const alphaCache = new Map<Sex, number>()

/** 二分法校准 α，使出生时预期寿命 = TARGET_LE[sex] */
export function calibrate(sex: Sex): MortalityParams {
  let alpha = alphaCache.get(sex)
  if (alpha === undefined) {
    let lo = 1e-7
    let hi = 1e-2
    for (let i = 0; i < 80; i++) {
      const mid = Math.sqrt(lo * hi)
      const le = lifeExpectancy({ alpha: mid, beta: BETA, lambda: MAKEHAM }, 1, 0)
      if (le > TARGET_LE[sex]) lo = mid
      else hi = mid
    }
    alpha = Math.sqrt(lo * hi)
    alphaCache.set(sex, alpha)
  }
  return { alpha, beta: BETA, lambda: MAKEHAM }
}

/* ------------------------------ 风险因素 ------------------------------ */

export interface RiskInputs {
  sex: Sex
  smoking: Smoking
  exerciseMin: number
  bmi: number
  sleepHours: number
  drinksPerWeek: number
  support: number
  diet: number
  purpose: number
  /** 尽责性 z 分数 */
  cZ: number
}

export interface RiskFactor {
  key: keyof Omit<RiskInputs, 'sex'>
  label: string
  value: string
  hr: number
  /** 理想参考水平 */
  ideal: string
  evidence: string
  source: string
}

const smokingHR: Record<Smoking, number> = { never: 1, former: 1.3, current: 2.0 }

/** 运动剂量-反应（相对每周 150–299 分钟），据 Arem 2015 换算 */
export const exerciseHR = (m: number) => interp([0, 75, 150, 300, 450, 750, 1200], [1.45, 1.16, 1.0, 0.91, 0.88, 0.88, 0.93], m)

/** BMI 的 J 形关系（PSC 2009）：22.5–25 最低；>25 每 5 单位 ×1.29；偏瘦一侧缓升，<18.5 后陡升 */
export function bmiHR(b: number): number {
  if (b > 25) return 1.29 ** ((b - 25) / 5)
  if (b >= 18.5) return b < 22.5 ? 1 + 0.05 * (22.5 - b) : 1
  return 1.2 + 0.1 * (18.5 - b)
}

/** 睡眠时长 U 形（Cappuccio 2010） */
export const sleepHR = (h: number) => interp([4, 5, 6, 7, 8, 9, 10, 11], [1.25, 1.15, 1.08, 1.0, 1.0, 1.12, 1.3, 1.4], h)

/** 饮酒（Zhao 2023：少量饮酒无保护作用） */
export const alcoholHR = (d: number) => interp([0, 7, 14, 28, 42], [1, 1, 1.05, 1.18, 1.35], d)

/** 社会支持 1..5（Holt-Lunstad 2010/2015） */
export const supportHR = (s: number) => interp([1, 2, 3, 4, 5], [1.35, 1.2, 1.08, 1.0, 0.96], s)

/** 饮食质量 1..5（Sofi 2010 / GBD 2019 量级） */
export const dietHR = (q: number) => interp([1, 3, 5], [1.25, 1.06, 0.9], q)

/** 目的感 1..7（Cohen 2016：高 vs 低 RR≈0.83） */
export const purposeHR = (p: number) => interp([1, 4, 7], [1.1, 1.0, 0.91], p)

/** 尽责性（Jokela 2013 量级：每 1 SD 约 −9%） */
export const conscHR = (z: number) => Math.exp(-0.09 * Math.max(-3, Math.min(3, z)))

export function riskFactors(r: RiskInputs): RiskFactor[] {
  const smokingLabel: Record<Smoking, string> = { never: '从不吸烟', former: '已戒烟', current: '目前吸烟' }
  return [
    {
      key: 'smoking',
      label: '吸烟',
      value: smokingLabel[r.smoking],
      hr: smokingHR[r.smoking],
      ideal: '从不吸烟',
      evidence: '吸烟者平均损失 ≥10 年寿命；40 岁前戒烟可挽回大部分',
      source: 'jha2013',
    },
    {
      key: 'exerciseMin',
      label: '运动',
      value: `${r.exerciseMin} 分钟/周`,
      hr: exerciseHR(r.exerciseMin),
      ideal: '300–750 分钟/周',
      evidence: '达到指南量死亡风险约低 31%，3–5 倍指南量后收益平台',
      source: 'arem2015',
    },
    {
      key: 'bmi',
      label: 'BMI',
      value: r.bmi.toFixed(1),
      hr: bmiHR(r.bmi),
      ideal: '22.5–25',
      evidence: '>25 后每增加 5 单位，死亡风险约 +29%',
      source: 'psc2009',
    },
    {
      key: 'sleepHours',
      label: '睡眠',
      value: `${r.sleepHours} 小时`,
      hr: sleepHR(r.sleepHours),
      ideal: '7–8 小时',
      evidence: '过短 RR≈1.12，过长 RR≈1.30（后者部分反映疾病）',
      source: 'cappuccio2010',
    },
    {
      key: 'drinksPerWeek',
      label: '饮酒',
      value: `${r.drinksPerWeek} 杯/周`,
      hr: alcoholHR(r.drinksPerWeek),
      ideal: '≤ 7 杯/周（越少越好）',
      evidence: '校正偏差后少量饮酒无保护作用',
      source: 'zhao2023',
    },
    {
      key: 'support',
      label: '社会联结',
      value: `${r.support}/5`,
      hr: supportHR(r.support),
      ideal: '4–5',
      evidence: '社会关系强者生存几率高约 50%',
      source: 'holtlunstad2010',
    },
    {
      key: 'diet',
      label: '饮食质量',
      value: `${r.diet}/5`,
      hr: dietHR(r.diet),
      ideal: '5（多蔬果全谷、少盐少加工）',
      evidence: '饮食风险是全球首要的可改变死亡风险之一',
      source: 'gbddiet2019',
    },
    {
      key: 'purpose',
      label: '目的感',
      value: `${r.purpose}/7`,
      hr: purposeHR(r.purpose),
      ideal: '6–7',
      evidence: '高目的感者全因死亡 RR≈0.83（因果方向未定）',
      source: 'cohen2016',
    },
    {
      key: 'cZ',
      label: '尽责性',
      value: `z = ${r.cZ.toFixed(1)}`,
      hr: conscHR(r.cZ),
      ideal: '较高',
      evidence: '低尽责性与较高死亡风险相关（部分经由健康行为）',
      source: 'jokela2013',
    },
  ]
}

/** 人群“典型组合”的期望 log HR（用于归一化，使典型个体≈人群生命表） */
export function populationLogHR(sex: Sex): number {
  // 吸烟：中国成年男性现吸烟率约 50%，女性约 2%（量级）
  const smokeMix = sex === 'male' ? { current: 0.5, former: 0.1, never: 0.4 } : { current: 0.02, former: 0.01, never: 0.97 }
  const smokeLog =
    smokeMix.current * Math.log(smokingHR.current) + smokeMix.former * Math.log(smokingHR.former) + smokeMix.never * 0
  const typical: RiskInputs = {
    sex,
    smoking: 'never',
    exerciseMin: 60,
    bmi: 24.3,
    sleepHours: 7,
    drinksPerWeek: sex === 'male' ? 7 : 1,
    support: 3.5,
    diet: 3,
    purpose: 4.5,
    cZ: 0,
  }
  const rest = riskFactors(typical)
    .filter((f) => f.key !== 'smoking')
    .reduce((s, f) => s + Math.log(f.hr), 0)
  return smokeLog + rest
}

export function combinedHR(r: RiskInputs): number {
  const sumLog = riskFactors(r).reduce((s, f) => s + Math.log(f.hr), 0)
  return Math.exp(SHRINK * (sumLog - populationLogHR(r.sex)))
}

export function riskInputsFromProfile(p: Profile, cZ: number): RiskInputs {
  return {
    sex: p.sex,
    smoking: p.smoking,
    exerciseMin: p.exerciseMin,
    bmi: calcBmi(p.heightCm, p.weightKg),
    sleepHours: p.sleepHours,
    drinksPerWeek: p.drinksPerWeek,
    support: p.support,
    diet: p.diet,
    purpose: p.purpose,
    cZ,
  }
}

export const IDEAL_INPUTS = (sex: Sex): RiskInputs => ({
  sex,
  smoking: 'never',
  exerciseMin: 450,
  bmi: 23.5,
  sleepHours: 7.5,
  drinksPerWeek: 0,
  support: 5,
  diet: 5,
  purpose: 7,
  cZ: 1,
})

/* ------------------------------ 汇总 ------------------------------ */

export interface SurvivalSummary {
  age: number
  hr: number
  /** 剩余预期寿命（均值） */
  remainingLE: number
  expectedDeathAge: number
  medianDeathAge: number
  p10DeathAge: number
  p90DeathAge: number
  survive: { age: number; p: number }[]
  curve: { age: number; s: number }[]
}

/** 条件生存：已活到 age 岁时，活到 x 岁的概率 */
export function conditionalSurvival(x: number, age: number, p: MortalityParams, hr: number): number {
  if (x <= age) return 1
  return survival(x, p, hr) / survival(age, p, hr)
}

function quantileDeathAge(q: number, age: number, p: MortalityParams, hr: number): number {
  // 求 S(x|age) = 1 − q
  let lo = age
  let hi = MAX_AGE + 20
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (conditionalSurvival(mid, age, p, hr) > 1 - q) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export function summarize(sex: Sex, age: number, hr: number): SurvivalSummary {
  const p = calibrate(sex)
  const remainingLE = lifeExpectancy(p, hr, age)
  const curve: { age: number; s: number }[] = []
  for (let x = Math.floor(age); x <= 110; x++) curve.push({ age: x, s: conditionalSurvival(x, age, p, hr) })
  return {
    age,
    hr,
    remainingLE,
    expectedDeathAge: age + remainingLE,
    medianDeathAge: quantileDeathAge(0.5, age, p, hr),
    p10DeathAge: quantileDeathAge(0.1, age, p, hr),
    p90DeathAge: quantileDeathAge(0.9, age, p, hr),
    survive: [70, 80, 90, 100].filter((x) => x > age).map((x) => ({ age: x, p: conditionalSurvival(x, age, p, hr) })),
    curve,
  }
}

export function profileSurvival(p: Profile, cZ: number, now = new Date()) {
  const inputs = riskInputsFromProfile(p, cZ)
  const hr = combinedHR(inputs)
  const age = ageOf(p, now)
  return { inputs, hr, factors: riskFactors(inputs), summary: summarize(p.sex, age, hr) }
}
