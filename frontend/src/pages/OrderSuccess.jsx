import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Loader2, MapPin, PackageCheck, Phone, Wallet } from 'lucide-react'
import { formatDate, formatPrice } from '../lib/format'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LangContext'
import { orderApi } from '../lib/api'
import PaymentInfo from '../components/PaymentInfo'

export default function OrderSuccess() {
  const location = useLocation()
  const { id } = useParams()
  const { user } = useAuth()
  const { t } = useLang()
  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)
  const [error, setError] = useState('')

  useEffect(() => {
    if (location.state?.order) return
    orderApi.get(id)
      .then(o => setOrder(o))
      .catch(() => setError(t('success.loading')))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="card animate-fade-up overflow-hidden shadow-pop">
        <div className="bg-emerald-50 px-6 py-10 text-center sm:px-10">
          <span className="mx-auto grid size-16 place-items-center rounded-full bg-paper shadow" aria-hidden="true">
            <CheckCircle2 className="size-9 text-success" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{t('success.confirmed')}</h1>
          <p className="mt-1.5 text-sm text-muted">
            {t('success.thanks')}
            {order && (
              <>
                {' '}{t('success.beingPrepared')} <strong className="text-ink">#{order.id}</strong>
              </>
            )}
          </p>
        </div>

        {loading && !order && (
          <div className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t('success.loading')}
          </div>
        )}

        {order && (
          <div className="px-6 py-7 sm:px-10">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-paper px-4 py-3 text-sm">
              <span className="text-muted">{t('success.placedOn', { date: formatDate(order.created_at) })}</span>
              <span className="chip bg-gold-tint text-gold-deep">
                <PaymentInfo method={order.payment_method} />
              </span>
            </div>

            <ul className="mt-6 divide-y divide-line border-y border-line">
              {order.items.map(it => (
                <li key={it.product_id} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{it.product_name}</span>
                    <span className="text-xs text-muted">{t('success.qty', { n: it.quantity, price: formatPrice(it.unit_price) })}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold">{formatPrice(it.unit_price * it.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex items-start gap-2 text-muted">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                <span>{t('success.deliverTo')} <strong className="text-ink">{order.shipping_address}</strong></span>
              </div>
              <div className="flex items-start gap-2 text-muted">
                <Phone className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                <span dir="ltr">{order.phone_number}</span>
              </div>
              <div className="flex items-center justify-between border-t border-line pt-3">
                <span className="font-bold">{t('success.total')}</span>
                <span className="text-xl font-bold">{formatPrice(order.total_amount)}</span>
              </div>
            </dl>

            {order.payment_method === 'COD' && (
              <p className="mt-5 flex items-start gap-2.5 rounded-lg bg-gold-tint/70 px-4 py-3 text-sm text-gold-deep">
                <PackageCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t('success.keepReady', { amount: formatPrice(order.total_amount) })}
              </p>
            )}
            {(order.payment_method === 'VODAFONE_CASH' || order.payment_method === 'INSTAPAY') && (
              <p className="mt-5 flex items-start gap-2.5 rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-700">
                <Wallet className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t('success.walletTransfer', { method: t(`pay.${order.payment_method.toLowerCase()}`) })}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/products" className="btn btn-primary">
          {t('success.continue')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
        {user && (
          <Link to="/my-orders" className="btn btn-outline">
            {t('success.viewOrders')}
          </Link>
        )}
      </div>
    </div>
  )
}