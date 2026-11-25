---
status: 'complete'
workflowType: 'epics-and-stories'
bmadCommand: 'create-epics-stories'
project_name: 'crm'
date: '2026-11-18'
revised: '2026-11-25'
iteration: 9
revisionPasses:
  - '2026-11-19 GraphQL only, no ADR; stories rewritten to the landed flow'
  - '2026-11-24 FR/NFR gate iteration 7: S2.4 transport answers and scrubber, S4.2 status, waves'
  - '2026-11-24 review: S2.4 superseded completions, encoded parameter names'
  - '2026-11-24 FR/NFR gate iteration 8: S1.1 blank code, expiry and bound, wave 5'
  - '2026-11-24 FR/NFR gate iteration 9: S1.1 repeated parameters, S3.1 stories, graph, matrix'
  - '2026-11-24 FR/NFR gate iteration 10: S3.1 contrast, S4.1 dependency'
  - '2026-11-24 FR/NFR gate iteration 11: S3.1 keys, S3.2 pending view, S4.1 after S3.3, waves'
  - '2026-11-25 FR/NFR gate iteration 12: story order, graph and waves derived again'
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

> **Revision 2026-11-19 — GraphQL only, no ADR.** The SPA talks to user-service over GraphQL
> only, never REST, and the feature carries no ADR. user-service exposes social sign-in only as
> REST, so this plan declares two pending GraphQL mutations for it to add —
> `initiateSocialSignInUser` (returns the provider's `authorizationUrl` and a `state`) and
> `completeSocialSignInUser` (returns a `signInUser`-shaped payload) — in
> `src/api/contracts/pending/social-sign-in.graphql`, answered locally by the Apollo mock. The
> state is bound to the tab in `sessionStorage` instead of a cross-origin cookie. Rows below marked
> _(2026-11-19)_ supersede the earlier text.

## Dependency graph

```text
S2.3 contract + schemas      ─► S1.1, S2.4
S3.1 error view (component)  ─► S2.4, S3.2
S1.1 apollo + consent page   ─► S1.2, S1.3
S1.2 env + make              ─► S1.3
S2.4 repository + provider   ─► S3.2
S3.2 callback page + relay   ─► S2.5, S3.3, S4.1, S4.2
S2.5 initiation (buttons)    ─► S1.3, S4.1, S4.3
S3.3 2FA hand-off            ─► S1.3, S4.1
S2.1, S2.2 withdrawn
```

_(2026-11-25)_ Each arrow reads "is needed by"; only S2.3 and S3.1 depend on no other story.

## Epic 1 — Local back-end for social sign-in (FR16-FR19)

### S1.1 Apollo social sign-in resolvers and Mockoon consent page — **dependent on S2.3**

_(2026-11-19)_ Rewritten for the GraphQL flow: the stateful mutations live in the Apollo mock and
Mockoon serves only the consent page.

As a developer, I want the local mock stack to answer both social sign-in mutations and to show
a mock consent page, so that I can exercise every outcome without provider accounts.

Acceptance criteria:

- `initiateSocialSignInUser(provider)` returns an `authorizationUrl` and a fresh `state`; given
  `OAUTH_MODE=mock`, the URL is `/__mock-oauth/<provider>/authorize` on Mockoon with the state
  and `${OAUTH_SPA_ORIGIN}/auth/callback/<provider>` as the redirect URI.
- Given an unknown provider, then one GraphQL error with
  `extensions: { status: 400, error_code: 'unsupported_provider' }`.
- `completeSocialSignInUser(provider, code, state)` accepts only a state it issued, for that
  provider, once; a reused or unknown state answers `invalid_state`, another provider
  `provider_mismatch`. _(2026-11-24)_ A state expires after ten minutes (`state_expired`), and at
  most 1000 are kept, oldest dropped first (`invalid_state`).
- Scenario codes (`mock-expired`, `mock-unverified`, `mock-no-email`, `mock-duplicate`,
  `mock-unavailable`, `mock-2fa`) answer the matching FR12 `error_code` or the 2FA result; a
  blank code answers `missing_oauth_parameters` and leaves the state unused _(2026-11-24)_; any
  other code signs in with an `accessToken` and a `refreshToken`.
- The consent page lists, as real links with visible text, Allow, Allow (2FA account), Deny and
  one link per scenario, each targeting `${OAUTH_SPA_ORIGIN}/auth/callback/<provider>`.
- Given `OAUTH_MODE=provider` and `OAUTH_GOOGLE_CLIENT_ID` set, the Google `authorizationUrl` is
  `accounts.google.com` with that client ID; a provider without a client ID keeps the mock page.
- The consent page renders only for a known provider, a local SPA callback URL and a v4 state,
  and answers anything else with a plain-text 400 that reflects nothing. _(2026-11-24)_ Its rules
  test each query value as the page renders it, so a repeated or nested parameter is refused too.
- `Mockoon.Dockerfile` imports the pinned spec at build time, copies the consent-page script and
  its entrypoint, and keeps its digest pin and healthcheck; `hadolint` clean,
  `tests/unit/tooling/image-hardening.test.ts` unchanged and green, and
  `tests/unit/tooling/mockoon-image.test.ts` pins the import step, both `COPY` lines, the entrypoint
  `CMD`, the healthcheck, and the entrypoint's `set -eu` with the merge before `exec`.
- `tests/apollo-server/social-sign-in.test.ts` covers both modes, every scenario and the state
  rules; `tests/unit/scripts/mockoon-social-oauth.test.js` covers the page and its input rules.

### S1.2 Environment keys and `make apollo-restart` — **dependent on S1.1**

_(2026-11-19)_ The keys are read by the Apollo mock; Mockoon takes no OAuth environment.

- `.env.example` gains `OAUTH_MODE=mock`, `OAUTH_SPA_ORIGIN`, and empty
  `OAUTH_GOOGLE_CLIENT_ID`, `OAUTH_GITHUB_CLIENT_ID`, `OAUTH_FACEBOOK_CLIENT_ID`,
  `OAUTH_TWITTER_CLIENT_ID`, each declared once; `make check-env-sync` passes on a fresh `.env`.
- `make apollo-restart` recreates only the `apollo` service so a `.env` change applies without a
  rebuild; the Bats make-target manifest gets its row; `make lint-shell` clean.
- No client secret key exists anywhere in this repository (NFR13); gitleaks `make
scan-secrets` green.

### S1.3 Local verification guide — **dependent on S1.1, S1.2, S2.5, S3.3**

- `docs/social-sign-in-local.md` is the reviewed copy of
  [the bundle guide](local-verification-social-sign-in-2026-11-18.md), with commands that
  `make lint-doc-references` resolves and links `make lint-doc-links` resolves.
- `CONTRIBUTING.md` links it from the local development section.

## Epic 2 — Client foundations

### S2.1 `HttpsClient` credentials option — **withdrawn** _(2026-11-19)_

Withdrawn: the SPA makes no REST call for social sign-in, so no credentials option is needed and
the story carries no acceptance criteria.

### S2.2 Per-provider feature flags — **withdrawn**

Withdrawn on 2026-11-18 with PRD D7: `main` retired every runtime flag before wave 1 started,
and nothing in the requirements needs a kill switch yet.

### S2.3 Pending contract and response schemas — **independent**

_(2026-11-19)_ A pending GraphQL contract with two mutations plus zod schemas for their payloads.

- `src/api/contracts/pending/social-sign-in.graphql` declares `initiateSocialSignInUser` and
  `completeSocialSignInUser` under `# pending-against: v2.8.0`; `src/api/contracts/README.md`
  records it as a provisional local contract removed by the pin bump (PRD D3).
- `SocialInitiateResultSchema` accepts only an `http(s)` `authorizationUrl` and a `state`;
  `SocialCompleteResultSchema` accepts a `twoFactorEnabled: false` result with an `accessToken`
  or a `twoFactorEnabled: true` result with a `pendingSessionId`, and rejects any other shape,
  including a token whose `twoFactorEnabled` is missing or `null`.
- Types in `@auth/types/social-sign-in/` are type-only files; `SocialSignInErrorKind` lands with S3.1.

### S2.4 GraphQL repository, transformer, provider _(2026-11-19, amended 2026-11-24)_ — **dependent on S2.3, S3.1**

- `GraphQLSocialSignInRepository` runs both mutations with `fetchPolicy: 'no-cache'`, a fresh
  `clientMutationId` and the caller signal, and is never retried (FR15).
- Both operations are anonymous in `SessionLinkFactory`: no `Authorization` header, and a 401
  never ends a current session.
- `SocialSignInTransformer` maps every FR12 `extensions.error_code`, a request nothing answered (a
  dropped connection or the deadline) to `unavailable`, and anything else to `generic`, an HTTP
  error status and an unparsable body included; table-driven unit test.
- `SocialSignInProvider.complete` starts the session on success (a 2FA result is handed off by
  S3.3), and reports failures through `AuthSecuritySignals` with a reason code, which
  for an HTTP-level answer comes from its status (NFR10).
- `accessToken` and `refreshToken` are scrubbed by the existing `token` fragment of
  `piiScrubber`. The page strips `code` and `state` from the address bar (S3.2, FR6), and
  `SocialCallbackTextScrubber`, run by `PiiTextScrubber`, redacts their values, plain and
  percent-encoded, from every event and breadcrumb that saw the earlier URL; its own tests and
  `pii-scrubber.social-callback.test.ts` pin both forms. `pendingSessionId` never enters a URL and
  no path logs it (NFR7).
- Integration suite covers every FR12 response through msw GraphQL handlers, HTTP error statuses,
  an unparsable body and the deadline included.
- Tokens in `modules/user/config/tokens.ts`, registered by the feature registrar; DI gates green.

> **Amendment 2026-11-24 (FR/NFR gate iteration 7).** The transformer, provider, scrubber and
> integration criteria above supersede the 2026-11-19 text, which mapped any network error to
> `unavailable`, named no source for the reason code, credited the address-bar strip alone with
> keeping `code`, `state` and `pendingSessionId` out of events, and asked the integration suite
> for the FR12 responses only. Added the same day from review: a completion that a newer session or
> 2FA challenge overtook is dropped (NFR8), and percent-encoded `code` and `state` names are
> redacted like plain ones (NFR7).

### S2.5 Initiation from the provider buttons — **dependent on S3.2**

As a user, I want a provider button to take me to the provider in the same tab, so that I come
back signed in to the same app.

- Clicking a button navigates in the app to `/auth/callback/<provider>` with the start marker
  (FR1), through S3.2's navigator and flow source — unit-tested; no new tab. What the page then
  does with the marker is S3.2's.
- The destination from `location.state.from` is saved when internal, else `/` (FR2); storage
  that throws does not block navigation.
- _(FR3 withdrawn)_ A second click before the page changes only starts the flow again.
- All four buttons stay rendered (FR4); the DOM and visual baselines are unchanged (NFR5).
- Buttons keep accessible names `auth.oauth.continue_with` in both locales, Tab order unchanged.
- The eager chunk grows ≤ 1 kB gzip; `make perf-budget` green; dead `openInNewTab` removed if
  it has no other caller.

## Epic 3 — Callback experience

### S3.1 `SocialSignInErrorView` component — **independent**

Component story (feature-local; no kit component is missing — architecture §2).

- Props: `kind: SocialSignInErrorKind` (its type-only file lands here), `providerLabel`,
  `onRetry?`. _(2026-11-20)_ The "Back to
  sign in" link always targets `ROUTE_PATHS.signIn`; no caller needs another target, so there is
  no `signInHref` prop.
- Renders an `<h1>` that receives focus on mount, the localized message inside a polite `role="status"` (changed from an alert after the
  accessibility review, so it does not cut off the heading),
  "Try again" (`UIButton`) only for retryable kinds, and an always-present "Back to sign in" link.
- Storybook: one story per kind, `Cancelled` first as the default (Ukrainian copy, the main
  language); `make storybook-build` and `make check-storybook-static` green.
- jest-axe clean; 44 px targets; keyboard: Tab reaches both actions, Enter and Space activate
  the button, Enter the link.
- Palette tokens only (assumption A4); contrast AA, checked in S4.1's browser lane, except the
  contained action's accepted gap (PRD NFR6, readiness W7).

### S3.2 Callback page and relay — **dependent on S2.4, S3.1**

As a user returning from the provider, I want to land signed in on the page I wanted, or see
what went wrong and how to recover.

- Route `socialCallback` registered through `@auth/routes`; title key set; the axe scan of the route
  in `tests/e2e/a11y/routes.a11y.spec.ts` and its row in `tests/e2e/route-coverage.tsv` land here,
  the other rows with S4.1.
- `SocialSignInNavigator` and `SocialSignInFlowSource` land here. Opened with the start marker, the
  page spends it, calls `initiateSocialSignInUser` and replaces the history entry with the returned
  authorization URL (FR1, FR15) — unit-tested.
- On mount the query string is removed before first paint of content (FR6); S4.1's E2E checks
  `page.url()` for `code` and `state`.
- `error` param with this tab's `state` → `cancelled` view, no request (FR7); an `error` with a
  missing state → `missing_parameters`, with a foreign state → `expired`; missing params → `missing_parameters`,
  no request (FR8).
- Exactly one network request per `state`, proved under `<StrictMode>` in a unit test (FR9).
- Success → token set, `navigate(destination, { replace: true })`, focus on `<main>` (FR10);
  destination consumed once.
- Loading uses `SocialSignInPendingView`, a story-covered wrapper of `RouteFallback`, with
  `auth.social.signing_in` announced politely (NFR6).
- _(FR14 withdrawn 2026-11-19)_ An already signed-in user is **not** redirected: the page runs
  the flow and the new session replaces the old one.
- _(2026-11-24)_ The relay aborts its request once every page that shares it has unmounted, and
  StrictMode's remount keeps it (NFR8); an answer that arrives after unmount is ignored, with no
  view or auth-store update (no `act()` warnings — the console gate is the proof).
- Lazy `social-callback` chunk; `performance-serving` golden test green.

### S3.3 2FA hand-off — **dependent on S3.2**

_(2026-11-20)_ Re-planned against the merged challenge (#331), as readiness W2 required.

- `SocialSignInProvider` starts every outcome through injected `SocialSignInDeps`: when the store
  holds a token (a sandbox demo session included) it calls `session.signOut()` first; a session
  then writes `{ ...signedOut, token, twoFactorStatus: 'disabled' }` and a 2FA result writes
  `{ ...signedOut, pendingSessionId }`, never a token. Unit-pinned for both outcomes, with and
  without an earlier session.
- `SocialCallbackViewMapper.outcomeView` maps `two-factor` to a replace redirect to
  `ROUTE_PATHS.twoFactorChallenge` with `state: { from }`, `from` being the saved destination as
  `{ pathname, search, hash }`, consumed once; the `pendingSessionId` never enters the URL or the
  router state.
- The `two_factor_required` kind, its error-view row, story and both translations are removed.
- A 2FA completion reaches the challenge, `completeTwoFactorUser` signs in, and the user lands on
  the protected page they came from: proved in the browser by S4.1's E2E, and by hand with the
  consent page's "Allow (2FA account)" link in S1.3's walk-through.
- Integration: the provider writes the pending session through the real container and store.

## Epic 4 — Verification and documentation

### S4.1 E2E, mobile and visual coverage — **dependent on S2.5, S3.2, S3.3**

_(2026-11-19)_ Rewritten to the landed suite. The browser lanes answer both mutations with
GraphQL stubs (`tests/e2e/utils/social-sign-in-stubs.ts`): the stubbed authorization URL is
already the provider's redirect back, so no spec opens the Mockoon consent page. The consent
page's outcomes are covered by its unit test and the Apollo mock test (S1.1) and by the manual
walk-through in the local guide.

- `tests/e2e/modules/user/features/auth/social-sign-in.spec.ts`: for all four providers, success
  from `/sign-in`, and for Google from `/sign-up`; the query is stripped from the address bar; a forged
  state and a forged cancel are refused; every FR12 error code, an unmapped
  one and an unreachable service with their recovery; an unknown provider; a cancel
  through the provider; a 2FA account through the challenge to its destination; a keyboard-only
  retry (Enter and Space); Back to a failed start; Back to sign in.
- `tests/e2e/mobile/social-sign-in-touch.spec.ts`: `tap()` success with the completion asserted,
  and the 44 px floor on both error actions, on both mobile projects.
- `tests/e2e/a11y/routes.a11y.spec.ts` scans `/auth/callback/unknown` beside S3.2's
  `/auth/callback/google`.
- `tests/visual/visual-comparison.social-callback.spec.ts` and `tests/visual/mobile/social-callback.spec.ts`:
  loading, cancelled, expired and unavailable, desktop, tablet and mobile in all three engines and
  on both mobile projects; the existing baselines are unchanged.
- All selectors semantic; `retries: 0`; no `waitForTimeout`.

### S4.2 Documentation — **dependent on S3.2**

_(2026-11-19)_ Documentation only: no ADR is written, by the owner's decision; the pull request
carries `[no-adr]`.

- `src/modules/user/README.md` and `src/routes/README.md` mention the new route and contract.
- `specs/README.md` lists `social-sign-in` as "In progress" while the pull request is open; it
  moves to "Implemented" when the feature is merged.

### S4.3 Remove the orphaned `url-builder` — **dependent on S2.5** _(2026-11-20)_

The #331 merge removed both consumers of `src/utils/url-builder.ts` (main deleted the REST
`api-config`, this branch rewrote main's provider buttons), so nothing in the app reads
`APP_CONFIG_API_BASE_URL` any more.

- Delete `src/utils/url-builder.ts`, its unit and integration tests and its
  `config/di-collaborator-policy.js` entry.
- `CLAUDE.md`, `AGENTS.md`, `src/config/runtime/README.md` and `src/config/env/README.md` say the
  setting has no client reader today and only widens the CSP `connect-src`; whether to keep the
  setting is left to a separate decision.

## Coverage matrix

| FR / NFR         | Stories                              |
| ---------------- | ------------------------------------ |
| FR1, FR2         | S2.5, S3.2                           |
| FR3, FR4         | S2.5                                 |
| FR5-FR10, FR14   | S3.2                                 |
| FR11             | S3.3                                 |
| FR12, FR13, FR15 | S2.4, S3.1, S3.2                     |
| FR16-FR18        | S1.1, S1.2                           |
| FR19             | S1.3                                 |
| NFR1-NFR3, NFR9  | all                                  |
| NFR4             | S2.5, S3.2                           |
| NFR5             | S2.5, S4.1                           |
| NFR6             | S3.1, S3.2, S4.1                     |
| NFR7, NFR8       | S2.4, S3.2                           |
| NFR10            | S2.4                                 |
| NFR11            | S3.2 (`make check-security-headers`) |
| NFR12            | S4.1                                 |
| NFR13            | S1.2                                 |

## Parallel dispatch

Wave 1 (independent): S2.3, S3.1. Wave 2: S1.1, S2.4. Wave 3: S1.2, S3.2. Wave 4: S2.5, S3.3,
S4.2. Wave 5: S1.3, S4.1, S4.3. Per the host resource rules, implementation agents that run
Jest, `tsc`, Docker builds or Playwright execute one at a time even inside a wave.
