# Environment configuration (`@/config/env`)

Single, typed, validated source of truth for the environment-derived configuration that
`src/` consumes. Replaces the scattered, contradictory raw `process.env` reads that used to
live in `url-builder`, `get-graphql-url`, and the auth store (issue #112).

This is the **build-time** layer: `REACT_APP_*` values are inlined into the bundle, so changing one
requires a rebuild. Configuration an administrator can change **without** a rebuild lives in the
sibling **runtime** layer, `@/config/runtime` (issue #145), which reuses the two-layer split below
for the same paint-path reason. Where both define a setting (`graphqlUrl`, the REST base URL), the
runtime value wins and the build-time value is the default. See
[`../runtime/README.md`](../runtime/README.md).

## Why a two-layer module

`REACT_APP_*` variables are inlined by RSBuild at **build time** (`loadEnv` +
`source.define`), so each must be read as a **static `process.env.<LITERAL>`** access — a bare
`process.env` object or a dynamic `process.env[key]` is empty in the browser bundle. The auth
page also has a CI-gated Lighthouse budget: `zod` (and `tsyringe`, Apollo) are deliberately kept
off the paint path via the dynamic-import composition root. A single zod-backed module would drag
`zod` into any chunk that reads config — including the paint path.

The module is therefore split in two:

| File                      | Deps        | Reads          | Use it from                          |
| ------------------------- | ----------- | -------------- | ------------------------------------ |
| `raw-env.ts`              | none        | lazy, per call | paint path / any zod-free code       |
| `env.ts`                  | `zod`       | once, frozen   | non-paint code wanting typed config  |
| `env-schema.ts`           | `zod`       | —              | the zod contract (constraints)       |
| `types/env.ts`            | none (type) | —              | the hand-authored `Env` interface    |
| `preloaded-auth-token.ts` | none        | lazy, per call | the auth store's initial seed (only) |

- **`raw-env`** (`@/config/env/raw-env`) — a dependency-free singleton and, with the seed seam
  below, one of the two sanctioned places that touch `process.env`. Accessors are lazy (read on
  each call) so the
  build-inlined literals stay static and tests can mutate `process.env` per case. Import it
  **directly** (not via the barrel) on the paint path so the barrel's `zod` edge is not pulled in.
- **`env`** (`@/config/env`) — parses `raw-env`'s snapshot through the zod schema **once** at
  module load, freezes it, and **fails fast** with an aggregated (`z.prettifyError`) message
  naming every offending variable. It is consumed by `get-graphql-url` (which lives behind the
  dynamic-import Apollo/DI composition root, where `zod` already resides), so validation runs when
  that functional-core chunk loads — never on the auth paint path.
- **`preloaded-auth-token`** — the test-only seed seam, see below. It reads `process.env` directly
  and is deliberately **not** part of `raw-env`/`env`: routing it through either would inline the
  token into every production bundle, because both are reachable from every chunk.

The hand-authored `Env` interface (not `z.infer`) mirrors the existing
`api-responses.ts` ↔ `response-schemas.ts` split: a `types/` file may not import the runtime
schema (dependency-cruiser `type-files-no-runtime-imports`). The schema and interface are kept in
sync by the typed `private readonly values: Env` assignment in `env.ts` (a compile-time check that
the parse result matches `Env`).

## Validation policy

App-configuration variables **fail fast** on malformed input: `graphqlUrl`/`mockoonUrl` are
validated as URLs and `mainLanguage`/`fallbackLanguage` as the `['uk','en']` enum, so a typo throws
an aggregated startup error. `NODE_ENV` is the exception — it is a runtime/build flag that can vary
by environment, so its enum uses `.catch(undefined)`: an unrecognised value degrades to
"not production" (matching the previous `NODE_ENV === 'production'` compare) rather than crashing
the app. Every field is `optional`, because each reader supplies its own default/fallback (empty
mockoon URL, localhost GraphQL URL in dev, `uk`/`en` languages), so absence is valid; only a
_present but malformed_ value fails.

## Enforcement

`eslint.config.mjs` bans raw `process.env` reads in non-React application code
(`src/**/*.ts`, the same scope as the no-free-functions gate #100) via `no-restricted-syntax`.
`src/config/env/**` is the single exemption. Intentionally **out of this `.ts` scope**:

- React components (`.tsx`) reading `NODE_ENV` — e.g. the error boundaries and
  `auth-error-boundary/index.tsx`. `.tsx` is exempt from the non-React `.ts` boundary the ban
  mirrors, and the auth error boundary is on the Lighthouse-budgeted paint path.
- `src/i18n.js` (app boot/paint path — must stay zod-free) and `src/config/i18n-config.js`
  (CommonJS, `require`d by the e2e/memory-leak node tooling without a TS loader, so it cannot import
  the `.ts` config). Their `uk`/`en` default-vs-throw policies are left as-is here.

**Paint-path caveat:** the barrel `@/config/env` re-exports `env`/`EnvSchema`, which pull `zod`.
Paint-reachable code must import `@/config/env/raw-env` **directly**, never the barrel. This is a
convention today (no gate enforces it — a dependency-cruiser guard is deferred to avoid editing
`.dependency-cruiser.js` while the route-registry PR owns it).

`.env.example` mirrors every key of `.env`; `make check-env-sync` (wired into `make lint` and the CI
lint matrix) fails if the two drift. A separate unit test
(`tests/unit/config/env/env-example-schema-sync.test.ts`) fails if a zod schema field and its
`.env.example` entry diverge, so schema-vs-template drift is caught in CI.

## The preloaded-auth-token seed (issue #158)

`preloaded-auth-token.ts` seeds the auth store's initial token from
`window.__PRELOADED_AUTH_TOKEN__` or `REACT_APP_LHCI_PRELOADED_AUTH_TOKEN`, so the Playwright,
visual, and Lighthouse suites reach the protected `/` route without a real login. Since
`isAuthenticated` is `!!token`, an ungated seed is an auth bypass, so the whole seam sits behind

```ts
if (
  process.env.NODE_ENV === 'production' &&
  process.env.ENABLE_PRELOADED_AUTH_TOKEN_SEED !== 'true'
) {
  return null;
}
```

Three invariants keep that guard real, and breaking any of them is a security regression:

1. **The guard and both reads stay in one method.** Rspack folds the condition to a constant and
   drops the rest of the body, but only within a single scope: a private helper method or a
   cross-module call survives minification and ships the window key and the token literal.
   `rsbuild.config.ts` must keep the `process.env.ENABLE_PRELOADED_AUTH_TOKEN_SEED` define — without
   it the expression is left as a runtime `process` read that throws in the browser.
2. **No other `src/` file names either identifier.** `raw-env.ts` used to expose the token; because
   `raw-env` is reachable from every chunk, that inlined the value into all production bundles no
   matter what the auth store did.
3. **Only the ephemeral image opts in.** The Dockerfile's `test-harness` target sets
   `ENABLE_PRELOADED_AUTH_TOKEN_SEED=true`; the deployable `production` target is built from a
   `build` stage that takes no seed ARG.

`tests/unit/tooling/preloaded-auth-seed-gate.test.ts` pins invariants 1–3 as source contracts, and
`make check-auth-seed-gate` (in the `security testing` workflow) proves them against the emitted
bundle: one build must not contain the seam, and the opted-in build must, so the scan cannot pass
against the wrong artifact.

## Adding a variable

1. Add the `REACT_APP_*` key to `.env` **and** `.env.example` (same key set — the sync gate
   enforces it).
2. Add the field to `env-schema.ts` (with its constraint) and to `Env` in `types/env.ts`.
3. Read it in `raw-env.ts` as a **static** `process.env.<LITERAL>` (extend `snapshot()` and add a
   lazy accessor if a paint-path reader needs it), then expose a typed getter on `env.ts` for
   non-paint readers.
4. Never read `process.env` outside this module.

A variable whose **value must not reach a production bundle** is the exception: it does not belong
in `raw-env`/`env` at all, because both are in every chunk's graph and the build-inlined literal
ships regardless of who reads it. Follow `preloaded-auth-token.ts` instead — read it inside a single
guarded method the bundler can fold away.
