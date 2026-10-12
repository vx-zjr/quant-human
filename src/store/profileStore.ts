import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeStorage } from './storage'
import { blankProfile, PERSONAS } from '../data/personas'
import type { Profile } from '../types'

/**
 * 画像存储：演示人物只读，“我的画像”可编辑并持久化到 localStorage（本地优先，绝不上传）。
 */
interface ProfileState {
  me: Profile
  activeId: string
  setActive: (id: string) => void
  /** 支持函数式更新，避免快速连续操作时读到过期状态 */
  updateMe: (patch: Partial<Profile> | ((me: Profile) => Partial<Profile>)) => void
  resetMe: () => void
  /** 以某个演示人物为模板创建“我的画像” */
  cloneToMe: (id: string) => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      me: blankProfile(),
      activeId: PERSONAS[0].id,
      setActive: (activeId) => set({ activeId }),
      updateMe: (patch) => set((s) => ({ me: { ...s.me, ...(typeof patch === 'function' ? patch(s.me) : patch) } })),
      resetMe: () => set({ me: blankProfile() }),
      cloneToMe: (id) =>
        set(() => {
          const src = PERSONAS.find((p) => p.id === id)
          if (!src) return {}
          return {
            me: { ...structuredClone(src), id: 'me', name: '我', avatar: '🧭', isDemo: false, tagline: `以「${src.name}」为模板` },
            activeId: 'me',
          }
        }),
    }),
    { name: 'qh-profile', version: 1, storage: safeStorage },
  ),
)

export function allProfiles(me: Profile): Profile[] {
  return [me, ...PERSONAS]
}

export function useActiveProfile(): Profile {
  const me = useProfileStore((s) => s.me)
  const activeId = useProfileStore((s) => s.activeId)
  return activeId === 'me' ? me : (PERSONAS.find((p) => p.id === activeId) ?? PERSONAS[0])
}
