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
- `Permission` and `Role` stay **closed TypeScript unions**. Dynamic means the _grants_ are
  server data; it does not mean the _vocabulary the UI can gate on_ becomes `string`. Widening
  the union to `string` would delete the ESLint gate, the compile-time typo check and the
  exhaustiveness of `ROLE_PERMISSIONS` in one move.
- `SessionLoader.build(input): SessionSnapshot | null` stays **synchronous**.
- `src/lib/access/**` stays free of tsyringe, `reflect-metadata`, the container, Apollo and zod.

Everything below is additive behind those five invariants.

## Decisions

### D1 — The catalogue arrives through a GraphQL query, generated and zod-parsed

**Decision.** Propose `Query.accessSession` (per-principal) and `Query.accessCatalogue`
(deployment-wide role/permission declaration) on user-service. Both are generated into
`src/api/generated/graphql.ts` by `make codegen` from the pinned
`GRAPHQL_SCHEMA_VERSION`, and the Apollo result is parsed by a colocated zod schema before it
leaves the repository layer — the rule `src/api/contracts/README.md` already states.

**Alternatives considered.**

1. _Enrich the JWT with `permissions` / `tenants` / `flags` claims._ Zero extra requests and it
   keeps hydration synchronous — genuinely attractive. Rejected as the primary mechanism
   because a claims-only model is not dynamic: a permission change only takes effect on token
   refresh, the token grows with the catalogue, and the client still cannot discover the set of
   permissions that exist. Kept as the **interim** path (D3) and as a legitimate optimisation
   the backend may prefer (OQ-4).
2. _A REST capability endpoint._ Would work, but the review names GraphQL, the user domain is
   already on GraphQL, and `src/api/contracts/README.md`'s transport rule puts user/account
   graph reads on GraphQL.
3. _Derive permissions client-side from server roles only._ This is what ships today; it is the
   drift the review objects to.

> Assumption: two queries rather than one. `accessSession` is per-principal and short-lived;
> `accessCatalogue` is deployment-wide, cacheable across users, and is what makes the UI-side
> parity check of FR-17 possible. If the backend prefers one query, collapsing them is a schema
> change and an adapter change, not an architecture change (OQ-2).

### D2 — Server role names map to product roles through reviewed data

**Decision.** A single data file, `src/lib/access/role-mapping.ts`, holds
`SERVER_ROLE_MAP: Readonly<Record<string, Role>>` — for example `ROLE_USER → member`,
`ROLE_ADMIN → admin` — plus the rule that any unmapped server role resolves to `DEFAULT_ROLE`
(`viewer`) and emits an audit event naming it. The map is data, not `if`/`else`, so adding a
server role is a one-line reviewed diff and the ESLint free-string gate keeps working.

**Alternatives considered.** _Have the backend emit product role names directly_ — cleaner, and
the preferred end state (OQ-3); the map then shrinks to identity and is deleted. _String
normalisation (`ROLE_X → x`)_ — rejected: it silently invents a client role from any server
string, which is exactly the fail-open direction PR #230 removed from `DEFAULT_ROLE`.

> Assumption: `ROLE_USER → member` is the interim mapping. `member` is the least privileged role
> that still permits ordinary CRM work (`contact:write`, `activity:write`) and stops short of
> `contact:manage-all`, `deal:write`, `tenant:switch` and `admin:manage-users`. `ROLE_SERVICE`
> maps to nothing at all — a service token has no business rendering a browser UI (OQ-12).

### D3 — One adapter, two shapes, selected at runtime

**Decision.** Add `src/lib/access/catalogue-session-loader.ts`, a `SessionLoader` that:

```text
build(input) →
  if source flag is 'claims'            → sessionFactory.build(input)
  else if catalogueCache.has(sid(input)) → principal from the cached catalogue
  else                                   → sessionFactory.build(input)   (degraded, audited)
```

It is installed with the existing seam, `accessSession.useLoader(catalogueSessionLoader)`, and
its injectable face replaces the binding behind `ACCESS_TOKENS.SessionRepository` so the DI
path and the render path stay identical. No call site changes. No `if` in a component.

**Alternatives considered.** _Replace `SessionFactory` outright_ — rejected: it makes PR #230's
merge a cutover, deletes the only working path while the backend design is unpublished, and has
no rollback. _Two loaders chosen at build time_ — rejected: it needs a redeploy to roll back,
which is precisely what FR-26 exists to avoid.

### D4 — Async fetch, synchronous read: a cache between them

**Decision.** The catalogue is fetched by
`src/services/access/access-catalogue-repository.ts` (`@injectable()`, Apollo + zod, DI layer)
and written into `src/lib/access/catalogue-cache.ts` (container-free, no dependencies). The
loader only ever **reads** the cache, so `build` stays synchronous and first paint never awaits
a request. When a fetch resolves, the repository calls `accessSession.resync()`, which rebuilds
the snapshot and notifies `useSyncExternalStore` subscribers — the same mechanism a token change
already uses.

