import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { settingsApi } from '../lib/api'

const SettingsContext = createContext(null)

const DEFAULTS = {
  store_name_en: 'Grounded',
  store_name_ar: 'غراوندد',
  tagline_en: '',
  tagline_ar: '',
  announcement_en: '',
  announcement_ar: '',
  announcement_enabled: false,
  shipping_fee: 80,
  support_phone: '+20 100 000 0000',
  support_email: 'support@grounded.store',
  instagram_url: '',
  facebook_url: '',
  tiktok_url: '',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    settingsApi.get()
      .then(s => { if (!cancelled) setSettings({ ...DEFAULTS, ...s }) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const refresh = useCallback(() => {
    settingsApi.get()
      .then(s => setSettings({ ...DEFAULTS, ...s }))
      .catch(() => {})
  }, [])

  const value = useMemo(() => ({ settings, setSettings, loading, refresh }), [settings, loading, refresh])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)