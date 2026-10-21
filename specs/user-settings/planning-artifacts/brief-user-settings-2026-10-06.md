---
status: complete
workflowType: product-brief
stepsCompleted: [1, 2, 3, 4, 5, 6]
project_name: crm
date: 2026-10-06
revised: 2026-10-21
feature: user-settings
issue: https://github.com/VilnaCRM-Org/crm/issues/330
author: 'analyst (Mary), autonomous run'
inputDocuments:
  - specs/user-settings/planning-artifacts/research-user-settings-2026-10-06.md
---

# Product Brief: user settings for the `user` module

Predecessor: [research](./research-user-settings-2026-10-06.md), the evidence base, cited as
"research §N". Ids `U1`-`U11` (user, binding), `D1`-`D18` and `R1`-`R28` (main agent) and
`P1`-`P6` (product resolutions) come from the run's decision record. Decisions this stage took on
its own are marked `> Assumption:`; later stages may overturn them with a recorded reason.

> Reconciliation 2026-10-16: the vision, journeys and scope are unchanged. The bundle now builds
> on PR #340 (crm #315 implemented) over PR #333 (merged): the durable decisions go into the user
> module README instead of an ADR, `userSettings` is the only runtime flag, the settings copy is
> a lazy catalog so the eager catalog `/sign-in` downloads does not grow, and the e-mail field
> reuses sign-up's "E-mail" label. The run summary lists every edit.

> Simplification 2026-10-08
> (`crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md`): no security signal
> is emitted (D16 withdrawn); the shared pieces are built by this feature and imported by
> two-factor authentication, which lands after it; a transport 401 alone ends a session (R28);
> locally the page runs through `make start-prod`, the test stack.

## 1. Executive Summary

