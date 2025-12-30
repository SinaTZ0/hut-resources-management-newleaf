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
    I -->|Click 'Create Record'| J[Navigate to /records/create]
    I -->|Click row| K[Navigate to /records/id]

    H --> L{User action}
    L -->|Filter by entity| M[Update table columns]
    L -->|Customize columns| M

    style J fill:#6f6
    style K fill:#6f6
```

---

## Flow Summary

| Step | URL        | Query                                | Component                    |
| ---- | ---------- | ------------------------------------ | ---------------------------- |
| 1    | `/records` | fetch records + entities in parallel | Records table, Table builder |

---

## Data Queries

- **Records**: All records with entity name, field values, metadata, timestamps
- **Entities**: All entities with field definitions (for dynamic columns in table builder)

---

## Edge Cases

| Scenario             | Handling                                  |
| -------------------- | ----------------------------------------- |
| Records query fails  | Show error alert                          |
| Entities query fails | Show error alert                          |
| No records exist     | Show empty state with "Create Record" CTA |
