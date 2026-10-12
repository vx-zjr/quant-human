import { useMemo } from 'react'
import { EChart } from '../components/EChart'
import { axisStyle, baseText, tooltipStyle } from '../components/chartStyle'
import { Callout, Card, ChartCard, Cite, PageHeader, Section, Tag } from '../components/ui'
import { LAYERS } from '../data/layers'
import { useChartTheme } from '../theme'

/** 各层与“你是谁”的相关度（本项目主观评估，用于说明观点） */
const IDENTITY_RELEVANCE: Record<string, number> = { L0: 0.05, L1: 0.3, L2: 0.35, L3: 0.55, L4: 0.8, L5: 0.6, L6: 0.65, L7: 0.95 }

const THESES = [
  {
    title: '人在统计上高度可预测，在个体上深刻不确定',
    body: '日常位置可预测性上限达 93%，人群生命表可以精确到小数点；但用 1.3 万个变量预测一个孩子 15 岁时的处境，最好的模型 R² 也只有 0.2 左右。“人群规律”与“个人命运”之间隔着一条由随机性与个体独特性构成的鸿沟。',
    cites: ['song2010', 'salganik2020'],
  },
  {
    title: '可量化 ≠ 可预测 ≠ 可理解',
    body: '身高可以测到毫米、遗传度 80%，但这对理解一个人几乎无用；目的感只能自评、误差很大，却与寿命和幸福显著相关。量化一个维度的精度，与它对“这个人”的解释力，并不同向。',
    cites: ['yengo2022', 'cohen2016'],
  },
  {
    title: '重要性与可测性呈反比',
    body: '越底层越容易测（原子、基因、血压），越顶层越接近“你是谁”（价值、意义、叙事），却越难测。这不是技术暂时落后，而是因为高层属性是低层的关系模式与第一人称体验，无法通过更细的切分获得。',
    cites: ['chalmers1995', 'mcadams2006'],
  },
  {
    title: '“E”是最大的一块，它主要由偶然与独特经历构成',
    body: '行为遗传学的第三定律：相当一部分个体差异既非基因也非家庭所能解释。克隆小鼠在同一环境中也会长出各自的个性。这块“残差”不是模型的失败，而是个体性的来源——也是自由与运气的栖身之处。',
    cites: ['turkheimer2000', 'freund2013'],
  },
  {
    title: '过去比未来更可知，但同样不完整',
    body: '过去已发生，但信息在耗散，记忆在重构，意义在被重新讲述。“解构过去”能给出结构（阶段、事件、方差来源），却给不出一份完整录像。',
    cites: ['landauer1961', 'loftus1974'],
  },
  {
    title: '正确的目标是“校准”，而不是“预言”',
    body: '天气预报不会告诉你明天一定下雨，而是说降水概率 70%——并且长期来看，它说 70% 的日子里真的约有 70% 下了雨。量化一个人的未来，应当以概率分布呈现、随新数据持续更新、并接受事后检验。',
    cites: ['brier1950', 'tetlock2015'],
  },
  {
    title: '最大的风险不是量化不准，而是量化太准却被误用',
    body: '一个足够准的“人生评分”可以被保险、雇主、平台用于歧视或操纵；一个被公开的预测会改变被预测者（自我实现/自我挫败）；一个被设为目标的指标会被“刷分”。量化越强，越需要边界。',
    cites: ['oneil2016', 'zuboff2019', 'goodhart1975'],
  },
]

