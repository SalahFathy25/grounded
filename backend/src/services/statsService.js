'use strict'

const db = require('../db')
const productService = require('./productService')
const orderService = require('./orderService')

async function stats() {
  const revenue = await db.get(
    `SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders
     WHERE status IN ('PAID', 'SHIPPED', 'DELIVERED')`,
  )
  const ordersCount = await db.get('SELECT COUNT(*) AS cnt FROM orders')
  const customersCount = await db.get(
    `SELECT COUNT(*) AS cnt FROM users WHERE role = 'ROLE_CUSTOMER'`,
  )
  const productsCount = await db.get(
    `SELECT COUNT(*) AS cnt FROM products WHERE is_active = ${db.boolLit(true)}`,
  )
  const pendingOrders = await db.get(`SELECT COUNT(*) AS cnt FROM orders WHERE status = 'PENDING'`)
  const lowStock = await productService.findLowStock(5, 50)

  const byStatusRows = await db.q('SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status')
  const ordersByStatus = { PENDING: 0, PAID: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 }
  for (const row of byStatusRows) {
    if (row.status in ordersByStatus) ordersByStatus[row.status] = Number(row.cnt)
  }

  const recent = await orderService.recentOrders(5)

  return {
    revenue: Number(revenue.revenue) || 0,
    orders_count: Number(ordersCount.cnt),
    customers_count: Number(customersCount.cnt),
    products_count: Number(productsCount.cnt),
    pending_orders: Number(pendingOrders.cnt),
    low_stock_products: lowStock.map(productService.toDto),
    low_stock_count: lowStock.length,
    recent_orders: recent,
    orders_by_status: ordersByStatus,
  }
}

module.exports = { stats }
