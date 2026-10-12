/**
 * 核心类型定义。
 * 新增数据时，请先在这里确认 schema；所有数据文件都受这些类型约束（tsc 会替你把关）。
 */

/** 八层模型：从物质到意义 */
export type LayerId = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6' | 'L7'

export interface Layer {
  id: LayerId
  name: string
  en: string
  /** 一句话：这一层在问什么 */
  question: string
  /** 典型时间尺度 */
  timescale: string
  /** 主要学科 */
  disciplines: string[]
  /** 这一层整体可量化程度 0..1（主观综合评估，见 Insights 页） */
  quantifiability: number
  /** 这一层整体可预测程度 0..1 */
  predictability: number
  summary: string
  /** 标志性数字（展示用） */
  headline: { value: string; label: string; source?: SourceId }[]
}

/** 来源编号，见 src/data/sources.ts */
export type SourceId = string

/** 可量化程度：1=只能定性描述 … 5=可用物理仪器精确测量 */
export type Measurability = 1 | 2 | 3 | 4 | 5

export interface Dimension {
  id: string
  name: string
  en: string
  layer: LayerId
  /** 层内的子领域，用于图谱第二环 */
  domain: string
  unit?: string
  desc: string
  /** 测量方法 */
  measure: string[]
  /** 典型值/常模（文字描述，避免伪精确） */
  norm?: string
  measurability: Measurability
  /** 遗传度（双生子/家系研究，0..1），未知则不填 */
  heritability?: number
  /** 跨年稳定性（重测相关或等价指标，0..1），未知则不填 */
  stability?: number
  /** 它能（统计上）预测什么 */
  predicts?: string[]
  sources?: SourceId[]
}

export interface Source {
  id: SourceId
  /** 作者 年份 */
  short: string
  title: string
  venue?: string
  year: number
  url?: string
}

/** 理论框架 */
export interface Framework {
  id: string
  name: string
  en: string
  author: string
  year: number
  layers: LayerId[]
  core: string
  /** 组成部分（用于可视化） */
  components: { name: string; desc: string }[]
  /** 展示形态 */
  shape: 'wheel' | 'pyramid' | 'timeline' | 'matrix' | 'nested'
  /** 证据强度 1..5 */
  evidence: 1 | 2 | 3 | 4 | 5
  critique: string
  /** 在本项目中如何使用 */
  usage: string
  sources?: SourceId[]
}

/** 可预测性证据：遗传上限 vs. 已达到的预测力 */
export interface GeneticEvidence {
  id: string
  trait: string
  /** 双生子遗传度（理论上限的一种近似） */
  twinH2: number
  /** SNP 遗传度 */
  snpH2?: number
  /** 当前多基因评分可解释方差（R²） */
  pgsR2: number
  note: string
  sources: SourceId[]
}

/** 真实世界预测研究 */
export interface PredictionStudy {
  id: string
  target: string
  predictor: string
  metric: string
  /** 数值（含义见 metric） */
  value: number
  /** 将不同指标粗略映射到 0..1 的“可预测程度”，仅用于排序与可视化 */
  normalized: number
  takeaway: string
  sources: SourceId[]
}

/* ----------------------------- 个人画像 ----------------------------- */

export type Sex = 'male' | 'female'
export type Smoking = 'never' | 'former' | 'current'

export interface BigFive {
  O: number
  C: number
  E: number
  A: number
  N: number
}
export type BigFiveKey = keyof BigFive

export interface LifeEvent {
  id: string
  age: number
  label: string
  /** 生活变化单位（Life Change Units，参考 Holmes–Rahe 量表） */
  lcu: number
  /** 主观效价 -2..+2 */
  valence: number
}

export interface TimeUse {
  sleep: number
  work: number
  commute: number
  chores: number
  social: number
  leisure: number
  exercise: number
  screen: number
}

export interface Profile {
  id: string
  name: string
  avatar: string
  isDemo?: boolean
  tagline?: string
  birthYear: number
  sex: Sex
  heightCm: number
  weightKg: number
  restingHR: number
  sleepHours: number
  /** 每周中等强度运动分钟数（高强度×2 折算） */
  exerciseMin: number
  smoking: Smoking
  /** 每周标准杯数（1 杯≈10 g 酒精） */
  drinksPerWeek: number
  /** 饮食质量 1..5 */
  diet: number
  bigFive: BigFive
  /** 问卷原始作答（itemId -> 1..5） */
  bigFiveAnswers?: Record<string, number>
  /** 施瓦茨十种价值观 0..10 */
  values: Record<SchwartzKey, number>
  /** 亲密关系人数（可在深夜求助的人） */
  closeTies: number
  /** 社会支持感 1..5 */
  support: number
  /** 孤独感 1..5（5=非常孤独） */
  loneliness: number
  /** 受教育年限 */
  eduYears: number
  /** 收入在本地人群中的百分位 */
  incomePct: number
  /** 坎特里尔阶梯 0..10 */
  lifeSat: number
  /** 人生目的感 1..7 */
  purpose: number
  /** PERMA 0..10 */
  perma: { P: number; E: number; R: number; M: number; A: number }
  /** 近一个月感知压力 0..10 */
  stress: number
  timeUse: TimeUse
  events: LifeEvent[]
}

export type SchwartzKey =
  | 'selfDirection'
  | 'stimulation'
  | 'hedonism'
  | 'achievement'
  | 'power'
  | 'security'
  | 'conformity'
  | 'tradition'
  | 'benevolence'
  | 'universalism'

/* ----------------------------- 预测账本 ----------------------------- */

export interface Forecast {
  id: string
  statement: string
  /** 0..1 */
  p: number
  category: string
  createdAt: string
  dueAt: string
  outcome: 'pending' | 'yes' | 'no'
}
