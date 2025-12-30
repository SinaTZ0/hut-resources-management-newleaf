# Entity Details - Page Flow

> URL: `/entities/{id}`

---

## User Journey

```mermaid
flowchart TD
    A[User visits /entities/id] --> B[page.tsx]
    B --> C[Extract: params.id]
    C --> D[Query: fetch entity by id]
    D --> E{Found?}

    E -->|Not Found| F[Show 404 page]
    E -->|Found| G[Render: entity details]

    G --> H{User action}
    H -->|View| I[Display name, description, fields]
    H -->|Click 'Edit'| J[Navigate to /entities/id/edit]
    H -->|Click 'Delete'| K[Server action: delete]
    H -->|Click 'Back'| L[Navigate to /entities]

    K --> M{Success?}
    M -->|No| N[Toast error]
    M -->|Yes| L

    style F fill:#f66
    style J fill:#6f6
    style L fill:#6f6
```

---

## Flow Summary

| Step | URL              | Query              | User Actions       |
| ---- | ---------------- | ------------------ | ------------------ |
| 1    | `/entities/{id}` | fetch entity by id | View, Edit, Delete |

---

## Data Queries

- **Entity**: id, name, description, fields (Record<key, FieldSchema>), timestamps

---

## Edge Cases

| Scenario         | Handling                  |
| ---------------- | ------------------------- |
| Entity not found | Show 404 page             |
| Query fails      | Show 404 page             |
| Delete fails     | Toast error, stay on page |
