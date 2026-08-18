'use strict'

const config = require('./config')

const clients = new Set()

/** writeHead() replaces every header the cors middleware already set, so
 *  SSE endpoints must re-apply the CORS headers themselves. */
function corsHeadersFor(req) {
  const origin = req.headers.origin
  if (origin && config.corsOrigins.includes(origin)) {
    return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' }
  }
  return {}
}

/** Register an SSE client. channels = null means "receive every event";
 *  otherwise only events whose resource type is listed are delivered. */
function addClient(res, channels = null) {
  const client = { res, channels }
  clients.add(client)
  return () => clients.delete(client)
}

function broadcast(payload) {
  const data = `data: ${JSON.stringify(payload)}\n\n`
  for (const client of clients) {
    try {
      client.res.write(data)
    } catch (err) {
      clients.delete(client)
    }
  }
}

function emit(resource) {
  const data = `data: ${JSON.stringify({ type: resource, at: new Date().toISOString() })}\n\n`
  for (const client of clients) {
    if (client.channels && !client.channels.includes(resource)) continue
    try {
      client.res.write(data)
    } catch (err) {
      clients.delete(client)
    }
  }
}

module.exports = { addClient, broadcast, emit, corsHeadersFor }