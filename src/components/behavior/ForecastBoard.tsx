import type { ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { CATEGORY_META } from '../../data/behaviors'
import type { Forecast } from '../../hooks/useBehaviorForecasts'
import { cx } from '../cx'

/**
 * “行为天气预报”：当前情境下，每一件被追踪的事今天发生的概率。
 * 每张卡片同时给出 80% 可信区间——区间越窄，模型对你越有把握。
 */
export function ForecastBoard({
  forecasts,
  selectedId,
  onSelect,
  onRecord,
  readOnly,
}: {
  forecasts: Forecast[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRecord: (f: Forecast, did: 0 | 1) => void
  readOnly: boolean
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {forecasts.map((f) => {
        const { def, pred } = f
        const active = selectedId === def.id
        return (
          <div
            key={def.id}
            className={cx('rounded-xl border bg-surface p-4 transition-colors', active ? 'border-accent' : 'border-line hover:border-line-strong')}
          >
            <button type="button" onClick={() => onSelect(def.id)} className="block w-full text-left" aria-pressed={active}>
              <div className="flex items-center gap-1.5 text-[11px] text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[def.category].color }} />
                {CATEGORY_META[def.category].name}
                <span>· {def.window === 'day' ? '今天' : def.window === 'week' ? '本周' : '本月'}</span>
                {def.avoid && <span>· 想避免</span>}
              </div>
              <div className="mt-1 text-sm font-medium text-ink leading-snug">{def.name}</div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold text-ink">{Math.round(pred.p * 100)}</span>
                <span className="text-sm text-muted">%</span>
                <span className="ml-auto text-[11px] text-muted tnum">
                  80%：{Math.round(pred.lo * 100)}–{Math.round(pred.hi * 100)}%
                </span>
              </div>
              <IntervalBar lo={pred.lo} hi={pred.hi} p={pred.p} />
              <div className="mt-2 text-[11px] text-muted">
                基于 {f.history.length} 条记录
                {f.previous ? ` · 上次${f.previous.did ? '做了' : '没做'}` : ''}
              </div>
            </button>
            {!readOnly && (
              <div className="mt-3 flex gap-1.5 border-t border-line pt-3">
                <RecordButton active={f.existing?.did === 1} onClick={() => onRecord(f, 1)} label="做了">
                  <Check size={13} />
                </RecordButton>
                <RecordButton active={f.existing?.did === 0} onClick={() => onRecord(f, 0)} label="没做">
                  <X size={13} />
                </RecordButton>
              </div>
            )}
            {readOnly && f.existing && (
              <div className="mt-3 border-t border-line pt-2 text-[11px] text-ink-2">实际：{f.existing.did ? '做了' : '没做'}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RecordButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
        active ? 'border-accent bg-accent text-white' : 'border-line text-ink-2 hover:text-ink',
      )}
    >
      {children}
      {label}
    </button>
  )
}

/** 0–100% 轨道上的可信区间与点估计 */
export function IntervalBar({ lo, hi, p }: { lo: number; hi: number; p: number }) {
  return (
    <div className="relative mt-2 h-2 rounded-full bg-surface-3" aria-hidden>
      <div className="absolute inset-y-0 rounded-full bg-accent/35" style={{ left: `${lo * 100}%`, width: `${Math.max(1, (hi - lo) * 100)}%` }} />
      <div className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" style={{ left: `${p * 100}%` }} />
    </div>
  )
}
