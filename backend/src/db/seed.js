'use strict'

const bcrypt = require('bcryptjs')
const config = require('../config')
const db = require('./index')
const settingsService = require('../services/settingsService')
const contentService = require('../services/contentService')

const SHIPPING_FEE = 80

const catImg = seed => `https://images.unsplash.com/photo-${seed}?w=800&h=600&q=80&auto=format&fit=crop`
const prodImg = seed => `https://images.unsplash.com/photo-${seed}?w=800&q=80&auto=format&fit=crop`

const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100

function effectivePrice(price, discountPercent) {
  const disc = Number(discountPercent) || 0
  if (disc > 0 && disc < 99) {
    return round2(Number(price) * (1 - disc / 100))
  }
  return round2(Number(price))
}

function isoAt(date) {
  return db.iso(date)
}

function daysAgoIso(days) {
  return isoAt(new Date(Date.now() - days * 86400000))
}

const historyJson = entries => JSON.stringify(entries.map(([status, at]) => ({ status, at })))

async function ensureDefaults() {
  await settingsService.ensure()
  await contentService.ensure()
}

async function seed() {
  await ensureDefaults()

  const existing = await db.get('SELECT COUNT(*) AS cnt FROM users')
  if (Number(existing.cnt) > 0) return

  const adminId = await insertUser('Site Admin', 'admin@grounded.com', config.adminInitialPassword, 'ROLE_ADMIN')
  const customerId = await insertUser('Salah Hassan', 'salah@grounded.com', 'salah123', 'ROLE_CUSTOMER')

  const tshirts = await insertCategory('T-Shirts', 'تيشيرتات', catImg('1556909114-f6e7ad7d3136'))
  const shirts = await insertCategory('Shirts', 'قمصان', catImg('1441986300917-64674bd600d8'))
  const pants = await insertCategory('Pants', 'بناطيل', catImg('1542272604-787c3835535d'))

  const p1 = await insertProduct('Oversized Graphic Tee',
    'Boxy oversized fit in 240gsm heavyweight cotton with a screen-printed graphic. The daily driver of every rotation.',
    '349.00', 2, tshirts, '1562157873-818bc0726f68', '20.00', 'GR-001', 'Streetline',
    '240gsm Heavyweight Cotton', 'Black, Off-White', 'S, M, L, XL, XXL', 'streetwear, oversized, graphic', '210.00', 5, true)
  const p2 = await insertProduct('Heavyweight Basic Tee',
    'Pre-shrunk 240gsm jersey cotton with a ribbed collar that keeps its shape. No logos, all quality.',
    '299.00', 95, tshirts, '1521572163474-6864f9cf17ab', null, 'GR-002', 'Grounded',
    '240gsm Pre-Shrunk Jersey Cotton', 'White, Black, Grey', 'XS, S, M, L, XL, XXL', 'basic, essential', null, 5, false)
  const p3 = await insertProduct('Vintage Washed Tee',
    'Garment-dyed and washed for a lived-in look and buttery softness. Fades beautifully wash after wash.',
    '329.00', 60, tshirts, '1556909114-f6e7ad7d3136', null, 'GR-003', 'Washed Co.',
    'Garment-Dyed Cotton', 'Washed Grey, Sage Green', 'S, M, L, XL', 'vintage, washed', null, 5, false)
  const p4 = await insertProduct('Pocket Tee',
    'Classic chest pocket with a drop shoulder seam. A clean staple that layers with anything.',
    '279.00', 70, tshirts, '1523381210434-271e8be1f52b', null, 'GR-004', 'Grounded',
    '180gsm Cotton', 'Navy, White', 'S, M, L, XL, XXL', 'classic, staple', null, 5, false)
  const p5 = await insertProduct('Flannel Overshirt',
    'Brushed flannel with an oversized cut — wear it open over a tee or buttoned up. The perfect layering piece.',
    '649.00', 35, shirts, '1551537482-f2075a1d41f2', null, 'GR-005', 'Urban Accent',
    'Brushed Flannel Cotton', 'Red-Black Plaid', 'M, L, XL', 'layering, flannel', null, 5, false)
  const p6 = await insertProduct('Denim Overshirt',
    'Heavy 12oz denim overshirt with corozo buttons and double-stitched seams. Built to break in over years.',
    '799.00', 28, shirts, '1604176354204-9268737828e4', null, 'GR-006', 'Denimora',
    '12oz Denim', 'Mid-Wash Blue', 'S, M, L, XL', 'denim, overshirt', null, 5, false)
  const p7 = await insertProduct('Oxford Slim Shirt',
    'Wrinkle-resistant oxford cotton with a slim modern cut and mother-of-pearl buttons.',
    '549.00', 45, shirts, '1596755094514-f87e34085b2c', null, 'GR-007', 'Tailored Co.',
    'Wrinkle-Resistant Oxford Cotton', 'White, Powder Blue', 'M, L, XL', 'oxford, office', null, 5, false)
  const p8 = await insertProduct('Baggy Cargo Pants',
    'Relaxed baggy fit with six functional cargo pockets, adjustable hem drawcords, and a tapered leg.',
    '549.00', 55, pants, '1514989940723-e8e51635b782', null, 'GR-008', 'Cargo Lab',
    'Cotton Twill', 'Olive, Black', 'M, L, XL', 'cargo, baggy', null, 5, true)
  const p9 = await insertProduct('Wide-Leg Denim',
    'Raw-edge wide-leg jeans in 13oz stretch denim. High rise, drop pockets, and a clean drape.',
    '699.00', 4, pants, '1542272604-787c3835535d', '25.00', 'GR-009', 'Denimora',
    '13oz Stretch Denim', 'Indigo', 'M, L, XL', 'wide-leg, jeans', null, 5, false)
  const p10 = await insertProduct('Jogger Sweatpants',
    'Fleece-lined joggers with a cuffed hem, zippered pockets, and an adjustable waistband.',
    '449.00', 25, pants, '1594633312681-425c7b97ccd1', null, 'GR-010', 'ComfortWear',
    'Fleece-Backed Cotton', 'Grey, Black', 'S, M, L, XL', 'joggers, lounge', null, 5, false)
  const p11 = await insertProduct('Chino Pants',
    'Stretch twill chinos with a slim taper and permanent crease — smart enough for uni, comfy for the streets.',
    '429.00', 50, pants, '1485968579580-b6d095142e6e', null, 'GR-011', 'Tailored Co.',
    'Stretch Twill', 'Beige, Navy', '30, 32, 34, 36', 'chinos, smart', null, 5, false)
  const p12 = await insertProduct('Cargo Shorts',
    'Breathable cotton-twill cargo shorts with four zip pockets and a below-knee cut for hot summer days.',
    '379.00', 4, pants, '1560243563-062bfc001d68', '10.00', 'GR-012', 'Trail Co.',
    'Cotton Twill', 'Khaki', 'M, L, XL', 'shorts, summer', null, 5, false)

  await seedOrder(customerId, 'PENDING', 'VODAFONE_CASH', 1,
    [[p2, 1], [p10, 1]])
  await seedOrder(customerId, 'SHIPPED', 'VISA', 6,
    [[p5, 1], [p8, 1]])
  await seedOrder(customerId, 'DELIVERED', 'INSTAPAY', 18,
    [[p9, 1], [p4, 1]])
  await seedOrder(customerId, 'CANCELLED', 'COD', 25,
    [[p7, 2]])
}

