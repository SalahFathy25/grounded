import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, Globe, Home, LogOut, Menu, Moon, Package, Phone, Search, ShoppingBag, Sun, User as UserIcon, X, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { useSettings } from '../context/SettingsContext'
import { useTheme } from '../context/ThemeContext'
import { initials } from '../lib/format'

function Logo() {
  const { t, lang } = useLang()
  const { settings } = useSettings()
  const name = (lang === 'ar' ? settings.store_name_ar : settings.store_name_en) || 'Grounded'
  const [first, ...rest] = name.split(' ')
  return (
    <Link to="/" className="flex items-center gap-2" aria-label={t('brand')}>
      <img src="/logo.jpg" alt={t('brand')} className="h-9 w-auto max-w-[9rem] rounded-lg object-contain lg:h-10" />
      <span className="font-display text-xl uppercase tracking-tight">{first}<span className="text-gold">{rest.join(' ')}</span></span>
    </Link>
  )
}

function LangToggle({ compact = false }) {
  const { lang, toggle, t } = useLang()
  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg font-bold transition-colors hover:bg-ink/5 ${compact ? 'px-2 py-2 text-xs' : 'px-2.5 py-2 text-xs border border-line'}`}
      aria-label="Switch language"
    >
      <Globe className="size-4 text-gold" aria-hidden="true" />
      {lang === 'ar' ? 'EN' : 'العربية'}
    </button>
  )
}

function ThemeToggle({ compact = false }) {
  const { theme, toggle } = useTheme()
  const { t } = useLang()
  const isDark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex cursor-pointer items-center gap-1.5 rounded-lg font-bold transition-colors hover:bg-ink/5 ${compact ? 'px-2 py-2 text-xs' : 'px-2.5 py-2 text-xs border border-line'}`}
      aria-label={t(isDark ? 'nav.lightMode' : 'nav.darkMode')}
      title={t(isDark ? 'nav.lightMode' : 'nav.darkMode')}
    >
      {isDark ? <Sun className="size-4 text-gold" aria-hidden="true" /> : <Moon className="size-4 text-gold" aria-hidden="true" />}
      <span className="hidden sm:inline">{t(isDark ? 'nav.lightMode' : 'nav.darkMode')}</span>
    </button>
  )
}

