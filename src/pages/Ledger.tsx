import { useMemo, useState } from 'react'
import { Check, Plus, Trash2, X } from 'lucide-react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../components/chartStyle'
import { Button, Callout, Card, ChartCard, Cite, Field, PageHeader, Section, Slider, Stat, Tag } from '../components/ui'
import { cx } from '../components/cx'
import { brier, calibrationBins, murphy, overconfidence, resolved } from '../engine/ledger'
import { useLedgerStore } from '../store/ledgerStore'
import { useChartTheme } from '../theme'

const CATEGORIES = ['健康', '睡眠', '工作', '学习', '关系', '财务', '心理', '其他']

export default function Ledger() {
  const t = useChartTheme()
  const { items, add, resolve, remove, loadExamples, clear } = useLedgerStore()
  const [statement, setStatement] = useState('')
  const [p, setP] = useState(0.7)
  const [category, setCategory] = useState('健康')
  const [dueAt, setDueAt] = useState(() => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10))

  const bs = brier(items)
  const m = murphy(items)
  const oc = overconfidence(items)
  const bins = calibrationBins(items, 5)
  const nResolved = resolved(items).length

  const calOpt = useMemo(
    () => ({
      ...baseText(t),
      tooltip: {
        ...tooltipStyle(t),
        formatter: (x: { seriesName: string; value: number[] }) =>
          x.seriesName === '你的校准' ? `预测 ${Math.round(x.value[0] * 100)}% 的事<br/>实际发生 ${Math.round(x.value[1] * 100)}%<br/>样本 ${x.value[2]}` : '',
      },
      legend: { ...legendStyle(t), top: 0, right: 0 },
      grid: { left: 8, right: 16, top: 34, bottom: 8, containLabel: true },
      xAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '你给的概率', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
      yAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '实际发生频率', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
      series: [
        { name: '完美校准', type: 'line', data: [[0, 0], [1, 1]], showSymbol: false, lineStyle: { color: t.muted, width: 1.5 }, itemStyle: { color: t.muted }, silent: true },
        {
          name: '你的校准',
          type: 'line',
          data: bins.map((b) => [b.meanP, b.freq, b.n]),
          symbol: 'circle',
          symbolSize: (v: number[]) => 8 + Math.sqrt(v[2]) * 4,
          lineStyle: { color: t.series[0], width: 2 },
          itemStyle: { color: t.series[0], borderColor: t.surface, borderWidth: 2 },
        },
      ],
    }),
    [t, bins],
  )

  const submit = () => {
    if (!statement.trim()) return
    add({ statement: statement.trim(), p, category, dueAt })
    setStatement('')
  }

  const pending = items.filter((x) => x.outcome === 'pending')
  const done = items.filter((x) => x.outcome !== 'pending')

  return (
    <div>
      <PageHeader
        kicker="预测你自己 · Calibrate"
        title="预测账本"
        desc={
          <>
            “预测每一个人的未来”最诚实的起点，是先检验<strong className="text-ink">你能否预测你自己</strong>。写下对自己未来的具体预测并给出概率，到期后如实结算——
            账本会用天气预报员使用的 Brier 分数衡量你的准确度与校准度 <Cite ids={['brier1950', 'tetlock2015']} />。
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card title="写下一个预测" subtitle="好的预测：具体、可验证、有截止日期">
          <div className="grid gap-3">
            <Field label="我预测……">
              <input className="qh-input" value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="例如：下周至少跑步 3 次" maxLength={60} onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </Field>
            <Slider label="我认为它发生的概率" value={p} min={0.05} max={0.95} step={0.05} onChange={setP} format={(v) => `${Math.round(v * 100)}%`} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="类别">
                <select className="qh-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="截止日期">
                <input type="date" className="qh-input" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
              </Field>
            </div>
            <Button variant="primary" onClick={submit} disabled={!statement.trim()}>
              <Plus size={14} /> 记入账本
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
            <Button variant="ghost" onClick={loadExamples}>
              载入示例账本
            </Button>
            {items.length > 0 && (
              <Button variant="ghost" onClick={() => confirm('确定清空全部预测吗？此操作不可撤销。') && clear()}>
                清空
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Brier 分数" value={bs === null ? '—' : bs.toFixed(3)} sub="0 完美 · 0.25 = 永远说 50%" />
            <Stat label="已结算" value={nResolved} unit={`/ ${items.length}`} />
            <Stat label="过度自信" value={oc === null ? '—' : `${oc > 0 ? '+' : ''}${Math.round(oc * 100)}%`} sub="平均把握度 − 实际命中率" />
            <Stat label="分辨力" value={m ? m.resolution.toFixed(3) : '—'} sub="区分“会发生/不会发生”的能力，越高越好" />
          </div>
          <ChartCard
            title="校准曲线"
            subtitle="点越靠近对角线，说明你说 70% 的事真的约 70% 会发生；点在对角线下方 = 过度自信"
            table={{ columns: ['概率区间', '平均预测', '实际频率', '样本数'], rows: bins.map((b) => [`${b.lo * 100}–${b.hi * 100}%`, `${Math.round(b.meanP * 100)}%`, `${Math.round(b.freq * 100)}%`, b.n]) }}
          >
            {nResolved ? <EChart option={calOpt} height={260} label="预测校准曲线" /> : <p className="py-16 text-center text-sm text-muted">还没有已结算的预测。可以先“载入示例账本”看看效果。</p>}
          </ChartCard>
        </div>
      </div>

      <Section title={`待结算（${pending.length}）`}>
        <ForecastList items={pending} onResolve={resolve} onRemove={remove} />
      </Section>
      <Section title={`已结算（${done.length}）`}>
        <ForecastList items={done} onResolve={resolve} onRemove={remove} />
      </Section>

      <Section title="为什么我们连自己都预测不准">
        <div className="grid gap-3 md:grid-cols-3">
          <Callout tone="insight" title="规划谬误">
            人们系统性低估完成任务所需的时间，即使清楚记得过去也曾超时 <Cite ids={['buehler1994']} />。我们用“内部视角”想象计划，却忽视“外部视角”的基础概率。
          </Callout>
          <Callout tone="insight" title="写计划的和过日子的不是同一个“系统”">
            慢思考的系统 2 写下目标，快思考的系统 1 负责执行日常 <Cite ids={['kahneman2011']} />。预测自己，本质上是在预测另一个更冲动的自己。
          </Callout>
          <Callout tone="insight" title="如何变得更准">
            先查“参照类”的基础概率（像你这样的人，多少比例能坚持健身三个月？）；再根据个人信息微调；把大问题拆小；记录并复盘。超级预测者的核心习惯正是如此 <Cite ids={['tetlock2015']} />。
          </Callout>
        </div>
      </Section>
    </div>
  )
}

function ForecastList({
  items,
  onResolve,
  onRemove,
}: {
  items: ReturnType<typeof useLedgerStore.getState>['items']
  onResolve: (id: string, o: 'pending' | 'yes' | 'no') => void
  onRemove: (id: string) => void
}) {
  if (!items.length) return <p className="text-sm text-muted">暂无。</p>
  const today = new Date().toISOString().slice(0, 10)
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((f) => (
        <div key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
          <span className="w-12 text-right text-sm font-semibold text-ink tnum">{Math.round(f.p * 100)}%</span>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-ink">{f.statement}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted">
              <Tag>{f.category}</Tag>
              <span>截止 {f.dueAt}</span>
              {f.outcome === 'pending' && f.dueAt < today && <span className="text-ink-2">· 已到期，待结算</span>}
            </div>
          </div>
          {f.outcome === 'pending' ? (
            <div className="flex gap-1.5">
              <Button onClick={() => onResolve(f.id, 'yes')}>
                <Check size={14} /> 发生了
              </Button>
              <Button onClick={() => onResolve(f.id, 'no')}>
                <X size={14} /> 没发生
              </Button>
            </div>
          ) : (
            <button
              onClick={() => onResolve(f.id, 'pending')}
              title="撤销结算"
              className={cx('rounded-md px-2 py-1 text-xs border border-line', f.outcome === 'yes' ? 'text-ink' : 'text-ink-2')}
            >
              {f.outcome === 'yes' ? '✓ 发生了' : '✗ 没发生'}
            </button>
          )}
          <button onClick={() => onRemove(f.id)} aria-label="删除" className="rounded p-1 text-muted hover:text-ink">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
