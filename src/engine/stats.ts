/** 通用数学与统计工具：纯函数，无副作用，便于测试。 */

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** 误差函数（Abramowitz–Stegun 7.1.26，误差 < 1.5e-7） */
export function erf(x: number): number {
  const s = Math.sign(x)
  const a = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * a)
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-a * a)
  return s * y
}

export const normCdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2))

/** 标准正态分布分位函数（Acklam 近似） */
export function normInv(p: number): number {
  if (p <= 0) return -Infinity
  if (p >= 1) return Infinity
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425
  let q: number, r: number
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - pl) {
    q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  q = p - 0.5
  r = q * q
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

/** 可复现的伪随机数发生器（mulberry32） */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 标准正态随机数（Box–Muller） */
export function randn(rng: () => number): number {
  let u = 0
  while (u === 0) u = rng()
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** 已排序数组的分位数（线性插值） */
export function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return NaN
  const pos = (sorted.length - 1) * q
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return lerp(sorted[lo], sorted[hi], pos - lo)
}

/** 分段线性插值（xs 递增） */
export function interp(xs: number[], ys: number[], x: number): number {
  if (x <= xs[0]) return ys[0]
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1]
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]) return lerp(ys[i - 1], ys[i], (x - xs[i - 1]) / (xs[i] - xs[i - 1]))
  }
  return ys[ys.length - 1]
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN)

/** 科学计数法的中文友好格式：6.7×10²⁷ */
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
export function sci(x: number, digits = 2): string {
  if (x === 0 || !Number.isFinite(x)) return String(x)
  const e = Math.floor(Math.log10(Math.abs(x)))
  const m = x / 10 ** e
  return `${m.toFixed(digits - 1)}×10${String(e).split('').map((c) => SUP[c] ?? c).join('')}`
}

/** 中文大数格式：1.2 亿 / 3,456 万 */
export function cn(x: number, digits = 1): string {
  const a = Math.abs(x)
  if (a >= 1e16) return sci(x, digits + 1)
  if (a >= 1e12) return `${(x / 1e12).toFixed(digits)} 万亿`
  if (a >= 1e8) return `${(x / 1e8).toFixed(digits)} 亿`
  if (a >= 1e4) return `${(x / 1e4).toFixed(digits)} 万`
  return x.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}
