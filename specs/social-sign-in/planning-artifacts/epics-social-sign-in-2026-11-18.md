---
status: 'complete'
workflowType: 'epics-and-stories'
bmadCommand: 'create-epics-stories'
project_name: 'crm'
date: '2026-11-18'
slug: 'social-sign-in'
inputDocuments:
  - 'specs/social-sign-in/planning-artifacts/prd-social-sign-in-2026-11-18.md'
  - 'specs/social-sign-in/planning-artifacts/architecture-social-sign-in-2026-11-18.md'
  - 'specs/social-sign-in/planning-artifacts/research-social-sign-in-2026-11-18.md'
---

# Epics and Stories: Social Sign-In

Predecessors: [PRD](prd-social-sign-in-2026-11-18.md) ·
[architecture](architecture-social-sign-in-2026-11-18.md).

Every story's Definition of Done includes: `make format && make lint` clean; unit (and, where
named, integration) tests at 100% coverage; Stryker survivors 0 for touched files; no
suppression of any kind; `uk` + `en` strings with `make lint-i18n` clean.

## Dependency graph

```text
E1 local backend          E2 client foundations                E3 UI
S1.1 mockoon overlays ─┐  S2.1 http credentials ─┐
S1.2 env + make       ─┤  (S2.2 withdrawn)       ─┼─► S2.4 repository+actions ─► S3.2 callback page ─► S3.3 2FA hand-off
S1.3 local guide ◄─────┘  S2.3 contract+schemas ─┘                             ▲        │
                                                  S3.1 error view (component) ─┘        ├─► S4.1 E2E + visual
                          S2.5 initiation (buttons) ─────────────────────────────────── ┘    S4.2 ADR + docs
```

## Epic 1 — Local back-end for social sign-in (FR16-FR19)

### S1.1 Mockoon social OAuth overlays — **independent**

As a developer, I want Mockoon to serve the social endpoints and a mock consent page, so that I
can exercise every outcome without provider accounts.

Acceptance criteria:

- Given `MOCKOON_OAUTH_MODE=mock`, when I open `http://localhost:8080/api/auth/social/google`,
  then I get `302` to `/__mock-oauth/google/authorize?state=…` with `Set-Cookie:
oauth_flow_binding=…; Path=/api/auth/social; HttpOnly; SameSite=Lax` and `Cache-Control:
no-store`.
- Given an unknown provider, then `400` `application/problem+json` with `error_code:
unsupported_provider`.
- The consent page lists, as real links with visible text: Allow (success), Allow (2FA
  account), Deny, and one link per error scenario in architecture §3.5; each targets
  `${MOCKOON_SPA_ORIGIN}/auth/callback/<provider>`.
- The callback route answers every scenario code with the status, body and headers in
  architecture §3.5, and `400 missing_oauth_parameters` when the flow cookie is absent.
- Credentialed CORS: preflight and responses carry `Access-Control-Allow-Origin:
${MOCKOON_SPA_ORIGIN}` and `Access-Control-Allow-Credentials: true`; never `*`.
- Given `MOCKOON_OAUTH_MODE=provider` and `MOCKOON_OAUTH_GOOGLE_CLIENT_ID` set, the Google
  initiate route redirects to `accounts.google.com` with that client ID and the SPA redirect URI;
  a provider without a client ID still uses the mock consent page.
- An unknown mode makes the entrypoint exit non-zero with a message naming the allowed modes.
- A5 outcome: the state is shared through Mockoon global vars (architecture §3.5).
- `Mockoon.Dockerfile` keeps the digest pin, adds no package (the merge is Node, already in the base), keeps the
  healthcheck; `hadolint` clean; `tests/unit/tooling/image-hardening.test.ts` and the Dockerfile
  golden-text tests updated, not weakened.
- `tests/unit/scripts/mockoon-social-oauth.test.js` covers mode selection, unknown mode, CORS
  headers and the generated routes; the built image was probed route by route.

### S1.2 Environment keys and `make mockoon-restart` — **dependent on S1.1**

- `.env.example` gains `OAUTH_MODE=mock`, `OAUTH_SPA_ORIGIN`, and empty
  `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_FACEBOOK_CLIENT_ID`,
  `OAUTH_TWITTER_CLIENT_ID`; `make check-env-sync` passes on a fresh `.env`.
