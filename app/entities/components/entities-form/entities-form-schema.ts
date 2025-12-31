import { z } from 'zod'

import { entitySchema, FIELD_TYPES, enumOptionsSchema, type FieldValue } from '@/lib/drizzle/schema'

/*-------------- Form Field Schema with Default --------------*/
// Build form field schema separately since fieldSchema uses strictObject
// which rejects additional properties like defaultValue
const defaultValueSchema = z.union([z.string(), z.number(), z.boolean(), z.date(), z.null()])

export const formFieldSchema = z
  .object({
    type: z.enum(FIELD_TYPES),
    label: z.string().min(1, { message: 'Field label is required' }),
    sortable: z.boolean().default(true),
    required: z.boolean().default(false),
    order: z.number().int().min(0, { message: 'Order must be a non-negative integer' }),
    enumOptions: enumOptionsSchema.optional(),
    defaultValue: defaultValueSchema.optional(),
  })
  .refine(
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

export type FormFieldSchema = z.output<typeof formFieldSchema> & { defaultValue?: FieldValue }
export type FormFieldSchemaInput = z.input<typeof formFieldSchema>

/*-------------------- Entity Form Schema --------------------*/
// Derive from entitySchema: omit DB-managed fields, use array for useFieldArray
export const entityFormSchema = entitySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    fields: z.array(formFieldSchema).min(1, 'At least one field required'),
  })

export type EntityFormValues = z.output<typeof entityFormSchema>
export type EntityFormInputValues = z.input<typeof entityFormSchema>
