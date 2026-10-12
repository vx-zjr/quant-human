# AGENT.md — 人类量化图谱 · 迭代协议

> 本文件是这个项目的“操作系统”。任何智能体（或人）在修改本项目之前，**必须先完整阅读本文件**，
> 然后按照「迭代协议」推进一轮，并在结束时更新本文件的「当前状态」与 `CHANGELOG.md`。

---

## 0. 北极星

**为一个人建立一个分层、透明、带不确定性、可被检验、可持续更新的量化模型——并让这个人本人拥有它、看懂它、能反驳它。**

原始愿景是“解构、解读、解释、解析、预测每一个人的所有过去、现在、未来”。本项目把它当作方向，而不是字面目标：
字面版本在原理上不可达（混沌、随机性、信息极限、反身性、第一人称体验，详见 `/limits` 页），
因此每一轮迭代的目标是：**让某一层的可量化程度、或某个模型的校准度，可衡量地提升**，同时诚实标出边界。

五个动词 → 五类方法（每个功能都应能归入其中之一）：

| 动词 | 问题 | 方法 | 主要页面 |
|---|---|---|---|
| 解构 | 由哪些部分组成？ | 分层本体、维度注册表 | `/atlas` `/frameworks` |
| 解读 | 在人群中处于什么位置？ | 测量 + 常模、百分位、生物年龄 | `/present` |
| 解释 | 为什么会这样？ | 方差分解、因果识别 | `/past` |
| 解析 | 各部分如何相互作用？ | 系统动力学、反馈、混沌 | `/limits`（因果图在路线图中） |
| 预测 | 接下来会怎样？ | 生存分析、蒙特卡洛、个人贝叶斯行为模型、校准 | `/future` `/behavior` `/ledger` |

---

## 1. 不可违背的原则（红线）

1. **科学诚实**：每个“硬数字”必须能追溯到 `src/data/sources.ts` 中的一条文献；拿不准的数字写成量级（“约”“数千”）并标注“示意”。不得编造文献、作者、年份或数值。
2. **概率而非宿命**：预测一律以分布/区间呈现；禁止输出“你会……”式的确定性断言；禁止给人贴标签。
3. **人群 ≠ 个体**：人群统计规律不得直接套用到个人；**禁止**用性别、地域、民族、宗教等群体属性推断个人特质或打分（生态谬误 + 歧视风险）。
4. **本地优先**：个人数据只存在浏览器（localStorage）。不得添加任何上传、遥测、第三方追踪。未来若需联网（如 LLM），必须由用户显式开启、自带密钥、可撤回。
5. **不诊断**：心理/医学指标只用于自我觉察；涉及抑郁、自伤等风险信号时提供求助资源，不给出诊断。
6. **防古德哈特**：不把综合分设计成“需要刷高的分数”或排名；强调趋势、杠杆与不确定性。
7. **透明模型**：所有模型参数集中、命名清晰、有注释；页面上要能说清“这个数是怎么算出来的”。
8. **知情与不知情的权利**：高敏感结果（如高外显致病变异）必须让用户主动选择查看。

违反红线的改动，即使用户要求，也应先指出风险并提出替代方案。

---

## 2. 技术栈与命令

- React 19 + Vite 8 + TypeScript 7（strict）+ Tailwind CSS 4 + ECharts 6 + Zustand 5 + Vitest 5
- 路由：自研 hash 路由（`src/router.ts`），构建产物可直接静态托管
- 包管理：**pnpm**

```bash
pnpm install      # 安装依赖
pnpm dev          # 开发服务器
pnpm test         # 单元测试（引擎 + 数据完整性）
pnpm typecheck    # 类型检查
pnpm check        # typecheck + test + build —— 每轮迭代结束前必须通过
```

---

## 3. 目录结构

