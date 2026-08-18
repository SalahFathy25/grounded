'use strict'

const db = require('../db')
const { badRequest, notFound } = require('../errors')
const { round2 } = require('../utils')
const { emit } = require('../realtime')
const audit = require('./auditService')

const PRODUCT_COLS = `
  p.id, p.name, p.description, p.price, p.stock_quantity, p.category_id, p.image_url,
  p.is_active, p.discount_percent, p.sku, p.brand, p.material, p.color, p.sizes, p.tags,
  p.cost_price, p.reorder_level, p.featured, p.created_at, p.rating, p.reviews_count, p.images_json,
  c.name AS cat_name, c.name_ar AS cat_name_ar`

const PRODUCT_FROM = `
  FROM products p LEFT JOIN categories c ON p.category_id = c.id`

const EFF_PRICE = `CASE WHEN p.discount_percent > 0 AND p.discount_percent < 99
  THEN ROUND(p.price * (1 - p.discount_percent / 100.0), 2) ELSE p.price END`

function readList(json) {
  if (!json || !json.trim()) return []
  try {
    const list = JSON.parse(json)
    return Array.isArray(list) ? list.filter(v => typeof v === 'string') : []
  } catch (err) {
    return []
  }
}

function effectivePrice(product) {
  const disc = Number(product.discount_percent) || 0
  if (disc > 0 && disc < 99) {
    return round2(Number(product.price) * (1 - disc / 100))
  }
  return round2(Number(product.price))
}

function toDto(product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    sale_price: effectivePrice(product),
    stock_quantity: product.stock_quantity,
    category_id: product.category_id === null || product.category_id === undefined ? null : Number(product.category_id),
    category_name: product.cat_name || 'General',
    category_name_ar: product.cat_name_ar === null || product.cat_name_ar === undefined ? null : product.cat_name_ar,
    image_url: product.image_url,
    is_active: Boolean(product.is_active),
    discount_percent: Number(product.discount_percent) || 0,
    sku: product.sku,
    brand: product.brand,
    material: product.material,
    color: product.color,
    sizes: product.sizes,
    tags: product.tags,
    cost_price: product.cost_price === null || product.cost_price === undefined ? null : Number(product.cost_price),
    reorder_level: product.reorder_level,
    featured: Boolean(product.featured),
    rating: Number(product.rating) || 0,
    reviews_count: Number(product.reviews_count) || 0,
    images: readList(product.images_json).filter(img => img !== product.image_url),
    created_at: product.created_at,
  }
}

async function findById(id) {
  return db.get(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.id = ?`, [id])
}

function buildSearchSql({ activeOnly, categoryId, pattern, minPrice, maxPrice, inStock, onSale, minRating, brands }) {
  const args = []
  let sql = `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE 1=1`
  if (activeOnly) sql += ` AND p.is_active = ${db.boolLit(true)}`
  if (categoryId !== null && categoryId !== undefined) {
    sql += ' AND p.category_id = ?'
    args.push(categoryId)
  }
  if (minPrice !== null && minPrice !== undefined) {
    sql += ` AND ${EFF_PRICE} >= ?`
    args.push(minPrice)
  }
  if (maxPrice !== null && maxPrice !== undefined) {
    sql += ` AND ${EFF_PRICE} <= ?`
    args.push(maxPrice)
  }
  if (inStock) sql += ' AND p.stock_quantity > 0'
  if (onSale) sql += ' AND p.discount_percent > 0'
  if (minRating !== null && minRating !== undefined) {
    sql += ' AND p.rating >= ?'
    args.push(minRating)
  }
  if (Array.isArray(brands) && brands.length > 0) {
    sql += ` AND LOWER(p.brand) IN (${brands.map(() => '?').join(', ')})`
    for (const brand of brands) args.push(String(brand).toLowerCase())
  }
  if (pattern) {
    sql += ` AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.tags) LIKE ?
      OR LOWER(p.brand) LIKE ? OR LOWER(p.material) LIKE ?)`
    for (let i = 0; i < 5; i++) args.push(pattern)
  }
  return { sql, args }
}

async function list(options = {}) {
  const {
    activeOnly = true,
    categoryId,
    keyword,
    sort,
    page = 0,
    size = 12,
    minPrice,
    maxPrice,
    inStock = false,
    onSale = false,
    minRating,
    brands,
  } = options
  const orderBy = sort === 'price_asc' ? `${EFF_PRICE} ASC` : sort === 'price_desc' ? `${EFF_PRICE} DESC` : 'p.created_at DESC'
  const pattern = keyword === null || keyword === undefined || String(keyword).trim() === ''
    ? null
    : `%${String(keyword).trim().toLowerCase()}%`
  const base = buildSearchSql({ activeOnly, categoryId, pattern, minPrice, maxPrice, inStock, onSale, minRating, brands })

  const rows = await db.q(
    `${base.sql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...base.args, size, page * size],
  )
  const countRow = await db.get(
    `SELECT COUNT(*) AS cnt ${base.sql.slice(base.sql.indexOf('FROM'))}`,
    base.args,
  )
  const total = Number(countRow.cnt)
  const totalPages = size <= 0 ? 0 : Math.ceil(total / size)

  const priceRow = await db.get(
    `SELECT MIN(${EFF_PRICE}) AS min_price, MAX(${EFF_PRICE}) AS max_price
     FROM products p WHERE p.is_active = ${db.boolLit(true)}`,
  )
  const brandRows = await db.q(
    `SELECT brand FROM (
       SELECT DISTINCT p.brand AS brand FROM products p
       WHERE p.is_active = ${db.boolLit(true)} AND p.brand IS NOT NULL AND TRIM(p.brand) <> ''
     ) t ORDER BY LOWER(brand)`,
  )

  return {
    content: rows.map(toDto),
    totalElements: total,
    totalPages,
    page,
    size,
    facets: {
      brands: brandRows.map(r => r.brand),
      min_price: Number(priceRow && priceRow.min_price) || 0,
      max_price: Number(priceRow && priceRow.max_price) || 0,
    },
  }
}

