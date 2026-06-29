import type { Client } from '@libsql/client/http'

declare global {
  namespace Express {
    interface Request {
      db?: Client
    }
  }
}

export {}
