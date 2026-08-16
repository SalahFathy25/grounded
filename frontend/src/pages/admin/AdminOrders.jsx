import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ImageUp, Loader2, MapPin, Phone, ShoppingBag, X } from 'lucide-react'
import { orderApi } from '../../lib/api'
import { formatDate, formatPrice, timeAgo } from '../../lib/format'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import StatusBadge from '../../components/StatusBadge'
import PaymentInfo from '../../components/PaymentInfo'
import EmptyState from '../../components/EmptyState'
import { RowSkeleton } from '../../components/Skeletons'

const FILTERS = ['ALL', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const NEXT_STATUS = {
  PENDING: ['SHIPPED'],
  PAID: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

export default function AdminOrders() {
  const toast = useToast()
  const { t } = useLang()
  const [orders, setOrders] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [expanded, setExpanded] = useState(new Set())
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')
  const [proofOrder, setProofOrder] = useState(null)

  useEffect(() => {
    orderApi.all().then(setOrders).catch(err => setError(err.message))
  }, [])

  const filtered = useMemo(
    () => (orders || []).filter(o => filter === 'ALL' || o.status === filter),
    [orders, filter]
  )

  const counts = useMemo(() => {
    const c = { ALL: orders?.length || 0 }
    for (const s of FILTERS.slice(1)) c[s] = orders?.filter(o => o.status === s).length || 0
    return c
  }, [orders])

  const toggleExpand = id => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const changeStatus = async (order, status) => {
    setUpdating(order.id)
    try {
      await orderApi.setStatus(order.id, status)
      setOrders(orders.map(o => o.id === order.id ? { ...o, status } : o))
      toast.push(t('admin.orders.updatedToast', { id: order.id, status }))
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setUpdating(null)
    }
  }

  if (error) return <EmptyState title={t('admin.orders.loadError')} subtitle={error} />
  if (!orders) return <RowSkeleton rows={6} />

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.orders.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.orders.total', { n: orders.length })}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('admin.orders.title')}>
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`chip cursor-pointer px-3.5 py-2 transition-colors ${filter === f ? 'bg-ink text-paper' : 'bg-paper text-ink-soft ring-1 ring-line hover:bg-ink/5'}`}
            aria-pressed={filter === f}
          >
            {f} <span className="opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t('admin.orders.noOrders', { filter: filter === 'ALL' ? '' : filter })} subtitle={t('admin.orders.noOrdersSub')} />
      ) : (
        <ul className="space-y-4">
          {filtered.map(o => {
            const isOpen = expanded.has(o.id)
            const next = NEXT_STATUS[o.status] || []
            const up = updating === o.id
            return (
              <li key={o.id} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleExpand(o.id)}
                  className="flex w-full cursor-pointer flex-wrap items-center gap-x-5 gap-y-2 px-5 py-4 text-start hover:bg-paper/60"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold">#{o.id}</span>
                  <span className="hidden min-w-0 flex-1 sm:block">
                    <span className="line-clamp-1 text-sm font-semibold">{o.user_name}</span>
                    <span className="truncate text-xs text-muted">{o.user_email}</span>
                  </span>
                  <span className="text-sm text-muted">{timeAgo(o.created_at)}</span>
                  <span className="font-bold">{formatPrice(o.total_amount)}</span>
                  <StatusBadge status={o.status} />
                  <ChevronDown className={`size-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {isOpen && (
                  <div className="animate-fade-in border-t border-line bg-paper px-5 py-5">
                    <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                      <div>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{t('admin.orders.items')}</h3>
                        <ul className="space-y-2.5">
                          {o.items.map(it => (
                            <li key={it.product_id} className="flex items-center justify-between gap-4 text-sm">
                              <span className="min-w-0">
                                <span className="line-clamp-1 font-medium">{it.product_name}</span>
                                <span className="text-xs text-muted">{t('success.qty', { n: it.quantity, price: formatPrice(it.unit_price) })}</span>
                              </span>
                              <span className="shrink-0 font-semibold">{formatPrice(it.unit_price * it.quantity)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm text-muted">
                          <p className="flex items-center gap-2">
                            <MapPin className="size-4 shrink-0 text-gold" aria-hidden="true" /> {o.shipping_address}
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="size-4 shrink-0 text-gold" aria-hidden="true" /> <span dir="ltr">{o.phone_number}</span>
                          </p>
                          <p className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="flex items-center gap-1.5">
                              <PaymentInfo method={o.payment_method} />
                              {o.status !== 'CANCELLED' && (
                                o.paid_at ? (
                                  <span className="chip bg-emerald-100 text-emerald-700">{t('track.paid')}</span>
                                ) : (
                                  <span className="chip bg-amber-100 text-amber-700">{t('track.unpaid')}</span>
                                )
                              )}
                            </span>
                            <span>{t('admin.orders.placed', { date: formatDate(o.created_at) })}</span>
                          </p>
                          {o.payment_proof && (
                            <button type="button" onClick={() => setProofOrder(o)} className="mt-1 inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-2 text-xs font-semibold text-ink hover:border-gold">
                              <ImageUp className="size-4 text-gold" aria-hidden="true" />
                              {t('admin.orders.viewProof')} · {formatDate(o.payment_proof_at)}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted">{t('admin.orders.updateStatus')}</h3>
                        {next.length === 0 ? (
                          <p className="text-sm text-muted">{t('admin.orders.final')}</p>
                        ) : (
                          <div className="space-y-2">
                            {next.map(s => (
                              <button
                                key={s}
                                type="button"
                                disabled={up}
                                onClick={() => changeStatus(o, s)}
                                className="btn btn-primary btn-sm w-full"
                              >
                                {up && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                {t('admin.orders.markAs', { status: s })}
                              </button>
                            ))}
                            {o.status === 'PENDING' && (
                              <>
                                {o.payment_method !== 'COD' && (
                                  <button
                                    type="button"
                                    disabled={up}
                                    onClick={() => changeStatus(o, 'PAID')}
                                    className="btn btn-gold btn-sm w-full"
                                  >
                                    {up && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                                    <CheckCircle2 className="size-4" aria-hidden="true" />
                                    {t('admin.orders.confirmPay')}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={up}
                                  onClick={() => changeStatus(o, 'CANCELLED')}
                                  className="btn btn-danger btn-sm w-full"
                                >
                                  {t('admin.orders.cancel')}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    {proofOrder && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setProofOrder(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[85vh] max-w-2xl" onClick={e => e.stopPropagation()}>
            <p className="mb-3 text-center text-sm font-semibold text-paper">{t('admin.orders.proofTitle', { id: proofOrder.id })}</p>
            <img src={proofOrder.payment_proof} alt={t('admin.orders.viewProof')} className="max-h-[75vh] w-auto rounded-2xl shadow-2xl" />
            <button
              type="button"
              onClick={() => setProofOrder(null)}
              className="absolute -end-3 -top-3 grid size-9 place-items-center rounded-full bg-ink text-paper shadow-pop"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}