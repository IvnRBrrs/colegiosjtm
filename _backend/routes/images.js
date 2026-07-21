import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { ROLES } from '../roles.js'
import { rowsToObjects } from '../rows.js'
import crypto from 'crypto'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const includeData = req.query.data !== 'false'
    const columns = includeData ? '*' : 'id, filename, type, component_type, thumbnail, created_at'
    const result = await req.db.execute(`SELECT ${columns} FROM images ORDER BY created_at DESC`)
    res.json(rowsToObjects(result.rows, result.columns))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/:id/data', async (req, res) => {
  try {
    const result = await req.db.execute({
      sql: 'SELECT data, type FROM images WHERE id = ?',
      args: [req.params.id],
    })
    if (result.rows.length === 0) return res.status(404).json({ error: 'Image not found' })
    res.json(rowsToObjects(result.rows, result.columns)[0])
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/upload', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.EDITOR_ADMIN, ROLES.GESTOR_ADMIN), async (req, res) => {
  try {
    const { filename, data, type, component_type, thumbnail } = req.body
    if (!filename || !data || !type) {
      return res.status(400).json({ error: 'filename, data, and type are required' })
    }

    const id = crypto.randomUUID()
    await req.db.execute({
      sql: 'INSERT INTO images (id, filename, data, type, component_type, thumbnail) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, filename, data, type, component_type || null, thumbnail || null],
    })

    res.json({ id, filename, type })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.patch('/:id/thumbnail', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.EDITOR_ADMIN, ROLES.GESTOR_ADMIN), async (req, res) => {
  try {
    const { thumbnail } = req.body
    if (!thumbnail) return res.status(400).json({ error: 'thumbnail is required' })

    await req.db.execute({
      sql: 'UPDATE images SET thumbnail = ? WHERE id = ?',
      args: [thumbnail, req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:id', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.EDITOR_ADMIN, ROLES.GESTOR_ADMIN), async (req, res) => {
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
