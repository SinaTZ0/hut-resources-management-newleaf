# Batch Create Records - Page Flow

## Overview

This page allows users to queue multiple records locally and submit them to the database in a single atomic transaction. It uses a dual-pane interface with a pending records list on the left and a form on the right.

---

## User Journey

```mermaid
flowchart TD
    A[User visits /records/batch-create] --> B[page.tsx Server Component]
    B --> C[Query: Fetch all entities with fields]
    C --> D{Entities exist?}

    D -->|No entities| E[Show "No Entities Available" message]
    D -->|Has entities| F[Render BatchCreateClient]

    F --> G[User selects entity from dropdown]
    G --> H[Form fields update dynamically]
    H --> I[User fills field values]
    I --> J[User clicks "Add to Queue"]

    J --> K{Local Validation}
    K -->|Invalid| L[Show validation errors]
    K -->|Valid| M[Add record to pending list]

    M --> N{Add more records?}
    N -->|Yes| G
    N -->|No| O[User clicks "Submit All"]

    O --> P[Server Action: createRecordsBatch]
    P --> Q[Server-side validation for ALL records]
    Q --> R{All records valid?}

    R -->|Invalid| S[Return detailed errors]
    S --> T[Show errors, preserve queue]

    R -->|Valid| U[Begin Drizzle Transaction]
    U --> V[Insert all records atomically]
    V --> W{Transaction success?}

    W -->|Error| X[Rollback entire transaction]
    X --> Y[Show error, preserve queue]

    W -->|Success| Z[Commit transaction]
    Z --> AA[Revalidate paths]
    AA --> AB[Redirect to /records]

    style E fill:#f66
    style L fill:#f66
    style S fill:#f66
    style X fill:#f66
    style Y fill:#f66
    style AB fill:#6f6
```

---

## Flow Summary

| Step | URL                     | Query/Action            | Component            | User Action                  |
| ---- | ----------------------- | ----------------------- | -------------------- | ---------------------------- |
| 1    | `/records/batch-create` | `getEntitiesWithFields` | `page.tsx`           | Navigate to page             |
| 2    | -                       | -                       | `BatchCreateClient`  | View dual-pane interface     |
| 3    | -                       | -                       | `BatchRecordForm`    | Select entity type           |
| 4    | -                       | -                       | `FieldValuesForm`    | Fill in field values         |
| 5    | -                       | Local state update      | `BatchCreateClient`  | Click "Add to Queue"         |
| 6    | -                       | -                       | `PendingRecordsList` | View queued records          |
| 7    | -                       | -                       | `PendingRecordItem`  | (Optional) Delete from queue |
| 8    | -                       | `createRecordsBatch`    | `BatchCreateClient`  | Click "Submit All"           |
| 9    | `/records`              | -                       | -                    | Redirect on success          |

---

## Data Queries

### Server-side (page.tsx)

| Query                     | Purpose                                     | Returns                                                         |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| `getEntitiesWithFields()` | Fetch all entities with their field schemas | `EntityWithFields[]` with `id`, `name`, `description`, `fields` |

### Client-side State

| State              | Type              | Purpose                                  |
| ------------------ | ----------------- | ---------------------------------------- |
| `pendingRecords`   | `PendingRecord[]` | Queue of records waiting to be submitted |
| `selectedEntityId` | `string \| null`  | Currently selected entity for the form   |
| `isPending`        | `boolean`         | Submission in progress indicator         |

### Server Action (createRecordsBatch)

| Validation Step         | Description                          |
| ----------------------- | ------------------------------------ |
| Batch size check        | Max 100 records per batch            |
| Base schema validation  | `insertRecordSchema` for each record |
| Entity existence check  | Verify all entityIds exist           |
| Field values validation | Dynamic schema per entity            |
| Metadata sanitization   | Prototype pollution prevention       |

---

## Edge Cases

### Empty Queue

- **Trigger**: User clicks "Submit All" with no records
- **Handling**: Button disabled when queue is empty
- **UI**: Shows "No records in queue" message

### Entity Not Found

- **Trigger**: Entity deleted while records are queued
- **Handling**: Server returns error, transaction rolled back
- **UI**: Toast error, queue preserved for user to fix

### Validation Failure

- **Trigger**: One or more records fail server-side validation
- **Handling**: Returns detailed errors with record indices
- **UI**: Toast with specific record numbers that failed

### Network Interruption

- **Trigger**: Connection lost during submission
- **Handling**: `useTransition` keeps UI responsive
- **UI**: Error toast, queue preserved for retry

### Transaction Failure

- **Trigger**: Database error during batch insert
- **Handling**: Drizzle transaction rollback (all-or-nothing)
- **UI**: Error toast, all records remain in queue

### Concurrent Modifications

- **Trigger**: Entity schema changed during submission
- **Handling**: Field validation will catch mismatches
- **UI**: Validation error returned to user

---

## Security Measures

1. **Server-side validation**: All records re-validated on server
2. **Entity existence check**: Prevents foreign key violations
3. **Metadata sanitization**: Removes `__proto__`, `constructor`, `prototype`
4. **Batch size limit**: Maximum 100 records per submission
5. **UUID validation**: All entity IDs validated before query
6. **Transaction isolation**: Prevents race conditions

---

## Component Hierarchy

```
page.tsx (Server)
└── BatchCreateClient (Client)
    ├── PendingRecordsList
    │   └── PendingRecordItem (×N)
    └── BatchRecordForm
        ├── EntitySelector
        ├── FieldValuesForm
        │   └── DynamicField (×N)
        └── MetadataEditor
```
