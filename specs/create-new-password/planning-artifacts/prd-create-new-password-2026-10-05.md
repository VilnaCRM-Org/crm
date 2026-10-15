---
status: complete
workflowType: prd
project_name: crm
date: 2026-10-05
revised: 2026-10-15
feature: create-new-password
issue: https://github.com/VilnaCRM-Org/crm/issues/315
author: 'pm (John), autonomous run'
inputDocuments:
  - specs/create-new-password/planning-artifacts/run-summary-create-new-password-2026-10-05.md
  - specs/create-new-password/planning-artifacts/research-create-new-password-2026-10-05.md
  - specs/create-new-password/planning-artifacts/brief-create-new-password-2026-10-05.md
  - specs/sign-up-sign-in-pages/planning-artifacts/prd-sign-up-sign-in-pages-2026-06-25.md
  - .claude/react-sdlc.yml
  - CLAUDE.md
  - config/performance-budget.json
  - lighthouse/constants.js
  - lighthouse/lighthouserc.desktop.js
  - lighthouse/lighthouserc.mobile.js
  - src/routes/route-paths.ts
  - src/routes/types/navigation-state.ts
  - src/modules/user/features/auth/routes/index.ts
  - src/modules/user/features/auth/components/form-section/validations/email.ts
  - src/modules/user/features/auth/components/form-section/validations/password.ts
  - src/modules/user/features/auth/i18n/uk.json
  - src/hooks/use-page-title.ts
  - src/services/types/security-events/security-event.ts
  - src/services/observability/pii-scrubber.ts
  - src/services/observability/apollo-link-factory.ts
  - src/modules/user/features/auth/repositories/registration-api.ts
  - src/modules/user/features/auth/repositories/create-user.graphql
  - src/api/contracts/README.md
  - codegen.ts
  - scripts/check-contract-versions.sh
  - config/docs-policy.json
  - tests/e2e/utils/create-user-response.ts
  - public/index.html
  - .env.example
  - docker-compose.test.yml
  - docs/feature-flags.md
  - docs/accessibility/acceptance-standard.md
  - tests/e2e/route-coverage.tsv
  - tests/e2e/a11y/routes.a11y.spec.ts
  - tests/e2e/a11y/sign-in-keyboard.a11y.spec.ts
  - tests/visual/constants.ts
  - .jscpd.json
  - jest.config.ts
  - stryker.config.mjs
  - 'crm-worktrees/_planning-shared/miro-layer-contract.md (2026-10-08)'
  - 'crm-worktrees/_planning-shared/ddd-domain-check-2026-10-08.md'
  - 'Miro board uXjVMG64hTs= (Frontend C4 Architecture VilnaCRM), captured 2026-10-08'
---

# PRD: password recovery for the user module (create new password)

**Author:** BMad (Product Manager) **Date:** 2026-10-05 **Feature:** `create-new-password`

Predecessors: [run summary](./run-summary-create-new-password-2026-10-05.md) (task framing,
Miro, Figma and contract evidence), [research](./research-create-new-password-2026-10-05.md)
(current state, contract analysis, design gaps, gate constraints) and
[brief](./brief-create-new-password-2026-10-05.md) (vision, scope, metrics, risks). Every
repository figure below is taken from those documents or re-read from the file it names.
Decisions the brief left open were fixed by the main agent before this stage and are recorded in
§3; decisions this stage had to make on its own are marked `> Assumption:` inline. This PRD is
implementation-ready but not code-level: class, file and token names belong to the architecture
stage.

