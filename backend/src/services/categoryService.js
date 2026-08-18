'use strict'

const db = require('../db')
const { badRequest, conflict, notFound } = require('../errors')
const { emit } = require('../realtime')
const audit = require('./auditService')

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

function imageFrom(name) {
  return `https://picsum.photos/seed/sv-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}/400/300`
}

async function create(request) {
  const body = request || {}
  const name = body.name === null || body.name === undefined ? null : String(body.name)
  const nameAr = body.name_ar === null || body.name_ar === undefined ? null : String(body.name_ar)
  if (name === null || String(name).trim() === '') {
    throw badRequest('name: must not be blank')
  }
  const exists = await db.get('SELECT COUNT(*) AS cnt FROM categories WHERE LOWER(name) = LOWER(?)', [name.trim()])
  if (Number(exists.cnt) > 0) {
    throw conflict('Category name already exists')
  }
  const imageUrl = body.image_url && String(body.image_url).trim() !== ''
    ? String(body.image_url)
    : imageFrom(name)
  let lastId
  try {
    const result = await db.run(
      'INSERT INTO categories (name, name_ar, image_url) VALUES (?, ?, ?)',
      [name.trim(), nameAr, imageUrl],
    )
    lastId = result.lastId
  } catch (err) {
    if (err && (err.code === '23505' || String(err.code || '').includes('SQLITE_CONSTRAINT'))) {
      throw conflict('Category name already exists')
    }
    throw err
  }
  const row = { id: lastId, name: name.trim(), name_ar: nameAr, image_url: imageUrl, product_count: 0 }
  emit('categories')
  audit.log('create', 'category', lastId, { name: name.trim() })
  return toDto(row)
}

async function update(id, request) {
  const category = await db.get('SELECT id, name, name_ar, image_url FROM categories WHERE id = ?', [id])
  if (!category) throw notFound('Category not found')
  const body = request || {}
  const name = body.name === null || body.name === undefined || String(body.name).trim() === ''
    ? category.name
    : String(body.name).trim()
  const nameAr = body.name_ar === null || body.name_ar === undefined ? category.name_ar : String(body.name_ar)
  const imageUrl = body.image_url && String(body.image_url).trim() !== '' ? String(body.image_url) : category.image_url

  if (name.toLowerCase() !== category.name.toLowerCase()) {
    const exists = await db.get(
      'SELECT COUNT(*) AS cnt FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?',
      [name, id],
    )
    if (Number(exists.cnt) > 0) throw conflict('Category name already exists')
  }

  await db.run(
    'UPDATE categories SET name = ?, name_ar = ?, image_url = ? WHERE id = ?',
    [name, nameAr, imageUrl, id],
  )
  emit('categories')
  audit.log('update', 'category', id, { name })
  return toDto(await db.get(
    `SELECT c.id, c.name, c.name_ar, c.image_url,
       (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = ${db.boolLit(true)}) AS product_count
     FROM categories c WHERE c.id = ?`,
    [id],
  ))
}

async function remove(id) {
  const category = await db.get('SELECT id, name, name_ar, image_url FROM categories WHERE id = ?', [id])
  if (!category) throw notFound('Category not found')
  const used = await db.get('SELECT COUNT(*) AS cnt FROM products WHERE category_id = ?', [id])
  if (Number(used.cnt) > 0) {
    throw conflict('Cannot delete a category that still has products')
  }
  await db.run('DELETE FROM categories WHERE id = ?', [id])
  emit('categories')
  audit.log('delete', 'category', id, { name: category.name })
}

module.exports = { list, create, update, remove, toDto }