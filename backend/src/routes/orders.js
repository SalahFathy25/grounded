'use strict'

const express = require('express')
const orderService = require('../services/orderService')
const { wrap, parseId } = require('../utils')
const { badRequest } = require('../errors')

const router = express.Router()

function currentUser(req) {
  return req.user
}

router.post('/', wrap(async (req, res) => {
  const result = await orderService.create(currentUser(req), req.body)
  res.status(result.replayed ? 200 : 201).json(result.order)
}))

router.get('/my-orders', wrap(async (req, res) => {
  res.json(await orderService.myOrders(currentUser(req)))
}))

router.get('/', wrap(async (req, res) => {
  const page = Math.max(0, Math.floor(Number(req.query.page) || 0))
  const size = Math.min(Math.max(1, Math.floor(Number(req.query.size) || 50)), 100)
  let status = null
  if (req.query.status !== undefined && req.query.status !== null && req.query.status !== '') {
    status = String(req.query.status)
    if (!orderService.VALID_STATUSES.includes(status)) {
      throw badRequest('Invalid status')
    }
  }
  res.json(await orderService.allOrders({ page, size, status }))
}))

router.patch('/:id/status', wrap(async (req, res) => {
  res.json(await orderService.updateStatus(parseId(req.params.id), req.body.status))
}))

router.get('/:id', wrap(async (req, res) => {
  res.json(await orderService.getById(currentUser(req), parseId(req.params.id)))
}))

router.post('/:id/pay', wrap(async (req, res) => {
  res.json(await orderService.pay(currentUser(req), parseId(req.params.id)))
}))

router.patch('/:id/proof', wrap(async (req, res) => {
  res.json(await orderService.saveProof(currentUser(req), parseId(req.params.id), req.body.proof))
}))

module.exports = router