Ordering on a cold session, in one sentence per step:

1. `ProtectedRoute` syncs at module load; the cache is empty; the claim-shape principal is
   published and the page paints (Lighthouse path unchanged).
2. The catalogue fetch is kicked off **after** the first commit, from the access provider.
3. On success the cache is filled and `resync()` republishes; on failure FR-21 applies.

**Alternatives considered.** _Make `SessionLoader.build` async_ — rejected: it forces every gate
into a loading state, turns the seeded-token Lighthouse path into an awaited round trip, and
would put a `Promise` on the paint path the two-layer split exists to protect. _Suspense on the
catalogue_ — same objection, plus it would suspend the whole gated subtree.

> Assumption: a _visible_ permission change between the first paint and the catalogue's arrival
> is acceptable, because the claim shape is a subset (`viewer`-ish) and the change can only
> **add** affordances, never remove one the user already used. If the backend can shrink a
> grant mid-session, this needs revisiting (OQ-5).

### D5 — Reconciliation is an intersection, and the two unknown-id cases differ

**Decision.** Effective permissions = (server-granted ids) ∩ (`Permission` union). Then:

- server id unknown to the UI → dropped, and recorded once per session as
  `access_catalogue_unknown_permission`. There is no affordance to gate, so there is no
  decision to make; auditing it is how the drift becomes visible.
- UI id absent from the server catalogue → the contract parity test **fails the build** when a
  catalogue snapshot is pinned in the repo, and the permission **denies** at runtime otherwise.

**Rationale for the asymmetry.** The first case is the server moving ahead of the client, which
is normal and harmless. The second is the client gating on something the server will never
enforce — either dead code or a false sense of protection. Failing the build is the cheapest
place to learn it; denying is the only safe behaviour once it is already deployed. A warning
was rejected because `quality.eslint_warnings` is `0` and the repo has no warning-tolerant
channel: a warning here would be invisible.

### D6 — Cache key is `sid`; invalidation is explicit

**Decision.** The key is the token's `sid` claim, which user-service already issues
(`AccessTokenPassportFactory`). `ClaimsMapper` gains `sid` (and `subject` — see D7). The cache
is cleared on `refreshTokenUser`, on `accessSession.end()` (logout), on a successful tenant
switch, and when the response's `catalogueVersion` differs from the cached one. Entries are
per-`sid`, so a second login never reads the first session's grants.

**Alternatives considered.** _Key by token string_ — rejected: a refresh rotates the token but
not necessarily the session, so it would re-fetch needlessly and still not survive a rotation
boundary correctly. _TTL only_ — rejected: a TTL cannot express "this session ended".

### D7 — Read both `subject` and `sub`

**Decision.** `ClaimsMapper` reads `subject` (what user-service issues) with `sub` as a
fallback (what the shipped mapper reads, and the JWT registered claim name). Both narrow to the
same `SessionClaims.sub` field, so nothing downstream changes. This is the smallest correct fix
for research mismatch 2 and is independent of everything else in this document.

### D8 — Fail closed, and say why

**Decision.** Any degraded catalogue path — network failure, zod violation, timeout, empty
catalogue, unknown `catalogueVersion` — resolves the principal to `DEFAULT_ROLE` and emits
`access_catalogue_unavailable` with a `cause` in the metadata. It never reuses a previously
cached elevated grant set from a different session, and never falls back to "allow".

`AuditEventType` gains two members: `access_catalogue_unavailable` and
`access_catalogue_unknown_permission`. They are audit events, not errors: the sink stays
pluggable and container-free, and a throwing sink still cannot break a user flow.

### D9 — Tenancy is deferred, not designed away

**Decision.** `useTenant()` and `AccessCore.switchTenant` are unchanged. The `tenants` and
`activeTenant` fields of the proposed contract are specified but optional; until the backend
declares them, the claim-derived membership list (and its synthetic `default` tenant) remains
the source. Any tenant-switcher **UI** stays behind the `tenant-switcher` access flag.

**Rationale.** Designing a tenancy model against a backend that has no tenant concept would
produce a contract nobody can implement and a client model that must be rewritten when the real
one lands. Deferring behind a flag costs nothing and keeps `switchTenant`'s membership check and
audit event exercised.

### D10 — The rollout flag is a runtime flag, not an access flag