const ROADMAP: { v: string; title: string; why: string; items: string[] }[] = [
  {
    v: 'v0.2 ✓',
    title: '具体行为预测（已完成第一版）',
    why: '预测“每个人在每件事上的行为”，最有力的证据是这个人自己在相似情境下的过去。',
    items: ['每人每件事一个贝叶斯模型：人群 + 人格先验 → 个人记录后验', '行为天气预报、贡献分解、杠杆', '序贯评估与校准：模型 vs 基础率 vs 直觉', '熵 + Fano 可预测性上限；下一步：层级模型、时间结构、行为耦合网络'],
  },
  {
    v: 'v0.3',
    title: '测量更准',
    why: '当前心理量表为英文常模、题量偏少；L3 认知层只能引用文献而无法实测。',
    items: ['引入中国成人常模（大五、生活满意度）', '浏览器内认知小任务：反应时、数字广度、n-back、Stroop', '可选的 PHQ-9 / GAD-7 自评（附危机求助资源与免责声明）', '每个量表显示信度与测量误差区间'],
  },
  {
    v: 'v0.4',
    title: '接入真实数据（全部本地解析）',
    why: '自评数据稀疏且有偏；可穿戴与体检数据能大幅提升 L2/L5 的分辨率。',
    items: ['导入 Apple 健康 / 华为运动健康 / 小米运动的导出文件', '体检报告手动录入（血压、血脂、血糖、hs-CRP）', '基因原始数据本地解析少量高证据位点（如 ALDH2 rs671 酒精代谢）', '数据导入/导出 JSON，一键清除'],
  },
  {
    v: 'v0.5',
    title: '从快照到时间序列',
    why: '一个人的“现在”是动态的；个人基线比人群常模更有解释力。',
    items: ['连续指标打卡：情绪、精力、睡眠质量、压力', '经验取样提醒（PWA 通知）', '个人基线与异常检测', 'N-of-1 自我实验：A/B 周期 + 贝叶斯分析'],
  },
  {
    v: 'v0.6',
    title: '模型可校准、带不确定性',
    why: '目前事件概率为数量级示意，风险比没有区间。',
    items: ['用中国生命表替代 Gompertz 近似', '婚育、离婚、疾病发病率按年龄与性别校准到统计年鉴', '风险比按置信区间抽样，生存曲线显示不确定带', '模型版本化：每次参数修改记录在 CHANGELOG'],
  },
  {
    v: 'v0.7',
    title: '因果图谱',
    why: '维度之间不是孤立的：睡眠影响情绪，情绪影响关系，关系影响健康。',
    items: ['维度间因果 DAG 浏览器（标注证据等级：RCT / 孟德尔随机化 / 观察性）', '干预模拟：改变一个节点，看下游变化', '区分“相关”“因果”“反向因果”的可视化'],
  },
  {
    v: 'v0.8',
    title: '叙事层与 AI 解读',
    why: 'L7 叙事认同目前只能定性；大语言模型可以辅助编码人生故事。',
    items: ['可选接入 Claude API（用户自带密钥，本地调用）', '人生故事写作 → 救赎/污染序列、能动性、共融主题编码', '个性化解读报告（严格引用本项目数据与文献）'],
  },
  {
    v: 'v1.0',
    title: '研究级与开放',
    why: '一个量化框架的价值取决于它被检验的程度。',
    items: ['英文版与无障碍审计', '方法论白皮书与全部参数公开', '与真实队列数据比对的验证报告', '插件化：社区可贡献新维度、新量表、新模型'],
  },
]

