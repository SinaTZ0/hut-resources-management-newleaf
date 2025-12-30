import { z } from 'zod'

import { entitySchema, fieldSchema } from '@/lib/drizzle/schema'

/*-------------------- Entity Form Schema --------------------*/
// Derive from entitySchema: omit DB-managed fields, use array for useFieldArray
export const entityFormSchema = entitySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    fields: z.array(fieldSchema).min(1, 'At least one field required'),
  })

export type EntityFormValues = z.output<typeof entityFormSchema>
export type EntityFormInputValues = z.input<typeof entityFormSchema>
