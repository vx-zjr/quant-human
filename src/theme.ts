import { useEffect, useState } from 'react'
import { create } from 'zustand'
import type { LayerId } from './types'

/**
 * 主题：'system' 跟随系统；'light' / 'dark' 由用户覆盖（写入 <html data-theme>）。
 * 图表颜色在运行时从 CSS 变量读取，保证与 index.css 中的令牌一致。
 */
export type ThemeMode = 'system' | 'light' | 'dark'

function applyMode(mode: ThemeMode) {
  const root = document.documentElement
  if (mode === 'system') delete root.dataset.theme
  else root.dataset.theme = mode
  try {
    if (mode === 'system') localStorage.removeItem('qh-theme')
    else localStorage.setItem('qh-theme', mode)
  } catch {
    /* 隐私模式下可能不可用 */
  }
}

function initialMode(): ThemeMode {
  try {
    const t = localStorage.getItem('qh-theme')
    if (t === 'light' || t === 'dark') return t
  } catch {
    /* ignore */
  }
  return 'system'
}

export const useThemeStore = create<{ mode: ThemeMode; setMode: (m: ThemeMode) => void }>((set) => ({
  mode: initialMode(),
  setMode: (mode) => {
    applyMode(mode)
    set({ mode })
  },
}))

export interface ChartTheme {
  isDark: boolean
  ink: string
  ink2: string
  muted: string
  grid: string
  axis: string
  surface: string
  surface2: string
  accent: string
  neutralMid: string
  layer: Record<LayerId, string>
  /** 8 色分类序列（固定顺序） */
  series: string[]
  good: string
  warning: string
  serious: string
  critical: string
}

function readTheme(): ChartTheme {
  const cs = getComputedStyle(document.documentElement)
  const v = (n: string) => cs.getPropertyValue(n).trim()
  const layer = {
    L0: v('--l0'),
    L1: v('--l1'),
    L2: v('--l2'),
    L3: v('--l3'),
    L4: v('--l4'),
    L5: v('--l5'),
    L6: v('--l6'),
    L7: v('--l7'),
  }
  return {
    isDark: cs.colorScheme.includes('dark') || v('--page').toLowerCase() === '#0d0d0d',
    ink: v('--ink'),
    ink2: v('--ink-2'),
    muted: v('--muted'),
    grid: v('--grid'),
    axis: v('--axis'),
    surface: v('--surface'),
    surface2: v('--surface-2'),
    accent: v('--accent'),
    neutralMid: v('--neutral-mid'),
    layer,
    series: Object.values(layer),
    good: v('--good'),
    warning: v('--warning'),
    serious: v('--serious'),
    critical: v('--critical'),
  }
}

/** 订阅主题变化（用户切换 + 系统切换），返回当前图表配色 */
export function useChartTheme(): ChartTheme {
  const mode = useThemeStore((s) => s.mode)
  const [sysTick, setSysTick] = useState(0)
  const [theme, setTheme] = useState<ChartTheme>(() => readTheme())

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const on = () => setSysTick((t) => t + 1)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    setTheme(readTheme())
  }, [mode, sysTick])

  return theme
}

/** 将 #rrggbb 转为带透明度的 rgba */
export function alpha(hex: string, a: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const n = parseInt(h, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
