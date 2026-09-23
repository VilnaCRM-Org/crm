# Runbook: `contract-drift`

**Signal.** `.github/workflows/contract-drift.yml` runs `sh scripts/ci/check-contract-drift.sh`
weekly, the same script `make check-contract-drift` runs locally. It resolves the latest
`user-service` version as the higher of `releases/latest` and the highest
semver tag, compares it with `OPENAPI_SPEC_VERSION` and `GRAPHQL_SCHEMA_VERSION` in
`.env.example`, and upserts one issue labelled `contract-drift` when either pin is behind. A
bare version gap never reds the run; an upstream lookup failure always does.

**What it means.** The frontend is built and tested against an older API contract than the
backend publishes. Nothing is broken yet — the mocks, the generated types and the zod
validation all agree with each other — but every week of gap widens the change a bump will
have to absorb.

## Triage

1. Read the issue: the two pins, the upstream version, and the gap.
2. Read the upstream release notes between the pin and the latest version for breaking changes
   to the operations the app calls (`createUser`, the login endpoint, the user resource).

## Fix

Take the bump as one pull request:

1. Move both pins in `.env.example` to the new tag, and the tag named in `Mockoon.Dockerfile`
   with it; `make codegen-check` fails when they disagree.
2. Run `make codegen` and commit the regenerated `src/api/generated/**`.
3. Run `make contract-diff`. An `ERR`-level OpenAPI breaking change or a GraphQL breaking
   change fails it; if the break is intended upstream, record it in
   `src/api/contracts/breaking-changes-approved.txt` (OpenAPI) or
   `src/api/contracts/graphql-breaking-changes-approved.txt` (GraphQL) as a reviewed diff,
   never as an environment-variable bypass.
4. Run `make lint` and `make test-unit-all`; the browser suites will exercise the new mocks in
   CI.

The full procedure, including how the diff gate reads the pin, is in
`src/api/contracts/README.md`.

## Resolution

The monitor does not close this issue. Close it once the bump has merged; the next weekly run
reports the pins current and files nothing.
