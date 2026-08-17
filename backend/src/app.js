'use strict'

const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const config = require('./config')
const db = require('./db')
const { authenticate } = require('./middleware/auth')
const { errorHandler, apiNotFound } = require('./middleware/errorHandler')

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
    app.use(express.static(staticDir, { index: 'index.html', maxAge: '1h' }))
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