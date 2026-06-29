import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { rowsToObjects } from '../rows.js'

const router = Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await req.db.execute('SELECT * FROM contact_messages ORDER BY created_at DESC')
    res.json(rowsToObjects(result.rows, result.columns))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email, and message are required' })
    }

    await req.db.execute({
      sql: 'INSERT INTO contact_messages (name, email, phone, message) VALUES (?, ?, ?, ?)',
      args: [name, email, phone || null, message],
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await req.db.execute({
      sql: 'UPDATE contact_messages SET read = 1 WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM contact_messages WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
