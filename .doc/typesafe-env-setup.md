# Typesafe Environment Variables Setup

## Install Required Packages

```bash
npm install zod
```

## Changes Made

### 1. Create lib/environment.ts

```typescript
import { z } from 'zod'

/*-------- Server Environment Variables --------*/
const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.url('DATABASE_URL must be a valid URL').min(1, 'DATABASE_URL is required'),
})

/*-------- Client Environment Variables --------*/
const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1, 'NEXT_PUBLIC_APP_NAME is required'),
})

/*-------- Parse Environment Variables --------*/
const serverEnvironment = serverEnvironmentSchema.parse(process.env)
const clientEnvironment = clientEnvironmentSchema.parse(process.env)

/*-------- Combined Environment --------*/
const environment = {
  ...serverEnvironment,
  ...clientEnvironment,
}

export default environment

/*-------- Type Exports --------*/
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>
export type ClientEnvironment = z.infer<typeof clientEnvironmentSchema>
export type Environment = typeof environment
```

### 2. Create .env.example

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbname"

# Public
NEXT_PUBLIC_APP_NAME="Hut Resources Management"
```

### 3. Modify next.config.ts

```typescript
import type { NextConfig } from 'next'
import './lib/environment'

const nextConfig: NextConfig = {
  /* config options here */
}

export default nextConfig
```
