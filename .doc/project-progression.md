# Project Progression

## Overview

Flexible Resource Manager - A Next.js application for managing dynamic resources with customizable entity schemas.

---

## Completed Features

### Phase 1: Core Infrastructure ✅

- [x] Next.js 15 App Router setup
- [x] PostgreSQL + Drizzle ORM integration
- [x] TypeSafe environment variables
- [x] Shadcn/ui + Tailwind CSS styling
- [x] ESLint + Prettier + Husky setup
- [x] Zod v4 schema validation

### Phase 2: Entities Module ✅

- [x] Entity CRUD operations (create, read, update, delete)
- [x] Dynamic field builder with drag-and-drop ordering
- [x] Field types: `string`, `number`, `date`, `boolean`
- [x] Field metadata: label, sortable, required, order
- [x] Entity listing with data table
- [x] Entity detail view
- [x] Entity edit functionality

### Phase 3: Records Module ✅

- [x] Record CRUD operations
- [x] Dynamic form generation based on entity fields
- [x] Field values validation matching entity schema
- [x] Metadata editor (JSON-based Depth 2 data)
- [x] Records listing with dynamic columns
- [x] Record detail view
- [x] Record edit functionality
- [x] Entity selector for record creation

### Phase 4: Field Type Enhancements ✅

- [x] **Enum field type support**
  - Enum options definition in entity fields
  - Enum selection input in record forms
  - Enum display in tables and detail views

### Phase 5: Default Values for Required Fields (Edit Entity) ✅

- [x] **Default value input for new required fields when editing entity**
  - Default Value input appears in FieldBuilder when adding a required field (edit mode only)
  - Warning description: "This value will be applied to all existing records"
  - Support for all field types: string, number, boolean, date
- [x] **Enum fields default selection**
  - Users must explicitly select a default value for enum fields when adding required enum fields in edit mode
  - Warning note displayed: "The selected default value will be applied to all existing records"
- [x] **Update entity action with transaction**
  - Uses Drizzle transaction to atomically update entity and records
  - Validates that new required fields have default values
  - Updates all existing records with default values for new required fields
  - Enum fields require an explicitly selected default value; no automatic first-option default is applied

### Phase 6: Batch Create / Bulk Insert ✅

- [x] **Client-side queue & dual-pane UI**
  - Dual-pane interface (form on the left, queued/pending records list on the right)
  - Local queue with add/delete/clear actions and confirm for large batches
  - Desktop-first layout with scrollable panes and pinned footer actions
- [x] **Server Action: `createRecordsBatch`**
  - Atomic batch insert using Drizzle transaction
  - Server-side validation for each record (dynamic per-entity schema)
  - Batch size limit enforced (max 100 records per submission)
  - Detailed error reporting: failed record indices returned and queue preserved on failure
- [x] **Security & data hygiene**
  - Metadata sanitization to prevent prototype pollution (`__proto__`, `constructor`, `prototype` removed)
  - UUID/entity existence checks to avoid foreign key errors
  - Transaction isolation to prevent race conditions during batch insert

### Phase 7: Table Builder Bulk Actions ✅

- [x] **Row selection in Table Builder**
  - Checkbox column for selecting individual records
  - "Select all" checkbox in header for current page
  - Selected count indicator in toolbar
- [x] **Bulk delete with confirmation**
  - Delete multiple selected records in a single transaction
  - Confirmation dialog showing count of records to delete
  - Atomic operation with rollback on failure
- [x] **Batch field edit with popup form**
  - Popup form to edit a single field value across all selected records
  - Field selector dropdown (only Depth 1 fields)
  - Confirmation dialog before applying changes
  - Atomic batch update with validation

### Phase 6.5: Field Value & Delete Behavior Normalization ✅

- [x] **Field deletion cascades to record field values**
  - When a field is deleted from an Entity, the corresponding field values are automatically removed from all associated Records
  - Uses atomic transaction to ensure data consistency
  - Prevents orphaned field values from accumulating in records
- [x] **Empty non-required field values not stored**
  - Non-required fields with empty/null/default values are stripped before database insert/update
  - Applies to create record, update record, and batch create operations
  - Prevents confusion from meaningless default values (e.g., 0 for numbers, empty strings)
  - Intentional values (e.g., `false` for boolean) are preserved
- [x] **Batch edit: Clear field value option**
  - Added "Clear Field Value" toggle for non-required fields in batch edit dialog
  - Users can select to remove field values entirely from selected records
  - Server-side validation prevents clearing required fields
  - Clear action removes the field key from `fieldValues` object

### Phase 8: Record Assets (Thumbnail, Galleries, Files) ✅

- [x] **Assets JSONB column in Records table**
  - Flexible schema: `{ thumbnail?: { path }, galleries?: Array<{ titleAndID, path[] }>, files?: Array<{ titleAndID, path[] }> }`
  - Stores file paths relative to `/public/uploads/records/{recordId}/`
  - Slug-based naming: `titleAndID` stored as slug, displayed as prettified title in UI
- [x] **Thumbnail generation with sharp**
  - Server-side processing using sharp library
  - Automatic resize to 200×200 pixels in WebP format
  - Single thumbnail per record, replaces existing on re-upload
- [x] **Gallery & file upload system**
  - Multiple galleries per record (each with title + array of images)
  - Multiple file groups per record (each with title + array of files)
  - Image validation: max 10MB, accepts jpg/jpeg/png/gif/webp
  - File validation: max 50MB per file
- [x] **AssetsForm component for record edit page**
  - Thumbnail upload with image preview
  - Gallery upload: add new galleries with custom title and multiple images
  - Files upload: add new file groups with custom title and multiple files
  - Integrated below RecordForm on edit page
- [x] **Assets display on record detail page**
  - Thumbnail displayed in record header
  - Galleries in lazy-loading accordion (images fetched on expand)
  - Files in lazy-loading accordion (file list fetched on expand)
- [x] **Thumbnail column in Table Builder**
  - Shows 40×40 thumbnail in record list
  - Fallback icon for records without thumbnail

## Upcoming Features

### Search & Filter

- [ ] Global search across records
- [ ] Field-specific filtering
- [ ] Saved filter presets
- [ ] Advanced query builder

### Import/Export

- [ ] CSV import for bulk record creation
- [ ] CSV/JSON export of records
- [ ] Entity schema export/import

### Audit & History

- [ ] Record change history
- [ ] Audit log for entity modifications
- [ ] Soft delete with restore capability

### User Management

- [ ] Authentication integration
- [ ] Role-based access control
- [ ] User preferences

---

## Technical Debt

- [ ] Add comprehensive test coverage
- [ ] Implement error boundaries
- [ ] Add loading skeletons for better UX
- [ ] Optimize database queries with proper indexing

---

## Architecture Notes

### Data Model (Depth Model)

- **Depth 1**: Structured, typed, queryable fields (defined in Entity schema)
- **Depth 2**: Flexible JSON metadata for unstructured data

### Key Patterns

- Schema-driven development: Drizzle → Zod → TypeScript types
- Feature colocation: Related code lives together in route folders
- Server Actions for mutations with Zod validation
- TanStack Table for data display with dynamic columns

---

_Last updated: January 2, 2026_
