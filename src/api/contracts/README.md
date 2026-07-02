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
