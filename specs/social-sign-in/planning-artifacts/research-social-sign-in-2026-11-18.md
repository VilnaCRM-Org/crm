---
status: 'complete'
workflowType: 'research'
bmadCommand: 'analyst'
project_name: 'crm'
date: '2026-11-18'
revised: '2026-11-25'
slug: 'social-sign-in'
inputDocuments:
  - 'src/modules/user/features/auth/components/form-section/components/auth-provider-buttons/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/components/auth-provider-buttons/oauth-providers.ts'
  - 'src/modules/user/features/auth/types/auth-provider-buttons/oauth-providers.ts'
  - 'src/modules/user/features/auth/utils/browser-navigator.ts'
  - 'src/modules/user/features/auth/components/auth-form-section/index.tsx'
  - 'src/utils/url-builder.ts'
  - 'src/routes/route-paths.ts'
  - 'src/config/runtime/feature-flag-service.ts'
  - 'Mockoon.Dockerfile'
  - 'docker-compose.yml'
  - '.env.example'
  - 'config/security-headers.json'
  - 'user-service@main: .github/openapi-spec/spec.yaml (/api/auth/social/*)'
  - 'user-service@main: specs/oauth-social-signin-architecture.md'
  - 'user-service@main: .env (oauth-social-signin block)'
  - 'user-service issues #256-#261 (closed), #468, #520 (open)'
  - 'crm-worktrees/331-two-factor: specs/two-factor-authentication (Follow-up 5.3)'
---

# Research: Social Sign-In (Google, GitHub, Facebook, Twitter/X)

## 1. Task framing

The sign-in and sign-up pages already render four provider buttons (Google, GitHub, Facebook,
Twitter). They are dead ends today: clicking one opens `${apiBaseUrl}/auth/<provider>` in a new
tab, a path no backend serves. The goal is a working social sign-in against the **real
user-service contract**, verifiable locally in two ways: against Mockoon (deterministic, no
secrets) and against real Google/GitHub OAuth clients the developer registers.

## 2. Current frontend state

| Concern       | Where                                                             | Today                                                                                                           |
| ------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Buttons       | `@auth/components/form-section/components/auth-provider-buttons/` | `UIButton variant="outlined"` icon-only, `aria-label` = `auth.oauth.continue_with`                              |
| Provider list | `.../auth-provider-buttons/oauth-providers.ts`                    | Module singleton, `PROVIDERS` const, `onClick` → `browserNavigator.openInNewTab(urlBuilder.build('/auth/<p>'))` |
| Navigation    | `@auth/utils/browser-navigator.ts`                                | Only `openInNewTab` (`noopener,noreferrer`)                                                                     |
| Placement     | `@auth/components/auth-form-section/index.tsx`                    | Rendered under every auth form inside `InertBox` (`oauthInert` while submitting)                                |
| Base URL      | `src/utils/url-builder.ts`                                        | Runtime `apiBaseUrl` → build-time `REACT_APP_MOCKOON_URL` (`http://localhost:8080`)                             |
| Routes        | `src/routes/route-paths.ts`                                       | `home`, `signUp`, `signIn`, `passwordRecovery`, `notFound` — no callback route                                  |
| Flags         | `src/config/runtime/feature-flag-service.ts`                      | On the branch researched: one flag (`forgotPassword`). On `main` at wave 1: none (`FeatureFlag = never`)        |
| Session       | `AuthStateVar` (memory-only token)                                | `isAuthenticated = !!token`; no refresh-token persistence                                                       |

Findings:

- **F-R1 — wrong path.** `/auth/<provider>` ≠ the contract `/api/auth/social/{provider}`.
- **F-R2 — wrong navigation model.** A new tab with `noopener` cannot hand a token back to the
  originating SPA; the auth token is memory-only, so the result would land in a second, isolated
  app instance. Social sign-in needs a **same-tab top-level navigation**.
- **F-R3 — the buttons sit on the auth paint path.** `oauth-providers.ts` is eagerly loaded
  with the sign-in page; any new code there is charged against the mobile Lighthouse floor
  (0.84 in `lighthouserc.mobile.js`; profile floor 85). The callback handling must live in a
  lazily loaded route chunk, not in the button module.

## 3. Backend contract (user-service `main`)

user-service shipped social OAuth across epics #256-#261 (closed). Endpoints, from
`.github/openapi-spec/spec.yaml` on `main`:

