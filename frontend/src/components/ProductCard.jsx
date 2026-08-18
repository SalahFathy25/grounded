import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { catName, formatPrice, salePrice, discountPercent } from '../lib/format'
import { launchHero } from '../lib/heroImage'
import Stars from './Stars'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { t, lang } = useLang()
  const outOfStock = product.stock_quantity <= 0
  const lowStock = !outOfStock && product.stock_quantity < 5
  const sale = salePrice(product)
  const disc = discountPercent(product)

  const images = [product.image_url, ...(product.images || [])].filter(Boolean)
  const multi = images.length > 1
  const [imgIdx, setImgIdx] = useState(0)
  const timer = useRef(null)

  useEffect(() => () => clearInterval(timer.current), [])

  const startShow = () => {
    if (!multi) return
    clearInterval(timer.current)
    timer.current = setInterval(() => setImgIdx(i => (i + 1) % images.length), 1000)
  }

  const stopShow = () => {
    clearInterval(timer.current)
    setImgIdx(0)
  }

  const handleOpen = e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    const img = e.currentTarget.querySelector('img')
    if (!img) return
    launchHero({ src: img.currentSrc || img.src, rect: img.getBoundingClientRect() })
  }

  return (
    <article className="card group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-pop">
      <Link
        to={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-line/40"
        aria-label={product.name}
        onClick={handleOpen}
        onMouseEnter={startShow}
        onMouseLeave={stopShow}
      >
        <img
          key={multi ? imgIdx : 0}
          src={images[multi ? imgIdx : 0] || product.image_url}
          alt={product.name}
          loading="lazy"
          className={`size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08] ${outOfStock ? 'grayscale' : ''} ${multi ? (lang === 'ar' ? 'animate-img-cycle-rtl' : 'animate-img-cycle') : ''}`}
        />
        <span className="chip absolute start-3 top-3 bg-ink/85 text-paper backdrop-blur-sm">
          {catName(product, lang)}
        </span>
        {outOfStock ? (
          <span className="chip absolute end-3 top-3 bg-danger text-white">{t('pdp.outOfStock')}</span>
        ) : disc > 0 ? (
          <span className="chip absolute end-3 top-3 bg-danger text-white">{t('products.off', { n: disc })}</span>
        ) : lowStock ? (
          <span className="chip absolute end-3 top-3 bg-gold-tint text-gold-deep">{t('pdp.lowStock', { n: product.stock_quantity })}</span>
        ) : null}

        <span className="absolute inset-x-3 bottom-3 flex translate-y-0 items-center justify-center gap-2 transition-all duration-300 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
          <button
            type="button"
            disabled={outOfStock}
            onClick={e => { e.preventDefault(); e.stopPropagation(); addToCart(product) }}
            className="btn btn-gold btn-sm !min-h-11 flex-1 shadow-pop"
            aria-label={`${t('pdp.addToCart')} — ${product.name}`}
          >
            <Plus className="size-4" aria-hidden="true" /> {t('pdp.addToCart')}
          </button>
        </span>
      </Link>

      <div className="p-4">
        <Link to={`/products/${product.id}`} className="block">
          <h3 className="line-clamp-1 font-semibold transition-colors hover:text-gold-deep">{product.name}</h3>
        </Link>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <Stars rating={product.rating} showValue />
          {product.reviews_count > 0 && <span className="text-xs text-muted">({product.reviews_count})</span>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-bold tracking-tight">{formatPrice(sale)}</span>
            {disc > 0 && <span className="text-sm text-muted line-through">{formatPrice(product.price)}</span>}
          </p>
          {disc > 0 && <span className="chip whitespace-nowrap bg-danger text-white">{t('products.off', { n: disc })}</span>}
        </div>
      </div>
    </article>
  )
}