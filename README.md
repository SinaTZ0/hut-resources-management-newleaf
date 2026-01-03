This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Database seeding ✅

A simple idempotent seed script is available at `scripts/seed.ts`. It creates four entities (Cisco Switch, Cisco Router, HP Server, Chair) and 2–3 records per entity. The script adheres to the project's Zod schemas:

- `assets` are omitted / set to `null`.
- `metadata` is provided only for technical devices (Cisco Switch, Cisco Router, HP Server).
- Running the script multiple times is safe — it upserts entities and replaces their records.

Prerequisites:

- Ensure `DATABASE_URL` is set (same env var used by the app).
- The script is TypeScript. Run with `ts-node` (recommended):

```bash
# install ts-node if needed
pnpm add -D ts-node

# run the seed (example)
DATABASE_URL="postgres://user:pass@localhost:5432/dbname" pnpm exec ts-node ./scripts/seed.ts
```

Alternative: compile or run via another TypeScript runner if you prefer. If you'd like, I can add a convenience `pnpm` script (e.g. `pnpm run seed`) or make the seed run inside a transaction — let me know which you'd prefer.
