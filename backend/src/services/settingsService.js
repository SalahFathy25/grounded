'use strict'

const db = require('../db')

const SETTINGS_ID = 1

const KEYS = [
  'store_name_en', 'store_name_ar', 'tagline_en', 'tagline_ar',
  'announcement_en', 'announcement_ar', 'announcement_enabled', 'shipping_fee',
  'vodafone_number', 'instapay_number', 'support_phone', 'support_email',
  'instagram_url', 'facebook_url', 'tiktok_url',
]

const UPSERT = `
  INSERT INTO store_settings (id, store_name_en, store_name_ar, tagline_en, tagline_ar,
    announcement_en, announcement_ar, announcement_enabled, shipping_fee, vodafone_number,
    instapay_number, support_phone, support_email, instagram_url, facebook_url, tiktok_url, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(id) DO UPDATE SET
    store_name_en = excluded.store_name_en,
    store_name_ar = excluded.store_name_ar,
    tagline_en = excluded.tagline_en,
    tagline_ar = excluded.tagline_ar,
    announcement_en = excluded.announcement_en,
    announcement_ar = excluded.announcement_ar,
    announcement_enabled = excluded.announcement_enabled,
    shipping_fee = excluded.shipping_fee,
    vodafone_number = excluded.vodafone_number,
    instapay_number = excluded.instapay_number,
    support_phone = excluded.support_phone,
    support_email = excluded.support_email,
    instagram_url = excluded.instagram_url,
    facebook_url = excluded.facebook_url,
    tiktok_url = excluded.tiktok_url,
    updated_at = excluded.updated_at
`

async function ensure() {
  const row = await db.get('SELECT * FROM store_settings WHERE id = ?', [SETTINGS_ID])
  if (row) return row
  const defaults = {
    store_name_en: 'Grounded',
    store_name_ar: 'غراوندد',
    tagline_en: 'Premium streetwear at honest prices. T-shirts, shirts, pants and more — delivered across Egypt.',
    tagline_ar: 'ملابس ستريتوير فخمة بأسعار منصفة. تيشيرتات، قمصان وبناطيل — توصيل لجميع مصر.',
    announcement_en: '',
    announcement_ar: '',
    announcement_enabled: false,
    shipping_fee: 80,
    vodafone_number: '+20 100 000 0000',
    instapay_number: '01000000000',
    support_phone: '+20 100 000 0000',
    support_email: 'support@grounded.store',
    instagram_url: '',
    facebook_url: '',
    tiktok_url: '',
    updated_at: db.nowIso(),
  }
  await db.run(UPSERT, [
    SETTINGS_ID,
    defaults.store_name_en, defaults.store_name_ar,
    defaults.tagline_en, defaults.tagline_ar,
    defaults.announcement_en, defaults.announcement_ar,
    db.bool(defaults.announcement_enabled), defaults.shipping_fee,
    defaults.vodafone_number, defaults.instapay_number,
    defaults.support_phone, defaults.support_email,
    defaults.instagram_url, defaults.facebook_url, defaults.tiktok_url,
    defaults.updated_at,
  ])
  return db.get('SELECT * FROM store_settings WHERE id = ?', [SETTINGS_ID])
}

function toMap(row) {
  return {
    store_name_en: row.store_name_en,
    store_name_ar: row.store_name_ar,
    tagline_en: row.tagline_en,
    tagline_ar: row.tagline_ar,
    announcement_en: row.announcement_en,
    announcement_ar: row.announcement_ar,
    announcement_enabled: row.announcement_enabled,
    shipping_fee: row.shipping_fee,
    vodafone_number: row.vodafone_number,
    instapay_number: row.instapay_number,
    support_phone: row.support_phone,
    support_email: row.support_email,
    instagram_url: row.instagram_url,
    facebook_url: row.facebook_url,
    tiktok_url: row.tiktok_url,
    updated_at: row.updated_at,
  }
}

async function get() {
  return toMap(await ensure())
}

async function update(patch) {
  const row = await ensure()
  const next = { ...row }
  for (const key of KEYS) {
    if (patch === null || patch === undefined || !(key in patch)) continue
    const value = patch[key]
    if (key === 'announcement_enabled') {
      next.announcement_enabled = value === true || value === 'true' || value === 1
    } else if (key === 'shipping_fee') {
      const n = Number(value)
      next.shipping_fee = Number.isNaN(n) ? 0 : n
    } else if (value !== null && value !== undefined) {
      next[key] = String(value)
    }
  }
  next.updated_at = db.nowIso()
  await db.run(UPSERT, [
    SETTINGS_ID,
    next.store_name_en, next.store_name_ar,
    next.tagline_en, next.tagline_ar,
    next.announcement_en, next.announcement_ar,
    db.bool(next.announcement_enabled), next.shipping_fee,
    next.vodafone_number, next.instapay_number,
    next.support_phone, next.support_email,
    next.instagram_url, next.facebook_url, next.tiktok_url,
    next.updated_at,
  ])
  return get()
}

async function reset() {
  await db.run('DELETE FROM store_settings')
}

module.exports = { ensure, get, update, reset, KEYS }
