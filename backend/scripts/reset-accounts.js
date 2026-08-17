'use strict'

/* Replaces the admin + customer accounts with the canonical credentials:
     admin    -> admin@grounded.com / admin123
     customer -> salah@grounded.com / salah123
   In-place UPDATEs (keeps order history / FK integrity). Any leftover
   ROLE_CUSTOMER accounts without orders are deleted.
   Safe to re-run. Reads DB_URL from local.env (or environment). */

const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')

function loadEnvFile(file) {
  const content = fs.readFileSync(file, 'utf8')
  for (const line of content.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

const envFile = path.join(__dirname, '..', '..', 'local.env')
try {
  loadEnvFile(envFile)
} catch (err) { /* env may already be set */ }

const config = require('../src/config')
const { Client } = require('pg')

async function main() {
  const client = new Client({
    connectionString: config.dbUrl,
    user: config.dbUser || undefined,
    password: config.dbPassword || undefined,
    ssl: config.dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
  })
  await client.connect()

  const adminHash = await bcrypt.hash('admin123', 10)
  const userHash = await bcrypt.hash('salah123', 10)

  await client.query(
    `UPDATE users SET email = $1, password = $2, full_name = $3 WHERE role = 'ROLE_ADMIN'`,
    ['admin@grounded.com', adminHash, 'Site Admin'],
  )
  const adminRes = await client.query(`SELECT id, email, role FROM users WHERE email = 'admin@grounded.com'`)
  console.log('Admin account ->', JSON.stringify(adminRes.rows[0]))

  await client.query(
    `UPDATE users SET email = $1, password = $2, full_name = $3 WHERE role = 'ROLE_CUSTOMER' AND email = 'customer@grounded.store'`,
    ['salah@grounded.com', userHash, 'Salah Hassan'],
  )
  const userRes = await client.query(`SELECT id, email, role FROM users WHERE email = 'salah@grounded.com'`)
  console.log('Customer account ->', JSON.stringify(userRes.rows[0]))

  const leftovers = await client.query(`SELECT id, email FROM users WHERE role = 'ROLE_CUSTOMER' AND email <> 'salah@grounded.com'`)
  for (const u of leftovers.rows) {
    const orders = await client.query(`SELECT COUNT(*) AS n FROM orders WHERE user_id = $1`, [u.id])
    if (Number(orders.rows[0].n) === 0) {
      await client.query(`DELETE FROM users WHERE id = $1`, [u.id])
      console.log(`Deleted leftover account (no orders): ${u.email}`)
    } else {
      console.log(`Kept ${u.email} — has ${orders.rows[0].n} orders`)
    }
  }

  const all = await client.query(`SELECT id, email, role FROM users ORDER BY id`)
  console.log('Final users:', JSON.stringify(all.rows))
  await client.end()
}

main().catch(err => {
  console.error('Failed:', err.message)
  process.exit(1)
})