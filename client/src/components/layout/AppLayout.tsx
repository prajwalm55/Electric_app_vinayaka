import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CreditCard,
  BarChart3,
  Settings,
  Search,
  LogOut,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '../../utils/formatters'
import { useAuth } from '../../context/AuthContext'
import { Logo } from '../common/Logo'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Home' },
  { path: '/customers', icon: Users, label: 'Customers' },
  { path: '/projects', icon: FolderKanban, label: 'Work Queue' },
  { path: '/payments', icon: CreditCard, label: 'Payments' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const location = useLocation()
  const { logout, profile } = useAuth()

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="flex items-center justify-center px-4 py-3 border-b border-slate-100">
        <Logo linked size="sidebar" />
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="flex-1">{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold">
            {profile.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{profile.name}</p>
            <p className="text-xs text-slate-500 truncate">{profile.companyName.split(' ')[0]}...</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const location = useLocation()

  const mobileItems = [
    { path: '/', icon: LayoutDashboard, label: 'Home' },
    { path: '/projects', icon: FolderKanban, label: 'Work' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/payments', icon: CreditCard, label: 'Pay' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {mobileItems.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-2 min-w-[56px] rounded-xl transition-colors relative',
                active ? 'text-primary-600' : 'text-slate-400',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export function Header({
  title,
  subtitle,
  backTo,
}: {
  title: string
  subtitle?: string
  /** When set, shows a Back button on the top left (nested pages). */
  backTo?: string
}) {
  return (
    <header className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200/60 lg:border-none">
      <div className="px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {backTo ? (
            <>
              <Link
                to={backTo}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors min-h-11 text-sm font-medium text-slate-700"
                aria-label="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-base lg:text-xl font-bold text-slate-900 truncate">{title}</h1>
                {subtitle && <p className="text-xs lg:text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>}
              </div>
              <div className="lg:hidden shrink-0">
                <Logo linked size="sm" />
              </div>
            </>
          ) : (
            <>
              <div className="lg:hidden shrink-0">
                <Logo linked size="sm" />
              </div>

              <div className="hidden lg:block min-w-0">
                <h1 className="text-xl font-bold text-slate-900">{title}</h1>
                {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
              <div className="lg:hidden flex-1 text-right min-w-0">
                <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
                {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
              </div>
            </>
          )}
        </div>

        {!backTo && (
          <Link
            to="/search"
            className="shrink-0 p-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-colors min-h-11 min-w-11 flex items-center justify-center"
            aria-label="Search customers, projects, and properties"
          >
            <Search className="w-5 h-5 text-slate-600" />
          </Link>
        )}
      </div>
    </header>
  )
}
