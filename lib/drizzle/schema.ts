import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { z } from 'zod/v4'
import type { IsEqual } from 'type-fest'

/*------------------------ Field Type ------------------------*/
export const FIELD_TYPES = ['string', 'number', 'date', 'boolean'] as const
export type FieldType = (typeof FIELD_TYPES)[number]

// Field  Schema and Type
export const fieldSchema = z.strictObject({
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1),
  sortable: z.boolean().default(true),
  required: z.boolean().default(false),
  order: z.number().int().min(0),
})

export type FieldSchemaType = z.infer<typeof fieldSchema>

/*----------------------- Depth 1 Type -----------------------*/
export const depth1Schema = z.record(z.string(), fieldSchema)

export type Depth1Schema = z.infer<typeof depth1Schema>

/*---------------------- Entities Table ----------------------*/
export const entitiesTable = pgTable('entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  depth1Schema: jsonb('depth1_schema').notNull().$type<Depth1Schema>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Entity Types
export type SelectEntitiesTable = typeof entitiesTable.$inferSelect
export type InsertEntitiesTable = typeof entitiesTable.$inferInsert

// Entity zod schemas
export const EntitySchema = z.strictObject({
  id: z.uuid().optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  depth1Schema: depth1Schema,
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type EntitySchemaType = z.infer<typeof EntitySchema>

// Type check: Ensure ZOD schema matches Drizzle schema
const _EntitySchemaTypeCheck: IsEqual<EntitySchemaType, InsertEntitiesTable> = true
