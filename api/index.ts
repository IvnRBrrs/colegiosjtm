import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { createDb, initDb } from './db'
import authRoutes from './routes/auth'
import contentRoutes from './routes/content'
import pagesRoutes from './routes/pages'
import imagesRoutes from './routes/images'
import messagesRoutes from './routes/messages'
import backupsRoutes from './routes/backups'
import seedRoutes from './routes/seed'
import blogRoutes from './routes/blog'

const app = express()
const db = createDb()

initDb(db).catch(console.error)

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use((req, _res, next) => {
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

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (Turso)`)
  })
}

export default app
