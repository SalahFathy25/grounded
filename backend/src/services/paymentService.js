'use strict'

const db = require('../db')
const { badRequest, notFound } = require('../errors')
const { round2 } = require('../utils')

/** Mirrors PaymentService.checkout in the Spring backend (gateway stub).
 *  Validates the order exists, belongs to the caller, and that the amount
 *  matches the server-computed total — never trust a client-supplied amount. */
async function checkout(user, orderId, amount) {
  if (orderId === null || orderId === undefined) {
    throw badRequest('order_id is required')
  }
  const order = await db.get(
    'SELECT id, user_id, total_amount, shipping_fee FROM orders WHERE id = ?',
    [orderId],
  )
  if (!order) throw notFound('Order not found')
  if (user.role !== 'ROLE_ADMIN' && Number(order.user_id) !== Number(user.id)) {
    throw notFound('Order not found')
  }
  const expected = round2(Number(order.total_amount) + (Number(order.shipping_fee) || 0))
  const requested = amount === null || amount === undefined ? Number.NaN : Number(amount)
  if (!Number.isFinite(requested) || Math.abs(requested - expected) > 0.01) {
    throw badRequest(`amount must equal ${expected}`)
  }
  return {
    order_id: Number(orderId),
    amount: expected,
    gateway: 'paymob',
    url: `/mock-gateway?order=${orderId}`,
  }
}

/** Public webhook entry point (signature verification is a TODO seam). */
async function handleWebhook(payload) {
  const orderRef = payload && payload.order_ref !== undefined ? payload.order_ref : null
  return { received: true, order_ref: orderRef }
}

module.exports = { checkout, handleWebhook }