| Endpoint                                   | Success                                                                                                                                              | Errors (RFC 7807 `application/problem+json`, `error_code`)                                                                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/auth/social/{provider}`          | `302` → provider authorize URL; `Set-Cookie: oauth_flow_binding=…; Path=/api/auth/social; Secure; HttpOnly; SameSite=Lax`; `Cache-Control: no-store` | `400 unsupported_provider`, `500`                                                                                                                                                                          |
| `GET /api/auth/social/{provider}/callback` | `200` JSON, `oneOf`: `{2fa_enabled:false, access_token, refresh_token}` or `{2fa_enabled:true, pending_session_id}`; `Set-Cookie: __Host-auth_token` | `400 missing_oauth_parameters / provider_mismatch`, `409 duplicate_email`, `422 invalid_state / state_expired / provider_email_unavailable / unverified_provider_email`, `503 provider_unavailable`, `500` |

`{provider}` enum: `github`, `google`, `facebook`, `twitter`.

Backend configuration (`user-service/.env`, block `oauth-social-signin`):

```bash
OAUTH_GOOGLE_CLIENT_ID=
OAUTH_GOOGLE_CLIENT_SECRET=
OAUTH_GOOGLE_REDIRECT_URI=${API_BASE_URL}/api/auth/social/google/callback
OAUTH_GITHUB_CLIENT_ID=
OAUTH_GITHUB_CLIENT_SECRET=
OAUTH_GITHUB_REDIRECT_URI=${API_BASE_URL}/api/auth/social/github/callback
# facebook / twitter alike; OAUTH_STATE_TTL_SECONDS=600
```

Findings:

- **F-R4 — the callback answers JSON, not a redirect.** _Superseded 2026-11-19: the plan runs
  over two GraphQL mutations with the state bound to the tab in `sessionStorage` (architecture §7);
  the REST relay and its cookie are not used. As first written:_ With the default redirect URI the
  provider sends the browser to the **API** origin and the user ends on a raw JSON page. The
  state record stores `redirect_uri` and the backend re-sends it at token exchange, so pointing
  `OAUTH_<P>_REDIRECT_URI` at a **frontend** route works without backend code changes: the
  provider redirects to the SPA, and the SPA relays `code` + `state` to the backend callback with
  `fetch(..., { credentials: 'include' })`. The flow-binding cookie is `SameSite=Lax` and
  `localhost:3000` → `localhost:8080` is **same-site** (cookies ignore ports), so it is sent.
  This "SPA callback relay" was the integration pattern this plan first adopted.
- **F-R5 — CORS with credentials.** _Superseded 2026-11-19 with F-R4: no credentialed
  cross-origin `fetch` remains, so no CORS change is needed. As first written:_ The relay is a credentialed cross-origin `fetch`; the
  backend's `CORS_ALLOW_ORIGIN` must list the SPA origin and allow credentials. Mockoon must
  answer `Access-Control-Allow-Origin: <exact origin>` + `Access-Control-Allow-Credentials:
true` (a `*` origin is rejected by browsers for credentialed requests).
- **F-R6 — provider-side denial never reaches the backend.** If the user clicks "Cancel" on
  the consent screen, the provider redirects to `redirect_uri?error=access_denied&state=…`. The
  SPA callback route must handle `error` itself.
- **F-R7 — 2FA.** The completion can return a pending session. The 2FA bundle (PR #377, route
  `twoFactorChallenge: '/sign-in/two-factor'`) deferred "social sign-in combined with 2FA" as
  Follow-up 5.3. _Resolved 2026-11-20: #331 merged, and S3.3 hands the `pendingSessionId` to that
  challenge (PRD D6), so the fallback first planned for a missing route was dropped._
- **F-R8 — the pinned contract lacks social sign-in.** crm pins user-service `v2.8.0`, its newest tag;
  the REST social endpoints exist only on `main`, and no GraphQL mutation exists anywhere. The spec
  Mockoon imports (`Mockoon.Dockerfile`, sha256-checked) therefore has no social route.
  _Resolved 2026-11-19: the two mutations are a pending contract (PRD D3) the local Apollo mock
  answers, and a merge script adds the consent page to the imported Mockoon environment._
- **F-R9 — open backend risks.** user-service #468 (account pre-hijacking via email
  auto-link) is open; #520 (link/unlink providers in settings) is open. Neither blocks a
  sign-in button, but #468 is a production-enablement blocker (see PRD D5).

## 4. Mockoon capabilities relevant here

- `mockoon-cli start --data <file>` accepts an OpenAPI file **or** a Mockoon environment JSON.
  An OpenAPI import yields only the spec examples: the initiate `302` would point at
  `https://oauth.mock.example/github/authorize`, which does not exist. Realistic local flows need
  **hand-authored routes**.
