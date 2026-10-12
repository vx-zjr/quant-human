import { useMemo } from 'react'
import { PREDICTOR_EVIDENCE } from '../../data/behaviors'
import { useChartTheme } from '../../theme'
import { EChart } from '../EChart'
import { axisStyle, baseText, tooltipStyle } from '../chartStyle'
import { Callout, Card, ChartCard, Cite } from '../ui'

/** 预测具体行为靠什么：证据等级 + 模型公式 */
export function EvidencePanel() {
  const t = useChartTheme()
  const option = useMemo(
    () => ({
      ...baseText(t),
      tooltip: {
        ...tooltipStyle(t),
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (items: { dataIndex: number }[]) => {
          const e = PREDICTOR_EVIDENCE[items[0].dataIndex]
          return `<b>${e.label}</b><br/>r ≈ ${e.r}（解释约 ${Math.round(e.r ** 2 * 100)}% 的差异）<br/><span style="opacity:.75">${e.note}</span>`
        },
        extraCssText: `${tooltipStyle(t).extraCssText}max-width:300px;white-space:normal;`,
      },
      grid: { left: 8, right: 48, top: 8, bottom: 8, containLabel: true },
      xAxis: { type: 'value', min: 0, max: 0.7, ...axisStyle(t), name: 'r' },
      yAxis: { type: 'category', inverse: true, data: PREDICTOR_EVIDENCE.map((e) => e.label), ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.ink2 } },
      series: [
        {
          type: 'bar',
          barWidth: 12,
          data: PREDICTOR_EVIDENCE.map((e, i) => ({ value: e.r, itemStyle: { color: i === PREDICTOR_EVIDENCE.length - 1 ? t.axis : t.series[0], borderRadius: [0, 4, 4, 0] } })),
          label: { show: true, position: 'right', color: t.ink2, fontSize: 11, formatter: (p: { value: number }) => `r≈${p.value}` },
        },
      ],
    }),
    [t],
  )
  return (
    <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
      <ChartCard
        title="不同信息对“单次具体行为”的预测力"
        subtitle="灰色一项是“聚合行为”，用于对照：特质擅长预测“一般会怎样”，不擅长预测“这一次”"
        table={{ columns: ['信息来源', 'r', '说明'], rows: PREDICTOR_EVIDENCE.map((e) => [e.label, e.r, e.note]) }}
        footer={<Cite ids={[...new Set(PREDICTOR_EVIDENCE.flatMap((e) => e.sources))]} />}
      >
        <EChart option={option} height={250} label="不同信息来源对单次行为的预测力" />
      </ChartCard>
      <Card title="本页的模型" subtitle="个人贝叶斯逻辑回归——每个人一个模型，每件事一个模型">
        <div className="rounded-lg bg-surface-2 px-3 py-2 font-mono text-sm text-ink">logit P(做) = w₀ + Σ wₖ·情境ₖ</div>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-2">
          <li>
            <b className="text-ink">起点 w₀</b>：人群基础率 + 你的人格（权重已按单次行为减半）
          </li>
          <li>
            <b className="text-ink">情境 wₖ</b>：惯性、意图、计划、周末、缺觉、压力、有人在场、新起点日
          </li>
          <li>
            <b className="text-ink">学习</b>：你每记录一天，后验就更新一次；记录越多，你自己的证据越压过人群与人格
          </li>
          <li>
            <b className="text-ink">输出</b>：概率 + 80% 可信区间，而不是“会/不会”
          </li>
        </ul>
        <div className="mt-3">
          <Callout tone="warn" title="刻意没有纳入的东西">
            “意志力耗竭”（自我损耗）曾被广泛用于解释行为失败，但在 23 个实验室的预注册重复中效应接近于零 <Cite ids={['hagger2016']} />，因此不作为预测因子。
          </Callout>
        </div>
      </Card>
    </div>
  )
}
