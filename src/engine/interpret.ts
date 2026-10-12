import type { LayerId, Profile } from '../types'
import type { BodySnapshot } from './body'
import { BIG_FIVE_META } from '../data/instruments/bigfive'
import { BIG_FIVE_KEYS, traitPercentile, valueAxes, centeredValues } from './scoring'

/**
 * 规则式“解读”：把数字翻译成人话。每条规则都对应一个可追溯的阈值或常模。
 * 原则：描述而非评判；指出不确定性；给出可行动的信息时说明证据强度。
 */
export interface Reading {
  layer: LayerId
  level: 'good' | 'warning' | 'serious' | 'info'
  title: string
  text: string
  source?: string
}

export function interpret(p: Profile, body: BodySnapshot): Reading[] {
  const r: Reading[] = []

  // L0 / L2 身体
  const b = body.bmi
  if (b < 18.5) r.push({ layer: 'L2', level: 'warning', title: `BMI ${b.toFixed(1)}：偏瘦`, text: '偏瘦同样与较高死亡风险相关，尤其在老年人群中；肌肉量与营养状况值得关注。', source: 'psc2009' })
  else if (b < 24) r.push({ layer: 'L2', level: 'good', title: `BMI ${b.toFixed(1)}：正常范围`, text: 'BMI 不区分肌肉与脂肪；腰围（<身高的一半）是更好的补充指标。', source: 'psc2009' })
  else if (b < 28) r.push({ layer: 'L2', level: 'warning', title: `BMI ${b.toFixed(1)}：超重（中国标准）`, text: '超过 25 后每增加 5 个单位，全因死亡风险约升高 30%。适度减重 5–10% 即可显著改善代谢指标。', source: 'psc2009' })
  else r.push({ layer: 'L2', level: 'serious', title: `BMI ${b.toFixed(1)}：肥胖（中国标准）`, text: '肥胖是 2 型糖尿病、心血管病和多种癌症的主要风险因素；建议结合腰围、血压、血糖做专业评估。', source: 'psc2009' })

  if (p.restingHR > 80) r.push({ layer: 'L2', level: 'warning', title: `静息心率 ${p.restingHR} 次/分偏高`, text: '在控制体能后，静息心率偏高仍与死亡风险升高相关；规律有氧运动通常能使其下降。', source: 'jensen2013' })
  else if (p.restingHR < 60) r.push({ layer: 'L2', level: 'good', title: `静息心率 ${p.restingHR} 次/分`, text: '较低的静息心率通常反映良好的心肺适能（若伴随头晕乏力则需就医排查）。' })

  // L3 睡眠
  if (p.sleepHours < 6) r.push({ layer: 'L3', level: 'serious', title: `睡眠 ${p.sleepHours.toFixed(1)} 小时：明显不足`, text: '长期少于 6 小时与死亡风险、代谢紊乱、情绪与认知下降相关。睡眠规律性同样重要。', source: 'cappuccio2010' })
  else if (p.sleepHours < 7) r.push({ layer: 'L3', level: 'warning', title: `睡眠 ${p.sleepHours.toFixed(1)} 小时：略少于推荐`, text: '成人推荐每晚 ≥7 小时。', source: 'watson2015' })
  else if (p.sleepHours > 9) r.push({ layer: 'L3', level: 'warning', title: `睡眠 ${p.sleepHours.toFixed(1)} 小时：偏长`, text: '长睡眠与死亡风险的关联部分反映潜在疾病或抑郁，而非睡眠本身有害。', source: 'cappuccio2010' })
  else r.push({ layer: 'L3', level: 'good', title: `睡眠 ${p.sleepHours.toFixed(1)} 小时：在推荐范围内`, text: '下一步可以关注作息规律性——它对死亡风险的预测力可能强于时长。', source: 'windred2024' })

  // L5 行为
  if (p.smoking === 'current') r.push({ layer: 'L5', level: 'serious', title: '目前吸烟', text: '这是对寿命影响最大的单一可改变因素：吸烟者平均少活 ≥10 年，40 岁前戒烟可挽回约 90% 的损失，任何年龄戒烟都有收益。', source: 'jha2013' })
  if (p.exerciseMin < 150) r.push({ layer: 'L5', level: p.exerciseMin < 60 ? 'serious' : 'warning', title: `每周运动 ${p.exerciseMin} 分钟：未达 WHO 推荐`, text: '从完全不动到达到 150 分钟/周，全因死亡风险约下降 30%；剂量-反应曲线在起步阶段最陡——最小的改变收益最大。', source: 'arem2015' })
  else r.push({ layer: 'L5', level: 'good', title: `每周运动 ${p.exerciseMin} 分钟：达到推荐`, text: p.exerciseMin >= 300 ? '已在收益平台区（指南量的 2–5 倍）。' : '增加到 300 分钟/周仍有额外收益。', source: 'arem2015' })
  if (p.drinksPerWeek > 14) r.push({ layer: 'L5', level: 'warning', title: `每周饮酒 ${p.drinksPerWeek} 杯`, text: '最新荟萃分析不支持“少量饮酒有益”；超过约 25 g/天（女）或 45 g/天（男）时风险显著上升。', source: 'zhao2023' })

  // L4 人格：最突出的两项
  const sorted = BIG_FIVE_KEYS.map((k) => ({ k, pct: traitPercentile(k, p.bigFive[k]) })).sort((a, b) => Math.abs(b.pct - 50) - Math.abs(a.pct - 50))
  for (const { k, pct } of sorted.slice(0, 2)) {
    const m = BIG_FIVE_META[k]
    const high = pct >= 50
    r.push({
      layer: 'L4',
      level: 'info',
      title: `${m.name}约 P${Math.round(pct)}：${high ? '偏高' : '偏低'}`,
      text: `${high ? m.high : m.low}。这是相对近似常模的位置，不是好坏评价；每种人格倾向都有其适应性与代价。`,
    })
  }

  // L6 社会
  if (p.support <= 2 || p.loneliness >= 4)
    r.push({ layer: 'L6', level: 'serious', title: '社会联结偏弱', text: '孤独与社会隔离使死亡风险升高约 26–29%，影响量级可与吸烟相比。哪怕增加一段稳定的联系也有意义。', source: 'holtlunstad2015' })
  else if (p.support >= 4) r.push({ layer: 'L6', level: 'good', title: '社会支持充足', text: '社会关系强的人生存几率高约 50%——这是被低估的健康资产。', source: 'holtlunstad2010' })

  // L7 意义
  const ax = valueAxes(p.values)
  const top = centeredValues(p.values).sort((a, b) => b.centered - a.centered)
  r.push({
    layer: 'L7',
    level: 'info',
    title: `最看重：${top[0].name}、${top[1].name}`,
    text: `价值观取向偏${ax.openness >= 0 ? '“开放”（独立、新奇）' : '“保守”（安全、秩序、传统）'}，且偏${ax.transcendence >= 0 ? '“自我超越”（关怀他人与世界）' : '“自我提升”（成就与影响力）'}。价值冲突常常是内心张力的来源。`,
    source: 'schwartz1992',
  })
  if (p.purpose >= 6) r.push({ layer: 'L7', level: 'good', title: '目的感很强', text: '高目的感与较低的全因死亡和心血管事件风险相关（约 −17%），因果方向尚未确定。', source: 'cohen2016' })
  else if (p.purpose <= 3) r.push({ layer: 'L7', level: 'warning', title: '目的感较弱', text: '目的感是可以被培养的：它常来自贡献、关系与长期投入，而不只是“找到使命”。', source: 'cohen2016' })

  return r
}
