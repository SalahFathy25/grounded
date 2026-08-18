import { useEffect, useRef, useState } from 'react'

export default function ZoomImage({ src, alt, className }) {
  const wrapRef = useRef(null)
  const imgRef = useRef(null)
  const [zoom, setZoom] = useState(false)

  useEffect(() => { setZoom(false) }, [src])

  const placeOrigin = e => {
    const rect = wrapRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    imgRef.current.style.transformOrigin = `${x}% ${y}%`
  }

  const enter = e => {
    placeOrigin(e)
    setZoom(true)
  }

  const move = e => {
    if (zoom) placeOrigin(e)
  }

  return (
    <div
      ref={wrapRef}
      className={`relative overflow-hidden cursor-zoom-in ${className || ''}`}
      onMouseEnter={enter}
      onMouseMove={move}
      onMouseLeave={() => setZoom(false)}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className={`size-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${zoom ? 'scale-[2.2]' : 'scale-100'}`}
      />
    </div>
  )
}