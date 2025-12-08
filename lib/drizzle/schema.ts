import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

/*------------------------ Field Type ------------------------*/
export const FIELD_TYPES = ['string', 'number', 'date', 'boolean'] as const
export type FieldType = (typeof FIELD_TYPES)[number]

/*------------- Field Definition Schema and Type -------------*/
export const fieldDefinitionSchema = z.object({
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1),
  sortable: z.boolean().default(true),
  required: z.boolean().default(false),
  order: z.number().int().min(0),
})
export type fieldDefinitionSchemaType = z.infer<typeof fieldDefinitionSchema>

/*----------------------- Depth 1 Type -----------------------*/
export type Depth1Schema = Record<string, fieldDefinitionSchemaType>

/*---------------------- Entities Table ----------------------*/
export const entitiesTable = pgTable('entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  // icon: text('icon'),
  depth1Schema: jsonb('depth1_schema').notNull().$type<Depth1Schema>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/*----------------- Entity Schemas and Types -----------------*/
export const entitySelectSchema = createSelectSchema(entitiesTable)
export const entityInsertSchema = createInsertSchema(entitiesTable)

export type entitySelectSchemaType = z.infer<typeof entitySelectSchema>
export type entityInsertSchemaType = z.infer<typeof entityInsertSchema>
