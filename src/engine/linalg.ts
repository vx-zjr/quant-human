/** 小型稠密线性代数（贝叶斯逻辑回归只需 ~10 维，无需引入依赖） */

export type Vec = number[]
export type Mat = number[][]

export const dot = (a: Vec, b: Vec) => a.reduce((s, x, i) => s + x * b[i], 0)

export const matVec = (A: Mat, x: Vec): Vec => A.map((row) => dot(row, x))

/** Cholesky 分解 A = L·Lᵀ（A 必须对称正定） */
export function cholesky(A: Mat): Mat {
  const n = A.length
  const L: Mat = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i][j]
      for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k]
      if (i === j) {
        if (s <= 0) throw new Error('matrix not positive definite')
        L[i][i] = Math.sqrt(s)
      } else L[i][j] = s / L[j][j]
    }
  }
  return L
}

/** 解 A·x = b（A 对称正定） */
export function solveSPD(A: Mat, b: Vec): Vec {
  const L = cholesky(A)
  const n = b.length
  const y = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let s = b[i]
    for (let k = 0; k < i; k++) s -= L[i][k] * y[k]
    y[i] = s / L[i][i]
  }
  const x = new Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) {
    let s = y[i]
    for (let k = i + 1; k < n; k++) s -= L[k][i] * x[k]
    x[i] = s / L[i][i]
  }
  return x
}

/** 对称正定矩阵求逆 */
export function invertSPD(A: Mat): Mat {
  const n = A.length
  const cols = Array.from({ length: n }, (_, j) => solveSPD(A, Array.from({ length: n }, (_, i) => (i === j ? 1 : 0))))
  return Array.from({ length: n }, (_, i) => cols.map((c) => c[i]))
}

/** xᵀ·A·x */
export const quadForm = (A: Mat, x: Vec) => dot(x, matVec(A, x))
