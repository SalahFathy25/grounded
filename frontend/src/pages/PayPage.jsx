import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  CheckCircle2, Copy, CreditCard, ImageUp, Loader2, Lock, Phone, Send, ShieldCheck, Wallet,
} from 'lucide-react'
import { orderApi } from '../lib/api'
import { useLang } from '../context/LangContext'
import { useSettings } from '../context/SettingsContext'
import { useToast } from '../context/ToastContext'
import { compressImage, formatDate, formatPrice } from '../lib/format'
import PaymentInfo from '../components/PaymentInfo'
import EmptyState from '../components/EmptyState'
import { RowSkeleton } from '../components/Skeletons'

const luhnOk = str => {
  if (!/^\d{13,19}$/.test(str)) return false
  let sum = 0
  for (let i = 0; i < str.length; i++) {
    let d = +str[i]
    if ((str.length - i) % 2 === 0) { d *= 2; if (d > 9) d -= 9 }
    sum += d
  }
  return sum % 10 === 0
}

function CardForm({ order, amount, t, onDone }) {
  const toast = useToast()
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const formatNumber = v => v.replace(/\D/g, '').slice(0, 19).replace(/(\d{4})(?=\d)/g, '$1 ')
  const formatExpiry = v => {
    const d = v.replace(/\D/g, '').slice(0, 4)
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  const submit = async e => {
    e.preventDefault()
    const errs = {}
    const digits = number.replace(/\s/g, '')
    if (!luhnOk(digits)) errs.number = t('pay.card.errNumber')
    if (name.trim().length < 3) errs.name = t('pay.card.errName')
    const m = /^(\d{2})\/(\d{2})$/.exec(expiry)
    const now = new Date()
    if (!m || +m[1] < 1 || +m[1] > 12 || +m[2] + 2000 < now.getFullYear() || (+m[2] + 2000 === now.getFullYear() && +m[1] < now.getMonth() + 1)) {
      errs.expiry = t('pay.card.errExpiry')
    }
    if (!/^\d{3,4}$/.test(cvv)) errs.cvv = t('pay.card.errCvv')
    setErrors(errs)
    if (Object.keys(errs).length) return

    setBusy(true)
    try {
      await new Promise(r => setTimeout(r, 2200))
      await orderApi.pay(order.id)
      onDone()
    } catch (err) {
      setBusy(false)
      toast.push(err.message || t('pay.card.failed'), 'error')
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="card-number" className="label">{t('pay.card.number')}</label>
        <div className="relative">
          <CreditCard className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            id="card-number" inputMode="numeric" autoComplete="cc-number" dir="ltr"
            value={number} onChange={e => setNumber(formatNumber(e.target.value))}
            className={`input !ps-10 font-mono ${errors.number ? '!border-red-400' : ''}`}
            placeholder="4242 4242 4242 4242"
          />
        </div>
        {errors.number && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.number}</p>}
      </div>

      <div>
        <label htmlFor="card-name" className="label">{t('pay.card.name')}</label>
        <input
          id="card-name" autoComplete="cc-name" value={name} onChange={e => setName(e.target.value)}
          className={`input ${errors.name ? '!border-red-400' : ''}`}
          placeholder="AHMED HASSAN"
        />
        {errors.name && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="card-expiry" className="label">{t('pay.card.expiry')}</label>
          <input
            id="card-expiry" inputMode="numeric" autoComplete="cc-exp" dir="ltr"
            value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))}
            className={`input font-mono ${errors.expiry ? '!border-red-400' : ''}`}
            placeholder="08/29"
          />
          {errors.expiry && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.expiry}</p>}
        </div>
        <div>
          <label htmlFor="card-cvv" className="label">{t('pay.card.cvv')}</label>
          <input
            id="card-cvv" inputMode="numeric" autoComplete="cc-csc" dir="ltr" type="password"
            value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className={`input font-mono ${errors.cvv ? '!border-red-400' : ''}`}
            placeholder="123"
          />
          {errors.cvv && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.cvv}</p>}
        </div>
      </div>

      <button type="submit" disabled={busy} className="btn btn-gold w-full text-base">
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
        {busy ? t('pay.card.processing') : t('pay.card.pay', { amount: formatPrice(amount) })}
      </button>
      <p className="text-center text-xs text-muted">{t('pay.card.demo')}</p>
    </form>
  )
}

