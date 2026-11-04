---
status: complete
workflowType: product-brief
stepsCompleted: [1, 2, 3, 4, 5, 6]
project_name: crm
date: 2026-10-06
revised: 2026-10-08
feature: two-factor-authentication
issue: https://github.com/VilnaCRM-Org/crm/issues/331
author: 'analyst (Mary), autonomous run'
inputDocuments:
  - ./research-two-factor-authentication-2026-10-06.md
  - 'orchestrator: decisions-2fa.md (binding user rules, D1-D13, research-stage corrections)'
  - .claude/react-sdlc.yml
  - tests/utils/a11y/axe-config.ts
  - lighthouse/lighthouserc.mobile.js
  - src/routes/route-paths.ts
  - src/config/runtime/types/feature-flag.ts
---

# Product Brief: two-factor authentication for the `user` module

Predecessor: [research](./research-two-factor-authentication-2026-10-06.md) (Miro intent, the
user-service contract on `main`, the Figma inventory, the crm code map, risks and mock drift).
Every figure below comes from that document; section references such as "research §3.4" point
into it. Decisions taken by the orchestrator on the user's behalf are cited as D1-D13 and bind
this brief. Decisions this stage fixed on its own are marked `> Assumption:`.

> Simplification 2026-10-08 (`_planning-shared/over-engineering-review-2026-10-08.md`, "apply
> all 10"; the user: "we should use only repositories to access data but with graphql, not the
> REST, we use only graphql"). Sign-in runs over GraphQL `signInUser` in every environment and
> this feature removes the REST login placeholder; the `twoFactorAuth` flag gates only the 2FA
> section of `/settings`; the challenge route is not flag-gated. The `/settings` page, its route
> gate, the home link, the Bearer link with its session end, the session-ended notice and the
> error-text red are built by the User Settings bundle (#330), which lands before this feature;
> the shared User domain, the error transformer, the provider loader, the auth card, the arrival
> notices and the pending-contract directory are #315's. The mock is a stateless happy path, the
> self-expiry checker is dropped, and the settings section records no security signal. The
> lines below are updated accordingly; the PRD is authoritative.

## 1. Executive Summary

A VilnaCRM account is protected by one secret today: the password. Anyone who learns it — a reused
password from another breach, a phished form, a shoulder-surfed laptop — owns the account and the
customer data behind it. The Miro product board already reserves two components for a second
factor ("Give possibility to 2FA in VilnaCRM"): a challenge step routed beside sign-in and
sign-up, and a 2FA settings card inside the user profile (research §2). user-service implements
the backend on its `main` branch: TOTP authenticator apps plus single-use recovery codes, exposed
as six GraphQL mutations (research §3.2).

This brief defines the crm side:

- **Two-factor challenge** — a user whose account has 2FA on enters the six-digit code from an
  authenticator app (or a recovery code) on `/sign-in/two-factor` after a correct password.
- **Two-factor settings** — a signed-in user turns 2FA on (QR code, manual key, confirm code,
  recovery codes shown once), turns it off, and generates a fresh set of recovery codes, in a
  section of the protected `/settings` page that User Settings (#330) builds.

No user-service tag carries the operations yet (crm pins `v2.8.0`; release requested in
user-service #513, pipeline broken per #458). The feature is therefore built and working now
against mocked GraphQL — a pending schema extension copied from user-service `main` at
`a95c1e85`, answered by a stateless local mock and deleted when the pin moves. Sign-in moves to
GraphQL everywhere and the REST placeholder is removed; the 2FA section ships behind a new runtime
flag, `twoFactorAuth`, that stays off in production until the release is deployed.

> Assumption: the brief's audience is the PRD stage and the product owner. It states outcomes,
> scope and constraints; the class layout, folder placement and ADR-020 content are left to the
> architecture stage (research §8.2).

## 2. Core Vision

### Problem Statement

Password-only sign-in is the weakest acceptable posture for a CRM that holds customer records.
Credential stuffing works against any account whose password was reused elsewhere, and crm has
no second line of defence: no factor, no recovery path for a lost factor, no settings surface on
which a user could even ask for one. The backend has been able to verify TOTP codes since
user-service PR #249 (March 2026), so the gap is now entirely on the client.

### Why Existing Pieces Fall Short

- Sign-in is a REST placeholder: `LoginAPI` posts to `/api/users`, the same URL as registration,
  and gets back a token (research §5.1). It cannot express a second step, and no real login
  contract exists behind it.
- The GraphQL `signInUser` mutation that can answer "password correct, code required" exists only
  on user-service `main`; the pinned `v2.8.0` schema has no sign-in and no 2FA operation, so
  codegen cannot type the documents and the local mock cannot answer them (research §3.1).
- No request carries an `Authorization` header today (research §5.2), so the four settings
  mutations, which require a signed-in user, cannot be called at all.
- There is no profile or settings route, no code-entry component adopted from the ui-toolkit, no
  QR encoder, and the telemetry scrubber does not recognise any 2FA secret (research §5.5-§5.8).

### Proposed Solution

Sign-in runs over GraphQL in every environment and the REST placeholder is removed; one flag turns
on the 2FA section of the settings page. Sign-in keeps its card and copy; when the password is
right and 2FA is on, the user moves to a challenge card in the same auth chrome, enters a code,
and lands where they were going. The 2FA card, one section of the shared settings page, walks
through enrolment and later offers disable and recovery-code regeneration. The challenge and the
section are lazy chunks; the auth paint path pays nothing.

## 3. Target Users and Jobs to Be Done

### Personas

- **Account owner enabling 2FA (Olena, office manager).** Signed in, security-aware after a
  phishing scare, has Google Authenticator on her phone. Job: turn on 2FA in under two minutes,
  without help, and keep a fallback in case the phone is lost.
- **Signing-in user with 2FA (Taras, sales rep).** Signs in several times a day from a laptop and
  occasionally from a phone. Job: get past the second step in seconds — paste or type six digits,
  press confirm — and land on the page he asked for, not on a generic home.
- **User who lost the phone (Iryna, account lead).** Phone reset or stolen, recovery codes
  printed in a drawer. Job: sign in with a recovery code, be told plainly how many codes remain,
  and reach the settings page to generate new ones or turn 2FA off.

Supporting audiences, served but not designed for directly:

- **Deployment admin** — enables the feature per environment with one runtime flag, once
  user-service serves it.
- **Design owner** — reviews the states the Figma file does not draw (§7).
- **Contributor** — lands the feature without weakening a single repository gate.

### User Journeys

Enrol (Olena):

1. Opens `/settings`; the 2FA card says 2FA is off, explains three steps, offers
   "Почати налаштування".
2. Presses it; a QR code and the manual key appear, with a copy button for the key.
3. Scans the QR in the authenticator app, types the current six-digit code, presses
   "Підтвердити".
4. Sees eight recovery codes once, copies them, ticks "I saved them", and the card switches to
   "Двофакторну автентифікацію ввімкнено".

Sign in (Taras):

1. Enters e-mail and password on `/sign-in`, submits.
2. Lands on `/sign-in/two-factor`, focus on the card heading; types or pastes the code.
3. Presses "Підтвердити"; arrives on the protected page he originally requested (issue #150
   redirect-back preserved).

Recover (Iryna):

1. On the challenge card presses "Використати резервний код"; a single text field replaces the
   six cells.
2. Enters `XXXX-XXXX` in any case, confirms, signs in.
3. If two or fewer codes remain, a notice on the landing page says so and links to `/settings`,
   where she regenerates codes (inside the five-minute re-authentication window) or turns 2FA
   off.

## 4. Goals and Success Measures

### Goals

1. A user can enrol, sign in with a TOTP code, sign in with a recovery code, regenerate codes and
   disable 2FA end to end in the test stack today, against the mocked mutations.
2. Sign-in runs over GraphQL with no REST login left; the same build turns the 2FA section on in
   production by configuration alone once user-service releases and deploys the contract.
3. The feature leaks nothing: no account enumeration, no pending session id, code, secret, QR
   URI, recovery code or token in the URL, browser storage, Apollo cache, logs or telemetry.
4. Both new screens meet WCAG 2.1 AA and every repository quality floor, without a new
   accessibility exception or a single suppression.

### Success Measures

Release gates (measured in CI on every pull request):

| Measure                                            | Target         | Measured by              |
| -------------------------------------------------- | -------------- | ------------------------ |
| REST login code left after the change              | none           | review search + e2e      |
| Mocked branches with an e2e or integration test    | 100% of §3.5   | test inventory           |
| 2FA secrets in captured telemetry                  | 0 occurrences  | scrubber unit tests      |
| Secrets written to the Apollo cache                | 0 writes       | `cache.write` spy        |
| Pending session id in URL or storage               | 0 occurrences  | e2e on both routes       |
| axe violations (WCAG 2.1 AA), both new routes      | 0 in 3 engines | `make test-a11y`         |
| New `A11Y_EXCEPTIONS` entries                      | 0              | review + gate test       |
| Keyboard-only challenge and enrolment              | pass           | keyboard contract        |
| Eager growth (one route key and entry)             | < 1 kB gzip    | bundle-size report       |
| Mobile Lighthouse performance, median of three     | ≥ 0.85         | `make lighthouse-mobile` |
| Coverage / mutation score / i18n parity            | 100 / 100 / ok | existing CI gates        |
| Route-coverage manifest rows for the challenge key | present        | route-coverage gate      |

The mobile bar is mobile performance ≥ 0.85 (median of three) per `.claude/react-sdlc.yml:65`,
and `/sign-in` loses no point against `main`; `lighthouse/lighthouserc.mobile.js` is not edited.
The eager entrypoint grows only by the challenge route's key and entry and a few lines of the
protected guard and layout, under 1 kB gzip in total.

Product outcomes (measured after production enablement, owned by user-service metrics):

| Measure                                             | Target               |
| --------------------------------------------------- | -------------------- |
| Active accounts with 2FA on, 90 days after enabling | ≥ 20%                |
| Enrolments started that reach "enabled"             | ≥ 80%                |
| Challenges completed within the 300 s session       | ≥ 95%                |
| Support tickets for "locked out by 2FA" per month   | ≤ 1 per 500 enrolled |

> Assumption: crm ships no product analytics (the observability boundary carries only
> credential-free security signals), so the product outcomes are read from user-service data.
> The four targets are starting hypotheses for the product owner to confirm, not commitments.

## 5. Scope

### In scope (v1)

- **Challenge route `/sign-in/two-factor`** (public, not flag-gated). Reachable only while an
  in-memory pending challenge exists, otherwise redirect to `/sign-in` (D4). Six-cell TOTP entry
  through an adopted `UiPinInput` seam (D5); "Підтвердити" submits, no auto-submit on the sixth
  digit (D6); "Використати резервний код" toggles a single recovery-code field (`XXXX-XXXX`,
  case-insensitive) and back (D1); "Назад" returns to `/sign-in` and discards the challenge;
  expired or exhausted session returns to `/sign-in` with a localized "sign in again" notice; the
  `state.from` redirect-back survives the step; the challenge path is never a redirect target.
- **GraphQL sign-in** through `signInUser` in every environment (the user, 2026-10-08, overriding
  D2). The access token is stored in memory exactly like today; the refresh token is dropped; the
  known 2FA status is kept in memory (D3). `rememberMe` is not sent: the existing checkbox is not
  wired into the form (research §8.4 item 2) and it has no effect a user can see while tokens are
  memory-only, so wiring it belongs to the refresh-token follow-up. The REST login placeholder
  and its tests are removed; registration, already GraphQL, is unchanged. The contracts README
  transport rule is updated in the same change (research §3.3).
- **The 2FA section of `/settings`**: the protected page, gated by `userSettings`, is built by the
  User Settings bundle (#330, ADR-021), which lands first; the 2FA card is one section of it,
  shown while `twoFactorAuth` is on, so enabling 2FA in an environment needs `userSettings` on
  there too (D7):
  - off: description, three steps, "Почати налаштування" → setup → QR rendered on the client from
    `otpauthUri`, manual key with copy, confirm-code field → confirm → recovery codes shown once
    with copy and an "I saved them" acknowledgement → on;
  - on: status line, "Вимкнути" → inline confirmation with a TOTP or recovery code → off;
    "regenerate recovery codes" → new codes shown once, or, outside the re-authentication window,
    a "sign in again to generate new codes" message with a "Увійти знову" button that signs out
    and returns to `/sign-in` with `state.from` set to `/settings` (D8);
  - unknown status (for example a seeded test token) treated as off; a 409 from setup switches
    the card to on.
- **Low recovery codes notice** after landing when completion reports two or fewer remaining,
  localized from the number (the upstream English `warning` is ignored), linking to `/settings`
  (D9).
- **Bearer authorization** on GraphQL requests comes from #330's session link; this feature only
  marks its two anonymous operations (research §5.2).
- **Mock and pending contract**: `src/api/contracts/pending/two-factor-authentication.graphql`
  with the type bodies copied verbatim from user-service `main` at `a95c1e85`, wrapped in
  `extend type Mutation`, plus `scalar Iterable` and its codegen mapping, beside #315's file in
  #315's directory; stateless mock resolvers for the happy paths and one violation per mutation
  with an input. Every other branch is covered by msw and the browser route stubs.
- **Runtime flag `twoFactorAuth`**: default `false` in production, `true` in the test stack,
  declared in the four places the runtime-config contract test checks; it gates only the 2FA
  section.
- **Error mapping** (anti-corruption layer): classification on `extensions.status`, the
  completion 401 split by upstream message with unknown messages treated as an expired session,
  423 locked, 429 rate limited, network and timeout retryable by user action only; uniform 401 on
  sign-in; sign-in and challenge failures reported through `AuthSecuritySignals` with bounded
  reason codes; the settings section records no signal, because user-service owns the 2FA rules
  and rate limits (D11).
- **Secret hygiene**: `fetchPolicy: 'no-cache'` on every secret-bearing mutation, minimal
  selection sets (never `id`), abort checked before `mutate`, no automatic retry, secrets held in
  component or hook memory and cleared on unmount, scrubber keys and an `otpauth://` value
  pattern added.
- **Accessibility overrides** of the design where it fails WCAG 2.1 AA (§7), and accessibility
  acceptance criteria on every user-facing story.
- **Copy in `uk` (main) and `en` (fallback)** for every string, corrected and translated from the
  Figma text (D12), merged catalog regenerated.
- Unit, integration, e2e (desktop and mobile touch), a11y, Storybook and visual coverage for the
  challenge and the section; route-coverage manifest rows; ADR-020 for the decisions in §8 and
  the QR encoder dependency.

### Out of scope (follow-ups, D13)

- Production enablement of `twoFactorAuth` and the contract pin bump to a user-service release
  carrying sign-in and 2FA (deletes the pending file) — blocked on user-service #513/#458.
- Refresh-token storage and silent renewal.
- Social OAuth sign-in combined with 2FA.
- Sign-out through `signOutUser` / `signOutAllUser`.
- Designer follow-up: the missing frames (enrolment confirm, recovery codes, disable confirm,
  recovery-code mode, error and loading states, low-codes notice) and the copy fixes.
- The `/settings` page, its route gate and its home link (#330).
- E-mail or SMS one-time codes and the resend countdown: user-service has no such channel.
- The other settings sections (initials, e-mail, password, social networks).
- Adding the new routes to the Lighthouse URL list.

## 6. Constraints

- **Upstream unreleased → mock.** Every operation is mocked through the pending extension; the
  mock answers in the real error shapes (`extensions.status`) plus a mock-only `extensions.code`
  that the client never reads. Every difference is listed as mock drift (research §7.2).
- **GraphQL only** for every user-service operation, through GraphQL repositories; no REST call
  remains for sign-in, and the REST 2FA endpoints are not used (research §3.3).
- **Flag off in production.** The shipped default is `false`; the test stack enables it with a
  `:-true` fallback because `.env` declares the variable empty; the dev server keeps the
  committed `false` (no dev-server flag transform).
- **Memory-only credentials.** The access token lives in `AuthStateVar` as today; the pending
  session id lives in memory only and never touches `token`, so `isAuthenticated` and the
  null-to-token redirect stay correct (research §5.2). A reload or a one-time chunk reload on the
  challenge route loses the challenge; the page then redirects to `/sign-in` (research §5.5).
- **Paint-path budget.** Only the challenge route's key and entry join the eager entrypoint,
  under 1 kB gzip; the QR encoder and the settings code stay in
  the lazy settings chunk and out of the deferred auth/DI chunk (317 727 of 400 000 raw on a
  stale 2026-07-20 baseline). The mobile bar is performance ≥ 0.85 (median of three) per
  `.claude/react-sdlc.yml:65`, and `/sign-in` loses no point against `main`;
  `lighthouse/lighthouserc.mobile.js` is not edited.
- **Quality floors** from `.claude/react-sdlc.yml:50-65`, raise-only: coverage 100 on all four
  measures, mutation MSI 100, zero jscpd clones, zero ESLint errors and warnings, zero tsc
  errors, zero markdownlint errors, zero dependency-cruiser violations, metrics enforced, zero
  visual diffs, Lighthouse desktop 95 and mobile 85. No suppression of any kind.
- **Repository conventions**: classes only outside React, type-only files, DI tokens, approved
  class suffixes, no new module-level singletons, module shape and the sibling-feature import ban
  (`.dependency-cruiser.js:591-602`), a story for every rendering file, a manifest row for every
  route key, ADR drift on the `dependencies` change.
- **Enumeration**: one message for every 401 on sign-in; `twoFactorEnabled` is learnt only after
  a correct password, exactly as upstream answers.

## 7. Design Deviations from Figma

Figma file `xZ7ccrH6d4QyqLQsayFSEX`: challenge `72:4846` / `72:4882` / `72:4918`; settings setup
`313:10242` / `313:10480` / `313:10606`, connected `315:11502` / `315:12300` / `318:13133`;
"2FA item" set `72:5171` (research §4). The deviations, all carried by the designer follow-up and
recorded by the `figma-design-check` gate rather than blocking it:

1. **E-mail variant dropped.** Tablet and mobile say "Ми надіслали Вам лист на пошту" with a
   masked address; there is no e-mail channel, so authenticator copy is used at all three
   breakpoints and no address is shown (D1, D12).
2. **Resend countdown replaced.** "Надіслати код ще раз 00:34" has no meaning for TOTP; its row
   holds the "Використати резервний код" text button instead (D1).
3. **QR not on mount.** Figma shows the QR immediately; setup is a rate-limited call that
   overwrites the unconfirmed secret, so a "Почати налаштування" button triggers it instead of
   navigation (and StrictMode's double effect) (D8).
4. **Missing frames built from existing components**: recovery-code mode, enrolment confirm-code
   step, one-time recovery-codes list, disable confirmation, regenerate, low-codes notice, error,
   loading and disabled button states (research §4.7).
5. **Contrast overrides** (research §4.5): "Назад" and other secondary text move from `#969B9D`
   (2.81:1) to a compliant colour such as `linkText #0074B5` or Font/200 `#404142`, compliant by
   colour rather than by matching the switcher exception selector; pin cells get a border of at
   least 3:1 instead of `#E1E7EA` (1.25:1) and a visible focus indicator instead of the 15% shadow
   alone; one cell is focused at a time, not the two Figma draws; the "Вимкнути" outline gets a
   3:1 border. The submit button and the header back-to-main link reuse existing components whose
   #276-tracked exceptions already cover them.
6. **Copy**: "Двофакторна автентифікація", "Google Authenticator", "акаунту"; the Russian settings
   copy translated to Ukrainian, with English alongside (D12, research §4.6).
7. **Spacing**: cell gap follows the Figma screens (8 px desktop and tablet, 4 px mobile), not the
   toolkit's 12 px default; the challenge card keeps the sign-in card's 6 px section padding,
   which equals the Figma mobile margin.

## 8. Key Decisions and Rationale

- **Two surfaces, two routes** — the Miro "User module" tree routes the 2FA challenge beside
  sign-in and nests 2FA settings under the user profile (research §2; D4, D7).
- **TOTP and recovery codes only** — the only factors user-service implements (research §3.4;
  D1).
- **Sign-in moves to GraphQL everywhere** — the REST placeholder cannot express a second step and
  has no real backend (it posts to the create-user endpoint); one GraphQL Data provider replaces
  it, and the REST login code is removed (research §5.1; the user, 2026-10-08, overriding D2).
- **Memory-only tokens and challenge** — follows ADR-007/ADR-008; the refresh token waits for a
  refresh flow (D3, D4).
- **Reuse `UiPinInput`** — it is the Figma "2FA item" already shipped in ui-toolkit v0.6.0, adopted
  as a seam per ADR-016 with accessibility overrides (research §4.3; D5).
- **Explicit submit** — predictable behaviour under WCAG 3.2.2 (D6).
- **Regenerate in scope** — without it the low-codes notice has no remedy (D8, D9).
- **Classify errors on `extensions.status`** — the real shape; the mock's `extensions.code` would
  otherwise hide drift (research §3.5; D11).
- **Unknown completion 401 = expired session** — restarting is recoverable, a dead challenge is
  not (research §3.5).
- **Client-side QR encoder** in the lazy settings chunk — the API returns no image (research
  §3.4; D10).

## 9. Risks

Ranked in research §7.1; the ones the product owner should know:

1. **Upstream contract may change before release** — mitigated by the pinned pending file, which
   the pin bump deletes by its list and checks with `make contract-diff`; the 2FA section stays
   off in production until a release ships.
2. **Error classification depends on English messages** for the two completion 401s — mitigated
   by one transformer with the exact strings, tests for both plus an unknown message, and an
   upstream request for machine-readable codes.
3. **Mock drift** hides defects until a real environment exists — mitigated by classifying on
   the real envelope and re-checking the drift list on the pin bump.
4. **Secret leakage** through cache, telemetry or logs — mitigated by `no-cache`, minimal
   selection sets, scrubber extensions and unmount clearing, each with a test.
5. **Pin-input accessibility gaps** in the compiled toolkit (no focus ring, 1.25:1 border) —
   mitigated in the seam, reported to ui-toolkit, never by an axe exception.
6. **Re-authentication window surprise** — regeneration fails five minutes after sign-in; the
   message tells the user to sign in again.
7. **Clock skew** — upstream accepts no future TOTP window; the wrong-code message suggests
   checking the device time.
8. **Bundle growth** in the deferred auth/DI chunk from the GraphQL sign-in path — partly offset
   by the removed REST login, measured in the bundle-size workflow; the QR encoder never lands
   there.
9. **Production sign-in before the release** — GraphQL sign-in reaches no backend until #513
   ships, as the REST placeholder reaches none today.

## 10. Dependencies

- **user-service #513 / #458** — a release tag above `v2.8.0` carrying `signInUser` and the 2FA
  mutations, and a working release pipeline. Blocks production enablement and the pin bump only,
  not the crm implementation.
- **ui-toolkit `UiPinInput`** (v0.6.0, checksums `config/ui-toolkit-checksums.json:1029-1040`) —
  adopted as a new seam; focus-ring and border gaps go to a ui-toolkit issue.
- **crm #332, #315 and #330, in that order** — the TB-1 gate chore (#332); the shared User
  domain, the error transformer, the provider loader, the auth card, the arrival notices and the
  pending-contract directory (#315); the `/settings` page, the Bearer link, the session-ended
  notice and the error-text red (#330). Each has one owner; this feature imports them.
- **A permissive, network-free QR encoder package** — a `dependencies` change covered by ADR-020
  and `make lint-licenses`.
- **Non-blocking upstream issues** to file or comment (2FA status query, machine-readable error
  codes, confirm appending codes, plaintext fallback in `decryptSecret`, GraphQL limiter gaps
  around #469), listed in research §3.7.

## 11. Open Questions Resolved as Assumptions

> Assumption: the recovery-code field accepts the code with or without the hyphen and in any
> case, and normalises it to `XXXX-XXXX` before sending, because upstream's regex requires the
> hyphen and users copy codes inconsistently.
>
> Assumption: when completion reports zero remaining codes, the notice says none are left and
> asks the user to regenerate now; one to two remaining uses a plural-aware count. Both link to
> `/settings`.
>
> Assumption: the "I saved them" acknowledgement only closes the recovery-codes view on the
> client; the codes are already active upstream, so leaving the page without acknowledging is
> allowed and the card shows the on state next time.
>
> Assumption: disabling 2FA asks for a code only, no password, because upstream's
> `disableTwoFactorUser` takes nothing else; a password step would need a backend change.
>
> Assumption: the settings page is reached from #330's home link, from the low-codes notice and by
> URL in v1; a menu entry in the app shell waits for the profile area to exist, since the shell
> has no navigation today.
>
> Assumption: a successful confirm signs out the user's other sessions upstream; the confirm step
> says so in one sentence, because it would otherwise surprise a user signed in elsewhere.
>
> Assumption: the product-outcome targets in §4 are hypotheses for the product owner; the release
> gates in §4 are the binding acceptance measures.

## 12. Next Step

Hand this brief to `create-prd`: functional requirements per surface and state, the error outcome
table (research §3.5) as acceptance criteria, non-functional requirements from §4 and §6, the
accessibility overrides from §7 as criteria on every user-facing story, the pending contract and
mock as the first deliverable, and the D13 items carried forward as follow-ups that no story
waits for.