**Decision.** `accessCatalogueSource` is a deployment-level runtime flag (issue #145): declared
in the `FeatureFlag` union of `@/config/runtime`, in `FEATURE_FLAG_DEFAULTS`, in
`app-config-schema.ts`, and in the committed block in `public/index.html` — the four places
`tests/unit/tooling/runtime-config-contract.test.ts` pins. It ships default-off (`claims`).

**Rationale.** It describes the deployment, not the principal, so it belongs to `useFeatureFlag`
and not `useAccessFlag`. `docs/access-control.md` forbids the two catalogues from sharing a
name, and this is exactly the case that rule exists for. Being a runtime flag also means the
rollback is a container restart, not a redeploy.

> Assumption: a boolean-shaped flag whose `true` means "use the catalogue" is used, because the
> issue-#145 schema validates flags as booleans. A string-valued setting would be a schema
> change; if a third source ever appears, that change is the right time to make it.

## File plan

New files, all inside existing layers.

Paint-safe domain (`src/lib/access/`, no DI, no zod, no Apollo):

- `role-mapping.ts` — `SERVER_ROLE_MAP` and the unmapped-role rule (D2).
- `catalogue-cache.ts` — a `sid`-keyed store for the parsed catalogue (D6).
- `catalogue-principal-factory.ts` — catalogue → `Principal` + flags, including the D5
  intersection (kept separate from `session-factory.ts` so neither file grows past the
  rust-code-analysis caps).
- `catalogue-session-loader.ts` — the dual-shape `SessionLoader` (D3).

Type-only (`src/lib/types/access/`):

- `catalogue.ts` — `AccessCatalogue`, `AccessRoleGrant`, `CatalogueSource`.
- extensions to `audit.ts` (`AuditEventType` gains two members, D8) and `session.ts`
  (`SessionClaims` gains `sid`).

DI layer (`src/services/access/`):

- `access-catalogue-repository.ts` — `@injectable()`, Apollo query + zod parse (D1, D4).
- `access-catalogue.graphql` — the colocated operation document consumed by `make codegen`.
- `catalogue-response-schemas.ts` — the zod schemas mirroring the generated shape, with the
  parity test the repo already requires for hand-written schemas.
- `tokens.ts` / `di.ts` — one token and one registration for the repository.

React seam:

- `src/providers/access-provider.tsx` — gains the post-commit catalogue fetch trigger only; no
  API change.

Contract and docs:

- `src/api/contracts/access-rbac-proposal.md` — the FR-14 proposal, with OQ-1…OQ-12 attached to
  the fields they affect.
- `docs/access-control.md` — a new "Where the catalogue comes from" section.
- `docs/adr/005-server-sourced-access-catalogue.md` — supersedes the "roles derived from token
  claims" half of ADR-004, and is required by `make check-adr-drift` because this change touches
  `src/config/**` and the dependency map.

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
- The ESLint free-permission-string gate is untouched, and the new files sit inside its
  `src/lib/access/**` / `src/services/access/**` exemption, so the catalogue code may name
  permission ids while call sites still may not.

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

- `role-mapping` — each mapped role, an unmapped role (falls back to `viewer` **and** audits),
  an empty role list, a role list containing both a mapped and an unmapped entry.
- `catalogue-principal-factory` — intersection keeps a shared id, drops a server-only id (and
  audits once), denies a UI-only id, and seals the principal.
- `catalogue-cache` — hit, miss, `sid` change, `catalogueVersion` change, explicit clear.
- `catalogue-session-loader` — flag off, flag on with a hit, flag on with a miss (degraded and
  audited), and `null` token.
- `access-catalogue-repository` — zod-valid payload, zod-invalid payload, network rejection,
  timeout; each maps to a typed error and a fail-closed session.
- `claims-mapper` — `subject` present, `sub` present, both present (`subject` wins), neither.
- Integration — the DI graph resolves the repository, the loader is installed, and a full
  hydration through `ProtectedRoute` publishes the catalogue principal.
- E2E / visual / Lighthouse — the mock serves the catalogue (FR-25); baselines unchanged.
- Gate fixtures — `tests/unit/tooling/access-control-gates.test.ts` gains the new files to the
  must-fail fixture set so the boundary rules keep firing on them.

## Rollout and rollback

1. Land D7 (`subject`/`sid`) alone — correct, tiny, independent of the unpublished design.
2. Land D2 (role mapping) behind no flag: it only changes which client role an unrecognised
   server role becomes, and its current answer (`viewer`) is preserved for unmapped names.
3. Land D1/D4/D5/D6/D8 with `accessCatalogueSource` default-off. Nothing changes in production.
4. Enable per environment. Rollback is setting the flag back and restarting the container.
5. Remove the flag and the claim-shape branch only after the backend contract is accepted and
   deployed everywhere — a later, separate change.

## Open questions

`OQ-1` … `OQ-12` are listed in
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md). D1, D2, D5, D6 and D9 are the
decisions most likely to change when they are answered; each is written so that changing it is a
one-file edit plus a schema regeneration, not a redesign.
