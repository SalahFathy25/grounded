'use strict'

const fs = require('fs')
const path = require('path')

const envFile = path.join(__dirname, '..', '..', 'local.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const idx = line.indexOf('=')
    if (idx > 0) {
      const key = line.slice(0, idx).trim()
      let value = line.slice(idx + 1).trim()
      if (/^[A-Z_0-9]+$/.test(key) && !process.env[key]) {
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1)
        process.env[key] = value
      }
    }
  }
}

const db = require('../src/db')
const contentService = require('../src/services/contentService')

;(async () => {
  await db.init()
  const before = await contentService.get()
  console.log('BEFORE hero.title2.ar =', before.hero?.title2?.ar)
  console.log('BEFORE about.title.ar =', before.headings?.about?.title?.ar)
  console.log('BEFORE about.title2.ar =', before.headings?.about?.title2?.ar)

  const merged = await contentService.update({
    hero: { title2: { ar: 'على ذوقك' } },
    headings: { about: { title: { ar: 'جودة تحس بيها' }, title2: { ar: 'وأسعار هتحبها' } } },
  })

  console.log('AFTER  hero.title2.ar =', merged.hero?.title2?.ar)
  console.log('AFTER  about.title.ar =', merged.headings?.about?.title?.ar)
  console.log('AFTER  about.title2.ar =', merged.headings?.about?.title2?.ar)
  process.exit(0)
})().catch(err => {
  console.error(err)
  process.exit(1)
})