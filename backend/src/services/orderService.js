'use strict'

const db = require('../db')
const settingsService = require('./settingsService')
const productService = require('./productService')
const { badRequest, conflict, notFound } = require('../errors')
const { round2 } = require('../utils')

const ALLOWED_PAYMENTS = ['COD', 'VISA', 'VODAFONE_CASH', 'INSTAPAY']
const VALID_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

const ORDER_COLS = `
  o.id, o.user_id, o.total_amount, o.status, o.payment_method, o.shipping_address,
  o.phone_number, o.created_at, o.shipping_fee, o.paid_at, o.payment_proof, o.payment_proof_at,
  o.status_history, u.full_name AS user_name, u.email AS user_email`

async function findById(id) {
  const order = await db.get(`
    SELECT ${ORDER_COLS}
    FROM orders o JOIN users u ON o.user_id = u.id
    WHERE o.id = ?`, [id])
  if (!order) return null
  order.items = await db.q(`
    SELECT i.id, i.order_id, i.product_id, i.quantity, i.unit_price, i.product_image,
      p.name AS product_name, p.image_url AS product_image_url
    FROM order_items i JOIN products p ON i.product_id = p.id
    WHERE i.order_id = ? ORDER BY i.id`, [id])
  return order
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

async function findAll() {
  const orders = await db.q(`
    SELECT ${ORDER_COLS}
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC`)
  for (const order of orders) {
    order.items = await loadItems(order.id)
  }
  return orders
}

async function loadItems(orderId) {
  return db.q(`
    SELECT i.id, i.order_id, i.product_id, i.quantity, i.unit_price, i.product_image,
      p.name AS product_name, p.image_url AS product_image_url
    FROM order_items i JOIN products p ON i.product_id = p.id
    WHERE i.order_id = ? ORDER BY i.id`, [orderId])
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
  const settings = await settingsService.get()
  const shippingFee = Number(settings.shipping_fee) || 0

  return db.txn(async tx => {
    const items = []
    let total = 0
    for (const itemRequest of body.items) {
      if (itemRequest.product_id === null || itemRequest.product_id === undefined ||
          itemRequest.quantity === null || itemRequest.quantity === undefined) {
        throw badRequest('Invalid order item')
      }
      const product = await tx.get(`
        SELECT p.id, p.name, p.price, p.discount_percent, p.is_active, p.stock_quantity, p.image_url
        FROM products p WHERE p.id = ?`, [itemRequest.product_id])
      if (!product) {
        throw notFound(`Product #${itemRequest.product_id} is not available`)
      }
      if (!product.is_active) {
        throw notFound(`Product "${product.name}" is not available`)
      }
      const qty = Number(itemRequest.quantity)
      if (qty < 1) throw badRequest('Invalid quantity')
      if (qty > Number(product.stock_quantity)) {
        throw conflict(`Only ${product.stock_quantity} in stock for "${product.name}"`)
      }
      await tx.run('UPDATE products SET stock_quantity = ? WHERE id = ?', [Number(product.stock_quantity) - qty, product.id])
      const unit = productService.effectivePrice(product)
      items.push({ product_id: product.id, quantity: qty, unit_price: unit, product_image: product.image_url })
      total = round2(total + unit * qty)
    }

    const createdAt = db.nowIso()
    const history = writeHistory([{ status: 'PENDING', at: createdAt }])
    const { lastId } = await tx.run(`
      INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address,
        phone_number, created_at, shipping_fee, paid_at, payment_proof, payment_proof_at, status_history)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [user.id, total, 'PENDING', payment, String(body.shipping_address), String(body.phone_number),
      createdAt, shippingFee, null, null, null, history],
    )
    for (const item of items) {
      await tx.run(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_image) VALUES (?, ?, ?, ?, ?)',
        [lastId, item.product_id, item.quantity, item.unit_price, item.product_image],
      )
    }
    return toDto(await findById(lastId))
  })
}

async function myOrders(user) {
  const orders = await findAllByUserId(user.id)
  return orders.map(toDto)
}

async function allOrders() {
  const orders = await findAll()
  return orders.map(toDto)
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
  const order = await findById(id)
  if (!order) throw notFound('Order not found')

  if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
    for (const item of order.items) {
      const product = await db.get(
        'SELECT id, is_active, stock_quantity FROM products WHERE id = ?',
        [item.product_id],
      )
      if (product && product.is_active) {
        await db.run('UPDATE products SET stock_quantity = ? WHERE id = ?', [
          Number(product.stock_quantity) + Number(item.quantity),
          product.id,
        ])
      }
    }
  }
  if (status === 'PAID' && order.paid_at === null) {
    order.paid_at = db.nowIso()
  } else if (status !== 'PAID') {
    order.paid_at = null
  }
  order.status = status
  pushHistory(order, status)
  await db.run(`
    UPDATE orders SET total_amount = ?, status = ?, payment_method = ?, shipping_address = ?,
      phone_number = ?, shipping_fee = ?, paid_at = ?, payment_proof = ?, payment_proof_at = ?,
      status_history = ? WHERE id = ?`,
  [order.total_amount, order.status, order.payment_method, order.shipping_address,
    order.phone_number, order.shipping_fee, order.paid_at, order.payment_proof,
    order.payment_proof_at, order.status_history, order.id],
  )
  return toDto(await findById(id))
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
  order.status = 'PAID'
  order.paid_at = db.nowIso()
  pushHistory(order, 'PAID')
  await db.run(`
    UPDATE orders SET total_amount = ?, status = ?, payment_method = ?, shipping_address = ?,
      phone_number = ?, shipping_fee = ?, paid_at = ?, payment_proof = ?, payment_proof_at = ?,
      status_history = ? WHERE id = ?`,
  [order.total_amount, order.status, order.payment_method, order.shipping_address,
    order.phone_number, order.shipping_fee, order.paid_at, order.payment_proof,
    order.payment_proof_at, order.status_history, order.id],
  )
  return toDto(await findById(id))
}

async function saveProof(user, id, proof) {
  const order = await findById(id)
  if (!order) throw notFound('Order not found')
  if (user.role !== 'ROLE_ADMIN' && Number(order.user_id) !== Number(user.id)) {
    throw notFound('Order not found')
  }
  if (!proof || !String(proof).startsWith('data:image/')) {
    throw badRequest('Invalid proof image')
  }
  order.payment_proof = String(proof)
  order.payment_proof_at = db.nowIso()
  await db.run('UPDATE orders SET payment_proof = ?, payment_proof_at = ? WHERE id = ?',
    [order.payment_proof, order.payment_proof_at, order.id])
  return toDto(await findById(id))
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

module.exports = { create, myOrders, allOrders, getById, updateStatus, pay, saveProof, toDto }
