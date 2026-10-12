import { useEffect, useRef } from 'react'
import * as echarts from 'echarts/core'
import { BarChart, LineChart, PieChart, RadarChart, ScatterChart, SunburstChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  SunburstChart,
  HeatmapChart,
  GridComponent,
  LegendComponent,
  MarkAreaComponent,
  MarkLineComponent,
  MarkPointComponent,
  PolarComponent,
  RadarComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
])

// ECharts 的 option 类型极其庞大，这里有意放宽为 Record，避免类型体操影响迭代速度。
export type ChartOption = Record<string, any>

interface Props {
  option: ChartOption
  height?: number
  /** 无障碍描述（图表的文字摘要） */
  label: string
  onClick?: (params: { name: string; data: unknown; seriesName?: string; dataIndex: number }) => void
  className?: string
}

export function EChart({ option, height = 320, label, onClick, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const inst = useRef<echarts.ECharts | null>(null)
  const clickRef = useRef(onClick)
  clickRef.current = onClick

  useEffect(() => {
    if (!ref.current) return
    const chart = echarts.init(ref.current, undefined, { renderer: 'canvas' })
    inst.current = chart
    chart.on('click', (p) => clickRef.current?.(p as never))
    const ro = new ResizeObserver(() => chart.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chart.dispose()
      inst.current = null
    }
  }, [])

  useEffect(() => {
    inst.current?.setOption(option, { notMerge: true, lazyUpdate: true })
  }, [option])

  return <div ref={ref} style={{ height, width: '100%' }} className={className} role="img" aria-label={label} />
}
