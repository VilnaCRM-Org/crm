---
status: complete
workflowType: research
project_name: crm
date: 2026-10-05
revised: 2026-10-08
feature: create-new-password
issue: https://github.com/VilnaCRM-Org/crm/issues/315
inputDocuments:
  - specs/create-new-password/planning-artifacts/run-summary-create-new-password-2026-10-05.md
  - 'scratchpad: openapi-main.yaml (user-service main a95c1e85, paths 2418-2580)'
  - 'scratchpad: graphql-main.graphql (user-service main a95c1e85, lines 225-240, 625-660)'
  - 'scratchpad: figma/72-5596-forgot-desktop.png, 72-5617-forgot-tablet.png,
    72-5638-forgot-mobile.png, 360-11925-check-email-desktop.png,
    360-11949-check-email-mobile.png, miro-764591.png, miro-803371.png'
  - src/routes/route-paths.ts
  - src/routes/registry.ts
  - src/routes/app-routes.ts
  - src/routes/route-mapper.tsx
  - src/routes/route-composer.tsx
  - src/routes/types/app-route.ts
  - src/routes/types/navigation-state.ts
  - src/modules/user/README.md
  - src/modules/user/config/di.ts
  - src/modules/user/config/tokens.ts
  - src/modules/user/features/auth/routes/index.ts
  - src/modules/user/features/auth/routes/sign-in/index.tsx
  - src/modules/user/features/auth/routes/sign-in/sign-in-form-section.tsx
  - src/modules/user/features/auth/routes/sign-in/form-section-loader.ts
  - src/modules/user/features/auth/components/auth-page-layout/index.tsx
  - src/modules/user/features/auth/components/auth-form-section/index.tsx
  - src/modules/user/features/auth/components/auth-switcher/index.tsx
  - src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx
  - src/modules/user/features/auth/components/form-section/auth-forms/login-form-fields.tsx
  - src/modules/user/features/auth/components/form-section/auth-forms/use-login-submitter.ts
  - src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx
  - src/modules/user/features/auth/components/form-section/auth-forms/registration-success-view.tsx
  - src/modules/user/features/auth/components/form-section/components/user-options/index.tsx
  - src/modules/user/features/auth/components/form-section/components/password-field.tsx
  - src/modules/user/features/auth/components/form-section/components/form-field.tsx
  - src/modules/user/features/auth/components/form-section/validations/password.ts
  - src/modules/user/features/auth/components/form-section/validations/email.ts
  - src/modules/user/features/auth/repositories/base-api.ts
  - src/modules/user/features/auth/repositories/login-api.ts
  - src/modules/user/features/auth/repositories/registration-api.ts
  - src/modules/user/features/auth/repositories/auth-repository-impl.ts
  - src/modules/user/features/auth/repositories/api-status-error-factory.ts
  - src/modules/user/features/auth/repositories/auth-error-factory.ts
  - src/modules/user/features/auth/stores/index.ts
  - src/modules/user/features/auth/stores/auth-var.ts
  - src/modules/user/features/auth/stores/auth-store-actions.ts
  - src/modules/user/features/auth/utils/auth-security-signals.ts
  - src/modules/user/features/auth/utils/response-schemas.ts
  - src/modules/user/features/auth/hooks/use-post-login-redirect.ts
  - src/modules/user/features/auth/types/auth-error.ts
  - src/modules/user/features/auth/types/auth-store.ts
  - src/modules/user/features/auth/i18n/en.json
  - src/modules/user/features/auth/i18n/uk.json
  - src/components/ui-form/index.tsx
  - src/components/types/ui-form/index.ts
  - src/components/ui-form-input-field/index.tsx
  - src/components/skeletons/base/auth-form-shared-styles.ts
  - src/config/api-config.ts
  - src/config/runtime/feature-flag-service.ts
  - src/config/runtime/app-config-schema.ts
  - src/services/https-client/fetch-https-client.ts
  - src/services/https-client/http-response-processor.ts
  - src/services/https-client/http-error-response-parser.ts
  - src/services/types/https-client/https-client.ts
  - src/services/resilience/transient-error-detector.ts
  - src/services/resilience/request-retry-service.ts
  - src/services/error/error-handler.ts
  - src/services/types/security-events/security-event.ts
  - src/services/security-events/security-event-core.ts
  - src/services/observability/pii-scrubber.ts
  - src/lib/reliability/request-deadline.ts
  - src/api/contracts/README.md
  - scripts/codegen.sh
  - Mockoon.Dockerfile
  - docker-compose.yml
  - docker-compose.test.yml
  - .env.example
  - config/class-naming-policy.js
  - config/di-collaborator-policy.js
  - config/module-shape.json
  - config/security-headers.json
  - config/docs-policy.json
  - config/metrics-policy.json
  - .jscpd.json
  - scripts/ci/mutation-scope.mjs
  - jest.config.ts
  - .dependency-cruiser.js
  - tests/e2e/route-coverage.tsv
  - scripts/ci/check-e2e-route-coverage.ts
  - tests/unit/tooling/runtime-config-contract.test.ts
  - tests/unit/tooling/paint-path-graph.test.ts
  - tests/e2e/modules/user/features/auth/runtime-config.spec.ts
  - tests/e2e/modules/user/features/auth/components/form-section/auth-forms/login-form.spec.ts
  - tests/e2e/a11y/sign-in-keyboard.a11y.spec.ts
  - tests/utils/override-runtime-config.ts
  - tests/visual/constants.ts
  - lighthouse/constants.js
  - lighthouse/lighthouserc.mobile.js
  - docs/feature-flags.md
  - docs/adr/007-reliability-model.md
  - docs/adr/008-frontend-state-architecture.md
  - docs/adr/009-runtime-resilience.md
  - docs/adr/011-tsyringe-dependency-injection.md
  - docs/adr/012-contract-driven-api-mocks.md
  - docs/adr/016-ui-toolkit-installation.md
  - docs/adr/017-mui-theme-off-the-eager-path.md
  - specs/sign-up-sign-in-pages/planning-artifacts/prd-sign-up-sign-in-pages-2026-06-25.md
  - specs/sign-up-sign-in-pages/planning-artifacts/architecture-sign-up-sign-in-pages-2026-06-25.md
  - specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md
---

# Research: create new password (password recovery) in the `user` module

**Author:** BMad (Analyst) **Date:** 2026-10-05 **Feature:** `create-new-password`

