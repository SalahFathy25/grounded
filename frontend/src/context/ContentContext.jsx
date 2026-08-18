import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { contentApi } from '../lib/api'
import { DEFAULT_CONTENT } from '../lib/defaultContent'

const ContentContext = createContext(null)

export const pick = (obj, lang) => obj?.[lang] || obj?.en || ''

export function ContentProvider({ children }) {
  const [content, setContent] = useState(DEFAULT_CONTENT)

  useEffect(() => {
    let alive = true
    contentApi.get()
      .then(c => { if (alive) setContent(c) })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  const update = useCallback(async patch => {
    const next = await contentApi.update(patch)
    setContent(next)
    return next
  }, [])

  const refresh = useCallback(() => {
    contentApi.get()
      .then(setContent)
      .catch(() => {})
  }, [])

  const value = useMemo(() => ({ content, update, refresh }), [content, update, refresh])

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

export function useContent() {
  const ctx = useContext(ContentContext)
  if (!ctx) throw new Error('useContent must be used inside ContentProvider')
  return ctx
}