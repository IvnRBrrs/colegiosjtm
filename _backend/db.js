import { createClient } from '@tursodatabase/serverless/compat'
import bcrypt from 'bcryptjs'

export function createDb() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL environment variable is required')
  const isTurso = url.startsWith('libsql://')
  console.log('[api/db.js] URL:', url.slice(0, 30) + '...', 'isTurso:', isTurso, 'hasToken:', !!process.env.DATABASE_AUTH_TOKEN)

  const client = createClient({
    url,
    ...(isTurso && process.env.DATABASE_AUTH_TOKEN
      ? { authToken: process.env.DATABASE_AUTH_TOKEN }
      : {}),
  })
  console.log('[api/db.js] Client created successfully')
  return client
}

let _initPromise = null

export async function initDb(db) {
  console.log('[db.js] initDb called, _initPromise:', !!_initPromise)
  if (_initPromise) return _initPromise

  const tables = [
    `CREATE TABLE IF NOT EXISTS content (
      key TEXT PRIMARY KEY, value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY, title TEXT NOT NULL,
      show_in_menu INTEGER DEFAULT 1, parent_slug TEXT,
      menu_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parent_slug) REFERENCES pages(slug))`,
    `CREATE TABLE IF NOT EXISTS page_content (
      page_slug TEXT NOT NULL, key TEXT NOT NULL,
      value TEXT,
      PRIMARY KEY (page_slug, key),
      FOREIGN KEY (page_slug) REFERENCES pages(slug))`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY, filename TEXT NOT NULL,
      data TEXT NOT NULL, type TEXT NOT NULL,
      component_type TEXT,
      created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS content_backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL, value TEXT NOT NULL,
      version INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS historico_alunos (
      id TEXT PRIMARY KEY,
      aluno_nome TEXT NOT NULL,
      data TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY, title TEXT NOT NULL,
      subtitle TEXT DEFAULT '', content TEXT NOT NULL DEFAULT '',
      author TEXT DEFAULT '', date TEXT NOT NULL,
      tags TEXT DEFAULT '[]', images TEXT DEFAULT '[]',
      videos TEXT DEFAULT '[]', slug TEXT UNIQUE,
      published INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')))`,
  ]

  console.log('[db.js] Starting sequential CREATE TABLEs...')
  _initPromise = (async () => {
    for (const sql of tables) await db.execute(sql)
  })()
  try {
    await _initPromise
    console.log('[db.js] All CREATE TABLEs done')
  } catch (e) {
    console.error('[db.js] CREATE TABLEs FAILED:', e.message)
    _initPromise = null
    throw e
  }

  // Check if migration already completed (avoids running on every Vercel cold start)
  try {
    const versionCheck = await db.execute(`SELECT value FROM content WHERE key = '_migration_version'`)
    if (versionCheck.rows.length > 0) {
      console.log('[db.js] Migration already complete, skipping')
      return
    }
  } catch {}

  const tableInfo = await db.execute('PRAGMA table_info(users)')
  const existingColumns = tableInfo.rows.map((r) => r.name)

  if (!existingColumns.includes('role')) {
    await db.execute(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'super_admin'`)
    console.log('[db.js] Role column added')
  }

  if (!existingColumns.includes('email')) {
    await db.execute(`ALTER TABLE users ADD COLUMN email TEXT`)
    console.log('[db.js] Email column added')
  }

  if (!existingColumns.includes('must_change_password')) {
    await db.execute(`ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0`)
    console.log('[db.js] must_change_password column added')
  }

  await db.execute(`UPDATE users SET email = username || '@colegiostjm.com.br' WHERE email IS NULL OR email = ''`)
  console.log('[db.js] Emails seeded')

  await db.execute(`INSERT OR IGNORE INTO content (key, value) VALUES ('_content_version', '1')`)
  console.log('[db.js] _content_version OK')

  const r1 = await db.execute(`UPDATE pages SET slug = TRIM(slug, '/') WHERE slug LIKE '/%' OR slug LIKE '%/'`)
  const r2 = await db.execute(`UPDATE page_content SET page_slug = TRIM(page_slug, '/') WHERE page_slug LIKE '/%' OR page_slug LIKE '%/'`)
  const affected = (r1.rowsAffected || 0) + (r2.rowsAffected || 0)
  if (affected > 0) {
    await db.execute(`UPDATE content SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = '_content_version'`)
  }
  console.log('[db.js] Slugs trimmed, affected:', affected)

  const navResult = await db.execute(`SELECT value FROM content WHERE key = '_nav_items'`)
  if (navResult.rows.length > 0) {
    const raw = navResult.rows[0].value
    let items = []
    try { items = JSON.parse(raw) } catch {}
    let changed = false
    items.forEach((item) => {
      if (item.label === 'Contato') { item.label = 'Login'; item.href = '/admin/login'; changed = true }
    })
    if (changed) {
      await db.execute({ sql: `UPDATE content SET value = ? WHERE key = '_nav_items'`, args: [JSON.stringify(items)] })
      await db.execute(`UPDATE content SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT) WHERE key = '_content_version'`)
      console.log('[db.js] Nav Contato → Login updated, version bumped')
    } else {
      console.log('[db.js] Nav already has Login, skipping')
    }
  }

  await db.execute(`INSERT OR IGNORE INTO pages (slug, title) VALUES ('home', 'Home')`)
  const homeSections = JSON.stringify([
    { title: 'Hero', instanceId: 'hero' },
    { title: 'Sobre', instanceId: 'sobre' },
    { title: 'Segmentos', instanceId: 'segmentos' },
    { title: 'Galeria', instanceId: 'galeria' },
    { title: 'Depoimentos', instanceId: 'depoimentos' },
    { title: 'FAQ', instanceId: 'faq' },
    { title: 'Contato', instanceId: 'contato' },
    { title: 'Mapa', instanceId: 'mapa' },
    { title: 'Blog', instanceId: 'blog' },
  ])
  await db.execute({
    sql: `INSERT OR IGNORE INTO page_content (page_slug, key, value) VALUES ('home', '_sections', ?)`,
    args: [homeSections],
  })
  console.log('[db.js] Home page _sections seeded OK')

  const testUsers = [
    { username: 'super_admin', password: 'admin123', role: 'super_admin', email: 'admin@colegiostjm.com.br' },
    { username: 'editor_admin', password: 'editor123', role: 'editor_admin', email: 'editor@colegiostjm.com.br' },
    { username: 'editor_blog', password: 'blog123', role: 'editor_blog', email: 'blog@colegiostjm.com.br' },
    { username: 'gestor_admin', password: 'gestor123', role: 'gestor_admin', email: 'gestor@colegiostjm.com.br' },
  ]
  for (const u of testUsers) {
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE username = ?', args: [u.username] })
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(u.password, 10)
      await db.execute({
        sql: 'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)',
        args: [u.username, hash, u.role, u.email],
      })
      console.log('[db.js] User created:', u.username, 'role:', u.role)
    }
  }
  console.log('[db.js] Test users seeding complete')

  // Mark migration as complete so cold starts skip it
  await db.execute(`INSERT OR IGNORE INTO content (key, value) VALUES ('_migration_version', '1')`)
  console.log('[db.js] Migration marked complete')
}
