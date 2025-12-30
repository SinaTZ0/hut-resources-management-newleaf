# Edit Entity - Page Flow

> URL: `/entities/{id}/edit`

---

## User Journey

```mermaid
flowchart TD
    A[User visits /entities/id/edit] --> B[page.tsx]
    B --> C[Extract: params.id]
    C --> D[Query: fetch entity by id]
    D --> E{Found?}

    E -->|Not Found| F[Show 404 page]
    E -->|Found| G[Render: EntityForm mode=edit]

    subgraph "Form Pre-filled"
        G --> H[name, description]
        H --> I[fields: Record → Array]
        I --> J[User edits form]
    end

    J --> K[User clicks 'Update Entity']
    K --> L[Transform fields → Record]
    L --> M[Server action: validate & update]
    M --> N{Success?}

    N -->|No| O[Toast error + field errors]
    O --> J
    N -->|Yes| P[Redirect to /entities]

    style F fill:#f66
    style P fill:#6f6
```

---

## Flow Summary

| Step | URL                   | Query              | User Action   |
| ---- | --------------------- | ------------------ | ------------- |
| 1    | `/entities/{id}/edit` | fetch entity by id | Edit & submit |
| 2    | `/entities`           | —                  | —             |

---

## Data Queries

- **Entity**: id, name, description, fields (Record<key, FieldSchema>), timestamps

---

## Differences from Create Mode

| Aspect        | Create          | Edit             |
| ------------- | --------------- | ---------------- |
| `mode` prop   | `"create"`      | `"edit"`         |
| `initialData` | Not provided    | Existing entity  |
| Form defaults | Empty           | Pre-filled       |
| Fields list   | Empty           | From entity data |
| Submit action | create entity   | update entity    |
| Button text   | "Create Entity" | "Update Entity"  |

---

## Edge Cases

| Scenario                | Handling                                       |
| ----------------------- | ---------------------------------------------- |
| Entity not found        | Show 404 page                                  |
| Remove all fields       | Validation error "At least one field required" |
| Duplicate field labels  | Auto-generates unique key                      |
| Server validation fails | Toast error + field errors                     |
