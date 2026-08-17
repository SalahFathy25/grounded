'use strict'

const express = require('express')
const categoryService = require('../services/categoryService')
const { wrap } = require('../utils')

const router = express.Router()

router.get('/', wrap(async (req, res) => {
  res.json(await categoryService.list())
}))

router.post('/', wrap(async (req, res) => {
  res.status(201).json(await categoryService.create(req.body))
}))

router.delete('/:id', wrap(async (req, res) => {
  await categoryService.remove(Number(req.params.id))
  res.status(200).end()
}))

module.exports = router
