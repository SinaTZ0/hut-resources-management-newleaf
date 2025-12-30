import { z } from 'zod/v4'

/*---------------------- Action Result -----------------------*/
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/*----------------------- Query Result -----------------------*/
export type QueryResult<T> = { success: true; data: T } | { success: false; error: string }

/*------------------------ Constants -------------------------*/
export const MAX_FIELDS_PER_ENTITY = 100

/*-------------------- Format Zod Errors ---------------------*/
export function formatZodErrors(error: z.ZodError, prefix?: string): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = prefix ? `${prefix}.${issue.path.join('.')}` : issue.path.join('.')
    if (!(path in fieldErrors)) {
      fieldErrors[path] = []
    }
    fieldErrors[path].push(issue.message)
  }

  return fieldErrors
}
