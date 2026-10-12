import type { GeneticEvidence, PredictionStudy } from '../types'

/**
 * 遗传上限 vs. 当前多基因评分（PGS）的预测力。
 * 数值为文献中的代表性量级（以欧洲祖源样本为主），跨祖源时 PGS 预测力通常显著下降。
 */
export const GENETIC_EVIDENCE: GeneticEvidence[] = [
  {
    id: 'height',
    trait: '身高',
    twinH2: 0.8,
    snpH2: 0.45,
    pgsR2: 0.4,
    note: '常见变异已接近“饱和”：约 1.2 万个独立 SNP 解释欧洲祖源 40–45% 的方差，其他祖源约 10–20%。',
    sources: ['yengo2022', 'silventoinen2003'],
  },
  {
    id: 'bmi',
    trait: 'BMI',
    twinH2: 0.7,
    snpH2: 0.25,
    pgsR2: 0.085,
    note: '最佳多基因评分约解释 8.5% 的方差；顶端 10% 与底端 10% 的成年人平均体重相差约 13 kg。',
    sources: ['khera2019', 'elks2012'],
  },
  {
    id: 'education',
    trait: '受教育年限',
    twinH2: 0.4,
    snpH2: 0.15,
    pgsR2: 0.14,
    note: '人群层面解释 12–16%，但在家庭内（兄弟姐妹之间）比较时效应明显变小——部分来自父母基因通过家庭环境起作用的“遗传养育”与人群分层。',
    sources: ['okbay2022', 'branigan2013', 'kong2018'],
  },
  {
    id: 'intelligence',
    trait: '智力',
    twinH2: 0.6,
    snpH2: 0.2,
    pgsR2: 0.05,
    note: '最大规模 GWAS 的 PGS 约解释 5% 的方差，与双生子遗传度之间存在巨大的“缺失遗传度”。',
    sources: ['savage2018', 'plomin2015'],
  },
  {
    id: 'schizophrenia',
    trait: '精神分裂症（易感性）',
    twinH2: 0.8,
    snpH2: 0.24,
    pgsR2: 0.07,
    note: '在易感性尺度上 PGS 约解释 7%；风险评分最高 1% 的人风险仅约为平均的数倍——远非确定。',
    sources: ['trubetskoy2022'],
  },
  {
    id: 'personality',
    trait: '大五人格',
    twinH2: 0.4,
    snpH2: 0.1,
    pgsR2: 0.02,
    note: '人格 PGS 目前几乎没有个体预测价值（约 1–3%），双生子 40% 遗传度中绝大多数尚未被定位。',
    sources: ['vukasovic2015'],
  },
  {
    id: 'longevity',
    trait: '寿命',
    twinH2: 0.25,
    snpH2: 0.05,
    pgsR2: 0.01,
    note: '经典双生子估计约 25%，校正同型婚配后真实遗传度可能低于 10%。寿命主要不是写在基因里的。',
    sources: ['ruby2018'],
  },
]

