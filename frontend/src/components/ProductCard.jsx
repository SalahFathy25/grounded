import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { catName, formatPrice, salePrice, discountPercent } from '../lib/format'
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

  return (
    <article className="card group overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-pop">
      <Link
        to={`/products/${product.id}`}
        className="relative block aspect-square overflow-hidden bg-line/40"
        aria-label={product.name}
        onMouseEnter={startShow}
        onMouseLeave={stopShow}
      >
        <img
          key={multi ? imgIdx : 0}
          src={images[multi ? imgIdx : 0] || product.image_url}
          alt={product.name}
          loading="lazy"
          className={`size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${outOfStock ? 'grayscale' : ''} ${multi ? 'animate-fade-in' : ''}`}
        />
        {multi && (
          <span className="absolute inset-x-0 bottom-16 flex items-center justify-center gap-1" aria-hidden="true">
            {images.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === imgIdx ? 'w-3.5 bg-gold' : 'w-1 bg-paper/55'}`}
              />
            ))}
          </span>
        )}
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
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-paper/90 text-ink shadow-pop backdrop-blur-sm" aria-hidden="true">
            <Eye className="size-5" />
          </span>
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
          {disc > 0 && <span className="chip bg-danger text-white">{t('products.off', { n: disc })}</span>}
        </div>
      </div>
    </article>
  )
}