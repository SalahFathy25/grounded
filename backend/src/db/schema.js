'use strict'

const db = require('./index')

const dialect = db.dialect

function usersTable() {
  if (dialect === 'pg') {
    return `CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      created_at TIMESTAMP NOT NULL
    )`
  }
  return `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`
}

function categoriesTable() {
  if (dialect === 'pg') {
    return `CREATE TABLE IF NOT EXISTS categories (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      name_ar VARCHAR(120),
      image_url VARCHAR(500)
    )`
  }
  return `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    name_ar TEXT,
    image_url TEXT
  )`
}

function productsTable() {
  if (dialect === 'pg') {
    return `CREATE TABLE IF NOT EXISTS products (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      stock_quantity INT NOT NULL DEFAULT 0,
      category_id BIGINT,
      image_url VARCHAR(500) NOT NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
      sku VARCHAR(50),
      brand VARCHAR(100),
      material VARCHAR(100),
      color VARCHAR(200),
      sizes VARCHAR(200),
      tags VARCHAR(300),
      cost_price DECIMAL(10,2),
      reorder_level INT NOT NULL DEFAULT 5,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP NOT NULL,
      rating DOUBLE PRECISION DEFAULT 0,
      reviews_count INT NOT NULL DEFAULT 0,
      images_json TEXT,
      CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
    )`
  }
  return `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category_id INTEGER,
    image_url TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    discount_percent REAL NOT NULL DEFAULT 0,
    sku TEXT,
    brand TEXT,
    material TEXT,
    color TEXT,
    sizes TEXT,
    tags TEXT,
    cost_price REAL,
    reorder_level INTEGER NOT NULL DEFAULT 5,
    featured INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    rating REAL DEFAULT 0,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    images_json TEXT,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`
}

function ordersTable() {
  if (dialect === 'pg') {
    return `CREATE TABLE IF NOT EXISTS orders (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(30) NOT NULL,
      payment_method VARCHAR(20) NOT NULL,
      shipping_address TEXT NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      created_at TIMESTAMP NOT NULL,
      shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      paid_at TIMESTAMP,
      payment_proof TEXT,
      payment_proof_at TIMESTAMP,
      status_history TEXT,
      idempotency_key VARCHAR(100),
      CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
    )`
  }
  return `CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    created_at TEXT NOT NULL,
    shipping_fee REAL NOT NULL DEFAULT 0,
    paid_at TEXT,
    payment_proof TEXT,
    payment_proof_at TEXT,
    status_history TEXT,
    idempotency_key TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`
}

function orderItemsTable() {
  if (dialect === 'pg') {
    return `CREATE TABLE IF NOT EXISTS order_items (
      id BIGSERIAL PRIMARY KEY,
      order_id BIGINT NOT NULL,
      product_id BIGINT NOT NULL,
      quantity INT NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      product_image VARCHAR(500),
      CONSTRAINT fk_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
      CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products(id)
    )`
  }
  return `CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    product_image TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`
}

function settingsTable() {
  if (dialect === 'pg') {
    return `CREATE TABLE IF NOT EXISTS store_settings (
      id BIGINT PRIMARY KEY,
      store_name_en VARCHAR(120),
      store_name_ar VARCHAR(120),
      tagline_en VARCHAR(500),
      tagline_ar VARCHAR(500),
      announcement_en VARCHAR(500),
      announcement_ar VARCHAR(500),
      announcement_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
      vodafone_number VARCHAR(60),
      instapay_number VARCHAR(60),
      support_phone VARCHAR(40),
      support_email VARCHAR(150),
      instagram_url VARCHAR(300),
      facebook_url VARCHAR(300),
      tiktok_url VARCHAR(300),
      updated_at TIMESTAMP
    )`
  }
  return `CREATE TABLE IF NOT EXISTS store_settings (
    id INTEGER PRIMARY KEY,
    store_name_en TEXT,
    store_name_ar TEXT,
    tagline_en TEXT,
    tagline_ar TEXT,
    announcement_en TEXT,
    announcement_ar TEXT,
    announcement_enabled INTEGER NOT NULL DEFAULT 0,
    shipping_fee REAL NOT NULL DEFAULT 0,
    vodafone_number TEXT,
    instapay_number TEXT,
    support_phone TEXT,
    support_email TEXT,
    instagram_url TEXT,
    facebook_url TEXT,
    tiktok_url TEXT,
    updated_at TEXT
  )`
}

function contentTable() {
  if (dialect === 'pg') {
    return `CREATE TABLE IF NOT EXISTS store_content (
      id BIGINT PRIMARY KEY,
      content_json TEXT NOT NULL,
      updated_at TIMESTAMP
    )`
  }
  return `CREATE TABLE IF NOT EXISTS store_content (
    id INTEGER PRIMARY KEY,
    content_json TEXT NOT NULL,
    updated_at TEXT
  )`
}

function auditLogsTable() {
  if (dialect === 'pg') {
    return `CREATE TABLE IF NOT EXISTS audit_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_id BIGINT,
      actor_email VARCHAR(150),
      actor_role VARCHAR(20),
      action VARCHAR(40) NOT NULL,
      resource VARCHAR(40) NOT NULL,
      resource_id BIGINT,
      details TEXT,
      created_at TIMESTAMP NOT NULL
    )`
  }
  return `CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id INTEGER,
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id INTEGER,
    details TEXT,
    created_at TEXT NOT NULL
  )`
}

const schema = [
  usersTable(),
  categoriesTable(),
  productsTable(),
  ordersTable(),
  orderItemsTable(),
  settingsTable(),
  contentTable(),
  auditLogsTable(),
  'CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
  'CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)',
  'CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)',
  'CREATE INDEX IF NOT EXISTS idx_products_active_stock ON products(is_active, stock_quantity)',
  'CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource, action)',
]

module.exports = { schema }