A signed-in VilnaCRM user cannot see or change their own account: there is no profile page, the
client never learns the user's name or confirmation state, and an unconfirmed e-mail cannot get a
second confirmation link. This brief turns the Miro "User settings" component ("user initials,
changing email, changing password") into a protected `/settings` page with one profile card: a
greeting header, the full name, the e-mail with a "not confirmed · resend" state, a password
change, one "Зберегти зміни" / "Очистити" pair, success and error toasts, and a right-hand column
where the two-factor bundle mounts its card (D1).

GraphQL only (U1): `users`, `updateUser` and `resendEmailToUser` are in the pinned v2.8.0
contract and byte-identical on user-service `main`, so no schema extension is needed (research
§4.2-§4.3, D5). v2.8.0 authenticates nobody, though: `users(first: 1)` would return an arbitrary
user and anyone could update anyone (research §4.4-§4.5). The page therefore ships behind a new
runtime flag, `userSettings`, off in production and on in the test stack, which `make start-prod`
also runs locally; the dev server keeps the committed block (U5, R28); production waits for a
release of `main`'s authentication surface (G1).

Its "Пароль" block is the design of record for #315's new-password field: one password field,
one policy (U3). With two-factor authentication it shares the page shell, route, home link,
`Authorization: Bearer` header and sign-out rule; this feature builds them (D10, D12).
The toast is this feature's alone: 2FA reports its outcomes inside its card (D9, R16).

## 2. Problem

- **No profile surface.** The protected side is one home page whose only control is "Вийти"
  (research §5.1); no route, page or menu leads to account data.
- **The client does not know who the user is.** After sign-in crm holds the token and the typed
  e-mail, never the user id, name or confirmation state, and no request sends `Authorization`
  (research §5.2).
- **Nothing can be changed.** A typo in the sign-up name stays forever, a user moving mailbox
  cannot change the e-mail, and a user who suspects a leak cannot rotate the password while
  signed in (#315's reset flow serves signed-out users).
- **An unconfirmed e-mail has no way forward.** A lost confirmation mail cannot be re-sent from
  the UI, although `resendEmailToUser` is in the pinned contract.

The cost is support work the backend could do, accounts that stay unconfirmed, and stale contact
data in a product whose job is contact data.

The backend exists; the client half does not. crm has no current-user read, authorization header,
toast or flag-gated route (research §5.4), and the password field it needs sits in the auth
feature, which a sibling feature may not import (research §6.1). Figma section `6242:41691` draws
three breakpoints but no error toast, field error, loading, post-change or load-failure state
(research §3.5); its copy is Russian and two text colours fail contrast (research §3.4).

## 3. Target Users and Journeys

| User                            | Job to be done                                         |
| ------------------------------- | ------------------------------------------------------ |
| Signed-in CRM user              | Keep name, e-mail and password correct without support |
| User with an unconfirmed e-mail | Get a fresh confirmation link and finish confirming    |
| Mobile and tablet user          | Do the same by touch, in one column                    |
| Keyboard and screen-reader user | Reach every control and hear every outcome             |
| Deployment admin                | Enable the page per environment with one runtime flag  |
| Two-factor bundle contributor   | Mount the 2FA card in the same page without rework     |

### Layout per Breakpoint

The page sits inside today's app layout (main landmark and footer); the Figma sidebar and header
are app-shell work (D3). Frames: resting, then "not confirmed" (research §3.1).

| Breakpoint   | Frames                  | Columns                         | Toasts               |
| ------------ | ----------------------- | ------------------------------- | -------------------- |
| Desktop 1440 | `313:10242` `386:27830` | card and 2FA slot side by side  | stacked bottom-right |
| Tablet 1024  | `313:10480` `386:27945` | card, 2FA card below it         | stacked bottom-right |
| Mobile 375   | `313:10606` `386:28059` | one column, full-width controls | full width, bottom   |

Journeys are the same at all three breakpoints; only column stacking and toast position change.
Every control works by touch, and focus moves to the first field in error, scrolled into view.

> Assumption: when the two-factor section is off, its column is not rendered and the profile
> card keeps its desktop width instead of stretching; an empty column would read as a defect.

### Journeys

1. **Resting load.** From the home link "Налаштування" or by URL: a skeleton while the user
   loads, then a monogram, "Вітаємо!", the name, filled name and e-mail fields and empty password
   fields. A failed read shows "Не вдалося завантажити профіль" and "Спробувати ще раз" (D18).
2. **Edit name.** Change "Ваше ПІБ" (the 2026-10-21 label; it was "Ваше ім’я та прізвище"),
   type "Поточний пароль", press "Зберегти зміни":
   busy button, then "Зміни збережено", the header name updates, both password fields clear and
   the form is pristine (D7).
3. **Change e-mail.** Same steps on "E-mail": a toast says the link went to the new
   address and "E-mail не підтверджено · Надіслати повторно" appears; resend is disabled while
   in flight (P4) and ends in a toast. An unconfirmed user sees the row on the resting load.
4. **Change password.** "Поточний пароль" plus "Новий пароль", whose policy rules update live
   (U3); success shows "Ви успішно змінили пароль" (P3) and clears both. Upstream `main` signs
   out other sessions; the copy does not say so and no client logic relies on it (D17).
5. **Wrong current password.** Nothing is saved; the field shows "Неправильний поточний пароль"
   and takes focus. An unrecognised error shows the generic error toast instead (R3, P5).
6. **Violation.** A taken or malformed e-mail, a rejected name or a weak new password shows a
   field error in crm copy, never the server text (D8); a taken e-mail reuses sign-up's
   "Електронна адреса вже використовується".
7. **Session expired.** A transport 401 signs the user out to `/sign-in`, and signing in returns
   to `/settings` (D10); typed values are lost, because passwords are never persisted.
8. **Network failure.** "Не вдалося зберегти зміни" with "Спробувати ще раз"; the form keeps its
   values and nothing retries on its own (U6). A rate limit shows "Забагато спроб. Спробуйте
   пізніше" without a retry. Offline, Save is disabled under the existing offline notice.
9. **Flag off.** No home link, and `/settings` renders the not-found page whatever
   `twoFactorAuth` says; that flag only decides whether the 2FA card shows inside the page, so
   enabling 2FA in an environment needs `userSettings` on there too.

> Assumption: Save with nothing changed (a current password alone is no change) sends no request
> and says "Немає змін для збереження" in the form's polite status region.
>
> Assumption: "Очистити" restores the last loaded name and e-mail and clears both password fields
> and all field errors; it never blanks a field and is inert only while a Save is in flight.

## 4. Solution Overview

### The Page

- `h1` "Налаштування" with a real subtitle (D14); a header with a decorative monogram from the
  name (no photo; the pencil badge is decoration only, amended 2026-10-21, D2), "Вітаємо!" in `#57595B` instead of the failing `#969B9D`
  (D15; superseded 2026-10-21: the product owner kept `#969B9D` under a scoped exception) and the
  name in bold. Amended 2026-10-21 (product owner): the name line shows the first name and
  surname only, taken from the ПІБ ("Петренко Олена Іванівна" greets "Олена Петренко", monogram
  "ОП"), and the monogram follows the greeted name.
- "Особисті дані" holds name and e-mail; resend is a button (it sends mail) styled as a link in
  `#0074B5` instead of the failing `#1EAEFF` (D15). "Пароль" holds "Поточний пароль", required
  for every Save (P1), and the optional "Новий пароль" under the shared policy (U3). Amended
  2026-10-21 (product owner, Figma `315:11316`): the name is a row "Ваше ПІБ" above "Особисті
  дані", which holds only the e-mail; the optional hint under "Новий пароль" is visually hidden
  but still announced, and its policy rules show only while the field has focus or a value.
- One "Зберегти зміни" / "Очистити" pair, "Очистити" passing contrast without an exception; the
  2FA column under its own flag (D12); toasts with polite success, alert errors that stay until
  closed, a localized close button and at most three visible (D9). Amended 2026-10-21: no toast
  carries a role; two always-mounted regions announce success (polite) and errors (assertive).
- A UI-only "Соціальні мережі" card (added 2026-10-21, product owner): Figma-exact, Google,
  Facebook, GitHub and Twitter tiles, each saying that linking is not available yet; no actions,
  because user-service cannot link, list or unlink (G6).

### Outcomes the User Can See

| Upstream answer            | "Зберегти зміни"                     | "Надіслати повторно" |
| -------------------------- | ------------------------------------ | -------------------- |
| Success                    | one success toast per changed aspect | success toast        |
| Violation (422)            | field error on the named field       | error toast          |
| Wrong current password     | field error on the current password  | does not apply       |
| Unrecognised domain error  | generic error toast                  | error toast          |
| Session ended (401 rule)   | sign-out, back to `/settings` after  | same                 |
| Rate limited (HTTP 429)    | error toast, values kept, no retry   | error toast          |
| Network, timeout, 5xx      | error toast with retry, values kept  | error toast          |
| Request aborted by leaving | nothing                              | nothing              |

> Assumption: rate-limit and resend error toasts carry no retry action: an immediate retry would
> hit the limit again, and the resend control is its own retry (P4).

### Copy

The Russian Figma copy is translated, not copied (D14); English is the fallback. Drafts: subtitle
"Керуйте своїм ім’ям, електронною поштою та паролем." (Manage your name, e-mail address and
password.); sections "Особисті дані" (Personal details) over name and e-mail and "Пароль" over
the password pair; fields "Ваше ім’я та прізвище" and "E-mail" (sign-up's labels; "E-mail"
since #311; the name label is "Ваше ПІБ" since 2026-10-21),
"Поточний пароль" and "Новий пароль"; toasts "Зміни збережено", "Ми надіслали посилання для
підтвердження на нову адресу", "Ви успішно змінили пароль", "Посилання для підтвердження
надіслано повторно"; close button "Закрити сповіщення"; errors as in §3.

> Assumption: the fields reuse sign-up's labels, not a literal "Ваше ПІБ" / "Ваш e-mail", so one
> value has one name across the app. Superseded for the name on 2026-10-21: the product owner
> chose "Ваше ПІБ" (`settings.profile.full_name`, the neuter agreeing with "прізвище"); the
> e-mail keeps the sign-up label. The home link reads "Налаштування" (Settings); the 2FA
> bundle reuses this link and adds none of its own (D3).

### Shared With #315 (U3)

One password field with its eye toggle, one live rule list and one policy (8 to 64 characters, a
digit, an ASCII uppercase letter, crm's lowercase rule) serve both features (research §6.1). The
current password has only a required rule; a server rejection maps to that field (D6). #315
builds these pieces in the auth feature, which settings may not import, so they move to shared
places first with sign-up's name and e-mail validators (D11); an unedited name is not validated.

### Coordination With Two-Factor Authentication (D12, A1, A2)

- **One page.** `/settings` is one protected lazy route of the settings feature, 2FA card on the
  right. The route is always registered; a render-time gate shows the not-found page unless
  `userSettings` is on, whatever `twoFactorAuth` says (R17); `twoFactorAuth` only decides whether
  the 2FA card shows inside the page.
- **2FA has its own page** (the user, 2026-10-16, Figma `72:4846`). The 2FA code entry at sign-in
  is a standalone page that the two-factor bundle serves as its own public route; `/settings`
  keeps only the slot for the 2FA settings card.
- **Built once, here:** route key and contract, flag gate, page shell and the Bearer header on
  GraphQL requests; two-factor authentication lands after settings and imports them. The toast
  is built and used by settings only (R16).
- **One sign-out rule (D10, R11, R17, R28).** Sign out and return to `/sign-in` with the page
  remembered only on a transport HTTP 401 of a non-anonymous operation, the answer user-service
  gives an unusable token before GraphQL runs. Other refusals stay with the operation.
- **Upstream.** One shared issue asks user-service for machine-readable error codes (G8).

## 5. Goals and Success Metrics

### Goals

1. A signed-in user changes name, e-mail and password and re-sends the confirmation link at
   every breakpoint, today against the mock through `make start-prod` and stubs in the tests.
2. Every outcome is visible and accessible; every success has its error counterpart (U2).
3. Passwords never leave the request: not in the Apollo cache, telemetry, logs or storage.
4. No gate weakens, the auth pages do not slow down, and production needs only a flag after G1.

### Release Gates on Every Pull Request

| Measure                                    | Target            | Measured by                |
| ------------------------------------------ | ----------------- | -------------------------- |
| axe violations (WCAG 2.1 AA), `/settings`  | 0 in 3 engines    | `make test-a11y`           |
| New `A11Y_EXCEPTIONS` entries              | 1 (amended 10-21) | gate test + review         |
| Keyboard-only save, resend and toast close | pass              | keyboard contract spec     |
| Touch-only save in both mobile projects    | pass              | mobile e2e lane            |
| Coverage, all four measures                | 100               | Jest thresholds            |
| Mutation score (`break`)                   | 100               | Stryker merge gate         |
| Passwords written to the Apollo cache      | 0 writes          | `cache.write` spy          |
| Passwords in captured telemetry            | 0                 | scrubber unit tests        |
| Automatic retries of either mutation       | 0                 | integration tests          |
| Unchanged fields in the `updateUser` input | 0                 | integration + e2e          |
| Flags off: home DOM and requests vs `main` | identical         | e2e + visual lanes         |
| Eager entrypoint growth                    | 0 bytes           | bundle-size report         |
| Settings chunk, deferred DI chunk          | within budgets    | Rspack hints, gzip report  |
| Lighthouse on its 8 unchanged URLs         | floors held       | Lighthouse desktop, mobile |
| Visual diffs beyond intended baselines     | 0                 | `make test-visual`         |
| i18n parity, `en` and `uk`                 | clean             | `make lint-i18n`           |
| Route-coverage rows for `settings`         | e2e, visual, a11y | route-coverage gate        |

Amendment 2026-10-21 (product owner): the new `A11Y_EXCEPTIONS` target was 0 and is now exactly
1, the scoped `color-contrast` entry `#settings-greeting` in `tests/utils/a11y/axe-config.ts`,
tracked in #276, because "Вітаємо!" keeps the Figma grey `#969B9D` (2.81:1). No other entry.

The floors in `.claude/react-sdlc.yml:50-65` are raise-only: coverage 100 on all four measures,
mutation MSI 100, zero jscpd clones, ESLint errors and warnings, tsc, markdownlint and
dependency-cruiser findings, metrics enforced, zero visual diffs, Lighthouse desktop 95 and
mobile 85; CI asserts performance at 0.95 desktop (`lighthouse/lighthouserc.desktop.js:19`) and
0.84 mobile (`lighthouse/lighthouserc.mobile.js:35`). Nothing is lowered or suppressed. Intended
new baselines, all from the CI artifact: the `/settings` states and the home page with its link
(the test stack turns the flag on); the field-error colour fix re-baselines nothing, because no
existing baseline renders a field error.

> Assumption: `/settings` does not join the Lighthouse URL list in v1: it shares the layout of
> `/`, its code is a lazy chunk under the bundle budgets, and the mobile floor has no headroom;
> the PRD may add it with a measured baseline. Adoption is read from user-service data.

## 6. Scope

### In Scope for v1 (D1)

- `/settings` at desktop, tablet and mobile with the journeys of §3 and the outcomes of §4.
- Current-user read; one `updateUser` per Save with the current password and only the changed
  fields, the e-mail only when its trimmed, lower-cased value changed (D6); `resendEmailToUser`.
- The toast (settings only, R16); the Bearer header, sign-out rule and page shell, which 2FA
  imports (D12).
- The shared password field and policy, moved where settings can use them (U3, D11).
- Flag `userSettings` (off by default, on in the test stack), its home link, and route gating that
  leaves `/settings` to the not-found page while `userSettings` is off, read lazily (D13, R6).
- A stateless mock for the three operations: a seeded test user, one violation and the owner
  check; every error shape is stubbed in the tests (U4; P6 superseded by R28).
- Contrast fixed at its source: greeting, resend link, app-wide field-error text (D15, R8); the
  greeting part was superseded 2026-10-21 (`#969B9D` kept under one scoped exception).
- The social networks card, UI-only with no actions (added 2026-10-21, product owner).
- `uk` and `en` copy; unit, integration, e2e, touch, a11y, keyboard and visual coverage;
  route-coverage rows; the decisions recorded in the user module README, no ADR (U10).

### Out of Scope for v1

- Avatar upload, crop and removal (D2, G5), and social networks link, list and unlink (G6): no
  backend anywhere. The social networks card was "not rendered at all" (D2); amended 2026-10-21
  by the product owner, it renders UI-only (§6 In Scope).
- The app-shell sidebar, header and user menu with its "user settings" entry (D3).
- Delete account and a sessions list: neither designed nor planned.
- The 2FA card itself (2FA bundle); special handling for OAuth-created users (P2).

### Follow-ups

1. Production enablement of `userSettings` once user-service releases `main`'s authentication
   surface (G1, widening #513 or a sibling) and the release is deployed.
2. Contract pin bump to that release; no schema change is expected (D5).
3. Avatar upload once user-service stores avatars (G5).
4. Social networks link, list and unlink once user-service serves them (G6), wired into the
   UI-only card that ships in v1 (2026-10-21).
5. App-shell navigation: a user-menu entry replacing the home link (D3).
6. OAuth-created users and password-free profile changes, once user-service allows (P1, P2, G4).
7. Client throttling of "Надіслати повторно", tied to the upstream limiter (P4, #470).
8. Error classification by machine-readable codes once G8 ships (R3).
9. A `me` query in place of `users(first: 1)` if user-service adds one (G2).
10. Deleting the `userSettings` flag per the documented flag lifecycle.

## 7. Constraints and Risks

### Constraints

- **Repository conventions** bind unchanged (U7): classes outside React components, type-only
  files, DI tokens, approved class suffixes, no new module-level singletons, metric caps, module
  shape, the sibling-feature import ban, and a container-free auth paint path.
- **Secrets (U6).** Password mutations bypass the Apollo cache, select only needed fields, check
  the abort signal before sending and never retry on their own.
- **Accessibility.** WCAG 2.1 AA in jsdom and three engines; text below 4.5:1 is overridden
  (U11); the existing Save exception (#276) is the only one the page relies on.

### Risks

1. **Production exposure before G1:** against v2.8.0 the page reads and updates an arbitrary
   user. The flag ships off and is enabled only after the release (U5).
2. **Prerequisite chain:** a #315 slip blocks the password block. P.1 is explicit and the move of
   the shared pieces is the first settings story (D11).
3. **Password for every save (G4):** a name-only change needs it, and OAuth-created users cannot
   save at all. Accepted for v1 (P1, P2); G4 is filed upstream after readiness.
4. **Errors without codes (G8):** a wrong current password is only text in the request language;
   one `en` and `uk` message set (P5), the generic toast otherwise, tested without a code (R3).
5. **Own e-mail rejected (G3, inferred):** an unchanged or case-variant e-mail is never sent (D6).
6. **Short sessions:** `main` issues 900-second tokens and crm has no refresh yet, so a long edit
   can end in a sign-out that loses typed values (research §4.5). The redirect returns to
   `/settings`; token refresh belongs to the auth flow, not to this feature.
7. **Field-error contrast fix** (research §3.4): no existing auth baseline renders a field error,
   so the fix re-baselines nothing; the new `/settings` field-error pair records it, from CI only.
8. **Route gating at router build** would parse the runtime config before its guarded load
   (research §5.4): flags are read lazily (R6) and the module README records the mechanism.
9. **Seeded-token stacks:** the browser lanes stub every settings read with `page.route`, so no
   mock token mapping is needed (P6 superseded by R28).
10. **Bundle growth:** the settings chunk also carries the 2FA QR encoder and the budget baseline
    is stale (research §7): both chunks are measured in the pull request; no budget is raised.

## 8. Dependencies and Prerequisites

| Prerequisite                                           | Needed for                |
| ------------------------------------------------------ | ------------------------- |
| PR #333 merged: chores #332 and #334                   | typed boundaries, Zustand |
| P.1: stacked on PR #340 (#315 implemented)             | folders, password block   |
| Bearer header, sign-out rule, page shell, flag gate    | built here, 2FA imports   |
| user-service release with `main`'s authentication (G1) | production only           |

Implementation against the mock blocks on nothing upstream. Upstream issues G1-G8 are filed after
readiness; nothing already tracked (research §4.9) is filed again.

## 9. Decisions Shaping the Product

| Id       | Decision                                                                          |
| -------- | --------------------------------------------------------------------------------- |
| U1       | GraphQL against user-service only; plan only what has a backend                   |
| U2       | Every success toast has an error counterpart: same layout, error styling          |
| U3       | The "Пароль" block is #315's design of record: one password field, one policy     |
| U5       | Superseded by R28: off in production, on in the test stack; dev keeps the block   |
| U6       | Password mutations: no cache, minimal selection, abort check, no automatic retry  |
| U11      | Accessibility overrides design: text under 4.5:1 is overridden, not copied        |
| D1       | v1: `/settings` card with name, e-mail and resend, password, toasts, 2FA slot     |
| D2       | No avatar or social networks: no backend; a decorative monogram instead           |
| D2a      | 2026-10-21: the social networks card renders UI-only, no actions; amends D2       |
| D3       | No app-shell menu; one flag-gated home link, shared with 2FA                      |
| D4       | Current user from `users(first: 1)`; its `id` addresses both mutations            |
| D5       | No schema extension: all three operations are in pinned v2.8.0                    |
| D6       | Current password on every Save; only changed fields; e-mail by normalised diff    |
| D7       | One success toast per changed aspect; form re-reads the result, clears passwords  |
| D8, R3   | Errors become field errors or toasts in crm copy; wrong password known by text    |
| D9, R16  | New toast, settings only: polite success, alert errors, none auto-dismiss, max 3  |
| D10, R11 | Bearer link on GraphQL; automatic sign-out only under the shared rule (R17)       |
| D11      | #315's shared pieces leave the auth feature before settings uses them             |
| D12      | Route, gate, shell, Bearer header: built by settings, imported by 2FA             |
| D13, R6  | Route renders only while `userSettings` is on; a render-time gate (R17)           |
| D14      | Copy translated to `uk` and `en`; real subtitle; sections named for content       |
| D15, R8  | Contrast fixed at source for greeting, resend link and field-error text           |
| D16      | Withdrawn 2026-10-08: no security signal for a rejected current password          |
| D17      | Password change signs out other sessions upstream; the client does not rely on it |
| D18, R7  | The page owns its load state: skeleton, then an error state with a retry          |
| P1       | A name-only change still needs the current password in v1                         |
| P2       | No special handling for OAuth-created users in v1                                 |
| P3       | Password toast is "Ви успішно змінили пароль", no mention of other devices        |
| P4       | Resend is disabled only while in flight; no countdown                             |
| P5       | Wrong-password text matched in `en` and `uk`; anything else is a generic toast    |
| P6       | Superseded by R28: the mock reads no token                                        |

## 10. Open Questions for the Design Owner

None of the design questions in research §8.1 blocks v1; these defaults hold until answered:

| Question                   | v1 default until answered                                    |
| -------------------------- | ------------------------------------------------------------ |
| Error toast frame          | success layout on `#FDECEC`, `#1A1C1E` text, `#DC3939` icon  |
| Field error states         | existing style, text colour fixed at its token (R8)          |
| Page-load error state      | a message and a retry button in place of the card            |
| After an e-mail change     | toast plus "not confirmed · resend"; no "check inbox" panel  |
| Copy and mobile header     | §4 drafts; mobile keeps the desktop title and subtitle       |
| "Очистити" colours         | outlined, label at 4.5:1 or more, never primary blue         |
| Contrast overrides         | resend `#0074B5` (5.04:1); greeting `#969B9D` kept, amended  |
| Monogram, decorative badge | decorative pencil badge (amended 2026-10-21), hidden from AT |

The four product questions (research §8.2) are settled by P1-P4, each with a follow-up in §6.

## 11. Next Step

Hand this brief to `create-prd`: requirements per journey (§3), outcomes as acceptance criteria
(§4), gates as non-functional requirements (§5), shared pieces as coordination items, and §6's
follow-ups as work no story waits for.
