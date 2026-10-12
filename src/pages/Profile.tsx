import { useState } from 'react'
import { Copy, Plus, RotateCcw, Trash2, UserRound } from 'lucide-react'
import { Button, Callout, Card, Field, PageHeader, Segmented, Slider, Tag } from '../components/ui'
import { cx } from '../components/cx'
import { BIG_FIVE_ITEMS, BIG_FIVE_META, LIKERT } from '../data/instruments/bigfive'
import { LIFE_EVENT_CATALOG, SCHWARTZ_META } from '../data/instruments/lifeEvents'
import { ageOf, bmi } from '../engine/body'
import { BIG_FIVE_KEYS, scoreBigFive, traitPercentile } from '../engine/scoring'
import { navigate } from '../router'
import { useActiveProfile, useProfileStore } from '../store/profileStore'
import type { Profile, Smoking, TimeUse } from '../types'

type Tab = 'body' | 'personality' | 'values' | 'social' | 'time' | 'events'

const TABS: { value: Tab; label: string }[] = [
  { value: 'body', label: '身体与生活方式' },
  { value: 'personality', label: '人格问卷' },
  { value: 'values', label: '价值观与意义' },
  { value: 'social', label: '社会关系' },
  { value: 'time', label: '时间分配' },
  { value: 'events', label: '人生事件' },
]

const TIME_LABELS: Record<keyof TimeUse, string> = {
  sleep: '睡眠',
  work: '工作 / 学习',
  commute: '通勤',
  chores: '家务 / 照料',
  social: '社交 / 陪伴',
  leisure: '休闲 / 爱好',
  exercise: '运动',
  screen: '娱乐性屏幕时间',
}

export default function ProfilePage() {
  const p = useActiveProfile()
  const update = useProfileStore((s) => s.updateMe)
  const resetMe = useProfileStore((s) => s.resetMe)
  const cloneToMe = useProfileStore((s) => s.cloneToMe)
  const setActive = useProfileStore((s) => s.setActive)
  const [tab, setTab] = useState<Tab>('body')
  const readOnly = !!p.isDemo
  const set: SetFn = (patch) => {
    if (!readOnly) update(patch)
  }

  return (
    <div>
      <PageHeader
        kicker="输入 · Measure"
        title="个人画像"
        desc="量化从测量开始。这里收集的是最低成本、最常用的几十个指标——它们只是八层模型中很小的一部分（基因组、血检、脑影像等需要专业设备，见 ROADMAP 中的数据导入计划）。"
      />

      {readOnly ? (
        <Callout tone="info" title={`「${p.name}」是虚构的演示人物，字段为只读`}>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setActive('me')}>
              <UserRound size={14} /> 切换到我的画像
            </Button>
            <Button onClick={() => cloneToMe(p.id)}>
              <Copy size={14} /> 以「{p.name}」为模板创建我的画像
            </Button>
          </div>
        </Callout>
      ) : (
        <Callout tone="insight" title="本地优先">
          你的数据只保存在本机浏览器的 localStorage 中，不会上传到任何服务器。修改即时生效，其他页面会自动重新计算。
          <div className="mt-2">
            <Button variant="ghost" onClick={() => confirm('确定把“我的画像”重置为默认值吗？') && resetMe()}>
              <RotateCcw size={14} /> 重置为默认值
            </Button>
          </div>
        </Callout>
      )}

      <div className="mt-6 mb-4 overflow-x-auto">
        <Segmented options={TABS} value={tab} onChange={setTab} />
      </div>

      <fieldset disabled={readOnly} className={cx(readOnly && 'opacity-80')}>
        {tab === 'body' && <BodyTab p={p} set={set} />}
        {tab === 'personality' && <PersonalityTab p={p} set={set} readOnly={readOnly} />}
        {tab === 'values' && <ValuesTab p={p} set={set} />}
        {tab === 'social' && <SocialTab p={p} set={set} />}
        {tab === 'time' && <TimeTab p={p} set={set} />}
        {tab === 'events' && <EventsTab p={p} set={set} readOnly={readOnly} />}
      </fieldset>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => navigate('/present')}>
          查看“现在 · 解读”
        </Button>
        <Button onClick={() => navigate('/future')}>查看“未来 · 预测”</Button>
      </div>
    </div>
  )
}

type SetFn = (patch: Partial<Profile> | ((me: Profile) => Partial<Profile>)) => void
type TabProps = { p: Profile; set: SetFn }

