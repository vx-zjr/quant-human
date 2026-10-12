import type { ChartTheme } from '../theme'

/** ECharts 共享样式助手：所有图表从这里取坐标轴、提示框、图例样式 */

export function tooltipStyle(t: ChartTheme) {
  return {
    backgroundColor: t.surface,
    borderColor: t.axis,
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: t.ink, fontSize: 12 },
    extraCssText: 'border-radius:8px;box-shadow:0 4px 18px rgba(0,0,0,.25);',
  }
}

export function axisStyle(t: ChartTheme) {
  return {
    axisLine: { lineStyle: { color: t.axis } },
    axisTick: { show: false },
    axisLabel: { color: t.muted, fontSize: 11 },
    splitLine: { lineStyle: { color: t.grid, type: 'solid' as const } },
    nameTextStyle: { color: t.muted, fontSize: 11 },
  }
}

export function legendStyle(t: ChartTheme) {
  return {
    textStyle: { color: t.ink2, fontSize: 12 },
    itemWidth: 12,
    itemHeight: 8,
    icon: 'roundRect',
    inactiveColor: t.axis,
  }
}

export const baseText = (t: ChartTheme) => ({
  textStyle: { fontFamily: 'system-ui, -apple-system, "PingFang SC", "Noto Sans CJK SC", sans-serif', color: t.ink2 },
  animationDuration: 500,
})
