import { useEffect, useMemo, useState } from 'react'
import { Dices, RotateCcw } from 'lucide-react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../components/chartStyle'
import { Button, Callout, Card, ChartCard, Cite, PageHeader, Section, Segmented, Slider, Stat } from '../components/ui'
import { ageOf, bmi } from '../engine/body'
import {
  IDEAL_INPUTS,
  combinedHR,
  riskFactors,
  riskInputsFromProfile,
  summarize,
  type RiskInputs,
  type SurvivalSummary,
} from '../engine/mortality'
import { traitZ } from '../engine/scoring'
import { simulateLives, type Band, type SampleLife, type SimResult } from '../engine/simulate'
import { useActiveProfile } from '../store/profileStore'
import { alpha, useChartTheme, type ChartTheme } from '../theme'
import type { Profile, Smoking } from '../types'

type Scenario = Pick<Profile, 'exerciseMin' | 'smoking' | 'sleepHours' | 'weightKg' | 'drinksPerWeek' | 'support' | 'diet' | 'purpose'>

const pickScenario = (p: Profile): Scenario => ({
  exerciseMin: p.exerciseMin,
  smoking: p.smoking,
  sleepHours: p.sleepHours,
  weightKg: p.weightKg,
  drinksPerWeek: p.drinksPerWeek,
  support: p.support,
  diet: p.diet,
  purpose: p.purpose,
})

