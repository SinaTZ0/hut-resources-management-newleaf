import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { z } from 'zod/v4'
import type { IsEqual } from 'type-fest'

/*------------------------ Field Type ------------------------*/
export const FIELD_TYPES = ['string', 'number', 'date', 'boolean'] as const
export type FieldType = (typeof FIELD_TYPES)[number]

// Field  Schema and Type
export const fieldSchema = z.strictObject({
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1, { message: 'Field label is required' }),
  sortable: z.boolean().default(true),
  required: z.boolean().default(false),
  order: z.number().int().min(0, { message: 'Order must be a non-negative integer' }),
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
  fields: jsonb('depth1_schema').notNull().$type<Depth1Schema>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Entity Types
type _EntitiesTableTypes = typeof entitiesTable.$inferInsert

// Entity zod schemas
export const EntitySchema = z.strictObject({
  id: z.uuid().optional(),
  name: z.string().min(1, { message: 'Entity name is required' }),
  description: z.string().nullable().optional(),
  fields: depth1Schema.refine((obj) => Object.keys(obj).length > 0, {
    message: 'fields must have at least one field',
  }),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

// Insert Schema: used for creating a new entity (id and timestamps omitted)
export const InsertEntitySchema = EntitySchema.omit({ id: true, createdAt: true, updatedAt: true })
export type InsertEntitySchemaType = z.infer<typeof InsertEntitySchema>

// Select Schema: result from the DB (id and timestamps are required)
export const SelectEntitySchema = EntitySchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type SelectEntitySchemaType = z.infer<typeof SelectEntitySchema>

export type EntitySchemaType = z.infer<typeof EntitySchema>

/*--------------------- Type Validations ---------------------*/
//@ you can convert optional properties to required but not the other way around
//@ you can't add new properties but you can omit existing ones

// Type checks: Ensure ZOD schemas match Drizzle schema types
const _EntitySchemaTypeCheck: IsEqual<EntitySchemaType, _EntitiesTableTypes> = true

// Ensure Insert/Select don't introduce additional keys beyond EntitySchemaType
type _ExtraInsertKeys = Exclude<keyof InsertEntitySchemaType, keyof EntitySchemaType>
type _ExtraSelectKeys = Exclude<keyof SelectEntitySchemaType, keyof EntitySchemaType>
const _InsertHasNoExtraKeys: IsEqual<_ExtraInsertKeys, never> = true
const _SelectHasNoExtraKeys: IsEqual<_ExtraSelectKeys, never> = true

// Ensure Insert/Select are assignable to EntitySchemaType (i.e. no incompatible types)
type _InsertAssignable = InsertEntitySchemaType extends EntitySchemaType ? true : false
type _SelectAssignable = SelectEntitySchemaType extends EntitySchemaType ? true : false
const _InsertAssignableCheck: IsEqual<_InsertAssignable, true> = true
const _SelectAssignableCheck: IsEqual<_SelectAssignable, true> = true
// NOTE: These checks validate subset/assignability relationships at compile time.
