'use strict'

const express = require('express')
const paymentService = require('../services/paymentService')
const { wrap, toNumOrNull } = require('../utils')

const router = express.Router()

router.post('/checkout', wrap(async (req, res) => {
  const body = req.body || {}
  res.json(await paymentService.checkout(toNumOrNull(body.order_id), toNumOrNull(body.amount)))
}))

router.post('/webhook', wrap(async (req, res) => {
  res.json(await paymentService.handleWebhook(req.body))
}))

module.exports = router
