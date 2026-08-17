'use strict'

/* End-to-end smoke test for the Node backend — verifies the API contract
   mirrors the original Spring Boot backend exactly. Requires the server
   to be running on PORT (default 8080). */

const BASE = process.env.TEST_BASE_URL || 'http://localhost:8080/api/v1'

let passed = 0
let failed = 0
const failures = []

function ok(condition, label, extra) {
  if (condition) {
    passed++
    console.log(`  PASS  ${label}`)
  } else {
    failed++
    failures.push(label)
    console.log(`  FAIL  ${label}${extra !== undefined ? ` — ${JSON.stringify(extra)}` : ''}`)
  }
}

async function req(method, path, { token, body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let data = null
  try {
    data = await res.json()
  } catch (err) {
    data = null
  }
  return { status: res.status, data }
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function run() {
  console.log('\n=== public endpoints ===')

  const settings = await req('GET', '/settings')
  ok(settings.status === 200, 'GET /settings → 200')
  ok(settings.data && settings.data.store_name_en === 'Grounded', 'settings defaults', settings.data && settings.data.store_name_en)
  ok(settings.data && settings.data.shipping_fee === 80, 'settings shipping_fee = 80', settings.data && settings.data.shipping_fee)
  ok(settings.data && typeof settings.data.announcement_enabled === 'boolean', 'announcement_enabled is boolean')

  const content = await req('GET', '/content')
  ok(content.status === 200, 'GET /content → 200')
  ok(content.data && content.data.hero && content.data.hero.badge && content.data.hero.badge.en, 'content has hero badge')
  ok(content.data && Array.isArray(content.data.faqs) && content.data.faqs.length === 5, 'content has 5 faqs')

  const categories = await req('GET', '/categories')
  ok(categories.status === 200, 'GET /categories → 200')
  ok(Array.isArray(categories.data) && categories.data.length === 3, '3 categories')
  const tshirts = categories.data && categories.data.find(c => c.name === 'T-Shirts')
  ok(tshirts && tshirts.product_count === 4, 'T-Shirts product_count = 4', tshirts && tshirts.product_count)
  ok(tshirts && tshirts.name_ar === 'تيشيرتات', 'category name_ar present')

  const products = await req('GET', '/products')
  ok(products.status === 200, 'GET /products → 200')
  ok(products.data && products.data.totalElements === 12, '12 products total', products.data && products.data.totalElements)
  ok(products.data && products.data.content.length === 12, 'page size 12 content', products.data && products.data.content.length)
  ok(products.data && products.data.totalPages === 1 && products.data.page === 0, 'pagination fields')
  const p1 = products.data && products.data.content.find(p => p.id === 1)
  ok(p1 && p1.sale_price === 279.2, 'product 1 sale_price = 279.2 (20% off 349)', p1 && p1.sale_price)
  ok(p1 && p1.category_name === 'T-Shirts' && p1.category_id === 1, 'product category joined')
  ok(p1 && Array.isArray(p1.images) && p1.images.length === 0, 'product images array')
  ok(p1 && typeof p1.is_active === 'boolean' && typeof p1.featured === 'boolean', 'product booleans are real booleans')

  const priceAsc = await req('GET', '/products?sort=price_asc&size=2')
  ok(priceAsc.status === 200, 'sort=price_asc works')
  ok(priceAsc.data && priceAsc.data.content[0].price === 279 && priceAsc.data.content[1].price === 299,
    'price_asc ordering', priceAsc.data && priceAsc.data.content.map(p => p.price))

  const search = await req('GET', '/products?q=cargo')
  ok(search.data && search.data.totalElements >= 1, 'keyword search cargo', search.data && search.data.totalElements)
  const searchTag = await req('GET', '/products?q=oversized')
  ok(searchTag.data && searchTag.data.totalElements >= 1, 'keyword matches tags')

  const byCat = await req('GET', '/products?category=2')
  ok(byCat.data && byCat.data.totalElements === 3, 'category filter = 3', byCat.data && byCat.data.totalElements)

  const minMax = await req('GET', '/products?min_price=500&max_price=600')
  ok(minMax.data && minMax.data.content.every(p => p.price >= 500 && p.price <= 600), 'min/max price filter')

  const one = await req('GET', '/products/1')
  ok(one.status === 200 && one.data && one.data.id === 1, 'GET /products/1')
  const missing = await req('GET', '/products/99999')
  ok(missing.status === 404 && missing.data.message === 'Product not found', 'GET /products/99999 → 404')
  ok(missing.data && missing.data.timestamp && missing.data.status === 404 && missing.data.path === '/api/v1/products/99999',
    'error body shape {timestamp,status,message,path}')

  console.log('\n=== security ===')

  const noToken = await req('POST', '/products', { body: { name: 'x' } })
  ok(noToken.status === 401 && noToken.data.message === 'Authentication required', 'no token → 401')
  const badToken = await req('GET', '/admin/stats', { token: 'not-a-token' })
  ok(badToken.status === 401, 'bad token → 401')
  const noToken404 = await req('GET', '/does-not-exist')
  ok(noToken404.status === 401, 'unknown api without token → 401 (filter runs first, like Spring)')

  console.log('\n=== auth ===')

  const reg = await req('POST', '/auth/register', { body: { full_name: 'Test User', email: 'test@example.com', password: 'secret1' } })
  ok(reg.status === 201, 'register → 201')
  ok(reg.data && reg.data.token && reg.data.user && reg.data.user.role === 'ROLE_CUSTOMER', 'register returns token+user')
  const dup = await req('POST', '/auth/register', { body: { full_name: 'Test User', email: 'test@example.com', password: 'secret1' } })
  ok(dup.status === 409 && dup.data.message === 'This email is already registered', 'duplicate register → 409')
  const badEmail = await req('POST', '/auth/register', { body: { full_name: 'X', email: 'nope', password: 'secret1' } })
  ok(badEmail.status === 400 && badEmail.data.message === 'email: must be a valid email', 'bad email → 400')
  const shortPw = await req('POST', '/auth/register', { body: { full_name: 'X', email: 'x@y.com', password: '123' } })
  ok(shortPw.status === 400 && shortPw.data.message === 'password: must be at least 6 characters', 'short password → 400')
  const blankName = await req('POST', '/auth/register', { body: { full_name: '  ', email: 'x2@y.com', password: 'secret1' } })
  ok(blankName.status === 400 && blankName.data.message === 'full_name: must not be blank', 'blank name → 400')

  const customerLogin = await req('POST', '/auth/login', { body: { email: 'customer@grounded.store', password: 'demo1234' } })
  ok(customerLogin.status === 200, 'customer login → 200')
  ok(customerLogin.data && customerLogin.data.user.role === 'ROLE_CUSTOMER', 'customer role')
  const badLogin = await req('POST', '/auth/login', { body: { email: 'customer@grounded.store', password: 'wrong' } })
  ok(badLogin.status === 401 && badLogin.data.message === 'Invalid email or password', 'bad login → 401')

  const adminLogin = await req('POST', '/auth/login', { body: { email: 'admin@grounded.store', password: 'admin123' } })
  ok(adminLogin.status === 200, 'admin login → 200')
  ok(adminLogin.data && adminLogin.data.user.role === 'ROLE_ADMIN', 'admin role')

  const customerToken = customerLogin.data && customerLogin.data.token
  const adminToken = adminLogin.data && adminLogin.data.token

  console.log('\n=== customer orders ===')

  const order = await req('POST', '/orders', {
    token: customerToken,
    body: {
      shipping_address: '1 Test St, Cairo',
      phone_number: '+20 111 111 1111',
      payment_method: 'COD',
      items: [{ product_id: 2, quantity: 2 }],
    },
  })
  ok(order.status === 201, 'create order → 201')
  ok(order.data && order.data.status === 'PENDING', 'order status PENDING')
  ok(order.data && order.data.total_amount === 598, 'order total 598 (299*2)', order.data && order.data.total_amount)
  ok(order.data && order.data.shipping_fee === 80, 'shipping fee from settings = 80')
  ok(order.data && order.data.user_id === 2, 'order belongs to customer')
  ok(order.data && order.data.status_history && order.data.status_history[0].status === 'PENDING', 'status_history seeded')
  ok(order.data && order.data.items && order.data.items[0].product_name === 'Heavyweight Basic Tee', 'order item product_name')
  const stockAfter = await req('GET', '/products/2')
  ok(stockAfter.data && stockAfter.data.stock_quantity === 93, 'stock decremented 95→93', stockAfter.data && stockAfter.data.stock_quantity)

  const noStock = await req('POST', '/orders', {
    token: customerToken,
    body: {
      shipping_address: '1 Test St, Cairo', phone_number: '+20 111 111 1111',
      payment_method: 'COD', items: [{ product_id: 2, quantity: 500 }],
    },
  })
  ok(noStock.status === 409 && /Only \d+ in stock/.test(noStock.data.message), 'insufficient stock → 409', noStock.data && noStock.data.message)

  const badPayment = await req('POST', '/orders', {
    token: customerToken,
    body: {
      shipping_address: '1 Test St, Cairo', phone_number: '+20 111 111 1111',
      payment_method: 'BITCOIN', items: [{ product_id: 2, quantity: 1 }],
    },
  })
  ok(badPayment.status === 400 && badPayment.data.message === 'Invalid payment method', 'invalid payment → 400')

  const emptyItems = await req('POST', '/orders', {
    token: customerToken,
    body: { shipping_address: '1 Test St', phone_number: '+20 1', payment_method: 'COD', items: [] },
  })
  ok(emptyItems.status === 400 && emptyItems.data.message === 'Order must contain at least one item', 'empty items → 400')

  const discountOrder = await req('POST', '/orders', {
    token: customerToken,
    body: {
      shipping_address: '1 Test St, Cairo', phone_number: '+20 111 111 1111',
      payment_method: 'VODAFONE_CASH', items: [{ product_id: 1, quantity: 1 }],
    },
  })
  ok(discountOrder.data && discountOrder.data.items[0].unit_price === 279.2, 'discount unit price 279.2', discountOrder.data && discountOrder.data.items[0].unit_price)
  ok(discountOrder.data && discountOrder.data.total_amount === 279.2, 'discount order total', discountOrder.data && discountOrder.data.total_amount)

  const myOrders = await req('GET', '/orders/my-orders', { token: customerToken })
  ok(myOrders.status === 200 && Array.isArray(myOrders.data), 'my-orders')
  const orderId = order.data.id

  const getOrder = await req('GET', `/orders/${orderId}`, { token: customerToken })
  ok(getOrder.status === 200 && getOrder.data.id === orderId, 'get own order')

  const customerCannotList = await req('GET', '/orders', { token: customerToken })
  ok(customerCannotList.status === 403 && customerCannotList.data.message === 'Admin access required', 'customer GET /orders → 403')

  const customerCannotSetStatus = await req('PATCH', `/orders/${orderId}/status`, { token: customerToken, body: { status: 'SHIPPED' } })
  ok(customerCannotSetStatus.status === 403, 'customer PATCH status → 403')

  const payOwn = await req('POST', `/orders/${orderId}/pay`, { token: customerToken })
  ok(payOwn.status === 200 && payOwn.data.status === 'PAID' && payOwn.data.paid_at, 'customer pays own order → PAID')
  ok(payOwn.data.status_history.some(h => h.status === 'PAID'), 'history has PAID')

  const canceledPay = await req('POST', '/orders/4/pay', { token: customerToken })
  ok(canceledPay.status === 409 && canceledPay.data.message === 'This order is cancelled', 'pay cancelled order → 409')

  const badProof = await req('PATCH', `/orders/${orderId}/proof`, { token: customerToken, body: { proof: 'http://x.png' } })
  ok(badProof.status === 400 && badProof.data.message === 'Invalid proof image', 'bad proof → 400')

  const goodProof = await req('PATCH', `/orders/${orderId}/proof`, { token: customerToken, body: { proof: 'data:image/jpeg;base64,AAAA' } })
  ok(goodProof.status === 200 && goodProof.data.payment_proof === 'data:image/jpeg;base64,AAAA', 'good proof saved')
  ok(goodProof.data.payment_proof_at !== null, 'proof timestamp set')

  console.log('\n=== admin ===')

  const api404 = await req('GET', '/does-not-exist', { token: adminToken })
  ok(api404.status === 404, 'unknown api with token → 404')
  ok(api404.data && api404.data.message === 'Not found: /api/v1/does-not-exist', '404 message shape', api404.data && api404.data.message)

  const stats = await req('GET', '/admin/stats', { token: adminToken })
  ok(stats.status === 200, 'admin stats → 200')
  // seeded orders: 748 + 1198 (Baggy Cargo has NO discount in seed — mirrors Spring) + 803.25 (CANCELLED 1098 excluded)
  const expectedRevenue = 748 + 1198 + 803.25 + order.data.total_amount + discountOrder.data.total_amount
  ok(Math.abs(stats.data.revenue - expectedRevenue) < 0.01, `revenue = ${expectedRevenue}`, stats.data.revenue)
  ok(stats.data.orders_count === 6, 'orders_count = 6', stats.data.orders_count)
  ok(stats.data.customers_count === 3, 'customers_count = 3 (admin+customer+test)', stats.data.customers_count)
  ok(stats.data.products_count === 12, 'products_count = 12', stats.data.products_count)
  ok(stats.data.pending_orders === 2, 'pending_orders = 2 (seeded pending + discount order)', stats.data.pending_orders)
  ok(Array.isArray(stats.data.low_stock_products) && stats.data.low_stock_count === stats.data.low_stock_products.length, 'low stock products')
  ok(stats.data.recent_orders.length <= 5, 'recent orders ≤ 5')
  ok(stats.data.orders_by_status && stats.data.orders_by_status.PAID >= 1, 'orders_by_status map')

  const allOrders = await req('GET', '/orders', { token: adminToken })
  ok(allOrders.status === 200 && allOrders.data.length === 6, 'admin sees all orders')

  const setShipped = await req('PATCH', `/orders/${orderId}/status`, { token: adminToken, body: { status: 'SHIPPED' } })
  ok(setShipped.status === 200 && setShipped.data.status === 'SHIPPED' && setShipped.data.paid_at === null,
    'admin sets SHIPPED (paid_at cleared)', setShipped.data.paid_at)

  const restoreStock = await req('PATCH', `/orders/${orderId}/status`, { token: adminToken, body: { status: 'CANCELLED' } })
  ok(restoreStock.status === 200 && restoreStock.data.status === 'CANCELLED', 'cancel order')
  const stockRestored = await req('GET', '/products/2')
  ok(stockRestored.data.stock_quantity === 95, 'stock restored 93+2=95', stockRestored.data.stock_quantity)

  const hideProduct = await req('DELETE', '/products/1', { token: adminToken })
  ok(hideProduct.status === 200 && hideProduct.data.is_active === false, 'soft delete toggles is_active=false')
  const hiddenGet = await req('GET', '/products/1')
  ok(hiddenGet.status === 404, 'hidden product → 404 for customers')
  const inclInactive = await req('GET', '/products?include_inactive=true')
  ok(inclInactive.data.totalElements === 12, 'include_inactive shows hidden')
  const unhide = await req('DELETE', '/products/1', { token: adminToken })
  ok(unhide.data.is_active === true, 'soft delete toggles back to active')

  const createProduct = await req('POST', '/products', {
    token: adminToken,
    body: {
      name: 'Test Hoodie', description: 'A hoodie', price: 500, stock_quantity: 10,
      category_id: 1, is_active: true, discount_percent: 10, sku: '', brand: 'Test',
      images: ['  a.jpg  ', 'a.jpg', 'b.jpg', '', 'b.jpg'],
    },
  })
  ok(createProduct.status === 201, 'create product → 201')
  ok(createProduct.data.sku === 'GR-013', 'auto sku GR-013', createProduct.data.sku)
  ok(createProduct.data.sale_price === 450, 'sale price 450', createProduct.data.sale_price)
  ok(JSON.stringify(createProduct.data.images) === JSON.stringify(['a.jpg', 'b.jpg']), 'images cleaned+deduped')
  const updateProduct = await req('PUT', '/products/13', { token: adminToken, body: { price: 600, discount_percent: 50 } })
  ok(updateProduct.status === 200 && updateProduct.data.sale_price === 300 && updateProduct.data.name === 'Test Hoodie',
    'update product price/discount')

  const createCat = await req('POST', '/categories', { token: adminToken, body: { name: 'Hoodies', name_ar: 'هوديات' } })
  ok(createCat.status === 201 && createCat.data.product_count === 0, 'create category → 201')
  ok(/picsum\.photos\/seed\/sv-hoodies/.test(createCat.data.image_url), 'default category image')
  const dupCat = await req('POST', '/categories', { token: adminToken, body: { name: 'Hoodies' } })
  ok(dupCat.status === 409 && dupCat.data.message === 'Category name already exists', 'duplicate category → 409')
  const catInUse = await req('DELETE', '/categories/1', { token: adminToken })
  ok(catInUse.status === 409 && catInUse.data.message === 'Cannot delete a category that still has products', 'delete used category → 409')
  const delCat = await req('DELETE', `/categories/${createCat.data.id}`, { token: adminToken })
  ok(delCat.status === 200, 'delete empty category → 200')

  const adminSettings = await req('GET', '/admin/settings', { token: adminToken })
  ok(adminSettings.status === 200, 'admin get settings')
  const updSettings = await req('PUT', '/admin/settings', {
    token: adminToken,
    body: { shipping_fee: 100, store_name_en: 'Grounded HQ', announcement_enabled: true, support_phone: null },
  })
  ok(updSettings.data.shipping_fee === 100, 'settings shipping_fee updated')
  ok(updSettings.data.store_name_en === 'Grounded HQ', 'settings store name updated')
  ok(updSettings.data.announcement_enabled === true, 'settings announcement_enabled updated')
  const pubSettingsAfter = await req('GET', '/settings')
  ok(pubSettingsAfter.data.shipping_fee === 100, 'public settings reflect update')
  await req('PUT', '/admin/settings', { token: adminToken, body: { shipping_fee: 80, store_name_en: 'Grounded', announcement_enabled: false } })

  const updContent = await req('PUT', '/admin/content', {
    token: adminToken,
    body: { hero: { title1: { en: 'New Title' } }, sections: { faq: false } },
  })
  ok(updContent.data.hero.title1.en === 'New Title', 'content deep merge hero.title1.en')
  ok(updContent.data.hero.title1.ar === 'شبابية' ? true : updContent.data.hero.title1.ar, 'content merge keeps ar', updContent.data.hero.title1.ar)
  ok(updContent.data.sections.faq === false, 'content sections.faq merged')
  ok(updContent.data.hero.badge.en === 'New season · 2026 drops', 'content merge keeps sibling keys')
  const pubContent = await req('GET', '/content')
  ok(pubContent.data.hero.title1.en === 'New Title', 'public content reflects update')

  const checkout = await req('POST', '/payments/checkout', { token: customerToken, body: { order_id: orderId, amount: 100 } })
  ok(checkout.status === 200 && checkout.data.gateway === 'paymob' && checkout.data.url === `/mock-gateway?order=${orderId}`, 'checkout stub')
  const webhook = await req('POST', '/payments/webhook', { body: { order_ref: 123 } })
  ok(webhook.status === 200 && webhook.data.received === true && webhook.data.order_ref === 123, 'public webhook')

  const badReset = await req('POST', '/admin/reset', { token: adminToken, body: { scope: 'everything' } })
  ok(badReset.status === 400 && badReset.data.message === 'Invalid reset scope', 'invalid reset scope → 400')

  const resetOrders = await req('POST', '/admin/reset', { token: adminToken, body: { scope: 'orders' } })
  ok(resetOrders.status === 200 && resetOrders.data.message === 'Orders cleared', 'reset orders')
  const afterResetOrders = await req('GET', '/admin/stats', { token: adminToken })
  ok(afterResetOrders.data.orders_count === 0, 'orders cleared')

  const resetStore = await req('POST', '/admin/reset', { token: adminToken, body: { scope: 'store' } })
  ok(resetStore.status === 200 && resetStore.data.message === 'Store data reset', 'reset store')
  const afterReset = await req('GET', '/admin/stats', { token: adminToken })
  ok(afterReset.data.orders_count === 4 && afterReset.data.products_count === 12 && afterReset.data.customers_count === 2,
    'store reseeded (4 orders, 12 products, 2 users)', afterReset.data)

  const newLogin = await req('POST', '/auth/login', { body: { email: 'admin@grounded.store', password: 'admin123' } })
  ok(newLogin.status === 200, 'admin can log in again after reseed')
  const settingsReset = await req('GET', '/settings')
  ok(settingsReset.data.shipping_fee === 80, 'settings reset to defaults after store reset')

  console.log('\n=== SPA / static ===')
  const spa = await fetch('http://localhost:8080/')
  ok(spa.status === 200 && (await spa.text()).includes('<div id="root"'), 'SPA index served at /')
  const spaRoute = await fetch('http://localhost:8080/shop/t-shirts')
  ok(spaRoute.status === 200, 'SPA fallback for client route')

  console.log(`\n======== RESULT: ${passed} passed, ${failed} failed ========`)
  if (failed > 0) {
    console.log('Failures:')
    for (const f of failures) console.log('  - ' + f)
    process.exit(1)
  }
}

run().catch(err => {
  console.error('Smoke test crashed:', err)
  process.exit(1)
})
