import { useEffect, useMemo, useState } from 'react'
import { AggregationLab } from '../components/behavior/AggregationLab'
import { CalibrationPanel } from '../components/behavior/CalibrationPanel'
import { EvidencePanel } from '../components/behavior/EvidencePanel'
import { ForecastBoard } from '../components/behavior/ForecastBoard'
import { LearningPanel } from '../components/behavior/LearningPanel'
import { LibraryPicker } from '../components/behavior/LibraryPicker'
import { PredictorDetail } from '../components/behavior/PredictorDetail'
import { Button, Callout, Card, Cite, Field, PageHeader, Section } from '../components/ui'
import { isoDate } from '../engine/behaviorSim'
import { useBehaviorData } from '../hooks/useBehaviorData'
import { useBehaviorForecasts, type Forecast, type IntentMap, type SharedContext } from '../hooks/useBehaviorForecasts'
import { useBehaviorStore } from '../store/behaviorStore'
import { useActiveProfile, useProfileStore } from '../store/profileStore'

/** 由日期推出与日历相关的情境：周末、新起点日 */
function calendarContext(date: string): Pick<SharedContext, 'weekend' | 'freshStart'> {
  const d = new Date(`${date}T12:00:00`)
  const dow = d.getDay()
  return { weekend: dow === 0 || dow === 6 ? 1 : 0, freshStart: dow === 1 || d.getDate() === 1 ? 1 : 0 }
}

export default function Behavior() {
  const p = useActiveProfile()
  const data = useBehaviorData(p)
  const record = useBehaviorStore((s) => s.record)
  const removeObs = useBehaviorStore((s) => s.removeObs)
  const setActive = useProfileStore((s) => s.setActive)

  const today = isoDate(new Date())
  const [date, setDate] = useState(today)
  const [shared, setShared] = useState<SharedContext>(() => ({ shortSleep: 0, highStress: 0, withOthers: 0, ...calendarContext(today) }))
  const [intent, setIntent] = useState<IntentMap>({})
  const [selfGuess, setSelfGuess] = useState<Record<string, number>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => setShared((s) => ({ ...s, ...calendarContext(date) })), [date])
  useEffect(() => {
    setSelectedId(null)
    setDate(today)
  }, [p.id, today])

  const forecasts = useBehaviorForecasts(data, p, shared, intent, date)
  const selected: Forecast | undefined = forecasts.find((f) => f.def.id === selectedId) ?? forecasts[0]
  const trackedDefs = useMemo(() => data.tracked.map((id) => data.defMap[id]), [data])

  const onRecord = (f: Forecast, did: 0 | 1) =>
    record({
      id: `${f.def.id}-${date}`,
      behaviorId: f.def.id,
      date,
      did,
      ctx: f.ctx,
      modelP: Number(f.pred.p.toFixed(4)),
      selfP: selfGuess[f.def.id],
    })

  return (
    <div>
      <PageHeader
        kicker="预测 · Behavior"
        title="你下一次会怎么做？"
        desc={
          <>
            预测一个人在具体某件事上的行为，最有力的证据不是性格测验，而是<strong className="text-ink">他自己在相似情境下的过去</strong>
            <Cite ids={['ouellette1998', 'wood2016']} />。这一页为每个人、每件事各建一个小模型：从人群与人格出发，用你的逐日记录不断修正，
            输出带区间的概率，并用“只看过去、预测未来”的方式诚实地检验自己有多准。
          </>
        }
      />

      <Section title="预测具体行为，靠的是什么">
        <EvidencePanel />
      </Section>

      <Section
        title={`行为天气预报 · ${p.name}`}
        desc={
          data.simulated
            ? '演示人物的行为日志是按其画像模拟生成的 90 天数据（每周/每月的行为相应更少），用来展示模型如何从记录中学习。'
            : '每天花一分钟：设定今天的情境，看预报；当天结束时点“做了/没做”。记录会存在本机，模型会逐日变得更了解你。'
        }
      >
        {data.simulated ? (
          <div className="mb-4">
            <Callout tone="info" title="这是虚构人物的模拟日志">
              想预测你自己？
              <Button variant="ghost" className="ml-1" onClick={() => setActive('me')}>
                切换到我的画像
              </Button>
            </Callout>
          </div>
        ) : (
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <Field label="记录 / 预测的日期">
              <input type="date" className="qh-input !w-auto" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </Field>
            <span className="pb-2 text-xs text-muted">可以补录过去的日子；同一天再次记录会覆盖。</span>
          </div>
        )}
        {forecasts.length ? (
          <ForecastBoard forecasts={forecasts} selectedId={selected?.def.id ?? null} onSelect={setSelectedId} onRecord={onRecord} readOnly={data.simulated} />
        ) : (
          <Card>
            <p className="text-sm text-muted">还没有追踪任何行为。在下方“行为库”中选择，或定义一个新的。</p>
          </Card>
        )}
      </Section>

      {selected && (
        <>
          <Section title={`为什么是这个数：${selected.def.name}`}>
            <PredictorDetail
              f={selected}
              shared={shared}
              setShared={setShared}
              intent={intent}
              setIntent={setIntent}
              selfGuess={selfGuess[selected.def.id]}
              setSelfGuess={(v) => setSelfGuess((m) => (v === undefined ? m : { ...m, [selected.def.id]: v }))}
              readOnly={data.simulated}
            />
          </Section>
          <Section title="模型学得怎么样" desc="一个预测系统好不好，不看它说得多自信，而看它在没见过答案时的成绩。">
            <LearningPanel f={selected} bigFive={p.bigFive} allObs={data.log} onRemove={data.simulated ? undefined : removeObs} />
          </Section>
        </>
      )}

      <Section title="全部行为的校准与成绩单">
        <CalibrationPanel defs={trackedDefs} bigFive={p.bigFive} log={data.log} />
      </Section>

      {!data.simulated && (
        <Section title="选择要预测的事" desc="从行为库中选择，或者定义任何你想预测的具体行为——只要它每天/每周/每月能明确判定“做了”或“没做”。">
          <LibraryPicker defs={data.defs} tracked={data.tracked} />
        </Section>
      )}

      <Section title="单次与一般：聚合原理">
        <AggregationLab />
      </Section>

      <Section title="边界与原则">
        <div className="grid gap-3 md:grid-cols-3">
          <Callout tone="warn" title="它能做到的上限">
            日常行为的大部分可预测性来自“你平时怎样”。情境信息通常只能再提升一小截；而真正的新情况（第一次面对的选择）几乎没有可用的历史——那正是个人能动性最大的地方。
          </Callout>
          <Callout tone="insight" title="预测是为了改变">
            看到“今天拖延的概率 70%”之后，你可以制定计划把它压下去——预测因此“失准”，但这正是它的价值。杠杆列表比概率本身更重要
            <Cite ids={['merton1948', 'gollwitzer2006']} />。
          </Callout>
          <Callout tone="info" title="只预测你自己">
            这个工具为自我理解而设计：数据只存在你的浏览器里。用类似方法在他人不知情时预测和影响其行为，会把量化变成监控与操纵
            <Cite ids={['zuboff2019']} />。
          </Callout>
        </div>
      </Section>
    </div>
  )
}
