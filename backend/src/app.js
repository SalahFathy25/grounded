'use strict'

const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const config = require('./config')
const db = require('./db')
const { authenticate } = require('./middleware/auth')
const { errorHandler, apiNotFound } = require('./middleware/errorHandler')

function limiterBody(status, message, req) {
  return { timestamp: db.nowIso(), status, message, path: req.originalUrl || req.url }
}

function makeLimiter(options) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json(limiterBody(429, options.message, req))
    },
  })
}

const authLimiter = makeLimiter({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many attempts, please try again later' })
const registerLimiter = makeLimiter({ windowMs: 60 * 60 * 1000, max: 10, message: 'Too many accounts created from this address, please try again later' })
const webhookLimiter = makeLimiter({ windowMs: 60 * 1000, max: 60, message: 'Too many webhook calls' })

async function createApp() {
  await db.init()

  const app = express()
  app.disable('x-powered-by')

  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true)
      return callback(null, false)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))

  app.use(express.json({ limit: '15mb' }))
  app.use(express.urlencoded({ extended: false, limit: '15mb' }))

  app.use(authenticate)

  app.use('/api/v1/auth/login', authLimiter)
  app.use('/api/v1/auth/register', registerLimiter)
  app.use('/api/v1/payments/webhook', webhookLimiter)

  app.use('/api/v1/auth', require('./routes/auth'))
  app.use('/api/v1/categories', require('./routes/categories'))
  app.use('/api/v1/products', require('./routes/products'))
  app.use('/api/v1/orders', require('./routes/orders'))
  app.use('/api/v1/payments', require('./routes/payments'))
  app.use('/api/v1/admin', require('./routes/admin'))
  app.use('/api/v1', require('./routes/store'))

  app.use('/api', apiNotFound)

  const staticDir = config.staticDir
  const staticExists = fs.existsSync(staticDir) && fs.statSync(staticDir).isDirectory()
  if (staticExists) {
    app.use(express.static(staticDir, {
      index: 'index.html',
      maxAge: '1h',
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-store')
      },
    }))
  }

  app.use((req, res) => {
    const pathname = req.originalUrl || req.url
    if (staticExists && req.method === 'GET') {
      const indexFile = path.join(staticDir, 'index.html')
      if (fs.existsSync(indexFile)) return res.sendFile(indexFile)
    }
    apiNotFound(req, res)
  })

  app.use(errorHandler)
  return app
}

module.exports = createApp