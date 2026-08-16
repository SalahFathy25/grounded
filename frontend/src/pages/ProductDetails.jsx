import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ChevronRight, Minus, Package, Plus, ShoppingBag, Zap } from 'lucide-react'
import { productApi } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { catName, formatPrice, salePrice, discountPercent } from '../lib/format'
import Stars from '../components/Stars'
import ProductCard from '../components/ProductCard'
import EmptyState from '../components/EmptyState'
import { ProductGridSkeleton } from '../components/Skeletons'

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { t, lang } = useLang()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [qty, setQty] = useState(1)
  const [image, setImage] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setQty(1)
    setImage(0)
    productApi.get(id)
      .then(async p => {
        if (cancelled) return
        setProduct(p)
        try {
          const rel = await productApi.list({ category: p.category_id, size: 100 })
          if (!cancelled) setRelated(rel.content.filter(r => r.id !== p.id).slice(0, 4))
        } catch { /* ignore */ }
      })
      .catch(err => { if (!cancelled) setError(err.message || 'Product not found') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-line/60" />
          <div className="space-y-4 pt-4">
            <div className="h-4 w-28 animate-pulse rounded bg-line/70" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-line/70" />
            <div className="h-4 w-40 animate-pulse rounded bg-line/60" />
            <div className="h-10 w-40 animate-pulse rounded bg-line/70" />
            <div className="h-24 animate-pulse rounded-xl bg-line/60" />
            <div className="h-12 w-full animate-pulse rounded-xl bg-line/70" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          icon={Package}
          title={t('pdp.notFound')}
          subtitle={error || t('pdp.notFoundSub')}
          action={<Link to="/products" className="btn btn-primary">{t('pdp.browse')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link>}
        />
      </div>
    )
  }

  const outOfStock = product.stock_quantity <= 0
  const lowStock = !outOfStock && product.stock_quantity < 5
  const sale = salePrice(product)
  const disc = discountPercent(product)
  const gallery = [
    product.image_url,
    ...(product.images || []).slice(1),
    product.image_url.replace(/\/800\/800/, '/800/800?v=2'),
    product.image_url.replace(/\/800\/800/, '/800/800?v=3'),
  ].filter((src, i, arr) => src && arr.indexOf(src) === i)

  const buyNow = () => {
    addToCart(product, qty)
    navigate('/checkout')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-gold-deep">{t('pdp.breadcrumbHome')}</Link>
        <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
        <Link to="/products" className="hover:text-gold-deep">{t('pdp.breadcrumbShop')}</Link>
        {catName(product, lang) && (
          <>
            <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
            <Link to={`/products?category=${product.category_id}`} className="hover:text-gold-deep">{catName(product, lang)}</Link>
          </>
        )}
        <ChevronRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
        <span className="max-w-52 truncate font-medium text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-paper">
            <img src={gallery[image]} alt={product.name} className="aspect-square w-full object-cover" />
          </div>
          <div className="mt-3 flex gap-3">
            {gallery.map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setImage(i)}
                className={`size-20 cursor-pointer overflow-hidden rounded-xl border-2 transition-colors ${image === i ? 'border-gold' : 'border-line hover:border-ink/40'}`}
                aria-label={`View image ${i + 1}`}
                aria-pressed={image === i}
              >
                <img src={src} alt="" className="size-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <span className="chip bg-gold-tint text-gold-deep">{catName(product, lang)}</span>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
            <Stars rating={product.rating} showValue />
            {product.reviews_count > 0 && <span>{t('pdp.reviews', { n: product.reviews_count })}</span>}
            <span className="chip bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="size-3.5" aria-hidden="true" /> {t('pdp.verifiedSeller')}
            </span>
          </div>

          <p className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-4xl font-bold tracking-tight">{formatPrice(sale)}</span>
            {disc > 0 && (
              <>
                <span className="text-xl text-muted line-through">{formatPrice(product.price)}</span>
                <span className="chip bg-danger text-white">{t('products.off', { n: disc })}</span>
              </>
            )}
          </p>

          <div className="mt-3">
            {outOfStock ? (
              <span className="chip bg-red-100 text-red-700">{t('pdp.outOfStock')}</span>
            ) : lowStock ? (
              <span className="chip bg-amber-100 text-amber-800">{t('pdp.lowStock', { n: product.stock_quantity })}</span>
            ) : (
              <span className="chip bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-3.5" aria-hidden="true" /> {t('pdp.inStock', { n: product.stock_quantity })}
              </span>
            )}
          </div>

          <p className="mt-6 leading-relaxed text-ink-soft">{product.description}</p>

          {(product.brand || product.sku || product.material || product.color || product.sizes || product.tags) && (
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 rounded-2xl border border-line bg-paper p-5 text-sm sm:grid-cols-2">
              {product.brand && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t('pdp.brand')}</dt>
                  <dd className="mt-1 font-semibold">{product.brand}</dd>
                </div>
              )}
              {product.sku && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t('pdp.sku')}</dt>
                  <dd className="mt-1 font-medium">{product.sku}</dd>
                </div>
              )}
              {product.material && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t('pdp.material')}</dt>
                  <dd className="mt-1 font-medium">{product.material}</dd>
                </div>
              )}
              {product.color && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t('pdp.colors')}</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {product.color.split(',').map(c => c.trim()).filter(Boolean).map(c => (
                      <span key={c} className="chip bg-gold-tint text-gold-deep">{c}</span>
                    ))}
                  </dd>
                </div>
              )}
              {product.sizes && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t('pdp.sizes')}</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {product.sizes.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                      <span key={s} className="chip border border-line bg-paper text-ink">{s}</span>
                    ))}
                  </dd>
                </div>
              )}
              {product.tags && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{t('pdp.tags')}</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {product.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                      <Link to={`/products?q=${encodeURIComponent(tag)}`} key={tag} className="chip hover:border-gold/50 hover:text-gold-deep">{tag}</Link>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="flex h-12 items-center rounded-xl border border-line bg-paper">
              <button
                type="button"
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="grid size-12 cursor-pointer place-items-center text-ink-soft hover:text-gold-deep"
                aria-label={t('pdp.decreaseQty')}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <span className="w-10 text-center text-lg font-bold" aria-live="polite">{qty}</span>
              <button
                type="button"
                onClick={() => setQty(q => Math.min(product.stock_quantity || 99, q + 1))}
                className="grid size-12 cursor-pointer place-items-center text-ink-soft hover:text-gold-deep"
                aria-label={t('pdp.increaseQty')}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => addToCart(product, qty)}
              className="btn btn-primary flex-1 text-base"
            >
              <ShoppingBag className="size-5" aria-hidden="true" /> {t('pdp.addToCart')}
            </button>
            <button type="button" disabled={outOfStock} onClick={buyNow} className="btn btn-gold flex-1 text-base">
              <Zap className="size-5" aria-hidden="true" /> {t('pdp.buyNow')}
            </button>
          </div>

          <ul className="mt-8 space-y-3 rounded-2xl border border-line bg-paper p-5 text-sm">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="size-5 shrink-0 text-gold" aria-hidden="true" />
              <span>{t('pdp.paymentLine')}</span>
            </li>
          </ul>

          {!user && (
            <p className="mt-5 text-sm text-muted">
              <Link to="/login" className="font-semibold text-gold-deep hover:underline">{t('login.signIn')}</Link>{' '}
              {t('pdp.signInTrack')}
            </p>
          )}
        </div>
      </div>

      {/* Related */}
      {related && related.length > 0 && (
        <section className="mt-16 sm:mt-20">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">{t('pdp.related')}</h2>
          {related.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : <ProductGridSkeleton count={4} />}
        </section>
      )}
    </div>
  )
}