> Superseded transport (2026-10-05): the user chose GraphQL only; REST findings in §2, §3.4,
> §3.6, §5.1, §6 and the transport assumptions are historical — see the architecture §5.1.
>
> Mocked GraphQL (2026-10-05): built now on a pending schema extension; see architecture §5.16.

This document records what exists today, what the backend offers, what the designs show, and
which repository gates bind the implementation. Every claim about the repository cites the file
and line it was read from. Decisions this stage had to make on its own are marked with
`> Assumption:` lines; later stages (brief, PRD, architecture, epics) may overturn them with a
recorded reason.

## 1. Current-state findings

### 1.1 The entry point already exists, gated off

The recovery flow was anticipated by issue #145 and is wired up to the first link:

- `ROUTE_PATHS.passwordRecovery = '/password-recovery'` is declared "ahead of the flow it names"
  (`src/routes/route-paths.ts:5-7`).
- The sign-in options row renders a `UILink` to it, hidden behind the `forgotPassword` runtime
  flag (`src/modules/user/features/auth/components/form-section/components/user-options/`
  `index.tsx:15,41-45`), styled with a 24 px minimum height and a real underline for WCAG 1.4.1
  (`…/user-options/styles.ts:54-86`).
- The flag is the only flag in the system: `FeatureFlag = 'forgotPassword'`
  (`src/config/runtime/types/feature-flag.ts:1`), default `false`
  (`src/config/runtime/feature-flag-service.ts:4-6`), accepted by the zod schema
  (`src/config/runtime/app-config-schema.ts:18-22`), shipped as
  `{ "flags": { "forgotPassword": false } }` (`public/index.html:28`), overridable per deployment
  through `APP_CONFIG_FLAG_FORGOT_PASSWORD` (`.env.example`).
- Localized label `sign_in.form.forgot_password` exists in both catalogs
  (`src/modules/user/features/auth/i18n/en.json:97`, `uk.json:97`: "Забули пароль?").

Three gates already pin that state and will move the moment the route is registered:

- `tests/unit/tooling/runtime-config-contract.test.ts:195-203` — the shipped flag default may be
  `true` only once a route contract registers `ROUTE_PATHS.passwordRecovery`.
- `tests/e2e/route-coverage.tsv:15` — `passwordRecovery` is `allowlisted` ("nothing renders it").
- `scripts/ci/check-e2e-route-coverage.ts:203-205` — an allowlisted route that a contract
  registers fails the gate, so the row must become e2e/visual rows in the same change.

> Superseded 2026-10-13: issue #309 removed the `forgotPassword` flag before this feature was
> built. `FeatureFlag` is `never`, `public/index.html` ships `{ "flags": {} }`, and the sign-in
> "Забули пароль?" link renders unconditionally; the citations above record the 2026-10-05 tree.

`isRouteRegistered` scans only `src/routes/app-routes.ts` and
`src/modules/user/features/auth/routes/index.ts` for `path: ROUTE_PATHS.<key>`
(`tests/unit/tooling/runtime-config-contract.test.ts:86-95`), so the route **must** be declared
in the auth feature's contract for the flag gate to recognise it. `docs/feature-flags.md:104-114`
documents the lifecycle: enable once the flow ships, then delete the flag (stage 3).

Existing tests assert the link's `href` is exactly `/password-recovery`
(`tests/e2e/modules/user/features/auth/runtime-config.spec.ts:29-31`,
`tests/unit/modules/user/features/auth/components/form-section/components/`
`user-options.test.tsx:43`).

### 1.2 Routing: module-owned contract, lazy pages, reload policy

- The auth contract declares `/sign-up` and `/sign-in` as `guard: 'public'` routes with
  `webpackChunkName`-named dynamic imports and `meta.titleKey`
  (`src/modules/user/features/auth/routes/index.ts:4-20`). The registry lists `appRoutes` and
  `authRoutes` only (`src/routes/registry.ts:6`); a new auth route needs **no** registry edit.
- `RouteMeta` carries `titleKey` and `permission` (`src/routes/types/app-route.ts:11-14`); pages
  call `usePageTitle(titleKey)` themselves (`…/routes/sign-in/index.tsx:12`,
  `src/hooks/use-page-title.ts:19-23`).
- `RouteMapper` wraps every loader in `ChunkRetryLoader` + `ThemedChunkLoader`, and a public route
  additionally in `ReloadingChunkLoader` (reload once on chunk miss)
  (`src/routes/route-mapper.tsx:17-40`). The composer attaches `errorElement` per page
  (`src/routes/route-composer.tsx:54-58`).
- A sign-in page is `AuthPageLayout` + a lazily loaded, `webpackPreload`ed form section
  (`…/routes/sign-in/index.tsx:9-20`, `…/routes/sign-in/form-section-loader.ts:1-11`).

### 1.3 Page chrome and forms to reuse

- `AuthPageLayout` renders `UIBackToMain`, a `<main tabIndex={-1}>` that receives arrival focus,
  `AuthErrorBoundary`, a `Suspense` with `AuthSkeleton`, and `UIFooter`
  (`…/components/auth-page-layout/index.tsx:11-36`).
- `AuthFormSection` renders the card (`styles.formWrapper`), **always** mounts the OAuth provider
  buttons inside an `InertBox`, and a `switcher` slot
  (`…/components/auth-form-section/index.tsx:9-24`). The recovery screens have no OAuth block
  (Figma), so this component cannot be reused as-is.
- The card sizing lives in `src/components/skeletons/base/auth-form-shared-styles.ts:40-61`:
  `maxWidth` 22.6875rem (363 px) mobile, 39.5rem (632 px) at `md`, 31.375rem (502 px) at `xl`.
  Figma's recovery cards are 363 / 636 / 502 px — the existing card matches within 4 px.
- `UIForm` provides: a focused `role="alert"` error banner, an `h1`-capable header, the
  always-mounted `UIOfflineNotice`, `aria-busy`, the loading submit button and a polite
  `UILiveStatus` for the submitting announcement (`src/components/ui-form/index.tsx:24-34,100-114`;
  props in `src/components/types/ui-form/index.ts:12-29`).
- `FormField` wires a `<label htmlFor>` to `UIFormInputField`
  (`…/components/form-field.tsx:21-41`), which hands MUI `TextField` `error` + `helperText`
  (`src/components/ui-form-input-field/index.tsx:20-26`) — MUI then emits `aria-invalid` and
  `aria-describedby` (asserted today by `tests/e2e/a11y/sign-in-keyboard.a11y.spec.ts`).
