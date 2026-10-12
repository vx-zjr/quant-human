import { useMemo, type ReactNode } from 'react'
import { CONTEXT_META } from '../../data/behaviors'
import { decompose, levers, sigmoid } from '../../engine/behavior'
import type { Forecast, IntentMap, SharedContext } from '../../hooks/useBehaviorForecasts'
import { useChartTheme } from '../../theme'
import { EChart } from '../EChart'
import { axisStyle, baseText, tooltipStyle } from '../chartStyle'
import { cx } from '../cx'
import { Card, ChartCard, Cite, Slider } from '../ui'
import { IntervalBar } from './ForecastBoard'

const SHARED_KEYS: (keyof SharedContext)[] = ['shortSleep', 'highStress', 'withOthers', 'weekend', 'freshStart']

/** 单个行为的预测详情：情境 → 概率 → 为什么 → 怎样改变 */
export function PredictorDetail({
  f,
  shared,
  setShared,
  intent,
  setIntent,
  selfGuess,
  setSelfGuess,
  readOnly,
}: {
  f: Forecast
  shared: SharedContext
  setShared: (s: SharedContext) => void
  intent: IntentMap
  setIntent: (m: IntentMap) => void
  selfGuess: number | undefined
  setSelfGuess: (v: number | undefined) => void
  readOnly: boolean
}) {
  const t = useChartTheme()
  const { def, post, ctx, pred } = f
  const parts = useMemo(() => decompose(post, ctx), [post, ctx])
  const lv = useMemo(() => levers(post, ctx, def).sort((a, b) => (def.avoid ? a.delta - b.delta : b.delta - a.delta)), [post, ctx, def])
  const cur = intent[def.id] ?? { intention: 5, plan: 0 as 0 | 1 }

  const option = useMemo(() => {
    const rows = [...parts].reverse()
    return {
      ...baseText(t),
      tooltip: {
        ...tooltipStyle(t),
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (items: { dataIndex: number }[]) => {
          const r = rows[items[0].dataIndex]
          const or = Math.exp(r.value)
          return r.kind === 'base'
            ? `<b>${r.label}</b><br/>起点概率 ${Math.round(sigmoid(r.value) * 100)}%`
            : `<b>${r.label}</b><br/>log-odds ${r.value >= 0 ? '+' : ''}${r.value.toFixed(2)}（几率 ×${or.toFixed(2)}）`
        },
      },
      grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', ...axisStyle(t), name: 'log-odds' },
      yAxis: { type: 'category', data: rows.map((r) => r.label), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2, fontSize: 11 } },
      series: [
        {
          type: 'bar',
          barWidth: 12,
          data: rows.map((r) => ({
            value: Number(r.value.toFixed(3)),
            itemStyle: {
              color: r.kind === 'base' ? t.muted : r.value >= 0 ? t.series[0] : t.series[7],
              borderRadius: r.value >= 0 ? [0, 4, 4, 0] : [4, 0, 0, 4],
            },
          })),
          label: {
            show: true,
            position: 'right',
            color: t.ink2,
            fontSize: 10,
            formatter: (p: { value: number }) => (Math.abs(p.value) < 0.02 ? '' : `${p.value > 0 ? '+' : ''}${p.value.toFixed(2)}`),
          },
        },
      ],
    }
  }, [t, parts])

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
      <Card title={def.question} subtitle={def.avoid ? '这是一件通常想避免的事：意图与计划指“想避免/有避免计划”' : '设定此刻的情境，看预测如何变化'}>
        <div className="rounded-xl bg-surface-2 p-4">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold text-ink">{Math.round(pred.p * 100)}%</span>
            <span className="text-sm text-ink-2">≈ 10 个这样的{def.window === 'day' ? '日子' : def.window === 'week' ? '星期' : '月份'}里约 {Math.round(pred.p * 10)} 次会做</span>
          </div>
          <IntervalBar lo={pred.lo} hi={pred.hi} p={pred.p} />
          <div className="mt-1.5 flex justify-between text-[11px] text-muted tnum">
            <span>80% 可信区间 {Math.round(pred.lo * 100)}–{Math.round(pred.hi * 100)}%</span>
            <span>{f.history.length} 条记录</span>
          </div>
        </div>

        <div className="mt-4 text-xs font-medium text-muted">今天的情境（所有行为共享）</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {SHARED_KEYS.map((k) => (
            <Toggle key={k} on={shared[k] === 1} onClick={() => setShared({ ...shared, [k]: shared[k] ? 0 : 1 })}>
              {CONTEXT_META[k].label}
            </Toggle>
          ))}
          <Toggle on={ctx.yesterday === 1} disabled onClick={() => undefined}>
            {CONTEXT_META.yesterday.label}：{f.previous ? (f.previous.did ? '是' : '否') : '未记录'}
          </Toggle>
        </div>

        <div className="mt-4 text-xs font-medium text-muted">这件事本身</div>
        <div className="mt-2 grid gap-3">
          <Slider
            label={def.avoid ? '我有多想避免它' : '我有多想做它'}
            value={cur.intention}
            min={0}
            max={10}
            onChange={(v) => setIntent({ ...intent, [def.id]: { ...cur, intention: v } })}
            format={(v) => `${v}/10${v === 5 ? '（中性/未知）' : ''}`}
          />
          <div className="flex flex-wrap gap-1.5">
            <Toggle on={cur.plan === 1} onClick={() => setIntent({ ...intent, [def.id]: { ...cur, plan: cur.plan ? 0 : 1 } })}>
              {def.avoid ? '有具体的避免计划' : '有“如果…就…”计划（何时何地做）'}
            </Toggle>
          </div>
          {!readOnly && (
            <Slider
              label="记录前，先写下你自己的直觉"
              value={selfGuess === undefined ? 50 : Math.round(selfGuess * 100)}
              min={0}
              max={100}
              step={5}
              onChange={(v) => setSelfGuess(v / 100)}
              format={(v) => (selfGuess === undefined ? '未填写' : `${v}%`)}
              hint="结算后会比较“模型 vs 你的直觉”谁更了解你"
            />
          )}
        </div>
      </Card>

      <div className="space-y-4">
        <ChartCard
          title="这个概率是怎么来的"
          subtitle="从人群基础率出发，逐项加上人格、你的个人记录与当下情境（log-odds 可加）"
          table={{
            columns: ['来源', 'log-odds', '累计概率'],
            rows: parts.map((p, i) => [p.label, p.value.toFixed(3), `${Math.round(sigmoid(parts.slice(0, i + 1).reduce((s, x) => s + x.value, 0)) * 100)}%`]),
          }}
          footer={
            <>
              蓝 = 提高概率，红 = 降低概率，灰 = 起点。人格权重已按“单次行为”减半（聚合原理）。
              <Cite ids={def.sources} />
            </>
          }
        >
          <EChart option={option} height={Math.max(200, parts.length * 30 + 30)} label={`${def.name}的预测贡献分解`} />
        </ChartCard>
        <Card title={def.avoid ? '什么最能降低它发生的概率' : '什么最能提高它发生的概率'} subtitle="其余条件不变，只改变一项（基于你的后验模型）">
          <ul className="space-y-2">
            {lv.map((l) => {
              const good = def.avoid ? l.delta < 0 : l.delta > 0
              return (
                <li key={l.key} className="flex items-center gap-3 text-sm">
                  <span className="flex-1 text-ink-2">{l.label}</span>
                  <span className="tnum text-xs text-muted">
                    {Math.round(l.from * 100)}% → {Math.round(l.to * 100)}%
                  </span>
                  <span className={cx('w-16 text-right tnum text-sm font-medium', good ? 'text-ink' : 'text-muted')}>
                    {l.delta >= 0 ? '+' : ''}
                    {Math.round(l.delta * 100)} 点
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-[11px] text-muted leading-relaxed">
            “概率点”指百分比的绝对变化。计划与意图的先验来自荟萃分析
            <Cite ids={['gollwitzer2006', 'armitage2001']} />
            ，其余情境效应主要由你的记录学习。这是统计关联，不保证对你一定有因果效果——可以用自我实验去验证。
          </p>
        </Card>
      </div>
    </div>
  )
}

function Toggle({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={cx(
        'rounded-full border px-2.5 py-1 text-xs transition-colors disabled:cursor-default',
        on ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-2 hover:text-ink',
        disabled && 'opacity-80',
      )}
    >
      {children}
    </button>
  )
}
