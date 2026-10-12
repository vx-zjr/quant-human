import type { Layer, LayerId } from '../types'

/**
 * 八层模型（L0 → L7）：每一层都“涌现”自下一层，但不能被下一层完全替代。
 * quantifiability / predictability 是本项目的综合主观评估（0..1），推理见 Insights 页。
 */
export const LAYERS: Layer[] = [
  {
    id: 'L0',
    name: '物质·能量',
    en: 'Matter & Energy',
    question: '你由什么构成？消耗多少能量？',
    timescale: '飞秒 → 一生',
    disciplines: ['物理学', '化学', '热力学', '信息论'],
    quantifiability: 0.95,
    predictability: 0.85,
    summary:
      '从物理学看，一个人是约 7×10²⁷ 个原子组成的开放耗散系统：持续吸收低熵能量（食物、氧气），排出高熵废热。宏观量（质量、能耗、体温）极易测量，但完整微观状态在原理上不可测。',
    headline: [
      { value: '~7×10²⁷', label: '个原子（70 kg）', source: 'icrp1975' },
      { value: '~80 W', label: '静息代谢功率', source: 'mifflin1990' },
      { value: '~10⁴⁵ bit', label: '信息容量理论上界', source: 'bekenstein1981' },
    ],
  },
  {
    id: 'L1',
    name: '分子·基因',
    en: 'Molecular & Genomic',
    question: '你的出厂代码是什么？运行时如何被调控？',
    timescale: '毫秒 → 世代',
    disciplines: ['基因组学', '表观遗传学', '蛋白质组学', '代谢组学', '微生物组学'],
    quantifiability: 0.9,
    predictability: 0.55,
    summary:
      '基因组几乎可以被完整读出，但“读出”≠“读懂”：绝大多数复杂性状由成千上万个微效变异共同决定，再经表观调控、蛋白互作、代谢与共生微生物层层放大或缓冲。',
    headline: [
      { value: '31 亿', label: '碱基对（单倍体）', source: 'nurk2022' },
      { value: '400–500 万', label: '个体与参考基因组差异位点', source: 'kgp2015' },
      { value: '~3.8×10¹³', label: '共生细菌（与人体细胞同数量级）', source: 'sender2016' },
    ],
  },
  {
    id: 'L2',
    name: '细胞·生理',
    en: 'Cellular & Physiological',
    question: '你的身体机器运转得如何？老化到哪一步了？',
    timescale: '秒 → 数十年',
    disciplines: ['生理学', '临床医学', '运动科学', '老年医学'],
    quantifiability: 0.85,
    predictability: 0.6,
    summary:
      '生理层是现代医学量化得最成熟的一层：生命体征、血液指标、体成分、体能都有标准化测量与常模。它也是寿命预测的主要信息来源。',
    headline: [
      { value: '~30 万亿', label: '人体细胞（其中约 84% 是红细胞）', source: 'sender2016' },
      { value: '~3300 亿', label: '个细胞/天被替换', source: 'sender2021' },
      { value: '~29 亿', label: '次心跳/一生（70 次/分 × 78 年）' },
    ],
  },
  {
    id: 'L3',
    name: '神经·认知',
    en: 'Neural & Cognitive',
    question: '你的大脑怎样处理信息？能力边界在哪里？',
    timescale: '毫秒 → 数十年',
    disciplines: ['神经科学', '认知心理学', '心理测量学', '睡眠医学'],
    quantifiability: 0.6,
    predictability: 0.45,
    summary:
      '认知能力是心理测量学中信度最高的领域之一（智力测验重测信度可达 0.9）。但大脑的完整状态——每个突触的强度与连接——目前只在 1 mm³ 人脑组织上被完整重建过。',
    headline: [
      { value: '860 亿', label: '神经元', source: 'azevedo2009' },
      { value: '10¹⁴–10¹⁵', label: '突触', source: 'pakkenberg2003' },
      { value: '~10 bit/s', label: '有意识行为的信息吞吐量', source: 'zheng2025' },
    ],
  },
  {
    id: 'L4',
    name: '心理·人格',
    en: 'Psychological',
    question: '你是怎样的人？倾向如何感受、思考与行动？',
    timescale: '分钟 → 一生',
    disciplines: ['人格心理学', '情绪科学', '临床心理学', '行为遗传学'],
    quantifiability: 0.5,
    predictability: 0.4,
    summary:
      '人格可以用少数几个维度（大五 / HEXACO）概括，且成年后相当稳定。但这些分数是“潜变量”——依赖自我报告，信息量有限，对单个事件的预测力通常只有 r≈0.1–0.3。',
    headline: [
      { value: '5–6', label: '个主要人格维度', source: 'ashton2007' },
      { value: '~40%', label: '人格差异可归于遗传', source: 'vukasovic2015' },
      { value: '~0.7', label: '50 岁后人格排序稳定性', source: 'roberts2000' },
    ],
  },
  {
    id: 'L5',
    name: '行为·习惯',
    en: 'Behavioral',
    question: '你实际上在做什么？时间与注意力流向哪里？',
    timescale: '秒 → 数年',
    disciplines: ['行为科学', '计算社会科学', '流行病学', '行为经济学'],
    quantifiability: 0.8,
    predictability: 0.65,
    summary:
      '在数字时代，行为是被记录得最密集的一层：手机传感器、支付记录、搜索与社交数据。日常行为高度规律、短期高度可预测——这既是量化的机会，也是隐私的风险。',
    headline: [
      { value: '93%', label: '日常位置可预测性上限', source: 'song2010' },
      { value: '~66 天', label: '形成习惯（中位数，18–254 天）', source: 'lally2010' },
      { value: '~16,000', label: '词/天（平均说话量）', source: 'mehl2007' },
    ],
  },
  {
    id: 'L6',
    name: '社会·环境',
    en: 'Social & Environmental',
    question: '你嵌在怎样的关系网、阶层、文化与环境之中？',
    timescale: '天 → 世代',
    disciplines: ['社会学', '经济学', '网络科学', '环境健康', '人类学'],
    quantifiability: 0.6,
    predictability: 0.35,
    summary:
      '个体从不孤立存在。社会联结强度对死亡风险的影响与戒烟相当；出生地、家庭阶层、时代与空气质量等“外部变量”解释了大量个体差异，而这些往往不由个人选择。',
    headline: [
      { value: '5/15/50/150', label: '邓巴社交层级', source: 'zhou2005' },
      { value: '+50%', label: '社会联结强者的生存几率优势', source: 'holtlunstad2010' },
      { value: '14.6 年', label: '美国收入最高与最低 1% 男性的预期寿命差', source: 'chetty2016' },
    ],
  },
  {
    id: 'L7',
    name: '意义·精神',
    en: 'Meaning & Spirit',
    question: '你为何而活？如何评价自己的一生？',
    timescale: '瞬间 → 一生',
    disciplines: ['积极心理学', '哲学', '宗教学', '叙事心理学'],
    quantifiability: 0.3,
    predictability: 0.2,
    summary:
      '意义、价值与灵性是最难量化的一层：只能通过自我报告与叙事编码间接测量，且第一人称体验（感质）在原理上无法被外部完整读取。但它与健康、寿命的关联真实存在。',
    headline: [
      { value: '0–10', label: '坎特里尔生活阶梯', source: 'cantril1965' },
      { value: '−17%', label: '高目的感者全因死亡风险', source: 'cohen2016' },
      { value: '~48 岁', label: '幸福感 U 形曲线的低谷', source: 'blanchflower2021' },
    ],
  },
]

export const LAYER_MAP: Record<LayerId, Layer> = Object.fromEntries(LAYERS.map((l) => [l.id, l])) as Record<
  LayerId,
  Layer
>

/** 层颜色（CSS 变量），图表里用 theme.ts 读取实际色值 */
export const layerVar = (id: LayerId) => `var(--${id.toLowerCase()})`
