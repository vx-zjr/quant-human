import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw } from 'lucide-react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../components/chartStyle'
import { Button, Callout, Card, ChartCard, Cite, PageHeader, Section, Slider, Stat } from '../components/ui'
import { GENETIC_EVIDENCE, HORIZONS, INFORMATION_SCALE, PREDICTION_STUDIES } from '../data/predictability'
import { LYAPUNOV, predictionHorizon, simulatePair, type PairRun } from '../engine/chaos'
import { alpha, useChartTheme, type ChartTheme } from '../theme'

const T_MAX = 40
const DT = 0.005

export default function Limits() {
  const t = useChartTheme()
  const [exp, setExp] = useState(-8)
  const delta0 = 10 ** exp
  const run = useMemo(() => simulatePair(delta0, T_MAX, DT), [delta0])
  const [tNow, setTNow] = useState(0)

  const horizon = predictionHorizon(delta0, 1)
  const distOpt = useMemo(() => distanceOption(t, run, tNow, horizon), [t, run, tNow, horizon])
  const precisionOpt = useMemo(() => precisionOption(t), [t])
  const geneOpt = useMemo(() => geneticOption(t), [t])
  const studyOpt = useMemo(() => studiesOption(t), [t])
  const horizonOpt = useMemo(() => horizonsOption(t), [t])
  const infoOpt = useMemo(() => infoOption(t), [t])

  return (
    <div>
      <PageHeader
        kicker="边界 · Limits"
        title="为什么不可能预测一个人的“所有”"
        desc={
          <>
            1814 年拉普拉斯设想过一个“妖”：只要知道宇宙中每个粒子此刻的位置与速度，就能算出全部过去与未来 <Cite ids={['laplace1814']} />。
            这正是“解构、预测每一个人的所有”的终极形态。本页用可交互的方式说明：它在<strong className="text-ink">原理上</strong>不可达——不是因为数据不够多，而是因为至少五道墙。
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { n: '①', title: '混沌', desc: '确定性方程也会把微小误差指数放大' },
          { n: '②', title: '随机', desc: '分子涨落与发育噪声让“同样的起点”长出不同的人' },
          { n: '③', title: '信息', desc: '完整状态约需 10³⁰ bit，且测量会扰动被测者' },
          { n: '④', title: '反身', desc: '人会读到对自己的预测，并因此改变' },
          { n: '⑤', title: '第一人称', desc: '主观体验无法被第三人称数据完整读取' },
        ].map((x) => (
          <Card key={x.title}>
            <div className="text-2xl text-accent">{x.n}</div>
            <div className="mt-1 font-semibold text-ink">{x.title}之墙</div>
            <p className="mt-1 text-xs text-ink-2 leading-relaxed">{x.desc}</p>
          </Card>
        ))}
      </div>

      <Section
        title="① 混沌之墙：两个几乎一模一样的人"
        desc="洛伦兹系统只有三个变量、三条方程，没有任何随机性。我们让两条轨迹的初始值只相差 δ₀——可以把它们想象成两个出生时几乎完全相同的“你”。"
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <Card title="洛伦兹吸引子（x–z 投影）" subtitle="蓝 = 你 A · 橙 = 你 B（初值差 δ₀）">
            <LorenzCanvas run={run} t={t} onTime={setTNow} />
            <div className="mt-4">
              <Slider
                label="初始差异 δ₀（测量精度）"
                value={exp}
                min={-14}
                max={-1}
                onChange={setExp}
                format={(v) => `10^${v}`}
                hint="10⁻¹⁴ 大约相当于原子核尺度相对于米的比例"
              />
            </div>
          </Card>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="可预测地平线" value={horizon.toFixed(1)} unit="时间单位" sub={`误差从 10^${exp} 增长到 1 所需时间`} />
              <Stat label="精度每提高 10 倍" value={`+${(Math.log(10) / LYAPUNOV).toFixed(2)}`} unit="时间单位" sub={`λ ≈ ${LYAPUNOV}，指数代价，线性回报`} />
            </div>
            <ChartCard title="两条轨迹的距离（对数刻度）" subtitle="直线段 = 指数增长；平台 = 误差已与吸引子同样大，预测完全失效">
              <EChart option={distOpt} height={250} label="两条轨迹距离随时间的对数变化" />
            </ChartCard>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ChartCard title="测量精度 vs 预测地平线" subtitle="把测量精度提高一万亿倍，地平线只延长约 30 个时间单位">
            <EChart option={precisionOpt} height={240} label="测量精度与预测地平线的关系" />
          </ChartCard>
          <Callout tone="insight" title="这对“预测一个人”意味着什么">
            天气就是混沌系统：无论观测网多密，确定性天气预报的极限约两周 <Cite ids={['lorenz1963']} />。
            人的大脑、免疫系统、社会互动都包含大量非线性反馈。即使有一台完美的“人体模拟器”，初始测量的微小误差也会在数天到数年内（取决于尺度）淹没预测。
            <br />
            <br />
            此外，有些过程是<b>计算不可约</b>的：没有比“一步步模拟它”更快的捷径 <Cite ids={['wolfram2002']} />——要预测一个人 80 年，可能需要等价于“过完”这 80 年的计算。
          </Callout>
        </div>
      </Section>

      <Section
        title="② 随机之墙：同样的基因，同样的环境，不同的个体"
        desc="40 只基因完全相同的小鼠被放进同一个丰富环境中饲养 3 个月，它们的探索行为逐渐分化出稳定的个体差异——并且与海马体新生神经元数量相关。"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="克隆小鼠实验">
            <p className="text-sm text-ink-2 leading-relaxed">
              个体性在“基因 + 环境”都被控制后依然涌现 <Cite ids={['freund2013']} />。这是行为遗传学中 E（非共享环境）分量的实验证据：其中一大块是“噪声”。
            </p>
          </Card>
          <Card title="同卵双胞胎">
            <p className="text-sm text-ink-2 leading-relaxed">
              同卵双胞胎的人格相关约 0.4–0.5：基因完全相同、成长在同一个家，仍有一半以上的差异无法解释 <Cite ids={['vukasovic2015']} />。
            </p>
          </Card>
          <Card title="分子层面的偶然">
            <p className="text-sm text-ink-2 leading-relaxed">
              每个人带着约 70 个父母都没有的新突变出生，体细胞每年还在累积新突变 <Cite ids={['jonsson2017', 'blokzijl2016']} />。哪一个突变落在哪个细胞，本质上是随机的。
            </p>
          </Card>
        </div>
      </Section>

      <Section title="③ 信息之墙：完整描述一个人需要多少信息？" desc="对数刻度。每往右一格，信息量乘以 10。从“你的基因组”到“你的全部原子状态”，跨越了 20 个数量级。">
        <ChartCard
          title="信息尺度（log₁₀ bit）"
          table={{ columns: ['对象', 'log₁₀ bit', '说明'], rows: INFORMATION_SCALE.map((x) => [x.label, x.log10Bits, x.note]) }}
          footer={<Cite ids={INFORMATION_SCALE.flatMap((x) => (x.source ? [x.source] : []))} />}
        >
          <EChart option={infoOpt} height={320} label="信息尺度对数条形图" />
        </ChartCard>
        <p className="mt-3 text-sm text-ink-2 leading-relaxed max-w-3xl">
          即使只要“大脑的突触连接组”（~10¹⁶ bit），也比人类目前重建过的最大人脑样本（1 mm³）大约一百万倍；而读取它需要把大脑切成纳米薄片——<b className="text-ink">测量即毁灭</b>。
          对活人而言，我们只能用低分辨率的“投影”（问卷、血检、影像、行为日志）来近似。
        </p>
      </Section>

      <Section title="遗传的承诺与现实：“缺失的遗传度”" desc="双生子研究说“基因很重要”，但目前从 DNA 直接做个体预测，能解释的差异远低于这个上限。">
        <ChartCard
          title="双生子遗传度 vs SNP 遗传度 vs 多基因评分实际预测力"
          subtitle="三个点之间的距离 = 尚未被找到（或无法被找到）的信息"
          table={{ columns: ['性状', '双生子 h²', 'SNP h²', 'PGS R²', '说明'], rows: GENETIC_EVIDENCE.map((g) => [g.trait, g.twinH2, g.snpH2 ?? '—', g.pgsR2, g.note]) }}
          footer={<Cite ids={[...new Set(GENETIC_EVIDENCE.flatMap((g) => g.sources))]} />}
        >
          <EChart option={geneOpt} height={320} label="遗传度与多基因评分预测力的哑铃图" />
        </ChartCard>
      </Section>

      <Section title="真实世界：人到底有多可预测？" desc="日常行为极其规律，人生结局却很难预测。“脆弱家庭挑战”让 160 个团队用一个孩子从出生到 15 岁的近 1.3 万个变量做预测，最好的模型也只比简单基线好一点点。">
        <ChartCard
          title="不同目标的个体预测力"
          subtitle="不同研究的指标不同（R²、AUC、r），这里粗略映射到 0–1 仅用于排序；表格视图列出原始指标"
          table={{ columns: ['预测目标', '预测依据', '指标', '数值', '结论'], rows: PREDICTION_STUDIES.map((s) => [s.target, s.predictor, s.metric, s.value, s.takeaway]) }}
          footer={<Cite ids={[...new Set(PREDICTION_STUDIES.flatMap((s) => s.sources))]} />}
        >
          <EChart option={studyOpt} height={400} label="不同预测目标的可预测程度条形图" />
        </ChartCard>
        <div className="mt-4">
          <ChartCard title="预测地平线：可预测性随时间跨度衰减" subtitle="定性示意，基于文献的数量级判断；人格“排序”最稳定，人生事件几乎从一开始就难以预测">
            <EChart option={horizonOpt} height={300} label="不同领域可预测性随时间跨度的衰减曲线" />
          </ChartCard>
        </div>
      </Section>

      <Section
        title="④ 反身之墙：预测会改变被预测者"
        desc="天气不会读天气预报，但人会。一旦把预测告诉一个人，他的反应就成了系统的一部分。默顿称之为“自我实现的预言”；索罗斯称之为“反身性”；古德哈特定律说：指标一旦成为目标，就不再是好指标。"
      >
        <ReflexivityLab t={t} />
      </Section>

      <Section title="⑤ 第一人称之墙">
        <Callout tone="info" title="“成为你是什么感觉”">
          我们可以测量你看到红色时的脑活动、你说出“红色”的反应时、你对红色的偏好评分——但这些第三人称数据是否等同于你看到红色时的<b>感受本身</b>，是意识研究中的“困难问题”
          <Cite ids={['chalmers1995']} />。整合信息理论等尝试给意识一个数值（Φ），但目前既不可在人脑上计算，也存在激烈争议 <Cite ids={['tononi2004']} />。
          <br />
          这意味着：即使其他四道墙都被推倒，量化一个人仍会留下一个“从内部才能看到”的剩余。
        </Callout>
      </Section>
    </div>
  )
}

