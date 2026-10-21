---
status: complete
workflowType: prd
project_name: crm
date: 2026-10-06
revised: 2026-10-20
iteration: 4
feature: user-settings
issue: https://github.com/VilnaCRM-Org/crm/issues/330
author: 'pm (John), autonomous run'
inputDocuments:
  - specs/user-settings/planning-artifacts/research-user-settings-2026-10-06.md
  - specs/user-settings/planning-artifacts/brief-user-settings-2026-10-06.md
---

# PRD: user settings for the `user` module

**Author:** pm (John), autonomous run **Date:** 2026-10-06, revised 2026-10-08, 2026-10-16 and
2026-10-20 **Feature:** `user-settings`

Predecessors: [research](./research-user-settings-2026-10-06.md), the evidence base cited as
"research §N", and [brief](./brief-user-settings-2026-10-06.md), the vision, journeys, scope and
metrics cited as "brief §N". Ids `U1`-`U11` (user, binding), `D1`-`D18` and `R1`-`R28` (main
agent; an `R` amendment supersedes the `D` item it names) and `P1`-`P6` (product resolutions)
come from the run's decision record; §3 lists every one that shapes a requirement. Decisions this
stage took on its own are marked `> Assumption:`. The PRD is implementation-ready but not
code-level: class, file, token and i18n key names belong to the architecture stage and the
module README's User Settings decisions.
The 2026-10-08 revision adds NFR-14 (typed boundaries, TB-1) and NFR-15 (the Miro layer stack)
from the shared Miro layer contract and rewords the requirements that named a repository,
controller or handler as the layer that decides; no functional behaviour changed. A second
2026-10-08 pass applies the independent verification
(`crm-worktrees/_planning-shared/verification-2026-10-08.md`): the refined TB-1 text, one Data
provider and the shared types as #315 owns them. A third pass aligns to the shared User domain
(contract §3.5): #315 builds `UserEntity`, which the route page loads and passes down as itself;
the password change is the plain `PasswordChange` of the `ChangePassword` section, because
`RestorePasswordDTO` is #315's; TB-2 joins TB-1 (NFR-14).

