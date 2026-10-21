---
status: complete
workflowType: research
project_name: crm
date: 2026-10-06
revised: 2026-10-20
feature: user-settings
issue: https://github.com/VilnaCRM-Org/crm/issues/330
inputDocuments:
  - specs/user-settings/planning-artifacts/run-summary-user-settings-2026-10-06.md
  - specs/enterprise-app-shell/planning-artifacts/prd-enterprise-app-shell-2026-06-26.md
  - CLAUDE.md
  - docs/feature-flags.md
  - src/api/contracts/README.md
  - src/modules/user/README.md
  - config/module-shape.json
  - config/metrics-policy.json
  - config/class-naming-policy.js
  - config/di-collaborator-policy.js
  - config/performance-budget.json
  - .dependency-cruiser.js
  - tests/utils/a11y/axe-config.ts
---

# Research: user settings

This artifact is self-contained: the brief, PRD, architecture and epics read only this file. Ids
`U1`-`U11` (user, binding), `D1`-`D18` (main agent) and the `R` amendments refer to the run's
decision record and are restated where they shape a finding.

> Reconciliation 2026-10-16: the crm evidence below was gathered at `origin/main` `58099168` and is
> kept as gathered. Branch `feat/330-user-settings` now stacks on PR #340 (crm #315 implemented)
> over PR #333 (merged), so these findings are superseded where they differ: the session store is
> `useAuthStore` (Zustand, ADR-002 "Current rules") registered as `AUTH_TOKENS.AuthStore`, not a
> reactive var; no feature flag exists (`FeatureFlag` is `never`; issue #309 removed
> `forgotPassword`); only ADR-001 and ADR-002 exist, so no ADR is written; crm #315 added the
> feature and module `transformers/` and `data-providers/` folders, `UserServiceErrorTransformer` in
> `src/modules/user/transformers/`, `useAbortableSubmit`, the sign-in notice, a pending GraphQL
> contract mechanism and lazy i18n catalogs (`config/i18n-catalog-policy.json`); `A11Y_EXCEPTIONS`
> holds eight entries; the Lighthouse URL list holds eight URLs; sign-up's e-mail label is "E-mail"
> since #311; ui-toolkit is pinned at v0.8.0 (still no toast); crm #315 shipped no flag, so no
> `:-true` compose precedent exists; P.1 is this branch stacked on PR #340, not a merged crm #315;
> #330 alone builds the Bearer link and the page shell; no dev flag transform exists (the dev server
> keeps the committed block); and the mock reads no token, because the browser lanes stub every
> settings read (P6 superseded by R28), which retires risk 10 below. Line citations below are as of
> `58099168`. The architecture's reconciliation table and the run summary list the consequences.

## 1. Task framing and scope

Plan the **User settings** surface of the crm `user` module: the Miro component "User settings"
("user initials, changing email, changing password") on a protected page designed in Figma
section `6242:41691`. Only what user-service has a backend for is planned, over GraphQL (U1).

- **In scope (D1):** a `/settings` page with one profile card: a header (monogram avatar,
  greeting, name), the full name (upstream `initials`), the e-mail with a "not confirmed ·
  resend" state, a password change (current + new), one Save / Clear pair, success and error
  toasts, and the right-hand slot column where the 2FA bundle mounts its card.
- **Out of scope, no backend anywhere (D2):** avatar upload, crop and removal (a decorative
  monogram derived from the name replaces the photo; no pencil badge) and the social networks
  section (not rendered). Both get user-service feature issues and crm follow-ups. Delete
  account and a sessions list are neither designed nor planned.
- **Not this feature (D3):** the app-shell sidebar, header and user menu around the page; the
  app-shell PRD excludes navigation menus
  (`specs/enterprise-app-shell/planning-artifacts/prd-enterprise-app-shell-2026-06-26.md:192`).
  The v1 entry point is one flag-gated home-page link to `/settings`, shared with 2FA.

> Assumption: "full name" in the UI and `initials` in the API are one value. user-service keeps
> a free string of up to 255 characters there, and crm sign-up already sends the full name as
> `initials` (`src/modules/user/features/auth/repositories/registration-api.ts:78-84`).

### 1.1 Ubiquitous language

| Term             | Meaning in this feature                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| User             | the user-service aggregate `User { id, confirmed, email, initials }`    |
| User IRI         | the GraphQL `id`, `/api/users/<uuid>`; the only id `updateUser` takes   |
| Full name        | the UI label of `initials`                                              |
| Current password | the secret `updateUser` verifies on every call (input field `password`) |
| New password     | optional `newPassword`, checked by the shared password policy (U3)      |
| Confirmation     | `confirmed`; an e-mail change resets it and mails a new link            |
| Profile update   | one `updateUser` call: current password plus the changed fields         |
| Owner scope      | main's rule that a caller reads and writes only its own `User`          |

The scope is crm's `user` module talking to user-service; the settings data layer turns
user-service answers into crm outcomes and i18n keys (U8).

## 2. Sources and method

- **crm:** worktree `/home/dima/Desktop/crm-worktrees/user-settings-planning`, branch
  `docs/user-settings-planning` from `origin/main` `58099168`. Every `path:line` here was
  re-opened in this worktree on 2026-10-06; wrong ranges in the evidence reports were corrected.
- **user-service**, two SHA-pinned trees:
  - `M` = `main` at `a95c1e854bf21770b7fc630611a8257b0f9c600b` (2026-09-28):
    <https://github.com/VilnaCRM-Org/user-service/blob/a95c1e854bf21770b7fc630611a8257b0f9c600b>
  - `T` = tag `v2.8.0`, commit `56656f90fc5bd2725d41641ed9ca41856c14227a` (2025-08-23):
    <https://github.com/VilnaCRM-Org/user-service/blob/56656f90fc5bd2725d41641ed9ca41856c14227a>
  - `M:<path>#La-Lb` means that base, then `/<path>`, then the GitHub line anchor.
- **Spot checks:** re-fetched with `gh api …/contents/<path>?ref=<sha>` and matched: the SDL
  blocks of §4.3 at both SHAs (byte-identical), `User.yaml`, `validation.yaml`, both
  `security.yaml` files, and the PHP ranges cited in §4.4-§4.7.
- **Design:** Figma file `xZ7ccrH6d4QyqLQsayFSEX`, page "Design CRM" `0:1`, group `6242:41691`;
  Miro board "Frontend C4 Architecture VilnaCRM" (`uXjVMG64hTs=`), read from screenshots.
