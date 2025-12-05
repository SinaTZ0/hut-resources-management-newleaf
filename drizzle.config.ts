import { defineConfig } from 'drizzle-kit'

import { serverEnvironment } from '@/lib/env/typesafe-env'

export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/drizzle/schema.ts',
  out: './lib/drizzle/migrations',
  dbCredentials: {
    url: serverEnvironment.DATABASE_URL,
    ssl: false,
  },
  casing: 'snake_case',
})
