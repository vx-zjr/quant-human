import { useEffect, useState, type ComponentType } from 'react'
import {
  Atom,
  BookOpen,
  Compass,
  Gauge,
  History,
  Infinity as InfinityIcon,
  Layers,
  Menu,
  Monitor,
  Moon,
  NotebookPen,
  Sparkles,
  Sun,
  Telescope,
  UserRound,
  X,
} from 'lucide-react'
import { PersonaSwitcher } from './components/PersonaSwitcher'
import { cx } from './components/cx'
import { href, useRoute } from './router'
import { useThemeStore, type ThemeMode } from './theme'
import Overview from './pages/Overview'
import Atlas from './pages/Atlas'
import ProfilePage from './pages/Profile'
import Past from './pages/Past'
import Present from './pages/Present'
import Future from './pages/Future'
import Limits from './pages/Limits'
import Ledger from './pages/Ledger'
import Frameworks from './pages/Frameworks'
import Insights from './pages/Insights'

interface RouteDef {
  path: string
  label: string
  sub: string
  icon: ComponentType<{ size?: number; className?: string }>
  page: ComponentType
  /** 该页是否依赖当前画像（显示画像切换器） */
  personal?: boolean
}

const GROUPS: { title: string; routes: RouteDef[] }[] = [
  {
    title: '地图',
    routes: [
      { path: '/', label: '总览', sub: '八层模型与方法', icon: Compass, page: Overview },
      { path: '/atlas', label: '维度图谱', sub: '120+ 可量化维度', icon: Layers, page: Atlas },
      { path: '/frameworks', label: '理论框架', sub: '解构人的 17 把刀', icon: BookOpen, page: Frameworks },
    ],
  },
  {
    title: '个体',
    routes: [
      { path: '/profile', label: '个人画像', sub: '输入 · 问卷', icon: UserRound, page: ProfilePage, personal: true },
      { path: '/past', label: '过去 · 解构', sub: '你是如何形成的', icon: History, page: Past, personal: true },
      { path: '/present', label: '现在 · 解读', sub: '八层仪表盘', icon: Gauge, page: Present, personal: true },
      { path: '/future', label: '未来 · 预测', sub: '概率与情景', icon: Telescope, page: Future, personal: true },
    ],
  },
  {
    title: '边界',
    routes: [
      { path: '/limits', label: '可预测性极限', sub: '混沌 · 信息 · 反身性', icon: InfinityIcon, page: Limits },
      { path: '/ledger', label: '预测账本', sub: '校准你对自己的预测', icon: NotebookPen, page: Ledger },
      { path: '/insights', label: '看法与建议', sub: '结论 · 伦理 · 路线图', icon: Sparkles, page: Insights },
    ],
  },
]

const ALL = GROUPS.flatMap((g) => g.routes)

export default function App() {
  const { path } = useRoute()
  const [navOpen, setNavOpen] = useState(false)
  const route = ALL.find((r) => r.path === path) ?? ALL[0]
  const Page = route.page

  useEffect(() => {
    setNavOpen(false)
    window.scrollTo({ top: 0 })
    document.title = `${route.label} · 人类量化图谱`
  }, [path, route.label])

  return (
    <div className="min-h-screen bg-page">
      {/* 移动端顶栏 */}
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-page/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <button onClick={() => setNavOpen(true)} aria-label="打开导航" className="rounded-lg p-1.5 text-ink-2 hover:bg-surface-2">
          <Menu size={20} />
        </button>
        <Brand />
        <div className="w-8" />
      </div>

      {/* 侧边栏 */}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-surface transition-transform lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Brand />
          <button onClick={() => setNavOpen(false)} aria-label="关闭导航" className="rounded-lg p-1 text-muted hover:bg-surface-2 lg:hidden">
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="主导航">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              <div className="px-2 pb-1.5 text-[11px] font-medium tracking-widest text-muted">{g.title}</div>
              {g.routes.map((r) => {
                const active = r.path === route.path
                const Icon = r.icon
                return (
                  <a
                    key={r.path}
                    href={href(r.path)}
                    aria-current={active ? 'page' : undefined}
                    className={cx(
                      'group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors',
                      active ? 'bg-accent-soft text-ink' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    <Icon size={17} className={active ? 'text-accent' : 'text-muted group-hover:text-ink-2'} />
                    <span className="min-w-0">
                      <span className="block text-sm leading-tight">{r.label}</span>
                      <span className="block text-[11px] text-muted leading-tight mt-0.5">{r.sub}</span>
                    </span>
                  </a>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-line px-4 py-3">
          <ThemeToggle />
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            v0.1.1 · 所有数据仅保存在本机浏览器。
            <br />
            非医疗/心理诊断工具。
          </p>
        </div>
      </aside>
      {navOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* 主内容 */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pt-8">
          {route.personal && (
            <div className="mb-6 flex items-center justify-end gap-3">
              <span className="text-xs text-muted hidden sm:inline">当前量化对象</span>
              <PersonaSwitcher />
            </div>
          )}
          <Page />
        </div>
      </main>
    </div>
  )
}

function Brand() {
  return (
    <a href={href('/')} className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft">
        <Atom size={18} className="text-accent" />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink leading-tight">人类量化图谱</span>
        <span className="block text-[10px] tracking-wider text-muted leading-tight">QUANTIFIED HUMAN</span>
      </span>
    </a>
  )
}

function ThemeToggle() {
  const mode = useThemeStore((s) => s.mode)
  const setMode = useThemeStore((s) => s.setMode)
  const opts: { v: ThemeMode; icon: typeof Sun; label: string }[] = [
    { v: 'light', icon: Sun, label: '浅色' },
    { v: 'system', icon: Monitor, label: '跟随系统' },
    { v: 'dark', icon: Moon, label: '深色' },
  ]
  return (
    <div className="flex rounded-lg border border-line p-0.5" role="radiogroup" aria-label="主题">
      {opts.map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          role="radio"
          aria-checked={mode === v}
          aria-label={label}
          title={label}
          onClick={() => setMode(v)}
          className={cx('flex flex-1 justify-center rounded-md py-1', mode === v ? 'bg-surface-3 text-ink' : 'text-muted hover:text-ink')}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  )
}
