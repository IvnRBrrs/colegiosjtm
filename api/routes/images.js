import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const result = await req.db.execute('SELECT * FROM images ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { filename, data, type, component_type } = req.body
    if (!filename || !data || !type) {
      return res.status(400).json({ error: 'filename, data, and type are required' })
    }

    const id = crypto.randomUUID()
    await req.db.execute({
      sql: 'INSERT INTO images (id, filename, data, type, component_type) VALUES (?, ?, ?, ?, ?)',
      args: [id, filename, data, type, component_type || null],
    })

    res.json({ id, filename, type })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM images WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