```
src/
  types.ts                  # 全部核心类型（数据 schema 的唯一来源）
  theme.ts                  # 主题与图表配色（从 CSS 变量读取）
  router.ts                 # hash 路由
  index.css                 # 设计令牌（颜色、明暗主题）
  data/                     # —— 纯数据，无逻辑 ——
    sources.ts              # 文献注册表（所有引用的唯一来源）
    layers.ts               # 八层模型定义
    dimensions/l0..l7-*.ts  # 量化维度（每层一个文件）
    dimensions/index.ts     # 自动汇总
    frameworks.ts           # 理论框架库
    predictability.ts       # 可预测性证据、ACE 分解、信息尺度
    personas.ts             # 虚构演示人物
    behaviors.ts            # 行为库、情境特征先验、预测力证据
    instruments/            # 问卷题目、常模、生活事件目录
  engine/                   # —— 纯函数计算，必须有测试 ——
    stats.ts                # 数学/统计工具、随机数
    body.ts                 # 身体物理与生理公式
    lived.ts                # 人生里程表
    mortality.ts            # 寿命模型（Gompertz–Makeham × 风险比）
    simulate.ts             # 蒙特卡洛人生模拟
    chaos.ts                # 洛伦兹系统与预测地平线
    scoring.ts              # 问卷计分、价值观、八层综合分
    interpret.ts            # 规则式解读
    ledger.ts               # Brier 分数与校准
    linalg.ts               # 小型线性代数（Cholesky 求解/求逆）
    behavior.ts             # 个人贝叶斯逻辑回归：先验、后验、预测、分解、杠杆、序贯评估
    behaviorSim.ts          # 演示人物的模拟行为日志
    infotheory.ts           # 熵、LZ 熵率、Fano 可预测性上限、Epstein 聚合
    *.test.ts               # 测试（含数据完整性检查）
  store/                    # Zustand 持久化存储（profile、ledger、behavior）
  hooks/                    # useAnalysis（画像派生）、useBehaviorData / useBehaviorForecasts（行为预测）
  components/               # EChart 封装、chartStyle 图表样式、cx、通用 UI、画像切换器；behavior/ 行为预测页组件
                            # （.tsx 文件只导出组件，工具函数放 .ts，以保证 Fast Refresh）
  pages/                    # 11 个页面
.github/workflows/deploy.yml # 推送 main → 检查 → 发布到 GitHub Pages
docs/METHODOLOGY.md         # 模型公式、参数与假设的详细说明
ROADMAP.md                  # 待办（按优先级），迭代时从这里取任务
CHANGELOG.md                # 每轮迭代的记录
```

**分层规则**：`data/` 不 import `engine/`；`engine/` 不 import React；页面只做组合与展示。

---

## 4. 迭代协议（每一轮都按此执行）

1. **读**：本文件 → `ROADMAP.md` → `CHANGELOG.md` 最近 3 条 → 将要修改的文件。
2. **选**：从 `ROADMAP.md` 取优先级最高、依赖已满足的一项；若用户指定了任务，以用户为准。范围控制在“一轮可完成并验证”。
3. **设计**：先想清楚它属于五个动词中的哪一个、影响哪一层、需要哪些新文献；若需要新的数据字段，先改 `src/types.ts`。
4. **实现**：遵守第 5 节的扩展指南与第 6 节的代码规范。
5. **验证**：
   - `pnpm check` 必须全绿；
   - 新增引擎函数必须有单元测试；新增数据会被 `engine.test.ts` 的完整性测试自动覆盖（文献存在、id 唯一、范围合法）；
   - UI 改动要在浏览器中实际打开检查（深色 + 浅色、桌面 + 375px 手机宽度、无横向滚动、无控制台错误）。
6. **记录**：
   - `CHANGELOG.md` 顶部追加一条（版本号、日期、做了什么、为什么、已知局限）；
   - `ROADMAP.md` 勾选完成项，补充新发现的任务；
   - 更新本文件第 9 节「当前状态」。
7. **建议**：在回复末尾给出下一轮最值得做的 1–3 件事及理由。

