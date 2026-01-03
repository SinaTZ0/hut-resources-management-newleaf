import { eq } from 'drizzle-orm'
import * as schema from '../lib/drizzle/schema.ts'
import { entitiesTable, recordsTable } from '../lib/drizzle/schema.ts'
import { drizzle } from 'drizzle-orm/node-postgres'
import { fileURLToPath } from 'url'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set to run the seed script')
}

const db = drizzle(process.env.DATABASE_URL, { schema, casing: 'snake_case' })

/*
  Idempotent seed script that:
  - Ensures 4 entities exist (Cisco Switch, Cisco Router, HP Server, Chair)
  - Removes existing records for those entities and inserts fresh records
  - Conforms to the Zod schemas in `lib/drizzle/schema.ts`
  - Omits `assets` (sets to null) and adds metadata only to technical devices
*/

// Data moved to `scripts/seed-data.ts`
import { ENTITIES } from './seed-data.ts'

async function seed() {
  for (const e of ENTITIES) {
    // Ensure entity exists
    const existing = await db
      .select()
      .from(entitiesTable)
      .where(eq(entitiesTable.name, e.name))
      .limit(1)
    let entityId: string

    if (existing.length > 0) {
      entityId = existing[0].id
      // Update fields/description if you want to keep seed authoritative
      await db
        .update(entitiesTable)
        .set({ description: e.description ?? null, fields: e.fields })
        .where(eq(entitiesTable.id, entityId))
    } else {
      const [inserted] = await db
        .insert(entitiesTable)
        .values({ name: e.name, description: e.description ?? null, fields: e.fields })
        .returning()
      entityId = inserted.id
    }

    // Remove any existing records for a clean state
    await db.delete(recordsTable).where(eq(recordsTable.entityId, entityId))

    const toInsert = e.records.map((r) => ({
      entityId,
      fieldValues: r.fieldValues,
      metadata: r.metadata ?? null,
      assets: null,
    }))

    if (toInsert.length > 0) {
      // Insert one by one to avoid spread tuple typing issues in TypeScript
      for (const row of toInsert) {
        await db.insert(recordsTable).values(row)
      }
    }

    console.log(`Seeded entity "${e.name}" with ${toInsert.length} records`)
  }
}

// Run if executed directly (ESM-safe)
const _isMain =
  fileURLToPath(import.meta.url) === process.argv[1] || process.argv[1]?.endsWith('seed.ts')

if (_isMain) {
  seed()
    .then(() => {
      console.log('Seeding finished')
      process.exit(0)
    })
    .catch((err) => {
      console.error('Seeding failed:', err)
      process.exit(1)
    })
}

export default seed
