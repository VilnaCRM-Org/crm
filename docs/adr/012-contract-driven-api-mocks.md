# ADR-012: Contract-driven API mocks: Mockoon for REST, Apollo Server for GraphQL

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-20

**Technical Story**: Pull request [#15](https://github.com/VilnaCRM-Org/crm/pull/15)
(2025-09-23) added `Mockoon.Dockerfile` and `Apollo.Dockerfile` to the compose stack so the
frontend could run and be tested without a deployed `user-service`. The choice of two mock
servers, one per protocol, was never written down, and the enterprise readiness audit (issue
[#136](https://github.com/VilnaCRM-Org/crm/issues/136), section G) asked for it to be. The
contract pins those mocks are built from were later made a gate by issues
[#111](https://github.com/VilnaCRM-Org/crm/issues/111),
[#177](https://github.com/VilnaCRM-Org/crm/issues/177) and
[#178](https://github.com/VilnaCRM-Org/crm/issues/178).

## Context and Problem Statement

The frontend talks to `user-service` over two protocols: REST, described by an OpenAPI
document, and GraphQL, described by an SDL schema. Every local run, every Playwright, visual,
Lighthouse, load and memory-leak suite, and every PR sandbox needs a backend that answers both,
deterministically, without network access to a real deployment and without credentials. A
mock that drifts from the real contract is worse than none: it lets a screen pass every suite
and fail on first contact with production.

## Decision Drivers

- Both protocols must be served from the **upstream contract documents**, not from
  hand-written fixtures that can drift
- The contract version has to be a pin the repository reads, so a bump is a reviewable diff
- The mocks run in Docker beside the app, in CI and locally alike, with healthchecks the
  suites can wait on
- The GraphQL mock has to enforce the same validation the real mutation does (invalid email,
  duplicate user), because the registration flow's error views are what the tests exercise

## Considered Options

1. **Mockoon CLI for REST plus a hand-written Apollo Server for GraphQL** — Mockoon serves the
   OpenAPI document directly; Apollo loads the pinned SDL and implements the few resolvers the
   app calls.
2. **Mock Service Worker in the browser** — intercept both protocols in the page.
3. **A single custom mock server** — one Express or Fastify app serving both protocols from
   hand-written handlers.
4. **A shared staging deployment of `user-service`** — no mocks; every suite hits a real
   backend.

## Decision Outcome

Chosen option: **"Mockoon plus Apollo Server"**, because each tool consumes its protocol's
contract document natively and the pins that select the documents are gated. The artifacts:

- `Mockoon.Dockerfile` downloads the OpenAPI document from the `user-service` tag it names,
  verifies it against `OPENAPI_SPEC_SHA256`, and serves it with `@mockoon/cli` on port 8080;
  `REACT_APP_MOCKOON_URL` points the app at it. `make codegen-check` fails when that tag and
  `OPENAPI_SPEC_VERSION` in `.env.example` disagree (`scripts/check-contract-versions.sh`).
- `Apollo.Dockerfile` builds `docker/apollo-server/`, which loads the SDL pinned by
  `GRAPHQL_SCHEMA_VERSION`, implements `createUser` with the real validation and conflict
  semantics in `resolvers.ts`, and listens on `GRAPHQL_PORT`; `REACT_APP_GRAPHQL_URL` points
  the app at it.
- Both pins live in the tracked `.env.example` (issue #142) and are read by `make codegen`,
  `make codegen-check`, `make contract-diff` and `make check-contract-drift`, so the generated
  types, the zod boundary validation and the mocks all describe one version.
- The compose files carry a healthcheck per mock — an HTTP fetch for Mockoon, a posted
  `{__typename}` query for Apollo — and the images carry the same probe as a `HEALTHCHECK`
  (issue #139).
- Unit and integration tests use `msw` in-process instead; the containers exist for the
  browser-level suites and for `make start`.

## Positive Consequences

- A contract bump is one pin change that the codegen, the diff gate, the drift monitor and both
  mocks all follow; nothing has to be re-recorded.
- Every browser suite runs offline and deterministically, in CI and in a PR sandbox.
- The GraphQL mock rejects what the real service rejects, so the registration error views are
  tested against realistic responses rather than fixtures.

## Negative Consequences

- The Apollo resolvers are hand-written, so they cover only the operations the app calls;
  adding a GraphQL operation means adding a resolver and its validation, not just a query.
- Mockoon serves the OpenAPI examples verbatim, so a response the spec under-specifies is
  under-specified in the mock too; a scenario that needs a specific body is an e2e concern.
- Two mock runtimes are two images to keep healthy, pin and scan; the supply-chain lanes cover
  them, but they are cost.

## Pros and Cons of the Options

### Mockoon plus Apollo Server

One tool per protocol, each fed by its contract document.

#### Good (Mockoon plus Apollo)

- Native consumption of OpenAPI and SDL; the pin is the single source of truth
- Runs as ordinary compose services with healthchecks

#### Bad (Mockoon plus Apollo)

- Two runtimes, two Dockerfiles
- Resolver logic is hand-maintained

### Mock Service Worker in the browser

Intercept fetches in the page.

#### Good (MSW)

- Already used in unit and integration tests; one mocking vocabulary

#### Bad (MSW)

- A service worker inside the page under test changes what Lighthouse, the load suite and the
  memory-leak harness measure; the production image would have to ship it

### A single custom mock server

One hand-written server for both protocols.

#### Good (custom)

- One runtime

#### Bad (custom)

- Hand-written REST handlers drift from the OpenAPI document; the contract pin would gate
  nothing

### A shared staging deployment

No mocks.

#### Good (staging)

- Real behaviour

#### Bad (staging)

- Network, credentials and shared state in every CI run; non-deterministic suites; nothing
  runs offline

## Links

- [Pull request #15 — Docker support with the two mocks](https://github.com/VilnaCRM-Org/crm/pull/15)
- [Issue #111 — typed API contracts](https://github.com/VilnaCRM-Org/crm/issues/111)
- [Issue #177 — semantic contract diff](https://github.com/VilnaCRM-Org/crm/issues/177)
- [Issue #178 — upstream drift monitor](https://github.com/VilnaCRM-Org/crm/issues/178)
- [Issue #136 — enterprise readiness audit, section G](https://github.com/VilnaCRM-Org/crm/issues/136)
- [`src/api/contracts/README.md`](../../src/api/contracts/README.md) — the contract gates
