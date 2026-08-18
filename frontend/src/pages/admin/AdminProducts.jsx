import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, Package, PackageSearch, PackageX, Pencil, Plus, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react'
import { categoryApi, productApi } from '../../lib/api'
import { clamp, compressImage, formatPrice, salePrice, discountPercent } from '../../lib/format'
import { useToast } from '../../context/ToastContext'
import { useLang } from '../../context/LangContext'
import Label from '../../components/Label'
import EmptyState from '../../components/EmptyState'
import { RowSkeleton } from '../../components/Skeletons'
import { subscribeRealtime } from '../../lib/realtime'

const PAGE_SIZE = 20

const calcSale = (base, disc) => Math.round(Number(base) * (100 - Number(disc))) / 100

const EMPTY_FORM = {
  name: '', price: '', discount_percent: '', sale_price: '', stock_quantity: '0', reorder_level: '5',
  cost_price: '', category_id: '', sku: '', brand: '', material: '', color: '', sizes: '', tags: '',
  featured: false, images: [], description: '',
}

export default function AdminProducts() {
  const toast = useToast()
  const { t } = useLang()
  const [products, setProducts] = useState(null)
  const [categories, setCategories] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState(null) // null | 'new' | product
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(() => {
    setError('')
    productApi.list({ page, size: PAGE_SIZE, include_inactive: true, q: query.trim() || undefined })
      .then(setProducts)
      .catch(err => setError(err.message))
  }, [page, query])

  useEffect(() => {
    const t = setTimeout(load, query ? 300 : 0)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    setPage(0)
    setSelected(new Set())
  }, [query])

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    const unsub = subscribeRealtime(() => load())
    return unsub
  }, [load])

  const allOnPageSelected = () => products && products.content.length > 0 && products.content.every(p => selected.has(p.id))

  const toggleSelect = id => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected(prev => {
      const next = new Set(prev)
      if (allOnPageSelected()) {
        for (const p of products.content) next.delete(p.id)
      } else {
        for (const p of products.content) next.add(p.id)
      }
      return next
    })
  }

  const deleteSelected = async () => {
    const ids = [...selected]
    if (ids.length === 0) return
    if (!window.confirm(t('admin.products.deleteConfirm', { n: ids.length }))) return
    setDeleting(true)
    try {
      await productApi.deleteMany(ids)
      toast.push(t('admin.products.deletedToast', { n: ids.length }))
      setSelected(new Set())
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async p => {
    try {
      await productApi.remove(p.id)
      toast.push(p.is_active ? t('admin.products.hiddenToast', { name: p.name }) : t('admin.products.restoredToast', { name: p.name }))
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    }
  }

  const saveProduct = async form => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        discount_percent: clamp(Number(form.discount_percent) || 0, 0, 99),
        cost_price: form.cost_price !== '' && form.cost_price != null ? Number(form.cost_price) : null,
        reorder_level: form.reorder_level !== '' && form.reorder_level != null ? Number(form.reorder_level) : 5,
        featured: form.featured === true,
      }
      if (editing === 'new') {
        await productApi.create(payload)
        toast.push(t('admin.products.created'))
      } else {
        await productApi.update(editing.id, payload)
        toast.push(t('admin.products.updated'))
      }
      setEditing(null)
      load()
    } catch (err) {
      toast.push(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const toForm = p => ({
    name: p.name,
    price: String(p.price),
    discount_percent: (p.discount_percent || 0) > 0 ? String(p.discount_percent) : '',
    sale_price: (p.discount_percent || 0) > 0 ? String(calcSale(p.price, p.discount_percent)) : '',
    stock_quantity: String(p.stock_quantity),
    reorder_level: String(p.reorder_level ?? 5),
    cost_price: p.cost_price != null ? String(p.cost_price) : '',
    category_id: p.category_id || '',
    sku: p.sku || '',
    brand: p.brand || '',
    material: p.material || '',
    color: p.color || '',
    sizes: p.sizes || '',
    tags: p.tags || '',
    featured: p.featured === true,
    images: [p.image_url, ...(p.images || [])].filter(Boolean),
    description: p.description || '',
  })

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('admin.products.title')}</h1>
          <p className="mt-1 text-sm text-muted">{products ? t('admin.products.count', { n: products.totalElements }) : '…'}</p>
        </div>
        <button type="button" onClick={() => setEditing('new')} className="btn btn-gold">
          <Plus className="size-4" aria-hidden="true" /> {t('admin.products.add')}
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t('admin.products.search')} className="input !ps-10" aria-label={t('admin.products.search')} />
        </div>
        <button type="button" onClick={load} className="btn btn-outline btn-sm" aria-label={t('admin.products.refresh')}>
          <RefreshCw className="size-4" aria-hidden="true" /> {t('admin.products.refresh')}
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
          <p className="text-sm font-semibold">{t('admin.products.selected', { n: selected.size })}</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSelected(new Set())} className="btn btn-outline btn-sm">
              {t('admin.products.cancel')}
            </button>
            <button type="button" onClick={deleteSelected} disabled={deleting} className="btn btn-danger btn-sm">
              {deleting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
              {t('admin.products.deleteSelected')}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <EmptyState title={t('admin.products.loadError')} subtitle={error} action={<button type="button" onClick={load} className="btn btn-primary">{t('admin.products.refresh')}</button>} />
      ) : !products ? (
        <RowSkeleton rows={7} />
      ) : products.content.length === 0 ? (
        <EmptyState icon={PackageSearch} title={t('admin.products.empty')} subtitle={t('admin.products.emptySub')} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-xs font-bold uppercase tracking-wider text-muted">
                <th className="w-12 px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected()}
                    onChange={toggleSelectAll}
                    className="size-4 cursor-pointer accent-[#0f766e]"
                    aria-label={t('admin.products.selectAll')}
                  />
                </th>
                <th className="px-4 py-3.5">{t('admin.products.colProduct')}</th>
                <th className="px-4 py-3.5">{t('admin.products.colCategory')}</th>
                <th className="px-4 py-3.5">{t('admin.products.colPrice')}</th>
                <th className="px-4 py-3.5">{t('admin.products.colDiscount')}</th>
                <th className="px-4 py-3.5">{t('admin.products.colStock')}</th>
                <th className="px-4 py-3.5">{t('admin.products.colStatus')}</th>
                <th className="px-5 py-3.5 text-right">{t('admin.products.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.content.map(p => (
                <tr key={p.id} className={`transition-colors hover:bg-paper/60 ${p.is_active ? '' : 'opacity-55'}`}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="size-4 cursor-pointer accent-[#0f766e]"
                      aria-label={`${t('admin.products.selectRow')} ${p.name}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={p.image_url} alt="" className="size-11 rounded-lg border border-line object-cover" loading="lazy" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-semibold">{p.name}</p>
                        <p className="text-xs text-muted">ID #{p.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category_name || t('admin.products.general')}</td>
                  <td className="px-4 py-3 font-semibold">
                    {discountPercent(p) > 0 ? (
                      <span className="flex items-baseline gap-1.5">
                        <span className="text-muted line-through">{formatPrice(p.price)}</span>
                        <span>{formatPrice(salePrice(p))}</span>
                      </span>
                    ) : formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3">
                    {discountPercent(p) > 0 ? (
                      <span className="chip bg-red-100 text-red-700">{t('products.off', { n: discountPercent(p) })}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${p.stock_quantity === 0 ? 'bg-red-100 text-red-700' : p.stock_quantity < 5 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-line text-ink-soft'}`}>
                      {p.is_active ? t('admin.products.active') : t('admin.products.hidden')}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setEditing(p)} className="btn btn-outline btn-sm" aria-label={`${t('admin.products.edit')} ${p.name}`}>
                        <Pencil className="size-4" aria-hidden="true" /> {t('admin.products.edit')}
                      </button>
                      <button type="button" onClick={() => toggleActive(p)} className={`btn btn-sm ${p.is_active ? 'btn-danger' : 'btn-ghost'}`}>
                        {p.is_active ? <PackageX className="size-4" aria-hidden="true" /> : <Package className="size-4" aria-hidden="true" />}
                        {p.is_active ? t('admin.products.hide') : t('admin.products.restore')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {products && products.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label={t('admin.products.pagination')}>
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-paper disabled:opacity-35 hover:border-ink"
            aria-label={t('admin.products.prevPage')}
          >
            <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
          {Array.from({ length: products.totalPages }, (_, i) => i)
            .slice(Math.max(0, Math.min(page - 2, products.totalPages - 5)), Math.max(0, Math.min(page - 2, products.totalPages - 5)) + Math.min(products.totalPages, 5))
            .map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`size-10 cursor-pointer rounded-lg text-sm font-semibold transition-colors ${n === page ? 'bg-ink text-paper' : 'border border-line bg-paper hover:border-ink'}`}
                aria-current={n === page ? 'page' : undefined}
              >
                {n + 1}
              </button>
            ))}
          <button
            type="button"
            disabled={page >= products.totalPages - 1}
            onClick={() => setPage(p => Math.min(products.totalPages - 1, p + 1))}
            className="grid size-10 cursor-pointer place-items-center rounded-lg border border-line bg-paper disabled:opacity-35 hover:border-ink"
            aria-label={t('admin.products.nextPage')}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" aria-hidden="true" />
          </button>
        </nav>
      )}

      {editing && (
        <ProductDialog
          title={editing === 'new' ? t('admin.products.addTitle') : t('admin.products.editTitle', { name: editing.name })}
          categories={categories}
          initial={editing === 'new' ? EMPTY_FORM : toForm(editing)}
          saving={saving}
          onClose={() => setEditing(null)}
          onSave={saveProduct}
        />
      )}
    </div>
  )
}