/* ------------------------------ 洛伦兹画布 ------------------------------ */

function LorenzCanvas({ run, t, onTime }: { run: PairRun; t: ChartTheme; onTime: (t: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(true)
  const [restartKey, setRestartKey] = useState(0)
  const idxRef = useRef(0)

  useEffect(() => {
    idxRef.current = 0
  }, [run, restartKey])

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf = 0
    let lastReport = 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const draw = () => {
      const dpr = window.devicePixelRatio || 1
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (canvas.width !== w * dpr) {
        canvas.width = w * dpr
        canvas.height = h * dpr
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const px = (x: number) => ((x + 25) / 50) * w
      const pz = (z: number) => h - ((z - 2) / 52) * h
      const n = idxRef.current
      const paint = (pts: PairRun['a'], color: string) => {
        const tail = 600
        ctx.lineWidth = 1
        ctx.strokeStyle = alpha(color, 0.18)
        ctx.beginPath()
        for (let i = 0; i <= Math.max(0, n - tail); i += 2) {
          const [x, , z] = pts[i]
          if (i === 0) ctx.moveTo(px(x), pz(z))
          else ctx.lineTo(px(x), pz(z))
        }
        ctx.stroke()
        ctx.lineWidth = 1.6
        ctx.strokeStyle = color
        ctx.beginPath()
        for (let i = Math.max(0, n - tail); i <= n; i++) {
          const [x, , z] = pts[i]
          if (i === Math.max(0, n - tail)) ctx.moveTo(px(x), pz(z))
          else ctx.lineTo(px(x), pz(z))
        }
        ctx.stroke()
        const [hx, , hz] = pts[n]
        ctx.fillStyle = color
        ctx.strokeStyle = t.surface
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(px(hx), pz(hz), 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
      }
      paint(run.b, t.series[1])
      paint(run.a, t.series[0])
      ctx.fillStyle = t.muted
      ctx.font = '11px system-ui'
      ctx.fillText(`t = ${run.t[n].toFixed(1)}`, 10, 18)
    }

    const tick = (now: number) => {
      if (playing) {
        idxRef.current = Math.min(run.a.length - 1, idxRef.current + (reduce ? 40 : 6))
        if (idxRef.current >= run.a.length - 1) setPlaying(false)
      }
      draw()
      if (now - lastReport > 120) {
        onTime(run.t[idxRef.current])
        lastReport = now
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, t, playing, onTime, restartKey])

  return (
    <div>
      <canvas ref={ref} className="h-72 w-full rounded-lg bg-surface-2/50" role="img" aria-label="洛伦兹吸引子上两条初值相近的轨迹逐渐分离的动画" />
      <div className="mt-2 flex gap-2">
        <Button onClick={() => setPlaying((p) => !p)}>
          {playing ? <Pause size={14} /> : <Play size={14} />}
          {playing ? '暂停' : '播放'}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setRestartKey((k) => k + 1)
            setPlaying(true)
          }}
        >
          <RotateCcw size={14} /> 重新开始
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------ 反身性实验室 ------------------------------ */

function ReflexivityLab({ t }: { t: ChartTheme }) {
  const [p0, setP0] = useState(0.3)
  const [beta, setBeta] = useState(-0.8)
  const q = (p: number) => Math.min(1, Math.max(0, p0 + beta * (p - 0.5)))
  const xs = Array.from({ length: 101 }, (_, i) => i / 100)
  const fixed: number[] = []
  for (let i = 0; i < xs.length - 1; i++) {
    const a = q(xs[i]) - xs[i]
    const b = q(xs[i + 1]) - xs[i + 1]
    if (a === 0) fixed.push(xs[i])
    else if (a * b < 0) fixed.push(xs[i] + (a / (a - b)) * 0.01)
  }
  if (Math.abs(q(1) - 1) < 1e-9) fixed.push(1)
  const option = {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', valueFormatter: (v: number) => `${Math.round(v * 100)}%` },
    legend: { ...legendStyle(t), top: 0, right: 0 },
    grid: { left: 8, right: 16, top: 34, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '公开宣布的预测', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
    yAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '实际发生概率', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
    series: [
      { name: '预测 = 结果（自洽线）', type: 'line', data: [[0, 0], [1, 1]], showSymbol: false, lineStyle: { color: t.muted, width: 1.5 }, itemStyle: { color: t.muted } },
      {
        name: '人对预测的反应',
        type: 'line',
        data: xs.map((x) => [x, q(x)]),
        showSymbol: false,
        lineStyle: { color: t.series[0], width: 2.5 },
        itemStyle: { color: t.series[0] },
        markPoint: {
          symbol: 'circle',
          symbolSize: 12,
          itemStyle: { color: t.series[1], borderColor: t.surface, borderWidth: 2 },
          label: { show: true, position: 'top', color: t.ink, formatter: (p: { value: number }) => `${Math.round(p.value * 100)}%` },
          data: fixed.map((f) => ({ coord: [f, f], value: f })),
        },
      },
    ],
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <Card title="反身性实验室" subtitle="一个人得知“你有 x% 的可能会……”后，会怎样反应？">
        <div className="grid gap-4">
          <Slider label="不告诉他时的基础概率 p₀" value={p0} min={0} max={1} step={0.01} onChange={setP0} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider
            label="反应系数 β"
            value={beta}
            min={-1.5}
            max={1.5}
            step={0.05}
            onChange={setBeta}
            format={(v) => v.toFixed(2)}
            hint="β<0：逆反（“你说我做不到？我偏要做到”）；β>0：顺从（“既然注定失败，何必努力”）"
          />
        </div>
        <div className="mt-4 rounded-lg bg-surface-2 p-3 text-sm text-ink-2 leading-relaxed">
          {fixed.length === 0 && '没有自洽的预测：无论宣布什么，结果都会偏离它。'}
          {fixed.length === 1 && (
            <>
              唯一“说出来仍然正确”的预测是 <b className="text-ink">{Math.round(fixed[0] * 100)}%</b>
              {Math.abs(fixed[0] - p0) > 0.02 ? `，它不同于不公开时的 ${Math.round(p0 * 100)}%——公开预测本身改变了答案。` : '。'}
            </>
          )}
          {fixed.length > 1 && (
            <>
              存在 <b className="text-ink">{fixed.length}</b> 个自洽预测（{fixed.map((f) => `${Math.round(f * 100)}%`).join('、')}）：
              强烈的顺从反应让“预言”可以自我实现——宣布哪个，哪个就会成真。
            </>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          <Cite ids={['merton1948', 'soros1987', 'goodhart1975']} />
        </p>
      </Card>
      <ChartCard title="预测 → 反应 → 结果" subtitle="橙点 = 自洽预测（公开后仍然正确的预测），即反应曲线与对角线的交点">
        <EChart option={option} height={320} label="反身性：公开预测与实际结果的关系" />
      </ChartCard>
    </div>
  )
}

/* ------------------------------ 图表配置 ------------------------------ */

function distanceOption(t: ChartTheme, run: PairRun, tNow: number, horizon: number) {
  const step = 10
  const data: [number, number][] = []
  for (let i = 0; i < run.t.length; i += step) data.push([run.t[i], run.logDist[i]])
  const start = run.logDist[0]
  return {
    ...baseText(t),
    animation: false,
    tooltip: { ...tooltipStyle(t), trigger: 'axis', valueFormatter: (v: number) => `10^${v.toFixed(1)}` },
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 0, max: T_MAX, ...axisStyle(t), name: 't' },
    yAxis: { type: 'value', min: Math.floor(start) - 1, max: 2, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `10^${v}` } },
    series: [
      {
        name: '距离',
        type: 'line',
        data,
        showSymbol: false,
        lineStyle: { color: t.series[0], width: 1.5 },
        itemStyle: { color: t.series[0] },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { xAxis: Math.min(tNow, T_MAX), lineStyle: { color: t.ink, width: 1, type: 'solid' }, label: { show: false } },
            { xAxis: Math.min(horizon, T_MAX), lineStyle: { color: t.series[1], width: 1.5, type: 'solid' }, label: { formatter: '地平线', color: t.ink2 } },
            { yAxis: 0, lineStyle: { color: t.axis, type: 'solid' }, label: { formatter: '误差 = 1', color: t.muted, position: 'insideStartTop' } },
          ],
        },
      },
    ],
  }
}

function precisionOption(t: ChartTheme) {
  const pts = Array.from({ length: 15 }, (_, i) => -(i + 1)).map((e) => [e, predictionHorizon(10 ** e, 1)])
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', formatter: (it: { value: number[] }[]) => `精度 10^${it[0].value[0]}<br/>地平线 ${it[0].value[1].toFixed(1)}` },
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    xAxis: { type: 'value', inverse: true, min: -15, max: -1, ...axisStyle(t), name: '初始误差', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `10^${v}` } },
    yAxis: { type: 'value', ...axisStyle(t), name: '地平线' },
    series: [{ type: 'line', data: pts, symbol: 'circle', symbolSize: 8, lineStyle: { color: t.series[0], width: 2 }, itemStyle: { color: t.series[0], borderColor: t.surface, borderWidth: 2 } }],
  }
}

function geneticOption(t: ChartTheme) {
  const traits = GENETIC_EVIDENCE.map((g) => g.trait)
  const mk = (name: string, vals: (number | undefined)[], color: string, symbol: string) => ({
    name,
    type: 'scatter',
    symbol,
    symbolSize: 12,
    data: vals.map((v, i) => [v ?? null, traits[i]]),
    itemStyle: { color, borderColor: t.surface, borderWidth: 2 },
    z: 3,
  })
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => `${Math.round(v * 100)}%` },
    legend: { ...legendStyle(t), top: 0, right: 0, data: ['双生子遗传度', 'SNP 遗传度', 'PGS 实际预测力'] },
    grid: { left: 8, right: 24, top: 36, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` }, name: '可解释方差' },
    yAxis: { type: 'category', inverse: true, data: traits, ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
    series: [
      {
        name: '差距',
        type: 'bar',
        stack: 'gap',
        silent: true,
        data: GENETIC_EVIDENCE.map((g) => g.pgsR2),
        itemStyle: { color: 'transparent' },
        barWidth: 3,
        tooltip: { show: false },
      },
      {
        name: '缺失',
        type: 'bar',
        stack: 'gap',
        silent: true,
        data: GENETIC_EVIDENCE.map((g) => g.twinH2 - g.pgsR2),
        itemStyle: { color: t.axis },
        barWidth: 3,
        tooltip: { show: false },
      },
      mk('双生子遗传度', GENETIC_EVIDENCE.map((g) => g.twinH2), t.series[0], 'circle'),
      mk('SNP 遗传度', GENETIC_EVIDENCE.map((g) => g.snpH2), t.series[2], 'diamond'),
      mk('PGS 实际预测力', GENETIC_EVIDENCE.map((g) => g.pgsR2), t.series[1], 'rect'),
    ],
  }
}

function studiesOption(t: ChartTheme) {
  const sorted = [...PREDICTION_STUDIES].sort((a, b) => b.normalized - a.normalized)
  return {
    ...baseText(t),
    tooltip: {
      ...tooltipStyle(t),
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items: { dataIndex: number }[]) => {
        const s = sorted[items[0].dataIndex]
        return `<b>${s.target}</b><br/>依据：${s.predictor}<br/>${s.metric}：${s.value}<br/><span style="opacity:.75">${s.takeaway}</span>`
      },
      extraCssText: `${tooltipStyle(t).extraCssText}max-width:320px;white-space:normal;`,
    },
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t) },
    yAxis: { type: 'category', inverse: true, data: sorted.map((s) => s.target), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2, width: 170, overflow: 'truncate' } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        data: sorted.map((s) => ({ value: s.normalized, itemStyle: { color: s.id === 'divorce' ? t.axis : t.series[0], borderRadius: [0, 4, 4, 0] } })),
        label: { show: true, position: 'right', color: t.ink2, fontSize: 10, formatter: (p: { dataIndex: number }) => `${sorted[p.dataIndex].metric.slice(0, 6)} ${sorted[p.dataIndex].value}` },
      },
    ],
  }
}

function horizonsOption(t: ChartTheme) {
  return {
    ...baseText(t),
    tooltip: { ...tooltipStyle(t), trigger: 'axis', valueFormatter: (v: number) => `${Math.round(v * 100)}%` },
    legend: { ...legendStyle(t), top: 0, left: 0 },
    grid: { left: 8, right: 16, top: 44, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: HORIZONS.ticks, boundaryGap: false, ...axisStyle(t), name: '时间跨度' },
    yAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
    series: HORIZONS.series.map((s, i) => ({
      name: s.name,
      type: 'line',
      data: s.values,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { color: t.series[i], width: 2 },
      itemStyle: { color: t.series[i], borderColor: t.surface, borderWidth: 2 },
    })),
  }
}

function infoOption(t: ChartTheme) {
  const sorted = [...INFORMATION_SCALE].sort((a, b) => a.log10Bits - b.log10Bits)
  return {
    ...baseText(t),
    tooltip: {
      ...tooltipStyle(t),
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (items: { dataIndex: number }[]) => {
        const s = sorted[items[0].dataIndex]
        return `<b>${s.label}</b><br/>约 10^${s.log10Bits} bit<br/><span style="opacity:.75">${s.note}</span>`
      },
    },
    grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
    xAxis: { type: 'value', min: 0, max: 48, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `10^${v}` } },
    yAxis: { type: 'category', data: sorted.map((s) => s.label), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
    series: [
      {
        type: 'bar',
        barWidth: 12,
        data: sorted.map((s) => s.log10Bits),
        itemStyle: { color: t.layer.L0, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: t.ink2, fontSize: 10, formatter: (p: { value: number }) => `10^${p.value}` },
      },
    ],
  }
}
