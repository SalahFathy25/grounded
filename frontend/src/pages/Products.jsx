import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { categoryApi, productApi } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/Skeletons'
import EmptyState from '../components/EmptyState'
import { useLang } from '../context/LangContext'
import { subscribeStoreEvents } from '../lib/realtime'
import { catName, formatPrice } from '../lib/format'

function RadioDot({ checked }) {
  return (
    <span className={`grid size-4 shrink-0 place-items-center rounded-full border ${checked ? 'border-gold bg-gold' : 'border-line bg-paper'}`} aria-hidden="true">
      {checked && <span className="size-1.5 rounded-full bg-paper" />}
    </span>
  )
}

function CheckDot({ checked }) {
  return (
    <span className={`grid size-4 shrink-0 place-items-center rounded border ${checked ? 'border-gold bg-gold' : 'border-line bg-paper'}`} aria-hidden="true">
      {checked && <Check className="size-3 text-[var(--color-gold-bright)]" strokeWidth={3} />}
    </span>
  )
}

function PriceSlider({ min, max, low, high, onChange }) {
  const { t } = useLang()
  const lo = Math.min(Math.max(low, min), max)
  const hi = Math.min(Math.max(high, min), max)
  const span = Math.max(max - min, 1)
  const loPct = ((lo - min) / span) * 100
  const hiPct = ((hi - min) / span) * 100
  const commit = (a, b) => {
    if (a !== low || b !== high) onChange(a, b)
  }
  return (
    <div>
      <div className="range-slider">
        <div
          className="range-track"
          style={{ insetInlineStart: `${loPct}%`, insetInlineEnd: `${100 - hiPct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={lo}
          aria-label={t('products.minPrice')}
          style={lo === hi ? { pointerEvents: 'none' } : undefined}
          onChange={e => commit(Number(e.target.value), hi)}
          onPointerUp={e => commit(Number(e.target.value), hi)}
          onKeyUp={e => commit(Number(e.currentTarget.value), hi)}
          onBlur={e => commit(Number(e.currentTarget.value), hi)}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={hi}
          aria-label={t('products.maxPrice')}
          onChange={e => commit(lo, Number(e.target.value))}
          onPointerUp={e => commit(lo, Number(e.target.value))}
          onKeyUp={e => commit(lo, Number(e.currentTarget.value))}
          onBlur={e => commit(lo, Number(e.currentTarget.value))}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-semibold text-muted">
        <span>{formatPrice(lo)}</span>
        <span>{formatPrice(hi)}</span>
      </div>
    </div>
  )
}

function SortMenu({ value, options, onChange }) {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const onDoc = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  const current = options.find(o => o.value === value) || options[0]
  return (
    <div ref={ref} className="relative ms-auto">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="sv-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('products.sort')}
      >
        {current.label}
        <ChevronDown className={`size-4 text-[var(--sv-accent)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" className="sv-menu animate-fade-up" aria-label={t('products.sort')}>
          {options.map(o => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`sv-menu-item ${o.value === value ? 'is-on' : ''}`}
              >
                {o.label}
                {o.value === value && <Check className="size-4 text-[var(--sv-accent)]" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function FilterChip({ label, onRemove, icon: Icon = null }) {
  const { t } = useLang()
  return (
    <span className="sv-chip animate-fade-up">
      {Icon && <Icon className="size-3.5 shrink-0 text-[var(--sv-accent)]" aria-hidden="true" />}
      <span className="max-w-44 truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="sv-chip-remove"
        aria-label={t('products.removeFilter', { name: label })}
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </span>
  )
}

function FiltersPanel({
  categories, category, sliderMin, sliderMax, priceLow, priceHigh,
  inStock, sale, rating, brandsSel,
  onCategory, onPrice, onToggleStock, onToggleSale, onToggleBrand, onSelectRating,
}) {
  const { t, lang } = useLang()
  const priceAny = priceLow === sliderMin && priceHigh === sliderMax
  return (
    <>
      <div className="mt-5">
        <p className="sv-label">{t('products.category')}</p>
        <ul className="space-y-1.5">
          <li>
            <button
              type="button"
              onClick={() => onCategory('')}
              className={`sv-row ${!category ? 'is-on' : ''}`}
            >
              {t('products.allCategories')}
            </button>
          </li>
          {categories.map(c => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onCategory(c.id)}
                className={`sv-row flex items-center gap-2.5 ${String(c.id) === String(category) ? 'is-on' : ''}`}
              >
                <img
                  src={c.image_url}
                  alt=""
                  loading="lazy"
                  className="size-7 shrink-0 rounded-md object-cover ring-2 ring-black/40"
                />
                <span className="min-w-0 flex-1 truncate">{catName(c, lang)}</span>
                <span className="text-xs text-muted">{c.product_count ?? ''}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <p className="sv-label">{t('products.price')}</p>
        <PriceSlider min={sliderMin} max={sliderMax} low={priceLow} high={priceHigh} onChange={onPrice} />
        <button
          type="button"
          onClick={() => onPrice(sliderMin, sliderMax)}
          className={`sv-row mt-1 ${priceAny ? 'is-on' : ''}`}
        >
          {t('products.priceAny')}
        </button>
      </div>

      <div className="mt-6">
        <p className="sv-label">{t('products.availability')}</p>
        <ul className="space-y-1.5">
          <li>
            <button
              type="button"
              onClick={onToggleStock}
              aria-pressed={inStock}
              className={`sv-row flex items-center gap-2.5 ${inStock ? 'is-on' : ''}`}
            >
              <CheckDot checked={inStock} />
              {t('products.inStockOnly')}
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={onToggleSale}
              aria-pressed={sale}
              className={`sv-row flex items-center gap-2.5 ${sale ? 'is-on' : ''}`}
            >
              <CheckDot checked={sale} />
              {t('products.onSaleOnly')}
            </button>
          </li>
        </ul>
      </div>

      <div className="mt-6">
        <p className="sv-label">{t('products.rating')}</p>
        <ul className="space-y-1.5">
          {[['', t('products.anyRating')], ['4', t('products.ratingFrom', { n: 4 })], ['3', t('products.ratingFrom', { n: 3 })]].map(([v, label]) => (
            <li key={v || 'any'}>
              <button
                type="button"
                onClick={() => onSelectRating(v)}
                aria-pressed={rating === v}
                className={`sv-row flex items-center gap-2.5 ${rating === v ? 'is-on' : ''}`}
              >
                <RadioDot checked={rating === v} />
                {label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {brandsSel && brandsSel.length > 0 && (
        <div className="mt-6">
          <p className="sv-label">{t('products.brand')}</p>
          <ul className="max-h-44 space-y-1.5 overflow-y-auto pe-1">
            {brandsSel.map(b => (
              <li key={b}>
                <button
                  type="button"
                  onClick={() => onToggleBrand(b)}
                  aria-pressed={true}
                  className="sv-row is-on flex items-center gap-2.5"
                >
                  <CheckDot checked={true} />
                  <span className="min-w-0 flex-1 truncate">{b}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

export default function Products() {
  const { t, lang } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'newest'
  const page = Math.max(0, Number(searchParams.get('page')) || 0)
  const inStock = searchParams.get('in_stock') === '1'
  const sale = searchParams.get('sale') === '1'
  const rating = searchParams.get('rating') || ''
  const minPriceParam = searchParams.get('min_price') || ''
  const maxPriceParam = searchParams.get('max_price') || ''
  const brandsSel = useMemo(() => {
    const raw = searchParams.get('brand') || ''
    return raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : []
  }, [searchParams])

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const silentRef = useRef(false)
  const resultsRef = useRef(null)

  const facets = data?.facets || null
  const sliderMax = facets?.max_price ? Math.max(100, Math.ceil(facets.max_price / 100) * 100) : 1000
  const priceLow = minPriceParam ? Math.min(Number(minPriceParam), sliderMax) : 0
  const priceHigh = maxPriceParam ? Math.min(Number(maxPriceParam), sliderMax) : sliderMax

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => subscribeStoreEvents(() => {
    silentRef.current = true
    setTick(t => t + 1)
  }), [])

  useEffect(() => {
    let cancelled = false
    const silent = silentRef.current
    silentRef.current = false
    if (!silent) setLoading(true)
    setError('')
    productApi.list({
      q: q || undefined,
      category: category || undefined,
      sort,
      page,
      size: 12,
      min_price: minPriceParam ? Number(minPriceParam) : undefined,
      max_price: maxPriceParam ? Number(maxPriceParam) : undefined,
      in_stock: inStock || undefined,
      sale: sale || undefined,
      rating: rating || undefined,
      brand: brandsSel.length ? brandsSel.join(',') : undefined,
    })
      .then(res => {
        if (cancelled) return
        setData(res)
        if (res.totalPages > 0 && page >= res.totalPages && page !== res.totalPages - 1) {
          setParam('page', res.totalPages - 1)
        }
      })
      .catch(err => { if (!cancelled) setError(err.message || 'Failed to load products') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [q, category, sort, page, inStock, sale, rating, brandsSel, minPriceParam, maxPriceParam, tick])

  useEffect(() => {
    if (!filtersOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') setFiltersOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [filtersOpen])

  useEffect(() => {
    if (page > 0) resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [page])

  const activeCategoryName = useMemo(() => {
    const c = categories.find(c => String(c.id) === String(category))
    return c?.name || null
  }, [categories, category])

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setSearchParams(next)
  }

  const setFlag = (key, on) => {
    const next = new URLSearchParams(searchParams)
    if (on) next.set(key, '1')
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const setPriceRange = (lo, hi) => {
    const next = new URLSearchParams(searchParams)
    if (lo > 0) next.set('min_price', String(lo))
    else next.delete('min_price')
    if (hi < sliderMax) next.set('max_price', String(hi))
    else next.delete('max_price')
    next.delete('page')
    setSearchParams(next)
  }

  const toggleBrand = brand => {
    const next = new URLSearchParams(searchParams)
    const list = brandsSel.includes(brand) ? brandsSel.filter(x => x !== brand) : [...brandsSel, brand]
    if (list.length) next.set('brand', list.join(','))
    else next.delete('brand')
    next.delete('page')
    setSearchParams(next)
  }

  const selectCategory = id => {
    setParam('category', id)
    setFiltersOpen(false)
  }

  const selectRating = v => {
    setParam('rating', v)
    setFiltersOpen(false)
  }

  const priceLabel = minPriceParam || maxPriceParam
    ? (minPriceParam && maxPriceParam
      ? t('products.priceRange', { min: formatPrice(Number(minPriceParam)), max: formatPrice(Number(maxPriceParam)) })
      : minPriceParam
        ? t('products.priceFrom', { amount: formatPrice(Number(minPriceParam)) })
        : t('products.priceTo', { amount: formatPrice(Number(maxPriceParam)) }))
    : ''

  const gridKey = `${q}|${category}|${sort}|${minPriceParam}|${maxPriceParam}|${inStock}|${sale}|${rating}|${brandsSel.join(',')}|${page}`

  const chips = []
  if (q) chips.push({ key: 'q', label: q, icon: Search, remove: () => setParam('q', '') })
  if (activeCategoryName) chips.push({ key: 'category', label: activeCategoryName, remove: () => setParam('category', '') })
  if (priceLabel) chips.push({ key: 'price', label: priceLabel, remove: () => setPriceRange(0, sliderMax) })
  if (inStock) chips.push({ key: 'stock', label: t('products.inStockOnly'), remove: () => setFlag('in_stock', false) })
  if (sale) chips.push({ key: 'sale', label: t('products.onSaleOnly'), remove: () => setFlag('sale', false) })
  if (rating) chips.push({ key: 'rating', label: t('products.ratingFrom', { n: rating }), remove: () => setParam('rating', '') })
  brandsSel.forEach(b => chips.push({ key: `brand-${b}`, label: b, remove: () => toggleBrand(b) }))

  const pageNumbers = useMemo(() => {
    if (!data) return []
    const total = data.totalPages
    const start = Math.max(0, Math.min(page - 2, total - 5))
    return Array.from({ length: Math.min(total, 5) }, (_, i) => start + i)
  }, [data, page])

  const sorts = [
    { value: 'newest', label: t('products.sortNewest') },
    { value: 'price_asc', label: t('products.sortPriceAsc') },
    { value: 'price_desc', label: t('products.sortPriceDesc') },
  ]

  return (
    <div className="sv-street min-h-dvh text-ink">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <header className="mb-7">
          <p className="sv-kicker">{t('products.kicker')}</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h1 className="font-display text-4xl uppercase leading-none tracking-tight sm:text-5xl">
              {t('products.title')}
              <span className="text-[var(--sv-accent)]">.</span>
            </h1>
          </div>
          <p className="mt-3 text-sm text-muted">
            {activeCategoryName ? t('products.browsing', { cat: activeCategoryName }) : t('products.everything')}
            {q && <> · {t('products.matching', { q })}</>}
            {!loading && data && <> · <span key={data.totalElements} className="inline-block animate-fade-in font-semibold text-ink-soft" aria-live="polite">{t('products.count', { n: data.totalElements })}</span></>}
          </p>
        </header>

      {chips.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2.5" aria-label={t('products.filters')}>
          {chips.map(c => (
            <FilterChip key={c.key} label={c.label} icon={c.icon} onRemove={c.remove} />
          ))}
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="sv-chip-link"
          >
            {t('products.clearFilters')}
          </button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* ===== Desktop sidebar ===== */}
        <aside className="hidden lg:block">
          <div className="sv-panel sticky top-24 p-5">
            <h2 className="sv-panel-title">
              <SlidersHorizontal className="size-4 text-[var(--sv-accent)]" aria-hidden="true" /> {t('products.filters')}
            </h2>
            <FiltersPanel
              categories={categories}
              category={category}
              sliderMin={0}
              sliderMax={sliderMax}
              priceLow={priceLow}
              priceHigh={priceHigh}
              inStock={inStock}
              sale={sale}
              rating={rating}
              brandsSel={brandsSel}
              onCategory={selectCategory}
              onPrice={setPriceRange}
              onToggleStock={() => setFlag('in_stock', !inStock)}
              onToggleSale={() => setFlag('sale', !sale)}
              onToggleBrand={toggleBrand}
              onSelectRating={selectRating}
            />
          </div>
        </aside>

        {/* ===== Mobile filter drawer ===== */}
        <div className={`fixed inset-0 z-50 lg:hidden ${filtersOpen ? '' : 'pointer-events-none'}`} aria-hidden={!filtersOpen}>
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${filtersOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setFiltersOpen(false)}
          />
          <aside
            className={`absolute right-0 top-0 flex h-full w-full max-w-xs flex-col border-l border-line bg-[var(--sv-panel)] shadow-pop transition-transform duration-300 ${filtersOpen ? 'translate-x-0' : 'translate-x-full'}`}
            role="dialog"
            aria-modal="true"
            aria-label={t('products.filters')}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="sv-panel-title">
                <SlidersHorizontal className="size-4 text-[var(--sv-accent)]" aria-hidden="true" /> {t('products.filters')}
              </h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="sv-btn size-10 !p-0"
                aria-label={t('products.hideFilters')}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-5">
              <FiltersPanel
                categories={categories}
                category={category}
                sliderMin={0}
                sliderMax={sliderMax}
                priceLow={priceLow}
                priceHigh={priceHigh}
                inStock={inStock}
                sale={sale}
                rating={rating}
                brandsSel={brandsSel}
                onCategory={selectCategory}
                onPrice={setPriceRange}
                onToggleStock={() => setFlag('in_stock', !inStock)}
                onToggleSale={() => setFlag('sale', !sale)}
                onToggleBrand={toggleBrand}
                onSelectRating={selectRating}
              />
            </div>
          </aside>
        </div>

        {/* ===== Grid ===== */}
        <div ref={resultsRef} className="scroll-mt-24">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(v => !v)}
              className="sv-btn lg:hidden"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="size-4 text-[var(--sv-accent)]" aria-hidden="true" />
              {filtersOpen ? t('products.hideFilters') : t('products.filters')}
              {priceLabel && <span className="chip rounded-full bg-[var(--color-gold-tint)] text-[var(--color-ink)]">{priceLabel}</span>}
            </button>
            <SortMenu value={sort} options={sorts} onChange={v => setParam('sort', v)} />
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : error ? (
            <EmptyState title={t('products.error')} subtitle={error} />
          ) : data && data.content.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title={t('products.noResults')}
              subtitle={t('products.noResultsSub')}
              action={
                <button type="button" onClick={() => setSearchParams({})} className="sv-btn is-accent">
                  {t('products.clearFilters')}
                </button>
              }
            />
          ) : data && (
            <>
              <div key={gridKey} className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.content.map((p, i) => (
                  <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 11) * 55}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>

              {data.totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2.5" aria-label={t('products.pagination')}>
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setParam('page', page - 1)}
                    className="sv-pg"
                    aria-label={t('products.prev')}
                  >
                    <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                  </button>
                  {pageNumbers.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setParam('page', n)}
                      className={`sv-pg ${n === page ? 'is-active' : ''}`}
                      aria-current={n === page ? 'page' : undefined}
                    >
                      {n + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= data.totalPages - 1}
                    onClick={() => setParam('page', page + 1)}
                    className="sv-pg"
                    aria-label={t('products.next')}
                  >
                    <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
  )
}