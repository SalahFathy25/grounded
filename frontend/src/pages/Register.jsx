import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useLang } from '../context/LangContext'
import AuthShell from '../components/AuthShell'

export default function Register() {
  const { register, login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { t } = useLang()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const validate = () => {
    const e = {}
    if (fullName.trim().length < 3) e.fullName = t('register.errName')
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = t('register.errEmail')
    if (password.length < 6) e.password = t('register.errPassword')
    if (confirm !== password) e.confirm = t('register.errConfirm')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async ev => {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true)
    try {
      await register({ full_name: fullName.trim(), email, password })
      await login(email, password)
      toast.push(t('register.welcome'))
      navigate('/')
    } catch (err) {
      setErrors({ form: err.message })
    } finally {
      setBusy(false)
    }
  }

  const field = (name, label, type, value, setter, Icon, opts = {}) => (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          id={name}
          type={type}
          value={value}
          onChange={e => setter(e.target.value)}
          className={`input !ps-10 ${opts.extraClass || ''}`}
          aria-invalid={!!errors[name]}
          {...opts}
        />
      </div>
      {errors[name] && <p role="alert" className="mt-1.5 animate-fade-in text-xs font-medium text-danger">{errors[name]}</p>}
    </div>
  )

  return (
    <AuthShell
      title={t('register.title')}
      sub={t('register.sub')}
      footer={
        <>
          {t('register.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-gold-deep hover:underline">{t('register.signIn')}</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {field('fullName', t('register.fullName'), 'text', fullName, setFullName, User, { placeholder: 'Ahmed Hassan', autoComplete: 'name' })}
        {field('email', t('register.email'), 'email', email, setEmail, Mail, { placeholder: 'you@example.com', autoComplete: 'email' })}
        <div>
          <label htmlFor="password" className="label">{t('register.password')}</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id="password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input !ps-10 pe-11"
              aria-invalid={!!errors.password}
              autoComplete="new-password"
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
          {errors.password && <p role="alert" className="mt-1.5 animate-fade-in text-xs font-medium text-danger">{errors.password}</p>}
        </div>
        {field('confirm', t('register.confirm'), showPass ? 'text' : 'password', confirm, setConfirm, Lock, { placeholder: '••••••••', autoComplete: 'new-password', extraClass: 'pe-11' })}

        {errors.form && (
          <p role="alert" className="animate-fade-in rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{errors.form}</p>
        )}

        <button type="submit" disabled={busy} className="btn btn-gold btn-sheen w-full">
          {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          {busy ? t('register.creating') : t('register.create')}
        </button>
      </form>
    </AuthShell>
  )
}