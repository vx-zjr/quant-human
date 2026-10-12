import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../components/chartStyle'
import { Callout, Card, ChartCard, Cite, PageHeader, Section, Status } from '../components/ui'
import { ACE_DATA } from '../data/predictability'
import { BIO_MILESTONES, ERIKSON_STAGES } from '../data/instruments/lifeEvents'
import { stressByAge, stressLevel } from '../engine/scoring'
import { cn } from '../engine/stats'
import { useAnalysis } from '../hooks/useAnalysis'
import { navigate } from '../router'
import { useActiveProfile } from '../store/profileStore'
import { alpha, useChartTheme, type ChartTheme } from '../theme'
import type { Profile } from '../types'

/** 身体各部分的“年龄”：细胞平均寿命（天）。 */
const CELL_AGES: { part: string; days: number | 'age' | 'age+'; note: string; source?: string }[] = [
  { part: '中性粒细胞', days: 1, note: '血液中仅存活数小时到数天', source: 'sender2021' },
  { part: '肠上皮细胞', days: 4, note: '每 3–5 天整体更新一次', source: 'sender2021' },
  { part: '表皮细胞', days: 30, note: '约 2–4 周从基底层推到表面脱落' },
  { part: '红细胞', days: 120, note: '约 120 天，占每日细胞更新量的大头', source: 'sender2021' },
  { part: '肝细胞', days: 900, note: '约 1–3 年' },
  { part: '脂肪细胞', days: 3650, note: '每年约更新 10%，平均约 10 岁', source: 'spalding2008' },
  { part: '骨骼（重塑）', days: 3650, note: '整副骨骼约每 10 年重塑一遍' },
  { part: '心肌细胞', days: 'age', note: '25 岁时每年约更新 1%，75 岁时降至 0.45%，大部分与你同龄', source: 'bergmann2009' },
  { part: '大脑皮层神经元', days: 'age', note: '与你同龄——它们记录了你的一生', source: 'spalding2005' },
  { part: '眼晶状体核心', days: 'age+', note: '在你出生前就已形成，比你还“老”' },
]

