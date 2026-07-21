import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { rowsToObjects } from '../rows.js'

const router = Router()

router.get('/preload', authMiddleware, async (req, res) => {
  try {
    const [contentResult, imagesResult, pagesResult, blogResult, tagsResult, messagesResult, preEnrollmentsResult] = await Promise.all([
      req.db.execute('SELECT key, value FROM content'),
      req.db.execute("SELECT id, filename, type, component_type, thumbnail, created_at FROM images ORDER BY created_at DESC"),
      req.db.execute('SELECT * FROM pages'),
      req.db.execute("SELECT id, title, subtitle, author, date, tags, images, slug, published, created_at FROM blog_posts ORDER BY date DESC LIMIT 50"),
      req.db.execute("SELECT tags FROM blog_posts WHERE tags != '[]'"),
      req.db.execute('SELECT id, name, email, phone, message, created_at, read, archived FROM contact_messages ORDER BY created_at DESC'),
      req.db.execute('SELECT * FROM pre_enrollments ORDER BY created_at DESC'),
    ])

    const content = {}
    contentResult.rows.forEach((r) => { content[r.key] = r.value })

    const tagSet = new Set()
    tagsResult.rows.forEach((row) => {
      try { JSON.parse(row.tags).forEach((t) => tagSet.add(t)) } catch {}
    })

    res.json({
      content,
      images: rowsToObjects(imagesResult.rows, imagesResult.columns),
      pages: rowsToObjects(pagesResult.rows, pagesResult.columns),
      blogPosts: rowsToObjects(blogResult.rows, blogResult.columns),
      tags: Array.from(tagSet).sort(),
      messages: rowsToObjects(messagesResult.rows, messagesResult.columns),
      preEnrollments: rowsToObjects(preEnrollmentsResult.rows, preEnrollmentsResult.columns),
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
