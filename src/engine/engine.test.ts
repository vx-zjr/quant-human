import { describe, expect, it } from 'vitest'
import { PERSONAS } from '../data/personas'
import { DIMENSIONS } from '../data/dimensions'
import { SOURCES } from '../data/sources'
import { FRAMEWORKS } from '../data/frameworks'
import { ACE_DATA, GENETIC_EVIDENCE, PREDICTION_STUDIES } from '../data/predictability'
import { BIG_FIVE_ITEMS } from '../data/instruments/bigfive'
import { atomCount, bmi, bmrMifflin, bodySnapshot, elementBreakdown } from './body'
import { livedQuantities } from './lived'
import {
  calibrate,
  combinedHR,
  IDEAL_INPUTS,
  lifeExpectancy,
  populationLogHR,
  summarize,
  TARGET_LE,
  type RiskInputs,
} from './mortality'
import { scoreBigFive, centeredValues } from './scoring'
import { simulateLives } from './simulate'
import { predictionHorizon, simulatePair, LYAPUNOV } from './chaos'
import { brier, calibrationBins, murphy } from './ledger'
import { normCdf, normInv, quantileSorted, sci } from './stats'

const NOW = new Date('2026-10-12T00:00:00Z')

describe('stats', () => {
  it('normal cdf / inverse', () => {
    expect(normCdf(0)).toBeCloseTo(0.5, 6)
    expect(normCdf(1.96)).toBeCloseTo(0.975, 3)
    expect(normInv(0.975)).toBeCloseTo(1.96, 2)
    expect(normInv(0.5)).toBeCloseTo(0, 6)
  })
  it('quantile & sci', () => {
    expect(quantileSorted([1, 2, 3, 4, 5], 0.5)).toBe(3)
    expect(sci(6.7e27)).toBe('6.7×10²⁷')
  })
})

describe('body', () => {
  it('70 kg 约 6.7×10²⁷ 个原子，氢原子数最多', () => {
    const n = atomCount(70)
    expect(n).toBeGreaterThan(6e27)
    expect(n).toBeLessThan(7.5e27)
    const rows = elementBreakdown(70)
    const h = rows.find((r) => r.sym === 'H')!
    expect(h.atomShare).toBeGreaterThan(0.55)
  })
  it('BMI 与 BMR', () => {
    expect(bmi(170, 65)).toBeCloseTo(22.49, 1)
    expect(bmrMifflin('male', 70, 175, 30)).toBeCloseTo(1648.75, 1)
  })
  it('snapshot 合理', () => {
    const s = bodySnapshot(PERSONAS[1], NOW)
    expect(s.age).toBeGreaterThan(44)
    expect(s.restingWatts).toBeGreaterThan(60)
    expect(s.restingWatts).toBeLessThan(110)
    expect(s.waterPct).toBeGreaterThan(45)
    expect(s.waterPct).toBeLessThan(70)
  })
})

describe('lived', () => {
  it('45 岁心跳约 15–20 亿次', () => {
    const q = livedQuantities(PERSONAS[1], NOW)
    const hb = q.find((x) => x.key === 'heartbeats')!.value
    expect(hb).toBeGreaterThan(1.5e9)
    expect(hb).toBeLessThan(2.2e9)
  })
})

describe('mortality', () => {
  it('校准后出生预期寿命匹配目标', () => {
    for (const sex of ['male', 'female'] as const) {
      expect(lifeExpectancy(calibrate(sex), 1, 0)).toBeCloseTo(TARGET_LE[sex], 1)
    }
  })
  it('风险比越高寿命越短；典型人≈1', () => {
    const p = calibrate('male')
    expect(lifeExpectancy(p, 2, 40)).toBeLessThan(lifeExpectancy(p, 1, 40))
    const typicalFemale: RiskInputs = {
      sex: 'female',
      smoking: 'never',
      exerciseMin: 60,
      bmi: 24.3,
      sleepHours: 7,
      drinksPerWeek: 1,
      support: 3.5,
      diet: 3,
      purpose: 4.5,
      cZ: 0,
    }
    expect(combinedHR(typicalFemale)).toBeGreaterThan(0.95)
    expect(combinedHR(typicalFemale)).toBeLessThan(1.05)
    expect(combinedHR(IDEAL_INPUTS('male'))).toBeLessThan(0.6)
    expect(populationLogHR('male')).toBeGreaterThan(populationLogHR('female'))
  })
  it('条件分位数有序', () => {
    const s = summarize('female', 30, 1)
    expect(s.p10DeathAge).toBeLessThan(s.medianDeathAge)
    expect(s.medianDeathAge).toBeLessThan(s.p90DeathAge)
    expect(s.expectedDeathAge).toBeGreaterThan(80)
  })
})

