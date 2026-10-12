import type { BehaviorContext, BehaviorDef, BehaviorObs, Profile } from '../types'
import { CONTEXT_KEYS } from '../data/behaviors'
import { contextPriorMean, features, logit, sigmoid, traitShift } from './behavior'
import { clamp, mulberry32, randn } from './stats'
import { dot } from './linalg'

/**
 * 为虚构演示人物生成“行为日志”，让行为预测页在没有真实数据时也能演示学习过程。
 *
 * 每个演示人物 × 行为都有一套“真实但未知”的参数：
 *   - 个人基础率：尽量从画像推出（如每周运动分钟 → 运动概率），否则取人群基础率 + 真实人格效应
 *   - 情境效应：先验均值 × U(0.5, 1.5) + N(0, 0.35²) —— 与模型先验相近但不相同，模型需要从数据中学习差异
 * 日志由这套真实参数抽样生成，模型只能看到日志，看不到真实参数。
 * 所有页面都会标注“模拟日志”。
 */

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 从画像推断某些行为的“真实”个人基础率；返回 null 表示用人群基础率 + 人格 */
function personalRate(p: Profile, id: string): number | null {
  const tu = p.timeUse
  switch (id) {
    case 'exercise':
      // 每次约 40 分钟
      return clamp(p.exerciseMin / 7 / 40, 0.04, 0.85)
    case 'steps':
      return clamp(0.15 + p.exerciseMin / 400, 0.1, 0.9)
    case 'early-bed':
      return clamp((p.sleepHours - 5.6) / 2.4, 0.05, 0.9)
    case 'short-video':
      return clamp(tu.screen / 4, 0.05, 0.9)
    case 'phone-bed':
      return clamp(0.4 + tu.screen / 8, 0.3, 0.95)
    case 'alcohol':
      // 每次饮酒约 3 杯 → 每周饮酒天数 ≈ 杯数 / 3
      return clamp(p.drinksPerWeek / 3 / 7, 0.02, 0.8)
    case 'overtime':
      return clamp((tu.work - 7.5) / 3, 0.05, 0.85)
    case 'meet-friend':
      return clamp(p.closeTies / 9 + (p.bigFive.E - 3) * 0.15, 0.1, 0.9)
    case 'call-family':
      return clamp(0.3 + p.support * 0.1, 0.2, 0.9)
    case 'good-mood':
      return clamp(p.lifeSat / 10 - (p.stress - 5) * 0.03, 0.1, 0.9)
    case 'read':
      return clamp(tu.leisure / 10 + (p.bigFive.O - 3) * 0.1, 0.05, 0.8)
    case 'meditate':
      return clamp(0.02 + (p.purpose - 4) * 0.05 + (p.stress < 4 ? 0.1 : 0), 0.02, 0.5)
    case 'help':
      return clamp(0.25 + (p.bigFive.A - 3.5) * 0.25 + p.timeUse.social / 20, 0.05, 0.85)
    default:
      return null
  }
}

function sampleContext(p: Profile, date: Date, def: BehaviorDef, prev: 0 | 1, rng: () => number): BehaviorContext {
  const dow = date.getDay()
  const weekend = def.window === 'day' ? ((dow === 0 || dow === 6 ? 1 : 0) as 0 | 1) : ((rng() < 0.3 ? 1 : 0) as 0 | 1)
  const pShort = clamp((7.2 - p.sleepHours) / 2.5 + 0.1, 0.05, 0.85)
  const pStress = clamp(p.stress / 10 - 0.15, 0.05, 0.8)
  const pOthers = clamp(0.2 + (p.bigFive.E - 3) * 0.12 + (weekend ? 0.25 : 0), 0.05, 0.85)
  return {
    weekend,
    shortSleep: (rng() < pShort ? 1 : 0) as 0 | 1,
    highStress: (rng() < pStress ? 1 : 0) as 0 | 1,
    withOthers: (rng() < pOthers ? 1 : 0) as 0 | 1,
    intention: Math.round(clamp(5 + randn(rng) * 2, 0, 10)),
    plan: (rng() < 0.15 ? 1 : 0) as 0 | 1,
    yesterday: prev,
    freshStart: ((def.window === 'day' && (dow === 1 || date.getDate() === 1)) || (def.window !== 'day' && rng() < 0.2) ? 1 : 0) as 0 | 1,
  }
}

export const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function simulateBehaviorLog(p: Profile, def: BehaviorDef, end = new Date()): BehaviorObs[] {
  const seed = hash(`${p.id}:${def.id}`)
  const rngParams = mulberry32(seed)
  // 真实参数（模型看不到）
  const rate = personalRate(p, def.id)
  const target = rate ?? sigmoid(logit(clamp(def.baseRate, 0.02, 0.98)) + traitShift(def, p.bigFive).total * 1.5 + randn(rngParams) * 0.4)
  const effects = CONTEXT_KEYS.map((k) => contextPriorMean(def, k) * (0.5 + rngParams()) + randn(rngParams) * 0.35)

  const steps = def.window === 'day' ? 90 : def.window === 'week' ? 30 : 12
  const stepDays = def.window === 'day' ? 1 : def.window === 'week' ? 7 : 30

  const generate = (intercept: number, n: number, rngSeed: number): BehaviorObs[] => {
    const rng = mulberry32(rngSeed)
    const truth = [intercept, ...effects]
    const out: BehaviorObs[] = []
    let prev: 0 | 1 = rng() < target ? 1 : 0
    for (let i = n; i >= 1; i--) {
      const date = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i * stepDays)
      const ctx = sampleContext(p, date, def, prev, rng)
      const z = dot(truth, features(ctx))
      const did = (rng() < sigmoid(z) ? 1 : 0) as 0 | 1
      // 模拟“本人直觉”：大致了解自己，但对想做的事偏乐观、对想避免的事偏低估（规划谬误）
      const bias = def.avoid ? -0.5 : 0.6
      const selfP = clamp(sigmoid(z + bias + randn(rng) * 0.9), 0.05, 0.95)
      out.push({ id: `${def.id}-${i}`, behaviorId: def.id, date: isoDate(date), did, ctx, selfP: Math.round(selfP * 20) / 20 })
      prev = did
    }
    return out
  }

  // 校准截距：情境效应与习惯惯性会抬高/压低实际频率，用长序列迭代使总体频率≈目标值
  let intercept = logit(clamp(target, 0.03, 0.97))
  for (let k = 0; k < 4; k++) {
    const long = generate(intercept, 600, seed ^ 0x9e3779b9)
    const m = clamp(long.reduce((s, o) => s + o.did, 0) / long.length, 0.01, 0.99)
    intercept += logit(clamp(target, 0.03, 0.97)) - logit(m)
  }
  return generate(intercept, steps, seed)
}

/** 演示人物默认追踪的行为 */
export const DEMO_TRACKED: Record<string, string[]> = {
  'demo-linxi': ['exercise', 'early-bed', 'short-video', 'late-snack', 'procrastinate', 'deep-work', 'meet-friend', 'good-mood'],
  'demo-chenmo': ['exercise', 'alcohol', 'overtime', 'call-family', 'temper', 'early-bed', 'read', 'takeout'],
  'demo-suhe': ['exercise', 'steps', 'meditate', 'call-family', 'help', 'read', 'good-mood', 'early-bed'],
  'demo-azhe': ['exercise', 'alcohol', 'procrastinate', 'short-video', 'accept-invite', 'impulse-buy', 'meet-friend', 'late-snack'],
}

