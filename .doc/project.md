# **Flexible Resource Manager App**

## **Overview**

Flexible Resource Manager is designed for small organizations, teams, and non-technical users who need to track resources but don’t want to be locked into rigid, pre-defined forms. Instead of forcing a fixed structure, the app lets users define their own categories of resources (called Entities), choose what information matters to them, and keep everything searchable and easy to manage.

Many people currently rely on spreadsheets, scattered files, or overly complex inventory tools. This system replaces those with something simpler, more consistent, and customizable.

---

## **Core Concepts**

Before diving into Entities and Records, it helps to understand the two data layers used throughout the system.

### **Depth Model**

Every resource in the system is made of **two layers**:

- **Depth 1 (Structured Layer)**
  Flat, typed, easy-to-query fields.
  This layer powers search, sorting, and filtering.

- **Depth 2 (Unstructured Layer)**
  A flexible JSON space for everything else—nested, complex, or unpredictable data.

> “Depth” simply refers to how structured the field is.
> Depth 1 is flat and typed; Depth 2 can be nested and free-form.

---

## **Entities**

Entities represent the _types_ of resources you want to manage. They act as templates or categories.

An Entity includes:

- A **Depth 1 schema** (typed, searchable fields)
- Optional **UI metadata** (labels, ordering, sortability)
- **Validation rules** for each Depth 1 field

**Examples of Entities**

- Network Equipment
- Software Licenses
- Employee Assets
- Inventory Items

### **Example: Network Equipment Entity**

**Depth 1 fields**

| Field         | Type   | Description             |
| ------------- | ------ | ----------------------- |
| Name          | string | Device name             |
| Serial Number | string | Unique ID               |
| Model         | string | Hardware model          |
| Status        | enum   | Active / Spare / Faulty |

**Depth 2 example JSON**

```json
{
  "interfaces": [
    { "name": "Gi0/1", "vlan": 10 },
    { "name": "Gi0/2", "vlan": 20 }
  ],
  "location_notes": "Mounted in rack 3U"
}
```

---

## **Records**

Records are the _instances_ of an Entity. Each Record represents a specific item or resource.

A Record contains:

- **Depth 1 values**: the structured fields defined in the Entity
- **Depth 2 data**: a flexible JSON blob for extra details

**Example Record Instance**

_Entity:_ Network Equipment
_Record:_ Cisco Catalyst 2960 – Switch #12

**Depth 1**

| Field         | Value         |
| ------------- | ------------- |
| Name          | SW-2960-12    |
| Serial Number | FOC1831Z90S   |
| Model         | Catalyst 2960 |
| Status        | Active        |

**Depth 2**

```json
{
  "interfaces": [
    { "name": "Gi0/1", "vlan": 10 },
    { "name": "Gi0/24", "vlan": 99, "description": "Uplink" }
  ],
  "last_config_backup": "2024-10-02",
  "notes": "Assigned to Server Room A"
}
```

---

## **Depth 1: Core Properties**

Depth 1 fields are the structured details you want to search and sort by. These are defined at the Entity level and apply to all Records of that type.

Examples:

- Name
- Serial Number
- Status
- Purchase Date

---

## **Depth 2: Additional Details**

Depth 2 is the space for anything that doesn’t need to be indexed or searchable. It works like a flexible notebook where you can store:

- Configuration or setup details
- Notes and long-form text
- Nested JSON structures
- Related documents or specifications

---

## **How It Works**

1. **Define Your Entities**
   Create an Entity for the resource category you want to track.
   Add the important Depth 1 fields and validation rules.

2. **Add Records**
   Add individual Records under each Entity.
   Fill in the required Depth 1 fields and optionally include Depth 2 data.

3. **View and Manage**
   Browse your records in clear, sortable tables driven by Depth 1 fields.
   Click into any record to view both its structured and unstructured data.

4. **Search and Filter**
   Use Depth 1 properties for fast filtering and finding items.
   Depth 2 stays available for detail-rich information without slowing searches.

---

## **Key Benefits**

- Define only the fields you care about
- Keep the interface simple and lightweight
- Search and filter using structured data
- Store unlimited extra details without restructuring your system
