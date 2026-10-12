import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeStorage } from './storage'
import type { Forecast } from '../types'

interface LedgerState {
  items: Forecast[]
  add: (f: Omit<Forecast, 'id' | 'createdAt' | 'outcome'>) => void
  resolve: (id: string, outcome: Forecast['outcome']) => void
  remove: (id: string) => void
  loadExamples: () => void
  clear: () => void
}

const today = () => new Date().toISOString().slice(0, 10)
const uid = () => Math.random().toString(36).slice(2, 10)

/** 示例：一份“过度自信”的典型账本，用于演示校准图 */
const EXAMPLES: Omit<Forecast, 'id'>[] = [
  { statement: '本周至少去健身房 3 次', p: 0.9, category: '健康', createdAt: '2026-08-01', dueAt: '2026-08-07', outcome: 'no' },
  { statement: '本月每晚 23:30 前睡觉的天数 ≥ 20', p: 0.8, category: '睡眠', createdAt: '2026-08-01', dueAt: '2026-08-31', outcome: 'no' },
  { statement: '季度项目按期交付', p: 0.85, category: '工作', createdAt: '2026-07-01', dueAt: '2026-09-30', outcome: 'yes' },
  { statement: '读完这本书', p: 0.7, category: '学习', createdAt: '2026-08-05', dueAt: '2026-09-05', outcome: 'no' },
  { statement: '本周给父母打两次电话', p: 0.6, category: '关系', createdAt: '2026-08-10', dueAt: '2026-08-17', outcome: 'yes' },
  { statement: '体重一个月内下降 2 kg', p: 0.5, category: '健康', createdAt: '2026-08-01', dueAt: '2026-09-01', outcome: 'no' },
  { statement: '周末不加班', p: 0.65, category: '工作', createdAt: '2026-08-15', dueAt: '2026-08-17', outcome: 'yes' },
  { statement: '面试拿到 offer', p: 0.3, category: '工作', createdAt: '2026-08-20', dueAt: '2026-09-20', outcome: 'no' },
  { statement: '一个月内不喝含糖饮料', p: 0.75, category: '健康', createdAt: '2026-09-01', dueAt: '2026-09-30', outcome: 'no' },
  { statement: '完成半程马拉松', p: 0.95, category: '健康', createdAt: '2026-09-01', dueAt: '2026-10-08', outcome: 'yes' },
  { statement: '本月存下收入的 20%', p: 0.55, category: '财务', createdAt: '2026-09-01', dueAt: '2026-09-30', outcome: 'yes' },
  { statement: '和老朋友见面吃饭', p: 0.8, category: '关系', createdAt: '2026-09-05', dueAt: '2026-09-30', outcome: 'yes' },
  { statement: '每天冥想 10 分钟坚持 2 周', p: 0.7, category: '心理', createdAt: '2026-09-10', dueAt: '2026-09-24', outcome: 'no' },
  { statement: '下周情绪整体不错（≥7/10）', p: 0.6, category: '心理', createdAt: '2026-10-01', dueAt: '2026-10-08', outcome: 'yes' },
  { statement: '年底前学会基础游泳', p: 0.4, category: '学习', createdAt: '2026-10-01', dueAt: '2026-12-31', outcome: 'pending' },
]

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set) => ({
      items: [],
      add: (f) => set((s) => ({ items: [{ ...f, id: uid(), createdAt: today(), outcome: 'pending' }, ...s.items] })),
      resolve: (id, outcome) => set((s) => ({ items: s.items.map((x) => (x.id === id ? { ...x, outcome } : x)) })),
      remove: (id) => set((s) => ({ items: s.items.filter((x) => x.id !== id) })),
      loadExamples: () => set((s) => ({ items: [...EXAMPLES.map((e) => ({ ...e, id: uid() })), ...s.items] })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'qh-ledger',
      version: 1,
      storage: safeStorage,
    },
  ),
)
