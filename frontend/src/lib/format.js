let lang = 'en'
try {
  lang = localStorage.getItem('grounded_lang') === 'en' ? 'en' : 'ar'
} catch { /* ignore */ }

export function setFormatLang(l) {
  lang = l === 'ar' ? 'ar' : 'en'
}

export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const n = Number(value)
  if (lang === 'ar') {
    return `${n.toLocaleString('ar-EG-u-nu-latn', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م`
  }
  return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EGP`
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
  if (lang === 'ar') {
    return d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function arDuration(n, unit) {
  const one = unit === 'h' ? 'ساعة' : 'دقيقة'
  const two = unit === 'h' ? 'ساعتين' : 'دقيقتين'
  const few = unit === 'h' ? 'ساعات' : 'دقائق'
  if (n === 1) return `منذ ${one}`
  if (n === 2) return `منذ ${two}`
  if (n <= 10) return `منذ ${n} ${few}`
  return `منذ ${n} ${one}`
}

export function timeAgo(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return lang === 'ar' ? 'الآن' : 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return lang === 'ar' ? arDuration(m, 'm') : `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return lang === 'ar' ? arDuration(h, 'h') : `${h}h ago`
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