# ADR-019: Pull-request sandboxes ship a compile-guarded demo login and a 404.html shell

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-10-07

**Technical Story**: [#309](https://github.com/VilnaCRM-Org/crm/issues/309) ships the 404, 403
and 5xx error pages, and reviewing them on the pull-request sandbox showed that no page behind
sign-in, and no deep link at all, could be reached there.

## Context and Problem Statement

A pull-request sandbox is built by the `sandbox-crm-creation` CodePipeline in
`VilnaCRM-Org/crm-infrastructure`: it clones the branch, runs `make build-out`, and syncs `./out`
to an S3 static website whose index document is `index.html` and whose error document is
`404.html`. Production is built by the same `make build-out`, from the same `production`
Dockerfile target.

Two things break a sandbox review. The build never emits `404.html`, so every deep link —
`/sign-in`, `/forbidden`, `/settings` — gets S3's own error page and the SPA never boots. And
no backend is deployed beside the sandbox (the API URLs point at `localhost`), so a real login
can never succeed: every protected page, including the 403 page this issue adds, is out of
reach. The auth token is memory-only, so a reviewer cannot hand-seed one either, and the
test-harness seed of issue #158 is deliberately absent from a deployable artifact.

Anything added to the `production` target reaches production, so the fix cannot live there.

## Decision Drivers

- The deployable `production` artifact must not gain a login bypass, a new flag, or a new file
- An opt-in must be impossible to set from a dotenv file, exactly like the issue-#158 seed
- The proof that the demo login is absent has to be made against the emitted bundle, with a
  positive control so the scan cannot pass vacuously
- The auth paint path stays container-free, and the store receives every collaborator through
  DI (issues #115, #130)
- The sandbox must work with the existing S3 website configuration, with no CloudFront in front

## Considered Options

1. **Sandbox Docker target with a compile-guarded demo login and a `404.html` copy** — a
   `build-sandbox` stage sets `ENABLE_SANDBOX_DEMO=true`, and `make build-out-sandbox` extracts
   it.
2. **Mock backend in the sandbox** — deploy Mockoon or the Apollo mock beside the bucket.
3. **Runtime switch** — read a flag from the runtime-config block or the hostname and enable
   the demo login when it says "sandbox".
4. **Infrastructure-only fallback** — point the S3 error document at `index.html` and leave the
   login unreachable.

## Decision Outcome

Chosen option: **"Sandbox Docker target with a compile-guarded demo login and a `404.html`
copy"**, because it is the only option that leaves the `production` artifact byte-for-byte
unaware of the demo while making the sandbox reviewable without new infrastructure.

- `src/config/env/sandbox-demo-session.ts` (`SandboxDemoSessionSeed`) has one method,
  `sessionFor(credentials)`. It returns `null` unless
  `NODE_ENV !== 'production' || ENABLE_SANDBOX_DEMO === 'true'`, and then returns the demo
  session only for `demo@vilnacrm.com` / `Demo1234`. The guard, both credential literals and
  the token literal sit in that one method body, so Rspack folds the guard and drops the rest
  in every production build that did not opt in. A development build is not guarded and
  accepts the demo credentials.
- The user module's composition root registers the seed by value under
  `AUTH_TOKENS.SandboxDemoSessionSeed` and hands it to `AuthStoreActions` through
  `AuthStoreActionsDeps`. `AuthStoreActions.login` asks it first: a match settles exactly as a
  successful repository login (`applyLogin`, then `loginSettled`, which tags the opaque
  observability identity), and the repository — so the network — is never called. A login
  whose signal is already aborted skips the seed and settles as aborted, so a canceled attempt
  never publishes a session.
- `rsbuild.config.ts` reads `ENABLE_SANDBOX_DEMO` before `loadEnv`, defines it for the bundler,
  and only when it is `true` registers `scripts/spa-fallback-document-plugin.ts`, which copies
  the built `index.html` byte for byte to `404.html` after the build.
- The Dockerfile's `build-sandbox` stage sets the flag; the `sandbox` target is `serve-base`
  plus that bundle. `make build-out-sandbox` extracts it to `./out`.
- `make check-auth-seed-gate` now proves both seams: the `production` image and an unflagged
  source build must contain neither the demo flag, the demo credentials, the demo token, nor
  `404.html`; the `sandbox` image must contain the demo login and a `404.html` identical to
  `index.html`, and no test-harness seed.

## Positive Consequences

- Every deep link on a sandbox loads the SPA, so the router renders the 404, 403 and 5xx
  pages and protected routes redirect to sign-in as they do in production
- A reviewer signs in with `demo@vilnacrm.com` / `Demo1234` and reaches every protected page
- The `production` target, its `build` stage and `make build-out` are unchanged, and the gate
  proves on every pull request that the deployable image carries no trace of the demo

## Negative Consequences

- S3 serves `404.html` with HTTP status 404 for a deep link; a browser renders it normally,
  but a crawler or a status probe sees 404 on routes that exist
- The demo session is client-only on a public bucket: anyone who knows the published
  credentials signs in to a sandbox. That is acceptable only because a sandbox has no backend
  and no data; it would be an auth bypass anywhere else, which is what the gate prevents
- The sandbox only benefits once
  [VilnaCRM-Org/crm-infrastructure#60](https://github.com/VilnaCRM-Org/crm-infrastructure/pull/60)
  lands: its buildspec probes `make -n build-out-sandbox` and falls back to `make build-out`, so
  until then a sandbox is built from the production bundle
- A dev server (`NODE_ENV=development`) also accepts the demo credentials, the same way it
  accepts the issue-#158 seed
- The `sandbox` image's `404.html` is copied at build time, so the container entrypoint's
  `APP_CONFIG_*` rewrite of `index.html` does not reach it; S3 runs no entrypoint, and `serve`
  answers deep links from `index.html`, so neither consumer reads the stale copy

## Pros and Cons of the Options

### Sandbox Docker target with a compile-guarded demo login and a `404.html` copy

A separate build stage opts in; the deployable stage cannot.

#### Good (Sandbox Docker target with a compile-guarded demo login and a `404.html` copy)

- Production cannot receive the demo by ARG, ENV or dotenv, and the emitted-bundle scan proves it
- Reuses the issue-#158 pattern, invariants and gate, so there is one way to ship a test seam

#### Bad (Sandbox Docker target with a compile-guarded demo login and a `404.html` copy)

- Takes effect only with the crm-infrastructure buildspec change in
  [crm-infrastructure#60](https://github.com/VilnaCRM-Org/crm-infrastructure/pull/60)
- Adds a fourth build to the seed gate's CI job

### Mock backend in the sandbox

Deploy Mockoon or the Apollo mock beside the bucket and point the sandbox build at it.

#### Good (Mock backend in the sandbox)

- The real login and registration flows run unchanged

#### Bad (Mock backend in the sandbox)

- New always-on infrastructure per pull request, and a CORS and CSP change to reach it
- Still leaves deep links broken without the `404.html` fallback

### Runtime switch

Read a flag at runtime and enable the demo login when it is set.

#### Good (Runtime switch)

- One artifact serves both production and sandboxes

#### Bad (Runtime switch)

- The demo code and credentials ship in the production bundle, one misconfigured value away
  from an auth bypass — exactly what issue #158 rules out

### Infrastructure-only fallback

Set the S3 error document to `index.html` in crm-infrastructure.

#### Good (Infrastructure-only fallback)

- No application change

#### Bad (Infrastructure-only fallback)

- Protected pages stay unreachable because no login can succeed

## Links

- [Issue #309: error pages](https://github.com/VilnaCRM-Org/crm/issues/309)
- [Issue #158: preloaded-auth-token seed gate](https://github.com/VilnaCRM-Org/crm/issues/158)
- [ADR-018: Route error responses render the designed error pages](./018-route-error-status-pages.md)
