import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core'
import { z } from 'zod/v4'
import type { IsEqual } from 'type-fest'

/*------------------------ Field Type ------------------------*/
export const FIELD_TYPES = ['string', 'number', 'date', 'boolean', 'enum'] as const
export type FieldType = (typeof FIELD_TYPES)[number]

/*----------------------- Enum Options -----------------------*/
export const enumOptionsSchema = z
  .array(z.string().min(1, { message: 'Enum option cannot be empty' }))
  .min(1, { message: 'At least one enum option is required' })
  .refine((arr) => new Set(arr).size === arr.length, {
    message: 'Enum options must be unique',
  })

export type EnumOptions = z.output<typeof enumOptionsSchema>

/*----------------------- Field Schema -----------------------*/
const baseFieldSchema = z.strictObject({
  type: z.enum(FIELD_TYPES),
  label: z.string().min(1, { message: 'Field label is required' }),
  sortable: z.boolean().default(true),
  required: z.boolean().default(false),
  order: z.number().int().min(0, { message: 'Order must be a non-negative integer' }),
  enumOptions: enumOptionsSchema.optional(),
})

// Ensure enumOptions is required when type is 'enum'
export const fieldSchema = baseFieldSchema.refine(
  (field) => {
    if (field.type === 'enum') {
      return field.enumOptions !== undefined && field.enumOptions.length > 0
    }
    return true
  },
  {
    message: 'Enum options are required for enum type fields',
    path: ['enumOptions'],
  }
)

export type FieldSchema = z.output<typeof fieldSchema>
export type FieldSchemaInput = z.input<typeof fieldSchema>

/*---------------------- Fields Schema -----------------------*/
export const fieldsSchema = z.record(z.string(), fieldSchema)

export type FieldsSchema = z.output<typeof fieldsSchema>
export type FieldsSchemaInput = z.input<typeof fieldsSchema>

/*---------------------- Entities Table ----------------------*/
export const entitiesTable = pgTable('entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  fields: jsonb('fields').notNull().$type<FieldsSchema>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/*---------------------- Entity Schema -----------------------*/
export const entitySchema = z.strictObject({
  id: z.uuid(),
  name: z.string().min(1, { message: 'Entity name is required' }),
  description: z.string().nullable(),
  fields: fieldsSchema.refine((obj) => Object.keys(obj).length > 0, {
    message: 'fields must have at least one field',
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type EntitySchema = z.output<typeof entitySchema>
export type EntitySchemaInput = z.input<typeof entitySchema>

/*------------------- Insert Entity Schema -------------------*/
export const insertEntitySchema = entitySchema.omit({ id: true, createdAt: true, updatedAt: true })
export type InsertEntitySchema = z.output<typeof insertEntitySchema>
export type InsertEntitySchemaInput = z.input<typeof insertEntitySchema>

/*--------------------- Type Validations ---------------------*/
type _EntitiesTableSelect = typeof entitiesTable.$inferSelect
const _EntitySchemaTypeCheck: IsEqual<EntitySchema, _EntitiesTableSelect> = true

/*=====================================================================*/
/*                            RECORDS                                  */
/*=====================================================================*/

/*----------------------- Field Value ------------------------*/
export const fieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.coerce.date(),
  z.null(),
])

export type FieldValue = z.output<typeof fieldValueSchema>
export type FieldValueInput = z.input<typeof fieldValueSchema>

/*----------------------- Field Values -----------------------*/
export const fieldValuesSchema = z.record(z.string(), fieldValueSchema)

export type FieldValues = z.output<typeof fieldValuesSchema>
export type FieldValuesInput = z.input<typeof fieldValuesSchema>

/*------------------------- Metadata -------------------------*/
export const metadataSchema = z.record(z.string(), z.unknown()).nullable()

export type Metadata = z.output<typeof metadataSchema>
export type MetadataInput = z.input<typeof metadataSchema>

/*---------------------- Records Table -----------------------*/
export const recordsTable = pgTable('records', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityId: uuid('entity_id')
    .notNull()
    .references(() => entitiesTable.id, { onDelete: 'cascade' }),
  fieldValues: jsonb('field_values').notNull().$type<FieldValues>(),
  metadata: jsonb('metadata').$type<Metadata>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/*---------------------- Record Schema -----------------------*/
export const recordSchema = z.strictObject({
  id: z.uuid(),
  entityId: z.uuid(),
  fieldValues: fieldValuesSchema,
  metadata: metadataSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type RecordSchema = z.output<typeof recordSchema>
export type RecordSchemaInput = z.input<typeof recordSchema>

/*------------------- Insert Record Schema -------------------*/
export const insertRecordSchema = recordSchema.omit({ id: true, createdAt: true, updatedAt: true })
export type InsertRecordSchema = z.output<typeof insertRecordSchema>
export type InsertRecordSchemaInput = z.input<typeof insertRecordSchema>

/*----------------- Record Type Validations ------------------*/
type _RecordsTableSelect = typeof recordsTable.$inferSelect
const _RecordSchemaTypeCheck: IsEqual<RecordSchema, _RecordsTableSelect> = true
