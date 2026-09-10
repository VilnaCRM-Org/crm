---
status: 'complete'
workflowType: 'prd'
project_name: 'crm'
date: '2026-09-08'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/114'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/114'
  - 'https://github.com/VilnaCRM-Org/crm/pull/230'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/research-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'specs/114-access-rbac-tenant-audit/planning-artifacts/brief-114-access-rbac-tenant-audit-2026-09-08.md'
  - 'docs/access-control.md'
  - 'docs/adr/004-client-side-access-control-layer.md'
  - 'src/api/contracts/README.md'
  - 'src/config/runtime/README.md'
  - 'tests/e2e/route-coverage.tsv'
  - '.claude/react-sdlc.yml'
---

# PRD — Access control and the dynamic GraphQL RBAC sync (issue #114)

BMAD phase 2 (`create-prd`). Upstream:
[research](research-114-access-rbac-tenant-audit-2026-09-08.md) →
[brief](brief-114-access-rbac-tenant-audit-2026-09-08.md). Downstream:
[architecture](architecture-114-access-rbac-tenant-audit-2026-09-08.md) →
[epics](epics-114-access-rbac-tenant-audit-2026-09-08.md) →
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md).

## Re-aimed on 2026-09-08

The delta requirements were first written against an invented contract — a role-to-permission
catalogue of `resource:action` strings. The team's architecture has since been located on the
Miro board "Frontend C4 Architecture VilnaCRM" (`https://miro.com/app/board/uXjVMG64hTs=/`), in
its "Interactive access control architecture" and "IAM Module" diagrams, and it keys access on
**GraphQL mutations**, makes **roles runtime data with an in-product admin UI**, and expresses
**denial as absent data**.

No FR is renumbered. **FR-14, FR-15, FR-16, FR-17, FR-18, FR-20, FR-21, FR-22, FR-25 and FR-26**
have amended text; each amendment is marked inline with what changed. The provenance of the board
reading and its limits — unverified since a 2026-06-22 capture, stale 2022 material on the board,
and a backend that implements none of it today — are recorded in
[the contract proposal](../../../src/api/contracts/access-rbac-proposal.md).

## Product scope

Two bodies of work, one requirement set:

- **Baseline (`FR-01` … `FR-13`)** — the client-side access layer shipped by PR #230. Recorded
  here as requirements so the delta cannot silently regress them and so the FR/NFR review gate
  has a complete matrix. Status: **Shipped**.
- **Delta (`FR-14` … `FR-27`)** — the sync with the backend's dynamic GraphQL RBAC, driven by
  the team lead's review on PR #230. Status: **Planned**.

## Terminology

