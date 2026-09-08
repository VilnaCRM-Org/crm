---
status: 'complete'
workflowType: 'architecture'
project_name: 'crm'
date: '2026-09-08'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/114'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/114'
  - 'https://github.com/VilnaCRM-Org/crm/pull/230'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/research-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/brief-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/prd-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'docs/access-control.md'
  - 'docs/adr/004-client-side-access-control-layer.md'
  - 'src/lib/access/access-session.ts'
  - 'src/lib/access/session-factory.ts'
  - 'src/lib/access/claims-mapper.ts'
  - 'src/lib/access/permission-catalog.ts'
  - 'src/lib/types/access/session.ts'
  - 'src/services/access/di.ts'
  - 'src/services/access/session-repository.ts'
  - 'src/api/contracts/README.md'
  - 'src/config/runtime/README.md'
  - '.dependency-cruiser.js'
  - 'eslint.config.mjs'
---

# Architecture — Syncing the access layer with the backend's dynamic GraphQL RBAC (issue #114)

BMAD phase 3 (`create-architecture`). Upstream:
[research](research-114-access-rbac-tenant-audit-2026-09-08.md) →
[brief](brief-114-access-rbac-tenant-audit-2026-09-08.md) →
[prd](prd-114-access-rbac-tenant-audit-2026-09-08.md). Downstream:
[epics](epics-114-access-rbac-tenant-audit-2026-09-08.md) →
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md).

## Re-aimed on 2026-09-08

This document was first written against an invented contract shape — `Query.accessSession` plus
`Query.accessCatalogue` returning a role-to-permission catalogue of `resource:action` strings —
because the team's architecture could not be found at the time. It has since been located: the
Miro board "Frontend C4 Architecture VilnaCRM" (`https://miro.com/app/board/uXjVMG64hTs=/`)
carries a diagram titled **"Interactive access control architecture"** and a companion **IAM
Module** diagram, and its model differs on three points that reach into the decisions below:
the permission unit is a **GraphQL mutation**, **roles are runtime data with an in-product admin
UI**, and **denial is data-driven** (empty data hides a control; the root page shows 403 when its
data is empty).

What moved: **D1**, **D2** and **D5** are re-derived or withdrawn, and **D11**, **D12** and
**D13** are new. Every other decision is annotated with whether it survives unchanged or is
amended, rather than silently edited. The evidence and its limits — the reading is from a
2026-06-22 capture that could not be re-verified on 2026-09-08, the board carries stale 2022
Angular/Redux/RxJS material, and the backend implements none of it today — are stated in full in
[the contract proposal](../../../src/api/contracts/access-rbac-proposal.md), which is the
authoritative record of what the board says and what this plan inferred.

## Decision status after the re-aim

| Decision | Status                                                                     |
| -------- | -------------------------------------------------------------------------- |
| D1       | Re-derived — the client asks which mutations it may run                    |
| D2       | **Withdrawn** — role-name mapping is not how the board decides access      |
| D3       | Survives, amended — the two shapes are claims and the allowed-mutation set |
| D4       | Survives unchanged                                                         |
| D5       | Re-derived — reconciliation is against the pinned schema, not a union      |
| D6       | Survives unchanged                                                         |
| D7       | Survives unchanged                                                         |
| D8       | Survives, amended — fail-closed and empty-set now render identically       |
| D9       | Survives, amended — the board shows no tenant element either               |
| D10      | Survives, amended — the flag is renamed and its values change              |
| D11      | New — the permission key is a GraphQL mutation field name                  |
| D12      | New — roles become runtime data; the closed `Role` union is retired        |
| D13      | New — denial is expressed by absent data                                   |

## Fit statement

