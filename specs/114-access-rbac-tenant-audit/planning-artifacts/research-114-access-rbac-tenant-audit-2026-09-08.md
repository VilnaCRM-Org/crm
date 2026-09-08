---
status: 'complete'
workflowType: 'research'
project_name: 'crm'
date: '2026-09-08'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/114'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/114'
  - 'https://github.com/VilnaCRM-Org/crm/pull/230'
  - 'https://github.com/VilnaCRM-Org/crm/pull/230#pullrequestreview-5135385113'
  - 'docs/access-control.md'
  - 'docs/adr/004-client-side-access-control-layer.md'
  - 'src/lib/access/'
  - 'src/lib/types/access/'
  - 'src/services/access/'
  - 'src/hooks/use-can.ts'
  - 'src/hooks/use-principal.ts'
  - 'src/hooks/use-tenant.ts'
  - 'src/hooks/use-access-flag.ts'
  - 'src/components/require-permission/index.tsx'
  - 'src/modules/user/features/auth/components/protected-route/index.tsx'
  - 'src/routes/permission-branch-builder.tsx'
  - 'src/config/runtime/feature-flag-service.ts'
  - 'src/api/contracts/README.md'
  - 'tests/e2e/route-coverage.tsv'
  - 'CLAUDE.md'
  - '.claude/react-sdlc.yml'
---

# Research — Access control (RBAC, tenancy, access flags, audit) and the backend sync (issue #114)

BMAD phase 1 (`analyst`). This is the first artifact in the chain for
`specs/114-access-rbac-tenant-audit/`. Downstream:
[brief](brief-114-access-rbac-tenant-audit-2026-09-08.md) →
[prd](prd-114-access-rbac-tenant-audit-2026-09-08.md) →
[architecture](architecture-114-access-rbac-tenant-audit-2026-09-08.md) →
[epics](epics-114-access-rbac-tenant-audit-2026-09-08.md) →
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md).

## Scope of this research

Two questions, answered separately because they have very different evidence quality:

