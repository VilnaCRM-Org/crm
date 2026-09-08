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

## Product scope

Two bodies of work, one requirement set:

- **Baseline (`FR-01` … `FR-13`)** — the client-side access layer shipped by PR #230. Recorded
  here as requirements so the delta cannot silently regress them and so the FR/NFR review gate
  has a complete matrix. Status: **Shipped**.
- **Delta (`FR-14` … `FR-26`)** — the sync with the backend's dynamic GraphQL RBAC, driven by
  the team lead's review on PR #230. Status: **Planned**.

## Terminology

| Term              | Meaning in this document                                                 |
| ----------------- | ------------------------------------------------------------------------ |
| Access catalogue  | the server-owned set of roles, their permissions, and the permission ids |
| Session catalogue | the subset of the catalogue that applies to the current principal        |
| Claim shape       | the interim principal source: JWT claims read by `ClaimsMapper`          |
| Catalogue shape   | the proposed principal source: a GraphQL query result                    |
| Access flag       | a **per-principal** entitlement (`useAccessFlag`, issue #114)            |
| Runtime flag      | a **deployment-level** setting (`useFeatureFlag`, issue #145)            |

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

**FR-14 — A versioned GraphQL access-catalogue contract exists and is proposed to the backend.**
The repository holds a written proposal for user-service naming the query shape, the field
semantics, the nullability, and the error behaviour. The proposal is the reviewable artifact the
team lead responds to; it is not assumed accepted.
The proposed shape (subject to OQ-1…OQ-4):

```text
type AccessRole {
  name: String!
  permissions: [String!]!
}

type AccessTenant {
  id: ID!
  name: String!
}

type AccessSession {
  subject: ID!
  email: String
  roles: [AccessRole!]!
  tenants: [AccessTenant!]!
  activeTenant: ID
  flags: [AccessFlag!]!
  sessionId: ID!
  catalogueVersion: String!
}

type Query {
  accessSession: AccessSession
  accessCatalogue: AccessCatalogue
}
```

_Acceptance:_ the contract document is committed, links this PRD, and lists the twelve open
questions inline against the fields they affect.

**FR-15 — Server role names map to product roles through reviewed data, not code.**
A single mapping table translates the server's role vocabulary (`ROLE_USER`, `ROLE_SERVICE`,
and any dynamic role the catalogue declares) into the client `Role` union. The map is data in
one file, is exhaustively unit-tested, and an unmapped server role resolves to `DEFAULT_ROLE`
(`viewer`) and emits an audit event naming the unmapped role. No server role is ever upgraded
to a role the map does not name.

**FR-16 — Permissions are reconciled against the server-declared set at runtime.**
When a catalogue is available, the effective permission set is the **intersection** of what the
server grants and what the `Permission` union declares. The client never invents a grant the
server did not make, and never acts on a grant it cannot render.

**FR-17 — Unknown permission ids have two different, deliberate outcomes.**

- A permission the **server** declares and the UI does not know is **ignored** at runtime and
  recorded once per session as an `access_catalogue_unknown_permission` audit event. Ignoring is
  correct: the UI has no affordance to gate, so there is nothing to decide.
- A permission the **UI** declares and the server does not is a **build-time failure** of the
  contract parity test when a catalogue snapshot is pinned, and a **runtime deny** when no
  snapshot is available. Rationale: a UI permission with no server counterpart is either dead
  code or an unenforceable gate, and both are defects; failing the build is the cheapest place
  to learn it, and denying is the only safe behaviour once it is already deployed.

> Assumption: build failure is chosen over a warning because `quality.eslint_warnings` is `0`
> and the repository has no warning-tolerant channel; a warning would be invisible.

**FR-18 — One adapter accepts both the claim shape and the catalogue shape.**
A `SessionLoader` implementation resolves a principal from a fetched catalogue when one is
cached, and falls back to the shipped `SessionFactory` claim path otherwise. Selection is by
availability plus the runtime flag of FR-26 — never by a compile-time branch — so PR #230 can
merge unchanged and the sync lands additively.

### Hydration, caching and failure

**FR-19 — A catalogue-backed session hydrates without blocking first paint.**
`SessionLoader.build` stays **synchronous**. The catalogue is fetched outside the loader and
written into a cache the loader reads. A cache miss yields the claim-shape principal
immediately; the fetched catalogue re-publishes a new snapshot when it arrives. There is no
`await` between route entry and first paint.

**FR-20 — The catalogue cache is keyed by session id and explicitly invalidated.**
The cache key is the token's `sid` claim (already issued by user-service). It is invalidated on
`refreshTokenUser`, on logout, on tenant switch, and when `catalogueVersion` changes. A cache
entry never outlives its session.

**FR-21 — Every degraded catalogue path fails closed and is observable.**
A fetch failure, a schema-invalid payload, a timeout, or an empty catalogue resolves the
principal to `DEFAULT_ROLE` (`viewer`) — never to the last-known-good elevated set — and emits
an `access_catalogue_unavailable` audit event carrying the cause. The user sees the shell, not a
blank page, and never sees an affordance the degraded set does not grant.

**FR-22 — The catalogue is validated at the contract boundary, never cast.**
The query is generated through `make codegen` into `src/api/generated/graphql.ts`; its result is
parsed by a zod schema colocated with the repository, exactly as `src/api/contracts/README.md`
requires. A schema violation is a typed error and a degraded (fail-closed) session, not a crash.

### Tenancy and audit

**FR-23 — Tenancy is deferred behind an access flag, with the claim shape as the interim.**
The backend has no tenant concept (research, section "What user-service actually issues
today"). `useTenant()` and `switchTenant` keep their current behaviour over the claim-derived
membership list; any tenant **UI** stays gated by the `tenant-switcher` access flag until the
catalogue declares tenants. The synthetic `default` tenant remains the single membership when
no tenant claim exists.

**FR-24 — Client audit events correlate with the server trail.**
Every audit event carries the `X-Request-Id` correlation id already generated by the
observability boundary (issue #115), so a client-side `permission_denied` can be joined to the
server request that would have refused it. The sink stays pluggable and container-free; a
throwing sink still never breaks a user flow.

### Rollout

**FR-25 — Mocks serve the catalogue for every browser-level suite.**
The local Apollo mock (`docker/apollo-server/`) and the Mockoon fixture used by E2E resolve the
catalogue query, so the E2E, visual, mobile and Lighthouse seeded-token paths exercise the
catalogue shape rather than silently falling back to claims. The seeded-token route regression
guard (`tests/unit/routes/seeded-session-route.test.tsx`) is extended to cover the catalogue
path.

**FR-26 — A runtime flag selects the session source and can roll back without a redeploy.**
A deployment-level runtime flag (issue #145 — `@/config/runtime`, declared in the `FeatureFlag`
union, `FEATURE_FLAG_DEFAULTS`, `app-config-schema.ts` and the committed block in
`public/index.html`) chooses `claims` or `catalogue`. It ships **default-off** (`claims`), is
enabled per environment, and is removed once the catalogue is the only source. It is a runtime
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
- **NFR-05** — Lighthouse desktop ≥ 95 and mobile ≥ 85 on the audited routes; no catalogue
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
| "sync … dynamic graphql RBAC"     | FR-14, FR-15, FR-16, FR-17, FR-22 | Epic 2, 2.1–2.6  |
| "dynamic" (sourced, not compiled) | FR-18, FR-19, FR-20, FR-21        | Epic 3, 3.1–3.5  |
| "our backend architecture"        | FR-23, FR-24                      | Epic 4, 4.1–4.3  |
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

Twelve questions (`OQ-1` … `OQ-12`) are addressed to the backend team lead and listed in full in
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md). Each has a recorded interim
assumption, so no requirement above is blocked on an answer — but FR-14, FR-15 and FR-23 will
change shape once they are answered, which is why they are specified as a proposal and an
adapter rather than as a cutover.
