'use strict'

const { HttpError } = require('../errors')
const db = require('../db')

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)
  const path = req.originalUrl || req.url
  if (err instanceof HttpError) {
    return res.status(err.status).json({
      timestamp: db.nowIso(),
      status: err.status,
      message: err.message,
      path,
    })
  }
  if (err && (err.type === 'entity.parse.failed' || err.type === 'entity.too.large')) {
    return res.status(400).json({
      timestamp: db.nowIso(),
      status: 400,
      message: 'Malformed request body',
      path,
    })
  }
  if (err && typeof err.code === 'string') {
    if (err.code === '23505' || err.code.includes('SQLITE_CONSTRAINT')) {
      return res.status(409).json({
        timestamp: db.nowIso(),
        status: 409,
        message: 'That record already exists',
        path,
      })
    }
    if (err.code === '23503' || err.code.includes('SQLITE_CONSTRAINT_FOREIGNKEY')) {
      return res.status(400).json({
        timestamp: db.nowIso(),
        status: 400,
        message: 'The record is still in use',
        path,
      })
    }
  }
  console.error(`Unhandled exception on ${path}:`, err)
  return res.status(500).json({
    timestamp: db.nowIso(),
    status: 500,
    message: 'Something went wrong',
    path,
  })
}

/** JSON 404 for unmatched /api routes — mirrors Spring's NoResourceFoundException. */
function apiNotFound(req, res) {
  const path = req.originalUrl || req.url
  res.status(404).json({
    timestamp: db.nowIso(),
    status: 404,
    message: `Not found: ${path}`,
    path,
  })
}

module.exports = { errorHandler, apiNotFound }
