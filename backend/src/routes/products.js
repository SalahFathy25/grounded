'use strict'

const express = require('express')
const productService = require('../services/productService')
const { wrap, toNumOrNull, parseId } = require('../utils')

const router = express.Router()

router.get('/', wrap(async (req, res) => {
  const page = Math.max(0, Math.floor(Number(req.query.page) || 0))
  const size = Math.min(Math.max(1, Math.floor(Number(req.query.size) || 12)), 100)
  const includeInactive = req.query.include_inactive === 'true'
  const brands = req.query.brand
    ? String(req.query.brand).split(',').map(s => s.trim()).filter(Boolean)
    : null
  const result = await productService.list({
    activeOnly: !includeInactive,
    categoryId: toNumOrNull(req.query.category),
    keyword: req.query.q || null,
    sort: req.query.sort || null,
    page,
    size,
    minPrice: toNumOrNull(req.query.min_price),
    maxPrice: toNumOrNull(req.query.max_price),
    inStock: req.query.in_stock === 'true',
    onSale: req.query.sale === 'true',
    minRating: toNumOrNull(req.query.rating),
    brands,
  })
  res.json(result)
}))

router.get('/:id', wrap(async (req, res) => {
  res.json(await productService.get(parseId(req.params.id)))
}))

router.post('/', wrap(async (req, res) => {
  res.status(201).json(await productService.create(req.body))
}))

router.put('/:id', wrap(async (req, res) => {
  res.json(await productService.update(parseId(req.params.id), req.body))
}))

router.delete('/:id', wrap(async (req, res) => {
  res.json(await productService.softDelete(parseId(req.params.id)))
}))

module.exports = router
