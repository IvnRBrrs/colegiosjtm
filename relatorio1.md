Full CMS with Turso backend: dynamic page sections, blog posts, image library, and all content persisted in the database.
Constraints & Preferences
All content must come from Turso, not hardcoded defaults.
No breaking changes; extreme care with every modification.
React StrictMode double-mount must not cause timeouts or crashes.
Section order, creation, and deletion must work from the admin PageEditor.
No .ts/.tsx in api/ — all backend files must be plain .js for Vercel.
Progress
Done
api/db.js — CREATE TABLEs sequential (was parallel Promise.all causing Turso contention/hang).
src/cms/contentCache.ts — cache with empty d = {} is now treated as MISS; forces fresh API call.
api/routes/pages.js — POST /, PUT /:slug/content, PUT /:slug/content/bulk use individual db.execute() calls instead of db.batch().
api/routes/backups.js — POST /restore uses individual db.execute() calls instead of db.batch().
api/routes/content.js — PUT /bulk uses individual db.execute() calls instead of db.batch().
api/db.js — initDb seeds home page + _sections default array (Hero, Sobre, Segmentos, Galeria, Depoimentos, FAQ, Contato, Mapa, Blog).
api/routes/pages.js — Removed _sections auto-creation write from GET /:slug/content (now read-only); bumpVersion always called on page create (even without content); console.error added to catch blocks of all REST endpoints.
src/components/GlobalNavbar.tsx — buildNavContent finds or creates "O Colégio" dropdown, merges visible pages as sub-items.
src/sections/Blog/admin.tsx — Added showForm state; "+ Novo Post" form now appears (was stuck because condition (editingId || form.title) evaluated falsy for empty title).
src/admin/PageManager.tsx — saveAll now only persists _sections + keys belonging to sections in the page (based on schema keys/listKeys), not all global pageContent. Error alert now shows err.response?.data?.error.
Root cause found: batch() in @tursodatabase/serverless/compat discards args — compat/index.js only uses normalized.sql, ignores normalized.args. Replaced all db.batch(statements) with for...of db.execute(stmt).
api/db.js — Migração automática: substitui "Contato" por "Login" nos _nav_items existentes + incrementa _content_version para invalidar cache.
api/routes/seed.js — Seed corrigido: "Contato" → "Login" com href /admin/login.
src/cms/PageBuilder.tsx — useMemo extraído para componente SectionRenderer separado (não mais dentro de .map()), eliminando "Rendered fewer hooks than expected" ao remover seções.
src/cms/contentCache.ts — _pendingFetches Map deduplica chamadas em andamento em fetchPageContentCached, fetchContentCached, fetchPagesCached.
src/cms/DynamicPage.tsx — Estados notFound (404) e fetchFailed (timeout/rede) com tela de erro "Ops, a página não existe + botão Voltar para Home" e retry automático após 3s.
api/routes/pages.js — GET /:slug/content verifica existência da página na tabela pages antes de retornar conteúdo (404 se não encontrada).
src/cms/api.ts — Timeout Axios aumentado de 20s para 60s.
api/routes/pages.js — Queries paralelas em GET /:slug/content mescladas em única UNION ALL.
Verificação completa de compatibilidade Vercel: todas as 8 verificações PASS.
In Progress
(none)
Blocked
(none)
Key Decisions
Remover db.batch() completamente — o compat layer do @tursodatabase/serverless 1.2.3 descarta os args no batch. Usar db.execute() em loop é a única forma segura de passar parâmetros.
_sections seeded in initDb rather than auto-created on GET to avoid write contention during reads.
Page save only sends section-relevant keys (not all global 87+ keys) to avoid bloating page_content and hitting Turso limits.
Deduplicação de chamadas via _pendingFetches ao invés de useRef guard — elimina race conditions do StrictMode sem quebrar o segundo mount.
Next Steps
Test the full CMS flow end-to-end: create page, reorder/remove sections, save, verify all content persists and loads.
Confirm "Login" link aparece no navbar em vez de "Contato" após deploy.
Confirm 404 page aparece para slugs inexistentes.
Critical Context
Turso/libSQL client version 0.17.4, @tursodatabase/serverless 1.2.3.
batch() do compat layer é bugado: joga os args fora. Qualquer statement com ? placeholders sem args no batch recebe NULL → NOT NULL constraint failed.
React StrictMode double-mount causa 2 chamadas paralelas — o AsyncLock do serverless serializa na mesma conexão, a segunda estoura timeout. _pendingFetches resolve.
Seed data (POST /api/seed/content) fornece conteúdo global default (87+ keys) e _sections para home — initDb também garante _sections no startup.
Blog posts stored in dedicated blog_posts table; section config keys (blog_label, etc.) come from content/page_content.
ThreeBackground já está em chunk separado via React.lazy(), ~882KB carregado assincronamente.
Vercel configurado: framework vite, output dist/, rewrites /api/* → api/index.js e /* → index.html.
Relevant Files
api/db.js: Database init, CREATE TABLEs, _content_version, home page + _sections seeding, migração Contato→Login.
api/routes/pages.js: Page CRUD endpoints, GET verifica existência (404), db.execute() no lugar de batch(), queries mescladas em UNION ALL.
api/routes/content.js: Global content endpoints, PUT /bulk com db.execute().
api/routes/blog.js: Blog post CRUD.
api/routes/backups.js: Backup/restore, POST /restore com db.execute().
api/routes/seed.js: Seed data corrigido (Login em vez de Contato).
src/cms/contentCache.ts: localStorage cache com _pendingFetches dedup, revalidação por versão.
src/cms/api.ts: Axios client com 60s timeout, auth interceptor.
src/cms/PageBuilder.tsx: SectionRenderer extraído para evitar hooks em .map().
src/cms/DynamicPage.tsx: Estados notFound (404) e fetchFailed (retry 3s), tela "Ops, página não existe".
src/components/GlobalNavbar.tsx: buildNavContent lê _nav_items do content table, constroi dropdown "O Colégio".
src/components/Navbar.tsx: Componente antigo (não usado, o navbar é CMS-driven).
src/sections/Blog/admin.tsx: Blog admin com fix showForm.
src/admin/PageManager.tsx: saveAll envia apenas keys relevantes + _sections.
src/sections/*/schema.ts: 11 section schemas.
vercel.json: Config de deploy Vercel.
node_modules/@tursodatabase/serverless/dist/compat/index.js: Código-fonte do compat layer com bug do batch().