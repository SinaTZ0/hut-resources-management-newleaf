# Records List - Page Flow

> URL: `/records`

---

## User Journey

```mermaid
flowchart TD
    A[User visits /records] --> B[page.tsx]
    B --> C[Parallel Queries]
    C --> D[fetch all records]
    C --> E[fetch entities with fields]

    D & E --> F[Render: Tabs]
    F --> G[Tab: All Records]
    F --> H[Tab: Table Builder]

    G --> I{User action}
    I -->|Click 'Create Record' dropdown| J[Select entity from searchable list]
    J --> K[Navigate to /records/create?entityId=xxx]
    I -->|Click row| L[Navigate to /records/id]

    H --> M{User action}
    M -->|Filter by entity| N[Update table columns]
    M -->|Customize columns| N

    style K fill:#6f6
    style L fill:#6f6
```

---

## Flow Summary

| Step | URL        | Query                                | Component                                    |
| ---- | ---------- | ------------------------------------ | -------------------------------------------- |
| 1    | `/records` | fetch records + entities in parallel | Records table, Table builder, CreateDropdown |

---

## Data Queries

- **Records**: All records with entity name, field values, metadata, timestamps
- **Entities**: All entities with field definitions (for dropdown + dynamic columns in table builder)

---

## Components

- **CreateRecordDropdown**: Searchable dropdown showing all entities, navigates to create page with entityId
- **RecordsTable**: Data table showing all records
- **TableBuilder**: Dynamic table with entity-specific column configuration

---

## Edge Cases

| Scenario             | Handling                                   |
| -------------------- | ------------------------------------------ |
| Records query fails  | Show error alert                           |
| Entities query fails | Show error alert, hide create dropdown     |
| No entities exist    | Show "Create Entity First" button          |
| No records exist     | Show empty state with "Create Record" link |
