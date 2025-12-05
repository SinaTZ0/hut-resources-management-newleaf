import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

import { entitiesTable } from '../schema'

/*----------------------- Field Types ------------------------*/
export const FIELD_TYPES = ['string', 'number', 'date', 'boolean'] as const
export type FieldType = (typeof FIELD_TYPES)[number]

/*----------------- Field Definition Schema ------------------*/
export const fieldDefinitionSchema = z.object({
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1),
  sortable: z.boolean().default(true),
  required: z.boolean().default(false),
  order: z.number().int().min(0),
})
export type fieldDefinitionSchemaType = z.infer<typeof fieldDefinitionSchema>

/*---------------------- Depth 1 Schema ----------------------*/
export type Depth1Schema = Record<string, fieldDefinitionSchemaType>

/*---------------------- Entity Schemas ----------------------*/
export const entitySelectSchema = createSelectSchema(entitiesTable)
export const entityInsertSchema = createInsertSchema(entitiesTable)

export type entitySelectSchemaType = z.infer<typeof entitySelectSchema>
export type entityInsertSchemaType = z.infer<typeof entityInsertSchema>
