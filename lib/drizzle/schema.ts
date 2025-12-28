import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { z } from 'zod/v4'
import type { IsEqual } from 'type-fest'

/*------------------------ UUID Regex ------------------------*/
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

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

export type FieldSchema = z.infer<typeof fieldSchema>

/*----------------------- Fields Type ------------------------*/
//former depth1Schema. chaged to fieldsSchema to better reflect its purpose
export const fieldsSchema = z.record(z.string(), fieldSchema)

export type FieldsSchema = z.infer<typeof fieldsSchema>

/*---------------------- Entities Table ----------------------*/
export const entitiesTable = pgTable('entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  //former depth1_schema column. chaged to fields to better reflect its purpose
  fields: jsonb('fields').notNull().$type<FieldsSchema>(),
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
  fields: fieldsSchema.refine((obj) => Object.keys(obj).length > 0, {
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

/*=====================================================================*/
/*                            RECORDS                                  */
/*=====================================================================*/

/*------------------- Depth 1 Field Value --------------------*/
// Single field value union (what a record stores per field)
export const depth1FieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.coerce.date(),
  z.null(),
])

export type Depth1FieldValue = z.infer<typeof depth1FieldValueSchema>

/*---------------------- Depth 1 Values ----------------------*/
// Dynamic values based on Entity's Depth1Schema
// Keys must match the Entity's field keys
export const depth1ValuesSchema = z.record(z.string(), depth1FieldValueSchema)

export type Depth1Values = z.infer<typeof depth1ValuesSchema>

/*---------------------- Depth 2 Values ----------------------*/
// Free-form JSON for unstructured data
export const depth2ValuesSchema = z.record(z.string(), z.unknown()).nullable()

export type Depth2Values = z.infer<typeof depth2ValuesSchema>

/*---------------------- Records Table -----------------------*/
export const recordsTable = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entitiesTable.id, { onDelete: 'cascade' }),
  depth1Values: jsonb('depth1_values').notNull().$type<Depth1Values>(),
  depth2Values: jsonb('depth2_values').$type<Depth2Values>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Record Types
type _RecordsTableTypes = typeof recordsTable.$inferInsert

/*---------------------- Record Schema -----------------------*/
export const RecordSchema = z.strictObject({
  id: z.string().regex(UUID_REGEX, 'Invalid UUID format').optional(),
  entityId: z.string().regex(UUID_REGEX, 'Invalid entity ID format'),
  depth1Values: depth1ValuesSchema,
  depth2Values: depth2ValuesSchema.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type RecordSchemaType = z.infer<typeof RecordSchema>

// Insert Schema: used for creating a new record (id and timestamps omitted)
export const InsertRecordSchema = RecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type InsertRecordSchemaType = z.infer<typeof InsertRecordSchema>

// Select Schema: result from the DB (id and timestamps are required)
export const SelectRecordSchema = RecordSchema.extend({
  id: z.string().regex(UUID_REGEX, 'Invalid UUID format'),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type SelectRecordSchemaType = z.infer<typeof SelectRecordSchema>

/*----------------- Record Type Validations ------------------*/
// Type checks: Ensure ZOD schemas match Drizzle schema types
const _RecordSchemaTypeCheck: IsEqual<RecordSchemaType, _RecordsTableTypes> = true

// Ensure Insert/Select don't introduce additional keys beyond RecordSchemaType
type _ExtraRecordInsertKeys = Exclude<keyof InsertRecordSchemaType, keyof RecordSchemaType>
type _ExtraRecordSelectKeys = Exclude<keyof SelectRecordSchemaType, keyof RecordSchemaType>
const _RecordInsertHasNoExtraKeys: IsEqual<_ExtraRecordInsertKeys, never> = true
const _RecordSelectHasNoExtraKeys: IsEqual<_ExtraRecordSelectKeys, never> = true

// Ensure Insert/Select are assignable to RecordSchemaType
type _RecordInsertAssignable = InsertRecordSchemaType extends RecordSchemaType ? true : false
type _RecordSelectAssignable = SelectRecordSchemaType extends RecordSchemaType ? true : false
const _RecordInsertAssignableCheck: IsEqual<_RecordInsertAssignable, true> = true
const _RecordSelectAssignableCheck: IsEqual<_RecordSelectAssignable, true> = true
