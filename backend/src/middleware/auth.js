'use strict'

const jwt = require('jsonwebtoken')
const config = require('../config')
const db = require('../db')
const { unauthorized, forbidden } = require('../errors')

const nowIso = () => db.nowIso()

function errorBody(status, message, path) {
  return { timestamp: nowIso(), status, message, path }
}

function isPublic(method, path) {
  if (path.startsWith('/api/v1/auth/')) return true
  if (path === '/api/v1/settings' || path === '/api/v1/content' || path === '/api/v1/categories') return true
  if (method === 'GET' && (path === '/api/v1/products' || path.startsWith('/api/v1/products/'))) return true
  if (method === 'POST' && path === '/api/v1/payments/webhook') return true
  return false
}

function requiresAdmin(method, path) {
  if (path.startsWith('/api/v1/admin')) return true
  if (method === 'GET' && path === '/api/v1/orders') return true
  if (method === 'PATCH' && /^\/api\/v1\/orders\/\d+\/status$/.test(path)) return true
  if (path.startsWith('/api/v1/products') && method !== 'GET') return true
  if (path === '/api/v1/categories' && method !== 'GET') return true
  return false
}

/** Express middleware mirroring the Spring JwtAuthenticationFilter. */
async function authenticate(req, res, next) {
  try {
    const { method, path } = req
    if (!path.startsWith('/api/')) return next()
    if (isPublic(method, path)) return next()

    const header = req.headers.authorization || ''
    let email = null
    let role = null
    if (header.startsWith('Bearer ')) {
      try {
        const payload = jwt.verify(header.slice(7), config.jwtSecret)
        email = payload.sub
        role = payload.role
      } catch (err) {
        email = null
        role = null
      }
    }

    if (!email) {
      return res.status(401).json(errorBody(401, 'Authentication required', path))
    }

    if (requiresAdmin(method, path) && role !== 'ROLE_ADMIN') {
      return res.status(403).json(errorBody(403, 'Admin access required', path))
    }

    req.authEmail = email
    req.authRole = role
    req.user = await db.get(
      'SELECT id, full_name, email, password, role, created_at FROM users WHERE LOWER(email) = LOWER(?)',
      [email],
    )
    if (!req.user) {
      return res.status(401).json(errorBody(401, 'Authentication required', path))
    }
    return next()
  } catch (err) {
    return next(err)
  }
}

module.exports = { authenticate, isPublic, requiresAdmin, errorBody }
