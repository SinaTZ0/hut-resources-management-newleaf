# Create Record - Page Flow

> URL: `/records/create` and `/records/create?entityId={id}`

---

## User Journey

```mermaid
flowchart TD
    subgraph "User visits /records/create"
        A[page.tsx] --> B{entityId in URL?}
    end

    subgraph "Step 1: No entityId"
        B -->|No| C[Query: fetch all entities]
        C --> D[Render: EntitySelector]
        D --> E[User selects entity]
        E --> F[Redirect to /records/create?entityId=xxx]
        F -.-> B
    end

    subgraph "Step 2: Has entityId"
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

    style I fill:#f66
    style O fill:#6f6
```

---

## Flow Summary

| Step | URL                            | Condition      | Query              | User Action   |
| ---- | ------------------------------ | -------------- | ------------------ | ------------- |
| 1    | `/records/create`              | No `entityId`  | fetch all entities | Select entity |
| 2    | `/records/create?entityId=xxx` | Has `entityId` | fetch entity by id | Fill & submit |
| 3    | `/records/{id}`                | After submit   | —                  | —             |

---

## Data Queries

- **Step 1**: All entities (id, name, description) for selector
- **Step 2**: Single entity (id, name, fields) for dynamic form generation

---

## Edge Cases

| Scenario              | Handling                        |
| --------------------- | ------------------------------- |
| Entities query fails  | Show error card                 |
| No entities exist     | Show "Create Entity" prompt     |
| Invalid `entityId`    | Show 404 page                   |
| Form validation fails | Show field errors, stay on page |
| Create action fails   | Toast error, stay on page       |