- `docker-compose.yml` maps them to the `MOCKOON_*` variables; `docker-compose.test.yml` pins
  `MOCKOON_OAUTH_MODE=mock`; `make lint-compose` clean.
- `make mockoon-restart` recreates only the `mockoon` service; the Bats make-target manifest
  gets its row; `make lint-shell` clean.
- No client secret key exists anywhere in this repository (NFR13); gitleaks `make
scan-secrets` green.

### S1.3 Local verification guide — **dependent on S1.1, S1.2**

- `docs/social-sign-in-local.md` is the reviewed copy of
  [the bundle guide](local-verification-social-sign-in-2026-11-18.md), with commands that
  `make lint-doc-references` resolves and links `make lint-doc-links` resolves.
- `CONTRIBUTING.md` links it from the local development section.

## Epic 2 — Client foundations

### S2.1 `HttpsClient` credentials option — **independent**

- `RequestConfig.credentials?: RequestCredentials | undefined` reaches `fetch` through
  `HttpRequestConfigBuilder`; omitted means today's behaviour (unit-pinned both ways).
- Integration test proves an msw handler sees the cookie only when `credentials: 'include'`.

### S2.2 Per-provider feature flags — **withdrawn**

Withdrawn on 2026-11-18 with PRD D7: `main` retired every runtime flag before wave 1 started,
and nothing in the requirements needs a kill switch yet.

### S2.3 Pending contract and response schemas — **independent**

- `src/api/contracts/README.md` records both operations under "Pending REST operations" with the
  upstream commit SHA and their removal on the pin bump (PRD D3, revised).
- `SocialCallbackResponseSchema` (discriminated on `2fa_enabled`) and the problem schema live
  in `response-schemas.ts`; unit tests accept both success shapes and reject a body with
  neither `access_token` nor `pending_session_id`.
- Types in `@auth/types/social-sign-in/` are type-only files.

### S2.4 `SocialAuthAPI`, error mapper, `completeSocialSignIn` — **dependent on S2.1, S2.3**

- `SocialAuthAPI.callback` issues `GET {base}/api/auth/social/{provider}/callback?code&state`
  with `credentials: 'include'`, the schema, the caller signal, and **no** `retry` (FR15).
- `SocialAuthErrorMapper` maps every FR12 row; table-driven unit test plus `generic` fallback.
- `authActions.completeSocialSignIn` sets the token on success, returns the two-factor variant
  untouched, and reports failures through `AuthSecuritySignals` with a reason code (NFR10).
- `piiScrubber` scrubs `code`, `state`, `pending_session_id`, `access_token`, `refresh_token`
  (NFR7), unit-pinned.
- Integration suite covers every FR12 response, timeout (`RequestDeadline`) and abort.
- Tokens registered in `modules/user/config/{tokens,di}.ts`; DI gates green.

### S2.5 Initiation from the provider buttons — **independent**

As a user, I want a provider button to take me to the provider in the same tab, so that I come
back signed in to the same app.

- Clicking a button calls `window.location.assign` with
  `{apiBaseUrl}/api/auth/social/<provider>` (FR1) — unit test asserts the URL; no new tab.
- The destination from `location.state.from` is saved when internal, else `/` (FR2); storage
  that throws does not block navigation.
- After the first click all provider buttons and form controls are inert (FR3); a second click
  causes no second navigation.
- All four buttons stay rendered (FR4); the DOM and visual baselines are unchanged (NFR5).
- Buttons keep accessible names `auth.oauth.continue_with` in both locales, Tab order unchanged.
- The eager chunk grows ≤ 1 kB gzip; `make perf-budget` green; dead `openInNewTab` removed if
  it has no other caller.

## Epic 3 — Callback experience

### S3.1 `SocialSignInErrorView` component — **independent**

Component story (feature-local; no kit component is missing — architecture §2).

- Props: `kind: SocialSignInErrorKind`, `providerLabel`, `onRetry?`, `signInHref`.
- Renders an `<h1>` that receives focus on mount, the localized message inside `role="alert"`,
  "Try again" (`UIButton`) only for retryable kinds, and an always-present "Back to sign in" link.
