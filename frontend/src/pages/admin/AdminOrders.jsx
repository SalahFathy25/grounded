import { useCallback, useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ImageUp, Loader2, MapPin, Phone, ShoppingBag, Trash2, X } from 'lucide-react'
import { orderApi } from '../../lib/api'
import { formatDate, formatPrice, timeAgo } from '../../lib/format'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import StatusBadge from '../../components/StatusBadge'
import PaymentInfo from '../../components/PaymentInfo'
import EmptyState from '../../components/EmptyState'
import { RowSkeleton } from '../../components/Skeletons'
import { subscribeRealtime } from '../../lib/realtime'

const FILTERS = ['ALL', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']
const PAGE_SIZE = 10
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
  const [data, setData] = useState(null)
  const [filter, setFilter] = useState('ALL')
  const [page, setPage] = useState(0)
  const [expanded, setExpanded] = useState(new Set())
  const [updating, setUpdating] = useState(null)
  const [error, setError] = useState('')
  const [proofOrder, setProofOrder] = useState(null)
  const [counts, setCounts] = useState({ ALL: 0 })
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)

  const query = useMemo(() => {
    const q = { page, size: PAGE_SIZE }
    if (filter !== 'ALL') q.status = filter
    return q
  }, [filter, page])

  const load = useCallback(() => {
    setError('')
    orderApi.all(query)
      .then(res => {
        setData(res)
        setCounts(prev => ({ ...prev, [filter]: res.totalElements }))
      })
      .catch(err => setError(err.message))
  }, [query, filter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (data && data.totalPages > 0 && page >= data.totalPages && page !== data.totalPages - 1) {
      setPage(data.totalPages - 1)
    }
  }, [data, page])

  const refreshCounts = useCallback(() => {
    Promise.all(FILTERS.map(status =>
      orderApi.all(status === 'ALL' ? { size: 1 } : { status, size: 1 })
        .then(res => ({ status, total: res.totalElements }))
        .catch(() => null),
    )).then(list => {
      const c = { ALL: 0 }
      for (const item of list) if (item) c[item.status] = item.total
      setCounts(c)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all(FILTERS.map(status =>
      orderApi.all(status === 'ALL' ? { size: 1 } : { status, size: 1 })
        .then(res => ({ status, total: res.totalElements }))
        .catch(() => null),
    )).then(list => {
      if (cancelled) return
      const c = { ALL: 0 }
      for (const item of list) if (item) c[item.status] = item.total
      setCounts(c)
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const unsub = subscribeRealtime(() => {
      load()
      refreshCounts()
    })
    return unsub
  }, [load, refreshCounts])

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
      toast.push(t('admin.orders.updatedToast', { id: order.id, status }))
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setUpdating(null)
    }
  }

  const switchFilter = f => {
    setFilter(f)
    setPage(0)
    setSelected(new Set())
  }

  const toggleSelect = id => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const deleteSelected = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (!window.confirm(t('admin.orders.deleteConfirm', { n: ids.length }))) return
    setDeleting(true)
    try {
      const res = await orderApi.deleteMany(ids)
      toast.push(t('admin.orders.deletedToast', { n: res.deleted }))
      setSelected(new Set())
      load()
      refreshCounts()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const deleteAll = async () => {
    if (!window.confirm(t('admin.orders.deleteAllConfirm'))) return
    setDeleting(true)
    try {
      const res = await orderApi.deleteAll()
      toast.push(t('admin.orders.deletedToast', { n: res.deleted }))
      setSelected(new Set())
      load()
      refreshCounts()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (error) return <EmptyState title={t('admin.orders.loadError')} subtitle={error} />
  if (!data) return <RowSkeleton rows={6} />

  const orders = data.content || []

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.orders.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.orders.total', { n: data.totalElements })}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label={t('admin.orders.title')}>
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => switchFilter(f)}
            className={`chip cursor-pointer px-3.5 py-2 transition-colors ${filter === f ? 'bg-ink text-paper' : 'bg-paper text-ink-soft ring-1 ring-line hover:bg-ink/5'}`}
            aria-pressed={filter === f}
          >
            {f} <span className="opacity-60">({counts[f] ?? 0})</span>
          </button>
        ))}
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
          <p className="text-sm font-semibold">{t('admin.orders.selected', { n: selected.size })}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelected(new Set())} className="btn btn-outline btn-sm">
              {t('admin.orders.close')}
            </button>
            <button type="button" onClick={deleteSelected} disabled={deleting} className="btn btn-danger btn-sm">
              {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
              {t('admin.orders.deleteSelected')}
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">{t('admin.orders.bulkHint')}</p>
        <button type="button" onClick={deleteAll} disabled={deleting} className="btn btn-outline btn-sm !text-danger hover:!border-danger/40 hover:!bg-danger/5">
          {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
          {t('admin.orders.deleteAll')}
        </button>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={ShoppingBag} title={t('admin.orders.noOrders', { filter: filter === 'ALL' ? '' : filter })} subtitle={t('admin.orders.noOrdersSub')} />
      ) : (
        <ul className="space-y-4">
          {orders.map(o => {
            const isOpen = expanded.has(o.id)
            const next = NEXT_STATUS[o.status] || []
            const up = updating === o.id
            const total = o.total_amount + (Number(o.shipping_fee) || 0)
            return (
              <li key={o.id} className="card overflow-hidden">
                <div className="flex items-center gap-1 border-b border-line bg-paper/50 ps-4 pe-5 pt-3">
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggleSelect(o.id)}
                    className="size-4 cursor-pointer accent-[#0f766e]"
                    aria-label={`${t('admin.orders.selectRow')} #${o.id}`}
                  />
                </div>
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
                  <span className="font-bold">{formatPrice(total)}</span>
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

      {data.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label={t('admin.orders.pagination')}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-paper disabled:opacity-35 hover:border-ink"
            aria-label={t('admin.orders.prevPage')}
          >
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
          <span className="px-2 text-sm font-semibold text-muted">
            {t('admin.orders.pageOf', { page: page + 1, total: data.totalPages })}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages - 1}
            onClick={() => setPage(p => Math.min(data.totalPages - 1, p + 1))}
            className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-paper disabled:opacity-35 hover:border-ink"
            aria-label={t('admin.orders.nextPage')}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </nav>
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
              aria-label={t('admin.orders.close')}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
