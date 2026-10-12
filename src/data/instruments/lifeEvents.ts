import type { SchwartzKey } from '../../types'

/**
 * 生活事件目录，LCU（生活变化单位）取自 Holmes & Rahe (1967) 社会再适应评定量表。
 * 注意：该量表诞生于 1960 年代美国，权重带有时代与文化烙印；它衡量的是“需要再适应的程度”，
 * 而不是事件的好坏（结婚与被解雇都需要大量适应）。
 */
export const LIFE_EVENT_CATALOG: { label: string; lcu: number; valence: number }[] = [
  { label: '配偶去世', lcu: 100, valence: -2 },
  { label: '离婚', lcu: 73, valence: -2 },
  { label: '分居', lcu: 65, valence: -2 },
  { label: '近亲去世', lcu: 63, valence: -2 },
  { label: '重伤或重病', lcu: 53, valence: -2 },
  { label: '结婚', lcu: 50, valence: 2 },
  { label: '被解雇', lcu: 47, valence: -2 },
  { label: '退休', lcu: 45, valence: 0 },
  { label: '家人健康重大变化', lcu: 44, valence: -1 },
  { label: '怀孕', lcu: 40, valence: 1 },
  { label: '家中添丁', lcu: 39, valence: 2 },
  { label: '工作/事业重大调整', lcu: 39, valence: 0 },
  { label: '经济状况重大变化', lcu: 38, valence: 0 },
  { label: '好友去世', lcu: 37, valence: -2 },
  { label: '转行', lcu: 36, valence: 0 },
  { label: '大额贷款/房贷', lcu: 31, valence: -1 },
  { label: '工作职责重大变化', lcu: 29, valence: 0 },
  { label: '子女离家', lcu: 29, valence: -1 },
  { label: '杰出个人成就', lcu: 28, valence: 2 },
  { label: '入学或毕业', lcu: 26, valence: 1 },
  { label: '生活条件重大变化', lcu: 25, valence: 0 },
  { label: '个人习惯改变', lcu: 24, valence: 0 },
  { label: '与上司冲突', lcu: 23, valence: -1 },
  { label: '搬家', lcu: 20, valence: 0 },
  { label: '转学', lcu: 20, valence: 0 },
  { label: '社交活动重大变化', lcu: 18, valence: 0 },
  { label: '作息习惯改变', lcu: 16, valence: 0 },
  { label: '度假/长途旅行', lcu: 13, valence: 1 },
]

/** 发展里程碑（生物学 + 心理社会），用于人生时间轴背景 */
export const ERIKSON_STAGES = [
  { from: 0, to: 1, name: '信任 vs 不信任', virtue: '希望' },
  { from: 1, to: 3, name: '自主 vs 羞怯', virtue: '意志' },
  { from: 3, to: 6, name: '主动 vs 内疚', virtue: '目的' },
  { from: 6, to: 12, name: '勤奋 vs 自卑', virtue: '能力' },
  { from: 12, to: 18, name: '同一性 vs 角色混乱', virtue: '忠诚' },
  { from: 18, to: 40, name: '亲密 vs 孤独', virtue: '爱' },
  { from: 40, to: 65, name: '繁衍 vs 停滞', virtue: '关怀' },
  { from: 65, to: 100, name: '整合 vs 绝望', virtue: '智慧' },
]

export const BIO_MILESTONES: { age: number; label: string; source?: string }[] = [
  { age: 0, label: '出生：神经元数量已接近成年水平' },
  { age: 2, label: '幼儿期突触密度达峰，随后开始修剪' },
  { age: 13, label: '青春期：昼夜节律显著后移', source: 'roenneberg2007' },
  { age: 19, label: '加工速度约在此时达峰', source: 'hartshorne2015' },
  { age: 25, label: '前额叶皮层成熟大致完成' },
  { age: 30, label: '骨量与肌肉量达峰' },
  { age: 48, label: '幸福感 U 形曲线低谷（平均）', source: 'blanchflower2021' },
  { age: 50, label: '人格排序稳定性进入平台期（~0.74）', source: 'roberts2000' },
  { age: 60, label: '校正体型后代谢率开始下降', source: 'pontzer2021' },
  { age: 67, label: '词汇知识约在此时达峰', source: 'hartshorne2015' },
]

export const SCHWARTZ_META: { key: SchwartzKey; name: string; axis: string }[] = [
  { key: 'selfDirection', name: '自我导向', axis: '开放' },
  { key: 'stimulation', name: '刺激', axis: '开放' },
  { key: 'hedonism', name: '享乐', axis: '开放/提升' },
  { key: 'achievement', name: '成就', axis: '自我提升' },
  { key: 'power', name: '权力', axis: '自我提升' },
  { key: 'security', name: '安全', axis: '保守' },
  { key: 'conformity', name: '遵从', axis: '保守' },
  { key: 'tradition', name: '传统', axis: '保守' },
  { key: 'benevolence', name: '仁慈', axis: '自我超越' },
  { key: 'universalism', name: '普世', axis: '自我超越' },
]
