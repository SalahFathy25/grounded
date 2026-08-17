'use strict'

const express = require('express')
const authService = require('../services/authService')
const { wrap } = require('../utils')

const router = express.Router()

router.post('/register', wrap(async (req, res) => {
  res.status(201).json(await authService.register(req.body))
}))

router.post('/login', wrap(async (req, res) => {
  res.json(await authService.login(req.body))
}))

module.exports = router
