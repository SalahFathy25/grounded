import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback(id => {
    setToasts(t => t.filter(toast => toast.id !== id))
  }, [])

  const push = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-[70] flex w-[min(92vw,360px)] flex-col gap-2" role="status" aria-live="polite">
        {toasts.map(t => (
          <div
            key={t.id}
            className="card animate-fade-up flex items-start gap-3 p-4 shadow-pop"
          >
            {t.type === 'success'
              ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
              : <AlertCircle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden="true" />}
            <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="cursor-pointer rounded-md p-1 text-muted hover:bg-ink/5 hover:text-ink"
              aria-label="Dismiss notification"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)