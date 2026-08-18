import { useCallback, useEffect, useState } from 'react'
import { LayoutGrid, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { categoryApi } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import Label from '../../components/Label'
import EmptyState from '../../components/EmptyState'
import { RowSkeleton } from '../../components/Skeletons'
import { subscribeRealtime } from '../../lib/realtime'

const EMPTY_FORM = { name: '', name_ar: '', image_url: '' }

export default function AdminCategories() {
  const toast = useToast()
  const { t } = useLang()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(() => {
    setError('')
    categoryApi.list()
      .then(setData)
      .catch(err => setError(err.message))
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => subscribeRealtime(load), [load])

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setEditing('new')
  }

  const openEdit = c => {
    setForm({ name: c.name, name_ar: c.name_ar || '', image_url: c.image_url || '' })
    setEditing(c)
  }

  const setField = key => e => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const save = async () => {
    if (!form.name.trim()) {
      toast.push(t('admin.categories.nameRequired'), 'error')
      return
    }
    setSaving(true)
    try {
      if (editing === 'new') {
        await categoryApi.create(form)
        toast.push(t('admin.categories.createdToast', { name: form.name.trim() }))
      } else {
        await categoryApi.update(editing.id, form)
        toast.push(t('admin.categories.updatedToast', { name: form.name.trim() }))
      }
      setEditing(null)
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async c => {
    if (!window.confirm(t('admin.categories.deleteConfirm', { name: c.name }))) return
    setDeleting(c.id)
    try {
      await categoryApi.remove(c.id)
      toast.push(t('admin.categories.deletedToast', { name: c.name }))
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setDeleting(null)
    }
  }

  if (error) return <EmptyState title={t('admin.categories.loadError')} subtitle={error} />
  if (!data) return <RowSkeleton rows={4} />

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.categories.title')}</h1>
          <p className="mt-1 text-sm text-muted">{t('admin.categories.count', { n: data.length })}</p>
        </div>
        <button type="button" onClick={openCreate} className="btn btn-primary">
          <Plus className="size-4" aria-hidden="true" /> {t('admin.categories.add')}
        </button>
      </header>

      {data.length === 0 ? (
        <EmptyState icon={LayoutGrid} title={t('admin.categories.empty')} subtitle={t('admin.categories.emptySub')} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map(c => (
            <div key={c.id} className="card group overflow-hidden">
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span className="absolute start-2 top-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-bold text-paper backdrop-blur">
                  {c.product_count} {t('admin.categories.products')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 p-4">
                <div className="min-w-0">
                  <p className="truncate font-display text-lg uppercase tracking-wide">{c.name}</p>
                  {c.name_ar && <p className="truncate text-sm text-muted">{c.name_ar}</p>}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="grid size-9 cursor-pointer place-items-center rounded-lg border border-line bg-paper text-ink-soft transition-colors hover:border-gold hover:text-gold"
                    aria-label={`${t('admin.categories.edit')} ${c.name}`}
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={deleting === c.id}
                    onClick={() => remove(c)}
                    className="grid size-9 cursor-pointer place-items-center rounded-lg border border-line bg-paper text-ink-soft transition-colors hover:border-danger/50 hover:text-danger disabled:opacity-35"
                    aria-label={`${t('admin.categories.delete')} ${c.name}`}
                  >
                    {deleting === c.id ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={editing === 'new' ? t('admin.categories.addTitle') : t('admin.categories.editTitle', { name: editing.name })}>
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)} />
          <div className="card relative w-full max-w-lg max-h-[92vh] overflow-y-auto p-6 shadow-pop animate-fade-up sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing === 'new' ? t('admin.categories.addTitle') : t('admin.categories.editTitle', { name: editing.name })}</h2>
              <button type="button" onClick={() => setEditing(null)} className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-ink/5" aria-label={t('cart.close')}>
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <form
              onSubmit={e => { e.preventDefault(); save() }}
              className="mt-6 space-y-4"
            >
              <div>
                <Label htmlFor="c-name" required>{t('admin.categories.name')}</Label>
                <input id="c-name" value={form.name} onChange={setField('name')} className="input" required />
              </div>
              <div>
                <Label htmlFor="c-name-ar">{t('admin.categories.nameAr')}</Label>
                <input id="c-name-ar" value={form.name_ar} onChange={setField('name_ar')} className="input" dir="rtl" />
              </div>
              <div>
                <Label htmlFor="c-image" hint={t('admin.categories.imageHint')}>{t('admin.categories.image')}</Label>
                <input id="c-image" value={form.image_url} onChange={setField('image_url')} className="input" dir="ltr" placeholder="https://…" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="btn btn-outline">
                  {t('admin.categories.cancel')}
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary">
                  {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                  {t('admin.categories.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}