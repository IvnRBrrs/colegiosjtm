import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { ROLES } from '../roles.js'

const router = Router()

const _pending = new Map()

router.get('/', async (req, res) => {
  const cacheKey = 'content_all'
  if (_pending.has(cacheKey)) {
    const data = await _pending.get(cacheKey)
    return res.json(data)
  }
  const promise = (async () => {
    const result = await req.db.execute('SELECT * FROM content ORDER BY key')
    const data = {}
    result.rows.forEach((row) => {
      data[row.key] = row.value
    })
    return data
  })()
  _pending.set(cacheKey, promise)
  try {
    const data = await promise
    res.json(data)
  } finally {
    _pending.delete(cacheKey)
  }
})

router.put('/', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.EDITOR_ADMIN), async (req, res) => {
  try {
    const { key, value } = req.body
    if (!key) return res.status(400).json({ error: 'Key is required' })

    await req.db.execute({
      sql: `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      args: [key, value],
    })
    await req.db.execute({
      sql: `UPDATE content SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = '_content_version'`,
      args: [],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/bulk', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.EDITOR_ADMIN), async (req, res) => {
  try {
    const { entries } = req.body
    if (!entries) return res.status(400).json({ error: 'Entries required' })

    const statements = Object.entries(entries).map(([key, value]) => ({
      sql: `INSERT INTO content (key, value, updated_at) VALUES (?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      args: [key, value],
    }))
    if (statements.length > 0) {
      for (const stmt of statements) await req.db.execute(stmt)
      await req.db.execute({
        sql: `UPDATE content SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = '_content_version'`,
        args: [],
      })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:key', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.EDITOR_ADMIN), async (req, res) => {
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
