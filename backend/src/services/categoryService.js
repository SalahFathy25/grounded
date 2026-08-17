'use strict'

const db = require('../db')
const { conflict, notFound } = require('../errors')

function toDto(category) {
  return {
    id: category.id,
    name: category.name,
    name_ar: category.name_ar,
    image_url: category.image_url,
    product_count: category.product_count,
  }
}

async function list() {
  const rows = await db.q(`
    SELECT c.id, c.name, c.name_ar, c.image_url,
      (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = ${db.boolLit(true)}) AS product_count
    FROM categories c ORDER BY c.id`)
  return rows.map(toDto)
}

async function create(request) {
  const body = request || {}
  const name = body.name === null || body.name === undefined ? null : String(body.name)
  const nameAr = body.name_ar === null || body.name_ar === undefined ? null : String(body.name_ar)
  if (name !== null) {
    const exists = await db.get('SELECT COUNT(*) AS cnt FROM categories WHERE LOWER(name) = LOWER(?)', [name])
    if (Number(exists.cnt) > 0) {
      throw conflict('Category name already exists')
    }
  }
  const imageUrl = body.image_url && String(body.image_url).trim() !== ''
    ? String(body.image_url)
    : `https://picsum.photos/seed/sv-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/400/300`
  const { lastId } = await db.run(
    'INSERT INTO categories (name, name_ar, image_url) VALUES (?, ?, ?)',
    [name, nameAr, imageUrl],
  )
  const row = { id: lastId, name, name_ar: nameAr, image_url: imageUrl, product_count: 0 }
  return toDto(row)
}

async function remove(id) {
  const category = await db.get('SELECT id, name, name_ar, image_url FROM categories WHERE id = ?', [id])
  if (!category) throw notFound('Category not found')
  const used = await db.get('SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?', [id])
  if (Number(used.cnt) > 0) {
    throw conflict('Cannot delete a category that still has products')
  }
  await db.run('DELETE FROM categories WHERE id = ?', [id])
}

module.exports = { list, create, remove, toDto }
