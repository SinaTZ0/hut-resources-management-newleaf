import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'

import type { Depth1Schema } from './zod-and-types/db-zod-schemas'

/*---------------------- Entities Table ----------------------*/
export const entitiesTable = pgTable('entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  depth1Schema: jsonb('depth1_schema').notNull().$type<Depth1Schema>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
