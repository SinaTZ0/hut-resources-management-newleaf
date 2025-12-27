```bash
# app/entities - Entities feature
app/entities/
├─ entities-table.tsx          # Table component: displays list of entities (UI + table wiring)
├─ entity-columns.tsx          # Table column defs / renderers used by `entities-table`
├─ page.tsx                    # Page route that shows entity list / main entry for /entities
├─ [id]/                       # Dynamic route for single entity (by id)
│  ├─ copy-id-button.tsx       # Small UI: button to copy the entity ID to clipboard
│  ├─ entity-details.tsx       # Full details view for a single entity
│  ├─ fields-display.tsx       # Renders entity fields (read-only / formatted)
│  ├─ not-found.tsx            # 404 UI when an entity with given id doesn't exist
│  └─ page.tsx                 # Route wrapper for `/entities/[id]` — server/client routing
│  └─ edit/                    # Nested route for editing an entity
│     └─ page.tsx              # Edit page for a single entity (using the shared entity-form in components folder)
├─ actions/                    # Server actions (mutations)
│  ├─ create-entity.ts         # Server action to create a new entity
│  ├─ delete-entity.ts         # Server action to delete an entity
│  └─ update-entity.ts         # Server action to update an existing entity
├─ components/                 # Reusable components for entities feature
│  └─ entities-form/           # Form components used to create/edit entities
│     ├─ entity-form.tsx       # Main form wrapper (fields + submit handling)
│     ├─ entity-info-form.tsx  # Sub-form for general entity metadata (name, type...)
│     ├─ field-builder.tsx     # UI to build / add custom fields for an entity
│     └─ saved-fields-list.tsx # Reusable list of saved / reusable field templates
├─ create/                     # Route to create an entity
│  └─ page.tsx                 # `/entities/create` page (using the shared entity-form in components folder)
└─ queries/                    # Data fetching utilities
   ├─ get-entities.ts          # Query to fetch list of entities (pagination/filter)
   └─ get-entity-by-id.ts      # Query to fetch one entity by id (includes fields)
```
