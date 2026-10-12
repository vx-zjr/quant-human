import { useMemo } from 'react'
import { prequential, prequentialScores, type PrequentialRow } from '../../engine/behavior'
import { useChartTheme } from '../../theme'
import type { BehaviorDef, BehaviorObs, BigFive } from '../../types'
import { EChart } from '../EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../chartStyle'
import { ChartCard, Cite, DataTable } from '../ui'

/** 所有被追踪行为的序贯预测汇总：模型是否“说 70% 的事约 70% 发生”？ */
export function CalibrationPanel({ defs, bigFive, log }: { defs: BehaviorDef[]; bigFive: BigFive; log: BehaviorObs[] }) {
  const t = useChartTheme()
  const per = useMemo(
    () =>
      defs
        .map((def) => {
          const obs = log.filter((o) => o.behaviorId === def.id)
          const rows = prequential(def, bigFive, obs)
          return { def, rows, scores: prequentialScores(rows), rate: obs.length ? obs.reduce((s, o) => s + o.did, 0) / obs.length : NaN }
        })
        .filter((x) => x.rows.length >= 3),
    [defs, bigFive, log],
  )
  const pooled = useMemo(() => per.flatMap((x) => x.rows), [per])
  const option = useMemo(() => calibrationOption(t, pooled), [t, pooled])
  const hasSelf = pooled.some((r) => r.selfP !== undefined)

  if (!per.length) return <p className="text-sm text-muted">还没有足够的记录（每个行为至少 3 条）。</p>

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <ChartCard
        title="校准曲线（全部行为汇总）"
        subtitle={`${pooled.length} 次序贯预测。点在对角线上 = 校准良好；对角线下方 = 过度自信`}
        table={{ columns: ['概率区间', '平均预测', '实际频率', '样本数'], rows: bins(pooled, (r) => r.model).map((b) => [b.range, pct(b.meanP), pct(b.freq), b.n]) }}
        footer={<Cite ids={['brier1950', 'dawid1984']} />}
      >
        <EChart option={option} height={300} label="行为预测校准曲线" />
      </ChartCard>
      <ChartCard title="逐项成绩单" subtitle="技能分 = 相对“只看个人基础率”的 Brier 改进；为负说明情境信息暂时还在添乱（数据太少或情境无关）">
        <DataTable
          columns={['行为', '记录', '实际频率', '模型 Brier', '基础率 Brier', '技能分', ...(hasSelf ? ['直觉 Brier'] : [])]}
          rows={per.map((x) => [
            x.def.name,
            x.rows.length,
            pct(x.rate),
            x.scores.model.toFixed(3),
            x.scores.rate.toFixed(3),
            `${x.scores.skill >= 0 ? '+' : ''}${(x.scores.skill * 100).toFixed(0)}%`,
            ...(hasSelf ? [Number.isFinite(x.scores.self) ? x.scores.self.toFixed(3) : '—'] : []),
          ])}
        />
      </ChartCard>
    </div>
  )
}

const pct = (p: number) => (Number.isFinite(p) ? `${Math.round(p * 100)}%` : '—')

function bins(rows: PrequentialRow[], f: (r: PrequentialRow) => number | undefined, n = 5) {
  const out: { range: string; meanP: number; freq: number; n: number }[] = []
  for (let i = 0; i < n; i++) {
    const lo = i / n
    const hi = (i + 1) / n
    const inBin = rows.filter((r) => {
      const p = f(r)
      return p !== undefined && p >= lo && (i === n - 1 ? p <= hi : p < hi)
    })
    if (!inBin.length) continue
    out.push({
      range: `${lo * 100}–${hi * 100}%`,
      n: inBin.length,
      meanP: inBin.reduce((s, r) => s + f(r)!, 0) / inBin.length,
      freq: inBin.reduce((s, r) => s + r.did, 0) / inBin.length,
    })
  }
  return out
}

function calibrationOption(t: ReturnType<typeof useChartTheme>, rows: PrequentialRow[]) {
  const hasSelf = rows.some((r) => r.selfP !== undefined)
  const line = (name: string, f: (r: PrequentialRow) => number | undefined, color: string) => ({
    name,
    type: 'line',
    symbol: 'circle',
    data: bins(rows, f).map((b) => [b.meanP, b.freq, b.n]),
    symbolSize: (v: number[]) => 6 + Math.sqrt(v[2]) * 1.5,
    lineStyle: { color, width: 2 },
    itemStyle: { color, borderColor: t.surface, borderWidth: 2 },
  })
  return {
    ...baseText(t),
    tooltip: {
      ...tooltipStyle(t),
      formatter: (x: { seriesName: string; value: number[] }) =>
        x.value.length === 3 ? `${x.seriesName}<br/>预测 ${pct(x.value[0])} → 实际 ${pct(x.value[1])}<br/>样本 ${x.value[2]}` : '',
    },
    legend: { ...legendStyle(t), top: 0, right: 0 },
    grid: { left: 8, right: 16, top: 34, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '预测概率', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
    yAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '实际频率', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
    series: [
      { name: '完美校准', type: 'line', data: [[0, 0], [1, 1]], showSymbol: false, silent: true, lineStyle: { color: t.muted, width: 1.5 }, itemStyle: { color: t.muted } },
      line('模型', (r) => r.model, t.series[0]),
      ...(hasSelf ? [line('你的直觉', (r) => r.selfP, t.series[1])] : []),
    ],
  }
}
