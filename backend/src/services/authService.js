'use strict'

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('../config')
const db = require('../db')
const { badRequest, conflict, unauthorized } = require('../errors')

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

function generateToken(user) {
  return jwt.sign({ role: user.role }, config.jwtSecret, {
    subject: user.email,
    expiresIn: config.jwtExpirationMs,
  })
}

function buildResponse(user) {
  return {
    token: generateToken(user),
    user: { id: user.id, full_name: user.full_name, email: user.email, role: user.role },
  }
}

async function register(request) {
  const body = request || {}
  if (!body.full_name || String(body.full_name).trim() === '') {
    throw badRequest('full_name: must not be blank')
  }
  if (!body.email || !EMAIL_RE.test(String(body.email))) {
    throw badRequest('email: must be a valid email')
  }
  if (!body.password || String(body.password).length < 6) {
    throw badRequest('password: must be at least 6 characters')
  }
  const exists = await db.get('SELECT COUNT(*) AS cnt FROM users WHERE LOWER(email) = LOWER(?)', [String(body.email)])
  if (Number(exists.cnt) > 0) {
    throw conflict('This email is already registered')
  }
  const hash = await bcrypt.hash(String(body.password), 10)
  const { lastId } = await db.run(
    'INSERT INTO users (full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
    [String(body.full_name).trim(), String(body.email).trim(), hash, 'ROLE_CUSTOMER', db.nowIso()],
  )
  const user = {
    id: lastId,
    full_name: String(body.full_name).trim(),
    email: String(body.email).trim(),
    password: hash,
    role: 'ROLE_CUSTOMER',
  }
  return buildResponse(user)
}

async function login(request) {
  const body = request || {}
  if (!body.email || !body.password) {
    throw unauthorized('Invalid email or password')
  }
  const user = await db.get(
    'SELECT id, full_name, email, password, role, created_at FROM users WHERE LOWER(email) = LOWER(?)',
    [String(body.email).trim()],
  )
  if (!user) throw unauthorized('Invalid email or password')
  const ok = await bcrypt.compare(String(body.password), user.password)
  if (!ok) throw unauthorized('Invalid email or password')
  return buildResponse(user)
}

module.exports = { register, login, generateToken }