function WalletForm({ order, amount, settings, method, t, onDone }) {
  const toast = useToast()
  const fileRef = useRef(null)
  const [proof, setProof] = useState(order.payment_proof || null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)

  const number = method === 'VODAFONE_CASH' ? settings.vodafone_number : settings.instapay_number

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* ignore */ }
  }

  const onFile = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const dataUrl = await compressImage(file, 1280, 0.8)
      const updated = await orderApi.proof(order.id, dataUrl)
      setProof(updated.payment_proof)
      toast.push(t('pay.wallet.uploaded'), 'success')
    } catch {
      toast.push(t('pay.wallet.proofError'), 'error')
    } finally {
      setBusy(false)
      e.target.value = ''
    }
  }

  const confirm = async () => {
    if (!proof) { toast.push(t('pay.wallet.needProof'), 'error'); return }
    setBusy(true)
    try {
      await orderApi.proof(order.id, proof)
      onDone()
    } catch (err) {
      toast.push(err.message || t('pay.wallet.proofError'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-paper p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{t('pay.wallet.numberLabel')} — {method === 'VODAFONE_CASH' ? t('pay.vodafone_cash') : t('pay.instapay')}</p>
          <p className="mt-1 text-lg font-bold tracking-wide" dir="ltr">{number || '—'}</p>
        </div>
        <button type="button" onClick={copy} className="btn btn-primary btn-sm shrink-0">
          <Copy className="size-3.5" aria-hidden="true" />
          {copied ? t('pay.wallet.copied') : t('pay.wallet.copy')}
        </button>
      </div>

      <ol className="space-y-2 text-sm text-ink-soft">
        <li className="flex gap-2.5"><span className="font-bold text-gold">1</span><span>{t('pay.wallet.step1', { amount: formatPrice(amount) })}</span></li>
        <li className="flex gap-2.5"><span className="font-bold text-gold">2</span><span>{t('pay.wallet.step2')}</span></li>
        <li className="flex gap-2.5"><span className="font-bold text-gold">3</span><span>{t('pay.wallet.step3')}</span></li>
      </ol>

      <div>
        <div className="flex items-center gap-2">
          <label htmlFor="proof-file" className="label mb-0">{t('pay.wallet.upload')}</label>
          <span className="text-xs text-muted">({t('pay.wallet.uploadHint')})</span>
        </div>
        {proof ? (
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-line bg-paper p-3">
            <img src={proof} alt={t('pay.wallet.upload')} className="size-20 rounded-lg border border-line object-cover" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="size-4" aria-hidden="true" /> {t('pay.wallet.uploaded')}
              </p>
              <button type="button" onClick={() => fileRef.current?.click()} className="mt-1 text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-ink">
                {t('pay.wallet.replace')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="mt-3 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-line bg-paper px-4 py-8 text-sm font-medium text-muted transition-colors hover:border-gold hover:text-ink"
          >
            {busy ? <Loader2 className="size-6 animate-spin" aria-hidden="true" /> : <ImageUp className="size-6 text-gold" aria-hidden="true" />}
            <span className="pointer-events-none">{t('pay.wallet.choose')}</span>
          </button>
        )}
        <input ref={fileRef} id="proof-file" type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>

      <button type="button" onClick={confirm} disabled={busy} className="btn btn-gold w-full text-base">
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {t('pay.wallet.confirm')}
      </button>
    </div>
  )
}

export default function PayPage() {
  const { orderId } = useParams()
  const { t } = useLang()
  const { settings } = useSettings()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    orderApi.get(orderId)
      .then(setOrder)
      .catch(err => setError(err.message))
  }, [orderId])

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState icon={Wallet} title={t('pay.notFound')} subtitle={error} action={<Link to="/my-orders" className="btn btn-primary">{t('pay.backToOrders')}</Link>} />
      </div>
    )
  }
  if (!order) return <div className="mx-auto max-w-3xl px-4 py-16"><RowSkeleton rows={4} /></div>

  if (order.status === 'PAID' || order.status === 'DELIVERED') return <Navigate to={`/orders/${order.id}`} replace />
  if (order.payment_method === 'COD') return <Navigate to={`/order-success/${order.id}`} replace />

  const isWallet = order.payment_method === 'VODAFONE_CASH' || order.payment_method === 'INSTAPAY'
  const payAmount = Math.round((order.total_amount + (Number(order.shipping_fee) || 0)) * 100) / 100

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t('pay.gatewayTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('pay.gatewaySub')}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <PaymentInfo method={order.payment_method} showDesc />
          <span className="chip">#{order.id}</span>
        </div>
      </div>

      {done && (
        <div className="card mt-8 animate-fade-in p-10 text-center">
          <CheckCircle2 className="mx-auto size-14 text-emerald-500" aria-hidden="true" />
          <h2 className="mt-4 text-2xl font-bold">{isWallet ? t('pay.wallet.thanks') : t('pay.card.success')}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">{isWallet ? t('pay.wallet.pending') : t('pay.card.successSub')}</p>
          <Link to={`/orders/${order.id}`} className="btn btn-primary mt-6">
            <Send className="size-4 rtl:rotate-180" aria-hidden="true" /> {t('pay.card.track')}
          </Link>
        </div>
      )}

      {!done && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="size-5 text-gold" aria-hidden="true" />
              {isWallet ? t('pay.wallet.title') : t('pay.card.paymentTitle')}
            </h2>
            {isWallet ? (
              <p className="mt-4 text-sm text-muted">{t('pay.wallet.how', { amount: formatPrice(payAmount) })}</p>
            ) : (
              <p className="mt-4 text-sm text-muted">{t('pay.card.secure')}</p>
            )}
            <div className="mt-5">
              {isWallet ? (
                <WalletForm order={order} amount={payAmount} settings={settings} method={order.payment_method} t={t} onDone={() => setDone(true)} />
              ) : (
                <CardForm order={order} amount={payAmount} t={t} onDone={() => setDone(true)} />
              )}
            </div>
          </section>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="card p-6 shadow-card">
              <h3 className="font-bold">{t('checkout.summary')}</h3>
              <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto ps-1">
                {order.items.map(it => (
                  <li key={it.id} className="flex items-center gap-3 text-sm">
                    <img src={it.product_image} alt={it.product_name} className="size-10 shrink-0 rounded-md border border-line object-cover" loading="lazy" />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 font-medium">{it.product_name}</span>
                      <span className="text-xs text-muted">{t('pay.qty', { n: it.quantity, price: formatPrice(it.unit_price) })}</span>
                    </span>
                    <span className="shrink-0 font-semibold">{formatPrice(it.unit_price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between text-muted">
                  <dt>{t('cart.subtotal')}</dt>
                  <dd className="font-semibold text-ink">{formatPrice(order.total_amount)}</dd>
                </div>
                <div className="flex justify-between text-muted">
                  <dt>{t('cart.shipping')}</dt>
                  <dd className="font-semibold text-ink">{formatPrice(Number(order.shipping_fee) || 0)}</dd>
                </div>
                <div className="flex justify-between border-t border-line pt-3">
                  <dt className="font-bold">{t('checkout.total')}</dt>
                  <dd className="text-lg font-bold">{formatPrice(order.total_amount + (Number(order.shipping_fee) || 0))}</dd>
                </div>
              </dl>
              <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-muted">
                <Phone className="size-3.5 text-gold" aria-hidden="true" /> {t('pay.help', { phone: settings.support_phone })}
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}