export default function Future() {
  const t = useChartTheme()
  const p = useActiveProfile()
  const age = ageOf(p)
  const cZ = traitZ('C', p.bigFive.C)
  const [sc, setSc] = useState<Scenario>(() => pickScenario(p))
  const [runs, setRuns] = useState<'300' | '1000' | '3000'>('1000')
  const [seed, setSeed] = useState(20261012)

  useEffect(() => setSc(pickScenario(p)), [p])

  const base = useMemo(() => {
    const inputs = riskInputsFromProfile(p, cZ)
    const hr = combinedHR(inputs)
    return { inputs, hr, summary: summarize(p.sex, age, hr), factors: riskFactors(inputs) }
  }, [p, cZ, age])

  const scenarioProfile = useMemo(() => ({ ...p, ...sc }), [p, sc])
  const scen = useMemo(() => {
    const inputs = riskInputsFromProfile(scenarioProfile, cZ)
    const hr = combinedHR(inputs)
    return { inputs, hr, summary: summarize(p.sex, age, hr) }
  }, [scenarioProfile, cZ, p.sex, age])

  const pop = useMemo(() => summarize(p.sex, age, 1), [p.sex, age])
  const ideal = useMemo(() => summarize(p.sex, age, combinedHR(IDEAL_INPUTS(p.sex))), [p.sex, age])

  /** 每个因素单独调到理想水平能多活几年 */
  const levers = useMemo(() => {
    const ideals = IDEAL_INPUTS(p.sex)
    return base.factors
      .map((f) => {
        const alt: RiskInputs = { ...base.inputs, [f.key]: ideals[f.key] }
        const gain = summarize(p.sex, age, combinedHR(alt)).remainingLE - base.summary.remainingLE
        return { ...f, gain }
      })
      .sort((a, b) => b.gain - a.gain)
  }, [base, p.sex, age])

  const sim = useMemo(() => simulateLives(scenarioProfile, { runs: Number(runs), seed }), [scenarioProfile, runs, seed])

  const changed = JSON.stringify(sc) !== JSON.stringify(pickScenario(p))
  const survivalOpt = useMemo(() => survivalOption(t, base.summary, changed ? scen.summary : null, pop, ideal), [t, base.summary, scen.summary, pop, ideal, changed])
  const leverOpt = useMemo(() => leverOption(t, levers), [t, levers])
  const deathOpt = useMemo(() => deathHistOption(t, sim), [t, sim])

  return (
    <div>
      <PageHeader
        kicker="未来 · Predict"
        title="未来不是一个点，而是一片概率云"
        desc={
          <>
            这里有两类模型：<b className="text-ink">生存分析</b>（Gompertz–Makeham 生命表 × 风险比，回答“大概能活多久”），和
            <b className="text-ink">蒙特卡洛人生模拟</b>（同一个起点抽样上千次，回答“人生会如何发散”）。二者都是透明的教学模型，参数与公式全部公开在
            <code className="mx-1 text-xs">src/engine/</code>中。
          </>
        }
      />

      <Section title="寿命：分布，而不是答案" desc={`基于中国人群生命表校准（出生预期寿命 男 76.3 / 女 81.8 岁），再按 ${base.factors.length} 个风险因素调整。综合风险比 HR = ${base.hr.toFixed(2)}（1 = 人群典型）。`}>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Stat label="预期寿命（均值）" value={base.summary.expectedDeathAge.toFixed(1)} unit="岁" sub={`剩余约 ${base.summary.remainingLE.toFixed(1)} 年`} accent={t.series[0]} />
          <Stat label="80% 区间" value={`${base.summary.p10DeathAge.toFixed(0)}–${base.summary.p90DeathAge.toFixed(0)}`} unit="岁" sub="10% 的人早于下限，10% 晚于上限" accent={t.series[0]} />
          <Stat label="综合风险比 HR" value={base.hr.toFixed(2)} sub={base.hr < 1 ? '低于人群典型' : '高于人群典型'} accent={t.series[0]} />
          <Stat
            label="存活到…的概率"
            value={base.summary.survive.length ? `${Math.round(base.summary.survive[Math.min(1, base.summary.survive.length - 1)].p * 100)}%` : '—'}
            sub={base.summary.survive.map((s) => `${s.age}岁 ${Math.round(s.p * 100)}%`).join(' · ')}
            accent={t.series[0]}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <ChartCard
            title="生存曲线：从现在起活到每个年龄的概率"
            subtitle="灰 = 同龄人群典型 · 蓝 = 当前 · 橙 = 你的情景 · 绿 = 全部理想生活方式"
            table={{
              columns: ['年龄', '人群典型', '当前', ...(changed ? ['情景'] : []), '理想'],
              rows: base.summary.curve
                .filter((c) => c.age % 5 === 0)
                .map((c) => {
                  const f = (s: SurvivalSummary) => `${Math.round((s.curve.find((x) => x.age === c.age)?.s ?? 0) * 100)}%`
                  return [c.age, f(pop), f(base.summary), ...(changed ? [f(scen.summary)] : []), f(ideal)]
                }),
            }}
            footer={<Cite ids={['gompertz1825', 'nhc2024']} />}
          >
            <EChart option={survivalOpt} height={340} label="生存曲线" />
          </ChartCard>
          <Card title="情景：如果改变生活方式？" subtitle="拖动滑块，实时比较。模型只捕捉统计关联，不保证个人因果效应。">
            <div className="grid gap-3.5">
              <Slider label="每周运动" value={sc.exerciseMin} min={0} max={900} step={10} onChange={(v) => setSc({ ...sc, exerciseMin: v })} format={(v) => `${v} 分钟`} />
              <div>
                <div className="text-sm text-ink-2 mb-1.5">吸烟</div>
                <Segmented<Smoking>
                  size="sm"
                  options={[
                    { value: 'never', label: '从不' },
                    { value: 'former', label: '已戒' },
                    { value: 'current', label: '吸烟' },
                  ]}
                  value={sc.smoking}
                  onChange={(v) => setSc({ ...sc, smoking: v })}
                />
              </div>
              <Slider label="睡眠" value={sc.sleepHours} min={4} max={11} step={0.1} onChange={(v) => setSc({ ...sc, sleepHours: v })} format={(v) => `${v.toFixed(1)} h`} />
              <Slider label="体重" value={sc.weightKg} min={35} max={150} step={0.5} onChange={(v) => setSc({ ...sc, weightKg: v })} format={(v) => `${v} kg · BMI ${bmi(p.heightCm, v).toFixed(1)}`} />
              <Slider label="每周饮酒" value={sc.drinksPerWeek} min={0} max={42} onChange={(v) => setSc({ ...sc, drinksPerWeek: v })} format={(v) => `${v} 杯`} />
              <Slider label="社会支持" value={sc.support} min={1} max={5} onChange={(v) => setSc({ ...sc, support: v })} format={(v) => `${v}/5`} />
              <Slider label="饮食质量" value={sc.diet} min={1} max={5} onChange={(v) => setSc({ ...sc, diet: v })} format={(v) => `${v}/5`} />
              <Slider label="目的感" value={sc.purpose} min={1} max={7} onChange={(v) => setSc({ ...sc, purpose: v })} format={(v) => `${v}/7`} />
            </div>
            <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-ink-2">情景预期寿命</span>
                <span className="text-lg font-semibold text-ink tnum">{scen.summary.expectedDeathAge.toFixed(1)} 岁</span>
              </div>
              <div className="flex items-baseline justify-between text-xs mt-1">
                <span className="text-muted">与当前相比</span>
                <span className="tnum text-ink">
                  {scen.summary.expectedDeathAge - base.summary.expectedDeathAge >= 0 ? '+' : ''}
                  {(scen.summary.expectedDeathAge - base.summary.expectedDeathAge).toFixed(1)} 年 · HR {scen.hr.toFixed(2)}
                </span>
              </div>
            </div>
            <Button variant="ghost" className="mt-2" onClick={() => setSc(pickScenario(p))} disabled={!changed}>
              <RotateCcw size={14} /> 恢复当前值
            </Button>
          </Card>
        </div>
      </Section>

      <Section title="最值得改变的事" desc="把每个因素单独调到理想水平（其余不变），模型预期寿命能增加多少年。排序比绝对值更可靠。">
        <ChartCard
          title="单因素杠杆：预期寿命增益（年）"
          subtitle="基于观察性研究的风险比，含混杂；多个因素合并时已做 0.7 倍收缩"
          table={{ columns: ['因素', '当前', '风险比', '理想', '增益（年）', '证据'], rows: levers.map((l) => [l.label, l.value, l.hr.toFixed(2), l.ideal, l.gain.toFixed(2), l.evidence]) }}
          footer={<Cite ids={[...new Set(levers.map((l) => l.source))]} />}
        >
          <EChart option={leverOpt} height={320} label="各风险因素调整到理想水平后的寿命增益" />
        </ChartCard>
      </Section>

      <Section
        title="平行人生：蒙特卡洛模拟"
        desc="同一个人、同样的起点（含上方情景设置），让随机事件——伴侣、孩子、失业、疾病、丧亲、意外之喜——按年龄依赖的概率发生，重复上千次。阴影带展示人生如何从一个点发散成一片。"
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Segmented
            size="sm"
            options={[
              { value: '300', label: '300 次' },
              { value: '1000', label: '1000 次' },
              { value: '3000', label: '3000 次' },
            ]}
            value={runs}
            onChange={setRuns}
          />
          <Button onClick={() => setSeed((s) => (s * 1103515245 + 12345) % 2147483647)}>
            <Dices size={14} /> 重新抽样
          </Button>
          <span className="text-xs text-muted">随机种子 {seed}</span>
        </div>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
          <Stat label="模拟中位寿命" value={sim.stats.medianDeath.toFixed(1)} unit="岁" />
          <Stat label="至少一次重大疾病" value={`${Math.round(sim.stats.pIllness * 100)}%`} sub={`平均 ${sim.stats.meanIllnesses.toFixed(1)} 次`} />
          <Stat label="经历离婚/分手" value={`${Math.round(sim.stats.pDivorce * 100)}%`} />
          <Stat label="经历伴侣离世" value={`${Math.round(sim.stats.pWidowed * 100)}%`} />
          <Stat label="经历失业" value={`${Math.round(sim.stats.pUnemployed * 100)}%`} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <FanCard title="健康指数" unit="0–100" bands={sim.health} color={t.layer.L2} t={t} />
          <FanCard title="幸福感" unit="0–10" bands={sim.wellbeing} color={t.layer.L7} t={t} />
          <FanCard title="收入百分位" unit="P1–P99" bands={sim.wealth} color={t.layer.L6} t={t} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <ChartCard title="死亡年龄分布" subtitle={`${runs} 次模拟 · 每 2 岁一组`} table={{ columns: ['年龄组', '次数'], rows: sim.deathHist.map((d) => [`${d.age}–${d.age + 1}`, d.count]) }}>
            <EChart option={deathOpt} height={260} label="模拟死亡年龄直方图" />
          </ChartCard>
          <Card title="三段平行人生（抽样）" subtitle="同样的人，不同的运气。曲线为幸福感轨迹。">
            <div className="grid gap-3 md:grid-cols-3">
              {sim.samples.map((s, i) => (
                <SampleCard key={i} s={s} idx={i} />
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section title="这些预测有多可信？">
        <div className="grid gap-3 md:grid-cols-2">
          <Callout tone="warn" title="模型的局限（必须读）">
            <ul className="list-disc pl-4 space-y-1">
              <li>风险比来自观察性研究，混杂难以完全排除（健康的人更可能运动，而不只是运动让人健康）。</li>
              <li>生命表是“当期”的：它假设未来医疗水平不变，而历史上预期寿命每十年增长约 2–3 年。</li>
              <li>事件概率为数量级示意，尚未按中国人群逐项校准（见 ROADMAP）。</li>
              <li>未纳入家族史、慢病史、血检、基因与收入等强预测因子。</li>
            </ul>
          </Callout>
          <Callout tone="insight" title="正确的读法">
            把这里的数字当作“和你相似的一万个人的统计分布”，而不是你的命运。对个人最有用的不是那个预期寿命，而是<b>杠杆排序</b>：哪些可改变的因素对你影响最大。
            好的预测应当被检验——去“预测账本”记录你对自己的预测，看看自己有多准。
          </Callout>
        </div>
      </Section>
    </div>
  )
}

/* ------------------------------ 子组件 ------------------------------ */

function FanCard({ title, unit, bands, color, t }: { title: string; unit: string; bands: Band[]; color: string; t: ChartTheme }) {
  const option = useMemo(() => fanOption(t, bands, color), [t, bands, color])
  return (
    <ChartCard
      title={title}
      subtitle={`${unit} · 深色带 = 中间 50%，浅色带 = 中间 80%，线 = 中位数`}
      table={{ columns: ['年龄', 'P10', 'P25', 'P50', 'P75', 'P90', '存活样本'], rows: bands.filter((b) => b.age % 5 === 0).map((b) => [b.age, b.p10.toFixed(1), b.p25.toFixed(1), b.p50.toFixed(1), b.p75.toFixed(1), b.p90.toFixed(1), b.n]) }}
    >
      <EChart option={option} height={220} label={`${title}的模拟分布扇形图`} />
    </ChartCard>
  )
}

const KIND_COLOR: Record<string, string> = {
  family: 'var(--l0)',
  health: 'var(--l7)',
  career: 'var(--l3)',
  loss: 'var(--muted)',
  luck: 'var(--l2)',
  move: 'var(--l6)',
}

function SampleCard({ s, idx }: { s: SampleLife; idx: number }) {
  const w = 200
  const h = 44
  const ages = s.ages
  const min = ages[0]
  const max = Math.max(ages[ages.length - 1], min + 1)
  const path = s.wellbeing.map((v, i) => `${i ? 'L' : 'M'}${(((ages[i] - min) / (max - min)) * w).toFixed(1)},${(h - (v / 10) * h).toFixed(1)}`).join(' ')
  return (
    <div className="rounded-lg bg-surface-2/60 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-ink">人生 #{idx + 1}</span>
        <span className="text-xs text-muted">享年 {Math.floor(s.deathAge)} 岁</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-11 w-full" preserveAspectRatio="none" aria-hidden>
        <path d={path} fill="none" stroke="var(--l7)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
      </svg>
      <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto pr-1 text-xs">
        {s.events.map((e, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-8 shrink-0 text-muted tnum">{e.age}</span>
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: KIND_COLOR[e.kind] }} />
            <span className="text-ink-2">{e.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ------------------------------ 图表配置 ------------------------------ */

function survivalOption(t: ChartTheme, you: SurvivalSummary, scen: SurvivalSummary | null, pop: SurvivalSummary, ideal: SurvivalSummary) {
  const line = (name: string, s: SurvivalSummary, color: string, width = 2, area = false) => ({
    name,
    type: 'line',
    showSymbol: false,
    smooth: false,
    data: s.curve.map((c) => [c.age, c.s]),
    lineStyle: { color, width },
    itemStyle: { color },
    ...(area ? { areaStyle: { color: alpha(color, 0.08) } } : {}),
    endLabel: { show: false },
  })
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', valueFormatter: (v: number) => `${Math.round(v * 100)}%` },
    legend: { ...legendStyle(t), top: 0, right: 0 },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: Math.floor(you.age), max: 110, ...axisStyle(t), name: '年龄' },
    yAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
    series: [
      line('同龄人群典型', pop, t.muted, 1.5),
      {
        ...line('当前的你', you, t.series[0], 2.5, true),
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: t.axis, type: 'solid' },
          label: { show: true, color: t.muted, formatter: '50%', position: 'insideStartTop' },
          data: [{ yAxis: 0.5 }],
        },
      },
      ...(scen ? [line('你的情景', scen, t.series[1], 2)] : []),
      line('全部理想生活方式', ideal, t.series[2], 1.5),
    ],
  }
}

function leverOption(t: ChartTheme, levers: { label: string; gain: number; value: string }[]) {
  return {
    ...baseText(t),
    tooltip: {
      ...tooltipStyle(t),
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items: { dataIndex: number }[]) => {
        const l = levers[items[0].dataIndex]
        return `<b>${l.label}</b>（当前 ${l.value}）<br/>调到理想水平：${l.gain >= 0 ? '+' : ''}${l.gain.toFixed(2)} 年`
      },
    },
    grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', ...axisStyle(t), name: '年', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v > 0 ? '+' : ''}${v}` } },
    yAxis: { type: 'category', inverse: true, data: levers.map((l) => l.label), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        data: levers.map((l) => ({ value: Number(l.gain.toFixed(2)), itemStyle: { color: l.gain >= 0.05 ? t.series[0] : t.axis, borderRadius: [0, 4, 4, 0] } })),
        label: { show: true, position: 'right', color: t.ink2, fontSize: 11, formatter: (p: { value: number }) => (Math.abs(p.value) < 0.05 ? '≈0' : `+${p.value.toFixed(1)}`) },
      },
    ],
  }
}

function fanOption(t: ChartTheme, bands: Band[], color: string) {
  const x = bands.map((b) => b.age)
  const stackBand = (name: string, lo: number[], hi: number[], a: number, stack: string) => [
    { name: `${name}-base`, type: 'line', data: lo.map((v, i) => [x[i], v]), stack, lineStyle: { opacity: 0 }, showSymbol: false, silent: true, tooltip: { show: false } },
    {
      name,
      type: 'line',
      data: hi.map((v, i) => [x[i], v - lo[i]]),
      stack,
      lineStyle: { opacity: 0 },
      showSymbol: false,
      areaStyle: { color: alpha(color, a) },
      silent: true,
      tooltip: { show: false },
    },
  ]
  return {
    ...baseText(t),
    tooltip: {
      ...tooltipStyle(t),
      trigger: 'axis',
      formatter: (items: { dataIndex: number }[]) => {
        const b = bands[items[0]?.dataIndex ?? 0]
        return b ? `<b>${b.age} 岁</b><br/>中位 ${b.p50.toFixed(1)}<br/>50% 区间 ${b.p25.toFixed(1)}–${b.p75.toFixed(1)}<br/>80% 区间 ${b.p10.toFixed(1)}–${b.p90.toFixed(1)}<br/><span style="opacity:.7">存活样本 ${b.n}</span>` : ''
      },
    },
    grid: { left: 4, right: 12, top: 12, bottom: 4, containLabel: true },
    xAxis: { type: 'value', min: x[0], max: x[x.length - 1], ...axisStyle(t) },
    yAxis: { type: 'value', scale: true, ...axisStyle(t) },
    series: [
      ...stackBand('80%', bands.map((b) => b.p10), bands.map((b) => b.p90), 0.14, 'outer'),
      ...stackBand('50%', bands.map((b) => b.p25), bands.map((b) => b.p75), 0.26, 'inner'),
      { name: '中位数', type: 'line', data: bands.map((b) => [b.age, b.p50]), showSymbol: false, lineStyle: { color, width: 2 }, itemStyle: { color } },
    ],
  }
}

function deathHistOption(t: ChartTheme, sim: SimResult) {
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 8, right: 8, top: 16, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: sim.deathHist.map((d) => d.age), ...axisStyle(t), splitLine: { show: false }, name: '岁' },
    yAxis: { type: 'value', ...axisStyle(t), name: '次数' },
    series: [
      {
        type: 'bar',
        data: sim.deathHist.map((d) => d.count),
        barCategoryGap: '12%',
        itemStyle: { color: t.series[0], borderRadius: [3, 3, 0, 0] },
      },
    ],
  }
}
