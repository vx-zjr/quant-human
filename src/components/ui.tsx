import { useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, Lightbulb, OctagonAlert, Table2, BarChart3 } from 'lucide-react'
import { LAYER_MAP } from '../data/layers'
import { SOURCES } from '../data/sources'
import type { LayerId, SourceId } from '../types'
import { cx } from './cx'


/* ------------------------------ 布局 ------------------------------ */

export function PageHeader({ kicker, title, desc, children }: { kicker?: string; title: string; desc?: ReactNode; children?: ReactNode }) {
  return (
    <header className="mb-8">
      {kicker && <div className="text-xs font-medium tracking-[0.2em] text-accent uppercase mb-2">{kicker}</div>}
      <h1 className="text-2xl md:text-3xl font-semibold text-ink">{title}</h1>
      {desc && <div className="mt-3 max-w-3xl text-ink-2 text-[15px] leading-relaxed">{desc}</div>}
      {children}
    </header>
  )
}

export function Section({ title, desc, children, id }: { title: string; desc?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="mt-10" id={id}>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      {desc && <p className="mt-1 mb-4 text-sm text-ink-2 max-w-3xl">{desc}</p>}
      {!desc && <div className="mb-4" />}
      {children}
    </section>
  )
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  pad = true,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  pad?: boolean
}) {
  return (
    <div className={cx('rounded-xl border border-line bg-surface', pad && 'p-4 md:p-5', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {title && <h3 className="text-[15px] font-semibold text-ink">{title}</h3>}
            {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

/** 图表卡片：带“图 / 表”切换，表格视图是图表的无障碍等价物 */
export function ChartCard({
  title,
  subtitle,
  children,
  table,
  className,
  footer,
}: {
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  table?: { columns: string[]; rows: (string | number)[][] }
  className?: string
  footer?: ReactNode
}) {
  const [view, setView] = useState<'chart' | 'table'>('chart')
  return (
    <Card
      title={title}
      subtitle={subtitle}
      className={className}
      action={
        table && (
          <div className="flex shrink-0 rounded-lg border border-line p-0.5" role="group" aria-label="切换视图">
            <IconToggle active={view === 'chart'} onClick={() => setView('chart')} label="图表视图">
              <BarChart3 size={14} />
            </IconToggle>
            <IconToggle active={view === 'table'} onClick={() => setView('table')} label="表格视图">
              <Table2 size={14} />
            </IconToggle>
          </div>
        )
      }
    >
      {view === 'chart' || !table ? children : <DataTable columns={table.columns} rows={table.rows} />}
      {footer && <div className="mt-3 text-xs text-muted leading-relaxed">{footer}</div>}
    </Card>
  )
}

function IconToggle({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cx('rounded-md px-2 py-1 transition-colors', active ? 'bg-surface-3 text-ink' : 'text-muted hover:text-ink')}
    >
      {children}
    </button>
  )
}

export function DataTable({ columns, rows }: { columns: string[]; rows: (string | number)[][] }) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-lg border border-line">
      <table className="w-full text-sm tnum">
        <thead className="sticky top-0 bg-surface-2">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 text-left font-medium text-ink-2 whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-1.5 text-ink-2 whitespace-nowrap">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------ 数字 ------------------------------ */

export function Stat({
  label,
  value,
  unit,
  sub,
  accent,
}: {
  label: ReactNode
  value: ReactNode
  unit?: string
  sub?: ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2 text-xs text-muted">
        {accent && <span className="inline-block h-2 w-2 rounded-full" style={{ background: accent }} />}
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-semibold text-ink">{value}</span>
        {unit && <span className="text-sm text-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-xs text-ink-2 leading-relaxed">{sub}</div>}
    </div>
  )
}

/* ------------------------------ 标签 ------------------------------ */

export function LayerBadge({ id, size = 'sm' }: { id: LayerId; size?: 'sm' | 'md' }) {
  const l = LAYER_MAP[id]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 text-ink-2 whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: `var(--${id.toLowerCase()})` }} />
      {id} {l.name}
    </span>
  )
}

export function Tag({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center rounded-md bg-surface-2 border border-line px-2 py-0.5 text-[11px] text-ink-2', className)}>{children}</span>
}

const STATUS_ICON = { good: CheckCircle2, warning: AlertTriangle, serious: OctagonAlert, critical: OctagonAlert }

/** 状态标记：颜色 + 图标 + 文字，从不只靠颜色 */
export function Status({ level, children }: { level: 'good' | 'warning' | 'serious' | 'critical'; children: ReactNode }) {
  const Icon = STATUS_ICON[level]
  return (
    <span className="inline-flex items-center gap-1 text-xs text-ink-2">
      <Icon size={13} style={{ color: `var(--${level})` }} aria-hidden />
      {children}
    </span>
  )
}

export function Callout({ tone = 'info', title, children }: { tone?: 'info' | 'warn' | 'insight'; title?: ReactNode; children: ReactNode }) {
  const Icon = tone === 'warn' ? AlertTriangle : tone === 'insight' ? Lightbulb : Info
  const color = tone === 'warn' ? 'var(--warning)' : tone === 'insight' ? 'var(--l3)' : 'var(--accent)'
  return (
    <div className="flex gap-3 rounded-xl border border-line bg-surface-2/60 p-4">
      <Icon size={18} className="mt-0.5 shrink-0" style={{ color }} aria-hidden />
      <div className="text-sm text-ink-2 leading-relaxed">
        {title && <div className="font-semibold text-ink mb-1">{title}</div>}
        {children}
      </div>
    </div>
  )
}

/** 行内文献引用：悬停显示完整标题 */
export function Cite({ ids }: { ids?: SourceId[] }) {
  if (!ids?.length) return null
  return (
    <span className="text-[11px] text-muted">
      {ids.map((id, i) => {
        const s = SOURCES[id]
        return (
          <span key={id}>
            {i > 0 && '；'}
            <span title={s ? `${s.title}. ${s.venue ?? ''} (${s.year})` : id} className="underline decoration-dotted underline-offset-2 cursor-help">
              {s?.short ?? id}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/* ------------------------------ 表单 ------------------------------ */

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  hint,
}: {
  label: ReactNode
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  format?: (v: number) => string
  hint?: ReactNode
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-sm text-ink-2">{label}</span>
        <span className="text-sm font-medium text-ink tnum">{format ? format(value) : value}</span>
      </div>
      <input
        type="range"
        className="qh-range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {hint && <div className="mt-1 text-[11px] text-muted">{hint}</div>}
    </label>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div className="inline-flex flex-wrap rounded-lg border border-line bg-surface p-0.5" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            'rounded-md transition-colors',
            size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
            value === o.value ? 'bg-accent text-white' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm text-ink-2 mb-1.5">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11px] text-muted">{hint}</div>}
    </label>
  )
}

export function Button({
  children,
  onClick,
  variant = 'default',
  className,
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'ghost'
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-40',
        variant === 'primary' && 'bg-accent text-white hover:opacity-90',
        variant === 'default' && 'border border-line bg-surface-2 text-ink hover:bg-surface-3',
        variant === 'ghost' && 'text-ink-2 hover:text-ink hover:bg-surface-2',
        className,
      )}
    >
      {children}
    </button>
  )
}

/** 0..1 的水平计量条（单色，带数值标签） */
export function Meter({ value, color = 'var(--accent)', label }: { value: number; color?: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-surface-3 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }} />
      </div>
      {label !== undefined && <span className="w-10 text-right text-xs text-ink-2 tnum">{label}</span>}
    </div>
  )
}
