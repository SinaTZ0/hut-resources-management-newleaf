---
applyTo: '**'
---

# Tech Stack

- Next.js (App Router) | PostgreSQL + Drizzle ORM
- Shadcn/ui + Tailwind CSS | Zod (v4)
- TanStack Table | react-hook-form

# Core Principles

1. **Feature Colocation** — Related code (components, schemas, actions, queries) lives together in route folders
2. **Schema-Driven** — Single source of truth: Drizzle tables → Zod schemas → TypeScript types
3. **Testability** — `data-testid` on interactive/conditional elements
4. **Composable** — Small, single-purpose components

# Route Folder Rules

## Page-level components

- Put page-specific components at the same level as the `page.tsx` that uses them (or inside a co-located `_.../` group folder under that route).
- Put only truly shared components (used by multiple `page.tsx` under the same route segment) inside that route’s `components/` folder.
- Put shared components used across multiple features/routes in the root `components/` folder (e.g. `components/ui`, `components/form`, `components/tables`, `components/theme`).

## Grouping with `_.../` folders

- Group tightly-related components/files into a folder that starts with `_` (example: `_record-details/`, `_table-builder/`).
- Prefer `_.../` grouping over dumping many sibling files next to `page.tsx`.

## Barrel files

- FORBIDDEN: barrel files (no `index.ts`, `index.tsx`, or re-export-only files like `export * from ...`). Always import from the real module file.

## Example: `app/records` (short structure)

```
app/records/
  page.tsx
  _all-recordd-table/
    record-columns.tsx
    records-table.tsx
  _table-builder/
    dynamic-columns.tsx
    table-builder.tsx
  create/
    page.tsx
  [id]/
    page.tsx
    not-found.tsx
    edit/
      page.tsx
    _record-details/
      copy-id-button.tsx
      depth1-display.tsx
      depth2-display.tsx
      record-details.tsx
  actions/
    create-record.ts
    delete-record.ts
    update-record.ts
  queries/
    get-entities-with-fields.ts
    get-record-by-id.ts
    get-records.ts
    get-records-by-entity.ts
  components/
    records-form/
      schema.ts
      entity-selector.tsx
      dynamic-field.tsx
      depth1-form.tsx
      depth2-editor.tsx
      record-form.tsx
```

# TypeScript & Schema

Use `type` for everything. Drive from `schema.ts`:

```ts
// schema.ts
import { usersTable } from '@/db/schema'
import { z } from 'zod'

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect

export const userSchema = z.strictObject({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  description: z.string().nullable().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
})

export type User = z.infer<typeof userSchema>

// Form schemas: pick or refine
export const userFormSchema = userSchema.pick({ name: true, email: true })
export type UserFormData = z.infer<typeof userFormSchema>
```

# Code Organization

**Dividers:**

- Logic: `/*-------- Section Name --------*/`
- JSX: `{/*-------- Section Name --------*/}`

```tsx
export function UserDashboard({ users }: { users: User[] }) {
  /*-------- State --------*/
  const [selected, setSelected] = useState<User | null>(null)

  /*-------- Handlers --------*/
  const handleSelect = (user: User) => setSelected(user)

  /*-------- Render --------*/
  return (
    <div>
      {/*-------- Header --------*/}
      <h1>Users ({users.length})</h1>

      {/*-------- Content --------*/}
      <DataTable data={users} onRowClick={handleSelect} />
    </div>
  )
}
```

# Server Actions

Validate with Zod, then `revalidatePath`:

```tsx
'use server'

export async function createUser(formData: FormData) {
  /*-------- Validation --------*/
  const parsed = userFormSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Invalid data' }

  /*-------- Database --------*/
  await db.insert(usersTable).values(parsed.data)

  /*-------- Revalidate --------*/
  revalidatePath('/users')
}
```

# Testability

Format: `[context]-[element]-[purpose]` (kebab-case)

```tsx
{
  /*-------- States --------*/
}
{
  loading && <div data-testid='user-list-loading'>Loading...</div>
}
{
  error && <div data-testid='user-list-error'>{error.message}</div>
}
{
  !data?.length && <div data-testid='user-list-empty'>No users</div>
}

{
  /*-------- Actions --------*/
}
;<Button data-testid='user-add-btn' onClick={handleAdd}>
  Add User
</Button>
```

**Reusable components:** Accept optional `testId` prop

# Checklist

- [ ] Self-explanatory names?
- [ ] `data-testid` on interactive/conditional elements?
- [ ] Divider comments in logic & JSX sections?
- [ ] Schema-driven types from `schema.ts`?
- [ ] Server actions: validate → mutate → revalidate?
