---
status: complete
workflowType: research
project_name: crm
date: 2026-10-06
feature: two-factor-authentication
issue: https://github.com/VilnaCRM-Org/crm/issues/331
author: BMad (Analyst)
inputDocuments:
  - 'orchestrator: decisions-2fa.md (binding user rules and feature decisions D1-D13)'
  - 'orchestrator: backend-2fa-report.md (user-service main a95c1e85 vs v2.8.0)'
  - 'orchestrator: figma-2fa-report.md (file xZ7ccrH6d4QyqLQsayFSEX)'
  - 'orchestrator: crm-current-state.md (crm 58099168 code map)'
  - 'miro: board uXjVMG64hTs=, widgets 3458764570351803366, 3458764570351764591,
    3458764570351863499'
  - 'user-service: .github/graphql-spec/spec at a95c1e85 (656 lines) and v2.8.0 (222 lines)'
  - 'ui-toolkit v0.6.0 build: index.d.mts:2012-2176, chunks/chunk-NRC7MWEQ.mjs'
  - .claude/react-sdlc.yml
  - .env.example
  - codegen.ts
  - eslint.config.mjs
  - .dependency-cruiser.js
  - config/module-shape.json
  - config/ui-toolkit-checksums.json
  - config/performance-budget.json
  - public/index.html
  - docker-compose.test.yml
  - docker/apollo-server/lib/resolvers.ts
  - docker/apollo-server/lib/format-error.ts
  - lighthouse/constants.js
  - lighthouse/lighthouserc.mobile.js
  - src/api/contracts/README.md
  - src/config/api-config.ts
  - src/config/runtime/types/feature-flag.ts
  - src/config/runtime/feature-flag-service.ts
  - src/config/runtime/app-config-schema.ts
  - src/modules/user/README.md
  - src/modules/user/config/tokens.ts
  - src/modules/user/features/auth/types/credentials.ts
  - src/modules/user/features/auth/repositories/login-api.ts
  - src/modules/user/features/auth/repositories/registration-api.ts
  - src/modules/user/features/auth/stores/auth-var.ts
  - src/modules/user/features/auth/stores/auth-store-actions.ts
  - src/modules/user/features/auth/components/form-section/auth-forms/use-login-submitter.ts
  - src/modules/user/features/auth/components/form-section/components/user-options/index.tsx
  - src/modules/user/features/auth/utils/login-redirect-target.ts
  - src/modules/user/features/auth/utils/auth-security-signals.ts
  - src/routes/route-paths.ts
  - src/routes/route-mapper.tsx
  - src/routes/types/app-route.ts
  - src/services/observability/apollo-link-factory.ts
  - src/services/observability/pii-scrubber.ts
  - src/services/types/security-events/security-event.ts
  - tests/integration/mocks/server.ts
  - tests/utils/a11y/axe-config.ts
  - tests/e2e/route-coverage.tsv
  - tests/unit/tooling/runtime-config-contract.test.ts
  - specs/create-new-password/planning-artifacts/research-create-new-password-2026-10-05.md
---

# Research: two-factor authentication in the `user` module

**Author:** BMad (Analyst) **Date:** 2026-10-06 **Feature:** `two-factor-authentication`

