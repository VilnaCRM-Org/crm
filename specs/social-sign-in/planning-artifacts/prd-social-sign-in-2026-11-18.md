---
status: 'complete'
workflowType: 'prd'
bmadCommand: 'create-prd'
project_name: 'crm'
date: '2026-11-18'
revised: '2026-11-24'
slug: 'social-sign-in'
inputDocuments:
  - 'specs/social-sign-in/planning-artifacts/research-social-sign-in-2026-11-18.md'
  - 'specs/social-sign-in/planning-artifacts/brief-social-sign-in-2026-11-18.md'
---

# PRD: Social Sign-In

Predecessors: [research](research-social-sign-in-2026-11-18.md) ·
[brief](brief-social-sign-in-2026-11-18.md).

> **Revision 2026-11-19 — GraphQL only, no ADR.** The SPA talks to user-service over GraphQL
> only, never REST, and the feature carries no ADR. user-service exposes social sign-in only as
> REST, so this plan declares two pending GraphQL mutations for it to add —
> `initiateSocialSignInUser` (returns the provider's `authorizationUrl` and a `state`) and
> `completeSocialSignInUser` (returns a `signInUser`-shaped payload) — in
> `src/api/contracts/pending/social-sign-in.graphql`, answered locally by the Apollo mock. The
> state is bound to the tab in `sessionStorage` instead of a cross-origin cookie. Rows below marked
> _(2026-11-19)_ supersede the earlier text.

## 1. Decisions

| Id  | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **Callback page relay over GraphQL** _(2026-11-19)_. A provider button opens `/auth/callback/:provider` in the app; the page calls `initiateSocialSignInUser`, keeps the returned `state` in `sessionStorage`, and replaces its history entry with the provider's `authorizationUrl`. The provider redirects back to the same page, which accepts only the state this tab started with and calls `completeSocialSignInUser`. No REST endpoint is called.                                                                                                                                                                                                                                                                                                                                  |
| D2  | **Same-tab navigation** (`window.location.replace` to the authorization URL) replaces `openInNewTab`. A popup flow is rejected: popup blockers, cross-window messaging, and the memory-only token make it strictly worse.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| D3  | **Contract** _(2026-11-19)_. The two mutations are a pending GraphQL contract, `src/api/contracts/pending/social-sign-in.graphql` (`# pending-against: v2.8.0`), read by codegen and the Apollo mock and deleted by the pin bump to the user-service release that declares them. Failures carry the REST `error_code` set in `extensions.error_code`. **Upstream dependency:** user-service must add both mutations before production.                                                                                                                                                                                                                                                                                                                                                    |
| D4  | **Two local modes** _(2026-11-19)_, one switch (`OAUTH_MODE` in the untracked `.env`, read by the Apollo mock): `mock` (default, CI) points `authorizationUrl` at a Mockoon mock consent page; `provider` points it at the real Google/GitHub screen for a provider with a client ID. A real user-service needs the mutations first.                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| D5  | **Production enablement is out of scope** and blocked on user-service #468 (pre-hijacking via email auto-link) plus the released contract tag.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| D6  | **2FA hand-off** _(revised 2026-11-20, after #331 merged)_. A `twoFactorEnabled: true` result starts the same pending challenge a password sign-in starts: any earlier session (a sandbox demo session included) is ended, the auth store holds the signed-out state plus the `pendingSessionId`, and the callback replace-navigates to `ROUTE_PATHS.twoFactorChallenge` with the saved destination as `from`. The challenge (`completeTwoFactorUser`) then signs in and lands on that destination. The earlier "finish signing in with your password" notice and its `two_factor_required` kind are removed. **Upstream requirement:** user-service accepts a `pendingSessionId` issued by `completeSocialSignInUser` in `completeTwoFactorUser`, exactly as one issued by `signInUser`. |
| D7  | **No per-provider feature flags (revised 2026-11-18, wave 1).** All four buttons keep shipping as they do today. `main` retired every runtime flag (`FeatureFlag = never`), and the flag guide asks for new flags to default off and stay rare; a provider an environment has not configured already ends in the `unsupported_provider` or `unavailable` error view. A kill switch is added only when a real environment needs one.                                                                                                                                                                                                                                                                                                                                                       |

> Assumption A1: the requester's "real (mockoon) back-end" means the local mock stack — the
> Apollo mock answering both mutations and Mockoon hosting the consent page — with the real
> provider consent screen reachable through their own keys (mode `provider`). A real
> user-service is usable once it declares the two mutations; the mock never exchanges a code
> with a provider secret.
>
> Assumption A2: Google and GitHub are the providers the requester will register; Facebook and
> Twitter/X are wired identically and verified in `mock` mode only.
>
> Assumption A3: The access token from the callback is handled exactly like the password sign-in
> token (memory-only, in `useAuthStore`); `refresh_token` is ignored, consistent with the 2FA bundle's
> deferred refresh-token follow-up.
>
> Assumption A4: No Figma frame covers the callback route. The callback screen composes existing
> kit components and palette tokens only, the precedent set by `UIOfflineNotice` (issue #147);
> `figma-design-check` records "no surface" rather than BLOCKED for this screen. The provider
> buttons themselves keep their current, Figma-verified look.

## 2. Functional requirements

### Initiation

- **FR1** _(2026-11-19)_ Activating a provider button opens `/auth/callback/{provider}` in the app with router state `{ socialStart: true }`; the page calls `initiateSocialSignInUser(provider)` and replaces its history entry with the returned `authorizationUrl` (http(s) only).
- **FR2** Before navigating, the SPA stores the intended post-sign-in destination (the
  `state.from` that `ProtectedRoute` set, issue #150) in `sessionStorage`, accepting only an
  internal path; anything else stores `/`.
- **FR3** _Withdrawn in implementation (2026-11-18)_: a second click before the page unloads only
  restarts the flow, and the later redirect replaces the earlier one; a guard flag would survive a
  back-forward-cache restore and leave the buttons dead, which is worse than the harmless repeat.
- **FR4** _Withdrawn with D7_: every provider button stays rendered, in today's order and layout.

### Callback

- **FR5** A public route `/auth/callback/:provider` exists, registered through the auth
  feature's route contract and the route-coverage manifest.
- **FR6** On mount, before rendering anything else, the route reads `code`, `state` and `error`
  from the query and removes the query string from the address bar (`history.replaceState`).
- **FR7** _(2026-11-19)_ A provider denial (`error` present, e.g. `access_denied`) with the
  `state` this tab started shows a localized
  "sign-in was cancelled" message without calling the backend.
- **FR8** On a provider callback (an arrival not marked `{ socialStart: true }`, which FR1
  covers), a missing `code` or `state` (and no `error`) shows the `missing_oauth_parameters`
  message without calling the backend.
- **FR9** _(2026-11-19)_ Otherwise the route accepts only a `state` equal to the one this tab saved for this provider (else the `expired` message, no request), and performs exactly one `completeSocialSignInUser(provider, code, state)` per state, even when React runs the effect twice.
- **FR10** _(revised 2026-11-20)_ A `completeSocialSignInUser` result with `twoFactorEnabled:
false` and an `accessToken` starts a session the way a password sign-in does: any earlier session
  (a sandbox demo session included) is ended first, then the auth store holds the signed-out state
  plus the token and `twoFactorStatus: 'disabled'`. The page then navigates (replace) to the stored
  destination or `/`, and focus lands on `<main>` via the existing arrival-focus behaviour.
- **FR11** _(revised 2026-11-20)_ A result with `twoFactorEnabled: true` and a `pendingSessionId`
  follows D6: no token is stored, and the user finishes on `/sign-in/two-factor`, then lands on the
  stored destination or `/`.
- **FR12** Each documented failure renders its own localized message and recovery:

  | Source                                                      | Message key (`auth.social.error.*`) | Recovery actions                           |
  | ----------------------------------------------------------- | ----------------------------------- | ------------------------------------------ |
  | provider `error`                                            | `cancelled`                         | Try again (same provider), Back to sign in |
  | `missing_oauth_parameters` (400)                            | `missing_parameters`                | Try again, Back to sign in                 |
  | `provider_mismatch` (400)                                   | `provider_mismatch`                 | Back to sign in                            |
  | `unsupported_provider` (400)                                | `unsupported_provider`              | Back to sign in                            |
  | `duplicate_email` (409)                                     | `duplicate_email`                   | Back to sign in (use email + password)     |
  | `invalid_state`, `state_expired` (422)                      | `expired`                           | Try again, Back to sign in                 |
  | `provider_email_unavailable` (422)                          | `email_unavailable`                 | Try again, Back to sign in                 |
  | `unverified_provider_email` (422)                           | `email_unverified`                  | Try again, Back to sign in                 |
  | `provider_unavailable`, network, timeout                    | `unavailable`                       | Try again, Back to sign in                 |
  | unknown `error_code`, any HTTP error status, malformed body | `generic`                           | Try again, Back to sign in                 |

  `provider_unavailable` is the `error_code` of a GraphQL error; its 503 travels in
  `extensions.status`. An HTTP-level 503 is an HTTP error status and shows `generic`.

- **FR13** (the two email kinds became retryable after the S3.1 accessibility review: granting or
  verifying the email at the provider is fixed by a fresh round trip) "Try again" restarts FR1 for the same provider; "Back to sign in" links to `/sign-in`.
- **FR14** _Withdrawn 2026-11-19_: no redirect for a user who is already signed in. A second social sign-in only issues a fresh session, and the redirect made every page of the E2E stack (which preloads a token) leave the callback before it could be tested.
- **FR15** The callback is never retried automatically (codes are single-use); only "Try again"
  restarts the flow.

### Local verification

- **FR16** _(2026-11-19)_ `OAUTH_MODE=mock` (default): the Apollo mock answers `initiateSocialSignInUser` with a Mockoon-hosted consent page URL that lists one link per outcome; each link redirects to the SPA callback with a scenario `code` and the issued `state`.
- **FR17** _(2026-11-19)_ `OAUTH_MODE=provider`: for each provider whose `OAUTH_<P>_CLIENT_ID` is set, the Apollo mock answers with the real authorize URL; the rest keep the mock page. `completeSocialSignInUser` accepts any code for a state it issued, once.
- **FR18** _(2026-11-19)_ Switching mode needs only an `.env` edit and `make apollo-restart`, never a rebuild of the SPA.
- **FR19** A local verification guide documents provider registration, redirect URIs, `.env`
  keys, commands, the expected screens per mode, and troubleshooting.

## 3. Non-functional requirements

Quality floors restate `.claude/react-sdlc.yml` `quality.*` — raise-only:

| Id    | Requirement                                                                                                                                                                                                                                                                                                                                                                        |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR1  | Coverage 100/100/100/100 (statements/branches/functions/lines), unit and integration suites                                                                                                                                                                                                                                                                                        |
| NFR2  | Stryker `break` 100 over the extended mutate scope; no new `Stryker disable` without the equivalence proof the repo standard demands                                                                                                                                                                                                                                               |
| NFR3  | 0 ESLint errors/warnings, 0 `tsc` errors, 0 jscpd clones, 0 dependency-cruiser violations, 0 markdownlint errors, `make lint-metrics` clean                                                                                                                                                                                                                                        |
| NFR4  | Lighthouse desktop ≥ 95 and mobile ≥ 85 (profile) on `/sign-in` and `/sign-up`; the button module grows ≤ 1 kB gzip and the eager entrypoint stays within `config/performance-budget.json`                                                                                                                                                                                         |
| NFR5  | 0 visual diffs on existing baselines; new baselines for the callback loading and error states, desktop and both mobile projects                                                                                                                                                                                                                                                    |
| NFR6  | WCAG 2.1 AA: loading announced via a polite live region; error message in a polite `role="status"` region with focus moved to the error heading; recovery controls reachable by Tab and operable by Enter/Space; ≥ 44 px targets on the callback screen; axe clean on the new route                                                                                                |
| NFR7  | Security: `code`, `state`, `pendingSessionId`, tokens never appear in logs, Sentry events, rendered DOM, or browser history; tokens fall under the existing `piiScrubber` `token` fragment                                                                                                                                                                                         |
| NFR8  | _(2026-11-19)_ Both mutations run under the Apollo link's request deadline, are never retried, and are never aborted by the page (a spent state or code cannot be re-asked); an unmounted page ignores the answer                                                                                                                                                                  |
| NFR9  | i18n: every new string exists in `uk` and `en`; `make lint-i18n` clean; provider names are not translated                                                                                                                                                                                                                                                                          |
| NFR10 | _(2026-11-19)_ Observability: success and every failure user-service answers (or that cannot reach it) emit through the existing boundaries — `auth_failure` security events with reason codes; refusals decided in the page before any request (cancel, missing parameters, a foreign state) emit nothing, because a crafted link alone triggers them; no new direct Sentry calls |
| NFR11 | CSP unchanged; `make check-security-headers` green                                                                                                                                                                                                                                                                                                                                 |
| NFR12 | Determinism: the E2E suite uses `OAUTH_MODE=mock` only, with `retries: 0`                                                                                                                                                                                                                                                                                                          |
| NFR13 | No secrets committed: `.env.example` carries empty `OAUTH_*_CLIENT_ID` keys only; client secrets never appear in this repository (the local modes of D4 do not use one)                                                                                                                                                                                                            |

## 4. Acceptance-criteria trace

| Brief success criterion                       | FRs / NFRs                 |
| --------------------------------------------- | -------------------------- |
| One click → signed in, same tab, no JSON page | FR1, FR5, FR6, FR9, FR10   |
| Every failure localized with recovery         | FR7, FR8, FR12, FR13, NFR6 |
| Real Google consent via local guide           | FR17, FR18, FR19           |
| No performance or quality regression          | NFR1-NFR5                  |

## 5. Out of scope

Provider linking in settings, refresh tokens, backend changes, production enablement (D5),
new Figma design, Apple/Microsoft providers.
