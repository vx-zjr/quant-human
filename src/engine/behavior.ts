import type { BehaviorContext, BehaviorDef, BehaviorObs, BigFive, BigFiveKey, ContextKey } from '../types'
import { CONTEXT_KEYS, CONTEXT_META } from '../data/behaviors'
import { BIG_FIVE_META } from '../data/instruments/bigfive'
import { traitZ } from './scoring'
import { invertSPD, quadForm, solveSPD, dot, type Mat, type Vec } from './linalg'
import { clamp } from './stats'

/**
 * 具体行为预测：个人贝叶斯逻辑回归。
 *
 *   logit P(做 | 情境 x) = w₀ + Σₖ wₖ·xₖ
 *
 * 先验（在没有任何个人记录时就是全部的预测）：
 *   w₀ ~ N( logit(人群基础率) + 人格调整, 1.5² )
 *   wₖ ~ N( 文献/示意先验均值, sdₖ² )
 * 似然：你自己的逐日记录（做了/没做 + 当时的情境）。
 * 后验：MAP（牛顿法）+ 拉普拉斯近似；预测时用 probit 近似把参数不确定性积分进概率。
 *
 * 设计含义：记录越多，个人证据越压过人群与人格先验——这与“过去行为是未来行为最好的预测因子”一致。
 * 先验的宽度参考了逻辑回归弱信息先验的思路（Gelman et al. 2008）。
 */

/** 特质–行为相关来自聚合研究，用于单次行为时减半（Epstein 1979 的聚合原理） */
export const SINGLE_ACT_SHRINK = 0.5
/** 截距先验标准差：人群先验只是起点，个人基础率可以与人群相差很大（±2 SD ≈ 几率比 20 倍） */
export const INTERCEPT_SD = 1.5

export const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))
export const logit = (p: number) => Math.log(p / (1 - p))

/** 情境 → 特征向量 [1, ...CONTEXT_KEYS]；意图 0..10 线性映射到 −1..1 */
export function features(ctx: BehaviorContext): Vec {
  return [1, ...CONTEXT_KEYS.map((k) => (k === 'intention' ? (clamp(ctx.intention, 0, 10) - 5) / 5 : ctx[k]))]
}

export const FEATURE_LABELS = ['基线', ...CONTEXT_KEYS.map((k) => CONTEXT_META[k].label)]

export const neutralContext = (): BehaviorContext => ({
  weekend: 0,
  shortSleep: 0,
  highStress: 0,
  withOthers: 0,
  intention: 5,
  plan: 0,
  yesterday: 0,
  freshStart: 0,
})

/* ------------------------------ 先验 ------------------------------ */

export interface TraitPart {
  trait: BigFiveKey
  r: number
  z: number
  /** 对 log-odds 的贡献 */
  shift: number
}

/** 点二列 r 换算为每 1 SD 的逻辑回归斜率：β ≈ r / √(p(1−p))（小效应近似），并截断在 ±1 */
export function traitShift(def: BehaviorDef, bigFive: BigFive): { total: number; parts: TraitPart[] } {
  const p0 = clamp(def.baseRate, 0.02, 0.98)
  const parts: TraitPart[] = Object.entries(def.traits ?? {}).map(([k, r]) => {
    const key = k as BigFiveKey
    const beta = clamp(((r ?? 0) * SINGLE_ACT_SHRINK) / Math.sqrt(p0 * (1 - p0)), -1, 1)
    const z = clamp(traitZ(key, bigFive[key]), -3, 3)
    return { trait: key, r: r ?? 0, z, shift: beta * z }
  })
  return { total: parts.reduce((s, x) => s + x.shift, 0), parts }
}

export interface PriorSpec {
  mean: Vec
  sd: Vec
  baseLogit: number
  trait: { total: number; parts: TraitPart[] }
}

/** 想避免的行为：意图/计划指“想避免/有避免计划”，先验方向翻转（除非行为显式给出） */
export function contextPriorMean(def: BehaviorDef, k: ContextKey): number {
  const explicit = def.priors?.[k]
  if (explicit !== undefined) return explicit
  const m = CONTEXT_META[k].mean
  return def.avoid && (k === 'intention' || k === 'plan') ? -m : m
}

