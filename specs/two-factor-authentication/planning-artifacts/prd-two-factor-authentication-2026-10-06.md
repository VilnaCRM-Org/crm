---
status: complete
workflowType: prd
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
project_name: crm
date: 2026-10-06
feature: two-factor-authentication
issue: https://github.com/VilnaCRM-Org/crm/issues/331
author: 'pm (John), autonomous run'
inputDocuments:
  - ./research-two-factor-authentication-2026-10-06.md
  - ./brief-two-factor-authentication-2026-10-06.md
  - 'orchestrator: decisions-2fa.md (binding user rules, D1-D13, brief-stage rulings D3p/D5p/D8p)'
  - 'orchestrator: backend-2fa-report.md (user-service main a95c1e85 vs v2.8.0)'
  - 'orchestrator: figma-2fa-report.md (file xZ7ccrH6d4QyqLQsayFSEX)'
  - .claude/react-sdlc.yml
  - CLAUDE.md
  - codegen.ts
  - config/performance-budget.json
  - config/ui-toolkit-checksums.json
  - eslint.config.mjs
  - .dependency-cruiser.js
  - .env.example
  - docker-compose.test.yml
  - public/index.html
  - lighthouse/constants.js
  - lighthouse/lighthouserc.desktop.js
  - lighthouse/lighthouserc.mobile.js
  - docs/feature-flags.md
  - docs/ui-toolkit.md
  - docs/adr/README.md
  - src/api/contracts/README.md
  - src/styles/colors.ts
  - src/components/ui-button/theme.ts
  - src/components/ui-form/index.tsx
  - src/components/ui-form-input-field/theme.ts
  - src/components/layouts/app-layout.tsx
  - src/hooks/use-arrival-focus.ts
  - src/config/runtime/types/feature-flag.ts
  - src/config/runtime/feature-flag-service.ts
  - src/config/runtime/app-config-schema.ts
  - src/routes/route-paths.ts
  - src/routes/route-mapper.tsx
  - src/routes/types/app-route.ts
  - src/routes/types/navigation-state.ts
  - src/modules/user/features/auth/routes/index.ts
  - src/modules/user/features/auth/stores/auth-var.ts
  - src/modules/user/features/auth/stores/auth-store-actions.ts
  - src/modules/user/features/auth/types/auth-store.ts
  - src/modules/user/features/auth/types/credentials.ts
  - src/modules/user/features/auth/repositories/registration-api.ts
  - src/modules/user/features/auth/utils/login-redirect-target.ts
  - src/modules/user/features/auth/utils/auth-security-signals.ts
  - src/modules/user/features/auth/components/form-section/components/user-options/index.tsx
  - src/modules/user/features/auth/i18n/uk.json
  - src/services/observability/apollo-link-factory.ts
  - src/services/observability/pii-scrubber.ts
  - src/services/types/security-events/security-event.ts
  - docker/apollo-server/lib/format-error.ts
  - tests/integration/mocks/server.ts
  - tests/utils/a11y/axe-config.ts
  - tests/e2e/route-coverage.tsv
  - tests/e2e/a11y/routes.a11y.spec.ts
  - tests/e2e/mobile/constants.ts
  - tests/visual/constants.ts
  - tests/unit/tooling/runtime-config-contract.test.ts
  - '_planning-shared/miro-layer-contract.md (2026-10-08: Miro layers, TB-1 canonical text)'
  - '_planning-shared/miro-layer-contract.md §3.5, §4 TB-2 (shared User domain, 2026-10-08)'
revisions:
  - '2026-10-08: NFR-21 typed boundaries (TB-1), NFR-22 Miro layer conformance'
  - '2026-10-08: refined TB-1 text; verification F6, F7, F10, F13 applied (sign-in Data provider)'
  - '2026-10-08: TB-2 added to NFR-21; the board types come from the shared User domain'
  - '2026-10-08: simplification; GraphQL-only sign-in, REST login retired, flag gates the section'
  - '2026-10-08: client state in the Zustand store useAuthStore; prerequisite chore
    zustand-client-state'
---

# PRD: two-factor authentication for the user module

**Author:** BMad (Product Manager) **Date:** 2026-10-06 **Feature:** `two-factor-authentication`

**Reconciliation 2026-10-27.** The requirements are unchanged. Code paths and names this PRD
cites were checked against `feat/331-two-factor-authentication` at `77f59152`; where they differ,
the architecture's "Reconciliation 2026-10-27" list wins. In short: FR-43 and FR-44 are met by
`docs/ui-toolkit.md` and a `## Two-factor authentication decisions` section in
`src/modules/user/README.md` (no ADR file exists from 003 up); FR-11's sign-in messages show on
`#315`'s sign-in result card and keep its shipped `invalid_credentials` and `rate_limited` texts;
FR-25's slot is the second child of `SettingsGrid`, and #362's sidebar and user-chip menu replaced
the home link.

Predecessors: [research](./research-two-factor-authentication-2026-10-06.md) (Miro intent, the
user-service contract on `main`, the Figma inventory, the crm code map, risks and mock drift) and
[brief](./brief-two-factor-authentication-2026-10-06.md) (vision, personas, scope, success
measures, design deviations). Every repository fact below was re-read in this worktree and is
cited as `path:line`; "research §N" and "brief §N" point into the predecessors. Decisions taken by
the orchestrator on the user's behalf are cited as D1-D13 and the brief-stage rulings as D3', D5'
and D8'; they bind this PRD. Decisions this stage took on its own are marked `> Assumption:`.
This PRD is implementation-ready but not code-level: class, file, token and folder names belong to
the architecture stage and ADR-020.

**Revision 2026-10-08.** Two non-functional requirements were added at the user's request:
NFR-21 (TB-1, every value that crosses a layer boundary is a named, typed interface or class,
never a plain array or an anonymous object) and NFR-22 (the frontend follows the Miro board's
layers, which have no Controller or Service). FR-3 and FR-36 were reworded to match; no other
requirement changed.