export function SearchBar({ className = '', autoFocus = false, onSubmit }) {
  const navigate = useNavigate()
  const { t } = useLang()
  const [q, setQ] = useState('')
  return (
    <form
      className={`relative ${className}`}
      onSubmit={e => {
        e.preventDefault()
        navigate(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : '/products')
        setQ('')
        onSubmit?.()
      }}
      role="search"
    >
      <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder={t('nav.searchPlaceholder')}
        className="input !ps-10 bg-paper/70"
        aria-label={t('nav.searchPlaceholder')}
      />
    </form>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()
  const { count, openCart } = useCart()
  const { t, lang, toggle: toggleLang } = useLang()
  const { settings } = useSettings()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenu, setUserMenu] = useState(false)
  const [annHidden, setAnnHidden] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    function onDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenu(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const handleLogout = () => {
    logout()
    setUserMenu(false)
    setMenuOpen(false)
  }

  const handleSection = (e, id) => {
    e.preventDefault()
    setMenuOpen(false)
    if (document.getElementById(id)) {
      document.getElementById(id).scrollIntoView({ behavior: 'smooth' })
      return
    }
    navigate('/')
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 150)
  }

  const telHref = `tel:+${(settings.support_phone || '+20 100 000 0000').replace(/\D/g, '')}`

  const navLink = ({ isActive }) =>
    `whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition-colors ${isActive ? 'text-gold-deep bg-gold-tint' : 'text-ink-soft hover:text-ink hover:bg-ink/5'}`

  return (
    <>
      {settings.announcement_enabled && !annHidden && (settings.announcement_en?.trim() || settings.announcement_ar?.trim()) && (
        <div className="relative border-b border-gold/20 bg-ink px-4 py-2 text-center text-xs font-semibold tracking-wide text-paper/90">
          <p className="mx-auto max-w-7xl ps-6 pe-10">
            {lang === 'ar' ? settings.announcement_ar : settings.announcement_en}
          </p>
          <button
            type="button"
            onClick={() => setAnnHidden(true)}
            className="absolute end-3 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-paper/50 transition-colors hover:bg-white/10 hover:text-paper"
            aria-label={t('nav.closeMenu')}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 lg:gap-4">
        <div className={`pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent ${menuOpen ? 'opacity-0' : ''}`} aria-hidden="true" />
        <button
          type="button"
          className="grid size-11 cursor-pointer place-items-center rounded-lg text-ink hover:bg-ink/5 lg:hidden"
          onClick={() => setMenuOpen(v => !v)}
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.menu')}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>

        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          <NavLink to="/" className={navLink} end>{t('nav.home')}</NavLink>
          <NavLink to="/products" className={navLink}>{t('nav.shop')}</NavLink>
          <a href="#about" onClick={e => handleSection(e, 'about')} className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink">{t('nav.about')}</a>
          <a href="#faq" onClick={e => handleSection(e, 'faq')} className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink">{t('nav.faq')}</a>
          <Link to="/my-orders" className="whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink">{t('nav.track')}</Link>
        </nav>

        <SearchBar className="ms-auto hidden w-56 md:block lg:w-64" />

        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <ThemeToggle compact />
          <LangToggle compact />
          <a
            href={telHref}
            className="hidden size-11 cursor-pointer place-items-center rounded-lg text-ink transition-colors hover:bg-ink/5 sm:grid"
            aria-label={t('nav.contact')}
          >
            <Phone className="size-5" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={openCart}
            className="relative grid size-11 cursor-pointer place-items-center rounded-lg text-ink transition-colors hover:bg-ink/5"
            aria-label={t('nav.openCart', { n: count })}
          >
            <ShoppingBag className="size-5" aria-hidden="true" />
            {count > 0 && (
              <span className="absolute -end-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-gold px-1 text-[11px] font-bold text-paper">
                {count}
              </span>
            )}
          </button>

          <div className="relative" ref={userMenuRef}>
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setUserMenu(v => !v)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg py-1.5 ps-1.5 pe-2 hover:bg-ink/5"
                  aria-expanded={userMenu}
                  aria-label={t('nav.account')}
                >
                  <span className="grid size-9 place-items-center rounded-full bg-ink text-xs font-bold text-paper" aria-hidden="true">
                    {initials(user.full_name)}
                  </span>
                  <ChevronDown className={`hidden size-4 text-muted transition-transform sm:block ${userMenu ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {userMenu && (
                  <div className="card absolute end-0 mt-2 w-56 p-2 shadow-pop animate-fade-up">
                    <p className="px-3 pb-2 pt-1 text-sm">
                      <span className="block font-semibold">{user.full_name}</span>
                      <span className="block truncate text-xs text-muted">{user.email}</span>
                    </p>
                    <div className="mx-3 mb-1 border-t border-line" />
                    <Link to="/my-orders" onClick={() => setUserMenu(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-ink/5">
                      <Package className="size-4 text-muted" aria-hidden="true" /> {t('nav.myOrders')}
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-ink/5">
                        <LayoutDashboard className="size-4 text-muted" aria-hidden="true" /> {t('nav.adminPanel')}
                      </Link>
                    )}
                    <button type="button" onClick={handleLogout} className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium text-danger hover:bg-danger/5">
                      <LogOut className="size-4" aria-hidden="true" /> {t('nav.signOut')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="hidden items-center gap-1.5 sm:flex">
                <Link to="/login" className="whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-ink/5">{t('nav.signIn')}</Link>
                <Link to="/register" className="whitespace-nowrap rounded-lg bg-ink px-2.5 py-2 text-sm font-semibold text-paper transition-colors hover:bg-ink-soft active:scale-[0.98]">{t('nav.createAccount')}</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-paper px-4 py-4 lg:hidden animate-fade-in">
          <SearchBar className="mb-3" autoFocus onSubmit={() => setMenuOpen(false)} />
          <nav className="flex flex-col" aria-label="Mobile navigation">
            <Link to="/" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-ink/5">
              <Home className="size-4 text-muted" aria-hidden="true" /> {t('nav.home')}
            </Link>
            <Link to="/products" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-ink/5">
              <ShoppingBag className="size-4 text-muted" aria-hidden="true" /> {t('nav.shop')}
            </Link>
            <a href="#about" onClick={e => handleSection(e, 'about')} className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-ink/5">
              <Home className="size-4 text-muted" aria-hidden="true" /> {t('nav.about')}
            </a>
            <a href="#faq" onClick={e => handleSection(e, 'faq')} className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-ink/5">
              <Package className="size-4 text-muted" aria-hidden="true" /> {t('nav.faq')}
            </a>
            <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-ink/5">
              <Package className="size-4 text-muted" aria-hidden="true" /> {t('nav.track')}
            </Link>
            <a href={telHref} className="flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-ink/5">
              <Phone className="size-4 text-muted" aria-hidden="true" /> {t('nav.contact')}
            </a>
            <button type="button" onClick={toggleLang} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-ink/5">
              <Globe className="size-4 text-muted" aria-hidden="true" /> {lang === 'ar' ? 'English' : 'العربية'}
            </button>
            <ThemeToggle />
            {!user && (
              <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn btn-outline">{t('nav.signIn')}</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn btn-primary">{t('nav.createAccount')}</Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
    </>
  )
}