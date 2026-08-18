import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Crown, Loader2, Pencil, Plus, Search, Shield, Trash2, UserRound, Users, X } from 'lucide-react'
import { userApi } from '../../lib/api'
import { formatDate, timeAgo, initials } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import { useAuth } from '../../context/AuthContext'
import Label from '../../components/Label'
import EmptyState from '../../components/EmptyState'
import { RowSkeleton } from '../../components/Skeletons'
import { subscribeRealtime } from '../../lib/realtime'

const PAGE_SIZE = 10
const ROLES = ['ROLE_CUSTOMER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']

const EMPTY_FORM = { full_name: '', email: '', password: '', role: 'ROLE_CUSTOMER' }

export default function AdminUsers() {
  const toast = useToast()
  const { t } = useLang()
  const { user: me } = useAuth()
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [q, setQ] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const query = useMemo(() => ({ page, size: PAGE_SIZE, q: q.trim() }), [page, q])

  const load = useCallback(() => {
    setError('')
    userApi.list(query)
      .then(setData)
      .catch(err => setError(err.message))
  }, [query])

  useEffect(() => { load() }, [load])
  useEffect(() => { setPage(0) }, [q])

  useEffect(() => {
    if (data && data.totalPages > 0 && page >= data.totalPages && page !== data.totalPages - 1) {
      setPage(data.totalPages - 1)
    }
  }, [data, page])

  useEffect(() => subscribeRealtime(load), [load])

  const roleLabel = role => ({
    ROLE_CUSTOMER: t('admin.users.roleCustomer'),
    ROLE_ADMIN: t('admin.users.roleAdmin'),
    ROLE_SUPER_ADMIN: t('admin.users.roleSuper'),
  })[role] || role

  const roleChip = role => {
    const cls = {
      ROLE_CUSTOMER: 'bg-paper text-ink-soft ring-1 ring-line',
      ROLE_ADMIN: 'bg-emerald-100 text-emerald-700',
      ROLE_SUPER_ADMIN: 'bg-gold-tint text-gold-deep',
    }[role]
    const Icon = role === 'ROLE_SUPER_ADMIN' ? Crown : role === 'ROLE_ADMIN' ? Shield : UserRound
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>
        <Icon className="size-3.5" aria-hidden="true" />
        {roleLabel(role)}
      </span>
    )
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditing('new')
  }

  const openEdit = u => {
    setForm({ full_name: u.full_name, email: u.email, password: '', role: u.role })
    setEditing(u)
  }

  const setField = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      if (editing === 'new') {
        await userApi.create(form)
        toast.push(t('admin.users.createdToast', { name: form.full_name }))
      } else {
        const payload = { full_name: form.full_name, email: form.email, role: form.role }
        if (form.password.trim()) payload.password = form.password
        await userApi.update(editing.id, payload)
        toast.push(t('admin.users.updatedToast', { name: form.full_name }))
      }
      setEditing(null)
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async u => {
    if (!window.confirm(t('admin.users.deleteConfirm', { name: u.full_name }))) return
    setDeleting(u.id)
    try {
      await userApi.remove(u.id)
      toast.push(t('admin.users.deletedToast', { name: u.full_name }))
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  if (error) return <EmptyState title={t('admin.users.loadError')} subtitle={error} />
  if (!data) return <RowSkeleton rows={6} />

  const users = data.content || []

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.users.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin.users.count', { n: data.totalElements })}</p>
        </div>
        <button type="button" onClick={openCreate} className="btn btn-primary">
          <Plus className="size-4" aria-hidden="true" /> {t('admin.users.add')}
        </button>
      </header>

      <div className="relative">
        <Search className="absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={t('admin.users.search')}
          className="input !ps-10"
          aria-label={t('admin.users.search')}
        />
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title={t('admin.users.empty')} subtitle={t('admin.users.emptySub')} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-start text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-3 text-start font-bold">{t('admin.users.colUser')}</th>
                <th className="px-5 py-3 text-start font-bold">{t('admin.users.colRole')}</th>
                <th className="px-5 py-3 text-start font-bold">{t('admin.users.colOrders')}</th>
                <th className="px-5 py-3 text-start font-bold">{t('admin.users.colJoined')}</th>
                <th className="px-5 py-3 text-end font-bold">{t('admin.users.colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isMe = u.id === me.id
                return (
                  <tr key={u.id} className="border-b border-line last:border-0 hover:bg-paper/60">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink/10 text-xs font-bold" aria-hidden="true">
                          {initials(u.full_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold">
                            <span className="truncate">{u.full_name}</span>
                            {isMe && (
                              <span className="chip shrink-0 bg-gold-tint text-gold-deep">{t('admin.users.you')}</span>
                            )}
                          </p>
                          <p className="truncate text-xs text-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{roleChip(u.role)}</td>
                    <td className="px-5 py-3.5 font-semibold">{u.orders_count}</td>
                    <td className="px-5 py-3.5 text-muted">
                      <span className="hidden md:inline">{formatDate(u.created_at)}</span>
                      <span className="md:hidden">{timeAgo(u.created_at)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(u)}
                          className="grid size-9 cursor-pointer place-items-center rounded-lg border border-line bg-paper text-ink-soft transition-colors hover:border-gold hover:text-gold"
                          aria-label={`${t('admin.users.edit')} ${u.full_name}`}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          disabled={isMe || deleting === u.id}
                          onClick={() => remove(u)}
                          className="grid size-9 cursor-pointer place-items-center rounded-lg border border-line bg-paper text-ink-soft transition-colors hover:border-danger/50 hover:text-danger disabled:cursor-not-allowed disabled:opacity-35"
                          aria-label={`${t('admin.users.delete')} ${u.full_name}`}
                          title={isMe ? t('admin.users.cannotDeleteSelf') : undefined}
                        >
                          {deleting === u.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
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

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={editing === 'new' ? t('admin.users.addTitle') : t('admin.users.editTitle', { name: editing.full_name })}>
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <div className="card relative w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 shadow-pop animate-fade-up sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing === 'new' ? t('admin.users.addTitle') : t('admin.users.editTitle', { name: editing.full_name })}</h2>
              <button type="button" onClick={() => setEditing(null)} className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-ink/5" aria-label={t('cart.close')}>
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={e => { e.preventDefault(); save() }}
              className="mt-6 space-y-4"
            >
              <div>
                <Label htmlFor="u-name" required>{t('admin.users.name')}</Label>
                <input id="u-name" value={form.full_name} onChange={setField('full_name')} className="input" required />
              </div>
              <div>
                <Label htmlFor="u-email" required>{t('admin.users.email')}</Label>
                <input id="u-email" type="email" value={form.email} onChange={setField('email')} className="input" dir="ltr" required />
              </div>
              <div>
                <Label htmlFor="u-password" required={editing === 'new'} hint={editing !== 'new' ? t('admin.users.passwordHint') : undefined}>
                  {t('admin.users.password')}
                </Label>
                <input
                  id="u-password"
                  type="password"
                  value={form.password}
                  onChange={setField('password')}
                  className="input"
                  minLength={editing === 'new' ? 6 : undefined}
                  required={editing === 'new'}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <Label htmlFor="u-role" hint={editing && editing.id === me.id ? t('admin.users.cannotChangeOwnRole') : undefined}>
                  {t('admin.users.role')}
                </Label>
                <select
                  id="u-role"
                  value={form.role}
                  onChange={setField('role')}
                  className="input cursor-pointer"
                  disabled={editing !== 'new' && editing.id === me.id}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{roleLabel(r)}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="btn btn-outline">
                  {t('admin.users.cancel')}
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t('admin.users.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}