import { useMemo, useState } from 'react'
import { aggregatedValidity } from '../../engine/infotheory'
import { useChartTheme } from '../../theme'
import { EChart } from '../EChart'
import { axisStyle, baseText, tooltipStyle } from '../chartStyle'
import { Callout, Card, ChartCard, Cite, Slider } from '../ui'

/** Epstein 聚合原理：为什么“预测这一次”难，“预测一般情况”易 */
export function AggregationLab() {
  const t = useChartTheme()
  const [r1, setR1] = useState(0.2)
  const [rho, setRho] = useState(0.15)
  const ks = Array.from({ length: 60 }, (_, i) => i + 1)
  const limit = Math.min(1, r1 / Math.sqrt(rho))
  const option = useMemo(
    () => ({
      ...baseText(t),
      tooltip: { ...tooltipStyle(t), trigger: 'axis', formatter: (it: { value: number[] }[]) => `平均 ${it[0].value[0]} 次行为<br/>r = ${it[0].value[1].toFixed(2)}（解释 ${Math.round(it[0].value[1] ** 2 * 100)}% 的差异）` },
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      xAxis: { type: 'value', min: 1, max: 60, ...axisStyle(t), name: '聚合的行为次数 k' },
      yAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '预测相关 r' },
      series: [
        {
          type: 'line',
          data: ks.map((k) => [k, aggregatedValidity(r1, rho, k)]),
          showSymbol: false,
          lineStyle: { color: t.series[0], width: 2.5 },
          itemStyle: { color: t.series[0] },
          areaStyle: { color: t.series[0], opacity: 0.08 },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: t.axis, type: 'solid' },
            label: { color: t.muted, formatter: `极限 r = ${limit.toFixed(2)}`, position: 'insideEndTop' },
            data: [{ yAxis: limit }],
          },
        },
      ],
    }),
    [t, r1, rho, limit, ks],
  )
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card title="聚合实验室" subtitle="r_k = r₁·√(k / (1 + (k−1)ρ))">
        <div className="grid gap-4">
          <Slider label="人格与“单次行为”的相关 r₁" value={r1} min={0.05} max={0.4} step={0.01} onChange={setR1} format={(v) => v.toFixed(2)} />
          <Slider label="不同场合之间行为的一致性 ρ" value={rho} min={0.05} max={0.6} step={0.01} onChange={setRho} format={(v) => v.toFixed(2)} hint="ρ 越低，单次行为越受情境与偶然左右" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          {[1, 10, 50].map((k) => (
            <div key={k} className="rounded-lg bg-surface-2 p-2">
              <div className="text-[11px] text-muted">平均 {k} 次</div>
              <div className="text-lg font-semibold text-ink tnum">{aggregatedValidity(r1, rho, k).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Callout tone="insight">
            人格很难预测你“这一次”会不会发火（r≈0.2，只解释 4%），却能较好地预测你“一个月里”发火的频率。行为在个体内部的波动，常常和人与人之间的差异一样大 <Cite ids={['fleeson2001', 'epstein1979']} />。
          </Callout>
        </div>
      </Card>
      <ChartCard title="预测“一般”比预测“这一次”容易得多" subtitle="同一个人格分数，对平均多次行为的预测力随 k 上升，直到被一致性 ρ 所限">
        <EChart option={option} height={320} label="聚合次数与预测相关的关系曲线" />
      </ChartCard>
    </div>
  )
}
