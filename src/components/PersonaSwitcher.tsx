import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check, Pencil } from 'lucide-react'
import { PERSONAS } from '../data/personas'
import { navigate } from '../router'
import { useActiveProfile, useProfileStore } from '../store/profileStore'
import { cx } from './cx'

/** 顶部画像切换器：所有“个体”页面都基于当前选中的画像计算 */
export function PersonaSwitcher() {
  const active = useActiveProfile()
  const me = useProfileStore((s) => s.me)
  const setActive = useProfileStore((s) => s.setActive)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [])

  const options = [me, ...PERSONAS]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-2"
      >
        <span aria-hidden>{active.avatar}</span>
        <span className="text-ink font-medium">{active.name}</span>
        {active.isDemo && <span className="text-[10px] rounded bg-surface-3 px-1.5 py-0.5 text-muted">演示</span>}
        <ChevronDown size={14} className="text-muted" />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-line-strong bg-surface p-1.5 shadow-2xl"
        >
          <div className="px-2 py-1.5 text-[11px] text-muted">选择要量化的人</div>
          {options.map((p) => (
            <button
              key={p.id}
              role="option"
              aria-selected={p.id === active.id}
              onClick={() => {
                setActive(p.id)
                setOpen(false)
              }}
              className={cx('flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-surface-2', p.id === active.id && 'bg-surface-2')}
            >
              <span className="text-lg leading-none mt-0.5" aria-hidden>
                {p.avatar}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-ink">
                  {p.name}
                  {p.isDemo && <span className="ml-1.5 text-[10px] text-muted">演示人物</span>}
                </span>
                <span className="block truncate text-[11px] text-muted">{p.tagline}</span>
              </span>
              {p.id === active.id && <Check size={14} className="mt-1 text-accent" />}
            </button>
          ))}
          <div className="mt-1 border-t border-line pt-1">
            <button
              onClick={() => {
                setActive('me')
                setOpen(false)
                navigate('/profile')
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-accent hover:bg-surface-2"
            >
              <Pencil size={14} /> 编辑我的画像
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
