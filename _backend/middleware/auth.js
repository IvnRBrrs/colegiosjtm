import jwt from 'jsonwebtoken'
import { ROLES } from '../roles.js'

const JWT_SECRET = process.env.JWT_SECRET || 'cms-secret-key-change-in-production'

export function generateToken(username, role) {
  return jwt.sign({ username, role }, JWT_SECRET, { expiresIn: '24h' })
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const token = header.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

export function requireRole(...allowedRoles) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    let role = req.user.role
    if (!role && req.db) {
      try {
        const result = await req.db.execute({
          sql: 'SELECT role FROM users WHERE username = ?',
          args: [req.user.username],
        })
        if (result.rows.length > 0) {
          role = result.rows[0].role
        }
      } catch {}
    }
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permissions' })
    }
    next()
  }
}
