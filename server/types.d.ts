import { createClient } from '@libsql/client'

declare global {
  namespace Express {
    interface Request {
      db?: ReturnType<typeof createClient>
    }
  }
}

export {}
