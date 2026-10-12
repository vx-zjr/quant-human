import type { Profile, Sex } from '../types'
import { ageOf } from './body'
import { calibrate, combinedHR, MAX_AGE, riskInputsFromProfile, type MortalityParams } from './mortality'
import { traitZ } from './scoring'
import { clamp, mulberry32, quantileSorted, randn } from './stats'

/**
 * 蒙特卡洛人生模拟器（玩具模型，所有参数透明可改）。
 *
 * 每次运行从当前年龄起逐年推进三个状态量：
 *   健康 h ∈ [0,100]、幸福感 wb ∈ [0,10]、财富百分位 w ∈ [1,99]
 * 并按年龄依赖的概率抽样人生事件（伴侣、孩子、离婚、丧亲、失业、重病、意外之喜……）。
 * 死亡按 Gompertz–Makeham 生命表 × 个人风险比 × 近期疾病修正抽样。
 *
 * 目的不是“算命”，而是让人直观看到：同一个人、同样的起点，会展开成一束发散的轨迹。
 * 事件概率为量级示意（见 AGENT.md：校准是 ROADMAP 任务）。
 */

export type EventKind = 'family' | 'health' | 'career' | 'loss' | 'luck' | 'move'

export interface SimEvent {
  age: number
  label: string
  kind: EventKind
  valence: number
}

export interface SampleLife {
  deathAge: number
  events: SimEvent[]
  ages: number[]
  health: number[]
  wellbeing: number[]
  wealth: number[]
}

export interface Band {
  age: number
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  n: number
}

export interface SimResult {
  startAge: number
  hr: number
  ages: number[]
  alive: number[]
  health: Band[]
  wellbeing: Band[]
  wealth: Band[]
  deathAges: number[]
  deathHist: { age: number; count: number }[]
  samples: SampleLife[]
  stats: {
    medianDeath: number
    meanDeath: number
    pIllness: number
    meanIllnesses: number
    pDivorce: number
    pWidowed: number
    pUnemployed: number
  }
}

export interface SimOptions {
  runs: number
  seed: number
  /** 可选：覆盖综合风险比（用于情景对比） */
  hrOverride?: number
  sampleCount?: number
}

/* ---------------- 模型组件（导出以便测试与在 UI 中展示） ---------------- */

/** 健康的年衰减率（点/年），随年龄加速 */
export const healthDecline = (age: number) => 0.15 + 0.02 * Math.max(0, age - 35)

/** 从 20 岁起累计的基线健康损耗 */
export function cumulativeDecline(age: number): number {
  let s = 0
  for (let a = 20; a < age; a++) s += healthDecline(a + 0.5)
  return s
}

/** 重大疾病（癌症、心梗、卒中等首次确诊）的年发生概率 */
export const illnessProb = (age: number, hr: number) => Math.min(0.2, 0.004 * Math.exp(0.06 * (age - 30)) * hr ** 0.7)

const SHOCK_MEAN = 17.5
const ACUTE_DECAY = 0.35
const ACUTE_SHARE = 0.6
/** 近期疾病对死亡风险的修正强度 */
const ACUTE_MORTALITY = 0.04

/** 人群中“急性健康赤字”的期望值，用于归一化，使平均死亡率与生命表一致 */
const expectedAcute = (age: number, hr: number) => (illnessProb(age, hr) * SHOCK_MEAN * ACUTE_SHARE) / ACUTE_DECAY

/** 幸福感年龄 U 形（Blanchflower 2021：低谷约 48 岁，幅度约 0.4 分） */
export const wellbeingU = (age: number) => 0.0004 * (age - 48) ** 2

/** 收入百分位的年龄曲线（50 岁左右达峰） */
const incomeAgeProfile = (age: number) => -0.025 * (age - 50) ** 2

const annualDeathProb = (age: number, p: MortalityParams, hr: number) =>
  1 - Math.exp(-(p.lambda + p.alpha * hr * Math.exp(p.beta * (age + 0.5))))

const RETIRE_AGE: Record<Sex, number> = { male: 63, female: 58 }

/* ------------------------------- 主函数 ------------------------------- */