This is the first artifact of the bundle; the brief, PRD, architecture, epics and readiness
artifacts build on it. It records what the product boards ask for, what user-service really
implements, what the designs show and which repository facts and gates bind the work. Every
repository claim cites `path:line` as read in this worktree. Decisions this stage took on its own
are marked `> Assumption:`; decisions taken by the orchestrator (the user's surrogate) are cited
as D1-D13 and are binding.

> Simplification 2026-10-08 (`_planning-shared/over-engineering-review-2026-10-08.md`; the user:
> "we should use only repositories to access data but with graphql, not the REST, we use only
> graphql"). The findings below stand; these planning statements are superseded, and the PRD and
> architecture are authoritative: risk 14 and §8.2 item 5 (two sign-in paths behind a Strategy;
> sign-in is now GraphQL-only and the REST login is removed by this feature, overriding D2);
> §8.1 item 3 (sign-in no longer depends on the flag, which gates only the 2FA section); the
> `two_factor` signal category of §8.1 item 8 (the settings section records no signal); the
> self-expiry checker of risks 1 and 8 and §8.2 item 1 (dropped with #315's; the pin bump deletes
> the file by its list); the route flag gate of §8.2 item 7 (#330 builds it for `/settings`; the
> challenge route is not gated); and the "every branch" mock of §8.2 item 8 (a stateless happy
> path). The `/settings` page, the Bearer link and the session-ended notice are #330's, which
> lands before this feature.

## 1. Sources and method

- **crm:** worktree `/home/dima/Desktop/crm-worktrees/2fa-planning`, branch
  `docs/two-factor-authentication-planning` from `origin/main` at
  `580991681f3ea9e906716f190b1a514fa9d9192f` (`58099168`). No code changed.
- **user-service:** `main` at `a95c1e854bf21770b7fc630611a8257b0f9c600b` (2026-09-28) against the
  pinned tag `v2.8.0` (commit `56656f90fc5bd2725d41641ed9ca41856c14227a`, 2025-08-23). Both GraphQL
  spec files were re-fetched for this artifact through the GitHub API: `main` has 656 lines,
  `v2.8.0` has 222. Handler, validator and rate-limit facts come from the backend report, which
  read the PHP sources at the `main` SHA.
- **Miro:** board `uXjVMG64hTs=` ("Frontend C4 Architecture VilnaCRM"), read 2026-10-06 from
  Playwright screenshots. Widgets `3458764570351803366` (2FA component box),
  `3458764570351764591` (User/Auth component diagram), `3458764570351863499` ("User module"
  component/type tree).
- **Figma:** file `xZ7ccrH6d4QyqLQsayFSEX`. Challenge frames `72:4846` (desktop), `72:4882`
  (tablet), `72:4918` (mobile). Settings frames, misnamed "Помилка 404": setup `313:10242`,
  `313:10480`, `313:10606`; connected `315:11502`, `315:12300`, `318:13133`. "2FA item"
  component set `72:5171` (master `72:5172`).
- **ui-toolkit:** v0.6.0 release build read from the bun cache. The SHA-256 of
  `build/ui-pin-input.d.mts` (`e2bd01f1…`) and `build/ui-pin-input.mjs` (`a785d31a…`) match
  the pinned `ui-pin-input` entries, `config/ui-toolkit-checksums.json:1029-1040`.
- **Format reference:** the #315 research artifact (password recovery), for depth and layout only.

Method: the four orchestrator reports were read in full, then every repository citation this
document relies on was re-read in the worktree. Where a report and the source disagree, the
source wins and the disagreement is listed in §8.4.

## 2. Product intent from Miro

Miro defines two surfaces, not one:

1. **A challenge route in the sign-in flow.** The "User module" frame (widget
   `3458764570351863499`) has a top row of routed components: `2FA [component]<route>` →
   `2FADTO [type]`, beside `SignIn [component]<route>` → `SignInDTO` and
   `SignUp [component]<route>` → `SignUpDTO`. The 2FA step is a peer of sign-in and sign-up and
   owns a route.
2. **A settings component inside the user profile.** Below that row,
   `UserProfile [component]<route>` → `UserEntity [type]` has children
   `SocialNetworks [component]`, `2FASettings [component]` → `2FADTOSettingsEntity [type]` and
   `UserProfileSettings [component]` → `RestorePassword [component]`.

The component diagram (widget `3458764570351764591`) agrees: `2FA [React component]` is a child of
`User profile settings [React component]`, beside "User settings" (initials, e-mail, password) and
"Social networks", and talks to the API over the shared "1 request to API" edge. The component box
(widget `3458764570351803366`) states the intent in one line: "Give possibility to 2FA in
VilnaCRM". The diagram draws no direct edge between 2FA and sign-in; the sign-in edges go to a BFF
("1 get cookie and token by credential") and to state ("2 save JWT token").

> Assumption: the BFF/cookie edge is not a requirement. No BFF exists in crm, GraphQL `signInUser`
> sets no cookie (backend report §2), and ADR-007/ADR-008 keep the token in memory. Stale labels on
> the board ("Redux", "Angular", "Xamarin", "Internet Banking") are template leftovers, not scope.

D4 maps surface 1 to the public route `/sign-in/two-factor`; D7 maps surface 2 to the protected
route `/settings`, a page shared with the parallel User Settings bundle (ADR-021) in which the 2FA
card is one section.

## 3. Backend contract

### 3.1 Release status: unreleased upstream

- crm pins `GRAPHQL_SCHEMA_VERSION=v2.8.0` (`.env.example:83`) and `OPENAPI_SPEC_VERSION=v2.8.0`
  (`.env.example:86`); `scripts/check-contract-versions.sh` requires the two pins to move together.
- The `v2.8.0` schema has no `signInUser`, no 2FA mutation and no `scalar Iterable`; its
  `Mutation` (lines 92-110) is the user CRUD set plus `updateHealthCheck`. Verified by fetching
  the file for this artifact.
- 2FA was merged by user-service PR #249 (merge `f82bbef5`, 2026-03-23) and hardened by #334
  (brute force and replay, fixes #314), #332 and #329 (GraphQL rate limiters).
- **No tag contains `signInUser` or any 2FA operation.** `main` is 71 commits ahead of `v2.8.0`.
  Issue #513 (opened 2026-10-05) asks for a tag above `v2.8.0`; it would carry 2FA too. Issue #458
  reports the release pipeline broken.
- Consequence (binding user rule): the operations are **mocked** through a pending schema extension
  copied from `main` at `a95c1e85`, and production keeps the `twoFactorAuth` flag off until a
  release ships and is deployed (D13).

### 3.2 GraphQL surface on `main`

Mutations used by this feature (spec lines 170-190): `signInUser`, `completeTwoFactorUser`,
`setupTwoFactorUser`, `confirmTwoFactorUser`, `disableTwoFactorUser`,
`regenerateRecoveryCodesUser`. Present but out of scope: `refreshTokenUser`, `signOutUser`,
`signOutAllUser`, password reset (#315). There is **no 2FA query**, and `User` (spec lines
142-147) exposes only `id`, `confirmed`, `email`, `initials`, so no query reveals whether 2FA is
on.

SDL excerpt (spec lines 239-299 and 328-360 on `main`; field order verbatim, descriptions dropped;
fenced as `text` because the markdownlint language allowlist has no `graphql`):

```text
input signInUserInput {
  clientMutationId: String
  email: String!
  password: String!
  rememberMe: Boolean
}

type signInUserPayload {
  user: signInUserPayloadData
  clientMutationId: String
}

type signInUserPayloadData implements Node {
  id: ID!
  _id: String!
  success: Boolean!
  twoFactorEnabled: Boolean
  accessToken: String
  refreshToken: String
  pendingSessionId: String
  otpauthUri: String
  secret: String
  recoveryCodes: Iterable!
  recoveryCodesRemaining: Int
  warning: String
}

scalar Iterable

input completeTwoFactorUserInput {
  clientMutationId: String
  pendingSessionId: String!
  twoFactorCode: String!
}

input setupTwoFactorUserInput {
  clientMutationId: String
}

input confirmTwoFactorUserInput {
  clientMutationId: String
  twoFactorCode: String!
}

input disableTwoFactorUserInput {
  clientMutationId: String
  twoFactorCode: String!
}

input regenerateRecoveryCodesUserInput {
  clientMutationId: String
}
```

Every `<op>UserPayload` is `{ user: <op>UserPayloadData, clientMutationId }`, and every
`<op>UserPayloadData` repeats the same twelve fields: user-service serves one `AuthPayload` DTO
(resource `config/api_platform/resources/AuthPayload.yaml`, short name `User`) for all of them.
`signInUser`, `completeTwoFactorUser` and `refreshTokenUser` are anonymous; setup, confirm,
disable, regenerate and both sign-outs require `ROLE_USER`.

**Populated fields per mutation** (`AuthPayloadFactory.php:22-77`); every other field is `null`
and `recoveryCodes` is `[]`:

- `signInUser`: `twoFactorEnabled`, then either `accessToken` + `refreshToken` (2FA off) or
  `pendingSessionId` (2FA on, no tokens).
- `completeTwoFactorUser`: `twoFactorEnabled = true`, `accessToken`, `refreshToken`, and, when a
  recovery code was used and two or fewer remain, `recoveryCodesRemaining` + `warning`.
- `setupTwoFactorUser`: `otpauthUri`, `secret`.
- `confirmTwoFactorUser` and `regenerateRecoveryCodesUser`: `recoveryCodes`.
- `disableTwoFactorUser`: `success` only.

Upstream's own load tests select only the needed fields
(`tests/Load/utils/graphQLAuthFlowUtils.js:9-33`), for example
`signInUser { user { success twoFactorEnabled accessToken refreshToken pendingSessionId } }`.
Whether `id` resolves on these payloads is unverified, so it is never selected (user rule).

**Codegen consequence.** `codegen.ts:25` maps only `scalars: { ID: 'string' }`, so `Iterable`
would be generated as `any`. It needs an explicit mapping (`unknown`, narrowed by zod to
`string[]`), the way `CreateUserResultSchema` narrows registration today.

### 3.3 REST equivalents and the transport rule

user-service also exposes `/api/signin`, `/api/signin/2fa`,
`/api/2fa/setup|confirm|disable|recovery-codes`, `/api/signout(/all)` and `/api/token`. REST
sets the `__Host-auth_token` cookie; GraphQL sets no cookie and returns tokens in the body.
Protected calls accept `Authorization: Bearer` or the cookie (`DualAuthenticator.php:95-111`).
No step is REST-only.

crm uses **GraphQL only** for every user-service operation (binding user rule, D2). That
contradicts the transport rule in `src/api/contracts/README.md:32-36`, which routes "session/token
exchange (login)" to REST because it is "not part of the GraphQL schema". The premise no longer
holds once `signInUser` is in the schema, so the README must be updated in the same change that
moves sign-in to GraphQL (the `documentation-sync` skill and `make lint-docs` apply).

### 3.4 Flow parameters

- **Sign-in** (`SignInCommandHandler.php:40-67`): the password is checked first. With 2FA on, the
  response carries `twoFactorEnabled: true` and a ULID `pendingSessionId`, no tokens; `rememberMe`
  is stored on the pending session and applied when the challenge completes.
- **Pending session** (`PendingTwoFactor.php:11-12`): TTL 300 s, at most 5 failed attempts; the
  fifth failure deletes the session and the user must sign in again.
- **Challenge completion** (`CompleteTwoFactorCommandHandler.php:37-57`): missing, expired or
  exhausted session → 401 "Invalid or expired two-factor session."; wrong code → 401
  "Invalid two-factor code."; success → tokens. Low recovery codes add `recoveryCodesRemaining`
  and an English-only `warning` ("Only %d recovery code(s) remaining. Regenerate soon." or "All
  recovery codes have been used. Regenerate immediately.").
- **Code formats** (`TwoFactorCodeValidator.php:17,184-192`; `validation.yaml:221-249`): one
  `twoFactorCode` field takes either a TOTP code `^\d{6}$` or a recovery code
  `^[A-Za-z0-9]{4}-[A-Za-z0-9]{4}$`, case-insensitive. Complete and disable accept both;
  confirm accepts TOTP only. The violation message key `two.factor.code.invalid` is untranslated.
- **TOTP** (`TOTPValidator.php:12-57`, otphp 11.4.3): SHA-1, 6 digits, 30 s period, current and
  previous window only (no future window), replay-protected through `lastAcceptedTotpTimestep`.
- **Secret** (`TOTPFactory.php:11-42`): 32-character base32, issuer `VilnaCRM`, label = the user's
  e-mail. The API returns `otpauthUri` and the raw `secret`, **no QR image**; crm renders the QR.
- **Recovery codes** (`RecoveryCodeBatchFactory.php:18,39-65`): 8 codes, `XXXX-XXXX` from
  `A-Z0-9`, Argon2id-hashed, single use; plaintext appears only in the confirm and regenerate
  responses.
- **Setup** (`SetupTwoFactorCommandHandler.php:27-47`): 409 "Two-factor authentication is already
  enabled."; otherwise it overwrites any unconfirmed secret.
- **Confirm** (`ConfirmTwoFactorCommandHandler.php:37-52`): 401 "Two-factor setup not initiated."
  without a secret; verifies TOTP, enables 2FA, creates 8 codes and **revokes all other sessions**.
- **Disable** (`DisableTwoFactorCommandHandler.php:31-56`): TOTP or recovery code, no password;
  403 "Two-factor authentication is not enabled."; clears the secret and the codes.
- **Regenerate** (`RegenerateRecoveryCodesCommandHandler.php:24,35-76`): requires 2FA on and the
  sudo window — the current session must be younger than 300 s — else 403
  "Re-authentication required.".

### 3.5 Errors

API Platform's normalizer puts the exception message in `errors[i].message`, the HTTP status in
`extensions.status` and `'user'` in `extensions.category`. There is **no `extensions.code`**.
Validation failures carry `extensions.status: 422` and `extensions.violations: [{ path, message }]`.
The HTTP status of the GraphQL response is reportedly 200 (unverified against a live server).

| Situation                         | Status | Message                                           |
| --------------------------------- | ------ | ------------------------------------------------- |
| Wrong credentials or unknown user | 401    | "Invalid credentials."                            |
| Account locked                    | 423    | "Account temporarily locked" + `Retry-After`      |
| Wrong challenge code              | 401    | "Invalid two-factor code."                        |
| Session missing/expired/exhausted | 401    | "Invalid or expired two-factor session."          |
| Setup when already enabled        | 409    | "Two-factor authentication is already enabled."   |
| Disable or regenerate when off    | 403    | "Two-factor authentication is not enabled."       |
| Regenerate outside sudo window    | 403    | "Re-authentication required."                     |
| Confirm before setup              | 401    | "Two-factor setup not initiated."                 |
| Protected call, no token          | 200    | GraphQL error "Access Denied."                    |
| Invalid, expired or revoked token | 401    | transport problem+json "Authentication required." |
| Malformed code                    | 422    | violation `two.factor.code.invalid`               |
| Throttled                         | 429    | transport-level problem+json, not `errors[]`      |

Two 401s on `completeTwoFactorUser` mean different things (retry vs restart), and only the message
tells them apart (D11). A protected call that carries no token reaches GraphQL, because
`/api/graphql` is `PUBLIC_ACCESS` and the authenticator runs only when a token is present, so the
owner check answers "Access Denied." over HTTP 200; a present but invalid, expired or revoked
token is rejected by the firewall before GraphQL with a transport `401` problem+json carrying
"Authentication required." (`DualAuthenticator.php:34-41`, `:79-93`, `:147-162` at
`a95c1e85`). A 429 arrives as an HTTP 429 `application/problem+json` response with
`Retry-After` (`ApiRateLimitListener.php:79-98`), also on `/api/graphql`, so Apollo surfaces it as
a network error with `statusCode` 429 — the shape `RegistrationAPI.normalizeError` already turns
into an `HttpError` (`registration-api.ts:87-93`).

> Assumption: an unrecognised 401 message on `completeTwoFactorUser` is classified as an expired
> session. Restarting sign-in is recoverable; staying on a challenge whose session is gone traps
> the user in failures that can never succeed.

### 3.6 Rate limits, lockout and enumeration

- Limiters (`rate_limiter.yaml:48-110`): sign-in 10/min per IP and 5/min per e-mail; 2FA
  verification 5/min per user and 5/min per IP; setup 5/min; confirm 5/min; disable 3/min.
- Lockout (`UserCredentialValidator.php:75-130`): 20 failures in 3600 s lock the account for
  900 s (423 + `Retry-After`).
- The per-user 2FA key reads `pendingSessionId` from `variables.input`, so operations must send
  variables, never inline literals (crm already sends `variables: { input }`,
  `registration-api.ts:48-57`).
- Enumeration: unknown e-mail and wrong password both answer 401 "Invalid credentials." with
  dummy-hash timing; `twoFactorEnabled` is revealed only after a correct password. crm must keep
  that uniformity — one message for every 401 on `signInUser`.

### 3.7 Upstream defects and open issues

Open upstream issues that touch this feature:

- #472 (high): the OAuth password grant `/api/oauth/token` bypasses 2FA and the lockout. crm does
  not use it, but it weakens the value of the factor until fixed.
- #469 (high): the GraphQL rate-limit resolver exact-matches `signIn`/`refreshToken` while the real
  fields are `signInUser`/`refreshTokenUser` (`ApiRateLimitGraphQlResolver.php:131-143`), so the
  GraphQL sign-in limiter does not apply.
- #476 lockout as denial of service; #465 enumeration through registration; #362/#426 empty
  encryption keys; draft #507 KMS; #286/#221 passkeys (not merged).

Unfiled defects found by the backend research (candidates, D13 and the decisions file):

- `confirmTwoFactorUser` does not check "already enabled": a second confirm appends 8 more codes
  without deleting the old ones (`ConfirmTwoFactorCommandHandler.php:40-51`).
- `decryptSecret` silently falls back to the plaintext value when decryption throws
  (`TwoFactorCodeValidator.php:173-182`).
- setup, confirm and disable over GraphQL get no per-operation limiter: `TWO_FACTOR_ROUTE_LIMITERS`
  is keyed by REST paths (`ApiRateLimitAuthTargetResolver.php:17-19`). Check #469 first.
- `warning` strings and `two.factor.code.invalid` are not localised; no machine-readable error
  codes; no query exposes 2FA status; the OpenAPI `/api/2fa/setup` omits 409; disable needs no
  password.

None of these blocks the crm implementation; the missing release blocks production enablement
only.

## 4. Design inventory (Figma)

### 4.1 Challenge frames

Section label `72:4965` ("Двухфакторная аунтефикация (2FA)") sits below the Log in and Sign up
rows. Prototype links between the rows are unverified.

- `72:4846` desktop 1440×940: header with "На головну сторінку", card with "Назад", title,
  subtitle "Перевірте додаток Google Authentificator", six cells, "Підтвердити", then
  "Надіслати код ще раз" + "00:34", footer.
- `72:4882` tablet 1024×1366: same layout, subtitle "Ми надіслали Вам лист на пошту
  `f*****dj@gmail.com`".
- `72:4918` mobile 375×1002: fake browser chrome (`72:4921`), page link `72:4925`, card, footer,
  e-mail subtitle.

Layout: desktop card 502×404 at y148, padding 32/40/24, six 64×86 cells with gap 8 (row `72:5149`,
424×86, against a 422 button); tablet card 636×468, cells about 86×130; mobile card 363×370 with
6 px side margins (equal to the sign-in section's 6 px side padding,
`auth-form-shared-styles.ts:26`), cells 49×64 with gap 4. Card: white, 1 px `#EAECEE`, radius 16,
shadow `0 7px 40px rgba(231,231,231,0.49)`. Title Golos DemiBold 30 (mobile Bold 22). Primary
button `#1EAEFF`, radius 57, 422×62 desktop. No disabled, hover or loading button states.

### 4.2 Settings frames

The account settings page ("Настройка") has a right-hand 2FA card. All copy is Russian.

- **Setup state** "Настройте 2FA": desktop `313:10242` (card `313:10245`, 479×748, QR
  `315:11289` 250×250), tablet `313:10480`, mobile `313:10606`. Content: Google Authenticator
  logo, heading, subtitle, three numbered steps (install the app, scan the QR, save the backup
  key), QR tile, manual key chip ("5POLGOPWQZFCCFEI") with a copy icon, a fallback sentence and an
  info tooltip `315:11307`. Variants: `377:20051` (collapsed sidebar), `386:27830` (unconfirmed
  e-mail banner), `315:11754` (toasts), tablet `386:27945`/`377:20163`, mobile `386:28059`
  (mobile page title wrongly "Management board").
- **Connected state** "2FA подключен" with an outlined "Отключить" button: desktop `315:11502`
  (card `315:11505`, 479×176), tablet `315:12300`/`315:12551`, mobile `318:13133`/`318:13410`.
- Frames `501:39205`, `534:36183`, `534:37349`, `524:37319` and `524:35643` ("Управление ролями")
  reuse placeholder copy and are not 2FA.

### 4.3 Pin-input component ("2FA item", set `72:5171`)

Five 64×86 variants on white, 1 px border, radius 12: Rest `72:5172` (border `#E1E7EA`,
placeholder "0" in `#D0D4D8`), Hover `72:5186` (border `#D0D4D8`), Active `72:5174` (shadow
`0 7px 12px rgba(76,90,126,0.15)` + caret), Active+Filled `72:5178`, Filled `72:5182` (digit
`#57595B`). No error, disabled or success variant. Focus is the shadow and a caret only. Every
breakpoint draws **two cells focused at once**, a design defect not to reproduce (D5).

ui-toolkit v0.6.0 ships this component as `UiPinInput` (`index.d.mts:2012-2176`):

- N native `<input type="text" inputMode="numeric" maxLength={1}>` cells in a named
  `role="group"`, default length 6, `autoComplete="one-time-code"` on the first cell only.
- Always controlled (`value`, `onChange(next)`), no `onComplete` (compare
  `next.length === length`), digits only.
- Paste strips non-digits and distributes from the focused cell; typed, pasted and autofilled
  input share one write path.
- `error` sets `aria-invalid` on every cell and links `helperText` through `aria-describedby`;
  `disabled` renders `readOnly` + `aria-disabled`; `required` lands on the first cell only.
- Every cell stays in the natural tab order (no roving tabindex): Tab and Shift+Tab move cell by
  cell, a typed digit advances focus, the arrow keys move one cell, and Backspace on an empty
  cell moves back and clears it. Exactly one cell holds focus at a time.
- The forwarded ref lands on the group element, not a cell (`index.d.mts:2012-2026`).
- No live region, by design: announcing state changes is the consumer's job.

Findings from the compiled build that the seam must handle:

- The doc comment says a `:focus-visible` ring ships in addition to the Figma shadow, but the
  compiled cell style in `chunks/chunk-NRC7MWEQ.mjs` sets `:focus-visible` to `outline: none`
  plus the 15 % shadow; only `forced-colors` mode gets a `2px solid Highlight` outline.
- The cell border is `1px solid` brand gray `#E1E7EA` (1.25:1 on white) and the gap is `0.75rem`
  (12 px, where the Figma screens use 8 px); a cell is `4rem` wide with a `5.375rem` minimum
  height (64 × 86, the size the desktop frame draws, where tablet draws about 86 × 130 and mobile
  49 × 64), and `flexShrink: 0`, so six cells and their gaps never shrink to a narrow container.
- Every cell gets `placeholder` from a constant `"0"`, and `UiPinInputProps` has no placeholder
  prop (`index.d.mts:2122-2176`): a consumer can hide the digit with `::placeholder` styling but
  cannot remove the attribute.
- The toolkit doc cites state nodes `439:19615`/`439:19617`/`439:19619`/`439:19623`, including a
  disabled state, while the Figma report found no disabled variant in set `72:5171`.

> Assumption: the seam supplies its own focus indicator and border colour through `sx` and treats
> the focus-ring mismatch as a ui-toolkit issue (D5); browser verification during implementation
> decides whether any toolkit ring survives.

### 4.4 Tokens

Variables on the challenge frames: Font/100 `#1A1C1E`, Font/200 `#404142`, Font/250 `#57595B`,
Font/300 `#969B9D`, Font/400 `#D0D4D8`, Font/500 `#EAECEE`, Brand gray `#E1E7EA`, Primary
`#1EAEFF`, Dark primary `#1B2327`, shaded `#F4F5F6`, Grey bg `#FBFBFB`. Golos throughout (footer
Inter). Settings card: border `#E1E7EA`, radius 12, heading Golos Bold 22, description Inter 14/16
`#404142`, step badge 24 px `#E1E7EA` circle, key chip `#EAECEE`, "Отключить" white with a 1 px
`#969B9D` border. The repository already has `linkText #0074B5` (`src/styles/colors.ts:9`, 5.04:1
on white) as its AA link colour.

### 4.5 Contrast

Pass on white: `#1A1C1E` 17.09:1, `#57595B` 7.03:1, `#404142` 10.23:1, `#1B2327` 15.95:1, key chip
5.94:1, step badge 5.63:1.

Fail:

- "Назад", "На головну сторінку", the resend label and the countdown: `#969B9D` on white, 2.81:1
  (1.4.3).
- Button text white on `#1EAEFF`: 2.46:1, below even the 3:1 large-text bar.
- Placeholder `#D0D4D8`: 1.49:1 (hint text).
- Cell border `#E1E7EA` 1.25:1, hover `#D0D4D8` 1.49:1, caret `#1EAEFF` 2.46:1, "Отключить"
  border 2.81:1 (1.4.11).
- Footer links `#969B9D` on `#F4F5F6`: 2.57:1.
- The drawn focus indicator fails 2.4.7, 2.4.11 and 1.4.11.

Repository position: existing components keep their four #276-tracked `color-contrast` entries
(`tests/utils/a11y/axe-config.ts:27-54`). The generic submit entry
(`form button[type="submit"].MuiButton-contained`, `:36`) already covers a 2FA submit inside a
`<form>`. The switcher entry is scoped to `href="/sign-up"` and `href="/sign-in"` under a
`section` (`:42-43`), so a grey "Назад" link pointing at `/sign-in` inside a card `section` may
match it by accident — the card link must use a compliant colour on purpose, not lean on that
entry. No new entry is added (binding user rule).

### 4.6 Copy defects

- Title "Двухфакторна аунтефікація" → "Двофакторна автентифікація"; frame names are Russian.
- "Authentificator" → "Authenticator".
- "аккаунту" → "акаунту"; "Реєєстрація" typo.
- The settings copy is entirely Russian, including the placeholder "Описание страницы настроек"
  and the mobile title "Management board".
- Masks differ between flows: `f*****dj@gmail.com` (first char + five asterisks + last two before
  the at sign) here, `eir*****@gmail.com` in password recovery. Moot for 2FA: no e-mail channel
  exists (D12).

### 4.7 Design gaps and the channel mismatch

- **Channel mismatch.** Desktop says "check Google Authenticator"; tablet and mobile say "we sent
  you an e-mail". user-service has no e-mail OTP and no SMS, and the resend row with a 00:34
  countdown is meaningless for TOTP. D1 settles it: authenticator copy at all breakpoints, no
  resend, and a "Використати резервний код" text button in its place.
- **Missing frames:** recovery-code entry mode on the challenge; the enrollment confirm-code step
  after the QR; the one-time recovery-codes list; disable confirmation; regenerate codes;
  error, loading and success states on both surfaces; a low-recovery-codes notice; disabled and
  loading button states. The only "backup key" in the setup frames is the TOTP secret itself
  (`315:11309`, `386:27800`), not a recovery code.
- **QR-on-mount deviation.** Figma shows the QR immediately. Calling a rate-limited mutation that
  overwrites the secret on page mount is a side effect of navigation (and runs twice under
  StrictMode), so D8 adds a "Почати налаштування" button first.

All of these deviations go to one designer follow-up (D13), and the Figma gate
(`figma-design-check`) records them rather than blocking on them.

## 5. crm current state relevant to the feature

### 5.1 Sign-in today is a REST placeholder

- `LoginAPI.login` posts `API_ENDPOINTS.LOGIN` with `LoginResponseSchema` and `retry: true`
  (`src/modules/user/features/auth/repositories/login-api.ts:26-43`).
- `LOGIN` is `urlBuilder.build('/api/users')`, the same URL as `REGISTER`
  (`src/config/api-config.ts:4-5`); in the pinned OpenAPI that path creates a user. Login has no
  real backend contract; e2e stubs `**/api/users` and integration uses msw.
- `LoginUserDto` is `Pick<RegisterUserDto, 'email' | 'password'>`
  (`src/modules/user/features/auth/types/credentials.ts:7`): there is **no `rememberMe`**. The
  "remember me" checkbox is local `useState` in `UserOptions`
  (`components/form-section/components/user-options/index.tsx:13-23,26-39`), not registered with
  the form, so its value never reaches the submit handler. This feature leaves it unwired (D3');
  wiring it into the form values and the DTO is the refresh-token follow-up's work.
- Every login failure renders `auth.error.unknown` today, because `ErrorHandler` produces English
  sentences and `formatLoginError` accepts only i18n keys (`use-login-submitter.ts:13-27`). This
  is a pre-existing defect of the REST path, left out of scope; the GraphQL path maps to keys.

### 5.2 Token store, authentication and redirect-back

- `AuthStateVar` holds
  `{ email, token, user, loginLoading, loginError, registerLoading, registerError }` in memory
  (`stores/auth-var.ts:6-14,16-51`), seeded only by the test-only `preloadedAuthTokenSeed`
  (`:24`). No storage API.
- `isAuthenticated = !!token`; `ProtectedRoute` checks token truthiness. `applyLogin`
  (`stores/auth-store-actions.ts:76-91`) is the only token writer, and `usePostLoginRedirect`
  fires on the null-to-token edge. A pending challenge therefore must never touch `token`.
- `AuthActions` has six members and no 2FA action (`types/auth-store.ts:15-22`).
- `LoginRedirectTarget.isInternalPath` rejects only the exact `/sign-in`
  (`utils/login-redirect-target.ts:13-19`); the challenge route must be rejected too, or a
  redirect could land the user back on a dead challenge.
- **No `Authorization` header is sent anywhere.** `ApolloLinkFactory` adds only the two
  correlation headers (`src/services/observability/apollo-link-factory.ts:25-33`). The four
  `ROLE_USER` settings mutations need `Authorization: Bearer <accessToken>`.

### 5.3 GraphQL precedent, codegen and mocks

- `RegistrationAPI` is the GraphQL precedent: injected `ApolloClient`, `variables: { input }`,
  `context.fetchOptions.signal`, zod `CreateUserResultSchema`, `clientMutationId: uuidv4()`,
  `networkError.statusCode` → `HttpError` (`repositories/registration-api.ts:24-93`).
  `fetchPolicy` is used nowhere in `src`.
- The DI collaborator policy admits only `*-mutation.ts` document seams
  (`config/di-collaborator-policy.js:292-298`, per the code map); there is no query here anyway.
- `ApolloLinkFactory.build` is `from([correlationLink, errorLink, HttpLink])` with the deadline
  fetch and deliberately no retry (`apollo-link-factory.ts:17-22`); `errorLink` captures network
  and GraphQL errors to observability (`:35-51`) — those captures carry no variables, but the
  scrubber must still cover the new secret-bearing keys (§5.8).
- Codegen reads `.codegen-cache/schema.graphql` and `src/modules/**/*.graphql`
  (`codegen.ts:9-14`). The pending-contract directory `src/api/contracts/pending/` and
  `scripts/ci/check-pending-contract.mjs` do not exist on this branch; #315 plans them.
- The local Apollo mock implements only `Mutation.createUser`
  (`docker/apollo-server/lib/resolvers.ts:55-84`). Its `formatError`
  (`docker/apollo-server/lib/format-error.ts:13-41`) masks `INTERNAL_SERVER_ERROR`, which is the
  code Apollo Server assigns to a thrown error that carries none — hence mock errors carry an
  explicit `extensions.code`.
- The integration msw server has one REST login handler and one GraphQL handler that always
  answers `createUser` (`tests/integration/mocks/server.ts:21-33`); new operations need
  operation-aware handlers.

### 5.4 Runtime flags

- Only `forgotPassword` exists: union `src/config/runtime/types/feature-flag.ts:1`, defaults
  `feature-flag-service.ts:4-6`, schema `app-config-schema.ts:18-22`, HTML block
  `public/index.html:27-29`, prod-stack passthrough `docker-compose.test.yml:21`
  (`${APP_CONFIG_FLAG_FORGOT_PASSWORD-}`), `.env.example:66`.
- `tests/unit/tooling/runtime-config-contract.test.ts:195-204` is the precedent for "a flag never
  ships enabled while its route is unregistered".
- D-rules: `twoFactorAuth` defaults `false` in production and `true` in the dev and test stacks.

### 5.5 Routes

- `ROUTE_PATHS` has `home`, `signUp`, `signIn`, `passwordRecovery`, `notFound`
  (`src/routes/route-paths.ts:1-9`). No profile or settings route exists; the only protected route
  is home.
- `RouteGuard` is the closed union `'protected' | 'public'` (`src/routes/types/app-route.ts:3`);
  there is no "public but only mid-flow" precedent.
- `RouteMapper.loaderFor` gives public pages a one-time document reload on a chunk miss
  (`src/routes/route-mapper.tsx:31-40`). On the challenge route that reload wipes the memory-only
  pending challenge; the page then redirects to `/sign-in` (D4).
- Every `ROUTE_PATHS` key needs a row in `tests/e2e/route-coverage.tsv` (precedent: the
  `passwordRecovery` allowlisted row, line 15), and the a11y route scan lists routes explicitly.

### 5.6 DI and module shape

- `AUTH_TOKENS` has 16 symbols (`src/modules/user/config/tokens.ts:1-18`); `UserModuleRegistrar`
  wires them in `src/modules/user/config/di.ts`.
- Allowed folders: module `config, features, hooks, lib, store, types, utils`; feature
  `assets, components, hooks, i18n, repositories, routes, stores, types, utils`
  (`config/module-shape.json:6,9-19`).
- Sibling features may not import each other at all, not even through the barrel
  (`.dependency-cruiser.js:591-602`, target `^src/modules/$1/features/(?!$2/)`). A separate
  settings feature cannot read `AuthStateVar` or call `authActions`.
- `src/modules/user/README.md:3` already names the module "Auth, registration, 2FA, and profile".
- rca caps: 10 functions per file, class public methods 8, arguments 3
  (`config/metrics-policy.json`, per the code map). `AuthStoreActions` already has 2 public and
  7 private methods, so challenge completion belongs in a new class, not in it.
- Class suffixes include `Strategy`, `Repository`, `Mapper`, `Controller`, `Var`, `Guard`,
  `Loader`, `Adapter` (`config/class-naming-policy.js:42-168`). Since 2026-10-08 the design
  follows the Miro board's layers instead: #315 adds `Transformer` and removes `Controller`,
  which no frontend frame of the board uses (architecture §19).

### 5.7 UI building blocks

- `AuthPageLayout`, `AuthFormSection` (always renders the OAuth buttons), `UIForm` (no slot below
  the submit, children render above it), `UIBackToMain`, `UILiveStatus`, `UIOfflineNotice`,
  `RouteFallback` — locations in the code map §4.
- No OTP input exists in `src/`. `UiPinInput` is not an adopted seam: `uiToolkitSeams` lists eight
  subpaths (`eslint.config.mjs:532-541`) and every other subpath is forbidden (`:569-582`).
  Adoption follows ADR-016: a seam file under `src/components/`, a `uiToolkitSeams` entry and the
  `docs/ui-toolkit.md` register rows.
- No client-side QR encoder is installed; D10 adds one to the settings chunk only.

### 5.8 Observability, security events and secrets

- `PiiScrubber` drops keys containing `password`, `token`, `authorization`, `cookie`, `secret`,
  `apikey` or `email`, and redacts e-mails, bearer strings and JWTs in values
  (`src/services/observability/pii-scrubber.ts:4-18,41-44`). `pendingSessionId`,
  `twoFactorCode`, `recoveryCodes` and `otpauthUri` match none of them, and an `otpauth://` value
  carries `secret=` in its query string, which no value pattern redacts. D8 requires extending it.
- `AuthFailureCategory` is `'login' | 'registration'` and `AuthFailureReason` has seven values
  (`src/services/types/security-events/security-event.ts:6,10-11`); `AuthSecuritySignals` maps
  `AuthError.kind` and 429 to a reason (`utils/auth-security-signals.ts:55-64`).

### 5.9 Budgets and test infrastructure

- `config/performance-budget.json`: raw entrypoint 470 000 (measured 387 749 on 2026-07-20), raw
  asset 400 000 (largest 317 727 — "the deferred auth/DI graph"), Lighthouse script 265 000
  (`/sign-in` measured 195 783). The baseline predates React 19.3, the toolkit adoption and the
  Storybook work.
- Lighthouse audits `/`, `/sign-up`, `/sign-in` only (`lighthouse/constants.js:15-19`). The CI
  mobile performance floor is 0.84 (`lighthouse/lighthouserc.mobile.js:35`) while the profile
  floor reads 85 (`.claude/react-sdlc.yml:65`).
- Quality floors (`.claude/react-sdlc.yml:50-65`): coverage 100 % on all four measures, mutation
  MSI 100, zero jscpd clones, zero ESLint errors and warnings, zero tsc errors, zero markdownlint
  errors, zero dependency-cruiser violations, metrics enforced, zero visual diffs, Lighthouse
  desktop 95 and mobile 85. Raise-only; no suppressions.
- Every rendering `.tsx` needs a story (`tests/unit/tooling/storybook-story-coverage.test.ts`);
  visual baselines come from CI artifacts.

## 6. Domain glossary

The 2FA model belongs to user-service's identity and authentication bounded context; crm is a
client of it. The crm Repository and Transformer classes are the anti-corruption layer: they
turn the one twelve-field `AuthPayload` shape and API Platform error envelopes into small,
named, feature-specific results in the `AuthResult` vocabulary, so nothing above them sees
GraphQL.

- **Two-factor authentication (2FA):** sign-in requires a second proof after the password. Here
  the only second factors are an authenticator-app code or a recovery code.
- **Authenticator app:** any TOTP app (Google Authenticator in the designs) holding the shared
  secret.
- **TOTP secret:** 32-character base32 shared secret created at setup. A credential: shown once
  for manual entry, never logged or stored by crm.
- **otpauth URI:** `otpauth://totp/...` string carrying issuer, label and the secret; crm encodes
  it as a QR code. As sensitive as the secret.
- **TOTP code:** six digits derived from the secret and the current 30-second step; the current
  and previous step are accepted, each step once.
- **Recovery code:** single-use fallback code `XXXX-XXXX` (letters and digits, any case). Eight
  are issued per batch; shown in plaintext once.
- **Recovery codes remaining:** count returned when a recovery code completes sign-in and two or
  fewer remain; drives the low-codes notice (D9).
- **Enrollment:** turning 2FA on, in two steps — **setup** (get a secret and URI; repeatable until
  confirmed, each call overwriting the unconfirmed secret) and **confirm** (prove the app works
  with one TOTP code; enables 2FA, issues the codes, signs out other sessions).
- **Two-factor challenge:** the sign-in step between a correct password and the tokens, served by
  the challenge route.
- **Pending session:** the server-side record of a started challenge, identified by
  `pendingSessionId`; lives 300 s and dies after 5 wrong codes. In crm a memory-only value, never
  in the URL, storage, logs or the Apollo cache.
- **Challenge completion:** exchanging the pending session plus a code for tokens.
- **Access token:** bearer credential returned on sign-in or completion; kept in memory
  (`AuthStateVar.token`) and sent as `Authorization: Bearer` on protected GraphQL calls.
- **Refresh token:** returned too; not stored, because crm has no refresh flow (D3).
- **Remember me:** the upstream sign-in option `rememberMe`, which user-service applies to token
  lifetime; crm does not send it while tokens are memory-only (D3').
- **Known 2FA status:** whether 2FA is on, as last learnt from a sign-in, completion, confirm,
  disable or a 409 on setup. There is no query; unknown is treated as off (D8).
- **Disable:** turning 2FA off with a TOTP or recovery code; deletes the secret and the codes.
- **Regenerate recovery codes:** replacing the batch with eight new codes; only inside the sudo
  window.
- **Sudo window:** the first 300 s of a session, during which sensitive changes (regeneration) are
  allowed without re-authentication.
- **Lockout:** 900 s account lock after 20 failed password attempts in an hour (423).
- **Rate limit:** per-IP, per-e-mail and per-user ceilings; exceeded calls get HTTP 429.
- **Uniform credential response:** the same 401 for an unknown e-mail and a wrong password, so
  sign-in never reveals whether an account exists.

## 7. Risks, unknowns and mock drift

### 7.1 Ranked risks

1. **Upstream release missing.** No tag carries the contract (#513, #458), so the generated types
   and the mock rest on an unreleased SDL that may still change. Mitigation: the pending extension
   is pinned to `a95c1e85`, and the pin bump deletes it by its file list (the self-expiry checker
   was dropped on 2026-10-08); production keeps the flag off until then (D13).
2. **Error classification on English messages.** The two 401s on completion differ only by text.
   Mitigation: one mapper holding the exact upstream strings as constants, tests for both and for
   an unknown message (classified as an expired session, §3.5), and an upstream issue for
   machine-readable codes.
3. **Mock drift.** Every difference in §7.2 can hide a defect until a real environment exists.
   Mitigation: the repository classifies on `extensions.status` and message, never on the
   mock-only `extensions.code`; drift is listed in the architecture and re-checked on the pin bump.
4. **Authorization header is new.** No request carries the token today. Mitigation: an Apollo link
   inside the DI chunk reads the in-memory token at request time; nothing on the paint path imports
   it; the scrubber already drops `authorization` keys and bearer strings.
5. **Secret leakage.** `pendingSessionId`, codes, the secret, the URI and recovery codes could leak
   through Apollo's cache, Sentry or logs. Mitigation: `fetchPolicy: 'no-cache'` tested with a spy
   on `cache.write`, minimal selection sets, scrubber keys extended (§5.8), secrets held in
   component or hook memory and cleared on unmount.
6. **Bundle growth.** The second sign-in implementation, the 2FA repositories and the mapper land
   in the deferred auth/DI chunk (317 727 of 400 000 raw, stale baseline). Mitigation: measure in
   the bundle-size workflow; the QR encoder and the settings code stay in the lazy settings chunk;
   nothing joins the eager entrypoint.
7. **Pin-input accessibility gaps.** The compiled `UiPinInput` paints no focus ring and a 1.25:1
   border (§4.3). Mitigation: the seam overrides both through `sx`, axe and keyboard tests pin the
   result, the toolkit gap becomes a ui-toolkit issue; no new `A11Y_EXCEPTIONS` entry.
8. **Pending-contract collision with #315.** Both features need the same mechanism and both
   pending files extend `Mutation`. Mitigation: #315 builds it generically (every
   `pending/*.graphql` file); each pending file declares only types absent from the pinned
   schema and adds its fields through `extend type Mutation`; `scalar Iterable` is declared once
   (it is absent from `v2.8.0`).
9. **Lost challenge.** A reload, the public-route chunk reload or a closed tab drops the pending
   session. Mitigation: the challenge page redirects to `/sign-in` without a challenge (D4);
   documented as accepted.
10. **Unknown 2FA status.** A seeded test token or a reload leaves the status unknown. Mitigation:
    unknown means off; a 409 from setup switches the card to the enabled state (D8).
11. **Sudo window surprise.** Regeneration fails with 403 after the first five minutes of a
    session. Mitigation: a localized "sign in again to generate new codes" message (D8).
12. **Clock skew.** TOTP accepts no future window, so a phone clock running ahead fails. Mitigation:
    the wrong-code message suggests checking the device time; nothing else is possible client-side.
13. **Design gate friction.** Many required states have no frame. Mitigation: the deviations are
    recorded once, carried by the designer follow-up, and implemented with existing components.
14. **Two sign-in paths (superseded 2026-10-08).** The user ruled sign-in GraphQL-only: one
    GraphQL Data provider, and the REST login placeholder is removed in this feature, so no second
    path needs tests.

### 7.2 Mock drift (local Apollo mock and msw vs real user-service)

- The pending schema is `main` at `a95c1e85`; a future release may differ.
- Mock errors carry `extensions.code` (`BAD_USER_INPUT`, `FORBIDDEN`, `UNAUTHENTICATED`) as well as
  `extensions.status`; real errors carry `extensions.status` and `category` only.
- Real 429 is a transport-level `application/problem+json` response with `Retry-After`. A mock
  that reports it inside `errors[]` would be drift; the mock should answer HTTP 429 at the
  transport level.
- The HTTP status of real GraphQL error responses is reportedly 200 but unverified; the mock's
  status is whatever Apollo Server sends.
- TOTP: real verification is SHA-1, current and previous window, replay-protected; the mock
  accepts fixed deterministic codes.
- Secret and URI: random per setup upstream; fixed in the mock.
- Recovery codes: random, Argon2id-hashed and single-use upstream; a fixed list in the mock, with
  single use modelled only if the mock tracks it.
- Pending session TTL (300 s) and the five-attempt limit: the mock simulates them with magic
  values or counters, not wall-clock time.
- Rate limits and the 423 lockout: triggered by magic inputs in the mock, not by real counters.
- Sudo window: the mock produces the 403 through a magic state, not session age.
- `confirmTwoFactorUser` revoking other sessions is not modelled.
- Bearer validation: the mock checks that an `Authorization` header is present; real user-service
  validates the JWT and also accepts the `__Host-auth_token` cookie.
- Enumeration timing (dummy hash) is not modelled; the mock only returns the uniform 401 message.
- Tokens: opaque strings in the mock, JWTs upstream; `rememberMe` has no effect in the mock.
- `warning` text and the `two.factor.code.invalid` violation: present upstream, possibly absent or
  different in the mock; crm ignores `warning` either way.
- `id` and `_id`: may resolve in the mock, unverified upstream; never selected.
- Mock state lives in one in-memory process shared by every e2e worker, unlike per-user server
  state.
- Mockoon still serves `v2.8.0` REST without `/api/signin`; the flag-off path keeps posting to the
  `/api/users` placeholder.
- msw handlers in integration tests are a third mock with the same drift classes.

## 8. Implications for planning

### 8.1 What the brief and PRD must carry

1. Scope per D1: TOTP authenticator and recovery codes only; no e-mail OTP, no SMS, no resend, no
   countdown; a recovery-code mode on the challenge.
2. Two surfaces per Miro: the public challenge route `/sign-in/two-factor` (D4) and the protected,
   flag-gated `/settings` route, where the 2FA card is one section of a page shared with the User
   Settings bundle (D7).
3. Sign-in moves to GraphQL `signInUser` in every environment and the REST placeholder is
   removed (the user, 2026-10-08, overriding D2's flag choice). The contracts README transport
   rule is updated in the same change (§3.3).
4. Token handling per D3 and D3': the access token in memory, the refresh token dropped,
   `rememberMe` neither sent nor wired. The checkbox is local state outside the form values and
   `LoginUserDto` (§5.1), and with memory-only tokens it would change nothing a user can see, so
   wiring it belongs to the refresh-token follow-up.
5. Challenge rules per D4-D6: memory-only pending session, "Назад" discards it, redirect-back
   (`state.from`) preserved, expired or exhausted session returns to `/sign-in` with a notice,
   `LoginRedirectTarget` rejects the challenge path, no auto-submit.
6. Settings flow per D8: start button, client-side QR plus manual secret with copy, confirm code,
   recovery codes shown once with an acknowledgement, enabled state with disable (code required)
   and regenerate (sudo-window message), secrets cleared on unmount and scrubbed.
7. Low-codes notice per D9, localized from `recoveryCodesRemaining`, linking to `/settings`.
8. Error mapping per D11 and §3.5, including the unknown-401 assumption, 423, 429 and network
   errors. Sign-in and challenge failures feed `AuthSecuritySignals` with bounded reasons in the
   `login` category; settings failures record no signal (2026-10-08: user-service owns the 2FA
   rules, and no gate needs one).
9. Copy per D12 in `uk` and `en`, plus the design deviations for the designer follow-up (§4.7).
10. Accessibility per WCAG 2.1 AA on every user-facing story: the pin-input group name, paste,
    a visible focus indicator of 3:1, cell borders of 3:1, `aria-invalid` + `aria-describedby`
    errors, polite status regions for notices, a mode switch announced by focus moving to the new
    input's label with no extra live announcement (PRD FR-17), focus on arrival and after errors,
    compliant colours for "Назад" and secondary text, no new axe exceptions.
11. Quality floors from `.claude/react-sdlc.yml` restated, never lowered.
12. Follow-ups per D13 under `### Follow-up N.M:` headings: production enablement and the pin bump,
    refresh tokens, OAuth sign-in with 2FA, the designer follow-up and sign-out via
    `signOutUser` (since 2026-10-08 the REST login and its error-key defect leave in this feature).

### 8.2 What the architecture must resolve

1. **Pending contract.** #315's `src/api/contracts/pending/*.graphql` directory, read by
   `codegen.ts` and the Apollo mock (`extendSchema`); `extend type Mutation` plus the absent types;
   an `Iterable` scalar mapping in `codegen.ts`. (The self-expiry checker was dropped 2026-10-08.)
2. **Where things live.** The challenge route belongs in the auth feature (it reuses
   `AuthPageLayout`, the store and the sign-in result). The settings surface faces the sibling ban
   (`.dependency-cruiser.js:591-602`): it is a new `settings` feature generated with
   `make new-feature` by the User Settings bundle (#330), and the known 2FA status is an
   `AuthState` field that the settings feature reads and writes only through the protected
   outlet context `ProtectedRoute` provides (the issue-#106 sign-out seam). The gate impact and
   the rationale belong to the architecture and ADR-020.
3. **State.** New `AuthState` members for the pending challenge and the known 2FA status that never
   touch `token`. (2026-10-08: completion runs in a React hook over #315's provider loader, not in
   an actions class, because `AuthStoreActions` is at its method budget.)
4. **Authorization link** in the Apollo chain, inside the DI chunk, reading the token per request
   (2026-10-08: #330's `SessionLinkFactory`; this feature only marks its anonymous operations).
5. **Sign-in transport.** Superseded 2026-10-08: one GraphQL Data provider, the REST login
   removed; no Strategy.
6. **Pin-input seam** per ADR-016 with the overrides from §4.3.
7. **Route behaviour** for a mid-flow public route under the closed `RouteGuard` union, always
   registered and not flag-gated (2026-10-08); `route-coverage.tsv` rows, a11y route-scan
   entries.
8. **Mock design** (2026-10-08: a stateless happy path with one violation per mutation; msw and the
   route stubs inject every other branch of §3.5, including the transport-level 429) and the
   drift list in §7.2.
9. **Budgets:** the challenge route and the 2FA section are lazy chunks; the QR encoder (D10, a
   `dependencies` change that triggers the ADR drift gate) stays in the settings chunk.

### 8.3 Assumptions recorded by this stage

> Assumption: the Miro BFF/cookie edge is not a requirement (§2).
>
> Assumption: an unrecognised 401 message on `completeTwoFactorUser` means an expired session
> (§3.5).
>
> Assumption: the pin-input seam owns the focus indicator and border colour, and the toolkit
> focus-ring mismatch is reported upstream (§4.3).

### 8.4 Contradictions found between the inputs

1. **Transport rule.** `src/api/contracts/README.md:32-36` routes login to REST; the binding user
   rule and D2 put sign-in on GraphQL. The user rule governs, and the README changes.
2. **Remember me.** D3 names the "existing checkbox", but the checkbox is local state outside the
   form and `LoginUserDto` has no field for it (§5.1). With memory-only tokens it has no effect a
   user can see, so `rememberMe` is neither sent nor wired (D3'); the refresh-token follow-up
   wires it.
3. **Pin-input focus ring.** The toolkit doc promises a `:focus-visible` ring beyond the Figma
   shadow; the compiled v0.6.0 style paints `outline: none` plus the shadow (§4.3). D5's override
   stands.
4. **Pin-input states and spacing.** The toolkit doc cites state nodes `439:196xx` including a
   disabled state and a 12 px gap; the Figma report lists set `72:5171` without a disabled variant
   and 8 px gaps on the screens. Figma screens drive spacing; the seam decides the gap.
5. **"Verbatim" pending file.** The decisions file says the pending extension is copied verbatim
   from `main`, but `Mutation` already exists in `v2.8.0`, so the new fields must be wrapped in
   `extend type Mutation` and `scalar Iterable` added. Verbatim applies to the type bodies.
6. **Mobile Lighthouse floor.** CI enforces 0.84 (`lighthouse/lighthouserc.mobile.js:35`); the
   profile says 85. The new routes are not Lighthouse-audited, so this feature does not move
   either number.
7. **Open points of the code map.** The code map leaves the `v2.8.0` 2FA content and the next ADR
   number open; the backend report and the decisions file settle them (no 2FA in `v2.8.0`;
   ADR-020).
