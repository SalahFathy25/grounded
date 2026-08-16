/* Node test harness for the mock backend (mirrors the browser localStorage). */

const store = new Map()
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
}
globalThis.window = globalThis

const { handle, ApiError } = await import('./src/lib/mockServer.js')

let passed = 0
let failed = 0
const ok = (cond, name, extra = '') => {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.log(`  FAIL  ${name}${extra ? ` — ${extra}` : ''}`) }
}
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const as = async (token, fn) => {
  const prev = store.get('sv_token') ?? null
  token ? store.set('sv_token', token) : store.delete('sv_token')
  try { return await fn() } finally { prev ? store.set('sv_token', prev) : store.delete('sv_token') }
}

// 1. Categories — exactly 3
const cats = await handle('GET', '/categories')
ok(cats.length === 3, 'categories === 3', `got ${cats.length}`)
ok(eq(cats.map(c => c.name), ['T-Shirts', 'Shirts', 'Pants']), 'category names')

// 2. Products — 12, one page
const list = await handle('GET', '/products')
ok(list.totalElements === 12, 'products totalElements === 12', `got ${list.totalElements}`)
ok(list.totalPages === 1 && list.content.length === 12, 'products fit one page')
ok(list.content[0].id === 12, 'newest first (Cargo Shorts)')

// 3. Discount data present on seeded products
const p1 = await handle('GET', '/products/1')
ok(p1.discount_percent === 20, 'p1 discount 20%')
ok(p1.sku === 'GR-001' && p1.brand === 'Streetline' && p1.material.includes('Cotton'), 'p1 sku/brand/material')
ok(typeof p1.sizes === 'string' && p1.sizes.includes('XXL'), 'p1 sizes')
const p9 = await handle('GET', '/products/9')
ok(p9.discount_percent === 25 && p9.stock_quantity === 4, 'p9 discount 25% + low stock')

// 4. Search covers name/tags/brand/material
const byTag = await handle('GET', '/products', { params: { q: 'baggy' } })
ok(byTag.totalElements === 1 && byTag.content[0].name === 'Baggy Cargo Pants', 'search by tag "baggy"')
const byBrand = await handle('GET', '/products', { params: { q: 'Denimora' } })
ok(byBrand.totalElements === 2, 'search by brand "Denimora"')

// 5. Category filter
const tees = await handle('GET', '/products', { params: { category: '1' } })
ok(tees.totalElements === 4, 'category 1 (T-Shirts) === 4')

// 6. Auth + admin stats
const adminLogin = await handle('POST', '/auth/login', { data: { email: 'admin@grounded.store', password: 'admin123' } })
const adminToken = adminLogin.token
const stats = await as(adminToken, () => handle('GET', '/admin/stats'))
ok(stats.products_count === 12, 'stats products_count === 12')
ok(stats.orders_count === 4, 'stats orders_count === 4')
ok(stats.low_stock_count >= 3, `stats low_stock_count >= 3 (got ${stats.low_stock_count})`)
ok(stats.revenue > 0, 'stats revenue computed')

// 7. Order uses discounted (effective) price
const custLogin = await handle('POST', '/auth/login', { data: { email: 'customer@grounded.store', password: 'demo1234' } })
const custToken = custLogin.token
const order = await as(custToken, () => handle('POST', '/orders', {
  data: { shipping_address: '1 Test St', phone_number: '+20 100 000 0000', payment_method: 'COD', items: [{ product_id: 1, quantity: 2 }] },
}))
ok(order.total_amount === 558.4, `order total uses sale price 558.4 (got ${order.total_amount})`)
ok(order.items[0].unit_price === 279.2, 'order line unit_price 279.2')
const after = await handle('GET', '/products/1')
ok(after.stock_quantity === 0, 'stock decremented 2 → 0')
const session = await as(custToken, () => handle('POST', '/payments/checkout', { data: { order_id: order.id } }))
ok(session.amount === 558.4, 'checkout session amount matches')

// 8. Shop route respects sales (sale chip value derivable from tolta)
const p9again = await handle('GET', '/products/9')
ok(p9again.discount_percent === 25, 'p9 discount persists after order')

// 9. Admin creates product with new fields
const created = await as(adminToken, () => handle('POST', '/products', {
  data: { name: 'Test Tee', price: 500, stock_quantity: 10, category_id: 1, discount_percent: 50, sku: 'TEST-1', brand: 'TestBrand', material: 'TestCotton', color: 'Red', sizes: 'L', tags: 'test, tag', cost_price: 200, reorder_level: 3, featured: true },
}))
ok(created.discount_percent === 50 && created.sku === 'TEST-1' && created.brand === 'TestBrand', 'create carries new fields')
ok(created.id === 13, 'created id === 13')

// 10. Admin update keeps/sets fields
const updated = await as(adminToken, () => handle('PUT', '/products/13', { data: { discount_percent: 30, tags: 'summer' } }))
ok(updated.discount_percent === 30 && updated.tags === 'summer' && updated.name === 'Test Tee', 'update merges fields')

// 11. Inventory guard still enforced
let overStockRejected = false
try {
  await as(custToken, () => handle('POST', '/orders', { data: { shipping_address: '1 Test St', phone_number: '+20 100 000 0000', items: [{ product_id: 2, quantity: 999 }] } }))
} catch (e) { overStockRejected = e instanceof ApiError && e.status === 409 }
ok(overStockRejected, 'over-stock rejected with 409')

// 12. Category delete conflict
let catConflict = false
try { await as(adminToken, () => handle('DELETE', '/categories/1')) } catch (e) { catConflict = e instanceof ApiError && e.status === 409 }
ok(catConflict, 'category delete conflict 409')

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)