/** 真实世界的个体预测研究 */
export const PREDICTION_STUDIES: PredictionStudy[] = [
  {
    id: 'mobility',
    target: '下一小时所在位置',
    predictor: '手机定位历史',
    metric: '理论可预测性上限',
    value: 0.93,
    normalized: 0.93,
    takeaway: '日常行为高度规律：我们大多数时间在少数几个地方之间往返。',
    sources: ['song2010'],
  },
  {
    id: 'gender-likes',
    target: '性别',
    predictor: 'Facebook 点赞',
    metric: 'AUC',
    value: 0.93,
    normalized: 0.86,
    takeaway: '数字足迹会“泄露”你从未主动告知的属性。',
    sources: ['kosinski2013'],
  },
  {
    id: 'epi-clock',
    target: '实际年龄',
    predictor: 'DNA 甲基化（Horvath 时钟）',
    metric: '相关系数 r',
    value: 0.96,
    normalized: 0.92,
    takeaway: '身体“记录”时间的精度很高，中位误差约 3.6 岁；偏差本身反而成了衰老信号。',
    sources: ['horvath2013'],
  },
  {
    id: 'spouse-vs-algo',
    target: '人格（与自评的一致性）',
    predictor: '300 个 Facebook 点赞',
    metric: '相关系数 r',
    value: 0.56,
    normalized: 0.31,
    takeaway: '算法读你，已接近与你朝夕相处的配偶——但两者都只解释约三分之一的方差。',
    sources: ['youyou2015'],
  },
  {
    id: 'openness-likes',
    target: '开放性',
    predictor: 'Facebook 点赞',
    metric: '相关系数 r',
    value: 0.43,
    normalized: 0.18,
    takeaway: '大五中开放性最容易从行为痕迹中读出。',
    sources: ['kosinski2013'],
  },
  {
    id: 'ffc-hardship',
    target: '15 岁时家庭物质困难',
    predictor: '出生起 15 年、近 1.3 万个变量 + 160 支团队 + 机器学习',
    metric: '留出集 R²',
    value: 0.23,
    normalized: 0.23,
    takeaway: '“脆弱家庭挑战”：最好的模型也只比简单基线好一点点。',
    sources: ['salganik2020'],
  },
  {
    id: 'ffc-gpa',
    target: '15 岁时学业成绩 GPA',
    predictor: '同上',
    metric: '留出集 R²',
    value: 0.19,
    normalized: 0.19,
    takeaway: '海量数据 ≠ 高预测力：人生结局中有大量无法从既往数据中预见的成分。',
    sources: ['salganik2020'],
  },
  {
    id: 'ffc-grit',
    target: '15 岁时坚毅程度',
    predictor: '同上',
    metric: '留出集 R²',
    value: 0.06,
    normalized: 0.06,
    takeaway: '心理特质的个体预测尤其困难。',
    sources: ['salganik2020'],
  },
  {
    id: 'ffc-eviction',
    target: '家庭被驱逐',
    predictor: '同上',
    metric: '留出集 R²',
    value: 0.05,
    normalized: 0.05,
    takeaway: '事件型结局几乎不可预测——它们取决于尚未发生的偶然。',
    sources: ['salganik2020'],
  },
  {
    id: 'life2vec',
    target: '4 年内是否死亡（35–65 岁）',
    predictor: '丹麦约 600 万人的登记事件序列 + Transformer',
    metric: '显著优于基线',
    value: 0.41,
    normalized: 0.4,
    takeaway: '把人生当成“句子”来建模，预测力确有提升，但距离确定性仍很远（此处数值为论文报告的校正 MCC 量级，仅示意）。',
    sources: ['savcisens2024'],
  },
  {
    id: 'divorce',
    target: '离婚',
    predictor: '夫妻互动编码（小样本）',
    metric: '宣称准确率 >90%',
    value: 0.9,
    normalized: 0.15,
    takeaway: '警示案例：未做交叉验证的小样本模型高估了预测力，重新分析后准确率大幅下降。',
    sources: ['heyman2001'],
  },
]

/**
 * 预测地平线：不同领域的可预测性随时间跨度衰减（定性示意，基于文献的数量级判断）。
 * x 轴为对数时间跨度。
 */
export const HORIZONS = {
  ticks: ['1 分钟', '1 小时', '1 天', '1 周', '1 月', '1 年', '10 年', '50 年'],
  series: [
    { name: '人格特质排序', values: [0.95, 0.95, 0.93, 0.92, 0.9, 0.85, 0.65, 0.45] },
    { name: '位置与日常行为', values: [0.97, 0.93, 0.8, 0.7, 0.6, 0.4, 0.15, 0.05] },
    { name: '生理指标（心率、血压）', values: [0.9, 0.75, 0.6, 0.55, 0.5, 0.4, 0.2, 0.05] },
    { name: '情绪状态', values: [0.8, 0.5, 0.25, 0.15, 0.1, 0.08, 0.05, 0.02] },
    { name: '重大人生事件', values: [0.3, 0.15, 0.1, 0.08, 0.06, 0.05, 0.04, 0.03] },
  ],
}

