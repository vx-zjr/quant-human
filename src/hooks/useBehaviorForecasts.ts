import { useMemo } from 'react'
import { fitPosterior, predict, type Posterior, type Prediction } from '../engine/behavior'
import type { BehaviorContext, BehaviorDef, BehaviorObs, Profile } from '../types'
import type { BehaviorData } from './useBehaviorData'

/** 页面共享的“当天情境”（与具体行为无关的部分） */
export type SharedContext = Pick<BehaviorContext, 'weekend' | 'shortSleep' | 'highStress' | 'withOthers' | 'freshStart'>
/** 每个行为自己的意图与计划 */
export type IntentMap = Record<string, { intention: number; plan: 0 | 1 }>

export interface Forecast {
  def: BehaviorDef
  post: Posterior
  ctx: BehaviorContext
  pred: Prediction
  /** 用于拟合的记录（严格早于预测日期） */
  history: BehaviorObs[]
  /** 预测日期当天已有的记录 */
  existing?: BehaviorObs
  /** 上一周期的记录（决定“惯性”特征） */
  previous?: BehaviorObs
}

export const STEP_DAYS: Record<BehaviorDef['window'], number> = { day: 1, week: 7, month: 30 }

const dayDiff = (a: string, b: string) => Math.round((Date.parse(a) - Date.parse(b)) / 864e5)

export function forecastFor(def: BehaviorDef, log: BehaviorObs[], profile: Profile, shared: SharedContext, intent: IntentMap, date: string): Forecast {
  const own = log.filter((o) => o.behaviorId === def.id)
  const history = own.filter((o) => o.date < date).sort((a, b) => a.date.localeCompare(b.date))
  const existing = own.find((o) => o.date === date)
  const last = history[history.length - 1]
  const previous = last && dayDiff(date, last.date) <= STEP_DAYS[def.window] ? last : undefined
  const ctx: BehaviorContext = {
    ...shared,
    intention: intent[def.id]?.intention ?? 5,
    plan: intent[def.id]?.plan ?? 0,
    yesterday: previous?.did ?? 0,
  }
  const post = fitPosterior(def, profile.bigFive, history)
  return { def, post, ctx, pred: predict(post, ctx), history, existing, previous }
}

export function useBehaviorForecasts(data: BehaviorData, profile: Profile, shared: SharedContext, intent: IntentMap, date: string): Forecast[] {
  return useMemo(
    () => data.tracked.map((id) => forecastFor(data.defMap[id], data.log, profile, shared, intent, date)),
    [data, profile, shared, intent, date],
  )
}
