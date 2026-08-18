'use strict'

const express = require('express')
const categoryService = require('../services/categoryService')
const { wrap, parseId } = require('../utils')

const router = express.Router()

router.get('/', wrap(async (req, res) => {
  res.json(await categoryService.list())
}))

router.post('/', wrap(async (req, res) => {
  res.status(201).json(await categoryService.create(req.body))
}))

router.put('/:id', wrap(async (req, res) => {
  res.json(await categoryService.update(parseId(req.params.id), req.body))
}))

router.delete('/:id', wrap(async (req, res) => {
  await categoryService.remove(parseId(req.params.id))
  res.status(204).end()
}))

module.exports = router
