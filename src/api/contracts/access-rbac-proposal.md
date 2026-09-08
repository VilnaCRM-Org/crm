# Proposal: a versioned GraphQL access-catalogue contract

**Status:** proposed, not yet accepted. **Audience:** the user-service backend team lead.
**Origin:** PR #230 review `5135385113` (2026-09-07T21:47Z) — _"We should sync this
implementation with our backend architecture of the dynamic graphql RBAC"_. **Traces to:**
[PRD FR-14](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/prd-114-access-rbac-tenant-audit-2026-09-08.md#contract)
and
[architecture D1](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md#d1--the-catalogue-arrives-through-a-graphql-query-generated-and-zod-parsed).

## What this document is for

crm's client-side access layer
(`src/lib/access/`, [ADR-004](../../../docs/adr/004-client-side-access-control-layer.md))
currently derives a principal's roles and permissions entirely from JWT claims — a static,
compile-time model. This document proposes the GraphQL shape user-service would need to expose
for the client to source that model dynamically, per
[`src/api/contracts/README.md`](README.md)'s existing rule that user/account-graph data is read
through GraphQL, generated, and zod-validated at the boundary — never hand-cast.

This is a **proposal**, not an implementation. Nothing in crm depends on it yet: the client's
existing claim-derived model (PR #230, shipped) continues to serve production traffic behind a
default-off runtime flag until this contract — or an amended version of it — is accepted and
deployed. A reviewer who accepts or rejects this document does not need to read any client
source; every field below states its own semantics, nullability and open question.

## Proposed schema

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

type AccessFlag {
  name: String!
  enabled: Boolean!
}

type AccessCatalogue {
  roles: [AccessRole!]!
  catalogueVersion: String!
}

type Query {
  accessSession: AccessSession
  accessCatalogue: AccessCatalogue
}
```

Two queries, not one, on purpose: `accessSession` is per-principal and short-lived (it changes
when the caller's own grants change); `accessCatalogue` is deployment-wide and cacheable across
every signed-in user (it changes only when the backend redefines the role/permission set). The
split is what lets the client fail a build when the UI gates on a permission the deployment's
catalogue never declares (FR-17) without re-fetching that check per user. **OQ-2** governs
whether this split matches how the backend actually stores the data — see below.

## Field semantics, nullability and open questions

### `Query.accessSession`

Resolves the authenticated caller's own session. **Nullable** — a `null` result means "no
authenticated session" and the client treats it identically to an absent token: fail closed to
`DEFAULT_ROLE` (`viewer`), no error.

- **`subject: ID!`** (never null) — the caller's stable identity. Must equal the token's
  `subject`/`sub` claim (see D7 in the
  [architecture document](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md#d7--read-both-subject-and-sub)).
  A mismatch is a contract violation, not a client bug.
- **`email: String`** (nullable) — absent for a token that carries no email claim (parity with
  today's claim shape).
- **`roles: [AccessRole!]!`** (never null, empty allowed) — server role names, **not** client
  role names — see [role-name mapping](#role-name-mapping-is-out-of-scope-here). An empty list
  resolves the client to `DEFAULT_ROLE`, exactly as an empty `roles` claim does today.
- **`tenants: [AccessTenant!]!`** (never null, empty allowed) — the caller's tenant memberships.
  **Speculative** — user-service has no tenant concept today (research finding); see
  [OQ-6](#open-questions-attached-to-this-proposal). Client tenancy stays behind the
  `tenant-switcher` access flag until this is populated.
- **`activeTenant: ID`** (nullable) — the tenant the session is currently scoped to. `null`
  means "use the client's synthetic `default` tenant", matching today's fallback.
- **`flags: [AccessFlag!]!`** (never null, empty allowed) — per-principal entitlements
  (`useAccessFlag`) — a **different catalogue** from the deployment-level runtime flags of
  `useFeatureFlag` (issue #145); the two must never share a name (`docs/access-control.md`).
- **`sessionId: ID!`** (never null) — must equal the token's `sid` claim. This is the cache key
  (see D6 in the
  [architecture document](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md#d6--cache-key-is-sid-invalidation-is-explicit)).
  A session whose `sessionId` does not match its own token's `sid` cannot be cached correctly.
- **`catalogueVersion: String!`** (never null) — opaque version token. The client invalidates
  its cache when this changes; it is never parsed or compared numerically.

### `Query.accessCatalogue`

Resolves the deployment-wide declaration of every role and the permissions it grants — the set
the UI's `Permission` union is checked against at build time (FR-17). **Nullable** — a `null`
result is a degraded path: the client fails closed to `DEFAULT_ROLE` and emits
`access_catalogue_unavailable`, the same as a network error or a schema-invalid payload.

- **`roles: [AccessRole!]!`** (never null, empty allowed) — every role the deployment knows
  about and the permission ids each one grants. An empty list is treated as unavailable, not as
  "no roles exist" — a real deployment always has at least one role.
- **`catalogueVersion: String!`** (never null) — the same opaque version token as
  `AccessSession.catalogueVersion`; the two must agree when read together. A mismatch between
  the two in the same request is a contract violation the client cannot repair — it fails closed
  and audits the cause.

### `AccessRole`

- **`name: String!`** (never null) — the server's role name (e.g. `ROLE_USER`). See
  [role-name mapping](#role-name-mapping-is-out-of-scope-here) — this proposal does not ask the
  backend to change its vocabulary.
- **`permissions: [String!]!`** (never null, empty allowed) — permission ids the role grants, in
  the `resource:action` shape the client already uses (`contact:read`, `admin:manage-users`) —
  see **OQ-7**. A permission id the client's closed `Permission` union does not declare is
  silently dropped and audited once per session (FR-17); it is never an error.

### `AccessTenant`

- **`id: ID!`** (never null) — stable tenant identifier.
- **`name: String!`** (never null) — display name.

### `AccessFlag`

- **`name: String!`** (never null) — flag identifier. Must not collide with a runtime flag name
  (issue #145).
- **`enabled: Boolean!`** (never null) — whether the flag is on for this principal. Absent flags
  default to off, matching today's claim-shape behaviour.

## Error behaviour

Both queries follow the same rule the client already applies at every GraphQL boundary
(`src/api/contracts/README.md`): a result is **parsed, never cast**. Three distinguishable
outcomes, all reachable from the client repository:

1. **Field-level GraphQL error** (partial `data` + `errors`) — treated as unavailable for the
   affected query; the other query's result, if present, is still used.
2. **Request-level failure** (network rejection, timeout, non-2xx) — both queries are treated as
   unavailable.
3. **Schema-invalid payload** (a field present but the wrong shape, or a `!` field missing) — the
   zod schema at the client boundary rejects it; treated identically to case 2.

In every case the client resolves the principal to `DEFAULT_ROLE` (`viewer`) and emits an
`access_catalogue_unavailable` audit event carrying the cause — never the last-known-good
elevated grant set from a previous fetch, and never a fallback to "allow" (D8). The proposal
asks the backend for nothing beyond standard GraphQL error semantics; there is no custom error
envelope to agree on.

## Versioning

`catalogueVersion` is the single mechanism by which either side signals "the set of roles and
permissions changed" — it is opaque to the client (never parsed as semver, never compared
numerically) and is the client's cue to invalidate its `sid`-keyed cache and re-fetch
(`AccessSession.catalogueVersion` and `AccessCatalogue.catalogueVersion` must always agree when
returned together). This proposal does not ask user-service to version the _schema itself_
(field additions are backward-compatible by GraphQL's own rules and need no coordination); it
only asks for a version token on the _data_ the schema serves.

## Role-name mapping is out of scope here

This proposal deliberately does **not** ask user-service to change its role vocabulary
(`ROLE_USER`, `ROLE_ADMIN`, …) to match the client's product role names (`member`, `admin`,
…). The client maps server role names to product roles through its own reviewed data file
(`src/lib/access/role-mapping.ts`) so that a mismatch in naming convention is not a blocker to
adopting this contract. **OQ-3** tracks whether the backend would prefer to emit product names
directly, which would let the client's mapping table shrink to identity and eventually be
deleted — a follow-up change to this proposal, not a precondition for accepting it.

## Open questions attached to this proposal

The interim assumptions below are what the client architecture currently builds against; each
is a one-file client change to revise once answered, not a redesign. Full context for each is in
the
[readiness assessment](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/readiness-114-access-rbac-tenant-audit-2026-09-08.md#open-questions-for-the-backend-team-lead-kravalg).

- **OQ-1 — Where does the access catalogue live?** user-service, core-service, or a new
  authorization service? _Interim assumption:_ user-service, since it already owns the GraphQL
  schema crm pins and is the identity provider. _Affects:_ `Query.accessCatalogue`'s placement
  in the schema above.
- **OQ-2 — What does "dynamic" mean precisely?** Roles and permissions stored in a database and
  editable at runtime, per tenant, per deployment — or computed per request from policy?
  _Interim assumption:_ server-owned data, versioned by `catalogueVersion`, stable for the life
  of a session. _Affects:_ whether `catalogueVersion` is sufficient to express every change this
  proposal needs to signal.
- **OQ-3 — Will the backend emit product role names, or keep `ROLE_*`?** _Interim assumption:_
  `ROLE_*` persists; the client maps. _Affects:_ `AccessRole.name`'s vocabulary.
- **OQ-4 — Claims or query?** Should grants ride in the JWT (no request, refresh-bound) or come
  from this query (a request, live)? _Interim assumption:_ query, with claims kept as the
  client's interim fallback. _Affects:_ whether this proposal is adopted at all versus enriching
  the token instead.
- **OQ-6 — Is there a tenant or organization concept planned, and what identifies it?**
  _Interim assumption:_ none yet; `AccessSession.tenants` / `activeTenant` are specified but the
  client treats them as optional until populated. _Affects:_ `AccessTenant`, `activeTenant`.
- **OQ-7 — Is `resource:action` the agreed permission naming scheme?** _Interim assumption:_
  yes — it is what the client already uses. _Affects:_ `AccessRole.permissions`' string shape.
- **OQ-8 — Is there a server-side audit trail, and what id joins a client event to it?**
  _Interim assumption:_ correlate on the `X-Request-Id` the client already generates (issue
  #115); this proposal adds no separate correlation field. _Affects:_ nothing in the schema
  above — noted here so a reviewer knows it was considered.
- **OQ-9 — Will the catalogue ship inside user-service's pinned `.github/graphql-spec/spec`?**
  crm's codegen and its `contract testing` / `contract drift` gates read only that pin.
  _Interim assumption:_ yes; otherwise crm needs a second pinned source and a second drift
  monitor. _Affects:_ how this schema is delivered to `make codegen`, not its shape.

Four questions from the readiness assessment govern client-internal behaviour rather than this
schema and are intentionally not repeated here: **OQ-5** (can a grant shrink mid-session — a
cache/re-render policy question), **OQ-10** (whether object-level rules become server data — a
non-goal for this proposal), **OQ-11** (fail-closed UX acceptability), and **OQ-12** (how
`ROLE_SERVICE` is represented — resolved by the client's role-mapping table regardless of this
schema's shape).

## What accepting this proposal does not require

- No change to the existing `User` type or its mutations — this is an additive query pair.
- No change to token issuance, `AccessTokenPassportFactory`, or the `subject`/`sid` claims the
  client already reads
  ([D7](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md#d7--read-both-subject-and-sub)).
- No coordinated cutover — the client adopts this behind a default-off runtime flag
  (`accessCatalogueSource`, issue #145) and can be enabled per environment or rolled back with a
  container restart, never a redeploy.

## Reviewing this proposal

A reviewer who accepts, amends or rejects this document should respond against the field list
and the open questions above — not against client source, which this proposal is written to be
independent of. Amendments to the shape (renamed fields, a collapsed single-query form per
OQ-4, additional nullability) are expected and are a schema-and-adapter change on the client
side, not an architecture change (see the architecture document's alternatives-considered
sections for D1 and D3).
