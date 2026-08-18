'use strict'

/* Initialize the database and ensure seed data exists (settings, content,
   and the demo users/products/orders on first run). Safe to run repeatedly. */

const db = require('../src/db')

db.init()
  .then(() => {
    console.log('Database initialized — data seeded on first run.')
    process.exit(0)
  })
  .catch(err => {
    console.error('Seeding failed:', err)
    process.exit(1)
  })