- **Sibling bundles:** crm #315 create-new-password in
  `/home/dima/Desktop/crm/specs/create-new-password/planning-artifacts/` (readiness `complete`,
  uncommitted); two-factor authentication (research, brief, PRD) in
  `/home/dima/Desktop/crm-worktrees/2fa-planning/specs/two-factor-authentication/`.
- **Evidence reports** (job scratch, outside the repository): `figma-report.md`,
  `miro-report.md`, `backend-report.md`, `crm-current-state.md`.

> Assumption: upstream evidence is cited as `M:` or `T:` plus path and line anchor instead of a
> full permalink, because a permalink runs to 110-170 characters against the 100-character line
> limit. Each citation still resolves to exactly one SHA-pinned URL.

## 3. Design evidence

### 3.1 Figma frames

Frames are misnamed "Помилка 404 desktop/tablet/mobile" (a copied template).

| State                                  | Desktop 1440 | Tablet 1024 | Mobile 375  |
| -------------------------------------- | ------------ | ----------- | ----------- |
| Resting; 2FA setup card (tooltip open) | `313:10242`  | `313:10480` | `313:10606` |
| 2FA connected                          | `315:11502`  | `315:12300` | `318:13133` |
| Socials linked + two success toasts    | `315:11754`  | `315:12551` | `318:13410` |
| E-mail not confirmed                   | `386:27830`  | `386:27945` | `386:28059` |
| Collapsed sidebar (shell)              | `377:20051`  | `377:20163` | none        |

Section titles: `313:10633`, `377:20274`, `386:25761`, `386:28172`. The rail states
(`386:26290`, `26467`, `26504`, `26541`), menu states (`386:26243`, `26326`, `26420`, `26373`),
sidebar and header (search, notifications, tasks, user chip) are shell work (D3).

### 3.2 Page content (desktop `313:10242`)

- Title "Настройка", subtitle "Описание страницы настроек"; the right column holds the 2FA card
  and a second card holds social networks (Google, Facebook, GitHub, Twitter; out of scope).
- Profile card: a 100 px avatar with a pencil badge; "Добро пожаловать!" in `#969B9D` and the
  name in bold; field "Ваше ФИО"; heading "Личные данные" over "Ваш e-mail"; heading "Пароль"
  over "Текущий пароль" and "Новый пароль" (masked, eye toggle, no confirmation field); one
  footer pair "Сохранить изменения" (primary pill) and "Очистить" (outlined pill).
- `386:27830`: "Email не подтвержден · Отправить повторно" under the e-mail field.
- Toasts (`315:11754`, `318:13410`): stacked bottom-right on desktop, full width at the bottom
  on mobile; check-circle `#38B386` on `#E8F4EF`, close ×; "Ви успішно змінили пароль". Success
  only, in Ukrainian on a Russian page.

### 3.3 Tokens

Font/100 `#1A1C1E`, Font/200 `#404142`, Font/250 `#57595B`, Font/300 `#969B9D` (placeholder),
Font/400 `#D0D4D8` (stroke), Font/500 `#EAECEE` (line), Primary `#1EAEFF`, Dark primary
`#1B2327`, Brand gray `#E1E7EA`, shaded `#F4F5F6`, Grey bg `#FBFBFB`, Success `#38B386`, Light
green `#E8F4EF`. Golos for headings and buttons, Inter for body. No error colour in the section;
crm's is `#DC3939` (`src/styles/colors.ts:15-17`).

### 3.4 Contrast (WCAG 2.1 AA, computed)

| Pair                                 | Ratio | Verdict                                   |
| ------------------------------------ | ----- | ----------------------------------------- |
| `#969B9D` greeting on white          | 2.81  | fail; use `#57595B` (7.03) (D15)          |
| `#1EAEFF` resend link on white       | 2.46  | fail; use `linkText` `#0074B5` (5.04)     |
| white on `#1EAEFF` Save button       | 2.46  | existing debt, #276 exception (§5.6)      |
| `#1A1C1E` on `#E8F4EF` success toast | 15.15 | pass                                      |
| `#38B386` icon on `#E8F4EF`          | 2.34  | below 3:1; icon decorative, `aria-hidden` |
| `#1A1C1E` on `#FDECEC` error toast   | 14.96 | pass                                      |
| `#DC3939` icon on `#FDECEC`          | 3.92  | pass for a graphic (3:1)                  |
| `#DC3939` field error text on white  | 4.48  | fail; existing app-wide style             |
| `red` `UIForm` banner text on white  | 4.00  | fail; existing (§5.5)                     |
| `#4CAF50` theme success on white     | 2.78  | never usable as text                      |
| `#D0D4D8` input stroke on white      | 1.49  | existing field style app-wide             |

The field error row is new evidence: `MuiFormHelperText` error text uses `paletteColors.error.main`
at 14 px, weight 500 (`src/components/ui-form-input-field/theme.ts:98-110`), so it is normal
text that needs 4.5:1, and settings shows field errors (wrong current password, taken e-mail).

> Assumption: U11 binds field error text too. The architect fixes it at its source (the token
> read at `ui-form-input-field/theme.ts:109`) rather than adding an `A11Y_EXCEPTIONS` entry, and
> owns the resulting change to auth error-state visuals.

### 3.5 Missing from the design

1. Error toasts: per U2 the same layout as success, error styling, `role="alert"`; no frame.
2. Field and server errors: wrong current password, weak new password, invalid or taken e-mail,
   empty or malformed name.
3. The state right after an e-mail change (only "not confirmed · resend" is drawn).
4. Loading (page skeleton, busy Save) and a page-load failure with a retry.
5. Avatar dialog, unlink confirmation, last-sign-in-method protection (out of scope, D2).
6. 2FA code entry, recovery codes, disable confirmation (2FA bundle).

### 3.6 Copy defects

- The copy is Russian; the app is Ukrainian with an English fallback, so it is translated, not
  copied (D14). Page `h1` "Налаштування".
- The subtitle "Описание страницы настроек" is placeholder text.
- The mobile header reads "Management board / Вы можете добавлять, удалять, настраивать
  расположение виджетов", a dashboard title pasted into the frame.
- "Личные данные" heads only the e-mail field though the name above it is personal data too.

> Assumption: the subtitle is "Керуйте своїм ім'ям, електронною поштою та паролем." / "Manage
> your name, e-mail address and password." until the design owner supplies copy; mobile keeps
> the desktop title and subtitle.
>
> Assumption: the design's order stays, but headings name what they hold: "Особисті дані" over
> name and e-mail, "Пароль" over the password pair.

### 3.7 Miro

