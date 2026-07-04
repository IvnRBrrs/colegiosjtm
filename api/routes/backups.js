import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { rowsToObjects } from '../rows.js'

const router = Router()

router.get('/:sectionKey', async (req, res) => {
  try {
    const result = await req.db.execute({
      sql: 'SELECT * FROM content_backups WHERE section_key = ? ORDER BY version DESC LIMIT 6',
      args: [req.params.sectionKey],
    })
    res.json(rowsToObjects(result.rows, result.columns))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { section_key, value } = req.body
    if (!section_key || !value) {
      return res.status(400).json({ error: 'section_key and value are required' })
    }

    const versionResult = await req.db.execute({
      sql: 'SELECT COALESCE(MAX(version), 0) + 1 as next_version FROM content_backups WHERE section_key = ?',
      args: [section_key],
    })
    const version = versionResult.rows[0].next_version

    await req.db.execute({
      sql: 'INSERT INTO content_backups (section_key, value, version) VALUES (?, ?, ?)',
      args: [section_key, value, version],
    })

    res.json({ success: true, version })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/restore', authMiddleware, async (req, res) => {
  try {
    const { section_key, version } = req.body
    const result = await req.db.execute({
      sql: 'SELECT * FROM content_backups WHERE section_key = ? AND version = ?',
      args: [section_key, version],
    })

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Backup not found' })
    }

    const backup = result.rows[0]
    const value = JSON.parse(backup.value)

    const statements = Object.entries(value).map(([key, val]) => ({
      sql: `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      args: [key, String(val)],
    }))
    for (const stmt of statements) await req.db.execute(stmt)
    await bumpVersion(req.db)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
