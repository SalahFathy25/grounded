import { Star, StarHalf } from 'lucide-react'
import { useLang } from '../context/LangContext'

export default function Stars({ rating = 0, size = 'size-3.5', showValue = false }) {
  const { t } = useLang()
  if (!rating || rating <= 0) return null
  const full = Math.floor(rating)
  const half = rating - full >= 0.4
  return (
    <span className="inline-flex items-center gap-0.5 text-gold" aria-label={t('stars.rated', { rating: rating.toFixed(1) })}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="relative inline-flex">
          {i < full ? (
            <Star className={`${size} fill-current`} aria-hidden="true" />
          ) : i === full && half ? (
            <span className="relative">
              <Star className={`${size} text-line`} aria-hidden="true" />
              <StarHalf className={`${size} absolute inset-0 fill-current`} aria-hidden="true" />
            </span>
          ) : (
            <Star className={`${size} text-line`} aria-hidden="true" />
          )}
        </span>
      ))}
      {showValue && <span className="ml-1.5 text-xs font-semibold text-muted">{rating.toFixed(1)}</span>}
    </span>
  )
}