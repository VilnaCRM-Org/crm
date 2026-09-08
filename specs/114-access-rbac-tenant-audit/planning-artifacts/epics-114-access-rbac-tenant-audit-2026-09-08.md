---
status: 'complete'
workflowType: 'epics'
project_name: 'crm'
date: '2026-09-08'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/114'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/114'
  - 'https://github.com/VilnaCRM-Org/crm/pull/230'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/research-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/brief-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/prd-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'docs/access-control.md'
  - 'docs/adr/004-client-side-access-control-layer.md'
---

# Epics and stories — Access control and the backend RBAC sync (issue #114)

BMAD phase 3 (`create-epics-stories`). Upstream:
[research](research-114-access-rbac-tenant-audit-2026-09-08.md) →
[brief](brief-114-access-rbac-tenant-audit-2026-09-08.md) →
[prd](prd-114-access-rbac-tenant-audit-2026-09-08.md) →
[architecture](architecture-114-access-rbac-tenant-audit-2026-09-08.md). Downstream:
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md).

## How to read this document

- Epic 1 is **shipped** (PR #230). Its stories are recorded for traceability and are not work.
- Epics 2–5 are the delta driven by the team lead's review on PR #230
  (`5135385113`, 2026-09-07T21:47Z): _"We should sync this implementation with our backend
  architecture of the dynamic graphql RBAC"_.
- Each story is marked **Independent** (dispatchable in parallel) or **Dependent** (with the
  stories it waits on).
- Every acceptance criterion is written to be QA-observable: it names something a test or a
  reviewer can watch happen, not an intention.
- Every story ends with the gates it must satisfy. The repository floors are absolute:
  100% coverage on all four dimensions, mutation `break = 100`, and zero findings from ESLint,
  TypeScript, jscpd, dependency-cruiser, markdownlint and rust-code-analysis. No story may be
  closed by lowering a threshold or by adding a suppression.

## Epic 1: Client-side access layer — RBAC, tenancy, access flags and audit (shipped)

Delivers PRD FR-01 … FR-13. Merged in PR #230; recorded here so the delta cannot regress it.

### Story 1.1: Closed permission and role model with a machine-enforced call-site gate

**Status.** Shipped. **Requirements.** FR-01, FR-12.

`PERMISSIONS`, `ROLES`, `ROLE_PERMISSIONS` and `DEFAULT_ROLE` in
`src/lib/access/permission-catalog.ts`; the `noAdHocAuthorizationSelectors` ESLint set banning
raw permission strings and `principal.roles` / `principal.permissions` membership tests outside
`src/lib/access/**` and `src/services/access/**`; must-fail fixtures in
`tests/unit/tooling/access-control-gates.test.ts`.

### Story 1.2: Principal derivation, sealing and the paint-safe hydration path

**Status.** Shipped. **Requirements.** FR-02, FR-10, FR-11.

`SessionClaimsReader` → `ClaimsMapper` → `SessionFactory` → sealed `AccessSnapshot`;
`accessSession.sync()` at `ProtectedRoute` module load; an unhydrated gate renders nothing, not
a 403; `accessSession.useLoader` and `ACCESS_TOKENS.SessionRepository` as the swap seam.

### Story 1.3: Injectable policy services and the React seam

**Status.** Shipped. **Requirements.** FR-03, FR-04, FR-05, FR-06, FR-07, FR-08.

`PermissionService`, `PolicyEvaluator`, `TenantContextService`, `FeatureFlagService` behind
`ACCESS_TOKENS`; `useCan`, `usePrincipal`, `useTenant`, `useAccessFlag`, `<RequirePermission>`,
`PermissionRoute` and `PermissionBranchBuilder` over `meta.permission`.

### Story 1.4: Audit trail with a pluggable, container-free sink

**Status.** Shipped. **Requirements.** FR-09.

`auditCore.useSink`; events `login`, `logout`, `tenant_switch`, `permission_denied`,
`sensitive_action`; a throwing sink never breaks a user flow.

### Story 1.5: Boundary enforcement and documentation

**Status.** Shipped. **Requirements.** FR-12, FR-13.

Five dependency-cruiser rules (`no-ui-to-access-services`, `no-ui-to-access-state`,
`no-access-layer-to-modules`, `no-access-domain-to-container`, `no-access-domain-to-tsyringe`),
`docs/access-control.md`, and ADR-004.

## Epic 2: Sync the access model with the backend's dynamic GraphQL RBAC contract

**Why.** This epic is the direct answer to the team lead's review. Today the client's roles and
permissions are compile-time constants that no server token can match; this epic makes the
server's model the declared source and gives the backend team a concrete contract to accept,
amend or reject. Delivers FR-14, FR-15, FR-16, FR-17, FR-22.

### Story 2.1: Read `subject` and `sid` from the access token

**User story.** As a support engineer, I want the client to identify a session by the id the
server actually issued, so that a client audit event can be joined to the server's trail.

**Description.** `user-service` issues exactly `subject`, `roles` and `sid`
(`AccessTokenPassportFactory` lines 24-27). `ClaimsMapper` reads `sub`. Extend the mapper to
read `subject` with `sub` as a fallback — both narrow into the existing `SessionClaims.sub`
field so nothing downstream changes — and add `sid` to `SessionClaims`. Architecture D7.

**Acceptance criteria.**

- Given a token whose payload carries `subject`, when a session hydrates, then the principal id
  is that subject and is not a random uuid.
- Given a token carrying only `sub`, when a session hydrates, then behaviour is unchanged from
  today (no regression for the seeded test token).
- Given a token carrying both, when a session hydrates, then `subject` wins and the choice is
  asserted, not incidental.
- Given a token carrying neither, when a session hydrates, then the id is a random opaque uuid
  and no PII is introduced.
- Given a token carrying `sid`, when claims are mapped, then `sid` is present on the claims and
  is a string; a non-string `sid` is dropped, never coerced.

**Files.** `src/lib/access/claims-mapper.ts`, `src/lib/types/access/session.ts`.

**Tests.** `tests/unit/lib/access/claims-mapper.test.ts` — the five cases above, plus a
`session-factory` case proving the id path end to end.

**Dependency.** Independent. This story is correct and useful even if the backend design never
arrives.

**Gates.** Unit coverage 100%; every new branch killed under `break = 100`; ESLint, tsc,
dependency-cruiser, jscpd, metrics clean.

### Story 2.2: Publish the GraphQL access-catalogue contract proposal

**User story.** As the backend team lead, I want a written, versioned contract proposal so that
I can accept, amend or reject the client's assumptions instead of discovering them in code.

**Description.** Add `src/api/contracts/access-rbac-proposal.md`: the proposed
`Query.accessSession` and `Query.accessCatalogue` shapes from PRD FR-14, the field semantics,
nullability, error behaviour, and versioning through `catalogueVersion`. Attach OQ-1 … OQ-12
inline to the fields each affects. The document must state plainly that no such design was found
published in any VilnaCRM-Org repository, and that this is a proposal awaiting review.

**Acceptance criteria.**

- Given the proposal document, when it is opened, then every proposed field carries its
  semantics, its nullability and the open question that governs it.
- Given the proposal, when it is cross-read against this spec, then it contradicts no decision
  in the architecture artifact and links back to it.
- Given `make lint-docs`, when it runs, then link and command checks pass and the document is
  reachable from `src/api/contracts/README.md`.
- Given a reviewer who is not on this project, when they read only this document, then they can
  answer whether the backend can implement it without reading any client source.

**Files.** `src/api/contracts/access-rbac-proposal.md` (new),
`src/api/contracts/README.md` (one link).

**Tests.** `make lint-docs` (links, anchors, referenced commands); no runtime code, so no unit
tests. This story deliberately ships documentation only.

**Dependency.** Independent.

**Gates.** markdownlint 0, prettier clean, `make lint-docs` green, no absolute local paths.

### Story 2.3: Map server role names to product roles through reviewed data

**User story.** As a CRM user with a real production token, I want the role the server granted
me to become the product role that matches it, so that I am not silently reduced to `viewer`.

**Description.** Add `src/lib/access/role-mapping.ts` holding
`SERVER_ROLE_MAP: Readonly<Record<string, Role>>` and the unmapped-role rule. `SessionFactory`
maps each claimed role through it before filtering to the `Role` union. An unmapped name
resolves to `DEFAULT_ROLE` and emits an audit event naming it. Architecture D2. Interim mapping:
`ROLE_USER → member`; `ROLE_SERVICE` maps to nothing (a service token has no browser UI).

**Acceptance criteria.**

- Given a token with `roles: ['ROLE_USER']`, when a session hydrates, then the principal holds
  the `member` role and its expanded permissions, and `contact:write` is granted.
- Given a token with `roles: ['ROLE_SERVICE']`, when a session hydrates, then no role is mapped,
  the principal falls back to `viewer`, and an unmapped-role audit event is emitted.
- Given a token with a role name in neither the map nor the `Role` union, when a session
  hydrates, then the principal is `viewer` and the event names the unmapped role verbatim.
- Given a token with `roles: []` or no `roles` claim, when a session hydrates, then behaviour is
  unchanged from today (`viewer`, `app:home` still granted, seeded Lighthouse path intact).
- Given a token with one mapped and one unmapped role, when a session hydrates, then the mapped
  role is honoured and the unmapped one is audited — one is not swallowed by the other.

**Files.** `src/lib/access/role-mapping.ts` (new), `src/lib/access/session-factory.ts`,
`src/lib/types/access/audit.ts` (the unmapped-role event type).

**Tests.** `tests/unit/lib/access/role-mapping.test.ts` and an extension of
`session-factory.test.ts` covering all five criteria; assert the audit event payload, not just
that logging happened.

**Dependency.** Independent of 2.1 and 2.2, but must land before Epic 3 so the catalogue path
and the claim path agree on role vocabulary.

**Gates.** 100% coverage including the empty-roles and mixed-roles branches; mutation-killed
assertions on the fallback; ESLint free-string gate still satisfied (the map lives inside the
exempted `src/lib/access/**`).

### Story 2.4: Generate and zod-validate the access-catalogue query

**User story.** As a developer, I want the catalogue's types generated from the pinned schema
and its payload parsed by zod, so that a backend change cannot reach the UI as an unchecked cast.

**Description.** Add the colocated operation document
`src/services/access/access-catalogue.graphql`, wire it into `make codegen`, and add
`catalogue-response-schemas.ts` mirroring the generated shape with a parity test — the rule
`src/api/contracts/README.md` already imposes on hand-written schemas. Add
`AccessCatalogueRepository` (`@injectable()`) that issues the query and parses the result, with
its token and registration in `src/services/access/{tokens,di}.ts`. Architecture D1, D4.

**Acceptance criteria.**

- Given `make codegen`, when it runs, then the catalogue operation types appear in
  `src/api/generated/graphql.ts` and `make codegen-check` reports the artifacts fresh.
- Given a schema-valid catalogue payload, when the repository resolves, then it returns a parsed
  catalogue and performs no `as` cast anywhere on the path.
- Given a schema-invalid payload, when the repository resolves, then it returns a typed error
  and does not throw into the caller.
- Given a network rejection, when the repository resolves, then it returns a typed error
  carrying the cause.
- Given the parity test, when the generated shape changes incompatibly, then the test fails
  rather than the schema silently accepting less.

**Files.** `src/services/access/access-catalogue.graphql` (new),
`src/services/access/access-catalogue-repository.ts` (new),
`src/services/access/catalogue-response-schemas.ts` (new),
`src/services/access/{tokens,di}.ts`, `codegen.ts`.

**Tests.** `tests/unit/services/access/access-catalogue-repository.test.ts` (valid, invalid,
rejection, timeout); a schema/generated-shape parity test; `tests/unit/services/access/di.test.ts`
extended for the new registration.

**Dependency.** Dependent on 2.2 (the proposal defines the query it generates). Blocked on
OQ-1 and OQ-2 for the final shape; buildable against the proposed shape in the meantime.

**Gates.** 100% coverage of all four repository outcomes; `make codegen-check`;
`injectable-classes-no-value-imports` (collaborators injected, schemas passed as data);
`make contract-diff` on any pin bump.

### Story 2.5: Reconcile server grants against the `Permission` union

**User story.** As a security reviewer, I want the client's effective permissions to be exactly
the intersection of what the server granted and what the UI can gate, so that the client never
invents a grant and never acts on one it cannot render.

**Description.** Add `src/lib/access/catalogue-principal-factory.ts` turning a parsed catalogue
into a sealed `Principal` plus flags, applying the D5 intersection. Kept separate from
`session-factory.ts` so neither file passes the rust-code-analysis caps.

**Acceptance criteria.**

- Given a catalogue granting an id the `Permission` union declares, when the principal is built,
  then that permission is present and `useCan` returns true for it.
- Given a catalogue granting an id the union does not declare, when the principal is built, then
  the id is absent from the principal and an `access_catalogue_unknown_permission` event is
  emitted once for that session, not once per read.
- Given a catalogue granting nothing, when the principal is built, then the principal holds
  `DEFAULT_ROLE`'s permissions and can still reach the shell (`app:home`).
- Given any catalogue, when the principal is built, then the snapshot is sealed — mutating the
  returned `permissions` array throws or has no effect on a later decision.
- Given a catalogue whose tenant list is absent, when the principal is built, then the synthetic
  `default` tenant is used, matching today's claim-shape behaviour.

**Files.** `src/lib/access/catalogue-principal-factory.ts` (new),
`src/lib/types/access/catalogue.ts` (new), `src/lib/types/access/audit.ts`.

**Tests.** `tests/unit/lib/access/catalogue-principal-factory.test.ts` — all five criteria, plus
a once-per-session assertion on the unknown-permission event.

**Dependency.** Dependent on 2.3 (role vocabulary) and 2.4 (the parsed catalogue type).

**Gates.** 100% coverage; every intersection branch mutation-killed; no tsyringe, zod or Apollo
import in the new domain file (`no-access-domain-to-container`, `no-access-domain-to-tsyringe`).

### Story 2.6: Fail the build on a UI permission the server does not declare

**User story.** As a developer, I want a permission the UI gates on but the server never
enforces to fail my build, so that I learn about a dead or unenforceable gate at the cheapest
possible moment.

**Description.** Pin a catalogue snapshot in the repo and add a parity test asserting the
`Permission` union ⊆ the snapshot's declared ids. When no snapshot is pinned, the runtime path
denies such a permission instead. PRD FR-17, architecture D5. A warning is explicitly not an
option: `quality.eslint_warnings` is `0` and the repo has no warning-tolerant channel.

**Acceptance criteria.**

- Given a `Permission` union member absent from the pinned snapshot, when the test suite runs,
  then the parity test fails and names the offending id.
- Given a snapshot id absent from the union, when the test suite runs, then the test passes —
  the asymmetry is deliberate and asserted, not accidental.
- Given no pinned snapshot and a catalogue-sourced session, when `useCan` is asked for a
  union-only permission, then it returns false and a denial is recorded.
- Given the pinned snapshot, when the backend contract is later amended, then updating the
  snapshot is a reviewed one-file diff and the failure message says so.

**Files.** `src/api/contracts/access-catalogue-snapshot.json` (new),
`tests/unit/services/access/catalogue-parity.test.ts` (new).

**Tests.** The parity test itself, plus a must-fail fixture proving it really fails on a missing
id (the repository's standing rule that a gate must be proven to fire).

**Dependency.** Dependent on 2.5.

**Gates.** The parity test rides `make test-unit-all`; markdownlint and prettier on the snapshot
documentation; no suppression may be used to satisfy it.

## Epic 3: Source the principal at runtime without blocking first paint

**Why.** "Dynamic" means the grants arrive at runtime. The paint-safe two-layer split and the
Lighthouse floors mean they cannot arrive _before_ paint. This epic reconciles the two.
Delivers FR-18, FR-19, FR-20, FR-21.

### Story 3.1: A `sid`-keyed catalogue cache in the paint-safe domain

**User story.** As a user, I want my session's catalogue held in memory for the life of that
session, so that navigating between gated pages does not re-fetch my permissions.

**Description.** Add `src/lib/access/catalogue-cache.ts`, a dependency-free module singleton
keyed by the token's `sid` and holding the parsed catalogue plus its `catalogueVersion`.
Architecture D6.

**Acceptance criteria.**

- Given a cached catalogue for a `sid`, when it is read for the same `sid`, then the cached
  value is returned and no fetch is triggered.
- Given a cached catalogue, when it is read for a different `sid`, then a miss is reported — a
  second login never reads the first session's grants.
- Given a cached catalogue, when a payload with a different `catalogueVersion` arrives, then the
  cache is replaced, not merged.
- Given a cleared cache, when it is read, then a miss is reported and nothing stale survives.
- Given the cache module, when its imports are inspected, then it imports nothing at all.

**Files.** `src/lib/access/catalogue-cache.ts` (new).

**Tests.** `tests/unit/lib/access/catalogue-cache.test.ts` — hit, `sid` miss, version replace,
clear, and an import-surface assertion.

**Dependency.** Independent (it stores an opaque value; the catalogue type lands in 2.4).

**Gates.** 100% coverage; `no-access-domain-to-container` / `no-access-domain-to-tsyringe`;
instance methods on a class exported as a module singleton (issues #89/#100).

### Story 3.2: The dual-shape session loader

**User story.** As a release engineer, I want one loader that can build a principal from either
the token claims or the fetched catalogue, so that the sync lands additively and rolls back
without a redeploy.

**Description.** Add `src/lib/access/catalogue-session-loader.ts` implementing `SessionLoader`
with the D3 resolution order: source flag `claims` → `sessionFactory`; otherwise a cache hit →
catalogue principal; otherwise `sessionFactory`, degraded and audited. `build` stays
**synchronous**. Install it with `accessSession.useLoader` and behind
`ACCESS_TOKENS.SessionRepository` so both hydration paths agree.

**Acceptance criteria.**

- Given the source flag set to `claims`, when a session hydrates, then the principal is
  bit-for-bit the one `SessionFactory` produces today.
- Given the flag set to `catalogue` and a cache hit, when a session hydrates, then the principal
  carries the catalogue's grants.
- Given the flag set to `catalogue` and a cache miss, when a session hydrates, then the
  claim-shape principal is published immediately and an `access_catalogue_unavailable` event is
  emitted with a `cause` of `cache-miss`.
- Given a `null` token, when the loader runs, then it returns `null` and no event is emitted.
- Given the loader's signature, when it is type-checked, then `build` returns
  `SessionSnapshot | null` synchronously — no `Promise` appears in the type.

**Files.** `src/lib/access/catalogue-session-loader.ts` (new),
`src/services/access/session-repository.ts`, `src/services/access/di.ts`.

**Tests.** `tests/unit/lib/access/catalogue-session-loader.test.ts` (all five criteria);
an integration test proving the DI-installed loader and the render-path loader are the same
instance.

**Dependency.** Dependent on 2.5, 3.1 and 5.1 (the runtime flag it reads).

**Gates.** 100% coverage of all four resolution branches; mutation-killed on each; the React
seam signatures unchanged (NFR-11) asserted by the untouched existing hook tests.

### Story 3.3: Fetch the catalogue after first commit and re-publish

**User story.** As a user, I want my full permissions to arrive without delaying the page, so
that the app paints as fast as it does today and then becomes more capable, never less.

**Description.** `AccessProvider` triggers the catalogue fetch after the first commit (never
during render, never before paint), fills the cache, and calls `accessSession.resync()` to
rebuild and republish the snapshot through the existing `useSyncExternalStore` path.
Architecture D4.

**Acceptance criteria.**

- Given a cold session, when the gated page first renders, then no catalogue request has been
  issued and the page paints with the claim-shape principal.
- Given the fetch resolving successfully, when it completes, then the cache is filled, the
  snapshot is republished once, and a component reading `useCan` re-renders with the new answer.
- Given the fetch resolving twice for the same `sid`, when it completes, then only one republish
  occurs — no render loop.
- Given a Lighthouse run of `/` with the seeded token, when it completes, then desktop ≥ 95 and
  mobile ≥ 85, unchanged from the pre-change baseline.
- Given the provider, when its imports are inspected, then it reaches the layer only through the
  hooks seam (`no-ui-to-access-services`, `no-ui-to-access-state` both still pass).

**Files.** `src/providers/access-provider.tsx`, `src/lib/access/access-session.ts` (`resync`).

**Tests.** Unit tests for `resync` idempotence; an integration test for the fetch→cache→republish
sequence; `make lighthouse-desktop` and `make lighthouse-mobile` as the budget evidence.

**Dependency.** Dependent on 3.2 and 2.4.

**Gates.** Lighthouse desktop 95 / mobile 85; bundle-size workflow shows no eager-entrypoint
growth; `react-hooks/exhaustive-deps` satisfied by restructuring, never by a suppression.

### Story 3.4: Invalidate the cache on every session boundary

**User story.** As a security reviewer, I want a catalogue to die with its session, so that a
refresh, a logout or a tenant switch can never leave stale grants live.

**Description.** Clear the cache on `refreshTokenUser`, on `accessSession.end()`, on a
successful `switchTenant`, and on a `catalogueVersion` change. Architecture D6.

**Acceptance criteria.**

- Given a live cached catalogue, when the user logs out, then the cache is empty and a
  subsequent hydration reports a miss.
- Given a live cached catalogue, when the token is refreshed and `sid` rotates, then the old
  entry is not read.
- Given a live cached catalogue, when a tenant switch succeeds, then the cache is cleared and
  re-fetched, so tenant-scoped grants cannot leak across tenants.
- Given a tenant switch that is refused, when it completes, then the cache is untouched and the
  existing `permission_denied` event with its `reason` is still emitted.

**Files.** `src/lib/access/catalogue-cache.ts`, `src/lib/access/access-session.ts`,
`src/lib/access/access-core.ts`.

**Tests.** Unit tests per boundary; an integration test covering logout → re-login with a
different principal, asserting no grant survives.

**Dependency.** Dependent on 3.1.

**Gates.** 100% coverage of each invalidation branch; each mutation-killed; no change to the
existing `switchTenant` audit payload (its tests must still pass unmodified).

### Story 3.5: Fail closed on every degraded catalogue path, and say why

**User story.** As a security reviewer, I want every catalogue failure to reduce access rather
than expand it, and to leave a record naming the cause.

**Description.** Network failure, zod violation, timeout, empty catalogue and unknown
`catalogueVersion` all resolve to `DEFAULT_ROLE` and emit `access_catalogue_unavailable` with a
`cause`. Never reuse another session's cached grants. Add the two new `AuditEventType` members.
Architecture D8.

**Acceptance criteria.**

- Given each of the five failure causes, when a session hydrates, then the principal holds only
  `viewer` permissions and one event carrying that exact cause is emitted.
- Given a failure, when the page renders, then the user sees the application shell, not a blank
  page and not an error screen.
- Given a failure after a successful catalogue load in the same session, when it occurs, then
  the previously granted set is **not** retained.
- Given an audit sink that throws, when an event is emitted on a failure path, then the user
  flow completes normally.
- Given a failure, when the audit event is inspected, then it contains no token, no password and
  no email beyond what the session already holds.

**Files.** `src/lib/access/catalogue-session-loader.ts`,
`src/services/access/access-catalogue-repository.ts`, `src/lib/types/access/audit.ts`.

**Tests.** One unit test per cause asserting both the reduced permission set and the event
payload; a throwing-sink test; a no-PII assertion over the emitted metadata.

**Dependency.** Dependent on 3.2.

**Gates.** 100% coverage of all five causes; mutation-killed on each; NFR-09 fail-closed
assertions are the acceptance evidence, not a code comment.

## Epic 4: Align tenancy and the audit trail with the backend

**Why.** The backend has no tenant concept and no client-visible audit correlation. This epic
does the alignable half now and defers the rest explicitly rather than inventing it.
Delivers FR-23, FR-24, and the documentation half of FR-14.

### Story 4.1: Keep tenancy behind the `tenant-switcher` access flag

**User story.** As a product owner, I want tenant switching to stay invisible until the backend
has tenants, so that we do not ship a control that cannot work.

**Description.** No behaviour change to `useTenant` or `switchTenant`. Any tenant-switcher UI
introduced later is gated on the existing `tenant-switcher` access flag, and the catalogue's
`tenants` / `activeTenant` fields are specified as optional in the proposal. Architecture D9.

**Acceptance criteria.**

- Given no tenant claim and no catalogue tenants, when a session hydrates, then the principal
  holds exactly one synthetic `default` membership, as today.
- Given the `tenant-switcher` access flag off, when the app renders, then no tenant control is
  present in the accessibility tree — it is absent, not disabled and not `aria-hidden`.
- Given a catalogue that does declare tenants, when a session hydrates, then those memberships
  replace the synthetic one and `switchTenant` still refuses a non-member id with a
  `permission_denied` event carrying `reason: 'membership'`.
- Given the existing tenant tests, when they run unmodified, then they pass — this story adds no
  regression surface.

**Files.** `src/lib/access/catalogue-principal-factory.ts` (tenant branch),
`src/api/contracts/access-rbac-proposal.md` (the optionality note).

**Tests.** Extend `tests/unit/lib/access/access-core.test.ts` and the catalogue factory tests;
no new component is introduced, so no new a11y surface is created.

**Dependency.** Dependent on 2.5.

**Gates.** Existing tenant tests unchanged and green; 100% coverage of the new tenant branch.

### Story 4.2: Correlate audit events with the request correlation id

**User story.** As a support engineer, I want a client `permission_denied` to be joinable to the
server request that would have refused it, so that an incident is reproducible.

**Description.** Attach the `X-Request-Id` correlation id already produced by the observability
boundary (issue #115) to every audit event's metadata. The access domain must stay
container-free, so it reads the id through the existing container-free
`correlationIdProvider` singleton, not through DI.

**Acceptance criteria.**

- Given any emitted audit event, when it reaches the sink, then its metadata carries a
  correlation id string.
- Given two events emitted in the same request scope, when they are compared, then they carry
  the same id.
- Given the correlation id provider throwing or being unavailable, when an event is emitted,
  then the event is still recorded without the id and the user flow is unaffected.
- Given the access domain, when its imports are inspected, then it still imports no tsyringe, no
  container and no feature module.

**Files.** `src/lib/access/audit-core.ts`, `src/lib/types/access/audit.ts`.

**Tests.** `tests/unit/lib/access/audit-core.test.ts` — id present, id shared, provider failure;
plus a dependency-cruiser fixture assertion that the domain stayed clean.

**Dependency.** Independent.

**Gates.** 100% coverage; `no-access-domain-to-container` / `no-access-domain-to-tsyringe` still
pass; the sink contract (`AuditSink.record`) is unchanged, so existing sink tests still apply.

### Story 4.3: Record the source-of-truth change in the docs and a new ADR

**User story.** As a contributor, I want the documentation to state where roles come from, so
that the next agent does not re-derive the answer from source.

**Description.** Add a "Where the catalogue comes from" section to `docs/access-control.md` and
`docs/adr/005-server-sourced-access-catalogue.md`, which supersedes the "roles derived from
token claims" half of ADR-004 without contradicting the rest of it. `make check-adr-drift`
requires an ADR for this change because it touches `src/config/**` and the dependency map.

**Acceptance criteria.**

- Given ADR-005, when it is read, then it names the decision, the four alternatives from the
  architecture artifact, and both positive and negative consequences.
- Given ADR-004, when it is read after this story, then it is not silently contradicted — the
  superseded portion is named explicitly.
- Given `docs/adr/README.md`, when it is read, then ADR-005 has an index row.
- Given `make lint-docs` and `make check-adr-drift`, when they run, then both pass.

**Files.** `docs/access-control.md`, `docs/adr/005-server-sourced-access-catalogue.md` (new),
`docs/adr/README.md`, `docs/adr/004-client-side-access-control-layer.md` (a superseded-by note).

**Tests.** `make lint-docs`, `make lint-adr`, `make check-adr-drift`.

**Dependency.** Dependent on Epic 3 completing, so the documented behaviour is the shipped one.

**Gates.** markdownlint 0, prettier clean, ADR linter green, no absolute local paths.

## Epic 5: Roll out safely and keep every gate honest

**Why.** The sync must be reversible without a redeploy, must be exercised by the browser-level
suites rather than silently falling back to claims, and must not leave a single gate passing
vacuously. Delivers FR-25 and FR-26.

### Story 5.1: The `accessCatalogueSource` runtime flag

**User story.** As a release engineer, I want to switch the session source and roll it back with
a container restart, so that a bad rollout is a minute of downtime, not a redeploy.

**Description.** Declare the flag in the four places issue #145 requires — the `FeatureFlag`
union of `@/config/runtime`, `FEATURE_FLAG_DEFAULTS`, `app-config-schema.ts`, and the committed
block in `public/index.html` — default-off. It is a **runtime** flag, never an access flag.
Architecture D10.

**Acceptance criteria.**

- Given the flag absent from the runtime config, when the app boots, then it defaults to
  `claims` and behaviour is unchanged.
- Given the flag set on, when the app boots, then the catalogue loader path is selected.
- Given the flag declared in only three of the four required places, when the test suite runs,
  then `tests/unit/tooling/runtime-config-contract.test.ts` fails.
- Given an invalid flag value in the rendered config, when the container starts, then
  `scripts/render-app-config.js` exits non-zero and the container does not serve.
- Given the access-flag catalogue, when it is inspected, then it does **not** contain this name —
  the two catalogues share no flag name.

**Files.** `src/config/runtime/**`, `public/index.html`.

**Tests.** `tests/unit/tooling/runtime-config-contract.test.ts` (extended), a boot-validation
test, and a name-collision assertion across the two flag catalogues.

**Dependency.** Independent.

**Gates.** 100% coverage; the runtime-config contract test is the gate; no schema loosening.

### Story 5.2: Serve the catalogue from the local mocks

**User story.** As a QA engineer, I want the E2E, visual and Lighthouse suites to exercise the
catalogue path, so that a green browser suite is not green because it silently fell back.

**Description.** Add a catalogue resolver to `docker/apollo-server/lib/resolvers.ts` and the
matching Mockoon fixture, so both the dev stack and the test stack answer the query.

**Acceptance criteria.**

- Given the dev stack, when the catalogue query is issued, then the mock returns a schema-valid
  payload.
- Given the test stack with the flag on, when an E2E run hydrates, then the principal carries the
  mock's grants — asserted through observable UI, not through source inspection.
- Given the mock deliberately returning an invalid payload, when a session hydrates, then the
  fail-closed path of story 3.5 is observed in the browser.
- Given `make test-e2e` and `make test-visual`, when they run, then all suites pass and zero
  visual baselines change.

**Files.** `docker/apollo-server/lib/resolvers.ts`, the Mockoon environment fixture,
`docker/apollo-server/lib/types.ts`.

**Tests.** `tests/apollo-server/server.test.ts` extended for the new resolver; `make test-e2e`;
`make test-visual`.

**Dependency.** Dependent on 2.4 and 5.1.

**Gates.** Visual diffs 0; apollo-server suite 100% covered; the console gate stays satisfied
(no unexpected `console.error` / `console.warn` from the new resolver).

### Story 5.3: Guard the seeded-token path and the route inventory

**User story.** As a performance owner, I want the seeded-token Lighthouse path pinned against
the catalogue change, so that a blank gated home page cannot quietly collapse the budget.

**Description.** Extend `tests/unit/routes/seeded-session-route.test.tsx` to cover both source
modes, and add any new route to `tests/e2e/route-coverage.tsv` in both directions.

**Acceptance criteria.**

- Given the seeded token and the flag off, when the gated home route renders, then it renders
  its page on the first commit — not `null`, not a 403.
- Given the seeded token and the flag on with a cache miss, when it renders, then it still
  renders its page on the first commit (the degraded claim-shape path).
- Given `make check-e2e-route-coverage`, when it runs, then every route key has a row and no row
  names a missing spec.
- Given the mobile and desktop Lighthouse runs, when they complete, then the budgets in
  `config/performance-budget.json` are met and no threshold was edited.

**Files.** `tests/unit/routes/seeded-session-route.test.tsx`, `tests/e2e/route-coverage.tsv`
(only if a route is added).

**Tests.** The extended regression guard; `make check-e2e-route-coverage`;
`make lighthouse-desktop`; `make lighthouse-mobile`.

**Dependency.** Dependent on 3.3 and 5.2.

**Gates.** Lighthouse desktop 95 / mobile 85; route-coverage gate green; the gate-ratchet check
must report no weakened threshold.

### Story 5.4: Extend the boundary fixtures and sweep the quality floors

**User story.** As a maintainer, I want every new file covered by the gates that protect the
layer, so that a rule cannot start passing vacuously over the code added by this epic set.

**Description.** Add the new files to the must-fail fixture set in
`tests/unit/tooling/access-control-gates.test.ts`, add a dependency-cruiser rule fixture for any
new rule (the bidirectional completeness assertion has no exemption list), and run the full
quality sweep.

**Acceptance criteria.**

- Given each new `src/lib/access/**` file, when a fixture imports the container or tsyringe from
  it, then the corresponding dependency-cruiser rule fires.
- Given a fixture using a raw permission string outside the layer, when ESLint runs, then it
  errors; given the same inside the layer, then it does not.
- Given `make lint`, `make test-unit-all`, `make test-integration` and `make test-mutation`,
  when they run, then coverage is 100/100/100/100 and the mutation score is 100.00%.
- Given the `gate ratchet` check, when it runs on the pull request, then no guarded threshold is
  weakened.
- Given `make lint-i18n`, when it runs, then any new user-visible string has both `en` and `uk`.

**Files.** `tests/unit/tooling/access-control-gates.test.ts`,
`scripts/ci/depcruise-rule-fixtures.mjs` (only if a rule is added).

**Tests.** The full local suite: `make format`, `make lint`, `make test-unit-all`,
`make test-integration`, `make test-e2e`, `make test-visual`, `make test-mutation`.

**Dependency.** Dependent on every preceding story.

**Gates.** All of them. This story is the epic set's exit criterion.

## Dependency map for parallel dispatch

Independent and dispatchable immediately: **2.1, 2.2, 2.3, 3.1, 4.2, 5.1**.

Then, in order: 2.4 (after 2.2) → 2.5 (after 2.3, 2.4) → 2.6 (after 2.5); 3.2 (after 2.5, 3.1,
5.1) → 3.3 (after 3.2, 2.4) → 3.5 (after 3.2); 3.4 (after 3.1); 4.1 (after 2.5); 5.2 (after 2.4,
5.1) → 5.3 (after 3.3, 5.2); 4.3 (after Epic 3); 5.4 last.

## Traceability

| Requirement             | Stories                   |
| ----------------------- | ------------------------- |
| FR-01 … FR-13 (shipped) | 1.1 – 1.5                 |
| FR-14                   | 2.2, 4.3                  |
| FR-15                   | 2.1, 2.3                  |
| FR-16                   | 2.5                       |
| FR-17                   | 2.5, 2.6                  |
| FR-18                   | 3.2                       |
| FR-19                   | 3.3                       |
| FR-20                   | 2.1, 3.1, 3.4             |
| FR-21                   | 3.5                       |
| FR-22                   | 2.4                       |
| FR-23                   | 4.1                       |
| FR-24                   | 4.2                       |
| FR-25                   | 5.2, 5.3                  |
| FR-26                   | 5.1                       |
| NFR-01 … NFR-14         | every story; swept by 5.4 |