function ProductDialog({ title, categories, initial, saving, onClose, onSave }) {
  const { t } = useLang()
  const toast = useToast()
  const [form, setForm] = useState(initial)
  const [urlInput, setUrlInput] = useState('')
  const [preparing, setPreparing] = useState(false)
  const fileRef = useRef(null)
  const set = key => e => setForm(f => ({
    ...f,
    [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
  }))
  const setImgs = updater => setForm(f => ({ ...f, images: updater(f.images) }))

  const changePrice = e => {
    const price = e.target.value
    setForm(f => {
      const base = Number(price) || 0
      const disc = Number(f.discount_percent) || 0
      return { ...f, price, sale_price: disc > 0 && base > 0 ? String(calcSale(base, disc)) : f.sale_price }
    })
  }

  const changeDiscount = e => {
    const disc = clamp(Number(e.target.value) || 0, 0, 99)
    setForm(f => {
      const base = Number(f.price) || 0
      return { ...f, discount_percent: String(disc), sale_price: disc > 0 && base > 0 ? String(calcSale(base, disc)) : '' }
    })
  }

  const changeSale = e => {
    const sale = Number(e.target.value) || 0
    setForm(f => {
      const base = Number(f.price) || 0
      const disc = base > 0 && sale > 0 ? Math.round((1 - sale / base) * 100) : 0
      return { ...f, sale_price: String(sale), discount_percent: disc > 0 ? String(clamp(disc, 0, 99)) : '' }
    })
  }

  const addUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    setImgs(list => [...list, url])
    setUrlInput('')
  }

  const handleFile = async e => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.push(t('admin.products.invalidFile'), 'error')
      return
    }
    setPreparing(true)
    try {
      const dataUrl = await compressImage(file)
      setImgs(list => [...list, dataUrl])
    } catch {
      toast.push(t('admin.products.invalidFile'), 'error')
    } finally {
      setPreparing(false)
    }
  }

  const submit = e => {
    e.preventDefault()
    if (form.name.trim().length < 2) return
    if (!form.price || Number(form.price) <= 0) return
    const images = form.images.map(s => s.trim()).filter(Boolean)
    const fallback = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80&auto=format&fit=crop'
    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      images,
      image_url: images[0] || fallback,
      sku: form.sku.trim(),
      brand: form.brand.trim(),
      material: form.material.trim(),
      color: form.color.trim(),
      sizes: form.sizes.trim(),
      tags: form.tags.trim(),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink/45 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="card relative w-full max-w-xl max-h-[92vh] overflow-y-auto p-6 shadow-pop animate-fade-up sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-10 cursor-pointer place-items-center rounded-lg hover:bg-ink/5" aria-label={t('cart.close')}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="p-name" hint={t('admin.products.hint.name')} required>{t('admin.products.name')}</Label>
            <input id="p-name" value={form.name} onChange={set('name')} className="input" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="p-price" hint={t('admin.products.hint.price')} required>{t('admin.products.price')}</Label>
              <input id="p-price" type="number" min="0" step="0.01" value={form.price} onChange={changePrice} className="input" required />
            </div>
            <div>
              <Label htmlFor="p-discount" hint={t('admin.products.hint.discount')}>{t('admin.products.discount')}</Label>
              <input id="p-discount" type="number" min="0" max="99" step="1" value={form.discount_percent} onChange={changeDiscount} className="input" />
            </div>
            <div>
              <Label htmlFor="p-sale" hint={t('admin.products.hint.sale')}>{t('admin.products.afterDiscount')}</Label>
              <input id="p-sale" type="number" min="0" step="0.01" value={form.sale_price} onChange={changeSale} className="input" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="p-stock" hint={t('admin.products.hint.stock')}>{t('admin.products.stock')}</Label>
              <input id="p-stock" type="number" min="0" value={form.stock_quantity} onChange={set('stock_quantity')} className="input" />
            </div>
            <div>
              <Label htmlFor="p-cost" hint={t('admin.products.hint.cost')}>{t('admin.products.costPrice')}</Label>
              <input id="p-cost" type="number" min="0" step="0.01" value={form.cost_price} onChange={set('cost_price')} className="input" />
            </div>
            <div>
              <Label htmlFor="p-reorder" hint={t('admin.products.hint.reorder')}>{t('admin.products.reorderLevel')}</Label>
              <input id="p-reorder" type="number" min="0" value={form.reorder_level} onChange={set('reorder_level')} className="input" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-sku" hint={t('admin.products.hint.sku')}>{t('admin.products.sku')}</Label>
              <input id="p-sku" value={form.sku} onChange={set('sku')} className="input" dir="ltr" />
            </div>
            <div>
              <Label htmlFor="p-brand" hint={t('admin.products.hint.brand')}>{t('admin.products.brand')}</Label>
              <input id="p-brand" value={form.brand} onChange={set('brand')} className="input" />
            </div>
            <div>
              <Label htmlFor="p-material" hint={t('admin.products.hint.material')}>{t('admin.products.material')}</Label>
              <input id="p-material" value={form.material} onChange={set('material')} className="input" />
            </div>
            <div>
              <Label htmlFor="p-category" hint={t('admin.products.hint.category')}>{t('admin.products.category')}</Label>
              <select id="p-category" value={form.category_id} onChange={set('category_id')} className="input cursor-pointer">
                <option value="">{t('admin.products.general')}</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="p-color" hint={t('admin.products.hint.color')}>{t('admin.products.color')}</Label>
              <input id="p-color" value={form.color} onChange={set('color')} className="input" />
            </div>
            <div>
              <Label htmlFor="p-sizes" hint={t('admin.products.hint.sizes')}>{t('admin.products.sizes')}</Label>
              <input id="p-sizes" value={form.sizes} onChange={set('sizes')} className="input" />
            </div>
            <div>
              <Label htmlFor="p-tags" hint={t('admin.products.hint.tags')}>{t('admin.products.tags')}</Label>
              <input id="p-tags" value={form.tags} onChange={set('tags')} className="input" />
            </div>
            <div className="flex items-end">
              <Label hint={t('admin.products.hint.featured')}>{t('admin.products.featured')}</Label>
              <input type="checkbox" checked={form.featured} onChange={set('featured')} className="size-4 accent-[#0f766e]" />
            </div>
          </div>
          <div>
            <Label htmlFor="p-image" hint={t('admin.products.hint.image')}>{t('admin.products.images')}</Label>
            <div className="flex flex-wrap gap-2">
              {form.images.map((src, i) => (
                <div
                  key={`${i}-${src.slice(-12)}`}
                  className="group relative size-20 shrink-0 overflow-hidden rounded-xl border border-line bg-line/40"
                >
                  <img src={src} alt="" className="size-full object-cover" loading="lazy" />
                  {i === 0 && (
                    <span className="chip absolute start-1 top-1 bg-gold !px-1.5 !py-0 text-[10px] text-paper">
                      {t('admin.products.mainImage')}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setImgs(list => list.filter((_, j) => j !== i))}
                    className="absolute end-1 top-1 grid size-5 cursor-pointer place-items-center rounded-full bg-ink/75 text-paper opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={t('admin.products.removeImage')}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </div>
              ))}
              {preparing && (
                <span className="grid size-20 shrink-0 place-items-center rounded-xl border border-dashed border-line text-muted">
                  <Loader2 className="size-5 animate-spin" aria-hidden="true" />
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                id="p-image"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addUrl() } }}
                className="input min-w-0 flex-1"
                placeholder="https://…"
                dir="ltr"
              />
              <button type="button" onClick={addUrl} className="btn btn-outline btn-sm shrink-0">
                <Plus className="size-4" aria-hidden="true" /> {t('admin.products.addImage')}
              </button>
              <label htmlFor="p-file" className={`btn btn-gold btn-sm shrink-0 cursor-pointer ${preparing ? 'opacity-60' : ''}`}>
                {preparing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" /> {t('admin.products.compressing')}
                  </>
                ) : (
                  <>
                    <Upload className="size-4" aria-hidden="true" /> {t('admin.products.upload')}
                  </>
                )}
                <input
                  id="p-file"
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={preparing}
                  onChange={handleFile}
                />
              </label>
            </div>
          </div>
          <div>
            <Label htmlFor="p-desc" hint={t('admin.products.hint.desc')}>{t('admin.products.desc')}</Label>
            <textarea id="p-desc" value={form.description} onChange={set('description')} rows={3} className="input resize-none py-3" />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-outline">{t('admin.products.cancel')}</button>
            <button type="submit" disabled={saving} className="btn btn-gold">
              {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {saving ? t('admin.products.saving') : t('admin.products.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}