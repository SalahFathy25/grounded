import { Banknote, CreditCard, Send, Smartphone } from 'lucide-react'
import { useLang } from '../context/LangContext'

const ICONS = {
  COD: Banknote,
  VISA: CreditCard,
  VODAFONE_CASH: Smartphone,
  INSTAPAY: Send,
}

export default function PaymentInfo({ method, showDesc = false, className = '' }) {
  const { t } = useLang()
  const Icon = ICONS[method] || Banknote
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Icon className="size-4 text-gold" aria-hidden="true" />
      {t(`pay.${String(method).toLowerCase()}`)}
    </span>
  )
}