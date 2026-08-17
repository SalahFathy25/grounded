'use strict'

const db = require('../db')

/** Mirrors PaymentService.checkout in the Spring backend (gateway stub). */
async function checkout(orderId, amount) {
  return {
    order_id: orderId === null || orderId === undefined ? null : Number(orderId),
    amount: amount === null || amount === undefined ? null : Number(amount),
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
