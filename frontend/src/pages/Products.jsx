import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronLeft, ChevronRight, SearchX, SlidersHorizontal } from 'lucide-react'
import { categoryApi, productApi } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { ProductGridSkeleton } from '../components/Skeletons'
import EmptyState from '../components/EmptyState'
import { useLang } from '../context/LangContext'
import { catName } from '../lib/format'

function PriceRanges(t) {
  return [
    { id: '1', label: t('products.price1'), max: 1000 },
    { id: '2', label: t('products.price2'), min: 1000, max: 3000 },
    { id: '3', label: t('products.price3'), min: 3000, max: 8000 },
    { id: '4', label: t('products.price4'), min: 8000 },
  ]
}

export default function Products() {
  const { t, lang } = useLang()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'newest'
  const price = searchParams.get('price') || ''
  const page = Math.max(0, Number(searchParams.get('page')) || 0)

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const priceRanges = useMemo(() => PriceRanges(t), [t])

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const range = priceRanges.find(r => r.id === price)
    productApi.list({
      q: q || undefined,
      category: category || undefined,
      sort,
      page,
      size: 12,
      min_price: range?.min,
      max_price: range?.max,
    })
      .then(res => { if (!cancelled) setData(res) })
      .catch(err => { if (!cancelled) setError(err.message || 'Failed to load products') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [q, category, sort, price, page, priceRanges])

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

  const togglePrice = id => setParam('price', price === id ? '' : id)
  const rangeLabel = priceRanges.find(r => r.id === price)?.label

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <header className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight">{t('products.title')}</h1>
        <p className="mt-1 text-sm text-muted">
          {activeCategoryName ? t('products.browsing', { cat: activeCategoryName }) : t('products.everything')}
          {q && <> · {t('products.matching', { q })}</>}
          {!loading && data && <> · {t('products.count', { n: data.totalElements })}</>}
        </p>
        {(q || category || price) && (
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className="mt-3 cursor-pointer text-sm font-semibold text-gold-deep hover:underline"
          >
            {t('products.clearFilters')}
          </button>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* ===== Sidebar ===== */}
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="card sticky top-24 p-5">
            <h2 className="flex items-center gap-2 font-bold">
              <SlidersHorizontal className="size-4 text-gold" aria-hidden="true" /> {t('products.filters')}
            </h2>

            <div className="mt-5">
              <p className="mb-2 text-sm font-semibold text-ink-soft">{t('products.category')}</p>
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setParam('category', '')}
                    className={`w-full cursor-pointer rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors ${!category ? 'bg-gold-tint text-gold-deep' : 'text-ink-soft hover:bg-ink/5'}`}
                  >
                    {t('products.allCategories')}
                  </button>
                </li>
                {categories.map(c => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setParam('category', c.id)}
                      className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors ${String(c.id) === String(category) ? 'bg-gold-tint text-gold-deep' : 'text-ink-soft hover:bg-ink/5'}`}
                    >
                      <span>{catName(c, lang)}</span>
                      <span className="text-xs text-muted">{c.product_count ?? ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-ink-soft">{t('products.price')}</p>
              <ul className="space-y-1">
                {priceRanges.map(r => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => togglePrice(r.id)}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-start text-sm font-medium transition-colors ${price === r.id ? 'bg-gold-tint text-gold-deep' : 'text-ink-soft hover:bg-ink/5'}`}
                      aria-pressed={price === r.id}
                    >
                      <span className={`grid size-4 shrink-0 place-items-center rounded border ${price === r.id ? 'border-gold bg-gold' : 'border-line bg-paper'}`} aria-hidden="true">
                        {price === r.id && <span className="size-2 rounded-full bg-paper" />}
                      </span>
                      {r.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* ===== Grid ===== */}
        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(v => !v)}
              className="btn btn-outline btn-sm lg:hidden"
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              {filtersOpen ? t('products.hideFilters') : t('products.filters')}
              {rangeLabel && <span className="chip bg-gold-tint text-gold-deep">{rangeLabel}</span>}
            </button>
            <div className="relative">
              <label htmlFor="sort" className="sr-only">{t('products.sort')}</label>
              <select
                id="sort"
                value={sort}
                onChange={e => setParam('sort', e.target.value)}
                className="input cursor-pointer appearance-none pe-10 !w-auto"
              >
                {sorts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            </div>
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
            />
          ) : data && (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data.content.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {data.totalPages > 1 && (
                <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setParam('page', page - 1)}
                    className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-paper disabled:opacity-35 hover:border-ink"
                    aria-label={t('products.prev')}
                  >
                    <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                  </button>
                  {pageNumbers.map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setParam('page', n)}
                      className={`size-10 cursor-pointer rounded-lg text-sm font-semibold transition-colors ${n === page ? 'bg-ink text-paper' : 'border border-line bg-paper hover:border-ink'}`}
                      aria-current={n === page ? 'page' : undefined}
                    >
                      {n + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={page >= data.totalPages - 1}
                    onClick={() => setParam('page', page + 1)}
                    className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-paper disabled:opacity-35 hover:border-ink"
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
  )
}