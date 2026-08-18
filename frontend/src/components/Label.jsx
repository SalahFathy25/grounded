import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const TIP_W = 288

export default function Label({ htmlFor, hint, required = false, children }) {
  const [tip, setTip] = useState(null)
  const btnRef = useRef(null)
  const tipRef = useRef(null)

  const open = () => {
    if (!hint) return
    const r = btnRef.current.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.left + r.width / 2 - TIP_W / 2, window.innerWidth - TIP_W - 8))
    setTip({ rect: r, left, top: null })
  }

  const close = () => setTip(null)

  useEffect(() => {
    if (!tip || !tipRef.current || tip.top !== null) return
    const h = tipRef.current.offsetHeight
    const rect = tip.rect
    const above = rect.top > 220 && window.innerHeight - rect.bottom < h + 170
    const top = above
      ? rect.top - h - 8
      : Math.min(rect.bottom + 8, window.innerHeight - h - 8)
    setTip(t => ({ ...t, top }))
  }, [tip])

  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-soft">
        {children}
        {required && <span className="text-danger"> *</span>}
      </label>
      {hint && (
        <span
          className="relative inline-flex shrink-0 pe-1"
          onMouseEnter={open}
          onMouseLeave={close}
        >
          <button
            ref={btnRef}
            type="button"
            className="grid size-4.5 cursor-help place-items-center rounded-full bg-ink/5 text-[10px] font-bold text-muted transition-colors duration-200 hover:bg-gold hover:text-paper"
            aria-label={hint}
            aria-expanded={!!tip}
            onFocus={open}
            onBlur={close}
            onClick={() => (tip ? close() : open())}
          >
            ?
          </button>
        </span>
      )}
      {createPortal(
        tip && (
          <div
            ref={tipRef}
            className={`pointer-events-none fixed z-[80] max-w-[calc(100vw-16px)] rounded-xl border border-line bg-paper p-3 text-xs font-normal leading-relaxed text-ink-soft shadow-pop ${tip.top === null ? 'invisible' : 'animate-fade-in'}`}
            style={{ left: tip.left, top: tip.top ?? 0, width: TIP_W }}
            role="tooltip"
          >
            {hint}
          </div>
        ),
        document.body
      )}
    </div>
  )
}