The simplification of 2026-10-08
(`crm-worktrees/_planning-shared/over-engineering-review-2026-10-08.md`; the user: "apply all
10", "do not over-engineer") withdraws the invented security signal (FR-23), ends a session on a
transport 401 only (FR-19), cuts the mock to a stateless happy path (FR-27), shows the resend
time-out as the generic resend failure (FR-18), turns the test stack alone on (FR-1), and names
one owner per shared piece: this feature builds the shell, route, gate, link and notice, and the
two-factor bundle imports them. Until the 2026-10-16 reconciliation the prerequisites were the
chore #332 (typed-boundaries gate), the chore `zustand-client-state` (#334) and #315 Epic 0;
both chores have merged (PR #333) and this branch is stacked on PR #340 (§7). Data access is
GraphQL repositories only.

Client state 2026-10-08 (the user: "change the react state var to zustand"): the chore
`zustand-client-state` (#334, merged with PR #333) added `zustand`, recorded its rules as
ADR-002's "Current rules" and replaced the reactive-var stores with Zustand stores. This feature
reads the session through `useAuthStore` selectors (`useAuthToken()`) and the link writes it
through `useAuthStore.setState` with the cleared `AuthState`; the token stays memory-only.

Reconciliation 2026-10-16: the bundle now builds on real code. Branch `feat/330-user-settings` is
stacked on PR #340 (crm #315 implemented, not yet merged), itself based on PR #333 (merged: the
chores #332 and #334). No ADR is written, because PR #333 deleted every ADR from 003 up and the
maintainer decided that ADR content goes into a README or nowhere (FR-30); no runtime flag exists
today (FR-1); the settings copy is a lazy catalog (FR-28, NFR-5); the field pieces keep #315's real
shapes (FR-25). Three behaviours were made precise against #315's code (FR-19): a session end also
signs the sandbox demo session out, #315's two recovery operations are anonymous, and the
session-ended notice has a neutral tone; the 2FA challenge is its own page (FR-3). The run summary
lists every edit.

## 1. Overview

A signed-in VilnaCRM user gets one protected page, `/settings`, to see and change their own
full name, e-mail address (re-sending the confirmation link while it is unconfirmed) and
password. The page is the Miro component "User settings" ("user initials, changing email,
changing password") drawn in Figma section `6242:41691` at 1440, 1024 and 375 px (research §3.1,
§3.7). Its right-hand column is the slot where the two-factor bundle (#331) mounts its card;
the two bundles share the shell, route, route flag gate, home link, `Authorization: Bearer`
header and sign-out rule, which this feature builds and the two-factor bundle imports (D10, D12,
R11, R17). The toast is built and used by settings alone (R16).

The client uses GraphQL only (U1) and three operations that are in the pinned v2.8.0 schema and
byte-identical on user-service `main`: `users(first: 1)` reads the current user, `updateUser`
changes name, e-mail and password in one call that always carries the current password, and
`resendEmailToUser` re-sends the link (research §4.2-§4.3, D4, D5). No schema extension is
needed. v2.8.0 authenticates nobody, so the page ships behind a new runtime flag,
`userSettings`, off in production and on in the test stack, which `make start-prod` also runs
locally (U5); production waits for a user-service release of `main`'s authentication surface
(G1).
The feature is built exactly as the Miro "Frontend C4 Architecture VilnaCRM" board draws the
user module: the `UserProfile` route page holds the user and the `UserProfileSettings` card
with its `ChangePassword` block, React hooks reach a Data provider, which works with
Transformers and a GraphQL Repository; the board has no frontend Controller or Service layer,
and neither does this feature (NFR-15).
The settings "Пароль" block is also the design of record for #315's new-password field: one
field and one policy serve both features (U3), so #315's shared pieces move out of the auth
feature before settings uses them (D11).

### Backend outcomes the user can see

| Answer                    | Read               | Save                       | Resend           |
| ------------------------- | ------------------ | -------------------------- | ---------------- |
| `data` as expected        | page renders       | a toast per changed aspect | success toast    |
| Empty or malformed `data` | failure + retry    | generic error toast        | error toast      |
| Violation, status 422     | does not apply     | field error on named field | error toast      |
| Wrong current password    | does not apply     | field error                | does not apply   |
| Session ended (FR-19)     | sign-out, redirect | sign-out, redirect         | same             |
| HTTP 429                  | failure + retry    | rate-limit toast, no Retry | rate-limit toast |
| No answer, deadline, 5xx  | failure + retry    | error toast with Retry     | error toast      |
| Other GraphQL error       | failure + retry    | generic error toast        | error toast      |
| Caller abort              | nothing            | nothing                    | nothing          |

## 2. Goals and non-goals

### Goals

1. A signed-in user changes the full name, e-mail and password and re-sends the confirmation
   link at all three breakpoints, today against the stubs and mock of the test stack (brief §5).
2. Every outcome is visible and announced; every success toast has an error counterpart (U2).
3. Passwords never leave the request: not in the Apollo cache, telemetry, logs, storage or URL.
4. Nothing is built twice: shell, route, flag gate, Bearer header and sign-out rule are one
   implementation shared with two-factor authentication (D12, R11, R17).
5. No quality gate weakens, the auth pages do not slow down, and production needs only a flag
   change once G1 ships (U5).

### Non-goals

- Avatar upload, crop and removal (D2, G5) and the social networks card (D2, G6).
- The app-shell sidebar, header and user menu with its "user settings" entry (D3).
- Delete account, a sessions list, and the 2FA card itself (2FA bundle, #331).
- Special handling for OAuth-created users (P2, G4); a `me` query or JWT decoding (D4, G2).
- Client throttling or a countdown on "Надіслати повторно" (P4, #470); token refresh.
- Production enablement, the contract pin bump and deleting the flag (follow-ups, §9).
- A prompt when leaving the page with unsaved edits.

> Assumption: leaving `/settings` with unsaved edits discards them without a prompt; no frame
> draws one, and the passwords in the form must not outlive the page anyway (U6).

## 3. Decisions of record

Settled before this stage; the architecture and epics stages treat them as fixed.

| Id           | Decision that shapes the requirements                           | Source         |
| ------------ | --------------------------------------------------------------- | -------------- |
| U1           | GraphQL against user-service only; plan only what has a backend | research §1    |
| U2           | Every success toast has an error counterpart, same layout       | brief §4       |
| U3           | The "Пароль" block is #315's design of record: one field        | research §6.1  |
| U4, R10, R13 | Mock only what `main` has; a stateless happy path (R28)         | research §4.10 |
| U5           | Flag off in production, on in the test stack (`:-true`)         | brief §1       |
| U6           | Secrets: no cache, minimal fields, abort check, no retry        | research §6.1  |
| U7, U10      | Repository conventions bind; decisions in the module README     | research §5.7  |
| D1, D2       | Name, e-mail, resend, password, toasts, slot; no avatar/socials | research §1    |
| D3           | No shell menu; one flag-gated home link shared with 2FA         | research §1    |
| D4, D5       | `users(first: 1)` and its IRI; no schema extension              | research §4.3  |
| D6, P1       | Current password on every Save; only changed fields are sent    | research §4.4  |
| D7, P3       | One success toast per changed aspect; form adopts the payload   | brief §3       |
| D8, R3       | Errors map to crm copy; wrong password known by message         | research §6.2  |
| D9, R16      | Toast, settings only: polite success, alert errors, at most 3   | research §3.2  |
| D10, R11-R19 | `SessionLinkFactory` Bearer link; only it ends a session        | research §4.5  |
| R28          | A transport 401 ends the session; no other answer does          | review §2.2    |
| D11          | #315's shared pieces leave `@auth` before settings uses them    | research §6.1  |
| D12, R16     | Route, shell, link: built here, imported by the 2FA bundle      | research §6.2  |
| D13, R6, R17 | Route on only while `userSettings` is on; a render-time gate    | research §5.4  |
| D14          | Copy translated to `uk` and `en`; sections named for content    | research §3.6  |
| U11, D15     | Text under 4.5:1 overridden at source, field errors too (R8)    | research §3.4  |
| D16, D17     | Other sessions' revocation not relied on; D16 withdrawn (R28)   | research §6.2  |
| D18, R7      | The page owns its load state: skeleton, then error with retry   | research §5.5  |
| P2, P4       | No OAuth-user handling; resend disabled only while in flight    | brief §6       |
| P5, P6       | `en`/`uk` message set; P6 superseded (R28): mock reads no token | brief §7       |
| TB-1         | Named types at every layer boundary; no bare arrays or literals | contract §4    |
| TB-2         | Board types cross components as themselves; reserved names      | contract §4    |
| M1           | Miro layers only: route, component, hook, provider, repository  | contract §2    |

## 4. User journeys per breakpoint

Figma file `xZ7ccrH6d4QyqLQsayFSEX`, page "Design CRM" `0:1`, group `6242:41691` (frames misnamed
"Помилка 404", research §3.1). The page renders inside today's `AppLayout`, a focusable `main`
plus the lazy footer (`src/components/layouts/app-layout.tsx:30-44`); the Figma sidebar and
header are shell work (D3). Copy is the Ukrainian draft of §12 (D14).

| Breakpoint   | Frames (resting, unconfirmed) | Layout                    | Toasts             |
| ------------ | ----------------------------- | ------------------------- | ------------------ |
| Desktop 1440 | `313:10242`, `386:27830`      | card and 2FA side by side | stacked, right     |
| Tablet 1024  | `313:10480`, `386:27945`      | 2FA card below the card   | stacked, right     |
| Mobile 375   | `313:10606`, `386:28059`      | one column, full width    | full width, bottom |

Toast frames: `315:11754`, `315:12551`, `318:13410`. Journeys are the same at every breakpoint;
only stacking and toast placement change.

### Desktop 1440

1. From "Налаштування" on `/` the user lands on `/settings` with focus on `main`; the `h1` and
   subtitle render at once and a skeleton, announced as "Завантаження профілю…", holds the card.
2. The card shows a decorative monogram, "Вітаємо!" and the name; the `h2` "Особисті дані" over
   the prefilled name and e-mail; the `h2` "Пароль" over the empty current and new password with
   eye toggles and four live policy rules; then "Зберегти зміни" and "Очистити". The 2FA column
   sits to the right when its flag is on.
3. Name, then current password, then Save: the spinner shows, "Збереження…" is announced, the
   toast "Зміни збережено" appears bottom-right, the header shows the new name, both password
   fields empty and the form is pristine.
4. An e-mail change ends in "Ми надіслали посилання для підтвердження на нову адресу" and the row
   "E-mail не підтверджено · Надіслати повторно"; a resend ends in its own success toast.
5. A password change ends in "Ви успішно змінили пароль"; all three at once show three toasts in
   the order name, e-mail, password. "Очистити" restores the last loaded values.

### Tablet 1024

The same content and order; the 2FA card follows below the card and toasts stack bottom-right.

### Mobile 375

One column, completed by touch: tap a field, type, tap the eye toggle, tap "Зберегти зміни".
Toasts span the width at the bottom and never hide the focused control. The frame's header
"Management board" is a Figma defect; the desktop title and subtitle stay (research §3.6).

### Failure journeys

1. Load failure: "Не вдалося завантажити профіль" with "Спробувати ще раз", which reads again.
2. Missing or wrong current password: a field error on it, focus there, nothing saved.
3. Violation: a taken e-mail shows "Електронна адреса вже використовується"; a rejected name or
   new password shows its field error in crm copy, never the server text.
4. Network or server failure: an error toast with "Спробувати ще раз"; values are kept and nothing
   is re-sent on its own. Offline, Save is disabled under the offline notice. A rate limit shows
   "Забагато спроб. Спробуйте пізніше." with no retry action.
5. Session ended: `/sign-in` shows "Сеанс завершився. Увійдіть знову."; signing in returns to
   `/settings` and the typed values are gone.
6. Flags off: no home link, and `/settings` renders the not-found page.

## 5. Functional requirements

Requirement ids are stable. Criteria are one sentence per bullet in Given / when / then form;
accessibility criteria sit inside their requirement and NFR-6 to NFR-8 hold the page standard.

### 5.1 Flag, route and entry

#### FR-1 — `userSettings` runtime flag

`userSettings` (`APP_CONFIG_FLAG_USER_SETTINGS`) is declared in the four flag sites (the
`FeatureFlag` union, `FEATURE_FLAG_DEFAULTS`, the zod schema, the committed block in
`public/index.html`; research §5.4), in `.env.example`, and in the test stack as
`${APP_CONFIG_FLAG_USER_SETTINGS:-true}` because `.env` declares it empty (U5). The dev server
keeps the committed block: no dev-only flag transform exists, so a developer runs
`make start-prod` to see the page. The shipped default is `false`. No other flag exists
(`FeatureFlag` is `never` since issue #309 removed `forgotPassword`, reconciled 2026-10-16), so
`userSettings` is the only one and the first variable the test stack passes. `twoFactorAuth`,
named by FR-2 and FR-3, is the two-factor bundle's flag (#331): that bundle declares it in the
same four sites, ships it `false`, enables it per environment and deletes it under the same
lifecycle, so this feature adds no declaration site, test, compose variable or
`docs/feature-flags.md` row for it. Until #331 lands the flag is absent, every `twoFactorAuth`
case below reads as off, and the cases with it on are #331's acceptance (amendment 2026-10-21).

- Given the committed block, the in-code defaults and the test stack with no override, when
  read, then the shipped values are `false` and the test stack renders `true`.
- Given the runtime-config contract test, when a declaration site, `.env.example` or the
  `docs/feature-flags.md` row is missing, or a shipped default is `true`, then it fails.
- Given `docs/feature-flags.md`, when the change lands, then its row states the default, on in
  the test stack, production after G1 as the next step, and deletion as the removal trigger.

> Assumption: the contract test pins the shipped default to `false` until the flag is deleted;
> against v2.8.0 a shipped `true` would read and update an arbitrary user (research §7, risk 1).

#### FR-2 — `/settings` route gated by the `userSettings` flag

`ROUTE_PATHS.settings` (`/settings`) is a protected route of the settings feature's own route
contract (`src/modules/user/features/settings/routes`), lazily loaded from a chunk named
`settings`, with a `titleKey` for "Налаштування". It renders only while `userSettings` is on
(D12, D13); with it off, a render-time route flag gate shared with the two-factor bundle (#331)
renders the not-found page in its place, as for any unknown path, whatever #331's planned
`twoFactorAuth` says (R17). `twoFactorAuth`
only decides whether the 2FA card shows inside the page, so enabling 2FA in an environment needs
`userSettings` on there too. Flags are read
lazily, never while the router is built at module evaluation (`src/routes/routes.tsx:6`), which
precedes the guarded config load (`src/index.tsx:44-66`) and would turn a malformed runtime
block into an uncaught throw (R6); the README's User Settings decisions record the mechanism.

- Given a seeded token and `userSettings` on, when `/settings` opens, then the page renders inside
  `AppLayout` from the `settings` chunk with `document.title` "Налаштування - VilnaCRM".
- Given no token and `userSettings` on, when `/settings` opens, then the protected-route redirect
  lands on `/sign-in` with `state.from` naming `/settings`, and signing in returns there.
- Given `userSettings` off, with `twoFactorAuth` on or off, when `/settings` opens with or without
  a token, then the not-found page renders as for any unknown path and no `settings` chunk is
  requested.
- Given a malformed runtime block, when the app boots, then the accessible bootstrap fallback
  renders and no flag read throws first.

#### FR-3 — Page shell and the 2FA slot

One `h1` "Налаштування", a subtitle and a two-column grid: the profile card (the page renders
only while `userSettings` is on), and the 2FA slot column while `twoFactorAuth` is also on
(filled by the 2FA bundle). Desktop places
them side by side, tablet stacks the 2FA card below, mobile shows one column. This feature
builds the route contract and this shell; the 2FA bundle adds its section without changing
them (D12). The slot holds the 2FA settings card only: two-factor authentication has its own
page (the user, 2026-10-16, Figma `72:4846`), the sign-in challenge that the 2FA bundle serves
as its own public route, so this page never renders or links it (reconciled 2026-10-16).

- Given any breakpoint, when the page renders, then it has one `h1`, the subtitle, and `h2`
  section headings only, with no horizontal scroll down to 320 CSS px.
- Given 1440 px with both sections on, when it renders, then the card and the 2FA column sit side
  by side with the card first in reading order, and at 1024 px the 2FA column follows below.
- Given `userSettings` on and `twoFactorAuth` off, when the page renders, then only the profile
  card renders, no empty column remains, and the card keeps its desktop width.

> Assumption: the subtitle is "Керуйте особистими даними та безпекою облікового запису."
> ("Manage your personal details and account security."), replacing the research §3.6 draft that
> named only name, e-mail and password, which would leave out the 2FA card.

#### FR-4 — Home entry link

The home page gains one link, "Налаштування", to `/settings`, between the description and "Вийти"
(`src/features/home/index.tsx:22-28`), while `userSettings` is on; the 2FA bundle reuses it
and adds no second link (D3). It navigates in-app and asks
the arrival focus (`src/hooks/use-arrival-focus.ts:10-23`) to focus `main`.

- Given `userSettings` off, when `/` renders, then its DOM and requests equal today's `main`.
- Given `userSettings` on, when `/` renders, then one link named "Налаштування" with
  `href="/settings"` precedes "Вийти" in DOM and Tab order.
- Given the link is activated, when `/settings` renders, then no document load happened and `main`
  has focus.

### 5.2 Current user and page states

#### FR-5 — Current-user read

On mount the page reads `users(first: 1) { edges { node { id email initials confirmed } } }` with
the Bearer header (FR-21), `fetchPolicy: 'no-cache'`, the request deadline and the page's abort
signal (D4); on `main` the read is owner-scoped (research §4.3). The node's `id`, the IRI
`/api/users/<uuid>`, addresses both mutations verbatim; nothing decodes a JWT or builds an IRI.
After a successful mutation the page adopts the payload instead of reading again.

- Given the page mounts, when the read is sent, then exactly one `users` operation with `first: 1`
  selects only the four fields, carries the header, and leaves a `cache.write` spy uncalled.
- Given a resolved read, when the user saves or resends, then the mutation input carries that
  node's `id` unchanged.
- Given the page unmounts mid-read, when the abort settles, then nothing renders or is reported.

> Assumption: the read also uses `no-cache` (research §5.3): the cache is process-wide
> (`registerGraphqlClient`, `src/modules/user/config/di.ts:73-84`) and a cached `User` would hold the e-mail and go stale.

#### FR-6 — Loading and read failure

While the read is pending the `h1` and subtitle render and the card area shows a skeleton built
from the existing `UISkeleton*` blocks in the card's shape, with a polite status "Завантаження
профілю…"; it does not animate under `prefers-reduced-motion: reduce` (D18, R7). Any read failure
except a session end replaces the card area with "Не вдалося завантажити профіль" in a
`role="alert"` region and "Спробувати ще раз": no answer, the deadline, a 5xx, an HTTP 429, a
GraphQL error, malformed `data`, an empty `edges` list or a null `node`. Retry is
user-initiated, one read per activation, with the skeleton shown again. The loading status is one
polite region that stays mounted across the states and only changes its text, so a retry's
loading state is heard; a retry that fails again puts focus on the new "Спробувати ще раз",
because the button that held it was replaced by the skeleton.

- Given a pending read, when the page renders, then the skeleton is hidden from the accessibility
  tree, holds no focusable element, and the status says "Завантаження профілю…".
- Given a retry that fails again, when the failure state renders, then focus is on "Спробувати
  ще раз", the message is announced once, and the status region that announced the loading
  state is the same element as before the retry.
- Given an empty `edges` list, when the read settles, then the error state shows and the user is
  not signed out.
- Given each failure class, when it settles, then exactly one request was sent and the message is
  announced once.
- Given a retry that succeeds, when the card renders, then focus is on the card's first heading,
  focusable by script but not in the Tab order.

> Assumption: an empty connection is a read failure, not a sign-out (research §5.7), since an
> expired session arrives as the transport 401 of FR-19; a 429 on the read shows the same state.

#### FR-7 — Profile header

The card opens with a decorative monogram derived from the name, the greeting "Вітаємо!" in
`#57595B` instead of the failing `#969B9D` (D15) and the name in bold. There is no photo, pencil
badge, upload control or file input (D2). A successful name change updates it from the payload.

- Given the name "Олена Петренко", when the header renders, then the monogram shows "ОП", hidden
  from the accessibility tree, and a one-word "Admin" shows "A".
- Given the header, when computed styles are read, then the greeting is `#57595B` (7.03:1) and the
  monogram letters reach 4.5:1 on their disc.
- Given assistive technology, when the header is read, then "Вітаємо!" and the name are plain text
  with no image or heading role and no control.

> Assumption: the monogram is the upper-cased first letter of each of the first two words of the
> name, or a decorative person glyph for an empty name; it carries nothing the name does not.

### 5.3 The profile form

#### FR-8 — Form structure, labels and autocomplete

One form. Section "Особисті дані" (`h2`) holds "Ваше ім’я та прізвище" (`autocomplete="name"`,
prefilled), "E-mail" (the sign-up label since #311, `type="email"`, `autocomplete="email"`,
prefilled) and the row of
FR-15. Section "Пароль" (`h2`) holds "Поточний пароль" (`autocomplete="current-password"`) and the
optional "Новий пароль" (`autocomplete="new-password"`), both empty with eye toggles. The footer
holds "Зберегти зміни" (the submit) and "Очистити"; Enter in any field submits.

- Given the loaded page, when each field is queried by its visible label, then it is found, and no
  field relies on a placeholder for its name.
- Given the four inputs, when read, then their `autocomplete` tokens are `name`, `email`,
  `current-password` and `new-password`.
- Given an eye toggle activated with Space, when it updates, then the field shows text, the button
  name changes from "Показати пароль" to "Приховати пароль" and `aria-pressed` is `"true"`.
- Given a field in error, when it renders, then it has `aria-invalid="true"` and an
  `aria-describedby` naming the visible error text.

> Assumption: the fields reuse sign-up's labels (`src/modules/user/features/auth/i18n/uk.json:32`,
> `:39`), not a literal "Ваше ПІБ" / "Ваш e-mail", so one value has one name across the app.

#### FR-9 — Name, e-mail and current-password validation

The name uses the existing `FullNameValidator` and the e-mail the existing `EmailValidator`
(`src/modules/user/features/auth/components/form-section/validations/name.ts:16-51`,
`email.ts:9-37`), moved where settings can reach them (FR-25). Each runs only while its field
differs from the last loaded value (trimmed; the e-mail also lower-cased), so a legacy value never
blocks another change (D6). "Поточний пароль" has only a required rule, never the policy, and is
required for every Save with a change, a name-only change included (P1, G4).

- Given a loaded name "admin" that fails the client rule and only the e-mail changed, when Save
  runs, then no name error shows and the request is sent.
- Given the name edited to the single word "Олена", when Save runs, then the field shows "Будь
  ласка, введіть повне ім’я у правильному форматі", takes focus, and nothing is sent.
- Given a change and an empty current password, when Save runs, then that field shows "Це поле
  обов'язкове", takes focus, and nothing is sent.
- Given the current password `abc`, which fails the policy, when Save runs with a change, then no
  client error shows and the request is sent.

> Assumption: dirty-only validation extends from the name (D6) to the e-mail; an unchanged e-mail
> is never sent (FR-11), so validating it could only block an unrelated change.

#### FR-10 — New password with the shared policy and live rules

"Новий пароль" is optional: empty, it is neither sent nor validated. Filled, it must pass the one
policy shared with #315 and sign-up (U3): 8 to 64 characters, a digit, an ASCII uppercase letter
`[A-Z]` and crm's lowercase rule `\p{Ll}` (research §6.1). The four rules are listed under the
field and marked met or unmet as the user types, by icon plus text ("виконано" / "не виконано"),
never colour alone; the list is in the field's `aria-describedby` and is not a live region. A
hint says the field is optional; no confirmation field is drawn and none is added.

- Given an empty new password and a changed name, when Save runs, then the input has no
  `newPassword` and no rule error shows.
- Given the field holds `Pa1`, when the list updates, then only the length rule is unmet.
- Given the field holds `Пароль123`, when Save runs, then the shared uppercase message shows, the
  field takes focus, and nothing is sent.
- Given any value, when settings and #315's new-password field validate it, then both return the
  same result from one implementation.

> Assumption: the hint reads "Необов’язково. Залиште порожнім, щоб не змінювати пароль."; four
> unmet rules under an empty optional field would otherwise read as a demand.

#### FR-11 — Change detection and the update input

Changes are computed against the last loaded user: the name when its trimmed value differs; the
e-mail when its trimmed, lower-cased value differs, so a case-only edit is no change (D6, G3);
the password when "Новий пароль" is filled. With no change Save sends nothing, raises no field
error and says "Немає змін для збереження" in a polite status region of the form. Otherwise one
`updateUser` goes out with `id`, `password`, a fresh `clientMutationId` and only the changed
fields: `initials` trimmed, `email` trimmed as typed, `newPassword` as typed.

- Given only the current password typed, when Save runs, then nothing is sent, no field error shows
  and the status says "Немає змін для збереження".
- Given a case-only e-mail edit together with a name change, when Save runs, then the input
  carries `initials` and no `email`.
- Given only the name changed, when the request is inspected, then its input keys are exactly `id`,
  `password`, `initials` and `clientMutationId`.

> Assumption: the e-mail is sent trimmed in the typed case. Sign-up sends it untrimmed and trims
> only the name (`src/modules/user/features/auth/repositories/registration-api.ts:78-84`), but
> the shared validator checks the trimmed value, so an untrimmed address could pass the client
> and still fail upstream's `Email` rule.

#### FR-12 — Save: busy state, single flight, offline and focus

Save uses `UIForm`'s native busy state (D18): the button is disabled with the spinner and keeps
"Зберегти зміни" as its name, the form has `aria-busy` and "Збереження…" is announced. One request
is in flight at a time. Offline, Save is disabled and described by the offline notice. "Очистити"
and "Надіслати повторно" are inert during a Save, and the four fields are read-only (still
focusable, values unchanged), so nothing typed after Save is dropped when the adopted profile
remounts the form. A settled Save never leaves focus on `body`.

- Given Save activated twice quickly, when the network is observed, then one `updateUser` was
  sent.
- Given the browser offline, when Save is activated, then it is disabled, described by the offline
  notice, and nothing is sent.
- Given a Save that succeeds or ends in an error toast, when it settles, then focus is on
  "Зберегти зміни" and an error leaves every value in place.
- Given a Save that ends in field errors, when it settles, then focus is on the first field in
  error in DOM order, scrolled into view.

> Assumption: focus returns to "Зберегти зміни", the control that started the action, because the
> native busy state disables it and would otherwise drop focus to `body`.

#### FR-13 — Clear

"Очистити" restores the last loaded name and e-mail, empties and re-masks both password fields,
removes every field error and the no-change status, and sends nothing. It never blanks a field,
never dismisses a toast and is inert during a Save. It is outlined, its label reaches 4.5:1 and
is never the primary blue (D15); focus stays on it.

- Given edited fields, typed passwords and field errors, when "Очистити" is activated, then the
  fields hold the last loaded values, both password fields are empty and masked, no field has
  `aria-invalid`, and nothing is sent.
- Given a saved new name, when "Очистити" is activated, then the field holds the new name.

### 5.4 Outcomes

#### FR-14 — Success outcomes per changed aspect

A resolved `updateUser` whose payload passes its schema shows one success toast per changed
aspect, in the order name, e-mail, password (D7): "Зміни збережено", "Ми надіслали посилання для
підтвердження на нову адресу" and "Ви успішно змінили пароль" (P3; other devices are not
mentioned, D17). The page adopts the payload's user, empties both password fields and returns the
form to pristine; an e-mail change comes back with `confirmed` false.

- Given only the name changed, when the Save succeeds, then "Зміни збережено" shows and the header
  and field show the payload's `initials`.
- Given only the e-mail changed, when the Save succeeds, then its toast shows and the
  not-confirmed row appears.
- Given all three changed, when the Save succeeds, then three toasts show in the order name,
  e-mail, password, each announced once, and an immediate second Save sends nothing.

#### FR-15 — Not-confirmed row and resend

While `confirmed` is false, "E-mail не підтверджено · Надіслати повторно" sits under the e-mail
field (`386:27830`) and its status text is in the field's `aria-describedby`. "Надіслати
повторно" is a `button` (it sends mail) styled as a link in `linkText` `#0074B5` instead of
`#1EAEFF` (D15). It sends one `resendEmailToUser` with the user's `id`, ignores activation until
the request settles (P4), and is inert offline and during a Save. Success shows "Посилання для
підтвердження надіслано повторно"; failures follow FR-18.

- Given `confirmed` false, when the page renders, then the row shows and the e-mail field's
  description contains "E-mail не підтверджено", while `confirmed` true renders no row.
- Given the control activated twice quickly, when observed, then one `resendEmailToUser` carrying
  only `id` and `clientMutationId` was sent.
- Given a resend succeeds, when it settles, then its toast shows and focus stays on the control;
  a payload with `confirmed` true removes the row and moves focus to the e-mail field.
- Given unsaved edits in the form, when a resend succeeds, then every typed value is kept.
- Given the row, when computed styles are read, then the control is `#0074B5` (5.04:1) and the
  status text reaches 4.5:1.

#### FR-16 — Violations as field errors

The settings Data provider, with its Transformer, translates every answer (research §1.1,
NFR-15). A GraphQL error with
`extensions.status` 422 and `violations[].path`, or a message `<path>: <text>`, becomes field
errors in crm copy, never the server text (D8): `initials` gets the existing name-format message;
`email` gets "Електронна адреса вже використовується" when the message matches the uniqueness
text in `en` or `uk`, otherwise "Будь ласка, введіть коректну електронну адресу"; `password` gets
"Поточний пароль не прийнято. Перевірте його та спробуйте ще раз." on the current password;
`newPassword` gets #315's policy-rejected text. A violation list containing any unknown path
shows the generic error toast and no field error. A server error clears on the next edit of its
field.

- Given a 422 violation on `email` with the uniqueness message, when it settles, then the e-mail
  field shows "Електронна адреса вже використовується" and takes focus.
- Given no `extensions` and the message `email: This email address is already registered`, when it
  settles, then the same field error shows.
- Given violations on `initials` and `newPassword`, when they settle, then both fields show errors
  and focus is on the name, first in DOM order.
- Given violations of which one has an unknown path, when they settle, then the generic error
  toast shows and no field is in error.

> Assumption: an `email` violation is split by message because the client already rejects
> malformed addresses, so it is usually the uniqueness rule. A `password` violation means upstream
> ran the policy before checking the password (research §4.4, G4), so it says "not accepted".

#### FR-17 — Wrong current password

The shared upstream-error Transformer recognises a wrong current password by the message "Old
password is invalid" or its user-service Ukrainian translation, one constant set, with or without
`extensions` (R3, P5); it never reads `extensions.code`. #315's recorded decision rejects
classifying failures by message text, so the user module README records this row, the owner
refusal and the e-mail uniqueness text as an amendment until user-service G8 ships codes
(reconciled 2026-10-16); every other message still classifies by shape. "Поточний пароль" shows "Неправильний
поточний пароль" and takes focus, and every other value is kept. An unrecognised message falls
back to the generic error toast.

- Given "Old password is invalid" with no `extensions`, or its Ukrainian translation, when it
  settles, then the field shows "Неправильний поточний пароль" and has focus.
- Given an unknown message carrying a `FORBIDDEN` code, when it settles, then the generic error
  toast shows.
- Given the field error, when the form is inspected, then the other fields keep the typed values.

> Assumption: the architecture copies the Ukrainian text verbatim from the user-service catalogue
> at the pinned `main` SHA; other request languages fall back to the toast (research §7, risk 8).

#### FR-18 — Rate limit, transient and unknown failures

These are the error counterparts of the success toasts (U2). On `updateUser`: an HTTP 429 shows
"Забагато спроб. Спробуйте пізніше." with no action; no answer, the deadline or a 5xx shows "Не
вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз." with "Спробувати ще раз", which
removes its toast and runs Save on the current values; another GraphQL error or a malformed
payload shows "Не вдалося зберегти зміни. Спробуйте пізніше." with no action. On
`resendEmailToUser`: a 429 shows the rate-limit text; any other non-session failure, the
user-service resend time-out ("Cannot send new email till …") included, shows "Не вдалося
надіслати посилання. Спробуйте ще раз." with no action. Values are kept, nothing is re-sent on
its own, and a caller abort shows nothing.

- Given each failure class, when it settles, then the stated toast shows and exactly one request
  was sent.
- Given the transient toast, when "Спробувати ще раз" is activated, then one new `updateUser` is
  sent with the current values and focus is on "Зберегти зміни".

> Assumption: rate-limit and resend error toasts carry no retry action (brief §4): an immediate
> retry would hit the limit again, and the resend control stays available.

#### FR-19 — Session end

One shared rule ends a session, and only the shared link applies it (D10, R11, R12, R17, R28):
a non-anonymous operation answered by a transport HTTP 401, which is how user-service answers an
invalid, expired or revoked token before GraphQL runs, ends the session exactly as sign-out does:
it clears the observability user, the sandbox demo session and the token. No GraphQL error and no
other status ends a session, and a 401 ends one only while the store still holds the token the
failing request carried, so a late answer to a request sent with an earlier token, or with none,
leaves a session begun since, or a sign-out already done, alone (amendment 2026-10-21). The
protected route then sees the
token lost without a sign-out click and redirects to `/sign-in` with `state.from` naming
`/settings` and focus on `main`, which shows "Сеанс завершився. Увійдіть знову." once, in a
neutral info tone rather than #315's green success check; a first visit without a token shows
no notice. The
settings Data provider classifies a 401 and the owner refusal (HTTP 200, "Access Denied.") as a
session-ended outcome on which the page does nothing: no toast, no field error, no retry; the
typed values go with the page. Anonymous operations never trigger it and carry no token:
`CreateUser`, #315's public `RequestPasswordReset` and `ConfirmPasswordReset`, and the names
`SignInUser` and `CompleteTwoFactorUser` reserved for the 2FA bundle's GraphQL sign-in (crm signs
in over REST today).

- Given a transport 401 with user-service's problem+json body on any of the three operations,
  when it settles, then the URL is `/sign-in`, `state.from` names `/settings`, `main` has focus
  and no toast shows.
- Given "Access Denied." with HTTP 200 on any of the three operations, with no `extensions` or
  with `extensions.status` 403, when it settles, then no toast or field error shows and nothing is
  sent again.
- Given a GraphQL error, a 429 or a 5xx on a non-anonymous operation, when it settles, then the
  link keeps the token (must-fail: ending the session on a GraphQL error fails this case).
- Given the redirect, when `/sign-in` renders, then the notice is in a polite `role="status"`
  region, and a reload or Back does not show it again.
- Given the user signs in again, when `/settings` renders, then the user is read afresh and both
  password fields are empty.
- Given a 401 on `SignInUser`, or a sign-out through the home button, when it settles, then the
  link does nothing and no notice shows.
- Given a 401 that answers a request sent with an earlier token, or with none, after the store
  moved to a newer token or to signed out, when it settles, then the link leaves the store as it
  is and no notice shows.
- Given a signed-in user who opens a password-reset link, when `RequestPasswordReset` or
  `ConfirmPasswordReset` is sent, then it carries no `Authorization` header, and a 401 on it never
  ends the session.

> Assumption: the owner refusal needs no action of its own. Upstream answers "Access Denied." on
> `/api/graphql` only when no token reached it, because a present but unusable token gets the
> transport 401 first (research §4.5), so on a protected page the token is already gone and the
> protected route's redirect is under way. This feature appends the notice to #315's
> `SignInNotice`; the 2FA bundle (2FA PRD FR-34) uses the same notice.

### 5.5 Toasts

#### FR-20 — Toast primitive

A new shared `UI`-prefixed component in `src/components` (D9), built and used by settings only
(R16).
Two variants share one layout: success (`#1A1C1E` on `#E8F4EF`, check icon `#38B386`) and error
(`#1A1C1E` on `#FDECEC`, icon `#DC3939`); both backgrounds become palette tokens. A toast holds
its text, an optional action and a close button "Закрити сповіщення"; icons are `aria-hidden`.
The action is an underlined text button labelled in `#1A1C1E` (14.96:1 on `#FDECEC`, 15.15:1 on
`#E8F4EF`), never the link blue `#0074B5`, which reaches only 4.41:1 on `#FDECEC`; the close icon
is `#1A1C1E`, above the 3:1 non-text floor.
Success text is announced through one always-mounted polite `role="status"` region present from
the first render; an error toast has `role="alert"`. A toast never takes focus and never leaves
on a timer, only by its close button, its action, or a fourth arrival removing the oldest. Desktop
and tablet stack bottom-right, mobile spans the bottom (`315:11754`, `318:13410`). The fixed stack
sits in the DOM after the page content, before the footer; closing one moves focus to the next
toast's close button, else to "Зберегти зміни". Reduced motion removes all movement.

- Given a success toast, when it appears, then its text is announced once through the
  always-mounted status region and focus has not moved; an error toast has `role="alert"`.
- Given both variants, when axe runs in three engines, then there is no violation (text at
  15.15:1 and 14.96:1).
- Given a success toast, when 60 seconds pass without interaction, then it is still shown.
- Given three visible toasts, when a fourth arrives, then the oldest is removed.
- Given Tab from "Очистити", when pressed, then focus reaches the toast buttons before the footer,
  and closing the last toast puts focus on "Зберегти зміни".
- Given toasts at 375 px, when focus moves to a control under the stack, then the control is
  scrolled clear of it.

> Assumption: no toast auto-dismisses: the password-change confirmation exists nowhere else on
> the page, so a timer would be a time limit under WCAG 2.2.1 (D9 allowed one of 8 s or more).
> Overflow removes the oldest toast of either kind; it follows the user's next action, not a
> timer, so "errors never auto-dismiss" holds.

### 5.6 Transport, secrets and telemetry

#### FR-21 — Bearer header on GraphQL requests

Every non-anonymous GraphQL operation carries `Authorization: Bearer <token>` while an access
token is in memory, read at request time, and none without a token (D10). The link is
`SessionLinkFactory` in `src/modules/user/features/auth/repositories/`, composed into the Apollo
client inside the existing factory of `src/modules/user/config/di.ts:73-84`; its five
collaborators arrive as one named `SessionLinkDeps` bundle built in a `registerSessionLink` step,
the one function and one closure the link adds there (architecture §6, registrar budget),
reading the token per request from `useAuthStore.getState()` (R11). It lives in the
deferred DI chunk; REST is unchanged. This feature builds it, with FR-19; the 2FA bundle imports
it.

- Given a token, when `users`, `updateUser` or `resendEmailToUser` is sent, then it carries the
  header, and after a token change the next request carries the new token.
- Given no token, or an anonymous operation (`CreateUser`, #315's `RequestPasswordReset` and
  `ConfirmPasswordReset`, `SignInUser`, `CompleteTwoFactorUser`, one set this feature owns, as in
  FR-19), when the operation is sent, then it has no `Authorization` header.
- Given the paint-path graph test and `make lint-metrics`, when they run, then the link is not
  reachable from `src/index.tsx` and `di.ts` stays within its function cap.

#### FR-22 — Secret-bearing operation discipline

The read and both mutations use `fetchPolicy: 'no-cache'` and select only what the page needs
(`users` and the `updateUser` payload: `id`, `email`, `initials`, `confirmed`; the
`resendEmailToUser` payload: `id`, `confirmed`). Each checks the caller's abort signal before
sending, and none retries automatically: no retry link and no call to the existing
`RequestRetryService` (U6). Passwords travel
only in `variables.input` of the body. Documents are generated against pinned v2.8.0 with no
extension (D5); admitting a query document as a DI seam beside the `*-mutation.ts` seams
(`config/di-collaborator-policy.js:289-295`) is a reviewed policy edit.

- Given an `updateUser` carrying passwords, when it resolves, then a `cache.write` spy was never
  called.
- Given a signal aborted before the call, or a 5xx on either mutation, when it settles, then
  nothing, or exactly one request, was sent.
- Given `make codegen-check`, when it runs, then every document validates against the pinned
  schema with exactly the selection sets above.

#### FR-23 — Withdrawn (2026-10-08)

The `profile_update` security signal for a rejected current password was invented by the
planner; no gate requires it and user-service owns the rules and rate limits. It is withdrawn
with its category (D16, R28), so settings records no security signal. The id stays reserved.

#### FR-24 — Telemetry hygiene

The passwords, e-mail, name, IRI and token never reach observability. The Apollo error link
reports without variables (`src/services/observability/apollo-link-factory.ts:35-51`); the
scrubber already drops `password`, `token` and `email` keys and bearer strings
(`src/services/observability/pii-scrubber.ts:5-11,16`) and gains a denial for `initials`. The
IRI needs no scrubber rule: it travels only in variables and payloads, which the error link does
not report.

- Given an event with `password`, `newPassword`, `email` and `initials` at any depth, when it is
  scrubbed, then none of the four values remains.
- Given the settings e2e flows, when the network is observed, then only the document origin and
  the configured GraphQL origin, plus the REST API origin during the sign-in step of the
  session-end spec, are contacted.

### 5.7 Shared pieces and contrast

#### FR-25 — Shared pieces outside `@auth`

`no-cross-feature-imports` (`.dependency-cruiser.js:590-602`) forbids settings from importing
`@auth`, so the shared pieces live outside it before settings uses them (D11): the password
policy with its per-rule evaluation, `FullNameValidator` and `EmailValidator` under
`src/modules/user/lib/`; `UIFormField`, `UIPasswordField`, `UIPasswordPolicyRules` and
`UIServerFieldError` under `src/components` (the policy evaluation passed as a prop, the rule
list's `password_policy.*` copy moved with it into a lazy catalog the component owns) and the two
eye icons under `src/assets/icons`. `UIForm` gains `submitRef`, `submitSx` and a `footer` slot for
"Очистити", all built here; the FR-11 status is a region inside the settings form. Prerequisite
P.1: this branch is stacked on PR #340, where #315 is implemented (reconciled 2026-10-16).

- Given the moved pieces, when `make lint-deps` runs, then `no-cross-feature-imports`,
  `no-components-import-modules` and `no-lib-to-features` report nothing.
- Given the code base, when `make lint-dup` runs, then no field, policy or validator is copied.
- Given sign-in, sign-up and the #315 pages, when the visual lane runs, then none of their
  baselines changes: no existing baseline renders a field error (FR-26).

#### FR-26 — Contrast fixed at its source

Design colours below 4.5:1 are overridden at their source (U11, D15, R8): the greeting uses
`#57595B` (7.03:1) instead of `#969B9D`; the resend control uses `linkText` `#0074B5` (5.04:1)
instead of `#1EAEFF`; the app-wide field-error helper text, `#DC3939` at 4.48:1
(`src/components/ui-form-input-field/theme.ts:105-119`), moves to a darker error text colour of at
least 4.5:1, `#C62828` (5.62:1), one token built here and imported by 2FA (R19), recolouring
every auth error state. No existing visual baseline renders a field error (each auth visual spec
snapshots a resting or valid-input state), so the auth baselines do not change and the new
`/settings` field-error pair of NFR-3 is the first visual record of the token. Save keeps
the existing #276 exception (`form button[type="submit"].MuiButton-contained`); "Очистити" needs
none, and `A11Y_EXCEPTIONS` (`tests/utils/a11y/axe-config.ts:27-54`) gains no entry.

- Given field errors on `/settings`, when axe runs in three engines, then no `color-contrast`
  violation is reported outside the existing #276 entry.
- Given field-error helper text anywhere, when its colour is read, then it reaches 4.5:1 on white.
- Given the CI visual suite on this change, when it runs, then no existing baseline changes,
  because none renders a field error, and `A11Y_EXCEPTIONS` gained no entry.

### 5.8 Mock server

#### FR-27 — A stateless local mock

The local Apollo mock (`docker/apollo-server/`) answers the three operations from the pinned
schema as a stateless happy path (U4, R28), as #315's mock does: `users(first: 1)` returns the
seeded user for any request (no token mapping; P6 superseded by R28); `updateUser` whose `id` is not the seeded IRI answers HTTP 200
with "Access Denied." carrying `extensions.code` `FORBIDDEN` and `extensions.status` 403 (the
owner check), an `email` failing the mock's e-mail rule answers a `BAD_USER_INPUT` 422 violation
with the message `email: <text>`, and any other input returns the seeded user with the sent
fields applied, unconfirmed on an e-mail change, without storing them; `resendEmailToUser`
returns the seeded user's `id` and `confirmed`. Every error carries an `extensions.code` so
`formatError` keeps its message (`docker/apollo-server/lib/format-error.ts:13-32`). The mock
reads no token and keeps no state; the transport 401, the wrong password, the taken e-mail, 429,
5xx, the resend time-out and the empty connection are answered by msw in the integration suite
and by `page.route` in the browser lanes, with user-service's exact 401 problem body.

- Given any request, when `users(first: 1)` is sent, then the seeded user returns, so a host
  browser on the local `make start-prod` stack, which turns the flag on, renders the loaded
  page; the dev stack answers the same read but keeps the page behind its off flag (FR-1).
- Given an `updateUser` whose `id` is not the seeded IRI, when it is sent, then the answer is
  HTTP 200 with "Access Denied.", `FORBIDDEN` and `extensions.status` 403.
- Given a malformed `email`, when `updateUser` is sent, then the answer is a 422 violation on
  `email`; a valid input returns the seeded user with the sent fields.
- Given the apollo-server suite, when it runs, then every branch is covered.

> Assumption: the browser lanes never reach the Apollo mock, because the bundled GraphQL URL is
> not served inside the Playwright container; specs answer every settings operation, the read
> included, with `page.route` on `operationName` (the shape of #315's `answer` helper in
> `tests/e2e/mobile/password-recovery-touch.spec.ts`), so no error shape needs to live in the
> mock.

### 5.9 Copy, inventories and recorded decisions

#### FR-28 — Copy in `uk` and `en`

Every string exists in both catalogs with identical key sets, or reuses an identical existing
eager string; no literal ships in source (D14). §12 holds the drafts. The settings copy ships as a
lazy catalog the settings route registers (#315's mechanism, `config/i18n-catalog-policy.json`),
so the eager catalog every page downloads grows only by the keys other pages render (the home
link, the session-ended notice, the toast's close label); the merged catalog is regenerated for
those. #315's lazy recovery keys are never referenced from settings (reconciled 2026-10-16).

- Given the two catalogs, when `make lint-i18n` runs, then key sets are identical, no string is
  empty and every `t()` key resolves in both locales.
- Given `uk`, when `/settings` renders in every state, then no English or Russian text is visible.

#### FR-29 — Route-coverage and lane inventories

`tests/e2e/route-coverage.tsv` gains `settings` rows (suites `e2e` and `visual` only,
`scripts/ci/check-e2e-route-coverage.ts:25-28`): e2e rows for the flow spec, the axe route scan,
the keyboard spec and the mobile touch spec; visual rows for the desktop matrix and the mobile
lane. The axe scan (`tests/e2e/a11y/routes.a11y.spec.ts:20-38`) gains `/settings` with
`seedAuth: true`, ready on the loaded form; the home keyboard spec gains the link stop. The
Lighthouse URL list of `lighthouse/constants.js` stays its eight unchanged URLs (`/`, `/sign-up`,
`/sign-in`, `/forbidden`, `/server-error`, an unknown path, `/password-recovery`,
`/password-reset`; brief §5).

- Given the manifest, when `make check-e2e-route-coverage` runs, then it passes with no
  allowlisted `settings` row and every named spec exists under its suite root.
- Given the axe scan, when it runs, then `/settings` is scanned loaded in three engines with zero
  violations outside the #276 entry.

#### FR-30 — User Settings decisions in the module README

A `## User Settings decisions` section of `src/modules/user/README.md` (U10), beside #315's
`## Password recovery decisions` and in its context, decision and rejected shape, records: route
gating by one flag read lazily; the current user from `users(first: 1)` and its IRI; the Miro
layer stack with the Data provider as the translation boundary and its classification table
(violation paths, message rows, owner refusal, the 401 rule); named types at every layer
boundary (TB-1) and board types passed as themselves (TB-2); the change-only input; `no-cache`,
minimal selection, abort check and no retry; the toast contract; the shared Bearer link; the
lazy settings catalog; the field-error colour; the stateless mock. No ADR is written: PR #333
deleted every ADR from 003 up and the maintainer decided that ADR content goes into a README or
nowhere (reconciled 2026-10-16).

- Given `src/modules/user/README.md`, when it is read, then the section exists after #315's, every decision states its context, the decision and the rejected options, and `make lint-docs` and `make lint-doc-links` pass.
- Given `make check-adr-drift`, when it runs in CI on the pull request, then it passes through the body's `[no-adr]` line although `src/config/**` changed, and `docs/adr/` is unchanged.

## 6. Non-functional requirements

Floors come from `.claude/react-sdlc.yml` (`quality.*`, lines 50-65) or the config file each gate
enforces. They are raise-only and ceilings stay at zero: no story satisfies a gate by editing a
threshold, adding a suppression, narrowing a scope or re-baselining to force a pass. The only
reviewed deviations are the intended re-baselines of NFR-3.

### NFR-1 — Coverage and mutation score

Statements, branches, functions and lines at 100 (`coverage_*`; `jest.config.ts`
`coverageThreshold`) in the unit and integration suites over `src/**`, every new file with a
direct test. `mutation_msi: 100`, enforced as `stryker.config.mjs` `break: 100`: static tables
(classification rows, message sets, toast styles) load inside the test body so their mutants are
reachable, and an equivalent mutant is removed by the simpler program or annotated with its proof.

### NFR-2 — Lint, types, architecture, duplication and metrics

`eslint_errors: 0`, `eslint_warnings: 0`, `tsc_errors: 0` under the strict flags,
`depcruise_violations: 0`, `markdownlint_errors: 0`, `jscpd_clones: 0` (`.jscpd.json`: 70 tokens,
5 lines), and no inline suppression. The conventions hold (U7): classes outside components, no
statics or free functions, type-only files, approved suffixes, DI tokens, no new module-level
singletons, `useService` as the only component bridge, a container-free auth paint path, no
`data-testid`, no `@apollo/client` outside the data layer (`.dependency-cruiser.js:374-397`),
and no new class with a `Controller`, `Service`, `Handler` or `Normalizer` suffix (NFR-15).
`metrics_enforced: true` against `config/metrics-policy.json` (cyclomatic 10, cognitive 15, ABC
17, three arguments, function LLOC 10; per file 10 functions, 6 closures; per class 8 public
methods); `src/modules/user/config/di.ts` held nine functions and three closures, and settings
adds one of each, the `registerSessionLink` step and its `useFactory` (FR-21), so the registrar
stands at ten of ten functions and four of six closures. Every other settings class takes at
most three `@inject` parameters; the link's `SessionLinkDeps` bundle is the one deps value,
because a constructor may take three arguments (contract §2.2).

### NFR-3 — Visual regression

`visual_diffs: 0`. New baselines from the CI artifact, never a local container: `/settings`
resting over the 13 sizes in three engines; desktop and mobile pairs for the not-confirmed row,
field errors, three success toasts, the transient error toast, the skeleton and the load failure;
the resting page on Pixel 7 and iPhone 14. Intended re-baselines: the home page (the test stack
turns the flag on, FR-4). No existing baseline renders a field error, so FR-26 re-records
nothing. Nothing else changes.

### NFR-4 — Lighthouse floors

The profile records `lighthouse_desktop: 95` and `lighthouse_mobile: 85`; CI asserts performance
0.95 on desktop (`lighthouse/lighthouserc.desktop.js:19`) and 0.84, median of three runs, on
mobile (`lighthouse/lighthouserc.mobile.js:35`). Neither the profile values nor the CI assertions
may be lowered, and the existing one-point gap is not closed downwards. The eight unchanged URLs
of `lighthouse/constants.js` (`/`, `/sign-up`, `/sign-in`, `/forbidden`, `/server-error`, an
unknown path, `/password-recovery`, `/password-reset`) keep every category score; `/` gains only
the link.

### NFR-5 — Bundle and paint-path budgets

`config/performance-budget.json`: raw entrypoint 470 000 B and asset 400 000 B (Rspack hints);
gzip entrypoint 165 000 B and chunk 130 000 B; Lighthouse script 265 000 B and total 480 000 B.
The page is the lazy `settings` chunk; the eager entrypoint grows only by the route key, the
contract with its flag and the route flag gate shared with the two-factor bundle (#331, R17),
plus the protected route's session-ended notice rule and three eager catalog keys (the home link,
the session-ended notice, the toast's close label), under 1 kB gzip together; every other
settings string ships in a lazy catalog (#315's mechanism, `config/i18n-catalog-policy.json`).
The Data provider, Transformers, Repository, zod, tsyringe, Apollo and the link stay off the
static graph from
`src/index.tsx`, with no eager `@mui/material` import (CLAUDE.md, "The MUI theme engine is not
on the eager path"). The deferred DI chunk grows only
by the settings data-access classes and the link; both chunks are measured in the pull request
and no budget is raised.

> Assumption: the brief's "0 bytes" of eager growth reads as "no new eager module beyond the route
> declaration and its gate": the registry is eager (`src/routes/registry.ts:6` via
> `src/routes/routes.tsx:6` and `src/app.tsx:4`), so declaring the route costs a few hundred
> bytes however it is gated, and a gate above the protected route is the only way to show the
> not-found page without a token (FR-2).

### NFR-6 — Accessibility standard

WCAG 2.1 AA is binding (`docs/accessibility/acceptance-standard.md`, U11): jest-axe over the new
components and every page state, `@axe-core/playwright` on `/settings` in three engines, no
positive `tabindex`, no new `A11Y_EXCEPTIONS` entry. One `h1` and `h2` sections; visible
associated labels with FR-8's autocomplete tokens; `aria-invalid` and `aria-describedby` on
errors; each outcome announced once; no meaning by colour alone; FR-26's overrides. Ahead of the
standard: inputs, Save, "Очистити" and toast buttons 44 CSS px tall on mobile, "Надіслати
повторно" 24 px; the eye toggle keeps its known 32 px shared gap (issue #154).

### NFR-7 — Keyboard contract

A new keyboard spec asserts, with `tests/utils/a11y/keyboard.ts`, the order name → e-mail →
"Надіслати повторно" (when shown) → current password → its toggle → new password → its toggle →
"Зберегти зміни" → "Очистити" → the 2FA card (when on) → toast buttons (when shown) → footer. Every
stop is `:focus-visible` with the repository ring; Space toggles; Enter submits; focus follows
FR-6, FR-12, FR-13, FR-15 and FR-20, and lands on `main` of `/sign-in` after a session end.

### NFR-8 — Mobile touch lane

In `tests/e2e/mobile/` on both device projects: the three changes and a resend complete with
`tap()` only; toggles respond to a tap; inputs, Save and "Очистити" are 44 CSS px or taller; no
horizontal overflow at 390 and 412 px; Save stays reachable at the keyboard-height viewport;
toasts never cover the focused control; a no-change Save fires no request; `retries: 0`.

### NFR-9 — Security

Passwords, e-mail, name and token never reach the URL, storage, the Apollo cache, logs or
telemetry (FR-22, FR-24); both password fields are emptied after a success, on "Очистити" and
on unmount. The token stays in memory and is read per request; no JWT decoding, no client-built
IRI; owner scope is the server's. No new origin; `config/security-headers.json` is unchanged;
shipped defaults keep `userSettings` off until after G1; the seed and header gates stay green.

### NFR-10 — Reliability and observability

All three operations run under the request deadline (`REACT_APP_REQUEST_TIMEOUT_MS`, default
10 000 ms, through the `DeadlineFetchAdapter`) and forward the abort signal; the chain has no
retry link; a timeout is a transient failure with a user-initiated retry. The route has the
composer's error element; its chunk loader retries an import once and never reloads a protected
page. Errors reach observability only through the existing Apollo error link, once and without
variables, with both correlation ids; settings adds no direct SDK call and records no security
signal, an empty `REACT_APP_SENTRY_DSN` stays a no-op, and telemetry never blocks a flow.

### NFR-11 — Localization, console gate and test conventions

`make lint-i18n` passes (identical `uk` and `en` key sets, catalog regenerated with
`make i18n-generate`, no lazy key used outside its owners). No unexpected `console.error` or `console.warn`; a logging path is spied
and asserted per test. Test data comes from the seeded Faker builders, literals only where the
value is the case (case-only e-mail, Cyrillic password, upstream messages); queries by role,
label or text; no skipped, focused or assertion-free test, conditional `expect` or sleep.

### NFR-12 — Test lanes

- Unit (jsdom): every component, hook and class, including the toast, page states, change
  detection, classification table and link.
- Integration: msw `graphql` handlers on the configured GraphQL URL drive every row of the §1
  outcome table through the real Data provider, Transformers, Repository and Apollo client,
  including HTTP 401 and 429, the
  owner refusal, code-less errors and the `cache.write` spy.
- Apollo server: every branch of FR-27. E2E desktop: the §4 journeys on the test stack, with
  `page.route` for mutations and statuses. E2E mobile, axe and keyboard: NFR-6 to NFR-8.

### NFR-13 — Documentation and ADR drift

The User Settings decisions in `src/modules/user/README.md` (FR-30; no ADR, so the pull-request
body carries `[no-adr]` for `make check-adr-drift`); `docs/feature-flags.md` (FR-1); the module
README's settings description and a feature README; `src/routes/README.md` for flag-gated
routes; a Storybook story per toast variant.
`CLAUDE.md` gains a pattern only if
the toast or the flag-gated route becomes a convention for other features. `make lint-docs` and
markdownlint report zero findings.

### NFR-14 — Typed boundaries (TB-1)

The canonical rule of the shared Miro layer contract (§4), verbatim:

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

Position 5's "reactive-var state" reads as Zustand store state, since the chore
`zustand-client-state` landed with PR #333; the frozen text is unchanged.

Shipped gate (PR #333, reconciled 2026-10-16): it also gates non-exported top-level functions
and every constructor parameter property, `private readonly` included, and it allows a mapped
type over a named key union; see CLAUDE.md, "Typed boundaries (TB-1, issue #332)".

TB-2 sits beside TB-1 and leaves its text unchanged; verbatim from the contract §4:

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

TB-2's frozen text names the naming check's story by its former id: it is now #315 Story 0.2.

The gate that enforces TB-1 (two ESLint selector arrays,
`@typescript-eslint/consistent-type-definitions` at `error`, their fixtures and the policy pin)
is the chore #332 (`typed-boundaries-gate`), which lands first; #315 Story 0.2 then adds the
shared User domain and the TB-2 naming check (`tests/unit/tooling/domain-type-names.test.ts`).
This feature adds no selector or check and depends on both (§7, P.2). Settings applies TB-2 this
way: `UserEntity` is #315's and travels from the route page to the card as itself; the password
change is a plain `PasswordChange`, not a board type, because the board's `RestorePasswordDTO`
is #315's forgotten-password request; and no settings type ends in `Dto` or `Entity`. Settings
examples: the toast queue takes a `ToastDraftSet`, field errors travel as a
`ProfileFieldErrorSet`, the route contract's flag is one `FeatureFlag`, and each outcome variant
(`ProfileUserOutcome`, `ProfileInvalidOutcome`, …) is a named interface.

Acceptance:

- Given every new or changed file under `src/` of this feature, when `make lint-eslint` runs
  with the chore's TB-1 selectors, then it reports zero findings and no file carries a
  suppression.
- Given the settings type-only files, when they are read, then every object shape is an
  `interface`, every collection that crosses a layer is a named `*Set` interface whose `items`
  are a named interface, and no `Record`, `object`, index signature, tuple or inline `Omit`,
  `Pick`, `Partial` or `Required` appears at a boundary position.
- Given every hook, component, Data-provider method and DI registration of this feature, when
  its signature is reviewed, then no generated type, inline object or bare array appears in it,
  and generated types are imported only below the Data provider (the review-gate half the
  syntactic selectors cannot see, contract §4.1.7).
- Given #315's TB-2 naming check, when it runs, then no settings type is named `*Dto` or
  `*Entity`, and `UserEntity` is imported from `src/modules/user/types/user/`, never declared.
- Given the settings components, when their props are reviewed, then the page passes
  `UserEntity` to `UserProfileSettings` and its form as itself, never a re-shaped copy, and no
  settings type uses #315's `RestorePasswordDto`.

### NFR-15 — Miro layer alignment

The feature follows the board's frontend layers and only those (contract §1, §2):
`[component]<route>` → `[component]` → React hook → `[Data provider]` ⇄ `[Transformer]`, and
`[Data provider]` → GraphQL `[Repository]` → API `[Software System]`, with State beside them;
`[type]` boxes are named `*Dto` or `*Entity` interfaces. The board names the pieces: the route
page is `UserProfile`, the card `UserProfileSettings` and the user `UserEntity` (#315's,
loaded by the page). The board's `RestorePassword` → `RestorePasswordDTO` pair is #315's
forgotten-password flow (contract Q-1), so the settings password block is `ChangePassword`
with the plain payload `PasswordChange`, a declared gap in the conformance table. There is no
frontend Controller, Service or Handler layer: the board shows "Controller" only in the
Structurizr sample's server-side Spring controllers and "service" only as backend containers.

Acceptance:

- Given the architecture's Miro conformance table, when it is read, then every node of its
  context, component, layer and code diagrams and every new class maps to a board element or
  is infrastructure the contract places inside a board box, and each gap is named with its
  reason.
- Given the new classes of this feature, when `make lint-eslint` runs the class-naming gate,
  then each ends in `Provider`, `Transformer`, `Repository`, `Detector`, `Loader` (the two
  lazy-catalog seams) or `Factory` (the shared `SessionLinkFactory`), and none ends in
  `Controller`, `Service`, `Handler`,
  `Normalizer`, `Store` or `Impl`.
- Given `make lint-deps`, when it runs, then components import no Data provider, Transformer
  or Repository, hooks reach the Data provider only through `useService`, and only the Data
  provider reaches the Repository and the Transformers.

## 7. Dependencies and prerequisites

| Prerequisite                                                   | Owner         | Needed for          |
| -------------------------------------------------------------- | ------------- | ------------------- |
| P.2: TB-1 gate, suffixes (chore #332, merged, PR #333)         | chore #332    | NFR-14, NFR-15      |
| P.2: Zustand stores (chore #334, merged, PR #333)              | Zustand chore | FR-19, FR-21        |
| P.1: folders, `UserEntity`, TB-2 check (#315, PR #340)         | #315          | NFR-14, NFR-15      |
| P.1: #315 implemented; this branch stacks on PR #340           | crm           | FR-10, FR-16, FR-25 |
| Route key, contract, shell and route flag gate (R17)           | settings      | FR-2, FR-3          |
| Bearer link, session end and its notice                        | settings      | FR-19, FR-21        |
| Toast primitive (settings only, R16)                           | settings      | FR-20               |
| One home link, reused by the 2FA bundle                        | settings      | FR-4                |
| User-service release of `main`'s authentication (G1)           | user-service  | production only     |
| CORS admits the crm request headers (#514), or same-origin API | user-service  | production only     |
| Figma design gate through the Figma MCP                        | tooling       | UI stories          |

P.2 is PR #333, merged into `main`: the chore #332 (typed-boundaries gate) and the chore
`zustand-client-state` (#334; `useAuthStore` and `useConnectivityStore`, ADR-002's "Current
rules"). P.1 is PR #340, on which this branch is stacked: #315 implemented, with the feature and
module folders and `UserEntity`. The landing order is PR #333, #315, this feature, then #331,
which imports the shared pieces this feature builds (D12).
Implementation against the mock blocks on nothing upstream; the contract pin does not move (D5).

## 8. Upstream issues

Filed against user-service after readiness, never during planning; nothing already tracked
(research §4.9) is filed again.

| Id  | Request                                                              | Blocks          |
| --- | -------------------------------------------------------------------- | --------------- |
| G1  | Release `main`'s authentication surface (widen #513 or a sibling)    | production only |
| G2  | A `me` query, or the user id in `AuthPayload`                        | nothing         |
| G3  | Own unchanged e-mail rejected by `UniqueEmail`; regression test      | nothing         |
| G4  | Profile update without the current password; OAuth users             | nothing         |
| G5  | Avatar field, upload and storage                                     | nothing         |
| G6  | Signed-in social link, list and unlink                               | nothing         |
| G7  | GraphQL `updateUser` and `deleteUser` bypass the limiters            | nothing         |
| G8  | Machine-readable `extensions.code` on domain errors, shared with 2FA | nothing         |

G8 is one issue for both bundles; whichever session files first, the other comments. G9 and G10
belong to other work; G11 is tracked upstream and G12 is noted in research §4.8.

## 9. Follow-ups

Not dispatched with this feature; no story waits for them.

1. Enable `userSettings` in production once G1 ships and is deployed, and either user-service
   CORS admits `Authorization`, `X-Request-Id` and `X-Correlation-Id` (#514, research §4.5) or
   the API is served same-origin.
2. Bump the contract pin to that release; no schema change is expected (D5).
3. Avatar upload (G5) and social networks link, list and unlink (G6) once user-service has them.
4. App-shell navigation with a user-menu entry replacing the home link (D3).
5. OAuth-created users and password-free profile changes once upstream allows (P1, P2, G4).
6. Client throttling of "Надіслати повторно" tied to the upstream limiter (P4, #470).
7. Classify errors by machine-readable codes once G8 ships (R3); a `me` query if G2 ships.
8. Fix the `UIForm` banner's `red` text (4.00:1, research §3.4), which settings does not render.
9. Delete the `userSettings` flag per the documented lifecycle.
10. Make `make new-feature` write the token object `config/tokens.ts` declares (it writes
    `USER_TOKENS` where the `user` module has `AUTH_TOKENS`, research §5.7); this feature fixes
    the generated lines by hand.

## 10. Open design questions

None blocks v1; each default holds until the design owner answers (research §8.1).

| Question                         | v1 default                                           |
| -------------------------------- | ---------------------------------------------------- |
| Error toast frame                | success layout on `#FDECEC`, icon `#DC3939` (FR-20)  |
| Field error states               | existing style, text colour fixed at source (FR-26)  |
| Page-load error state            | a message and a retry button in place of the card    |
| After an e-mail change           | toast plus "not confirmed · resend"; no inbox panel  |
| Subtitle, copy, mobile header    | FR-3 and §12 drafts; mobile keeps the desktop title  |
| "Очистити" colours               | outlined, label at 4.5:1 or more, never primary blue |
| Greeting and resend overrides    | `#57595B` (7.03:1) and `#0074B5` (5.04:1)            |
| Monogram without a pencil badge  | decorative, hidden from assistive technology         |
| Optional hint under the password | the FR-10 text                                       |
| Toast timing                     | no timer; close, action or overflow only (FR-20)     |

## 11. Traceability

| FR    | Research         | Brief  | Design or decision                        |
| ----- | ---------------- | ------ | ----------------------------------------- |
| FR-1  | §5.4, §7         | §6     | U5, R10                                   |
| FR-2  | §5.1, §5.4       | §3, §6 | D12, D13, R6, R17                         |
| FR-3  | §3.1, §3.6       | §3     | `313:10242`, `313:10480`, `313:10606`     |
| FR-4  | §5.1, §6.2       | §3     | D3; Miro "User profile settings"          |
| FR-5  | §4.3, §5.3       | §6     | D4; Miro "User settings" → API            |
| FR-6  | §3.5, §5.5       | §3     | no frame (D18, R7)                        |
| FR-7  | §3.2, §3.4       | §4     | `313:10242` header; D2, D15               |
| FR-8  | §3.2, §5.5       | §4     | `313:10242` card                          |
| FR-9  | §4.4, §5.5       | §4     | D6, P1                                    |
| FR-10 | §6.1             | §4     | `313:10242` "Пароль" block (U3)           |
| FR-11 | §4.4             | §3, §6 | D6, G3                                    |
| FR-12 | §5.5             | §3     | `UIForm` busy state (D18)                 |
| FR-13 | §3.2             | §3     | `313:10242` footer pair                   |
| FR-14 | §4.4             | §3, §4 | `315:11754`, `318:13410`; D7, P3          |
| FR-15 | §3.2, §4.2       | §3     | `386:27830`, `386:27945`, `386:28059`     |
| FR-16 | §4.6             | §3, §4 | no frame (D8)                             |
| FR-17 | §4.6, §6.2       | §3     | R3, P5                                    |
| FR-18 | §4.6, §4.7       | §4     | U2                                        |
| FR-19 | §4.5, §5.1, §6.2 | §3, §4 | D10, R11, R12, R17                        |
| FR-20 | §3.2, §3.4       | §4     | `315:11754`, `315:12551`, `318:13410`; D9 |
| FR-21 | §5.2, §6.2       | §4     | R11                                       |
| FR-22 | §5.3, §6.1       | §7     | U6                                        |
| FR-23 | withdrawn        | —      | D16 withdrawn (R28)                       |
| FR-24 | §5.2             | §5     | U6                                        |
| FR-25 | §5.5, §5.7, §6.1 | §4, §8 | D11                                       |
| FR-26 | §3.4, §5.6       | §4     | D15, R8                                   |
| FR-27 | §4.6, §4.10      | §6     | U4, P6, R10, R13, R15                     |
| FR-28 | §3.6             | §4     | D14                                       |
| FR-29 | §5.1             | §5     | route-coverage gate                       |
| FR-30 | §5.7             | §6     | U10                                       |

## 12. Draft copy

Drafts for FR-28, `uk` then `en`; "reused" strings come from the sign-up, auth or #315 catalogs.

- Title, `h1`, home link: "Налаштування" / "Settings". Subtitle: "Керуйте особистими даними та
  безпекою облікового запису." / "Manage your personal details and account security."
- Greeting "Вітаємо!" / "Welcome!"; loading "Завантаження профілю…" / "Loading your profile…";
  load failure "Не вдалося завантажити профіль" / "Your profile could not be loaded".
- Sections "Особисті дані" / "Personal details" and "Пароль" / "Password"; fields "Поточний
  пароль" / "Current password" and "Новий пароль" / "New password"; name and e-mail reused.
- Hint "Необов’язково. Залиште порожнім, щоб не змінювати пароль." / "Optional. Leave empty to
  keep your current password."
- "Зберегти зміни" / "Save changes"; "Очистити" / "Clear"; "Збереження…" / "Saving…"; "Немає змін
  для збереження" / "There are no changes to save"; "Закрити сповіщення" / "Close notification".
- Row "E-mail не підтверджено" / "E-mail not confirmed"; "Надіслати повторно" / "Send again".
- Success: "Зміни збережено" / "Changes saved"; "Ми надіслали посилання для підтвердження на нову
  адресу" / "We sent a confirmation link to the new address"; "Ви успішно змінили пароль" / "You
  have changed your password"; "Посилання для підтвердження надіслано повторно" / "The
  confirmation link has been sent again".
- Errors: "Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще раз." / "The changes
  could not be saved. Check your connection and try again."; "Не вдалося зберегти зміни.
  Спробуйте пізніше." / "The changes could not be saved. Please try again later."; "Забагато
  спроб. Спробуйте пізніше." / "Too many attempts. Please try again later."; "Не вдалося
  надіслати посилання. Спробуйте ще раз." / "The link could not be sent. Try again."
- Fields: "Неправильний поточний пароль" / "The current password is incorrect"; "Поточний пароль
  не прийнято. Перевірте його та спробуйте ще раз." / "The current password was not accepted.
  Check it and try again."; "Пароль не відповідає вимогам. Перевірте правила нижче" / "The
  password does not meet the requirements. Check the rules below" (a settings key with the text
  of #315's lazy recovery key, which settings cannot reference, reconciled 2026-10-16); required,
  name and e-mail formats, e-mail in use, the policy rule texts (rendered by the moved rule list
  from its own catalog) and "Спробувати ще раз" reused.
- Shared with 2FA: "Сеанс завершився. Увійдіть знову." / "Your session has ended. Please sign in
  again."

## 13. Out of scope

The boundary Ralph builds within; §2 "Non-goals" and §9 "Follow-ups" give the reasons, and epics
Follow-ups 5.1 to 5.13 hold the deferred work. Appended last so the section numbers the epics and
architecture cite do not move.

- Avatar upload, crop and removal (D2, G5; Follow-up 5.4) and the social networks card with link,
  list and unlink (D2, G6; Follow-up 5.5).
- The app-shell sidebar, header and user menu with its "user settings" entry (D3; Follow-up 5.6);
  the home link of FR-4 is the only entry point.
- The two-factor authentication sign-in challenge: it is #331's own page (Figma `72:4846`, "Назад",
  six digit cells, "Підтвердити" and a resend countdown), an always-registered public route that
  `/settings` never renders or links to. The 2FA settings card itself is #331's too; this feature
  only leaves its grid slot (FR-3).
- Delete account and a sessions list.
- Special handling for OAuth-created users and password-free profile changes (P1, P2, G4;
  Follow-up 5.7); a `me` query or JWT decoding (D4, G2; Follow-up 5.10).
- Client throttling or a countdown on "Надіслати повторно" (P4, #470; Follow-up 5.8); token
  refresh.
- Classifying user-service errors by stable codes (R3, G8; Follow-up 5.9); until then only the
  whole-message texts of FR-16, FR-17 and FR-19 are read as text.
- Production enablement of `userSettings` with the contract pin bump (Follow-up 5.2) and
  deleting the flag (Follow-up 5.3); filing the user-service issues (Follow-up 5.1).
- The `UIForm` error banner's contrast, which settings does not render (R14; Follow-up 5.12),
  and making `make new-feature` write the module's token object (R5; Follow-up 5.11).
- A prompt when leaving the page with unsaved edits.
- Answers to the open design questions of §10 (Follow-up 5.13); the defaults stated there apply.