**Shared User domain, 2026-10-08.** NFR-21 now carries TB-2 beside TB-1: the board's types
(`SignInDto`, `UserEntity`, and this feature's `TwoFactorDto` and `TwoFactorSettingsEntity`) are
plain data interfaces in #315's shared folder, holding only what user-service expects or
returns, and they cross component and form boundaries as themselves. Every 2FA rule stays in
user-service; no requirement's behaviour changed.

**Simplification 2026-10-08.** The user applied every item of
`_planning-shared/over-engineering-review-2026-10-08.md` ("apply all 10") and ruled on sign-in:
"we should use only repositories to access data but with graphql, not the REST, we use only
graphql". Sign-in therefore runs over GraphQL `signInUser` in every environment through one Data
provider, and this feature removes the REST login placeholder (FR-8); D2's flag-selected Strategy
is gone. The `twoFactorAuth` flag now gates only the 2FA section of `/settings` (FR-6, FR-7). The
shared pieces have one owner each and land in the order #315 → #330 → #331 (planning contract
§3.4): #330 builds the `/settings` page, its route gate, the home link, the Bearer link with its
session end, the `session_ended` notice and the error-text red; #315 builds the shared error
transformer, the provider loader, the auth card, the arrival notices and the pending-contract
directory. FR-2 is withdrawn (the expiry checker was dropped with #315's), the local mock is a
stateless happy path (FR-4), the settings section records no security signal (FR-38), and the
session-end rules of FR-24 and FR-34 are #330's. The TB-1 gate is the prerequisite chore #332
(`typed-boundaries-gate`, draft PR #333), which lands first. Beside it, the prerequisite chore
`zustand-client-state` (#334, lands before #315) moves client state from the reactive var to
Zustand stores (the user, 2026-10-08: "change the react state var to zustand"); the auth store is
`useAuthStore`, and this feature only adds fields to its `AuthState`.

## 1. Overview

A VilnaCRM account gains a second factor. Two surfaces, matching the two components the Miro
"User module" tree defines (research §2):

- **Two-factor challenge** (`/sign-in/two-factor`, public): after a correct password on an account
  with 2FA on, the user enters the six-digit code from an authenticator app, or a recovery code,
  and lands where they were going.
- **Two-factor settings** (`/settings`, protected): a signed-in user turns 2FA on (QR code, manual
  key, confirm code, recovery codes shown once), turns it off with a code, and generates a fresh
  set of recovery codes.

Sign-in moves from the REST placeholder, which posts the credentials to the create-user endpoint
`/api/users` (`src/config/api-config.ts:4-5`), to the GraphQL `signInUser` mutation in every
environment (the user, 2026-10-08), and the REST login code is removed (FR-8). Production sign-in
reaches user-service once the release requested in user-service #513 ships; until then it has no
backend, exactly as the REST placeholder has none today. One new runtime flag, `twoFactorAuth`,
gates only the 2FA section of `/settings`; the shipped default is `false` and the test stack turns
it on. No user-service tag carries the operations yet (crm pins `v2.8.0`, `.env.example:83` and
`:86`), so every operation is answered by a pending schema extension copied from user-service
`main` at `a95c1e85` and by the local Apollo mock, until a pin bump deletes the extension
(research §3.1).

### Screen and state inventory

| Route                 | State                    | Heading (uk)                          |
| --------------------- | ------------------------ | ------------------------------------- |
| `/sign-in`            | expired-challenge notice | Аутентифікація (existing)             |
| `/sign-in/two-factor` | authenticator code       | Двофакторна автентифікація            |
| `/sign-in/two-factor` | recovery code            | Двофакторна автентифікація            |
| `/settings`           | 2FA off                  | Двофакторна автентифікація (card)     |
| `/settings`           | setup in progress        | Налаштуйте двофакторну автентифікацію |
| `/settings`           | recovery codes (once)    | Резервні коди                         |
| `/settings`           | 2FA on                   | Двофакторну автентифікацію ввімкнено  |
| `/settings`           | disable confirmation     | Вимкнути двофакторну автентифікацію   |
| `/settings`           | regenerate confirmation  | Створити нові резервні коди           |
| `/settings`           | re-authentication        | (message, focused)                    |
| any protected page    | low recovery codes       | (notice, no heading)                  |

### Backend outcomes the user can see

user-service reports an outcome as resolved `data`, as a GraphQL error whose
`extensions.status` carries the HTTP status (and `extensions.violations` for a `422`), or as an
HTTP-level answer with no GraphQL body: `429` problem+json from the rate-limit listener, a `5xx`,
no response, or the client deadline (research §3.5). The client classifies on
`extensions.status` when it is present, and on the message where one status means two things or
where no status arrives at all (user-service domain exceptions carry no `extensions`).

| Operation    | Answer                                  | Client outcome           |
| ------------ | --------------------------------------- | ------------------------ |
| sign-in      | data, `twoFactorEnabled` false          | session (FR-9)           |
| sign-in      | data, `pendingSessionId`                | challenge (FR-10)        |
| sign-in      | `401` or `422`                          | uniform message (FR-11)  |
| sign-in      | `423`                                   | locked message (FR-11)   |
| complete     | data                                    | session (FR-18, FR-37)   |
| complete     | `401` "Invalid two-factor code.", `422` | wrong code (FR-19)       |
| complete     | any other `401`                         | expired, restart (FR-20) |
| setup        | data                                    | QR and key (FR-28)       |
| setup        | `409`                                   | 2FA on state (FR-34)     |
| confirm      | data                                    | codes shown once (FR-30) |
| confirm      | `401` "Two-factor setup not initiated." | restart setup (FR-34)    |
| confirm      | `401` "Invalid two-factor code.", `422` | wrong code (FR-29)       |
| disable      | data                                    | 2FA off state (FR-32)    |
| regenerate   | data                                    | new codes (FR-33)        |
| regenerate   | `403` "Re-authentication required."     | sign in again (FR-33)    |
| disable, reg | `403` "… is not enabled."               | 2FA off state (FR-34)    |
| settings ops | `401` (the session ended, #330's link)  | session ended (FR-34)    |
| settings ops | "Access Denied." on HTTP 200            | session ended (FR-34)    |
| any          | HTTP `429`                              | rate limited, no retry   |
| any          | no response, deadline, `5xx`, bad shape | banner with user Retry   |

user-service answers "Access Denied." over HTTP 200 when a protected operation arrives without
a token. The shared error transformer reads that exact message (a row #330 appends), so the
answer is classified the same with or without `extensions.status` (FR-34).

> Assumption: `confirmTwoFactorUser` and `disableTwoFactorUser` reject a wrong code with the same
> 401 "Invalid two-factor code." as completion, because all three validate through the one
> `TwoFactorCodeValidator` (research §3.4). The message constants live in one transformer and
> are re-checked against the released server on the pin bump (§9, MD-2).

## 2. Goals and non-goals

### Goals

1. A user can enrol, sign in with an authenticator code, sign in with a recovery code, regenerate
   recovery codes and disable 2FA end to end in the test stack today, against the mocked
   mutations (brief §4 goal 1).
2. Sign-in runs over GraphQL in every environment and no REST login remains; the same build turns
   the 2FA section on in production by configuration alone once user-service releases and
   deploys the contract (goal 2).
3. Nothing leaks: no account enumeration; no pending session id, code, TOTP secret, otpauth URI,
   recovery code or token in the URL, browser storage, Apollo cache, logs or telemetry (goal 3).
4. Both new screens meet WCAG 2.1 AA and every repository quality floor without a new
   accessibility exception and without a suppression (goal 4).

### Non-goals

- E-mail or SMS one-time codes, the resend row and its countdown (D1).
- Storing or renewing the refresh token; wiring "remember me" (D3, D3').
- Sign-out through `signOutUser` / `signOutAllUser`; social OAuth sign-in combined with 2FA.
- Enabling the flag in production and the contract pin bump (follow-ups, §11).
- The `/settings` page, its route gate and its home link, which #330 builds (D7).
- The other settings sections (initials, e-mail, password, social networks) (D7).
- Adding the new routes to the Lighthouse URL list.

## 3. Decisions carried into this PRD

Binding, from the decisions file; the architecture and epics stages treat them as settled:

- **D1 scope:** TOTP authenticator plus recovery codes only; authenticator copy at every
  breakpoint; "Використати резервний код" replaces the resend row.
- **D2 sign-in, overridden by the user 2026-10-08:** GraphQL `signInUser` in every environment
  through one Data provider; the REST login placeholder is removed by this feature (FR-8). The
  earlier flag-selected pair of implementations is gone.
- **D3 / D3' tokens:** access token in memory as today; refresh token not stored; `rememberMe`
  neither sent nor wired; `twoFactorEnabled` kept in memory as the known 2FA status.
- **D4 challenge route:** `/sign-in/two-factor`, reachable only while an in-memory pending
  challenge exists; "Назад" discards it; `state.from` survives; expiry returns to `/sign-in` with
  a notice; no client countdown.
- **D5 / D5' code input:** reuse ui-toolkit `UiPinInput` through a crm seam with accessibility
  overrides and per-cell labels; manual NVDA and VoiceOver evidence.
- **D6:** no auto-submit on the sixth digit.
- **D7 / D8 / D8' settings:** the 2FA card is one section of the protected `/settings` page that
  the User Settings bundle builds (#330, ADR-021, which lands first); start button before
  setup; QR rendered on the client; confirm; recovery codes once; disable with a code; regenerate
  with a "Увійти знову" path on the re-authentication 403; unknown status treated as off.
- **D9:** low recovery codes notice from `recoveryCodesRemaining`, localized, linking to
  `/settings`.
- **D10:** a client-side QR encoder only in the settings chunk; ADR-020 covers the dependency.
- **D11 errors:** classify on `extensions.status`; completion `401` split by message; `429` is a
  transport answer; `423` locked; network and timeout retried by the user only.
- **D12 copy:** corrected Ukrainian, English alongside, Russian settings copy translated, no masked
  e-mail.
- **D13 follow-ups:** production enablement and pin bump, refresh tokens, OAuth with 2FA,
  designer follow-up, `signOutUser`. REST retirement is no longer a follow-up: it is FR-8.
- **Shared pieces, one owner each:** landing order #315 → #330 → #331 (planning contract §3.4).
  This feature imports what #315 and #330 build and never builds a second copy; it only appends
  where a requirement says so.
- **ADR:** ADR-020, decider @kravalg.

## 4. User journeys

Figma file `xZ7ccrH6d4QyqLQsayFSEX`. Challenge frames `72:4846` (desktop 1440), `72:4882`
(tablet 1024), `72:4918` (mobile 375); settings setup `313:10242` / `313:10480` / `313:10606`,
connected `315:11502` / `315:12300` / `318:13133`; "2FA item" component set `72:5171`. The
challenge reuses the existing auth chrome (top bar "На головну сторінку", centred white card,
footer); the settings page reuses the protected layout and its footer.

### Taras signs in with an authenticator code

1. On `/sign-in` he enters e-mail and password and submits; the sign-in form is unchanged.
2. He lands on `/sign-in/two-factor`; focus is on the card heading. The six cells always fit the
   card's content box (architecture §6.11). Desktop (from 1440 px): card 502 wide, cells 86 px
   tall as the desktop frame draws them (64 × 86) with an 8 px gap, shrinking to about 63.7 px
   wide inside the 422 px content box. Tablet (crm `md`, 768 px, up to 1439 px): card at the
   existing tablet card width (632 px), cells 64 × 86 with an 8 px gap (the Figma tablet frame
   draws cells of about 86 × 130, a recorded design deviation). Mobile (below 768 px): the card
   keeps the sign-in card's 6 px section
   padding, equal to the Figma margin, and the six cells share the row with a 4 px gap, 64 px
   tall and at most 49 px wide (about 48.8 px from 375 px up, 46.3 px at 360 px, 39.7 px at
   320 px).
3. He types or pastes the six digits and presses "Підтвердити".
4. He lands on the protected page he originally asked for, with focus on `main`.

### Iryna signs in with a recovery code

1. On the challenge card she presses "Використати резервний код"; one labelled text field replaces
   the six cells and receives focus.
2. She enters `abcd-2345` (any case, with or without the hyphen) and confirms.
3. She lands; when two or fewer codes remain, a notice on the landing page says how many and links
   to `/settings`.

### Olena enrols

1. From the home page link or the URL she opens `/settings`; the card says 2FA is off, lists
   three steps and offers "Почати налаштування".
2. She presses it; a QR code and the manual key (with a copy button) appear above a six-cell code
   field.
3. She scans the QR in Google Authenticator, enters the current code, presses "Підтвердити".
4. Eight recovery codes appear once; she copies them, ticks the acknowledgement, presses "Готово";
   the card reads "Двофакторну автентифікацію ввімкнено".

### Iryna regenerates codes or turns 2FA off

1. On `/settings` (2FA on) she presses "Створити нові резервні коди" and confirms; new codes appear
   once. Five minutes after signing in, the card instead says she must sign in again and offers
   "Увійти знову", which returns her to `/settings` after sign-in.
2. Or she presses "Вимкнути", enters an authenticator or recovery code and confirms; the card
   returns to the 2FA off state.

On every breakpoint the journeys are the same; mobile is completed by touch (NFR-10).

## 5. Functional requirements

Requirement ids are stable; the architecture and epics stages reference them. Each requirement
carries testable acceptance criteria and a trace to its source.

### 5.1 Contract and mock

#### FR-1 — Pending schema extension for the 2FA operations

The pending-contract directory `src/api/contracts/pending/`, which #315 builds (with the codegen
schema array and the mock composition), holds schema extensions for operations the pinned
user-service release lacks; this feature adds its file beside #315's. The 2FA file is
`src/api/contracts/pending/two-factor-authentication.graphql`: the six field
definitions (`signInUser`, `completeTwoFactorUser`, `setupTwoFactorUser`, `confirmTwoFactorUser`,
`disableTwoFactorUser`, `regenerateRecoveryCodesUser`) and their input and payload types copied
verbatim from user-service `main` at `a95c1e854bf21770b7fc630611a8257b0f9c600b`, the fields
wrapped in `extend type Mutation { … }`, plus `scalar Iterable`, declared once across all pending
files. The header records the source commit and the deletion trigger.

- Given the pending file, when its type bodies are compared with the upstream SDL at `a95c1e85`,
  then names, field order, nullability and argument types are identical.
- Given every pending file, when they are composed with the pinned schema, then the composition
  validates and `Iterable` is declared exactly once.
- Given #315's pending file beside it, when codegen and the mock start, then both succeed (the
  directory has no per-feature wiring).

Trace: user rules (pending extension, shared with #315); research §3.2, §8.2 item 1.

#### FR-2 — Withdrawn (2026-10-08)

The self-expiry checker was dropped together with #315's (over-engineering review, item 3): no
existing gate needs it, and graphql-codegen and the Apollo mock merge an identical duplicate
silently. Follow-up 5.1 deletes the 2FA file by its list when the pins move; the id is not reused.

#### FR-3 — Codegen wiring and operation documents

`codegen.ts` reads the pinned schema plus every pending file (`codegen.ts:9-14` reads only the
pinned schema today) and maps `Iterable` explicitly (`codegen.ts:25` maps only `ID`), as
`unknown`, narrowed by a zod schema below the Data provider and handed upward only as a named
collection of named recovery codes (NFR-21), never as a bare array. One colocated
operation document per mutation selects only what the client uses, never `id` or `_id`, and sends
every value through `variables: { input }`:

- `signInUser`: `success`, `twoFactorEnabled`, `accessToken`, `pendingSessionId`.
- `completeTwoFactorUser`: `twoFactorEnabled`, `accessToken`, `recoveryCodesRemaining`.
- `setupTwoFactorUser`: `otpauthUri`, `secret`.
- `confirmTwoFactorUser` and `regenerateRecoveryCodesUser`: `recoveryCodes`.
- `disableTwoFactorUser`: `success`.

`refreshToken`, `warning` and `otpauthUri`/`secret` outside setup are never selected.

- Given `make codegen-check`, when it runs, then the generated types are fresh and no generated
  field is typed `any`.
- Given each document, when its selection set is parsed in a unit test, then it equals the list
  above (must-fail: adding `id`, `refreshToken` or `warning` fails the test).
- Given a `recoveryCodes` value that is not an array of strings, when the transformer parses it,
  then the result is the "bad shape" failure of FR-22 / FR-35.

Trace: research §3.2 codegen consequence; corrections (Iterable mapping, zod narrowing).

#### FR-4 — Stateless local mock for manual runs

The local Apollo mock (`docker/apollo-server`), whose composition of the pending files #315
builds, gains stateless resolvers for the six mutations: the happy path of each (2FA off sign-in
with an `accessToken`; 2FA on sign-in, with a `pendingSessionId`, when the e-mail's local part is
`2fa`; completion with tokens; setup with a fixed `otpauthUri` and secret; confirm and regenerate
with eight fixed codes; disable with `success`), plus one `422` violation for each mutation that
takes an input (a malformed e-mail on sign-in, a malformed code on completion, confirm and
disable). Each violation carries `extensions.status` 422, `extensions.violations` and
`extensions.code` `BAD_USER_INPUT`, because the repository's `formatError` rewrites a code-less
error to a generic message (`format-error.ts:13-20`). The mock holds no state, no attempt counter
and no rule of user-service. The mock reads no token, as #330's does; every 401/403 branch comes
from msw and `page.route`. Every other branch is exercised by msw and the Playwright stubs
(FR-5), which CI runs. The triggers are listed in the contracts README (FR-41).

- Given the apollo-server suite, when it runs, then each happy path and each violation has a test
  asserting the payload or `extensions.status`, `extensions.violations` and the message.
- Given the crm data layer, when it classifies a mock error, then it never reads
  `extensions.code` (unit test over a code-less error with the same status and message).

Trace: user rules (mock the operations); over-engineering review item 3; research §3.5, §7.2.

#### FR-5 — Operation-aware test doubles

Integration tests answer GraphQL with msw handlers that dispatch on the operation name (the single
`createUser` handler of `tests/integration/mocks/server.ts:21-33` becomes per-operation), and the
browser lanes stub `**/graphql` with Playwright routes that dispatch on `operationName`, so every
branch, including HTTP statuses and network failures, is injected deterministically. No browser
lane depends on the local Apollo mock.

- Given an integration test for any 2FA branch, when it runs, then the handler answers only the
  named operation and an unexpected operation fails the test.
- Given the e2e helpers, when a spec needs `429` or a dropped connection, then a route fulfils it
  at the HTTP level.

Trace: research §5.3 (msw single handler), brief §5 test coverage.

### 5.2 Feature flag

#### FR-6 — `twoFactorAuth` runtime flag

A new flag `twoFactorAuth` is declared in the four places the runtime-config contract checks: the
`FeatureFlag` union (`src/config/runtime/types/feature-flag.ts:1`), `FEATURE_FLAG_DEFAULTS`
(`feature-flag-service.ts:4-6`), the schema (`app-config-schema.ts:18-22`) and the committed block
of `public/index.html:27-29`. The shipped default is `false`. It gates one thing: whether the
`UserProfile` page renders the 2FA section (FR-25). It gates no route, no sign-in transport and no
link. `.env.example` gains the empty key; the test stack passes `APP_CONFIG_FLAG_TWO_FACTOR_AUTH`
beside the existing passthrough (`docker-compose.test.yml:21`), with the `-` fallback until the
section's screens exist and the `:-true` fallback from epics Story 4.1, because `.env.example`
declares the variable empty. The dev server keeps the committed `false` block: the dev-only
rsbuild transform was dropped with #315's, and `make start-prod` renders the flags.

- Given the committed block and the in-code default, when read, then both say `false`.
- Given the test stack with no override after Story 4.1, when the runtime block is rendered, then
  the flag is `true`; with `APP_CONFIG_FLAG_TWO_FACTOR_AUTH=false` it is `false`.
- Given the runtime-config contract test, when it runs, then it fails if the shipped default is
  `true` (the existing per-flag checks, applied to the new flag).

Trace: user rules (flag defaults); research §5.4; over-engineering review item 11.

#### FR-7 — Flag off hides the 2FA section

With the flag off, the `UserProfile` page renders without the 2FA section, its chunk and the QR
encoder are never requested, and no settings 2FA operation is sent. Sign-in and the challenge do
not depend on the flag: sign-in always runs over GraphQL (FR-8), and an account with 2FA on always
reaches `/sign-in/two-factor` (FR-12). The flag is read when the page renders, through the existing
`useFeatureFlag` hook, never while the router is built.

- Given the flag off and `userSettings` on, when `/settings` opens with a token, then the page
  renders without the 2FA section and no 2FA settings operation is sent.
- Given the flag off, when an account with 2FA on signs in, then the challenge route renders and
  completes as with the flag on.

Trace: over-engineering review item 11; the user, 2026-10-08.

### 5.3 GraphQL sign-in

#### FR-8 — Sign-in over GraphQL only; the REST login is removed

Sign-in sends `signInUser` with `{ email, password, clientMutationId }` (no `rememberMe`, D3') in
every environment, through one GraphQL Data provider over a GraphQL repository (NFR-22); the user
ruled on 2026-10-08: "we should use only repositories to access data but with graphql, not the
REST, we use only graphql". The REST login placeholder is removed in the same feature: the REST
login client and its endpoint configuration (`src/config/api-config.ts`, whose `LOGIN` posts to
the create-user endpoint `/api/users`), the REST login method of the existing auth repository, the
REST login response mapper and schema, their DI tokens and registrations, their unit and
integration tests, the msw REST login handler, and the REST login stubs of the browser specs,
which move to GraphQL `SignInUser` stubs. Registration is unchanged: it already sends the GraphQL
`createUser` mutation (`registration-api.ts:24-93`).

- Given a valid form, when it is submitted, then exactly one `POST` to the GraphQL endpoint with
  operation `SignInUser` and `variables.input.email` / `.password` is sent, and no other request.
- Given the GraphQL request, when its variables are read, then `rememberMe` is absent.
- Given the repository after the change, when it is searched for the REST login client, its
  endpoint configuration, the REST login mapper and a login request to `/api/users`, then nothing
  is found in `src/` or `tests/` (must-fail: a review grep listed in the story).
- Given sign-up, when it runs, then it sends the same `createUser` mutation as on `main` and its
  existing tests pass unchanged.

Trace: the user, 2026-10-08 (overrides D2); D3'; research §5.1, §8.2 item 5.

#### FR-9 — Sign-in outcome: 2FA off

A resolved `signInUser` with `twoFactorEnabled` false and an `accessToken` stores the access token
in memory exactly where the token lives (`AuthState.token` in the Zustand store `useAuthStore`,
which replaces today's `AuthStateVar`, `auth-var.ts:6-14`, in chore `zustand-client-state`),
stores the e-mail as today, records the known 2FA status as off, drops the refresh token, and
leaves the existing post-login redirect to do the rest (redirect-back per issue #150, focus on
`main`).

- Given a resolved 2FA-off answer, when it settles, then the token equals the response's
  `accessToken`, no refresh token exists anywhere in client state, and the user arrives on the
  `state.from` target or `/`.
- Given the same answer, when browser storage and the Apollo cache are inspected, then neither
  holds the token.

Trace: D3; research §5.2.

#### FR-10 — Sign-in outcome: 2FA on

A resolved `signInUser` with `twoFactorEnabled` true and a `pendingSessionId` (no token) stores
the `pendingSessionId` in memory as one scalar, leaves `token` untouched (so `isAuthenticated`
stays false and the null-to-token redirect does not fire), and navigates to `/sign-in/two-factor`
carrying the sign-in page's `state.from` and no other value. The pending session id never enters
the URL, navigation state, storage, logs, telemetry or the Apollo cache. Logout and a reload
clear it.

- Given a 2FA-on answer, when it settles, then the URL is `/sign-in/two-factor`, `location.search`
  and `location.hash` are empty, `history.state` does not contain the session id, and `token` is
  `null`.
- Given a sign-in opened from a redirect for `/reports?x=1`, when the challenge renders, then its
  navigation state carries that `from` unchanged.
- Given a pending challenge, when the logout action runs or the page reloads, then the challenge
  no longer exists.

Trace: D4; research §5.2, §6 (pending session).

#### FR-11 — Sign-in failures on the GraphQL path

Every failure maps to an i18n key; the banner is the sign-in form's existing error area:

- any `401` (unknown e-mail, wrong password, anything else) and any `422`: "Невірна електронна
  пошта або пароль." — one message, whatever the cause (NFR-3);
- `423`: "Обліковий запис тимчасово заблоковано через забагато невдалих спроб. Спробуйте
  пізніше.", no Retry action;
- HTTP `429`: "Забагато спроб. Зачекайте хвилину і спробуйте знову.", no Retry action, no
  automatic re-send;
- no response, deadline, `5xx` or a result failing its schema: "Не вдалося надіслати запит.
  Перевірте з'єднання та спробуйте ще раз." with the existing "Спробувати ще раз" action,
  re-submitting once on activation;
- an abort shows nothing.

The banner text renders at 4.5:1 or more (NFR-6).

- Given each answer, when it settles, then the matching text shows, focus moves to the banner,
  the form keeps the e-mail, and exactly one request was sent.
- Given a `401` for an unknown e-mail and a `401` for a wrong password with different upstream
  messages, when each settles, then the DOM is identical (e2e asserts equality).
- Given the transient banner, when "Спробувати ще раз" is activated, then exactly one more
  request is sent.

Trace: D11; research §3.5, §3.6; user rule (uniform responses).

### 5.4 Challenge route

#### FR-12 — Challenge route and its reachability guard

`/sign-in/two-factor` is a new `ROUTE_PATHS` key registered as a public, lazily loaded route of
the auth feature's route contract (`src/modules/user/features/auth/routes/index.ts`) with its own
named chunk and `titleKey`; it is always registered and lists no flag, because sign-in can
return a challenge in every environment (FR-7, FR-8). Opening it without a pending challenge
(typed URL, reload, a new tab, forward navigation after leaving, or the public-route reload-once
chunk recovery of `route-mapper.tsx:31-40` that wipes memory) replaces
the entry with `/sign-in`, showing no notice.

- Given no pending challenge, when `/sign-in/two-factor` is opened, then the URL becomes
  `/sign-in` by replace (Back does not return to the challenge) and no GraphQL request is sent.
- Given a pending challenge, when the route renders, then `document.title` is
  "Двофакторна автентифікація - VilnaCRM" (uk) and the English equivalent after a language change.
- Given the route table, when the change lands, then `src/routes/routes.tsx`, the registry and
  the composer are unchanged and the route entry lists no flag.

Trace: D4; Miro `2FA [component]<route>`; research §5.5.

#### FR-13 — Redirect-back across the step; never a redirect target

The `state.from` captured by `/sign-in` survives the challenge and is honoured after completion.
`LoginRedirectTarget` rejects `/sign-in/two-factor` as a target as it rejects `/sign-in`
(`login-redirect-target.ts:13-19`), so a stale or crafted `from` lands on `/`.

- Given `from` = `/sign-in/two-factor`, when the target is resolved, then it is `/`.
- Given `from` = `/reports?x=1#t`, when the challenge completes, then the URL is `/reports?x=1#t`.
- Given `from` = `//evil.example` or `/\evil.example`, when the challenge completes, then the URL
  is `/` (existing rule kept).

Trace: D4, issue #150; corrections (redirect target).

#### FR-14 — Challenge card in authenticator mode

Inside the existing auth chrome and card: an in-card "Назад" link to `/sign-in` (chevron hidden
from assistive technology); one `h1` "Двофакторна автентифікація"; the subtitle "Введіть
шестизначний код із застосунку Google Authenticator."; the time note "Код можна ввести протягом
5 хвилин після входу."; the six-cell code input (FR-15); the primary submit "Підтвердити"; below
it the text button "Використати резервний код". No OAuth provider row, no sign-in/sign-up
switcher, no e-mail address, no resend row, no countdown.

- Given the route, when it renders, then exactly one `h1` exists, the code group is reachable by
  its accessible name, the submit is a `button[type="submit"]` named "Підтвердити", and no
  provider button or switcher link exists.
- Given the 1440, 1024 and 375 viewports, when the card renders, then its width is the existing
  auth card width for that breakpoint, the cell gap is 8 / 8 / 4 px and the cell height is
  86 / 86 / 64 px.
- Given the 320, 360, 600 and 767 px viewports, when the card renders, then every cell lies
  inside the card's content box and the document does not overflow horizontally (WCAG 2.1
  SC 1.4.10); at 1440 px the row fits the 422 px content box.

Trace: D1, D12; Figma `72:4846` / `72:4882` / `72:4918`; brief §7 items 1, 2, 7.

#### FR-15 — Code input through an adopted `UiPinInput` seam

The six-cell input is the ui-toolkit v0.6.0 `UiPinInput` (checksums
`config/ui-toolkit-checksums.json:1029-1040`), adopted per ADR-016 as a new crm seam (`UI*` under
`src/components/`, a `uiToolkitSeams` entry beside the eight at `eslint.config.mjs:532-541`, the
register rows of FR-43). The seam renders length 6, numeric only, controlled, with
`autocomplete="one-time-code"` on the first cell, and delivers through props and styling:

- the group's accessible name ("Код підтвердження" / "Verification code");
- each cell's accessible name "Цифра N з 6" / "Digit N of 6" (D5');
- a pasted 6-digit code (also with spaces or a hyphen) fills all six cells;
- exactly one focused cell at a time, with the visible focus indicator of NFR-6;
- cell borders, hover and error colours of NFR-6, the 8 / 4 px gap, and cells sized from the
  card's content box so the row never overflows (FR-14);
- the placeholder digit hidden visually: the toolkit hard-codes `placeholder="0"` on every cell
  and has no prop for it, so the attribute stays; the seam records that as an override, the
  ui-toolkit issue lists it, and the NVDA and VoiceOver check (NFR-7) records whether it is
  read;
- an error linked through `aria-invalid` and `aria-describedby`, announced once (NFR-7);
- a disabled state while submitting.

Where `UiPinInput` cannot deliver one item through props or styling, the seam documents the
override and a ui-toolkit issue is filed; no `A11Y_EXCEPTIONS` entry is added.

- Given the seam, when rendered in jsdom, then the group has the name above, each cell has its
  "Цифра N з 6" name, and jest-axe reports no violation.
- Given `123 456` pasted into the first cell, when the paste settles, then the value is `123456`
  and focus is on the last cell.
- Given letters typed into a cell, when the input settles, then the value is unchanged.

Trace: D5, D5'; research §4.3, corrections (compiled `outline: none`, `#E1E7EA`, 12 px gap).

#### FR-16 — Submit, client validation, busy and offline

"Підтвердити" submits; a sixth digit never submits by itself (D6). With fewer than six digits the
input shows "Введіть усі 6 цифр коду", receives focus, and nothing is sent. A valid submit sends
one `completeTwoFactorUser` with `{ pendingSessionId, twoFactorCode, clientMutationId }`. While in
flight the form is busy as the sign-in form is (shared submit loader, `aria-busy`, polite status
"Перевірка…"), the input is disabled, and a second submit or Enter sends nothing. The shared
offline behaviour applies: offline disables the submit and shows the offline notice.

- Given six digits typed, when no button is pressed, then no request is sent.
- Given four digits, when submitted, then the error shows, focus is on the first empty cell, and
  no request is sent.
- Given a request in flight, when Enter is pressed again, then no second request is sent.
- Given the browser offline, when the user tries to submit, then the submit is disabled and the
  offline notice reads its offline text.

Trace: D6; NFR-16; brief §3 journey "Sign in".

#### FR-17 — Recovery-code mode

"Використати резервний код" replaces the six cells with one labelled text field "Резервний код"
(helper text "Формат: XXXX-XXXX", `autocomplete="off"`, `autocapitalize="characters"`,
`spellcheck="false"`), changes the subtitle to "Введіть один із резервних кодів, які ви зберегли
під час налаштування.", and turns the text button into "Використати код із застосунку", which
switches back. Each switch clears the value and any error and moves focus to the new input. The
field accepts the code in any case, with or without the hyphen and surrounding spaces, and sends
it normalised to upper case `XXXX-XXXX`; any other shape shows "Введіть резервний код у форматі
XXXX-XXXX" and sends nothing. The field reuses the shared text field with the instance colours of
NFR-6.

- Given `abcd2345`, when submitted, then `variables.input.twoFactorCode` is `ABCD-2345`.
- Given `abc-123`, when submitted, then the format error shows and no request is sent.
- Given either switch, when activated, then focus is on the new input, its accessible name names
  the mode, and the previous value is gone.

> Assumption: no extra live announcement on a mode switch. Moving focus to the new input announces
> its label; a second live message would be read twice.

Trace: D1; brief §11 (normalisation); research §3.4 (code formats).

#### FR-18 — Successful completion

A resolved `completeTwoFactorUser` stores the access token in memory as FR-9 does, records the
known 2FA status as on, discards the pending challenge, drops the refresh token, and navigates to
the redirect-back target (FR-13) with focus on `main`. When `recoveryCodesRemaining` is a number
of 2 or less, the low-codes notice of FR-37 is raised; the upstream English `warning` is never
selected or shown.

- Given a resolved answer, when it settles, then the URL is the `from` target or `/`, `main` has
  focus, the pending challenge is gone and the token equals `accessToken`.
- Given `recoveryCodesRemaining: 1`, when the user lands, then the FR-37 notice shows.
- Given Back after landing, when pressed, then the challenge does not render (no challenge, FR-12).

Trace: D3, D4, D9.

#### FR-19 — Wrong code

A `401` "Invalid two-factor code." or a `422` violation on `twoFactorCode` clears the input, shows
the error on it and moves focus to its first cell (or the recovery field). Authenticator mode:
"Невірний код. Перевірте, чи правильно встановлено час на телефоні, і спробуйте ще раз."
(clock skew, research §3.4). Recovery mode: "Невірний резервний код. Спробуйте ще раз." The
pending challenge is kept; the server deletes it after five failures and the next submit then
takes FR-20.

- Given a wrong-code answer, when it settles, then the input is empty, `aria-invalid="true"` is
  set, the message is referenced by `aria-describedby`, and focus is in the input.
- Given five wrong codes followed by a sixth submit answered with the expired-session `401`, when
  it settles, then FR-20 applies.

Trace: D11; research §3.4, §3.5.

#### FR-20 — Expired or exhausted session

A `401` "Invalid or expired two-factor session.", and any other or unrecognised `401` on
completion, discards the pending challenge and navigates to `/sign-in` by replace carrying a
one-time notice. `/sign-in` shows "Час на підтвердження входу минув. Увійдіть знову." in a polite
`role="status"` region inside the card above the form, focuses `main` as the existing arrival
behaviour does (`use-arrival-focus.ts:10-23`), and clears the marker from the history entry so a
reload or Back never shows it again. The original `state.from` is kept for the next sign-in.

- Given the expired answer, when it settles, then the URL is `/sign-in`, the notice text is in a
  `role="status"` region, `main` has focus and the e-mail field is empty.
- Given an unknown `401` message, when it settles, then the same happens (unit test).
- Given the notice, when the page is reloaded or Back pressed, then it is not shown again.
- Given the resting `/sign-in`, when it renders, then no notice region exists and the resting
  baseline is unchanged.

Trace: D4, D11; research §3.5 assumption (unknown `401` = expired).

#### FR-21 — Rate limited or locked during the challenge

An HTTP `429` on completion shows "Забагато спроб. Зачекайте хвилину і спробуйте знову." as a
focused `role="alert"` banner, keeps the challenge and the mode, offers no Retry action and never
re-sends; the submit stays enabled. A `423` (not expected on completion, handled defensively)
discards the challenge and returns to `/sign-in` showing the locked message of FR-11.

- Given a `429`, when it settles, then the banner shows, the input keeps its value, and exactly
  one request was sent.
- Given a `423`, when it settles, then the URL is `/sign-in` and the locked message shows.

Trace: D11; research §3.6.

#### FR-22 — Network, timeout and server failures

No response, the deadline (`REACT_APP_REQUEST_TIMEOUT_MS`, `.env.example:78`), a `5xx` or a result
failing its schema shows the transient banner of FR-11 with "Спробувати ще раз", which re-submits
the same code once on activation. The challenge and the entered code stay.

- Given an HTTP `503`, when it settles, then the banner shows and exactly one request was sent.
- Given the banner, when "Спробувати ще раз" is activated, then exactly one more request with the
  same body is sent.

Trace: D11; ADR-009 (deadline, no transport retry).

#### FR-23 — Leaving the challenge

"Назад" is a real anchor to `/sign-in` navigating client-side; it aborts an in-flight request and
discards the pending challenge. Arriving on `/sign-in` by any means (Back included) discards a
pending challenge, so browser Back behaves as "Назад". An aborted request shows nothing and
records no security signal.

- Given a request in flight, when "Назад" is activated, then the request is aborted, the URL is
  `/sign-in`, no banner shows and no signal is recorded.
- Given the challenge, when browser Back is pressed and then Forward, then `/sign-in` renders
  after the Forward (no challenge, FR-12).

> Assumption: discarding on any arrival at `/sign-in` is chosen over keeping the challenge alive
> behind Back; it gives one predictable rule and never leaves a usable session id in memory on a
> page that does not need it.

Trace: D4.

### 5.5 Bearer authorization

#### FR-24 — `Authorization: Bearer` on GraphQL requests

The Bearer link is #330's (`SessionLinkFactory`, which lands before this feature): every
non-anonymous GraphQL request carries `Authorization: Bearer <token>` read at request time, and a
transport `401` on a non-anonymous operation ends the session locally (user-service's firewall
answers an invalid, expired or revoked token with a transport `401` "Authentication required."
before GraphQL runs, `DualAuthenticator.php:79-93` at `a95c1e85`). This feature builds no link
and changes no session rule. #330 owns the link's anonymous set, which already lists
`SignInUser` and `CompleteTwoFactorUser` beside `CreateUser`, so neither ever carries the header
and a `401` on either never ends the session; this feature appends nothing to it. The four
settings mutations are non-anonymous and carry the header through the same link.

- Given a token, when `signInUser` or `completeTwoFactorUser` is sent, then the request has no
  `Authorization` header and a `401` on it keeps the token.
- Given a token, when a settings 2FA mutation is sent, then its request carries the header.

Trace: #330's link (planning contract §3.4); research §5.2.

### 5.6 Settings route

#### FR-25 — The 2FA section on the `/settings` page

The User Settings bundle (#330, ADR-021, landing before this feature) builds the `settings`
feature, `ROUTE_PATHS.settings`, the protected `/settings` route gated by `userSettings` through
its render-time route gate, the `UserProfile` page (one `h1` "Налаштування", the two-column grid
of Figma 313:10242 with a slot for the 2FA section) and the home link "Налаштування". This
feature builds none of them. It fills the slot: while `twoFactorAuth` is on, the page renders the
2FA section (`h2` "Двофакторна автентифікація"); while it is off, the page renders without it.
Enabling 2FA in an environment therefore needs `userSettings` on there too.

- Given a seeded token and both flags on, when `/settings` is opened, then the page renders the
  2FA section; with `twoFactorAuth` off it renders without the section.
- Given the page, the route contract and the home link after this feature, when they are read,
  then only the slot's content changed.

Trace: D7; Miro `UserProfile [component]<route>` → `2FASettings`; Figma "Помилка 404" frames.

#### FR-26 — Known 2FA status

The client keeps, in memory, the last 2FA status it learnt: off after a 2FA-off sign-in, on after
completion, on after confirm, off after disable, on after a setup `409`, off after a
`403` "not enabled". With nothing learnt (for example a seeded test token) the status is unknown
and the card shows the 2FA off state (D8). Logout clears it. No query is made for it.

- Given a seeded token, when `/settings` renders, then the 2FA off state shows and no request was
  sent.
- Given a 2FA-on sign-in completed in the same tab, when `/settings` renders, then the on state
  shows.
- Given logout, when the status is read, then it is unknown.

Trace: D3, D8; research §6 (known 2FA status).

#### FR-27 — 2FA off state and starting setup

The card shows the description "Одноразовий код, обмежений у часі, який генерує
застосунок-автентифікатор.", an ordered list of three steps ("Установіть Google Authenticator або
інший застосунок-автентифікатор на телефон", "Відскануйте QR-код або введіть ключ у застосунку",
"Введіть шестизначний код із застосунку, щоб завершити налаштування") and the submit "Почати
налаштування". Setup runs only on that button, never on mount (D8). The button sends one
`setupTwoFactorUser` with the shared busy state ("Підготовка…").

- Given the off state, when the page mounts (also under StrictMode), then no setup request is
  sent.
- Given "Почати налаштування", when activated, then exactly one setup request is sent with the
  `Authorization` header.

Trace: D8; brief §7 item 3; Figma `313:10242` steps (copy translated, step 3 replaced).

#### FR-28 — QR code, manual key and copy

A resolved setup shows, under the `h3` "Налаштуйте двофакторну автентифікацію": the QR code encoded
on the client from `otpauthUri` (an image with the accessible name "QR-код для застосунку
автентифікації"), the sentence "Якщо не вдається відсканувати QR-код, введіть цей ключ у
застосунку вручну.", the secret in a key chip (shown in groups of four for reading, copied
without spaces), a button "Скопіювати ключ", and the confirm step of FR-29. Copy writes the secret
to the clipboard and announces "Ключ скопійовано" in a polite status region; where the clipboard
API is unavailable (an insecure origin such as the test stack's `http://prod:3001`) or refuses,
the key text is selected and "Не вдалося скопіювати. Виділіть ключ і скопіюйте вручну." is
announced. Focus moves to the `h3`. The QR and the key are never written to the DOM outside the
card, the URL, storage, the cache or logs.

- Given a resolved setup with the mock secret, when it settles, then the QR decodes back to the
  exact `otpauthUri` (unit test with a decoder) and the chip shows the secret in groups of four.
- Given the clipboard available, when "Скопіювати ключ" is activated, then the clipboard holds
  the secret without spaces and the status announces the copy.
- Given the clipboard unavailable, when activated, then the fallback message is announced and the
  key text is selected.

Trace: D8, D10; research §3.4 (no QR image); Figma `315:11289`, `315:11309`.

#### FR-29 — Confirming enrolment

Below the QR: a six-cell code input (the FR-15 seam, label "Код із застосунку"), the note "Після
підтвердження всі інші ваші сеанси буде завершено.", and the submit "Підтвердити", sending one
`confirmTwoFactorUser` with `{ twoFactorCode, clientMutationId }`. Fewer than six digits shows the
FR-16 message and sends nothing. A wrong code (`401` "Invalid two-factor code." or `422`) clears
the input, shows "Невірний код. Перевірте, чи правильно встановлено час на телефоні, і спробуйте
ще раз." and focuses it. Only authenticator codes are accepted here (upstream rule).

- Given six valid digits, when submitted, then one confirm request is sent and the busy state
  shows "Перевірка…".
- Given a wrong-code answer, when it settles, then the error shows on the input and the QR and key
  stay visible.

Trace: D8 (confirm step, not in Figma); brief §11 (other sessions note).

#### FR-30 — Recovery codes shown once

A resolved confirm (and a resolved regenerate, FR-33) replaces the setup content with the `h3`
"Резервні коди", the text "Збережіть ці коди в надійному місці. Кожен код можна використати один
раз, якщо ви втратите доступ до застосунку. Ми показуємо їх лише зараз.", the eight codes as an
ordered list in a monospaced chip style, a button "Скопіювати коди" (newline-separated, with the
FR-28 clipboard fallback and the status "Коди скопійовано"), a checkbox "Я зберіг(-ла) коди в
надійному місці" and the submit "Готово", which stays focusable but `aria-disabled`, described
by "Спочатку підтвердьте, що зберегли коди", until the box is ticked. "Готово" clears the
codes from memory and shows the on state. Leaving the page without acknowledging is allowed; the
codes are discarded on unmount and the on state shows next time (brief §11). After confirm the
known status is on. Focus moves to the `h3`.

- Given a resolved confirm with eight codes, when it settles, then the list shows eight items in
  response order and focus is on the `h3`.
- Given the box unticked, when "Готово" is activated, then nothing happens and the button is
  `aria-disabled` with the reason exposed through its description.
- Given "Готово" after ticking, when activated, then the on state shows, focus moves to its
  status heading, and the codes are no longer in the DOM.
- Given navigation away before acknowledging, when `/settings` is reopened, then the on state
  shows and no code is in memory.

Trace: D8 (codes once, acknowledgement, not in Figma); research §3.4 (8 codes).

#### FR-31 — 2FA on state

The card shows the status text "Двофакторну автентифікацію ввімкнено" (with an icon that is
decorative), an outlined button "Вимкнути" (FR-32) and an outlined button "Створити нові резервні
коди" (FR-33).

- Given the on state, when it renders, then both buttons are reachable by name and the status
  text is not conveyed by colour alone.

Trace: D8; Figma `315:11502` / `315:12300` / `318:13133` ("2FA подключен" → translated).

#### FR-32 — Disabling with a code

"Вимкнути" opens an inline confirmation in the card (no dialog): the `h3` "Вимкнути двофакторну
автентифікацію", the text "Введіть код із застосунку або резервний код.", one labelled text field
"Код підтвердження" accepting six digits or a recovery code (normalised as FR-17), the submit
"Вимкнути" and the button "Скасувати". The submit sends one `disableTwoFactorUser` with
`{ twoFactorCode, clientMutationId }`; a resolved answer shows the off state, moves focus to its
status heading "Двофакторну автентифікацію вимкнено." (the single announcement, NFR-8) and
records the status as off. A wrong code shows
"Невірний код. Спробуйте ще раз." on the field. "Скасувати" returns to the on state and focuses
"Вимкнути". No password is asked (brief §11).

- Given `123456` or `abcd-2345`, when submitted, then the request carries `123456` or
  `ABCD-2345`.
- Given `12345`, when submitted, then the field error "Введіть 6 цифр або резервний код у форматі
  XXXX-XXXX" shows and nothing is sent.
- Given a resolved disable, when it settles, then the off state shows with focus on its status
  heading "Двофакторну автентифікацію вимкнено.", and no second live region repeats it.

Trace: D8 (disable with a code, not in Figma).

#### FR-33 — Regenerating recovery codes

"Створити нові резервні коди" opens an inline confirmation under the `h3` "Створити нові резервні
коди", which receives focus on open as the disable confirmation's does: "Старі резервні коди
перестануть діяти. Продовжити?" with the submit "Створити коди" and "Скасувати". The submit sends
one `regenerateRecoveryCodesUser`; a resolved answer shows the FR-30 view with the new codes. A
`403` "Re-authentication required." shows "З міркувань безпеки нові коди можна створити лише
протягом 5 хвилин після входу. Увійдіть знову, щоб продовжити." with the button "Увійти знову",
which runs the local sign-out (the protected outlet context's `signOut`) and navigates to
`/sign-in` with `state.from` = `/settings`; after signing in (with the challenge) the user lands
on `/settings` inside the re-authentication window (D8').

- Given "Створити нові резервні коди", when it is activated, then the confirmation shows and
  focus is on its `h3` "Створити нові резервні коди".
- Given a resolved regenerate, when it settles, then eight new codes show once.
- Given the re-authentication `403`, when it settles, then the message and "Увійти знову" show
  and focus moves to the message.
- Given "Увійти знову", when activated, then the token is cleared, the URL is `/sign-in`, and
  completing sign-in lands on `/settings`.

> Assumption: regeneration asks for one confirmation because it silently invalidates codes the
> user may have printed; D8 lists only the button, and the confirmation adds no request.

Trace: D8, D8'; research §3.4 (sudo window 300 s).

#### FR-34 — Status conflicts, stale setup and session end

- Setup `409`: the card shows the on state with its status heading reading "Двофакторну
  автентифікацію вже ввімкнено."; status on.
- Disable or regenerate `403` "Two-factor authentication is not enabled.": the off state with its
  status heading reading "Двофакторну автентифікацію вже вимкнено."; status off.
- Confirm `401` "Two-factor setup not initiated.": the off state with its status heading reading
  "Налаштування застаріло. Почніть знову."; the QR and key are discarded.
- Session end: a `401` that no 2FA message row claims (the shared error transformer's
  `unauthenticated`, #330's status row) or "Access Denied." (#330's exact-message row) is the
  session-ended outcome, never a retryable failure. The card renders nothing extra: #330's Bearer
  link has cleared the token on the transport `401`, a call without a token is answered "Access
  Denied.", and #330's protected-route redirect to `/sign-in` with `state.from` = `/settings` and
  its `session_ended` notice does the rest.

- Given each conflict and the stale setup, when it settles, then the stated state shows and focus
  moves to its status heading, whose text is the only announcement (NFR-8).
- Given a transport `401` on disable, when it settles, then the user is on `/sign-in` with #330's
  session notice and `from` = `/settings`, and the card showed no banner.
- Given "Access Denied." on a settings mutation, when it settles, then the outcome is the session
  end and the card shows no banner, no field error and no status.

> Assumption (accepted risk): a GraphQL `401` whose message no row claims, arriving while the
> token is still valid, is also the session-ended outcome, so the card stays silent. user-service
> answers every 2FA `401` with a message the table claims and an ended session with a transport
> `401`, so the case is not expected; Follow-up 5.1 re-checks it against the released server.

Trace: D8 (unknown status, `409`); research §3.4, §3.5; over-engineering review item 9.

#### FR-35 — Settings transient failures

On any settings mutation: HTTP `429` shows "Забагато спроб. Зачекайте хвилину і спробуйте знову."
with no Retry action; no response, the deadline, a `5xx`, a bad shape or an unrecognised refusal
shows the transient banner with "Спробувати ще раз" (one re-send on activation); a `422` on a code
shows the field's wrong-code message. Banners are focused
`role="alert"` regions inside the card (the shared form banner); the card keeps
its state and values; nothing is re-sent automatically.

- Given each failure, when it settles, then the stated text shows and exactly one request was sent.

Trace: D11.

#### FR-36 — Secrets on the settings page

The secret, the otpauth URI and the recovery codes live only in the settings card's own memory.
They are cleared on "Готово", on a state change that no longer shows them, and on unmount; none is
written to the Apollo cache (NFR-2), the URL, storage, the global auth state, logs or telemetry.

- Given setup or codes on screen, when the section unmounts and the 2FA section's hook state is
  inspected in a unit test, then no secret remains.
- Given the settings flows in e2e, when `localStorage`, `sessionStorage` and the URL are read
  after each step, then none contains the secret, the URI or a code.

Trace: D8 (secrets in memory, cleared on unmount); research §7.1 risk 5.

### 5.7 Low recovery codes notice

#### FR-37 — Notice after landing

When completion reports `recoveryCodesRemaining` of 2 or less, the first protected page shows a
notice at the top of `main`: a polite `role="status"` region with the plural strings of FR-40
("Залишився {{count}} резервний код. Створіть нові коди в налаштуваннях." for one, "Залишилося
{{count}} резервні коди. Створіть нові коди в налаштуваннях." for few, "Залишилося {{count}}
резервних кодів. Створіть нові коди в налаштуваннях." for many and other) or, for 0, "Резервні
коди закінчилися. Створіть нові коди зараз.", a link "Відкрити налаштування" to `/settings` and a
button "Закрити сповіщення". It does not take focus (`main` has it, FR-18). It disappears on
dismiss, on arrival at `/settings`, on logout and on reload. The notice code loads lazily only
when a notice exists (NFR-11).

- Given `recoveryCodesRemaining` 1, 2 and 0, when the user lands, then the matching text shows in
  both locales (uk plural forms one and few).
- Given `recoveryCodesRemaining` absent, when the user lands, then no notice exists.
- Given the link, when activated, then `/settings` renders and the notice is gone.

Trace: D9; brief §11 (zero codes).

### 5.8 Telemetry and security signals

#### FR-38 — Security signals for 2FA failures

Sign-in and challenge failures feed the existing security-event recorder through
`AuthSecuritySignals`, in the existing `login` category, with bounded reasons, so repeated wrong
codes on the challenge escalate the same `auth_failure_burst` alert as password failures (one
rolling monitor, `security-event-core.ts:13-22`). The reason union (`security-event.ts:10-11`)
gains `invalid_code`, `expired_session` and `locked`; `rate_limited`, `network`, `server`,
`validation` and `unknown` keep their meaning (`auth-security-signals.ts:55-64` maps `429` first).
A resolved operation and an abort record nothing; a completed challenge tags the session as a
completed sign-in does. The settings section records no security signal: user-service owns the
2FA rules and rate limits, and no gate needs one (over-engineering review item 4). Payloads never
carry the e-mail, a code, the session id, the secret, the URI, a recovery code or a token.
`SECURITY.md` lists the new reasons.

- Given each sign-in and challenge failure class, when it settles, then exactly one
  `auth_failure` in `login` with the stated reason is recorded; an abort records nothing.
- Given five wrong codes inside the window, when the fifth settles, then it is
  `auth_failure_burst` with `thresholdCrossed: true`.
- Given any settings outcome, when it settles, then no security signal is recorded.
- Given any 2FA signal, when serialised, then it contains only `event`, `category`, `reason`,
  `severity` and the window counters.

Trace: D11; research §5.8; over-engineering review item 4.

#### FR-39 — Scrubbing 2FA secrets from telemetry

The scrubber's denied key fragments (`pii-scrubber.ts:4-12`) gain `pendingsession`,
`twofactorcode`, `recoverycode` and `otpauth` (`token` already covers `accessToken` and
`refreshToken`, `secret` covers `secret`), and its value patterns (`:14-18`) gain one that redacts
`otpauth://` URIs up to whitespace or a quote. The otpauth pattern runs first, before the e-mail
pattern (`:15`). user-service percent-encodes the URI label (`rawurlencode`), so a real URI
carries `%40`, not `@`, and the test vector is `@`-free: with an `@` in it, the e-mail pattern
alone would redact the URI and the test could not prove the new pattern.

- Given an event with `pendingSessionId`, `twoFactorCode`, `recoveryCodes`, `otpauthUri`,
  `secret`, `accessToken` and `refreshToken` keys at any depth, when scrubbed, then none remains.
- Given a string containing `otpauth://totp/VilnaCRM%3Aa%40b.c?secret=ABC&issuer=VilnaCRM`,
  when scrubbed, then no part of the URI remains (the e-mail pattern alone leaves it intact).
- Given a correlation id (UUID), when scrubbed, then it is unchanged.

> Assumption: no value pattern for recovery codes or six-digit codes. A `XXXX-XXXX` pattern also
> matches inside the UUID correlation ids that incident response joins on, and a six-digit pattern
> redacts ordinary numbers; codes never travel outside the keyed variables.

Trace: corrections (scrubber keys and `otpauth://` pattern); D8.

### 5.9 Localization

#### FR-40 — Copy in uk and en

Every string exists in both catalogs of the owning feature's `i18n` folder with identical key
sets; the merged catalog is regenerated; no literal ships in source. The Figma defects are
corrected ("Двофакторна", "автентифікація", "Google Authenticator", "акаунту") and the Russian
settings copy is translated (D12). Reused keys: `buttons.back_to_main`, `auth.error.tryAgain`.
New strings (key names are the architecture's):

- challenge title and `h1`: "Двофакторна автентифікація" — "Two-factor authentication"
- authenticator subtitle: "Введіть шестизначний код із застосунку Google Authenticator." — "Enter
  the six-digit code from Google Authenticator."
- time note: "Код можна ввести протягом 5 хвилин після входу." — "You can enter the code within 5
  minutes of signing in."
- recovery subtitle: "Введіть один із резервних кодів, які ви зберегли під час налаштування." —
  "Enter one of the recovery codes you saved during setup."
- code group: "Код підтвердження" — "Verification code"; cell: "Цифра {{index}} з 6" — "Digit
  {{index}} of 6"
- submit: "Підтвердити" — "Confirm"; busy: "Перевірка…" — "Verifying…"
- back: "Назад" — "Back"
- to recovery mode: "Використати резервний код" — "Use a recovery code"; to authenticator mode:
  "Використати код із застосунку" — "Use the app code"
- recovery field: "Резервний код" — "Recovery code"; helper: "Формат: XXXX-XXXX" — "Format:
  XXXX-XXXX"
- incomplete code: "Введіть усі 6 цифр коду" — "Enter all 6 digits of the code"
- recovery format: "Введіть резервний код у форматі XXXX-XXXX" — "Enter the recovery code in the
  XXXX-XXXX format"
- wrong code: "Невірний код. Перевірте, чи правильно встановлено час на телефоні, і спробуйте ще
  раз." — "Incorrect code. Check that the time on your phone is correct and try again."
- wrong recovery code: "Невірний резервний код. Спробуйте ще раз." — "Incorrect recovery code.
  Try again."
- wrong code, short: "Невірний код. Спробуйте ще раз." — "Incorrect code. Try again."
- expired notice: "Час на підтвердження входу минув. Увійдіть знову." — "The sign-in confirmation
  has expired. Please sign in again."
- invalid credentials: "Невірна електронна пошта або пароль." — "Incorrect e-mail or password."
- locked: "Обліковий запис тимчасово заблоковано через забагато невдалих спроб. Спробуйте
  пізніше." — "The account is temporarily locked after too many failed attempts. Try again
  later."
- rate limited: "Забагато спроб. Зачекайте хвилину і спробуйте знову." — "Too many attempts. Wait
  a minute and try again."
- transient: "Не вдалося надіслати запит. Перевірте з'єднання та спробуйте ще раз." — "The
  request could not be sent. Check your connection and try again."
- card `h2`: "Двофакторна автентифікація" — "Two-factor authentication"
- description: "Одноразовий код, обмежений у часі, який генерує застосунок-автентифікатор." — "A
  time-limited one-time code generated by an authenticator app."
- steps: "Установіть Google Authenticator або інший застосунок-автентифікатор на телефон" /
  "Відскануйте QR-код або введіть ключ у застосунку" / "Введіть шестизначний код із застосунку,
  щоб завершити налаштування" — "Install Google Authenticator or another authenticator app on
  your phone" / "Scan the QR code or enter the key in the app" / "Enter the six-digit code from
  the app to finish setup"
- start: "Почати налаштування" — "Start setup"; preparing: "Підготовка…" — "Preparing…"
- setup `h3`: "Налаштуйте двофакторну автентифікацію" — "Set up two-factor authentication"
- QR name: "QR-код для застосунку автентифікації" — "QR code for the authenticator app"
- manual key: "Якщо не вдається відсканувати QR-код, введіть цей ключ у застосунку вручну." — "If
  you cannot scan the QR code, enter this key in the app manually."
- copy key: "Скопіювати ключ" — "Copy key"; copied: "Ключ скопійовано" — "Key copied"
- copy failed: "Не вдалося скопіювати. Виділіть ключ і скопіюйте вручну." — "Copying failed.
  Select the key and copy it manually."; codes variant: "Не вдалося скопіювати. Виділіть коди і
  скопіюйте вручну." — "Copying failed. Select the codes and copy them manually."
- confirm field: "Код із застосунку" — "Code from the app"; note: "Після підтвердження всі інші
  ваші сеанси буде завершено." — "After confirmation, all your other sessions will be signed
  out."
- codes `h3`: "Резервні коди" — "Recovery codes"; text: "Збережіть ці коди в надійному місці.
  Кожен код можна використати один раз, якщо ви втратите доступ до застосунку. Ми показуємо їх
  лише зараз." — "Keep these codes somewhere safe. Each code works once if you lose access to the
  app. We show them only now."
- copy codes: "Скопіювати коди" — "Copy codes"; copied: "Коди скопійовано" — "Codes copied"
- acknowledgement: "Я зберіг(-ла) коди в надійному місці" — "I have saved the codes somewhere
  safe"; done: "Готово" — "Done"; done disabled reason: "Спочатку підтвердьте, що зберегли коди"
  — "First confirm that you saved the codes"
- on status: "Двофакторну автентифікацію ввімкнено" — "Two-factor authentication is on"
- turn off: "Вимкнути" — "Turn off"; regenerate: "Створити нові резервні коди" — "Generate new
  recovery codes"
- disable `h3`: "Вимкнути двофакторну автентифікацію" — "Turn off two-factor authentication";
  text: "Введіть код із застосунку або резервний код." — "Enter a code from the app or a recovery
  code."; field: "Код підтвердження" — "Verification code"; cancel: "Скасувати" — "Cancel"
- disable format: "Введіть 6 цифр або резервний код у форматі XXXX-XXXX" — "Enter 6 digits or a
  recovery code in the XXXX-XXXX format"
- disabled status: "Двофакторну автентифікацію вимкнено." — "Two-factor authentication is off."
- regenerate confirm: "Старі резервні коди перестануть діяти. Продовжити?" — "Your old recovery
  codes will stop working. Continue?"; submit: "Створити коди" — "Generate codes"
- re-authentication: "З міркувань безпеки нові коди можна створити лише протягом 5 хвилин після
  входу. Увійдіть знову, щоб продовжити." — "For security, new codes can only be generated within
  5 minutes of signing in. Sign in again to continue."; button: "Увійти знову" — "Sign in again"
- already on: "Двофакторну автентифікацію вже ввімкнено." — "Two-factor authentication is
  already on."; already off: "Двофакторну автентифікацію вже вимкнено." — "Two-factor
  authentication is already off."
- stale setup: "Налаштування застаріло. Почніть знову." — "This setup has expired. Start again."
- low codes (count, uk one / few / many / other): "Залишився {{count}} резервний код. Створіть
  нові коди в налаштуваннях." / "Залишилося {{count}} резервні коди. …" / "Залишилося {{count}}
  резервних кодів. …" — en one / other: "{{count}} recovery code left. Generate new codes in
  settings." / "{{count}} recovery codes left. …"
- no codes left: "Резервні коди закінчилися. Створіть нові коди зараз." — "You have no recovery
  codes left. Generate new codes now."
- open settings: "Відкрити налаштування" — "Open settings"; dismiss: "Закрити сповіщення" —
  "Dismiss notice"

The ellipses in the plural rows stand for the sentence repeated in full; the catalog carries
complete strings. The settings title, the home link and the session-ended notice are #330's
strings and are not added here.

- Given the catalogs, when `make lint-i18n` runs, then key sets match, no string is empty, plural
  families are complete for uk (one, few, many, other) and en (one, other), and every `t()` key
  resolves.
- Given `uk`, when any new screen renders, then no English string is visible.

Trace: D12; research §4.6.

### 5.10 Documentation and inventories

#### FR-41 — Contracts README

`src/api/contracts/README.md` replaces the transport rule that routes "session/token exchange
(login)" to REST (`:32-36`) with GraphQL for sign-in (no REST login remains), and adds the 2FA
row to #315's pending section (the file, the version it is pending against, its deletion in
Follow-up 5.1), the stateless mock's triggers (FR-4) and the mock drift list (§9), in the same
changes that land them.

- Given `make lint-docs`, when it runs, then it passes and every documented command exists.

Trace: research §3.3, §8.4 item 1; corrections.

#### FR-42 — Feature flags document

`docs/feature-flags.md` adds `twoFactorAuth` to "Current flags" with the `false` default, what it
gates (the 2FA section of `/settings` only), the test stack enabling it, production enablement as
the next step (after a user-service release carrying the contract is deployed) and the removal
trigger (delete the flag once production has run the section).

Trace: user rules (flag); D13.

#### FR-43 — `UiPinInput` seam register

The seam of FR-15 is registered per ADR-016: the `uiToolkitSeams` entry (`eslint.config.mjs`), the
`docs/ui-toolkit.md` register rows ("Keep-local register", line 201, and "Adoption in v0.6.0")
naming the overrides (focus ring, border, gap, cell size, hidden placeholder, cell labels) and the
ui-toolkit issue for any gap, and no change to the pinned checksums.

- Given `make lint-ui-toolkit` and `make lint-eslint`, when they run, then both pass and importing
  `@vilnacrm/ui-toolkit/ui-pin-input` from any other file fails ESLint.

Trace: D5; research §5.7.

#### FR-44 — ADR-020

`docs/adr/020-…md` (template sections, Deciders @kravalg, listed in `docs/adr/README.md`) records:
the 2FA pending file beside #315's and its manual deletion; GraphQL-only sign-in through one
Data provider and the retirement of the REST login; memory-only tokens and challenge, refresh
token dropped; the challenge as a mid-flow public route and its guard; where the 2FA section and
the known status live under the sibling-feature ban (`.dependency-cruiser.js:591-602`); the use
of #330's Bearer link and #315's provider loader; the 2FA rows of the shared error
classification; the QR encoder dependency and its chunk; the `UiPinInput` seam overrides. It
satisfies the ADR drift gate for the `dependencies` and `src/config/**` changes.

- Given `make lint-adr` and the ADR drift check on the pull request, when they run, then both
  pass.

Trace: user rules (ADR-020); D10.

#### FR-45 — Other documents and inventories

`SECURITY.md` (event table, scrubber keys), the user module README, the routes README and
`CLAUDE.md` / `AGENTS.md` mirrors where they describe login transport or flags are updated.
`tests/e2e/route-coverage.tsv` gains rows for the new `twoFactorChallenge` key (e2e, visual, axe
route scan, keyboard, mobile) and rows naming the 2FA specs under #330's `settings` key, the axe
route list (`tests/e2e/a11y/routes.a11y.spec.ts:19-22`) gains the challenge, and every new
rendering file has a Storybook story.

- Given `make check-e2e-route-coverage`, when it runs, then it passes with no allowlisted row for
  `twoFactorChallenge`.
- Given the story-coverage test, when it runs, then every new rendering `.tsx` has a story.

Trace: research §5.5, §5.9; brief §5.

## 6. Non-functional requirements

Every value below is read from the profile (`.claude/react-sdlc.yml:50-65`, `quality.*`) or the
config file the gate enforces, and is a raise-only floor or a zero ceiling. No story may satisfy a
gate by editing a threshold, adding a suppression, narrowing a scope or re-baselining to force a
pass. The only intended baseline changes are those of NFR-15.

### NFR-1 — Secret hygiene

The pending session id, codes, the TOTP secret, the otpauth URI, recovery codes, the access token
and the refresh token never appear in the URL, `history.state`, `localStorage`,
`sessionStorage`, IndexedDB, cookies set by crm, the document title, console output, Sentry
events or security signals. The access token lives only in `AuthState.token` of the Zustand store
`useAuthStore`, which has no `persist` middleware; the refresh token is never stored.

- Given every flow in e2e, when the URL, history state and all storage areas are read after each
  step, then none contains a secret (one helper asserts this for every spec).
- Given the console gate, when any 2FA test runs, then no secret is logged.

### NFR-2 — Mutation discipline

Every secret-bearing mutation (all six) runs with `fetchPolicy: 'no-cache'`, selects only the
fields of FR-3, checks the abort signal before calling `mutate`, passes the signal through
`context.fetchOptions.signal` (the `registration-api.ts` precedent), and is never retried by the
transport or the repository (the chain has no retry link, `apollo-link-factory.ts:17-22`).

- Given each repository, when its mutation resolves, then a spy on the client's `cache.write`
  records zero calls (not `cache.extract()`).
- Given an already aborted signal, when the repository is called, then `mutate` is never called.
- Given an HTTP `503` followed by success, when the user submits once, then the second answer is
  never requested.

### NFR-3 — No enumeration, uniform answers

Every `401` and `422` on `signInUser` renders one message and one DOM; `twoFactorEnabled` is read
only from a successful sign-in; no extra request or branch depends on whether an account exists;
the uniform answer is decided in the sign-in transformer, below the Data provider, so nothing
above it can tell the causes apart.

- Given an unknown e-mail and a wrong password, when each is submitted, then the rendered DOM, the
  security signal reason and the request count are identical.

### NFR-4 — Headers, origins and dependency hygiene

`config/security-headers.json` and the generated `serve.json` are unchanged: the CSP keeps
`script-src 'self'` without `'unsafe-eval'`, `img-src 'self' data:`, `connect-src` with the API
origins only. The QR encoder is MIT or another licence in `ALLOWED_LICENSES`, has no runtime
dependency on the network, `eval` or `new Function`, and renders SVG or a `data:` image. No
third-party origin is contacted. `make lint-licenses`, the supply-chain scans and the
security-header gate pass.

- Given the production build in the test stack, when the network is observed on both routes,
  then only the document origin and the configured API origins are contacted.

### NFR-5 — Accessibility standard

WCAG 2.1 Level AA is binding (`docs/accessibility/acceptance-standard.md`): jest-axe over every new
component and page; `@axe-core/playwright` on `/sign-in/two-factor` and `/settings` in chromium,
firefox and webkit, in the resting state and in the error, recovery-code, setup, codes, on and
re-authentication states; no positive `tabindex`; **zero new `A11Y_EXCEPTIONS` entries**
(`tests/utils/a11y/axe-config.ts:27-54`). Primary pills (white on `#1EAEFF`, 2.46:1) are reused
only as the submit of a `<form>`, the shape the existing #276 entry covers
(`form button[type="submit"].MuiButton-contained`, `:36`); any other control uses a compliant
colour. One `h1` per page, landmarks unchanged, colour never the only carrier of a state.

- Given the axe gate test, when it runs, then `A11Y_EXCEPTIONS` still has exactly its four
  entries.
- Given the in-card "Назад" link, when the a11y spec runs, then it matches none of the
  `A11Y_EXCEPTIONS` selectors and passes `color-contrast` on its own colour.

### NFR-6 — Contrast overrides with exact colours

Ratios are computed with the WCAG 2.1 relative-luminance formula against white `#FFFFFF` (the card
and cell background) unless stated. Each override is a reviewed accessibility override of the
design, recorded through `figma-design-check` and raised in the designer follow-up.

| Element                              | Figma          | Shipped                   | Ratio   |
| ------------------------------------ | -------------- | ------------------------- | ------- |
| In-card "Назад" text and chevron     | #969B9D 2.81:1 | #404142 (Font/200)        | 10.23:1 |
| Mode toggle text button (underlined) | no frame       | #0074B5 (linkText)        | 5.04:1  |
| Mode toggle hover                    | no frame       | #00588A (linkTextHover)   | 7.60:1  |
| Subtitle, helper and body text       | #404142        | #404142                   | 10.23:1 |
| Error text (field, banner)           | no frame       | #C62828                   | 5.62:1  |
| Pin cell border, rest                | #E1E7EA 1.25:1 | #80878A                   | 3.65:1  |
| Pin cell border, hover               | #D0D4D8 1.49:1 | #57595B (Font/250)        | 7.03:1  |
| Pin cell border, error               | no frame       | #DC3939 (error.main)      | 4.48:1  |
| Pin cell focus                       | 15% shadow     | 2px #404142 ring, 2px gap | 10.23:1 |
| Pin cell digit                       | #57595B        | #1A1C1E (Font/100)        | 17.09:1 |
| Pin cell placeholder "0"             | #D0D4D8 1.49:1 | hidden; attribute kept    | n/a     |
| Text field border (2FA instances)    | #D0D4D8 1.49:1 | #80878A                   | 3.65:1  |
| Text field placeholder               | #969B9D 2.81:1 | none; helper text         | 10.23:1 |
| Outlined buttons, border             | #969B9D 2.81:1 | #80878A                   | 3.65:1  |
| Outlined buttons, text               | #1B2327        | #1B2327                   | 15.95:1 |
| Acknowledgement checkbox, unchecked  | no frame       | #80878A outline           | 3.65:1  |
| Acknowledgement checkbox, checked    | no frame       | #0074B5 fill, white tick  | 5.04:1  |
| Key chip text on #EAECEE             | #57595B        | #57595B                   | 5.94:1  |
| Step badge text on #E1E7EA           | #57595B        | #57595B                   | 5.63:1  |
| Recovery codes on #EAECEE            | no frame       | #1A1C1E                   | 14.43:1 |
| QR modules (white quiet zone)        | black on tile  | #1A1C1E on #FFFFFF        | 17.09:1 |
| Low-codes notice link                | no frame       | #0074B5                   | 5.04:1  |
| "Увійти знову": text                 | no frame       | #1A1C1E (Font/100)        | 17.09:1 |
| "Увійти знову": border               | no frame       | #80878A (outlined)        | 3.65:1  |

Text needs 4.5:1 (1.4.3); borders, focus indicators and the checkbox need 3:1 against their
adjacent colours (1.4.11, 2.4.7). The focus ring sits 2 px outside the cell on white, so its
adjacent colour is `#FFFFFF`. `#C62828` is 5.43:1 on the page background `#FBFBFB`. `#80878A` is
3.53:1 on `#FBFBFB`. The error border `#DC3939` passes the 3:1 non-text bar but not the 4.5:1 text
bar, so error **text** uses `#C62828`. The new flows render their errors through the shared form
banner and the shared field-error text, which #330 moves to the error-text token
`paletteColors.error.text` (`#C62828`) for every form at the source, with its own baselines. This
feature adds one value to `src/styles/colors.ts`, the non-text grey `#80878A`
(`paletteColors.border.strong`); every other shipped value is an existing token (`#404142`,
`#1A1C1E`, `#57595B`, `#1B2327`, `#0074B5`, `#00588A`, `#DC3939`) or #330's error red.
Every button that is not a form's submit is outlined (the outlined-button rows); none
keeps `UIButton`'s default text variant, which paints the palette-less theme's `#1976D2` at
4.45:1 on `#FBFBFB`, and no contained pill is used outside a form. The shared text field's own
border (`#D0D4D8`, 1.49:1) and placeholder (`#969B9D`, 2.81:1) stay pre-existing defects outside
this feature: a separate crm issue candidate (§11).

> Assumption: one non-text grey (`#80878A`) is introduced for every 2FA border instead of the
> darker `#57595B`, to stay closest to the Figma weight while clearing 3:1 with margin; the
> designer follow-up may replace it with any token at or above 3:1.

### NFR-7 — Code input accessibility and manual evidence

The pin-input acceptance criteria of D5' are binding: the group has an accessible name; each cell
is named "Цифра N з 6" / "Digit N of 6"; pasting a six-digit code fills all cells; one cell is
focused at a time; an error is announced once (the message is referenced by `aria-describedby`
and focus moves into the input; no second `role="alert"` repeats it). Implementation records a
manual screen-reader check of the challenge and the confirm step with NVDA (Firefox or Chrome on
Windows) and VoiceOver (Safari on macOS and iOS) as manual evidence: entering, pasting, an error,
the mode switch and submit, and whether either reads the hidden `placeholder="0"` the toolkit
keeps on each cell (FR-15).

- Given a wrong code in jsdom, when the error renders, then exactly one element announces it (no
  duplicate live region) and the cells carry `aria-invalid="true"`.
- Given the pull request, when it is reviewed, then the manual evidence for both screen readers is
  attached.

### NFR-8 — Focus management and live regions

- Arrival on `/sign-in/two-factor`: focus on the card `h1`. Arrival after completion: `main`
  (existing behaviour). Arrival on `/sign-in` with a notice: `main`, notice in a polite
  `role="status"` region.
- Settings state changes (setup shown, codes shown, on, off, disable, regenerate,
  re-authentication): focus on the new `h3` or status heading, whose text is the single
  announcement of the change (no second live region or overlay repeats it); failures in a
  focused `role="alert"` banner inside the card (the shared form banner); field errors keep
  `aria-invalid` + `aria-describedby`.
- Copy feedback: polite status, focus stays on the copy button.
- The busy state uses the shared polite status; the low-codes notice never takes focus.
- No live region is created and filled in the same commit (the always-mounted pattern of
  `UIOfflineNotice`).

### NFR-9 — Keyboard contract

Both routes are completable with the keyboard only, asserted with the shared tab-order helper:

- Challenge, authenticator mode: back-to-main → "Назад" → cells 1 to 6 → "Підтвердити" →
  "Використати резервний код" → footer links. Every cell is a Tab stop, because `UiPinInput`
  keeps each native cell in the natural tab order with no roving tabindex; a typed digit
  advances focus, and the arrow keys and Backspace move between cells as it provides.
- Challenge, recovery mode: back-to-main → "Назад" → "Резервний код" → "Підтвердити" →
  "Використати код із застосунку" → footer links.
- Settings, off: "Почати налаштування"; setup: "Скопіювати ключ" → cells 1 to 6 → "Підтвердити";
  codes: "Скопіювати коди" → checkbox (Space toggles) → "Готово"; on: "Вимкнути" → "Створити нові
  резервні коди"; disable: field → "Вимкнути" → "Скасувати"; regenerate: "Створити коди" →
  "Скасувати"; re-authentication: "Увійти знову".

Every stop is `:focus-visible` with a visible ring of `2px solid #404142`, offset 2 px. The
theme gives that ring to contained buttons only (`src/components/ui-button/theme.ts:25-29` sits
inside the `contained` override; the `outlined` override at `:48-57` and the text variant set
none), so the contained submits inherit it and every new non-contained control ("Назад", the
mode toggle, the copy buttons, "Скасувати", the on view's buttons, "Увійти знову", the notice's
link and dismiss, the banner Retry) applies one shared `:focus-visible`
style with those values; the pin cells paint the same values through the seam. Existing stops
(back-to-main, footer links, sign out) keep the ring they have today. The browser lanes read the
ring with `toHaveCSS` after keyboard focus; jsdom cannot compute it. Enter submits; Escape in an
inline confirmation acts as "Скасувати".

### NFR-10 — Motion and touch

No new animation; any transition between card states is instant under
`prefers-reduced-motion: reduce`; nothing auto-scrolls smoothly. On both mobile projects
(`tests/e2e/mobile/`, Pixel 7 and iPhone 14): the challenge (both modes) and enrolment are
completed with `tap()` only; pin cells (about 48.8 × 64 on the challenge at both device widths),
the recovery field, the settings code fields and every submit are at least 44 CSS px tall and wide
where the floor applies (`tests/e2e/mobile/constants.ts:12`); "Назад", the mode toggle, copy
buttons and the checkbox hit area are at least 24 × 24 CSS px; no horizontal overflow at 320, 390
and 412 px, and every pin cell of the challenge and of the confirm step inside its card's content
box at 320, 360, 600 and 767 px; the submit stays reachable at the keyboard-height layout
viewport; an empty submit fires no request.

### NFR-11 — Performance and bundle

Nothing new joins the eager entrypoint beyond the challenge route's key and declaration and a few
lines in the protected-route guard and the app layout (under 1 kB gzip in the bundle-size
report); this feature adds no flag gate. The challenge page, the 2FA section, the low-codes
notice and the expired-challenge notice are lazy
(`webpackChunkName`-named, wrapped by the composer). The QR encoder is imported only by the
settings chunk, never by the eager entrypoint or the deferred auth/DI chunk (317 727 of 400 000
raw on the stale 2026-07-20 baseline). Budgets from `config/performance-budget.json` are unchanged
and met: raw entrypoint ≤ 470 000 B, any asset ≤ 400 000 B, gzip entrypoint ≤ 165 000 B, any
chunk ≤ 130 000 B, Lighthouse script ≤ 265 000 B, total ≤ 480 000 B, script count warn 25. No
`@mui/material` import lands on eager code (ADR-017).

- Given the paint-path graph test, when it runs, then neither the QR encoder nor any 2FA Data
  provider, Transformer or Repository is statically reachable from `src/index.tsx`.
- Given the bundle-size report, when it runs on the pull request, then the eager entrypoint delta
  is under 1 kB gzip and the QR encoder appears only in the settings chunk.

### NFR-12 — Lighthouse floors

Binding: desktop performance, accessibility and best practices ≥ 0.95, SEO ≥ 0.90
(`lighthouse/lighthouserc.desktop.js:19-22`, `.claude/react-sdlc.yml:64`); mobile performance ≥
0.85 (median of three) per `.claude/react-sdlc.yml:65`, and `/sign-in` loses no point against
`main`; mobile accessibility, best practices and SEO ≥ 0.90
(`lighthouse/lighthouserc.mobile.js:36-38`). `lighthouse/lighthouserc.mobile.js` is not edited:
its performance assertion stays at 0.84 (`:35`), and a run between 0.84 and 0.85 is fixed at its
root cause, never by an edit of the file or the profile. The audited URLs stay `/`, `/sign-up`,
`/sign-in` (`lighthouse/constants.js:15-19`); the new route is not audited, and `/sign-in`
runs the GraphQL sign-in path, the only one left.

### NFR-13 — Quality floors

From `.claude/react-sdlc.yml` `quality.*`, raise-only: coverage 100% statements, branches,
functions and lines (unit and integration); mutation MSI 100 (`stryker.config.mjs` `break: 100`)
over every new file in the mutate scope; jscpd 0 clones (`.jscpd.json`, 70 tokens); ESLint 0
errors and 0 warnings; `tsc` 0 errors under the strict flags; markdownlint 0; dependency-cruiser 0
violations; `make lint-metrics` hard-fail policy (`config/metrics-policy.json`: at most 10
functions per file, 8 public methods, 3 arguments, cyclomatic 10, cognitive 15); visual diffs 0.
No `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, depcruise ignore, coverage suppression or
new `A11Y_EXCEPTIONS` entry.

### NFR-14 — Conventions and architecture gates

Classes only outside React components and hooks; no static members or free functions; type-only
files whose boundary types obey NFR-21; the Miro layers of NFR-22; approved class-name suffixes from
`config/class-naming-policy.js` with no new suffix where one fits; collaborators through DI tokens;
no new module-level singleton (wiring in the composition root, #315's provider loader for the
paint path); the auth paint path stays container-free and never reaches `@/providers/di`;
module-shape folders (`config/module-shape.json`) and the sibling-feature ban; no `data-testid`; no
raw `Intl` call; no route literal in `src/routes/**` without an error element.

### NFR-15 — Visual regression

Zero unintended diffs; baselines come from CI artifacts. New baselines:

- `/sign-in/two-factor` authenticator mode, resting: the full 13-size matrix
  (`tests/visual/constants.ts`, desktop, tablet and mobile sizes) in the three desktop engines;
- the challenge in recovery-code mode and with a wrong-code error: a desktop and mobile pair;
- `/settings` with the 2FA section off, resting: the full matrix;
- `/settings` setup (deterministic mock secret and QR), codes, on, disable confirmation and
  re-authentication: desktop and mobile pairs;
- `/sign-in` with the expired notice, and a protected page with the low-codes notice: desktop and
  mobile pairs;
- the mobile visual lane (`tests/visual/mobile/`, Pixel 7 and iPhone 14, device-scaled): the
  challenge and the settings off state.

No existing baseline changes: the shared error red and the home settings link are #330's
intended changes, and the `/sign-in` resting baselines are unchanged (GraphQL sign-in changes
nothing visible). The existing `/settings` baselines change only where they render the section
once the test stack enables the flag (epics Story 4.1), re-recorded from the CI artifact.

### NFR-16 — Reliability

Every operation runs under the request deadline (`REACT_APP_REQUEST_TIMEOUT_MS`, default 10 000
ms, through the `DeadlineFetchAdapter`) and forwards the caller's abort signal; leaving a page or
changing a card state mid-request aborts it; a timeout is the transient failure with a
user-initiated Retry; there is no transport retry. Both pages carry the composer's error element
and chunk-retry loader; the challenge's public-route reload-once recovery is accepted because the
page then redirects to `/sign-in` (FR-12). The offline notice and disabled submit come from the
shared form. Telemetry failures never block a flow.

### NFR-17 — Localization parity

`make lint-i18n` passes: identical `uk` and `en` key sets, no empty string, complete plural
families, no duplicate key across catalogs, the merged `src/i18n/localization.json` regenerated by
`make i18n-generate` and committed.

### NFR-18 — Observability

Sign-in and challenge failures reach the observability boundary only through
`AuthSecuritySignals` (FR-38), and every GraphQL error through the existing Apollo error link,
both scrubbed by FR-39; the settings section emits no signal of its own;
GraphQL requests keep `X-Request-Id` and `X-Correlation-Id`; capture is a no-op with an empty
`REACT_APP_SENTRY_DSN`; no direct `@sentry/react` call is added.

### NFR-19 — Test conventions

Arbitrary e-mails, passwords, tokens, session ids, secrets and codes come from seeded Faker builders
under `tests/builders/` (new builders for TOTP codes, recovery codes, pending session ids, base32
secrets and otpauth URIs); fixed values only where the value is the test case. Elements are located
by role, label or text. No skipped, focused or assertion-free test, no `expect` in a conditional,
no `waitForTimeout`. The console gate passes; tests that exercise a logging path spy and assert it
per test. Static tables (message constants, reason maps, style objects) are loaded inside the test
body so their mutants are reachable.

### NFR-20 — Documentation and ADR drift

`make lint-docs`, `make lint-adr`, markdownlint and the ADR drift gate pass; every documented
command exists; FR-41 to FR-45 land in the same pull request as the code they describe.

### NFR-21 — Typed boundaries (TB-1, TB-2)

Added 2026-10-08 at the user's request: all data that passes between layers (classes, hooks,
components) is strictly typed; plain arrays and anonymous objects are forbidden, only named and
typed classes and interfaces cross. The canonical rule, shared verbatim with the #315 and #330
bundles:

> **TB-1 Typed boundaries.** Every value that crosses a layer boundary is an instance of a
> **named type**: an exported `interface` declared in a type-only file (`types/` folder or
> `types.ts`, issue #88), a class, or a named alias declared in a type-only file whose whole
> body is a union of named types or literals, a callback type, or one generic or derived type
> whose arguments are named types (`type RecoveryRetry = () => Promise<void>`,
> `type LoadFailureReporter = Pick<…>`, `type AuthFailureCategory = Extract<…>`). A layer
> boundary is any of these positions:
>
> 1. the props of a `[component]` or `[component]<route>`;
> 2. the parameters and result of an exported React hook;
> 3. the constructor parameters, the parameters and return type (including a `Promise`'s
>    resolved type) of every non-private method, and every non-private property of a class in
>    the Data provider, Transformer, Repository, State, Guard, Factory or helper roles (the layer
>    map of the planning contract §2);
> 4. every value registered in or resolved from the DI container;
> 5. published state: reactive-var state, outlet context, router navigation state, toast and
>    notice payloads;
> 6. events and telemetry payloads (security signals, observability);
> 7. every member of an interface in a type-only file;
> 8. the return value of a test builder in `tests/builders/`.
>
> At those positions the following are **forbidden**:
>
> - **(a) Anonymous objects.** Inline object type literals `{ … }`, including object members of
>   a union (`{ kind: 'sent' } | { kind: 'failed' }`): each variant is a named interface
>   (`RecoverySentOutcome`, `RecoveryFailedOutcome`) and the union is a named alias of them. An
>   object shape is always declared with `interface`, never `type X = { … }`.
> - **(b) Tuples** `[A, B]`.
> - **(c) Bare arrays.**
>   - `T[]`, `readonly T[]`, `Array<T>` and `ReadonlyArray<T>` are forbidden as a parameter, a
>     return type, a class property, a hook result, an alias body or a nested array.
>   - A collection crosses only as a **named collection interface**, whose array property's
>     element type is itself a named interface or class:
>     `interface RecoveryCodeSet { readonly items: readonly RecoveryCode[] }` with
>     `interface RecoveryCode { readonly value: string }`.
>   - Arrays of primitives or literals (`readonly string[]`) are forbidden everywhere at a
>     boundary.
> - **(d) Catch-all payloads.** `any`, `object`, `Record<…>` and index signatures
>   (`[key: string]: …`). `unknown` is allowed in exactly two places:
>   - the parameter (never the return) of a method whose role is to narrow a caught error (a
>     `*Transformer`, `*Guard` or `*Detector`);
>   - the `error` / `cause` property of an error type.
> - **(e) Inline derived types.** `Omit`, `Pick`, `Partial` and `Required` written at the
>   boundary. Name the derivation once in a type-only file
>   (`export type ToastDraft = Omit<ToastItem, 'id'>;`) and use the name.
>
> **Allowed.**
>
> - Single scalar values (`string`, `number`, `boolean`, a named literal-union alias).
> - Named third-party types (`ReactNode` for `children`, `AbortSignal`, `TFunction`, `SxProps`,
>   `ApolloClient`, `RefObject<UserEntity>`).
> - Generics whose arguments are named types (`Promise<RecoveryOutcome>`).
> - Callback types whose parameters and results obey this rule.
> - `T | null` and `T | undefined`, written inline, where `T` is itself allowed here
>   (`RecoveryFailure | null`, `string | undefined`).
>
> **Exceptions.** No others:
>
> - **(i) Generated contract types.** Generated GraphQL/OpenAPI codegen types
>   (`src/api/generated/**`) are named, but they stay below the Data provider. They may appear
>   only in `repositories/`, `transformers/`, `*-mutation.ts` / `*-query.ts` contract modules,
>   `response-schemas.ts`, and as `import type` inside `data-providers/` bodies. They never
>   appear in a Provider's public signature, a hook, a component or State, including as the
>   argument of a generic type (`Promise<RequestPasswordResetMutation>`).
> - **(ii) Module augmentation and declaration files.** `declare module` blocks and `.d.ts`
>   files.
> - **(iii) Private members and function-local values.** These are not boundaries.
>
> **No suppression.** Satisfy TB-1 by declaring the named type, never with `eslint-disable`, a
> cast, a scope narrowing or an allowlist entry.

Note: position 5's "reactive-var state" reads as Zustand store state once chore
`zustand-client-state` lands; the frozen text is unchanged.

TB-2, added the same day, sits beside TB-1 and leaves its text unchanged (planning contract §4):

> **TB-2 Board types at component boundaries** (the user, 2026-10-08; it sits beside TB-1 and
> does not change it). A board type crosses component and form boundaries as itself (e.g.
> `UIForm<SignInDto>`); form values may only `extends` a DTO to add UI-only fields; the
> `*Dto`/`*Entity` names are reserved for board types, the `[type]` cards of the Miro "User
> module" frame, plus `CreateNewPasswordDto`, whose card is proposed to the board.
>
> Enforcement is deliberately light. #315 Story 0.7 adds one naming check,
> `tests/unit/tooling/domain-type-names.test.ts`, which fails when an interface or alias named
> `*Dto` or `*Entity` is declared outside `src/modules/*/types/user/`, with a must-fail case on an
> in-memory fixture. The other two clauses are review-enforced; no ESLint selector is added.

For this feature that means, among others: recovery codes cross as a named collection of named
recovery codes, never as a list of strings; every outcome union (sign-in, challenge, settings,
upstream failure) is a union of named interfaces; the 2FA code a person submits is one plain DTO,
`TwoFactorDto` (the board's `2FADTO`), and the 2FA settings state is one plain entity,
`TwoFactorSettingsEntity` (the board's `2FADTOSettingsEntity`), both declared in #315's shared
User folder with only the fields user-service expects or returns, beside #315's `SignInDto` and
`UserEntity`; hook parameters and results, outlet context, navigation state and security-signal
payloads are named interfaces. The gate is built and owned by the prerequisite chore #332
(`typed-boundaries-gate`, draft PR #333), which lands before #315; the shared User folder and the
TB-2 naming check are #315 Epic 0 (Stories 0.1–0.2). TB-2's frozen text above names the naming
check's story by its former id, #315 Story 0.7; it is now Story 0.2. This feature adds no
selector and no allowlist entry. The shared shapes are #315's and are used exactly: one
`UserServiceFailure` interface whose reason union this feature only appends to, `FieldViolation`
with a `path` and a `reason`, the chore's `AuthStatePatch` and named `AuthResult` variants, and
`ArrivalNotice`, to which this feature appends its two notices.

- Given every file the feature adds or changes under `src/`, when `make lint-eslint` runs with
  the chore's typed-boundary gate and `@typescript-eslint/consistent-type-definitions`, then it
  reports zero findings and no `eslint-disable`, cast or allowlist entry was added.
- Given the generated GraphQL types, when a reviewer reads their importers, then they appear only
  in repositories, transformers, `-mutation.ts` seams, `response-schemas.ts` and as `import type`
  in Data-provider bodies (TB-1 exception (i), a review item).
- Given the architecture's type inventory, when a reviewer compares it with the merged type-only
  files, then every boundary type is a named interface or a named union of named types or
  literals, and every collection's element type is a named interface (the review-gate half the
  syntactic gate cannot see).
- Given the test builders the feature adds, when their signatures are read, then each returns a
  named type or a scalar.
- Given the sign-in, challenge, confirm and disable forms, when their types are read, then each
  is a `UIForm` of the board DTO itself (`SignInDto` or `TwoFactorDto`), and no form-values type
  repeats a DTO's fields.
- Given the 2FA settings section, when its props are read, then it receives the
  `TwoFactorSettingsEntity` as a member, not copied fields of it.
- Given #315's TB-2 naming check, when it runs over the feature's files, then no interface or
  alias named `*Dto` or `*Entity` is declared outside the shared User folder.

### NFR-22 — Miro layer conformance

The frontend follows the layers of the Miro board "Frontend C4 Architecture VilnaCRM"
(`uXjVMG64hTs=`): a root page component or route → a React hook → a Data provider ⇄ a
Transformer → a GraphQL Repository → the API, with State (the Zustand store `useAuthStore` here,
Redux on the board) reached from the page and the hook, and `[type]` DTO and Entity named types
on every edge. There
is no frontend Controller, Service or Handler layer: on the board "Controller" appears only in a
backend Structurizr sample and "service" only as backend containers. Sign-in follows the same
stack as settings: one GraphQL Data provider calls a transport-only GraphQL Repository and the
Transformers. The sign-in hook (password step) and the challenge hook (code step) each reach that
Data provider through the container-free provider loader of #315 and write the State themselves,
which is how the board's Sign-In → State edge ("2 save JWT token") is realised; no actions class
sits between a hook and the provider. Only the sign-in path leaves the existing `AuthStoreActions`;
its registration and logout are unchanged. There is no REST data path.

- Given the architecture, when its Miro conformance section is read, then every class and
  component of the feature maps to a board element or edge, and every gap is listed with its
  reason.
- Given every class the feature adds, when the class-naming gate runs (with `Controller` removed
  and `Transformer` added by the chore #332), then it passes and no new class ends in
  `Controller`, `Service` or `Handler`.
- Given a component of the feature, when dependency-cruiser runs, then it imports no Data
  provider, Transformer or Repository directly; hooks reach a Data provider through
  `useService` below the code split, or through #315's container-free provider loader on the
  auth paint path.
- Given the sign-in and challenge path, when its classes are read, then the GraphQL sign-in
  Repository calls no Transformer, the sign-in Data provider calls the Repository and the
  Transformers, and neither the sign-in hook nor the challenge hook calls a Repository or a
  Transformer.

## 7. Traceability

### Miro elements

| Miro element (board `uXjVMG64hTs=`)                                     | Requirements       |
| ----------------------------------------------------------------------- | ------------------ |
| `2FA [component]<route>` → `2FADTO [type]`                              | FR-10, FR-12-FR-23 |
| `SignIn [component]<route>` → `SignInDTO`                               | FR-8-FR-11         |
| `UserProfile [component]<route>` → `UserEntity` (#315's, shared)        | FR-25              |
| `2FASettings [component]` → `2FADTOSettingsEntity`                      | FR-26-FR-36        |
| Component box `3458764570351803366` ("Give … 2FA")                      | goals 1-4          |
| Edge "1 request to API" (2FA → API)                                     | FR-24, FR-27-FR-33 |
| Sign-In → State "2 save JWT token"                                      | FR-9, FR-18        |
| Sign-In → BFF "1 get cookie and token by credential"                    | not built (§11)    |
| Every `[component]` → `[type]` edge (named types, TB-2)                 | NFR-21             |
| L3 stack: route → hook → Data provider ⇄ Transformer → Repository → API | NFR-22             |

### Figma frames

| Figma frame                                       | Requirements           |
| ------------------------------------------------- | ---------------------- |
| Challenge `72:4846` / `72:4882` / `72:4918`       | FR-14-FR-17            |
| "2FA item" set `72:5171`                          | FR-15, NFR-6, NFR-7    |
| Settings setup `313:10242` / `10480` / `10606`    | FR-27, FR-28           |
| QR `315:11289`, key chip `315:11309`              | FR-28                  |
| Connected `315:11502` / `315:12300` / `318:13133` | FR-31                  |
| E-mail variant and resend row (tablet, mobile)    | not built (D1, §11)    |
| No frame (confirm, codes, disable, regenerate)    | FR-29, FR-30, FR-32-34 |
| No frame (recovery mode, errors, notices)         | FR-17, FR-19-22, FR-37 |

### Upstream operations

| Operation (user-service `main` `a95c1e85`) | Requirements              |
| ------------------------------------------ | ------------------------- |
| `signInUser`                               | FR-1, FR-3, FR-4, FR-8-11 |
| `completeTwoFactorUser`                    | FR-16-FR-22, FR-37        |
| `setupTwoFactorUser`                       | FR-27, FR-28, FR-34       |
| `confirmTwoFactorUser`                     | FR-29, FR-30, FR-34       |
| `disableTwoFactorUser`                     | FR-32, FR-34              |
| `regenerateRecoveryCodesUser`              | FR-30, FR-33, FR-34       |
| `scalar Iterable`                          | FR-1, FR-3                |
| Bearer on `ROLE_USER` mutations            | FR-24                     |
| `429` transport answer, `423` lockout      | FR-4, FR-11, FR-21, FR-35 |

### Brief goals and measures

| Brief goal or measure                             | Requirements                     |
| ------------------------------------------------- | -------------------------------- |
| Goal 1: end-to-end flows in the test stack        | FR-1, FR-3-FR-6, FR-8-FR-37      |
| Goal 2: GraphQL sign-in, section by configuration | FR-6, FR-7, FR-8, FR-42          |
| Goal 3: nothing leaks                             | FR-10, FR-36, FR-39, NFR-1-NFR-4 |
| Goal 4: WCAG 2.1 AA and every floor               | NFR-5-NFR-15                     |
| No REST login remains                             | FR-8                             |
| Every branch tested (msw and route stubs)         | FR-4, FR-5                       |
| Zero `cache.write` of secrets                     | NFR-2                            |
| Zero new `A11Y_EXCEPTIONS`                        | NFR-5                            |
| Eager growth under 1 kB gzip (one key and entry)  | NFR-11                           |
| Route-coverage rows for the challenge key         | FR-45                            |

## 8. External dependencies

| Dependency                                 | Owner        | Blocking status                 |
| ------------------------------------------ | ------------ | ------------------------------- |
| Release tag with sign-in and 2FA (#513)    | user-service | production enablement only      |
| Working release pipeline (#458)            | user-service | production enablement only      |
| CORS allows the correlation headers (#514) | user-service | production enablement only      |
| `UiPinInput` focus ring and border gaps    | ui-toolkit   | not blocking (seam overrides)   |
| TB-1 gate (typed-boundaries-gate)          | crm #332     | prerequisite; lands first       |
| Zustand client state (`useAuthStore`)      | crm, #334    | prerequisite; lands first       |
| User domain, loader, error transformer     | crm #315     | prerequisite; lands before #330 |
| Settings page, Bearer link, notice, red    | crm #330     | prerequisite; lands before this |
| 2FA status query, machine-readable codes   | user-service | not blocking (workarounds)      |
| Confirm appends codes, `decryptSecret` bug | user-service | not blocking                    |
| GraphQL limiter gaps (#469 and follow-on)  | user-service | not blocking (accepted risk)    |
| OAuth password grant bypasses 2FA (#472)   | user-service | not blocking (crm does not use) |
| Frames and copy for undrawn states         | design owner | not blocking (composition used) |
| Figma MCP for `figma-design-check`         | tooling      | gate reports BLOCKED if down    |

Implementation waits for none of the upstream items; it waits only for the four crm
prerequisites, which land in the order chore #332 and chore `zustand-client-state` → #315 → #330
→ #331 (planning contract §3.4). The
pending extension (FR-1) supplies the contract; Follow-up 5.1 deletes it by its file list when the
pins move. Upstream issues are filed or commented on when
the crm GitHub issue is created, after duplicate checks (#513 for the release, #469 for limiters).

user-service already allows the `Authorization` request header in CORS
(`config/packages/nelmio_cors.yaml:6` at `a95c1e85`), but not `X-Request-Id` or
`X-Correlation-Id`, which crm sends on every request; user-service#514 tracks that, and until it
ships any cross-origin deployment fails its preflight. The same-origin test stack never exercises
a preflight, so the first real environment confirms both before enablement.

## 9. Mock drift

Every place where the local Apollo mock, the msw handlers or the Playwright stubs differ from real
user-service. Each item is recorded in the contracts README drift section (FR-41) and in ADR-020,
and is re-checked by the pin-bump follow-up against a real environment before production
enablement.

- **MD-1 — Schema source.** The pending file is user-service `main` at `a95c1e85`; a release may
  differ. Recorded in the pending file header; detected by `make contract-diff` on the pin bump.
- **MD-2 — Error codes.** Mock errors add `extensions.code`; real errors carry only
  `extensions.status` and `category`, and real domain exceptions carry no `extensions` at all. The
  client never reads `code` (FR-4 test) and classifies a status-less error by its message (§1).
- **MD-3 — Error messages.** The completion, confirm and disable `401` messages are mirrored
  exactly; real wording may change in a release. Constants live in one transformer (§1).
- **MD-4 — `429` shape.** Real: HTTP `429` problem+json with `Retry-After`. The local mock has no
  `429`; the msw handlers and the Playwright stubs answer HTTP `429` with `Retry-After`. The
  client reads the status and never the body, so the body cannot reach it.
- **MD-5 — HTTP status of GraphQL errors.** Real: reportedly 200, unverified; mock: Apollo Server's
  status. The shared error transformer reads a transport `401` as `unauthenticated` without
  reading its body, so an operation-specific `401` sent as a transport `401` would read as a
  session end; user-service sends its 2FA `401`s as GraphQL errors, and Follow-up 5.1 re-checks
  that against the released server (FR-34 accepted risk).
- **MD-6 — TOTP.** Real: SHA-1, current and previous window, replay-protected; mock: fixed codes.
- **MD-7 — Secret and URI.** Real: random per setup; mock: fixed (keeps QR baselines stable).
- **MD-8 — Recovery codes.** Real: random, hashed, single use; mock: a fixed list, never consumed
  (the mock is stateless).
- **MD-9 — Pending session.** Real: 300 s TTL, five attempts; mock: none, any pending id passes.
- **MD-10 — Rate limits and lockout.** Real: counters per IP, e-mail and user; mock: none (msw and
  the route stubs inject `423` and `429`).
- **MD-11 — Sudo window.** Real: session age under 300 s; mock: none (the stubs inject the `403`).
- **MD-12 — Other sessions.** Real confirm revokes other sessions; not modelled.
- **MD-13 — Bearer validation.** Real: JWT validated, cookie also accepted; mock: header presence.
- **MD-14 — Enumeration timing.** Real dummy-hash timing not modelled; message uniform in both.
- **MD-15 — Tokens.** Real JWTs with lifetimes; mock opaque strings; `rememberMe` not sent.
- **MD-16 — `warning`, `id`, `_id`.** Never selected, so differences cannot reach the client.
- **MD-17, MD-18 — Dropped (2026-10-08).** The mock holds no state, and no REST login remains.
- **MD-19 — Third mock.** The msw handlers in integration tests share every drift class above.
- **MD-20 — CORS.** Same-origin in the test stack; upstream allows `Authorization` but not the
  correlation headers until user-service#514 ships (§8).
- **MD-24, MD-25 — Dropped (2026-10-08).** The mock reads no token, as #330's does; every
  401/403 branch comes from msw and `page.route`.

## 10. Assumptions

Consolidated from the predecessors and this stage:

1. Wrong codes on confirm and disable use the completion message (§1).
2. Withdrawn (2026-10-08): no REST login remains to cover (FR-8).
3. No live announcement on a mode switch; focus carries it (FR-17).
4. Arriving on `/sign-in` discards a pending challenge (FR-23).
5. Withdrawn (2026-10-08): the home link is #330's (FR-25).
6. Regeneration asks for one confirmation (FR-33).
7. No settings security signal and no success events (FR-38).
8. No value pattern for recovery or six-digit codes in the scrubber (FR-39).
9. One new non-text grey `#80878A`; the error-text red `#C62828` is #330's (NFR-6).
10. Unknown `401` on completion means an expired session (research §3.5). On a settings mutation
    an unclaimed `401` and "Access Denied." are a session end (FR-34, accepted risk).
11. Recovery codes are accepted in any case and with or without the hyphen (brief §11).
12. Leaving before acknowledging recovery codes is allowed (brief §11).
13. Disable asks for a code only (brief §11).
14. The confirm step warns that other sessions end (brief §11).
15. The challenge states its five-minute window in text; WCAG 2.2.1's essential exception covers
    the server's security limit, and expiry loses nothing but the password re-entry (FR-14).
16. Cross-origin deployment waits for user-service#514 (correlation headers in CORS); the
    `Authorization` header is already allowed (§8).

## 11. Out of scope and follow-ups

Follow-ups (epics carry them as `### Follow-up N.M:` items, never as stories):

1. **Production enablement and pin bump** — move both contract pins to a user-service release
   carrying sign-in and 2FA, delete the 2FA pending file by its list, re-check §9 and the FR-34
   accepted risk, verify CORS, then enable `twoFactorAuth` per environment, and delete the flag
   once production has run the section. Blocked on user-service #513, #458 and #514.
2. **Refresh token and "remember me"** — store and renew the refresh token; wire the checkbox into
   the form and send `rememberMe` (D3').
3. **Social OAuth sign-in with 2FA** — the provider buttons stay as they are.
4. **Designer follow-up** — frames for recovery-code mode, the confirm step, the codes view,
   disable and regenerate confirmations, errors, busy and disabled states, both notices; the copy
   fixes; adoption of the NFR-6 colours as tokens.
5. **Sign-out through `signOutUser`** — server-side session revocation, including for "Увійти
   знову", which signs out locally only.
6. **crm issue candidate** — the shared text field border `#D0D4D8` (1.49:1) and placeholder
   `#969B9D` (2.81:1). (The "every REST login error renders unknown" defect leaves with the REST
   login, FR-8.)
7. **user-service issues** — 2FA status on a user query; machine-readable error codes and a
   localizable `warning`; confirm appending codes when already enabled; the `decryptSecret`
   plaintext fallback; GraphQL limiters for setup, confirm and disable (comment on #469 if
   covered); a release tag (comment on #513).
8. **ui-toolkit issue** — `UiPinInput` `:focus-visible` paints `outline: none`; cell border
   `#E1E7EA`; the hard-coded `placeholder="0"` with no prop to drop it; fixed `4rem` cells with
   `flexShrink: 0` that overflow a narrow container.

Out of scope with no follow-up: e-mail or SMS codes, the resend countdown, the Miro BFF/cookie
edge, the other settings sections, a settings menu in the app shell, adding the new routes to the
Lighthouse URL list.

## 12. Open questions

For the design owner (none blocking): accept the composed states and the NFR-6 colours; confirm
the translated copy; confirm the 8 / 4 px cell gaps. The mobile card keeps the sign-in card's
6 px section padding, which equals the Figma margin, so the side spacing raises no question.

For the product owner: confirm the brief's outcome hypotheses (brief §4) and the regenerate
confirmation (FR-33).

For user-service: the wrong-code message on confirm and disable (§1); the correlation headers in
CORS (#514); the release date for #513.