**发布**：`main` 分支即线上版本。推送到 `main` 会触发 `.github/workflows/deploy.yml`：执行 `pnpm check`，通过后部署到 GitHub Pages（<https://vx-zjr.github.io/quant-human/>）。因此推送前本地 `pnpm check` 必须全绿；推送后确认 Actions 运行成功。只有在用户要求时才提交与推送。

版本号：`0.x.y` —— 完成 ROADMAP 中一个阶段（如 v0.2）升 `x`；单项功能或修复升 `y`。同步修改 `package.json` 与侧边栏中的版本文字（`src/App.tsx`）。

---

## 5. 扩展指南（最常见的改动）

### 5.1 新增一个量化维度
在 `src/data/dimensions/lN-*.ts` 中追加一个 `Dimension` 对象：
- `id` 全局唯一（kebab-case）；`domain` 尽量复用层内已有子领域；
- `measurability` 1–5 按定义打分（1 仅能定性 · 2 间接/理论 · 3 量表/自评 · 4 仪器估算 · 5 精确测量）；
- `heritability` / `stability` 只有在有文献支撑时才填写；
- `sources` 中的每个 id 必须存在于 `sources.ts`（测试会检查）。

### 5.2 新增一条文献
在 `src/data/sources.ts` 追加：`id` 用「第一作者小写 + 年份」（冲突时加后缀），填写 `short`、`title`、`venue`、`year`。只添加真实存在、你确定其结论的文献。

### 5.3 新增一个理论框架
在 `src/data/frameworks.ts` 追加，必须填写 `critique`（局限）与 `usage`（本项目如何使用），`evidence` 按实证强度诚实评分。`shape` 决定示意图形态（wheel / pyramid / timeline / nested / matrix）。

### 5.4 新增一个风险因素（寿命模型）
在 `src/engine/mortality.ts`：
1. 写一个剂量-反应函数 `xxxHR(value)`，参考水平 HR=1，注释文献；
2. 加入 `RiskInputs` 类型与 `riskFactors()` 列表，填写 `ideal`、`evidence`、`source`；
3. 在 `populationLogHR()` 的典型人群组合中加入该因素的人群典型值（否则会破坏归一化）；
4. 在 `IDEAL_INPUTS` 中加入理想值；在 `riskInputsFromProfile` 中映射画像字段；
5. 补测试：典型人 HR≈1 仍成立。

### 5.5 新增一个问卷/量表
放在 `src/data/instruments/`。优先使用公有领域题库（如 IPIP）；有版权的量表不得直接收录题目原文。必须注明：题目来源、计分方式、常模来源与适用人群、信度局限。

### 5.6 新增一个页面
1. `src/pages/Xxx.tsx`（默认导出组件）；
2. 在 `src/App.tsx` 的 `GROUPS` 中注册（路径、标签、副标题、图标、是否依赖画像 `personal`）；
3. 页面结构：`PageHeader`（含 kicker 指明对应动词）→ 若干 `Section`；每张图用 `ChartCard` 并提供 `table` 视图。

### 5.7 新增一个可预测的行为
在 `src/data/behaviors.ts` 的 `BEHAVIORS` 中追加：
- `question` 写成可明确判定“做了/没做”的问题，`window` 为 day / week / month；
- `baseRate` 无可靠人群数据时写示意值并在 `baseRateNote` 注明；
- `traits` 填文献中的特质–行为相关 r（引擎会自动按单次行为减半），没有就不填；
- `priors` 只为有理由的情境写先验均值（log-odds），其余留给个人数据学习；
- 想避免的行为设 `avoid: true`（意图/计划的先验方向会自动翻转）；
- 测试会检查 id 唯一、概率合法、情境键合法、文献存在。新增情境特征需同时改 `ContextKey`、`CONTEXT_META`、`CONTEXT_KEYS` 与模拟器。

