'use strict'

const path = require('path')
const config = require('./config')
const db = require('./db')
const createApp = require('./app')

async function main() {
  const app = await createApp()
  const staticExists = require('fs').existsSync(config.staticDir) && require('fs').statSync(config.staticDir).isDirectory()

  const server = app.listen(config.port, () => {
    console.log(`[shopverse] Node API listening on http://localhost:${config.port}`)
    console.log(`[shopverse] Database: ${db.dialect === 'pg' ? 'PostgreSQL' : `SQLite (${path.join(config.dataDir, 'grounded.db')})`}`)
    if (staticExists) console.log(`[shopverse] Serving frontend from ${config.staticDir}`)
  })

  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
      console.log(`[shopverse] received ${signal}, shutting down...`)
      server.close(() => process.exit(0))
      setTimeout(() => process.exit(0), 3000).unref()
    })
  }
}

main().catch(err => {
  console.error('[shopverse] failed to start:', err)
  process.exit(1)
})