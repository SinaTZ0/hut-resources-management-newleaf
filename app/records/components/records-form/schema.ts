import { z } from 'zod/v4'

import type { FieldsSchema, FieldSchema } from '@/lib/drizzle/schema'

/*-------------- Create Field Schema From Type ---------------*/
function createFieldSchema(field: FieldSchema): z.ZodType {
  let schema: z.ZodType

  switch (field.type) {
    case 'string':
      schema = z.string().min(1, { message: `${field.label} is required` })
      break
    case 'number':
      schema = z.coerce.number({ error: `${field.label} must be a valid number` })
      break
    case 'boolean':
      schema = z.boolean()
      break
    case 'date':
      schema = z.coerce.date({ error: `${field.label} must be a valid date` })
      break
    default:
      schema = z.string()
  }

  /*----------------- Apply Required/Optional ------------------*/
  if (!field.required) {
    // For optional fields, allow null/undefined and empty strings
    if (field.type === 'string') {
      schema = z.string().optional().or(z.literal(''))
    } else {
      schema = schema.nullable().optional()
    }
  }

  return schema
}

/*------------ Create Depth1 Form Schema Factory -------------*/
/**
 * Generates a Zod schema dynamically based on Entity's FieldsSchema
 */
export function createDepth1FormSchema(FieldsSchema: FieldsSchema) {
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
export function getDefaultDepth1Values(FieldsSchema: FieldsSchema): Record<string, unknown> {
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
      default:
        defaults[key] = ''
    }
  }

  return defaults
}