| Term         | Meaning in this document                                             |
| ------------ | -------------------------------------------------------------------- |
| Mutation key | the name of a GraphQL mutation field — the unit of authorization     |
| Allowed set  | the mutation keys the current principal may execute                  |
| Claim shape  | the interim principal source: JWT claims read by `ClaimsMapper`      |
| Set shape    | the proposed principal source: the allowed set read by GraphQL query |
| Access flag  | a **per-principal** entitlement (`useAccessFlag`, issue #114)        |
| Runtime flag | a **deployment-level** setting (`useFeatureFlag`, issue #145)        |

The two flag catalogues never share a name. `docs/access-control.md` states this and the delta
does not change it.

## Functional requirements — baseline (shipped by PR #230)

- **FR-01** — `Permission` and `Role` are closed TypeScript unions with a static
  role→permission map, and no raw permission string may appear at a call site.
  _(`src/lib/access/permission-catalog.ts`; ESLint `noAdHocAuthorizationSelectors`.)_
- **FR-02** — a sealed `Principal` (`id`, `email`, `roles`, `permissions`, `tenantId`,
  `tenants`) is published after login and on every protected route.
  _(`src/lib/types/access/principal.ts`, `src/lib/access/session-factory.ts`.)_
- **FR-03** — an `@injectable()` `PermissionService` answering `can` / `canAll` / `canAny` is
  registered and resolvable. _(`src/services/access/{permission-service,di,tokens}.ts`.)_
- **FR-04** — object-level rules are named `Policy<TSubject>` classes evaluated through an
  injected `PolicyEvaluator`, never inline conditionals.
  _(`src/lib/access/policies/edit-contact-policy.ts`, `src/services/access/policy-evaluator.ts`.)_
- **FR-05** — `useCan(permission)` and `<RequirePermission permission fallback>` gate UI, and a
  denied affordance is **removed**, not disabled and not `aria-hidden`.
  _(`src/hooks/use-can.ts`, `src/components/require-permission/`.)_
- **FR-06** — a route declares `meta.permission` as route data; the composer groups protected
  routes under one `PermissionRoute` per permission, inside `AppLayout`.
  _(`src/routes/permission-branch-builder.tsx`, `src/routes/permission-route.tsx`.)_
- **FR-07** — `useTenant()` exposes the active tenant and the membership list, and refuses a
  switch to a tenant the principal does not belong to.
  _(`src/hooks/use-tenant.ts`, `src/lib/access/access-core.ts`.)_
- **FR-08** — per-principal access flags resolve from the session with a catalogue default
  fallback. _(`src/lib/access/feature-flag-catalog.ts`, `src/hooks/use-access-flag.ts`.)_
- **FR-09** — an `AuditLogger` over a pluggable, container-free `AuditSink` records `login`,
  `logout`, `tenant_switch`, `permission_denied` and `sensitive_action`.
  _(`src/lib/access/audit-core.ts`, `src/services/access/audit-logger.ts`.)_
- **FR-10** — hydration is synchronous at module load, so a seeded token is authorized before
  the first gated render, and an unhydrated gate renders nothing rather than a false 403.
  _(`src/modules/user/features/auth/components/protected-route/index.tsx`.)_
- **FR-11** — where a session comes from is one swap: `accessSession.useLoader` or
  `ACCESS_TOKENS.SessionRepository`.
  _(`src/lib/access/access-session.ts`, `src/services/access/session-repository.ts`.)_
- **FR-12** — the boundary is machine-enforced by five dependency-cruiser rules and the ESLint
  selector set, each proven live by a must-fail fixture.
  _(`.dependency-cruiser.js`, `tests/unit/tooling/access-control-gates.test.ts`.)_
- **FR-13** — adding a permission, role, policy or access flag is documented, and the layer
  decision is recorded as an ADR. _(`docs/access-control.md`,
  `docs/adr/004-client-side-access-control-layer.md`.)_

> Assumption: FR-01…FR-13 are recorded as **Shipped** rather than re-planned. Re-deriving them
> as stories would invite a rewrite of merged, 100%-covered, 100%-mutation-scored code for no
> product gain.

## Functional requirements — delta (the backend RBAC sync)

Every requirement below traces to the team lead's review on PR #230
(review `5135385113`, 2026-09-07T21:47Z): _"We should sync this implementation with our backend
architecture of the dynamic graphql RBAC"_.

### Contract

**FR-14 — A versioned, mutation-scoped GraphQL access contract exists and is proposed.**
_Amended 2026-09-08: the proposed shape was a role-to-permission catalogue; it is now an
allowed-mutation set plus an IAM administration surface, per the board._
The repository holds a written proposal for user-service naming the query shape, the field
semantics, the nullability, and the error behaviour, and marking every element as specified by
the board or inferred by this plan. The proposal is the reviewable artifact the team lead
responds to; it is not assumed accepted.
The proposed access read (subject to OQ-13, OQ-14, OQ-17):

```text
type MutationAccessSet {
  subject: ID!
  sessionId: ID!
  tenant: ID
  allowedMutations: [String!]!
  version: String!
}

type Query {
  mutationAccess: MutationAccessSet
  mutationAccessFor(mutations: [String!]!): [MutationAccess!]!
}
```

The IAM half — `Role`, its Relay-paginated list, `grantableMutations`, and the role and user
administration mutations — is specified in the proposal and may be accepted, deferred or rejected
separately from the access read.

_Acceptance:_ the contract document is committed, links this PRD, lists its open questions inline
against the fields they affect, and states plainly which of its elements the board specifies and
which this plan inferred.

**FR-15 — Roles are runtime data, and the closed `Role` union is retired as an authorization
input.**
_Amended 2026-09-08: this requirement previously mandated a client-side server-role-to-product-role
mapping table. The board specifies a `Role` entity with an in-product admin UI, which that table
directly contradicts._
Authorization decisions resolve against the allowed set (FR-16) and never against a role name.
`Role` becomes opaque runtime data carried for display only. The shipped mapping table remains in
service on the claim path — the flag-off default — and is removed with that path, not before. The
call-site free-string gate is **re-pointed** onto the mutation-key set, never deleted or widened
to `string`. Architecture D12 records the contradiction, the recommendation and its cost.

**FR-16 — Effective access is exactly the server's allowed set.**
_Amended 2026-09-08: the intersection was against the client's `Permission` union; it is now
against the UI's mutation-key set._
When an allowed set is available, a gate resolves true only if its mutation key is in that set.
The client never invents a grant the server did not make, and never acts on one it cannot render.
An empty set is a valid answer meaning "this principal may change nothing".

**FR-17 — Unknown keys have two different, deliberate outcomes.**
_Amended 2026-09-08: the second case is now checked against the pinned GraphQL schema rather than
against a catalogue snapshot committed to this repository._

- A key the **server** returns and the UI does not gate on is **ignored** at runtime and recorded
  once per session as an `access_unknown_mutation` audit event. Ignoring is correct: the UI has no
  affordance to gate, so there is nothing to decide.
- A key the **UI** gates on that the pinned schema does not declare as a mutation field is a
  **build-time failure** of the schema parity test, and a **runtime deny** regardless. Rationale:
  a gate on a mutation that does not exist is either dead code or an unenforceable gate, and both
  are defects; failing the build is the cheapest place to learn it. The pinned schema is used
  instead of a committed snapshot because it is the real artifact, is bumped by a reviewed
  process, and is already guarded by `make codegen-check` and `make contract-diff`.

> Assumption: build failure is chosen over a warning because `quality.eslint_warnings` is `0`
> and the repository has no warning-tolerant channel; a warning would be invisible.

**FR-18 — One adapter accepts both the claim shape and the set shape.**
_Amended 2026-09-08: the second shape is the allowed set rather than the catalogue._
A `SessionLoader` implementation resolves a principal from a fetched allowed set when one is
cached, and falls back to the shipped `SessionFactory` claim path otherwise. Selection is by
availability plus the runtime flag of FR-26 — never by a compile-time branch — so PR #230 can
merge unchanged and the sync lands additively.

### Hydration, caching and failure

**FR-19 — A set-backed session hydrates without blocking first paint.**
`SessionLoader.build` stays **synchronous**. The allowed set is fetched outside the loader and
written into a cache the loader reads. A cache miss yields the claim-shape principal
immediately; the fetched set re-publishes a new snapshot when it arrives. There is no
`await` between route entry and first paint.

**FR-20 — The access cache is keyed by session id and explicitly invalidated.**
_Amended 2026-09-08: the version token is `MutationAccessSet.version`._
The cache key is the token's `sid` claim (already issued by user-service). It is invalidated on
`refreshTokenUser`, on logout, on tenant switch, and when `version` changes. A cache entry never
outlives its session.

**FR-21 — Every degraded access path fails closed and is observable.**
_Amended 2026-09-08: an **empty** allowed set is no longer a failure — it is a valid answer that
renders identically to one, so the audit trail is the only place the two are distinguishable._
A fetch failure, a schema-invalid payload, a timeout, or an unknown `version` allows no mutation
— never the last-known-good set — and emits an `access_source_unavailable` audit event carrying
the cause. The user sees the shell, not a blank page, and never sees an affordance the degraded
set does not grant.

**FR-22 — The allowed set is validated at the contract boundary, never cast.**
_Amended 2026-09-08: names only._
The query is generated through `make codegen` into `src/api/generated/graphql.ts`; its result is
parsed by a zod schema colocated with the repository, exactly as `src/api/contracts/README.md`
requires. A schema violation is a typed error and a degraded (fail-closed) session, not a crash.

**FR-27 — Denial is expressed by absent data, at two granularities.**
_New on 2026-09-08, from the board's two verbatim annotations._
A gated child control whose mutation key is absent from the allowed set is **not rendered** — it
is absent from the accessibility tree, not disabled and not `aria-hidden`. A **root page**
component whose data is empty renders a **403**. An unhydrated gate still renders nothing at all
(FR-10): a set that has not arrived is not the same as an empty set.

### Tenancy and audit

**FR-23 — Tenancy is deferred behind an access flag, with the claim shape as the interim.**
_Unchanged, and now doubly evidenced: neither board diagram carries a tenant element either._
The backend has no tenant concept (research, section "What user-service actually issues
today"). `useTenant()` and `switchTenant` keep their current behaviour over the claim-derived
membership list; any tenant **UI** stays gated by the `tenant-switcher` access flag until the
the allowed set declares a tenant. The synthetic `default` tenant remains the single membership when
no tenant claim exists.

**FR-24 — Client audit events correlate with the server trail.**
Every audit event carries the `X-Request-Id` correlation id already generated by the
observability boundary (issue #115), so a client-side `permission_denied` can be joined to the
server request that would have refused it. The sink stays pluggable and container-free; a
throwing sink still never breaks a user flow.

### Rollout

**FR-25 — Mocks serve the allowed set for every browser-level suite.**
_Amended 2026-09-08: names only, plus one new case — a mock that returns an **empty** set must be
exercised, because FR-27 makes that a visible rendering rule rather than an error path._
The local Apollo mock (`docker/apollo-server/`) and the Mockoon fixture used by E2E resolve the
access query, so the E2E, visual, mobile and Lighthouse seeded-token paths exercise the set
shape rather than silently falling back to claims. The seeded-token route regression
guard (`tests/unit/routes/seeded-session-route.test.tsx`) is extended to cover the set path and
the empty-set rendering rule of FR-27.

**FR-26 — A runtime flag selects the session source and can roll back without a redeploy.**
A deployment-level runtime flag (issue #145 — `@/config/runtime`, declared in the `FeatureFlag`
union, `FEATURE_FLAG_DEFAULTS`, `app-config-schema.ts` and the committed block in
`public/index.html`) chooses `claims` or the server-sourced set. _Amended 2026-09-08: the flag is
named `accessSource`, not `accessCatalogueSource`._ It ships **default-off** (`claims`), is
enabled per environment, and is removed once the set is the only source. It is a runtime
flag, not an access flag, because it is a property of the deployment and not of the principal.

## Non-functional requirements

Every `quality.*` value below is quoted from `.claude/react-sdlc.yml` and is a **raise-only
floor**. No requirement in this PRD may be satisfied by lowering one, by a suppression
directive, or by narrowing a gate's scope.

- **NFR-01** — unit and integration coverage stay at 100% statements, branches, functions and
  lines.
- **NFR-02** — the Stryker mutation score stays at 100.00% with `break = 100`; every new
  branch, including each failure path, needs a killing assertion.
- **NFR-03** — jscpd clones `0`, ESLint errors `0`, ESLint warnings `0`, TypeScript errors `0`,
  dependency-cruiser violations `0`, markdownlint errors `0`.
- **NFR-04** — `make lint-metrics` reports no hard violation; new logic is split across files
  rather than growing one past the rust-code-analysis caps.
- **NFR-05** — Lighthouse desktop ≥ 95 and mobile ≥ 85 on the audited routes; no access
  request may precede first paint on any route.
- **NFR-06** — the eager entrypoint stays within `config/performance-budget.json`
  (`raw.maxInitialEntrypointBytes` 470 000; `gzip.maxInitialEntrypointBytes` 165 000), and
  Apollo, zod and tsyringe stay out of `src/lib/access/**`.
- **NFR-07** — visual diffs `0`: the delta must not alter a recorded baseline. A change that
  does is a design decision, not a side effect.
- **NFR-08** — accessibility (WCAG 2.2 AA): a refused navigation still renders `AccessDenied`
  owning the `h1`, moves focus to that heading, nests no second landmark, and is re-keyed per
  pathname; a degraded session never leaves focus trapped mid-interaction; every new
  user-visible string ships `en` + `uk` and passes `make lint-i18n`.
- **NFR-09** — security: fail closed on every ambiguity. Never elevate on an unrecognised role,
  an unmapped role, a failed fetch or an invalid payload; add no PII to an audit event beyond
  what the session already holds; do not verify the JWT signature on the client.
- **NFR-10** — the paint-safe domain (`src/lib/access/**`) keeps importing no tsyringe, no
  `reflect-metadata`, no container and no feature module, enforced by
  `no-access-domain-to-container`, `no-access-domain-to-tsyringe` and
  `no-access-layer-to-modules`.
- **NFR-11** — the React seam (`useCan`, `usePrincipal`, `useTenant`, `useAccessFlag`,
  `<RequirePermission>`, `meta.permission`) keeps its exact signatures; no feature code changes
  because of the sync.
- **NFR-12** — backend types are generated by `make codegen` and parsed, never hand-written or
  cast; a pin bump passes `make contract-diff`.
- **NFR-13** — any new route carries a `tests/e2e/route-coverage.tsv` row validated in both
  directions by `make check-e2e-route-coverage`.
- **NFR-14** — documentation stays truthful: `docs/access-control.md` and an ADR record the
  source-of-truth change before it ships; `make lint-docs` and `make check-adr-drift` pass.

## Traceability — the team lead's review

| Review theme                      | Requirements                      | Epic / stories   |
| --------------------------------- | --------------------------------- | ---------------- |
| "sync … dynamic graphql RBAC"     | FR-14, FR-15, FR-16, FR-17, FR-22 | Epic 2, 2.1–2.7  |
| "dynamic" (sourced, not compiled) | FR-18, FR-19, FR-20, FR-21, FR-27 | Epic 3, 3.1–3.5  |
| "our backend architecture"        | FR-23, FR-24                      | Epic 4, 4.1–4.4  |
| PR #230 stays mergeable alongside | FR-25, FR-26                      | Epic 5, 5.1–5.4  |
| Issue #114 acceptance criteria    | FR-01 … FR-13                     | Epic 1 (shipped) |

All four review rows trace to one source: review `5135385113` on PR #230, 2026-09-07T21:47Z,
state `COMMENTED`, by the team lead (Kravalg) — _"We should sync this implementation with our
backend architecture of the dynamic graphql RBAC"_.

## Out of scope

Server-side enforcement; a tenant-management UI; client-side JWT signature verification;
replacing client `Policy` classes with server-evaluated rules; any change to a `quality.*`
threshold; any change to the `useFeatureFlag` (issue #145) runtime-flag catalogue beyond adding
the single rollout flag of FR-26.

## Open questions

The questions addressed to the backend team lead are listed in full in
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md). Since the re-aim, `OQ-3`,
`OQ-7` and `OQ-12` are retired and `OQ-13` … `OQ-18` are new. Each live question has a recorded
interim assumption, so no requirement above is blocked on an answer — but FR-14, FR-15 and FR-23
will change shape once they are answered, which is why they are specified as a proposal and an
adapter rather than as a cutover. **OQ-17** is the exception worth naming here: if the allowed
set is maintained separately from the `is_granted` expressions user-service actually enforces,
FR-16 gates on a model the server does not honour, and the delta is not safe to adopt.
