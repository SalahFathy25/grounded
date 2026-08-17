'use strict'

const express = require('express')
const settingsService = require('../services/settingsService')
const contentService = require('../services/contentService')
const statsService = require('../services/statsService')
const db = require('../db')
const { badRequest } = require('../errors')
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

router.post('/reset', wrap(async (req, res) => {
  const body = req.body || {}
  const scope = body.scope === null || body.scope === undefined ? '' : String(body.scope)
  if (scope === 'orders') {
    await db.run('DELETE FROM order_items')
    await db.run('DELETE FROM orders')
    return res.json({ message: 'Orders cleared' })
  }
  if (scope === 'store') {
    await db.txn(async tx => {
      await tx.run('DELETE FROM order_items')
      await tx.run('DELETE FROM orders')
      await tx.run('DELETE FROM products')
      await tx.run('DELETE FROM categories')
      await tx.run('DELETE FROM users')
    })
    await settingsService.reset()
    await contentService.reset()
    const { seed } = require('../db/seed')
    await seed()
    return res.json({ message: 'Store data reset' })
  }
  throw badRequest('Invalid reset scope')
}))

module.exports = router
