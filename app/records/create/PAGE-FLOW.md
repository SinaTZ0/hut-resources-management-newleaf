# Create Record - Page Flow

> URL: `/records/create?entityId={id}`

---

## User Journey

```mermaid
flowchart TD
    subgraph "User visits /records/create"
        A[page.tsx] --> B{entityId in URL?}
    end

    subgraph "No entityId - Redirect"
        B -->|No| C[Redirect to /records]
    end

    subgraph "Has entityId - Show Form"
        B -->|Yes| G[Query: fetch entity by id]
        G --> H{Found?}
        H -->|No| I[404 Page]
        H -->|Yes| J[Render: RecordForm mode=create]
        J --> K[User fills & submits]
        K --> L[Server action: validate & insert]
        L --> M{Success?}
        M -->|No| N[Toast error]
        N --> J
        M -->|Yes| O[Redirect to /records/id]
    end

    style C fill:#f66
    style I fill:#f66
    style O fill:#6f6
```

---

## Flow Summary

| Step | URL                            | Condition      | Query              | User Action   |
| ---- | ------------------------------ | -------------- | ------------------ | ------------- |
| 1    | `/records/create`              | No `entityId`  | —                  | Redirect      |
| 2    | `/records/create?entityId=xxx` | Has `entityId` | fetch entity by id | Fill & submit |
| 3    | `/records/{id}`                | After submit   | —                  | —             |

---

## Data Queries

- **Single entity** (id, name, fields) for dynamic form generation

---

## Notes

- Entity selection is now done via dropdown on `/records` page
- Direct access to `/records/create` without entityId redirects to `/records`

---

## Edge Cases

| Scenario              | Handling                        |
| --------------------- | ------------------------------- |
| No `entityId`         | Redirect to /records            |
| Invalid `entityId`    | Show 404 page                   |
| Form validation fails | Show field errors, stay on page |
| Create action fails   | Toast error, stay on page       |
