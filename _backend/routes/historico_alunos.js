import { Router } from 'express'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { ROLES } from '../roles.js'
import { rowsToObjects } from '../rows.js'

const router = Router()

router.use(authMiddleware, requireRole(ROLES.SUPER_ADMIN, ROLES.GESTOR_ADMIN))

const INSERT_FIELDS = [
  'nome', 'sexo', 'escolaridade', 'turma', 'data_nascimento',
  'cpf', 'telefone', 'nome_pai', 'nome_mae', 'telefone_pais',
  'responsavel_financeiro', 'cpf_responsavel', 'endereco', 'telefone_contato',
  'ano_letivo_atual', 'turma_atual',
]

router.get('/', async (req, res) => {
  try {
    const search = (req.query.search || '').trim()
    let sql = 'SELECT * FROM alunos'
    let args = []
    if (search) {
      sql += " WHERE nome LIKE ? OR cpf LIKE ? OR strftime('%Y', created_at) LIKE ?"
      const p = `%${search}%`
      args = [p, p, p]
    }
    sql += ' ORDER BY created_at DESC'
    const result = await req.db.execute({ sql, args })
    res.json(rowsToObjects(result.rows, result.columns))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const aluno = await req.db.execute({
      sql: 'SELECT * FROM alunos WHERE id = ?',
      args: [req.params.id],
    })
    if (aluno.rows.length === 0) return res.status(404).json({ error: 'Aluno not found' })

    const anexos = await req.db.execute({
      sql: 'SELECT id, aluno_id, categoria, filename, type, created_at FROM aluno_anexos WHERE aluno_id = ?',
      args: [req.params.id],
    })

    res.json({
      aluno: rowsToObjects(aluno.rows, aluno.columns)[0],
      anexos: rowsToObjects(anexos.rows, anexos.columns),
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/', async (req, res) => {
  try {
    const id = crypto.randomUUID()
    const sets = ['id']
    const vals = [id]
    const placeholders = ['?']
    for (const field of INSERT_FIELDS) {
      if (req.body[field] !== undefined && req.body[field] !== null) {
        sets.push(field)
        vals.push(req.body[field])
        placeholders.push('?')
      }
    }
    await req.db.execute({
      sql: `INSERT INTO alunos (${sets.join(', ')}) VALUES (${placeholders.join(', ')})`,
      args: vals,
    })
    res.json({ success: true, id })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const sets = []
    const args = []
    for (const field of INSERT_FIELDS) {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = ?`)
        args.push(req.body[field])
      }
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Nothing to update' })
    sets.push("updated_at = datetime('now')")
    args.push(req.params.id)
    await req.db.execute({
      sql: `UPDATE alunos SET ${sets.join(', ')} WHERE id = ?`,
      args,
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM aluno_anexos WHERE aluno_id = ?',
      args: [req.params.id],
    })
    await req.db.execute({
      sql: 'DELETE FROM alunos WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/:id/anexos', async (req, res) => {
  try {
    const { categoria, filename, data, type } = req.body
    if (!categoria || !filename || !data || !type) {
      return res.status(400).json({ error: 'categoria, filename, data, type required' })
    }
    const id = crypto.randomUUID()
    await req.db.execute({
      sql: 'INSERT INTO aluno_anexos (id, aluno_id, categoria, filename, data, type) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, req.params.id, categoria, filename, data, type],
    })
    res.json({ success: true, id })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/anexos/:anexoId', async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM aluno_anexos WHERE id = ?',
      args: [req.params.anexoId],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
