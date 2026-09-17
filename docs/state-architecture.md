# Where does my state go?

The binding decision is [ADR-008](./adr/008-frontend-state-architecture.md). This page is the
short form a contributor or agent applies while writing code: three categories, one decision
rule, one worked example each, and the gates that fail the wrong choice.

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
`config/di.ts` (ADR-008 lists the after-mutation rules).

React reaches a repository through `useService` and a feature hook; it never imports
`@apollo/client` or the HTTP client and never sees a transport type:

```typescript
// src/modules/contacts/features/contact-list/hooks/use-contact-list.ts
import { useService } from '@/providers/di';
import CONTACTS_TOKENS from '@/modules/contacts/config/tokens';
import useAsyncList from '@/hooks/use-async-list';
import type { AsyncListState } from '@/hooks/types/use-async-list';
import type { Contact, ContactRepository } from '../types/contact-repository';

export default function useContactList(): AsyncListState<Contact> {
  const repository = useService<ContactRepository>(CONTACTS_TOKENS.ContactRepository);
  return useAsyncList(() => repository.list());
}
```

## Client/UI state

**Owner:** a `*Var` class over the reactive var from `src/lib/state/`, exported as a module
singleton, with named actions and no I/O. React subscribes through `useReactiveVar` with a
selector that returns a field or the whole value (a stable reference for an unchanged store):

```typescript
// src/modules/contacts/features/contact-list/stores/contact-filter-var.ts
import ReactiveVarFactory from '@/lib/state/reactive-var-factory';
import type { ReactiveVar } from '@/lib/state/types/reactive-var';
import type { ContactFilter } from '../types/contact-filter';

const CLEARED_FILTER: ContactFilter = { query: '', owner: null };

export class ContactFilterVar {
  private readonly state: ReactiveVar<ContactFilter> =
    new ReactiveVarFactory().create<ContactFilter>(CLEARED_FILTER);

  public reactiveVar(): ReactiveVar<ContactFilter> {
    return this.state;
  }

  public get(): ContactFilter {
    return this.state();
  }

  public setQuery(query: string): void {
    this.state({ ...this.state(), query });
  }

  public reset(): void {
    this.state(CLEARED_FILTER);
  }
}

export default new ContactFilterVar();

// src/modules/contacts/features/contact-list/stores/use-contact-query.ts
import useReactiveVar from '@/lib/state/use-reactive-var';

import contactFilterVar from './contact-filter-var';

export default function useContactQuery(): string {
  return useReactiveVar(contactFilterVar.reactiveVar(), (filter) => filter.query);
}
```

The reference implementation is `src/modules/user/features/auth/stores/` — `auth-var.ts`,
`use-auth-state.ts`, `use-auth-token.ts`.

## Session state

Session state is its own category, not a kind of client/UI state: `AuthStateVar` is built on
the same reactive-var primitive, but the token has a written persistence contract that no other
store carries — it is in memory only, lives as long as the page, is never written to storage or
a cookie, has no refresh, and is cleared by `authActions.logout()` alone. A `401` surfaces as
an `AuthError` on the calling flow. Read it with `useAuthToken()` (re-renders only when the
token changes) or `useAuthState()`. Adding persistence is an architecture change that needs a
new ADR, not a `localStorage` line.

## What fails CI

| You wrote                                             | What fails                            |
| ----------------------------------------------------- | ------------------------------------- |
| `import { create } from 'zustand'`                    | ESLint `clientStateSelectors`         |
| `useSyncExternalStore(...)` outside `src/lib/state/`  | ESLint `clientStateSelectors`         |
| `import { useQuery } from '@apollo/client'` in React  | `no-apollo-client-outside-data-layer` |
| `src/hooks/use-x.ts` importing the HTTP client        | `no-shared-ui-to-http-client`         |
| A feature component importing the HTTP client         | `no-feature-direct-http-client`       |
| `CLAUDE.md` / `AGENTS.md` naming Zustand as the store | `state-architecture-contract.test.ts` |

The ESLint rows fail `make lint-eslint`, the dependency-cruiser rows `make lint-deps`, and the
last row `make test-unit-all`.

Satisfy a failure by moving the code to the layer that owns it — never with `eslint-disable`, a
dependency-cruiser ignore, or by widening a fixture.
