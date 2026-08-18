'use strict'

const bcrypt = require('bcryptjs')
const db = require('../db')
const { badRequest, conflict, forbidden, notFound } = require('../errors')
const { emit } = require('../realtime')
const audit = require('./auditService')

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const VALID_ROLES = ['ROLE_CUSTOMER', 'ROLE_ADMIN', 'ROLE_SUPER_ADMIN']

function toDto(row) {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    created_at: row.created_at,
    orders_count: Number(row.orders_count) || 0,
  }
}

async function list({ page = 0, size = 10, q = '' } = {}) {
  const safePage = Math.max(0, Number(page) || 0)
  const safeSize = Math.min(100, Math.max(1, Number(size) || 10))
  const query = String(q || '').trim().toLowerCase()
  const where = query ? 'WHERE LOWER(full_name) LIKE ? OR LOWER(email) LIKE ?' : ''
  const params = query ? [`%${query}%`, `%${query}%`] : []

  const totalRow = await db.get(`SELECT COUNT(*) AS cnt FROM users ${where}`, params)
  const rows = await db.q(
    `SELECT u.id, u.full_name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count
     FROM users u ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, safeSize, safePage * safeSize],
  )

  return {
    content: rows.map(toDto),
    page: safePage,
    size: safeSize,
    totalElements: Number(totalRow.cnt),
    totalPages: Math.ceil(Number(totalRow.cnt) / safeSize),
  }
}

async function create(request) {
  const body = request || {}
  if (!body.full_name || String(body.full_name).trim() === '') {
    throw badRequest('full_name: must not be blank')
  }
  if (!body.email || !EMAIL_RE.test(String(body.email))) {
    throw badRequest('email: must be a valid email')
  }
  if (!body.password || String(body.password).length < 6) {
    throw badRequest('password: must be at least 6 characters')
  }
  const role = body.role || 'ROLE_CUSTOMER'
  if (!VALID_ROLES.includes(role)) {
    throw badRequest('role: must be one of ' + VALID_ROLES.join(', '))
  }

  const exists = await db.get('SELECT COUNT(*) AS cnt FROM users WHERE LOWER(email) = LOWER(?)', [String(body.email).trim()])
  if (Number(exists.cnt) > 0) {
    throw conflict('This email is already registered')
  }

  const hash = await bcrypt.hash(String(body.password), 10)
  let lastId
  try {
    const result = await db.run(
      'INSERT INTO users (full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [String(body.full_name).trim(), String(body.email).trim(), hash, role, db.nowIso()],
    )
    lastId = result.lastId
  } catch (err) {
    if (err && String(err.code || '').includes('SQLITE_CONSTRAINT')) {
      throw conflict('This email is already registered')
    }
    throw err
  }

  emit('users')
  const row = await db.get(
    `SELECT u.id, u.full_name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count
     FROM users u WHERE u.id = ?`,
    [lastId],
  )
  audit.log('create', 'user', lastId, { email: row.email, role: row.role })
  return toDto(row)
}

async function update(id, request, actorId) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id])
  if (!user) throw notFound('User not found')

  const body = request || {}
  const next = {
    full_name: body.full_name !== undefined ? String(body.full_name).trim() : user.full_name,
    email: body.email !== undefined ? String(body.email).trim() : user.email,
    role: body.role !== undefined ? body.role : user.role,
  }
  if (!next.full_name) throw badRequest('full_name: must not be blank')
  if (!EMAIL_RE.test(next.email)) throw badRequest('email: must be a valid email')
  if (!VALID_ROLES.includes(next.role)) {
    throw badRequest('role: must be one of ' + VALID_ROLES.join(', '))
  }

  if (String(id) === String(actorId) && next.role !== user.role) {
    throw forbidden('You cannot change your own role')
  }
  if (user.role === 'ROLE_SUPER_ADMIN' && next.role !== 'ROLE_SUPER_ADMIN') {
    const others = await db.get(
      "SELECT COUNT(*) AS cnt FROM users WHERE role = 'ROLE_SUPER_ADMIN'",
    )
    if (Number(others.cnt) <= 1) {
      throw forbidden('Cannot demote the last super admin')
    }
  }

  if (next.email !== user.email) {
    const exists = await db.get(
      'SELECT COUNT(*) AS cnt FROM users WHERE LOWER(email) = LOWER(?) AND id != ?',
      [next.email, id],
    )
    if (Number(exists.cnt) > 0) {
      throw conflict('This email is already registered')
    }
  }

  let passwordSql = ''
  let passwordParams = []
  if (body.password !== undefined && body.password !== null && String(body.password) !== '') {
    if (String(body.password).length < 6) {
      throw badRequest('password: must be at least 6 characters')
    }
    passwordSql = ', password = ?'
    passwordParams = [await bcrypt.hash(String(body.password), 10)]
  }

  await db.run(
    `UPDATE users SET full_name = ?, email = ?, role = ?${passwordSql} WHERE id = ?`,
    [...passwordParams, next.full_name, next.email, next.role, id],
  )
  emit('users')

  const row = await db.get(
    `SELECT u.id, u.full_name, u.email, u.role, u.created_at,
            (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count
     FROM users u WHERE u.id = ?`,
    [id],
  )
  audit.log('update', 'user', id, { email: row.email, role: row.role })
  return toDto(row)
}

async function remove(id, actorId) {
  const user = await db.get('SELECT * FROM users WHERE id = ?', [id])
  if (!user) throw notFound('User not found')
  if (String(id) === String(actorId)) {
    throw forbidden('You cannot delete your own account')
  }
  if (user.role === 'ROLE_SUPER_ADMIN') {
    const others = await db.get(
      "SELECT COUNT(*) AS cnt FROM users WHERE role = 'ROLE_SUPER_ADMIN'",
    )
    if (Number(others.cnt) <= 1) {
      throw forbidden('Cannot delete the last super admin')
    }
  }

  await db.txn(async tx => {
    await tx.run(
      'DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)',
      [id],
    )
    await tx.run('DELETE FROM orders WHERE user_id = ?', [id])
    await tx.run('DELETE FROM users WHERE id = ?', [id])
  })

  emit('users')
  audit.log('delete', 'user', id, { email: user.email, role: user.role })
  return { deleted: true, id: Number(id) }
}

module.exports = { list, create, update, remove }