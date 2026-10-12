import { describe, expect, it } from 'vitest'
import { BEHAVIORS, CONTEXT_KEYS } from '../data/behaviors'
import { SOURCES } from '../data/sources'
import { PERSONAS } from '../data/personas'
import type { BehaviorDef, BehaviorObs } from '../types'
import { invertSPD, solveSPD } from './linalg'
import {
  buildPrior,
  contextPriorMean,
  decompose,
  features,
  fitPosterior,
  levers,
  logit,
  neutralContext,
  predict,
  prequential,
  prequentialScores,
  sigmoid,
} from './behavior'
import { aggregatedValidity, binaryEntropy, conditionalEntropy1, fanoMaxPredictability, lzEntropyRate, sequencePredictability } from './infotheory'
import { DEMO_TRACKED, simulateBehaviorLog } from './behaviorSim'
import { mulberry32 } from './stats'

const NOW = new Date('2026-10-12T12:00:00')
const avgFive = { O: 3.6, C: 3.4, E: 3.1, A: 3.8, N: 2.8 }
const byId = (id: string) => BEHAVIORS.find((b) => b.id === id)!

describe('linalg', () => {
  it('解对称正定方程组并求逆', () => {
    const A = [
      [4, 1, 0],
      [1, 3, 1],
      [0, 1, 2],
    ]
    const x = solveSPD(A, [1, 2, 3])
    const back = A.map((r) => r.reduce((s, v, j) => s + v * x[j], 0))
    back.forEach((v, i) => expect(v).toBeCloseTo([1, 2, 3][i], 10))
    const inv = invertSPD(A)
    expect(A[0].reduce((s, v, j) => s + v * inv[j][0], 0)).toBeCloseTo(1, 10)
  })
})

describe('behavior model', () => {
  it('无数据时预测 = 先验（常模人格 → 人群基础率）', () => {
    const def = byId('exercise')
    const post = fitPosterior(def, avgFive, [])
    const pr = predict(post, neutralContext())
    // 先验均值对应 30%，参数不确定性会把概率略微拉向 50%
    expect(pr.p).toBeGreaterThan(0.3)
    expect(pr.p).toBeLessThan(0.4)
    expect(pr.lo).toBeLessThan(pr.p)
    expect(pr.hi).toBeGreaterThan(pr.p)
  })

  it('尽责性越高，拖延先验越低；想避免的行为翻转意图方向', () => {
    const def = byId('procrastinate')
    const hi = buildPrior(def, { ...avgFive, C: 4.5 }).mean[0]
    const lo = buildPrior(def, { ...avgFive, C: 2.3 }).mean[0]
    expect(hi).toBeLessThan(lo)
    expect(contextPriorMean(def, 'intention')).toBeLessThan(0)
    expect(contextPriorMean(byId('exercise'), 'intention')).toBeGreaterThan(0)
  })

  it('能从足够多的数据中恢复真实参数', () => {
    const def: BehaviorDef = { id: 'x', name: 'x', category: 'health', window: 'day', question: '', baseRate: 0.5, baseRateNote: '', habitual: false }
    const iSleep = 1 + CONTEXT_KEYS.indexOf('shortSleep')
    const iYest = 1 + CONTEXT_KEYS.indexOf('yesterday')
    const truth = new Array(1 + CONTEXT_KEYS.length).fill(0)
    truth[0] = -1
    truth[iSleep] = 1.5
    truth[iYest] = 1.2
    const rng = mulberry32(7)
    const obs: BehaviorObs[] = []
    for (let i = 0; i < 3000; i++) {
      const ctx = { ...neutralContext(), shortSleep: (rng() < 0.4 ? 1 : 0) as 0 | 1, yesterday: (rng() < 0.5 ? 1 : 0) as 0 | 1 }
      const p = sigmoid(features(ctx).reduce((s, x, j) => s + x * truth[j], 0))
      obs.push({ id: String(i), behaviorId: 'x', date: '2026-01-01', did: rng() < p ? 1 : 0, ctx })
    }
    const post = fitPosterior(def, avgFive, obs)
    expect(post.mean[0]).toBeCloseTo(-1, 0)
    expect(post.mean[iSleep]).toBeCloseTo(1.5, 0)
    expect(post.mean[iYest]).toBeCloseTo(1.2, 0)
    // 数据越多，不确定性越小
    const small = fitPosterior(def, avgFive, obs.slice(0, 30))
    expect(Math.sqrt(post.cov[0][0])).toBeLessThan(Math.sqrt(small.cov[0][0]))
  })

  it('贡献分解之和 = 预测的 log-odds 均值', () => {
    const def = byId('late-snack')
    const obs = simulateBehaviorLog(PERSONAS[0], def, NOW)
    const post = fitPosterior(def, PERSONAS[0].bigFive, obs)
    const ctx = { ...neutralContext(), shortSleep: 1 as const, highStress: 1 as const, intention: 8 }
    const sum = decompose(post, ctx).reduce((s, c) => s + c.value, 0)
    expect(sum).toBeCloseTo(predict(post, ctx).mu, 8)
    expect(levers(post, ctx, def).length).toBeGreaterThan(2)
  })

  it('序贯评估：模型优于不学习的先验', () => {
    let model = 0
    let prior = 0
    for (const p of PERSONAS) {
      for (const id of DEMO_TRACKED[p.id]) {
        const def = byId(id)
        const rows = prequential(def, p.bigFive, simulateBehaviorLog(p, def, NOW))
        const s = prequentialScores(rows)
        model += s.model
        prior += s.prior
      }
    }
    expect(model).toBeLessThan(prior)
  })

  it('模拟日志可复现', () => {
    const a = simulateBehaviorLog(PERSONAS[1], byId('alcohol'), NOW)
    const b = simulateBehaviorLog(PERSONAS[1], byId('alcohol'), NOW)
    expect(a).toEqual(b)
    expect(a.length).toBe(90)
    expect(simulateBehaviorLog(PERSONAS[1], byId('call-family'), NOW).length).toBe(30)
  })
})

