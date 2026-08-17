import { Link } from 'react-router-dom'
import { ArrowUpRight, Banknote, CreditCard, Facebook, Instagram, Mail, MapPin, Music2, Phone, Smartphone, Wallet } from 'lucide-react'
import { categoryApi } from '../lib/api'
import { catName } from '../lib/format'
import { useLang } from '../context/LangContext'
import { useSettings } from '../context/SettingsContext'
import { useContent, pick } from '../context/ContentContext'
import { useEffect, useState } from 'react'
import Reveal from './Reveal'

export default function Footer() {
  const { t, lang } = useLang()
  const { settings } = useSettings()
  const { content } = useContent()
  const [cats, setCats] = useState([])

  useEffect(() => {
    categoryApi.list().then(setCats).catch(() => {})
  }, [])

  const storeName = (lang === 'ar' ? settings.store_name_ar : settings.store_name_en) || 'Grounded'
  const [nameFirst, ...nameRest] = storeName.split(' ')
  const watermark = storeName.toUpperCase()
  const footer = content.footer

  const socials = [
    { icon: Instagram, label: 'Instagram', url: settings.instagram_url },
    { icon: Facebook, label: 'Facebook', url: settings.facebook_url },
    { icon: Music2, label: 'TikTok', url: settings.tiktok_url },
  ]

  const payments = [
    { icon: Banknote, label: t('checkout.payCod') },
    { icon: CreditCard, label: t('checkout.payVisa') },
    { icon: Smartphone, label: t('checkout.payVodafone') },
    { icon: Wallet, label: t('checkout.payInstapay') },
  ]

  const navLink = 'group relative inline-flex items-center gap-1 transition-colors duration-300 hover:text-gold-bright'
  const underline = 'after:absolute after:-bottom-1 after:start-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-gold-bright after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100 rtl:after:origin-left rtl:hover:after:origin-right'

  return (
    <footer className="relative mt-20 overflow-hidden bg-ink text-paper/80">
      <div className="h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[80%] -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-14">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <Reveal dir="up">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/logo.jpg" alt={storeName} className="h-10 w-auto max-w-[10rem] rounded-xl object-contain" loading="lazy" />
                <span className="font-display text-2xl text-paper">{nameFirst}<span className="text-gold-bright">{nameRest.join(' ')}</span></span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed">{pick(footer.tagline, lang)}</p>
              <div className="mt-6 flex items-center gap-2.5">
                {socials.map(s => (
                  <a
                    key={s.label}
                    href={s.url || '#'}
                    onClick={e => { if (!s.url) e.preventDefault() }}
                    className="grid size-10 cursor-pointer place-items-center rounded-xl bg-white/5 text-paper/70 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:bg-gold/15 hover:text-gold-bright hover:shadow-lg hover:shadow-gold/20 hover:ring-gold/40"
                    aria-label={s.label}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <s.icon className="size-4.5 transition-transform duration-300 hover:scale-110" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal dir="up" delay={100}>
            <nav aria-label={t('footer.shop')}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-paper">{t('footer.shop')}</h3>
              <div className="mt-4 h-px w-8 bg-gold/60" aria-hidden="true" />
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link to="/products" className={`${navLink} ${underline}`}>
                    {t('footer.allProducts')}
                    <ArrowUpRight className="size-3.5 text-gold-bright/60 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                  </Link>
                </li>
                {cats.slice(0, 5).map(c => (
                  <li key={c.id}>
                    <Link to={`/products?category=${c.id}`} className={`${navLink} ${underline}`}>
                      {catName(c, lang)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Reveal>

          <Reveal dir="up" delay={200}>
            <nav aria-label={t('footer.company')}>
              <h3 className="text-sm font-bold uppercase tracking-widest text-paper">{t('footer.company')}</h3>
              <div className="mt-4 h-px w-8 bg-gold/60" aria-hidden="true" />
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link to="/about" className={`${navLink} ${underline}`}>{t('footer.about')}</Link>
                </li>
                <li>
                  <Link to="/my-orders" className={`${navLink} ${underline}`}>{t('nav.track')}</Link>
                </li>
                <li>
                  <Link to="/privacy" className={`${navLink} ${underline}`}>{t('footer.privacy')}</Link>
                </li>
                <li>
                  <Link to="/terms" className={`${navLink} ${underline}`}>{t('footer.terms')}</Link>
                </li>
              </ul>
            </nav>
          </Reveal>

          <Reveal dir="up" delay={300}>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-paper">{t('footer.help')}</h3>
              <div className="mt-4 h-px w-8 bg-gold/60" aria-hidden="true" />
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-gold-bright ring-1 ring-white/10" aria-hidden="true">
                    <Phone className="size-3.5" />
                  </span>
                  <a href={`tel:${settings.support_phone}`} dir="ltr" className={navLink}>
                    {settings.support_phone}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-gold-bright ring-1 ring-white/10" aria-hidden="true">
                    <Mail className="size-3.5" />
                  </span>
                  <a href={`mailto:${settings.support_email}`} className={`${navLink} ${underline}`}>
                    {settings.support_email}
                  </a>
                </li>
                <li className="flex items-center gap-2.5 text-paper/60">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/5 text-gold-bright ring-1 ring-white/10" aria-hidden="true">
                    <MapPin className="size-3.5" />
                  </span>
                  {pick(footer.city, lang)}
                </li>
              </ul>
            </div>
          </Reveal>
        </div>
      </div>

      <div className="pointer-events-none relative select-none overflow-hidden" aria-hidden="true">
        <p className="font-display -mb-4 text-center text-[16vw] leading-none text-paper/[0.04] sm:-mb-6 lg:text-[11rem]">
          {watermark}
        </p>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
          <p className="text-xs text-paper/50">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <ul className="flex flex-wrap items-center justify-center gap-2" aria-label={t('footer.payments')}>
            {payments.map(p => (
              <li
                key={p.label}
                className="flex cursor-default items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-paper/70 ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-0.5 hover:bg-gold/10 hover:text-gold-bright hover:ring-gold/30"
              >
                <p.icon className="size-3.5 text-gold-bright" aria-hidden="true" /> {p.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}