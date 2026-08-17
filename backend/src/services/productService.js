'use strict'

const db = require('../db')
const { notFound } = require('../errors')
const { round2 } = require('../utils')

const PRODUCT_COLS = `
  p.id, p.name, p.description, p.price, p.stock_quantity, p.category_id, p.image_url,
  p.is_active, p.discount_percent, p.sku, p.brand, p.material, p.color, p.sizes, p.tags,
  p.cost_price, p.reorder_level, p.featured, p.created_at, p.rating, p.reviews_count, p.images_json,
  c.name AS cat_name, c.name_ar AS cat_name_ar`

const PRODUCT_FROM = `
  FROM products p LEFT JOIN categories c ON p.category_id = c.id`

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
    images: readList(product.images_json),
    created_at: product.created_at,
  }
}

async function findById(id) {
  return db.get(`SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE p.id = ?`, [id])
}

function buildSearchSql({ activeOnly, categoryId, pattern, minPrice, maxPrice }) {
  const args = []
  let sql = `SELECT ${PRODUCT_COLS} ${PRODUCT_FROM} WHERE 1=1`
  if (activeOnly) sql += ` AND p.is_active = ${db.boolLit(true)}`
  if (categoryId !== null && categoryId !== undefined) {
    sql += ' AND p.category_id = ?'
    args.push(categoryId)
  }
  if (minPrice !== null && minPrice !== undefined) {
    sql += ' AND p.price >= ?'
    args.push(minPrice)
  }
  if (maxPrice !== null && maxPrice !== undefined) {
    sql += ' AND p.price <= ?'
    args.push(maxPrice)
  }
  if (pattern) {
    sql += ` AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ? OR LOWER(p.tags) LIKE ?
      OR LOWER(p.brand) LIKE ? OR LOWER(p.material) LIKE ?)`
    for (let i = 0; i < 5; i++) args.push(pattern)
  }
  return { sql, args }
}

async function list(activeOnly, categoryId, keyword, sort, page, size, minPrice, maxPrice) {
  const orderBy = sort === 'price_asc' ? 'p.price ASC' : sort === 'price_desc' ? 'p.price DESC' : 'p.created_at DESC'
  const pattern = keyword === null || keyword === undefined || String(keyword).trim() === ''
    ? null
    : `%${String(keyword).trim().toLowerCase()}%`
  const base = buildSearchSql({ activeOnly, categoryId, pattern, minPrice, maxPrice })

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
  return {
    content: rows.map(toDto),
    totalElements: total,
    totalPages,
    page,
    size,
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
  return toDto(await findById(lastId))
}

async function update(id, request) {
  const product = await findById(id)
  if (!product) throw notFound('Product not found')
  await apply(product, request || {})
  await updateRow(product)
  return toDto(await findById(id))
}

async function softDelete(id) {
  const product = await findById(id)
  if (!product) throw notFound('Product not found')
  product.is_active = !product.is_active
  await updateRow(product)
  return toDto(await findById(id))
}

async function apply(product, request) {
  if (request.name !== null && request.name !== undefined) product.name = String(request.name)
  if (request.description !== null && request.description !== undefined) product.description = String(request.description)
  if (request.price !== null && request.price !== undefined) product.price = Number(request.price)
  if (request.stock_quantity !== null && request.stock_quantity !== undefined) product.stock_quantity = Number(request.stock_quantity)
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
  if (request.cost_price !== null && request.cost_price !== undefined) product.cost_price = Number(request.cost_price)
  if (request.reorder_level !== null && request.reorder_level !== undefined) product.reorder_level = Number(request.reorder_level)
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

module.exports = { list, get, create, update, softDelete, toDto, findById, findLowStock, effectivePrice }
