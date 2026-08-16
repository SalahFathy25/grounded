import { Link } from 'react-router-dom'
import { ArrowRight, Compass } from 'lucide-react'
import { useLang } from '../context/LangContext'
import EmptyState from '../components/EmptyState'

export default function NotFound() {
  const { t } = useLang()
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <p className="text-center text-7xl font-bold tracking-tight text-line">404</p>
      <div className="mt-6">
        <EmptyState
          icon={Compass}
          title={t('notfound.title')}
          subtitle={t('notfound.sub')}
          action={<Link to="/" className="btn btn-primary">{t('notfound.back')} <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link>}
        />
      </div>
    </div>
  )
}