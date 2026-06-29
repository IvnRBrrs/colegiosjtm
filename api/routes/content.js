import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const result = await req.db.execute('SELECT * FROM content ORDER BY key')
    const data = {}
    result.rows.forEach((row) => {
      data[row.key] = row.value
    })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/', authMiddleware, async (req, res) => {
  try {
    const { key, value } = req.body
    if (!key) return res.status(400).json({ error: 'Key is required' })

    await req.db.execute({
      sql: `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      args: [key, value],
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/bulk', authMiddleware, async (req, res) => {
  try {
    const { entries } = req.body
    if (!entries) return res.status(400).json({ error: 'Entries required' })

    for (const [key, value] of Object.entries(entries)) {
      await req.db.execute({
        sql: `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
        args: [key, value],
      })
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:key', authMiddleware, async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM content WHERE key = ?',
      args: [req.params.key],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
