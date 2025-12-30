# Edit Record - Page Flow

> URL: `/records/{id}/edit`

---

## User Journey

```mermaid
flowchart TD
    A[User visits /records/id/edit] --> B[page.tsx]
    B --> C[Extract: params.id]
    C --> D[Query: fetch record with entity fields]
    D --> E{Found?}

    E -->|Not Found| F[Show 404 page]
    E -->|Found| G[Render: RecordForm mode=edit]

    subgraph "Form Pre-filled"
        G --> H[fieldValues from record]
        H --> I[metadata JSON]
        I --> J[User edits form]
    end

    J --> K[User clicks 'Update Record']
    K --> L[Server action: validate & update]
    L --> M{Success?}

    M -->|No| N[Toast error + field errors]
    N --> J
    M -->|Yes| O[Redirect to /records/id]

    style F fill:#f66
    style O fill:#6f6
```

---

## Flow Summary

| Step | URL                  | Query                           | User Action   |
| ---- | -------------------- | ------------------------------- | ------------- |
| 1    | `/records/{id}/edit` | fetch record with entity fields | Edit & submit |
| 2    | `/records/{id}`      | —                               | —             |

---

## Data Queries

- **Record**: id, entityId, entityName, entityFields, fieldValues, metadata, timestamps

---

## Differences from Create Mode

| Aspect          | Create               | Edit            |
| --------------- | -------------------- | --------------- |
| `mode` prop     | `"create"`           | `"edit"`        |
| `initialData`   | Not provided         | Current record  |
| Form defaults   | Empty/default values | Pre-filled      |
| Submit action   | create record        | update record   |
| Cancel goes to  | `/records`           | `/records/{id}` |
| Success goes to | `/records/{id}`      | `/records/{id}` |

---

## Edge Cases

| Scenario            | Handling                  |
| ------------------- | ------------------------- |
| Record not found    | Show 404 page             |
| Entity deleted      | Show 404 page             |
| Validation fails    | Show field errors         |
| Update action fails | Toast error, stay on page |
