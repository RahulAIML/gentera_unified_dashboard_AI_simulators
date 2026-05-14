import gentaraLogo from '../../assets/gentera_logo.webp'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  PlayCircle,
  MessageSquare,
  Brain,
  Trophy,
  Activity,
  Building2,
  ChevronLeft,
  ChevronRight,
  Mic2,
  UserCheck,
  GitBranch,
  FileText,
  Settings,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAppStore } from '../../store'
import { useTranslation } from '../../lib/i18n'
import { cn } from '../../lib/cn'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  key: string
  exact?: boolean
}

const NAV_GROUPS: { labelKey: string; items: NavItem[] }[] = [
  {
    labelKey: 'nav_overview',
    items: [
      { to: '/', icon: LayoutDashboard, key: 'nav_overview', exact: true },
    ],
  },
  {
    labelKey: 'nav_simulator',
    items: [
      { to: '/simulations', icon: PlayCircle, key: 'nav_simulations' },
      { to: '/conversational', icon: MessageSquare, key: 'nav_conversational' },
      { to: '/coaching', icon: Brain, key: 'nav_coaching' },
      { to: '/leaderboard', icon: Trophy, key: 'nav_leaderboard' },
    ],
  },
  {
    labelKey: 'nav_roleplay_group',
    items: [
      { to: '/roleplay', icon: Mic2, key: 'nav_roleplay' },
      { to: '/supervisors', icon: UserCheck, key: 'nav_supervisors' },
    ],
  },
  {
    labelKey: 'nav_platform',
    items: [
      { to: '/activities', icon: Activity, key: 'nav_activities' },
      { to: '/organization', icon: Building2, key: 'nav_organization' },
      { to: '/business-lines', icon: GitBranch, key: 'nav_business_lines' },
    ],
  },
  {
    labelKey: 'nav_more',
    items: [
      { to: '/reports', icon: FileText, key: 'nav_reports' },
      { to: '/settings', icon: Settings, key: 'nav_settings' },
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, language } = useAppStore()
  const t = useTranslation(language)
  const collapsed = sidebarCollapsed

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 35 }}
      className="relative flex flex-col bg-surface border-r border-line/40 h-screen shrink-0 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-line/30 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={gentaraLogo}
            alt="Gentera"
            className="w-10 h-10 shrink-0 object-contain"
          />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-slate-100 font-semibold text-sm leading-tight tracking-tight whitespace-nowrap">
                  Gentera
                </span>
                <span className="text-slate-600 text-[10px] leading-tight whitespace-nowrap">
                  AI Training Intelligence
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.labelKey}>
            <AnimatePresence>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-700"
                >
                  {t(group.labelKey)}
                </motion.p>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-150 group relative',
                      isActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]',
                    )
                  }
                  title={collapsed ? t(item.key) : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.div
                          layoutId="active-nav"
                          className="absolute inset-0 rounded-lg bg-accent/10"
                          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                        />
                      )}
                      <item.icon
                        className={cn(
                          'w-4 h-4 shrink-0 relative z-10 transition-colors',
                          isActive ? 'text-accent' : 'text-slate-600 group-hover:text-slate-300',
                        )}
                      />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.12 }}
                            className="relative z-10 whitespace-nowrap font-medium"
                          >
                            {t(item.key)}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[72px] w-6 h-6 rounded-full bg-surface border border-line flex items-center justify-center text-slate-500 hover:text-slate-200 hover:border-line/80 transition-all z-30 shadow-elevated"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  )
}
