/* Mock backend — mirrors the real Spring Boot REST API (see backend/).
   Data persists in localStorage. Swap to the real API with VITE_USE_MOCK=false. */

const DB_KEY = 'grounded_db_v4'
const TOKEN_KEY = 'sv_token'
const CONTENT_KEY = 'grounded_content_v1'

const STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const img = id => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`
const catImg = id => `https://images.unsplash.com/photo-${id}?w=800&h=600&q=80&auto=format&fit=crop`
const now = d => d.toISOString()
const daysAgo = n => now(new Date(Date.now() - n * 86400000))

function seedDB() {
  const categories = [
    { id: 1, name: 'T-Shirts', name_ar: 'تيشيرتات', image_url: catImg('1556909114-f6e7ad7d3136') },
    { id: 2, name: 'Shirts', name_ar: 'قمصان', image_url: catImg('1441986300917-64674bd600d8') },
    { id: 3, name: 'Pants', name_ar: 'بناطيل', image_url: catImg('1542272604-787c3835535d') },
  ]
  const products = []
  const users = [
    { id: 1, full_name: 'Store Owner', email: 'admin@grounded.store', password: 'admin123', role: 'ROLE_ADMIN', created_at: daysAgo(120) },
    { id: 2, full_name: 'Ahmed Hassan', email: 'customer@grounded.store', password: 'demo1234', role: 'ROLE_CUSTOMER', created_at: daysAgo(80) },
  ]
  const orderItems = (o, items) => items.map((it, i) => ({
    id: o * 10 + i + 1, order_id: o, product_id: it.product_id, product_name: it.name, quantity: it.qty, unit_price: it.price,
  }))
  const orders = [
    { id: 1, user_id: 2, total_amount: 748, status: 'PENDING', shipping_address: '12 El Nasr St, Maadi, Cairo', phone_number: '+20 100 123 4567', payment_method: 'VODAFONE_CASH', created_at: daysAgo(1), items: orderItems(1, [{ product_id: 2, name: 'Heavyweight Basic Tee', qty: 1, price: 299 }, { product_id: 10, name: 'Jogger Sweatpants', qty: 1, price: 449 }]) },
    { id: 2, user_id: 2, total_amount: 1198, status: 'SHIPPED', shipping_address: '12 El Nasr St, Maadi, Cairo', phone_number: '+20 100 123 4567', payment_method: 'VISA', created_at: daysAgo(6), items: orderItems(2, [{ product_id: 5, name: 'Flannel Overshirt', qty: 1, price: 649 }, { product_id: 8, name: 'Baggy Cargo Pants', qty: 1, price: 549 }]) },
    { id: 3, user_id: 2, total_amount: 803.25, status: 'DELIVERED', shipping_address: '12 El Nasr St, Maadi, Cairo', phone_number: '+20 100 123 4567', payment_method: 'INSTAPAY', created_at: daysAgo(18), items: orderItems(3, [{ product_id: 9, name: 'Wide-Leg Denim', qty: 1, price: 524.25 }, { product_id: 4, name: 'Pocket Tee', qty: 1, price: 279 }]) },
    { id: 4, user_id: 2, total_amount: 1098, status: 'CANCELLED', shipping_address: '12 El Nasr St, Maadi, Cairo', phone_number: '+20 100 123 4567', payment_method: 'COD', created_at: daysAgo(25), items: orderItems(4, [{ product_id: 7, name: 'Oxford Slim Shirt', qty: 2, price: 549 }]) },
  ]
  const settings = {
    store_name_en: 'Grounded', store_name_ar: 'غراوندد',
    tagline_en: 'Premium streetwear at honest prices. T-shirts, shirts, pants and more — delivered across Egypt.',
    tagline_ar: 'ملابس ستريتوير فخمة بأسعار منصفة. تيشيرتات، قمصان وبناطيل — توصيل لجميع مصر.',
    announcement_en: '', announcement_ar: '', announcement_enabled: false,
    shipping_fee: 80,
    vodafone_number: '+20 100 000 0000',
    instapay_number: '01000000000',
    support_phone: '+20 100 000 0000',
    support_email: 'support@grounded.store',
    instagram_url: '', facebook_url: '', tiktok_url: '',
    updated_at: now(new Date()),
  }
  return { users, categories, products, orders, settings, seq: { user: 3, category: 4, product: 1, order: 5, item: 41 } }
}

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* corrupted — reseed */ }
  const db = seedDB()
  localStorage.setItem(DB_KEY, JSON.stringify(db))
  return db
}

