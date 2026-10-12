import type { BigFiveKey } from '../../types'

/**
 * 20 题简版大五人格。
 * 结构参照 Mini-IPIP（Donnellan et al., 2006），题目来自公有领域的 IPIP 题库（ipip.ori.org），中文为本项目翻译。
 * 注意：中文版本尚未做心理测量学验证（信度、测量不变性），结果仅供自我探索。
 */
export interface BigFiveItem {
  id: string
  trait: BigFiveKey
  text: string
  reverse: boolean
}

export const BIG_FIVE_ITEMS: BigFiveItem[] = [
  { id: 'e1', trait: 'E', text: '我是聚会中的活跃人物', reverse: false },
  { id: 'a1', trait: 'A', text: '我能体会别人的感受', reverse: false },
  { id: 'c1', trait: 'C', text: '我会马上把杂事做完', reverse: false },
  { id: 'n1', trait: 'N', text: '我的情绪经常起伏', reverse: false },
  { id: 'o1', trait: 'O', text: '我想象力丰富', reverse: false },
  { id: 'e2', trait: 'E', text: '我话不多', reverse: true },
  { id: 'a2', trait: 'A', text: '我对别人的问题不感兴趣', reverse: true },
  { id: 'c2', trait: 'C', text: '我常常忘记把东西放回原处', reverse: true },
  { id: 'n2', trait: 'N', text: '我大部分时间都很放松', reverse: true },
  { id: 'o2', trait: 'O', text: '我对抽象的概念不感兴趣', reverse: true },
  { id: 'e3', trait: 'E', text: '在聚会上我会和许多不同的人交谈', reverse: false },
  { id: 'a3', trait: 'A', text: '我能感受到他人的情绪', reverse: false },
  { id: 'c3', trait: 'C', text: '我喜欢井然有序', reverse: false },
  { id: 'n3', trait: 'N', text: '我很容易心烦', reverse: false },
  { id: 'o3', trait: 'O', text: '我难以理解抽象的想法', reverse: true },
  { id: 'e4', trait: 'E', text: '我习惯待在不起眼的地方', reverse: true },
  { id: 'a4', trait: 'A', text: '我其实不太关心别人', reverse: true },
  { id: 'c4', trait: 'C', text: '我常把事情弄得一团糟', reverse: true },
  { id: 'n4', trait: 'N', text: '我很少感到忧郁', reverse: true },
  { id: 'o4', trait: 'O', text: '我的想象力不太好', reverse: true },
]

export const LIKERT = ['非常不符合', '比较不符合', '不确定', '比较符合', '非常符合']

export const BIG_FIVE_META: Record<BigFiveKey, { name: string; en: string; high: string; low: string }> = {
  O: { name: '开放性', en: 'Openness', high: '好奇、富于想象、喜欢新事物', low: '务实、传统、偏好熟悉的事物' },
  C: { name: '尽责性', en: 'Conscientiousness', high: '自律、有条理、可靠', low: '随性、灵活、不拘小节' },
  E: { name: '外向性', en: 'Extraversion', high: '外向、健谈、精力充沛', low: '内敛、安静、享受独处' },
  A: { name: '宜人性', en: 'Agreeableness', high: '体贴、合作、信任他人', low: '直率、竞争性强、有批判精神' },
  N: { name: '神经质', en: 'Neuroticism', high: '敏感、容易焦虑和情绪化', low: '情绪稳定、沉着、抗压' },
}

/**
 * 近似常模（1–5 分量表）。来自英文样本的大致量级，仅用于把分数换算成“示意百分位”。
 * TODO(ROADMAP)：替换为中国成人常模。
 */
export const BIG_FIVE_NORMS: Record<BigFiveKey, { mean: number; sd: number }> = {
  O: { mean: 3.6, sd: 0.7 },
  C: { mean: 3.4, sd: 0.75 },
  E: { mean: 3.1, sd: 0.85 },
  A: { mean: 3.8, sd: 0.65 },
  N: { mean: 2.8, sd: 0.8 },
}

/**
 * 人格与人生结局的人群层面关联（相关系数量级）。
 * 这些是“人群统计规律”，单个人的结局有极大的个体差异。
 */
export const TRAIT_OUTCOMES: { trait: BigFiveKey; outcome: string; r: number; source: string }[] = [
  { trait: 'C', outcome: '工作绩效', r: 0.22, source: 'barrick1991' },
  { trait: 'C', outcome: '更长寿命', r: 0.1, source: 'jokela2013' },
  { trait: 'E', outcome: '积极情绪', r: 0.38, source: 'lucas2000' },
  { trait: 'N', outcome: '抑郁/焦虑风险', r: 0.4, source: 'lahey2009' },
  { trait: 'O', outcome: '艺术/科学创造力', r: 0.25, source: 'feist1998' },
  { trait: 'A', outcome: '关系满意度', r: 0.15, source: 'ozer2006' },
]
