# Proposal: a mutation-scoped GraphQL access contract

**Status:** proposed, not yet accepted. **Audience:** the user-service backend team lead.
**Origin:** PR #230 review `5135385113` (2026-09-07T21:47Z) — _"We should sync this
implementation with our backend architecture of the dynamic graphql RBAC"_. **Traces to:**
[PRD FR-14](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/prd-114-access-rbac-tenant-audit-2026-09-08.md#contract)
and
[architecture D1](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md#d1--the-client-asks-which-mutations-it-may-run).

## Re-aimed on 2026-09-08

The first version of this document proposed `Query.accessSession` + `Query.accessCatalogue`
returning a role-to-permission catalogue of `resource:action` strings, which the client
reconciled against a closed TypeScript `Permission` union. That shape was invented, because the
team's architecture could not be found when it was written.

The architecture does exist — on the team's Miro board "Frontend C4 Architecture VilnaCRM"
(`https://miro.com/app/board/uXjVMG64hTs=/`), in a diagram titled **"Interactive access control
architecture"** with a companion **IAM Module** diagram — and its model is materially different
in three ways:

1. The permission unit is a **GraphQL mutation**, not a `resource:action` string. The client
   asks whether it may run a named mutation.
2. **Roles are runtime data with an in-product admin UI** — a `Role` entity, a role form, and
   add / edit / delete / list screens.
3. **Denial is data-driven**: empty data hides a child component, and the root page component
   shows 403 when its data is empty. The client does not compute a verdict from a locally-held
   catalogue.

This document has been rewritten around that model. It is a correction, not a new proposal: the
question put to the backend team is unchanged, only the shape it is asked in.

## Provenance and its limits

Read this section before treating anything below as settled.

- The board reading comes from a content capture taken **2026-06-22** by an earlier session,
  using Miro's own "Explore board content" accessibility outline plus widget screenshots. That
  capture is a local, git-ignored working file; it is quoted here rather than linked, because a
  reviewer cannot open it.
- The board loads publicly and still carries the same title today, but the accessibility outline
  could **not** be re-activated on 2026-09-08. **This proposal has therefore not been verified
  against the board's current state**, and any element named below may have moved since June.
  Confirming the outline is the first thing a reviewer should do.
- The board **mixes in stale material**. It carries leftover Structurizr "Internet Banking"
  sample diagrams, which are not requirements, and frames dated 2022 describing Angular, Redux
  and RxJS. This repository is React 18 with Zustand and no RxJS. `State [Redux]` and
  `Pipe (RXjs)` are therefore read as the **shape of the intent** — a dispatch/watch pair over
  an asynchronous permission query, with the answer held in shared state — and **not** as a
  mandate to adopt those libraries.
- **The backend implements none of this today.** user-service's `config/packages/security.yaml`
  is path-based with exactly two roles; the JWT `roles` claim is hardcoded to `['ROLE_USER']` by
  `AuthTokenFactory`; `AuthorizationUserDto::getRoles()` returns an empty array; there is no
  roles column in the Doctrine mapping, no `role_hierarchy`, no Voter class, and no `isGranted`
  call in application code. Object-level rules are inline expression strings of the form
  `is_granted('ROLE_USER') and object.getId() == user.getId()`. `ROLE_SERVICE` is honoured but
  never minted in-repo. The board is a **target design**, not something that can be synced to
  today.

Throughout the document, **specified** marks something the board states in as many words, and
**inferred** marks a design choice this proposal makes on the board's behalf. Every inferred
choice is a legitimate target for amendment.

## What this document is for

crm's client-side access layer
(`src/lib/access/`, [ADR-004](../../../docs/adr/004-client-side-access-control-layer.md))
currently derives a principal's roles and permissions entirely from JWT claims — a static,
compile-time model. This document proposes the GraphQL shape user-service (or whichever service
owns IAM) would need to expose for the client to source that model dynamically in the board's
terms, per [`src/api/contracts/README.md`](README.md)'s existing rule that user/account-graph
data is read through GraphQL, generated, and zod-validated at the boundary — never hand-cast.

This is a **proposal**, not an implementation. Nothing in crm depends on it yet: the client's
existing claim-derived model (PR #230, shipped) continues to serve production traffic behind a
default-off runtime flag until this contract — or an amended version of it — is accepted and
deployed. A reviewer who accepts or rejects this document does not need to read any client
source; every field below states its own semantics, nullability and open question.

## Proposed schema

Two concerns, deliberately kept apart: the **access read** that every signed-in session performs,
and the **IAM administration surface** that only the roles-and-users screens use.

### Access read

```text
type MutationAccess {
  mutation: String!
  allowed: Boolean!
  reason: MutationDenialReason
}

enum MutationDenialReason {
  NO_ROLE_GRANT
  TENANT_SCOPE
  OBJECT_SCOPE
  UNKNOWN_MUTATION
}

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

### IAM administration

```text
type Role {
  id: ID!
  name: String!
  description: String
  mutations: [String!]!
  system: Boolean!
}

type RoleEdge {
  node: Role!
  cursor: String!
}

type RoleConnection {
  edges: [RoleEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

extend type Query {
  role(id: ID!): Role
  roles(first: Int, after: String): RoleConnection!
  grantableMutations: [String!]!
}

extend type Mutation {
  createRole(input: createRoleInput!): createRolePayload
  updateRole(input: updateRoleInput!): updateRolePayload
  deleteRole(input: deleteRoleInput!): deleteRolePayload
  assignUserRoles(input: assignUserRolesInput!): assignUserRolesPayload
  inviteUser(input: inviteUserInput!): inviteUserPayload
}
```

The lowercase `createRoleInput` / `createRolePayload` naming is not a typo: it matches the
convention user-service's API Platform GraphQL layer already emits (`createUserInput`), so the
IAM mutations read like the ones crm already generates against.

### Why this shape

- **Two access queries, not one.** `mutationAccess` returns the whole allowed set for the
  session in one round trip; `mutationAccessFor` answers a narrowed batch and, unlike the set
  query, can carry a `reason`. The set query is what a page load uses; the batch query is what a
  freshly mounted subtree uses when it needs a denial reason to render, and what an object-scoped
  check would extend to (OQ-15). _Inferred._ The board shows a `checkPermissionRequest` /
  `checkPermissionResponse` pair but does not say how many resolvers back it.
- **`allowedMutations` is an unpaginated list.** The set is bounded by the schema, not by data:
  a GraphQL schema has tens to low hundreds of mutation fields, and the count cannot grow with
  tenant size, user count or record count. Paginating a bounded set would add a round trip to
  every page load to protect against a limit that cannot be reached. _Inferred._
- **The IAM lists are Relay connections.** `roles` and the existing `users` read are bounded by
  data, not by the schema, and API Platform already exposes cursor connections
  (`edges` / `node` / `pageInfo`, `first` / `after`), so following that convention costs the
  backend nothing and lets crm's codegen produce the same shapes it already handles. _Inferred._
- **Deny is expressed by absence, not by a false flag.** `allowedMutations` lists only what is
  permitted, which is what makes the board's "don't show component, if data empty" and "show 403
  if data empty" rules fall out directly: a control whose mutation is absent has no data, so it
  is not rendered. _Specified_ (as behaviour); the field shape that produces it is _inferred_.
- **`version` is opaque.** It is never parsed as semver and never compared numerically; a change
  is the client's only cue to invalidate its cache and re-read. _Inferred._

### How the client would consume it

For orientation only — this is not part of the contract, and a reviewer need not agree with it.
The board's `MutationAccessGuard [Decorator]` becomes a React component and hook pair over the
allowed set; `checkPermissionRequest` / `checkPermissionResponse` become a request dispatcher and
a subscription over the client's existing external-store seam, with no RxJS and no Redux; the
gated `CreateEntityButton` / `UpdateEntityButton` / `DeleteEntityButton` become ordinary buttons
that render only when their mutation is in the set.

## Field semantics, nullability and open questions

### `Query.mutationAccess`

Resolves the authenticated caller's own allowed-mutation set. **Nullable** — a `null` result
means "no authenticated session" and the client treats it identically to an absent token: no
mutation is allowed, no error is raised.

- **`subject: ID!`** (never null) — the caller's stable identity. Must equal the token's
  `subject`/`sub` claim (see D7 in the
  [architecture document](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md#d7--read-both-subject-and-sub)).
  A mismatch is a contract violation, not a client bug.
- **`sessionId: ID!`** (never null) — must equal the token's `sid` claim. This is the cache key
  (D6). A session whose `sessionId` does not match its own token's `sid` cannot be cached
  correctly.
- **`tenant: ID`** (nullable) — the tenant the answer is scoped to. **Speculative**: neither the
  board nor user-service has a tenant concept today; see [OQ-6](#open-questions). `null` means
  "not tenant-scoped", which is the only value a deployment without tenants can return.
- **`allowedMutations: [String!]!`** (never null, empty allowed) — the mutation keys the caller
  may execute. **An empty list is a valid, meaningful answer**: it means "this principal may
  change nothing", and the UI renders read-only. It is not an error and must not be conflated
  with a failed read — see [error behaviour](#error-behaviour).
- **`version: String!`** (never null) — opaque version token for the set; see
  [versioning](#versioning).

### `Query.mutationAccessFor`

Resolves a caller-named subset, one `MutationAccess` per requested key, in the order requested.
**Never null**, and never sparse: a requested key the schema does not declare comes back
`allowed: false` with `reason: UNKNOWN_MUTATION`, so the client can distinguish "you may not"
from "no such mutation" without a second request.

- **`mutation: String!`** (never null) — echoes the requested key verbatim.
- **`allowed: Boolean!`** (never null).
- **`reason: MutationDenialReason`** (nullable) — populated only when `allowed` is `false`.
  A denial with a `null` reason is permitted (a backend may not wish to disclose why) and the
  client treats it as an unexplained denial rather than an error. _Inferred._

### `Role`

- **`id: ID!`**, **`name: String!`** (never null) — the role's identity and its display name.
  Unlike the retired catalogue proposal, the client does **not** need to map this name into a
  closed union; roles are opaque runtime data here.
- **`description: String`** (nullable) — free text for the role form.
- **`mutations: [String!]!`** (never null, empty allowed) — the mutation keys this role grants.
  An empty list is a valid role that grants nothing.
- **`system: Boolean!`** (never null) — whether the role is backend-defined and therefore not
  editable or deletable through the IAM UI. Without this the admin screens have no honest way to
  disable destructive controls, and would have to discover the rule by failing a mutation.
  _Inferred._

### `Query.grantableMutations`

The full list of mutation keys a role may be granted — the option set the role form renders. It
is a distinct read from `allowedMutations`, which is what the **caller** may do; an administrator
must be able to grant something they cannot themselves execute. _Inferred._

## Error behaviour

Every result is **parsed, never cast** (`src/api/contracts/README.md`). Four outcomes, all
distinguishable at the client repository:

1. **A successful read with an empty `allowedMutations`** — a real answer. The UI hides controls
   and a root page with no data renders 403, per the board. This is **not** a failure.
2. **Field-level GraphQL error** (partial `data` + `errors`) — the affected query is unavailable;
   another query's result in the same response is still used.
3. **Request-level failure** (network rejection, timeout, non-2xx) — unavailable.
4. **Schema-invalid payload** (a field present with the wrong shape, or a `!` field missing) —
   the zod schema at the boundary rejects it; treated identically to case 3.

Cases 2 to 4 resolve to the same client behaviour as case 1 — no mutation is allowed — but are
audited with their cause, so an outage is distinguishable from a legitimately empty grant set in
the trail even though it is indistinguishable in the UI (D8). The proposal asks the backend for
nothing beyond standard GraphQL error semantics; there is no custom error envelope to agree on.

## Versioning

`version` on `MutationAccessSet` is the single mechanism by which the backend signals "this
principal's allowed set may have changed". It is opaque to the client, and is the cue to
invalidate the `sid`-keyed cache and re-read. This proposal does not ask user-service to version
the _schema itself_ — field additions are backward-compatible by GraphQL's own rules — only to
put a version token on the _data_.

One consequence worth naming: because permission keys are mutation field names, **renaming a
mutation is a breaking authorization change**, not just a schema change. crm's existing
`make contract-diff` gate already fails a pull request on a breaking schema diff, so the rename
is caught; what the backend must decide is whether a rename also carries the grants across
(OQ-16).

## Open questions

The interim assumptions below are what the client architecture currently builds against; each is
a one-file client change to revise once answered, not a redesign. Full context for each is in the
[readiness assessment](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/readiness-114-access-rbac-tenant-audit-2026-09-08.md#open-questions-for-the-backend-team-lead-kravalg).

Questions raised by the board, new in this revision:

- **OQ-13 — Is the permission key the GraphQL mutation field name, or a separate operation id?**
  A field name is discoverable from the pinned schema, which is what makes a build-time parity
  check possible; a separate id survives a field rename. _Interim assumption:_ the field name.
  _Affects:_ every `String` in `allowedMutations`, `mutations` and `grantableMutations`.
- **OQ-14 — Is the answer per-mutation or a whole set per session?** _Interim assumption:_ both,
  as proposed — a set for the page load, a batch for a narrowed check. _Affects:_ whether
  `mutationAccessFor` exists at all.
- **OQ-15 — How do row-level and field-level rules fit?** The board's gated controls are
  per-entity buttons, so `deleteContact` is plainly not a single yes/no for every row.
  user-service expresses this today as inline expressions
  (`is_granted('ROLE_USER') and object.getId() == user.getId()`), which the proposed shape cannot
  represent. _Interim assumption:_ the set answers the mutation-level question only, and
  object-level rules stay server-enforced with the client's `Policy` classes as defence in depth.
  _Affects:_ whether `MutationAccess` needs an object argument.
- **OQ-16 — Does `Role` live in user-service or in a new IAM service, and do grants survive a
  mutation rename?** The board draws IAM as its own module against a single `API` system.
  _Interim assumption:_ user-service, because it is the identity provider and owns the schema crm
  pins. _Affects:_ where the IAM half of this document is implemented, and OQ-9's answer.
- **OQ-17 — How does this coexist with the existing `is_granted` expressions?** Those expressions
  are the live authorization mechanism; the proposed set would be a second one. _Interim
  assumption:_ the set is derived from the same source the expressions consult, so the two cannot
  disagree. If instead it is maintained separately, the client is gating on a model the server
  does not enforce — the failure mode this whole proposal exists to prevent. _Affects:_ whether
  the contract is safe to adopt at all.
- **OQ-18 — Is the in-product role administration UI in scope for crm, and when?** The board
  specifies the screens; this repository has none of them, and building them is a larger change
  than the access read. _Interim assumption:_ out of scope for issue #114; the contract is
  specified so the screens can be built against it later. _Affects:_ the IAM half of the schema.

Questions carried forward, re-aimed where the board changed them:

- **OQ-1 — Where does the access read live?** _Interim assumption:_ user-service. _Affects:_
  `Query.mutationAccess`'s placement. Now overlaps OQ-16.
- **OQ-2 — What does "dynamic" mean precisely?** _Interim assumption:_ role-to-mutation grants
  are stored server-side and editable at runtime through the IAM screens — which the board's role
  form settles far better than the old catalogue guess did. _Affects:_ whether `version` suffices.
- **OQ-4 — Claims or query?** _Interim assumption:_ query. A mutation-keyed set is larger than a
  role list and worse suited to a token than the old catalogue was, so this leans further toward
  the query than it did. _Affects:_ D1, D3.
- **OQ-6 — Is there a tenant or organization concept planned?** _Interim assumption:_ none;
  `tenant` is specified but optional. The board shows no tenant element either. _Affects:_
  `MutationAccessSet.tenant`.
- **OQ-8 — Is there a server-side audit trail, and what id joins a client event to it?**
  _Interim assumption:_ correlate on the `X-Request-Id` the client already generates (issue
  #115). _Affects:_ nothing in the schema above.
- **OQ-9 — Will this ship inside user-service's pinned `.github/graphql-spec/spec`?** crm's
  codegen and its `contract testing` / `contract drift` gates read only that pin. _Interim
  assumption:_ yes. _Affects:_ delivery, not shape.

Retired by the board, recorded so a reader of the previous version knows why they vanished:

- **OQ-3** (product role names versus `ROLE_*`) — moot. Roles are runtime entities with
  server-owned names; the client no longer maps them into a closed union to make a decision.
- **OQ-7** (is `resource:action` the agreed naming scheme) — answered: no. The key is a mutation.
- **OQ-12** (how to represent `ROLE_SERVICE`) — moot for the same reason as OQ-3.

Three further questions govern client-internal behaviour rather than this schema and are
intentionally not repeated here: **OQ-5** (can a grant shrink mid-session), **OQ-10** (whether
object-level rules become server data — now largely subsumed by OQ-15), and **OQ-11**
(fail-closed UX acceptability).

## What accepting this proposal does not require

- No change to the existing `User` type or its mutations — the access read is additive.
- No change to token issuance, `AuthTokenFactory`, or the `subject`/`sid` claims the client
  already reads
  ([D7](../../../specs/114-access-rbac-tenant-audit/planning-artifacts/architecture-114-access-rbac-tenant-audit-2026-09-08.md#d7--read-both-subject-and-sub)).
- No IAM administration screens in crm as a precondition — the access read stands alone, and the
  IAM half can be accepted, deferred or rejected separately.
- No coordinated cutover — the client adopts this behind a default-off runtime flag
  (`accessSource`, issue #145) and can be enabled per environment or rolled back with a container
  restart, never a redeploy.

## Reviewing this proposal

A reviewer should respond against the field list and the open questions above, not against client
source, which this proposal is written to be independent of. The three most valuable answers, in
order, are OQ-17 (does this agree with what the server actually enforces), OQ-13 (what exactly is
the key) and OQ-15 (how object-level rules fit) — the rest are shape questions that a schema and
adapter change absorbs.

The single most useful correction a reviewer can make is to say where this document has
misread the board, since the reading is unverified since June 2026 and was taken from an
accessibility outline rather than from the diagram itself.