describe('information theory', () => {
  it('熵与 Fano 上限', () => {
    expect(binaryEntropy(0.5)).toBeCloseTo(1, 10)
    expect(fanoMaxPredictability(1)).toBeCloseTo(0.5, 6)
    expect(fanoMaxPredictability(0)).toBeCloseTo(1, 6)
    expect(fanoMaxPredictability(binaryEntropy(0.8))).toBeCloseTo(0.8, 6)
  })
  it('交替序列的条件熵≈0、LZ 熵率很低', () => {
    const alt = Array.from({ length: 120 }, (_, i) => i % 2)
    expect(conditionalEntropy1(alt)).toBeCloseTo(0, 6)
    expect(lzEntropyRate(alt)).toBeLessThan(0.4)
    const r = sequencePredictability(alt)
    expect(r.piMarkov).toBeGreaterThan(0.99)
    expect(r.piBaseRate).toBeCloseTo(0.5, 6)
  })
  it('Epstein 聚合', () => {
    expect(aggregatedValidity(0.2, 0.1, 1)).toBeCloseTo(0.2, 10)
    expect(aggregatedValidity(0.2, 0.1, 10000)).toBeCloseTo(0.2 / Math.sqrt(0.1), 2)
  })
})

describe('behavior data integrity', () => {
  it('id 唯一、概率合法、文献存在、情境键合法', () => {
    const ids = BEHAVIORS.map((b) => b.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const b of BEHAVIORS) {
      expect(b.baseRate).toBeGreaterThan(0)
      expect(b.baseRate).toBeLessThan(1)
      for (const s of b.sources ?? []) expect(SOURCES[s], s).toBeDefined()
      for (const k of Object.keys(b.priors ?? {})) expect(CONTEXT_KEYS).toContain(k)
      for (const r of Object.values(b.traits ?? {})) expect(Math.abs(r!)).toBeLessThanOrEqual(1)
    }
    for (const list of Object.values(DEMO_TRACKED)) for (const id of list) expect(ids).toContain(id)
    expect(logit(0.5)).toBe(0)
  })
})