async function insertUser(fullName, email, password, role) {
  const hash = await bcrypt.hash(password, 10)
  const { lastId } = await db.run(
    'INSERT INTO users (full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
    [fullName, email, hash, role, db.nowIso()],
  )
  return lastId
}

async function insertCategory(name, nameAr, imageUrl) {
  const { lastId } = await db.run(
    'INSERT INTO categories (name, name_ar, image_url) VALUES (?, ?, ?)',
    [name, nameAr, imageUrl],
  )
  return lastId
}

async function insertProduct(name, description, price, stock, categoryId, seed,
                             discountPercent, sku, brand, material, color, sizes, tags,
                             costPrice, reorderLevel, featured) {
  const { lastId } = await db.run(`
    INSERT INTO products (name, description, price, stock_quantity, category_id, image_url,
      is_active, discount_percent, sku, brand, material, color, sizes, tags, cost_price,
      reorder_level, featured, created_at, rating, reviews_count, images_json)
    VALUES (?, ?, ?, ?, ?, ?, ${db.boolLit(true)}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [name, description, Number(price), stock, categoryId, prodImg(seed),
    discountPercent === null ? 0 : Number(discountPercent), sku, brand, material, color, sizes, tags,
    costPrice === null ? null : Number(costPrice), reorderLevel, featured ? 1 : 0,
    db.nowIso(), 0, 0, '[]'],
  )
  return lastId
}

async function seedOrder(userId, status, paymentMethod, daysAgo, items) {
  const createdAt = daysAgoIso(daysAgo)
  const paidAt = (status === 'SHIPPED' || status === 'DELIVERED') ? createdAt : null

  const history = [['PENDING', createdAt]]
  if (status === 'SHIPPED' || status === 'DELIVERED') history.push(['PAID', createdAt])
  if (status !== 'PENDING' && status !== 'CANCELLED') history.push([status, createdAt])
  if (status === 'CANCELLED') history.push(['CANCELLED', createdAt])

  let total = 0
  const rows = []
  for (const [productId, qty] of items) {
    const product = await db.get('SELECT price, discount_percent, image_url FROM products WHERE id = ?', [productId])
    const unit = effectivePrice(product.price, product.discount_percent)
    total = round2(total + unit * qty)
    rows.push({ productId, qty, unit, image: product.image_url })
  }

  const { lastId: orderId } = await db.run(`
    INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address,
      phone_number, created_at, shipping_fee, paid_at, payment_proof, payment_proof_at, status_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [userId, total, status, paymentMethod, '12 El Nasr St, Maadi, Cairo', '+20 100 123 4567',
    createdAt, SHIPPING_FEE, paidAt, null, null, historyJson(history)],
  )

  for (const row of rows) {
    await db.run(
      'INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_image) VALUES (?, ?, ?, ?, ?)',
      [orderId, row.productId, row.qty, row.unit, row.image],
    )
  }
}

module.exports = { seed, ensureDefaults }