export function simulateLives(profile: Profile, opt: SimOptions, now = new Date()): SimResult {
  const rng = mulberry32(opt.seed)
  const a0 = Math.floor(ageOf(profile, now))
  const cZ = traitZ('C', profile.bigFive.C)
  const hr = opt.hrOverride ?? combinedHR(riskInputsFromProfile(profile, cZ))
  const mp = calibrate(profile.sex)
  const mpOther = calibrate(profile.sex === 'male' ? 'female' : 'male')
  const mpFather = calibrate('male')
  const mpMother = calibrate('female')
  const hrHealth = Math.sqrt(hr)
  const sampleCount = opt.sampleCount ?? 3
  const nYears = MAX_AGE - a0 + 1

  const healthAt: number[][] = Array.from({ length: nYears }, () => [])
  const wbAt: number[][] = Array.from({ length: nYears }, () => [])
  const wealthAt: number[][] = Array.from({ length: nYears }, () => [])
  const deathAges: number[] = []
  const samples: SampleLife[] = []
  let illnessRuns = 0
  let illnessTotal = 0
  let divorceRuns = 0
  let widowRuns = 0
  let unemployRuns = 0

  for (let run = 0; run < opt.runs; run++) {
    const record = run < sampleCount
    const events: SimEvent[] = []
    const series = { ages: [] as number[], health: [] as number[], wellbeing: [] as number[], wealth: [] as number[] }
    const push = (age: number, label: string, kind: EventKind, valence: number) => {
      if (record) events.push({ age, label, kind, valence })
    }

    // 初始状态
    let chronic = 0
    let acute = 0
    let noise = 0
    let wbTrans = 0
    let wbPerm = 0
    let w = profile.incomePct
    const pPartnered = a0 < 20 ? 0.03 : a0 < 25 ? 0.2 : a0 < 30 ? 0.5 : a0 < 40 ? 0.75 : 0.8
    let partnered = rng() < pPartnered
    let kids = a0 >= 30 && partnered ? (rng() < 0.75 ? (rng() < 0.4 ? 2 : 1) : 0) : 0
    const fatherAge0 = a0 + 30
    const motherAge0 = a0 + 28
    let fatherAlive = rng() < Math.exp(-((mpFather.alpha / mpFather.beta) * (Math.exp(mpFather.beta * fatherAge0) - Math.exp(mpFather.beta * 30))))
    let motherAlive = rng() < Math.exp(-((mpMother.alpha / mpMother.beta) * (Math.exp(mpMother.beta * motherAge0) - Math.exp(mpMother.beta * 28))))
    let retired = a0 >= RETIRE_AGE[profile.sex]
    let illnesses = 0
    let divorced = false
    let widowed = false
    let unemployed = false
    let deathAge = MAX_AGE

    for (let i = 0; i < nYears; i++) {
      const age = a0 + i
      const yrs = age - a0

      /* ---- 事件 ---- */
      if (!partnered) {
        const p = age < 20 ? 0.01 : age <= 35 ? 0.12 : age <= 50 ? 0.04 : 0.015
        if (rng() < p) {
          partnered = true
          wbTrans += 0.8
          wbPerm += 0.1
          push(age, '结婚 / 长期伴侣', 'family', 2)
        }
      } else {
        const maxChildAge = profile.sex === 'female' ? 42 : 48
        if (kids < 2 && age >= 23 && age <= maxChildAge && rng() < 0.09) {
          kids++
          wbTrans += 0.5
          w -= 2
          push(age, kids === 1 ? '迎来第一个孩子' : '迎来第二个孩子', 'family', 2)
        }
        if (rng() < (age < 50 ? 0.012 : 0.005)) {
          partnered = false
          divorced = true
          wbTrans -= 1.2
          wbPerm -= 0.15
          w -= 5
          push(age, '离婚 / 分手', 'loss', -2)
        } else if (age > 45 && rng() < annualDeathProb(age, mpOther, 1)) {
          partnered = false
          widowed = true
          wbTrans -= 2
          wbPerm -= 0.3
          push(age, '伴侣离世', 'loss', -2)
        }
      }
      if (fatherAlive && rng() < annualDeathProb(fatherAge0 + yrs, mpFather, 1)) {
        fatherAlive = false
        wbTrans -= 1
        push(age, '父亲去世', 'loss', -2)
      }
      if (motherAlive && rng() < annualDeathProb(motherAge0 + yrs, mpMother, 1)) {
        motherAlive = false
        wbTrans -= 1
        push(age, '母亲去世', 'loss', -2)
      }
      if (!retired && age >= 22) {
        if (rng() < 0.08) {
          w += 2 + randn(rng) * 5
          push(age, '职业转换', 'career', 0)
        }
        if (rng() < 0.025) {
          unemployed = true
          wbTrans -= 1
          wbPerm -= 0.2
          w -= 10
          push(age, '失业', 'career', -2)
        }
      }
      if (!retired && age >= RETIRE_AGE[profile.sex]) {
        retired = true
        wbTrans += 0.3
        push(age, '退休', 'career', 0)
      }
      if (rng() < 0.012) {
        wbTrans += 0.8
        w += 10
        push(age, '意外之喜 / 重大成就', 'luck', 2)
      }
      if (rng() < (age < 35 ? 0.06 : 0.02)) push(age, '搬到新城市', 'move', 0)
      if (rng() < illnessProb(age, hr)) {
        const shock = 10 + 15 * rng()
        acute += shock * ACUTE_SHARE
        chronic += shock * (1 - ACUTE_SHARE)
        illnesses++
        wbTrans -= 1.2
        wbPerm -= 0.3
        w -= 4
        push(age, '确诊重大疾病', 'health', -2)
      }

      /* ---- 状态更新 ---- */
      noise = 0.7 * noise + randn(rng) * 2
      const hBase = 100 - hrHealth * cumulativeDecline(age)
      const h = clamp(hBase - chronic - acute + noise, 1, 100)

      const wb = clamp(
        profile.lifeSat + wellbeingU(age) - wellbeingU(a0) + wbPerm + wbTrans + 0.02 * (h - hBase) + randn(rng) * 0.35,
        0,
        10,
      )

      const growth = Math.min(1, yrs / 15)
      const target =
        profile.incomePct +
        incomeAgeProfile(age) -
        incomeAgeProfile(a0) +
        (retired ? -8 : 0) +
        (profile.eduYears - 14) * 0.8 * growth +
        3 * cZ * Math.min(1, yrs / 20)
      w = clamp(w + 0.15 * (target - w) + randn(rng) * 3, 1, 99)

      healthAt[i].push(h)
      wbAt[i].push(wb)
      wealthAt[i].push(w)
      if (record) {
        series.ages.push(age)
        series.health.push(h)
        series.wellbeing.push(wb)
        series.wealth.push(w)
      }

      // 衰减
      acute *= 1 - ACUTE_DECAY
      wbTrans *= 0.5

      /* ---- 死亡 ---- */
      const mod = Math.exp(ACUTE_MORTALITY * (acute - expectedAcute(age, hr)))
      if (rng() < annualDeathProb(age, mp, hr * mod) || age >= MAX_AGE) {
        deathAge = age + rng()
        push(age, '生命终点', 'loss', 0)
        break
      }
    }

    deathAges.push(deathAge)
    if (illnesses > 0) illnessRuns++
    illnessTotal += illnesses
    if (divorced) divorceRuns++
    if (widowed) widowRuns++
    if (unemployed) unemployRuns++
    if (record) samples.push({ deathAge, events, ...series })
  }

  const minN = Math.max(5, Math.floor(opt.runs * 0.02))
  const band = (arr: number[][]): Band[] =>
    arr
      .map((xs, i) => {
        const s = [...xs].sort((a, b) => a - b)
        return {
          age: a0 + i,
          n: s.length,
          p10: quantileSorted(s, 0.1),
          p25: quantileSorted(s, 0.25),
          p50: quantileSorted(s, 0.5),
          p75: quantileSorted(s, 0.75),
          p90: quantileSorted(s, 0.9),
        }
      })
      .filter((b) => b.n >= minN)

  const ages = Array.from({ length: nYears }, (_, i) => a0 + i)
  const alive = ages.map((_, i) => healthAt[i].length / opt.runs)
  const sortedDeath = [...deathAges].sort((a, b) => a - b)
  const hist = new Map<number, number>()
  for (const d of deathAges) {
    const b = Math.floor(d / 2) * 2
    hist.set(b, (hist.get(b) ?? 0) + 1)
  }

  return {
    startAge: a0,
    hr,
    ages,
    alive,
    health: band(healthAt),
    wellbeing: band(wbAt),
    wealth: band(wealthAt),
    deathAges,
    deathHist: [...hist.entries()].sort((a, b) => a[0] - b[0]).map(([age, count]) => ({ age, count })),
    samples,
    stats: {
      medianDeath: quantileSorted(sortedDeath, 0.5),
      meanDeath: deathAges.reduce((s, x) => s + x, 0) / deathAges.length,
      pIllness: illnessRuns / opt.runs,
      meanIllnesses: illnessTotal / opt.runs,
      pDivorce: divorceRuns / opt.runs,
      pWidowed: widowRuns / opt.runs,
      pUnemployed: unemployRuns / opt.runs,
    },
  }
}
