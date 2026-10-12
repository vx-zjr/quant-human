import type { Forecast } from '../types'

/**
 * 预测账本的评分：Brier 分数（Brier 1950）及其 Murphy 分解。
 *   BS = mean((p − o)²)，0 为完美，0.25 相当于永远说 50%。
 *   BS = 可靠性(reliability) − 分辨力(resolution) + 不确定性(uncertainty)
 */

export const resolved = (fs: Forecast[]) => fs.filter((f) => f.outcome !== 'pending')
const o = (f: Forecast) => (f.outcome === 'yes' ? 1 : 0)

export function brier(fs: Forecast[]): number | null {
  const r = resolved(fs)
  if (!r.length) return null
  return r.reduce((s, f) => s + (f.p - o(f)) ** 2, 0) / r.length
}

export interface CalibrationBin {
  lo: number
  hi: number
  meanP: number
  freq: number
  n: number
}

export function calibrationBins(fs: Forecast[], nBins = 5): CalibrationBin[] {
  const r = resolved(fs)
  const bins: CalibrationBin[] = []
  for (let i = 0; i < nBins; i++) {
    const lo = i / nBins
    const hi = (i + 1) / nBins
    const inBin = r.filter((f) => f.p >= lo && (i === nBins - 1 ? f.p <= hi : f.p < hi))
    if (!inBin.length) continue
    bins.push({
      lo,
      hi,
      n: inBin.length,
      meanP: inBin.reduce((s, f) => s + f.p, 0) / inBin.length,
      freq: inBin.reduce((s, f) => s + o(f), 0) / inBin.length,
    })
  }
  return bins
}

export function murphy(fs: Forecast[], nBins = 5) {
  const r = resolved(fs)
  if (!r.length) return null
  const base = r.reduce((s, f) => s + o(f), 0) / r.length
  const bins = calibrationBins(fs, nBins)
  const reliability = bins.reduce((s, b) => s + b.n * (b.meanP - b.freq) ** 2, 0) / r.length
  const resolution = bins.reduce((s, b) => s + b.n * (b.freq - base) ** 2, 0) / r.length
  const uncertainty = base * (1 - base)
  return { reliability, resolution, uncertainty, base }
}

/** 过度自信指数：平均“把握度” − 实际命中率（>0 表示过度自信） */
export function overconfidence(fs: Forecast[]): number | null {
  const r = resolved(fs)
  if (!r.length) return null
  const conf = r.reduce((s, f) => s + Math.max(f.p, 1 - f.p), 0) / r.length
  const hit = r.reduce((s, f) => s + ((f.p >= 0.5 ? 1 : 0) === o(f) ? 1 : 0), 0) / r.length
  return conf - hit
}