### 5.8 图表规范（来自 dataviz 方法）
- 颜色只用 `useChartTheme()` 返回的令牌：`t.series[0..7]`（固定顺序的分类色）、`t.layer.L0..L7`、`t.ink/ink2/muted/grid/axis`；**不要硬编码颜色**。
- 分类色按固定顺序分配，不循环、不超过 8 个；散点/气泡图同屏最多 3 个类别。
- 单一坐标轴（禁止双 y 轴）；网格线为实线细线；不在每个数据点上标数字。
- ≥2 个系列必须有图例；每张图都要有表格视图（`ChartCard.table`）与 `label`（无障碍描述）。
- 状态色（good/warning/serious/critical）只用于状态，且必须配图标 + 文字（`<Status>`）。

---

## 6. 代码规范

- TypeScript strict；不使用 `any`（ECharts option 例外，见 `ChartOption`）。
- 引擎函数纯函数化、无副作用、可复现（随机数一律用 `mulberry32(seed)`）。
- 注释写“为什么”和“依据”，模型参数旁注明文献。
- UI 文案使用简体中文；数字带单位；不确定的值标“约/估算/示意”。
- 用户可编辑的状态更新使用函数式更新（`updateMe(me => ...)`），避免快速操作时读到过期状态。
- 新增依赖前先评估：能否用现有依赖实现？版本必须锁定在已发布至少两周的稳定版。

---

## 7. 质量门槛（Definition of Done）

- [ ] `pnpm check` 通过
- [ ] 新数字有文献或明确标注“示意”
- [ ] 新图表有表格视图、图例、无障碍描述，深浅主题都可读
- [ ] 375px 宽度下无横向滚动
- [ ] 不违反第 1 节任何红线
- [ ] CHANGELOG / ROADMAP / 本文件「当前状态」已更新

---

## 8. 已知的模型简化（改进它们是长期任务）

- 寿命模型用 Gompertz–Makeham 近似代替真实生命表；风险比来自观察性研究、无置信区间；合并时 log HR 统一收缩 0.7。
- 蒙特卡洛事件概率为数量级示意，未按中国统计数据逐项校准。
- 大五常模为英文样本近似值；20 题问卷中文版未经心理测量学验证。
- 八层综合分是透明的启发式，不是经过验证的量表。
- L1 分子层目前没有用户数据入口。
- 行为预测为逐行为独立的逻辑回归（无层级共享、无时间趋势）；多数行为的人群基础率与情境先验为示意值；演示日志由同族模型模拟，学习效果偏乐观。

详见 `docs/METHODOLOGY.md`。

---

## 9. 当前状态

- **版本**：v0.2.0（2026-10-12）
- **线上**：<https://vx-zjr.github.io/quant-human/> · 仓库 <https://github.com/vx-zjr/quant-human>
- **规模**：8 层 · 128 个维度 · 17 个理论框架 · 218 条文献 · 11 个页面 · 4 个演示人物 · 28 个可预测行为 · 28 个单元测试
- **已实现**：总览、维度图谱、理论框架、个人画像（含 20 题大五问卷）、过去（里程表 / 时间轴 / ACE / 细胞年龄）、现在（八层仪表盘 / 规则解读 / 身体 / 人格 / 价值观 / 时间 / 邓巴圈）、未来（生存曲线 / 杠杆排序 / 情景滑块 / 蒙特卡洛平行人生）、可预测性极限（洛伦兹 / 信息尺度 / 缺失遗传度 / 预测研究 / 地平线 / 反身性实验室）、行为预测（行为天气预报 / 个人贝叶斯模型 / 贡献分解与杠杆 / 序贯评估 / Fano 上限 / 聚合实验室 / 打卡与自定义行为）、预测账本（Brier / 校准曲线）、看法与建议
- **下一步建议**：`ROADMAP.md` v0.2 剩余项（层级模型、时间结构、行为耦合），或 v0.3「测量更准」
