import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, PackageSearch } from 'lucide-react'
import { orderApi } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import { useLang } from '../context/LangContext'
import StatusBadge from '../components/StatusBadge'
import PaymentInfo from '../components/PaymentInfo'
import EmptyState from '../components/EmptyState'
import { RowSkeleton } from '../components/Skeletons'

export default function MyOrders() {
  const { t } = useLang()
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    orderApi.mine()
      .then(setOrders)
      .catch(err => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState title={t('orders.loadError')} subtitle={error} />
      </div>
    )
  }

  if (!orders) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <RowSkeleton rows={4} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t('orders.title')}</h1>
      <p className="mt-1 text-sm text-muted">{t('orders.sub')}</p>

      {orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={PackageSearch}
            title={t('orders.empty')}
            subtitle={t('orders.emptySub')}
            action={<Link to="/products" className="btn btn-primary">{t('cart.startShopping')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link>}
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {orders.map(o => (
            <li key={o.id} className="card animate-fade-up overflow-hidden">
              <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-5 py-4">
                <div>
                  <p className="font-bold">#{o.id}</p>
                  <p className="text-xs text-muted">{formatDate(o.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm text-muted sm:flex">
                    <PaymentInfo method={o.payment_method} />
                  </span>
                  <StatusBadge status={o.status} />
                </div>
              </header>
              <ul className="divide-y divide-line px-5">
                {o.items.map(it => (
                  <li key={it.product_id} className="flex items-center justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <span className="line-clamp-1 text-sm font-medium">{it.product_name}</span>
                      <span className="text-xs text-muted">{t('success.qty', { n: it.quantity, price: formatPrice(it.unit_price) })}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold">{formatPrice(it.unit_price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <footer className="flex flex-wrap items-center justify-between gap-3 bg-paper px-5 py-4">
                <p className="text-xs text-muted">{t('orders.deliverTo', { address: o.shipping_address })}</p>
                <div className="flex items-center gap-3">
                  <Link to={`/orders/${o.id}`} className="btn btn-primary btn-sm">
                    {t('track.viewDetails')} <ArrowRight className="size-3.5 rtl:rotate-180" aria-hidden="true" />
                  </Link>
                  <p className="font-bold">{formatPrice(o.total_amount + (Number(o.shipping_fee) || 0))}</p>
                </div>
              </footer>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}