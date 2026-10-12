import { useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, legendStyle, tooltipStyle } from '../components/chartStyle'
import { Callout, Card, ChartCard, Cite, Meter, PageHeader, Section, Stat } from '../components/ui'
import { DIMENSIONS, dimensionsByLayer } from '../data/dimensions'
import { LAYERS } from '../data/layers'
import { FRAMEWORKS } from '../data/frameworks'
import { SOURCE_LIST } from '../data/sources'
import { cn, sci } from '../engine/stats'
import { useAnalysis } from '../hooks/useAnalysis'
import { href, navigate } from '../router'
import { useActiveProfile } from '../store/profileStore'
import { useChartTheme } from '../theme'
import type { LayerId } from '../types'

const VERBS = [
  { verb: '解构', en: 'Deconstruct', q: '由哪些部分组成？', method: '本体论 / 分类学：八层模型 × 120+ 维度', to: '/atlas' },
  { verb: '解读', en: 'Interpret', q: '在人群中处于什么位置？', method: '测量 + 常模：百分位、z 分数、生物年龄', to: '/present' },
  { verb: '解释', en: 'Explain', q: '为什么会这样？', method: '因果与方差分解：基因 × 环境 × 偶然', to: '/past' },
  { verb: '解析', en: 'Analyze', q: '各部分如何相互作用？', method: '系统动力学：反馈、耦合、混沌', to: '/limits' },
  { verb: '预测', en: 'Predict', q: '接下来会怎样？', method: '概率预测：生存分析、蒙特卡洛、校准', to: '/future' },
]

const TENSES = [
  { t: '过去', d: '重建：信息随时间耗散，记忆是重构而非录像', to: '/past' },
  { t: '现在', d: '测量：每一次测量都有误差、成本与观察者效应', to: '/present' },
  { t: '未来', d: '预测：只能给出分布，且分布随时间变宽', to: '/future' },
]

