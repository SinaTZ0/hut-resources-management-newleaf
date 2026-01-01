import { z } from 'zod/v4'

import type {
  FieldsSchema as FieldsSchemaType,
  FieldSchema,
  FieldValues,
} from '@/lib/drizzle/schema'

/*------------- Strip Empty Non-Required Values --------------*/
/**
 * Removes field values that are empty/default for non-required fields.
 * This prevents storing meaningless default values (like 0, false, '') in the database.
 */
export function stripEmptyNonRequiredFieldValues(
  fieldValues: FieldValues,
  fieldsSchema: FieldsSchemaType
): FieldValues {
  const result: FieldValues = {}

  for (const [fieldKey, value] of Object.entries(fieldValues)) {
    const fieldConfig = Object.prototype.hasOwnProperty.call(fieldsSchema, fieldKey)
      ? fieldsSchema[fieldKey]
      : undefined

    // Keep value if field config doesn't exist (orphaned key)
    if (!fieldConfig) continue

    // Always keep required field values
    if (fieldConfig.required) {
      result[fieldKey] = value
      continue
    }

    // For non-required fields, only store if value is meaningful
    if (!isEmptyFieldValue(value, fieldConfig.type)) {
      result[fieldKey] = value
    }
  }

  return result
}

/*----------------- Check If Value Is Empty ------------------*/
function isEmptyFieldValue(value: unknown, fieldType: FieldSchema['type']): boolean {
  // null/undefined is always empty
  if (value === null || value === undefined) return true

  // Empty string should be treated as empty for all optional inputs
  if (typeof value === 'string' && value.trim() === '') return true

  switch (fieldType) {
    case 'string':
    case 'enum':
      return false
    case 'number':
      return typeof value === 'number' && Number.isNaN(value)
    case 'date':
      return value instanceof Date && Number.isNaN(value.getTime())
    // can't really be empty
    case 'boolean':
      return false
    default:
      return false
  }
}

/*-------------- Create Field Schema From Type ---------------*/
function createFieldSchema(field: FieldSchema): z.ZodType {
  let schema: z.ZodType

  const cleanEmptyToUndefined = (value: unknown): unknown => {
    if (value === '' || value === null || value === undefined) return undefined
    if (typeof value === 'string' && value.trim() === '') return undefined
    return value
  }

  switch (field.type) {
    case 'string':
      schema = z.string().min(1, { message: `${field.label} is required` })
      break
    case 'number':
      schema = z.preprocess(
        cleanEmptyToUndefined,
        field.required
          ? z.coerce.number({ error: `${field.label} must be a valid number` })
          : z.coerce.number({ error: `${field.label} must be a valid number` }).optional()
      )
      break
    case 'boolean':
      schema = z.boolean()
      break
    case 'date':
      schema = z.preprocess(
        cleanEmptyToUndefined,
        field.required
          ? z.coerce.date({ error: `${field.label} must be a valid date` })
          : z.coerce.date({ error: `${field.label} must be a valid date` }).optional()
      )
      break
    case 'enum':
      if (field.enumOptions && field.enumOptions.length > 0) {
        // Create enum schema from options
        const [first, ...rest] = field.enumOptions
        schema = z.enum([first, ...rest], {
          error: `${field.label} must be one of: ${field.enumOptions.join(', ')}`,
        })
      } else {
        schema = z.string()
      }
      break
    default:
      schema = z.string()
  }

  /*----------------- Apply Required/Optional ------------------*/
  if (!field.required) {
    // For optional fields, allow null/undefined and empty strings
    if (field.type === 'string' || field.type === 'enum') {
      schema = z.string().optional().or(z.literal(''))
    } else if (field.type === 'number' || field.type === 'date') {
      // These types use preprocess+inner optional to avoid unwanted coercion.
      // Still mark the property optional so missing keys don't error.
      schema = schema.optional()
    } else {
      schema = schema.optional().nullable()
    }
  }

  return schema
}

/*--------- Create Field Values Form Schema Factory ----------*/
/**
 * Generates a Zod schema dynamically based on Entity's FieldsSchema
 */
export function createFieldValuesFormSchema(FieldsSchema: FieldsSchemaType) {
  const shape: Record<string, z.ZodType> = {}

  for (const [key, field] of Object.entries(FieldsSchema)) {
    shape[key] = createFieldSchema(field)
  }

  return z.object(shape)
}

/*--------------- Get Default Values For Form ----------------*/
/**
 * Generates default values for a form based on Entity's FieldsSchema
 */
export function getDefaultFieldValues(FieldsSchema: FieldsSchemaType): Record<string, unknown> {
  const defaults: Record<string, unknown> = {}

  for (const [key, field] of Object.entries(FieldsSchema)) {
    switch (field.type) {
      case 'string':
        defaults[key] = ''
        break
      case 'number':
        defaults[key] = field.required ? 0 : null
        break
      case 'boolean':
        defaults[key] = false
        break
      case 'date':
        defaults[key] = null
        break
      case 'enum':
        // Default to empty string (no selection) or first option if required
        defaults[key] = ''
        break
      default:
        defaults[key] = ''
    }
  }

  return defaults
}
