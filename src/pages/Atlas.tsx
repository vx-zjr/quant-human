import { useMemo, useState, type ReactNode } from 'react'
import { Search, X } from 'lucide-react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../components/chartStyle'
import { Card, ChartCard, Cite, LayerBadge, Meter, PageHeader, Section, Tag } from '../components/ui'
import { cx } from '../components/cx'
import { DIMENSIONS, DIMENSION_MAP, MEASURABILITY_LABEL, dimensionTree } from '../data/dimensions'
import { LAYERS, LAYER_MAP } from '../data/layers'
import { navigate, useRoute } from '../router'
import { alpha, useChartTheme, type ChartTheme } from '../theme'
import type { Dimension, LayerId } from '../types'

/** 序数蓝色阶（可测量性 1→5）。浅色主题越深越强，深色主题越亮越强。 */
const ORDINAL_LIGHT = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281']
const ORDINAL_DARK = ['#184f95', '#256abf', '#3987e5', '#6da7ec', '#9ec5f4']

export default function Atlas() {
  const t = useChartTheme()
  const { query } = useRoute()
  const layerFilter = (query.get('layer') as LayerId | null) ?? null
  const selectedId = query.get('dim')
  const [q, setQ] = useState('')
  const [minMeas, setMinMeas] = useState(1)

  const setParam = (k: 'layer' | 'dim', v?: string) =>
    navigate('/atlas', { layer: k === 'layer' ? v : (layerFilter ?? undefined), dim: k === 'dim' ? v : (selectedId ?? undefined) })

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return DIMENSIONS.filter(
      (d) =>
        (!layerFilter || d.layer === layerFilter) &&
        d.measurability >= minMeas &&
        (!s || [d.name, d.en, d.desc, d.domain, ...(d.measure ?? [])].some((x) => x.toLowerCase().includes(s))),
    )
  }, [q, layerFilter, minMeas])

  const selected = selectedId ? DIMENSION_MAP[selectedId] : null
  const sunburst = useMemo(() => sunburstOption(t, layerFilter), [t, layerFilter])
  const measOption = useMemo(() => measurabilityOption(t), [t])

  return (
    <div>
      <PageHeader
        kicker="解构 · Deconstruct"
        title="维度图谱"
        desc={`把一个人拆成 ${DIMENSIONS.length} 个可量化维度，按八层、${new Set(DIMENSIONS.map((d) => d.domain)).size} 个子领域组织。每个维度都标注了测量方法、可测量性、遗传度、跨年稳定性、预测价值与文献来源。`}
      />

      {/* 过滤条 */}
      <div className="sticky top-12 lg:top-0 z-10 -mx-4 mb-5 flex flex-wrap items-center gap-2 border-b border-line bg-page/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input className="qh-input pl-8" placeholder="搜索维度、方法、关键词…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="搜索维度" />
        </div>
        <div className="flex flex-wrap gap-1">
          <FilterChip active={!layerFilter} onClick={() => setParam('layer', undefined)}>
            全部
          </FilterChip>
          {LAYERS.map((l) => (
            <FilterChip key={l.id} active={layerFilter === l.id} onClick={() => setParam('layer', l.id)} dot={`var(--${l.id.toLowerCase()})`}>
              {l.name}
            </FilterChip>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-2 ml-auto">
          可测量性 ≥
          <select className="qh-input !w-auto !py-1" value={minMeas} onChange={(e) => setMinMeas(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((m) => (
              <option key={m} value={m}>
                {m} · {MEASURABILITY_LABEL[m]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <ChartCard
          title="层 → 子领域 → 维度"
          subtitle={layerFilter ? '再次点击内圈返回全部；点击外圈查看维度详情' : '点击内圈按层筛选；点击外圈查看维度详情'}
          table={{
            columns: ['层', '子领域', '维度', '可测量性'],
            rows: DIMENSIONS.map((d) => [d.layer, d.domain, d.name, d.measurability]),
          }}
        >
          <EChart
            option={sunburst}
            height={460}
            label="量化维度旭日图"
            onClick={(p) => {
              const data = p.data as { id?: string; layer?: LayerId } | undefined
              if (data?.id && DIMENSION_MAP[data.id]) setParam('dim', data.id)
              else if (data?.layer) setParam('layer', layerFilter === data.layer ? undefined : data.layer)
            }}
          />
        </ChartCard>
        <div className="lg:sticky lg:top-20 self-start">
          {selected ? <DimensionDetail d={selected} onClose={() => setParam('dim', undefined)} /> : <EmptyDetail />}
        </div>
      </div>

      <Section title={`维度列表（${filtered.length}）`} desc="遗传度 h² 是人群统计量（差异中有多少可归因于基因差异），不是“个人有多少由基因决定”；稳定性指跨年的排序一致性。">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setParam('dim', d.id)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={cx(
                'text-left rounded-xl border bg-surface p-4 transition-colors hover:border-line-strong',
                selectedId === d.id ? 'border-accent' : 'border-line',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-ink">{d.name}</div>
                  <div className="text-[11px] text-muted">{d.en}</div>
                </div>
                <LayerBadge id={d.layer} />
              </div>
              <p className="mt-2 text-xs text-ink-2 line-clamp-3 leading-relaxed">{d.desc}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-muted">
                <div>
                  可测量性
                  <MeasDots n={d.measurability} />
                </div>
                <div>
                  遗传度
                  <div className="text-ink-2 tnum">{d.heritability !== undefined ? `${Math.round(d.heritability * 100)}%` : '—'}</div>
                </div>
                <div>
                  稳定性
                  <div className="text-ink-2 tnum">{d.stability !== undefined ? d.stability.toFixed(2) : '—'}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
        {!filtered.length && <p className="text-sm text-muted">没有匹配的维度。</p>}
      </Section>

      <Section title="每一层能被测得多准？" desc="可测量性分布：越往上层，越依赖自评量表与间接推断；L7 中的“主观体验”是唯一只能定性描述的维度。">
        <ChartCard
          title="各层维度的可测量性构成"
          subtitle="1 = 仅能定性 … 5 = 可用仪器精确测量"
          table={{
            columns: ['层', '1', '2', '3', '4', '5'],
            rows: LAYERS.map((l) => [`${l.id} ${l.name}`, ...[1, 2, 3, 4, 5].map((m) => DIMENSIONS.filter((d) => d.layer === l.id && d.measurability === m).length)]),
          }}
        >
          <EChart option={measOption} height={320} label="各层维度可测量性堆叠条形图" />
        </ChartCard>
      </Section>
    </div>
  )
}

function FilterChip({ active, onClick, children, dot }: { active: boolean; onClick: () => void; children: ReactNode; dot?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors',
        active ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-2 hover:text-ink',
      )}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ background: dot }} />}
      {children}
    </button>
  )
}

function MeasDots({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 mt-1" aria-label={`可测量性 ${n}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className="h-1.5 w-3 rounded-full" style={{ background: i <= n ? 'var(--accent)' : 'var(--surface-3)' }} />
      ))}
    </div>
  )
}

function EmptyDetail() {
  return (
    <Card>
      <div className="text-sm text-ink-2 leading-relaxed">
        <div className="font-semibold text-ink mb-2">如何阅读这张图谱</div>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>内圈是 8 层，中圈是子领域，外圈是具体维度。</li>
          <li>每个维度回答四个问题：怎么测？测得多准？由什么决定？能预测什么？</li>
          <li>
            <b className="text-ink">可测量性</b>：1 仅能定性、2 间接/理论推断、3 量表/自评、4 仪器估算、5 精确测量。
          </li>
          <li>
            <b className="text-ink">遗传度</b>：来自双生子/家系研究；它描述人群差异的来源，且依赖环境。
          </li>
          <li>
            <b className="text-ink">稳定性</b>：跨年排序一致性，越高越适合用于长期预测。
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted">提示：点击外圈扇区或下方卡片查看详情。</p>
      </div>
    </Card>
  )
}

function DimensionDetail({ d, onClose }: { d: Dimension; onClose: () => void }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <LayerBadge id={d.layer} size="md" />
            <Tag>{d.domain}</Tag>
          </div>
          <h3 className="mt-2 text-xl font-semibold text-ink">{d.name}</h3>
          <div className="text-xs text-muted">
            {d.en}
            {d.unit && ` · 单位：${d.unit}`}
          </div>
        </div>
        <button onClick={onClose} aria-label="关闭详情" className="rounded-md p-1 text-muted hover:bg-surface-2">
          <X size={16} />
        </button>
      </div>
      <p className="mt-3 text-sm text-ink-2 leading-relaxed">{d.desc}</p>
      {d.norm && (
        <div className="mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm">
          <span className="text-muted">典型值：</span>
          <span className="text-ink">{d.norm}</span>
        </div>
      )}
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>可测量性</span>
            <span>
              {d.measurability}/5 · {MEASURABILITY_LABEL[d.measurability]}
            </span>
          </div>
          <Meter value={d.measurability / 5} />
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>遗传度 h²</span>
            <span>{d.heritability !== undefined ? `${Math.round(d.heritability * 100)}%` : '未知 / 不适用'}</span>
          </div>
          <Meter value={d.heritability ?? 0} color="var(--l1)" />
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted mb-1">
            <span>跨年稳定性</span>
            <span>{d.stability !== undefined ? d.stability.toFixed(2) : '未知'}</span>
          </div>
          <Meter value={d.stability ?? 0} color="var(--l2)" />
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs text-muted mb-1.5">测量方法</div>
        <div className="flex flex-wrap gap-1.5">
          {d.measure.map((m) => (
            <Tag key={m}>{m}</Tag>
          ))}
        </div>
      </div>
      {d.predicts && (
        <div className="mt-3">
          <div className="text-xs text-muted mb-1.5">统计上可预测</div>
          <div className="flex flex-wrap gap-1.5">
            {d.predicts.map((m) => (
              <Tag key={m} className="!border-accent/40">
                {m}
              </Tag>
            ))}
          </div>
        </div>
      )}
      {d.sources && (
        <div className="mt-4 pt-3 border-t border-line">
          <span className="text-xs text-muted mr-1">来源：</span>
          <Cite ids={d.sources} />
        </div>
      )}
    </Card>
  )
}