export default function Insights() {
  const t = useChartTheme()
  const scatter = useMemo(
    () => ({
      ...baseText(t),
      tooltip: {
        ...tooltipStyle(t),
        formatter: (p: { data: { name: string; value: number[] } }) => `${p.data.name}<br/>可量化 ${Math.round(p.data.value[0] * 100)}% · 与“你是谁”相关 ${Math.round(p.data.value[1] * 100)}%`,
      },
      grid: { left: 8, right: 24, top: 40, bottom: 24, containLabel: true },
      xAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '可量化程度 →', nameLocation: 'middle', nameGap: 26, axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
      yAxis: { type: 'value', min: 0, max: 1, ...axisStyle(t), name: '与“你是谁”的相关度 →', axisLabel: { ...axisStyle(t).axisLabel, formatter: (v: number) => `${v * 100}%` } },
      series: [
        {
          type: 'scatter',
          symbolSize: 14,
          data: LAYERS.map((l) => ({ name: `${l.id} ${l.name}`, value: [l.quantifiability, IDENTITY_RELEVANCE[l.id]] })),
          itemStyle: { color: t.series[0], borderColor: t.surface, borderWidth: 2 },
          label: { show: true, position: 'right', color: t.ink2, fontSize: 11, formatter: (p: { name: string }) => p.name },
        },
        {
          type: 'line',
          data: [
            [0.25, 0.97],
            [0.98, 0.05],
          ],
          showSymbol: false,
          silent: true,
          lineStyle: { color: t.axis, width: 1.5 },
        },
      ],
    }),
    [t],
  )

  return (
    <div>
      <PageHeader
        kicker="看法与建议 · Perspective"
        title="能量化到什么程度？我的看法"
        desc="你提出的目标——“解构、解读、解释、解析、预测每一个人的所有过去、现在和未来”——是一个值得认真对待的北极星。但我认为必须直说：它的字面版本在原理上不可达，在伦理上也不应以字面方式追求。下面是我的判断、理由，以及我建议这个项目接下来怎么走。"
      />

      <Callout tone="insight" title="一句话结论">
        把“预测一个人的一切”改写为：<b>为一个人建立一个分层、透明、带不确定性、可被检验、可持续更新的模型</b>——并且让这个人本人拥有它、看懂它、能反驳它。这既是科学上可达的最强版本，也是伦理上站得住的版本。
      </Callout>

      <Section title="七个核心判断">
        <div className="grid gap-3 md:grid-cols-2">
          {THESES.map((x, i) => (
            <Card key={x.title}>
              <div className="flex gap-3">
                <span className="text-2xl font-semibold text-accent tnum leading-none">{i + 1}</span>
                <div>
                  <h3 className="font-semibold text-ink">{x.title}</h3>
                  <p className="mt-1.5 text-sm text-ink-2 leading-relaxed">{x.body}</p>
                  <div className="mt-2">
                    <Cite ids={x.cites} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="重要性与可测性的反比" desc="横轴是各层的可量化程度，纵轴是它与“你是谁”（身份认同、他人如何认识你）的相关度。两者都是本项目的主观评估，用来表达观点，不是测量结果。">
        <ChartCard title="越接近“你”，越难被量化" table={{ columns: ['层', '可量化', '与身份相关'], rows: LAYERS.map((l) => [`${l.id} ${l.name}`, l.quantifiability, IDENTITY_RELEVANCE[l.id]]) }}>
          <EChart option={scatter} height={360} label="各层可量化程度与身份相关度散点图" />
        </ChartCard>
      </Section>

      <Section title="对五个动词的逐一评估">
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-surface-2 text-ink-2">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">动词</th>
                <th className="px-4 py-2.5 text-left font-medium">今天能做到</th>
                <th className="px-4 py-2.5 text-left font-medium">原理性上限</th>
                <th className="px-4 py-2.5 text-left font-medium">本项目的做法</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line bg-surface text-ink-2">
              {[
                ['解构', '120+ 维度、8 层，覆盖从原子到意义的主要可测指标', '高层属性是关系与体验，切得再细也拼不回“整体”', '分层本体 + 每维标注可测性与缺失'],
                ['解读', '对体测、血检、量表给出百分位与生物年龄', '常模依赖人群与文化；自评有偏；测量改变被测者', '显示参照系、误差与“仅示意”标签'],
                ['解释', '人群层面的方差分解与部分因果识别（RCT、自然实验）', '个体层面的基因-环境乘法纠缠无法拆分；E 分量大', 'ACE 分解 + 明确“人群≠个体”'],
                ['解析', '识别反馈回路、关键杠杆、风险因素交互', '混沌与计算不可约性限制长期动力学推演', '杠杆排序、混沌演示、因果图（路线图）'],
                ['预测', '短期日常行为（主要靠个人历史）、人群寿命分布、部分疾病风险', '个体人生事件近乎不可预测；单次行为受情境与偶然左右；预测具有反身性', '概率分布 + 蒙特卡洛 + 个人贝叶斯行为模型 + 序贯评估与校准'],
              ].map((r) => (
                <tr key={r[0]}>
                  <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">{r[0]}</td>
                  <td className="px-4 py-3">{r[1]}</td>
                  <td className="px-4 py-3">{r[2]}</td>
                  <td className="px-4 py-3">{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="伦理边界：量化越强，越需要红线" desc="这些原则已写入 AGENT.md，作为后续每一轮迭代都必须遵守的约束。">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[
            ['本地优先', '个人数据只存在用户设备上；任何上传都必须显式同意、可撤回。健康、生物识别、行踪轨迹等属于《个人信息保护法》界定的敏感个人信息。'],
            ['概率而非宿命', '永远展示分布与不确定性，不输出“你会……”式的确定性断言，不给人贴标签。'],
            ['人群 ≠ 个体', '人群统计规律不能直接套用到个人；更不能用群体（性别、地域、民族）分数推断个人——这是生态谬误，也是歧视的温床。'],
            ['知情与不知情的权利', '对高外显致病变异等结果，用户有权选择不知道；展示前需要清楚的心理准备提示。'],
            ['不诊断、不替代专业', '心理与医学指标只用于自我觉察；出现风险信号时提供求助资源，而不是给出诊断。'],
            ['防古德哈特', '不把任何综合分设计成“需要刷高的分数”；强调趋势与杠杆，而不是排名。'],
          ].map(([h, b]) => (
            <Card key={h}>
              <div className="font-semibold text-ink">{h}</div>
              <p className="mt-1 text-sm text-ink-2 leading-relaxed">{b}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="项目路线图建议" desc="按“先测准、再接数据、再做动态、再做因果、最后做叙事”的顺序推进。每一轮迭代都应该让某一层的可量化程度或某个模型的校准度可衡量地提升。">
        <ol className="relative space-y-3 border-l border-line pl-6">
          {ROADMAP.map((r) => (
            <li key={r.v} className="relative">
              <span className="absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-surface bg-accent" />
              <Card>
                <div className="flex flex-wrap items-center gap-2">
                  <Tag>{r.v}</Tag>
                  <h3 className="font-semibold text-ink">{r.title}</h3>
                </div>
                <p className="mt-1 text-xs text-muted">为什么：{r.why}</p>
                <ul className="mt-2 grid gap-1 text-sm text-ink-2 md:grid-cols-2">
                  {r.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <span className="text-accent">·</span>
                      {it}
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="给使用者的建议：如何用量化帮助自己">
        <div className="grid gap-3 md:grid-cols-2">
          <Card title="少而准，胜过多而乱">
            <p className="text-sm text-ink-2 leading-relaxed">
              对大多数人，持续追踪 5 个指标就够了：睡眠时长与规律、每周运动量、静息心率、体重/腰围、一个情绪或满意度评分。看<b className="text-ink">趋势</b>，不看单点。
            </p>
          </Card>
          <Card title="盯住杠杆，而不是分数">
            <p className="text-sm text-ink-2 leading-relaxed">
              从证据看，对健康寿命影响最大的可改变因素依次大致是：不吸烟、规律运动、维持社会联结、充足规律的睡眠、合理体重与饮食。“未来 · 预测”页会为你单独排序。
            </p>
          </Card>
          <Card title="为自己的预测记账">
            <p className="text-sm text-ink-2 leading-relaxed">
              你对自己的了解，可以被量化地检验。坚持记录预测账本几个月，你会看到自己在哪些领域过度自信——这比任何人格测验都更能揭示你。
            </p>
          </Card>
          <Card title="给不确定性留出位置">
            <p className="text-sm text-ink-2 leading-relaxed">
              模型说“80% 的区间是 66–95 岁”，真正的信息是那段宽度。没有被预测到的部分，不是你的缺陷，而是你尚未被书写的部分。
            </p>
          </Card>
        </div>
      </Section>

      <Section title="最后">
        <Callout tone="info">
          量化是一支手电筒，不是一面镜子：它能照亮一个人的许多角落，却照不出那个正在举着手电筒的人。这个项目值得做下去——不是为了最终“算尽”一个人，而是为了在每一轮迭代中，更清楚地知道我们知道什么、不知道什么，以及为什么。
        </Callout>
      </Section>
    </div>
  )
}
