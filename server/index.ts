import express from 'express'
import cors from 'cors'
import path from 'path'
import { createDb, initDb } from './db'
import authRoutes from './routes/auth'
import contentRoutes from './routes/content'
import pagesRoutes from './routes/pages'
import imagesRoutes from './routes/images'
import messagesRoutes from './routes/messages'
import backupsRoutes from './routes/backups'
import seedRoutes from './routes/seed'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json({ limit: '50mb' }))

const db = createDb()

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

async function start() {
  try {
    await initDb(db)
    console.log('Database initialized')

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

start()