Board `uXjVMG64hTs=`, component frame "User module" (widget `3458764570351764591`), all React
components: `User profile settings` ("Page for user profile settings on VilnaCRM") fans out
(dashed, unlabelled) to `User settings` (widget `3458764570351803375`, "user initials, changing
email, changing password"), `2FA` and `Social networks`. Each child drops onto one bus into
`API` (user-service) whose only label, "1 request to API", sits by the Sign-up branch.
`User profile` ("Profile in header, user image and menu with button user settings and log-out")
has one edge, "Log-out" into `BFF`; **no** edge joins it to the settings page, no settings
component touches State or BFF, and the CRM container fan-out does not reach the page. At code
level `UserProfile [component]<route>` links `UserEntity`, `SocialNetworks`, `2FASettings` and
`UserProfileSettings`, which links `UserEntity` and `RestorePassword` → `RestorePasswordDTO`.
The context frame puts "sidebar, header, footer, user menu" in the Core module.

Stale template labels, not requirements: `CRM [Container: JavaScript and Angular]` and
`Mobile App [Container: Xamarin]` ("Internet Banking"), and `State [Redux]` ("Stores user
registration information"; crm then used a reactive var and Apollo, since replaced by the Zustand
stores of PR #333, ADR-002 "Current rules").

## 4. Upstream contract (user-service)

### 4.1 Versions

crm pins `GRAPHQL_SCHEMA_VERSION=v2.8.0` and `OPENAPI_SPEC_VERSION=v2.8.0` (`.env.example:83,86`).
`main` is 71 commits ahead of v2.8.0. A restarted series v0.1.0-v0.8.0 (GitHub's "Latest" is
v0.8.0) is on main's lineage but lower semver; v0.9.0 is a stray diverged tag. Unreleased in any
tag: GraphQL sign-in, refresh, sign-out and 2FA, social OAuth, owner-scoped reads, GraphQL rate
limiters, first-party token validation and the authentication firewall itself.

### 4.2 Capabilities

| Capability          | v2.8.0           | main `a95c1e85`        | Operation                    |
| ------------------- | ---------------- | ---------------------- | ---------------------------- |
| Read current user   | lists every user | owner-scoped, ≤ 1 row  | `users`, `user(id)`; no `me` |
| Id after sign-in    | no sign-in op    | JWT `sub` only         | `signInUser` (main)          |
| Update full name    | yes, no auth     | owner only             | `updateUser`                 |
| Update e-mail       | yes, no auth     | owner; unconfirms      | `updateUser`                 |
| Change password     | yes, no auth     | owner; revokes others  | `updateUser`                 |
| Resend confirmation | yes, any id      | owner only             | `resendEmailToUser`          |
| Confirm e-mail      | yes              | public                 | `confirmUser(token)`         |
| Avatar              | no               | no                     | none                         |
| Social link/unlink  | no               | sign-in auto-link only | none (REST redirects)        |
| Delete account      | yes              | owner, no re-auth      | `deleteUser`                 |
| 2FA                 | no               | 6 mutations            | 2FA bundle                   |

Every operation settings uses (`users`, `updateUser`, `resendEmailToUser`) is in the pinned
v2.8.0 SDL and byte-identical on main. What v2.8.0 lacks is behaviour (auth, owner scope,
session revocation), not schema, so no pending schema extension is needed (D5).

### 4.3 SDL (verbatim)

`T:.github/graphql-spec/spec#L3-L16`, `#L39-L44`, `#L103-L106`, `#L161-L187`, identical to
`M:.github/graphql-spec/spec#L45-L58`, `#L142-L147`, `#L226-L229`, `#L605-L631`. The connection
types (`T#L47-L57` = `M#L150-L160`) are
`UserCursorConnection { edges: [UserEdge], pageInfo: UserPageInfo!, totalCount: Int! }` and
`UserEdge { node: User, cursor: String! }`.

```text
  user(id: ID!): User
  users(
    "Returns the first n elements from the list."
    first: Int

    "Returns the last n elements from the list."
    last: Int

    "Returns the elements in the list that come before the specified cursor."
    before: String

    "Returns the elements in the list that come after the specified cursor."
    after: String
  ): UserCursorConnection

type User implements Node {
  id: ID!
  confirmed: Boolean!
  email: String!
  initials: String!
}

  "Updates a User."
  updateUser(input: updateUserInput!): updateUserPayload

  "ResendEmailTos a User."
  resendEmailToUser(input: resendEmailToUserInput!): resendEmailToUserPayload

"Updates a User."
input updateUserInput {
  clientMutationId: String
  id: ID!
  newPassword: String
  password: String!
  email: String
  initials: String
}

"Updates a User."
type updateUserPayload {
  user: User
  clientMutationId: String
}

"ResendEmailTos a User."
input resendEmailToUserInput {
  clientMutationId: String
  id: ID!
}

"ResendEmailTos a User."
type resendEmailToUserPayload {
  user: User
  clientMutationId: String
}
```

The current-user read is `users(first: 1) { edges { node { id email initials confirmed } } }`
(D4). On main the collection provider returns at most the caller's own record and an empty
connection for an unknown caller
(`M:src/User/Application/Provider/UserCollectionProvider.php#L45-L73`). The returned `id` is the
IRI `updateUser` and `resendEmailToUser` take, so no JWT decoding is needed.

### 4.4 `updateUser` on main

- **Security:** `is_granted('ROLE_USER') and object.getId() == user.getId().__toString()`,
  `write: false` (`M:config/api_platform/resources/User.yaml#L108-L126`); `resendEmailToUser`
  has the same owner expression (`#L127-L135`); the collection needs `ROLE_USER` (`#L74-L79`).
  Missing `email` or `initials` keep the current value and a missing `newPassword` becomes
  `password` (`M:src/User/Application/Resolver/UserUpdateMutationResolver.php#L39-L41`); the
  resolver returns the mutated entity (`#L56`), so the payload carries the new values.
- **Validation** (`M:config/validator/validation.yaml#L139-L175`): `email` Email, max 255,
  `UniqueEmail`; `initials` max 255, not whitespace-only and not starting with a digit
  (`M:src/Shared/Application/Validator/Constraint/Initials.php#L34-L41`); **both** `password`
  and `newPassword` max 64, `.{8,}`, `[0-9]`, `[A-Z]`. No lowercase rule, no "differs from old".
- **Handler** (`M:src/User/Application/CommandHandler/UpdateUserCommandHandler.php#L34-L130`):
  checks the old password first (`InvalidPasswordException`, "Old password is invalid"), then
  re-hashes `newPassword`; when it differs from `password` it revokes every **other** session
  and its refresh tokens and keeps the current `sid` (`#L68-L109`).
- **Side effects:** an e-mail change sets `confirmed=false` and mails a link to the new address
  (old links stay valid, #477); a password change mails "password changed" (D17).
- **Unchanged e-mail rejected (inferred, G3):** the own-row exemption reads an `id` route
  attribute that `/api/graphql` lacks
  (`M:src/Shared/Application/Validator/EmailUniquenessValidator.php#L46-L60`), so the caller's
  own e-mail, or a case variant, fails `UniqueEmail`. crm sends `email` only when its trimmed,
  lower-cased value changed (D6).
- **OAuth-created users** hold a random 64-hex password
  (`M:src/OAuth/Application/Factory/OAuthUserFactory.php#L22-L38`) that they never learnt and
  that fails `[A-Z]`, so `updateUser` is closed to them until a password reset (G4).
- **v2.8.0:** no authentication or ownership check, no session revocation, and a combined
  e-mail + password change drops the second domain event
  (`T:src/User/Domain/Entity/User.php#L81-L106`).

### 4.5 Authorization

- **v2.8.0:** `firewalls.main.security: false` (`T:config/packages/security.yaml#L14-L16`).
- **main:** a stateless `DualAuthenticator` accepts `Authorization: Bearer <JWT>` or the
  `__Host-auth_token` cookie (`M:config/packages/security.yaml#L33-L38`;
  `M:src/Shared/Infrastructure/Adapter/DualAuthenticator.php#L95-L111`); claims `sub` (UUID),
  `sid`, `ROLE_USER`, 900 s TTL.
- `/api/graphql` itself is `PUBLIC_ACCESS` (`M:config/packages/security.yaml#L16`); each
  operation's `security:` expression decides. Without a token an owner-checked operation answers
  HTTP 200 with an error whose message contains "Access Denied" or "Forbidden"
  (`M:features/graphql_authentication.feature#L123-L131`;
  `M:tests/Behat/UserGraphQLContext/UserGraphQLResponseContext.php#L170-L182`). Its
  `extensions.status` was not observed on a live server.
- With a token present, an invalid, expired or revoked token answers HTTP 401
  `application/problem+json` with detail "Authentication required." before GraphQL runs
  (`DualAuthenticator.php#L34-L41`, `#L147-L162`): `WWW-Authenticate: Bearer` and the body
  `type` `about:blank`, `title` `Unauthorized`, `status` 401. Settings always sends a token, so
  session expiry reaches it as this transport 401: the D10 sign-out case (a).
- CORS (`M:config/packages/nelmio_cors.yaml#L6`) allows only the request headers `Content-Type`
  and `Authorization`, while every crm Apollo operation sends `X-Request-Id` and
  `X-Correlation-Id` (`src/services/observability/apollo-link-factory.ts:25-33`). A cross-origin
  preflight would fail in production; the defect pre-dates settings but gates production
  enablement, so user-service CORS is widened with G1 or the API is served same-origin.
- Batch requests get HTTP 400; query depth ≤ 20, complexity ≤ 500; introspection off in prod.

### 4.6 Error shapes (GraphQL, main)

- **Violation** (bad or taken e-mail, policy, blank name): HTTP 200, `message`
  `"<path>: <msg>"` (`email: This email address is already registered`), plus API Platform's
  `extensions.status` 422 and `violations[{ path, message }]`; behat asserts only `message`
  (`M:features/user_graphql_operations.feature#L64-L94`), the API Platform lock is unchecked.
- **Wrong current password:** HTTP 200, `{ message: "Old password is invalid" }` and nothing
  else. user-service's normalizer returns `['message' => …]` and drops every extension
  (`M:src/Shared/Application/Normalizer/DomainExceptionNormalizer.php#L29-L41`).
- **Duplicate e-mail (domain path), token not found, not found:** message only; not found reads
  `Item "/api/users/<uuid>" not found.` (`NotFoundExceptionNormalizer.php#L29-L48`).
- **No token, not owner:** "Access Denied."; **invalid or expired token:** HTTP 401
  problem+json, title "Unauthorized" (both §4.5).
- **Rate limited:** HTTP 429 problem+json, type `/errors/429`, with `Retry-After`
  (`M:src/Shared/Application/EventListener/ApiRateLimitListener.php#L79-L98`).

Messages follow the request language; the scenarios in
`M:features/user_graphql_localization.feature#L6-L13` answer
`email: Ця email-адреса вже зареєстрована`. The client therefore branches on HTTP status,
`extensions.status`, `violations[].path` and a few known English messages, never on translated
text (G8). `exceptionToStatus` maps `InvalidPasswordException` → 400 and
`DuplicateEmailException` → 409 (`M:config/api_platform/resources/User.yaml#L3-L13`), but the
GraphQL normalizers discard it. The 401 and 429 bodies are not GraphQL envelopes: Apollo raises
a network error with `statusCode`, which `RegistrationAPI.normalizeError` already maps to
`HttpError` (`src/modules/user/features/auth/repositories/registration-api.ts:87-93`).

### 4.7 Rate limits

Global buckets per IP: anonymous 100/min, authenticated 300/min. Per-endpoint limiters
(`user_update` 10/min/user, `user_delete` 3/min, resend 3/min) key off REST paths only. The
GraphQL mapper knows only `signIn`, `refreshToken`, `completeTwoFactor`, `confirmPasswordReset`,
`signOut`, `signOutAll`, by unsuffixed names
(`M:src/Shared/Application/Resolver/RateLimit/ApiRateLimitGraphQlResolver.php#L126-L144`), so
those are inert (#469) and `updateUser` and `resendEmailToUser` get only the global bucket
(resend: #470; update and delete: untracked, G7). crm must still handle a 429.

### 4.8 Gaps and defects

| Id  | Gap                                                    | Tracked       | Impl | Prod |
| --- | ------------------------------------------------------ | ------------- | ---- | ---- |
| G1  | No tag carries main's auth surface                     | #513, #458    | no   | yes  |
| G2  | No `me` query; no user id in `AuthPayload`             | none          | no   | no   |
| G3  | Own unchanged e-mail rejected (inferred)               | none          | no   | no   |
| G4  | Current password on every change; OAuth users lack one | none          | no   | no   |
| G5  | Avatar: no field, upload or storage                    | none          | n/a  | n/a  |
| G6  | Social link, list and unlink when signed in            | none (#468)   | n/a  | n/a  |
| G7  | GraphQL `updateUser` / `deleteUser` bypass limiters    | none          | no   | no   |
| G8  | Domain and not-found errors carry no `extensions.code` | none          | no   | no   |
| G9  | No `twoFactorEnabled` on `User`                        | none          | 2FA  | 2FA  |
| G10 | `deleteUser` without re-authentication                 | #421 (spirit) | n/a  | n/a  |
| G11 | E-mail-change token not bound to the address           | #477          | no   | no   |
| G12 | A stale token 401s public GraphQL mutations (inferred) | none          | no   | no   |

"Impl" blocks implementation against the mock; "Prod" blocks production enablement. G1 is the
only production blocker: until a release carries owner scope and Bearer validation, `users`
would expose every user and anyone could update anyone (U5). #513 and #458 cover it only partly
(password reset, pipeline); G1 widens #513 or files a sibling. G3 needs an upstream regression
test before filing. G4 also requires the current password to meet the policy. G8 is one issue
shared with the 2FA bundle; whichever session files first, the other comments its operations.
G9 and G10 belong to other work. Filing happens after readiness.

### 4.9 Existing issues (do not duplicate)

Open: #469 (inert GraphQL limiters), #470 (create, reset request, **resend**, confirm lack GraphQL
limiters), #462, #463, #468 (OAuth auto-link pre-hijack), #477, #473, #472, #421, the locale pair
#395 and #349, #458 (release pipeline), #512, and #513 (release with password reset). Fixed on main
and closed: #320 (owner-scoped reads), user-service #315, #318, #312, #313. No issue exists for
G2-G10 or G12.

### 4.10 Known mock drift

The mock answers the settings operations from the pinned schema (U4) as a stateless happy path
(simplification 2026-10-08, R28): the seeded user, one `email:` violation and the owner check
("Access Denied." with `extensions.code` `FORBIDDEN` and `extensions.status` 403, 2FA PRD FR-4).
It reads no token and keeps no state; the transport 401, the wrong password, the taken e-mail,
429, 5xx and the resend time-out are stubbed by msw and `page.route`, which answer the expired
session with the problem+json body and `WWW-Authenticate` header of §4.5. The mock adds
`extensions.code` (`BAD_USER_INPUT` beside the 422 violation) because its `formatError`
rewrites a code-less error (`docker/apollo-server/lib/format-error.ts:13-20`). It sends no
e-mails and answers in English only.

## 5. crm current state

### 5.1 Routing and shell

- `ROUTE_PATHS` has no `settings` key (`src/routes/route-paths.ts:1-9`); the registry is
  `[appRoutes, authRoutes]` (`src/routes/registry.ts:6`). Home is `index: true`, protected,
  chunk `home` (`src/routes/app-routes.ts:7-12`); auth registers two public routes with
  `titleKey` (`src/modules/user/features/auth/routes/index.ts:4-20`). `RouteGuard` is
  `'protected' | 'public'`, `RouteMeta` is `{ titleKey?, permission? }`
  (`src/routes/types/app-route.ts:3,11-14`).
- The composer splits by guard (`src/routes/route-composer.tsx:54-58`) and mounts protected
  pages under `ProtectedRoute` → `AppLayout`, error landmark `region` (`:60-74`). A protected
  page is never reloaded: the memory-only token would not survive
  (`src/routes/route-mapper.tsx:28-40`).
- The router is built at module evaluation (`src/routes/routes.tsx:6`), reached through
  `src/app.tsx:4` from `src/index.tsx:18`, before `index.tsx` parses the runtime config in its
  guarded `try` (`src/index.tsx:44-66`).
- `ProtectedRoute` renders `<Outlet context={{ signOut }}>` or redirects to `/sign-in` with
  `state={{ from: location, focusMain }}`
  (`src/modules/user/features/auth/components/protected-route/index.tsx:8-19`), so clearing the
  token alone redirects with `state.from` = the current page. `ProtectedOutletContext` is
  `{ readonly signOut: () => void }` (`src/routes/types/protected-outlet-context.ts:1-3`).
- `AppLayout` is a focusable `<main>` plus a lazy footer
  (`src/components/layouts/app-layout.tsx:30-44`); no header, sidebar or user menu exists, and
  the only navigation is home's sign-out button (`src/features/home/index.tsx:17,26-28`).
- Each `ROUTE_PATHS` key needs `tests/e2e/route-coverage.tsv` rows (rules `:1-7`); the axe scan
  lists routes, `seedAuth: true` when protected (`tests/e2e/a11y/routes.a11y.spec.ts:18-23`);
  Lighthouse audits `/`, `/sign-up`, `/sign-in` only (`lighthouse/constants.js:15-19`).

### 5.2 Auth and session

- `AuthStateVar` is a memory-only reactive var, seeded only by the test-only token seed and
  exported as a module singleton (`src/modules/user/features/auth/stores/auth-var.ts:6-26,53-55`),
  registered by value under `AUTH_TOKENS.AuthStateVar` (`src/modules/user/config/di.ts:46`).
  Logout clears the observability user and resets it
  (`src/modules/user/features/auth/stores/index.ts:43-46`). (Revision 2026-10-08: replaced by
  the `useAuthStore` Zustand store in the chore `zustand-client-state`, still memory-only.)
- Sign-in is a REST placeholder posting to `/api/users` with `retry: true`
  (`src/modules/user/features/auth/repositories/login-api.ts:26-43`;
  `src/config/api-config.ts:3-6`). Afterwards the client holds only the token and the
  lower-cased submitted e-mail (`src/modules/user/store/login-response-mapper.ts:22-25`;
  `src/modules/user/features/auth/stores/auth-store-actions.ts:76-84`), never the IRI,
  `initials` or `confirmed`.
- **No request carries `Authorization`.** REST sends correlation ids, `Accept` and
  `Content-Type` (`src/services/https-client/http-request-config-builder.ts:83-101`); the Apollo
  chain is `[correlationLink, errorLink, HttpLink]` setting only the two correlation headers
  (`src/services/observability/apollo-link-factory.ts:19-33`). "authorization" and "bearer"
  appear only in the scrubber (`src/services/observability/pii-scrubber.ts:7,16`).

### 5.3 GraphQL plumbing, mock server, `formatError`

- One `ApolloClient` per container under `AUTH_TOKENS.ApolloClient` with a process-wide
  `new InMemoryCache()` (`src/modules/user/config/di.ts:57-67`); no retry link by design and an
  error link that reports without variables
  (`src/services/observability/apollo-link-factory.ts:17-22,35-51`). No `fetchPolicy` is set
  anywhere in `src`.
- `RegistrationAPI`, the only GraphQL consumer, injects the client, sends `variables.input` with
  `clientMutationId: uuidv4()` and the abort signal, parses with zod and maps
  `networkError.statusCode` to `HttpError`
  (`src/modules/user/features/auth/repositories/registration-api.ts:24-30,48-70,78-93`). Its
  document arrives through `create-user-mutation.ts:5` in the same folder; the DI policy admits
  only `*-mutation.ts` seams (`config/di-collaborator-policy.js:291-298`), so a `users` query
  seam needs a policy edit. Codegen reads `src/modules/**/*.graphql` against the pinned SDL with
  `scalars: { ID: 'string' }` (`codegen.ts:9-29`).
- The mock serves one schema file (`docker/apollo-server/lib/server.ts:33-48`), does no auth
  (`:53-69`) and resolves only `Mutation.createUser`
  (`docker/apollo-server/lib/resolvers.ts:55-84`). `formatError` masks `INTERNAL_SERVER_ERROR`,
  `BAD_REQUEST` and parse failures (`docker/apollo-server/lib/format-error.ts:13-32`), so every
  mock error needs a code.
- `AuthError` is `{ kind, displayMessage, retryable, status?, issues?, aborted? }`
  (`src/modules/user/features/auth/types/auth-error.ts:1-18`). Security categories are
  `login | registration | transport | render`
  (`src/services/types/security-events/security-event.ts:4-11`).

### 5.4 Feature flags

- Four declaration sites hold only `forgotPassword`:
  `src/config/runtime/types/feature-flag.ts:1-5`, `src/config/runtime/feature-flag-service.ts:4-6`,
  `src/config/runtime/app-config-schema.ts:18-22` and `public/index.html:27-29`. The env line is
  `.env.example:66`; the test stack passes it as `${…-}` (`docker-compose.test.yml:21`); the dev
  compose has no passthrough and the dev server does not render the block (crm #315 adds both).
- `useFeatureFlag` is a synchronous, container-free read (`src/hooks/use-feature-flag.ts:8-10`).
  `tests/unit/tooling/runtime-config-contract.test.ts` ties the four sites (`:105-117`),
  `.env.example` (`:119`) and the docs (`:152-156`), and forbids shipping `forgotPassword` on
  without its route (`:195-204`).
- **No mechanism gates a route by a flag**; flags gate links (`docs/feature-flags.md:106-114`).
  `appConfigSource.snapshot()` reads the DOM lazily
  (`src/config/runtime/app-config-source.ts:14-23`), so the router could read a flag while it
  is built, but that read precedes the guarded `load()` and a malformed block would throw
  outside the accessible bootstrap fallback (`src/index.tsx:44-66`).

### 5.5 UI building blocks

- Shared: `UIButton`, `UIContainer`, `UITypography`, `UITextField`, `UIFormInputField`, `UIForm`,
  `UILink`, `UILiveStatus`, `UIOfflineNotice`, `UIAsyncSection`, `UIBackToMain`, `UIFooter`,
  `UISkeleton*` (`src/components/skeletons/`), `RouteFallback`, `UIErrorBoundary`, `NotFound`.
  No avatar, toast, snackbar, card, dialog or chip.
- `UIForm` has one contained `loading` submit (`src/components/ui-form/index.tsx:59-81`) after
  banner, header, offline notice and children (`:100-113`); the banner is `role="alert"` in
  `color: 'red'` (`:29`). It has no secondary action and exposes no `setError`
  (`src/components/types/ui-form/index.ts:12-29`); `resetOnSuccess` resets to the original
  `defaultValues` (`index.tsx:50-57`), which `useForm` reads once, in `onTouched` mode
  (`src/components/ui-form/use-ui-form.ts:11`).
- `UIAsyncSection` is list-shaped (status from `isLoading`, `hasError`, `count`) with no retry
  (`src/components/ui-async-section/index.tsx:8-46`). `UILiveStatus` and `UIOfflineNotice` are
  `role="status"` regions (`src/components/ui-live-status/index.tsx:18-24`;
  `src/components/ui-offline-notice/index.tsx:23-31`).
- Auth-internal pieces, unreachable from a sibling feature (§5.7), in
  `src/modules/user/features/auth/components/form-section/`: `components/form-field.tsx:11-42`;
  `components/password-field.tsx`, whose eye `IconButton` has `aria-pressed` and a localized
  name (`:18-41`) but which hard-codes `name="password"` (`:61`) and required + policy rules
  (`:56-59`); container-free validator singletons `validations/index.ts:10-22`,
  `validations/password.ts:6-12` (8-64, a digit, `\p{Lu}`, `\p{Ll}`), `validations/name.ts:5-27`
  (letters, two or more words, ≤ 255) and `validations/email.ts:9-17`, with `sign_up.form.*`
  message keys.
- ui-toolkit v0.6.0 (`package.json:14`) ships no toast, snackbar, alert or avatar artifact
  (`config/ui-toolkit-checksums.json`); eight seams are adopted (`eslint.config.mjs:532-541`) and
  every other subpath stays forbidden until a reviewed adoption (`docs/ui-toolkit.md`).

### 5.6 i18n, palette, accessibility exceptions

- Catalogs: `src/**/i18n/{en,uk}.json`, merged into `src/i18n/localization.json` by
  `make i18n-generate`; auth owns eight namespaces (`sign_up`, `auth`, `buttons`, …), home owns
  `home.*` (`src/features/home/i18n/en.json:1-8`); no `settings` or `profile` keys exist.
- Palette (`src/styles/colors.ts`): primary `#1EAEFF`, `linkText #0074B5` (`:2-11`), error
  `#DC3939` (`:15-17`), success `#4CAF50` (`:18-20`), grey 50 `#969B9D` (`:38-40`),
  `decorative.divider #57595B` (`:58-60`), text `#404142` / `#969B9D` / `#1A1C1E` (`:61-65`).
  No `#E8F4EF` or `#FDECEC` token exists.
- `A11Y_EXCEPTIONS` holds four `color-contrast` entries tracked in #276
  (`tests/utils/a11y/axe-config.ts:27-54`), one being the contained submit
  `form button[type="submit"].MuiButton-contained` (`:34-39`). A Save rendered by `UIForm`
  matches it; grey text, a primary-blue link or a secondary "Clear" button does not, and no new
  entry is allowed (D15).

### 5.7 Constraints that shape the design

- **Metrics** (`config/metrics-policy.json:3-29`): cyclomatic ≤ 10, cognitive ≤ 15, ABC ≤ 17,
  ≤ 3 arguments, ≤ 3 exits, function LLOC ≤ 10; per file ≤ 10 functions, ≤ 6 closures, ≤ 15
  total, LLOC ≤ 120; per class ≤ 8 public methods, ≤ 2 public attributes, WMC ≤ 30.
- **The user composition root is near its cap.** `UserModuleRegistrar` already has nine
  methods and three closures (`src/modules/user/config/di.ts:31-112`); a settings registration
  method plus a Bearer-link builder would cross the 10-function file limit, so the settings
  registrations and the link fold into the existing `UserModuleRegistrar` steps (R11), and
  `di.ts` keeps nine functions. Settings adds no closure either (simplification 2026-10-08):
  every class takes at most three `@inject` parameters, so no deps bag is needed. Amendment
  2026-10-20: the Bearer link's five collaborators need a `SessionLinkDeps` bag after all, and its
  closure fits no existing step under the function Halstead volume cap, so a `registerSessionLink`
  step takes `di.ts` to ten functions, the cap, and four closures (architecture §6).
- **Class names** (`config/class-naming-policy.js:42-168`): suffixes such as `Repository`,
  `Service`, `Factory`, `Mapper`, `Adapter`, `Guard`, `Validator`, `Signals`, `Var`, `Loader`,
  `API`, `Controller`; `Manager` and `Helper` are banned (`:19-20`). (Revision 2026-10-08: the
  chore #332 removes `Controller` and adds `Transformer`, after the Miro board's frontend
  layers, and this feature uses neither `Controller` nor a new `Service`; architecture §17.)
- **DI policy** (`config/di-collaborator-policy.js`): gated folders are services, utils, module
  store and feature repositories, stores, utils (`:34-48`); module `lib/` is not gated; the
  `base-api.ts` carve-out applies to any feature's `repositories/` (`:299-309`).
- **Dependency-cruiser** (`.dependency-cruiser.js`):
  - `no-cross-feature-imports` (`:590-602`) forbids importing **any** path of a sibling
    feature, barrel and type-only included: settings cannot import `@auth`.
  - `no-components-import-modules` (`:279-289`) and `no-components-import-feature-internals`
    (`:548-556`): pieces moved to `src/components` receive the policy as props.
    `no-lib-to-features` (`:662-672`): module `lib` may not import features, features may
    import it.
  - `no-apollo-client-outside-data-layer` (`:374-398`): only repositories, module `di.ts` and
    the link factory value-import `@apollo/client`; no `useQuery` or `useMutation`.
  - `components-no-direct-injectable-import` (`:446-482`) exempts only the auth feature and
    `no-paint-path-import-di-bridge` (`:483-503`) keeps auth off `@/providers/di`, so a separate
    settings feature may and must use `useService`.
- **Module shape** (`config/module-shape.json:5-20`): a module allows `config`, `features`,
  `hooks`, `lib`, `store`, `types`, `utils` (no `components`); a feature allows `assets`,
  `components`, `hooks`, `i18n`, `repositories`, `routes`, `stores`, `types`, `utils` (crm #315
  adds `data-providers` and `transformers` for the board's Data provider and Transformer). The
  module README already scopes it as "Auth, registration, 2FA, and profile"
  (`src/modules/user/README.md:3`).
- **Scaffolder:** `make new-feature module=user feature=settings` writes
  `container.registerSingleton(USER_TOKENS.SettingsRepository, SettingsRepositoryImpl)` into
  `src/modules/user/config/di.ts` (`plopfile.ts:165,482-483`), but the module's token object is
  `AUTH_TOKENS` (`src/modules/user/config/tokens.ts:1`). Inferred from source, not run: the
  generated wiring does not compile until the token name is fixed by hand.
- **Performance** (`config/performance-budget.json:3-15`): eager entrypoint 470 000 raw /
  165 000 gzip, any asset 400 000 raw / 130 000 gzip, Lighthouse 265 000 script / 480 000 total.
  Settings must be its own lazy chunk; the deferred DI chunk grows only by the settings
  data-access classes and the Bearer link registered in `user/config/di.ts`, measured in the
  pull request with no budget raised (PRD NFR-5, architecture §10; amendment 2026-10-21, the
  earlier "must not grow" wording predated the link of §7).
- **ADR numbers (superseded 2026-10-16):** on 2026-10-06 the plan reserved the next ADR number;
  PR #333 has since deleted every ADR from 003 up, so no ADR is written and the decisions go into
  `src/modules/user/README.md` (U10).

> Assumption: the current-user read also uses `fetchPolicy: 'no-cache'`. The cache is
> process-wide (`src/modules/user/config/di.ts:65`); a cached `User` would hold the e-mail (PII)
> and go stale against a `no-cache` mutation, while the form re-reads from the payload (D7).
>
> Assumption: an empty `users` connection is a read failure with a retry, not a sign-out; an
> expired or revoked session reaches the client as the transport 401 instead (§4.5).

## 6. Sibling bundles

### 6.1 crm #315 create-new-password

The settings "Пароль" block (`313:10242`) is the only drawn new-password field; crm #315 accepted
its own form as a composition of record without a frame
(`…/prd-create-new-password-2026-10-05.md:191,814`). U3 makes the settings block the design of
record for both: one password field, one policy. crm #315 places every shared piece under `@auth`:

| crm #315 piece                                    | crm #315 § | Settings use                  |
| ------------------------------------------------- | ---------- | ----------------------------- |
| `PasswordValidator` + `evaluate()`                | 5.8        | new-password policy           |
| `PasswordPolicyRules` (live rule list)            | 5.8        | rules under "Новий пароль"    |
| `PasswordField` (`name`, `rules`, `describedBy`)  | 5.10       | current and new password      |
| `ServerFieldError` (`setError` + `setFocus`)      | 5.11       | server field errors           |
| `UIForm` `errorAction`, `titleRef` (shared)       | 5.11       | banner Retry; plus Clear slot |
| `no-cache`, no retry, abort check before `mutate` | 5.1        | same rules for `updateUser`   |
| Pending-contract mechanism                        | 5.16       | not needed (D5)               |

Facts that carry over (`…/architecture-create-new-password-2026-10-05.md:763-815`): the policy
narrows uppercase to ASCII `[A-Z]`, **keeps** the crm-only lowercase rule `\p{Ll}` and lists all
four rules live (`password_policy.rules.*`); `ServerFieldError` relies on re-validation clearing
the server error on the next edit; `errorAction` renders inside the `role="alert"` banner.

- **Placement problem.** `no-cross-feature-imports` (`.dependency-cruiser.js:590-602`) makes
  every `@auth` piece unreachable from `features/settings`. D11 resolves it: the policy,
  full-name and e-mail validators move to module level (`src/modules/user/lib/`), and
  `PasswordField`, `PasswordPolicyRules`, `ServerFieldError` and the eye icons move to
  `src/components` with the policy passed in as props. Prerequisite P.1: this branch stacked on
  PR #340 (crm #315 implemented); the move is the first settings story unless #340 changes before
  it merges.
- **Design deltas.** Settings has current + new and no confirmation; crm #315 has new +
  confirmation (`name="confirmPassword"`, equality rule). The current-password field takes only
  `required` and `autoComplete="current-password"`; upstream also runs the policy on `password`,
  so a 422 on `password` maps to that field (D6). The single Save / Clear pair lands in the same
  shape as crm #315's `UIForm` additions.
- **Shared infrastructure crm #315 brings:** the dev-stack `APP_CONFIG_FLAG_*` `:-true`
  passthroughs and the dev-only rsbuild runtime-block renderer (§5.14 of its architecture), and
  the first edit of the security category union (`password_reset`).

### 6.2 Two-factor authentication

The 2FA bundle (#331) has research, brief and PRD. Agreed with that session on 2026-10-06
(coordination items A1 and A2, recorded here as D10 and D12). FR ids below are those of
`…/two-factor-authentication/planning-artifacts/prd-two-factor-authentication-2026-10-06.md`,
cited by id only because that bundle is still being edited:

- **One page.** `/settings` is one `ROUTE_PATHS` key served from
  `src/modules/user/features/settings`: protected, chunk `settings`, `h1` "Налаштування", a grid
  whose right column is the 2FA slot. Settings builds the route contract and the shell, and 2FA
  imports them (simplification 2026-10-08: one owner per shared piece); the route is always
  registered, and a render-time gate shows the not-found page
  unless `userSettings` is on, whatever `twoFactorAuth` says (R17); `twoFactorAuth` only decides
  whether the 2FA card renders inside the page (FR-25), so enabling 2FA in an environment needs
  `userSettings` on there too. The 2FA card lives in `features/settings`; no settings state goes
  into `@auth`.
- **Entry link.** Settings builds one home link and 2FA reuses it (D3). Like the page, the link
  shows only while `userSettings` is on.
- **Bearer link.** `Authorization: Bearer <token>` on GraphQL requests, read per request, in the
  deferred DI chunk (FR-24); built once by settings in the user module composition root and
  imported by 2FA (D10).
- **Shared sign-out rule (D10, R28).** The link signs out and redirects to `/sign-in` with
  `state.from` only on a transport HTTP 401 of a non-anonymous operation, the answer
  user-service gives an invalid, expired or revoked token before GraphQL runs (§4.5); never for
  anonymous operations (`signInUser`, `completeTwoFactorUser`). Every GraphQL-level refusal
  stays with each feature's Data provider; "Access Denied." means the token is already gone, so
  it maps to session ended with no action (R17).
- **Mocks are stateless (R28).** Each bundle's mock answers its own operations with a happy
  path; msw and `page.route` stubs answer every error shape, the expired session with §4.5's
  exact problem+json body and headers. FR-4 of the 2FA PRD pins that crm repositories never
  read `extensions.code`: it only carries a mock message through `formatError`.
- **Toast.** Built and used by settings only (R16): the 2FA PRD reports outcomes in in-card
  status regions and `role="alert"` banners (FR-35).
- **Security signals.** Settings adds none (D16 withdrawn 2026-10-08).
- **G8** is one upstream issue for both bundles.

> Assumption: the settings Data provider and its Transformer follow the FR-4 rule. They
> recognise a wrong current password by the message "Old password is invalid" and violations by
> `extensions.status` 422 or the `"<path>: "` prefix. They never branch on the mock-only
> `extensions.code`, or the mock would pass a path the real server never takes (D8).

## 7. Risks

1. **Production exposure before G1:** against v2.8.0, `users(first: 1)` returns an arbitrary
   user and `updateUser` needs no token; `userSettings` stays off in production (U5).
2. **Prerequisite chain:** this branch stacked on PR #340 (crm #315 implemented) and crm #315's
   pieces moved out of `@auth` (P.1); #330 alone builds the Bearer link and the page shell, which
   #331 imports; a change to #340 before it merges blocks passwords.
3. **Scaffolder mismatch:** `USER_TOKENS` against `AUTH_TOKENS` (§5.7); budget the manual fix.
4. **Composition-root cap:** settings wiring and the Bearer link fold into the existing
   `UserModuleRegistrar` steps (R11), so `src/modules/user/config/di.ts` keeps nine functions and
   three closures; a new method there would fail `make lint-metrics` (§5.7). Amended
   2026-10-20: one method fits (ten is the cap), and the link takes it (architecture §6).
5. **Flag read at module evaluation:** a route filter at router build parses the config before
   the guarded `load()` (§5.4); read flags lazily or inside the guarded path.
6. **Password for every save (G4):** a name-only edit needs the current password; OAuth-created
   users cannot save until they reset their password.
7. **Field error contrast:** 4.48:1 app-wide (§3.4); a fix changes auth error visuals.
8. **Classification without codes (G8):** the wrong-password message is localized; English-only
   matching falls back to the generic toast in other languages. Pinning the request language is
   an architecture option.
9. **Own e-mail rejection (G3, inferred):** never send an unchanged or case-variant e-mail.
10. **Seeded-token stacks:** the test stack's seeded token has no user; the mock must map it to
    a mock user or every e2e, visual and a11y run sees the read failure.
11. **Toolkit collision:** a later toolkit toast would need a reviewed adoption decision (`docs/ui-toolkit.md`).
12. **Old budget baseline:** the largest-chunk figure (`config/performance-budget.json:18`)
    predates recent work; measure the settings chunk, which also carries the 2FA QR encoder.

## 8. Open questions

### 8.1 For the design owner

1. The error toast frame (U2 fixes layout and roles; colour and icon need a drawn state).
2. Field error states per field, and the page-load error state.
3. After an e-mail change: is "not confirmed · resend" enough, or a "check your inbox" message?
4. Real subtitle copy, the mobile header defect, Ukrainian copy for every label.
5. "Очистити" colours: an outlined pill in primary blue would fail contrast.
6. Sign-off on the greeting (`#57595B`) and resend link (`#0074B5`) overrides.
7. A monogram without the pencil badge until avatars exist (D2).

### 8.2 For product

1. The current password for a name-only change (G4): accept for v1, or ask user-service for a
   password-free profile mutation?
2. OAuth-created users: hide the form, explain the reset path, or wait for G4?
3. Should the password success toast say other devices were signed out (D17)?
4. Should the client throttle "resend" while the upstream limiter is inert (#470)?

### 8.3 For user-service (filed after readiness)

G1 (widen #513 or a sibling), G2, G3 (regression test first), G4, G5, G6, G7 and G8 (shared with
2FA). Nothing in §4.9 is filed again.