React 18 + TypeScript + MUI v7 (Emotion) SPA; Zustand for module state, tsyringe DI with
per-area composition roots (issue #109), React Router v6 behind a module-owned route registry
(issue #105), RSBuild, Bun-managed dependencies on Node 24, react-i18next, Apollo mock for
local GraphQL. The access layer already lives in the shared layers `src/lib/access`,
`src/services/access`, `src/hooks`, `src/providers`, `src/components` and `src/routes` —
ADR-004 — and this delta adds files **inside those same layers**. It introduces no new
top-level directory and creates no `src/modules/access`, which the layer law forbids from
being consumed by the modules it serves.

## What does not change

This is the load-bearing constraint of the whole design (PRD NFR-11):

- `useCan(permission)`, `usePrincipal()`, `useTenant()`, `useAccessFlag(flag)`,
  `<RequirePermission permission fallback>` and `meta: { permission }` keep their **exact**
  signatures and semantics.
- The UI keeps a **closed, compile-time set of gate keys**. Dynamic means the _grants_ are
  server data; it does not mean the vocabulary a call site may name becomes `string`, which
  would delete the ESLint gate and the compile-time typo check in one move. What that set
  contains changes: under D11 it is mutation field names rather than `resource:action`
  permissions, and under D12 the `Role` union stops being an authorization input. See D12 for
  the contradiction this creates with the shipped code and the recommendation that resolves it.
- `SessionLoader.build(input): SessionSnapshot | null` stays **synchronous**.
- `src/lib/access/**` stays free of tsyringe, `reflect-metadata`, the container, Apollo and zod.

Everything below is additive behind those five invariants.

## Decisions

### D1 — The client asks which mutations it may run

**Status.** Re-derived on 2026-09-08. The withdrawn version proposed `Query.accessSession` plus
`Query.accessCatalogue` returning a role-to-permission catalogue.

**Decision.** Propose `Query.mutationAccess` — the caller's allowed **mutation** set for the
session — and `Query.mutationAccessFor(mutations:)`, a narrowed batch that can carry a denial
reason. Both are generated into `src/api/generated/graphql.ts` by `make codegen` from the pinned
`GRAPHQL_SCHEMA_VERSION`, and the Apollo result is parsed by a colocated zod schema before it
leaves the repository layer — the rule `src/api/contracts/README.md` already states. The full
shape, its nullability, and what is specified by the board versus inferred by this plan, are in
[the proposal](../../../src/api/contracts/access-rbac-proposal.md).

**Why this and not the catalogue.** The board's `Repository` is labelled "Access permissions or
mutations" and its `MutationAccessGuard [Decorator]` is annotated "show if user has permission
for this mutation". The question the client is designed to ask is therefore per-mutation, and a
role-to-`resource:action` catalogue answers a different question that the client would then have
to translate into mutations anyway — inventing the mapping the server owns.

**Alternatives considered.**

1. _Keep the role-to-permission catalogue and map permissions to mutations client-side._
   Rejected: the mapping is exactly the drift this work exists to remove, and it would be
   maintained in the repository that has the least information about it.
2. _Enrich the JWT with the allowed set._ Zero extra requests and hydration stays synchronous.
   Rejected more firmly than before: a mutation-keyed set is larger than a role list, grows with
   the schema, and still only changes on refresh (OQ-4).
3. _A REST capability endpoint._ Rejected: the review names GraphQL, and the board draws the
   access resolvers inside the same GraphQL API.

> Assumption: two queries rather than one, for the reasons the proposal gives. Collapsing them is
> a schema change and an adapter change, not an architecture change (OQ-14).

### D2 — Withdrawn: server role names no longer map to product roles

**Status.** **Withdrawn** on 2026-09-08. Superseded by D11 and D12.

**What it said.** A reviewed `SERVER_ROLE_MAP` in `src/lib/access/role-mapping.ts` translated
`ROLE_USER` and friends into the client's closed `Role` union, from which `ROLE_PERMISSIONS`
expanded a permission set.

**Why it is withdrawn.** Under the board's model the client never decides access from a role
name: it reads an allowed-mutation set the server computed, and roles are runtime entities
administered in-product. A client-side role map would be a second, competing authorization model
maintained where it can only go stale — the same class of defect as the catalogue it replaced.

**What survives it.** Nothing in the decision, but the shipped code it describes is not deleted
by this plan. Story 2.3 has already landed the map, and it stays in service as part of the
**claim path** — the default, flag-off behaviour — until the server-sourced path is enabled
everywhere. D12 governs what happens to it after that.

### D3 — One adapter, two shapes, selected at runtime

**Status.** Survives, amended on 2026-09-08 — the structure is unchanged; the second shape is now
the allowed-mutation set rather than the catalogue, and the file is renamed accordingly.

**Decision.** Add `src/lib/access/access-source-loader.ts`, a `SessionLoader` that:

```text
build(input) →
  if source flag is 'claims'          → sessionFactory.build(input)
  else if accessCache.has(sid(input)) → principal from the cached allowed-mutation set
  else                                → sessionFactory.build(input)   (degraded, audited)
```

It is installed with the existing seam, `accessSession.useLoader(catalogueSessionLoader)`, and
its injectable face replaces the binding behind `ACCESS_TOKENS.SessionRepository` so the DI
path and the render path stay identical. No call site changes. No `if` in a component.

**Alternatives considered.** _Replace `SessionFactory` outright_ — rejected: it makes PR #230's
merge a cutover, deletes the only working path while the backend design is unpublished, and has
no rollback. _Two loaders chosen at build time_ — rejected: it needs a redeploy to roll back,
which is precisely what FR-26 exists to avoid.

### D4 — Async fetch, synchronous read: a cache between them

**Status.** Survives unchanged on 2026-09-08 in structure and rationale; only the names of the
fetched thing and its two files change with D1. This is also where the board's
`checkPermissionRequest [Pipe dispatcher]` / `checkPermissionResponse [Pipe watcher]` pair lands:
the dispatcher is the post-commit fetch, the watcher is the existing `useSyncExternalStore`
subscription. `Pipe (RXjs)` and `State [Redux]` are read as the shape of that intent, not as a
direction to adopt RxJS or Redux — this repository has neither, and the frames carrying those
labels are dated 2022.

**Decision.** The allowed-mutation set is fetched by
`src/services/access/mutation-access-repository.ts` (`@injectable()`, Apollo + zod, DI layer)
and written into `src/lib/access/access-cache.ts` (container-free, no dependencies). The
loader only ever **reads** the cache, so `build` stays synchronous and first paint never awaits
a request. When a fetch resolves, the repository calls `accessSession.resync()`, which rebuilds
the snapshot and notifies `useSyncExternalStore` subscribers — the same mechanism a token change
already uses.

Ordering on a cold session, in one sentence per step:

1. `ProtectedRoute` syncs at module load; the cache is empty; the claim-shape principal is
   published and the page paints (Lighthouse path unchanged).
2. The access fetch is kicked off **after** the first commit, from the access provider.
3. On success the cache is filled and `resync()` republishes; on failure FR-21 applies.

**Alternatives considered.** _Make `SessionLoader.build` async_ — rejected: it forces every gate
into a loading state, turns the seeded-token Lighthouse path into an awaited round trip, and
would put a `Promise` on the paint path the two-layer split exists to protect. _Suspense on the
access read_ — same objection, plus it would suspend the whole gated subtree.

> Assumption: a _visible_ permission change between the first paint and the set's arrival
> is acceptable, because the claim shape is a subset (`viewer`-ish) and the change can only
> **add** affordances, never remove one the user already used. If the backend can shrink a
> grant mid-session, this needs revisiting (OQ-5).

### D5 — Reconciliation is against the pinned schema, not against a client union

**Status.** Re-derived on 2026-09-08. The withdrawn version intersected server-granted
`resource:action` ids with the client's `Permission` union and pinned a catalogue snapshot in the
repository to check the other direction.

**Decision.** A gate key is a mutation field name (D11), so the two directions are checked against
two different authorities:

- **Server key the UI does not gate on** → ignored, and recorded once per session as
  `access_unknown_mutation`. There is no affordance to gate, so there is no decision to make;
  auditing it is how the drift becomes visible. Unchanged in substance from the withdrawn D5.
- **UI key the schema does not declare** → a **build-time failure**. crm already pins
  user-service's GraphQL schema (`GRAPHQL_SCHEMA_VERSION`) and already generates from it, so a
  parity test can assert that every mutation name the UI gates on exists as a mutation field in
  the pinned schema. At runtime such a key is simply absent from the set and therefore denies.

**Why this is stronger than what it replaces.** The withdrawn decision needed a _snapshot file_
committed to the repository to check the second direction, which is a hand-maintained copy that
can go stale between pin bumps. The pinned schema is the real artifact, is bumped by an existing
reviewed process, and is already guarded by `make codegen-check` and `make contract-diff`. The
snapshot file is therefore no longer needed and story 2.6 is retargeted onto the schema.

**Honest limit.** The pinned schema proves the mutation _exists_; it cannot prove the backend
would ever _grant_ it, and it says nothing about object-level scope (OQ-15). A gate on a mutation
that no role can be granted is still discoverable only against `grantableMutations` at runtime.

### D6 — Cache key is `sid`; invalidation is explicit

**Status.** Survives unchanged on 2026-09-08. It keys on the session, not on the shape of what is
cached, so the re-aim does not reach it.

**Decision.** The key is the token's `sid` claim, which user-service already issues
(`AccessTokenPassportFactory`). `ClaimsMapper` gains `sid` (and `subject` — see D7). The cache
is cleared on `refreshTokenUser`, on `accessSession.end()` (logout), on a successful tenant
switch, and when the response's `version` differs from the cached one. Entries are
per-`sid`, so a second login never reads the first session's grants.

**Alternatives considered.** _Key by token string_ — rejected: a refresh rotates the token but
not necessarily the session, so it would re-fetch needlessly and still not survive a rotation
boundary correctly. _TTL only_ — rejected: a TTL cannot express "this session ended".

### D7 — Read both `subject` and `sub`

**Status.** Survives unchanged on 2026-09-08. It is a claim-reading fix and is independent of the
contract shape.

**Decision.** `ClaimsMapper` reads `subject` (what user-service issues) with `sub` as a
fallback (what the shipped mapper reads, and the JWT registered claim name). Both narrow to the
same `SessionClaims.sub` field, so nothing downstream changes. This is the smallest correct fix
for research mismatch 2 and is independent of everything else in this document.

### D8 — Fail closed, and say why

**Status.** Survives, amended on 2026-09-08. The rule is unchanged; what changes is that under
D13 a failure and a legitimately empty grant set now render **identically**, so the audit trail
becomes the only place the two are distinguishable.

**Decision.** Any degraded access path — network failure, zod violation, timeout, unknown
`version` — allows no mutation and emits `access_source_unavailable` with a `cause` in the
metadata. It never reuses a previously cached grant set from a different session, and never falls
back to "allow".

`AuditEventType` gains two members: `access_source_unavailable` and `access_unknown_mutation`.
They are audit events, not errors: the sink stays pluggable and container-free, and a throwing
sink still cannot break a user flow.

**What is deliberately not distinguished in the UI.** An empty `allowedMutations` from a healthy
server is a real answer and must render as "you may change nothing" (D13). A failed read renders
the same way, because rendering an outage differently would tell an attacker which of the two
they are looking at and would give an honest user a control that cannot work. The `cause` in the
audit event is how support tells them apart.

### D9 — Tenancy is deferred, not designed away

**Status.** Survives, amended on 2026-09-08 — and the board strengthens it: neither of the two
access-control diagrams carries a tenant element, so the deferral now rests on two independent
observations rather than one.

**Decision.** `useTenant()` and `AccessCore.switchTenant` are unchanged. The single `tenant` field
of the proposed contract is specified but optional; until the backend declares tenants, the
claim-derived membership list (and its synthetic `default` tenant) remains the source. Any
tenant-switcher **UI** stays behind the `tenant-switcher` access flag.

**Rationale.** Designing a tenancy model against a backend that has no tenant concept would
produce a contract nobody can implement and a client model that must be rewritten when the real
one lands. Deferring behind a flag costs nothing and keeps `switchTenant`'s membership check and
audit event exercised.

### D10 — The rollout flag is a runtime flag, not an access flag

**Status.** Survives, amended on 2026-09-08 — the reasoning is untouched; the flag is renamed
from `accessCatalogueSource` to `accessSource` and its "on" value now means "use the
allowed-mutation set" rather than "use the catalogue".

**Decision.** `accessSource` is a deployment-level runtime flag (issue #145): declared
in the `FeatureFlag` union of `@/config/runtime`, in `FEATURE_FLAG_DEFAULTS`, in
`app-config-schema.ts`, and in the committed block in `public/index.html` — the four places
`tests/unit/tooling/runtime-config-contract.test.ts` pins. It ships default-off (`claims`).

**Rationale.** It describes the deployment, not the principal, so it belongs to `useFeatureFlag`
and not `useAccessFlag`. `docs/access-control.md` forbids the two catalogues from sharing a
name, and this is exactly the case that rule exists for. Being a runtime flag also means the
rollback is a container restart, not a redeploy.

> Assumption: a boolean-shaped flag whose `true` means "use the server-sourced set" is used,
> because the issue-#145 schema validates flags as booleans. A string-valued setting would be a
> schema change; if a third source ever appears, that change is the right time to make it.

### D11 — The permission key is a GraphQL mutation field name

**Status.** New on 2026-09-08.

**Decision.** The unit of authorization the client asks about is the **name of a GraphQL mutation
field**, matching the board's `MutationAccessGuard` annotation "show if user has permission for
this mutation". Gate keys live in one closed, compile-time set as they do today, so the ESLint
free-string gate keeps working; what changes is that the set's members are mutation names
(`createContact`, `deleteRole`) rather than `resource:action` pairs, and that the set is
checkable against the pinned schema (D5).

**Alternatives considered.** _A separate operation id_ — survives a mutation rename, which a
field name does not (OQ-16), but is not discoverable from the pinned schema and so cannot be
checked at build time. _Keep `resource:action` and map to mutations client-side_ — rejected under
D1. This is exactly what OQ-13 asks the backend to settle.

**Honest limit.** A mutation name is a coarse key. It cannot express "may delete **this** row"
or "may write **this** field", which the board's per-entity buttons plainly need and which
user-service expresses today as inline `is_granted(...) and object.getId() == user.getId()`
expressions. OQ-15 carries that gap; nothing in this plan closes it.

### D12 — Roles become runtime data, and the closed `Role` union is retired as an authorization input

**Status.** New on 2026-09-08. This decision exists to confront a direct contradiction rather
than paper over it.

**The contradiction.** The shipped client hardcodes four roles in a closed TypeScript union, and
an ESLint rule forbids naming a role as a free string at a call site. The board specifies a
`Role [Entity]`, a `RoleForm`, and add / edit / delete / list screens — that is, roles created by
administrators at runtime, whose names cannot be known at compile time. Both cannot be true.

**Recommendation.** Retire `Role` as an **authorization input** while keeping the call-site gate:

1. Authorization decisions stop consulting roles at all. `useCan` and its relatives resolve
   against the allowed-mutation set (D1, D11), which the server already computed from whatever
   roles exist. This removes the client's need to know role names to make a decision.
2. `Role` becomes **opaque runtime data** — an id, a name, a description, a set of granted
   mutation names — carried by the principal for display (a profile chip, the IAM screens) and
   never branched on.
3. The ESLint gate is **re-pointed, not deleted**: it keeps banning free strings at call sites,
   but the closed set it enforces is the mutation-key set of D11 rather than the role union.
   A role name never appears at a call site, so there is nothing left for a role-shaped gate to
   protect.
4. `ROLE_PERMISSIONS` and `DEFAULT_ROLE` remain only inside the claim path, which stays as the
   flag-off default. They are deleted with the claim path, not before.

**Alternatives considered.** _Keep the union and reconcile server roles into it_ — this is the
withdrawn D2, and it reintroduces a client-side authorization model. _Widen `Role` to `string`_ —
rejected: it deletes the gate and the typo check without putting anything in their place, and it
would let a call site branch on an administrator-typed role name, which is the fragile pattern
the runtime-role model exists to avoid.

**Cost, stated plainly.** This is a larger change than the rest of the plan and it invalidates
part of a shipped, reviewed story (2.3). It is recommended anyway, because the alternative is
shipping a client that decides access from a role vocabulary the product lets administrators
change.

### D13 — Denial is expressed by absent data

**Status.** New on 2026-09-08.

**Decision.** The client does not compute a verdict and then choose a rendering. It renders what
the data supports:

- a gated control whose mutation is **not** in the allowed set is **not rendered** — absent from
  the accessibility tree, not disabled and not `aria-hidden` (the board: "don't show component,
  if data empty");
- a **root page component** whose data is empty renders **403** (the board, verbatim).

**Why the distinction matters.** A child control that is merely disabled still advertises the
existence of an action the principal may not take, and a route that renders an empty page instead
of a 403 gives no reason for what the user is seeing. The board draws the two cases separately,
and this decision keeps them separate.

**What it changes in the shipped client.** `<RequirePermission>` and `PermissionRoute` already
implement close to this shape — a denied gate renders its fallback and a denied route renders the
403 panel. The amendment is that "denied" is now "the mutation is absent from the set" rather
than "the permission is absent from the principal", and that an unhydrated gate keeps rendering
nothing at all (FR-10, unchanged) — an empty set that has not arrived yet is not the same as an
empty set that has.

## File plan

New files, all inside existing layers.

Paint-safe domain (`src/lib/access/`, no DI, no zod, no Apollo):

- `access-cache.ts` — a `sid`-keyed store for the parsed allowed-mutation set (D6).
- `mutation-access-principal-factory.ts` — set → `Principal` + flags (kept separate from
  `session-factory.ts` so neither file grows past the rust-code-analysis caps).
- `access-source-loader.ts` — the dual-shape `SessionLoader` (D3).
- `role-mapping.ts` — **already shipped** (story 2.3). No longer part of this plan's new work;
  it serves the claim path only and is governed by D12.

Type-only (`src/lib/types/access/`):

- `mutation-access.ts` — `MutationAccessSet`, `MutationKey`, `AccessSource`.
- `role.ts` — the opaque runtime `Role` shape of D12 (id, name, description, granted keys).
- extensions to `audit.ts` (`AuditEventType` gains two members, D8) and `session.ts`
  (`SessionClaims` gains `sid`).

DI layer (`src/services/access/`):

- `mutation-access-repository.ts` — `@injectable()`, Apollo query + zod parse (D1, D4).
- `mutation-access.graphql` — the colocated operation document consumed by `make codegen`.
- `mutation-access-response-schemas.ts` — the zod schemas mirroring the generated shape, with the
  parity test the repo already requires for hand-written schemas.
- `tokens.ts` / `di.ts` — one token and one registration for the repository.

React seam:

- `src/providers/access-provider.tsx` — gains the post-commit catalogue fetch trigger only; no
  API change.

Contract and docs:

- `src/api/contracts/access-rbac-proposal.md` — the FR-14 proposal, with OQ-1…OQ-12 attached to
  the fields they affect.
- `docs/access-control.md` — a new "Where the catalogue comes from" section.
- `docs/adr/005-mutation-scoped-access-source.md` — supersedes the "roles derived from token
  claims" half of ADR-004, and is required by `make check-adr-drift` because this change touches
  `src/config/**` and the dependency map. It must also record D12, since retiring the `Role`
  union as an authorization input reverses a decision ADR-004 states positively.

Modified: `claims-mapper.ts` (D7 + `sid`), `access-session.ts` (`resync()`),
`audit-core.ts` (no change beyond the two new event types), `public/index.html`,
`src/config/runtime/**` (D10).

## Boundary compliance

- `no-access-domain-to-container` / `no-access-domain-to-tsyringe` — the four new
  `src/lib/access/` files import no container, no tsyringe and no zod. The cache is a plain
  module singleton, exactly like `access-state.ts`.
- `no-ui-to-access-services` / `no-ui-to-access-state` — `AccessProvider` triggers the fetch
  through the existing hooks seam and the exempted `use-access*.ts` pair; it never imports
  `access-state.ts` or a service directly.
- `no-access-layer-to-modules` — nothing new reaches into `src/modules/**`.
- `injectable-classes-no-value-imports` (issue #130) — the repository receives its Apollo client
  and its collaborators by `@inject`; the zod schemas are passed **as data**, which the policy
  already permits for `response-schemas` contract modules.
- No `static` members and no free functions in `src/**/*.ts` (issues #89/#100/#180): every new
  unit is an instance method on a class exported as a module singleton or registered in DI.
- Type-only files (issue #88): the new types live under `src/lib/types/access/`, imported with
  `import type`.
- The ESLint free-permission-string gate is **re-pointed, not relaxed** (D12): it keeps erroring
  on a free gate key at a call site, with the mutation-key set as the closed set it enforces. The
  new files sit inside its `src/lib/access/**` / `src/services/access/**` exemption, so the access
  code may name mutation keys while call sites still may not. Re-pointing the gate needs its
  must-fail fixture updated in the same change, or the rule starts passing vacuously.

## Performance design

- Nothing is added to the eager entrypoint. The repository is DI-resolved, so it arrives with
  the container's dynamic `import()`; the Apollo client is already lazy behind the auth chunk.
- The four new `src/lib/access/` files are dependency-free and small; they join the existing
  paint-safe domain rather than adding a chunk.
- The catalogue request is issued **after** first commit, so it competes with nothing on the
  critical path. Measured against `config/performance-budget.json`, the expected raw entrypoint
  delta is zero; the bundle-size workflow's per-chunk diff is the check.
- The seeded-token Lighthouse path is unchanged by construction: with `accessCatalogueSource`
  default-off and no cache entry, the loader returns the claim-shape principal synchronously —
  bit-for-bit today's behaviour.

## Testing design

Every branch below needs an assertion that kills its mutant (`break = 100`):

- `mutation-access-principal-factory` — a granted key is present, a server key the UI does not
  gate on is dropped (and audited once), an empty set yields a principal that allows nothing but
  still reaches the shell, and the principal is sealed.
- `access-cache` — hit, miss, `sid` change, `version` change, explicit clear.
- `access-source-loader` — flag off, flag on with a hit, flag on with a miss (degraded and
  audited), and `null` token.
- `mutation-access-repository` — zod-valid payload, zod-invalid payload, network rejection,
  timeout; each maps to a typed error and a fail-closed session.
- Schema parity (D5) — every UI mutation key exists as a mutation field in the pinned schema, and
  a must-fail fixture proving the check really fires on a key that does not.
- `role-mapping` — already covered by story 2.3; its tests stand unchanged while the claim path
  is the default.
- `claims-mapper` — `subject` present, `sub` present, both present (`subject` wins), neither.
- Integration — the DI graph resolves the repository, the loader is installed, and a full
  hydration through `ProtectedRoute` publishes the catalogue principal.
- E2E / visual / Lighthouse — the mock serves the catalogue (FR-25); baselines unchanged.
- Gate fixtures — `tests/unit/tooling/access-control-gates.test.ts` gains the new files to the
  must-fail fixture set so the boundary rules keep firing on them.

## Rollout and rollback

1. D7 (`subject`/`sid`) — landed. Correct and independent of the contract shape.
2. Role mapping (the withdrawn D2) — landed. It stays in service on the claim path; D12 governs
   its removal, which happens with the claim path and not before.
3. Land D1/D4/D5/D6/D8/D11/D13 with `accessSource` default-off. Nothing changes in production.
4. Enable per environment. Rollback is setting the flag back and restarting the container.
5. Apply D12's step 3 (re-point the ESLint gate) once the set-backed path is the default in every
   environment, and remove the flag, the claim branch, `ROLE_PERMISSIONS` and `DEFAULT_ROLE`
   together — a later, separate change that must not be started before the contract is accepted.

## Open questions

The live set is `OQ-1`, `OQ-2`, `OQ-4`, `OQ-5`, `OQ-6`, `OQ-8` … `OQ-11` and the six the board
raised, `OQ-13` … `OQ-18`; `OQ-3`, `OQ-7` and `OQ-12` are retired. All are listed in
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md). D1, D5, D11 and D12 are the
decisions most likely to change when they are answered — and **OQ-17** is the one that could
invalidate the whole design rather than reshape it, since a set maintained separately from the
server's live `is_granted` expressions would have the client gating on a model the server does
not enforce. Every other decision is written so that changing it is a one-file edit plus a schema
regeneration, not a redesign.
