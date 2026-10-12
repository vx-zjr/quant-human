import { useMemo } from 'react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../components/chartStyle'
import { Callout, Card, ChartCard, Cite, LayerBadge, PageHeader, Section, Stat, Status } from '../components/ui'
import { BIG_FIVE_META, BIG_FIVE_NORMS, TRAIT_OUTCOMES } from '../data/instruments/bigfive'
import { LAYER_MAP } from '../data/layers'
import { interpret } from '../engine/interpret'
import { BIG_FIVE_KEYS, DUNBAR_LAYERS, centeredValues, traitPercentile, valueAxes } from '../engine/scoring'
import { cn, sci } from '../engine/stats'
import { useAnalysis } from '../hooks/useAnalysis'
import { useActiveProfile } from '../store/profileStore'
import { useChartTheme, type ChartTheme } from '../theme'
import type { Profile, TimeUse } from '../types'

const TIME_LABELS: Record<keyof TimeUse, string> = {
  sleep: '睡眠',
  work: '工作/学习',
  commute: '通勤',
  chores: '家务',
  social: '社交',
  leisure: '休闲',
  exercise: '运动',
  screen: '屏幕娱乐',
}

export default function Present() {
  const t = useChartTheme()
  const p = useActiveProfile()
  const { body, layers } = useAnalysis(p)
  const readings = useMemo(() => interpret(p, body), [p, body])

  const layerRadar = useMemo(() => layerRadarOption(t, layers), [t, layers])
  const bigFive = useMemo(() => bigFiveOption(t, p), [t, p])
  const values = useMemo(() => valuesOption(t, p), [t, p])
  const elements = useMemo(() => elementsOption(t, body), [t, body])
  const composition = useMemo(() => compositionOption(t, p, body), [t, p, body])
  const time = useMemo(() => timeOption(t, p), [t, p])
  const perma = useMemo(() => permaOption(t, p), [t, p])
  const ax = valueAxes(p.values)

  return (
    <div>
      <PageHeader
        kicker="现在 · Interpret"
        title={`「${p.name}」此刻的量化快照`}
        desc="解读 = 测量 + 参照系。同一个数字，放在不同的常模、不同的年龄、不同的文化中，意义完全不同。下面的每个指标都标出了参照系与不确定性。"
      />

      <Section title="八层仪表盘" desc="每层一个透明的启发式综合分（0–100），用于整体对比而非诊断。L1 分子层需要基因组/血液数据，当前留空——承认缺失本身就是量化的一部分。">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ChartCard
            title="八层综合分"
            subtitle="计算公式见 src/engine/scoring.ts · layerScores"
            table={{ columns: ['层', '指标', '分数'], rows: layers.map((l) => [l.layer, l.label, l.score ?? '缺数据']) }}
          >
            <EChart option={layerRadar} height={340} label="八层综合分雷达图" />
          </ChartCard>
          <Card title="逐层解读" subtitle="规则式生成，每条都可追溯到阈值或文献">
            <ul className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {readings.map((r, i) => (
                <li key={i} className="flex gap-3">
                  <div className="pt-0.5">
                    <LayerBadge id={r.layer} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">
                      {r.level === 'info' ? r.title : <Status level={r.level}>{<span className="text-sm font-medium text-ink">{r.title}</span>}</Status>}
                    </div>
                    <p className="text-xs text-ink-2 leading-relaxed mt-0.5">
                      {r.text} {r.source && <Cite ids={[r.source]} />}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      <Section title="L0–L2 · 物质与身体" desc="经典经验公式估算，适用于普通成年人；运动员、孕妇、老年人误差较大。">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Stat label="BMI" value={body.bmi.toFixed(1)} sub={<Status level={body.bmiCat.level}>{body.bmiCat.label}（中国标准）</Status>} accent={t.layer.L2} />
          <Stat label="静息代谢" value={Math.round(body.bmr)} unit="kcal/天" sub={`≈ ${body.restingWatts.toFixed(0)} W，像一只灯泡`} accent={t.layer.L0} />
          <Stat label="每日总能耗（估）" value={Math.round(body.tdee)} unit="kcal" sub="静息代谢 × 活动系数" accent={t.layer.L0} />
          <Stat label="体脂率（估）" value={body.bodyFat.toFixed(1)} unit="%" sub={`脂肪约 ${body.fatKg.toFixed(1)} kg · Deurenberg 公式`} accent={t.layer.L2} />
          <Stat label="体内水分" value={body.waterL.toFixed(1)} unit="L" sub={`占体重 ${body.waterPct.toFixed(0)}% · Watson 公式`} accent={t.layer.L0} />
          <Stat label="血液总量" value={body.bloodL.toFixed(1)} unit="L" sub="Nadler 公式" accent={t.layer.L2} />
          <Stat label="人体细胞 / 共生菌" value={cn(body.cells, 0)} sub={`细菌约 ${cn(body.bacteria, 0)}；每天更新约 ${cn(body.cellsPerDay, 0)} 个细胞`} accent={t.layer.L1} />
          <Stat label="质能当量 E=mc²" value={sci(body.massEnergyJ)} unit="J" sub={`≈ ${cn(body.hiroshimas, 0)} 颗广岛原子弹`} accent={t.layer.L0} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <ChartCard
            title="你由什么元素构成：按质量 vs 按原子个数"
            subtitle={`共约 ${sci(body.atoms)} 个原子。按质量你主要是氧，按个数你主要是氢。`}
            table={{ columns: ['元素', '质量 (kg)', '质量占比', '原子数', '原子占比'], rows: body.elements.map((e) => [`${e.name} ${e.sym}`, e.kg.toFixed(3), `${((e.kg / p.weightKg) * 100).toFixed(2)}%`, sci(e.atoms), `${(e.atomShare * 100).toFixed(2)}%`]) }}
            footer={<Cite ids={['icrp1975']} />}
          >
            <EChart option={elements} height={300} label="元素质量占比与原子数占比对比" />
          </ChartCard>
          <ChartCard title="身体成分（估算）" subtitle="水分、脂肪与其余（蛋白质、矿物质、糖原等）">
            <EChart option={composition} height={300} label="身体成分环形图" />
          </ChartCard>
        </div>
      </Section>

      <Section title="L4 · 人格" desc="大五人格分数与近似常模的相对位置。百分位基于英文样本的近似常模，仅作示意（ROADMAP：替换为中国常模）。">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ChartCard
            title="大五人格百分位"
            subtitle="灰色竖线 = 人群中位（P50）"
            table={{ columns: ['维度', '原始分', '近似常模均值', '百分位'], rows: BIG_FIVE_KEYS.map((k) => [BIG_FIVE_META[k].name, p.bigFive[k].toFixed(2), BIG_FIVE_NORMS[k].mean, Math.round(traitPercentile(k, p.bigFive[k]))]) }}
          >
            <EChart option={bigFive} height={260} label="大五人格百分位条形图" />
          </ChartCard>
          <Card title="人格能预测什么？" subtitle="人群层面的相关系数 r；r=0.3 意味着只解释约 9% 的差异">
            <ul className="space-y-2.5">
              {TRAIT_OUTCOMES.map((o) => {
                const pct = traitPercentile(o.trait, p.bigFive[o.trait])
                return (
                  <li key={o.outcome} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-ink-2">{BIG_FIVE_META[o.trait].name}</span>
                    <span className="flex-1 text-ink">
                      → {o.outcome} <Cite ids={[o.source]} />
                    </span>
                    <span className="tnum text-xs text-ink-2">r≈{o.r.toFixed(2)}</span>
                    <span className="w-16 text-right text-xs text-muted">你 P{Math.round(pct)}</span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-4 text-xs text-muted leading-relaxed">
              人格对“结局”的预测效应量与社会经济地位、认知能力相当 <Cite ids={['roberts2007']} />，但对单个人而言仍远非决定性：同一分数的人，人生千差万别。
            </p>
          </Card>
        </div>
      </Section>

      <Section title="L7 · 价值观与幸福" desc="施瓦茨价值观经个人均值中心化：只看你最看重什么，而不是打分是否“大方”。">
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ChartCard
            title="价值观圆环（相对优先级）"
            subtitle={`开放–保守轴 ${ax.openness >= 0 ? '+' : ''}${ax.openness.toFixed(1)} · 超越–提升轴 ${ax.transcendence >= 0 ? '+' : ''}${ax.transcendence.toFixed(1)}`}
            table={{ columns: ['价值观', '原始分', '中心化'], rows: centeredValues(p.values).map((v) => [v.name, v.raw, v.centered.toFixed(1)]) }}
            footer={<Cite ids={['schwartz1992']} />}
          >
            <EChart option={values} height={320} label="施瓦茨十种价值观雷达图" />
          </ChartCard>
          <ChartCard title="PERMA 与生活评价" subtitle={`坎特里尔阶梯 ${p.lifeSat}/10 · 目的感 ${p.purpose}/7 · 感知压力 ${p.stress}/10`} footer={<Cite ids={['seligman2011', 'cantril1965']} />}>
            <EChart option={perma} height={320} label="PERMA 五要素条形图" />
          </ChartCard>
        </div>
      </Section>

      <Section title="L5–L6 · 时间与关系">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <ChartCard
            title="24 小时去了哪里"
            subtitle="典型工作日；时间分配是揭示真实优先级的“行为投票”"
            table={{ columns: ['活动', '小时'], rows: (Object.keys(TIME_LABELS) as (keyof TimeUse)[]).map((k) => [TIME_LABELS[k], p.timeUse[k]]) }}
          >
            <EChart option={time} height={150} label="24 小时时间分配堆叠条" />
            <p className="mt-2 text-xs text-ink-2 leading-relaxed">
              按此分配，假设持续到 80 岁，你余生将有约 <b className="text-ink tnum">{(((80 - body.age) * p.timeUse.screen) / 24).toFixed(1)}</b> 年用于屏幕娱乐、
              <b className="text-ink tnum">{(((80 - body.age) * p.timeUse.social) / 24).toFixed(1)}</b> 年用于社交陪伴。
            </p>
          </ChartCard>
          <Card title="邓巴同心圆" subtitle={`你的支持圈：${p.closeTies} 人（典型约 5 人）`}>
            <DunbarCircles closeTies={p.closeTies} />
            <p className="mt-2 text-xs text-muted">
              人类稳定社交网络呈约 3 倍递增的层级 <Cite ids={['zhou2005']} />。
            </p>
          </Card>
        </div>
      </Section>

      <Section title="此刻无法测到的东西">
        <Callout tone="warn" title="这张快照遗漏了什么">
          这里只用了约 40 个自评与体测变量。完整的“现在”还需要：基因组（{LAYER_MAP.L1.name}层）、血液生化与表观年龄、脑影像、连续可穿戴数据、数字足迹……
          即便全部拿到，测量本身也会改变被测者（霍桑效应、自我监控改变行为），而你此刻的主观体验（L7 感质）在原理上无法被外部完整读取
          <Cite ids={['chalmers1995']} />。
        </Callout>
      </Section>
    </div>
  )
}

/* ------------------------------ 邓巴圈 ------------------------------ */

function DunbarCircles({ closeTies }: { closeTies: number }) {
  const size = 260
  const c = size / 2
  const radii = [30, 58, 88, 120]
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto block w-full max-w-[260px]" role="img" aria-label={`邓巴同心圆，支持圈 ${closeTies} 人`}>
      {[...DUNBAR_LAYERS].reverse().map((l, i) => {
        const r = radii[DUNBAR_LAYERS.length - 1 - i]
        return (
          <g key={l.size}>
            <circle cx={c} cy={c} r={r} fill="var(--surface-2)" stroke="var(--border-strong)" />
            <text x={c} y={c - r + 13} textAnchor="middle" fontSize="10" fill="var(--muted)">
              {l.size} · {l.name}
            </text>
          </g>
        )
      })}
      {Array.from({ length: Math.min(closeTies, 15) }).map((_, i) => {
        const inner = i < 5
        const ring = inner ? 16 : 44
        const n = inner ? Math.min(5, closeTies) : Math.min(10, closeTies - 5)
        const k = inner ? i : i - 5
        const ang = (k / n) * Math.PI * 2 - Math.PI / 2
        return <circle key={i} cx={c + ring * Math.cos(ang)} cy={c + 6 + ring * Math.sin(ang)} r={5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />
      })}
    </svg>
  )
}

/* ------------------------------ 图表配置 ------------------------------ */

function layerRadarOption(t: ChartTheme, layers: { layer: string; label: string; score: number | null }[]) {
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t) },
    radar: {
      radius: '66%',
      indicator: layers.map((l) => ({ name: `${l.layer}\n${l.label}`, max: 100 })),
      axisName: { color: t.ink2, fontSize: 11, lineHeight: 14 },
      splitLine: { lineStyle: { color: t.grid } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: t.grid } },
    },
    series: [
      {
        type: 'radar',
        data: [{ value: layers.map((l) => l.score ?? 0), name: '综合分' }],
        symbolSize: 6,
        lineStyle: { color: t.series[0], width: 2 },
        itemStyle: { color: t.series[0], borderColor: t.surface, borderWidth: 2 },
        areaStyle: { color: t.series[0], opacity: 0.15 },
      },
    ],
  }
}

function bigFiveOption(t: ChartTheme, p: Profile) {
  const pcts = BIG_FIVE_KEYS.map((k) => traitPercentile(k, p.bigFive[k]))
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => `P${Math.round(v)}` },
    grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 0, max: 100, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: 'P{value}' } },
    yAxis: { type: 'category', inverse: true, data: BIG_FIVE_KEYS.map((k) => `${BIG_FIVE_META[k].name} ${k}`), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
    series: [
      {
        type: 'bar',
        data: pcts,
        barWidth: 12,
        itemStyle: { color: t.layer.L4, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: t.ink2, fontSize: 11, formatter: (x: { value: number }) => `P${Math.round(x.value)}` },
        markLine: { silent: true, symbol: 'none', data: [{ xAxis: 50 }], lineStyle: { color: t.muted, type: 'solid' }, label: { show: false } },
      },
    ],
  }
}

