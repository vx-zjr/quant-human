import { useMemo, useState } from 'react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, tooltipStyle } from '../components/chartStyle'
import { Card, ChartCard, Cite, LayerBadge, PageHeader, Section } from '../components/ui'
import { cx } from '../components/cx'
import { FRAMEWORKS } from '../data/frameworks'
import { LAYERS } from '../data/layers'
import { useChartTheme } from '../theme'
import type { Framework } from '../types'

export default function Frameworks() {
  const t = useChartTheme()
  const [sel, setSel] = useState<string>(FRAMEWORKS[0].id)
  const f = FRAMEWORKS.find((x) => x.id === sel)!

  const matrix = useMemo(() => {
    const data: [number, number, number][] = []
    FRAMEWORKS.forEach((fw, y) => LAYERS.forEach((l, x) => data.push([x, y, fw.layers.includes(l.id) ? 1 : 0])))
    return {
      ...baseText(t),
      tooltip: {
        ...tooltipStyle(t),
        formatter: (p: { value: [number, number, number] }) => `${FRAMEWORKS[p.value[1]].name}<br/>${LAYERS[p.value[0]].id} ${LAYERS[p.value[0]].name}：${p.value[2] ? '覆盖' : '—'}`,
      },
      grid: { left: 8, right: 8, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: LAYERS.map((l) => `${l.id}\n${l.name}`), position: 'top', ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2, fontSize: 10, interval: 0 } },
      yAxis: { type: 'category', inverse: true, data: FRAMEWORKS.map((x) => x.name), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2, fontSize: 11 } },
      series: [
        {
          type: 'heatmap',
          data,
          itemStyle: { borderColor: t.surface, borderWidth: 3, borderRadius: 3 },
          emphasis: { disabled: true },
        },
      ],
      visualMap: { show: false, min: 0, max: 1, inRange: { color: [t.surface2, t.accent] } },
    }
  }, [t])

  return (
    <div>
      <PageHeader
        kicker="地图 · Frameworks"
        title="解构人的 17 把刀"
        desc="每一个理论框架都是观察人的一个切面，没有一个能单独解释全部。这里为每个框架标注了实证强度（1–5）与主要批评——流行程度和科学支持度常常不是一回事（例如马斯洛需求层次）。"
      />

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="space-y-1.5 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto lg:pr-1">
          {FRAMEWORKS.map((x) => (
            <button
              key={x.id}
              onClick={() => setSel(x.id)}
              className={cx('w-full rounded-lg border px-3 py-2.5 text-left transition-colors', sel === x.id ? 'border-accent bg-accent-soft' : 'border-line bg-surface hover:border-line-strong')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{x.name}</span>
                <Evidence n={x.evidence} />
              </div>
              <div className="text-[11px] text-muted">
                {x.author} · {x.year}
              </div>
            </button>
          ))}
        </div>
        <FrameworkDetail f={f} />
      </div>

      <Section title="框架 × 层级覆盖矩阵" desc="没有一个框架覆盖全部八层；L0 物质层与 L7 意义层是最少被同一个理论同时触及的两端。这正是本项目试图“缝合”的缝隙。">
        <ChartCard title="哪些框架覆盖哪些层" table={{ columns: ['框架', ...LAYERS.map((l) => l.id)], rows: FRAMEWORKS.map((x) => [x.name, ...LAYERS.map((l) => (x.layers.includes(l.id) ? '●' : ''))]) }}>
          <EChart option={matrix} height={560} label="理论框架与八层的覆盖矩阵" onClick={(p) => setSel(FRAMEWORKS[(p.data as number[])[1]].id)} />
        </ChartCard>
      </Section>
    </div>
  )
}