/* ----------------------------- 图表配置 ----------------------------- */

function sunburstOption(t: ChartTheme, layerFilter: LayerId | null) {
  const tree = dimensionTree().filter((x) => !layerFilter || x.layer === layerFilter)
  const data = tree.map((l) => {
    const color = t.layer[l.layer]
    return {
      name: `${l.layer} ${LAYER_MAP[l.layer].name}`,
      layer: l.layer,
      itemStyle: { color },
      children: l.domains.map((dm) => ({
        name: dm.domain,
        itemStyle: { color: alpha(color, 0.72) },
        children: dm.dims.map((d) => ({ name: d.name, id: d.id, value: 1, itemStyle: { color: alpha(color, 0.45) } })),
      })),
    }
  })
  return {
    ...baseText(t),
    tooltip: {
      ...tooltipStyle(t),
      formatter: (p: { name: string; data: { id?: string } }) => {
        const d = p.data?.id ? DIMENSION_MAP[p.data.id] : null
        return d ? `<b>${d.name}</b><br/><span style="opacity:.7">${d.en}</span><br/>可测量性 ${d.measurability}/5` : `<b>${p.name}</b>`
      },
    },
    series: [
      {
        type: 'sunburst',
        data,
        radius: ['8%', '96%'],
        sort: undefined,
        nodeClick: false,
        itemStyle: { borderColor: t.surface, borderWidth: 2 },
        emphasis: { focus: 'ancestor' },
        levels: [
          {},
          { r0: '8%', r: '32%', label: { rotate: 'tangential', color: '#fff', fontSize: 11, fontWeight: 600 } },
          { r0: '32%', r: '58%', label: { rotate: 'tangential', color: t.ink, fontSize: 10, minAngle: 8 } },
          { r0: '58%', r: '96%', label: { rotate: 'radial', color: t.ink, fontSize: 10, minAngle: 2.5 }, itemStyle: { borderWidth: 1 } },
        ],
        label: { overflow: 'truncate', width: 80 },
      },
    ],
  }
}

function measurabilityOption(t: ChartTheme) {
  const ramp = t.isDark ? ORDINAL_DARK : ORDINAL_LIGHT
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { ...legendStyle(t), top: 0, right: 0 },
    grid: { left: 8, right: 16, top: 34, bottom: 8, containLabel: true },
    xAxis: { type: 'value', ...axisStyle(t), name: '维度数' },
    yAxis: {
      type: 'category',
      inverse: true,
      data: LAYERS.map((l) => `${l.id} ${l.name}`),
      ...axisStyle(t),
      splitLine: { show: false },
      axisLabel: { color: t.ink2 },
    },
    series: [1, 2, 3, 4, 5].map((m, i) => ({
      name: `${m} ${MEASURABILITY_LABEL[m]}`,
      type: 'bar',
      stack: 'm',
      barWidth: 14,
      itemStyle: { color: ramp[i], borderColor: t.surface, borderWidth: 1 },
      data: LAYERS.map((l) => DIMENSIONS.filter((d) => d.layer === l.id && d.measurability === m).length || null),
    })),
  }
}
