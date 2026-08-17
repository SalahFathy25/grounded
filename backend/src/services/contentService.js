'use strict'

const fs = require('fs')
const path = require('path')
const db = require('../db')

const CONTENT_ID = 1
const DEFAULT_FILE = path.join(__dirname, '..', 'assets', 'default-content.json')

/** Deep-merge, mirroring ContentService.deepMerge in the Spring backend. */
function deepMerge(base, patch) {
  const out = { ...base }
  for (const [key, value] of Object.entries(patch || {})) {
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const existing = out[key]
      if (existing !== null && typeof existing === 'object' && !Array.isArray(existing)) {
        out[key] = deepMerge(existing, value)
      } else {
        out[key] = { ...value }
      }
    } else if (Array.isArray(value)) {
      out[key] = [...value]
    } else {
      out[key] = value
    }
  }
  return out
}

function parse(json) {
  if (!json || !json.trim()) return {}
  try {
    return JSON.parse(json)
  } catch (err) {
    return {}
  }
}

async function ensure() {
  const row = await db.get('SELECT id, content_json, updated_at FROM store_content WHERE id = ?', [CONTENT_ID])
  if (row) return row
  const json = fs.readFileSync(DEFAULT_FILE, 'utf8')
  await db.run(
    'INSERT INTO store_content (id, content_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, updated_at = excluded.updated_at',
    [CONTENT_ID, json, db.nowIso()],
  )
  return db.get('SELECT id, content_json, updated_at FROM store_content WHERE id = ?', [CONTENT_ID])
}

async function get() {
  const row = await ensure()
  return parse(row.content_json)
}

async function update(patch) {
  const row = await ensure()
  const existing = parse(row.content_json)
  const merged = deepMerge(existing, patch === null || patch === undefined ? {} : patch)
  await db.run(
    'UPDATE store_content SET content_json = ?, updated_at = ? WHERE id = ?',
    [JSON.stringify(merged), db.nowIso(), CONTENT_ID],
  )
  return merged
}

async function reset() {
  await db.run('DELETE FROM store_content')
}

module.exports = { ensure, get, update, reset, deepMerge }