/** 信息尺度（log10 bit） */
export const INFORMATION_SCALE: { label: string; log10Bits: number; note: string; source?: string }[] = [
  { label: '一生的有意识信息流', log10Bits: 10.2, note: '10 bit/s × 16 h/天 × 80 年 ≈ 1.7×10¹⁰ bit ≈ 2 GB', source: 'zheng2025' },
  { label: '二倍体基因组', log10Bits: 10.1, note: '6.1×10⁹ bp × 2 bit ≈ 1.5 GB（未压缩）', source: 'nurk2022' },
  { label: '你与参考基因组的差异', log10Bits: 7.5, note: '约 450 万个变异位点，压缩后仅数 MB', source: 'kgp2015' },
  { label: '1 mm³ 人脑电镜数据', log10Bits: 16.1, note: '1.4 PB 原始图像（约 5.7 万个细胞）', source: 'shapsoncoe2024' },
  { label: '全脑突触连接组（估计）', log10Bits: 15.7, note: '~10¹⁴–10¹⁵ 个突触 × 每个约 4.7 bit 强度 + 连接寻址', source: 'bartol2015' },
  { label: '全部原子的经典状态', log10Bits: 29.8, note: '~7×10²⁷ 原子 × 每个约 100 bit（位置+动量）' },
  { label: '人类全部数字数据（2025）', log10Bits: 24.2, note: '约 175 ZB（IDC 预测量级）' },
  { label: 'Bekenstein 物理上限', log10Bits: 45.3, note: 'R≈1 m、m=70 kg 的系统最多容纳的信息', source: 'bekenstein1981' },
]

/**
 * ACE 方差分解：A=加性遗传，C=共享环境，E=非共享环境（含随机发育噪声与测量误差）。
 * 数值为代表性双生子研究量级。
 */
export const ACE_DATA: { trait: string; A: number; C: number; E: number; note: string; sources: string[] }[] = [
  { trait: '身高', A: 0.8, C: 0.05, E: 0.15, note: '营养改善的年代与地区，遗传度更高', sources: ['silventoinen2003'] },
  { trait: 'BMI', A: 0.7, C: 0.05, E: 0.25, note: '家庭共同饮食的长期作用出乎意料地小', sources: ['elks2012'] },
  { trait: '智力（9 岁）', A: 0.41, C: 0.33, E: 0.26, note: '童年时家庭环境作用明显', sources: ['haworth2010'] },
  { trait: '智力（17 岁）', A: 0.66, C: 0.16, E: 0.18, note: '遗传度随年龄上升（Wilson 效应）', sources: ['haworth2010'] },
  { trait: '受教育年限', A: 0.4, C: 0.35, E: 0.25, note: '少见的高共享环境性状：家庭与制度很重要', sources: ['branigan2013'] },
  { trait: '大五人格', A: 0.4, C: 0.05, E: 0.55, note: '一起长大的兄弟姐妹人格并不比分开长大的更像', sources: ['vukasovic2015'] },
  { trait: '生活满意度', A: 0.32, C: 0.03, E: 0.65, note: '幸福大部分取决于个人独特经历', sources: ['bartels2015'] },
  { trait: '抑郁症', A: 0.37, C: 0.03, E: 0.6, note: '非共享环境（含生活事件）是主要来源', sources: ['sullivan2000'] },
  { trait: '宗教性（成年）', A: 0.44, C: 0.18, E: 0.38, note: '童年时家庭影响为主，成年后遗传影响上升', sources: ['koenig2005'] },
  { trait: '寿命', A: 0.15, C: 0.05, E: 0.8, note: '真实遗传度可能更低（<10%）', sources: ['ruby2018'] },
]
