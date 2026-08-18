'use strict'

const jwt = require('jsonwebtoken')
const config = require('../config')
const db = require('../db')
const { unauthorized, forbidden } = require('../errors')
const { withActor } = require('../services/auditService')

const nowIso = () => db.nowIso()

function errorBody(status, message, path) {
  return { timestamp: nowIso(), status, message, path }
}

/** Normalize a request path so ACL checks can't be bypassed with
 *  case variations or trailing slashes (Express routing is case-insensitive
 *  and trailing-slash tolerant, so the middleware must match it exactly). */
function normalizePath(rawPath) {
  let path = String(rawPath || '')
  const queryIdx = path.indexOf('?')
  if (queryIdx >= 0) path = path.slice(0, queryIdx)
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1)
  return path.toLowerCase()
}

function isPublic(method, path) {
  if (path.startsWith('/api/v1/auth/')) return true
  if (method === 'GET' && (path === '/api/v1/settings' || path === '/api/v1/content' || path === '/api/v1/categories')) return true
  if (path === '/api/v1/events') return true
  if (method === 'GET' && (path === '/api/v1/products' || path.startsWith('/api/v1/products/'))) return true
  if (method === 'POST' && path === '/api/v1/payments/webhook') return true
  return false
}

function requiresAdmin(method, path) {
  if (path.startsWith('/api/v1/admin')) return true
  if ((path === '/api/v1/settings' || path === '/api/v1/content') && method !== 'GET') return true
  if (method === 'GET' && path === '/api/v1/orders') return true
  if (method === 'PATCH' && /^\/api\/v1\/orders\/\d+\/status$/.test(path)) return true
  if (path.startsWith('/api/v1/products') && method !== 'GET') return true
  if (path.startsWith('/api/v1/categories') && method !== 'GET') return true
  return false
}

function requiresSuperAdmin(method, path) {
  return path.startsWith('/api/v1/admin/users') || path.startsWith('/api/v1/admin/logs')
}

const ADMIN_ROLES = ['ROLE_ADMIN', 'ROLE_SUPER_ADMIN']

/** Express middleware mirroring the Spring JwtAuthenticationFilter. */
async function authenticate(req, res, next) {
  try {
    const { method } = req
    const path = normalizePath(req.path)
    if (!path.startsWith('/api/')) return next()
    if (isPublic(method, path)) return next()

    const header = req.headers.authorization || ''
    let email = null
    let role = null
    let token = null
    if (header.startsWith('Bearer ')) {
      token = header.slice(7)
    } else if (req.query && req.query.token) {
      token = String(req.query.token)
    }
    if (token) {
      try {
        const payload = jwt.verify(token, config.jwtSecret)
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

    if (requiresAdmin(method, path) && !ADMIN_ROLES.includes(role)) {
      return res.status(403).json(errorBody(403, 'Admin access required', path))
    }
    if (requiresSuperAdmin(method, path) && role !== 'ROLE_SUPER_ADMIN') {
      return res.status(403).json(errorBody(403, 'Super admin access required', path))
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
    return withActor(req.user, next)
  } catch (err) {
    return next(err)
  }
}

module.exports = { authenticate, isPublic, requiresAdmin, requiresSuperAdmin, errorBody }
