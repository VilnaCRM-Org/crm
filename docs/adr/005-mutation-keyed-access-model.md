# ADR-005: Move the client to a server-declared, mutation-keyed access model

- Status: Proposed
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-09-08

**Technical Story**: The review of PR #230 asked for the client's access layer to be synced with
the team's dynamic GraphQL RBAC architecture, which keys authorization to GraphQL mutations
rather than to the `resource:action` strings [ADR-004](./004-client-side-access-control-layer.md)
shipped. Tracked in [#114](https://github.com/VilnaCRM-Org/crm/issues/114).

## Context and Problem Statement

ADR-004 shipped a client-side access layer whose unit of authorization is a `resource:action`
string in a closed `Permission` union, expanded from role names by `ROLE_PERMISSIONS`. Both the
vocabulary and the role-to-permission mapping live in this repository.

The team's architecture — the Miro board "Frontend C4 Architecture VilnaCRM", diagram
"Interactive access control architecture" — describes a different model. Its permission unit is a
**GraphQL mutation**: a `MutationAccessGuard` decorator annotated _"show if user has permission
for this mutation"_ gates create / update / delete entity buttons, a
`checkPermissionRequest` dispatcher is paired with a `checkPermissionResponse` watcher over the
access read, roles are runtime entities administered in-product, and denial is expressed by
**absent data** — a child component does not render when its data is empty, and a root page
renders 403 when its data is empty.

Three facts constrain any response to that.

First, the two models disagree about who owns the vocabulary. A `resource:action` catalogue
maintained in the client is a second authorization model kept in the repository with the least
information about it, which is the drift the board's model removes.

Second, **the backend implements none of it today**. user-service's security configuration is
path-based with two roles, the JWT `roles` claim is hardcoded, and the pinned GraphQL schema
(`GRAPHQL_SCHEMA_VERSION`) declares no access query at all. The full analysis and the proposed
schema are in
[`src/api/contracts/access-rbac-proposal.md`](../../src/api/contracts/access-rbac-proposal.md),
which is a proposal that has not been accepted.

Third, `make codegen-check` gates every pull request on the generated artifacts being fresh
against that pin. Wiring a real transport for a query the pinned schema does not declare would
fail that gate on this and every future pull request.

So the decision is not _which model is right_ — the board's is — but **how much of it can land
now, and against what**.

## Decision Drivers

- The server is the source of truth; the client layer exists for UX and defence in depth. A
  client model the server does not enforce is worse than no client model.
- Nothing may change the behaviour of a shipped render. The `resource:action` catalogue serves
  production traffic and the authenticated shell is on the mobile Lighthouse budget.
- `src/lib/access/**` must stay free of tsyringe, the DI container, Apollo and zod, so the
  authenticated paint path keeps its two-layer split (ADR-004).
- A gate key must be checkable at build time, or the catalogue silently drifts from the contract.
- `make codegen`, its documents glob and `src/api/generated` are off limits while the pinned
  schema declares no access query.
- The repository has no RxJS and no Redux; the board's `Pipe (RXjs)` / `State [Redux]` frames are
  dated 2022 and are read as intent, not as a library mandate.

## Considered Options

1. **Additive mutation-keyed path behind the existing runtime flag** — build the domain, the
   dispatcher seam, the hook and the guard alongside the shipped catalogue; supply the set from
   an interim claims-derived resolver; keep `resource:action` as the live model.
2. **Migrate now** — retire `Permission`, `useCan`, `RequirePermission` and `PermissionRoute`
   onto mutation keys in one change.
3. **Wait for the backend** — accept the proposal first, then build once the resolvers exist.

## Decision Outcome

Chosen option: **"Additive mutation-keyed path behind the existing runtime flag"**, because it
moves the code toward the team's architecture without betting anything on a contract that has not
been accepted, and because every part of it that can be verified today is verified today.

What implements the decision:

- `src/lib/types/access/mutation-access.ts` — the closed `MutationKey` union.
- `src/lib/access/mutation-catalogue.ts` — `MUTATION_KEYS`, the only place a gate key is named,
  and `isKey`. It is seeded exclusively from mutation fields the pinned contract declares, which
  today is `createUser` alone.
- `tests/unit/lib/access/mutation-catalogue-parity.test.ts` — fails the build on a gate key the
  pinned GraphQL contract does not declare as a mutation field. This is the build-time half of
  the model, and it needs no codegen change.
- `Principal.allowedMutations` — populated only by an access source. `SessionFactory` leaves it
  empty, so a deployment that supplies nothing denies every mutation gate.
- `src/lib/access/mutation-access-dispatcher.ts` — the board's `checkPermissionRequest`, as a
  container-free module singleton with a `useResolver` seam mirroring `accessSession.useLoader`
  and `auditCore.useSink`. It republishes the resolved set through `accessState.setSession`, so
  the board's `checkPermissionResponse` watcher is the existing `useSyncExternalStore`
  subscription. The read stays synchronous; only the request is asynchronous.
- `src/lib/access/claims-mutation-resolver.ts` — the interim resolver, deriving the set from the
  token's own `allowedMutations` claim so the path is exercisable end to end today.
- `src/lib/access/mutation-key-filter.ts` — server keys the catalogue does not declare are
  dropped and audited as `access_unknown_mutation`.
- `src/hooks/use-can-mutate.ts` and `src/components/require-mutation/` — the read seam and the
  guard. `RequireMutation` takes no fallback and renders nothing when the key is absent, which is
  the board's "do not show the component when the data is empty" rule stated as code.
- The `accessCatalogueSource` runtime flag (issue #145) keeps its shipped name and governs
  **which** resolver a deployment installs, never whether the gate works.

Two things are explicitly **not** built here.

- **The IAM administration surface** — the roles list, the role form, add / edit / delete role,
  the users list and the user invite screens. The board specifies them and the proposal specifies
  their schema, but they are a separate epic; half-building an administration UI against an
  unaccepted contract would ship screens that cannot be wired.
- **Retiring the `resource:action` catalogue.** It stays until the backend ships the access
  resolvers and the IAM surface exists. Removing it now would delete the only working
  authorization model in exchange for one no server enforces.

## Positive Consequences

- The client's gate vocabulary is now checkable against the real artifact: a mutation key that
  the pinned schema does not declare fails a unit test rather than denying silently at runtime.
- The board's dispatcher/watcher pair exists in the repository's own idiom, so adopting the real
  GraphQL resolver is one `useResolver` call and a repository class, not an architecture change.
- The new path cannot alter a current render: nothing in `src/` consumes it, and
  `allowedMutations` is empty on every session the shipped loader builds.
- `src/lib/access/**` gained no dependency — no tsyringe, no Apollo, no zod — so the
  authenticated paint path is unchanged.
- Failure and an empty grant are the same rendering (nothing) and different audit trails, which
  is the direction a UI gate should fail in.

## Negative Consequences

- **Two authorization models coexist.** Contributors must know which gate to use; the guidance is
  in [`docs/access-control.md`](../access-control.md), and it is a review-gate concern rather
  than a machine-enforced one.
- **The seeded catalogue is one key.** Only `createUser` is provable from in-tree artifacts, so
  the guard is real but has almost nothing to gate. The catalogue grows when the schema pin — and
  the documents generated from it — carry more mutations.
- **The interim resolver reads claims the backend does not issue.** It proves the wiring, not the
  contract; a deployment enabling it today gets an empty set, which denies.
- **A mutation name is a coarse key.** It cannot express "may delete _this_ row", which the
  board's per-entity buttons need and user-service expresses today as inline `is_granted(...)`
  expressions. `Policy` classes remain the client's answer, and the gap is open question OQ-15 of
  the proposal.
- **The board reading is unverified since June 2026.** The proposal says so in its own provenance
  section; if the reading is wrong, this ADR is wrong with it.

## Pros and Cons of the Options

### Option A

Build the mutation-keyed path additively; keep `resource:action` live.

#### Good (Option A)

- No behaviour change and no rollback risk: the new path has no consumer.
- The half of the model that does not need the backend — the closed key set, the schema parity
  check, the dispatcher seam, the guard — lands and is fully tested now.
- Adopting the real contract later is additive again, not a rewrite.

#### Bad (Option A)

- Carries two models, and therefore two conventions, until the backend ships.
- The parity check can only prove a key exists in the contract, never that a role could be
  granted it.

### Option B

Migrate the whole layer onto mutation keys in one change.

#### Good (Option B)

- One model, one convention, no coexistence cost.
- Forces the drift question to be answered rather than deferred.

#### Bad (Option B)

- Deletes a working, reviewed authorization model in exchange for one no server enforces: every
  gate would resolve against an always-empty set, hiding affordances users can legitimately use.
- The route guard, the policies and the audit trail all key off `Permission`, so it is a cutover
  with no rollback short of a revert.
- It would have to invent mutation names the pinned schema does not declare, which is the
  fabrication the parity check exists to prevent.

### Option C

Wait for the backend to accept the proposal before writing any client code.

#### Good (Option C)

- Nothing is built against a shape that may change.

#### Bad (Option C)

- The parts that do not depend on the contract — the closed key set, the parity gate, the
  dispatcher seam, the fail-closed guard — are blocked for no reason, and the review's request to
  move toward the team's architecture goes unanswered.
- It leaves the repository's only recorded architecture (ADR-004) contradicting the team's, with
  nothing written down about the difference.

## Links

- [ADR-004: Client-side access control as a cross-cutting two-layer boundary](./004-client-side-access-control-layer.md)
- [Proposal: a mutation-scoped GraphQL access contract](../../src/api/contracts/access-rbac-proposal.md)
- [Access control reference](../access-control.md)
- [Runtime feature flags](../feature-flags.md)
- [Issue #114: access control, tenancy and audit](https://github.com/VilnaCRM-Org/crm/issues/114)