async function get(id) {
  const product = await findById(id)
  if (!product || !product.is_active) throw notFound('Product not found')
  return toDto(product)
}

async function create(request) {
  const product = {}
  await apply(product, request || {})
  if (product.created_at === undefined) product.created_at = db.nowIso()
  const { lastId } = await insert(product)
  product.id = lastId
  if (!product.sku || String(product.sku).trim() === '') {
    product.sku = `GR-${String(lastId).padStart(3, '0')}`
    await updateRow(product)
  }
  emit('products')
  audit.log('create', 'product', lastId, { name: product.name, sku: product.sku, price: product.price })
  return toDto(await findById(lastId))
}

async function update(id, request) {
  const product = await findById(id)
  if (!product) throw notFound('Product not found')
  await apply(product, request || {})
  await updateRow(product)
  emit('products')
  audit.log('update', 'product', id, { name: product.name, price: product.price, stock: product.stock_quantity })
  return toDto(await findById(id))
}

async function softDelete(id) {
  const product = await findById(id)
  if (!product) throw notFound('Product not found')
  product.is_active = !product.is_active
  await updateRow(product)
  emit('products')
  audit.log(product.is_active ? 'restore' : 'hide', 'product', id, { name: product.name })
  return toDto(await findById(id))
}

async function hardDelete(ids) {
  const list = Array.isArray(ids) ? ids.map(Number).filter(Number.isInteger) : []
  if (list.length === 0) throw badRequest('ids: must be a non-empty array of product ids')
  await db.txn(async tx => {
    const placeholders = list.map(() => '?').join(', ')
    await tx.run(`DELETE FROM order_items WHERE product_id IN (${placeholders})`, list)
    await tx.run(`DELETE FROM products WHERE id IN (${placeholders})`, list)
  })
  emit('products')
  audit.log('delete', 'product', null, { ids: list })
  return { deleted: list.length }
}