- Environment JSON supports response **rules** (on query, cookie, header, path params), response
  headers (`Location`, `Set-Cookie`), status per response, and Handlebars templating
  (`{{queryParam 'state'}}`, `{{urlParam 'provider'}}`, `{{faker 'string.uuid'}}`,
  `{{getEnvVar 'MOCKOON_…'}}` — environment variables are read only with the `MOCKOON_` prefix
  by default).
- _Superseded 2026-11-19 with F-R4: the state is bound to the tab in `sessionStorage`, not to a
  cookie, and the Apollo mock checks it. As first written:_ Rules compare a request field against a constant or regex; they cannot compare two request
  fields (state vs cookie). Exact state/cookie binding stays a user-service concern covered by
  its own Behat suite (`features/oauth_social.feature`).

## 5. Provider registration facts (developer-facing)

| Provider  | Console                                              | Client type                        | Redirect URI rules                                                                                                                   | Secret needed for                       |
| --------- | ---------------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| Google    | Google Cloud Console → APIs & Services → Credentials | OAuth client ID, "Web application" | Exact match; `http://localhost:<port>` allowed; non-public TLDs such as `*.localhost` subdomains are rejected; multiple URIs allowed | Token exchange (real user-service only) |
| GitHub    | Settings → Developer settings → OAuth Apps           | OAuth App                          | One callback URL per app; host **and port** must match, path may be a sub-path                                                       | Token exchange (real user-service only) |
| Facebook  | developers.facebook.com → My Apps                    | Consumer app + Facebook Login      | `localhost` allowed in dev mode; HTTPS enforced for non-localhost                                                                    | Token exchange                          |
| Twitter/X | developer.x.com → Projects & Apps                    | OAuth 2.0, Web App, PKCE           | Exact match                                                                                                                          | Token exchange                          |

Consequence: the redirect URIs to register are **frontend** URLs on `http://localhost:3000`
(dev) and `http://localhost:3001` (prod-parity). GitHub needs one OAuth App per port.
`WEBSITE_DOMAIN=localhost` already, so no custom host is needed.

## 6. Security surface

- _Superseded 2026-11-19 with F-R4: both mutations go to the GraphQL URL `connect-src` already lists;
  no relay `fetch` exists. As first written:_ CSP (`config/security-headers.json`): top-level navigation to the API origin is not governed
  by `connect-src`; the relay `fetch` already falls under `connect-src 'self'` + API origins.
  `form-action 'self'` is irrelevant (no form post). No CSP change expected — to be confirmed by
  `make check-security-headers`.
- `Referrer-Policy: strict-origin` (from `config/security-headers.json`) keeps `code`/`state` out of `Referer` to
  third parties; the SPA must still strip them from the address bar (`history.replaceState`)
  before rendering anything that could leak them, and never log them (observability
  `piiScrubber` must cover `code` and `state`; _(2026-11-19)_ the GraphQL `pendingSessionId` never
  enters a URL or a log).
- `code`/`state` are single-use (backend `validateAndConsume`), so React 19 StrictMode's
  double-invoked effects would burn the code on the second call — the relay must be idempotent
  within the page lifetime. _(2026-11-19)_ It is keyed by the history entry (PRD FR9).

## 7. Risks

| Risk                                                       | Likelihood | Impact | Mitigation in plan                                                                                                                 |
| ---------------------------------------------------------- | ---------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| Contract pin cannot move to a released tag                 | High       | Medium | Pending contract fragment until a release declares the mutations _(revised 2026-11-24, PRD D3)_                                    |
| Mobile Lighthouse regression on `/sign-in`                 | Medium     | High   | Callback code in its own lazy chunk; button module change ≤ 1 kB                                                                   |
| Double callback under StrictMode                           | High       | Medium | Single-flight relay keyed by the history entry _(2026-11-19, PRD FR9)_                                                             |
| `code`/`state` leak through history, logs, Sentry          | Medium     | High   | `replaceState` first; scrubber keys; unit tests                                                                                    |
| 2FA route not merged when this lands                       | Medium     | Low    | Degrade to a localized "complete sign-in with password" notice _(resolved 2026-11-20: #331 merged; the hand-off is built, PRD D6)_ |
| Developer confusion between Mockoon and real-provider mode | Medium     | Medium | An `.env` edit plus `make apollo-restart` (FR18), and a local verification guide _(2026-11-19)_                                    |
