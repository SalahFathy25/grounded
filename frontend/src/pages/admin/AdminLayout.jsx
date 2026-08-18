import { NavLink, Outlet, Link } from 'react-router-dom'
import { ExternalLink, LayoutDashboard, LayoutGrid, LogOut, Package, Palette, ScrollText, Settings, ShoppingCart, Users, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LangContext'
import { initials } from '../../lib/format'

export default function AdminLayout() {
  const { user, isSuperAdmin, logout } = useAuth()
  const { t } = useLang()
  const [open, setOpen] = useState(false)

  const NAV = [
    { to: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: t('admin.products'), icon: Package, end: false },
    { to: '/admin/orders', label: t('admin.orders'), icon: ShoppingCart, end: false },
    { to: '/admin/categories', label: t('admin.categories.title'), icon: LayoutGrid, end: false },
    ...(isSuperAdmin
      ? [
          { to: '/admin/users', label: t('admin.users.title'), icon: Users, end: false },
          { to: '/admin/logs', label: t('admin.logs.title'), icon: ScrollText, end: false },
        ]
      : []),
    { to: '/admin/customize', label: t('admin.customize.title'), icon: Palette, end: false },
    { to: '/admin/settings', label: t('admin.settings.title'), icon: Settings, end: false },
  ]

  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
      isActive ? 'bg-paper/15 text-paper' : 'text-paper/70 hover:bg-paper/5 hover:text-paper'
    }`

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <img src="/logo.jpg" alt="Grounded" className="size-9 rounded-xl object-contain" />
        <span className="text-lg font-bold text-paper">
          Ground<span className="text-gold-bright">ed</span>
        </span>
        <button type="button" onClick={() => setOpen(false)} className="ms-auto grid size-9 cursor-pointer place-items-center rounded-lg text-paper/60 hover:bg-paper/10 lg:hidden" aria-label={t('admin.closeMenu')}>
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
      <p className="px-5 pb-2 text-[11px] font-bold uppercase tracking-widest text-paper/40">{t('admin.nav')}</p>
      <nav className="flex-1 space-y-1 px-3" aria-label={t('admin.nav')}>
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setOpen(false)} className={link}>
            <item.icon className="size-5" aria-hidden="true" /> {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-1 px-3 pb-5">
        <Link to="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-paper/70 hover:bg-paper/5 hover:text-paper">
          <ExternalLink className="size-5" aria-hidden="true" /> {t('admin.viewStore')}
        </Link>
        <div className="flex items-center gap-3 rounded-xl px-4 py-3">
          <span className="grid size-9 place-items-center rounded-full bg-paper/10 text-xs font-bold text-paper" aria-hidden="true">
            {initials(user?.full_name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-paper">{user?.full_name}</p>
            <p className="truncate text-xs text-paper/50">{user?.email}</p>
          </div>
          <button type="button" onClick={logout} className="grid size-9 cursor-pointer place-items-center rounded-lg text-paper/60 hover:bg-paper/10 hover:text-paper" aria-label={t('nav.signOut')}>
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-line/40">
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 bg-ink lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-72 bg-ink shadow-pop">{sidebar}</aside>
        </div>
      )}

      <div className="lg:ps-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/85 px-4 backdrop-blur-lg sm:px-6">
          <button type="button" onClick={() => setOpen(true)} className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-ink/5 lg:hidden" aria-label={t('admin.openMenu')}>
            <Menu className="size-5" aria-hidden="true" />
          </button>
          <p className="text-sm text-muted">{t('admin.storeMgmt')}</p>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}