describe('simulate', () => {
  it('同一种子可复现，且与生命表大致一致', () => {
    const p = PERSONAS[0]
    const a = simulateLives(p, { runs: 800, seed: 42 }, NOW)
    const b = simulateLives(p, { runs: 800, seed: 42 }, NOW)
    expect(a.stats.meanDeath).toBe(b.stats.meanDeath)
    const s = summarize(p.sex, a.startAge, a.hr)
    expect(Math.abs(a.stats.meanDeath - (s.expectedDeathAge + 0.5))).toBeLessThan(3)
    for (let i = 1; i < a.alive.length; i++) expect(a.alive[i]).toBeLessThanOrEqual(a.alive[i - 1])
    expect(a.samples.length).toBe(3)
  })
})

describe('chaos', () => {
  it('误差指数增长，地平线公式正确', () => {
    const run = simulatePair(1e-8, 20)
    expect(run.logDist[run.logDist.length - 1]).toBeGreaterThan(run.logDist[0] + 4)
    expect(predictionHorizon(1e-6, 1)).toBeCloseTo(Math.log(1e6) / LYAPUNOV, 6)
  })
})

describe('ledger', () => {
  const mk = (p: number, outcome: 'yes' | 'no') => ({ id: '', statement: '', p, category: '', createdAt: '', dueAt: '', outcome })
  it('Brier 分数', () => {
    expect(brier([mk(1, 'yes'), mk(0, 'no')])).toBe(0)
    expect(brier([mk(0.5, 'yes'), mk(0.5, 'no')])).toBe(0.25)
    expect(calibrationBins([mk(0.9, 'yes'), mk(0.9, 'no')])[0].freq).toBe(0.5)
    const m = murphy([mk(0.8, 'yes'), mk(0.2, 'no'), mk(0.7, 'yes')])!
    expect(m.uncertainty).toBeGreaterThan(0)
  })
})

describe('scoring', () => {
  it('大五计分含反向题', () => {
    const all3 = Object.fromEntries(BIG_FIVE_ITEMS.map((i) => [i.id, 3]))
    expect(scoreBigFive(all3)).toEqual({ O: 3, C: 3, E: 3, A: 3, N: 3 })
    const extrovert = Object.fromEntries(BIG_FIVE_ITEMS.map((i) => [i.id, i.trait === 'E' ? (i.reverse ? 1 : 5) : 3]))
    expect(scoreBigFive(extrovert)!.E).toBe(5)
    expect(scoreBigFive({})).toBeNull()
  })
  it('价值观中心化均值为 0', () => {
    const c = centeredValues(PERSONAS[0].values)
    expect(c.reduce((s, x) => s + x.centered, 0)).toBeCloseTo(0, 9)
  })
})

describe('data integrity', () => {
  it('所有引用的文献都存在', () => {
    const refs = [
      ...DIMENSIONS.flatMap((d) => d.sources ?? []),
      ...FRAMEWORKS.flatMap((f) => f.sources ?? []),
      ...GENETIC_EVIDENCE.flatMap((g) => g.sources),
      ...PREDICTION_STUDIES.flatMap((g) => g.sources),
      ...ACE_DATA.flatMap((a) => a.sources),
    ]
    const missing = refs.filter((r) => !SOURCES[r])
    expect(missing).toEqual([])
  })
  it('维度 id 唯一，数值在合法范围', () => {
    const ids = DIMENSIONS.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const d of DIMENSIONS) {
      if (d.heritability !== undefined) expect(d.heritability).toBeGreaterThanOrEqual(0)
      if (d.heritability !== undefined) expect(d.heritability).toBeLessThanOrEqual(1)
      if (d.stability !== undefined) expect(d.stability).toBeLessThanOrEqual(1)
    }
    expect(DIMENSIONS.length).toBeGreaterThan(100)
  })
  it('ACE 三项之和≈1，演示人物时间分配=24h', () => {
    for (const a of ACE_DATA) expect(a.A + a.C + a.E).toBeCloseTo(1, 2)
    for (const p of PERSONAS) {
      const sum = Object.values(p.timeUse).reduce((s, x) => s + x, 0)
      expect(sum).toBeCloseTo(24, 1)
    }
  })
})
