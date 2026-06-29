import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createDb, initDb } from './db.js'
import authRoutes from './routes/auth.js'
import contentRoutes from './routes/content.js'
import pagesRoutes from './routes/pages.js'
import imagesRoutes from './routes/images.js'
import messagesRoutes from './routes/messages.js'
import backupsRoutes from './routes/backups.js'
import seedRoutes from './routes/seed.js'
import blogRoutes from './routes/blog.js'

console.log('[api/index.js] Starting module load...')
console.log('[api/index.js] DATABASE_URL present:', !!process.env.DATABASE_URL)
console.log('[api/index.js] DATABASE_AUTH_TOKEN present:', !!process.env.DATABASE_AUTH_TOKEN)

let db = null

try {
  db = createDb()
  console.log('[api/index.js] createDb() OK, db type:', typeof db)
} catch (e) {
  console.error('[api/index.js] createDb FAILED:', e.message)
}

if (db) {
  initDb(db).then(() => console.log('[api/index.js] initDb() complete')).catch((e) => console.error('[api/index.js] initDb failed:', e.message))
}

const app = express()
console.log('[api/index.js] Express app created')

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use((req, _res, next) => {
  if (!db) {
    return _res.status(500).json({ error: 'Database not initialized' })
  }
  req.db = db
  next()
})

app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/pages', pagesRoutes)
app.use('/api/images', imagesRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/backups', backupsRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/blog', blogRoutes)

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: String(err) })
})

export default app
