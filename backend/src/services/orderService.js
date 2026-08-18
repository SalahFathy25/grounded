'use strict'

const db = require('../db')
const settingsService = require('./settingsService')
const productService = require('./productService')
const { badRequest, conflict, notFound } = require('../errors')
const { round2 } = require('../utils')
const { emit } = require('../realtime')
const audit = require('./auditService')

function isUniqueViolation(err) {
  const msg = String(err?.code || err?.message || err)
  return msg.includes('23505') || /unique|constraint/i.test(msg)
}

const ALLOWED_PAYMENTS = ['COD', 'VISA', 'VODAFONE_CASH', 'INSTAPAY']
const VALID_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

/** Which statuses each status may transition to (server-side enforcement).
 *  CANCELLED and DELIVERED are terminal, so cancelling can never double-restore
 *  stock by re-activating an order. */
const TRANSITIONS = {
  PENDING: ['PAID', 'SHIPPED', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

const ORDER_COLS = `
  o.id, o.user_id, o.total_amount, o.status, o.payment_method, o.shipping_address,
  o.phone_number, o.created_at, o.shipping_fee, o.paid_at, o.payment_proof, o.payment_proof_at,
  o.status_history, u.full_name AS user_name, u.email AS user_email`

async function findById(id) {
  return findByIdWith(db, id)
}

async function findAllByUserId(userId) {
  const orders = await db.q(`
    SELECT ${ORDER_COLS}
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE o.user_id = ? ORDER BY o.created_at DESC`, [userId])
  for (const order of orders) {
    order.items = await loadItems(order.id)
  }
  return orders
}

/** Paged admin order listing with optional status filter. */
async function findAll({ page = 0, size = 50, status = null } = {}) {
  const where = status ? 'WHERE o.status = ?' : ''
  const args = status ? [status] : []
  const orders = await db.q(`
    SELECT ${ORDER_COLS}
    FROM orders o JOIN users u ON o.user_id = u.id
    ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`, [...args, size, page * size])
  for (const order of orders) {
    order.items = await loadItems(order.id)
  }
  const countRow = await db.get(`SELECT COUNT(*) AS cnt FROM orders o ${where}`, args)
  const total = Number(countRow.cnt)
  return {
    content: orders.map(toDto),
    totalElements: total,
    totalPages: size <= 0 ? 0 : Math.ceil(total / size),
    page,
    size,
  }
}

/** Most recent orders (used by the admin dashboard) — limited in SQL. */
async function findRecent(limit) {
  const orders = await db.q(`
    SELECT ${ORDER_COLS}
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT ?`, [limit])
  for (const order of orders) {
    order.items = await loadItems(order.id)
  }
  return orders.map(toDto)
}

async function loadItems(orderId) {
  return db.q(`
    SELECT i.id, i.order_id, i.product_id, i.quantity, i.unit_price, i.product_image,
      p.name AS product_name, p.image_url AS product_image_url
    FROM order_items i JOIN products p ON i.product_id = p.id
    WHERE i.order_id = ? ORDER BY i.id`, [orderId])
}

/** findById / loadItems against any executor (db or a transaction handle). */
async function findByIdWith(executor, id) {
  const order = await executor.get(`
    SELECT ${ORDER_COLS}
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE o.id = ?`, [id])
  if (!order) return null
  order.items = await executor.q(`
    SELECT i.id, i.order_id, i.product_id, i.quantity, i.unit_price, i.product_image,
      p.name AS product_name, p.image_url AS product_image_url
    FROM order_items i JOIN products p ON i.product_id = p.id
    WHERE i.order_id = ? ORDER BY i.id`, [id])
  return order
}

function parseHistory(json) {
  if (!json || !json.trim()) return []
  try {
    const list = JSON.parse(json)
    return Array.isArray(list) ? list : []
  } catch (err) {
    return []
  }
}

function readHistory(order) {
  const raw = parseHistory(order.status_history)
  const out = []
  for (const entry of raw) {
    if (entry && entry.status && entry.at) {
      out.push({ status: String(entry.status), at: String(entry.at) })
    }
  }
  return out
}

function writeHistory(history) {
  return JSON.stringify(history.map(entry => ({ status: entry.status, at: entry.at })))
}

function pushHistory(order, status) {
  const history = readHistory(order).filter(entry => entry.status !== status)
  history.push({ status, at: db.nowIso() })
  order.status_history = writeHistory(history)
}

async function create(user, request) {
  const body = request || {}
  if (!Array.isArray(body.items) || body.items.length === 0) {
    throw badRequest('Order must contain at least one item')
  }
  const payment = body.payment_method ? String(body.payment_method) : 'COD'
  if (!ALLOWED_PAYMENTS.includes(payment)) {
    throw badRequest('Invalid payment method')
  }
  if (body.shipping_address === null || body.shipping_address === undefined || String(body.shipping_address).trim() === '') {
    throw badRequest('shipping_address: must not be blank')
  }
  if (body.phone_number === null || body.phone_number === undefined || String(body.phone_number).trim() === '') {
    throw badRequest('phone_number: must not be blank')
  }
  let idemKey = null
  if (body.idempotency_key !== null && body.idempotency_key !== undefined && String(body.idempotency_key) !== '') {
    idemKey = String(body.idempotency_key)
    if (idemKey.length > 100 || !/^[A-Za-z0-9._-]+$/.test(idemKey)) {
      throw badRequest('idempotency_key: invalid format')
    }
  }
  const settings = await settingsService.get()
  const shippingFee = Number(settings.shipping_fee) || 0

  try {
    const result = await db.txn(async tx => {
      // Idempotent replay — return the original order without touching stock again.
      if (idemKey) {
        const existing = await tx.get(
          'SELECT id FROM orders WHERE user_id = ? AND idempotency_key = ?',
          [user.id, idemKey],
        )
        if (existing) return { order: toDto(await findByIdWith(tx, existing.id)), replayed: true }
      }

      const items = []
      const seen = new Set()
      let total = 0
      for (const itemRequest of body.items) {
        if (itemRequest.product_id === null || itemRequest.product_id === undefined ||
            itemRequest.quantity === null || itemRequest.quantity === undefined) {
          throw badRequest('Invalid order item')
        }
        const productId = Number(itemRequest.product_id)
        if (!Number.isInteger(productId) || productId <= 0) {
          throw badRequest('Invalid order item')
        }
        if (seen.has(productId)) {
          throw badRequest('Each product may appear only once per order')
        }
        seen.add(productId)
        const qty = Number(itemRequest.quantity)
        if (!Number.isInteger(qty) || qty < 1) {
          throw badRequest('Quantity must be a positive integer')
        }
        const product = await tx.get(`
          SELECT p.id, p.name, p.price, p.discount_percent, p.is_active, p.stock_quantity, p.image_url
          FROM products p WHERE p.id = ?`, [productId])
        if (!product) {
          throw notFound(`Product #${productId} is not available`)
        }
        if (!product.is_active) {
          throw notFound(`Product "${product.name}" is not available`)
        }
        // Atomic, conditional decrement — safe against concurrent orders.
        const update = await tx.run(
          'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
          [qty, productId, qty],
        )
        if (Number(update.changes) === 0) {
          const fresh = await tx.get('SELECT stock_quantity FROM products WHERE id = ?', [productId])
          throw conflict(`Only ${fresh ? fresh.stock_quantity : 0} in stock for "${product.name}"`)
        }
        const unit = productService.effectivePrice(product)
        items.push({ product_id: productId, quantity: qty, unit_price: unit, product_image: product.image_url })
        total = round2(total + unit * qty)
      }

    const createdAt = db.nowIso()
    const history = writeHistory([{ status: 'PENDING', at: createdAt }])
    const { lastId } = await tx.run(`
      INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address,
        phone_number, created_at, shipping_fee, paid_at, payment_proof, payment_proof_at, status_history, idempotency_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, total, 'PENDING', payment, String(body.shipping_address), String(body.phone_number),
      createdAt, shippingFee, null, null, null, history, idemKey],
    )
    for (const item of items) {
      await tx.run(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_image) VALUES (?, ?, ?, ?, ?)',
        [lastId, item.product_id, item.quantity, item.unit_price, item.product_image],
      )
    }
    return { order: toDto(await findById(lastId)), replayed: false }
  })
    if (!result.replayed) emit('orders')
    if (!result.replayed) {
      audit.log('create', 'order', result.order.id, {
        total: result.order.total_amount,
        method: result.order.payment_method,
        status: result.order.status,
      })
    }
    return result
  } catch (err) {
    // Concurrent double-submit with the same key — the unique index wins.
    if (idemKey && isUniqueViolation(err)) {
      const existing = await db.get(
        'SELECT id FROM orders WHERE user_id = ? AND idempotency_key = ?',
        [user.id, idemKey],
      )
      if (existing) return { order: toDto(await findById(existing.id)), replayed: true }
    }
    throw err
  }
}
async function myOrders(user) {
  const orders = await findAllByUserId(user.id)
  return orders.map(toDto)
}

async function allOrders(options) {
  return findAll(options)
}

async function recentOrders(limit) {
  return findRecent(limit)
}

async function getById(user, id) {
  const order = await findById(id)
  if (!order) throw notFound('Order not found')
  if (user.role !== 'ROLE_ADMIN' && Number(order.user_id) !== Number(user.id)) {
    throw notFound('Order not found')
  }
  return toDto(order)
}

async function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) throw badRequest('Invalid status')
  let from
  const updated = await db.txn(async tx => {
    const order = await findByIdWith(tx, id)
    if (!order) throw notFound('Order not found')

    from = order.status
    const allowed = TRANSITIONS[from] || []
    if (!allowed.includes(status)) {
      throw badRequest(`Cannot change order status from ${from} to ${status}`)
    }

    if (status === 'CANCELLED') {
      // Restore stock atomically; restore even for soft-deleted products so
      // inventory is never silently lost. CANCELLED is terminal, so this
      // runs exactly once per order.
      for (const item of order.items) {
        await tx.run(
          'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
          [item.quantity, item.product_id],
        )
      }
    }

    if (status === 'PAID' && order.paid_at === null) {
      order.paid_at = db.nowIso()
    }
    order.status = status
    pushHistory(order, status)
    await tx.run(
      'UPDATE orders SET status = ?, paid_at = ?, status_history = ? WHERE id = ?',
      [order.status, order.paid_at, order.status_history, order.id],
    )
    return toDto(await findByIdWith(tx, id))
  })
  emit('orders')
  audit.log('status_update', 'order', id, { from, to: status })
  return updated
}

async function pay(user, id) {
  const order = await findById(id)
  if (!order) throw notFound('Order not found')
  if (user.role !== 'ROLE_ADMIN' && Number(order.user_id) !== Number(user.id)) {
    throw notFound('Order not found')
  }
  if (order.status === 'CANCELLED') {
    throw conflict('This order is cancelled')
  }
  if (order.payment_method === 'COD') {
    throw badRequest('COD orders are paid on delivery')
  }
  if (order.status !== 'PENDING') {
    throw conflict('This order is not pending')
  }
  order.status = 'PAID'
  order.paid_at = db.nowIso()
  pushHistory(order, 'PAID')
  await db.run(
    'UPDATE orders SET status = ?, paid_at = ?, status_history = ? WHERE id = ?',
    [order.status, order.paid_at, order.status_history, order.id],
  )
  emit('orders')
  audit.log('pay', 'order', id, { method: order.payment_method })
  return toDto(await findById(id))
}

async function saveProof(user, id, proof) {
  const order = await findById(id)
  if (!order) throw notFound('Order not found')
  if (user.role !== 'ROLE_ADMIN' && Number(order.user_id) !== Number(user.id)) {
    throw notFound('Order not found')
  }
  if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
    throw conflict('This order cannot accept a payment proof')
  }
  if (!proof || !/^data:image\/(png|jpe?g|webp|gif|bmp);base64,/i.test(String(proof))) {
    throw badRequest('Invalid proof image')
  }
  if (String(proof).length > 8 * 1024 * 1024) {
    throw badRequest('Proof image is too large')
  }
  order.payment_proof = String(proof)
  order.payment_proof_at = db.nowIso()
  await db.run('UPDATE orders SET payment_proof = ?, payment_proof_at = ? WHERE id = ?',
    [order.payment_proof, order.payment_proof_at, order.id])
  emit('orders')
  audit.log('proof_upload', 'order', id, {})
  return toDto(await findById(id))
}

async function hardDelete(options = {}) {
  let placeholders
  let args = []
  if (options.all) {
    placeholders = '1=1'
  } else {
    const list = Array.isArray(options.ids) ? options.ids.map(Number).filter(Number.isInteger) : []
    if (list.length === 0) throw badRequest('ids: must be a non-empty array of order ids')
    placeholders = `id IN (${list.map(() => '?').join(', ')})`
    args = list
  }
  const countRow = await db.get(`SELECT COUNT(*) AS cnt FROM orders WHERE ${placeholders}`, args)
  await db.txn(async tx => {
    await tx.run(`DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE ${placeholders})`, args)
    await tx.run(`DELETE FROM orders WHERE ${placeholders}`, args)
  })
  emit('orders')
  audit.log('delete', 'order', null, options.all ? { all: true } : { ids: args })
  return { deleted: Number(countRow ? countRow.cnt : 0) }
}

function toDto(order) {
  return {
    id: order.id,
    user_id: Number(order.user_id),
    user_name: order.user_name,
    user_email: order.user_email,
    total_amount: Number(order.total_amount),
    shipping_fee: Number(order.shipping_fee),
    status: order.status,
    payment_method: order.payment_method,
    shipping_address: order.shipping_address,
    phone_number: order.phone_number,
    created_at: order.created_at,
    paid_at: order.paid_at,
    payment_proof: order.payment_proof,
    payment_proof_at: order.payment_proof_at,
    status_history: readHistory(order),
    items: (order.items || []).map(item => ({
      id: item.id,
      product_id: Number(item.product_id),
      product_name: item.product_name,
      product_image: item.product_image || item.product_image_url,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
    })),
  }
}

module.exports = {
  create, myOrders, allOrders, recentOrders, getById, updateStatus, pay, saveProof, hardDelete, toDto,
  VALID_STATUSES, TRANSITIONS,
}
