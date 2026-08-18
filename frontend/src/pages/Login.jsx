import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LangContext'
import AuthShell from '../components/AuthShell'

export default function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLang()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError(t('login.required')); return }
    setBusy(true)
    try {
      const user = await login(email, password)
      toast.push(t('login.welcomeBack', { name: user.full_name.split(' ')[0] }))
      const from = location.state?.from
      navigate(from && from.startsWith('/') ? from : ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN'].includes(user.role) ? '/admin' : '/')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={t('login.welcome')}
      sub={t('login.sub')}
      footer={
        <>
          {t('login.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-gold-deep hover:underline">{t('login.createOne')}</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label">{t('login.email')}</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input !ps-10"
              autoComplete="email"
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="label">{t('login.password')}</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input !ps-10 pe-11"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              className="absolute end-2 top-1/2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-lg text-muted hover:text-ink"
              aria-label={showPass ? t('login.hidePass') : t('login.showPass')}
            >
              {showPass ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="animate-fade-in rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <button type="submit" disabled={busy} className="btn btn-primary btn-sheen w-full">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {busy ? t('login.signingIn') : t('login.signIn')}
        </button>
      </form>
    </AuthShell>
  )
}