import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { generateToken, authMiddleware, requireRole } from '../middleware/auth.js'
import { ROLES, ROLE_NAMES } from '../roles.js'
import { rowsToObjects } from '../rows.js'

const router = Router()

router.post('/setup', async (req, res) => {
  try {
    const { username, password, email } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }

    const existing = await req.db.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username],
    })

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hash = await bcrypt.hash(password, 10)
    const userEmail = email || (username + '@colegiostjm.com.br')
    await req.db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)',
      args: [username, hash, ROLES.SUPER_ADMIN, userEmail],
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const result = await req.db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [username],
    })

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password_hash)

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const role = user.role || ROLES.SUPER_ADMIN
    const mustChangePassword = !!user.must_change_password
    const token = generateToken(username, role)
    res.json({ token, role, mustChangePassword })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// User list — super_admin sees all; others see only themselves
router.get('/users', authMiddleware, async (req, res) => {
  try {
    let role = req.user.role
    if (!role) {
      const lookup = await req.db.execute({
        sql: 'SELECT role FROM users WHERE username = ?',
        args: [req.user.username],
      })
      if (lookup.rows.length > 0) role = lookup.rows[0].role
    }
    if (role !== ROLES.SUPER_ADMIN) {
      const result = await req.db.execute({
        sql: 'SELECT id, username, email, role, created_at, must_change_password FROM users WHERE username = ? ORDER BY created_at',
        args: [req.user.username],
      })
      return res.json(rowsToObjects(result.rows, result.columns))
    }
    const result = await req.db.execute('SELECT id, username, email, role, created_at, must_change_password FROM users ORDER BY created_at')
    res.json(rowsToObjects(result.rows, result.columns))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/users', authMiddleware, requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { username, password, role, email } = req.body
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' })
    }
    if (role && !ROLE_NAMES[role]) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const existing = await req.db.execute({
      sql: 'SELECT id FROM users WHERE username = ?',
      args: [username],
    })

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hash = await bcrypt.hash(password, 10)
    const userRole = role || ROLES.EDITOR_ADMIN
    const userEmail = email || (username + '@colegiostjm.com.br')
    await req.db.execute({
      sql: 'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)',
      args: [username, hash, userRole, userEmail],
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/users/:id', authMiddleware, requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { username, role, email } = req.body
    const sets = []
    const args = []
    if (username !== undefined) {
      const dup = await req.db.execute({
        sql: 'SELECT id FROM users WHERE username = ? AND id != ?',
        args: [username, req.params.id],
      })
      if (dup.rows.length > 0) return res.status(400).json({ error: 'Username already taken' })
      sets.push('username = ?')
      args.push(username)
    }
    if (role) {
      if (!ROLE_NAMES[role]) return res.status(400).json({ error: 'Invalid role' })
      sets.push('role = ?')
      args.push(role)
    }
    if (email !== undefined) {
      sets.push('email = ?')
      args.push(email)
    }
    if (sets.length === 0) {
      return res.status(400).json({ error: 'Nothing to update' })
    }
    args.push(req.params.id)
    await req.db.execute({
      sql: `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
      args,
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Reset password — super_admin can reset any user; others can reset only themselves
router.post('/users/:id/reset-password', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body
    if (!password) return res.status(400).json({ error: 'Password required' })

    const me = await req.db.execute({
      sql: 'SELECT id, role FROM users WHERE username = ?',
      args: [req.user.username],
    })
    if (me.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    const currentUser = me.rows[0]
    const isSuper = currentUser.role === ROLES.SUPER_ADMIN
    const targetId = parseInt(req.params.id)

    if (currentUser.id !== targetId && !isSuper) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const hash = await bcrypt.hash(password, 10)
    await req.db.execute({
      sql: 'UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?',
      args: [hash, targetId],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword required' })
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters' })
    }

    const result = await req.db.execute({
      sql: 'SELECT * FROM users WHERE username = ?',
      args: [req.user.username],
    })

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = result.rows[0]
    const valid = await bcrypt.compare(currentPassword, user.password_hash)

    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' })
    }

    const hash = await bcrypt.hash(newPassword, 10)
    await req.db.execute({
      sql: 'UPDATE users SET password_hash = ?, must_change_password = 0 WHERE username = ?',
      args: [hash, req.user.username],
    })

    const newToken = generateToken(req.user.username, req.user.role || ROLES.SUPER_ADMIN)
    res.json({ success: true, token: newToken })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/users/:id', authMiddleware, requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [req.params.id],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
