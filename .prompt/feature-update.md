# Feature Update: Hide non-sortable fields & Editable Field Options

## Summary

This prompt captures the tasks, scope, and decisions for:

1. Hiding fields whose `sortable` property is `false` by default in all Record tables (TanStack Table).
2. Allowing editing of Entity field `sortable` and `required` options, including requiring a default value when toggling `required` on.

All clarifying questions were asked and answered via interactive MCP. The chosen options are recorded below.

---

## Decisions / Answers

- Scope: Apply to _all record tables_ across the app (Records main list, entity-specific lists, Table Builder views, etc.)
- When toggling `Required` on: **Apply the provided default value to all existing records automatically** (atomic transaction + validation).
- UX: **Show a confirmation dialog** before applying the default to existing records (shows count and requires confirmation).
- UI for default input: **Reuse the existing FieldBuilder `Default Value` input inline (beside Required toggle)**.
- Enums: **User must explicitly select default from enum options (no auto-default)**.
- Server-side: **Validate default matches field type**; enforce enum value exists.
- Transaction behavior: **Use Drizzle transaction + validation**, roll back on error.
- Column visibility behavior: **Hidden by default (can re-enable)** — do not remove columns permanently.

---

## Acceptance Criteria / Implementation Notes

### Task A — Hide non-sortable fields by default

- Search for all usages of `@tanstack/react-table` and identify tables that render Records (e.g., `components/tables/data-table.tsx`, `app/records/**/records-table.tsx`, other record listing components).
- For each table, set the initial column visibility so that fields with `field.sortable === false` are not visible by default. E.g., use React Table `initialState.columnVisibility` or per-column `enableHiding`/`defaultVisible` depending on the TanStack version used.
- Ensure the user can still re-enable hidden columns via the column chooser (do not permanently remove columns).
- Keep any existing user preferences (do not overwrite persisted user column visibility settings on update unless they reset them).
- Add tests where applicable to assert default visibility behavior.

### Task B — Edit Entity fields `sortable` and `required`

- Add toggles in the FieldBuilder entry for each field:
  - `Sortable` (boolean toggle)
  - `Required` (boolean toggle)
- When toggling `Required` on:
  - Show the inline `Default Value` input (reusing the existing input component for that type — text/number/date/boolean/enum picker).
  - Validate input on the client (type checks), and on the server (Zod + explicit checks for enums).
  - Show confirmation dialog: "Applying this change will set the default value on X existing records. Proceed?"
  - On confirm, call a server action that:
    - Validates the default
    - Starts a Drizzle transaction
    - Updates the Entity's field settings
    - Updates all existing records for that Entity to add the default value for the field (skip records that already have a value for that field)
    - Rolls back on any validation or DB error
    - Revalidates affected pages (e.g., revalidatePath)
- For `Sortable` toggle:
  - Persist the setting on the entity field definition
  - When changed, optionally re-run client cache invalidation to refresh default column visibility in lists
- For Enum fields: enforce an explicit default selection from enum options.

### Safety & Validation

- Server must ensure provided default value is of the correct type.
- Prevent prototype pollution in metadata updates (sanitize keys like `__proto__`, `constructor`, `prototype`).
- Run updates in transactions and use validations to avoid corrupting record data.

---

## Testing & CI

- Update or add unit/integration tests that verify:
  - Default column visibility hides non-sortable fields
  - Toggling `Required` on without a default is rejected
  - Toggling `Required` on with default applies changes in a transaction and updates existing records
- Run `pnpm type-check` and `pnpm lint` after changes; resolve reported issues.

---

## Files/Places to Inspect First

- `components/tables/data-table.tsx`
- `app/records/_all-records-table/records-table.tsx` (and similar record list components)
- Entity FieldBuilder components: `app/entities/components/entities-form/` (look for `field-builder` or similar)
- Server actions that update Entities (e.g., `app/entities/actions/update-entity.ts`)
- Transaction utilities used in batch actions (reference existing implementations like `update entity action with transaction`)

---

## Next Steps

1. Implement column default visibility changes across record tables.
2. Add UI toggles in FieldBuilder and reuse default input for required toggle.
3. Implement server action with Drizzle transaction to update entity + existing records.
4. Add confirmation dialog UX and tests.
5. Run `pnpm type-check` and `pnpm lint`, fix issues.
6. Update `project-progression.md` with completed items.

---

_Saved decisions timestamp:_ 2026-01-02
