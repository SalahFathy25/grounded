'use strict'

const bcrypt = require('bcryptjs')
const config = require('../config')
const db = require('./index')
const settingsService = require('../services/settingsService')
const contentService = require('../services/contentService')

async function ensureDefaults() {
  await settingsService.ensure()
  await contentService.ensure()
}

async function seed() {
  await ensureDefaults()

  const admin = await db.get("SELECT id FROM users WHERE role = 'ROLE_ADMIN' LIMIT 1")
  const superAdmin = await db.get("SELECT id FROM users WHERE role = 'ROLE_SUPER_ADMIN' LIMIT 1")
  if (superAdmin) {
    // Enforce the initial password on every boot so the operator can always
    // regain access to the super admin account.
    const hash = await bcrypt.hash(config.superAdminInitialPassword, 10)
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hash, superAdmin.id])
    return
  }
  if (admin) {
    const hash = await bcrypt.hash(config.superAdminInitialPassword, 10)
    await db.run(
      'INSERT INTO users (full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
      ['Super Admin', 'superadmin@grounded.com', hash, 'ROLE_SUPER_ADMIN', db.nowIso()],
    )
    return
  }

  const hash = await bcrypt.hash(config.adminInitialPassword, 10)
  await db.run(
    'INSERT INTO users (full_name, email, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
    ['Site Admin', 'admin@grounded.com', hash, 'ROLE_ADMIN', db.nowIso()],
  )
}

module.exports = { seed }