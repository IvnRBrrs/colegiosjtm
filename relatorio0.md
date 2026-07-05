# Relatório de Configuração — Backend Turso + Vercel

## 1. Pacotes e Dependências

| Pacote | Versão | Finalidade |
|--------|--------|------------|
| `@tursodatabase/serverless` | ^1.2.3 | **Driver Turso oficial para serverless** (zero deps nativas, usa só `fetch`) |
| `@libsql/client` | ^0.17.4 | Ainda em `dependencies` mas **não é mais usado no código** |
| `express` | ^5.2.1 | Framework HTTP |
| `dotenv` | ^17.4.2 | Carrega `.env` localmente |
| `cors` | ^2.8.6 | Middleware CORS |
| `jsonwebtoken` + `bcryptjs` | — | Autenticação JWT |
| `@vercel/node` | — | Não está no `package.json` (é instalado pela plataforma Vercel durante o build) |

---

## 2. Fluxo de Inicialização do Backend

**Arquivo:** `api/index.ts`

```
import 'dotenv/config'                  # Carrega .env (LOCAL) / noop (VERCEL)
      │
createDb()  ──────────────►  cria cliente Turso via @tursodatabase/serverless/compat
      │                         usa DATABASE_URL + DATABASE_AUTH_TOKEN do environment
      ▼
initDb(db)  ──────────────►  CREATE TABLE IF NOT EXISTS (8 tabelas)
      │                         executa assíncrono, erros logados via .catch()
      ▼
app.use(cors())
app.use(express.json())
app.use((req) => req.db = db)   # Injeta db em toda request
      │
app.use('/api/auth', authRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/pages', pagesRoutes)
app.use('/api/images', imagesRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/backups', backupsRoutes)
app.use('/api/seed', seedRoutes)
app.use('/api/blog', blogRoutes)
      │
app.use(global error handler)   # Captura erros não tratados
      │
export default app              # Exporta para Vercel (serverless) OU Vite (dev)
```

**Proteções extras (commits recentes):**
- `createDb()` envolto em try-catch — se falhar, `db = null` e middleware retorna 500 com `'Database not initialized'`
- Global error handler Express que captura erros não tratados
- `import.meta.url` em `seed.ts` envolto em try-catch (crashava em bundle CJS)

---

## 3. Driver de Conexão com Turso

**Arquivo:** `api/db.ts`

```ts
import { createClient } from '@tursodatabase/serverless/compat'
```

- Usa **`@tursodatabase/serverless/compat`** — o driver oficial da Turso para ambientes serverless
- **Zero dependências nativas** — implementação 100% JavaScript (Node.js `fetch` API)
- API **100% compatível** com `@libsql/client`:
  - `db.execute('SELECT 1')` — retorna `{ columns, rows, rowsAffected }`
  - `db.execute({ sql: 'SELECT ?', args: [val] })` — parâmetros posicionais
  - `row.coluna` — acesso por nome de coluna

**Tabelas gerenciadas (8):**
| Tabela | Uso |
|--------|-----|
| `content` | Chave-valor global das seções |
| `pages` | Páginas dinâmicas (slug, title, menu) |
| `page_content` | Conteúdo específico por página |
| `users` | Admin CMS (username + password_hash) |
| `images` | Imagens base64 |
| `content_backups` | Backups de seções |
| `contact_messages` | Mensagens do formulário de contato |
| `blog_posts` | Posts do blog |

---

## 4. Variáveis de Ambiente

**Arquivo local:** `.env` (gitignored)

```
DATABASE_URL=libsql://colegiostjm-db-dvlpr2025.aws-eu-west-1.turso.io
DATABASE_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
JWT_SECRET=cms-secret-key-change-in-production
```

| Variável | Onde é usada | Configurada no Vercel? |
|----------|-------------|----------------------|
| `DATABASE_URL` | `api/db.ts` — `createClient({ url })` | ✅ (deve estar em Environment Variables) |
| `DATABASE_AUTH_TOKEN` | `api/db.ts` — `authToken` (só se URL for `libsql://`) | ✅ |
| `JWT_SECRET` | `api/middleware/auth.ts` — assinatura JWT | ✅ |
| `VITE_API_URL` | `src/cms/api.ts` — fallback `/api` | ❌ Não precisa (default é `/api`) |

