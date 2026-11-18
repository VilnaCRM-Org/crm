---
status: 'complete'
workflowType: 'prd'
bmadCommand: 'create-prd'
project_name: 'crm'
date: '2026-11-18'
slug: 'social-sign-in'
inputDocuments:
  - 'specs/social-sign-in/planning-artifacts/research-social-sign-in-2026-11-18.md'
  - 'specs/social-sign-in/planning-artifacts/brief-social-sign-in-2026-11-18.md'
---

# PRD: Social Sign-In

Predecessors: [research](research-social-sign-in-2026-11-18.md) ·
[brief](brief-social-sign-in-2026-11-18.md).

## 1. Decisions

| Id  | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | **SPA callback relay.** Providers redirect to a frontend route; the SPA forwards `code`+`state` to `GET /api/auth/social/{provider}/callback` with credentials. No user-service code change; only its `OAUTH_<P>_REDIRECT_URI` points at the SPA.                                                                                                                                                                                                                                 |
| D2  | **Same-tab navigation** (`window.location.assign`) replaces `openInNewTab`. A popup flow is rejected: popup blockers, cross-window messaging, and the memory-only token make it strictly worse.                                                                                                                                                                                                                                                                                   |
| D3  | **Contract (revised 2026-11-18, wave 1).** Until user-service tags a release containing `/api/auth/social/*`, the callback contract is the hand-written `SocialCallbackResponseSchema` / `SocialAuthProblemSchema` in `response-schemas.ts`, recorded under "Pending REST operations" in `src/api/contracts/README.md`. The `pending/` folder is GraphQL-only (codegen and the Apollo mock read it), so no OpenAPI fragment goes there. The pin bump switches to generated types. |
| D4  | **Three local modes**, one switch (`OAUTH_MODE` in the untracked `.env`): `mock` (default, CI), `provider` (real consent screen, Mockoon callback), `backend` (real local user-service, documented only).                                                                                                                                                                                                                                                                         |
| D5  | **Production enablement is out of scope** and blocked on user-service #468 (pre-hijacking via email auto-link) plus the released contract tag.                                                                                                                                                                                                                                                                                                                                    |
| D6  | **2FA hand-off** reuses the 2FA challenge route when it exists in the tree (`ROUTE_PATHS.twoFactorChallenge`, PR #377). When it does not, the `2fa_enabled: true` response renders a localized "finish signing in with your password" notice.                                                                                                                                                                                                                                     |
| D7  | **No per-provider feature flags (revised 2026-11-18, wave 1).** All four buttons keep shipping as they do today. `main` retired every runtime flag (`FeatureFlag = never`), and the flag guide asks for new flags to default off and stay rare; a provider an environment has not configured already ends in the `unsupported_provider` or `unavailable` error view. A kill switch is added only when a real environment needs one.                                               |

> Assumption A1: the requester's "real (mockoon) back-end" means the user-service contract as
> served by Mockoon, with the real provider consent screen reachable through their own keys —
> mode `provider`. A fully real backend (mode `backend`) is documented as an optional path,
> because Mockoon cannot perform a token exchange with a provider secret.
>
> Assumption A2: Google and GitHub are the providers the requester will register; Facebook and
> Twitter/X are wired identically and verified in `mock` mode only.
>
> Assumption A3: The access token from the callback is handled exactly like the password sign-in
> token (memory-only `AuthStateVar`); `refresh_token` is ignored, consistent with the 2FA bundle's
> deferred refresh-token follow-up.
>
> Assumption A4: No Figma frame covers the callback route. The callback screen composes existing
> kit components and palette tokens only, the precedent set by `UIOfflineNotice` (issue #147);
> `figma-design-check` records "no surface" rather than BLOCKED for this screen. The provider
> buttons themselves keep their current, Figma-verified look.

## 2. Functional requirements

### Initiation

- **FR1** Activating an enabled provider button navigates the current tab to
  `{apiBaseUrl}/api/auth/social/{provider}` with `provider ∈ {google, github, facebook, twitter}`.
- **FR2** Before navigating, the SPA stores the intended post-sign-in destination (the
  `state.from` that `ProtectedRoute` set, issue #150) in `sessionStorage`, accepting only an
  internal path; anything else stores `/`.
- **FR3** After one activation, every provider button and the surrounding form controls become
  non-interactive (`inert`) until the page unloads, so a double click cannot start two flows.
- **FR4** _Withdrawn with D7_: every provider button stays rendered, in today's order and layout.

### Callback

- **FR5** A public route `/auth/callback/:provider` exists, registered through the auth
  feature's route contract and the route-coverage manifest.
- **FR6** On mount, before rendering anything else, the route reads `code`, `state` and `error`
  from the query and removes the query string from the address bar (`history.replaceState`).
- **FR7** Provider denial (`error` present, e.g. `access_denied`) shows a localized
  "sign-in was cancelled" message without calling the backend.
- **FR8** Missing `code` or `state` (and no `error`) shows the `missing_oauth_parameters`
  message without calling the backend.
- **FR9** Otherwise the route performs exactly one credentialed `GET` to
  `/api/auth/social/{provider}/callback?code=…&state=…` per `state`, even when React runs the
  effect twice.
- **FR10** A `{2fa_enabled:false, access_token}` response stores the token through the existing
  auth state, then navigates (replace) to the stored destination or `/`, and focus lands on
  `<main>` via the existing arrival-focus behaviour.
- **FR11** A `{2fa_enabled:true, pending_session_id}` response follows D6.
- **FR12** Each documented failure renders its own localized message and recovery:

  | Source                                         | Message key (`auth.social.error.*`) | Recovery actions                           |
  | ---------------------------------------------- | ----------------------------------- | ------------------------------------------ |
  | provider `error`                               | `cancelled`                         | Try again (same provider), Back to sign in |
  | `missing_oauth_parameters` (400)               | `missing_parameters`                | Try again, Back to sign in                 |
  | `provider_mismatch` (400)                      | `provider_mismatch`                 | Back to sign in                            |
  | `unsupported_provider` (400)                   | `unsupported_provider`              | Back to sign in                            |
  | `duplicate_email` (409)                        | `duplicate_email`                   | Back to sign in (use email + password)     |
  | `invalid_state`, `state_expired` (422)         | `expired`                           | Try again, Back to sign in                 |
  | `provider_email_unavailable` (422)             | `email_unavailable`                 | Try again, Back to sign in                 |
  | `unverified_provider_email` (422)              | `email_unverified`                  | Try again, Back to sign in                 |
  | `provider_unavailable` (503), network, timeout | `unavailable`                       | Try again, Back to sign in                 |
  | unknown `error_code`, 5xx, malformed body      | `generic`                           | Try again, Back to sign in                 |
  | `2fa_enabled: true` without a 2FA route (D6)   | `two_factor_required`               | Back to sign in (use email + password)     |

- **FR13** (the two email kinds became retryable after the S3.1 accessibility review: granting or
  verifying the email at the provider is fixed by a fresh round trip) "Try again" restarts FR1 for the same provider; "Back to sign in" links to `/sign-in`.
- **FR14** An already-authenticated user who lands on the callback route is redirected to `/`
  without a backend call.
- **FR15** The callback is never retried automatically (codes are single-use); only "Try again"
  restarts the flow.

### Local verification

- **FR16** `OAUTH_MODE=mock` (default): Mockoon serves the initiate route as a `302` to a
  Mockoon-hosted consent page that lists one link per outcome in FR12 plus success and 2FA;
  each link redirects to the SPA callback with a scenario `code`.
- **FR17** `OAUTH_MODE=provider`: for each provider whose `OAUTH_<P>_CLIENT_ID` is set, the
  initiate route redirects to the real provider authorize URL with that client ID, the SPA
  redirect URI and a fresh `state`; providers without a client ID fall back to the mock consent
  page. Mockoon's callback answers success for any `code`.
- **FR18** Switching mode needs only an `.env` edit and a Mockoon restart (`make` target),
  never a rebuild of the SPA.
- **FR19** A local verification guide documents provider registration, redirect URIs, `.env`
  keys, commands, the expected screens per mode, and troubleshooting.

## 3. Non-functional requirements

Quality floors restate `.claude/react-sdlc.yml` `quality.*` — raise-only:

| Id    | Requirement                                                                                                                                                                                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| NFR1  | Coverage 100/100/100/100 (statements/branches/functions/lines), unit and integration suites                                                                                                                                                                        |
| NFR2  | Stryker `break` 100 over the extended mutate scope; no new `Stryker disable` without the equivalence proof the repo standard demands                                                                                                                               |
| NFR3  | 0 ESLint errors/warnings, 0 `tsc` errors, 0 jscpd clones, 0 dependency-cruiser violations, 0 markdownlint errors, `make lint-metrics` clean                                                                                                                        |
| NFR4  | Lighthouse desktop ≥ 95 and mobile ≥ 85 (profile) on `/sign-in` and `/sign-up`; the button module grows ≤ 1 kB gzip and the eager entrypoint stays within `config/performance-budget.json`                                                                         |
| NFR5  | 0 visual diffs on existing baselines; new baselines for the callback loading and error states, desktop and both mobile projects                                                                                                                                    |
| NFR6  | WCAG 2.1 AA: loading announced via a polite live region; error message in `role="alert"` with focus moved to the error heading; recovery controls reachable by Tab and operable by Enter/Space; ≥ 44 px targets on the callback screen; axe clean on the new route |
| NFR7  | Security: `code`, `state`, `pending_session_id`, tokens never appear in logs, Sentry events, rendered DOM, or browser history; `piiScrubber` keys extended and unit-pinned                                                                                         |
| NFR8  | The callback `fetch` runs under `RequestDeadline` (`REACT_APP_REQUEST_TIMEOUT_MS`), is never auto-retried (no `retry: true`), and honours caller abort on unmount                                                                                                  |
| NFR9  | i18n: every new string exists in `uk` and `en`; `make lint-i18n` clean; provider names are not translated                                                                                                                                                          |
| NFR10 | Observability: success and each failure emit through the existing boundaries — `auth_failure` security events with reason codes for failures; no new direct Sentry calls                                                                                           |
| NFR11 | CSP unchanged; `make check-security-headers` green                                                                                                                                                                                                                 |
| NFR12 | Determinism: the E2E suite uses `OAUTH_MODE=mock` only, with `retries: 0`                                                                                                                                                                                          |
| NFR13 | No secrets committed: `.env.example` carries empty `OAUTH_*_CLIENT_ID` keys only; client secrets appear only in the `backend` mode guide and never in this repository                                                                                              |

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
