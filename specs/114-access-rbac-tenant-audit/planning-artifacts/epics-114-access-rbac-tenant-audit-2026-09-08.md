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

## Re-aimed on 2026-09-08

Epics 2 to 5 were written against an invented contract — a role-to-permission catalogue of
`resource:action` strings. The team's architecture has since been located on the Miro board
"Frontend C4 Architecture VilnaCRM" (`https://miro.com/app/board/uXjVMG64hTs=/`) and keys access
on **GraphQL mutations**, makes **roles runtime data with an in-product admin UI**, and expresses
**denial as absent data**.

What moved, and what deliberately did not:

- **Retargeted:** stories **2.4, 2.5, 2.6, 3.2, 3.3** and **5.2**.
- **New:** story **2.7** (retire the closed `Role` union as an authorization input) and story
  **4.4** (scope the IAM administration surface, which this issue does not build).
- **Not renumbered:** the seven delivered stories **2.1, 2.2, 2.3, 3.1, 3.4, 5.1** and **4.2**.
  Each now carries a line saying whether the re-aim leaves it alone or gives it follow-up work.
  **2.2** and **2.3** are the two that need follow-up; the other five are unaffected.
- **Not changed:** Epic 1. It is shipped and the board does not contradict it.

The board reading is unverified since a 2026-06-22 capture and the backend implements none of it
today; both caveats are recorded in full in
[the contract proposal](../../../src/api/contracts/access-rbac-proposal.md).

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

**Re-aim status (2026-09-08).** Delivered; unaffected. It reads claims, not grants.

**Gates.** Unit coverage 100%; every new branch killed under `break = 100`; ESLint, tsc,
dependency-cruiser, jscpd, metrics clean.

### Story 2.2: Publish the GraphQL access-catalogue contract proposal

**User story.** As the backend team lead, I want a written, versioned contract proposal so that
I can accept, amend or reject the client's assumptions instead of discovering them in code.

**Description.** Add `src/api/contracts/access-rbac-proposal.md`: the proposed
`Query.mutationAccess` and `Query.mutationAccessFor` shapes from PRD FR-14, the IAM
administration surface, the field semantics, nullability, error behaviour, and versioning. Attach
the open questions inline to the fields each affects. The document must mark every element as
specified by the board or inferred by this plan, and must state the provenance of the board
reading and its limits.

**Acceptance criteria.**

- Given the proposal document, when it is opened, then every proposed field carries its
  semantics, its nullability and the open question that governs it.
- Given the proposal, when it is cross-read against this spec, then it contradicts no decision
  in the architecture artifact and links back to it.
- Given `make lint-docs`, when it runs, then link and command checks pass and the document is
  reachable from `src/api/contracts/README.md`.
- Given a reviewer who is not on this project, when they read only this document, then they can
  answer whether the backend can implement it without reading any client source.
- Given the document, when its provenance section is read, then it states the capture date, that
  the reading is unverified since then, which board material is stale, and that the backend
  implements none of the design today.

**Files.** `src/api/contracts/access-rbac-proposal.md` (new),
`src/api/contracts/README.md` (one link).

**Tests.** `make lint-docs` (links, anchors, referenced commands); no runtime code, so no unit
tests. This story deliberately ships documentation only.

**Dependency.** Independent.

**Gates.** markdownlint 0, prettier clean, `make lint-docs` green, no absolute local paths.

**Re-aim status (2026-09-08).** Delivered, then **rewritten** — the proposal it shipped described
the invented catalogue. The rewrite is the follow-up and is complete; the remaining follow-up is
external: the board reading needs re-verifying against the live board, and the proposal needs
sending to the team lead as the reply to review `5135385113`.

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

**Re-aim status (2026-09-08).** Delivered, and **needs follow-up**. Architecture D2 — the decision
this story implements — is withdrawn: the board makes roles runtime entities, so a client-side
role map is a second authorization model. Nothing is reverted here. The map keeps serving the
claim path, which is the flag-off default, and story **2.7** governs its retirement. Its tests
stand unchanged in the meantime.

### Story 2.4: Generate and zod-validate the mutation-access query

**Retargeted 2026-09-08.** Was: generate `Query.accessCatalogue` and parse a role-to-permission
catalogue. Now: generate the allowed-mutation set.

**User story.** As a developer, I want the access read's types generated from the pinned schema
and its payload parsed by zod, so that a backend change cannot reach the UI as an unchecked cast.