---

## 5. Funcionamento Local (Dev)

```
npm run dev
    │
    ▼
Vite dev server (localhost:5173)
    │
    ├── Frontend (React)
    │     └── axios → /api/... → Vite middleware
    │
    └── vite.config.ts
          │
          ├── configureServer()
          │     └── apiApp(req, res, next)  ← Express app de api/index.ts
          │
          └── import apiApp from './api/index.ts'
                │
                ├── dotenv/config carrega .env
                ├── createDb() → conexão Turso
                └── initDb(db) → CREATE TABLE IF NOT EXISTS
```

**Particularidades:**
- `import 'dotenv/config'` carrega automaticamente o `.env` (funciona em ESM)
- `import.meta.env.VITE_API_URL` = `undefined` (não definido), então fallback para `/api`
- Requests `/api/*` são roteados para o Express embutido no Vite **sem passar pela rede**
- Requests para `/api/content` usam o **mesmo processo Node** do Vite

---

## 6. Funcionamento em Produção (Vercel)

```
Browser → https://colegiosjtm.vercel.app/api/content
    │
    ▼
Vercel Edge Network
    │
    ├── vercel.json rewrite: /api/(.*) → /api/index.ts
    │
    ▼
@vercel/node (build)
    │
    ├── 1. Compila api/index.ts com esbuild (não tsc)
    │      usa api/tsconfig.json (sem allowImportingTsExtensions)
    │
    ├── 2. Type-check separado com tsc (não bloqueia build)
    │
    ├── 3. Gera serverless function bundle (CJS)
    │      Inclui @tursodatabase/serverless (JS puro, sem nativos)
    │
    ▼
Vercel Lambda (Rust-based Node.js runtime)
    │
    ├── 1. Module load (imports)
    │      - dotenv/config → noop (sem .env)
    │      - createDb() → lê DATABASE_URL do environment
    │      - initDb(db) → CREATE TABLE async
    │
    ├── 2. Request chega
    │      - Express processa
    │      - Route handler faz db.execute()
    │      - Turso via HTTP (fetch)
    │
    └── 3. Resposta JSON retorna ao browser
```

**Pipeline do Vercel:**
1. **Build**: `npm run build` → `tsc && vite build` → gera frontend estático em `dist/`
2. **Serverless**: `@vercel/node` compila `api/index.ts` → bundle CJS único
3. **Runtime**: AWS Lambda com runtime Node.js da Vercel (Rust-based)

---

## 7. Arquivos de Configuração

| Arquivo | Função |
|---------|--------|
| `vercel.json` | Framework Vite, rewrites `/api/*` → `api/index.ts`, cache de assets |
| `tsconfig.json` (raiz) | Config TS do frontend + `"include": ["src", "api"]` para type-check |
| `api/tsconfig.json` | Config TS exclusiva para API (sem `allowImportingTsExtensions`, sem `noEmit`) — evita conflito com `ncc` |
| `vite.config.ts` | Embuti Express no Vite dev server via `configureServer` |
| `src/cms/api.ts` | Axios com base `/api`, interceptors para token JWT e redirect 401 |

---

## 8. Rotas da API (8 arquivos)

