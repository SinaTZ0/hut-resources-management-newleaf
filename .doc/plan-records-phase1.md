# Records Form Builder - Phase 1 Plan

## Overview

Phase 1 implements the **Record** management feature — creating instances of Entities with dynamic forms generated from Entity field definitions (Depth 1) and a JSON editor for unstructured data (Depth 2).

---

## Table of Contents

1. [Database Schema Design](#1-database-schema-design)
2. [Folder Structure](#2-folder-structure)
3. [Zod Schemas & Types](#3-zod-schemas--types)
4. [Dynamic Form Builder](#4-dynamic-form-builder)
5. [Depth 2 JSON Editor](#5-depth-2-json-editor)
6. [Server Actions](#6-server-actions)
7. [Queries](#7-queries)
8. [UI Components](#8-ui-components)
9. [Pages & Routes](#9-pages--routes)
10. [Validation Strategy](#10-validation-strategy)
11. [Error Handling](#11-error-handling)
12. [Security Considerations](#12-security-considerations)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. Database Schema Design

### Records Table

```typescript
// lib/drizzle/schema.ts

/*---------------------- Depth 1 Values ----------------------*/
// Dynamic values based on Entity's Depth1Schema
// Keys must match the Entity's field keys
export const depth1ValuesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean(), z.date(), z.null()])
)

export type Depth1Values = z.infer<typeof depth1ValuesSchema>

/*---------------------- Depth 2 Values ----------------------*/
// Free-form JSON for unstructured data
export const depth2ValuesSchema = z.record(z.string(), z.unknown()).nullable()

export type Depth2Values = z.infer<typeof depth2ValuesSchema>

/*----------------------- Records Table ----------------------*/
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

// Indexes for performance
// - entityId: for filtering records by entity
// - createdAt: for sorting/pagination
```

### Migration Considerations

- Foreign key constraint with `onDelete: 'cascade'` — deleting an Entity removes all its Records
- `depth1_values` is NOT NULL (always has structured data)
- `depth2_values` is NULLABLE (optional free-form data)

---

## 2. Folder Structure

```bash
app/records/
├─ records-table.tsx           # Table component: displays list of records
├─ record-columns.tsx          # Table column defs (dynamic based on entity fields)
├─ page.tsx                    # Page route: shows record list with entity filter
├─ [id]/                       # Dynamic route for single record
│  ├─ copy-id-button.tsx       # Button to copy record ID to clipboard
│  ├─ record-details.tsx       # Full details view for a single record
│  ├─ depth1-display.tsx       # Renders Depth 1 values (read-only)
│  ├─ depth2-display.tsx       # Renders Depth 2 JSON (read-only, formatted)
│  ├─ not-found.tsx            # 404 UI when record doesn't exist
│  └─ page.tsx                 # Route wrapper for `/records/[id]`
│  └─ edit/                    # Nested route for editing
│     └─ page.tsx              # Edit page for a single record
├─ actions/                    # Server actions (mutations)
│  ├─ create-record.ts         # Server action to create a new record
│  ├─ delete-record.ts         # Server action to delete a record
│  └─ update-record.ts         # Server action to update an existing record
├─ components/                 # Reusable components for records feature
│  └─ records-form/            # Form components for create/edit
│     ├─ record-form.tsx       # Main form wrapper (orchestrates depth1 + depth2)
│     ├─ dynamic-field.tsx     # Renders single field based on FieldSchemaType
│     ├─ depth1-form.tsx       # Dynamic form section for Depth 1 fields
│     ├─ depth2-editor.tsx     # JSON editor component for Depth 2
│     └─ entity-selector.tsx   # Dropdown to select Entity (for create mode)
├─ create/                     # Route to create a record
│  └─ page.tsx                 # `/records/create?entityId=xxx`
└─ queries/                    # Data fetching utilities
   ├─ get-records.ts           # Query to fetch list of records (with filters)
   ├─ get-record-by-id.ts      # Query to fetch one record by id
   └─ get-records-by-entity.ts # Query to fetch records for a specific entity
```

---

## 3. Zod Schemas & Types

### Base Schemas (lib/drizzle/schema.ts)

```typescript
/*--------------------- Depth 1 Values -----------------------*/
// Single field value union
export const depth1FieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.coerce.date(),
  z.null(),
])

export type Depth1FieldValue = z.infer<typeof depth1FieldValueSchema>

// Record of field values
export const depth1ValuesSchema = z.record(z.string(), depth1FieldValueSchema)

export type Depth1Values = z.infer<typeof depth1ValuesSchema>

/*--------------------- Depth 2 Values -----------------------*/
export const depth2ValuesSchema = z.record(z.string(), z.unknown()).nullable()

export type Depth2Values = z.infer<typeof depth2ValuesSchema>

/*---------------------- Record Schema -----------------------*/
export const RecordSchema = z.strictObject({
  id: z.uuid().optional(),
  entityId: z.uuid(),
  depth1Values: depth1ValuesSchema,
  depth2Values: depth2ValuesSchema.optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type RecordSchemaType = z.infer<typeof RecordSchema>

// Insert Schema
export const InsertRecordSchema = RecordSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export type InsertRecordSchemaType = z.infer<typeof InsertRecordSchema>

// Select Schema
export const SelectRecordSchema = RecordSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type SelectRecordSchemaType = z.infer<typeof SelectRecordSchema>
```

### Dynamic Form Schema Factory

```typescript
// app/records/components/records-form/schema.ts

import { z } from 'zod'
import type { Depth1Schema, FieldSchemaType } from '@/lib/drizzle/schema'

/**
 * Generates a Zod schema dynamically based on Entity's Depth1Schema
 */
export function createDepth1FormSchema(depth1Schema: Depth1Schema) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const [key, field] of Object.entries(depth1Schema)) {
    shape[key] = createFieldSchema(field)
  }

  return z.object(shape)
}

/**
 * Creates a Zod schema for a single field based on its type
 */
function createFieldSchema(field: FieldSchemaType): z.ZodTypeAny {
  let schema: z.ZodTypeAny

  switch (field.type) {
    case 'string':
      schema = z.string()
      break
    case 'number':
      schema = z.coerce.number()
      break
    case 'boolean':
      schema = z.boolean()
      break
    case 'date':
      schema = z.coerce.date()
      break
    default:
      schema = z.string()
  }

  // Apply required/optional
  if (!field.required) {
    schema = schema.nullable().optional()
  }

  return schema
}
```

---

## 4. Dynamic Form Builder

### Core Component: DynamicField

Renders the appropriate form control based on field type.

```typescript
// app/records/components/records-form/dynamic-field.tsx

type DynamicFieldProps = {
  form: UseFormReturn<any>
  fieldKey: string
  fieldDef: FieldSchemaType
  disabled?: boolean
}

export function DynamicField({ form, fieldKey, fieldDef, disabled }: DynamicFieldProps) {
  switch (fieldDef.type) {
    case 'string':
      return <FormInput form={form} name={fieldKey} label={fieldDef.label} disabled={disabled} />

    case 'number':
      return <FormInput form={form} name={fieldKey} label={fieldDef.label} type="number" disabled={disabled} />

    case 'boolean':
      return <FormSwitch form={form} name={fieldKey} label={fieldDef.label} disabled={disabled} />

    case 'date':
      return <FormDatePicker form={form} name={fieldKey} label={fieldDef.label} disabled={disabled} />

    default:
      return <FormInput form={form} name={fieldKey} label={fieldDef.label} disabled={disabled} />
  }
}
```

### Depth1Form Component

```typescript
// app/records/components/records-form/depth1-form.tsx

type Depth1FormProps = {
  form: UseFormReturn<any>
  depth1Schema: Depth1Schema
  disabled?: boolean
}

export function Depth1Form({ form, depth1Schema, disabled }: Depth1FormProps) {
  // Sort fields by order
  const sortedFields = Object.entries(depth1Schema)
    .sort(([, a], [, b]) => a.order - b.order)

  return (
    <FieldGroup>
      {sortedFields.map(([key, fieldDef]) => (
        <DynamicField
          key={key}
          form={form}
          fieldKey={key}
          fieldDef={fieldDef}
          disabled={disabled}
        />
      ))}
    </FieldGroup>
  )
}
```

---

## 5. Depth 2 JSON Editor

### Recommended Libraries

| Library                    | Pros                                                     | Cons                     |
| -------------------------- | -------------------------------------------------------- | ------------------------ |
| **@monaco-editor/react**   | Full VS Code experience, syntax highlighting, validation | Large bundle size (~2MB) |
| **react-json-editor-ajv8** | JSON-specific, schema validation                         | Less customizable        |
| **@uiw/react-codemirror**  | Lightweight, extensible                                  | Requires more setup      |
| **ace-builds + react-ace** | Mature, many features                                    | Older API                |

### Recommendation: `@monaco-editor/react`

Best for production-grade JSON editing with:

- Syntax highlighting
- Error detection
- Auto-formatting
- Familiar VS Code experience

### Depth2Editor Component

```typescript
// app/records/components/records-form/depth2-editor.tsx

'use client'

import { useState, useCallback } from 'react'
import Editor from '@monaco-editor/react'
import { cn } from '@/lib/utils/common-utils'

type Depth2EditorProps = {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
  error?: string
  className?: string
}

export function Depth2Editor({
  value,
  onChange,
  disabled,
  error,
  className,
}: Depth2EditorProps) {
  const [isValid, setIsValid] = useState(true)

  const handleChange = useCallback((newValue: string | undefined) => {
    if (!newValue || newValue.trim() === '') {
      onChange(null)
      setIsValid(true)
      return
    }

    try {
      JSON.parse(newValue)
      setIsValid(true)
      onChange(newValue)
    } catch {
      setIsValid(false)
      onChange(newValue) // Still update to show user input
    }
  }, [onChange])

  return (
    <Field data-invalid={!isValid || !!error}>
      <FieldLabel>Additional Details (JSON)</FieldLabel>
      <FieldDescription>
        Optional free-form JSON for extra information
      </FieldDescription>

      <div className={cn(
        'border rounded-md overflow-hidden',
        !isValid && 'border-destructive',
        className
      )}>
        <Editor
          height="200px"
          language="json"
          value={value ?? ''}
          onChange={handleChange}
          options={{
            readOnly: disabled,
            minimap: { enabled: false },
            lineNumbers: 'off',
            folding: true,
            formatOnPaste: true,
            formatOnType: true,
            automaticLayout: true,
          }}
        />
      </div>

      {!isValid && <FieldError>Invalid JSON format</FieldError>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
```

### Integration with React Hook Form

```typescript
// In record-form.tsx
<Controller
  name="depth2Values"
  control={form.control}
  render={({ field, fieldState }) => (
    <Depth2Editor
      value={field.value ? JSON.stringify(field.value, null, 2) : null}
      onChange={(jsonStr) => {
        if (!jsonStr) {
          field.onChange(null)
          return
        }
        try {
          field.onChange(JSON.parse(jsonStr))
        } catch {
          // Keep the string for validation feedback
        }
      }}
      error={fieldState.error?.message}
      disabled={isPending}
    />
  )}
/>
```

---

## 6. Server Actions

### Create Record

```typescript
// app/records/actions/create-record.ts

'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/drizzle/db'
import { recordsTable, InsertRecordSchema, entitiesTable } from '@/lib/drizzle/schema'
import { eq } from 'drizzle-orm'
import { createDepth1FormSchema } from '../components/records-form/schema'

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

export async function createRecord(payload: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    /*------------------------ Base Validation -----------------------*/
    const baseParsed = InsertRecordSchema.safeParse(payload)
    if (!baseParsed.success) {
      return {
        success: false,
        error: 'Validation failed',
        fieldErrors: formatZodErrors(baseParsed.error),
      }
    }

    /*--------------------- Fetch Entity Schema ----------------------*/
    const entity = await db
      .select({ fields: entitiesTable.fields })
      .from(entitiesTable)
      .where(eq(entitiesTable.id, baseParsed.data.entityId))
      .limit(1)

    if (!entity[0]) {
      return { success: false, error: 'Entity not found' }
    }

    /*------------------ Validate Depth 1 Values ---------------------*/
    const depth1Schema = createDepth1FormSchema(entity[0].fields)
    const depth1Parsed = depth1Schema.safeParse(baseParsed.data.depth1Values)

    if (!depth1Parsed.success) {
      return {
        success: false,
        error: 'Depth 1 validation failed',
        fieldErrors: formatZodErrors(depth1Parsed.error, 'depth1Values'),
      }
    }

    /*-------------------------- Database ----------------------------*/
    const result = await db
      .insert(recordsTable)
      .values({
        entityId: baseParsed.data.entityId,
        depth1Values: depth1Parsed.data,
        depth2Values: baseParsed.data.depth2Values ?? null,
      })
      .returning({ id: recordsTable.id })

    /*------------------------- Revalidate ---------------------------*/
    revalidatePath('/records')
    revalidatePath(`/entities/${baseParsed.data.entityId}`)

    return { success: true, data: { id: result[0].id } }
  } catch (error) {
    console.error('Create record error:', error)
    return { success: false, error: 'Failed to create record' }
  }
}
```

### Update Record

```typescript
// app/records/actions/update-record.ts

'use server'

export async function updateRecord(id: string, payload: unknown): Promise<ActionResult<void>> {
  try {
    /*------------------------ Validation ------------------------*/
    // 1. Validate ID
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: 'Invalid record ID' }
    }

    // 2. Fetch existing record & entity
    const existing = await db
      .select({
        record: recordsTable,
        entityFields: entitiesTable.fields,
      })
      .from(recordsTable)
      .innerJoin(entitiesTable, eq(recordsTable.entityId, entitiesTable.id))
      .where(eq(recordsTable.id, id))
      .limit(1)

    if (!existing[0]) {
      return { success: false, error: 'Record not found' }
    }

    // 3. Validate depth1Values against entity schema
    const depth1Schema = createDepth1FormSchema(existing[0].entityFields)
    // ... validation logic

    /*-------------------------- Database ----------------------------*/
    await db
      .update(recordsTable)
      .set({
        depth1Values: validatedDepth1,
        depth2Values: payload.depth2Values ?? null,
        updatedAt: new Date(),
      })
      .where(eq(recordsTable.id, id))

    /*------------------------- Revalidate ---------------------------*/
    revalidatePath('/records')
    revalidatePath(`/records/${id}`)

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Update record error:', error)
    return { success: false, error: 'Failed to update record' }
  }
}
```

### Delete Record

```typescript
// app/records/actions/delete-record.ts

'use server'

export async function deleteRecord(id: string): Promise<ActionResult<void>> {
  try {
    if (!z.string().uuid().safeParse(id).success) {
      return { success: false, error: 'Invalid record ID' }
    }

    const result = await db
      .delete(recordsTable)
      .where(eq(recordsTable.id, id))
      .returning({ id: recordsTable.id })

    if (!result[0]) {
      return { success: false, error: 'Record not found' }
    }

    revalidatePath('/records')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Delete record error:', error)
    return { success: false, error: 'Failed to delete record' }
  }
}
```

---

## 7. Queries

### Get Records

```typescript
// app/records/queries/get-records.ts

import { db } from '@/lib/drizzle/db'
import { recordsTable, entitiesTable } from '@/lib/drizzle/schema'
import { eq, desc } from 'drizzle-orm'

type GetRecordsOptions = {
  entityId?: string
  limit?: number
  offset?: number
}

export async function getRecords(options: GetRecordsOptions = {}) {
  const { entityId, limit = 50, offset = 0 } = options

  const query = db
    .select({
      id: recordsTable.id,
      entityId: recordsTable.entityId,
      entityName: entitiesTable.name,
      depth1Values: recordsTable.depth1Values,
      depth2Values: recordsTable.depth2Values,
      createdAt: recordsTable.createdAt,
      updatedAt: recordsTable.updatedAt,
    })
    .from(recordsTable)
    .innerJoin(entitiesTable, eq(recordsTable.entityId, entitiesTable.id))
    .orderBy(desc(recordsTable.createdAt))
    .limit(limit)
    .offset(offset)

  if (entityId) {
    return query.where(eq(recordsTable.entityId, entityId))
  }

  return query
}
```

### Get Record by ID

```typescript
// app/records/queries/get-record-by-id.ts

export async function getRecordById(id: string) {
  if (!z.string().uuid().safeParse(id).success) {
    return null
  }

  const result = await db
    .select({
      id: recordsTable.id,
      entityId: recordsTable.entityId,
      entityName: entitiesTable.name,
      entityFields: entitiesTable.fields,
      depth1Values: recordsTable.depth1Values,
      depth2Values: recordsTable.depth2Values,
      createdAt: recordsTable.createdAt,
      updatedAt: recordsTable.updatedAt,
    })
    .from(recordsTable)
    .innerJoin(entitiesTable, eq(recordsTable.entityId, entitiesTable.id))
    .where(eq(recordsTable.id, id))
    .limit(1)

  return result[0] ?? null
}
```

---

## 8. UI Components

### Required New Components

| Component        | Location                                                  | Purpose                  |
| ---------------- | --------------------------------------------------------- | ------------------------ |
| `FormDatePicker` | `components/form/form-date-picker.tsx`                    | Date input with calendar |
| `Depth2Editor`   | `app/records/components/records-form/depth2-editor.tsx`   | Monaco JSON editor       |
| `DynamicField`   | `app/records/components/records-form/dynamic-field.tsx`   | Field type switcher      |
| `Depth1Form`     | `app/records/components/records-form/depth1-form.tsx`     | Dynamic Depth 1 form     |
| `RecordForm`     | `app/records/components/records-form/record-form.tsx`     | Main form wrapper        |
| `EntitySelector` | `app/records/components/records-form/entity-selector.tsx` | Entity dropdown          |

### FormDatePicker (New)

```typescript
// components/form/form-date-picker.tsx

'use client'

import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from 'react-hook-form'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils/common-utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'

type FormDatePickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  readonly form: UseFormReturn<TFieldValues>
  readonly name: TName
  readonly label?: string
  readonly description?: string
  readonly className?: string
  readonly disabled?: boolean
  readonly testId?: string
}

export function FormDatePicker<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ form, name, label, description, className, disabled, testId }: FormDatePickerProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field className={cn(className)} data-invalid={fieldState.invalid} data-disabled={disabled}>
          {label && <FieldLabel>{label}</FieldLabel>}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !field.value && 'text-muted-foreground'
                )}
                disabled={disabled}
                data-testid={testId}
                aria-invalid={fieldState.invalid}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {field.value ? format(field.value, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={field.value}
                onSelect={field.onChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  )
}
```

---

## 9. Pages & Routes

### Create Record Page

```typescript
// app/records/create/page.tsx

import { notFound, redirect } from 'next/navigation'
import { getEntityById } from '@/app/entities/queries/get-entity-by-id'
import { getEntities } from '@/app/entities/queries/get-entities'
import { RecordForm } from '../components/records-form/record-form'

type SearchParams = Promise<{ entityId?: string }>

export default async function CreateRecordPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { entityId } = await searchParams

  // If no entityId, show entity selector
  if (!entityId) {
    const entities = await getEntities()
    return <EntitySelectorPage entities={entities} />
  }

  // Fetch entity for form schema
  const entity = await getEntityById(entityId)
  if (!entity) {
    notFound()
  }

  return (
    <div className="container py-8">
      <RecordForm mode="create" entity={entity} />
    </div>
  )
}
```

### Edit Record Page

```typescript
// app/records/[id]/edit/page.tsx

import { notFound } from 'next/navigation'
import { getRecordById } from '../../queries/get-record-by-id'
import { RecordForm } from '../../components/records-form/record-form'

type Params = Promise<{ id: string }>

export default async function EditRecordPage({ params }: { params: Params }) {
  const { id } = await params
  const record = await getRecordById(id)

  if (!record) {
    notFound()
  }

  return (
    <div className="container py-8">
      <RecordForm
        mode="edit"
        entity={{
          id: record.entityId,
          name: record.entityName,
          fields: record.entityFields,
        }}
        initialData={record}
      />
    </div>
  )
}
```

---

## 10. Validation Strategy

### Multi-Layer Validation

```
┌─────────────────────────────────────────────────────────────┐
│                    Client-Side (UX)                         │
│  React Hook Form + Zod                                      │
│  - Immediate feedback                                       │
│  - Dynamic schema from entity                               │
│  - Type coercion (string → number, date)                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   Server Action (Security)                  │
│  1. Base schema validation (InsertRecordSchema)             │
│  2. Entity existence check                                  │
│  3. Dynamic Depth 1 validation (against entity schema)      │
│  4. Depth 2 JSON parsing validation                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Database (Integrity)                     │
│  - Foreign key constraint (entityId)                        │
│  - NOT NULL constraints                                     │
│  - UUID format validation                                   │
└─────────────────────────────────────────────────────────────┘
```

### Field Type Validation Rules

| Type      | Client Validation   | Server Validation   |
| --------- | ------------------- | ------------------- |
| `string`  | `z.string()`        | `z.string()`        |
| `number`  | `z.coerce.number()` | `z.coerce.number()` |
| `boolean` | `z.boolean()`       | `z.boolean()`       |
| `date`    | `z.coerce.date()`   | `z.coerce.date()`   |

### Required Field Handling

```typescript
function applyRequiredConstraint(schema: z.ZodTypeAny, required: boolean) {
  if (required) {
    return schema
  }
  return schema.nullable().optional()
}
```

---

## 11. Error Handling

### Error Types

```typescript
// lib/utils/errors.ts

export class ValidationError extends Error {
  constructor(
    message: string,
    public fieldErrors?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with ID ${id} not found`)
    this.name = 'NotFoundError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Access denied') {
    super(message)
    this.name = 'ForbiddenError'
  }
}
```

### Server Action Error Response

```typescript
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

// Usage in form
function handleActionResult(result: ActionResult) {
  if (!result.success) {
    // Show general error
    toast.error(result.error)

    // Set field-specific errors
    if (result.fieldErrors) {
      for (const [path, messages] of Object.entries(result.fieldErrors)) {
        form.setError(path as any, { message: messages[0] })
      }
    }
    return
  }

  toast.success('Record saved successfully')
  router.push('/records')
}
```

### Form Error Display

- Field-level errors via `<FieldError />`
- Form-level errors via toast notifications
- Network errors with retry option

---

## 12. Security Considerations

### Input Sanitization

```typescript
// Server action
export async function createRecord(payload: unknown) {
  // 1. Never trust client input - always validate
  const parsed = InsertRecordSchema.safeParse(payload)

  // 2. Validate entityId exists and user has access
  const entity = await db
    .select()
    .from(entitiesTable)
    .where(eq(entitiesTable.id, parsed.data.entityId))

  // 3. Validate depth1Values against ACTUAL entity schema (not client-provided)
  const serverSchema = createDepth1FormSchema(entity.fields)
  const validatedDepth1 = serverSchema.parse(parsed.data.depth1Values)

  // 4. Sanitize depth2Values JSON
  const sanitizedDepth2 = sanitizeJson(parsed.data.depth2Values)
}
```

### JSON Injection Prevention

```typescript
function sanitizeJson(input: unknown): Record<string, unknown> | null {
  if (input === null || input === undefined) return null

  // Parse if string
  const parsed = typeof input === 'string' ? JSON.parse(input) : input

  // Ensure it's an object (not array, not primitive)
  if (typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Depth 2 must be a JSON object')
  }

  // Remove __proto__ and constructor attacks
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(parsed)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue
    }
    sanitized[key] = value
  }

  return sanitized
}
```

### Rate Limiting (Future)

Consider adding rate limiting for:

- Create record: 10 per minute
- Update record: 20 per minute
- Delete record: 5 per minute

---

## 13. Implementation Checklist

### Phase 1A: Database & Schema (Day 1)

- [ ] Add `recordsTable` to `lib/drizzle/schema.ts`
- [ ] Add Zod schemas for records (`RecordSchema`, `InsertRecordSchema`, `SelectRecordSchema`)
- [ ] Add `depth1ValuesSchema` and `depth2ValuesSchema`
- [ ] Run database migration
- [ ] Add type validations (like entities)

### Phase 1B: Queries (Day 1)

- [ ] Create `app/records/queries/get-records.ts`
- [ ] Create `app/records/queries/get-record-by-id.ts`
- [ ] Create `app/records/queries/get-records-by-entity.ts`

### Phase 1C: Form Components (Day 2-3)

- [ ] Create `components/form/form-date-picker.tsx`
- [ ] Create `app/records/components/records-form/dynamic-field.tsx`
- [ ] Create `app/records/components/records-form/depth1-form.tsx`
- [ ] Create `app/records/components/records-form/depth2-editor.tsx`
- [ ] Install Monaco Editor: `pnpm add @monaco-editor/react`
- [ ] Create `app/records/components/records-form/entity-selector.tsx`
- [ ] Create `app/records/components/records-form/record-form.tsx`
- [ ] Create dynamic schema factory (`createDepth1FormSchema`)

### Phase 1D: Server Actions (Day 3)

- [ ] Create `app/records/actions/create-record.ts`
- [ ] Create `app/records/actions/update-record.ts`
- [ ] Create `app/records/actions/delete-record.ts`

### Phase 1E: Pages & Display (Day 4)

- [ ] Create `app/records/page.tsx` (list page)
- [ ] Create `app/records/records-table.tsx`
- [ ] Create `app/records/record-columns.tsx`
- [ ] Create `app/records/create/page.tsx`
- [ ] Create `app/records/[id]/page.tsx`
- [ ] Create `app/records/[id]/record-details.tsx`
- [ ] Create `app/records/[id]/depth1-display.tsx`
- [ ] Create `app/records/[id]/depth2-display.tsx`
- [ ] Create `app/records/[id]/edit/page.tsx`
- [ ] Create `app/records/[id]/not-found.tsx`

### Phase 1F: Testing & Polish (Day 5)

- [ ] Add `data-testid` attributes to all interactive elements
- [ ] Test create flow with all field types
- [ ] Test edit flow
- [ ] Test delete flow
- [ ] Test validation error handling
- [ ] Test JSON editor validation
- [ ] Test empty/null Depth 2 handling

---

## Dependencies to Install

```bash
pnpm add @monaco-editor/react
pnpm add date-fns  # If not already installed
```

---

## Notes

- Entity cannot be changed after Record creation (prevents data mismatch)
- Depth 2 is completely optional — null is valid
- Sorting/filtering by Depth 1 fields will be Phase 2
- Bulk operations (import/export) will be Phase 3