**Description.** Add the colocated operation document
`src/services/access/mutation-access.graphql`, wire it into `make codegen`, and add
`mutation-access-response-schemas.ts` mirroring the generated shape with a parity test — the rule
`src/api/contracts/README.md` already imposes on hand-written schemas. Add
`MutationAccessRepository` (`@injectable()`) that issues `mutationAccess`, parses the result, and
exposes the narrowed `mutationAccessFor` batch, with its token and registration in
`src/services/access/{tokens,di}.ts`. Architecture D1, D4, D11.

**Acceptance criteria.**

- Given `make codegen`, when it runs, then the access operation types appear in
  `src/api/generated/graphql.ts` and `make codegen-check` reports the artifacts fresh.
- Given a schema-valid payload, when the repository resolves, then it returns a parsed
  allowed-mutation set and performs no `as` cast anywhere on the path.
- Given a payload whose `allowedMutations` is an empty list, when the repository resolves, then
  it returns a **successful** parse of an empty set — not an error — because an empty set is a
  valid answer (PRD FR-21, FR-27).
- Given a schema-invalid payload, when the repository resolves, then it returns a typed error
  and does not throw into the caller.
- Given a network rejection, when the repository resolves, then it returns a typed error
  carrying the cause.
- Given the parity test, when the generated shape changes incompatibly, then the test fails
  rather than the schema silently accepting less.

**Files.** `src/services/access/mutation-access.graphql` (new),
`src/services/access/mutation-access-repository.ts` (new),
`src/services/access/mutation-access-response-schemas.ts` (new),
`src/services/access/{tokens,di}.ts`, `codegen.ts`.

**Tests.** `tests/unit/services/access/mutation-access-repository.test.ts` (valid, empty-but-valid,
invalid, rejection, timeout); a schema/generated-shape parity test;
`tests/unit/services/access/di.test.ts` extended for the new registration.

**Dependency.** Dependent on 2.2 (the proposal defines the query it generates). Blocked on
OQ-13, OQ-14 and OQ-17 for the final shape; buildable against the proposed shape in the meantime.

**Gates.** 100% coverage of all five repository outcomes; `make codegen-check`;
`injectable-classes-no-value-imports` (collaborators injected, schemas passed as data);
`make contract-diff` on any pin bump.

### Story 2.5: Build a principal from the allowed-mutation set

**Retargeted 2026-09-08.** Was: intersect server-granted `resource:action` ids with the
`Permission` union. Now: the set is the grant; there is no client-side union to intersect with.

**User story.** As a security reviewer, I want the client's effective access to be exactly what
the server said the principal may run, so that the client never invents a grant and never acts on
one it cannot render.

**Description.** Add `src/lib/access/mutation-access-principal-factory.ts` turning a parsed
allowed set into a sealed `Principal`, keyed by mutation name (D11). Keys the UI does not gate on
are dropped and audited once per session; keys the UI gates on that are absent from the set
simply deny (D5, D13). Kept separate from `session-factory.ts` so neither file passes the
rust-code-analysis caps.

**Acceptance criteria.**

- Given a set containing a mutation key the UI gates on, when the principal is built, then that
  gate resolves true.
- Given a set containing a key the UI does not gate on, when the principal is built, then the key
  is dropped and an `access_unknown_mutation` event is emitted once for that session, not once per
  read.
- Given an empty set, when the principal is built, then every mutation gate resolves false, the
  principal can still reach the shell, and this is **not** audited as a failure.
- Given any set, when the principal is built, then the snapshot is sealed — mutating the returned
  collection throws or has no effect on a later decision.
- Given a set whose `tenant` is null, when the principal is built, then the synthetic `default`
  tenant is used, matching today's claim-shape behaviour.

**Files.** `src/lib/access/mutation-access-principal-factory.ts` (new),
`src/lib/types/access/mutation-access.ts` (new), `src/lib/types/access/audit.ts`.

**Tests.** `tests/unit/lib/access/mutation-access-principal-factory.test.ts` — all five criteria,
plus a once-per-session assertion on the unknown-mutation event.

**Dependency.** Dependent on 2.4 (the parsed set type) and 2.7 (what a gate key is). No longer
depends on 2.3 — role vocabulary is not consulted on this path.

