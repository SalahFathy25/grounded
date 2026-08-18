'use strict'

const { AsyncLocalStorage } = require('node:async_hooks')
const db = require('../db')
const { emit } = require('../realtime')

const als = new AsyncLocalStorage()

/** Bind an actor (req.user) to the current async context so every service
 *  can audit itself without threading the actor through call chains. */
function withActor(actor, fn) {
  return als.run({ actor }, fn)
}

function currentActor() {
  const store = als.getStore()
  return store ? store.actor : null
}

async function log(action, resource, resourceId, details, actorOverride = null) {
  const actor = actorOverride || currentActor() || {}
  try {
    await db.run(
      `INSERT INTO audit_logs
         (actor_id, actor_email, actor_role, action, resource, resource_id, details, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actor.id ?? null,
        actor.email ?? null,
        actor.role ?? null,
        String(action),
        String(resource),
        resourceId ?? null,
        details ? JSON.stringify(details) : null,
        db.nowIso(),
      ],
    )
  } catch (err) {
    // Auditing must never break the underlying request
  }
  emit('logs')
}

async function list({ page = 0, size = 20, actor = '', action = '', resource = '', q = '' } = {}) {
  const safePage = Math.max(0, Number(page) || 0)
  const safeSize = Math.min(100, Math.max(1, Number(size) || 20))
  const clauses = []
  const params = []
  if (String(actor).trim()) {
    clauses.push('LOWER(actor_email) LIKE ?')
    params.push(`%${String(actor).trim().toLowerCase()}%`)
  }
  if (String(action).trim()) {
    clauses.push('action = ?')
    params.push(String(action).trim())
  }
  if (String(resource).trim()) {
    clauses.push('resource = ?')
    params.push(String(resource).trim())
  }
  if (String(q).trim()) {
    clauses.push('(LOWER(actor_email) LIKE ? OR details LIKE ?)')
    const like = `%${String(q).trim().toLowerCase()}%`
    params.push(like, like)
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''

  const totalRow = await db.get(`SELECT COUNT(*) AS cnt FROM audit_logs ${where}`, params)
  const rows = await db.q(
    `SELECT id, actor_id, actor_email, actor_role, action, resource, resource_id, details, created_at
     FROM audit_logs ${where}
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [...params, safeSize, safePage * safeSize],
  )

  return {
    content: rows.map(row => ({
      id: row.id,
      actor_id: row.actor_id,
      actor_email: row.actor_email,
      actor_role: row.actor_role,
      action: row.action,
      resource: row.resource,
      resource_id: row.resource_id,
      details: row.details ? JSON.parse(row.details) : null,
      created_at: row.created_at,
    })),
    page: safePage,
    size: safeSize,
    totalElements: Number(totalRow.cnt),
    totalPages: Math.ceil(Number(totalRow.cnt) / safeSize),
  }
}

async function clear() {
  const result = await db.run('DELETE FROM audit_logs')
  return { deleted: result.changes }
}

module.exports = { withActor, currentActor, log, list, clear }