1. **What shipped?** Issue #114 is implemented on branch `claude/114-access-rbac-tenant-audit`
   (PR #230). Section "Current state" below is verified against the source on that branch.
2. **What must change to satisfy the team lead's review?** Review `5135385113`
   (2026-09-07T21:47Z, state `COMMENTED`) says, verbatim:

   > We should sync this implementation with our backend architecture of the dynamic graphql RBAC

   Section "The backend sync driver" below is the primary research question of this document.

## Current state — what PR #230 shipped

### Layering

The layer is cross-cutting, not a module. `no-cross-module-imports` forbids module→module
imports outright and `no-components-import-modules` bars shared UI from importing a module, so
the `src/modules/access/` shape sketched in issue #114 could never be consumed by the CRM
feature modules it exists to serve. It therefore mirrors the paint-safe two-layer split of
the observability boundary (issue #115):

- **Domain** — `src/lib/access/**`: the permission and access-flag catalogues, the
  role→permission resolver, the snapshot store and its sealing factory, the claims reader, the
  session factory, the audit core, and the policy classes. Dependency-free and paint-safe.
- **DI adapters** — `src/services/access/**`: the `@injectable()` services
  (`PermissionService`, `PolicyEvaluator`, `TenantContextService`, `FeatureFlagService`,
  `AuditLogger`, `SessionRepository`, `AccessSessionService`) and the `ACCESS_TOKENS`
  composition root.
- **React seam** — `src/hooks/use-{can,principal,tenant,access-flag,access,access-snapshot}.ts`,
  `src/providers/access-{context,provider}`, `src/components/{require-permission,access-denied}`.
- **Route gate** — `src/routes/permission-route.tsx` and
  `src/routes/permission-branch-builder.tsx`, which group protected routes by
  `meta.permission` under one `PermissionRoute` each, inside `AppLayout`.

Type-only files live in `src/lib/types/access/**` (issue #88). ADR-004 records the decision.

### The closed catalogue that shipped

`src/lib/access/permission-catalog.ts` hardcodes the whole model as compile-time constants:

```text
PERMISSIONS  app:home, contact:read, contact:write, contact:manage-all, deal:read,
             deal:write, activity:read, activity:write, tenant:switch, admin:manage-users
ROLES        admin, manager, member, viewer
DEFAULT_ROLE viewer          (least privilege on an unrecognised role)
```

`ROLE_PERMISSIONS` is a static, additive map: `viewer` ⊂ `member` ⊂ `manager` ⊂ `admin`.
`src/lib/access/feature-flag-catalog.ts` holds the per-principal access flags
(`contacts-module`, `deals-module`, `tenant-switcher`) with their defaults.

### Where the principal comes from today

`src/lib/access/session-claims-reader.ts` base64url-decodes the JWT payload;
`src/lib/access/claims-mapper.ts` narrows it field by field to `SessionClaims`:

```text
sub?: string
email?: string
roles?: readonly string[]
tenantId?: string
tenants?: readonly { id: string; name: string }[]
flags?: Readonly<Record<string, boolean>>
```

`src/lib/access/session-factory.ts` expands those roles into permissions and seals a
`Principal { id, email, roles, permissions, tenantId, tenants }`. Hydration is **synchronous**:
`ProtectedRoute` calls `accessSession.sync()` at module load, before first render, so the
Lighthouse/Playwright seeded token is already authorized when the gated page first paints.

### Substitution seams that already exist

- `accessSession.useLoader(loader)` — the single swap point for _where a session comes from_.
  `SessionLoader` is `build(input: SessionInput): SessionSnapshot | null`, i.e. **synchronous**.
- `ACCESS_TOKENS.SessionRepository` — the injectable face of that loader; constructing
  `AccessSessionService` installs the container binding as the loader, so overriding the token
  redirects the render path too.
- `auditCore.useSink(sink)` — container-free audit sink installation.

ADR-004 states the intent explicitly: "a future roles endpoint is a loader swap rather than a
rewrite". That is the seam the backend sync will use.

### Machine-enforced boundaries already in place

dependency-cruiser: `no-ui-to-access-services`, `no-ui-to-access-state`,
`no-access-layer-to-modules`, `no-access-domain-to-container`, `no-access-domain-to-tsyringe`,
plus the pre-existing `no-feature-ui-to-services`. ESLint `no-restricted-syntax` bans
`principal.roles`/`principal.permissions` membership tests and raw permission strings at call
sites outside `src/lib/access/**` and `src/services/access/**`. Both are proven live by
must-fail fixtures in `tests/unit/tooling/access-control-gates.test.ts`.

### Quality position of the shipped work

Unit 182 suites / 1907 tests and integration 40 suites / 433 tests, both at 100% statements,
branches, functions and lines; mutation score 100.00% with `break = 100`; zero jscpd clones;
zero ESLint / TypeScript / dependency-cruiser findings. **Any new access logic must arrive with
tests that kill its mutants**, because a single survivor fails the gate.

## The backend sync driver — evidence

### What the review asks for

The comment names a "backend architecture of the dynamic graphql RBAC". "Dynamic" is the
operative word: it implies roles and permissions that are **data the server owns and can change
at runtime**, delivered over GraphQL — the opposite of the compile-time constants that shipped.

### What is actually published upstream — a negative finding

A search across the VilnaCRM-Org repositories that could plausibly host it — `user-service`,
`core-service`, `php-service-template`, `bootstrap-infrastructure`, `website`, `ui-toolkit` and
the org `docs` repo — found **no document, issue, pull request or discussion** titled or
describing a dynamic GraphQL RBAC design.

> Assumption: the backend design exists as team knowledge (the reviewer is the team lead) but is
> **not yet published**. Every artifact in this chain therefore treats the frontend↔backend
> contract as a **proposal**, keeps each assumption individually reversible, and routes the
> unresolved points to an explicit "Open questions for the backend team lead (Kravalg)" section
> rather than inventing an authoritative-sounding contract. Guessing a contract and building to
> it would be worse than shipping the interim adapter and asking.

### What user-service actually issues today

`user-service` (Symfony, API Platform, Lexik JWT, league OAuth2) is the identity provider. Its
access-token passport reads exactly three claims —
`src/Shared/Infrastructure/Factory/AccessTokenPassportFactory.php` lines 24-27:

```text
subject   the user identifier
roles     Symfony role strings
sid       the session identifier
```

Roles are `ROLE_USER` and `ROLE_SERVICE`. PR #325 (spec `security-312`) fixed a `ROLE_SERVICE`
escalation and made a token with no `roles` claim default to `ROLE_USER`. There is **no**
`email`, `tenantId`, `tenants`, `flags` or `permissions` claim.

`security.yaml` `access_control` gates by path plus role: `ROLE_USER` as the catch-all for
`^/api/`, `ROLE_SERVICE` for `/api/users/batch`. `/api/graphql` is `PUBLIC_ACCESS` at the
firewall, with authorization applied per resolver.

### What the pinned GraphQL schema exposes

`GRAPHQL_SCHEMA_VERSION=v2.7.1` in `.env`, resolved from user-service
`.github/graphql-spec/spec`. The schema exposes only:

```text
Query      node, authPayload(s), emptyResponse(s), healthCheck(s), user(s)
Mutation   signInUser, completeTwoFactorUser, refreshTokenUser, setupTwoFactorUser,
           confirmTwoFactorUser, disableTwoFactorUser, regenerateRecoveryCodesUser,
           createUser, updateUser, deleteUser, confirmUser, …
```

There is **no** role, permission, tenant or policy type, query or mutation today. `core-service`
(customers) records in its own NFR issue #298 that it has "no in-app authentication or
authorization", so server-side RBAC enforcement for CRM data does not exist yet either.

### The three concrete mismatches this creates

1. **Role vocabulary.** The client's roles are `admin | manager | member | viewer`; the server
   issues `ROLE_USER | ROLE_SERVICE`. `SessionFactory` filters claimed roles to the known `Role`
   set, so **every real production token matches nothing** and falls back to `DEFAULT_ROLE`
   (`viewer`). That is the safe direction — an unrecognised role is never upgraded to write
   access, and `viewer` still carries `app:home` so the shell paints — but it means the shipped
   RBAC is inert against a real token: nobody can write anything.
2. **Claim vocabulary.** At the branch point (`b50830bf`) `claims-mapper.ts` read `sub`, not the
   server's `subject`, and read `email`, `tenantId`, `tenants` and `flags`, none of which the
   server issues; against a real token the principal was a random opaque uuid with an empty email
   and no memberships. Story 2.1 of this delta has since closed the identity half — the mapper
   reads `subject` first with `sub` as the fallback, and reads `sid`. The rest of the mismatch is
   unchanged: the server still issues no `email`, `tenantId`, `tenants` or `flags` claim, so those
   still resolve to an empty email and the synthetic `default` tenant.
3. **Source of truth.** A permission set derived from a compile-time role map drifts from the
   server's model silently — ADR-004 lists exactly this as a negative consequence: "only a real
   request failing will reveal it". A dynamic server-owned catalogue is the fix the review asks
   for.

> Assumption: mismatch 1 and 2 are **not** treated as production bugs to hotfix ahead of this
> delta. They are the precise reason the sync work exists, and the interim adapter (see
> architecture D3) is what makes the current shape and the future shape coexist. Recording them
> as findings rather than as a blocker keeps the branch mergeable. Both have since been addressed
> on this branch by the delta's own stories 2.1 and 2.3 — as scoped, reviewed work items, not as
> a hotfix.

### `sid` is the missing cache key, and it is already issued

The passport reads `sid`. That is the natural cache key for a fetched catalogue: it changes on
re-login, and `refreshTokenUser` is the mutation that would rotate it. The client did not read
`sid` at the branch point. It was the cheapest concrete step toward the sync and independent of
the unpublished design, so this delta took it: story 2.1 reads `sid` in `claims-mapper.ts` and
story 3.1 keys `CatalogueCache` by it.

## Constraints the delta must respect

- **The paint path stays tsyringe- and zod-free** (ADR-004, the issue #115 pattern) — a
  catalogue fetch can never be eager.
- **Lighthouse floors: mobile 85, desktop 95** (`.claude/react-sdlc.yml`) — no blocking request
  may precede first paint on an audited route.
- **`SessionLoader.build` is synchronous** (`src/lib/types/access/session.ts`) — an async source
  needs a cache seam, not an `await` in the loader.
- **Mutation `break = 100`** (`stryker.config.mjs`) and **coverage 100/100/100/100**
  (`jest.config.ts`) — every new branch, including each failure path, needs a killing assertion.
- **Backend shapes are generated** (`src/api/contracts/README.md`) — no hand-written or cast
  backend types; a pin bump goes through `make contract-diff`.
- **Route coverage is an inventory** (`tests/e2e/route-coverage.tsv`) — a new route needs a
  manifest row in both directions.
- **No suppression, ever** (`CLAUDE.md`) — fix the cause, never the gate.
- **Closed typed sets** (issue #114 and the ESLint gate) — `Permission` stays a TypeScript
  union; it does not become `string`.

The contract boundary is already defined: `src/api/contracts/README.md` requires backend shapes
to be **generated** (`make codegen`) and **parsed, never cast** (zod at the repository
boundary), with `make contract-diff` gating a pin bump semantically and `make
check-contract-drift` monitoring upstream weekly. A catalogue query lands inside that machinery
rather than beside it.

## Risks

- **R1** — the proposed contract does not match the unpublished backend design. _Mitigation:_
  ship the adapter behind a runtime flag; route the disagreement through OQ-1…OQ-12.
- **R2** — an awaited catalogue fetch before paint sinks the Lighthouse floor. _Mitigation:_
  cache-first resolution; never block first paint.
- **R3** — failing open on a catalogue error would grant unearned access. _Mitigation:_ fail
  closed to `DEFAULT_ROLE` plus an audit event.
- **R4** — server permission ids the UI does not know silently do nothing. _Mitigation:_ ignore
  them deliberately, audit once per session, and pin the union with a parity test.
- **R5** — UI permission ids the server does not declare gate nothing. _Mitigation:_ build-time
  parity failure against a pinned snapshot; runtime deny otherwise (FR-17).
- **R6** — an async source breaks the seeded-token Lighthouse path. _Mitigation:_ a mock fixture
  plus the existing `seeded-session-route` regression guard.
- **R7** — tenancy has no server concept at all. _Mitigation:_ defer the UI behind the
  `tenant-switcher` access flag and keep the claim shape as the interim adapter.
- **R8** — a big-bang cutover blocks PR #230. _Mitigation:_ a dual-shape adapter and additive
  stories.
- **R9** — new async branches survive mutation testing. _Mitigation:_ tests first, per story;
  the gate is `break = 100`.
- **R10** — client and server audit trails cannot be correlated. _Mitigation:_ reuse the
  `X-Request-Id` correlation id of issue #115.

## Open questions routed downstream

Twelve questions are carried unchanged into the PRD, architecture and readiness artifacts as
`OQ-1` … `OQ-12`; see
[readiness](readiness-114-access-rbac-tenant-audit-2026-09-08.md), section "Open questions for
the backend team lead (Kravalg)". They are questions, not blockers: every one of them has a
recorded interim assumption so planning and the adapter work can proceed without an answer.
