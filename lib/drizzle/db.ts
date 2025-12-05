import { drizzle } from 'drizzle-orm/node-postgres'

import { serverEnvironment } from '@/lib/env/typesafe-env'

import * as schema from './schema'

export const db = drizzle(serverEnvironment.DATABASE_URL, {
  schema,
  casing: 'snake_case',
})
