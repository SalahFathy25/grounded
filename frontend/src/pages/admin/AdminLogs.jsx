import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Crown, Loader2, ScrollText, Search, Shield, Trash2, UserRound } from 'lucide-react'
import { logApi } from '../../lib/api'
import { formatDate, timeAgo } from '../../lib/format'
import { useLang } from '../../context/LangContext'
import { useToast } from '../../context/ToastContext'
import EmptyState from '../../components/EmptyState'
import { RowSkeleton } from '../../components/Skeletons'
import { subscribeRealtime } from '../../lib/realtime'

const PAGE_SIZE = 15
const RESOURCES = ['', 'product', 'order', 'category', 'user', 'settings', 'content', 'auth']
const ACTIONS = ['', 'create', 'update', 'delete', 'hide', 'restore', 'status_update', 'pay', 'proof_upload', 'login', 'register']

export default function AdminLogs() {
  const toast = useToast()
  const { t } = useLang()
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [resource, setResource] = useState('')
  const [action, setAction] = useState('')
  const [error, setError] = useState('')
  const [clearing, setClearing] = useState(false)

  const query = useMemo(
    () => ({ page, size: PAGE_SIZE, q: q.trim(), resource, action }),
    [page, q, resource, action],
  )

  const load = useCallback(() => {
    setError('')
    logApi.list(query)
      .then(setData)
      .catch(err => setError(err.message))
  }, [query])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [q, resource, action])

  useEffect(() => {
    if (data && data.totalPages > 0 && page >= data.totalPages && page !== data.totalPages - 1) {
      setPage(data.totalPages - 1)
    }
  }, [data, page])

  useEffect(() => subscribeRealtime(load), [load])

  const clearAll = async () => {
    if (!window.confirm(t('admin.logs.clearConfirm'))) return
    setClearing(true)
    try {
      const res = await logApi.clear()
      toast.push(t('admin.logs.clearToast', { n: res.deleted }))
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setClearing(false)
    }
  }

  const actionBadge = a => {
    const cls = {
      create: 'bg-emerald-100 text-emerald-700',
      update: 'bg-sky-100 text-sky-700',
      delete: 'bg-red-100 text-red-700',
      hide: 'bg-amber-100 text-amber-700',
      restore: 'bg-emerald-100 text-emerald-700',
      status_update: 'bg-violet-100 text-violet-700',
      pay: 'bg-teal-100 text-teal-700',
      proof_upload: 'bg-indigo-100 text-indigo-700',
      login: 'bg-slate-200 text-slate-700',
      register: 'bg-slate-200 text-slate-700',
    }[a] || 'bg-slate-200 text-slate-700'
    return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cls}`}>{a.replace('_', ' ')}</span>
  }

  const roleChip = role => {
    const Icon = role === 'ROLE_SUPER_ADMIN' ? Crown : role === 'ROLE_ADMIN' ? Shield : UserRound
    const cls = {
      ROLE_SUPER_ADMIN: 'bg-gold-tint text-gold-deep',
      ROLE_ADMIN: 'bg-emerald-100 text-emerald-700',
      ROLE_CUSTOMER: 'bg-paper text-ink-soft ring-1 ring-line',
    }[role] || 'bg-paper text-ink-soft ring-1 ring-line'
    return (
      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>
        <Icon className="size-3" aria-hidden="true" />
        {role === 'ROLE_SUPER_ADMIN' ? 'SUPER' : role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER'}
      </span>
    )
  }

  if (error) return <EmptyState title={t('admin.logs.loadError')} subtitle={error} />
  if (!data) return <RowSkeleton rows={6} />

  const logs = data.content || []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.logs.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin.logs.count', { n: data.totalElements })}</p>
        </div>
        <button type="button" onClick={clearAll} disabled={clearing} className="btn btn-outline btn-sm !text-danger hover:!border-danger/40 hover:!bg-danger/5">
          {clearing ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
          {t('admin.logs.clear')}
        </button>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={t('admin.logs.search')}
            className="input !ps-10"
            aria-label={t('admin.logs.search')}
          />
        </div>
        <select value={resource} onChange={e => setResource(e.target.value)} className="input cursor-pointer sm:w-44" aria-label={t('admin.logs.filterResource')}>
          {RESOURCES.map(r => (
            <option key={r} value={r}>{r ? t(`admin.logs.res.${r}`) : t('admin.logs.allResources')}</option>
          ))}
        </select>
        <select value={action} onChange={e => setAction(e.target.value)} className="input cursor-pointer sm:w-44" aria-label={t('admin.logs.filterAction')}>
          {ACTIONS.map(a => (
            <option key={a} value={a}>{a ? t(`admin.logs.act.${a}`) : t('admin.logs.allActions')}</option>
          ))}
        </select>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title={t('admin.logs.empty')} subtitle={t('admin.logs.emptySub')} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 text-start font-bold">{t('admin.logs.colWhen')}</th>
                <th className="px-5 py-3 text-start font-bold">{t('admin.logs.colActor')}</th>
                <th className="px-5 py-3 text-start font-bold">{t('admin.logs.colAction')}</th>
                <th className="px-5 py-3 text-start font-bold">{t('admin.logs.colTarget')}</th>
                <th className="px-5 py-3 text-start font-bold">{t('admin.logs.colDetails')}</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                  <td className="whitespace-nowrap px-5 py-3 align-top">
                    <p className="font-semibold">{timeAgo(l.created_at)}</p>
                    <p className="text-xs text-muted">{formatDate(l.created_at)}</p>
                  </td>
                  <td className="px-5 py-3 align-top">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[160px]" dir="ltr">{l.actor_email || '—'}</span>
                      {l.actor_role && roleChip(l.actor_role)}
                    </div>
                  </td>
                  <td className="px-5 py-3 align-top">{actionBadge(l.action)}</td>
                  <td className="whitespace-nowrap px-5 py-3 align-top">
                    <span className="font-semibold capitalize">{l.resource}</span>
                    {l.resource_id != null && <span className="text-muted"> #{l.resource_id}</span>}
                  </td>
                  <td className="max-w-[260px] px-5 py-3 align-top">
                    {l.details ? (
                      <code className="line-clamp-2 block text-xs text-muted break-all" dir="ltr" title={JSON.stringify(l.details)}>
                        {JSON.stringify(l.details)}
                      </code>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    </div>
  )
}