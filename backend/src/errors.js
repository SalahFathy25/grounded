'use strict'

/** HTTP error with a status code — mirrors the Spring exception classes. */
class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const badRequest = msg => new HttpError(400, msg)
const unauthorized = msg => new HttpError(401, msg)
const forbidden = msg => new HttpError(403, msg)
const notFound = msg => new HttpError(404, msg)
const conflict = msg => new HttpError(409, msg)

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict }
