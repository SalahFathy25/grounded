'use strict'

/* Validates the PostgreSQL dialect against a REAL Postgres (reads local.env /
   DB_URL from the environment) WITHOUT touching any data: everything runs
   inside one transaction that is rolled back. */

const fs = require('fs')
const path = require('path')

function loadEnvFile(file) {
  const content = fs.readFileSync(file, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

const envFile = process.env.LOCAL_ENV_FILE || path.join(__dirname, '..', '..', 'local.env')
try {
  loadEnvFile(envFile)
} catch (err) {
  console.log('No local.env found — skip real-PG validation')
  process.exit(0)
}

const config = require('../src/config')

if (!config.dbUrl) {
  console.log('No DB_URL — skip real-PG validation')
  process.exit(0)
}

const { dialect } = require('../src/db')
if (dialect !== 'pg') {
  console.log('DB_URL is not postgres — skipping (this script is for validating the pg dialect)')
  process.exit(0)
}

const { schema } = require('../src/db/schema')
const { Pool } = require('pg')

async function main() {
  console.log(`Connecting to ${config.dbUrl.replace(/:[^:@/]+@/, ':***@')} …`)
  const pool = new Pool({
    connectionString: config.dbUrl,
    user: config.dbUser || undefined,
    password: config.dbPassword || undefined,
    ssl: config.dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    max: 5,
  })

  const client = await pool.connect()
  let failed = 0
  const fail = (name, detail) => { failed++; console.log(`FAIL  ${name} — ${detail}`) }
  const pass = name => console.log(`PASS  ${name}`)

  try {
    await client.query('BEGIN')
    for (const [i, statement] of schema.entries()) {
      try {
        await client.query(statement)
        pass(`DDL[${i}]`)
      } catch (e) {
        fail(`DDL[${i}]`, e.message.split('\n')[0])
      }
    }

    const checks = [
      ['users select', `SELECT id, full_name, email, password, role, created_at FROM users WHERE LOWER(email) = LOWER($1)`, ['x']],
      ['products search', `SELECT p.id, c.name AS cat_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE 1=1 AND p.is_active = TRUE AND (LOWER(p.name) LIKE $1 OR LOWER(p.description) LIKE $1) ORDER BY p.created_at DESC LIMIT $2 OFFSET $3`, ['%x%', 10, 0]],
      ['count query', `SELECT COUNT(*) AS cnt FROM products p WHERE 1=1 AND p.is_active = TRUE`, []],
      ['category product_count', `SELECT c.id, c.name, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = TRUE) AS product_count FROM categories c ORDER BY c.id`, []],
      ['orders join', `SELECT o.id, u.full_name AS user_name, o.status_history FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = $1`, [1]],
      ['settings upsert', `INSERT INTO store_settings (id, store_name_en, announcement_enabled, shipping_fee, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT(id) DO UPDATE SET store_name_en = excluded.store_name_en, announcement_enabled = excluded.announcement_enabled, shipping_fee = excluded.shipping_fee, updated_at = excluded.updated_at`, [1, 'Grounded', false, 80, '2026-01-01T00:00:00.000']],
      ['content upsert', `INSERT INTO store_content (id, content_json, updated_at) VALUES ($1, $2, $3) ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at`, [1, '{}', '2026-01-01T00:00:00.000']],
      ['product insert', `INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, is_active, discount_percent, sku, brand, material, color, sizes, tags, cost_price, reorder_level, featured, created_at, rating, reviews_count, images_json) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`, ['n', 'd', 100, 1, 1, 'img', 0, 'sku', 'b', 'm', 'c', 's', 't', 50, 5, true, '2026-01-01T00:00:00.000', 0, 0, '[]']],
      ['order + items insert', `INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address, phone_number, created_at, shipping_fee, paid_at, payment_proof, payment_proof_at, status_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`, [1, 100, 'PENDING', 'COD', 'addr', '+20 123', '2026-01-01T00:00:00.000', 80, null, null, null, '[]']],
      ['revenue query', "SELECT COALESCE(SUM(total_amount), 0) AS revenue FROM orders WHERE status <> 'CANCELLED'", []],
      ['low stock query', `SELECT p.id FROM products p WHERE p.is_active = TRUE AND p.stock_quantity < $1 ORDER BY p.stock_quantity ASC LIMIT $2`, [5, 6]],
      ['stock decrement', `UPDATE products SET stock_quantity = $1 WHERE id = $2`, [4, 1]],
      ['empty result select', `SELECT id FROM users WHERE id = $1`, [999999]],
    ]
    for (const [name, sql, params] of checks) {
      try {
        await client.query(sql, params)
        pass(name)
      } catch (e) {
        fail(name, e.message.split('\n')[0])
      }
    }
    try {
      const userRes = await client.query(`INSERT INTO users (full_name, email, password, role, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`, ['PG Test User', `pgtest-${Date.now()}@example.com`, 'hash', 'ROLE_CUSTOMER', '2026-01-01T00:00:00.000'])
      const catRes = await client.query(`INSERT INTO categories (name, name_ar, image_url) VALUES ($1, $2, $3) RETURNING id`, ['PG Cats', 'كات', 'img.jpg'])
      const prodRes = await client.query(`INSERT INTO products (name, description, price, stock_quantity, category_id, image_url, is_active, discount_percent, sku, brand, material, color, sizes, tags, cost_price, reorder_level, featured, created_at, rating, reviews_count, images_json) VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING id`, ['t', 'd', 100, 10, catRes.rows[0].id, 'img', 0, 'sku', 'b', 'm', 'c', 's', 'tags', 50, 5, true, '2026-01-01T00:00:00.000', 4.5, 0, '[]'])
      const orderIdRes = await client.query(`INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_address, phone_number, created_at, shipping_fee, paid_at, payment_proof, payment_proof_at, status_history) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`, [userRes.rows[0].id, 100, 'PENDING', 'COD', 'addr', '+20 123', '2026-01-01T00:00:00.000', 80, null, null, null, '[]'])
      await client.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price, product_image) VALUES ($1, $2, $3, $4, $5)`, [orderIdRes.rows[0].id, prodRes.rows[0].id, 2, 250, 'img.jpg'])
      pass('order_items insert (valid FKs)')
    } catch (e) {
      fail('order_items insert (valid FKs)', e.message.split('\n')[0])
    }
  } catch (err) {
    console.log('Harness error:', err.message)
  } finally {
    try {
      await client.query('ROLLBACK')
      console.log('Rolled back — no changes persisted.')
    } catch (err) {
      console.log('Rollback note:', err.message)
    }
    client.release()
    await pool.end()
  }

  console.log(failed === 0 ? '\nALL REAL-PG CHECKS PASSED' : `\n${failed} REAL-PG CHECKS FAILED`)
  process.exit(failed === 0 ? 0 : 1)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

main().catch(err => {
  console.log('Cannot reach Postgres:', err.message)
  process.exit(2)
})