export function buildPrior(def: BehaviorDef, bigFive: BigFive): PriorSpec {
  const baseLogit = logit(clamp(def.baseRate, 0.02, 0.98))
  const trait = traitShift(def, bigFive)
  return {
    baseLogit,
    trait,
    mean: [baseLogit + trait.total, ...CONTEXT_KEYS.map((k) => contextPriorMean(def, k))],
    sd: [INTERCEPT_SD, ...CONTEXT_KEYS.map((k) => CONTEXT_META[k].sd)],
  }
}

/* ------------------------------ 后验 ------------------------------ */

export interface Posterior {
  mean: Vec
  cov: Mat
  n: number
  prior: PriorSpec
}

/** MAP（牛顿法）+ 拉普拉斯近似。warm 为可选的初始值（用于序贯拟合加速） */
export function fitPosterior(def: BehaviorDef, bigFive: BigFive, obs: BehaviorObs[], warm?: Vec): Posterior {
  const prior = buildPrior(def, bigFive)
  const d = prior.mean.length
  const X = obs.map((o) => features(o.ctx))
  const y = obs.map((o) => o.did)
  let w = warm ? [...warm] : [...prior.mean]
  let negH: Mat = []
  for (let iter = 0; iter < 40; iter++) {
    const grad = new Array(d).fill(0)
    negH = Array.from({ length: d }, (_, i) => Array.from({ length: d }, (_, j) => (i === j ? 1 / prior.sd[i] ** 2 : 0)))
    for (let i = 0; i < d; i++) grad[i] = -(w[i] - prior.mean[i]) / prior.sd[i] ** 2
    for (let t = 0; t < X.length; t++) {
      const x = X[t]
      const p = sigmoid(dot(w, x))
      const r = y[t] - p
      const s = p * (1 - p)
      for (let i = 0; i < d; i++) {
        if (x[i] === 0) continue
        grad[i] += r * x[i]
        for (let j = 0; j < d; j++) if (x[j] !== 0) negH[i][j] += s * x[i] * x[j]
      }
    }
    const step = solveSPD(negH, grad)
    let maxStep = 0
    for (let i = 0; i < d; i++) {
      w[i] += step[i]
      maxStep = Math.max(maxStep, Math.abs(step[i]))
    }
    if (maxStep < 1e-7) break
  }
  return { mean: w, cov: invertSPD(negH), n: obs.length, prior }
}

export interface Prediction {
  /** 后验预测概率（已积分参数不确定性） */
  p: number
  /** log-odds 的均值与标准差 */
  mu: number
  sd: number
  /** 80% 可信区间 */
  lo: number
  hi: number
}

export function predict(post: Posterior, ctx: BehaviorContext): Prediction {
  const x = features(ctx)
  const mu = dot(post.mean, x)
  const v = Math.max(0, quadForm(post.cov, x))
  const sd = Math.sqrt(v)
  return { p: sigmoid(mu / Math.sqrt(1 + (Math.PI * v) / 8)), mu, sd, lo: sigmoid(mu - 1.2816 * sd), hi: sigmoid(mu + 1.2816 * sd) }
}

/* ------------------------------ 解释 ------------------------------ */

export interface Contribution {
  key: string
  label: string
  /** 对 log-odds 的贡献 */
  value: number
  kind: 'base' | 'trait' | 'personal' | 'context'
}

/** 把一次预测拆成可加的 log-odds 贡献：人群基础率 → 人格 → 个人历史 → 各情境因素 */
export function decompose(post: Posterior, ctx: BehaviorContext): Contribution[] {
  const x = features(ctx)
  const out: Contribution[] = [
    { key: 'base', label: '人群基础率', value: post.prior.baseLogit, kind: 'base' },
    ...post.prior.trait.parts.map((t) => ({ key: `trait-${t.trait}`, label: `人格：${BIG_FIVE_META[t.trait].name}`, value: t.shift, kind: 'trait' as const })),
    { key: 'personal', label: `你的个人记录（${post.n} 条）`, value: post.mean[0] - post.prior.mean[0], kind: 'personal' },
  ]
  CONTEXT_KEYS.forEach((k, i) => {
    const v = post.mean[i + 1] * x[i + 1]
    if (x[i + 1] !== 0) out.push({ key: k, label: CONTEXT_META[k].label, value: v, kind: 'context' })
  })
  return out
}

export interface Lever {
  key: ContextKey
  label: string
  from: number
  to: number
  /** 概率变化（−1..1） */
  delta: number
}

