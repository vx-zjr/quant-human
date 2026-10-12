import type { Profile } from '../types'
import { ageOf, cellsReplacedPerDay } from './body'
import { interp } from './stats'

/**
 * 人生里程表：你已经“消耗/产生”了多少。
 * 生理速率随年龄变化，按分段近似积分；结果是数量级估计，不是精确记账。
 */

const SEC_PER_YEAR = 365.25 * 86400

export interface LivedQuantity {
  key: string
  label: string
  value: number
  unit: string
  /** 当前每秒增长量（用于实时跳动） */
  perSecond: number
  note: string
  compare?: string
  source?: string
}

/** 不同年龄的平均心率（次/分）。成人取静息心率 + 10 作为全天平均。 */
function heartRateAt(age: number, restingHR: number): number {
  return interp([0, 1, 5, 12, 18], [130, 110, 92, 82, restingHR + 10], age)
}
/** 平均呼吸频率（次/分） */
function breathRateAt(age: number): number {
  return interp([0, 1, 5, 12, 18], [40, 30, 22, 18, 14], age)
}
/** 平均睡眠时长（小时/天） */
function sleepAt(age: number, adultSleep: number): number {
  return interp([0, 1, 3, 6, 13, 18], [14.5, 13, 11.5, 10, 9, adultSleep], age)
}
/** 平均体重相对参考人的比例（儿童期较轻） */
function massFactorAt(age: number, weightKg: number): number {
  return interp([0, 5, 10, 15, 20], [3.5, 18, 32, 52, weightKg], age) / 70
}

/** 对 f(age) 在 [0, age] 上做年度数值积分，返回 ∑ f(a)·Δa（a 以年计） */
function integrateYears(age: number, f: (a: number) => number, step = 0.25): number {
  let s = 0
  for (let a = 0; a < age; a += step) {
    const dt = Math.min(step, age - a)
    s += f(a + dt / 2) * dt
  }
  return s
}

export function livedQuantities(p: Profile, now = new Date()): LivedQuantity[] {
  const age = ageOf(p, now)
  const minPerYear = SEC_PER_YEAR / 60
  const daysPerYear = 365.25

  const heartbeats = integrateYears(age, (a) => heartRateAt(a, p.restingHR) * minPerYear)
  const breaths = integrateYears(age, (a) => breathRateAt(a) * minPerYear)
  const sleepHours = integrateYears(age, (a) => sleepAt(a, p.sleepHours) * daysPerYear)
  const awakeHours = age * daysPerYear * 24 - sleepHours
  const words = integrateYears(age, (a) => (a < 2 ? 0 : a < 5 ? 8000 : 16000) * daysPerYear)
  const steps = integrateYears(age, (a) => (a < 1 ? 0 : a < 70 ? 6000 : 4000) * daysPerYear)
  const cellsReplaced = integrateYears(age, (a) => cellsReplacedPerDay(70 * massFactorAt(a, p.weightKg)) * daysPerYear)
  const blood = heartbeats * 0.065 * massFactorAt(age, p.weightKg) // 每搏量约 65–70 ml（成人）
  const blinks = awakeHours * 60 * 15
  const consciousBits = awakeHours * 3600 * 10
  const earthOrbitKm = age * 9.4e8
  const galacticKm = age * SEC_PER_YEAR * 230

  const hr = heartRateAt(age, p.restingHR)
  const awakeFrac = 1 - p.sleepHours / 24

  return [
    {
      key: 'seconds',
      label: '已活秒数',
      value: age * SEC_PER_YEAR,
      unit: '秒',
      perSecond: 1,
      note: `约 ${(age * daysPerYear).toFixed(0)} 天`,
    },
    {
      key: 'heartbeats',
      label: '心跳',
      value: heartbeats,
      unit: '次',
      perSecond: hr / 60,
      note: '婴幼儿心率更快，已按年龄分段积分',
      compare: '一生约 25–30 亿次',
    },
    {
      key: 'breaths',
      label: '呼吸',
      value: breaths,
      unit: '次',
      perSecond: breathRateAt(age) / 60,
      note: '静息约 12–20 次/分',
    },
    {
      key: 'blood',
      label: '心脏泵出的血液',
      value: blood,
      unit: '升',
      perSecond: (hr / 60) * 0.065,
      note: '每搏约 65 ml',
      compare: `≈ ${(blood / 2.5e6).toFixed(1)} 个标准游泳池`,
    },
    {
      key: 'sleep',
      label: '睡眠',
      value: sleepHours,
      unit: '小时',
      perSecond: 0,
      note: `占已活时间的 ${((sleepHours / (age * daysPerYear * 24)) * 100).toFixed(0)}%`,
      compare: `≈ ${(sleepHours / 24 / daysPerYear).toFixed(1)} 年`,
    },
    {
      key: 'words',
      label: '说出的词',
      value: words,
      unit: '个',
      perSecond: 16000 / 86400,
      note: '成人平均约 1.6 万词/天，男女无显著差异',
      source: 'mehl2007',
    },
    {
      key: 'steps',
      label: '走过的步数',
      value: steps,
      unit: '步',
      perSecond: 6000 / 86400,
      note: '按 6000 步/天估算',
      compare: `≈ 绕地球赤道 ${((steps * 0.7) / 1000 / 40075).toFixed(1)} 圈`,
    },
    {
      key: 'cells',
      label: '被替换的细胞',
      value: cellsReplaced,
      unit: '个',
      perSecond: cellsReplacedPerDay(p.weightKg) / 86400,
      note: '主要是血细胞与肠上皮；多数神经元终身不换',
      compare: `≈ 你当前全部细胞数的 ${(cellsReplaced / (3e13 * (p.weightKg / 70))).toFixed(0)} 倍`,
      source: 'sender2021',
    },
    {
      key: 'blinks',
      label: '眨眼',
      value: blinks,
      unit: '次',
      perSecond: (15 / 60) * awakeFrac,
      note: '清醒时约 15 次/分',
    },
    {
      key: 'bits',
      label: '有意识处理的信息',
      value: consciousBits,
      unit: 'bit',
      perSecond: 10 * awakeFrac,
      note: '按 ~10 bit/s 的意识带宽估算',
      compare: `≈ ${(consciousBits / 8 / 1e9).toFixed(2)} GB`,
      source: 'zheng2025',
    },
    {
      key: 'orbit',
      label: '随地球绕太阳飞行',
      value: earthOrbitKm,
      unit: 'km',
      perSecond: 29.78,
      note: '约 29.8 km/s',
    },
    {
      key: 'galaxy',
      label: '随太阳绕银河系飞行',
      value: galacticKm,
      unit: 'km',
      perSecond: 230,
      note: '约 230 km/s，绕一圈需约 2.3 亿年',
    },
  ]
}
