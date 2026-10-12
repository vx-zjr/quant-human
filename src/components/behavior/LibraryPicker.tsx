import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { CATEGORY_META } from '../../data/behaviors'
import { useBehaviorStore } from '../../store/behaviorStore'
import type { BehaviorCategory, BehaviorDef } from '../../types'
import { cx } from '../cx'
import { Button, Card, Field, Segmented, Slider } from '../ui'

/** 选择要追踪的行为，或定义任何你想预测的新行为 */
export function LibraryPicker({ defs, tracked }: { defs: BehaviorDef[]; tracked: string[] }) {
  const toggle = useBehaviorStore((s) => s.toggleTracked)
  const addCustom = useBehaviorStore((s) => s.addCustom)
  const removeCustom = useBehaviorStore((s) => s.removeCustom)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<BehaviorCategory>('health')
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [rate, setRate] = useState(0.3)
  const [avoid, setAvoid] = useState(false)

  const cats = Object.keys(CATEGORY_META) as BehaviorCategory[]

  const add = () => {
    const n = name.trim()
    if (!n) return
    addCustom({
      id: `custom-${Date.now().toString(36)}`,
      name: n,
      category,
      window: period,
      question: `${period === 'day' ? '今天' : period === 'week' ? '这周' : '这个月'}会「${n}」吗？`,
      baseRate: rate,
      baseRateNote: '你自己给出的先验',
      habitual: false,
      avoid,
      custom: true,
    })
    setName('')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      <Card title="行为库" subtitle={`已追踪 ${tracked.length} 项 · 点击切换`}>
        <div className="space-y-3">
          {cats.map((c) => (
            <div key={c}>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs text-muted">
                <span className="h-2 w-2 rounded-full" style={{ background: CATEGORY_META[c].color }} />
                {CATEGORY_META[c].name}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {defs
                  .filter((d) => d.category === c)
                  .map((d) => (
                    <span key={d.id} className="inline-flex items-center">
                      <button
                        type="button"
                        aria-pressed={tracked.includes(d.id)}
                        onClick={() => toggle(d.id)}
                        className={cx(
                          'rounded-full border px-2.5 py-1 text-xs transition-colors',
                          tracked.includes(d.id) ? 'border-accent bg-accent-soft text-ink' : 'border-line text-ink-2 hover:text-ink',
                        )}
                      >
                        {d.name}
                        {d.custom && ' ·自定义'}
                      </button>
                      {d.custom && (
                        <button
                          type="button"
                          onClick={() => confirm(`删除自定义行为「${d.name}」及其全部记录？`) && removeCustom(d.id)}
                          aria-label={`删除 ${d.name}`}
                          className="ml-0.5 rounded p-1 text-muted hover:text-ink"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </span>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card title="预测任何一件事" subtitle="定义一个新行为。没有文献先验时，你自己的猜测就是起点，之后由记录修正">
        <div className="grid gap-3">
          <Field label="行为（尽量具体、可判定）">
            <input className="qh-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：午饭后散步 15 分钟" maxLength={30} />
          </Field>
          <Field label="类别">
            <select className="qh-input" value={category} onChange={(e) => setCategory(e.target.value as BehaviorCategory)}>
              {cats.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="预测周期">
            <Segmented
              size="sm"
              options={[
                { value: 'day', label: '每天' },
                { value: 'week', label: '每周' },
                { value: 'month', label: '每月' },
              ]}
              value={period}
              onChange={setPeriod}
            />
          </Field>
          <Slider label="你猜自己平时有多大比例会做" value={rate} min={0.05} max={0.95} step={0.05} onChange={setRate} format={(v) => `${Math.round(v * 100)}%`} />
          <label className="flex items-center gap-2 text-sm text-ink-2">
            <input type="checkbox" checked={avoid} onChange={(e) => setAvoid(e.target.checked)} />
            这是一件我想避免的事
          </label>
          <Button variant="primary" onClick={add} disabled={!name.trim()}>
            <Plus size={14} /> 添加并开始追踪
          </Button>
        </div>
      </Card>
    </div>
  )
}
