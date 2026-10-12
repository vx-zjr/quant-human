import { createJSONStorage } from 'zustand/middleware'

/** localStorage 不可用（隐私模式、被禁用）时退回内存存储，页面仍可正常使用 */
export const safeStorage = createJSONStorage(() => {
  try {
    const k = '__qh_probe__'
    localStorage.setItem(k, '1')
    localStorage.removeItem(k)
    return localStorage
  } catch {
    const mem = new Map<string, string>()
    return {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    }
  }
})