/** 可改变的情境杠杆：把每个可控因素调到“更有利”的一侧，看概率如何变化 */
export function levers(post: Posterior, ctx: BehaviorContext, def: BehaviorDef): Lever[] {
  const base = predict(post, ctx).p
  const variants: { key: ContextKey; label: string; next: BehaviorContext }[] = [
    { key: 'plan', label: def.avoid ? '制定具体的避免计划' : '制定“如果…就…”计划', next: { ...ctx, plan: ctx.plan ? 0 : 1 } },
    { key: 'intention', label: def.avoid ? '更坚定地想避免（意图 9/10）' : '更坚定的意图（9/10）', next: { ...ctx, intention: 9 } },
    { key: 'shortSleep', label: ctx.shortSleep ? '前一晚睡够' : '前一晚缺觉', next: { ...ctx, shortSleep: ctx.shortSleep ? 0 : 1 } },
    { key: 'highStress', label: ctx.highStress ? '降低压力' : '压力变大', next: { ...ctx, highStress: ctx.highStress ? 0 : 1 } },
    { key: 'withOthers', label: ctx.withOthers ? '独自一人时' : '和别人一起时', next: { ...ctx, withOthers: ctx.withOthers ? 0 : 1 } },
  ]
  return variants
    .filter((v) => !(v.key === 'intention' && ctx.intention >= 9))
    .map((v) => ({ key: v.key, label: v.label, from: base, to: predict(post, v.next).p, delta: predict(post, v.next).p - base }))
}

/* ------------------------------ 评估 ------------------------------ */

export interface PrequentialRow {
  t: number
  date: string
  did: 0 | 1
  /** 完整模型（只用此前的数据拟合） */
  model: number
  /** 只用人群+人格先验，不学习 */
  prior: number
  /** 只用个人基础率（拉普拉斯平滑），不看情境 */
  rate: number
  /** 80% 区间宽度 */
  width: number
  selfP?: number
}

/**
 * 序贯（prequential）评估：每一天只用“当天之前”的记录来预测当天——这是对“预测你”最诚实的检验，
 * 杜绝用答案训练再考试的作弊（Dawid 1984）。
 */
export function prequential(def: BehaviorDef, bigFive: BigFive, obs: BehaviorObs[]): PrequentialRow[] {
  const sorted = [...obs].sort((a, b) => a.date.localeCompare(b.date))
  const prior = fitPosterior(def, bigFive, [])
  const rows: PrequentialRow[] = []
  let warm: Vec | undefined
  let k = 0
  for (let t = 0; t < sorted.length; t++) {
    const post = t === 0 ? prior : fitPosterior(def, bigFive, sorted.slice(0, t), warm)
    warm = post.mean
    const pr = predict(post, sorted[t].ctx)
    rows.push({
      t,
      date: sorted[t].date,
      did: sorted[t].did,
      model: pr.p,
      prior: predict(prior, sorted[t].ctx).p,
      rate: (1 + k) / (2 + t),
      width: pr.hi - pr.lo,
      selfP: sorted[t].selfP,
    })
    k += sorted[t].did
  }
  return rows
}

export const brierOf = (pairs: { p: number; y: number }[]) => (pairs.length ? pairs.reduce((s, x) => s + (x.p - x.y) ** 2, 0) / pairs.length : NaN)

export function prequentialScores(rows: PrequentialRow[]) {
  const pick = (f: (r: PrequentialRow) => number | undefined) =>
    brierOf(rows.filter((r) => f(r) !== undefined).map((r) => ({ p: f(r)!, y: r.did })))
  const model = pick((r) => r.model)
  const prior = pick((r) => r.prior)
  const rate = pick((r) => r.rate)
  const self = rows.some((r) => r.selfP !== undefined) ? pick((r) => r.selfP) : NaN
  const accuracy = rows.length ? rows.filter((r) => (r.model >= 0.5 ? 1 : 0) === r.did).length / rows.length : NaN
  /** 技能分：相对“个人基础率”基线的 Brier 改进比例 */
  const skill = rate > 0 ? 1 - model / rate : NaN
  return { model, prior, rate, self, accuracy, skill }
}

/** 某个系数的先验与后验对比（用于“它从你身上学到了什么”） */
export function coefficientShift(post: Posterior) {
  return FEATURE_LABELS.map((label, i) => ({
    label,
    priorMean: post.prior.mean[i],
    priorSd: post.prior.sd[i],
    postMean: post.mean[i],
    postSd: Math.sqrt(Math.max(0, post.cov[i][i])),
  }))
}
