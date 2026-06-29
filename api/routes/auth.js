import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { generateToken } from '../middleware/auth.js'

const router = Router()

router.post('/setup', async (req, res) => {
  try {
    const { username, password } = req.body
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
    await req.db.execute({
      sql: 'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      args: [username, hash],
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

    const token = generateToken(username)
    res.json({ token })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