> Revision 2026-10-08 (the user's request): "all data that transferred between layers (classes)
> should be strictly typed … only named and typed classes/interfaces … check that your
> architecture strictly follows the Miro board architecture." Two NFRs are added: NFR-17, the
> typed-boundary rule TB-1 in its canonical wording, and NFR-18, alignment with the board's layer
> stack, which has no frontend Controller or Service. FR-9 and NFR-12 now name the board's Data
> provider where they said "the data-access layer". No FR changes its behaviour.
>
> Domain 2026-10-08 (the user): the board's User domain — `UserEntity` plus the DTOs — is plain
> data the frontend carries and displays; business rules live in user-service. The request
> step's DTO takes the board's name `RestorePasswordDto` (the board's `RestorePasswordDTO` is the
> forgotten-password request), and TB-2 joins TB-1 in NFR-17. No FR changes its behaviour.
>
> Simplification 2026-10-08
> (`crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md`): FR-25, the
> planner-invented `password_reset` security signal, is withdrawn; the TB-1 gate moves to the
> prerequisite chore `typed-boundaries-gate`; only the test stack enables the flag (no dev-server
> transform); the mock is a stateless happy path. Superseded 2026-10-13: issue #309 removed the
> `forgotPassword` flag before this feature was built, so no stack enables a flag and the link
> renders unconditionally (§1, FR-1).
>
> Zustand 2026-10-08 (the user: "change the react state var to zustand"): client and UI state
> moves to Zustand stores (`useAuthStore`, `useConnectivityStore`) in a second prerequisite
> chore, `zustand-client-state` (#334), which supersedes ADR-008 and lands before this
> feature. No FR changes its behaviour; this feature publishes no store state.

## 1. Overview

A VilnaCRM user who forgot the password gets a self-service way back in. The flow has two
screens, matching the two components on the Miro User/Auth diagram:

- **Reset Password** (`/password-recovery`): the user enters an e-mail and is told, in every
  case, to check the inbox.
- **Create new password** (`/password-reset`): the user opens the e-mailed link, sets and
  confirms a new password, and is sent to `/sign-in` with a one-time success notice.

Both screens are public, lazily loaded auth pages that reuse the sign-in chrome, card, fields and
submit button. They talk to user-service over GraphQL only — the `requestPasswordResetUser` and
`confirmPasswordResetUser` mutations, through the Apollo client the DI container already builds
for registration — never retry a request on their own, never reveal whether an address is
registered, and keep the reset token out of the address bar, the history, the Apollo cache and
telemetry. The sign-in link that opens the flow already renders unconditionally: issue #309
removed the `forgotPassword` runtime flag, so the link ships in every environment and registering
the two routes is what makes it lead somewhere. No flag gates the flow, so `make start-prod` and
every browser lane exercise it, and production depends on its user-service serving both
mutations (epics "Implementation drift").

The feature is built and working now, against mocked GraphQL, without waiting for that release.
The two mutations exist only on user-service `main` (PR #215, commit `63041e4a`, 2026-01-11);
the newest tag, v2.8.0, which the contract pin follows, has neither. A pending schema extension
copied verbatim from user-service `main` supplies them to codegen and to the local Apollo mock
until the pin moves; the pin bump that brings the real mutations deletes it.

### Screen and state inventory

| Route                | State        | Heading (uk)          | Primary action           |
| -------------------- | ------------ | --------------------- | ------------------------ |
| `/password-recovery` | request      | Забули пароль?        | Підтвердити              |
| `/password-recovery` | sent         | Перевірте пошту       | До входу (`/sign-in`)    |
| `/password-reset`    | form         | Створіть новий пароль | Підтвердити              |
| `/password-reset`    | invalid link | Посилання недійсне    | Запросити нове посилання |
| `/sign-in`           | notice       | Аутентифікація        | (existing sign-in form)  |

### Backend outcomes the user can see

Both operations are GraphQL mutations answered on the GraphQL endpoint. User-service reports an
outcome in one of four shapes: a resolved mutation (`data`, no `errors`); an input violation (a
GraphQL error whose message reads `<property>: <reason>`, the form the user-service suite
asserts, with `extensions.status` `422`); a domain refusal (a GraphQL error with only a translated
`message`: user-service's `DomainExceptionNormalizer` emits no `extensions`); or an HTTP-level
answer with no GraphQL body (`429` from the rate-limit listener, `5xx`, no response at all, or
the client deadline).

| Answer                        | Request step               | Confirm step                |
| ----------------------------- | -------------------------- | --------------------------- |
| Mutation resolved             | sent step, any address     | `/sign-in` + success notice |
| Violation on the input field  | field error on e-mail      | field error on new password |
| Domain refusal (message only) | banner: per-address limit  | invalid-link state          |
| HTTP `429` or status `429`    | banner for 5 s, form stays | banner for 5 s, form stays  |
| No response, deadline, `5xx`  | banner for 5 s, form stays | banner for 5 s, form stays  |

> Assumption: GraphQL is the only transport (the user's decision of 2026-10-05, overriding the
> research's REST recommendation). It matches the repository's own rule — when both transports
> expose a resource, GraphQL carries the write (`src/api/contracts/README.md`, "The transport
> decision rule") — and the two mutations belong to the `User` resource of the schema.
>
> Assumption: mocked GraphQL until user-service releases (the user's decision of 2026-10-05,
> "We will mock it to work in the front end as the user service is not released"). The pending
> extension mirrors the upstream declarations exactly — names, nullability, `clientMutationId` —
> so the later switch to the released schema changes nothing on the client. REST stays out of
> scope; the mock is the local Apollo server, not a REST stand-in.
>
> Assumption: a domain refusal is classified by the operation, because user-service's GraphQL
> error carries no code. On the request step the only domain error user-service raises is the
> per-address rate limit (`PasswordResetRateLimitExceededException`, thrown before the handler
> looks the address up); on the confirm step every domain error is a token rejection (not found,
> expired, already used, mismatched) or a vanished user, all of which mean the link is dead.
> A machine-readable code is requested from user-service (§10). An input violation is recognised
> by `extensions.status` `422` — API Platform's GraphQL validation normalizer, which user-service
> does not replace — or, should `extensions` be absent, by the `<property>:` prefix of the
> message, which names an input property and is never translated.

## 2. Goals and non-goals

### Goals

1. A locked-out user can walk the whole flow from the sign-in page today in every local stack
   against the mocked mutations, and recovers access end to end in production once
   user-service ships the reset mutations in a deployed release tag with the link-host fix.
2. The flow leaks nothing: no account enumeration, no token in the URL, history, title, DOM or
   telemetry.
3. Both screens meet every floor the repository enforces: 100% coverage and mutation score,
   zero clones, zero lint and type errors, WCAG 2.1 AA with axe in three engines, the keyboard
   and mobile-touch contracts, the visual matrix and the Lighthouse and bundle budgets.
4. The client never accepts a password the API rejects: one policy, never weaker than the API,
   governs the new-password field and sign-up.
5. The "Забули пароль?" link opens the flow in every environment with no runtime flag: issue
   #309 removed the `forgotPassword` flag and the link renders unconditionally, so registering
   both routes is the release, and production depends on its user-service serving the mutations.

### Non-goals

- The authenticated change-password form under User settings (Figma `313:10242`).
- The mobile resend row with countdown (Figma `72:5638`).
- Automatic sign-in after a successful reset; the API issues no session.
- REST transport for either operation (replaced by GraphQL, §3).
- Adding the new routes to the Lighthouse URL list.
- The user-service contract pin bump itself, and the deletion of the pending schema extension it
  forces: a follow-up that waits for a user-service release tag (epics Follow-up 5.3, §8). The
  feature is built against the extension and does not wait for it.
- Any runtime flag for the flow: issue #309 removed `forgotPassword` before this feature, and
  production readiness is the deployment of a user-service serving both mutations (epics
  Follow-up 5.6), not code.
- Any interplay with two-factor authentication.

## 3. Decisions carried into this PRD

Fixed by the main agent on the brief's open questions; the architecture and epics stages treat
them as settled:

| Topic                   | Decision                                                             |
| ----------------------- | -------------------------------------------------------------------- |
| Transport (2026-10-05)  | GraphQL only, for both operations; the user's decision               |
| Mocked GraphQL (10-05)  | Built now on a pending schema extension and the local Apollo mock    |
| Contract pin bump       | Follow-up once user-service tags a release; it deletes the extension |
| Flag per environment    | None: issue #309 removed `forgotPassword`; the link is unconditional |
| Shared password policy  | In scope. One policy, never weaker than the API, for both forms      |
| Completion-rate metric  | Backend-observed hypothesis, not a gate; gates are the NFRs below    |
| Second reset request    | Backend issues a new token; earlier tokens may stay valid for 1 h    |
| Upstream issues         | Filed by us at GitHub-issue time; the release tag is requested too   |
| New-password form frame | Composition accepted as design of record for v1 pending a frame      |
| "Назад" targets         | request → `/sign-in`; sent → request form; new password → `/sign-in` |

The copy must therefore never promise that a new request invalidates an earlier link.

## 4. User journeys per breakpoint

Figma file `xZ7ccrH6d4QyqLQsayFSEX`, page `Design CRM` (`0:1`), section "Восстановление пароля".
The chrome on every breakpoint is the existing auth page: the `‹ На головну сторінку` top bar,
the centred white card, the footer. Tokens: `Font/100 #1A1C1E`, `Font/200 #404142`, placeholder
`#969B9D`, stroke `#D0D4D8`, `Primary #1EAEFF`; type H4 Golos DemiBold 30, body Golos 16/26,
"15 medium" Golos Medium 15/18, button Golos DemiBold 18.

### Desktop 1440

1. On `/sign-in` (card `15:793`) the user activates "Забули пароль?" and lands on
   `/password-recovery` (`72:5596`): card 502 × 360 at y 148; inside it `‹ Назад`, the H4
   "Забули пароль?", the body line, the labelled e-mail input (422 × 91 with label, placeholder
   `vilnaCRM@gmail.com`) and the 422 × 62 primary pill "Підтвердити".
2. The user submits and the card becomes the sent step (`360:11925`, 502 × 312): `‹ Назад`,
   H4 "Перевірте пошту", the body with the masked address, the primary pill "До входу".
3. From the e-mail the user opens `/password-reset?token=…` and sees the new-password form in
   the same 502-wide card: `‹ Назад`, H4 "Створіть новий пароль", body, two labelled password
   fields with show/hide toggles, the policy rule list under the first field, "Підтвердити".
4. On success the user lands on `/sign-in` with the success notice announced above the form.

### Tablet 1024

Same content and order as desktop; the Figma card is 636 wide at x 194 (`72:5617` request,
`360:11937` sent) and the new-password form follows the same reading. Fields and the button
stretch to the card's inner width.

> Assumption: the card width in code is authoritative. `formWrapper` in
> `src/components/skeletons/base/auth-form-shared-styles.ts` sets `maxWidth: '39.5rem'` (632 px)
> from the `md` breakpoint, which the recorded `/sign-in` and `/sign-up` tablet baselines already
> carry; the 4 px gap to the Figma reading is inherited, not new, and the recovery pages reuse the
> same `formWrapper` rather than introducing a 636 px variant. Only the CI visual gate could
> overrule this, and it compares against baselines rendered from the code value.

### Mobile 375

Request `72:5638` and sent `360:11949`: card 363 wide at x 6, button 314 × 50, `footer mobile`.
The request frame draws a sent-state body and a resend countdown that no other breakpoint has;
v1 renders the desktop/tablet reading (heading, body, e-mail field, button) and the countdown is
out of scope. The journey is otherwise the desktop one, completed by touch: tap the sign-in link,
tap the field, submit, switch to the mail app, tap the link, tap through the two password fields
and the toggles, submit, arrive on `/sign-in`.

### The e-mailed link

The link user-service builds is `<host>/password-reset?token=<urlencoded>`. The path matches the
route added here; the host is the API origin until the upstream fix lands (§8). The token is read
once, stored in memory and removed from the address bar before the form paints.

## 5. Functional requirements

Requirement ids are stable; the architecture and epics stages reference them. Each requirement
carries its acceptance criteria as Given/When/Then scenarios.

### FR-1 — Entry link

The "Забули пароль?" link on the sign-in options row (`href="/password-recovery"`,
`user-options/index.tsx`) renders unconditionally in every environment. Issue #309 removed the
`forgotPassword` runtime flag before this feature, so no flag, default, compose override or
runtime-config contract case gates the link, and this feature adds none: registering
`ROUTE_PATHS.passwordRecovery` and `ROUTE_PATHS.passwordReset` in the auth route contract is what
makes the link lead to the flow. Production readiness is therefore not a configuration step of
this repository but the deployment of a user-service release serving both mutations (epics
Follow-up 5.6). The user module README's password-recovery decisions record the absent flag.

- Given any stack (dev server, `make start-prod`, production) with no `APP_CONFIG_FLAG_*` variable set, when `/sign-in` renders, then the options row contains a link named "Забули пароль?" with `href="/password-recovery"`.
- Given the auth route contract, when the router and the route-coverage gate read it, then `ROUTE_PATHS.passwordRecovery` and `ROUTE_PATHS.passwordReset` are registered, so following the link and opening either route directly both render the recovery pages.
- Given the runtime configuration, when it is read, then the `FeatureFlag` union has no `forgotPassword` member and the committed block in `public/index.html` carries no `forgotPassword` key, as issue #309 left them.
- Given `docs/feature-flags.md` and `src/modules/user/README.md`, when the change lands, then no flag row is added for the flow, the README's "No feature flag" decision records why, and `make lint-docs` passes.

### FR-2 — Two public, lazily loaded routes in the auth contract

`ROUTE_PATHS.passwordRecovery` (`/password-recovery`, already declared) and a new
`ROUTE_PATHS.passwordReset` (`/password-reset`) are registered as `guard: 'public'` routes of
the auth feature's module-owned route contract, each with a named lazy chunk and a `titleKey`.
No registry, composer or app-shell edit is made; the composer supplies the per-route error
element and the public-route chunk-recovery policy as it does for `/sign-in`.

- Given the route table, when `/password-recovery` is opened, then the request form renders
  inside the auth page chrome behind the route-level lazy chunk with the skeleton fallback.
- Given the route table, when `/password-reset` is opened, then the reset page renders the
  same way; neither page is statically imported anywhere.
- Given the registry, when the change lands, then `src/routes/registry.ts` and
  `src/routes/routes.tsx` are unchanged and only the auth route contract grew.
- Given an unknown path, when it is opened, then the existing catch-all still renders.

### FR-3 — Document title per route

Each route sets a distinct `document.title` from its `titleKey` through the existing page-title
hook (`<title> - VilnaCRM`), re-applied on language change, and never includes the token, the
e-mail or any form value.

- Given `/password-recovery`, when it renders, then `document.title` is
  "Забули пароль? - VilnaCRM" (uk) and the English equivalent after a language change.
- Given `/password-reset` with or without a token, when it renders, then `document.title` is
  "Створіть новий пароль - VilnaCRM" and does not contain the token.
- Given the sent and invalid-link states, when they render, then the title of their route is
  unchanged (the state is in the card, not in the title).

### FR-4 — Signed-in users may use both routes

Both routes are public and never redirect a user who holds a session token. Completing a reset
leaves the client session state untouched: no sign-out, no sign-in.

> Assumption: allowed rather than redirected. `/sign-in` and `/sign-up` are public and do not
> redirect a signed-in user on mount, so a redirect here would be a new rule; the session token
> is memory-only, so a link opened from a mail client always lands in a tab without a session
> and a redirect could only ever fire for a user who typed the URL into a signed-in tab, where it
> would discard the token they just followed; the browser suites run against the test-harness
> image with a seeded session token, so a redirect would make both routes unreachable to the
> e2e, visual and a11y lanes; and a user may be signed in on one device while locked out on
> another. Server-side session invalidation on password change is a user-service concern (§10).

- Given a seeded session token, when `/password-recovery` or `/password-reset?token=x` is
  opened, then the page renders and no navigation to `/` occurs.
- Given a session token in memory, when the confirm step succeeds, then the token is unchanged
  and the user is navigated to `/sign-in` exactly as an unauthenticated user would be.

### FR-5 — Request form content and chrome

`/password-recovery` renders, inside the existing auth page chrome and card: the "Назад" control
(chevron icon hidden from assistive technology, accessible name from the visible text), one real
`h1` "Забули пароль?" styled as the H4, the body "Введіть адресу поштової скриньки вашого
акаунту", one labelled e-mail text field with `autocomplete="email"` and the existing
`vilnaCRM@gmail.com` placeholder, and the primary submit "Підтвердити". No OAuth provider row
and no sign-up/sign-in switcher are rendered.

- Given `/password-recovery`, when it renders, then exactly one `h1` exists and its text is the
  heading, the field is reachable by its label, and the submit is a `button[type="submit"]`
  named "Підтвердити".
- Given the page, when queried for the provider buttons or the switcher link, then none exist.
- Given the 1440, 1024 and 375 viewports, when the page renders, then the card's maximum width
  is the existing `formWrapper` value for that breakpoint — 502 / 632 / 363 px (`31.375rem` /
  `39.5rem` / `22.6875rem`), the same card as `/sign-in` — and the button stretches to the
  card's inner width; the 632 px tablet card is the code value, authoritative over the 636 px
  Figma reading (§4).

### FR-6 — E-mail validation on the request form

The field reuses the existing e-mail rules: required, basic shape (`@` and `.`), full format.
Validation runs on submit and re-runs on change once the field has an error; the error text is
tied to the field (`aria-invalid`, `aria-describedby`) and no request is sent while the field is
invalid.

- Given an empty field, when the user submits, then the required message shows, focus moves to
  the field, and no request is sent.
- Given `user@domain`, when the user submits, then the basic-format message shows and no
  request is sent.
- Given `user@domain.com` with surrounding spaces, when the user submits, then the trimmed
  value is sent.

### FR-7 — Submit, busy state and single in-flight request

Submitting a valid e-mail sends one `requestPasswordResetUser` mutation (operation
`RequestPasswordReset`) to the GraphQL endpoint through the container's Apollo client, with
variables `{ input: { email, clientMutationId } }`; the document selects only
`clientMutationId`. While the request is in flight the form is busy: the submit button shows
the shared loading state and is disabled, the form carries `aria-busy="true"`, and the polite
status region announces "Надсилання…". A second submit while busy sends nothing.

- Given a valid e-mail, when the user submits, then exactly one `POST` to the GraphQL endpoint
  with operation name `RequestPasswordReset` and `variables.input.email` equal to the value is
  observed, and its query selects no `user` field.
- Given the request is in flight, when the user activates submit again or presses Enter, then
  no second request is sent and the busy state persists until the response settles.
- Given the response settles, when the form updates, then `aria-busy` is `"false"` and the
  status region is empty.

### FR-8 — Offline behaviour on both forms

Both forms inherit the shared offline behaviour: while the browser is offline the submit is
disabled and the always-mounted offline notice shows its offline text; after reconnection it
shows the restored text for five seconds, then nothing.

- Given the browser goes offline on either form, when the user tries to submit, then the submit
  is disabled, the notice reads the offline text, and no request is sent.
- Given the browser reconnects, when the notice updates, then the restored text shows and the
  submit is enabled again.

### FR-9 — Uniform sent step for every address

Every resolved request mutation produces the same outcome, whatever address was submitted: the card
replaces the form with the sent step — "Назад", the `h1` "Перевірте пошту", the body "Ми надіслали
листа на адресу {{masked}}. Перевірте пошту та дотримуйтесь інструкцій у листі." and the primary "До
входу". Uniformity rests on three facts. User-service answers known and unknown addresses alike (its
resolver returns no user, its handler takes one constant-time path). The operation document selects
only `clientMutationId`, never `user`, so nothing that could identify an account is requested. The
Data provider (the board's `[Data provider]`, NFR-18) maps every resolved request — a payload
object, a payload with `user: null`, or a `null` payload — to one sent outcome, so no component
or hook can branch on the answer. Focus moves to the new heading and the body is a polite
`role="status"` region, so the outcome is announced once.

- Given the mutation resolves, when the response settles, then the sent step renders.
- Given the same address answered once with `{ clientMutationId }` and once with a `null`
  payload, when each response settles, then the sent step renders with the same DOM, text and
  announcement (the e2e test asserts the two renders are equal).
- Given the request document, when its selection set is read, then it is exactly
  `clientMutationId` (must-fail: a `user` selection fails the test).
- Given the sent step, when it mounts, then the `h1` is `document.activeElement` and the status
  region contains the masked address.

### FR-10 — Masked e-mail rule

The sent step shows the submitted address masked by one deterministic rule that hides the local
part's length and keeps the domain readable:

```text
local@domain  →  prefix + "*****" + "@" + domain
prefix = first 3 characters of local when local has 6 or more characters,
         otherwise the first character
"*****" is always exactly five asterisks
eirene@gmail.com → eir*****@gmail.com     jo@x.io → j*****@x.io
abcdef@d.com     → abc*****@d.com         abcde@d.com → a*****@d.com
```

The input is the trimmed value as submitted, case preserved, split at the last `@`. A value
without `@` cannot reach the sent step through the validated form; the rule still maps it to
`*****` so it is total.

> Assumption: the desktop and tablet frames show `eir*****@gmail.com` (leading prefix) while the
> mobile frame shows `f*****dj@gmail.com` (prefix and suffix); one rule is needed, the
> desktop/tablet one is chosen because it reveals less, and the design owner is asked to confirm
> (§10).

- Given each example above, when the address is masked, then the output equals the shown value.
- Given a local part of 1–5 characters, when masked, then only its first character is visible.

### FR-11 — Navigation on the request route

"Назад" on the request form is a link to `/sign-in`. On the sent step "Назад" is a button that
returns to the request form with the submitted e-mail still in the field (the resend path under
the API's 3/h quota) and "До входу" is a link to `/sign-in`. Every control is at least 24 CSS px
tall and keyboard-operable. Links are real anchors with an `href`, but a plain activation is a
client-side router navigation that carries `{ focusMain: true }` in navigation state — no
document load, so the memory-only session token survives and `/sign-in` moves focus to `main`
on arrival; a modifier or middle click still follows the `href` natively (new tab or window).

- Given the request form, when "Назад" is activated, then the URL is `/sign-in`.
- Given the sent step, when "Назад" is activated, then the request form renders in place, the
  e-mail field holds the previously submitted value, focus is on the heading, and no request is
  sent.
- Given the sent step, when "До входу" is activated, then the URL is `/sign-in`, no document
  load happened, and `main` has focus on arrival.
- Given a seeded session token, when "Назад" (link mode) or "До входу" is activated, then the
  user is still authenticated afterwards (opening `/` renders the protected page, not a
  redirect to `/sign-in`).
- Given any of the three controls, when measured, then its hit area is ≥ 24 × 24 CSS px.

### FR-12 — Rate limit on either step

A rate limit on either step — an HTTP `429` from user-service's rate-limit listener, a GraphQL
error with `extensions.status` `429`, or on the request step the per-address domain refusal —
shows a non-field error banner "Забагато запитів. Спробуйте пізніше."
(focused, `role="alert"`) for five seconds; when it hides while focused, focus moves to the
submit. It keeps the form and its values, and never re-sends
automatically. The submit stays enabled so the user can try again later by choice.

- Given an HTTP `429` or a message-only GraphQL error on the request step, when the response
  settles, then the banner shows, the form and e-mail remain, `aria-busy` is `"false"`, and
  exactly one request was sent.
- Given an HTTP `429` on the confirm step, when the response settles, then the banner shows,
  both password fields keep their values, and exactly one request was sent.
- Given the per-IP and per-endpoint GraphQL limiters user-service does not yet apply (upstream
  #462, #469, #470), when they are enforced, then they answer HTTP `429` and this requirement
  covers them with no client change.

### FR-13 — Validation responses as field errors

Input violations map to the field the user can fix:

| Step    | Property      | Field        | Message (uk)                                           |
| ------- | ------------- | ------------ | ------------------------------------------------------ |
| request | `email`       | e-mail       | Перевірте адресу електронної пошти та спробуйте ще раз |
| confirm | `newPassword` | new password | Пароль не відповідає вимогам. Перевірте правила нижче  |

A violation on `token` is an invalid link, not a field error (FR-22): the client never sends an
unusable token (FR-17), so user-service's `NotBlank` and 255-character rules on `token` can only
fire on a link that is dead anyway. The field gets `aria-invalid="true"` and `aria-describedby`
pointing at the message; focus moves to the field.

- Given a violation on `email`, when the response settles, then the e-mail field shows the
  message, is focused, and the form stays.
- Given a violation on `newPassword`, when the response settles, then the new-password field
  shows the message, is focused, both values remain, and the rule list stays visible.

### FR-14 — Transient failures with user-initiated retry

A failure with no response (the fetch rejects), a deadline timeout, an HTTP `5xx`, a GraphQL error
with an `extensions.status` of `500` or more, or any unclassified failure on either step shows the
error message "Не вдалося надіслати запит. Перевірте з'єднання та спробуйте ще раз." under
the subtitle for five seconds, with no action of its own: Figma draws no error state, and the
owner chose on 2026-10-15 to drop the separate "Спробувати ще раз" button. The form keeps its
values and the submit stays enabled, so the user retries with the form's own submit, which sends
the values the fields show. Nothing is re-sent without the user's action. When the message hides
while it holds focus, focus moves to the submit.

- Given the request is aborted by the network, when the error settles, then the message shows
  and one request was sent.
- Given an HTTP `503`, when the error settles, then the message shows and exactly one request was
  sent (no transport retry).
- Given the message, when five seconds pass, then it is removed and focus is on the submit.
- Given the message, when the submit is activated, then exactly one more request with the
  current field values is sent and the busy state applies as on a first submit.
- Given the deadline (`REACT_APP_REQUEST_TIMEOUT_MS`, default 10 000 ms) elapses, when the
  error settles, then it is presented as this transient failure.

### FR-15 — No transport retry, deadline and abort

Neither mutation is retried by the transport: the Apollo link chain (correlation, error capture,
`HttpLink` over the deadline-bounded fetch) has no retry link, because a reset request sends mail
and consumes the per-address 3/h quota and a confirmation consumes a single-use token. Both run
under the request deadline (the `DeadlineFetchAdapter` Apollo's `HttpLink` fetches through) and the
caller's abort signal (`context.fetchOptions.signal`); leaving the page or changing step mid-request
aborts the request, and an aborted attempt shows no error.

- Given an HTTP `503` then a resolved mutation from the API, when the user submits once, then
  the second answer is never requested (exactly one request per submit).
- Given a request in flight, when the user activates "Назад", then the request is aborted and no
  banner appears on the destination.

### FR-16 — Token intake and URL stripping

On `/password-reset` the `token` query parameter is read exactly once after the page chunk has
loaded, stored in memory for the lifetime of the page, and removed from the address bar by a
history replace of the bare pathname so the entry never re-exposes it. The token is never
written to the document title, the DOM, local or session storage, logs or telemetry.

- Given `/password-reset?token=abc123`, when the page settles, then `location.search` is empty,
  `location.pathname` is `/password-reset`, the form renders, and the page's HTML contains no
  `abc123`.
- Given the stripped URL, when the user presses Back, then the browser does not return to a URL
  carrying the token.
- Given the page chunk fails to load on the first attempt, when the public-route reload-once
  policy reloads the page, then the original URL with the token is requested again because the
  strip only happens after the token is in memory.
- Given a successful or failed confirm, when the address bar is inspected, then it still shows
  the bare pathname.

### FR-17 — Missing or malformed token

A visit without a usable token renders the invalid-link state without sending any request. A
token is usable when it is present, non-empty after trimming and at most 255 characters (the
API's limit); its characters are not validated because it is opaque.

- Given `/password-reset` with no `token`, an empty `token`, or a 256-character `token`, when
  the page settles, then the invalid-link state renders and no request is sent.
- Given a reload after the strip (the token is gone from memory), when the page settles, then
  the invalid-link state renders and the user is offered a new link.

### FR-18 — New-password form content

With a usable token the card shows: "Назад", one `h1` "Створіть новий пароль", the body
"Придумайте новий пароль для вашого акаунту", a labelled "Новий пароль" field and a labelled
"Підтвердьте пароль" field — both `type="password"` with `autocomplete="new-password"` and the
existing show/hide toggle (`aria-pressed`, Space-activatable, localized names) — the policy rule
list (FR-19) and the submit "Підтвердити". No e-mail field is shown; the token carries the
identity.

- Given the form, when it renders, then both fields are reachable by their labels, each toggle
  is a button named "Показати пароль" with `aria-pressed="false"`, and the submit is named
  "Підтвердити".
- Given a toggle is activated with Space, when the state updates, then the field's `type` is
  `text`, the name is "Приховати пароль" and `aria-pressed` is `"true"`; activating again
  restores `password`.

### FR-19 — Live policy rules on the new-password field

Under the new-password field the four policy rules of FR-24 are listed as helper content referenced
by the field's `aria-describedby`: "Від 8 до 64 символів", "Принаймні одна цифра", "Принаймні одна
велика латинська літера (A–Z)", "Принаймні одна мала літера". Each rule is marked met or unmet as
the user types, conveyed by an icon plus text (visible or visually hidden "виконано" / "не
виконано"), never by colour alone, and the list is not a live region. On submit with an unmet rule
`aria-invalid` is set and the list alone names the rule: the field shows no second copy of it. Only
what the list cannot show gets a field message: an empty field, and a line break.

- Given the field holds `Pa1`, when the list updates, then the length rule is unmet and the
  digit, uppercase and lowercase rules are met.
- Given the field holds `PASSWORD1`, when the list updates, then the lowercase rule is unmet.
- Given the field holds `Пароль123`, when the list updates, then the uppercase rule is unmet.
- Given an unmet rule, when the user submits, then the field is marked invalid without a message,
  the list still marks the rule unmet, focus moves to the field, and no request is sent.
- Given all rules met, when the user submits with a matching confirmation, then the request is
  sent.

### FR-20 — Confirm-password field and mismatch

The confirmation field is required and must equal the new password; it is validated on submit
and re-validated whenever either field changes after a first error.

- Given the confirmation is empty, when the user submits, then "Це поле обов'язкове" shows on
  the confirmation field and no request is sent.
- Given the two values differ, when the user submits, then "Паролі не збігаються" shows on the
  confirmation field, it receives focus, and no request is sent.
- Given a mismatch error is showing, when the user edits the new-password field so the values
  match, then the error clears without another submit.

### FR-21 — Successful confirm redirects to sign-in with a notice

Submitting a valid pair sends one `confirmPasswordResetUser` mutation (operation
`ConfirmPasswordReset`) with variables `{ input: { token, newPassword, clientMutationId } }`; the
document selects only `clientMutationId`. Both mutations run without a cache write, so neither the
token nor a password stays in the process-wide Apollo cache, whose mutation field keys embed the
arguments. A resolved mutation navigates to `/sign-in` (replace, so Back does not return to the
form) carrying a one-time notice in navigation state. `/sign-in` renders the notice "Пароль змінено.
Увійдіть з новим паролем." in a polite `role="status"` region inside the card above the form, moves
focus to `main` as the existing arrival behaviour does, and clears the marker from the history entry
so a reload or Back never shows it again. No session is created and no automatic sign-in happens.

- Given a valid pair, when the user submits, then exactly one `ConfirmPasswordReset` request
  whose `variables.input` holds the memory token and the new password is observed, and the busy
  state is shown with the status text "Збереження…".
- Given a resolved mutation, when the navigation settles, then the URL is `/sign-in`, the notice
  text is in a `role="status"` region, `main` has focus, and the sign-in form is operable.
- Given the notice is showing, when the page is reloaded or Back is pressed, then the notice is
  not shown again.
- Given a resolved mutation, when the client state is inspected, then no session token was
  set and the Apollo cache holds neither the token nor the new password.
- Given the resting `/sign-in` page (no navigation state), when it renders, then the notice region is absent and the resting `/sign-in` baselines stay unchanged (NFR-6).

### FR-22 — Invalid or expired link on confirm

A domain refusal on the confirm step — a GraphQL error carrying only a message, which
user-service raises for an unknown, expired, already used or mismatched token — or a violation
on `token` renders the invalid-link state: "Назад", the `h1`
"Посилання недійсне", the body "Посилання для відновлення пароля недійсне або його термін дії
минув. Запросіть нове посилання." and the primary link "Запросити нове посилання" to
`/password-recovery`. The token is discarded from memory. The copy does not say whether an
earlier link is still valid. Focus moves to the heading and the body is a polite status region.

- Given a message-only GraphQL error, when the response settles, then the state renders, the
  form is gone, and the primary link has `href="/password-recovery"`.
- Given a second message-only error with a different (translated) text, when the response
  settles, then the same state renders (same DOM and text): the client never reads the message.
- Given a violation on `token`, when the response settles, then the same state renders.
- Given the state, when "Запросити нове посилання" is activated, then `/password-recovery`
  renders its request form.

### FR-23 — Navigation on the reset route

"Назад" on the new-password form and on the invalid-link state is a link to `/sign-in`, and
"Запросити нове посилання" is a link to `/password-recovery`; both navigate client-side with
`{ focusMain: true }` exactly as FR-11 describes. Every control is at least 24 CSS px tall; the
chevron is decorative.

- Given the form, when "Назад" is activated, then the URL is `/sign-in` and any in-flight
  request is aborted.
- Given the invalid-link state, when Tab is pressed from the top, then the order is the
  back-to-main link, "Назад", "Запросити нове посилання", the footer links.
- Given a seeded session token, when "Назад" or "Запросити нове посилання" is activated, then no
  document load happens, `main` has focus after arrival, and the user is still authenticated.

### FR-24 — Shared password policy that never accepts what the API rejects

One password policy governs the new-password field and the sign-up password field. It accepts
nothing user-service's `Password` constraint on `confirmPasswordResetUserInput.newPassword` rejects
(`Length` 8–64, `Regex` `/[0-9]/`, `Regex` `/[A-Z]/`, the same rule as
`^(?=.*[0-9])(?=.*[A-Z]).{8,64}$`): 8 to 64 characters, at least one digit `[0-9]`, at least one
ASCII uppercase letter `[A-Z]`. The current client rule `\p{Lu}` (any Unicode uppercase) is narrowed
to `[A-Z]`, because it accepted passwords the API rejects with a `newPassword` violation. The
existing lowercase rule (`\p{Ll}`) is kept: it is stricter than the API, so it can never let an
invalid password through, and dropping it would loosen an existing sign-up rule outside this
feature's root-cause fix. The uppercase message in both locales names Latin letters. Sign-up's
resting visuals are unchanged.

> Assumption: the policy is "never weaker than the API", not "identical to the API". Keeping the
> lowercase rule changes no sign-up behaviour except the Cyrillic-uppercase rejection; whether to
> drop it so the client shows only server-enforced rules is a product-owner question (§10).

- Given `Пароль123`, when validated, then the uppercase rule fails on both forms.
- Given `Password1` and an 8-character `Abcdefg1`, when validated, then both pass.
- Given `password1`, `PASSWORD1`, `Passwordd`, a 7-character `Abcdef1` and a 65-character value,
  when validated, then each fails with the matching message.
- Given any value the policy accepts, when it is matched against
  `^(?=.*[0-9])(?=.*[A-Z]).{8,64}$`, then it matches (property test over generated strings and
  the fixed cases above).
- Given sign-up, when a password with no lowercase letter is submitted, then the existing
  lowercase error appears exactly as today.

### FR-25 — Withdrawn (2026-10-08)

The `password_reset` security signal was planner-invented: no gate requires it and user-service
owns the rate limits. The flow emits no security signal; ids are stable, so the number is not
reused.

### FR-26 — Token and PII scrubbing in telemetry

The reset token, the e-mail and both passwords never reach the observability boundary. On
GraphQL they travel in the request body as `variables.input.token`, `.newPassword` and `.email`,
never in a URL; the Apollo error link captures the GraphQL errors and the network error, which
carry no request variables, and the scrubber's existing key-based denial drops any key
containing `token`, `password` or `email` at every depth, so a captured `variables` object
cannot carry them. The scrubber also gains a string pattern that redacts `token=<value>`
fragments (up to the next `&`, `#` or whitespace), so the page URL captured before the strip
cannot leak the token. Neither mutation writes its arguments into the process-wide Apollo cache
(FR-21). No request to a third-party origin is added.

- Given a captured event whose `url` is `https://app/password-reset?token=abc&x=1`, when
  scrubbed, then the string reads `https://app/password-reset?token=[redacted]&x=1`.
- Given an event with keys `token`, `newPassword` and `email`, when scrubbed, then none of the
  three keys remains.
- Given an event carrying `{ variables: { input: { token, newPassword, email } } }` at any
  depth, when scrubbed, then none of the three values remains.
- Given the production build, when the network is observed on both routes, then only the
  document origin and the configured API origins are contacted.

### FR-27 — Localized copy in uk and en

Every recovery-page string (the `password_recovery`, `password_reset` and `password_policy`
keys) exists in both locales of the lazy recovery catalog
`@auth/routes/recovery-catalog/i18n/{en,uk}.json` with identical key sets; the catalog is
registered when a recovery route module evaluates and is kept out of the merged
`src/i18n/localization.json` by `config/i18n-catalog-policy.json`. Strings a page outside the
recovery routes renders (the sign-in notice, the shared uppercase rule message) stay in both
locales of the eager auth catalog under the auth feature's i18n folder. The merged catalog is
regenerated without the lazy keys; no English or Russian literal is shipped in source. The Russian Figma copy is replaced and "аккаунту" is spelled "акаунту". Reused keys:
the e-mail label and placeholder, the password show/hide names, the required-field message,
`auth.error.tryAgain`, `buttons.back_to_main`. New strings (key names are suggestions):

- request title and `h1`: uk "Забули пароль?" — en "Forgot your password?"
- request body: uk "Введіть адресу поштової скриньки вашого акаунту" — en "Enter the e-mail
  address of your account"
- submit (both forms): uk "Підтвердити" — en "Confirm"
- back control: uk "Назад" — en "Back"
- request submitting status: uk "Надсилання…" — en "Sending…"
- sent title: uk "Перевірте пошту" — en "Check your e-mail"
- sent body: uk "Ми надіслали листа на адресу {{email}}. Перевірте пошту та дотримуйтесь
  інструкцій у листі." — en "We sent an e-mail to {{email}}. Check your inbox and follow the
  instructions in the message."
- to sign-in: uk "До входу" — en "Go to sign-in"
- rate-limit banner: uk "Забагато запитів. Спробуйте пізніше." — en "Too many requests. Please
  try again later."
- transient banner: uk "Не вдалося надіслати запит. Перевірте з'єднання та спробуйте ще раз." —
  en "The request could not be sent. Check your connection and try again."
- e-mail rejected (`email` violation): uk "Перевірте адресу електронної пошти та спробуйте ще раз" —
  en "Check the e-mail address and try again"
- reset title and `h1`: uk "Створіть новий пароль" — en "Create a new password"
- reset body: uk "Придумайте новий пароль для вашого акаунту" — en "Choose a new password for
  your account"
- new password label: uk "Новий пароль" — en "New password"; placeholder: uk "Введіть новий
  пароль" — en "Enter a new password"
- confirm label: uk "Підтвердьте пароль" — en "Confirm password"; placeholder: uk "Повторіть
  новий пароль" — en "Repeat the new password"
- rules: uk "Від 8 до 64 символів" / "Принаймні одна цифра" / "Принаймні одна велика латинська
  літера (A–Z)" / "Принаймні одна мала літера" (key `password_policy.rules.lowercase`) — en
  "8 to 64 characters" / "At least one digit" / "At least one uppercase Latin letter (A–Z)" /
  "At least one lowercase letter"; states: uk "виконано" / "не виконано" — en "met" / "not met"
- mismatch: uk "Паролі не збігаються" — en "The passwords do not match"
- policy rejected (`newPassword` violation): uk "Пароль не відповідає вимогам. Перевірте
  правила нижче" — en "The
  password does not meet the requirements. Check the rules below"
- reset submitting status: uk "Збереження…" — en "Saving…"
- invalid-link title: uk "Посилання недійсне" — en "This link is no longer valid"
- invalid-link body: uk "Посилання для відновлення пароля недійсне або його термін дії минув.
  Запросіть нове посилання." — en "The password reset link is invalid or has expired. Request a
  new one."
- request a new link: uk "Запросити нове посилання" — en "Request a new link"
- sign-in notice: uk "Пароль змінено. Увійдіть з новим паролем." — en "Your password has been
  changed. Sign in with your new password."
- shared uppercase rule message (replaces the sign-up text): uk "Будь ласка, додайте принаймні
  одну велику латинську літеру (A–Z)" — en "Please add at least one uppercase Latin letter
  (A–Z)"

The sign-up lowercase message stays in both catalogs unchanged (FR-24).

- Given the two catalogs, when the parity gate runs, then the key sets are identical, every
  string is non-empty and every `t()` key resolves in both locales.
- Given `uk` as the main language, when either route renders, then no English fallback string
  is visible.

### FR-28 — Route-coverage manifest rows

The `passwordRecovery` allowlisted row is replaced by suite rows, and `passwordReset` gets its
own, each naming the spec that exercises the key: an e2e row (the form flow), a visual row (the
full-matrix snapshots), an axe row (the route scan), a keyboard row (the keyboard contract) and
a mobile row (the touch lane). The route scan list and the visual page list gain both routes.

- Given the manifest, when `make check-e2e-route-coverage` runs, then it passes with no
  allowlisted row for either key and every named spec exists under its suite root.
- Given the axe route-scan list, when it runs, then `/password-recovery` (ready on
  `form button[type="submit"]`) and `/password-reset` (ready on `main h1`) are scanned in all
  three desktop engines with zero violations outside the scoped allowlist.

## 6. Traceability

| Source | Element                                             | Requirements              |
| ------ | --------------------------------------------------- | ------------------------- |
| Miro   | CRM → Reset Password (entry link is off-board)      | FR-1, FR-2                |
| Miro   | Edge 1 "Restore password" (Reset Password → API)    | FR-6, FR-7, FR-9, FR-15   |
| Miro   | Edge 2 "request for sign-in" (Create new → API)     | FR-16, FR-19–FR-22        |
| Miro   | Edge 3 "redirect to sign-in" (Create new → Sign-In) | FR-21, FR-23              |
| Miro   | Create new password component `3458764570351803371` | FR-16–FR-24               |
| Miro   | L3 stacks: Interactive access control, Onboarding   | NFR-18                    |
| Miro   | Code-level `[component]` → `[type]` DTO and Entity  | NFR-17, NFR-18            |
| Figma  | Sign-in card `15:793` ("Забули пароль?")            | FR-1                      |
| Figma  | Forgot password `72:5596` / `72:5617` / `72:5638`   | FR-5, FR-6, FR-11         |
| Figma  | Check your email `360:11925` / `11937` / `11949`    | FR-9, FR-10, FR-11        |
| Figma  | No frame (composition of record)                    | FR-17–FR-20, FR-22, FR-23 |
| Figma  | Mobile resend row `72:5638`                         | out of scope (§11)        |
| API    | `requestPasswordResetUser` mutation                 | FR-7, FR-9, FR-12–FR-15   |
| API    | `confirmPasswordResetUser` mutation                 | FR-12–FR-15, FR-21, FR-22 |
| API    | `Password` constraint on `newPassword`              | FR-24                     |

## 7. Non-functional requirements

Every value below is read from the profile (`.claude/react-sdlc.yml`, `quality.*`) or the config
file the gate enforces, and is a raise-only floor or a zero ceiling: this feature changes none of
them (NFR-17 and NFR-18 add gates; none is relaxed), and no story may satisfy a gate by editing a
threshold, adding a suppression, narrowing a scope or re-baselining to force a pass. The only
deliberate, reviewed deviations are the intended `/sign-in` re-baseline of NFR-6 and the one scoped
a11y exception of NFR-9.

### NFR-1 — Coverage

Statements, branches, functions and lines at 100% (`jest.config.ts` `coverageThreshold`) in
both the unit and the integration suite over `src/**`. Every new source file is covered by a
direct test and every deleted file's tests are removed in the same change.

### NFR-2 — Mutation score

`stryker.config.mjs` `break: 100`: no surviving mutant on any new or changed file in the mutate
scope. Static tables (status maps, rule lists, style objects) are loaded inside the test body so
their mutants are reachable; equivalent mutants are removed by adopting the simpler program, or
annotated with a proof, never ignored.

### NFR-3 — Duplication

`.jscpd.json`: zero clones of 70+ tokens and 5+ lines over `src`. The two pages, their forms,
the two result states and the two submit flows share primitives (one shared submit hook, one
result view, one container-free provider loader) instead of copying the sign-in ones.

### NFR-4 — Lint, types and architecture

ESLint 0 errors and 0 warnings, `tsc` 0 errors under the strict flags, dependency-cruiser 0
violations, no `eslint-disable`, `@ts-ignore`, `depcruise-ignore` or inline suppression of any kind.
The feature keeps every convention the gates encode, including the typed-boundary gate (NFR-17) and
the board's layer vocabulary (NFR-18): classes only outside React components, no static members or
free functions, type-only files, approved class-name suffixes, collaborators through DI tokens, the
auth feature carved out of the component DI bridge and never reaching `@/providers/di`, module-shape
folders, no `data-testid`, no raw `Intl` calls, no route literal in `src/routes/**` without an error
element.

### NFR-5 — Code metrics

`make lint-metrics` passes with the hard-fail policy of `config/metrics-policy.json`: cyclomatic ≤
10, cognitive ≤ 15, ABC ≤ 17, arguments ≤ 3, exit points ≤ 3, function LLOC / PLOC / SLOC ≤ 10 / 40
/ 45, file LLOC / PLOC / SLOC ≤ 120 / 300 / 350, Halstead volume / bugs ≤ 1000 / 0.35 per function
and ≤ 8000 / 1.58 per file, Maintainability Index (Visual Studio) ≥ 20, class WMC / NPM / NPA / COA
/ CDA ≤ 30 / 8 / 2 / 0.60 / 0.25, interface NPM / NPA ≤ 10 / 15, and per file at most 10 functions,
6 closures and 15 in total.

### NFR-6 — Visual regression

Zero visual diffs. New baselines: the resting request form and the resting new-password form
(with a token) across the 13 screen sizes × 3 desktop engines; a desktop and mobile pair for the
sent step, the invalid-link state and `/sign-in` with the success notice; the two resting forms
in the mobile visual lane (Pixel 7 and iPhone 14, device-scaled). Existing baselines for
`/sign-up`, the skeleton and the notifications are unchanged. The `/sign-in` desktop and mobile
baselines (and any sign-in snapshot that renders the options row) do not change for FR-1: the
"Забули пароль?" link has rendered unconditionally since issue #309 removed the `forgotPassword`
flag, so the existing baselines already contain it.
Baselines are taken from CI artifacts, never from a local production container.

### NFR-7 — Lighthouse floors

`lighthouse/lighthouserc.desktop.js`: performance ≥ 0.95, accessibility ≥ 0.95, best practices
≥ 0.95, SEO ≥ 0.90. `lighthouse/lighthouserc.mobile.js`: performance ≥ 0.84 (median of three
runs), accessibility ≥ 0.90, best practices ≥ 0.90, SEO ≥ 0.90. The profile records
`lighthouse_desktop: 95` and `lighthouse_mobile: 85`; the CI assertion at 0.84 is the binding
gate and the one-point gap pre-dates this feature (§10). The audited URL list (`/`, `/sign-up`,
`/sign-in`) is unchanged and `/sign-in` must not lose a point.

### NFR-8 — Bundle and paint-path budgets

`config/performance-budget.json`: raw initial entrypoint ≤ 470 000 B and any asset ≤ 400 000 B
(Rspack hints, build fails); gzip initial entrypoint ≤ 165 000 B and any chunk ≤ 130 000 B
(bundle-size report); Lighthouse script transfer ≤ 265 000 B, total ≤ 480 000 B, script count
warn at 25. The eager entrypoint grows by nothing but the two route declarations in the auth
route contract and the one route key — under 1 kB gzip in the PR bundle-size report — and by
no new module: both pages are `webpackChunkName`-named lazy chunks, the repository, zod schemas,
tsyringe and Apollo stay off the static import graph from `src/index.tsx` (paint-path graph
test), and no `@mui/material` import lands on eager code (ADR-017). The baseline is `main` after
the prerequisite chore `zustand-client-state`, which brings `zustand` onto the paint path and
measures it; this feature adds no store.

### NFR-9 — Accessibility standard

WCAG 2.1 Level AA is binding (`docs/accessibility/acceptance-standard.md`): jest-axe over the new
components and pages in jsdom, `@axe-core/playwright` on both routes in chromium, firefox and
webkit, no positive `tabindex`, and at most one new entry in the scoped exception list
(`A11Y_EXCEPTIONS` in `tests/utils/a11y/axe-config.ts`): a `color-contrast` entry for the
primary-pill links of the recovery result views ("До входу", "Запросити нове посилання"), which are
white on the Figma primary `#1EAEFF` (2.45:1) — the same palette-token debt the existing
submit-button entry carries. It uses the same reason and `PALETTE_CONTRAST_ISSUE` tracking
(issue #276), a selector that matches only those links (never `*`, never rule-wide), and is deleted
when issue #276 closes; no other new entry is allowed. The WCAG 2.2 target-size ratchet applies
ahead of the standard: the in-card "Назад", "До входу" and "Запросити нове посилання" controls are ≥
24 CSS px tall, and the primary controls (text inputs, submit) meet the mobile lane's 44 px floor.
The in-card "Назад" text and its chevron render in `Font/200 #404142`, not the Figma `72:5605` style
(`Font/300 (Placeholder) #969B9D`, "15 (medium)" Golos Medium 15/18), because that grey is about
2.8:1 on white and fails WCAG 1.4.3; the size and weight of the Figma style are kept. This is a
reviewed accessibility override of the design token, recorded through `figma-design-check`
(accessibility may override the visual design) and raised with the design owner (§10). If any other
new text would render a token below 4.5:1, the implementing story stops and reports; it never adds a
second exception. Step changes move focus to the new heading; results are announced once through a
polite status region; errors through the focused alert banner; field errors keep `aria-invalid` and
`aria-describedby`; the rule list is not a live region; one real `h1` per page; colour is never the
only carrier of a state.

### NFR-10 — Keyboard contract

Both forms and both result states are completable with the keyboard only, asserted with the shared
tab-order helper in the a11y lane. Request form: back-to-main → "Назад" → e-mail → "Підтвердити" →
footer links. New-password form: back-to-main → "Назад" → new password → its toggle → confirmation →
its toggle → "Підтвердити" → footer links. Sent step: back-to-main → "Назад" → "До входу" → footer.
Every stop is `:focus-visible` with the existing 2 px dark ring, Space toggles the password
visibility, Enter submits, and a validation error moves focus to the first invalid field. In-card
links navigate inside the SPA (FR-11, FR-23), so arriving on `/sign-in` through them puts focus on
`main`. On `/sign-in`, the "Забули пароль?" link (FR-1), unconditional since issue #309, is a
stop in the `tests/e2e/a11y/sign-in-keyboard.a11y.spec.ts` order — after the "remember me"
checkbox and before the submit, its DOM position in the options row (`user-options/index.tsx`)
that `LoginFormFields` renders after the password field.

### NFR-11 — Mobile touch lane

In `tests/e2e/mobile/` on both device projects: the request flow and the reset flow are
completed with `tap()` only; the show/hide toggle responds to a tap; the text inputs and the
submit button are ≥ 44 CSS px tall; the pages have no horizontal overflow at 390 and 412 px;
the submit stays reachable at the keyboard-height layout viewport; an empty submit fires no
request. Pull-request runs use `retries: 0`, so every spec is deterministic.

### NFR-12 — Security

No enumeration: user-service answers the request mutation alike for every address, the request
document selects no `user` field, the Data provider maps every resolved request to one outcome,
and the client performs no extra branch or request for any answer. The token lives in memory only,
is stripped by a history replace before the form paints, is never placed in the title, DOM, storage,
the Apollo cache (both mutations skip the cache write), logs or Sentry context, and the scrubber
redacts `token=` strings and drops `token` and `password` keys. The static server in the deployable
image runs with `--no-request-logging`, so the link's query string never reaches the container log. The document tightens
`Referrer-Policy` to `strict-origin`, so no request made before the strip names the token, and
keeps `X-Frame-Options: DENY` and the CSP from `config/security-headers.json` unchanged; the pages add no third-party request. Fields carry
`autocomplete="email"` and `autocomplete="new-password"`. Neither mutation is retried by the
transport. The per-IP and per-endpoint GraphQL
limiters user-service does not yet apply (#462, #469, #470) are an accepted upstream dependency,
already filed upstream. The preloaded-auth seed gate and the security-header gate stay green.

### NFR-13 — Reliability

Both operations run under the request deadline (`REACT_APP_REQUEST_TIMEOUT_MS`, default 10 000
ms, applied to Apollo through the `DeadlineFetchAdapter` its `HttpLink` fetches with) and forward
the caller's abort signal; the Apollo link chain has no retry link; a timeout is
presented as a transient failure the user retries with the form's submit. Each route carries the composer's
error element, the page chunk is wrapped in the chunk-retry loader and, as a public route, the
reload-once policy; the offline notice and disabled submit come from the shared form. Telemetry
failures never block a user flow.

### NFR-14 — Localization parity

`make lint-i18n` passes: `uk` and `en` catalogs with identical key sets, no empty string, no
duplicate key across catalogs, the merged `src/i18n/localization.json` regenerated by
`make i18n-generate` and committed without the keys of the lazy recovery catalog
(`@auth/routes/recovery-catalog/i18n/`, listed in `config/i18n-catalog-policy.json`), every
`t()` key resolving in both locales, and every recovery-catalog key used only from a file the
policy names as one of that catalog's owners.

### NFR-15 — Test conventions

Arbitrary e-mails, passwords and tokens come from the seeded Faker builders — reset tokens from
`buildResetToken()` (32 alphanumeric characters, the user-service token length, within the
255-character limit of FR-17), never from the session-token `buildToken()`; fixed values are
used only where the value is the test case (the masking examples, the Cyrillic password, status
codes, i18n strings). Elements are located by role, label or text. No skipped, focused or
assertion-free test, no `expect` inside a conditional, no `waitForTimeout`. The console gate
passes: tests that exercise a logging path spy and assert it per test. Browser suites mock the
two mutations with `page.route('**/graphql', …)`, dispatching on the request's `operationName`
(the `tests/e2e/utils/create-user-response.ts` precedent), because a route is the only way to
inject GraphQL errors and HTTP statuses deterministically; integration tests use msw `graphql`
handlers on the configured GraphQL URL. The local Apollo mock answers both mutations statelessly
(the happy path and one violation each) for local development and is tested by the
apollo-server suite; no browser lane depends on it.

### NFR-16 — Documentation and ADR drift

> Revision 2026-10-13: no ADR-019. Every ADR from 003 up was deleted on PR #333 (user decision);
> this outline is written into the `## Password recovery decisions` section of
> `src/modules/user/README.md` instead, and `make check-adr-drift` passes through a `[no-adr]`
> line in the pull-request body. ADR numbers cited below no longer exist as files.

The `## Password recovery decisions` section of `src/modules/user/README.md` records the durable
decisions (GraphQL transport, classification of GraphQL errors in the data-access layer, uniform
outcome, token in memory with URL strip and no cache write, no transport retry, shared
API-mirroring policy, signed-in access allowed, the pending schema extension and its removal, no
runtime flag); no ADR is added. The change touches `.dependency-cruiser.js` (the two feature
folders), a path the drift gate treats as significant, while nothing under `src/config/**`
changes, so the pull-request body carries the `[no-adr]` line.
`docs/feature-flags.md`, `src/api/contracts/README.md` (the pending contract), the user module
README and the routes README are updated; `make lint-docs` and markdownlint report zero
findings. Commit headers stay ≤ 100 characters with the issue scope; the repository is
squash-merge only and the auto-close reference rides the commit message.

### NFR-17 — Typed boundaries (TB-1)

Every value that crosses a layer boundary is a named type. The rule is the user's (2026-10-08)
and is shared verbatim with the #330 and #331 bundles; the prerequisite chore
`typed-boundaries-gate` ships its enforcement before all three:

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

The frozen TB-2 text names the naming check's story by its former id; it is now epics Story 0.2.
The frozen TB-1 text says "reactive-var state" in position 5; since the prerequisite chore
`zustand-client-state` it means Zustand store state (`AuthState` in `useAuthStore`).

Violations the 2026-10-05 plan contained, and their named replacements (architecture §5.17):
`PasswordValidator.evaluate` returning a bare array → `PasswordRuleResultSet`; outcome unions of
inline objects → `RecoverySentOutcome`, `RecoveryConfirmedOutcome`, `RecoveryFailedOutcome`; DTOs
derived inline from generated inputs → the `RestorePasswordDto` and `CreateNewPasswordDto`
interfaces. `ResetPasswordFormValues`, identical to the request DTO, is gone, and
`CreateNewPasswordFormValues` `extends CreateNewPasswordDto` with only `confirmPassword`.

- Given the chore's TB-1 gate, when `make lint-eslint` runs over this feature's code, then it
  reports zero TB-1 violations, and this feature adds, edits or relaxes no selector.
- Given this feature's new code, when reviewed against the architecture's type inventory, then
  every prop, hook parameter and result, Data provider, Transformer and Repository signature, DI
  value and navigation state is a named interface, class or named alias in a type-only file.
- Given both recovery forms, when read, then the request form is typed by `RestorePasswordDto`,
  the confirm form's values only `extends CreateNewPasswordDto` with `confirmPassword`, and each
  form hands its hook the DTO (TB-2).
- Given an interface or alias named `*Dto` or `*Entity` outside `src/modules/*/types/user/`,
  when the TB-2 naming check runs, then it fails.

### NFR-18 — Alignment with the Miro frontend C4 board

The design follows the board "Frontend C4 Architecture VilnaCRM" (`uXjVMG64hTs=`) layer for
layer: Root page component (`[component]<route>`) → React hook → `[Data provider]` ⇄
`[Transformer]` → GraphQL `[Repository]` → API `[Software System]`, with named `[type]` DTOs,
entities and outcomes on every edge, and the board's numbered edges "reset password 1 Restore
password", "2 request for sign-in" and "3 redirect to sign-in". The board has no frontend
Controller or Service: "Controller" appears only in its Structurizr "Internet Banking" sample
(server-side Spring MVC controllers) and "service" only as backend containers. Infrastructure the
board does not model (the container-free provider loader, validators, the telemetry scrubber)
sits inside the box it serves.

- Given the architecture, when its Miro conformance section is read, then every board element
  and numbered edge this feature touches maps to a named class, hook, component or type, and every
  design item without a board card is listed as a justified gap.
- Given the feature's new classes, when the class-naming gate runs, then none ends in
  `Controller`, `Service` or `Handler`, and `*Transformer` is an approved suffix (the chore).
- Given `config/module-shape.json`, when the module-shape and dependency-cruiser tests run, then
  `data-providers` and `transformers` are allowed feature folders and the DI-collaborator and
  component-injectable gates cover them.
- Given the architecture's C4 and sequence diagrams, when read, then every node and participant
  carries a board stereotype and every edge or message names the type it carries; no node is a
  Controller, Service or Handler.
- Given `src/modules/user/types/user/`, when read, then it holds `UserEntity`, `SignInDto`,
  `SignUpDto`, `RestorePasswordDto` and `CreateNewPasswordDto` as data-only interfaces (no
  class, behaviour or validation), and `LoginUserDto` and `RegisterUserDto` no longer exist.

## 8. Dependencies

| Dependency                                     | Owner        | Effect on delivery           |
| ---------------------------------------------- | ------------ | ---------------------------- |
| Chore #332, typed-boundaries gate (TB-1)       | crm          | prerequisite; lands first    |
| Chore `zustand-client-state` (#334)            | crm          | prerequisite; lands first    |
| Release tag with both reset mutations          | user-service | production enablement waits  |
| Pin bump to that tag, extension deleted (5.3)  | crm          | follow-up; does not block    |
| Production user-service serves the flow (5.6)  | operations   | waits for the deployed tag   |
| E-mail link built on the SPA origin (issue 1)  | user-service | end-to-end use blocked       |
| GraphQL limiters #462, #469, #470              | user-service | accepted risk, filed already |
| Machine-readable code on GraphQL domain errors | user-service | optional; classification     |
| Frame for the new-password form                | design owner | composition of record (§3)   |
| uk/en copy and "Назад" target confirmation     | design owner | open question, not blocking  |
| Figma design gate through the Figma MCP        | tooling      | gate reports BLOCKED if down |

Implementation does not wait for user-service. The pinned v2.8.0 schema has neither mutation,
and `scripts/check-contract-versions.sh` accepts only equal `vX.Y.Z` pins unless
`ALLOW_CONTRACT_VERSION_SKEW=1` is set, which this plan does not do; so instead of moving the pin,
the feature adds one pending schema extension, copied verbatim from user-service `main`, that
codegen and the local Apollo mock read beside the pinned SDL (epics Story 1.1); the pin bump
deletes it.

That pin bump is epics Follow-up 5.3. It waits for a user-service release tag carrying both
mutations, then moves both `.env.example` pins, the `Mockoon.Dockerfile` pin and
`OPENAPI_SPEC_SHA256`, deletes the extension and the wiring that exists only for it, runs
`make codegen`, `make codegen-check` and `make contract-diff` with a reviewed approval for every
upstream breaking change between v2.8.0 and the tag, and fixes the existing call sites those
changes reach. A working production reset (Follow-up 5.6) waits for that release to be
deployed behind the production SPA. We ask user-service for the tag and file the link-host issue
when the GitHub issue for this feature is created; the OpenAPI `enum` and pattern defects the
research found no longer affect crm, which generates no REST types for these operations.

## 9. Assumptions

Consolidated from the research, the brief and this stage:

1. Both operations use GraphQL through the container's Apollo client, the user's decision of
   2026-10-05, superseding the research's REST recommendation (research §3.3).
2. Neither mutation is retried by the transport; the user retries a transient failure with the
   form's submit (research §3.4, FR-14, FR-15).
3. Two route keys, `/password-recovery` (request + sent) and `/password-reset` (form +
   invalid link), the second matching the path user-service already builds (brief §4).
4. The feature lives in the auth feature folder as two routes of its contract; its hooks reach
   the Data provider through a container-free loader and never the DI bridge (research §8.1).
5. The success notice travels to `/sign-in` in navigation state and is consumed once (brief §4,
   FR-21).
6. The mobile resend countdown is out of scope; the sent step's "Назад" is the resend path
   (brief §6).
7. The new-password form is composed from the existing card and form primitives pending a
   frame (§3).
8. The masked-e-mail rule follows the desktop/tablet frame (FR-10).
9. Signed-in users may use both routes; no session change on success (FR-4).
10. The shared policy is never weaker than the API; sign-up keeps its lowercase rule (FR-24).
11. The e-mail field reuses the existing localized label and placeholder rather than the
    frame's literal "E-mail", keeping the field consistent with sign-in and sign-up.
12. A missing or malformed token and a rejected token share one invalid-link state and one
    copy; after a reload the user requests a new link (one of the 3/h quota) rather than being
    told to re-open the e-mail.
13. The rule list under the new-password field is not a live region; its state is readable on
    demand and the submit-time error is announced (FR-19).
14. The Lighthouse URL list is unchanged (research §8.10).
15. One container-free provider loader is added beside the existing deferred auth actions, which
    stay untouched; #331 reuses it (architecture §5.4).
16. A GraphQL domain refusal is classified by the operation (request: the per-address limit;
    confirm: a dead token), because user-service's GraphQL errors carry no machine code (§1).
17. The success payload of the request mutation is the same for every address: the upstream
    resolver returns `null`, which API Platform answers as `{ user: null, clientMutationId }`
    (the user-service Behat suite asserts `user` is `null`); the client also accepts a `null`
    payload and treats both alike.
18. Until user-service tags a release, both mutations come from a pending schema extension
    copied verbatim from user-service `main` (declarations unchanged since commit `63041e4a`) and
    are answered by the local Apollo mock; the client code is identical before and after the pin
    bump (the user's decision of 2026-10-05).
19. No runtime flag gates the flow: issue #309 removed `forgotPassword` and the sign-in link
    renders unconditionally; production works once its user-service serves both mutations.
20. The chore `typed-boundaries-gate` (#332) lands first with the TB-1 gate and the suffix
    policy, and the chore `zustand-client-state` (#334) lands first with the Zustand stores
    `useAuthStore` and `useConnectivityStore`; this feature lands next, in the order #315 → #330
    → #331, adds the two feature folders and the User domain, and owns the shared pieces the
    later two import (NFR-17, NFR-18).
21. The two pages take the board's component names (`ResetPassword`, `CreateNewPassword`); the
    route keys and URL paths keep theirs, because the sign-in link and the e-mailed link fix them.

## 10. Open questions

For user-service:

1. Does a second reset request invalidate earlier tokens? The copy assumes not and promises
   nothing; confirming would allow a clearer resend hint.
2. When the GraphQL limiters are fixed (#462, #469, #470), will they answer HTTP `429` from the
   listener, as REST does, and with `Retry-After`? The client handles `429` on both steps
   regardless.
3. Are active sessions invalidated server-side when a password is reset? The client does not
   sign the user out (FR-4).
4. When is a release tag carrying both reset mutations (and, ideally, the link-host fix)
   expected? No story waits for it; the pin bump that deletes the pending extension and a
   working production reset do (§8).
5. Can `DomainExceptionNormalizer` add a machine-readable code (for example the status that
   `exceptionToStatus` already assigns, or the translation key) to GraphQL errors, so the client
   stops inferring a token rejection or the per-address limit from the operation?
6. Does API Platform's GraphQL validation error keep `extensions.status` `422` in user-service,
   and is the `<property>: <reason>` message format stable?

For the design owner:

1. Is the composed new-password form accepted as the design of record, or will a frame be
   provided?
2. Confirm the uk/en copy in FR-27, the "акаунту" spelling, and the one-copy invalid-link
   state.
3. Confirm the masking rule of FR-10 against the mobile frame's prefix-and-suffix variant.
4. Confirm the "Назад" targets in §3 and whether the mobile resend countdown is wanted later.
5. Should the result views' "До входу" and "Запросити нове посилання" use a plain link style
   instead of the primary pill? Not blocking: until answered they ship as the pill under the one
   scoped exception of NFR-9.
6. Accept the in-card "Назад" in `Font/200 #404142` instead of the `72:5605` placeholder grey
   `#969B9D` (about 2.8:1 on white)? Not blocking: the accessibility override of NFR-9 ships
   until a token at or above 4.5:1 is chosen.

For the architecture owner (@kravalg):

1. Should the board gain the "Забули пароль?" edge from Sign-In to Reset Password and code-level
   `ResetPassword` / `CreateNewPassword` cards, which the design draws in the board's style but
   which the board does not show today? Not blocking.
2. Q-1, answered 2026-10-08 by the user: the board's `RestorePasswordDTO` is this flow's request
   (`RestorePasswordDto`), not the signed-in password change under `UserProfileSettings`.
3. Q-2: should the code frame gain `CreateNewPassword → CreateNewPasswordDTO` (and
   `ResetPassword → RestorePasswordDTO`)? Not blocking: `CreateNewPasswordDto` ships as a
   justified gap.

For the product owner:

1. Is the 60% request-to-confirm completion rate in month one the right hypothesis, and will
   user-service expose the counts?
2. Should both forms drop the lowercase rule the API does not enforce (FR-24 keeps it)?
3. Should the profile's `lighthouse_mobile: 85` and the CI assertion's 0.84 be reconciled in a
   separate change?

## 11. Out of scope

- The authenticated change-password form under User settings (Figma `313:10242`).
- The mobile resend row with countdown ("Надіслати код ще раз 00:34", Figma `72:5638`).
- REST transport for either operation (`POST /api/reset-password`,
  `POST /api/reset-password/confirm`), replaced by GraphQL (§3).
- Automatic sign-in after a successful reset, or any change to the client session.
- Two-factor authentication interplay with a reset; a 2FA-enabled account's reset rules are
  user-service's.
- Adding the new routes to the Lighthouse URL list.
- The contract pin bump as part of this feature's stories: it is epics Follow-up 5.3, which
  waits for a user-service release tag and deletes the pending schema extension.
- Any runtime flag for the flow: issue #309 removed `forgotPassword`; epics Follow-up 5.6 is the
  user-service deployment, not a configuration change of this repository.
- A password-strength meter beyond the four policy rules.
- The e-mail template, its wording and its sender.
