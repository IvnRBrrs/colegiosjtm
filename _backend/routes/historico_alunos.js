import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { ROLES } from '../roles.js'

const router = Router()

// All historico_alunos endpoints require super_admin or gestor_admin
router.use(authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.GESTOR_ADMIN))

router.get('/', async (req, res) => {
  try {
    const result = await req.db.execute('SELECT * FROM historico_alunos ORDER BY created_at DESC')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const { aluno_nome, ...fields } = req.body
    if (!aluno_nome) {
      return res.status(400).json({ error: 'aluno_nome is required' })
    }
    const id = crypto.randomUUID()
    await req.db.execute({
      sql: `INSERT INTO historico_alunos (id, aluno_nome, data) VALUES (?, ?, datetime('now'))`,
      args: [id, aluno_nome],
    })
    res.json({ success: true, id })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { aluno_nome, ...fields } = req.body
    await req.db.execute({
      sql: 'UPDATE historico_alunos SET aluno_nome = ? WHERE id = ?',
      args: [aluno_nome, req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM historico_alunos WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