function BodyTab({ p, set }: TabProps) {
  const b = bmi(p.heightCm, p.weightKg)
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="基本信息" subtitle="L0 / L2">
        <div className="grid gap-4 sm:grid-cols-2">
          {!p.isDemo && (
            <Field label="称呼">
              <input className="qh-input" value={p.name} onChange={(e) => set({ name: e.target.value })} maxLength={12} />
            </Field>
          )}
          <Field label="出生年份" hint={`当前约 ${ageOf(p).toFixed(1)} 岁（按年中出生估算）`}>
            <input
              type="number"
              className="qh-input"
              min={1920}
              max={new Date().getFullYear() - 1}
              value={p.birthYear}
              onChange={(e) => set({ birthYear: Number(e.target.value) })}
            />
          </Field>
          <Field label="生理性别" hint="用于代谢与生命表公式">
            <Segmented
              options={[
                { value: 'female', label: '女' },
                { value: 'male', label: '男' },
              ]}
              value={p.sex}
              onChange={(v) => set({ sex: v })}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4">
          <Slider label="身高" value={p.heightCm} min={140} max={205} onChange={(v) => set({ heightCm: v })} format={(v) => `${v} cm`} />
          <Slider label="体重" value={p.weightKg} min={35} max={150} step={0.5} onChange={(v) => set({ weightKg: v })} format={(v) => `${v} kg`} hint={`BMI ${b.toFixed(1)}`} />
          <Slider label="静息心率" value={p.restingHR} min={40} max={110} onChange={(v) => set({ restingHR: v })} format={(v) => `${v} 次/分`} hint="早晨醒来静卧 1 分钟测量" />
        </div>
      </Card>
      <Card title="生活方式" subtitle="L3 / L5 —— 对寿命模型影响最大的变量">
        <div className="grid gap-4">
          <Slider label="平均睡眠时长" value={p.sleepHours} min={4} max={11} step={0.1} onChange={(v) => set({ sleepHours: v })} format={(v) => `${v.toFixed(1)} 小时`} />
          <Slider
            label="每周中等强度运动"
            value={p.exerciseMin}
            min={0}
            max={900}
            step={10}
            onChange={(v) => set({ exerciseMin: v })}
            format={(v) => `${v} 分钟`}
            hint="快走、骑车等；高强度（跑步、球类）按 2 倍折算。WHO 推荐 150–300 分钟"
          />
          <Field label="吸烟">
            <Segmented<Smoking>
              options={[
                { value: 'never', label: '从不' },
                { value: 'former', label: '已戒' },
                { value: 'current', label: '目前吸烟' },
              ]}
              value={p.smoking}
              onChange={(v) => set({ smoking: v })}
            />
          </Field>
          <Slider label="每周饮酒" value={p.drinksPerWeek} min={0} max={42} onChange={(v) => set({ drinksPerWeek: v })} format={(v) => `${v} 标准杯`} hint="1 标准杯 ≈ 10 g 酒精 ≈ 一罐啤酒 / 一小杯葡萄酒" />
          <Slider
            label="饮食质量"
            value={p.diet}
            min={1}
            max={5}
            onChange={(v) => set({ diet: v })}
            format={(v) => ['', '很差', '较差', '一般', '较好', '很好'][v]}
            hint="很好 = 蔬果全谷充足、少盐少糖少加工肉"
          />
        </div>
      </Card>
    </div>
  )
}

