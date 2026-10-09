# Where does my state go?

The binding decision is [ADR-023](./adr/023-zustand-client-state.md), which carries the
server-state and session rules of [ADR-008](./adr/008-frontend-state-architecture.md) forward.
This page is the short form a contributor or agent applies while writing code: three categories,
one decision rule, one worked example each, and the gates that fail the wrong choice.

## The decision rule

1. **Does the backend own the value?** — a contact, a deal, the current user record, anything a
   request can fetch or a mutation can change. → **Server state.**
2. **Otherwise, is it the access token, or something the token implies about the session?** →
   **Session state.**
3. **Otherwise** — an open drawer, a filter, a wizard step, a draft that has not been submitted,
   an optimistic flag — → **Client/UI state.**

A value belongs to exactly one category. A list of contacts is server state even while the
sort order over it is client state; the two live in different places and neither copies the
other.

## Server state

**Owner:** a repository — an `@injectable()` class in the module's `repositories/` folder that
talks to `ApolloClient` (GraphQL) or `HttpsClient` (REST) through DI. **Transport rule:** GraphQL
for what the user-service schema models, REST for what it does not (token exchange, health,
files); the full criterion is in
[`src/api/contracts/README.md`](../src/api/contracts/README.md). **Cache rule:** `cache-first`
by default, identity on `id`, `typePolicies` declared next to the client in the module's
`config/di.ts` (ADR-023 lists the after-mutation rules).

React reaches a repository through `useService` and a feature hook; it never imports
`@apollo/client` or the HTTP client and never sees a transport type:

```typescript
// src/modules/contacts/features/contact-list/hooks/use-contact-list.ts
import { useService } from '@/providers/di';
import CONTACTS_TOKENS from '@/modules/contacts/config/tokens';
import useAsyncList from '@/hooks/use-async-list';
import type { AsyncListState } from '@/hooks/types/use-async-list';
import type {
  Contact,
  ContactRepository,
} from '@/modules/contacts/features/contact-list/types/contact-repository';

export default function useContactList(): AsyncListState<Contact> {
  const repository = useService<ContactRepository>(CONTACTS_TOKENS.ContactRepository);
  return useAsyncList(() => repository.list());
}
```

## Client/UI state

**Owner:** a Zustand store, created with `create<State>()(…)` and no middleware in a
`use-*-store.ts` hook file, with the initial value as its only logic. React reads it through a
selector, so a consumer re-renders only when its slice changes; writers hand it a named patch
type with `setState`:

```typescript
// src/modules/contacts/features/contact-list/stores/use-contact-filter-store.ts
import { create } from 'zustand';

import type { ContactFilter } from '@/modules/contacts/features/contact-list/types/contact-filter';

export const CLEARED_FILTER: ContactFilter = { query: '', owner: null };

const useContactFilterStore = create<ContactFilter>()(() => ({ ...CLEARED_FILTER }));

export default useContactFilterStore;

// src/modules/contacts/features/contact-list/stores/use-contact-query.ts
import type { ContactFilter } from '@/modules/contacts/features/contact-list/types/contact-filter';

import useContactFilterStore from './use-contact-filter-store';

export default function useContactQuery(): string {
  return useContactFilterStore((filter: ContactFilter): string => filter.query);
}
```

A writer passes a patch whose type is named in a type-only file, and `setState` merges it
shallowly:

```typescript
// src/modules/contacts/features/contact-list/stores/contact-filter-actions.ts
import type { ContactFilterPatch } from '@/modules/contacts/features/contact-list/types/contact-filter';

import useContactFilterStore, { CLEARED_FILTER } from './use-contact-filter-store';

export default class ContactFilterActions {
  public setQuery(query: string): void {
    const patch: ContactFilterPatch = { query };
    useContactFilterStore.setState(patch);
  }

  public reset(): void {
    useContactFilterStore.setState(CLEARED_FILTER);
  }
}
```

A selector returns a field or the stable state object, never a fresh object, so Zustand v5
needs no `useShallow`. Middleware is out: `persist`, `devtools` and every other `zustand/*`
subpath are rejected, and `zustand` is imported from its root specifier only.

A behavioural class that needs the store receives it through DI: register the hook by value under
a token typed `StoreApi<State>` (as `AUTH_TOKENS.AuthStore` does) and inject it. It never
value-imports the hook.

Every test that writes a store resets it first. `resetClientStores()` in
`tests/utils/reset-client-stores.ts` writes each store's initial state back; call it in
`beforeEach`, and add a new store to it when you add one. It is deliberately not in a global
setup file, because a setup import would load the store modules before the tests that isolate
them.

The reference implementation is `src/modules/user/features/auth/stores/` — `use-auth-store.ts`,
`use-auth-state.ts`, `use-auth-token.ts` — and `src/lib/connectivity/use-connectivity-store.ts`.

## Session state

Session state is its own category, not a kind of client/UI state: `useAuthStore` is built the
same way as any other store, but the token has a written persistence contract that no other
store carries — it is in memory only, lives as long as the page, is never written to storage or
a cookie, has no refresh, and is cleared by `authActions.logout()` alone. A `401` surfaces as
an `AuthError` on the calling flow. Read it with `useAuthToken()` (re-renders only when the
token changes) or `useAuthState()`. Adding persistence is an architecture change that needs a
new ADR, not a `localStorage` line.

## What fails CI

| You wrote                                            | What fails                            |
| ---------------------------------------------------- | ------------------------------------- |
| `useSyncExternalStore(...)` anywhere in `src/`       | ESLint `clientStateSelectors`         |
| `import { useQuery } from '@apollo/client'` in React | `no-apollo-client-outside-data-layer` |
| `src/hooks/use-x.ts` importing the HTTP client       | `no-shared-ui-to-http-client`         |
| A feature component importing the HTTP client        | `no-feature-direct-http-client`       |
| A gated class importing `use-auth-store`             | `injectable-classes-no-value-imports` |
| `CLAUDE.md` / `AGENTS.md` naming the reactive var    | `state-architecture-contract.test.ts` |

The ESLint rows fail `make lint-eslint`, the dependency-cruiser rows `make lint-deps`, and the
last row `make test-unit-all`.

Satisfy a failure by moving the code to the layer that owns it — never with `eslint-disable`, a
dependency-cruiser ignore, or by widening a fixture.
