'use strict'

const path = require('path')

function env(key, fallback) {
  const value = process.env[key]
  return value === undefined || value === '' ? fallback : value
}

function envBool(key, fallback) {
  const value = process.env[key]
  if (value === undefined || value === '') return fallback
  return value === 'true' || value === '1' || value === 'yes'
}

/** Translate a Spring-style JDBC URL (jdbc:postgresql://...) into a node-postgres URL. */
function toPgUrl(value) {
  if (!value) return null
  if (value.startsWith('postgres://') || value.startsWith('postgresql://')) return value
  const m = /^jdbc:postgresql:\/\/[^/]*[\s\S]*/.exec(value)
  if (!m) return null
  const rest = value.replace(/^jdbc:postgresql:\/\//, '')
  const queryIdx = rest.indexOf('?')
  let hostport = rest
  let query = ''
  if (queryIdx >= 0) {
    hostport = rest.slice(0, queryIdx)
    query = rest.slice(queryIdx)
  }
  const userPassIdx = hostport.lastIndexOf('@')
  let userPass = ''
  let host = hostport
  if (userPassIdx >= 0) {
    userPass = hostport.slice(0, userPassIdx)
    host = hostport.slice(userPassIdx + 1)
  }
  const creds = process.env.DB_USER || (userPass.split(':')[0] || '')
  const pw = process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== '' ? process.env.DB_PASSWORD : (userPass.split(':')[1] || '')
  const url = `postgres://${encodeURIComponent(creds)}:${encodeURIComponent(pw)}@${host}${query}`
  if (url.includes('sslmode=require')) return url
  return url
}

module.exports = {
  port: Number(env('PORT', process.env.PORT || '8080')),
  jwtSecret: env('JWT_SECRET', 'shopverse-dev-secret-change-me-in-production-0123456789'),
  jwtExpirationMs: Number(env('JWT_EXPIRATION_MS', '86400000')),
  corsOrigins: env('CORS_ORIGINS', 'http://localhost:5173').split(',').map(s => s.trim()).filter(Boolean),
  adminInitialPassword: env('ADMIN_INITIAL_PASSWORD', 'admin123'),
  dbUrl: toPgUrl(env('DB_URL', process.env.DATABASE_URL || '')),
  dbUser: env('DB_USER', ''),
  dbPassword: env('DB_PASSWORD', ''),
  dataDir: path.resolve(process.cwd(), env('DATA_DIR', 'data')),
  staticDir: process.env.STATIC_DIR ? path.resolve(process.env.STATIC_DIR) : path.resolve(__dirname, '../../frontend/dist'),
  logLevel: env('LOG_LEVEL', 'info'),
}