function PersonalityTab({ p, set, readOnly }: TabProps & { readOnly: boolean }) {
  const answers = p.bigFiveAnswers ?? {}
  const answered = Object.keys(answers).length
  const setAnswer = (id: string, v: number) =>
    set((me) => {
      const next = { ...(me.bigFiveAnswers ?? {}), [id]: v }
      const scored = scoreBigFive(next)
      return { bigFiveAnswers: next, ...(scored ? { bigFive: scored } : {}) }
    })
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card title="20 题简版大五人格" subtitle={`已答 ${answered}/20 · 题目来自公有领域 IPIP 题库（Mini-IPIP 结构），中文版未经常模校准`}>
        {readOnly && <p className="mb-3 text-xs text-muted">演示人物直接给出了分数，没有逐题作答。</p>}
        <ol className="space-y-3">
          {BIG_FIVE_ITEMS.map((item, i) => (
            <li key={item.id} className="rounded-lg bg-surface-2/60 p-3">
              <div className="text-sm text-ink">
                <span className="text-muted tnum mr-2">{i + 1}.</span>
                {item.text}
              </div>
              <div className="mt-2 grid grid-cols-5 gap-1" role="radiogroup" aria-label={item.text}>
                {LIKERT.map((l, j) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={answers[item.id] === j + 1}
                    onClick={() => setAnswer(item.id, j + 1)}
                    className={cx(
                      'rounded-md border px-1 py-1 text-[11px] leading-tight transition-colors',
                      answers[item.id] === j + 1 ? 'border-accent bg-accent text-white' : 'border-line text-ink-2 hover:border-line-strong',
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </Card>
      <div className="space-y-4 lg:sticky lg:top-6 self-start">
        <Card title="当前得分" subtitle="1–5 分；百分位基于近似常模，仅示意">
          <div className="space-y-4">
            {BIG_FIVE_KEYS.map((k) => (
              <div key={k}>
                <Slider
                  label={`${BIG_FIVE_META[k].name} ${k}`}
                  value={Number(p.bigFive[k].toFixed(2))}
                  min={1}
                  max={5}
                  step={0.05}
                  onChange={(v) => set((me) => ({ bigFive: { ...me.bigFive, [k]: v } }))}
                  format={(v) => `${v.toFixed(2)} · P${Math.round(traitPercentile(k, v))}`}
                  hint={`高：${BIG_FIVE_META[k].high}；低：${BIG_FIVE_META[k].low}`}
                />
              </div>
            ))}
          </div>
        </Card>
        <Callout tone="warn" title="关于人格测量的诚实说明">
          20 题问卷每个维度只有 4 题，信度有限（单维 α 约 0.6–0.8），重测时分数会有±0.3 左右的波动。人格分数是“倾向”，不是“标签”。
        </Callout>
      </div>
    </div>
  )
}

function ValuesTab({ p, set }: TabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="施瓦茨十种基本价值观" subtitle="0 = 完全不重要 … 10 = 极其重要。系统会做个人均值中心化，只看相对排序">
        <div className="grid gap-3.5">
          {SCHWARTZ_META.map((m) => (
            <Slider
              key={m.key}
              label={
                <>
                  {m.name} <span className="text-[11px] text-muted">· {m.axis}</span>
                </>
              }
              value={p.values[m.key]}
              min={0}
              max={10}
              onChange={(v) => set((me) => ({ values: { ...me.values, [m.key]: v } }))}
            />
          ))}
        </div>
      </Card>
      <div className="space-y-4">
        <Card title="生活评价与意义" subtitle="L7">
          <div className="grid gap-4">
            <Slider label="坎特里尔阶梯：你现在站在第几级？" value={p.lifeSat} min={0} max={10} onChange={(v) => set({ lifeSat: v })} hint="0 = 可能的最差生活，10 = 可能的最好生活" />
            <Slider label="目的感：我的人生有明确的方向和目标" value={p.purpose} min={1} max={7} onChange={(v) => set({ purpose: v })} hint="1 = 完全不同意，7 = 完全同意" />
            <Slider label="近一个月感知压力" value={p.stress} min={0} max={10} onChange={(v) => set({ stress: v })} />
          </div>
        </Card>
        <Card title="PERMA 幸福五要素" subtitle="0–10">
          <div className="grid gap-3.5">
            {(
              [
                ['P', '积极情绪：经常感到快乐、满足'],
                ['E', '投入：经常全神贯注、忘记时间'],
                ['R', '关系：感到被爱和支持'],
                ['M', '意义：做的事情有价值'],
                ['A', '成就：在实现自己的目标'],
              ] as const
            ).map(([k, l]) => (
              <Slider key={k} label={l} value={p.perma[k]} min={0} max={10} onChange={(v) => set((me) => ({ perma: { ...me.perma, [k]: v } }))} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function SocialTab({ p, set }: TabProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card title="关系网络" subtitle="L6">
        <div className="grid gap-4">
          <Slider label="危机时可以求助的人数" value={p.closeTies} min={0} max={15} onChange={(v) => set({ closeTies: v })} hint="邓巴“支持圈”通常约 5 人" />
          <Slider label="社会支持感" value={p.support} min={1} max={5} onChange={(v) => set({ support: v })} hint="1 = 几乎没有支持，5 = 非常充分" />
          <Slider label="孤独感" value={p.loneliness} min={1} max={5} onChange={(v) => set({ loneliness: v })} hint="1 = 从不孤独，5 = 经常孤独" />
        </div>
      </Card>
      <Card title="社会经济位置" subtitle="L6">
        <div className="grid gap-4">
          <Slider label="受教育年限" value={p.eduYears} min={0} max={24} onChange={(v) => set({ eduYears: v })} hint="小学 6 · 初中 9 · 高中 12 · 本科 16 · 硕士 19 · 博士 22+" />
          <Slider label="收入在本地成年人中的百分位" value={p.incomePct} min={1} max={99} onChange={(v) => set({ incomePct: v })} format={(v) => `P${v}`} />
        </div>
      </Card>
    </div>
  )
}

function TimeTab({ p, set }: TabProps) {
  const total = Object.values(p.timeUse).reduce((s, x) => s + x, 0)
  const ok = Math.abs(total - 24) < 0.05
  return (
    <Card title="典型工作日的 24 小时" subtitle="时间分配是揭示真实优先级最诚实的数据">
      <div className={cx('mb-4 rounded-lg px-3 py-2 text-sm', ok ? 'bg-surface-2 text-ink-2' : 'bg-surface-2 text-ink')}>
        合计 <b className="tnum">{total.toFixed(1)}</b> / 24 小时 {ok ? '✓' : total > 24 ? '（超出了，请减少某些项）' : '（还有剩余时间未分配）'}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(TIME_LABELS) as (keyof TimeUse)[]).map((k) => (
          <Slider
            key={k}
            label={TIME_LABELS[k]}
            value={p.timeUse[k]}
            min={0}
            max={16}
            step={0.1}
            onChange={(v) => set((me) => ({ timeUse: { ...me.timeUse, [k]: Number(v.toFixed(1)) }, ...(k === 'sleep' ? { sleepHours: v } : {}) }))}
            format={(v) => `${v.toFixed(1)} h`}
          />
        ))}
      </div>
    </Card>
  )
}

function EventsTab({ p, set, readOnly }: TabProps & { readOnly: boolean }) {
  const [age, setAge] = useState(Math.floor(ageOf(p)))
  const [pick, setPick] = useState(0)
  const [custom, setCustom] = useState('')
  const add = () => {
    const c = LIFE_EVENT_CATALOG[pick]
    const label = custom.trim() || c.label
    set((me) => ({
      events: [...me.events, { id: Math.random().toString(36).slice(2, 9), age, label, lcu: c.lcu, valence: c.valence }].sort((a, b) => a.age - b.age),
    }))
    setCustom('')
  }
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
      <Card title="添加人生事件" subtitle="LCU 来自 Holmes–Rahe 社会再适应量表（1967），衡量“需要再适应的程度”">
        <div className="grid gap-3">
          <Field label="事件类型（决定 LCU 权重）">
            <select className="qh-input" value={pick} onChange={(e) => setPick(Number(e.target.value))}>
              {LIFE_EVENT_CATALOG.map((c, i) => (
                <option key={c.label} value={i}>
                  {c.label}（{c.lcu}）
                </option>
              ))}
            </select>
          </Field>
          <Field label="自定义描述（可选）">
            <input className="qh-input" value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="例如：考上研究生" maxLength={30} />
          </Field>
          <Slider label="发生年龄" value={age} min={0} max={Math.max(1, Math.floor(ageOf(p)))} onChange={setAge} format={(v) => `${v} 岁`} />
          <Button variant="primary" onClick={add} disabled={readOnly}>
            <Plus size={14} /> 添加
          </Button>
        </div>
      </Card>
      <Card title={`已记录 ${p.events.length} 个事件`}>
        {p.events.length === 0 && <p className="text-sm text-muted">还没有记录。人生事件会出现在“过去 · 解构”页的时间轴上。</p>}
        <ul className="divide-y divide-line">
          {p.events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2">
              <span className="w-12 text-sm text-muted tnum">{e.age} 岁</span>
              <span className="flex-1 text-sm text-ink">{e.label}</span>
              <Tag>LCU {e.lcu}</Tag>
              {!readOnly && (
                <button onClick={() => set((me) => ({ events: me.events.filter((x) => x.id !== e.id) }))} aria-label={`删除 ${e.label}`} className="rounded p-1 text-muted hover:text-ink">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
