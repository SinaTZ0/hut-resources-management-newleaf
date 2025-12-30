# Record Details - Page Flow

> URL: `/records/{id}`

---

## User Journey

```mermaid
flowchart TD
    A[User visits /records/id] --> B[page.tsx]
    B --> C[Extract: params.id]
    C --> D[Query: fetch record with entity data]
    D --> E{Found?}

    E -->|Not Found| F[Show 404 page]
    E -->|Found| G[Render: record details]

    G --> H{User action}
    H -->|View| I[Display field values & metadata]
    H -->|Click 'Edit'| J[Navigate to /records/id/edit]
    H -->|Click 'Delete'| K[Server action: delete]
    H -->|Click 'Back'| L[Navigate to /records]

    K --> M{Success?}
    M -->|No| N[Toast error]
    M -->|Yes| L

    style F fill:#f66
    style J fill:#6f6
    style L fill:#6f6
```

---

## Flow Summary

| Step | URL             | Query                           | User Actions       |
| ---- | --------------- | ------------------------------- | ------------------ |
| 1    | `/records/{id}` | fetch record with entity fields | View, Edit, Delete |

---

## Data Queries

- **Record**: id, entityId, entityName, entityFields, fieldValues, metadata, timestamps

---

## Edge Cases

| Scenario         | Handling                  |
| ---------------- | ------------------------- |
| Record not found | Show 404 page             |
| Query fails      | Show 404 page             |
| Delete fails     | Toast error, stay on page |
