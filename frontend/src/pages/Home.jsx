import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronDown, Headset, Lightbulb, Phone, Quote, ShieldCheck, Sparkles, Star, Truck } from 'lucide-react'
import { categoryApi, productApi } from '../lib/api'
import ProductCard from '../components/ProductCard'
import Reveal from '../components/Reveal'
import { ProductGridSkeleton } from '../components/Skeletons'
import { useLang } from '../context/LangContext'
import { useContent, pick } from '../context/ContentContext'
import { catName, formatPrice, salePrice } from '../lib/format'

const CHIP_ICONS = { truck: Truck, phone: Phone, shield: ShieldCheck, headset: Headset }

export default function Home() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const { content } = useContent()
  const [categories, setCategories] = useState([])
  const [featured, setFeatured] = useState(null)
  const [spotlight, setSpotlight] = useState(null)

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
    productApi.list({ size: 8 }).then(setFeatured).catch(() => {})
    productApi.list({ size: 12 }).then(setSpotlight).catch(() => {})
  }, [])

  const hero = content.hero
  const heroFloats = hero.chips.map((c, i) => ({
    icon: CHIP_ICONS[c.icon] || Truck,
    label: pick(c.label, lang),
    delay: `${i * 700}ms`,
  }))

  const testimonials = content.testimonials.map((x, i) => ({
    quote: pick(x.quote, lang),
    name: x.name,
    city: pick(x.city, lang),
    avatar: x.avatar || `https://i.pravatar.cc/96?img=${i + 1}`,
  }))

  const [tIdx, setTIdx] = useState(0)
  const tTimer = useRef(null)

  const stopTicker = () => clearInterval(tTimer.current)

  const startTicker = () => {
    clearInterval(tTimer.current)
    tTimer.current = setInterval(() => setTIdx(i => (i + 1) % testimonials.length), 3500)
  }

  useEffect(() => {
    startTicker()
    return () => clearInterval(tTimer.current)
  }, [testimonials.length])

  const sizes = content.sizeRows.map(r => ({
    size: r.size,
    chest: r.chest,
    length: r.length,
    fit: pick(r.fit, lang),
  }))

  const stats = content.stats
  const h = content.headings
  const S = content.sections

  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <img
          src="/hero.jpg"
          alt=""
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover object-[center_30%]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/35" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-ink/75 lg:via-transparent lg:to-ink/65" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_85%_10%,rgba(251,191,36,0.13),transparent_65%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(90%_60%_at_50%_100%,rgba(251,191,36,0.14),transparent_70%)] lg:hidden" aria-hidden="true" />
        <span
          className="pointer-events-none absolute end-8 top-1/2 hidden -translate-y-1/2 select-none font-display text-xs uppercase tracking-[0.45em] text-paper/35 lg:block [writing-mode:vertical-rl]"
          aria-hidden="true"
        >
          Grounded <span className="text-gold-bright">·</span> est. 2026
        </span>

        <div className="relative mx-auto flex min-h-[88svh] w-full max-w-7xl flex-col justify-end px-5 pb-14 pt-24 sm:px-4 sm:pb-24 sm:pt-28 lg:block lg:min-h-0 lg:pb-32 lg:pt-44">
          <div className="max-w-2xl">
            <Reveal as="span" className="inline-block" delay={0}>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-bright/30 bg-gold-bright/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-bright">
                <Sparkles className="size-3.5" aria-hidden="true" /> {pick(hero.badge, lang)}
              </span>
            </Reveal>
            <Reveal delay={90}>
              <h1 className="mt-7 font-display text-[clamp(2.9rem,13vw,4rem)] uppercase leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl xl:text-9xl">
                {pick(hero.title1, lang)}
                <br />
                <span className="relative inline-block">
                  <span className="bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                    {pick(hero.title2, lang)}
                  </span>
                  <span className="absolute -bottom-2 start-0 h-1 w-3/4 rounded-full bg-gradient-to-r from-gold-bright to-transparent" aria-hidden="true" />
                </span>
              </h1>
            </Reveal>
            <Reveal delay={190}>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-paper/75 sm:text-lg">
                {pick(hero.sub, lang)}
              </p>
            </Reveal>
            <Reveal delay={280}>
              <div className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                <button type="button" onClick={() => navigate('/products')} className="btn btn-gold flex min-h-12 w-full items-center justify-center gap-2 px-9 py-3.5 text-base shadow-[0_16px_40px_-14px_rgba(251,191,36,0.6)] hover:-translate-y-0.5 sm:w-auto">
                  {pick(hero.cta, lang)} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                </button>
                <a href="#categories" className="btn flex min-h-12 w-full items-center justify-center gap-2 border border-white/25 bg-white/5 px-9 py-3.5 text-base text-paper backdrop-blur-sm hover:bg-white/15 sm:w-auto">
                  {pick(hero.browse, lang)}
                </a>
              </div>
            </Reveal>
            {heroFloats.some(f => f.label) && (
              <div className="mt-9 flex flex-wrap gap-2.5 lg:hidden" aria-hidden="true">
                {heroFloats.slice(0, 3).map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-paper ring-1 ring-white/15 backdrop-blur-md">
                    <f.icon className="size-4 text-gold-bright" /> {f.label}
                  </span>
                ))}
              </div>
            )}
            <Reveal delay={380}>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex -space-x-2" aria-hidden="true">
                    {testimonials.slice(0, 8).map((x, i) => (
                      <img key={i} src={x.avatar} alt="" className="size-8 rounded-full border-2 border-ink object-cover sm:size-10" loading="lazy" />
                    ))}
                  </div>
                  <div className="text-sm">
                    <span className="flex items-center gap-1.5 font-semibold text-paper">
                      <Star className="size-4 fill-gold-bright text-gold-bright" aria-hidden="true" /> {hero.rating}
                    </span>
                    <span className="text-paper/65">{pick(hero.reviews, lang)}</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center lg:hidden" aria-hidden="true">
          <span className="grid size-10 animate-bounce place-items-center rounded-full border border-white/20 bg-white/5 text-paper/70 backdrop-blur-sm">
            <ChevronDown className="size-5" />
          </span>
        </div>

        {heroFloats.some(f => f.label) && (
          <div className="pointer-events-none absolute end-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-3 lg:flex xl:end-10" aria-hidden="true">
            {heroFloats.map((f, i) => (
              <div
                key={i}
                className="flex animate-float items-center gap-3 rounded-2xl bg-white/10 py-2.5 pe-4 ps-2.5 ring-1 ring-white/15 backdrop-blur-md"
                style={{ animationDelay: f.delay }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-gold-bright" aria-hidden="true">
                  <f.icon className="size-5" />
                </span>
                <span className="text-sm font-semibold text-paper">{f.label}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ============ CATEGORIES ============ */}
      {S.categories && (
        <section id="categories" className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20">
          <Reveal>
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-gold">{pick(h.categories.tag, lang)}</p>
                <h2 className="mt-1 font-display text-3xl uppercase tracking-tight sm:text-4xl">{pick(h.categories.title, lang)}</h2>
              </div>
              <Link to="/products" className="btn btn-ghost btn-sm shrink-0">
                {t('home.viewAll')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 70}>
                <Link
                  to={`/products?category=${c.id}`}
                  className="group relative block aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-black/5 transition-shadow duration-300 hover:shadow-pop"
                >
                  <img
                    src={c.image_url}
                    alt={catName(c, lang)}
                    loading="lazy"
                    className="size-full scale-100 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-display text-lg uppercase tracking-wide text-paper">{catName(c, lang)}</p>
                    <p className="text-xs text-paper/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      {c.product_count ?? 0} {t('home.products')}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ============ FEATURED ============ */}
      {S.featured && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20">
          <Reveal>
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-gold">{pick(h.featured.tag, lang)}</p>
                <h2 className="mt-1 font-display text-3xl uppercase tracking-tight sm:text-4xl">{pick(h.featured.title, lang)}</h2>
              </div>
              <Link to="/products" className="btn btn-ghost btn-sm shrink-0">
                {t('home.seeEverything')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          {featured ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featured.content.map((p, i) => (
                <Reveal key={p.id} delay={i * 60}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <ProductGridSkeleton count={8} />
          )}
        </section>
      )}

      {/* ============ CATEGORY SPOTLIGHT ============ */}
      {S.spotlight && spotlight?.content?.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20">
          <Reveal>
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-gold">{pick(h.spotlight.tag, lang)}</p>
                <h2 className="mt-1 font-display text-3xl uppercase tracking-tight sm:text-4xl">{pick(h.spotlight.title, lang)}</h2>
              </div>
              <Link to="/products" className="btn btn-ghost btn-sm shrink-0">
                {t('home.viewAll')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, ci) => {
              const items = spotlight.content.filter(p => String(p.category_id) === String(c.id)).slice(0, 3)
              if (!items.length) return null
              return (
                <Reveal key={c.id} delay={ci * 80}>
                  <div className="card p-5">
                    <Link to={`/products?category=${c.id}`} className="group flex items-center gap-3">
                      <img src={c.image_url} alt={catName(c, lang)} loading="lazy" className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-black/5" />
                      <span className="min-w-0 flex-1 truncate font-display text-lg uppercase tracking-wide">{catName(c, lang)}</span>
                      <span className="rounded-full bg-gold-tint px-2.5 py-0.5 text-xs font-bold text-gold-deep">{t('home.spotItems', { n: items.length })}</span>
                      <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                    <div className="mt-4 space-y-3 border-t border-line pt-3">
                      {items.map(p => (
                        <Link key={p.id} to={`/products/${p.id}`} className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-ink/5">
                          <img src={p.image_url} alt={p.name} loading="lazy" className="size-14 shrink-0 rounded-lg object-cover ring-1 ring-black/5" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{p.name}</span>
                            <span className="block text-xs text-muted">{formatPrice(salePrice(p))}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </section>
      )}

      {/* ============ ABOUT / BRAND STORY ============ */}
      {S.about && (
        <section id="about" className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20 scroll-mt-20">
          <Reveal dir="zoom">
            <div className="relative overflow-hidden rounded-3xl bg-ink text-paper">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_85%_10%,rgba(251,191,36,0.12),transparent_60%)]" aria-hidden="true" />
              <div className="grid items-center gap-10 lg:grid-cols-2">
                <div className="relative p-6 sm:p-10">
                  <div className="absolute inset-10 hidden rounded-3xl border border-gold/25 lg:block" aria-hidden="true" />
                  <img
                    src={content.about.image}
                    alt=""
                    loading="lazy"
                    className="relative h-[380px] w-full rounded-2xl object-cover ring-1 ring-white/15 lg:h-[460px]"
                  />
                </div>
                <div className="px-6 pb-10 sm:px-10 lg:py-14">
                  <Reveal as="span" className="inline-block" delay={0}>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gold-bright ring-1 ring-white/15">
                      <Sparkles className="size-3.5" aria-hidden="true" /> {pick(h.about.tag, lang)}
                    </span>
                  </Reveal>
                  <Reveal delay={100}>
                    <h2 className="mt-5 font-display text-3xl uppercase leading-[1.04] tracking-tight sm:text-4xl lg:text-5xl">
                      {pick(h.about.title, lang)}
                      <br />
                      <span className="bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
                        {pick(h.about.title2, lang)}
                      </span>
                    </h2>
                  </Reveal>
                  <Reveal delay={200}>
                    <p className="mt-5 max-w-xl leading-relaxed text-paper/70">{pick(content.about.text, lang)}</p>
                  </Reveal>
                  <Reveal delay={300}>
                    <Link to="/products" className="btn btn-gold mt-8 px-7 hover:-translate-y-0.5">
                      {pick(content.about.cta, lang)} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                  </Reveal>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ TESTIMONIALS (auto carousel) ============ */}
      {S.testimonials && testimonials.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20">
          <Reveal>
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-gold">{pick(h.testimonials.tag, lang)}</p>
                <h2 className="mt-1 font-display text-3xl uppercase tracking-tight sm:text-4xl">{pick(h.testimonials.title, lang)}</h2>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div
              className="overflow-hidden"
              dir="ltr"
              onMouseEnter={stopTicker}
              onMouseLeave={startTicker}
              onFocus={stopTicker}
              onBlur={startTicker}
            >
              <div
                className="flex w-max gap-4 transition-transform duration-700 ease-out"
                style={{ paddingLeft: 'calc((100% - 340px) / 2)', transform: `translateX(-${tIdx * 356}px)` }}
              >
                {testimonials.map((x, i) => (
                  <article
                    key={x.name}
                    className={`card flex w-[340px] shrink-0 flex-col p-6 transition-all duration-500 ${i === tIdx ? 'scale-100 opacity-100 shadow-pop ring-1 ring-gold/40' : 'scale-90 opacity-50'}`}
                  >
                    <Quote className="size-8 text-gold/40" aria-hidden="true" />
                    <div className="mt-3 flex gap-1" aria-hidden="true">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star key={s} className="size-4 fill-gold text-gold" />
                      ))}
                    </div>
                    <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">{x.quote}</p>
                    <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                      <img src={x.avatar} alt="" loading="lazy" className="size-10 rounded-full object-cover ring-2 ring-gold/40" />
                      <div className="text-sm">
                        <p className="font-bold">{x.name}</p>
                        <p className="text-xs text-muted">{x.city}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ FAQ ============ */}
      {S.faq && content.faqs.length > 0 && (
        <section id="faq" className="mx-auto max-w-3xl px-4 pt-16 sm:pt-20 scroll-mt-20">
          <Reveal>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-gold">{pick(h.faq.tag, lang)}</p>
              <h2 className="mt-1 font-display text-3xl uppercase tracking-tight sm:text-4xl">{pick(h.faq.title, lang)}</h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-7 space-y-3">
              {content.faqs.map((f, i) => (
                <details key={i} className="group card p-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-bold sm:text-base">
                    {pick(f.q, lang)}
                    <ChevronDown className="size-5 shrink-0 text-gold transition-transform duration-300 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{pick(f.a, lang)}</p>
                </details>
              ))}
            </div>
          </Reveal>
        </section>
      )}

      {/* ============ SIZE GUIDE ============ */}
      {S.sizeGuide && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20">
          <Reveal>
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-gold">{pick(h.sizeGuide.tag, lang)}</p>
              <h2 className="mt-1 font-display text-3xl uppercase tracking-tight sm:text-4xl">{pick(h.sizeGuide.title, lang)}</h2>
              <p className="mx-auto mt-3 max-w-md text-sm text-muted">{pick(h.sizeGuide.sub, lang)}</p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="card mx-auto mt-7 max-w-3xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-ink text-paper">
                    <th scope="col" className="p-4 text-start font-bold">{t('home.sizeColSize')}</th>
                    <th scope="col" className="p-4 text-start font-bold">{t('home.sizeColChest')}</th>
                    <th scope="col" className="p-4 text-start font-bold">{t('home.sizeColLength')}</th>
                    <th scope="col" className="p-4 text-start font-bold">{t('home.sizeColFit')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sizes.map(row => (
                    <tr key={row.size} className="border-t border-line transition-colors hover:bg-ink/[0.03]">
                      <td className="p-4 font-bold">{row.size}</td>
                      <td className="p-4 text-muted">{row.chest}</td>
                      <td className="p-4 text-muted">{row.length}</td>
                      <td className="p-4">
                        <span className="inline-flex rounded-full bg-gold-tint px-2.5 py-0.5 text-xs font-bold text-gold-deep">{row.fit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-muted">
              <Lightbulb className="size-4 shrink-0 text-gold" aria-hidden="true" /> {t('home.sizeTip')}
            </p>
          </Reveal>
        </section>
      )}

      {/* ============ STATS BAND ============ */}
      {S.stats && (
        <section className="mx-auto max-w-7xl px-4 pt-16 sm:pt-20">
          <Reveal dir="zoom">
            <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-12 text-paper sm:px-12 sm:py-14">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_80%_at_50%_0%,rgba(251,191,36,0.12),transparent_65%)]" aria-hidden="true" />
              <div className="relative text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-gold-bright">{pick(h.stats.tag, lang)}</p>
                <h2 className="mt-1 font-display text-3xl uppercase tracking-tight sm:text-4xl">{pick(h.stats.title, lang)}</h2>
              </div>
              <div className="relative mt-10 grid grid-cols-2 gap-8 lg:grid-cols-4">
                {stats.map(s => (
                  <div key={s.label.en} className="text-center">
                    <p className="bg-gradient-to-r from-gold-bright to-gold bg-clip-text font-display text-4xl text-transparent sm:text-5xl">{s.value}</p>
                    <p className="mt-1.5 text-sm text-paper/60">{pick(s.label, lang)}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      )}
    </>
  )
}