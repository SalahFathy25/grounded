'use strict'

const express = require('express')
const settingsService = require('../services/settingsService')
const contentService = require('../services/contentService')
const { addClient, corsHeadersFor } = require('../realtime')
const { wrap } = require('../utils')

const router = express.Router()

router.get('/settings', wrap(async (req, res) => {
  res.json(await settingsService.get())
}))

router.get('/content', wrap(async (req, res) => {
  res.json(await contentService.get())
}))

router.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    ...corsHeadersFor(req),
  })
  res.write(': connected\n\n')
  const remove = addClient(res, ['products', 'categories', 'settings', 'content'])
  const heartbeat = setInterval(() => {
    try {
      res.write(': ping\n\n')
    } catch (err) {
      clearInterval(heartbeat)
      remove()
    }
  }, 25000)
  req.on('close', () => {
    clearInterval(heartbeat)
    remove()
  })
})

module.exports = router