function valuesOption(t: ChartTheme, p: Profile) {
  const c = centeredValues(p.values)
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t) },
    radar: {
      radius: '68%',
      startAngle: 90,
      indicator: c.map((v) => ({ name: v.name, min: -6, max: 6 })),
      axisName: { color: t.ink2, fontSize: 11 },
      splitNumber: 4,
      splitLine: { lineStyle: { color: t.grid } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: t.grid } },
    },
    series: [
      {
        type: 'radar',
        data: [{ value: c.map((v) => Number(v.centered.toFixed(2))), name: '相对优先级' }],
        symbolSize: 6,
        lineStyle: { color: t.layer.L7, width: 2 },
        itemStyle: { color: t.layer.L7, borderColor: t.surface, borderWidth: 2 },
        areaStyle: { color: t.layer.L7, opacity: 0.15 },
      },
    ],
  }
}

function elementsOption(t: ChartTheme, body: ReturnType<typeof useAnalysis>['body']) {
  const top = body.elements.slice(0, 6)
  const restMass = body.elements.slice(6).reduce((s, e) => s + e.kg, 0)
  const restAtoms = body.elements.slice(6).reduce((s, e) => s + e.atomShare, 0)
  const total = body.elements.reduce((s, e) => s + e.kg, 0)
  const names = [...top.map((e) => `${e.name} ${e.sym}`), '其他']
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => `${v.toFixed(2)}%` },
    legend: { ...legendStyle(t), top: 0, right: 0 },
    grid: { left: 8, right: 8, top: 32, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: names, ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
    yAxis: { type: 'value', ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: '{value}%' } },
    series: [
      {
        name: '按质量',
        type: 'bar',
        barWidth: 12,
        barGap: '30%',
        itemStyle: { color: t.series[0], borderRadius: [4, 4, 0, 0] },
        data: [...top.map((e) => (e.kg / total) * 100), (restMass / total) * 100],
      },
      {
        name: '按原子个数',
        type: 'bar',
        barWidth: 12,
        itemStyle: { color: t.series[1], borderRadius: [4, 4, 0, 0] },
        data: [...top.map((e) => e.atomShare * 100), restAtoms * 100],
      },
    ],
  }
}

