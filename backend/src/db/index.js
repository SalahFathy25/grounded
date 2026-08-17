'use strict'

const path = require('path')
const fs = require('fs')
const config = require('../config')

const dialect = process.env.DB_URL ? 'pg' : 'sqlite'
let sqlite = null
let pool = null

const SQL_TRUE = dialect === 'pg' ? 'TRUE' : '1'
const SQL_FALSE = dialect === 'pg' ? 'FALSE' : '0'

const DECIMAL_KEYS = new Set([
  'price', 'discount_percent', 'cost_price', 'total_amount',
  'shipping_fee', 'unit_price', 'revenue', 'rating',
])
const BOOL_KEYS = new Set(['is_active', 'featured', 'announcement_enabled'])

const pad = n => String(n).padStart(2, '0')
const pad3 = n => String(n).padStart(3, '0')

function iso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad3(d.getMilliseconds())}`
}
const nowIso = () => iso(new Date())

function toIsoString(value) {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return iso(value)
  if (typeof value === 'string') {
    const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(\.\d+)?/.exec(value)
    if (m) {
      const ms = m[3] ? m[3].slice(1, 4).padEnd(3, '0') : '000'
      return `${m[1]}T${m[2]}.${ms}`
    }
  }
  return String(value)
}

function normalizeRow(row) {
  if (!row) return row
  const out = {}
  for (const [key, value] of Object.entries(row)) {
    if (DECIMAL_KEYS.has(key) && value !== null && value !== undefined) {
      out[key] = Number(value)
    } else if (BOOL_KEYS.has(key) && value !== null && value !== undefined) {
      out[key] = Boolean(value)
    } else if (value instanceof Date) {
      out[key] = toIsoString(value)
    } else {
      out[key] = value
    }
  }
  return out
}

function toPgPlaceholders(sql) {
  let out = ''
  let n = 0
  for (let i = 0; i < sql.length; i++) {
    if (sql[i] === '?') {
      n++
      out += `$${n}`
    } else {
      out += sql[i]
    }
  }
  return out
}

function loadSqlite() {
  const Database = require('better-sqlite3')
  fs.mkdirSync(config.dataDir, { recursive: true })
  const file = path.join(config.dataDir, 'grounded.db')
  sqlite = new Database(file)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
}

function loadPg() {
  const { Pool } = require('pg')
  const types = require('pg').types
  // PostgreSQL returns INT2/INT4/INT8 as strings by default — cast them to
  // numbers so the API contract matches Spring (ids/counts are JSON numbers).
  for (const oid of [20, 21, 23]) types.setTypeParser(oid, v => (v === null ? null : Number(v)))
  pool = new Pool({
    connectionString: config.dbUrl,
    user: config.dbUser || undefined,
    password: config.dbPassword || undefined,
    ssl: config.dbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    max: 10,
  })
}

async function q(sql, params = []) {
  if (dialect === 'pg') {
    const { rows } = await pool.query(toPgPlaceholders(sql), params)
    return rows.map(normalizeRow)
  }
  return sqlite.prepare(sql).all(params).map(normalizeRow)
}

async function get(sql, params = []) {
  const rows = await q(sql, params)
  return rows[0]
}

async function run(sql, params = []) {
  if (dialect === 'pg') {
    const text = sql.includes(' RETURNING ') ? sql : `${sql} RETURNING id`
    const { rows } = await pool.query(toPgPlaceholders(text), params)
    const row = rows[0] || {}
    return { lastId: row.id === undefined || row.id === null ? null : Number(row.id) }
  }
  const info = sqlite.prepare(sql).run(params)
  return { lastId: Number(info.lastInsertRowid) }
}

async function txn(fn) {
  if (dialect === 'pg') {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const result = await fn({
        q: async (sql, params = []) => {
          const { rows } = await client.query(toPgPlaceholders(sql), params)
          return rows.map(normalizeRow)
        },
        get: async (sql, params = []) => {
          const { rows } = await client.query(toPgPlaceholders(sql), params)
          return normalizeRow(rows[0])
        },
        run: async (sql, params = []) => {
          const text = sql.includes(' RETURNING ') ? sql : `${sql} RETURNING id`
          const { rows } = await client.query(toPgPlaceholders(text), params)
          const row = rows[0] || {}
          return { lastId: row.id === undefined || row.id === null ? null : Number(row.id) }
        },
      })
      await client.query('COMMIT')
      return result
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }
  sqlite.exec('BEGIN')
  try {
    const result = await fn({
      q: (sql, params = []) => sqlite.prepare(sql).all(params).map(normalizeRow),
      get: (sql, params = []) => normalizeRow(sqlite.prepare(sql).get(params)),
      run: (sql, params = []) => {
        const info = sqlite.prepare(sql).run(params)
        return { lastId: Number(info.lastInsertRowid) }
      },
    })
    sqlite.exec('COMMIT')
    return result
  } catch (err) {
    sqlite.exec('ROLLBACK')
    throw err
  }
}

async function execSql(statements) {
  if (dialect === 'pg') {
    for (const statement of statements) {
      await pool.query(statement)
    }
    return
  }
  sqlite.exec(statements.join(';\n'))
}

async function init() {
  if (dialect === 'pg') {
    loadPg()
  } else {
    loadSqlite()
  }
  const { schema } = require('./schema')
  await execSql(schema)
  const { seed } = require('./seed')
  await seed()
}

module.exports = {
  dialect,
  sqlite,
  pool,
  q,
  get,
  run,
  txn,
  execSql,
  init,
  boolLit: value => (value ? SQL_TRUE : SQL_FALSE),
  bool: value => (value ? 1 : 0),
  iso,
  nowIso,
  toIsoString,
}