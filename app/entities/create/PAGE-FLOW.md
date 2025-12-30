# Create Entity - Page Flow

> URL: `/entities/create`

---

## User Journey

```mermaid
flowchart TD
    A[User visits /entities/create] --> B[page.tsx]
    B --> C[Render: EntityForm mode=create]

    subgraph "Entity Form - 3 Steps"
        C --> D[Step 1: Entity Details]
        D --> E[name, description]
        E --> F[Step 2: Field Builder]
        F --> G[label, type, sortable, required]
        G --> H[Step 3: Saved Fields]
        H --> I[Drag & drop reorder]
    end

    I --> J[User clicks 'Create Entity']
    J --> K[Transform fields array → Record]
    K --> L[Server action: validate & insert]
    L --> M{Success?}

    M -->|No| N[Toast error + field errors]
    N --> C
    M -->|Yes| O[Redirect to /entities]

    style N fill:#f66
    style O fill:#6f6
```

---

## Flow Summary

| Step | URL                | Query | User Action                   |
| ---- | ------------------ | ----- | ----------------------------- |
| 1    | `/entities/create` | None  | Fill name, add fields, submit |
| 2    | `/entities`        | —     | —                             |

---

## Data Transformation

Fields array in form → Record<key, FieldSchema> for DB:

- Key generated from `toSnakeCase(label)`
- Order set from array index

---

## Edge Cases

| Scenario                | Handling                                        |
| ----------------------- | ----------------------------------------------- |
| No fields added         | Validation error "At least one field required"  |
| Duplicate field labels  | Auto-generates unique key: `field_1`, `field_2` |
| Server validation fails | Toast error + attach field errors to form       |
