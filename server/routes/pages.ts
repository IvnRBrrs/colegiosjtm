import { Router, Request, Response } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await req.db!.execute('SELECT * FROM pages ORDER BY menu_order')
    res.json(result.rows)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { slug, title, show_in_menu, parent_slug, menu_order } = req.body
    await req.db!.execute({
      sql: 'INSERT INTO pages (slug, title, show_in_menu, parent_slug, menu_order) VALUES (?, ?, ?, ?, ?)',
      args: [slug, title, show_in_menu ?? 1, parent_slug || null, menu_order ?? 0],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:slug', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, show_in_menu, parent_slug, menu_order } = req.body
    await req.db!.execute({
      sql: 'UPDATE pages SET title = ?, show_in_menu = ?, parent_slug = ?, menu_order = ? WHERE slug = ?',
      args: [title, show_in_menu, parent_slug || null, menu_order, req.params.slug],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.delete('/:slug', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await req.db!.execute({
      sql: 'DELETE FROM pages WHERE slug = ?',
      args: [req.params.slug],
    })
    await req.db!.execute({
      sql: 'DELETE FROM page_content WHERE page_slug = ?',
      args: [req.params.slug],
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// Page content (merged with global content as defaults)
router.get('/:slug/content', async (req: Request, res: Response) => {
  try {
    const [pageResult, globalResult] = await Promise.all([
      req.db!.execute({
        sql: 'SELECT * FROM page_content WHERE page_slug = ?',
        args: [req.params.slug],
      }),
      req.db!.execute('SELECT * FROM content'),
    ])

    const data: Record<string, string> = {}

    // Global content as base/default
    globalResult.rows.forEach((row) => {
      data[row.key as string] = (row.value as string) || ''
    })

    // Page-specific content overrides
    pageResult.rows.forEach((row) => {
      data[row.key as string] = (row.value as string) || ''
    })

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:slug/content', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = req.body
    if (!key) return res.status(400).json({ error: 'Key is required' })

    await req.db!.execute({
      sql: `INSERT INTO page_content (page_slug, key, value) VALUES (?, ?, ?)
            ON CONFLICT(page_slug, key) DO UPDATE SET value = excluded.value`,
      args: [req.params.slug, key, value],
    })

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

router.put('/:slug/content/bulk', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { entries } = req.body as { entries: Record<string, string> }
    for (const [key, value] of Object.entries(entries)) {
      await req.db!.execute({
        sql: `INSERT INTO page_content (page_slug, key, value) VALUES (?, ?, ?)
              ON CONFLICT(page_slug, key) DO UPDATE SET value = excluded.value`,
        args: [req.params.slug, key, value],
      })
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