- Storybook: default plus one story per kind (Ukrainian copy, the main language); `make
storybook-build` and `make check-storybook-static` green.
- jest-axe clean; 44 px targets; keyboard: Tab reaches both actions, Enter/Space activate.
- Palette tokens only (assumption A4); contrast AA in the browser lane.

### S3.2 Callback page and relay — **dependent on S2.4, S3.1**

As a user returning from the provider, I want to land signed in on the page I wanted, or see
what went wrong and how to recover.

- Route `socialCallback` registered through `@auth/routes`; manifest row in
  `tests/e2e/route-coverage.tsv`; title key set.
- On mount the query string is removed before first paint of content (FR6); `page.url()` in
  E2E has no `code`/`state`.
- `error` param → `cancelled` view, no request (FR7); missing params → `missing_parameters`,
  no request (FR8).
- Exactly one network request per `state`, proved under `<StrictMode>` in a unit test (FR9).
- Success → token set, `navigate(destination, { replace: true })`, focus on `<main>` (FR10);
  destination consumed once.
- Loading uses `RouteFallback` with `auth.social.signing_in` announced politely (NFR6).
- Authenticated on arrival → `/` without a request (FR14).
- Unmount aborts the request; no state update after unmount (no `act()` warnings — the console
  gate is the proof).
- Lazy `social-callback` chunk; `performance-serving` golden test green.

### S3.3 2FA hand-off — **dependent on S3.2**

- When `ROUTE_PATHS.twoFactorChallenge` exists: navigate there with `pendingSessionId` in router
  state, never in the URL; the 2FA screen completes sign-in (verified in E2E with the mock
  `mock-2fa` code).
- When it does not exist: `two_factor_required` error kind with "Back to sign in".
- This story is re-planned against the merged 2FA code when PR #377 lands.

## Epic 4 — Verification and documentation

### S4.1 E2E, mobile and visual coverage — **dependent on S1.2, S2.5, S3.2**

- `tests/e2e/modules/social-sign-in.spec.ts`: for Google and GitHub, success from `/sign-in`
  and from `/sign-up`; destination restore from a protected route; every error scenario link
  on the mock consent page; Deny; double-click guard; keyboard-only run.
- `tests/e2e/mobile/social-sign-in.spec.ts`: `tap()` success path on both mobile projects.
- `tests/visual/social-callback.spec.ts`: loading, `cancelled`, `expired`, `unavailable` —
  desktop + mobile projects; new baselines recorded with `make test-visual-update`, existing
  baselines unchanged.
- All selectors semantic; `retries: 0`; no `waitForTimeout`.

### S4.2 ADR and documentation — **dependent on S3.2**

- `docs/adr/0NN-social-sign-in-spa-callback-relay.md` (Deciders @kravalg) records D1/D2/D3;
  `docs/adr/README.md` row; `make lint-adr` clean.
- `src/modules/user/README.md` and `src/routes/README.md` mention the new route and contract.
- `specs/README.md` lists `social-sign-in` as "Planned".

## Coverage matrix

| FR / NFR          | Stories                              |
| ----------------- | ------------------------------------ |
| FR1-FR4           | S2.5                                 |
| FR5-FR10, FR14    | S3.2                                 |
| FR11              | S3.3                                 |
| FR12, FR13, FR15  | S2.4, S3.1, S3.2                     |
| FR16-FR18         | S1.1, S1.2                           |
| FR19              | S1.3                                 |
| NFR1-NFR3, NFR9   | all                                  |
| NFR4              | S2.5, S3.2                           |
| NFR5              | S2.5, S4.1                           |
| NFR6              | S3.1, S3.2, S4.1                     |
| NFR7, NFR8, NFR10 | S2.4                                 |
| NFR11             | S3.2 (`make check-security-headers`) |
| NFR12             | S4.1                                 |
| NFR13             | S1.2                                 |

## Parallel dispatch

Wave 1 (independent): S1.1, S2.1, S2.3, S3.1. Wave 2: S1.2, S2.4, S2.5. Wave 3: S1.3,
S3.2. Wave 4: S3.3, S4.1, S4.2. Per the host resource rules, implementation agents that run Jest,
`tsc`, Docker builds or Playwright execute one at a time even inside a wave.
