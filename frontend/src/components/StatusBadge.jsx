import { useLang } from '../context/LangContext'

const STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-sky-100 text-sky-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ status }) {
  const { t } = useLang()
  return (
    <span className={`chip ${STYLES[status] || 'bg-line text-ink-soft'}`}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {t(`status.${status}`)}
    </span>
  )
}