# Entities List - Page Flow

> URL: `/entities`

---

## User Journey

```mermaid
flowchart TD
    A[User visits /entities] --> B[page.tsx]
    B --> C[Query: fetch all entities]
    C --> D{Success?}

    D -->|Error| E[Show error alert]
    D -->|Success| F[Render: entities table]

    F --> G{User action}
    G -->|Click 'Create Entity'| H[Navigate to /entities/create]
    G -->|Click table row| I[Navigate to /entities/id]

    style E fill:#f66
    style H fill:#6f6
    style I fill:#6f6
```

---

## Flow Summary

| Step | URL         | Query              | Component      |
| ---- | ----------- | ------------------ | -------------- |
| 1    | `/entities` | fetch all entities | Entities table |

---

## Data Queries

- **Entities**: id, name, description, fields, timestamps

---

## Edge Cases

| Scenario          | Handling                 |
| ----------------- | ------------------------ |
| Query fails       | Show error alert         |
| No entities exist | Show empty state message |