function Evidence({ n }: { n: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`实证强度 ${n}/5`} title={`实证强度 ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i <= n ? 'var(--accent)' : 'var(--surface-3)' }} />
      ))}
    </span>
  )
}

function FrameworkDetail({ f }: { f: Framework }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">{f.name}</h2>
          <div className="text-sm text-muted">
            {f.en} · {f.author}（{f.year}）
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted mb-1">实证强度</div>
          <Evidence n={f.evidence} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {f.layers.map((l) => (
          <LayerBadge key={l} id={l} />
        ))}
      </div>
      <p className="mt-4 text-[15px] text-ink leading-relaxed">{f.core}</p>
      <div className="mt-4 rounded-xl bg-surface-2/60 p-4">
        <FrameworkShape f={f} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <div className="text-xs font-medium text-muted mb-1">主要批评与局限</div>
          <p className="text-sm text-ink-2 leading-relaxed">{f.critique}</p>
        </div>
        <div>
          <div className="text-xs font-medium text-muted mb-1">在本项目中的用法</div>
          <p className="text-sm text-ink-2 leading-relaxed">{f.usage}</p>
        </div>
      </div>
      {f.sources && (
        <div className="mt-4 border-t border-line pt-3">
          <span className="text-xs text-muted mr-1">来源：</span>
          <Cite ids={f.sources} />
        </div>
      )}
    </Card>
  )
}

/** 按框架形态绘制示意图（纯 SVG，跟随主题） */
function FrameworkShape({ f }: { f: Framework }) {
  const comps = f.components
  if (f.shape === 'pyramid') {
    const n = comps.length
    const W = 520
    const H = 46 * n
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-xl mx-auto block" role="img" aria-label={`${f.name}层级示意`}>
        {comps.map((c, i) => {
          const level = n - 1 - i
          const top = level * 46
          const halfTop = ((level + 0.15) / n) * (W / 2) * 0.9
          const halfBot = ((level + 1) / n) * (W / 2) * 0.9
          const cx0 = W / 2
          const pts = `${cx0 - halfTop},${top + 2} ${cx0 + halfTop},${top + 2} ${cx0 + halfBot},${top + 44} ${cx0 - halfBot},${top + 44}`
          return (
            <g key={c.name}>
              <polygon points={pts} fill="var(--accent)" fillOpacity={0.18 + (i / n) * 0.5} stroke="var(--surface)" strokeWidth={2} />
              <text x={cx0} y={top + 22} textAnchor="middle" fontSize="13" fill="var(--ink)" fontWeight={600}>
                {c.name}
              </text>
              <text x={cx0} y={top + 37} textAnchor="middle" fontSize="10" fill="var(--ink-2)">
                {c.desc}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }
  if (f.shape === 'timeline') {
    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {comps.map((c, i) => (
          <div key={c.name} className="rounded-lg border border-line bg-surface p-3">
            <div className="text-[11px] text-muted tnum">阶段 {i + 1}</div>
            <div className="text-sm font-semibold text-ink">{c.name}</div>
            <div className="text-xs text-ink-2">{c.desc}</div>
          </div>
        ))}
      </div>
    )
  }
  if (f.shape === 'nested') {
    const n = comps.length
    const S = 300
    return (
      <div className="grid gap-4 md:grid-cols-[300px_1fr] items-center">
        <svg viewBox={`0 0 ${S} ${S}`} className="w-full max-w-[300px] mx-auto" role="img" aria-label={`${f.name}嵌套示意`}>
          {[...comps].reverse().map((c, i) => {
            const r = ((n - i) / n) * (S / 2 - 6)
            return <circle key={c.name} cx={S / 2} cy={S / 2} r={r} fill="var(--accent)" fillOpacity={0.1 + (i / n) * 0.18} stroke="var(--border-strong)" />
          })}
          {comps.map((c, i) => {
            const r = ((i + 1) / n) * (S / 2 - 6)
            return (
              <text key={c.name} x={S / 2} y={S / 2 - r + 16} textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight={600}>
                {c.name}
              </text>
            )
          })}
        </svg>
        <ul className="space-y-1.5 text-sm">
          {comps.map((c, i) => (
            <li key={c.name}>
              <span className="text-muted tnum mr-2">{i + 1}</span>
              <b className="text-ink font-medium">{c.name}</b> <span className="text-ink-2">{c.desc}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }
  if (f.shape === 'matrix') {
    return (
      <div className={cx('grid gap-2', comps.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3')}>
        {comps.map((c) => (
          <div key={c.name} className="rounded-lg border border-line bg-surface p-4">
            <div className="text-base font-semibold text-ink">{c.name}</div>
            <div className="mt-1 text-sm text-ink-2">{c.desc}</div>
          </div>
        ))}
      </div>
    )
  }
  // wheel
  const S = 340
  const c0 = S / 2
  const R = 118
  return (
    <svg viewBox={`-80 0 ${S + 160} ${S}`} className="w-full max-w-[460px] mx-auto block" role="img" aria-label={`${f.name}组成示意`}>
      <circle cx={c0} cy={c0} r={R} fill="none" stroke="var(--border-strong)" />
      {comps.map((c, i) => {
        const a = (i / comps.length) * Math.PI * 2 - Math.PI / 2
        const x = c0 + R * Math.cos(a)
        const y = c0 + R * Math.sin(a)
        return (
          <g key={c.name}>
            <line x1={c0} y1={c0} x2={x} y2={y} stroke="var(--border-strong)" />
            <circle cx={x} cy={y} r={7} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
            <text
              x={c0 + (R + 16) * Math.cos(a)}
              y={c0 + (R + 16) * Math.sin(a) + 4}
              textAnchor={Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end'}
              fontSize="11"
              fill="var(--ink)"
            >
              {c.name}
            </text>
          </g>
        )
      })}
      <circle cx={c0} cy={c0} r={34} fill="var(--accent-soft)" stroke="var(--accent)" />
      <text x={c0} y={c0 + 4} textAnchor="middle" fontSize="11" fill="var(--ink)" fontWeight={600}>
        {f.name.length > 6 ? f.name.slice(0, 6) : f.name}
      </text>
    </svg>
  )
}