| Rota | Arquivo | Auth | Descrição |
|------|---------|------|-----------|
| `POST /api/auth/login` | `routes/auth.ts` | ❌ | Login JWT |
| `GET /api/content` | `routes/content.ts` | ❌ | Lista todo conteúdo |
| `PUT /api/content` | `routes/content.ts` | ✅ | Atualiza chave |
| `PUT /api/content/bulk` | `routes/content.ts` | ✅ | Atualiza múltiplas |
| `DELETE /api/content/:key` | `routes/content.ts` | ✅ | Remove chave |
| `GET /api/pages` | `routes/pages.ts` | ❌ | Lista páginas |
| `POST /api/pages` | `routes/pages.ts` | ✅ | Cria página |
| `PUT /api/pages/:slug` | `routes/pages.ts` | ✅ | Atualiza página |
| `DELETE /api/pages/:slug` | `routes/pages.ts` | ✅ | Remove página |
| `GET /api/pages/:slug/content` | `routes/pages.ts` | ❌ | Conteúdo da página |
| `PUT /api/pages/:slug/content` | `routes/pages.ts` | ✅ | Atualiza chave da página |
| `PUT /api/pages/:slug/content/bulk` | `routes/pages.ts` | ✅ | Bulk update página |
| `GET /api/images` | `routes/images.ts` | ❌ | Lista imagens |
| `POST /api/images/upload` | `routes/images.ts` | ✅ | Upload imagem |
| `DELETE /api/images/:id` | `routes/images.ts` | ✅ | Remove imagem |
| `GET /api/messages` | `routes/messages.ts` | ✅ | Lista mensagens |
| `POST /api/messages` | `routes/messages.ts` | ❌ | Envia mensagem |
| `PUT /api/messages/:id/read` | `routes/messages.ts` | ✅ | Marca como lida |
| `DELETE /api/messages/:id` | `routes/messages.ts` | ✅ | Remove mensagem |
| `GET /api/backups/:sectionKey` | `routes/backups.ts` | ❌ | Histórico de backup |
| `POST /api/backups` | `routes/backups.ts` | ✅ | Cria backup |
| `POST /api/backups/restore` | `routes/backups.ts` | ✅ | Restaura backup |
| `GET/POST/PUT/DELETE /api/blog/posts[/:id]` | `routes/blog.ts` | Misto | CRUD blog |
| `GET /api/blog/tags` | `routes/blog.ts` | ❌ | Lista tags |
| `GET /api/blog/authors` | `routes/blog.ts` | ❌ | Lista autores |
| `GET /api/blog/archive` | `routes/blog.ts` | ❌ | Arquivo por mês |
| `POST /api/seed/images` | `routes/seed.ts` | ❌ | Seeds imagens |
| `POST /api/seed/content` | `routes/seed.ts` | ❌ | Seeds conteúdo default |

---

## 9. Problemas Conhecidos e Status

| Problema | Status | Fix |
|----------|--------|-----|
| `import.meta.url` em `api/index.ts` (crash ncc CJS) | ✅ Corrigido | `db2b6d9` — removido |
| `import.meta.url` em `api/routes/seed.ts` (crash ncc CJS) | ✅ Corrigido | `015f19d` — try-catch |
| `@libsql/client` carrega binário nativo (falha em Lambda) | ✅ Corrigido | `cee160d` — migrado para `@tursodatabase/serverless/compat` |
| `allowImportingTsExtensions` conflita com ncc | ✅ Corrigido | `cee160d` — `api/tsconfig.json` criado |
| Express 5 `req.params.slug` como `string \| string[]` | ✅ Corrigido | `4c6dd10` — casts `as string` |
| Type augmentation `req.db` não visível no build Vercel | ⚠️ Contornado | `4c6dd10` + `cee160d` — tsconfigs ajustados |
| **Vercel retorna 500 (FUNCTION_INVOCATION_FAILED)** | ❌ **Pendente** | Aguardando deploy do commit `cee160d` |

---

## 10. O que ainda pode causar 500 após o deploy

1. **`dotenv/config` no bundle CJS** — `import 'dotenv/config'` no topo do `api/index.ts`. No bundle CJS, `dotenv/config` é `require('dotenv').config()`. Como não há `.env` no Vercel, é noop. Mas se o `require('dotenv')` falhar (ex: pacote não incluído no bundle), o módulo crasha.

2. **Tempo de inicialização excede limite Lambda** — `initDb(db)` faz 8 `CREATE TABLE IF NOT EXISTS`. Se o Turso estiver lento, pode exceder o timeout de inicialização.

3. **Variáveis de ambiente não definidas no Vercel** — Se `DATABASE_URL` ou `DATABASE_AUTH_TOKEN` não estiverem configuradas no Vercel Dashboard, `createDb()` retorna cliente inválido → middleware retorna 500.

4. **Roteamento do Vercel** — O rewrite em `vercel.json` mapeia `/api/(.*)` para `/api/index.ts`. Se o runtime `@vercel/node` não reconhecer `.ts` corretamente, pode falhar.