function compositionOption(t: ChartTheme, p: Profile, body: ReturnType<typeof useAnalysis>['body']) {
  const water = Math.min(body.waterL, p.weightKg * 0.75)
  const fat = Math.min(body.fatKg, p.weightKg - water)
  const other = Math.max(0, p.weightKg - water - fat)
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), valueFormatter: (v: number) => `${v.toFixed(1)} kg` },
    legend: { ...legendStyle(t), bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['46%', '74%'],
        center: ['50%', '45%'],
        itemStyle: { borderColor: t.surface, borderWidth: 2, borderRadius: 4 },
        label: { position: 'inside', color: '#fff', formatter: '{d}%', fontSize: 11, fontWeight: 600 },
        data: [
          { name: '水', value: water, itemStyle: { color: t.series[0] } },
          { name: '脂肪', value: fat, itemStyle: { color: t.series[1] } },
          { name: '蛋白质·矿物质等', value: other, itemStyle: { color: t.series[2] } },
        ],
      },
    ],
  }
}

function timeOption(t: ChartTheme, p: Profile) {
  const keys = Object.keys(TIME_LABELS) as (keyof TimeUse)[]
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), valueFormatter: (v: number) => `${v} 小时` },
    legend: { ...legendStyle(t), bottom: 0 },
    grid: { left: 8, right: 8, top: 8, bottom: 48, containLabel: true },
    xAxis: { type: 'value', max: 24, ...axisStyle(t), interval: 6, axisLabel: { ...axisStyle(t).axisLabel, formatter: '{value}h' } },
    yAxis: { type: 'category', data: [''], show: false },
    series: keys.map((k, i) => ({
      name: TIME_LABELS[k],
      type: 'bar',
      stack: 'day',
      barWidth: 28,
      data: [p.timeUse[k]],
      itemStyle: { color: t.series[i], borderColor: t.surface, borderWidth: 2 },
      label: { show: p.timeUse[k] >= 1.5, color: '#fff', fontSize: 10, formatter: `${TIME_LABELS[k]}` },
    })),
  }
}

function permaOption(t: ChartTheme, p: Profile) {
  const items = [
    ['P 积极情绪', p.perma.P],
    ['E 投入', p.perma.E],
    ['R 关系', p.perma.R],
    ['M 意义', p.perma.M],
    ['A 成就', p.perma.A],
    ['生活满意度', p.lifeSat],
  ] as const
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 32, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 0, max: 10, ...axisStyle(t) },
    yAxis: { type: 'category', inverse: true, data: items.map((i) => i[0]), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        data: items.map((i) => i[1]),
        itemStyle: { color: t.layer.L7, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: t.ink2, fontSize: 11 },
      },
    ],
  }
}
