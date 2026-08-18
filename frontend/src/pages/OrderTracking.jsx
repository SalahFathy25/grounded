import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Check, CheckCircle2, ImageUp, Loader2, MapPin, PackageSearch, Phone, ShoppingBag, Truck, Wallet, X,
} from 'lucide-react'
import { orderApi } from '../lib/api'
import { useLang } from '../context/LangContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import { compressImage, formatDate, formatPrice } from '../lib/format'
import PaymentInfo from '../components/PaymentInfo'
import StatusBadge from '../components/StatusBadge'
import EmptyState from '../components/EmptyState'
import { RowSkeleton } from '../components/Skeletons'

const FLOW = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED']
const STEP_ICONS = { PENDING: ShoppingBag, PAID: Wallet, SHIPPED: Truck, DELIVERED: CheckCircle2 }

function Timeline({ order }) {
  const { t } = useLang()
  const history = order.status_history || []

  if (order.status === 'CANCELLED') {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <p className="font-bold text-red-700">{t('track.steps.CANCELLED')}</p>
        <p className="mt-1 text-sm text-red-600/80">{formatDate(history.find(h => h.status === 'CANCELLED')?.at || order.created_at)}</p>
      </div>
    )
  }

  const currentIdx = FLOW.indexOf(order.status)

  return (
    <ol className="space-y-0">
      {FLOW.map((s, i) => {
        const Icon = STEP_ICONS[s]
        const hit = history.find(h => h.status === s)
        const done = i < currentIdx
        const current = i === currentIdx
        return (
          <li key={s} className="relative flex gap-4 pb-8 last:pb-0">
            {i < FLOW.length - 1 && (
              <span className={`absolute start-[15px] top-9 h-[calc(100%-2rem)] w-0.5 rounded ${done ? 'bg-gold' : 'bg-line'}`} aria-hidden="true" />
            )}
            <span className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-4 ${
              done || current ? 'bg-gold text-ink ring-gold-tint' : 'bg-line text-muted ring-paper'
            }`} aria-hidden="true">
              {done ? <Check className="size-4" /> : <Icon className="size-4" />}
            </span>
            <div className="pt-1.5">
              <p className={`text-sm font-bold ${done || current ? '' : 'text-muted'}`}>{t(`track.steps.${s}`)}</p>
              <p className="mt-0.5 text-xs text-muted">{hit ? formatDate(hit.at) : '—'}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function ProofUpload({ order, refresh }) {
  const { t } = useLang()
  const toast = useToast()
  const fileRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [show, setShow] = useState(false)

  const onFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await compressImage(file, 1280, 0.8)
      await orderApi.proof(order.id, dataUrl)
      toast.push(t('pay.wallet.uploaded'), 'success')
      refresh()
    } catch {
      toast.push(t('pay.wallet.proofError'), 'error')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 text-sm font-semibold">
        {t('track.proof')}
        {order.payment_proof ? (
          <span className="chip bg-emerald-100 text-emerald-700"><Check className="size-3" /> {t('track.proofUploaded')}</span>
        ) : (
          <span className="chip bg-amber-100 text-amber-700">{t('track.proofMissing')}</span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {order.payment_proof ? (
          <>
            <button type="button" onClick={() => setShow(true)} className="overflow-hidden rounded-lg border border-line">
              <img src={order.payment_proof} alt={t('track.proof')} className="size-16 object-cover hover:scale-105 transition-transform" />
            </button>
            {order.status === 'PENDING' && (
              <button type="button" onClick={() => fileRef.current?.click()} className="text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-ink">
                {t('pay.wallet.replace')}
              </button>
            )}
          </>
        ) : (
          order.status === 'PENDING' && (
            <button
              type="button" onClick={() => fileRef.current?.click()} disabled={busy}
              className="flex items-center gap-2 rounded-lg border-2 border-dashed border-line bg-paper px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:border-gold hover:text-ink"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImageUp className="size-4 text-gold" aria-hidden="true" />}
              {t('track.proofUpload')}
            </button>
          )
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      {show && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm" onClick={() => setShow(false)} role="dialog" aria-modal="true">
          <div className="relative max-h-[85vh] max-w-2xl" onClick={e => e.stopPropagation()}>
            <img src={order.payment_proof} alt={t('track.proof')} className="max-h-[85vh] w-auto rounded-2xl shadow-2xl" />
            <button type="button" onClick={() => setShow(false)} className="absolute -end-3 -top-3 grid size-9 place-items-center rounded-full bg-ink text-paper shadow-pop" aria-label={t('pay.lightboxClose')}>
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OrderTracking() {
  const { id } = useParams()
  const { t } = useLang()
  const { settings } = useSettings()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const load = () => {
    orderApi.get(id)
      .then(setOrder)
      .catch(err => setError(err.message))
  }
  useEffect(load, [id])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={PackageSearch} title={t('track.notFound')} subtitle={t('track.notFoundSub')} action={<Link to="/my-orders" className="btn btn-primary">{t('track.back')}</Link>} />
      </div>
    )
  }
  if (!order) return <div className="mx-auto max-w-3xl px-4 py-16"><RowSkeleton rows={5} /></div>

  const isWallet = order.payment_method === 'VODAFONE_CASH' || order.payment_method === 'INSTAPAY'
  const isPaid = order.payment_method === 'COD'
    ? order.status === 'DELIVERED'
    : !!order.paid_at || ['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status)
  const walletNumber = order.payment_method === 'VODAFONE_CASH' ? settings.vodafone_number : settings.instapay_number
  const shippingFee = Number(order.shipping_fee) || 0
  const subtotal = Math.round(order.total_amount * 100) / 100
  const orderTotal = Math.round((order.total_amount + shippingFee) * 100) / 100

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(walletNumber || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* ignore */ }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/my-orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink">
        <ArrowLeft className="size-4 rtl:rotate-180" aria-hidden="true" /> {t('track.back')}
      </Link>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('track.title')} <span className="text-gold">#{order.id}</span></h1>
          <p className="mt-1 text-sm text-muted">{t('track.place', { date: formatDate(order.created_at) })}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <StatusBadge status={order.status} />
          <PaymentInfo method={order.payment_method} />
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="text-lg font-bold">{t('track.timeline')}</h2>
            <div className="mt-6"><Timeline order={order} /></div>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-bold">{t('track.items')}</h2>
            <ul className="mt-4 divide-y divide-line">
              {order.items.map(it => (
                <li key={it.id}>
                  <Link to={`/products/${it.product_id}`} className="flex items-center gap-3.5 py-3 transition-colors hover:bg-paper/70">
                    <img src={it.product_image} alt={it.product_name} className="size-14 shrink-0 rounded-lg border border-line object-cover" loading="lazy" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 text-sm font-semibold underline-offset-2 group-hover:underline">{it.product_name}</span>
                      <span className="text-xs text-muted">{t('track.qty', { n: it.quantity, price: formatPrice(it.unit_price) })}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold">{formatPrice(it.unit_price * it.quantity)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-lg font-bold">{t('track.shipTo')}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center gap-2.5 text-ink-soft">
                <MapPin className="size-4 shrink-0 text-gold" aria-hidden="true" /> {order.shipping_address}
              </p>
              <p className="flex items-center gap-2.5 text-ink-soft">
                <Phone className="size-4 shrink-0 text-gold" aria-hidden="true" /> <span dir="ltr">{order.phone_number}</span>
              </p>
              {isWallet && (
                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-paper p-3.5">
                  <p className="text-xs text-muted">{t('pay.wallet.numberLabel')}</p>
                  <p className="text-sm font-bold" dir="ltr">{walletNumber || '—'}</p>
                  <button type="button" onClick={copy} className="btn btn-primary btn-sm ms-auto">
                    {copied ? t('pay.wallet.copied') : t('pay.wallet.copy')}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-6 lg:sticky lg:top-24">
          <div className="card p-6 shadow-card">
            <h3 className="font-bold">{t('track.summary')}</h3>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <dt>{t('cart.subtotal')}</dt>
                <dd className="font-semibold text-ink">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>{t('cart.shipping')}</dt>
                <dd className="font-semibold text-ink">{formatPrice(shippingFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3">
                <dt className="font-bold">{t('checkout.total')}</dt>
                <dd className="text-xl font-bold">{formatPrice(orderTotal)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h3 className="font-bold">{t('track.paymentMethod')}</h3>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between gap-3 text-sm">
                <PaymentInfo method={order.payment_method} showDesc />
                {order.status !== 'CANCELLED' && (
                  isPaid ? (
                    <span className="chip bg-emerald-100 text-emerald-700" title={order.paid_at ? formatDate(order.paid_at) : undefined}>{t('track.paid')}</span>
                  ) : (
                    <span className="chip bg-amber-100 text-amber-700">{t('track.unpaid')}</span>
                  )
                )}
              </div>

              {order.status === 'CANCELLED' ? (
                <p className="text-sm text-muted">{t('track.cancelledNote')}</p>
              ) : order.payment_method === 'COD' ? (
                <p className="text-sm text-muted">{t('track.codNote')}</p>
              ) : isPaid ? (
                <p className="text-sm text-muted">{t('track.paidOn', { date: formatDate(order.paid_at || order.created_at) })}</p>
              ) : isWallet ? (
                <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs font-medium text-amber-700">{t('track.walletPending')}</p>
              ) : (
                <div className="rounded-lg bg-amber-50 px-4 py-3">
                  <p className="text-xs font-medium text-amber-700">{t('track.cardPending')}</p>
                  <Link to={`/pay/${order.id}`} className="btn btn-primary btn-sm mt-3">{t('track.resumePay')}</Link>
                </div>
              )}

              {isWallet && order.status !== 'CANCELLED' && !isPaid && <ProofUpload order={order} refresh={load} />}
            </div>
          </div>

          <Link to="/products" className="btn btn-gold w-full">
            <ShoppingBag className="size-4" aria-hidden="true" /> {t('cart.startShopping')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </div>
  )
}