export default function Past() {
  const t = useChartTheme()
  const p = useActiveProfile()
  const { body, lived } = useAnalysis(p)
  const age = body.age

  const timeline = useMemo(() => timelineOption(t, p, age), [t, p, age])
  const ace = useMemo(() => aceOption(t), [t])
  const cellAge = useMemo(() => cellAgeOption(t, age), [t, age])
  const yearly = stressByAge(p.events, age)
  const peak = yearly.reduce((m, r) => (r.lcu > m.lcu ? r : m), { age: 0, lcu: 0, events: [] as Profile['events'] })

  return (
    <div>
      <PageHeader
        kicker="过去 · Deconstruct & Explain"
        title="你是如何成为你的"
        desc={
          <>
            过去是唯一“已经确定”的时态，却也是最难完整重建的：信息在时间中耗散，记忆在每次回忆时被改写
            <Cite ids={['loftus1974', 'talarico2003']} />。这里从三个角度解构过去：你经历了多少（里程表）、发生了什么（时间轴）、是什么塑造了你（方差分解）。
          </>
        }
      />

      <Section title="人生里程表" desc={`「${p.name}」从出生到此刻累积的物理与生理量。数字正在实时增长。`}>
        <Odometer lived={lived} restingHR={p.restingHR} />
      </Section>

      <Section title="人生时间轴" desc="背景色带是埃里克森心理社会发展阶段；柱子是生活事件的再适应负荷（LCU）。Holmes–Rahe 认为单年超过 300 分时患病风险显著升高——这一结论来自 1960 年代，后续研究显示关联存在但远弱于最初宣称。">
        <ChartCard
          title="发展阶段 × 生活事件负荷"
          subtitle={peak.lcu > 0 ? `负荷最高的一年：${peak.age} 岁（${peak.lcu} LCU，${peak.events.map((e) => e.label).join('、')}）` : '尚无事件记录'}
          table={{ columns: ['年龄', '事件', 'LCU', '效价'], rows: p.events.map((e) => [e.age, e.label, e.lcu, e.valence > 0 ? '正向' : e.valence < 0 ? '负向' : '中性']) }}
          footer={
            <span className="inline-flex flex-wrap gap-x-4 gap-y-1">
              {peak.lcu > 0 && (
                <Status level={stressLevel(peak.lcu).level}>
                  峰值年负荷：{stressLevel(peak.lcu).label}（{peak.lcu}）
                </Status>
              )}
              <button className="text-accent hover:underline" onClick={() => navigate('/profile')}>
                去“个人画像 → 人生事件”添加或修改 →
              </button>
            </span>
          }
        >
          <EChart option={timeline} height={360} label="人生时间轴：发展阶段与生活事件负荷" />
        </ChartCard>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {BIO_MILESTONES.filter((m) => m.age <= Math.max(age, 30) + 20).map((m) => (
            <div key={m.label} className={`rounded-lg border border-line px-3 py-2 text-xs ${m.age <= age ? 'bg-surface text-ink-2' : 'bg-transparent text-muted'}`}>
              <span className="font-semibold text-ink tnum">{m.age} 岁</span> · {m.label}
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="是什么塑造了你：基因 × 家庭 × 其余一切"
        desc="行为遗传学用双生子研究把人群中的个体差异分解为三部分。注意：这是“人群差异的来源”，不能回答“你身上有百分之几来自基因”——对单个人而言，基因与环境是乘法式纠缠的，无法相加拆分。"
      >
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <ChartCard
            title="ACE 方差分解"
            subtitle="A 加性遗传 · C 共享环境（让兄弟姐妹相似）· E 非共享环境 + 随机 + 测量误差"
            table={{ columns: ['性状', 'A', 'C', 'E', '备注'], rows: ACE_DATA.map((a) => [a.trait, a.A, a.C, a.E, a.note]) }}
            footer={<Cite ids={[...new Set(ACE_DATA.flatMap((a) => a.sources))]} />}
          >
            <EChart option={ace} height={380} label="各性状的遗传、共享环境、非共享环境方差占比" />
          </ChartCard>
          <div className="space-y-3">
            <Callout tone="insight" title="三个反直觉的发现">
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>
                  <b className="text-ink">共享环境出奇地小。</b>对大多数心理特质，一起长大的兄弟姐妹并不比分开长大的更像——“同一个家”对不同孩子其实是不同的环境。
                </li>
                <li>
                  <b className="text-ink">遗传度随年龄上升。</b>智力的遗传度从童年约 40% 升到青年期约 66%：人越长大，越能主动选择与基因倾向匹配的环境。
                </li>
                <li>
                  <b className="text-ink">最大的一块是“E”。</b>它包含独特经历、发育中的随机噪声与测量误差——这正是个体最难预测的部分。
                </li>
              </ol>
            </Callout>
            <Callout tone="warn" title="遗传度 ≠ 宿命">
              遗传度依赖于环境的变异范围：营养普遍充足时身高遗传度更高；教育机会更平等时，学业成绩的遗传度反而上升。高遗传度的性状仍可被干预（例如近视、苯丙酮尿症）。
              <Cite ids={['turkheimer2000']} />
            </Callout>
          </div>
        </div>
      </Section>

      <Section title="你身体里的“年龄层”" desc={`你不是一个统一年龄的物体：有的细胞只活了几天，有的与你同龄。按细胞平均寿命估算，你体内大部分细胞比 ${age.toFixed(0)} 岁的你年轻得多。`}>
        <ChartCard
          title="各组织细胞的典型寿命（对数刻度）"
          subtitle="竖线 = 你的实际年龄"
          table={{
            columns: ['组织', '典型寿命', '说明'],
            rows: CELL_AGES.map((c) => [c.part, typeof c.days === 'number' ? fmtDays(c.days) : c.days === 'age' ? '≈ 你的年龄' : '> 你的年龄', c.note]),
          }}
          footer={<Cite ids={['spalding2005', 'spalding2008', 'bergmann2009', 'sender2021']} />}
        >
          <EChart option={cellAge} height={360} label="各组织细胞寿命对比" />
        </ChartCard>
      </Section>

      <Section title="为什么过去也无法完整重建">
        <div className="grid gap-3 md:grid-cols-3">
          <Card title="信息耗散">
            <p className="text-sm text-ink-2 leading-relaxed">
              热力学第二定律意味着过去的细节会被不可逆地“抹平”。擦除 1 bit 信息至少耗散 kT·ln2 的能量 <Cite ids={['landauer1961']} />
              ——宇宙在不断擦除关于你过去的记录。
            </p>
          </Card>
          <Card title="记忆是重构">
            <p className="text-sm text-ink-2 leading-relaxed">
              问“撞毁”还是“碰到”，会改变目击者对车速的回忆；“闪光灯记忆”随时间显著失真，但当事人的自信丝毫不减 <Cite ids={['loftus1974', 'talarico2003']} />。
            </p>
          </Card>
          <Card title="叙事会重写意义">
            <p className="text-sm text-ink-2 leading-relaxed">
              同一段经历可以被讲成“救赎”或“污染”故事，而讲法本身与心理健康相关 <Cite ids={['mcadams2013']} />。过去的“意义”并没有被固定下来。
            </p>
          </Card>
        </div>
      </Section>
    </div>
  )
}

function fmtDays(d: number) {
  if (d < 60) return `${d} 天`
  if (d < 730) return `${Math.round(d / 30)} 个月`
  return `${(d / 365).toFixed(0)} 年`
}

/* ------------------------------ 里程表 ------------------------------ */

function Odometer({ lived, restingHR }: { lived: ReturnType<typeof useAnalysis>['lived']; restingHR: number }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const t0 = performance.now()
    const id = window.setInterval(() => setElapsed((performance.now() - t0) / 1000), 120)
    return () => window.clearInterval(id)
  }, [lived])

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {lived.map((q) => {
        const v = q.value + q.perSecond * elapsed
        return (
          <div key={q.key} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              {q.key === 'heartbeats' && (
                <Heart size={12} className="qh-heartbeat text-critical" style={{ animationDuration: `${60 / (restingHR + 10)}s` }} aria-hidden />
              )}
              {q.label}
            </div>
            <div className={`mt-1 font-semibold text-ink tnum break-all ${v >= 1e15 ? 'text-base' : 'text-lg'}`}>
              {Math.floor(v).toLocaleString('en-US')} <span className="text-xs font-normal text-muted">{q.unit}</span>
            </div>
            <div className="mt-1 text-[11px] text-ink-2 leading-relaxed">
              {q.compare ?? `≈ ${cn(v)}`} · {q.note}
              {q.source && (
                <>
                  {' '}
                  <Cite ids={[q.source]} />
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------ 图表 ------------------------------ */

function timelineOption(t: ChartTheme, p: Profile, age: number) {
  const maxAge = Math.max(85, Math.ceil(age) + 10)
  const ages = Array.from({ length: maxAge + 1 }, (_, i) => i)
  const by = (pred: (v: number) => boolean) => ages.map((a) => p.events.filter((e) => Math.floor(e.age) === a && pred(e.valence)).reduce((s, e) => s + e.lcu, 0) || null)
  const pos = t.series[0]
  const neg = t.series[7]
  return {
    ...baseText(t),
    tooltip: {
      ...tooltipStyle(t),
      trigger: 'axis',
      formatter: (items: { axisValue: string }[]) => {
        const a = Number(items[0]?.axisValue)
        const stage = ERIKSON_STAGES.find((s) => a >= s.from && a < s.to)
        const evs = p.events.filter((e) => Math.floor(e.age) === a)
        return `<b>${a} 岁</b>${stage ? `<br/><span style="opacity:.7">${stage.name}</span>` : ''}${evs.map((e) => `<br/>• ${e.label}（${e.lcu}）`).join('')}`
      },
    },
    legend: { ...legendStyle(t), top: 0, right: 0, data: ['正向事件', '中性事件', '负向事件'] },
    grid: { left: 8, right: 16, top: 56, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: ages, ...axisStyle(t), name: '年龄', axisLabel: { ...axisStyle(t).axisLabel, interval: 9 } },
    yAxis: { type: 'value', ...axisStyle(t), name: 'LCU' },
    series: [
      {
        name: '正向事件',
        type: 'bar',
        stack: 'e',
        data: by((v) => v > 0),
        itemStyle: { color: pos, borderRadius: [2, 2, 0, 0] },
        barMaxWidth: 10,
        markArea: {
          silent: true,
          data: ERIKSON_STAGES.filter((s) => s.from < maxAge).map((s, i) => [
            {
              xAxis: s.from,
              itemStyle: { color: i % 2 ? alpha(t.ink, 0.03) : alpha(t.ink, 0.07) },
              label: { show: s.to - s.from >= 5, position: 'insideTop', color: t.muted, fontSize: 10, formatter: s.name.replace(' vs ', '\nvs ') },
            },
            { xAxis: Math.min(s.to, maxAge) },
          ]),
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { xAxis: Math.floor(age), lineStyle: { color: t.ink, width: 1.5, type: 'solid' }, label: { formatter: '现在', color: t.ink, position: 'end' } },
          ],
        },
      },
      { name: '中性事件', type: 'bar', stack: 'e', data: by((v) => v === 0), itemStyle: { color: t.muted }, barMaxWidth: 10 },
      { name: '负向事件', type: 'bar', stack: 'e', data: by((v) => v < 0), itemStyle: { color: neg, borderRadius: [2, 2, 0, 0] }, barMaxWidth: 10 },
    ],
  }
}

function aceOption(t: ChartTheme) {
  const names = { A: '加性遗传 A', C: '共享环境 C', E: '非共享环境 E' }
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => `${Math.round(v * 100)}%` },
    legend: { ...legendStyle(t), top: 0, left: 0 },
    grid: { left: 8, right: 16, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'value', max: 1, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
    yAxis: { type: 'category', inverse: true, data: ACE_DATA.map((a) => a.trait), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
    series: (['A', 'C', 'E'] as const).map((k, i) => ({
      name: names[k],
      type: 'bar',
      stack: 'ace',
      barWidth: 16,
      data: ACE_DATA.map((a) => a[k]),
      itemStyle: { color: t.series[i], borderColor: t.surface, borderWidth: 2 },
      label: {
        show: true,
        color: '#fff',
        fontSize: 10,
        formatter: (p: { value: number }) => (p.value >= 0.12 ? `${Math.round(p.value * 100)}%` : ''),
      },
    })),
  }
}

function cellAgeOption(t: ChartTheme, age: number) {
  const ageDays = Math.max(age, 0.5) * 365.25
  const vals = CELL_AGES.map((c) => (c.days === 'age' ? ageDays : c.days === 'age+' ? ageDays + 180 : c.days))
  return {
    ...baseText(t),
    tooltip: {
      ...tooltipStyle(t),
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items: { dataIndex: number }[]) => {
        const c = CELL_AGES[items[0].dataIndex]
        return `<b>${c.part}</b><br/>${c.note}`
      },
    },
    grid: { left: 8, right: 24, top: 16, bottom: 8, containLabel: true },
    xAxis: {
      type: 'log',
      min: 0.2,
      max: Math.max(ageDays * 1.6, 40000),
      ...axisStyle(t),
      axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => (v < 365 ? `${v}天` : `${Math.round(v / 365)}年`) },
    },
    yAxis: { type: 'category', inverse: true, data: CELL_AGES.map((c) => c.part), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
    series: [
      {
        type: 'bar',
        data: vals,
        barWidth: 10,
        itemStyle: { color: t.series[2], borderRadius: [0, 4, 4, 0] },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [{ xAxis: ageDays, lineStyle: { color: t.ink, width: 1.5, type: 'solid' }, label: { formatter: `你 ${age.toFixed(0)} 岁`, color: t.ink } }],
        },
      },
    ],
  }
}
