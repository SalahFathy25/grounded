import { Link } from 'react-router-dom'
import { ArrowRight, Minus, Plus, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useLang } from '../context/LangContext'
import { formatPrice } from '../lib/format'

export default function CartDrawer() {
  const { items, open, close, updateQty, removeItem, subtotal, count } = useCart()
  const { t } = useLang()

  const cartTotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />
      <aside
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-pop transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label={t('cart.title')}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="size-5 text-gold" aria-hidden="true" />
            {t('cart.title')}
            {count > 0 && <span className="chip bg-gold-tint text-gold-deep">{t('cart.items', { n: count })}</span>}
          </h2>
          <button type="button" onClick={close} className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-ink/5" aria-label={t('cart.close')}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-gold-tint" aria-hidden="true">
              <ShoppingBag className="size-7 text-gold" />
            </span>
            <div>
              <p className="font-semibold">{t('cart.empty')}</p>
              <p className="mt-1 text-sm text-muted">{t('cart.emptySub')}</p>
            </div>
            <Link to="/products" onClick={close} className="btn btn-primary">
              {t('cart.startShopping')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map(i => (
                <li key={i.product_id} className="flex gap-4 py-4">
                  <Link to={`/products/${i.product_id}`} onClick={close} className="block size-20 shrink-0 overflow-hidden rounded-xl border border-line">
                    <img src={i.image_url} alt={i.name} className="size-full object-cover" loading="lazy" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/products/${i.product_id}`} onClick={close} className="line-clamp-2 text-sm font-semibold hover:text-gold-deep">
                        {i.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeItem(i.product_id)}
                        className="cursor-pointer rounded-md p-1 text-muted hover:bg-danger/10 hover:text-danger"
                        aria-label={t('cart.remove', { name: i.name })}
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-lg border border-line">
                        <button
                          type="button"
                          onClick={() => updateQty(i.product_id, i.quantity - 1)}
                          className="grid size-8 cursor-pointer place-items-center hover:text-gold-deep"
                          aria-label={t('cart.decrease')}
                        >
                          <Minus className="size-3.5" aria-hidden="true" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{i.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(i.product_id, i.quantity + 1)}
                          className="grid size-8 cursor-pointer place-items-center hover:text-gold-deep"
                          aria-label={t('cart.increase')}
                        >
                          <Plus className="size-3.5" aria-hidden="true" />
                        </button>
                      </div>
                      <p className="flex items-baseline gap-1.5">
                        {i.discount_percent > 0 && <span className="text-xs text-muted line-through">{formatPrice(i.original_price * i.quantity)}</span>}
                        <span className="text-sm font-bold">{formatPrice(i.price * i.quantity)}</span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="border-t border-line px-5 py-4">
              <div className="mb-1 flex items-center justify-between text-sm text-muted">
                <span>{t('cart.subtotal')}</span>
                <span className="font-semibold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <div className="mb-3 flex items-center justify-between text-sm text-muted">
                <span>{t('cart.shipping')}</span>
                <span className="font-semibold text-ink">{t('cart.calculated')}</span>
              </div>
              <Link to="/checkout" onClick={close} className="btn btn-gold w-full text-base">
                {t('cart.checkout', { amount: formatPrice(cartTotal) })}
              </Link>
              <button type="button" onClick={close} className="mt-2 w-full cursor-pointer py-2 text-center text-sm font-semibold text-muted hover:text-ink">
                {t('cart.continue')}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  )
}