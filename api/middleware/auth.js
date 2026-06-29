import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'cms-secret-key-change-in-production'

export function generateToken(username) {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' })
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