async function apply(product, request) {
  if (request.name !== null && request.name !== undefined) {
    if (String(request.name).trim() === '') throw badRequest('name: must not be blank')
    product.name = String(request.name).trim()
  }
  if (request.description !== null && request.description !== undefined) product.description = String(request.description)
  if (request.price !== null && request.price !== undefined) {
    const price = Number(request.price)
    if (!Number.isFinite(price) || price < 0) throw badRequest('price: must be a non-negative number')
    product.price = round2(price)
  }
  if (request.stock_quantity !== null && request.stock_quantity !== undefined) {
    const stock = Number(request.stock_quantity)
    if (!Number.isInteger(stock) || stock < 0) throw badRequest('stock_quantity: must be a non-negative integer')
    product.stock_quantity = stock
  }
  if (request.is_active !== null && request.is_active !== undefined) product.is_active = request.is_active === true || request.is_active === 'true' || request.is_active === 1
  if (request.discount_percent !== null && request.discount_percent !== undefined) {
    const disc = Number(request.discount_percent)
    product.discount_percent = disc < 0 || disc > 99 ? 0 : disc
  }
  if (request.sku !== null && request.sku !== undefined && String(request.sku).trim() !== '') product.sku = String(request.sku)
  if (request.brand !== null && request.brand !== undefined) product.brand = String(request.brand)
  if (request.material !== null && request.material !== undefined) product.material = String(request.material)
  if (request.color !== null && request.color !== undefined) product.color = String(request.color)
  if (request.sizes !== null && request.sizes !== undefined) product.sizes = String(request.sizes)
  if (request.tags !== null && request.tags !== undefined) product.tags = String(request.tags)
  if (request.cost_price !== null && request.cost_price !== undefined) {
    const cost = Number(request.cost_price)
    if (!Number.isFinite(cost) || cost < 0) throw badRequest('cost_price: must be a non-negative number')
    product.cost_price = round2(cost)
  }
  if (request.reorder_level !== null && request.reorder_level !== undefined) {
    const level = Number(request.reorder_level)
    if (!Number.isInteger(level) || level < 0) throw badRequest('reorder_level: must be a non-negative integer')
    product.reorder_level = level
  }
  if (product.reorder_level === undefined) product.reorder_level = 5
  if (request.featured !== null && request.featured !== undefined) product.featured = request.featured === true || request.featured === 'true' || request.featured === 1
  if (request.category_id !== null && request.category_id !== undefined) {
    const category = await db.get('SELECT id FROM categories WHERE id = ?', [Number(request.category_id)])
    if (!category) throw notFound('Category not found')
    product.category_id = Number(request.category_id)
  }
  if (Array.isArray(request.images)) {
    const clean = []
    for (const image of request.images) {
      const trimmed = String(image).trim()
      if (trimmed !== '' && !clean.includes(trimmed)) clean.push(trimmed)
      if (clean.length >= 12) break
    }
    product.images_json = JSON.stringify(clean)
  }
  if (request.image_url !== null && request.image_url !== undefined && String(request.image_url).trim() !== '') {
    product.image_url = String(request.image_url)
  } else if (!product.image_url) {
    product.image_url = `https://picsum.photos/seed/sv-${String(product.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '-')}/800/800`
  }
  if (product.price === null || product.price === undefined) product.price = 0
  if (product.stock_quantity === undefined) product.stock_quantity = 0
  if (product.is_active === undefined) product.is_active = true
  if (product.featured === undefined) product.featured = false
  if (product.rating === undefined) product.rating = 0
  if (product.reviews_count === undefined) product.reviews_count = 0
  if (product.discount_percent === undefined) product.discount_percent = 0
  if (product.images_json === undefined) product.images_json = '[]'
  if (product.name === null || product.name === undefined || String(product.name).trim() === '') {
    throw badRequest('name: must not be blank')
  }
}

async function insert(product) {
  return db.run(`
    INSERT INTO products (name, description, price, stock_quantity, category_id, image_url,
      is_active, discount_percent, sku, brand, material, color, sizes, tags, cost_price,
      reorder_level, featured, created_at, rating, reviews_count, images_json)
    VALUES (?, ?, ?, ?, ?, ?, ${db.boolLit(true)}, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    product.name, product.description, product.price, product.stock_quantity,
    product.category_id === undefined ? null : product.category_id,
    product.image_url,
    product.discount_percent,
    product.sku === undefined ? null : product.sku,
    product.brand === undefined ? null : product.brand,
    product.material === undefined ? null : product.material,
    product.color === undefined ? null : product.color,
    product.sizes === undefined ? null : product.sizes,
    product.tags === undefined ? null : product.tags,
    product.cost_price === undefined ? null : product.cost_price,
    product.reorder_level,
    product.featured ? 1 : 0,
    product.created_at === undefined ? db.nowIso() : product.created_at,
    product.rating, product.reviews_count, product.images_json,
  ])
}

async function updateRow(product) {
  return db.run(`
    UPDATE products SET name = ?, description = ?, price = ?, stock_quantity = ?, category_id = ?,
      image_url = ?, is_active = ?, discount_percent = ?, sku = ?, brand = ?, material = ?,
      color = ?, sizes = ?, tags = ?, cost_price = ?, reorder_level = ?, featured = ?,
      rating = ?, reviews_count = ?, images_json = ?
    WHERE id = ?`,
  [
    product.name, product.description, product.price, product.stock_quantity,
    product.category_id === undefined || product.category_id === null ? null : product.category_id,
    product.image_url,
    product.is_active ? 1 : 0,
    product.discount_percent,
    product.sku === undefined ? null : product.sku,
    product.brand === undefined ? null : product.brand,
    product.material === undefined ? null : product.material,
    product.color === undefined ? null : product.color,
    product.sizes === undefined ? null : product.sizes,
    product.tags === undefined ? null : product.tags,
    product.cost_price === undefined ? null : product.cost_price,
    product.reorder_level,
    product.featured ? 1 : 0,
    product.rating, product.reviews_count, product.images_json,
    product.id,
  ])
}

async function findLowStock(threshold, limit) {
  return db.q(
    `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM}
     WHERE p.is_active = ${db.boolLit(true)} AND p.stock_quantity < ? ORDER BY p.stock_quantity ASC LIMIT ?`,
    [threshold, limit],
  )
}

module.exports = { list, get, create, update, softDelete, hardDelete, toDto, findById, findLowStock, effectivePrice }
