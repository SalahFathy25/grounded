'use strict'

const express = require('express')
const orderService = require('../services/orderService')
const { wrap } = require('../utils')

const router = express.Router()

function currentUser(req) {
  return req.user
}

router.post('/', wrap(async (req, res) => {
  res.status(201).json(await orderService.create(currentUser(req), req.body))
}))

router.get('/my-orders', wrap(async (req, res) => {
  res.json(await orderService.myOrders(currentUser(req)))
}))

router.get('/', wrap(async (req, res) => {
  res.json(await orderService.allOrders())
}))

router.patch('/:id/status', wrap(async (req, res) => {
  res.json(await orderService.updateStatus(Number(req.params.id), req.body.status))
}))

router.get('/:id', wrap(async (req, res) => {
  res.json(await orderService.getById(currentUser(req), Number(req.params.id)))
}))

router.post('/:id/pay', wrap(async (req, res) => {
  res.json(await orderService.pay(currentUser(req), Number(req.params.id)))
}))

router.patch('/:id/proof', wrap(async (req, res) => {
  res.json(await orderService.saveProof(currentUser(req), Number(req.params.id), req.body.proof))
}))

module.exports = router
