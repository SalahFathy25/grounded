export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`
}

export function catName(c, lang) {
  const ar = c?.name_ar ?? c?.category_name_ar
  const en = c?.name ?? c?.category_name
  if (lang === 'ar') return ar || en || ''
  return en || ar || ''
}

export function salePrice(product) {
  const base = Number(product?.price) || 0
  const disc = Number(product?.discount_percent) || 0
  if (!base || !disc || disc <= 0 || disc >= 100) return base
  return Math.round(base * (100 - disc)) / 100
}

export function discountPercent(product) {
  const disc = Number(product?.discount_percent) || 0
  return disc > 0 && disc < 100 ? disc : 0
}

export function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return formatDate(iso)
}

export function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '?'
}

export function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max)
}

export function compressImage(file, maxDim = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read-error'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('decode-error'))
      image.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(image.width, image.height))
        const width = Math.max(1, Math.round(image.width * scale))
        const height = Math.max(1, Math.round(image.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(image, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}