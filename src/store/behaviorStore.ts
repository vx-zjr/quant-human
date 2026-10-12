import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeStorage } from './storage'
import type { BehaviorDef, BehaviorObs } from '../types'

/**
 * “我的画像”的行为日志与自定义行为（仅本地）。演示人物的日志由 engine/behaviorSim 模拟生成，不存这里。
 */
interface BehaviorState {
  tracked: string[]
  custom: BehaviorDef[]
  log: BehaviorObs[]
  toggleTracked: (id: string) => void
  addCustom: (def: BehaviorDef) => void
  removeCustom: (id: string) => void
  /** 同一行为同一天只保留一条（再次记录即覆盖） */
  record: (obs: BehaviorObs) => void
  removeObs: (id: string) => void
  clearLog: () => void
}

export const DEFAULT_TRACKED = ['exercise', 'early-bed', 'short-video', 'procrastinate', 'late-snack', 'good-mood']

export const useBehaviorStore = create<BehaviorState>()(
  persist(
    (set) => ({
      tracked: DEFAULT_TRACKED,
      custom: [],
      log: [],
      toggleTracked: (id) => set((s) => ({ tracked: s.tracked.includes(id) ? s.tracked.filter((x) => x !== id) : [...s.tracked, id] })),
      addCustom: (def) => set((s) => ({ custom: [...s.custom, def], tracked: [...s.tracked, def.id] })),
      removeCustom: (id) =>
        set((s) => ({
          custom: s.custom.filter((c) => c.id !== id),
          tracked: s.tracked.filter((x) => x !== id),
          log: s.log.filter((o) => o.behaviorId !== id),
        })),
      record: (obs) =>
        set((s) => ({ log: [...s.log.filter((o) => !(o.behaviorId === obs.behaviorId && o.date === obs.date)), obs] })),
      removeObs: (id) => set((s) => ({ log: s.log.filter((o) => o.id !== id) })),
      clearLog: () => set({ log: [] }),
    }),
    { name: 'qh-behavior', version: 1, storage: safeStorage },
  ),
)
