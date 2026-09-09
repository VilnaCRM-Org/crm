# API contracts & the REST-vs-GraphQL boundary

This document is the single, enforced rule for how the frontend talks to the backend
(issue #111). It defines which transport a feature uses, how the request/response types are
generated, and how both boundaries are runtime-validated. Every agent applies the same rule
so 50+ pages do not each guess a different transport or hand-write drifting types.

## Single source of truth per transport

Backend shapes are **generated**, never hand-written:

- **GraphQL** — the upstream user-service SDL (`GRAPHQL_SCHEMA_VERSION` in `.env`) plus the
  operation documents colocated with their repositories (`src/modules/**/*.graphql`) generate
  `src/api/generated/graphql.ts` (operation + result types and `TypedDocumentNode`s) via
  `codegen.ts` (`@graphql-codegen/*`).
- **REST** — the upstream user-service OpenAPI spec (`OPENAPI_SPEC_VERSION` in `.env`)
  generates `src/api/generated/openapi.ts` (path/operation/response types) via
  `openapi-typescript`.

Both run through `make codegen` (script: `scripts/codegen.sh`). The two upstream versions are
reconciled to a single pinned version and asserted equal by
`scripts/check-contract-versions.sh`.

## The transport decision rule

Choose the transport by the nature of the endpoint, not by convenience:

- **Use GraphQL (Apollo `ApolloClient`)** for reads and mutations of the user/account domain
  graph — the entities the GraphQL schema models (`User` and its relations) and their
  create/update/delete mutations. New user-graph features add a colocated `*.graphql` operation
  next to their repository and consume the generated `TypedDocumentNode`.
- **Use REST (`HttpsClient`)** for endpoints that are **not** part of the GraphQL schema:
  session/token exchange (login), health checks, binary/file transfer, and any infrastructure
  or third-party endpoint the OpenAPI spec models but the graph does not.
- **When both transports expose the same resource** (today `/api/users`), prefer GraphQL for
  the write (`createUser`) and reserve REST for the token/session concern (`login`).

The transport is an implementation detail of the **repository** layer. Components and hooks
never see transport types — they consume repository return types (see the layered architecture
in `.claude/skills/architecture/SKILL.md`).

## Runtime validation at both boundaries

Data is **parsed, never cast**, before it leaves the repository layer:

- **REST** — `HttpResponseProcessor.process(response, schema)` validates every JSON body with a
  zod schema. There is no unchecked `as T`. Repositories pass the generated-shape schema (e.g.
  `LoginResponseSchema`); a schema violation becomes a typed `HttpError`
  (`INVALID_RESPONSE_SHAPE`), not a crash or a corrupted record.
- **GraphQL** — `RegistrationAPI` validates the Apollo result with `CreateUserResultSchema`
  before returning; an invalid payload becomes a typed `ApiError` (`VALIDATION`).

Hand-authored zod schemas live beside their repository (`@auth/utils/response-schemas.ts`) and
mirror the generated types; a parity test asserts the schema accepts the generated shape so the
two cannot drift silently.

## Generated artifacts are build output

Files under `src/api/generated/**` are **generated** and must never be hand-edited. To change
them, change the source spec/operation and rerun `make codegen`. They are excluded from the
source gates (ESLint, dependency-cruiser, jscpd, rust-code-analysis metrics, Prettier, Jest
coverage) the same way generated i18n JSON is — via the gate configs, never with inline
lint-suppression directives.

CI enforces sync: the `static testing` workflow runs `make codegen-check`, which reconciles the
pinned versions, regenerates, and fails on any diff under `src/api/generated/**`.

## Reconciling / bumping the contract version

1. Update `GRAPHQL_SCHEMA_VERSION` and `OPENAPI_SPEC_VERSION` in `.env` (keep them equal) and
   the OpenAPI pin in `Mockoon.Dockerfile`.
2. Run `make codegen` and commit the regenerated `src/api/generated/**`.
3. `make codegen-check` must pass. A deliberate, temporary skew must be documented here and
   opted in with `ALLOW_CONTRACT_VERSION_SKEW=1`.
4. `make contract-diff` must pass — the semantic gate below classifies what the bump actually
   changed.

## Semantic breaking-change gate (issue #177)

`make codegen-check` is **syntactic**: it proves the pins agree and that `src/api/generated/**`
was regenerated. It cannot see what the delta _means_, so a bump that makes a request field
required, narrows an enum, changes a branched-on status code, or removes an error response
regenerates cleanly and merges green while breaking this client against the real backend.

`scripts/ci/contract-diff.sh` (`make contract-diff`, run by the `contract testing` workflow on
every pull request) closes that. It compares `OPENAPI_SPEC_VERSION` against the base branch and:

- fast-exits 0 when the pin is unchanged, so the check is safe to require on every pull request
  — there is deliberately no `paths:` filter, because a path-filtered required check never
  reports on the pull requests it skips;
- otherwise fetches both pinned specs and runs digest-pinned `oasdiff breaking --fail-on ERR`,
  appending the full `oasdiff changelog` to the job summary for review;
- fails loudly on any fetch or base-ref failure, never skipping as a pass.

WARN-level findings do not fail the gate; they appear in the changelog. `ERR` is the bar that
binds, which keeps the false-positive rate low enough that the gate is never routed around.

### Acknowledging an upstream break

An upstream break that this client is verified unaffected by is recorded in
[`breaking-changes-approved.txt`](breaking-changes-approved.txt), which the gate passes to
`oasdiff --err-ignore`. There is no env-var bypass: every acknowledgement is a reviewed diff.
Each entry needs a comment naming the change and why it is safe here, and stale entries are
pruned on the next bump.

**Scope: OpenAPI only.** The GraphQL half of the same bump — whose version
`scripts/check-contract-versions.sh` asserts equal — still has no semantic diff. That follow-up
(a pinned `graphql-inspector diff`) is tracked in issue #178's phase 2 and is deliberately out
of scope here.

## Upstream drift monitor (issue #178)

Every gate above answers "does the app match the pin?". `scripts/ci/check-contract-drift.sh`
(`make check-contract-drift`, run weekly by the `contract drift` workflow) answers the other
question: "does the pin still match reality?" It resolves the highest upstream version as the
maximum of `releases/latest` and the highest semver tag — `releases/latest` is the most
recently _published_ release, which upstream does not publish in version order — and upserts a
single `contract-drift`-labelled issue when the pins fall behind.

The policy is asymmetric on purpose: a bare version gap never fails the run (red-run spam while
intentionally behind trains everyone to ignore the signal), while an upstream lookup failure
always does — a dead monitor is worse than none.
