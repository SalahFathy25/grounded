'use strict'

const express = require('express')
const settingsService = require('../services/settingsService')
const contentService = require('../services/contentService')
const { wrap } = require('../utils')

const router = express.Router()

router.get('/settings', wrap(async (req, res) => {
  res.json(await settingsService.get())
}))

router.get('/content', wrap(async (req, res) => {
  res.json(await contentService.get())
}))

module.exports = router
