import { useEffect, useState } from 'react'
import { onHero } from '../lib/heroImage'

export default function HeroImageTransition() {
  const [item, setItem] = useState(null)
  const [phase, setPhase] = useState('in')

  useEffect(() => {
    return onHero(data => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      setItem(data)
      setPhase('in')
    })
  }, [])

  useEffect(() => {
    if (!item) return
    const t1 = setTimeout(() => setPhase('out'), 40)
    const t2 = setTimeout(() => setItem(null), 400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [item])

  if (!item) return null

  const rect = item.rect
  return (
    <div
      className="pointer-events-none fixed z-[100] overflow-hidden rounded-2xl"
      aria-hidden="true"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        opacity: phase === 'in' ? 1 : 0,
        transform: phase === 'in' ? 'scale(1)' : 'scale(1.04)',
        transition: 'opacity 320ms ease, transform 320ms ease',
        willChange: 'opacity, transform',
      }}
    >
      <img src={item.src} alt="" draggable={false} className="size-full select-none object-cover" />
    </div>
  )
}