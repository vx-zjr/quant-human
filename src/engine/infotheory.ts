/**
 * 信息论工具：一个行为序列“理论上最多能被预测到多准”。
 * 思路沿用 Song et al. (2010) 对人类移动可预测性的分析：
 *   先估计序列的熵 S，再用 Fano 不等式求出任何算法都无法超越的预测准确率上限 Π_max。
 */

const log2 = (x: number) => Math.log(x) / Math.LN2

/** 二元熵（bit） */
export function binaryEntropy(p: number): number {
  if (p <= 0 || p >= 1) return 0
  return -p * log2(p) - (1 - p) * log2(1 - p)
}

/** 一阶马尔可夫条件熵 H(Xₜ | Xₜ₋₁)，插入估计 */
export function conditionalEntropy1(seq: number[]): number {
  if (seq.length < 3) return binaryEntropy(seq.reduce((s, x) => s + x, 0) / Math.max(1, seq.length))
  const c = [
    [0, 0],
    [0, 0],
  ]
  for (let i = 1; i < seq.length; i++) c[seq[i - 1]][seq[i]]++
  const n = seq.length - 1
  let h = 0
  for (const a of [0, 1]) {
    const na = c[a][0] + c[a][1]
    if (!na) continue
    h += (na / n) * binaryEntropy(c[a][1] / na)
  }
  return h
}

/**
 * Lempel–Ziv 熵率估计（Kontoyiannis et al. 1998）：
 *   S ≈ ( (1/n) Σ Λᵢ )⁻¹ · log₂ n
 * Λᵢ = 从位置 i 开始、在此前子序列中从未出现过的最短子串长度。
 * 样本少于约 50 时偏差很大，只作参考。
 */
export function lzEntropyRate(seq: number[]): number {
  const n = seq.length
  if (n < 2) return 1
  const s = seq.join('')
  let sum = 0
  for (let i = 0; i < n; i++) {
    let len = 1
    const prefix = s.slice(0, i)
    while (i + len <= n && prefix.includes(s.slice(i, i + len))) len++
    sum += len
  }
  return Math.min(1, log2(n) / (sum / n))
}

/**
 * Fano 不等式（二元情形）：S = H_b(Π)。在 [0.5, 1] 上反解 Π，即为最大可预测性。
 * 熵越低，上限越高；S=1 bit（完全随机）→ 50%。
 */
export function fanoMaxPredictability(S: number): number {
  const h = Math.max(0, Math.min(1, S))
  let lo = 0.5
  let hi = 1
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (binaryEntropy(mid) > h) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export interface PredictabilityReport {
  n: number
  rate: number
  /** 只知道“做与不做的比例”时的最佳准确率 */
  piBaseRate: number
  /** 考虑昨天→今天依赖后的上限 */
  piMarkov: number
  /** 考虑任意长程模式（LZ 估计）后的上限 */
  piLZ: number
  hBase: number
  hMarkov: number
  hLZ: number
  reliable: boolean
}

export function sequencePredictability(seq: number[]): PredictabilityReport {
  const n = seq.length
  const rate = n ? seq.reduce((s, x) => s + x, 0) / n : 0.5
  const hBase = binaryEntropy(rate)
  const hMarkov = Math.min(hBase, conditionalEntropy1(seq))
  const hLZ = Math.min(hBase, lzEntropyRate(seq))
  return {
    n,
    rate,
    piBaseRate: Math.max(rate, 1 - rate),
    piMarkov: fanoMaxPredictability(hMarkov),
    piLZ: fanoMaxPredictability(hLZ),
    hBase,
    hMarkov,
    hLZ,
    reliable: n >= 50,
  }
}

/**
 * Epstein 聚合原理：特质与“k 次行为平均值”的相关
 *   r_k = r₁ · √( k / (1 + (k−1)ρ) )
 * r₁ = 特质与单次行为的相关，ρ = 不同场合行为之间的平均相关。k→∞ 时趋近 r₁/√ρ。
 */
export const aggregatedValidity = (r1: number, rho: number, k: number) => Math.min(1, r1 * Math.sqrt(k / (1 + (k - 1) * rho)))
