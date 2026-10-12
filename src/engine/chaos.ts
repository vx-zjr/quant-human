/**
 * 混沌与可预测性地平线。
 * 洛伦兹系统（1963）是“确定性 ≠ 可预测性”的经典范例：方程完全已知，
 * 但初始状态任何微小误差都以指数速率放大（最大李雅普诺夫指数 λ≈0.906）。
 */

export type Vec3 = [number, number, number]

export const LORENZ = { sigma: 10, rho: 28, beta: 8 / 3 }
export const LYAPUNOV = 0.9056

function deriv([x, y, z]: Vec3): Vec3 {
  const { sigma, rho, beta } = LORENZ
  return [sigma * (y - x), x * (rho - z) - y, x * y - beta * z]
}

/** 四阶龙格-库塔一步 */
export function rk4(s: Vec3, dt: number): Vec3 {
  const k1 = deriv(s)
  const k2 = deriv([s[0] + (dt / 2) * k1[0], s[1] + (dt / 2) * k1[1], s[2] + (dt / 2) * k1[2]])
  const k3 = deriv([s[0] + (dt / 2) * k2[0], s[1] + (dt / 2) * k2[1], s[2] + (dt / 2) * k2[2]])
  const k4 = deriv([s[0] + dt * k3[0], s[1] + dt * k3[1], s[2] + dt * k3[2]])
  return [
    s[0] + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    s[1] + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    s[2] + (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]),
  ]
}

export const dist = (a: Vec3, b: Vec3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])

/** 先在吸引子上“预热”，返回吸引子上的一个点 */
export function onAttractor(): Vec3 {
  let s: Vec3 = [1, 1, 1]
  for (let i = 0; i < 3000; i++) s = rk4(s, 0.01)
  return s
}

export interface PairRun {
  a: Vec3[]
  b: Vec3[]
  /** log10 距离 */
  logDist: number[]
  t: number[]
}

/** 两条初值相差 delta0 的轨迹 */
export function simulatePair(delta0: number, tMax = 30, dt = 0.01): PairRun {
  let a = onAttractor()
  let b: Vec3 = [a[0] + delta0, a[1], a[2]]
  const out: PairRun = { a: [], b: [], logDist: [], t: [] }
  const n = Math.round(tMax / dt)
  for (let i = 0; i <= n; i++) {
    out.a.push(a)
    out.b.push(b)
    out.t.push(i * dt)
    out.logDist.push(Math.log10(Math.max(1e-300, dist(a, b))))
    a = rk4(a, dt)
    b = rk4(b, dt)
  }
  return out
}

/** 预测地平线：误差从 δ0 增长到容忍度 Δ 需要的时间 */
export const predictionHorizon = (delta0: number, tolerance = 1, lambda = LYAPUNOV) =>
  Math.log(tolerance / delta0) / lambda
