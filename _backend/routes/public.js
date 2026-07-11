import { Router } from 'express'
import { rowsToObjects } from '../rows.js'

const router = Router()

router.get('/initial', async (req, res) => {
  try {
    const [contentResult, pagesResult, homeContentResult] = await Promise.all([
      req.db.execute('SELECT * FROM content'),
      req.db.execute('SELECT * FROM pages ORDER BY menu_order'),
      req.db.execute("SELECT * FROM page_content WHERE page_slug = 'home'"),
    ])

    const content = {}
    contentResult.rows.forEach((r) => { content[r.key] = r.value })

    const homeContent = {}
    homeContentResult.rows.forEach((r) => { homeContent[r.key] = r.value })

    res.json({
      content,
      pages: rowsToObjects(pagesResult.rows, pagesResult.columns),
      homeContent,
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

export default router
