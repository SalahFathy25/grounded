'use strict'

const db = require('../db')
const productService = require('./productService')
const orderService = require('./orderService')

async function stats() {
  const revenue = await db.get(
    `SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status <> 'CANCELLED'`,
  )
  const ordersCount = await db.get('SELECT COUNT(*) AS cnt FROM orders')
  const customersCount = await db.get('SELECT COUNT(*) AS cnt FROM users')
  const productsCount = await db.get(
    `SELECT COUNT(*) AS cnt FROM products WHERE is_active = ${db.boolLit(true)}`,
  )
  const pendingOrders = await db.get(`SELECT COUNT(*) AS cnt FROM orders WHERE status = 'PENDING'`)
  const lowStock = await productService.findLowStock(5, 6)

  const ordersByStatus = {}
  for (const status of ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']) {
    const row = await db.get('SELECT COUNT(*) AS cnt FROM orders WHERE status = ?', [status])
    ordersByStatus[status] = Number(row.cnt)
  }

  const all = await orderService.allOrders()

  return {
    revenue: Number(revenue.revenue) || 0,
    orders_count: Number(ordersCount.cnt),
    customers_count: Number(customersCount.cnt),
    products_count: Number(productsCount.cnt),
    pending_orders: Number(pendingOrders.cnt),
    low_stock_products: lowStock.map(productService.toDto),
    low_stock_count: lowStock.length,
    recent_orders: all.slice(0, 5),
    orders_by_status: ordersByStatus,
  }
}

module.exports = { stats }
