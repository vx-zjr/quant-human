import { useMemo } from 'react'
import { BEHAVIORS } from '../data/behaviors'
import { DEMO_TRACKED, simulateBehaviorLog } from '../engine/behaviorSim'
import { useBehaviorStore } from '../store/behaviorStore'
import type { BehaviorDef, BehaviorObs, Profile } from '../types'

export interface BehaviorData {
  /** 行为库 + 自定义行为 */
  defs: BehaviorDef[]
  defMap: Record<string, BehaviorDef>
  tracked: string[]
  log: BehaviorObs[]
  /** 演示人物：日志为模拟生成、只读 */
  simulated: boolean
}

/** 当前画像的行为数据：“我” → 本地存储；演示人物 → 按画像模拟的日志 */
export function useBehaviorData(p: Profile): BehaviorData {
  const custom = useBehaviorStore((s) => s.custom)
  const myTracked = useBehaviorStore((s) => s.tracked)
  const myLog = useBehaviorStore((s) => s.log)

  const defs = useMemo(() => [...BEHAVIORS, ...custom], [custom])
  const defMap = useMemo(() => Object.fromEntries(defs.map((d) => [d.id, d])), [defs])

  const simulatedLog = useMemo(() => {
    if (!p.isDemo) return []
    const ids = DEMO_TRACKED[p.id] ?? []
    return ids.flatMap((id) => {
      const def = BEHAVIORS.find((b) => b.id === id)
      return def ? simulateBehaviorLog(p, def) : []
    })
  }, [p])

  // 返回值需保持引用稳定，否则下游的序贯评估（较重）会在每次渲染时重算
  return useMemo(
    () =>
      p.isDemo
        ? { defs, defMap, tracked: DEMO_TRACKED[p.id] ?? [], log: simulatedLog, simulated: true }
        : { defs, defMap, tracked: myTracked.filter((id) => defMap[id]), log: myLog, simulated: false },
    [p.isDemo, p.id, defs, defMap, simulatedLog, myTracked, myLog],
  )
}
