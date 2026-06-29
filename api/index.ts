import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import { createDb, initDb } from './db'
import authRoutes from './routes/auth'
import contentRoutes from './routes/content'
import pagesRoutes from './routes/pages'
import imagesRoutes from './routes/images'
import messagesRoutes from './routes/messages'
import backupsRoutes from './routes/backups'
import seedRoutes from './routes/seed'
import blogRoutes from './routes/blog'

let db: ReturnType<typeof createDb> | null = null

try {
  db = createDb()
} catch (e) {
  console.error('createDb failed:', e)
}

if (db) {
  initDb(db).catch((e) => console.error('initDb failed:', e))
}

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use((req: Request, _res: Response, next: NextFunction) => {
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

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: String(err) })
})

export default app
