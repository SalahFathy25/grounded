'use strict'

/** Round to 2 decimals with half-up, mirroring BigDecimal.setScale(2, HALF_UP). */
function round2(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 0
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

/** Wrap an async express handler so rejected promises reach the error middleware. */
const wrap = fn => (req, res, next) => {
  try {
    Promise.resolve(fn(req, res, next)).catch(next)
  } catch (err) {
    next(err)
  }
}

/** Parse a JSON request body field into a number (lenient — accepts "5", 5, null → null). */
function toNumOrNull(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function toNum(value, fallback = null) {
  const n = toNumOrNull(value)
  return n === null ? fallback : n
}

module.exports = { round2, wrap, toNumOrNull, toNum }
