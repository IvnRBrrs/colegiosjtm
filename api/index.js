import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createDb, initDb } from '../_backend/db.js'
import authRoutes from '../_backend/routes/auth.js'
import contentRoutes from '../_backend/routes/content.js'
import pagesRoutes from '../_backend/routes/pages.js'
import imagesRoutes from '../_backend/routes/images.js'
import messagesRoutes from '../_backend/routes/messages.js'
import backupsRoutes from '../_backend/routes/backups.js'
import seedRoutes from '../_backend/routes/seed.js'
import blogRoutes from '../_backend/routes/blog.js'
import historicoAlunosRoutes from '../_backend/routes/historico_alunos.js'

console.log('[api/index.js] Starting module load...')
console.log('[api/index.js] DATABASE_URL present:', !!process.env.DATABASE_URL)
console.log('[api/index.js] DATABASE_AUTH_TOKEN present:', !!process.env.DATABASE_AUTH_TOKEN)

let db = null
let initPromise = null

try {
  db = createDb()
  console.log('[api/index.js] createDb() OK, db type:', typeof db)
  initPromise = initDb(db)
  initPromise.then(() => console.log('[api/index.js] initDb() complete')).catch((e) => console.error('[api/index.js] initDb failed:', e.message))
} catch (e) {
  console.error('[api/index.js] createDb FAILED:', e.message)
}

const app = express()
console.log('[api/index.js] Express app created')

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use(async (req, _res, next) => {
  console.log('[index.js middleware] req.url:', req.url, 'initPromise:', !!initPromise)
  if (!db) {
    console.error('[index.js middleware] db is null')
    return _res.status(500).json({ error: 'Database not initialized' })
  }
  if (initPromise) {
    console.log('[index.js middleware] awaiting initPromise...')
    try {
      await initPromise
      console.log('[index.js middleware] initPromise resolved')
    } catch (e) {
      console.error('[index.js middleware] initPromise REJECTED:', e.message)
      return _res.status(500).json({ error: 'Database init failed: ' + e.message })
    }
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
app.use('/api/historico-alunos', historicoAlunosRoutes)

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: String(err) })
})

export default app
