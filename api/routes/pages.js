import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const result = await req.db.execute(`
      SELECT p.*, pc.key as content_key, pc.value as content_value
      FROM pages p
      LEFT JOIN page_content pc ON pc.page_slug = p.slug
      ORDER BY p.menu_order, p.slug
    `)

    const pageMap = {}
    for (const row of result.rows) {
      if (!pageMap[row.slug]) {
        pageMap[row.slug] = {
          slug: row.slug,
          title: row.title,
          show_in_menu: !!row.show_in_menu,
          parent_slug: row.parent_slug,
          menu_order: row.menu_order,
          created_at: row.created_at,
          content: {},
        }
      }
      if (row.content_key) {
        try {
          pageMap[row.slug].content[row.content_key] = JSON.parse(row.content_value)
        } catch {
          pageMap[row.slug].content[row.content_key] = row.content_value
        }
      }
    }

    res.json(Object.values(pageMap))
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/:slug', async (req, res) => {
  try {
    const result = await req.db.execute({
      sql: 'SELECT * FROM pages WHERE slug = ?',
      args: [req.params.slug],
    })

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' })
    }

    const page = result.rows[0]
    const contentResult = await req.db.execute({
      sql: 'SELECT key, value FROM page_content WHERE page_slug = ?',
      args: [req.params.slug],
    })

    const content = {}
    for (const row of contentResult.rows) {
      try {
        content[row.key] = JSON.parse(row.value)
      } catch {
        content[row.key] = row.value
      }
    }

    res.json({
      slug: page.slug,
      title: page.title,
      show_in_menu: !!page.show_in_menu,
      parent_slug: page.parent_slug,
      menu_order: page.menu_order,
      created_at: page.created_at,
      content,
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { slug, title, show_in_menu, parent_slug, menu_order, content } = req.body
    if (!slug || !title) return res.status(400).json({ error: 'slug and title are required' })

    await req.db.execute({
      sql: `INSERT INTO pages (slug, title, show_in_menu, parent_slug, menu_order)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(slug) DO UPDATE SET
              title = excluded.title, show_in_menu = excluded.show_in_menu,
              parent_slug = excluded.parent_slug, menu_order = excluded.menu_order`,
      args: [
        slug,
        title,
        show_in_menu !== undefined ? (show_in_menu ? 1 : 0) : 1,
        parent_slug || null,
        menu_order || 0,
      ],
    })

    if (content) {
      for (const [key, value] of Object.entries(content)) {
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
        await req.db.execute({
          sql: `INSERT INTO page_content (page_slug, key, value) VALUES (?, ?, ?)
                ON CONFLICT(page_slug, key) DO UPDATE SET value = excluded.value`,
          args: [slug, key, stringValue],
        })
      }
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.get('/:slug/content', async (req, res) => {
  try {
    // Fetch global content
    const globalResult = await req.db.execute('SELECT key, value FROM content')
    const content = {}
    for (const row of globalResult.rows) {
      try {
        content[row.key] = JSON.parse(row.value)
      } catch {
        content[row.key] = row.value
      }
    }
    // Fetch page-specific content (overrides global)
    const pageResult = await req.db.execute({
      sql: 'SELECT key, value FROM page_content WHERE page_slug = ?',
      args: [req.params.slug],
    })
    for (const row of pageResult.rows) {
      try {
        content[row.key] = JSON.parse(row.value)
      } catch {
        content[row.key] = row.value
      }
    }
    res.json(content)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:slug/content', authMiddleware, async (req, res) => {
  try {
    const entries = req.body
    for (const [key, value] of Object.entries(entries)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      await req.db.execute({
        sql: `INSERT INTO page_content (page_slug, key, value) VALUES (?, ?, ?)
              ON CONFLICT(page_slug, key) DO UPDATE SET value = excluded.value`,
        args: [req.params.slug, key, stringValue],
      })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:slug/content/bulk', authMiddleware, async (req, res) => {
  try {
    const { entries } = req.body
    if (!entries) return res.status(400).json({ error: 'Entries required' })
    for (const [key, value] of Object.entries(entries)) {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      await req.db.execute({
        sql: `INSERT INTO page_content (page_slug, key, value) VALUES (?, ?, ?)
              ON CONFLICT(page_slug, key) DO UPDATE SET value = excluded.value`,
        args: [req.params.slug, key, stringValue],
      })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:slug', authMiddleware, async (req, res) => {
  try {
    await req.db.execute({
      sql: 'DELETE FROM page_content WHERE page_slug = ?',
      args: [req.params.slug],
    })
    await req.db.execute({
      sql: 'DELETE FROM pages WHERE slug = ?',
      args: [req.params.slug],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
