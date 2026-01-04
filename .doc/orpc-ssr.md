---
url: /docs/best-practices/optimize-ssr.md
description: >-
  Optimize SSR performance in Next.js, SvelteKit, and other frameworks by using
  oRPC to make direct server-side API calls, avoiding unnecessary network
  requests.
---

# Optimize Server-Side Rendering (SSR) for Fullstack Frameworks

This guide demonstrates an optimized approach for setting up Server-Side Rendering (SSR) with oRPC in fullstack frameworks like Next.js, Nuxt, and SvelteKit. This method enhances performance by eliminating redundant network calls during the server rendering process.

## The Problem with Standard SSR Data Fetching

In a typical SSR setup within fullstack frameworks, data fetching often involves the server making an HTTP request back to its own API endpoints.

![Standard SSR: Server calls its own API via HTTP.](/images/standard-ssr-diagram.svg)

This pattern works, but it introduces unnecessary overhead: the server needs to make an HTTP request to itself to fetch the data, which can add extra latency and consume resources.

Ideally, during SSR, the server should fetch data by directly invoking the relevant API logic within the same process.

![Optimized SSR: Server calls API logic directly.](/images/optimized-ssr-diagram.svg)

Fortunately, oRPC provides both a [server-side client](/docs/client/server-side) and [client-side client](/docs/client/client-side), so you can leverage the former during SSR and automatically fall back to the latter in the browser.

## Conceptual approach

```ts
// Use this for server-side calls
const orpc = createRouterClient(router)

// Fallback to this for client-side calls
const orpc: RouterClient<typeof router> = createORPCClient(someLink)
```

But how? A naive `typeof window === 'undefined'` check works, but exposes your router logic to the client. We need a hack that ensures server‑only code never reaches the browser.

## Implementation

We'll use `globalThis` to share the server client without bundling it into client code.

::: code-group

```ts [lib/orpc.ts]
import type { RouterClient } from '@orpc/server'
import { RPCLink } from '@orpc/client/fetch'
import { createORPCClient } from '@orpc/client'

declare global {
  var $client: RouterClient<typeof router> | undefined
}

const link = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('RPCLink is not allowed on the server side.')
    }

    return `${window.location.origin}/rpc`
  },
})

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const client: RouterClient<typeof router> = globalThis.$client ?? createORPCClient(link)
```

```ts [lib/orpc.server.ts]
import 'server-only'

import { createRouterClient } from '@orpc/server'

globalThis.$client = createRouterClient(router, {
  /**
   * Provide initial context if needed.
   *
   * Because this client instance is shared across all requests,
   * only include context that's safe to reuse globally.
   * For per-request context, use middleware context or pass a function as the initial context.
   */
  context: async () => ({
    headers: await headers(), // provide headers if initial context required
  }),
})
```

:::

::: details `OpenAPILink` support?
When you use [OpenAPILink](/docs/openapi/client/openapi-link), its `JsonifiedClient` turns native values (like Date or URL) into plain JSON, so your client types no longer match the output of `createRouterClient`. To fix this, oRPC offers `createJsonifiedRouterClient`, which builds a router client that matches the output of OpenAPILink.

::: code-group

```ts [lib/orpc.ts]
import type { RouterClient } from '@orpc/server'
import type { JsonifiedClient } from '@orpc/openapi-client'
import { OpenAPILink } from '@orpc/openapi-client/fetch'
import { createORPCClient } from '@orpc/client'

declare global {
  var $client: JsonifiedClient<RouterClient<typeof router>> | undefined
}

const link = new OpenAPILink(contract, {
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('OpenAPILink is not allowed on the server side.')
    }

    return `${window.location.origin}/api`
  },
})

/**
 * Fallback to client-side client if server-side client is not available.
 */
export const client: JsonifiedClient<RouterClient<typeof router>> =
  globalThis.$client ?? createORPCClient(link)
```

```ts [lib/orpc.server.ts]
import 'server-only'

import { createJsonifiedRouterClient } from '@orpc/openapi'

globalThis.$client = createJsonifiedRouterClient(router, {
  /**
   * Provide initial context if needed.
   *
   * Because this client instance is shared across all requests,
   * only include context that's safe to reuse globally.
   * For per-request context, use middleware context or pass a function as the initial context.
   */
  context: async () => ({
    headers: await headers(), // provide headers if initial context required
  }),
})
```

:::

Finally, ensure `lib/orpc.server.ts` is imported before any other code on the server. In Next.js, add it to both `instrumentation.ts` and `app/layout.tsx`:

::: code-group

```ts [instrumentation.ts]
export async function register() {
  // Conditionally import if facing runtime compatibility issues
  // if (process.env.NEXT_RUNTIME === "nodejs") {
  await import('./lib/orpc.server')
  // }
}
```

```ts [app/layout.tsx]
import '../lib/orpc.server' // for pre-rendering

// Rest of the code
```

:::

Now, importing `client` from `lib/orpc.ts` gives you a server-side client during SSR and a client-side client on the client without leaking your router logic.
