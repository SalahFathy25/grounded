import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Banknote, CreditCard, Loader2, MapPin, Phone, Send, ShoppingBag, Smartphone, User, Wallet } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LangContext'
import { orderApi } from '../lib/api'
import { formatPrice } from '../lib/format'
import EmptyState from '../components/EmptyState'
import { useSettings } from '../context/SettingsContext'


export default function Checkout() {
  const { user } = useAuth()
  const { items, clear, subtotal } = useCart()
  const { settings } = useSettings()
  const toast = useToast()
  const navigate = useNavigate()
  const { t } = useLang()

  const [fullName, setFullName] = useState(user?.full_name || '')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Cairo')
  const [payment, setPayment] = useState('COD')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          icon={ShoppingBag}
          title={t('checkout.empty')}
          subtitle={t('checkout.emptySub')}
          action={<Link to="/products" className="btn btn-primary">{t('checkout.browse')}</Link>}
        />
      </div>
    )
  }

  const shipping = Number(settings.shipping_fee) || 0
  const total = subtotal + shipping

  const validate = () => {
    if (fullName.trim().length < 3) return t('checkout.errName')
    if (!/^(\+?\d[\d\s-]{8,15})$/.test(phone.trim())) return t('checkout.errPhone')
    if (address.trim().length < 10) return t('checkout.errAddress')
    return ''
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    const err = validate()
    if (err) { setError(err); return }
    setBusy(true)
    try {
      const order = await orderApi.create({
        full_name: fullName, // informational; server derives from token
        shipping_address: `${address.trim()}, ${city}`,
        phone_number: phone.trim(),
        payment_method: payment.toUpperCase(),
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      })
      clear()
      toast.push(t('checkout.placed'))
      if (payment === 'COD') {
        navigate(`/order-success/${order.id}`, { state: { order } })
      } else {
        navigate(`/pay/${order.id}`)
      }
    } catch (err2) {
      setError(err2.message)
    } finally {
      setBusy(false)
    }
  }

  const paymentOptions = [
    { id: 'COD', label: t('checkout.payCod'), desc: t('checkout.payCodDesc'), icon: Banknote },
    { id: 'VISA', label: t('checkout.payVisa'), desc: t('checkout.payVisaDesc'), icon: CreditCard },
    { id: 'VODAFONE_CASH', label: t('checkout.payVodafone'), desc: t('checkout.payVodafoneDesc'), icon: Smartphone },
    { id: 'INSTAPAY', label: t('checkout.payInstapay'), desc: t('checkout.payInstapayDesc'), icon: Send },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{t('checkout.title')}</h1>
      <p className="mt-1 text-sm text-muted">{t('checkout.sub')}</p>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]" noValidate>
        <div className="space-y-6">
          {/* Contact */}
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <User className="size-5 text-gold" aria-hidden="true" /> {t('checkout.contact')}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="label">{t('checkout.fullName')}</label>
                <input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} className="input" placeholder="Ahmed Hassan" />
              </div>
              <div>
                <label htmlFor="phone" className="label">{t('checkout.phone')}</label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="input !ps-10" placeholder="+20 100 000 0000" inputMode="tel" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">{t('checkout.signedInAs', { email: user?.email })}</p>
          </section>

          {/* Address */}
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="size-5 text-gold" aria-hidden="true" /> {t('checkout.delivery')}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="address" className="label">{t('checkout.street')}</label>
                <textarea id="address" value={address} onChange={e => setAddress(e.target.value)} rows={3} className="input resize-none py-3" placeholder="Apartment, building, street…" />
              </div>
              <div>
                <label htmlFor="city" className="label">{t('checkout.city')}</label>
                <select id="city" value={city} onChange={e => setCity(e.target.value)} className="input cursor-pointer">
                  {['Cairo', 'Giza', 'Alexandria', 'Mansoura', 'Tanta', 'Ismailia', 'Assiut', 'Aswan', 'Luxor', 'Other governorate'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className="card p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Wallet className="size-5 text-gold" aria-hidden="true" /> {t('checkout.payment')}
            </h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t('checkout.payment')}>
              {paymentOptions.map(opt => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ${payment === opt.id ? 'border-gold bg-gold-tint/50' : 'border-line bg-paper hover:border-ink/30'}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.id}
                    checked={payment === opt.id}
                    onChange={() => setPayment(opt.id)}
                    className="sr-only"
                  />
                  <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-2 ${payment === opt.id ? 'border-gold' : 'border-line'}`} aria-hidden="true">
                    {payment === opt.id && <span className="size-2.5 rounded-full bg-gold" />}
                  </span>
                  <span>
                    <span className="flex items-center gap-2 font-semibold">
                      <opt.icon className="size-4 text-gold" aria-hidden="true" /> {opt.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
            {payment === 'VISA' && (
              <p className="mt-3 rounded-lg bg-sky-50 px-4 py-3 text-xs font-medium text-sky-700">{t('checkout.cardNote')}</p>
            )}
            {(payment === 'VODAFONE_CASH' || payment === 'INSTAPAY') && (
              <p className="mt-3 rounded-lg bg-sky-50 px-4 py-3 text-xs font-medium text-sky-700">{t('checkout.walletNote')}</p>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="h-fit lg:sticky lg:top-24">
          <div className="card p-6 shadow-card">
            <h2 className="text-lg font-bold">{t('checkout.summary')}</h2>
            <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto ps-1">
              {items.map(i => (
                <li key={i.product_id} className="flex items-center gap-3">
                  <img src={i.image_url} alt={i.name} className="size-12 rounded-lg border border-line object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold">{i.name}</p>
                    <p className="text-xs text-muted">{t('checkout.qty', { n: i.quantity, price: formatPrice(i.price) })}</p>
                  </div>
                  <p className="text-sm font-bold">{formatPrice(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <dt>{t('cart.subtotal')}</dt>
                <dd className="font-semibold text-ink">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-muted">
                <dt>{t('cart.shipping')}</dt>
                <dd className="font-semibold text-ink">{formatPrice(shipping)}</dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-bold">{t('checkout.total')}</dt>
                <dd className="text-xl font-bold">{formatPrice(total)}</dd>
              </div>
            </dl>

            {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

            <button type="submit" disabled={busy} className="btn btn-gold mt-5 w-full text-base">
              {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              {busy ? t('checkout.placing') : t('checkout.placeOrder', { amount: formatPrice(total) })}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              {t('checkout.terms')}
            </p>
          </div>
        </aside>
      </form>
    </div>
  )
}