**Gates.** 100% coverage; every branch mutation-killed; no tsyringe, zod or Apollo import in the
new domain file (`no-access-domain-to-container`, `no-access-domain-to-tsyringe`).

### Story 2.6: Fail the build on a gate key the pinned schema does not declare

**Retargeted 2026-09-08.** Was: pin an access-catalogue snapshot JSON in this repository and
check the `Permission` union against it. Now: check the mutation-key set against the GraphQL
schema this repository already pins — a real artifact instead of a hand-maintained copy.

**User story.** As a developer, I want a gate on a mutation that does not exist to fail my build,
so that I learn about a dead or unenforceable gate at the cheapest possible moment.

**Description.** Add a parity test asserting every UI mutation key is a mutation field in the
pinned schema (`GRAPHQL_SCHEMA_VERSION`, already consumed by `make codegen`). The reverse
direction is deliberately not checked: a schema mutation the UI does not gate on is normal. PRD
FR-17, architecture D5. A warning is explicitly not an option: `quality.eslint_warnings` is `0`
and the repo has no warning-tolerant channel.

**Acceptance criteria.**

- Given a UI mutation key absent from the pinned schema, when the test suite runs, then the
  parity test fails and names the offending key.
- Given a schema mutation field no gate names, when the test suite runs, then the test passes —
  the asymmetry is deliberate and asserted, not accidental.
- Given a set-sourced session and a gate key absent from the allowed set, when the gate is
  evaluated, then it denies and the denial is recorded.
- Given a schema pin bump that removes a gated mutation, when CI runs, then this test fails
  alongside `make contract-diff`, and the failure message names the gate to remove.

**Files.** `tests/unit/services/access/mutation-key-schema-parity.test.ts` (new).

