import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from '../lang/translations'

const LangContext = createContext(null)
const LANG_KEY = 'grounded_lang'

function readLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (saved === 'ar' || saved === 'en') return saved
  } catch { /* ignore */ }
  return 'ar'
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(readLang)

  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const toggle = useCallback(() => setLang(l => (l === 'ar' ? 'en' : 'ar')), [])

  const t = useCallback((key, vars = {}) => {
    const dict = translations[lang] || translations.en
    let text = dict[key] ?? translations.en[key] ?? key
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
    return text
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, toggle, t }), [lang, t, toggle])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export const useLang = () => useContext(LangContext)