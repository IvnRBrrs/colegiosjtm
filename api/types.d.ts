import type { Client } from '@tursodatabase/serverless/compat'

declare global {
  namespace Express {
    interface Request {
      db?: Client
    }
  }
}

export {}
