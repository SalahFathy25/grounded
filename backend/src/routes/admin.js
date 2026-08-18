'use strict'

const express = require('express')
const settingsService = require('../services/settingsService')
const contentService = require('../services/contentService')
const statsService = require('../services/statsService')
const productService = require('../services/productService')
const orderService = require('../services/orderService')
const userService = require('../services/userService')
const auditService = require('../services/auditService')
const { addClient, corsHeadersFor } = require('../realtime')
const { wrap } = require('../utils')

const router = express.Router()

router.get('/stats', wrap(async (req, res) => {
  res.json(await statsService.stats())
}))

router.get('/settings', wrap(async (req, res) => {
  res.json(await settingsService.get())
}))

router.put('/settings', wrap(async (req, res) => {
  res.json(await settingsService.update(req.body))
}))

router.get('/content', wrap(async (req, res) => {
  res.json(await contentService.get())
}))

router.put('/content', wrap(async (req, res) => {
  res.json(await contentService.update(req.body))
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
  const remove = addClient(res)
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

router.delete('/products', wrap(async (req, res) => {
  const body = req.body || {}
  res.json(await productService.hardDelete(body.ids))
}))

router.delete('/orders', wrap(async (req, res) => {
  const body = req.body || {}
  res.json(await orderService.hardDelete({ ids: body.ids, all: body.all === true }))
}))

router.get('/users', wrap(async (req, res) => {
  res.json(await userService.list(req.query))
}))

router.post('/users', wrap(async (req, res) => {
  res.status(201).json(await userService.create(req.body))
}))

router.put('/users/:id', wrap(async (req, res) => {
  res.json(await userService.update(req.params.id, req.body, req.user.id))
}))

router.delete('/users/:id', wrap(async (req, res) => {
  res.json(await userService.remove(req.params.id, req.user.id))
}))

router.get('/logs', wrap(async (req, res) => {
  res.json(await auditService.list(req.query))
}))

router.delete('/logs', wrap(async (req, res) => {
  res.json(await auditService.clear())
}))

module.exports = router