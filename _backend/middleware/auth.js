import jwt from 'jsonwebtoken'
import supabaseAdmin from '../supabaseAdmin.js'
import { ROLES } from '../roles.js'

const JWT_SECRET = process.env.JWT_SECRET || 'cms-secret-key-change-in-production'

export function generateToken(username, role, company_id) {
  return jwt.sign({ username, role, company_id: company_id || 'default' }, JWT_SECRET, { expiresIn: '24h' })
}

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = header.slice(7)

  // 1. Try Supabase auth first (if configured)
  if (supabaseAdmin) {
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
      if (user && !error) {
        req.user = {
          username: user.email || user.id,
          role: user.user_metadata?.role || user.role || ROLES.SUPER_ADMIN,
          company_id: user.user_metadata?.company_id || 'default',
          supabaseUid: user.id,
        }
        console.log('[Auth Middleware] Autenticado via Supabase:', req.user.username, 'role:', req.user.role, 'company_id:', req.user.company_id)
        return next()
      }
    } catch {}
  }

  // 2. Fallback: custom JWT (Turso)
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = {
      ...decoded,
      company_id: decoded.company_id || 'default',
    }
    console.log('[Auth Middleware] Autenticado via Turso (custom JWT):', req.user.username, 'role:', req.user.role, 'company_id:', req.user.company_id)
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
