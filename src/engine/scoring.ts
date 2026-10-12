import type { BigFive, BigFiveKey, LifeEvent, Profile, SchwartzKey } from '../types'
import { BIG_FIVE_ITEMS, BIG_FIVE_NORMS } from '../data/instruments/bigfive'
import { SCHWARTZ_META } from '../data/instruments/lifeEvents'
import { ageOf } from './body'
import { normCdf } from './stats'

export const BIG_FIVE_KEYS: BigFiveKey[] = ['O', 'C', 'E', 'A', 'N']

/** 按 IPIP 计分：反向题 6−x，各维度取均值（1..5）。未答题目跳过。 */
export function scoreBigFive(answers: Record<string, number>): BigFive | null {
  const sums: Record<BigFiveKey, number[]> = { O: [], C: [], E: [], A: [], N: [] }
  for (const item of BIG_FIVE_ITEMS) {
    const a = answers[item.id]
    if (a === undefined) continue
    sums[item.trait].push(item.reverse ? 6 - a : a)
  }
  if (BIG_FIVE_KEYS.some((k) => sums[k].length === 0)) return null
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
  return { O: avg(sums.O), C: avg(sums.C), E: avg(sums.E), A: avg(sums.A), N: avg(sums.N) }
}

export const traitZ = (k: BigFiveKey, score: number) => (score - BIG_FIVE_NORMS[k].mean) / BIG_FIVE_NORMS[k].sd
export const traitPercentile = (k: BigFiveKey, score: number) => normCdf(traitZ(k, score)) * 100

/** 施瓦茨价值观：个人均值中心化（MRAT），得到相对优先级 */
export function centeredValues(v: Record<SchwartzKey, number>): { key: SchwartzKey; name: string; raw: number; centered: number }[] {
  const keys = SCHWARTZ_META.map((m) => m.key)
  const avg = keys.reduce((s, k) => s + v[k], 0) / keys.length
  return SCHWARTZ_META.map((m) => ({ key: m.key, name: m.name, raw: v[m.key], centered: v[m.key] - avg }))
}

/** 施瓦茨两条高阶轴：开放-保守、自我超越-自我提升 */
export function valueAxes(v: Record<SchwartzKey, number>) {
  const openness = (v.selfDirection + v.stimulation) / 2 - (v.security + v.conformity + v.tradition) / 3
  const transcendence = (v.benevolence + v.universalism) / 2 - (v.achievement + v.power) / 2
  return { openness, transcendence }
}

/** 生活事件压力：按年龄汇总 LCU */
export function stressByAge(events: LifeEvent[], maxAge: number): { age: number; lcu: number; events: LifeEvent[] }[] {
  const rows: { age: number; lcu: number; events: LifeEvent[] }[] = []
  for (let a = 0; a <= Math.ceil(maxAge); a++) {
    const evs = events.filter((e) => Math.floor(e.age) === a)
    rows.push({ age: a, lcu: evs.reduce((s, e) => s + e.lcu, 0), events: evs })
  }
  return rows
}

/** Holmes–Rahe 分级（单年总分） */
export function stressLevel(lcu: number): { label: string; level: 'good' | 'warning' | 'serious' } {
  if (lcu >= 300) return { label: '高', level: 'serious' }
  if (lcu >= 150) return { label: '中', level: 'warning' }
  return { label: '低', level: 'good' }
}

/** 邓巴同心圆：把用户的亲密关系数放到 5/15/50/150 层级中 */
export const DUNBAR_LAYERS = [
  { size: 5, name: '支持圈', desc: '危机时可以求助的人' },
  { size: 15, name: '同情圈', desc: '他们离世你会极度悲痛' },
  { size: 50, name: '亲近朋友', desc: '会邀请来家里聚会' },
  { size: 150, name: '有意义的关系', desc: '在机场偶遇会坐下来聊天' },
]

/**
 * 八层“仪表盘”综合分（0..100）。
 * 这是一个透明的启发式汇总，用于可视化对比，不是经过验证的量表。每一项的计算都写在这里。
 */
export function layerScores(p: Profile, extras: { bmi: number; hr: number }) {
  const age = ageOf(p)
  const bmiScore = 100 - Math.min(60, Math.abs(extras.bmi - 22.5) * 8)
  const fitness = Math.min(100, (p.exerciseMin / 300) * 70 + (90 - p.restingHR) * 1.2)
  const sleep = 100 - Math.min(70, Math.abs(p.sleepHours - 7.5) * 25)
  const lifestyle = Math.max(0, 100 - (p.smoking === 'current' ? 35 : p.smoking === 'former' ? 10 : 0) - Math.max(0, p.drinksPerWeek - 7) * 2 - (5 - p.diet) * 8)
  // 情绪稳定（低神经质）权重 15，自律（尽责性）权重 10，均以近似常模 z 分数计
  const stability = 50 - traitZ('N', p.bigFive.N) * 15 + traitZ('C', p.bigFive.C) * 10
  const social = (p.support / 5) * 50 + Math.min(5, p.closeTies) * 6 + (5 - p.loneliness) * 5
  const meaning = (p.lifeSat / 10) * 40 + (p.purpose / 7) * 35 + (p.perma.M / 10) * 25
  // 寿命模型综合风险比：HR=1（人群典型）→ 70 分，HR 每翻倍约 −42 分
  const vitality = 70 - 60 * Math.log(extras.hr)
  return [
    { layer: 'L0', label: '能量平衡', score: clamp100(bmiScore) },
    { layer: 'L1', label: '分子风险（缺数据）', score: null as number | null },
    { layer: 'L2', label: '生理活力', score: clamp100((fitness + vitality) / 2) },
    { layer: 'L3', label: '睡眠与认知储备', score: clamp100(sleep * 0.7 + Math.min(100, p.eduYears * 5) * 0.3) },
    { layer: 'L4', label: '情绪稳定与自律', score: clamp100(stability) },
    { layer: 'L5', label: '健康行为', score: clamp100(lifestyle * 0.6 + fitness * 0.4) },
    { layer: 'L6', label: '社会联结', score: clamp100(social) },
    { layer: 'L7', label: '意义与满意', score: clamp100(meaning) },
  ].map((r) => ({ ...r, age }))
}

const clamp100 = (x: number) => Math.round(Math.max(0, Math.min(100, x)))
