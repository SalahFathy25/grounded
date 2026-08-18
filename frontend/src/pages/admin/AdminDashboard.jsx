import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Banknote, Package, ShoppingCart, Timer, Users } from 'lucide-react'
import { adminApi } from '../../lib/api'
import { formatPrice, timeAgo } from '../../lib/format'
import { useLang } from '../../context/LangContext'
import StatusBadge from '../../components/StatusBadge'
import EmptyState from '../../components/EmptyState'
import { RowSkeleton } from '../../components/Skeletons'
import { subscribeRealtime } from '../../lib/realtime'

function StatCard({ icon: Icon, label, value, hint, accent = 'text-gold bg-gold-tint' }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className={`grid size-12 shrink-0 place-items-center rounded-xl ${accent}`} aria-hidden="true">
        <Icon className="size-6" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-0.5 truncate text-2xl font-bold tracking-tight">{value}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const { t } = useLang()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  const load = () => adminApi.stats().then(setStats).catch(err => setError(err.message))

  useEffect(() => { load() }, [])

  useEffect(() => {
    const unsub = subscribeRealtime(() => load())
    return unsub
  }, [])

  if (error) {
    return <EmptyState title={t('admin.dash.loadError')} subtitle={error} />
  }
  if (!stats) {
    return <RowSkeleton rows={6} />
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t('admin.dash.title')}</h1>
        <p className="mt-1 text-sm text-muted">{t('admin.dash.sub')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Banknote} label={t('admin.dash.revenue')} value={formatPrice(stats.revenue)} hint={t('admin.dash.revenueHint')} />
        <StatCard icon={ShoppingCart} label={t('admin.dash.orders')} value={stats.orders_count} hint={t('admin.dash.pending', { n: stats.pending_orders })} accent="text-sky-600 bg-sky-50" />
        <StatCard icon={Users} label={t('admin.dash.customers')} value={stats.customers_count} accent="text-indigo-600 bg-indigo-50" />
        <StatCard icon={Package} label={t('admin.dash.activeProducts')} value={stats.products_count} hint={t('admin.dash.lowOnStock', { n: stats.low_stock_count })} accent="text-emerald-600 bg-emerald-50" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Recent orders */}
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-bold">{t('admin.dash.recentOrders')}</h2>
            <Link to="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-gold-deep hover:underline">
              {t('admin.dash.manageAll')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </header>
          {stats.recent_orders.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">{t('admin.dash.noOrders')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.recent_orders.map(o => (
                <li key={o.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      #{o.id} · <span className="font-normal text-muted">{o.user_name}</span>
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <Timer className="size-3.5" aria-hidden="true" /> {timeAgo(o.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                  <p className="w-28 shrink-0 text-end text-sm font-bold">{formatPrice(o.total_amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Low stock */}
        <section className="card overflow-hidden">
          <header className="flex items-center gap-2 border-b border-line px-5 py-4">
            <AlertTriangle className="size-4 text-danger" aria-hidden="true" />
            <h2 className="font-bold">{t('admin.dash.lowStock')}</h2>
          </header>
          {stats.low_stock_products.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted">{t('admin.dash.allStocked')}</p>
          ) : (
            <ul className="divide-y divide-line">
              {stats.low_stock_products.map(p => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                  <img src={p.image_url} alt="" className="size-11 rounded-lg border border-line object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">{formatPrice(p.price)}</p>
                  </div>
                  <span className={`chip ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                    {p.stock_quantity === 0 ? t('admin.dash.outOfStock') : t('admin.dash.left', { n: p.stock_quantity })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}