- `PasswordField` hard-codes `name="password"`, the generic bound `T extends { password: string }`
  and the `validators.password` rules (`…/components/password-field.tsx:43,56-61`). A
  **confirm-password** field therefore needs `PasswordField` generalised (a `name` and a `rules`
  prop with today's values as defaults) or a sibling component — the former avoids a jscpd clone.
- Autocomplete precedents: `autoComplete="email"` (`…/auth-forms/login-form-fields.tsx:17`),
  `"current-password"` (`:23`), `"new-password"` (`…/registration-form-fields.tsx:43`).

### 1.4 Validators

- `PasswordValidator` rules: length 8–64, `/[0-9]/`, `/\p{Lu}/u`, `/\p{Ll}/u`
  (`…/validations/password.ts:7-12`), messages under `sign_up.form.password_input.*`
  (`:18-26`).

- `EmailValidator`: non-empty, contains `@` and `.`, then a full regex
  (`…/validations/email.ts:5-7,10-17`); messages under `sign_up.form.email_input.*`.
- `FormValidators.create(t)` returns `{ email, password, fullName }`
  (`…/validations/index.ts:10-22`); the shape is typed in
  `src/modules/user/features/auth/types/validations/index.ts:3-7`.

> Superseded 2026-10-13: the uppercase rule is now `/[A-Z]/`, matching user-service's pattern
> (PRD FR-24), so risk 6 below is closed.

### 1.5 Repositories, transports, error mapping

- `API_ENDPOINTS` holds `REGISTER` and `LOGIN`, both `urlBuilder.build('/api/users')`
  (`src/config/api-config.ts:3-6`); `UrlBuilder` prefers the runtime `apiBaseUrl` over
  `REACT_APP_MOCKOON_URL` (`src/utils/url-builder.ts:5-13`).
- **Login is REST**: `LoginAPI extends BaseAPI`, injects `HttpsClient` + `ApiErrorFactory`, posts
  with a zod `schema`, the caller's `signal`, and `retry: true` ("a login attempt issues a token
  and creates nothing") (`…/repositories/login-api.ts:15-44`).
- **Registration is GraphQL**: `RegistrationAPI` injects `ApolloClient`, validates the result with
  `CreateUserResultSchema`, normalises Apollo's `networkError.statusCode` into `HttpError`
  (`…/repositories/registration-api.ts:22-46,87-93`).
- `BaseAPI.handleApiError` is the only inherited behaviour (`…/repositories/base-api.ts:5-15`).
- `AuthRepositoryImpl` turns API results into `AuthResult` and aborts into a non-retryable
  `aborted` error (`…/repositories/auth-repository-impl.ts:10-53`); its deps arrive through one
  `AuthRepositoryDeps` object registered by factory (`src/modules/user/config/di.ts:92-111`).
- HTTP status → `ApiError`: `400`/`422` → `ValidationError`; `404` → `NOT_FOUND`; `429` →
  `RATE_LIMITED` ("Too many requests. Please slow down."); `5xx` → server/service
  (`…/repositories/api-status-error-factory.ts:16-44`).
- `ApiError` code → `AuthErrorKind`: `NOT_FOUND` and `FORBIDDEN` are **not** mapped (they become
  `'unknown'`), `RATE_LIMITED` → `'server'` (`…/repositories/auth-error-factory.ts:9-21`).
- `ErrorHandler.handleAuthError` supplies the English `displayMessage` and `retryable`:
  `NOT_FOUND` not retryable, `RATE_LIMITED` retryable, `VALIDATION_ERROR` "Invalid data provided"
  (`src/services/error/error-handler.ts:10-69`). Login then **discards** that text unless it is an
  i18n key and shows `auth.error.unknown` (`…/auth-forms/use-login-submitter.ts:13-27`), so the
  recovery flow must map error kinds to its own i18n keys rather than display `displayMessage`.
- The 204 responses the reset endpoints return are handled: `HttpResponseProcessor` returns
  `undefined` for `204` before touching the schema
  (`src/services/https-client/http-response-processor.ts:10,23-27`),
  but `RequestConfig.schema` is **required** by type
  (`src/services/types/https-client/https-client.ts:10-16`) — the call will pass a
  `z.undefined()`-style schema.
- Retry: only `GET`/`PUT`/`DELETE` retry by default; a `POST` must opt in with `retry: true`
  (`src/services/https-client/fetch-https-client.ts:16-18,44-56`). Transient = status `0`, `408`,
  `500`, `502`, `503`, `504`; never `429` (`src/services/resilience/transient-error-detector.ts:6`).
  Three attempts inside one deadline budget
  (`src/services/resilience/request-retry-service.ts:13-17`).
- `HttpErrorResponseParser` emits `unauthorized_response` for `401`/`403` only
  (`src/services/https-client/http-error-response-parser.ts:13,27-29`).

### 1.6 State and the deferred composition root

- `AuthState` holds `email`, `token`, `user`, two `*Loading` and two `*Error` fields
  (`…/types/auth-store.ts:5-13`); `AuthActions` has six members (`:15-22`).
- `AuthStateVar` is a container-free class over `ReactiveVarFactory`, exported as a module
  singleton (`…/stores/auth-var.ts:16-55`), read through `useAuthState` / `useAuthToken`.
- `DeferredAuthActions` (in `…/stores/index.ts:15-82`) sets loading flags synchronously, then
  loads the DI container and `AuthStoreActions` behind a `ChunkRetryLoader`, and maps a failed
  chunk load to a retryable `'network'` `AuthError`. `authActions` is the exported singleton.
- `AuthStoreActions` is the injectable that calls the repository and `AuthSecuritySignals`
  (`…/stores/auth-store-actions.ts:9-35`).
- dependency-cruiser allows **only** `stores/index.ts` (among feature files) to import a DI
  composition root (`.dependency-cruiser.js:430-445`), so any new deferred facade must be
  composed there.
- `AuthSecuritySignals` records `authFailure('login' | 'registration', reason)`; `429` becomes
  `rate_limited` (`…/utils/auth-security-signals.ts:24-65`). `AuthFailureCategory` is the closed
  union `'login' | 'registration'` (`src/services/types/security-events/security-event.ts:4-6`).

### 1.7 Post-login redirect, arrival focus, navigation state

- `usePostLoginRedirect` navigates on a null→token transition only, with
  `state: { focusMain: true }` (`…/hooks/use-post-login-redirect.ts:7-19`); `AuthPageLayout`
  consumes `focusMain` through `useArrivalFocus` (`src/hooks/use-arrival-focus.ts:10-23`).
- `RedirectNavigationState` is `{ from?, focusMain? }`
  (`src/routes/types/navigation-state.ts:7-10`).
- No file under `src/` reads `location.search`, `useSearchParams` or calls
  `history.replaceState` today (grep: only `sessionStorage` in `reload-once-guard.ts` and a
  `URLSearchParams` body-type check in `http-request-config-builder.ts:42`). Reading the reset
  token from the URL is a first.

### 1.8 i18n, titles, copy

Catalog: `src/modules/user/features/auth/i18n/{en,uk}.json`, merged into
`src/i18n/localization.json` by `make i18n-generate` and gated by `make lint-i18n`. Reusable
keys: `sign_up.form.email_input.placeholder` (`vilnaCRM@gmail.com`, the Figma placeholder),
`sign_up.form.password_input.*` errors, `auth.password.show|hide`, `buttons.back_to_main`,
`notifications.success.button` ("Назад" / "Go back"), `sign_in.title` ("Аутентифікація").

### 1.9 Contract pins, codegen and mocks

- Pins: `GRAPHQL_SCHEMA_VERSION=v2.8.0`, `OPENAPI_SPEC_VERSION=v2.8.0` (`.env.example`), read
  from the template by `scripts/codegen.sh:19-39`, which fetches raw files **by tag**.
- `Mockoon.Dockerfile:9-13` `ADD`s the v2.8.0 spec and verifies `OPENAPI_SPEC_SHA256`; Mockoon
  serves that document directly (ADR-012), so `/api/reset-password` **404s in the mock** until
  the pin moves.
- `src/api/generated/openapi.ts` is **not imported** by any source file (grep over `src/`
  returns only `graphql.ts` consumers in `registration-api.ts:5-9` and
  `create-user-mutation.ts:5`). REST request/response types are hand-authored
  (`…/types/credentials.ts`, `…/types/api-responses.ts`) with zod twins in
  `…/utils/response-schemas.ts:3`. `src/api/contracts/README.md:53-55` states a parity test
  keeps schema and generated shape aligned.
- The transport rule: GraphQL for user-graph reads/writes, REST for session/token exchange and
  what the graph does not model; when both expose a resource, GraphQL for the write and REST for
  the token concern (`src/api/contracts/README.md:24-40`). Bump procedure: `:68-78`.
- Browser suites mock REST with `page.route('**/api/users', …)` rather than Mockoon
  (`tests/e2e/…/auth-forms/login-form.spec.ts:10,40-44`; `login-retry.spec.ts:10,50-56`).

### 1.10 Security headers and observability relevant to a token in the URL

- `Referrer-Policy: strict-origin-when-cross-origin` and `X-Frame-Options: DENY` are set on the
  document; CSP `connect-src 'self'` plus the configured API origins, `form-action 'self'`
  (`config/security-headers.json`). The page makes no third-party requests.
- `PiiScrubber` drops object **keys** containing `token`, `password`, `email`, … and redacts
  e-mail, `Bearer` and JWT-shaped **strings** (`src/services/observability/pii-scrubber.ts:4-18`).
  A 32-character opaque reset token inside a `url` string (`…?token=abc`) matches none of the
  string patterns and the key is `url`, so it would survive scrubbing.

### 1.11 Lighthouse, visual and e2e coverage today

- Lighthouse audits `/`, `/sign-up`, `/sign-in` only (`lighthouse/constants.js:15-19`); mobile
  performance floor 0.84, a11y 0.9 (`lighthouse/lighthouserc.mobile.js:35-38`).
- The paint-path graph test forbids `tsyringe`, `@apollo/client`, `zod`, `@sentry/react` on the
  static import graph from `src/index.tsx` (`tests/unit/tooling/paint-path-graph.test.ts:16-21`);
  lazily routed pages are outside it.
- `no-paint-path-import-di-bridge` is a `reachable` rule over the whole
  `src/modules/user/features/auth/` tree (`.dependency-cruiser.js:484-498`): nothing in the auth
  feature may reach `@/providers/di` (`useService`), lazily or not.
- Visual baselines: 13 screen sizes × three desktop engines per page (`tests/visual/constants.ts`),
  plus the mobile lane for `/sign-in` and `/sign-up`. Route coverage rows are mandatory per route
  key (`tests/e2e/route-coverage.tsv` header, lines 1-8).

### 1.12 Prior art and ADRs

`specs/sign-up-sign-in-pages/planning-artifacts/` (PRD, architecture, epics; 17 stories, done)
planned the last auth-page feature: it extracted `AuthPageLayout`, `AuthFormSection`,
`AuthSwitcher`, gave `UIForm` a real `<h1>`, added routes behind the registry, pointed Lighthouse
at the new pages, split the visual specs per page, and finished with a "coverage to 100% and
mutation hardening" story plus a docs/gate sweep — the same shape this feature needs.

ADRs that bind here: ADR-007 (recoverable errors, per-route `errorElement`), ADR-008 (client/UI
state in a `*Var` over `ReactiveVarFactory`; session token stays in `AuthStateVar`; superseded
2026-10-08 by the Zustand ADR of the prerequisite chore `zustand-client-state`), ADR-009
(deadline, idempotent-only retry, offline notice, reload-once on public routes), ADR-011 (tsyringe
off the paint path; `useService` outside it), ADR-012 (Mockoon serves the pinned OpenAPI; Apollo
mock implements only `createUser`), ADR-016 (toolkit primitives behind CRM seams; `UIBackToMain`
is a toolkit seam), ADR-017 (no `@mui/material` import on the eager path; page chunks load the
theme in parallel). All seventeen ADRs are listed in `docs/adr/README.md`.

## 2. Domain model and ubiquitous language

The password-recovery subdomain belongs to user-service's account/identity context. On the
frontend it is a thin client of that context; the repository and its mappers are the
anti-corruption layer that turns HTTP semantics into the repo's `AuthResult` vocabulary.

| Term                 | Meaning in this feature                                              |
| -------------------- | -------------------------------------------------------------------- |
| Reset request        | "Send a reset link to this e-mail" (`POST /api/reset-password`)      |
| Reset link           | The e-mailed URL carrying the reset token as `?token=`               |
| Reset token          | Opaque, 32 chars, 1 h TTL, single-use; a credential, never logged    |
| New password         | The candidate password; must satisfy the password policy             |
| Password policy      | API: 8–64 chars, a digit, an ASCII uppercase; client adds lowercase  |
| Confirmation         | "Set this new password for this token" (`…/reset-password/confirm`)  |
| Masked e-mail        | Display projection of the submitted address (`eir*****@gmail.com`)   |
| Uniform outcome      | Request step says "check your e-mail" whether or not the user exists |
| Invalid/expired link | Confirmation refused with `400`/`404`; recovery is a new request     |
| Rate limit           | `429`; 3 requests/h per user, 5/h per IP, 10 confirmations/min       |

Mapping to the Miro component diagram (`miro-764591.png`): **Reset Password [React component]**
is the request screen (edge "reset password 1 Restore password" → API); **Create new password
[React component]** is the confirmation screen (edge "2 request for sign-in" → API, edge
"3 redirect to sign-in" → Sign-In). The authenticated "changing password" under User settings is
a different flow and out of scope.

Frontend-side model, kept to the repo's class conventions and nothing more:

- **Client/UI state** (ADR-008 category: browser-owned, not the session): a `*Var` holding the
  recovery step (`idle | submitting | sent`), the submitted e-mail, the reset token read from
  the URL, the confirmation step and the last `AuthError`. It is not session state — the reset
  token is not the access token — so it does not belong in `AuthStateVar`.
- **Value objects**: the reset token (non-empty, ≤255 chars) and the masked e-mail are plain
  readonly types in `types/` files; they carry no behaviour, so no class is warranted. The one
  piece of behaviour — masking — is a `*Mapper` ("translation between representations").
- **Repository** (anti-corruption layer): a `PasswordRecoveryRepository` interface with
  `requestReset(email, signal)` and `confirmReset({ token, newPassword }, signal)` returning
  `AuthResult<void>`; the implementation maps `204` and `404` on the request step to `ok`, and
  `400`/`404` on the confirm step to a distinguishable `AuthError` (kind `'validation'` with
  status), so the UI can offer "request a new link".
- **Policy/validator**: the existing `PasswordValidator` is reused for the new password; a
  confirm-password rule compares against the first field (react-hook-form `validate` with
  `getValues`), which is a two-line rule, not a new class.

> Assumption: no new GoF pattern is introduced. The feature reuses the existing Repository,
> Mapper, Factory (error factories) and Loader (`ChunkRetryLoader`) implementations; the only
> extraction it justifies is the container-loading seam that `DeferredAuthActions.load()` and
> the new deferred recovery actions would otherwise duplicate (a second implementation exists).
> Deliberately **not** patterns: the recovery step is a union-typed field in the var, not a
> State or Strategy class; there is no Command object for the two requests; errors reuse
> `AuthError`.
>
> Superseded 2026-10-08: the recovery step, address, failure and token live in `useState` inside
> the flow hooks (architecture §5.3), not in a `*Var` or any store, and client and UI state moves
> from the reactive var to Zustand stores (`useAuthStore`, `useConnectivityStore`) in the
> prerequisite chore `zustand-client-state`, which supersedes ADR-008.

## 3. Backend contract analysis

### 3.1 REST (user-service `main`, `openapi-main.yaml:2418-2580`)

- `POST /api/reset-password` — body `{ email }` (format email, ≤254). Responses: `204`;
  `400` invalid payload; `404` user not found; `422` validation; `429` rate limit; `500`
  problem+json.
- `POST /api/reset-password/confirm` — body `{ token (≤255), newPassword }`. Responses: `204`;
  `400` invalid or expired token; `404` token not found; `422` validation; `500` problem+json.

`newPassword` inline schema: `minLength 8`, `maxLength 64`,
`pattern ^(?=.*[0-9])(?=.*[A-Z]).{8,64}$` (`:2538-2543`). Two defects in the upstream document
worth reporting:

- The request-body properties carry `enum: [reset-confirm-token]` / `enum: [passWORD1]` /
  `enum: [reset-confirm-token-ld]` (`:2539,2545,2559,2565`). `openapi-typescript` would type
  `token` and `newPassword` as those literals, making the generated REST types unusable for
  real values. This does not block the crm today only because REST types are hand-authored
  (§1.9), but it will surface on the pin bump.
- The reusable component `EmptyResponse.ConfirmPasswordResetDto.newPassword` declares a
  different pattern, `^(.*[A-Z].*)$` (`:2632-2645`), i.e. no digit requirement — the two
  schemas disagree.

Neither endpoint exists in the pinned **v2.8.0** spec (0 matches for "reset"), and `main` has
no tag after v2.8.0.

### 3.2 GraphQL (`graphql-main.graphql:233-235, 633-660`)

`requestPasswordResetUser(input: { email!, clientMutationId })` and
`confirmPasswordResetUser(input: { token!, newPassword!, clientMutationId })`, both returning
`{ user: User, clientMutationId }`. Returning `user` on the request mutation is an enumeration
surface the SDL cannot rule out, and the GraphQL half carries the open upstream rate-limiter
bypasses (#462, #469, #470).

### 3.3 Transport decision

> Assumption: **both operations use REST through `HttpsClient`**, like `LoginAPI`. Rationale:
> (a) the README rule reserves REST for the credential/session concern, and a password reset is
> a credential operation, not a user-graph write; (b) REST answers `204` with no body on both
> steps, which is the uniform, payload-free shape anti-enumeration needs, while the GraphQL
> payload exposes `user`; (c) the REST limiter is enforced (`429` modelled), the GraphQL one is
> bypassable upstream today; (d) a REST call keeps `@apollo/client` out of the recovery chunks.

**Superseded by the GraphQL decision (2026-10-05).** The user decided that both operations use
GraphQL only (`requestPasswordResetUser`, `confirmPasswordResetUser`); the brief, PRD,
architecture (§5.1, §5.5, §15.2) and epics (Prerequisite P.1) carry that decision, and this
section is kept as the record of the option that was not taken.

### 3.4 Retry policy per operation

Superseded: the `HttpsClient` retry mechanics below are historical; see the architecture §5.1.

> Assumption: **neither request opts in to transport retry** (`retry` stays unset, so the
> `POST` default of no retry applies, `fetch-https-client.ts:16-18`). The request step sends an
> e-mail and consumes the user's 3/h quota on every accepted attempt, and upstream does not
> state whether a second token invalidates the first — a duplicated send is a user-visible
> side effect, so a timeout surfaces as a retryable error with a user-initiated Retry. The
> confirm step consumes a single-use token and must never be replayed. Both still run under the
> `RequestDeadline` (default 10 000 ms) and the caller's abort signal.

### 3.5 The e-mail link host

`PasswordResetEmailSentEventSubscriber::createResetUrl` builds
`${API_BASE_URL}/password-reset?token=<urlencoded>`. The path is right for an SPA route; the
host is the API's. A user-service issue is required to point the link at the SPA origin (a
separate `FRONTEND_URL`/`APP_URL`-style setting). Until it lands, real e-mails do not reach the
crm page regardless of what the crm ships.

### 3.6 Status → UI mapping the repository must implement

Superseded: this REST status table is historical; see the architecture §5.1 and §5.5.

Request step:

- `204`, `404` → `ok` → the "check your e-mail" screen with the masked e-mail.
- `400`, `422` → `validation` error → field-level e-mail error.
- `429` → `server` error with `status: 429` and a `rate_limited` signal → "too many requests,
  try later" banner, form stays.
- `0`, `5xx`, timeout → retryable `network` / `server` error → banner with a Retry action.

Confirm step:

- `204` → `ok` → navigate to `/sign-in` with a one-time success notice.
- `400`, `404` → invalid-link error (`validation` kind, status kept) → "link invalid or expired"
  view whose only action requests a new link.
- `422` → `validation` error → new-password field error.
- `0`, `5xx`, timeout → retryable error → banner; Retry re-submits the same form.

`AuthErrorFactory` maps `NOT_FOUND` to `'unknown'` today (`auth-error-factory.ts:9-21`), so the
request-step `404` must be folded into `ok` **before** the generic factory runs (in the
recovery repository), and the confirm-step `404` needs the status preserved on the error (the
factory already copies `status`, `:28-36`).

## 4. Design analysis

Source: Figma `xZ7ccrH6d4QyqLQsayFSEX`, section "Восстановление пароля"; captures in the
scratchpad `figma/` folder.

### 4.1 Forgot password (request) — `72:5596` desktop, `72:5617` tablet, `72:5638` mobile

Desktop/tablet: app top bar `‹ На головну сторінку` (existing `UIBackToMain`), centred card
(502 / 636 wide), inside: `‹ Назад` (chevron 24 + "15 medium" text), H4 "Забули пароль?", body
"Введіть адресу поштової скриньки вашого аккаунту" (Golos 16/26), label **E-mail**, input with
the placeholder `vilnaCRM@gmail.com` (422 × 91 incl. label), primary pill button "Підтвердити"
(422 × 62), footer. Tokens: `Font/100 #1A1C1E`, `Font/200 #404142`, placeholder `#969B9D`,
stroke `#D0D4D8`, `Primary #1EAEFF`.

Mobile `72:5638` **differs**: the body reads "Ми надіслали Вам лист на пошту" followed by the
masked address `f*****dj@gmail.com` (a sent-state message) while the E-mail input and the
"Підтвердити" button are still shown,
and a row "Надіслати код ще раз 00:34" (resend with countdown) sits under the button. No
desktop or tablet frame draws this state.

### 4.2 Check your e-mail (sent) — `360:11925` desktop, `360:11937` tablet, `360:11949` mobile

Same chrome; card 502 × 312: `‹ Назад`, heading "Проверьте почту", body "Мы отправили письмо на
электронный адресс" + the masked address `eir*****@gmail.com` + "Проверьте почту и следуйте
инструкциям", primary button "К входу". The copy is **Russian**; shipped locales are `uk`
(main) and `en`.

### 4.3 Gaps

1. **No frame for the set-new-password form** (the "Create new password" component). Every text
   node on the page was searched; only the sign-in link and the authenticated settings page
   mention a password.
2. No error states drawn: invalid e-mail, `429`, network failure, invalid/expired link, weak
   password, mismatched confirmation.
3. The mobile request frame conflates two states and adds a resend countdown the other
   breakpoints lack.
4. Russian copy on the sent screen; "аккаунту" on the request screen is a non-standard spelling
   (Ukrainian orthography: "акаунту").
5. "Назад" target is unspecified (sign-in on the request screen; request screen on the sent
   screen is the only reading that keeps "К входу" meaningful).
6. The in-card "Назад" is 18 px tall text with a 24 px icon; it needs a 24 px minimum target
   (WCAG 2.2 2.5.8) — precedent: `minHeight: '1.5rem'` on the forgot-password link
   (`…/user-options/styles.ts:57`).

> Assumption: v1 ships the request screen (desktop/tablet reading, uniform sent state) and the
> check-your-e-mail screen as designed, and a set-new-password screen built from the same card
> and `UIForm` primitives with two password fields (new, confirm) and the "Підтвердити" button —
> recorded as a design-gap for the design owner to confirm. The mobile resend countdown is
> **out of scope** for v1; "Назад" on the sent screen returns to the request form, which is the
> resend path under the API's 3/h quota.

## 5. Security and accessibility research

### 5.1 OWASP Forgot Password practices applied to this contract

- **Uniform response.** The request step must render the same "check your e-mail" screen for
  `204` and `404` with identical timing as far as the client controls it (one request, one
  state transition). Never surface "user not found".
- **Token hygiene.** Read `token` from the query string once on mount, store it in memory (the
  recovery var), and immediately `navigate(pathname, { replace: true })` so the address bar,
  history entry and any later referrer no longer carry it. Never put it in `document.title`,
  logs, Sentry context or the DOM. Add a `token=[^&#\s]+` string pattern to `PiiScrubber`
  (§1.10) so an error captured before the strip cannot leak it.
- **Referrer.** `strict-origin-when-cross-origin` is already enforced on the document
  (`config/security-headers.json`), the page issues no third-party requests, and the footer's
  external links are the only cross-origin navigations — covered.
- **Rate limit.** Show a non-field banner for `429`, keep the form, and do not auto-retry.
  Record a `rate_limited` security signal (the reason already exists,
  `security-event.ts:10-11`).
- **Expired/invalid link.** `400`/`404` on confirm → a dedicated view with one action: request a
  new link (`/password-recovery`). Do not auto-navigate.
- **Password policy.** Reuse `PasswordValidator` (stricter than the API on lowercase, which is
  acceptable as a superset) and add a confirm-password field. Caveat: the client accepts any
  Unicode uppercase (`\p{Lu}`) while the API requires ASCII `[A-Z]`, so "Пароль123" passes the
  client and fails upstream with `422` — the field-level `422` mapping covers it; aligning the
  validator to ASCII is a shared sign-up change for the product owner.
- **Autocomplete.** `email` on the request field; `new-password` on both password fields.
- **After success, do not log in.** The API returns no session; navigate to `/sign-in` and show a
  one-time success notice there.
- **Security signals.** Confirm-step failures are credential-guessing signals: widen
  `SecurityEventCategory`/`AuthFailureCategory` with a `password_reset` category and record
  `auth_failure` with reason `validation` (bad token) or `rate_limited`; `SECURITY.md`'s event
  table must list it.

### 5.2 WCAG 2.2 AA concerns

- Step change (request → sent, confirm → invalid-link) moves focus to the new heading
  (`tabIndex={-1}` + `useFocusOnMount`, precedent `registration-success-view.tsx:23-32`) and the
  sent panel is a `role="status"` region (precedent `:111`) so the outcome is announced once.
- Submitting is announced by `UIForm`'s `UILiveStatus`; errors by the focused `role="alert"`
  banner (`ui-form/index.tsx:24-34`); field errors keep MUI's `aria-invalid`/`aria-describedby`.
- The "Назад" control is a real link (router navigation for sign-in; a button when it only
  changes the step), icon `aria-hidden`, accessible name from the visible text, ≥24 px target.
- Password visibility toggle keeps `aria-pressed` and Space activation
  (`password-field.tsx:28-39`), already covered by the keyboard contract spec.
- Keyboard order per screen must be asserted with `expectTabOrder` as
  `tests/e2e/a11y/sign-in-keyboard.a11y.spec.ts:34-44` does, and every new route added to
  `tests/e2e/a11y/routes.a11y.spec.ts` (axe, WCAG 2.1 AA tag set).

## 6. Constraints from repository gates

- **Classes only, no free functions (#100)** — every non-React `.ts` unit is a class; hooks
  stay functions.
- **Type-only files (#88)** — DTOs, the state shape and props live in `types/`; logic files
  declare no types.
- **Class naming (#129)** — names end in an approved suffix (`config/class-naming-policy.js`).
- **DI collaborator policy (#130)** — a new container-free singleton in `stores/`, `utils/` or
  `repositories/` needs an entry in `EXEMPT_RENDER_PATH_FILES`
  (`config/di-collaborator-policy.js:117-200`); only `tsyringe`, `reflect-metadata` and `uuid`
  may be value-imported inside a logic class (`:347`).
- **Component DI gate (#128)** — auth `.tsx` is carved out: it keeps module singletons and
  never calls `useService`.
- **`no-paint-path-import-di-bridge`** — nothing under `features/auth/` may reach
  `@/providers/di` (`.dependency-cruiser.js:484-498`).
- **DI roots import rule** — only `stores/index.ts` may import the composition root
  (`.dependency-cruiser.js:430-445`).
- **Module shape** — feature folders are limited to `assets`, `components`, `hooks`, `i18n`,
  `repositories`, `routes`, `stores`, `types`, `utils` (`config/module-shape.json`); the
  2026-10-08 revision adds `data-providers` and `transformers` (architecture §5.18).
- **rca metrics** — at most 10 functions (closures count) and 120 LLOC per file, 3 arguments
  and 10 LLOC per function, class NPM 8 (`config/metrics-policy.json`).
- **jscpd** — zero clones of 70+ tokens over `src` (`.jscpd.json`): share, never copy, the
  deferred loader and the result views.
- **Mutation 100%** — every new `src` file needs a direct unit test; static tables need
  isolated-load tests (`scripts/ci/mutation-scope.mjs:6-19` lists the exclusions).
- **Coverage 100%** — the unit and the integration Jest suites both enforce it over `src/**`
  (`jest.config.ts:50-69`).
- **i18n parity** — `en` and `uk` key sets identical; the merged catalog regenerated.
- **Route coverage manifest** — replace the `passwordRecovery` allowlist row and add e2e plus
  visual rows for every new key.
- **ADR drift gate** — `src/config/api-config.ts` (new endpoints) and any `src/config/runtime/**`
  flag change are significant paths (`config/docs-policy.json:58-65`): an ADR or `[no-adr]`.
- **Flag contract test** — the shipped default may flip to `true` only in the same change as, or
  after, the contract registers the route.
- **Console gate / e2e console guard** — no stray `console.*`; fulfilled `4xx` responses are
  tolerated in e2e (`tests/e2e/utils/fixtures.ts`).
- **Performance budgets** — new chunks are lazy; no `@mui/material` import on eager code
  (ADR-017).

Suffix check for the names the architecture stage is likely to need (all approved today):
`PasswordResetAPI` (API), `PasswordRecoveryRepositoryImpl` (Impl), `PasswordRecoveryStateVar`
(Var), `PasswordRecoveryActions` / `DeferredPasswordRecoveryActions` (Actions),
`PasswordRecoverySelectors` (Selectors), `MaskedEmailMapper` and `PasswordRecoveryErrorMapper`
(Mapper), a shared `*Loader` for the container seam (Loader). No new suffix is required.

> Superseded 2026-10-08: the Miro board's frontend layers are React hook, `[Data provider]`,
> `[Transformer]` and `[Repository]`, with no controller or service, and every value crossing a
> layer is a named type (TB-1). The `*Transformer` suffix is added and the unused `Controller`
> suffix removed by the prerequisite chore; this feature adds the `data-providers/` and
> `transformers/` folders, and its classes are `GraphQLPasswordRecoveryRepository`,
> `UserServiceErrorTransformer`, `PasswordRecoveryTransformer`, `PasswordRecoveryProvider` and
> `AuthProviderLoader` (architecture §1.1, §5.4, §5.18).

## 7. Risks

1. **Contract pin blocked.** No user-service tag contains the endpoints; `make codegen-check`
   and `make contract-diff` only run against tags. The feature can ship against hand-typed DTOs
   and zod (the way REST is typed today, §1.9) with `page.route` mocks, but the Mockoon stack
   and the generated types stay behind until a release is cut. The eventual bump spans 71+
   upstream commits (2FA, refresh token, sign-in DTO are visible in `main`'s spec) and will
   need `breaking-changes-approved.txt` review plus a new `OPENAPI_SPEC_SHA256`.
2. **Upstream schema defects** (`enum` literals on request properties, conflicting password
   patterns) will make the generated REST types wrong on that bump.
3. **E-mail link host** points at the API; without the upstream fix the end-to-end flow does
   not work in any environment.
4. **Enumeration via timing or copy** if `404` is not folded into `ok` inside the repository.
5. **Token leakage** through Sentry (`url` strings are not scrubbed) or history if the strip
   happens after an error.
6. **Validator mismatch** (`\p{Lu}` vs `[A-Z]`) produces a confusing `422` for Cyrillic passwords.
   Superseded 2026-10-13: closed by the `/[A-Z]/` rule (PRD FR-24).
7. **Design gaps** (no confirm-form frame, Russian copy, mobile resend) can stall the mandatory
   Figma gate; decisions must be recorded by the design owner.
8. **Gate friction**: the deferred facade duplication (jscpd), file-level metric caps on the
   store/index composition root, 100% mutation on new mappers and status tables.
9. **Flag lifecycle**: flipping `forgotPassword` to `true` and later deleting it touches
   `public/index.html`, `src/config/runtime/**`, `.env.example`, `docker-compose.test.yml`,
   docs and the ADR-drift path set. Superseded 2026-10-13: issue #309 deleted the flag, so
   there is no lifecycle left to run.
10. **Visual baselines** for two new pages × 13 sizes × 3 engines must come from CI artifacts
    (local prod containers go stale).

## 8. Recommendations for the next stages

1. **Place the feature inside `src/modules/user/features/auth/`** as two new routes in the
   existing contract (`routes/password-recovery/`, `routes/password-reset/`), not as a new
   feature: the sign-in link, the page chrome, the fields, the validators, the error factories,
   the i18n catalog and the flag-contract probe (§1.1) all live there, and crossing a feature
   boundary is barrel-only (`src/modules/user/README.md:22-30`), so a sibling feature could not
   reuse `AuthPageLayout` without exporting React components from `@auth`.
2. **Two route keys.** Keep `passwordRecovery = '/password-recovery'` for the request screen
   (it is pinned by tests and the sign-in link) and add `passwordReset = '/password-reset'` for
   the token landing page so it matches the backend's `createResetUrl` path exactly; the
   upstream issue then only needs to change the host.
3. **Request + sent as one route with an in-page step** (like registration's form/success
   views), confirm + invalid-link as the second route; success navigates to `/sign-in` with a
   one-time notice. Decide in architecture whether the notice travels in navigation state
   (extend `RedirectNavigationState`) or in the recovery var; the var needs no URL and no
   router-state typing changes.
4. **REST for both operations, no transport retry, user-initiated Retry** (§3.3–3.4).
   Superseded 2026-10-05: both operations use GraphQL; the no-retry and user-initiated Retry
   parts still hold (architecture §5.1).
5. **A dedicated `PasswordRecoveryRepository` + `PasswordResetAPI`** rather than growing
   `AuthRepositoryImpl`, to respect class metric caps and keep the `404 → ok` fold local.
   Superseded 2026-10-08: one `GraphQLPasswordRecoveryRepository` with no API-client class,
   translation in two Transformers and a Data provider (the §6 note, architecture §1.1).
6. **Reuse the deferred composition-root shape** (`DeferredAuthActions`): a new deferred facade
   receives the container loader by constructor from `stores/index.ts` (the only file allowed to
   import the composition root), which removes the duplication jscpd would flag and keeps the
   facades free of the DI import.
7. **Generalise `PasswordField`** with `name` and `rules` props (defaults unchanged) for the
   confirm field; keep sign-in/sign-up baselines untouched.
8. **Write an ADR** for the recovery flow (transport, uniform response, token-in-memory, no
   retry) — the `api-config.ts` change triggers the drift gate anyway, and the decisions are
   durable. Superseded 2026-10-13: no ADR is written; the durable decisions live in the
   `## Password recovery decisions` section of `src/modules/user/README.md`, and the drift gate
   passes through a `[no-adr]` line in the pull-request body (PRD NFR-16).
9. **Stories to schedule**: route + request screen; sent screen with masked e-mail; reset
   screen with confirm field; repository/API/mappers with 100% mutation; security signals +
   `PiiScrubber` pattern; e2e (`page.route`), a11y, mobile and visual lanes + manifest rows;
   i18n (uk/en copy replacing the Russian frames); flag flip + docs; a **blocked** story for the
   contract pin bump (`.env.example`, `Mockoon.Dockerfile`, codegen, `contract-diff` approvals)
   and two upstream issues (link host; schema `enum`/pattern defects).
10. **Do not add the new pages to Lighthouse** by default: they share the audited chrome and
    the budgets are measured on `/sign-in`; adding URLs lengthens the matrix without new signal.
    Revisit if the PRD demands a budget per page.

## 9. Assumptions (consolidated)

- Both operations use GraphQL through `GraphQLPasswordRecoveryRepository` (superseding the
  REST assumption of §3.3; architecture §5.1).
- No transport-level retry for either operation (§3.4).
- Two route keys: `/password-recovery` (request + sent) and `/password-reset` (confirm) (§8.2).
- The feature lives in the auth feature folder, where `no-paint-path-import-di-bridge` forbids
  `useService` (§8.1, §8.6); recovery state stays page-local in the flow hooks and
  `AuthProviderLoader` is created per page mount, with no module singleton (architecture §5.3,
  §5.4).
- The mobile resend countdown is out of scope; the sent screen's "Назад" returns to the request
  form (§4.3).
- The set-new-password screen is built from the existing card and `UIForm` primitives pending a
  Figma frame (§4.3).
- No new GoF pattern; one shared container-loader extraction justified by a second
  implementation (§2).
- Lighthouse URL list unchanged (§8.10).

## 10. Open questions for later stages

1. Does requesting a second reset invalidate the first token upstream? (affects resend copy)
2. Will the design owner provide a frame for the confirmation form and uk/en copy for the sent
   screen, and confirm the "Назад" targets?
3. Should the shared `PasswordValidator` be aligned to the API's ASCII uppercase rule for
   sign-up as well?
4. Does the sign-in success notice travel in navigation state or in the recovery var?
5. When will user-service tag a release that includes the reset endpoints and the link-host
   fix, and who files the two upstream issues?