let db = loadDB()
const save = () => localStorage.setItem(DB_KEY, JSON.stringify(db))

/* ===== Editable site content (hero, sections, FAQ, testimonials, footer…) ===== */
export const DEFAULT_CONTENT = {
  hero: {
    badge: { en: 'New season · 2026 drops', ar: 'موسم جديد · تشكيلات 2026' },
    title1: { en: 'Streetwear that', ar: 'ملابس شبابية' },
    title2: { en: 'fits your vibe.', ar: 'على ذوقك' },
    sub: { en: 'Premium tees, shirts and pants — quality you can feel, at prices that make sense.', ar: 'تيشيرتات وقمصان وبناطيل بجودة تلمسها — بأسعار منطقية.' },
    cta: { en: 'Shop now', ar: 'تسوق الآن' },
    browse: { en: 'Browse categories', ar: 'تصفح الفئات' },
    image: 'https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=1800&h=1200&q=80&auto=format&fit=crop',
    rating: '4.8/5',
    reviews: { en: 'from 4,200+ verified reviews', ar: 'من أكتر من ٤٢٠٠ تقييم موثّق' },
    chips: [
      { icon: 'truck', label: { en: 'Free shipping', ar: 'شحن مجاني' } },
      { icon: 'phone', label: { en: 'Contact us', ar: 'اتصل بينا' } },
      { icon: 'shield', label: { en: 'Secure checkout', ar: 'دفع آمن' } },
      { icon: 'headset', label: { en: '24/7 support', ar: 'دعم 24/7' } },
    ],
  },
  sections: {
    categories: true, featured: true, spotlight: true, about: true,
    testimonials: true, faq: true, sizeGuide: true, stats: true,
  },
  headings: {
    categories: { tag: { en: 'Collections', ar: 'التشكيلات' }, title: { en: 'Shop by category', ar: 'تسوق حسب الفئة' } },
    featured: { tag: { en: 'Picked for you', ar: 'اختير لك' }, title: { en: 'Featured products', ar: 'منتجات مميزة' } },
    spotlight: { tag: { en: 'Curated', ar: 'منسّق لك' }, title: { en: 'Pick your category', ar: 'اختار فئتك' } },
    about: { tag: { en: 'Brand story', ar: 'قصة البراند' }, title: { en: 'Quality you can feel,', ar: 'جودة تحس بيها' }, title2: { en: 'prices you will love.', ar: 'وأسعار هتحبها' } },
    testimonials: { tag: { en: 'Testimonials', ar: 'آراء العملاء' }, title: { en: 'What the crew says', ar: 'قالوا عنّا' } },
    faq: { tag: { en: 'FAQ', ar: 'أسئلة شائعة' }, title: { en: 'Questions? Answered.', ar: 'عندك سؤال؟ عندنا الجواب' } },
    sizeGuide: { tag: { en: 'Size guide', ar: 'دليل المقاسات' }, title: { en: 'Find your fit', ar: 'اعرف مقاسك' }, sub: { en: 'Measurements in centimeters. Take a shirt you love, measure it, and compare.', ar: 'القياسات بالسنتيمتر. خد قميص بتحبه، قيسه، وقارن.' } },
    stats: { tag: { en: 'By the numbers', ar: 'بالأرقام' }, title: { en: 'Trust, delivered', ar: 'ثقة مع كل طلب' } },
  },
  about: {
    text: { en: 'Grounded started with a simple idea: premium streetwear — tees, shirts and pants — without the premium markup. Hand-picked fabrics, honest prices, delivered across Egypt within 24 hours.', ar: 'غراوندد بدأت بفكرة بسيطة: ستريت وير مميز — تيشيرتات وقمصان وبناطيل — من غير هوامش ربح مبالغ فيها. أقمشة مختارة بعناية، وأسعار صريحة، وتوصيل لكل مصر خلال ٢٤ ساعة.' },
    cta: { en: 'Explore the collection', ar: 'اكتشف التشكيلة' },
    image: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=900&h=1100&q=80&auto=format&fit=crop',
  },
  values: [
    { title: { en: 'Honest pricing', ar: 'أسعار صريحة' }, desc: { en: 'Fair margins, no inflated tags. Sale prices mean real discounts.', ar: 'هوامش ربح عادلة ومن غير أسعار مبالغ فيها. والخصومات خصومات حقيقية.' } },
    { title: { en: 'Quality you feel', ar: 'جودة تحس بيها' }, desc: { en: 'Heavyweight fabrics and strong stitching, checked before every shipment.', ar: 'أقمشة هيفي وخياطة متينة، وبيتم الفحص قبل كل شحنة.' } },
    { title: { en: 'Speed you can count on', ar: 'سرعة في موعدها' }, desc: { en: 'Your order leaves the warehouse within 24 hours, nationwide.', ar: 'طلبك بيخرج من المستودع خلال ٢٤ ساعة، لكل مصر.' } },
  ],
  faqs: [
    { q: { en: 'How fast is shipping?', ar: 'التوصيل بياخد قد إيه؟' }, a: { en: 'Orders ship within 24 hours and reach most governorates across Egypt within 1-2 days.', ar: 'الطلب بيتشحن خلال ٢٤ ساعة وبيوصل أغلب محافظات مصر خلال يوم أو يومين.' } },
    { q: { en: 'Can I exchange or return items?', ar: 'ينفع أستبدل أو أرجّع الطلب؟' }, a: { en: 'Yes — within 14 days of delivery, as long as the item is unworn with tags attached.', ar: 'أكيد — خلال ١٤ يوم من الاستلام، بشرط يكون اللبس بحالته وبتاغاته.' } },
    { q: { en: 'How do I know my size?', ar: 'أعرف مقاسي إزاي؟' }, a: { en: 'Check the size guide above. Between sizes? Go up — relaxed fits are the streetwear way.', ar: 'شوف دليل المقاسات فوق. لو بين مقاسين؟ اختار الأكبر — القصّة المريحة هي ستايل الستريت وير.' } },
    { q: { en: 'Which payment methods do you accept?', ar: 'أي طرق الدفع المتاحة؟' }, a: { en: 'Cash on delivery, Visa, Vodafone Cash and InstaPay.', ar: 'الدفع عند الاستلام، فيزا، فودافون كاش، وإنستاباي.' } },
    { q: { en: 'How do I track my order?', ar: 'أتابع طلبي إزاي؟' }, a: { en: 'Log in and open "My Orders" — every order shows its latest status.', ar: 'سجّل دخولك وافتح صفحة "طلباتي" — كل طلب بيعرض آخر حالة ليه.' } },
  ],
  testimonials: [
    { name: 'Omar Khaled', city: { en: 'Cairo', ar: 'القاهرة' }, quote: { en: 'Ordered a tee Thursday night, it arrived in Cairo Saturday morning. The fit and fabric are on another level for the price.', ar: 'طلبت تيشيرت الخميس بالليل ووصلني القاهرة السبت الصبح. الخامة والمقاس على مستوى تاني بالنسبة للسعر.' }, avatar: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=96&h=96&q=80&auto=format&fit=crop' },
    { name: 'Youssef Adel', city: { en: 'Alexandria', ar: 'الإسكندرية' }, quote: { en: 'The heavyweight tees are the best I have owned. You feel the quality the second you put one on.', ar: 'التيشيرتات الهيفي أفضل حاجة لبستها في حياتي. بتحس بالجودة أول ما تلبسها.' }, avatar: 'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=96&h=96&q=80&auto=format&fit=crop' },
    { name: 'Mostafa Tarek', city: { en: 'Giza', ar: 'الجيزة' }, quote: { en: 'Support actually replies fast. Swapped my size with zero fuss, no questions asked.', ar: 'خدمة العملاء بترد بسرعة فعلًا. بدّلوا المقاس من غير أي تعقيد أو أسئلة.' }, avatar: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=96&h=96&q=80&auto=format&fit=crop' },
    { name: 'Karim Samy', city: { en: 'Sharqia', ar: 'الشرقية' }, quote: { en: 'The cargo pants fit exactly like the photos. Sizing is honest, which is rare online.', ar: 'البنطال الكارجو مقاسه نفس الصور بالظبط. المقاسات صريحة — ودي حاجة نادرة في التسوق أونلاين.' }, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&q=80&auto=format&fit=crop' },
    { name: 'Adam Fathy', city: { en: 'Mansoura', ar: 'المنصورة' }, quote: { en: 'Got the flannel overshirt for winter. Thick, warm, and the buttons feel premium.', ar: 'جبت القميص الفلانيل للشتا. سميك ودافي والزرارات شكلها فخم.' }, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=96&h=96&q=80&auto=format&fit=crop' },
    { name: 'Seif El-Din', city: { en: 'Hurghada', ar: 'الغردقة' }, quote: { en: 'Reached Hurghada in two days. Best packaging I have seen from an Egyptian store.', ar: 'وصل الغردقة يومين بس. أحسن تغليف شفته من متجر مصري.' }, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=96&h=96&q=80&auto=format&fit=crop' },
    { name: 'Mohab Ashraf', city: { en: 'Tanta', ar: 'طنطا' }, quote: { en: 'The heavyweight fabric is no joke. Washed it five times, still holds shape and color.', ar: 'خامة الهيفي مش هزار. غسلتها خمس مرات ولسه محتفظة بشكلها ولونها.' }, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=96&h=96&q=80&auto=format&fit=crop' },
    { name: 'Yehia Nabil', city: { en: 'Assiut', ar: 'أسيوط' }, quote: { en: 'Easy ordering, and the COD option makes it stress-free. Will order again.', ar: 'الطلب سهل والدفع عند الاستلام بيلغي أي قلق. هطلب تاني أكيد.' }, avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=96&h=96&q=80&auto=format&fit=crop' },
    { name: 'Ziad Hassan', city: { en: '6th of October', ar: 'السادس من أكتوبر' }, quote: { en: 'My third order here. Consistent quality, and the phone support answered in seconds.', ar: 'ده طلبي التالت هنا. جودة ثابتة والدعم على التليفون رد في ثانية.' }, avatar: 'https://images.unsplash.com/photo-1522529599102-029c65a7a38e?w=96&h=96&q=80&auto=format&fit=crop' },
  ],
  sizeRows: [
    { size: 'S', chest: 96, length: 68, fit: { en: 'Slim', ar: 'لاصق' } },
    { size: 'M', chest: 102, length: 71, fit: { en: 'Regular', ar: 'عادي' } },
    { size: 'L', chest: 108, length: 74, fit: { en: 'Regular', ar: 'عادي' } },
    { size: 'XL', chest: 114, length: 77, fit: { en: 'Loose', ar: 'فضفاض' } },
  ],
  stats: [
    { value: '4.8/5', label: { en: 'Average rating', ar: 'متوسط التقييم' } },
    { value: '+12K', label: { en: 'Orders delivered', ar: 'طلب تم توصيله' } },
    { value: '27', label: { en: 'Governorates covered', ar: 'محافظة' } },
    { value: '24h', label: { en: 'Hours to ship', ar: 'ساعة للتوصيل' } },
  ],
  footer: {
    tagline: { en: 'Premium streetwear at honest prices. T-shirts, shirts, pants and more — delivered across Egypt.', ar: 'ملابس شبابية بجودة عالية وأسعار مناسبة. تيشيرتات وقمصان وبناطيل وأكثر — توصيل لجميع محافظات مصر.' },
    city: { en: 'Cairo, Egypt', ar: 'القاهرة، مصر' },
  },
}

function loadContent() {
  try {
    const raw = localStorage.getItem(CONTENT_KEY)
    if (raw) return deepMerge(DEFAULT_CONTENT, JSON.parse(raw))
  } catch { /* corrupted — reseed */ }
  localStorage.setItem(CONTENT_KEY, JSON.stringify(DEFAULT_CONTENT))
  return JSON.parse(JSON.stringify(DEFAULT_CONTENT))
}

let content = loadContent()
const saveContent = () => localStorage.setItem(CONTENT_KEY, JSON.stringify(content))

function deepMerge(base, patch) {
  const out = { ...base }
  for (const [k, v] of Object.entries(patch || {})) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k], v)
    } else if (Array.isArray(v)) {
      out[k] = [...v]
    } else {
      out[k] = v
    }
  }
  return out
}

const delay = ms => new Promise(r => setTimeout(r, ms))
const jitter = () => delay(200 + Math.random() * 350)

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}
const err = (message, status) => { throw new ApiError(message, status) }

/* ---------- fake JWT ---------- */
function sign(payload) {
  const body = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  return `eyJhbGciOiJIUzI1NiJ9.${body}.mock-signature`
}
function decode(token) {
  try {
    const body = token.split('.')[1]
    return JSON.parse(decodeURIComponent(escape(atob(body))))
  } catch { return null }
}
function currentUser() {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return null
  const payload = decode(token)
  if (!payload) return null
  const user = db.users.find(u => u.id === payload.uid)
  return user || null
}
const isAdmin = u => u?.role === 'ROLE_ADMIN'
const isCustomer = u => u?.role === 'ROLE_CUSTOMER'

/* ---------- route matching ---------- */
const m = (method, path) => method.toLowerCase() === 'get' && path === '/products'
  || method.toLowerCase() === 'get' && /^\/products\/\d+$/.test(path)

async function handle(method, path, opts = {}) {
  await jitter()
  const { params = {}, data = {}, _token } = opts
  const route = `${method.toUpperCase()} ${path}`

  switch (true) {
    /* ===== AUTH ===== */
    case route === 'POST /auth/register': {
      const { full_name, email, password } = data
      if (!full_name || !email || !password) err('Full name, email and password are required', 400)
      if (db.users.some(u => u.email.toLowerCase() === email.toLowerCase())) err('This email is already registered', 409)
      const user = { id: db.seq.user++, full_name, email, password, role: 'ROLE_CUSTOMER', created_at: now(new Date()) }
      db.users.push(user); save()
      return { token: sign({ uid: user.id, role: user.role }), user: publicUser(user) }
    }
    case route === 'POST /auth/login': {
      const { email, password } = data
      const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
      if (!user || user.password !== password) err('Invalid email or password', 401)
      return { token: sign({ uid: user.id, role: user.role }), user: publicUser(user) }
    }

    /* ===== CATEGORIES ===== */
    case route === 'GET /categories': {
      const cats = db.categories.map(c => ({
        ...c,
        product_count: db.products.filter(p => p.category_id === c.id && p.is_active).length,
      }))
      return cats
    }
    case route === 'POST /categories': {
      requireAdmin()
      const { name, name_ar, image_url } = data
      if (!name) err('Category name is required', 400)
      if (db.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) err('Category name already exists', 409)
      const category = { id: db.seq.category++, name, name_ar: name_ar || null, image_url: image_url || catImg(`sv-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`), created_at: now(new Date()) }
      db.categories.push(category); save()
      return category
    }
    case /^DELETE \/categories\/\d+$/.test(route): {
      requireAdmin()
      const id = Number(path.split('/').pop())
      const idx = db.categories.findIndex(c => c.id === id)
      if (idx === -1) err('Category not found', 404)
      if (db.products.some(p => p.category_id === id)) err('Cannot delete a category that still has products', 409)
      db.categories.splice(idx, 1); save()
      return { message: 'Category deleted' }
    }

    /* ===== PRODUCTS ===== */
    case route === 'GET /products': {
      const caller = opts._token ? currentUser() : null
      let list = isAdmin(caller) && params.include_inactive ? [...db.products] : db.products.filter(p => p.is_active)
      if (params.category) list = list.filter(p => String(p.category_id) === String(params.category))
      if (params.min_price) list = list.filter(p => p.price >= Number(params.min_price))
      if (params.max_price) list = list.filter(p => p.price <= Number(params.max_price))
      if (params.q) {
        const q = String(params.q).toLowerCase()
        list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q) || (p.tags || '').toLowerCase().includes(q) || (p.brand || '').toLowerCase().includes(q) || (p.material || '').toLowerCase().includes(q))
      }
      if (params.sort === 'price_asc') list = [...list].sort((a, b) => a.price - b.price)
      else if (params.sort === 'price_desc') list = [...list].sort((a, b) => b.price - a.price)
      else list = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      const size = Number(params.size) || 12
      const page = Number(params.page) || 0
      const totalElements = list.length
      const content = list.slice(page * size, page * size + size).map(withCategory)
      return { content, totalElements, totalPages: Math.ceil(totalElements / size), page, size }
    }
    case /^GET \/products\/\d+$/.test(route): {
      const product = db.products.find(p => p.id === Number(path.split('/').pop()))
      if (!product || !product.is_active) err('Product not found', 404)
      return withCategory(product)
    }
    case route === 'POST /products': {
      requireAdmin()
      const { name, price, stock_quantity, category_id, image_url, description, is_active, discount_percent, sku, brand, material, color, sizes, tags, cost_price, reorder_level, featured } = data
      if (!name || price == null) err('Name and price are required', 400)
      const product = {
        id: db.seq.product++, name, description: description || '',
        price: Number(price), stock_quantity: Number(stock_quantity) || 0,
        category_id: category_id || null, image_url: image_url || img(`sv-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`),
        is_active: is_active !== false, rating: 0, reviews_count: 0,
        discount_percent: discount_percent != null ? Number(discount_percent) : 0,
        brand: brand || 'Grounded', material: material || '', color: color || '', sizes: sizes || '', tags: tags || '',
        cost_price: cost_price != null ? Number(cost_price) : null, reorder_level: reorder_level != null ? Number(reorder_level) : 5,
        featured: featured === true, created_at: now(new Date()),
      }
      product.sku = sku || `GR-${String(product.id).padStart(3, '0')}`
      product.images = Array.isArray(data.images) ? data.images.filter(Boolean).slice(0, 12) : []
      db.products.push(product); save()
      return withCategory(product)
    }
    case /^PUT \/products\/\d+$/.test(route): {
      requireAdmin()
      const id = Number(path.split('/').pop())
      const product = db.products.find(p => p.id === id)
      if (!product) err('Product not found', 404)
      const { name, price, stock_quantity, category_id, image_url, description, is_active, discount_percent, sku, brand, material, color, sizes, tags, cost_price, reorder_level, featured } = data
      if (name != null) product.name = name
      if (price != null) product.price = Number(price)
      if (stock_quantity != null) product.stock_quantity = Number(stock_quantity)
      if (category_id != null) product.category_id = category_id || null
      if (image_url != null) product.image_url = image_url
      if (description != null) product.description = description
      if (is_active != null) product.is_active = is_active
      if (discount_percent != null) product.discount_percent = Number(discount_percent)
      if (sku != null) product.sku = sku
      if (brand != null) product.brand = brand
      if (material != null) product.material = material
      if (color != null) product.color = color
      if (sizes != null) product.sizes = sizes
      if (tags != null) product.tags = tags
      if (cost_price != null) product.cost_price = Number(cost_price)
      if (reorder_level != null) product.reorder_level = Number(reorder_level)
      if (featured != null) product.featured = featured
      if (data.images !== undefined) product.images = Array.isArray(data.images) ? data.images.filter(Boolean).slice(0, 12) : []
      save()
      return withCategory(product)
    }
    case /^DELETE \/products\/\d+$/.test(route): {
      requireAdmin()
      const id = Number(path.split('/').pop())
      const product = db.products.find(p => p.id === id)
      if (!product) err('Product not found', 404)
      product.is_active = !product.is_active
      save()
      return { message: product.is_active ? 'Product restored' : 'Product hidden' }
    }

    /* ===== ORDERS ===== */
    case route === 'POST /orders': {
      const user = requireAuth()
      const { shipping_address, phone_number, payment_method = 'COD', items } = data
      if (!['COD', 'VISA', 'VODAFONE_CASH', 'INSTAPAY'].includes(payment_method)) err('Invalid payment method', 400)
      if (!shipping_address || !phone_number) err('Shipping address and phone number are required', 400)
      if (!Array.isArray(items) || items.length === 0) err('Order must contain at least one item', 400)
      for (const it of items) {
        const product = db.products.find(p => p.id === Number(it.product_id))
        if (!product || !product.is_active) err(`Product #${it.product_id} is not available`, 404)
        const qty = Math.floor(Number(it.quantity))
        if (qty < 1) err('Invalid quantity', 400)
        if (qty > product.stock_quantity) err(`Only ${product.stock_quantity} in stock for "${product.name}"`, 409)
      }
      const orderItems = items.map(it => {
        const product = db.products.find(p => p.id === Number(it.product_id))
        const qty = Math.floor(Number(it.quantity))
        product.stock_quantity -= qty
        return { id: db.seq.item++, order_id: 0, product_id: product.id, product_name: product.name, product_image: product.image_url, quantity: qty, unit_price: effectivePrice(product) }
      })
      const total = Math.round(orderItems.reduce((s, i) => s + i.unit_price * i.quantity, 0) * 100) / 100
      const order = {
        id: db.seq.order++, user_id: user.id, total_amount: total, status: 'PENDING',
        shipping_address, phone_number, payment_method, shipping_fee: Number(db.settings.shipping_fee) || 0,
        paid_at: null, payment_proof: null, payment_proof_at: null,
        status_history: [{ status: 'PENDING', at: now(new Date()) }],
        created_at: now(new Date()), items: orderItems,
      }
      orderItems.forEach(i => { i.order_id = order.id })
      db.orders.push(order); save()
      return withUser(order)
    }
    case route === 'GET /orders/my-orders': {
      const user = requireAuth()
      return db.orders
        .filter(o => o.user_id === user.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(withUser).map(ensureHistory).map(withProducts)
    }
    case route === 'GET /orders': {
      requireAdmin()
      return db.orders
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(withUser).map(ensureHistory).map(withProducts)
    }
    case /^GET \/orders\/\d+$/.test(route): {
      const user = requireAuth()
      const id = Number(path.split('/').pop())
      const order = db.orders.find(o => o.id === id)
      if (!order || (!isAdmin(user) && order.user_id !== user.id)) err('Order not found', 404)
      return withUser(withProducts(ensureHistory(order)))
    }
    case /^PATCH \/orders\/\d+\/status$/.test(route): {
      requireAdmin()
      const parts = path.split('/')
      const id = Number(parts[parts.length - 2])
      const order = db.orders.find(o => o.id === id)
      if (!order) err('Order not found', 404)
      const { status } = data
      if (!STATUSES.includes(status)) err(`Status must be one of: ${STATUSES.join(', ')}`, 400)
      if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
        for (const it of order.items || []) {
          const product = db.products.find(p => p.id === Number(it.product_id))
          if (product && product.is_active) product.stock_quantity += it.quantity
        }
      }
      order.status = status
      order.paid_at = status === 'PAID' ? (order.paid_at || now(new Date())) : (status !== 'PAID' ? null : order.paid_at)
      order.status_history = [...(order.status_history || []).filter(h => h.status !== status), { status, at: now(new Date()) }]
      save()
      return withUser(ensureHistory(order))
    }
    case /^POST \/orders\/\d+\/pay$/.test(route): {
      const user = requireAuth()
      const parts = path.split('/')
      const id = Number(parts[parts.length - 2])
      const order = db.orders.find(o => o.id === id)
      if (!order || (!isAdmin(user) && order.user_id !== user.id)) err('Order not found', 404)
      if (order.status === 'CANCELLED') err('This order is cancelled', 409)
      order.status = 'PAID'
      order.paid_at = now(new Date())
      order.status_history = [...(order.status_history || []).filter(h => h.status !== 'PAID'), { status: 'PAID', at: order.paid_at }]
      save()
      return withUser(ensureHistory(order))
    }
    case /^PATCH \/orders\/\d+\/proof$/.test(route): {
      const user = requireAuth()
      const parts = path.split('/')
      const id = Number(parts[parts.length - 2])
      const order = db.orders.find(o => o.id === id)
      if (!order || (!isAdmin(user) && order.user_id !== user.id)) err('Order not found', 404)
      const { proof } = data
      if (typeof proof !== 'string' || !/^data:image\//.test(proof)) err('Invalid proof image', 400)
      order.payment_proof = proof
      order.payment_proof_at = now(new Date())
      save()
      return withUser(ensureHistory(order))
    }

    /* ===== ADMIN RESET ===== */
    case route === 'POST /admin/reset': {
      requireAdmin()
      const { scope } = data
      if (scope === 'orders') {
        db.orders = []
        db.seq.order = 1
        db.seq.item = 1
      } else if (scope === 'store') {
        const fresh = seedDB()
        db.users = fresh.users
        db.categories = fresh.categories
        db.products = fresh.products
        db.orders = []
        db.settings = fresh.settings
        db.seq = { ...fresh.seq, order: 1, item: 1 }
      } else {
        err('Invalid reset scope', 400)
      }
      save()
      return { message: 'Store data reset' }
    }

    /* ===== PAYMENTS ===== */
    case route === 'POST /payments/checkout': {
      requireAuth()
      const { order_id } = data
      const order = db.orders.find(o => o.id === Number(order_id))
      if (!order) err('Order not found', 404)
      return { order_id: order.id, amount: order.total_amount, url: `/mock-gateway?order=${order.id}`, gateway: 'mock-paymob' }
    }
    case route === 'POST /payments/webhook': {
      return { received: true, acknowledged_at: now(new Date()) }
    }

    /* ===== CONTENT (editable front-end text) ===== */
    case route === 'GET /content': {
      return content
    }
    case route === 'PUT /admin/content': {
      requireAdmin()
      content = deepMerge(content, data)
      saveContent()
      return content
    }

    /* ===== ADMIN STATS ===== */
    case route === 'GET /settings': {
      return db.settings
    }
    case route === 'PUT /admin/settings': {
      requireAdmin()
      const KEYS = ['store_name_en', 'store_name_ar', 'tagline_en', 'tagline_ar', 'announcement_en', 'announcement_ar', 'announcement_enabled', 'shipping_fee', 'vodafone_number', 'instapay_number', 'support_phone', 'support_email', 'instagram_url', 'facebook_url', 'tiktok_url']
      for (const key of KEYS) {
        if (data[key] !== undefined) db.settings[key] = data[key]
      }
      db.settings.updated_at = now(new Date())
      save()
      return db.settings
    }
    case route === 'GET /admin/stats': {
      requireAdmin()
      const revenue = db.orders.filter(o => o.status !== 'CANCELLED').reduce((s, o) => s + o.total_amount, 0)
      const lowStock = db.products.filter(p => p.is_active && p.stock_quantity < 5)
        .sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 6).map(withCategory)
      return {
        revenue,
        orders_count: db.orders.length,
        customers_count: db.users.filter(u => isCustomer(u)).length,
        products_count: db.products.filter(p => p.is_active).length,
        pending_orders: db.orders.filter(o => o.status === 'PENDING').length,
        low_stock_count: lowStock.length,
        low_stock_products: lowStock,
        recent_orders: [...db.orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map(withUser),
      }
    }

    default:
      err(`Mock route not found: ${route}`, 404)
  }
}

/* ---------- helpers ---------- */
function ensureHistory(order) {
  if (!Array.isArray(order.status_history) || order.status_history.length === 0) {
    if (order.payment_method !== 'COD' && ['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status) && !order.paid_at) {
      order.paid_at = order.created_at
    }
    const h = [{ status: 'PENDING', at: order.created_at }]
    if (['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status) && order.paid_at) {
      h.push({ status: 'PAID', at: order.paid_at })
    }
    if (order.status === 'SHIPPED' || order.status === 'DELIVERED') h.push({ status: order.status, at: order.created_at })
    if (order.status === 'CANCELLED') h.push({ status: 'CANCELLED', at: order.created_at })
    order.status_history = h
  }
  return order
}

function withProducts(order) {
  for (const it of order.items || []) {
    const product = db.products.find(p => p.id === Number(it.product_id))
    if (!it.product_image && product) it.product_image = product.image_url
  }
  return order
}
function effectivePrice(p) {
  const d = Number(p?.discount_percent) || 0
  if (!d || d <= 0 || d >= 100) return Number(p?.price) || 0
  return Math.round(Number(p.price) * (100 - d)) / 100
}
function withCategory(p) {
  const cat = db.categories.find(c => c.id === p.category_id)
  return { ...p, category_name: cat?.name || 'General', category_name_ar: cat?.name_ar || null }
}
function withUser(o) {
  const u = db.users.find(x => x.id === o.user_id)
  return { ...o, user_name: u?.full_name || 'Unknown', user_email: u?.email || '' }
}
function publicUser(u) {
  const { password, ...rest } = u
  return rest
}
function requireAuth() {
  const user = currentUser()
  if (!user) err('Authentication required', 401)
  return user
}
function requireAdmin() {
  const user = requireAuth()
  if (!isAdmin(user)) err('Admin access required', 403)
  return user
}

export { handle, ApiError }