**Tests.** The parity test itself, plus a must-fail fixture proving it really fails on a missing
key (the repository's standing rule that a gate must be proven to fire). No snapshot JSON is
committed; the pinned schema is the authority.

**Dependency.** Dependent on 2.5 and 2.7.

**Gates.** The parity test rides `make test-unit-all`; no suppression may be used to satisfy it.

### Story 2.7: Retire the closed `Role` union as an authorization input

**New 2026-09-08.** This story exists because the board and the shipped client directly
contradict each other, and the contradiction cannot be left implicit.

**User story.** As an administrator, I want to create a role in the product and have it work, so
that adding a role is not a frontend release.

**Description.** The shipped client hardcodes four roles in a closed union and forbids a role as a
free string at a call site; the board specifies a `Role [Entity]`, a `RoleForm` and add / edit /
delete / list screens, so role names are administrator-authored and unknowable at compile time.
Resolve it per architecture D12: authorization stops consulting roles, `Role` becomes opaque
runtime data carried for display, and the ESLint free-string gate is **re-pointed** onto the
mutation-key set rather than deleted or widened to `string`. `ROLE_PERMISSIONS` and `DEFAULT_ROLE`
survive inside the claim path and are deleted with it.

**Acceptance criteria.**

- Given a principal built from the allowed set, when any gate is evaluated, then no role name is
  read on the decision path — asserted, not assumed.
- Given a server role whose name matches nothing the client knows, when the principal is built
  from the set, then access is unaffected, because the decision does not consult the name.
- Given a call site naming a raw mutation key as a string, when ESLint runs, then it errors;
  given the same key used through the closed set, then it does not.
- Given the re-pointed gate, when its must-fail fixture runs, then the rule is proven to fire —
  a re-pointed rule that matches nothing would pass vacuously.
- Given the claim path with the flag off, when a session hydrates, then behaviour is bit-for-bit
  what story 2.3 delivered — this story removes nothing that is still in service.

**Files.** `src/lib/types/access/role.ts` (new), `src/lib/access/permission-catalog.ts`,
`eslint.config.mjs`, `tests/unit/tooling/access-control-gates.test.ts`.

**Tests.** The re-pointed gate's must-fail fixtures; a decision-path test proving no role read;
the existing role-mapping and claim-path tests, unmodified and still green.

**Dependency.** Dependent on 2.4 (the set type). Blocked on OQ-13 and OQ-18 — the key shape and
whether crm owns the role screens both change how far this goes.

**Gates.** ESLint errors 0 with the gate proven to fire; 100% coverage; the shipped claim-path
tests pass without edits, which is the evidence that nothing was reverted.

## Epic 3: Source the principal at runtime without blocking first paint

**Why.** "Dynamic" means the grants arrive at runtime. The paint-safe two-layer split and the
Lighthouse floors mean they cannot arrive _before_ paint. This epic reconciles the two.
Delivers FR-18, FR-19, FR-20, FR-21, FR-27.

### Story 3.1: A `sid`-keyed access cache in the paint-safe domain

**User story.** As a user, I want my session's catalogue held in memory for the life of that
session, so that navigating between gated pages does not re-fetch my permissions.

**Description.** Add `src/lib/access/catalogue-cache.ts`, a dependency-free module singleton
keyed by the token's `sid` and holding the parsed access payload plus its version token.
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

**Re-aim status (2026-09-08).** Delivered; unaffected in substance. It stores an opaque value
keyed by `sid`, so the change of what is stored does not reach it. Two renames follow the rest of
the plan when the retargeted stories land: the file becomes `access-cache.ts` and the version
field it compares becomes `version`.

### Story 3.2: The dual-shape session loader

**Retargeted 2026-09-08.** Was: claims versus the fetched catalogue. Now: claims versus the
fetched allowed-mutation set. The structure of the story is unchanged.

**User story.** As a release engineer, I want one loader that can build a principal from either
the token claims or the fetched allowed set, so that the sync lands additively and rolls back
without a redeploy.

**Description.** Add `src/lib/access/access-source-loader.ts` implementing `SessionLoader` with
the D3 resolution order: source flag `claims` → `sessionFactory`; otherwise a cache hit → the
set-backed principal; otherwise `sessionFactory`, degraded and audited. `build` stays
**synchronous**. Install it with `accessSession.useLoader` and behind
`ACCESS_TOKENS.SessionRepository` so both hydration paths agree.

**Acceptance criteria.**

- Given the source flag set to `claims`, when a session hydrates, then the principal is
  bit-for-bit the one `SessionFactory` produces today.
- Given the flag on and a cache hit, when a session hydrates, then the principal carries the
  allowed set's mutation keys.
- Given the flag on and a cache hit whose set is **empty**, when a session hydrates, then the
  principal allows no mutation and **no** `access_source_unavailable` event is emitted — an empty
  set is an answer, not an outage.
- Given the flag on and a cache miss, when a session hydrates, then the claim-shape principal is
  published immediately and an `access_source_unavailable` event is emitted with a `cause` of
  `cache-miss`.
- Given a `null` token, when the loader runs, then it returns `null` and no event is emitted.
- Given the loader's signature, when it is type-checked, then `build` returns
  `SessionSnapshot | null` synchronously — no `Promise` appears in the type.

**Files.** `src/lib/access/access-source-loader.ts` (new),
`src/services/access/session-repository.ts`, `src/services/access/di.ts`.

**Tests.** `tests/unit/lib/access/access-source-loader.test.ts` (all six criteria); an integration
test proving the DI-installed loader and the render-path loader are the same instance.

**Dependency.** Dependent on 2.5, 3.1 and 5.1 (the runtime flag it reads).

**Gates.** 100% coverage of all resolution branches; mutation-killed on each; the React seam
signatures unchanged (NFR-11) asserted by the untouched existing hook tests.

### Story 3.3: Fetch the allowed set after first commit, re-publish, and render absence

**Retargeted 2026-09-08.** Was: fetch the catalogue and re-publish. Now: the same, plus the
board's two rendering rules (FR-27), which belong here because they are what an arriving —
or empty — set actually does to the screen.

**User story.** As a user, I want my full permissions to arrive without delaying the page, so
that the app paints as fast as it does today and then becomes more capable, never less — and I
want a page I may not use to say so rather than render blank.

**Description.** `AccessProvider` triggers the access fetch after the first commit (never during
render, never before paint), fills the cache, and calls `accessSession.resync()` to rebuild and
republish the snapshot through the existing `useSyncExternalStore` path. This is the board's
`checkPermissionRequest` / `checkPermissionResponse` pair, implemented over the store seam the
repository already has: **no RxJS and no Redux are introduced** — the board frames naming them
are dated 2022 and describe a different stack. Denial rendering follows D13: a gated child
control whose key is absent is not rendered at all, and a root page with empty data renders 403.
Architecture D4, D13.

**Acceptance criteria.**

- Given a cold session, when the gated page first renders, then no access request has been issued
  and the page paints with the claim-shape principal.
- Given the fetch resolving successfully, when it completes, then the cache is filled, the
  snapshot is republished once, and a component reading `useCan` re-renders with the new answer.
- Given the fetch resolving twice for the same `sid`, when it completes, then only one republish
  occurs — no render loop.
- Given a gated child control whose mutation key is absent from the set, when the page renders,
  then the control is absent from the accessibility tree — not disabled and not `aria-hidden`.
- Given a root page component whose data is empty, when it renders, then it renders the 403
  panel, not a blank page.
- Given a Lighthouse run of `/` with the seeded token, when it completes, then desktop ≥ 95 and
  mobile ≥ 85, unchanged from the pre-change baseline.
- Given the provider, when its imports are inspected, then it reaches the layer only through the
  hooks seam (`no-ui-to-access-services`, `no-ui-to-access-state` both still pass), and no RxJS
  or Redux dependency has been added to `package.json`.

**Files.** `src/providers/access-provider.tsx`, `src/lib/access/access-session.ts` (`resync`),
`src/components/access/require-permission.tsx`, `src/routes/permission-branch-builder.tsx`.

**Tests.** Unit tests for `resync` idempotence; a rendering test per FR-27 case asserting absence
through the accessibility tree rather than through a CSS state; an integration test for the
fetch → cache → republish sequence; `make lighthouse-desktop` and `make lighthouse-mobile` as the
budget evidence.

**Dependency.** Dependent on 3.2 and 2.4.

**Gates.** Lighthouse desktop 95 / mobile 85; bundle-size workflow shows no eager-entrypoint
growth; `react-hooks/exhaustive-deps` satisfied by restructuring, never by a suppression;
accessibility checks on the two new rendering rules.

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

**Re-aim status (2026-09-08).** Delivered; unaffected. It clears a cache on session boundaries,
which is independent of what the cache holds. Only the version-field name follows the rest of the
plan.

### Story 3.5: Fail closed on every degraded catalogue path, and say why

**User story.** As a security reviewer, I want every catalogue failure to reduce access rather
than expand it, and to leave a record naming the cause.

**Description.** _Amended 2026-09-08: an empty set is removed from this list — it is a valid
answer, not a failure (FR-21, D8)._ Network failure, zod violation, timeout and an unknown
`version` all allow no mutation and emit `access_source_unavailable` with a `cause`. Never reuse
another session's cached grants. Add the two new `AuditEventType` members. Architecture D8, D13.

**Acceptance criteria.**

- Given each of the four failure causes, when a session hydrates, then the principal allows no
  mutation and one event carrying that exact cause is emitted.
- Given a healthy read returning an empty set, when a session hydrates, then the rendering is the
  same as a failure but **no** event is emitted — the audit trail is the only place the two are
  distinguishable, and that is asserted in both directions.
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

**Gates.** 100% coverage of all four causes plus the empty-set case; mutation-killed on each;
NFR-09 fail-closed assertions are the acceptance evidence, not a code comment.

## Epic 4: Align tenancy and the audit trail with the backend

**Why.** The backend has no tenant concept and no client-visible audit correlation. This epic
does the alignable half now and defers the rest explicitly rather than inventing it.
Delivers FR-23, FR-24, and the documentation half of FR-14. _Amended 2026-09-08: the board adds a
whole IAM administration surface this repository does not have; story 4.4 scopes it rather than
pretending it is covered._

### Story 4.1: Keep tenancy behind the `tenant-switcher` access flag

**User story.** As a product owner, I want tenant switching to stay invisible until the backend
has tenants, so that we do not ship a control that cannot work.

**Description.** No behaviour change to `useTenant` or `switchTenant`. Any tenant-switcher UI
introduced later is gated on the existing `tenant-switcher` access flag, and the contract's single
`tenant` field is specified as optional in the proposal. Neither board diagram carries a tenant
element either, so the deferral now rests on two independent observations. Architecture D9.

**Acceptance criteria.**

- Given no tenant claim and a null `tenant` in the allowed set, when a session hydrates, then the
  principal holds exactly one synthetic `default` membership, as today.
- Given the `tenant-switcher` access flag off, when the app renders, then no tenant control is
  present in the accessibility tree — it is absent, not disabled and not `aria-hidden`.
- Given an allowed set that does declare a tenant, when a session hydrates, then that membership
  replaces the synthetic one and `switchTenant` still refuses a non-member id with a
  `permission_denied` event carrying `reason: 'membership'`.
- Given the existing tenant tests, when they run unmodified, then they pass — this story adds no
  regression surface.

**Files.** `src/lib/access/mutation-access-principal-factory.ts` (tenant branch),
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

**Re-aim status (2026-09-08).** Delivered; unaffected. It attaches a correlation id to every
event regardless of which events exist, so the two renamed event types ride it for free.

### Story 4.3: Record the source-of-truth change in the docs and a new ADR

**User story.** As a contributor, I want the documentation to state where roles come from, so
that the next agent does not re-derive the answer from source.

**Description.** Add a "Where access comes from" section to `docs/access-control.md` and
`docs/adr/005-mutation-scoped-access-source.md`, which supersedes the "roles derived from token
claims" half of ADR-004 without contradicting the rest of it. _Amended 2026-09-08: the ADR must
also record D12 — retiring the `Role` union as an authorization input reverses something ADR-004
states positively, so it cannot be left to the diff._ `make check-adr-drift`
requires an ADR for this change because it touches `src/config/**` and the dependency map.

**Acceptance criteria.**

- Given ADR-005, when it is read, then it names the decision, the alternatives from the
  architecture artifact, both positive and negative consequences, and the D12 reversal.
- Given ADR-004, when it is read after this story, then it is not silently contradicted — the
  superseded portion is named explicitly.
- Given `docs/adr/README.md`, when it is read, then ADR-005 has an index row.
- Given `make lint-docs` and `make check-adr-drift`, when they run, then both pass.

**Files.** `docs/access-control.md`, `docs/adr/005-mutation-scoped-access-source.md` (new),
`docs/adr/README.md`, `docs/adr/004-client-side-access-control-layer.md` (a superseded-by note).

**Tests.** `make lint-docs`, `make lint-adr`, `make check-adr-drift`.

**Dependency.** Dependent on Epic 3 and story 2.7 completing, so the documented behaviour is the
shipped one.

**Gates.** markdownlint 0, prettier clean, ADR linter green, no absolute local paths.

### Story 4.4: Scope the IAM administration surface, and say what it would take

**New 2026-09-08.** The board's IAM Module diagram specifies a product area this repository does
not have, and the honest response is to size it, not to absorb it silently into issue #114.

**User story.** As a product owner, I want the gap between the board's IAM module and this
repository written down, so that "sync with the backend architecture" is not quietly reported as
done when half the architecture is unbuilt.

**Description.** The board specifies `Authorization [component]<route>`, `Users`, `Users list`,
`User invite` with a `UserInviteDTO`, `Roles`, `Role list`, `Add new role`, `Edit Role`,
`Delete Role`, `RoleForm`, and `Role` and `User` entities read through `Get list of Roles` and
`Get list of Users`. crm ships none of them. This story produces a scoping note — not screens:
which routes the module would add, which module it belongs in under the repository's layer law,
what the route registry and route-coverage inventory would need, and which parts of the contract
proposal's IAM half each screen consumes. It explicitly recommends a **separate issue**, because
building an admin area is larger than the access read and would hold the read hostage.

**Acceptance criteria.**

- Given the scoping note, when it is read, then every element named on the board's IAM diagram is
  either mapped to a proposed route and component or listed as deliberately out of scope with a
  reason.
- Given the note, when it is read against the contract proposal, then every screen names the
  query or mutation it would consume, and any element the proposal does not yet cover is raised
  as an open question rather than assumed.
- Given the note, when it is read against `src/routes/README.md`, then the routes it proposes are
  expressed as module-owned route contracts, not as edits to the app shell.
- Given `make lint-docs`, when it runs, then it passes.

**Files.** `specs/114-access-rbac-tenant-audit/planning-artifacts/` (the scoping note),
`src/api/contracts/access-rbac-proposal.md` (any open question it raises).

**Tests.** `make lint-docs`. Documentation only, by design — this story deliberately writes no
code.

**Dependency.** Dependent on 2.2. Blocked on OQ-18, which is the question of whether crm owns
these screens at all.

**Gates.** markdownlint 0, prettier clean, `make lint-docs` green, no absolute local paths.

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

**Re-aim status (2026-09-08).** Delivered; unaffected in substance. The flag's meaning is
unchanged — it selects the session source. Architecture D10 renames it from
`accessCatalogueSource` to `accessSource`; that rename touches the same four declaration sites
and the contract test enforces that all four move together.

### Story 5.2: Serve the allowed set from the local mocks

**Retargeted 2026-09-08.** Was: resolve the catalogue query. Now: resolve the access query — and
add the empty-set case, which the board's rendering rules make a behaviour worth seeing in a
browser rather than an error path.

**User story.** As a QA engineer, I want the E2E, visual and Lighthouse suites to exercise the
set-backed path, so that a green browser suite is not green because it silently fell back.

**Description.** Add a `mutationAccess` resolver to `docker/apollo-server/lib/resolvers.ts` and
the matching Mockoon fixture, so both the dev stack and the test stack answer the query, with
selectable fixtures for a populated set, an empty set and an invalid payload.

**Acceptance criteria.**

- Given the dev stack, when the access query is issued, then the mock returns a schema-valid
  payload.
- Given the test stack with the flag on, when an E2E run hydrates, then the principal carries the
  mock's mutation keys — asserted through observable UI, not through source inspection.
- Given the mock returning an **empty** set, when a gated page renders, then the child controls
  are absent from the accessibility tree and a root page with no data shows 403 (FR-27), observed
  in the browser.
- Given the mock deliberately returning an invalid payload, when a session hydrates, then the
  fail-closed path of story 3.5 is observed in the browser and renders the same as the empty case.
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
modes, and add any new route to `tests/e2e/route-coverage.tsv` in both directions. _Amended
2026-09-08: if story 4.4's IAM routes are ever adopted, they enter the inventory the same way —
this story is the gate that would catch them missing._

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
quality sweep. _Amended 2026-09-08: this now includes proving the **re-pointed** ESLint gate of
story 2.7 still fires — a rule whose closed set changed can start matching nothing and pass
vacuously, which is the exact failure this story exists to prevent._

**Acceptance criteria.**

- Given each new `src/lib/access/**` file, when a fixture imports the container or tsyringe from
  it, then the corresponding dependency-cruiser rule fires.
- Given a fixture using a raw mutation key outside the layer, when ESLint runs, then it errors;
  given the same inside the layer, then it does not.
- Given `make lint`, `make test-unit-all`, `make test-integration` and `make test-mutation`,
  when they run, then coverage is 100/100/100/100 and the mutation score is 100.00%.
- Given the `gate ratchet` check, when it runs on the pull request, then no guarded threshold is
  weakened.
- Given `make lint-i18n`, when it runs, then any new user-visible string has both `en` and `uk`.

**Files.** `tests/unit/tooling/access-control-gates.test.ts`,
`scripts/ci/depcruise-rule-fixtures.mjs` (only if a rule is added).

**Tests.** The full local suite: `make format`, `make lint`, `make test-unit-all`,
`make test-integration`, `make test-e2e`, `make test-visual`, `make test-mutation`.

**Dependency.** Dependent on every preceding story, including 2.7.

**Gates.** All of them. This story is the epic set's exit criterion.

## Dependency map for parallel dispatch

Delivered: **2.1, 2.2, 2.3, 3.1, 3.4, 4.2, 5.1** (2.2 rewritten and 2.3 superseded by 2.7 — see
each story's re-aim status).

Independent and dispatchable immediately: **4.4** (documentation only).

Then, in order: 2.4 (after 2.2) → 2.7 (after 2.4) → 2.5 (after 2.4, 2.7) → 2.6 (after 2.5, 2.7);
3.2 (after 2.5, 3.1, 5.1) → 3.3 (after 3.2, 2.4) → 3.5 (after 3.2); 4.1 (after 2.5); 5.2 (after
2.4, 5.1) → 5.3 (after 3.3, 5.2); 4.3 (after Epic 3 and 2.7); 5.4 last.

2.5 no longer waits on 2.3: role vocabulary is not consulted on the set-backed path.

## Traceability

| Requirement             | Stories                   |
| ----------------------- | ------------------------- |
| FR-01 … FR-13 (shipped) | 1.1 – 1.5                 |
| FR-14                   | 2.2, 4.3, 4.4             |
| FR-15                   | 2.1, 2.3, 2.7             |
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
| FR-27                   | 3.3, 3.5, 5.2             |
| NFR-01 … NFR-14         | every story; swept by 5.4 |
