import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { coefficientShift, prequential, prequentialScores, type PrequentialRow } from '../../engine/behavior'
import { sequencePredictability } from '../../engine/infotheory'
import type { Forecast } from '../../hooks/useBehaviorForecasts'
import { useChartTheme } from '../../theme'
import type { BehaviorObs, BigFive } from '../../types'
import { EChart } from '../EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../chartStyle'
import { Card, ChartCard, Cite, Meter } from '../ui'

/** 模型从这个人的记录中学到了什么、学得怎么样 */
export function LearningPanel({
  f,
  bigFive,
  allObs,
  onRemove,
}: {
  f: Forecast
  bigFive: BigFive
  allObs: BehaviorObs[]
  onRemove?: (id: string) => void
}) {
  const t = useChartTheme()
  const obs = useMemo(() => allObs.filter((o) => o.behaviorId === f.def.id).sort((a, b) => a.date.localeCompare(b.date)), [allObs, f.def.id])
  const rows = useMemo(() => prequential(f.def, bigFive, obs), [f.def, bigFive, obs])
  const scores = useMemo(() => prequentialScores(rows), [rows])
  const pred = useMemo(() => sequencePredictability(obs.map((o) => o.did)), [obs])
  const coefs = useMemo(() => coefficientShift(f.post), [f.post])
  const hasSelf = rows.some((r) => r.selfP !== undefined)

  const curveOpt = useMemo(() => learningOption(t, rows, hasSelf), [t, rows, hasSelf])

  if (obs.length < 3)
    return (
      <Card title="学习曲线">
        <p className="text-sm text-muted">至少需要 3 条记录才能评估模型学得怎么样。每天在上方卡片上点“做了/没做”，模型会逐日变得更了解你。</p>
      </Card>
    )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard
          title="预测误差随记录增加的变化"
          subtitle="序贯评估：每一天只用“那天之前”的记录来预测那天，再与实际对照。线越低越准（累计平均 Brier 分数）"
          table={{
            columns: ['日期', '实际', '模型', '个人基础率', '人群+人格先验', ...(hasSelf ? ['你的直觉'] : [])],
            rows: rows.map((r) => [r.date, r.did ? '做了' : '没做', pct(r.model), pct(r.rate), pct(r.prior), ...(hasSelf ? [r.selfP !== undefined ? pct(r.selfP) : '—'] : [])]),
          }}
          footer={<Cite ids={['dawid1984', 'brier1950']} />}
        >
          <EChart option={curveOpt} height={280} label="不同预测方法的累计误差曲线" />
        </ChartCard>
        <Card title="谁最了解你？" subtitle={`基于 ${rows.length} 次序贯预测的 Brier 分数（0 完美 · 0.25 = 抛硬币）`}>
          <ScoreRow label="完整模型（个人记录 + 情境）" v={scores.model} best={bestOf(scores, hasSelf) === 'model'} />
          <ScoreRow label="只看你的个人基础率" v={scores.rate} best={bestOf(scores, hasSelf) === 'rate'} />
          <ScoreRow label="只看人群 + 人格（不学习）" v={scores.prior} best={bestOf(scores, hasSelf) === 'prior'} />
          {hasSelf && <ScoreRow label="你自己的直觉" v={scores.self} best={bestOf(scores, hasSelf) === 'self'} />}
          <p className="mt-3 text-xs text-ink-2 leading-relaxed">
            相对“个人基础率”，情境信息让误差改变了 <b className="text-ink tnum">{(scores.skill * 100).toFixed(0)}%</b>
            {scores.skill > 0.05 ? '——情境确实带来了额外信息。' : '——对这件事而言，“你平时怎样”几乎就是全部可用的信息。'}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card title="它从你身上学到了什么" subtitle="每个因素：灰 = 先验（文献/示意），蓝 = 看过你的记录后的后验；横线为 ±1 SD。偏离 0 越远、越窄，说明证据越强">
          <ForestPlot rows={coefs} />
        </Card>
        <Card title="这件事理论上最多能被预测到多准" subtitle={`基于 ${pred.n} 次结果序列的熵 + Fano 不等式`}>
          <div className="space-y-3">
            <PiRow label="随机猜" v={0.5} />
            <PiRow label="只知道你做这件事的比例" v={pred.piBaseRate} />
            <PiRow label="再加上“昨天→今天”的规律（上限）" v={pred.piMarkov} />
            <PiRow label="再加上任意长程模式（LZ 估计，上限）" v={pred.piLZ} muted={!pred.reliable} />
            <PiRow label="模型实际的命中率（以 50% 为阈值）" v={scores.accuracy} accent />
          </div>
          <p className="mt-3 text-[11px] text-muted leading-relaxed">
            方法沿用人类移动可预测性研究：先估计序列熵，再求任何算法都无法超越的准确率上限
            <Cite ids={['song2010', 'fano1961', 'kontoyiannis1998']} />。只基于结果序列本身；情境信息可以突破这个上限。
            {!pred.reliable && ' 记录少于 50 条时 LZ 估计偏差较大，仅供参考。'}
          </p>
        </Card>
      </div>

      <Card title={`记录（${obs.length}）`} subtitle="模型列是那一天之前学到的预测（序贯），不是事后拟合">
        <div className="max-h-72 overflow-auto rounded-lg border border-line">
          <table className="w-full text-xs tnum">
            <thead className="sticky top-0 bg-surface-2 text-ink-2">
              <tr>
                {['日期', '实际', '模型预测', '惯性', '缺觉', '压力', '有人', '意图', '计划', ''].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-left font-medium whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...obs].reverse().map((o) => {
                const r = rows.find((x) => x.date === o.date)
                return (
                  <tr key={o.id} className="border-t border-line text-ink-2">
                    <td className="px-2 py-1">{o.date}</td>
                    <td className="px-2 py-1 text-ink">{o.did ? '✓ 做了' : '✗ 没做'}</td>
                    <td className="px-2 py-1">{r ? pct(r.model) : '—'}</td>
                    <td className="px-2 py-1">{o.ctx.yesterday ? '●' : ''}</td>
                    <td className="px-2 py-1">{o.ctx.shortSleep ? '●' : ''}</td>
                    <td className="px-2 py-1">{o.ctx.highStress ? '●' : ''}</td>
                    <td className="px-2 py-1">{o.ctx.withOthers ? '●' : ''}</td>
                    <td className="px-2 py-1">{o.ctx.intention}</td>
                    <td className="px-2 py-1">{o.ctx.plan ? '●' : ''}</td>
                    <td className="px-2 py-1 text-right">
                      {onRemove && (
                        <button onClick={() => onRemove(o.id)} aria-label={`删除 ${o.date} 的记录`} className="rounded p-0.5 text-muted hover:text-ink">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

const pct = (p: number) => `${Math.round(p * 100)}%`

function bestOf(s: ReturnType<typeof prequentialScores>, hasSelf: boolean) {
  const c: [string, number][] = [
    ['model', s.model],
    ['rate', s.rate],
    ['prior', s.prior],
  ]
  if (hasSelf) c.push(['self', s.self])
  return c.sort((a, b) => a[1] - b[1])[0][0]
}

function ScoreRow({ label, v, best }: { label: string; v: number; best: boolean }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="flex-1 text-sm text-ink-2">
        {label}
        {best && <span className="ml-1.5 rounded bg-accent-soft px-1.5 py-0.5 text-[10px] text-ink">最准</span>}
      </span>
      <span className="w-14 text-right text-sm font-medium text-ink tnum">{Number.isFinite(v) ? v.toFixed(3) : '—'}</span>
    </div>
  )
}

function PiRow({ label, v, accent, muted }: { label: string; v: number; accent?: boolean; muted?: boolean }) {
  return (
    <div className={muted ? 'opacity-60' : ''}>
      <div className="mb-1 text-xs text-ink-2">{label}</div>
      <Meter value={v} color={accent ? 'var(--l1)' : 'var(--accent)'} label={Number.isFinite(v) ? `${Math.round(v * 100)}%` : '—'} />
    </div>
  )
}

/** 森林图：先验 vs 后验（纯 SVG，跟随主题） */
function ForestPlot({ rows }: { rows: ReturnType<typeof coefficientShift> }) {
  const lim = 3
  const W = 260
  const x = (v: number) => ((Math.max(-lim, Math.min(lim, v)) + lim) / (2 * lim)) * W
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-[110px_1fr_56px] items-center gap-2 text-[10px] text-muted">
        <span />
        <div className="flex justify-between">
          <span>−3 降低</span>
          <span>0</span>
          <span>+3 提高</span>
        </div>
        <span className="text-right">后验</span>
      </div>
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[110px_1fr_56px] items-center gap-2">
          <span className="truncate text-xs text-ink-2" title={r.label}>
            {r.label}
          </span>
          <svg viewBox={`0 0 ${W} 18`} className="h-[18px] w-full" preserveAspectRatio="none" role="img" aria-label={`${r.label}：先验 ${r.priorMean.toFixed(2)}，后验 ${r.postMean.toFixed(2)}`}>
            <line x1={x(0)} x2={x(0)} y1={0} y2={18} stroke="var(--axis)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <line x1={x(r.priorMean - r.priorSd)} x2={x(r.priorMean + r.priorSd)} y1={5} y2={5} stroke="var(--muted)" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <line x1={x(r.postMean - r.postSd)} x2={x(r.postMean + r.postSd)} y1={13} y2={13} stroke="var(--accent)" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            <circle cx={x(r.postMean)} cy={13} r={3.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.5} />
          </svg>
          <span className="text-right text-[11px] text-ink tnum">
            {r.postMean >= 0 ? '+' : ''}
            {r.postMean.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  )
}

function learningOption(t: ReturnType<typeof useChartTheme>, rows: PrequentialRow[], hasSelf: boolean) {
  const cum = (f: (r: PrequentialRow) => number | undefined) => {
    let s = 0
    let n = 0
    return rows.map((r, i) => {
      const p = f(r)
      if (p !== undefined) {
        s += (p - r.did) ** 2
        n++
      }
      return [i + 1, n ? Number((s / n).toFixed(4)) : null]
    })
  }
  const series = [
    { name: '完整模型', data: cum((r) => r.model), color: t.series[0], width: 2.5 },
    { name: '个人基础率', data: cum((r) => r.rate), color: t.series[2], width: 1.5 },
    { name: '人群+人格先验', data: cum((r) => r.prior), color: t.muted, width: 1.5 },
    ...(hasSelf ? [{ name: '你的直觉', data: cum((r) => r.selfP), color: t.series[1], width: 1.5 }] : []),
  ]
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', valueFormatter: (v: number) => (v === null ? '—' : v.toFixed(3)) },
    legend: { ...legendStyle(t), top: 0, left: 0 },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 1, max: rows.length, ...axisStyle(t), name: '第几条记录' },
    yAxis: { type: 'value', min: 0, ...axisStyle(t), name: 'Brier' },
    series: series.map((s) => ({ name: s.name, type: 'line', data: s.data, showSymbol: false, lineStyle: { color: s.color, width: s.width }, itemStyle: { color: s.color } })),
  }
}
