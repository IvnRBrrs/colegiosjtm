import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { ROLES } from '../roles.js'
import { rowsToObjects } from '../rows.js'

const router = Router()

router.get('/', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.GESTOR_ADMIN), async (req, res) => {
  try {
    const result = await req.db.execute('SELECT * FROM pre_enrollments ORDER BY created_at DESC')
    res.json(rowsToObjects(result.rows, result.columns))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const { responsavel, nome_aluno, idade, ano_letivo_atual, serie_desejada, telefone, whatsapp, email, mensagem, source } = req.body
    if (!responsavel || !nome_aluno || !email) {
      return res.status(400).json({ error: 'responsavel, nome_aluno, and email are required' })
    }

    await req.db.execute({
      sql: 'INSERT INTO pre_enrollments (responsavel, nome_aluno, idade, ano_letivo_atual, serie_desejada, telefone, whatsapp, email, mensagem, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [responsavel, nome_aluno, idade || null, ano_letivo_atual || null, serie_desejada || null, telefone || null, whatsapp || null, email, mensagem || null, source || 'cliente'],
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:id/read', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.GESTOR_ADMIN), async (req, res) => {
  try {
    await req.db.execute({
      sql: 'UPDATE pre_enrollments SET read = 1 WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:id/archive', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.GESTOR_ADMIN), async (req, res) => {
  try {
    await req.db.execute({
      sql: 'UPDATE pre_enrollments SET archived = 1 WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:id', authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.GESTOR_ADMIN), async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM pre_enrollments WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
