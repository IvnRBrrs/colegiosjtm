import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import crypto from 'crypto'

const router = Router()

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
}

router.get('/posts', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))
    const offset = (page - 1) * limit
    const search = req.query.search || ''
    const tag = req.query.tag || ''
    const author = req.query.author || ''
    const year = req.query.year || ''
    const month = req.query.month || ''

    let where = 'WHERE 1=1'
    const args = []

    if (search) {
      where += ' AND (title LIKE ? OR subtitle LIKE ? OR author LIKE ? OR content LIKE ?)'
      const p = `%${search}%`
      args.push(p, p, p, p)
    }
    if (tag) {
      where += ' AND tags LIKE ?'
      args.push(`%"${tag}"%`)
    }
    if (author) {
      where += ' AND author = ?'
      args.push(author)
    }
    if (year) {
      where += " AND strftime('%Y', date) = ?"
      args.push(year)
      if (month) {
        where += " AND strftime('%m', date) = ?"
        args.push(month.padStart(2, '0'))
      }
    }

    const countResult = await req.db.execute({
      sql: `SELECT COUNT(*) as total FROM blog_posts ${where}`,
      args,
    })
    const total = countResult.rows[0].total

    const result = await req.db.execute({
      sql: `SELECT id, title, subtitle, author, date, tags, images, videos, slug, published, created_at
            FROM blog_posts ${where} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    })

    res.json({
      posts: result.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/posts/:id', async (req, res) => {
  try {
    const result = await req.db.execute({
      sql: 'SELECT * FROM blog_posts WHERE id = ? OR slug = ?',
      args: [req.params.id, req.params.id],
    })
    if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' })
    res.json(result.rows[0])
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/posts', authMiddleware, async (req, res) => {
  try {
    const { title, subtitle, content, author, date, tags, images, videos } = req.body
    if (!title) return res.status(400).json({ error: 'Title is required' })

    const id = crypto.randomUUID()
    let slug = slugify(title)
    const existing = await req.db.execute({
      sql: 'SELECT COUNT(*) as count FROM blog_posts WHERE slug = ?',
      args: [slug],
    })
    if (existing.rows[0].count > 0) {
      slug = slug + '-' + Date.now()
    }

    await req.db.execute({
      sql: `INSERT INTO blog_posts (id, title, subtitle, content, author, date, tags, images, videos, slug)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        title,
        subtitle || '',
        content || '',
        author || '',
        date || new Date().toISOString().split('T')[0],
        JSON.stringify(tags || []),
        JSON.stringify(images || []),
        JSON.stringify(videos || []),
        slug,
      ],
    })

    res.json({ success: true, id, slug })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const { title, subtitle, content, author, date, tags, images, videos, published } = req.body
    const existing = await req.db.execute({
      sql: 'SELECT * FROM blog_posts WHERE id = ?',
      args: [req.params.id],
    })
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Post not found' })

    let slug = existing.rows[0].slug
    if (title && title !== existing.rows[0].title) {
      slug = slugify(title)
      const dup = await req.db.execute({
        sql: 'SELECT COUNT(*) as count FROM blog_posts WHERE slug = ? AND id != ?',
        args: [slug, req.params.id],
      })
      if (dup.rows[0].count > 0) {
        slug = slug + '-' + Date.now()
      }
    }

    await req.db.execute({
      sql: `UPDATE blog_posts SET
        title = ?, subtitle = ?, content = ?, author = ?, date = ?,
        tags = ?, images = ?, videos = ?, slug = ?, published = ?
        WHERE id = ?`,
      args: [
        title ?? existing.rows[0].title,
        subtitle ?? existing.rows[0].subtitle,
        content ?? existing.rows[0].content,
        author ?? existing.rows[0].author,
        date ?? existing.rows[0].date,
        tags ? JSON.stringify(tags) : existing.rows[0].tags,
        images ? JSON.stringify(images) : existing.rows[0].images,
        videos ? JSON.stringify(videos) : existing.rows[0].videos,
        slug,
        published !== undefined ? (published ? 1 : 0) : existing.rows[0].published,
        req.params.id,
      ],
    })

    res.json({ success: true, slug })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/posts/:id', authMiddleware, async (req, res) => {
  try {
    const result = await req.db.execute({
      sql: 'DELETE FROM blog_posts WHERE id = ?',
      args: [req.params.id],
    })
    if (result.rowsAffected === 0) return res.status(404).json({ error: 'Post not found' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/tags', async (req, res) => {
  try {
    const result = await req.db.execute("SELECT tags FROM blog_posts WHERE tags != '[]'")
    const tagSet = new Set()
    result.rows.forEach((row) => {
      try {
        JSON.parse(row.tags).forEach((t) => tagSet.add(t))
      } catch {}
    })
    res.json(Array.from(tagSet).sort())
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/authors', async (req, res) => {
  try {
    const result = await req.db.execute("SELECT DISTINCT author FROM blog_posts WHERE author != '' ORDER BY author")
    res.json(result.rows.map((r) => r.author))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/archive', async (req, res) => {
  try {
    const result = await req.db.execute(`
      SELECT strftime('%Y', date) as year, strftime('%m', date) as month, COUNT(*) as count
      FROM blog_posts GROUP BY year, month ORDER BY year DESC, month DESC
    `)
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
