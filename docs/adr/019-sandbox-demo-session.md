# ADR-019: Pull-request sandboxes get a host-gated demo login and a 404.html shell

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-10-07

**Technical Story**: [#309](https://github.com/VilnaCRM-Org/crm/issues/309) ships the 404, 403
and 5xx error pages, and reviewing them on the pull-request sandbox showed that no page behind
sign-in, and no deep link at all, could be reached there.

## Context and Problem Statement

A pull-request sandbox is built by the `sandbox-crm-creation` CodePipeline in
`VilnaCRM-Org/crm-infrastructure`: it clones the branch, runs `make build-out` — the
`production` Dockerfile target, the same bundle that ships — and syncs `./out` to an S3 static
website whose index document is `index.html` and whose error document is `404.html`. The
pipeline is not changing, so whatever a sandbox needs has to be in the production bundle.

Two things break a sandbox review. The build never emitted `404.html`, so every deep link —
`/sign-in`, `/forbidden`, `/settings` — got S3's own error page and the SPA never booted. And no
backend is deployed beside the sandbox (the API URLs point at `localhost`), so a real login can
never succeed: every protected page, including the 403 page this issue adds, is out of reach.
The auth token is memory-only, so a reviewer cannot hand-seed one, and the test-harness seed of
issue #158 is compiled out of the production bundle on purpose.

## Decision Drivers

- The sandbox pipeline keeps running `make build-out`; no infrastructure change
- Production, on any host that is not a sandbox, must behave exactly as before
- The activation check must be exact and ReDoS-safe (`security/detect-unsafe-regex` is an error)
- The auth paint path stays container-free, and the store receives every collaborator through
  DI (issues #115, #130)
- A reviewer must stay signed in across a reload or a deep link, or every deep link sends them
  back to sign-in

## Considered Options

1. **Host-gated demo login in the production bundle, plus a `404.html` copy in every build**
2. **Compile-time sandbox build** — a separate Docker target that compiles the demo in, which
   the pipeline would build instead of `production`.
3. **Mock backend in the sandbox** — deploy Mockoon or the Apollo mock beside the bucket.
4. **Infrastructure-only fallback** — point the S3 error document at `index.html` and leave the
   login unreachable.

## Decision Outcome

Chosen option: **"Host-gated demo login in the production bundle, plus a `404.html` copy in
every build"**, because it is the only option that works with the unchanged pipeline while
keeping production inert.

- `scripts/spa-fallback-document-plugin.ts` is registered for every build in
  `rsbuild.config.ts`; after the build it copies `index.html` byte for byte to `404.html`.
- `src/config/env/sandbox-demo-session-provider.ts` (`SandboxDemoSessionProvider`) is active
  when `NODE_ENV !== 'production'` or the hostname starts with `sandbox-crm-`, ends with
  `.amazonaws.com`, and has an `s3-website` or `s3-website-<region>` label — checked with
  `startsWith`, `endsWith` and `split`, no regular expression. The location and the storage are
  constructor parameters defaulting to `globalThis`.
- While active, `signIn` accepts exactly `demo@vilnacrm.com` / `Demo1234` and writes the demo
  email to `localStorage` under `vilnacrm.sandbox-demo-session`; `restore` turns the marker back
  into the demo session; `signOut` removes it. Every storage call is wrapped, so refused storage
  means no persistence. Inactive, `signIn` and `restore` return `null`.
- The user module's composition root registers the provider by value under
  `AUTH_TOKENS.SandboxDemoSessionProvider`, and `AuthStoreActions` receives it through
  `AuthStoreActionsDeps`. `login` asks it before the repository unless the signal is already
  aborted; a match settles exactly as a successful repository login, with no network call.
  `AuthStateVar` calls `restore()` when it is created, and the auth composition root's `logout`
  calls `signOut()`.

## Positive Consequences

- Every deep link on a sandbox loads the SPA, so the router renders the 404, 403 and 5xx pages
  and protected routes redirect to sign-in as they do in production
- A reviewer signs in with `demo@vilnacrm.com` / `Demo1234`, reaches every protected page, and
  stays signed in across reloads and deep links until signing out
- No pipeline, Dockerfile or Makefile change. `make check-auth-seed-gate` scans the shipped
  `production` image: besides proving the #158 seed absent, its `--expect absent` run now fails
  unless the bundle keeps the demo provider (its storage key `vilnacrm.sandbox-demo-session` and
  the demo email, both of which survive minification) and a `404.html` byte-identical to
  `index.html`, so a bundler change cannot silently strip what sandboxes rely on

## Negative Consequences

- The demo code and its credentials ship in every production bundle. They are inert off sandbox
  hosts only because of the hostname check, which unit tests pin against the production domain,
  `localhost`, a missing location and look-alike hosts; there is no emitted-bundle proof of
  absence as there is for the #158 seed
- On a sandbox, anyone who reads the published credentials signs in. That is acceptable only
  because a sandbox has no backend and no data; the demo token is a non-secret placeholder the
  API would reject
- The demo session is persisted in `localStorage` on sandbox hosts and in development, while
  real tokens stay memory-only; the marker holds the demo email only
- S3 serves `404.html` with HTTP status 404 for a deep link; a browser renders it normally, but a
  crawler or a status probe sees 404 on routes that exist. Production's CDN rewrites
  extension-less paths to `index.html`, so it normally never serves `404.html`
- A development build accepts the demo credentials on any host

## Pros and Cons of the Options

### Host-gated demo login in the production bundle, plus a `404.html` copy in every build

One bundle; the demo activates at runtime on sandbox hosts only.

#### Good (Host-gated demo login in the production bundle, plus a `404.html` copy in every build)

- Works with the pipeline exactly as it is
- One artifact for production and sandboxes, so a sandbox reviews what ships

#### Bad (Host-gated demo login in the production bundle, plus a `404.html` copy in every build)

- Production carries inert demo code; correctness rests on the hostname check and its tests

### Compile-time sandbox build

A separate build stage opts the demo in; the production bundle never contains it.

#### Good (Compile-time sandbox build)

- Production cannot contain the demo, provably, from the emitted bundle

#### Bad (Compile-time sandbox build)

- Needs the infrastructure pipeline to build a different target, which is not changing
- A sandbox would review a different artifact from the one that ships

### Mock backend in the sandbox

Deploy Mockoon or the Apollo mock beside the bucket and point the sandbox build at it.

#### Good (Mock backend in the sandbox)

- The real login and registration flows run unchanged

#### Bad (Mock backend in the sandbox)

- New always-on infrastructure per pull request, and a CORS and CSP change to reach it
- Still leaves deep links broken without the `404.html` fallback

### Infrastructure-only fallback

Set the S3 error document to `index.html` in crm-infrastructure.

#### Good (Infrastructure-only fallback)

- No application change

#### Bad (Infrastructure-only fallback)

- Protected pages stay unreachable because no login can succeed, and it is an infrastructure
  change

## Links

- [Issue #309: error pages](https://github.com/VilnaCRM-Org/crm/issues/309)
- [Issue #158: preloaded-auth-token seed gate](https://github.com/VilnaCRM-Org/crm/issues/158)
- [ADR-018: Route error responses render the designed error pages](./018-route-error-status-pages.md)