export default function Overview() {
  const t = useChartTheme()
  const [sel, setSel] = useState<LayerId>('L4')
  const layer = LAYERS.find((l) => l.id === sel)!
  const profile = useActiveProfile()
  const { body, lived, survival } = useAnalysis(profile)
  const heartbeats = lived.find((x) => x.key === 'heartbeats')!.value

  const gapOption = useMemo(
    () => ({
      ...baseText(t),
      tooltip: { ...tooltipStyle(t), trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v: number) => `${Math.round(v * 100)}%` },
      legend: { ...legendStyle(t), top: 0, right: 0 },
      grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
      xAxis: { type: 'value', max: 1, ...axisStyle(t), axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
      yAxis: {
        type: 'category',
        inverse: true,
        data: LAYERS.map((l) => `${l.id} ${l.name}`),
        ...axisStyle(t),
        splitLine: { show: false },
        axisLabel: { color: t.ink2, fontSize: 12 },
      },
      series: [
        {
          name: '可量化程度',
          type: 'bar',
          data: LAYERS.map((l) => l.quantifiability),
          itemStyle: { color: t.series[0], borderRadius: [0, 4, 4, 0] },
          barWidth: 9,
          barGap: '40%',
        },
        {
          name: '可预测程度',
          type: 'bar',
          data: LAYERS.map((l) => l.predictability),
          itemStyle: { color: t.series[1], borderRadius: [0, 4, 4, 0] },
          barWidth: 9,
        },
      ],
    }),
    [t],
  )

  return (
    <div>
      <PageHeader
        kicker="Quantified Human Atlas · v0.1"
        title="把一个人量化到什么程度？"
        desc={
          <>
            这是一个持续迭代的探索项目：尽可能把“人”从物质到意义拆成可测量的维度，看清哪些部分能被解构、解读、解释、解析与预测——
            同时诚实地标出<strong className="text-ink">哪里是科学的边界</strong>。核心结论先说：
            <span className="text-ink">人在统计上高度可预测，在个体上深刻不确定。</span>
          </>
        }
      />

      {/* 核心方程 */}
      <Card className="overflow-hidden">
        <div className="grid gap-6 md:grid-cols-[1.1fr_1fr] md:items-center">
          <div>
            <div className="text-xs text-muted mb-2">本项目的工作模型</div>
            <div className="font-mono text-lg md:text-2xl text-ink tracking-wide">
              H(t) = F( G, E<sub className="text-sm">0→t</sub>, H(t−1), ε ; R )
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-ink-2">
              <li>
                <b className="text-ink font-mono">H(t)</b> 人在时刻 t 的状态向量：八层、120+ 维
              </li>
              <li>
                <b className="text-ink font-mono">G</b> 基因组（出厂代码，几乎不变）
              </li>
              <li>
                <b className="text-ink font-mono">E</b> 暴露史：营养、家庭、文化、时代、空气、关系……
              </li>
              <li>
                <b className="text-ink font-mono">H(t−1)</b> 路径依赖：你的过去塑造你的现在
              </li>
              <li>
                <b className="text-ink font-mono">ε</b> 不可约的随机性：发育噪声、分子涨落、混沌放大、运气
              </li>
              <li>
                <b className="text-ink font-mono">R</b> 反身性：人会读到关于自己的预测并因此改变
              </li>
            </ul>
          </div>
          <Callout tone="insight" title="为什么不可能“算尽一个人”">
            即使 F 完全已知，<b>ε</b> 与 <b>R</b> 也让个体轨迹在原理上无法精确预测：同卵双胞胎、甚至在同一环境中长大的克隆小鼠，都会发展出各自的个性
            <Cite ids={['freund2013']} />。量化的正确目标不是“预言”，而是<b>校准良好的概率分布</b>——像天气预报那样。
          </Callout>
        </div>
      </Card>

      {/* 五个动词 */}
      <Section title="五个动词 × 三个时态" desc="你的五个要求（解构、解读、解释、解析、预测）对应五类不同的方法；它们作用于过去、现在、未来时，难度完全不同。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {VERBS.map((v, i) => (
            <a key={v.verb} href={href(v.to)} className="group rounded-xl border border-line bg-surface p-4 hover:border-line-strong">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted tnum">0{i + 1}</span>
                <ArrowRight size={14} className="text-muted group-hover:text-accent transition-colors" />
              </div>
              <div className="mt-2 text-lg font-semibold text-ink">{v.verb}</div>
              <div className="text-[11px] text-muted">{v.en}</div>
              <div className="mt-2 text-sm text-ink">{v.q}</div>
              <div className="mt-1 text-xs text-ink-2 leading-relaxed">{v.method}</div>
            </a>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {TENSES.map((x) => (
            <a key={x.t} href={href(x.to)} className="rounded-xl border border-line bg-surface-2/50 px-4 py-3 hover:border-line-strong">
              <span className="font-semibold text-ink">{x.t}</span>
              <span className="ml-2 text-xs text-ink-2">{x.d}</span>
            </a>
          ))}
        </div>
      </Section>

      {/* 八层模型 */}
      <Section title="八层模型：从原子到意义" desc="每一层都从下一层涌现，却不能被下一层完全替代。点击圆环或列表查看各层。">
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <Card className="flex flex-col items-center">
            <LayerRings sel={sel} onSelect={setSel} />
            <div className="mt-2 w-full space-y-0.5">
              {[...LAYERS].reverse().map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSel(l.id)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-sm ${sel === l.id ? 'bg-surface-3 text-ink' : 'text-ink-2 hover:bg-surface-2'}`}
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(--${l.id.toLowerCase()})` }} />
                  <span className="w-6 text-xs text-muted tnum">{l.id}</span>
                  <span className="flex-1">{l.name}</span>
                  <span className="text-[11px] text-muted tnum">{dimensionsByLayer(l.id).length} 维</span>
                </button>
              ))}
            </div>
          </Card>
          <Card>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="h-3 w-3 rounded-full self-center" style={{ background: `var(--${layer.id.toLowerCase()})` }} />
              <h3 className="text-xl font-semibold text-ink">
                {layer.id} · {layer.name}
              </h3>
              <span className="text-sm text-muted">{layer.en}</span>
            </div>
            <p className="mt-2 text-[15px] text-ink">{layer.question}</p>
            <p className="mt-3 text-sm text-ink-2 leading-relaxed">{layer.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {layer.headline.map((h) => (
                <div key={h.label} className="rounded-lg bg-surface-2 p-3">
                  <div className="text-xl font-semibold text-ink">{h.value}</div>
                  <div className="text-xs text-ink-2 mt-0.5">{h.label}</div>
                  {h.source && (
                    <div className="mt-1">
                      <Cite ids={[h.source]} />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted mb-1">可量化程度</div>
                <Meter value={layer.quantifiability} color={t.series[0]} label={`${Math.round(layer.quantifiability * 100)}%`} />
                <div className="text-xs text-muted mt-3 mb-1">可预测程度</div>
                <Meter value={layer.predictability} color={t.series[1]} label={`${Math.round(layer.predictability * 100)}%`} />
              </div>
              <div className="text-sm text-ink-2 space-y-1">
                <div>
                  <span className="text-muted">时间尺度：</span>
                  {layer.timescale}
                </div>
                <div>
                  <span className="text-muted">相关学科：</span>
                  {layer.disciplines.join('、')}
                </div>
                <button onClick={() => navigate('/atlas', { layer: layer.id })} className="mt-2 inline-flex items-center gap-1 text-accent hover:underline">
                  查看该层全部 {dimensionsByLayer(layer.id).length} 个维度 <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </Section>

      <Section title="量化能力与预测能力的鸿沟" desc="越往上层，测量越依赖自我报告，预测越依赖情境与偶然。两条曲线之间的差距，就是“知道很多却算不准”的空间。">
        <ChartCard
          title="各层可量化程度 vs 可预测程度"
          subtitle="本项目综合评估（0–100%），推理过程见“看法与建议”"
          table={{ columns: ['层', '可量化', '可预测'], rows: LAYERS.map((l) => [`${l.id} ${l.name}`, `${l.quantifiability * 100}%`, `${l.predictability * 100}%`]) }}
        >
          <EChart option={gapOption} height={340} label="八层的可量化程度与可预测程度对比条形图" />
        </ChartCard>
      </Section>

      <Section title={`以「${profile.name}」为例`} desc="切换右上角的人物（在“个体”各页面中），所有数字随之重新计算。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="构成你的原子" value={sci(body.atoms)} unit="个" sub="其中约 62% 是氢原子" accent={t.layer.L0} />
          <Stat label="你的人体细胞" value={cn(body.cells)} unit="个" sub={`另有约 ${cn(body.bacteria)} 个共生细菌`} accent={t.layer.L2} />
          <Stat label="已经跳过的心跳" value={cn(heartbeats)} unit="次" sub="按年龄分段积分估算" accent={t.layer.L2} />
          <Stat
            label="模型预期寿命"
            value={survival.summary.expectedDeathAge.toFixed(1)}
            unit="岁"
            sub={`80% 区间 ${survival.summary.p10DeathAge.toFixed(0)}–${survival.summary.p90DeathAge.toFixed(0)} 岁`}
            accent={t.layer.L6}
          />
        </div>
      </Section>

      <Section title="项目规模">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <Stat label="量化维度" value={DIMENSIONS.length} unit="个" sub="横跨 8 层、40+ 子领域" />
          <Stat label="理论框架" value={FRAMEWORKS.length} unit="个" sub="含实证强度评级与批评" />
          <Stat label="文献来源" value={SOURCE_LIST.length} unit="条" sub="每个硬数字可追溯" />
          <Stat label="迭代方式" value="AGENT.md" sub="由智能体按协议持续扩展" />
        </div>
      </Section>
    </div>
  )
}

/** 同心圆八层示意：L0 在中心，L7 在最外层 */
function LayerRings({ sel, onSelect }: { sel: LayerId; onSelect: (id: LayerId) => void }) {
  const size = 240
  const c = size / 2
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="group" aria-label="八层同心圆模型">
      {LAYERS.map((l, i) => {
        const r = 18 + i * 13.5
        const active = sel === l.id
        return (
          <circle
            key={l.id}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={`var(--${l.id.toLowerCase()})`}
            strokeWidth={active ? 10 : 6}
            strokeOpacity={active ? 1 : 0.45}
            style={{ cursor: 'pointer', transition: 'all .25s' }}
            onClick={() => onSelect(l.id)}
            tabIndex={0}
            role="button"
            aria-label={`${l.id} ${l.name}`}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(l.id)}
          >
            <title>{`${l.id} ${l.name}`}</title>
          </circle>
        )
      })}
      <text x={c} y={c + 4} textAnchor="middle" fontSize="10" fill="var(--muted)">
        原子
      </text>
    </svg>
  )
}
