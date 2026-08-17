'use strict'

const express = require('express')
const productService = require('../services/productService')
const { wrap, toNumOrNull } = require('../utils')

const router = express.Router()

router.get('/', wrap(async (req, res) => {
  const page = Math.max(0, Number(req.query.page) || 0)
  const size = Math.min(Number(req.query.size) || 12, 100)
  const includeInactive = req.query.include_inactive === 'true'
  const result = await productService.list(
    !includeInactive,
    toNumOrNull(req.query.category),
    req.query.q || null,
    req.query.sort || null,
    page,
    size,
    toNumOrNull(req.query.min_price),
    toNumOrNull(req.query.max_price),
  )
  res.json(result)
}))

router.get('/:id', wrap(async (req, res) => {
  res.json(await productService.get(Number(req.params.id)))
}))

router.post('/', wrap(async (req, res) => {
  res.status(201).json(await productService.create(req.body))
}))

router.put('/:id', wrap(async (req, res) => {
  res.json(await productService.update(Number(req.params.id), req.body))
}))

router.delete('/:id', wrap(async (req, res) => {
  res.json(await productService.softDelete(Number(req.params.id)))
}))

module.exports = router
