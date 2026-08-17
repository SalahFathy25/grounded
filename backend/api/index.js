'use strict'

/* Vercel serverless entry — initialize the Express app once per warm
   instance and delegate every request to it. */

const createApp = require('../src/app')

let appPromise = null

module.exports = async function handler(req, res) {
  if (!appPromise) appPromise = createApp()
  const app = await appPromise
  return app(req, res)
}