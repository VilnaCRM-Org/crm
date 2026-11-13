---
status: complete
workflowType: product-brief
stepsCompleted: [1, 2, 3, 4, 5, 6]
project_name: crm
date: 2026-11-11
feature: notification-visibility-variants
issue: none
author: 'analyst, autonomous run'
inputDocuments:
  - specs/notification-visibility-variants/planning-artifacts/run-summary-notification-visibility-variants-2026-11-11.md
  - specs/notification-visibility-variants/planning-artifacts/research-notification-visibility-variants-2026-11-11.md
  - specs/user-settings/planning-artifacts/brief-user-settings-2026-10-06.md
  - src/modules/user/features/settings/i18n/uk.json
  - src/modules/user/features/settings/i18n/en.json
---

# Product Brief: three notification variants that are clearly seen

Predecessors: the [run summary](./run-summary-notification-visibility-variants-2026-11-11.md),
whose main-agent decisions and adopted research defaults `R1`-`R17` bind this brief, and the
[research](./research-notification-visibility-variants-2026-11-11.md), cited as "research §N".
Decisions this stage took on its own are marked `> Assumption:`; later stages may overturn them
with a recorded reason.

> **Owner decision, 2026-11-11** (run summary, last block). It supersedes the run summary's
> "variant C is client-side only" assumption and research R17, and this brief is written to it:
>
> - Notifications become a capability of their own, for now the feature
>   `src/modules/user/features/notifications/`, behind a repository contract with a **mock**
>   implementation. It will later be extracted into a distinct module.
> - The contract and its types must not leak user-module internals, so that extraction does not
>   change any caller.
> - The mock reuses the local GraphQL or REST mock stack and the existing test mocks. It never
>   calls user-service #526 or #527.
> - Every variant raises its outcomes through this feature.
> - Variant C may therefore show a mocked history, unread state and badge in the bell dropdown
>   (`377:18485`), as well as the merged card.

## 1. Executive Summary

After a user saves their name, e-mail or password on `/settings`, the page confirms the outcome
with a notification. The team lead reports that this notification "is not clearly seen", and the
measurements agree: its pale card separates from the page by 1.09:1, it has no border, shadow or
motion, and on desktop it appears about 555 px from the Save button the user just pressed.

This brief plans three variants of that notification, each attacking a different cause:

- **A, the elevated toast:** same place, but a toned border, an accent bar, a shadow and a short
  entrance, so it stands off the page. A becomes the default look.
- **B, the inline status:** the outcome appears inside the settings card, directly below Save,
  where the user's eyes already are.
- **C, the bell-merged notification:** the designer's Figma `397:16713`, where the outcome grows
  out of the header bell at the top right. In C the bell also opens a dropdown with a mocked
  history, unread marks and a badge count (`377:18485`).

All three are views of one new notifications feature, which owns the contract every page raises
outcomes through and a repository with a mock implementation. One runtime setting,
`notificationStyle` (`toast`, `inline`, `bell`; default `toast`), picks the view. The variants
merge together so the published Storybook shows them side by side, and the team lead can switch
the real `/settings` page between them without a rebuild. The team lead picks one; a follow-up
story deletes the other two and the setting.

Settings is the only consumer today and serves as the test bed, but the feature must serve any
page and be extractable into its own module later. No real back end exists or is needed:
user-service #526 and #527 are not prerequisites, and the mock never calls them.

## 2. Problem

### What Users Get Today

The notification is `UIToastStack` / `UIToast`, built from Figma `315:11754` / `318:13410`
(research §1). It is a pale tinted card, fixed at the bottom right of the viewport (full width at
the bottom on mobile), with a 24 px icon, 16 px semibold text and a close button. It has no timer,
shows at most three outcomes, never takes focus and returns focus to Save when closed.

Its behaviour is sound and is kept. Its look and its position are the defect.

### Measured Evidence

Contrast of the card's edge against everything around it (research §2.1, WCAG relative luminance):

| Pair                                                 | Ratio   |
| ---------------------------------------------------- | ------- |
| success surface `#E8F4EF` on page `#FBFBFB`          | 1.09:1  |
| error surface `#FDECEC` on page `#FBFBFB`            | 1.10:1  |
| success surface on white card / social tile          | 1.13:1  |
| error surface on white                               | 1.14:1  |
| success surface on the sidebar current-row tint      | 1.03:1  |
| Figma `397:18093` stroke `#D0D4D8` on page (C drawn) | 1.44:1  |
| text `#1A1C1E` on success surface                    | 15.15:1 |

The text is perfectly legible once found. The container is what nobody finds: every edge is at or
below 1.14:1, and the app's own cards, pills and disabled buttons use the same near-white
language, so the toast reads as one more piece of page furniture.

Distance from the Save button the user just pressed (research §2.2):

| Viewport    | Save (x × y)      | Toast (x × y)        | Gap                          |
| ----------- | ----------------- | -------------------- | ---------------------------- |
| 1440 × 900  | 540–810 × 828–890 | 1031–1428 × 814–876  | 221 px right; centres 555 px |
| 1024 × 1366 | 295–634 × 842–912 | 603–1000 × 1280–1342 | 368 px below, over footer    |
| 375 × 812   | scrolled to Save  | 15–360 × 745–797     | just below Save              |

Other measured facts (research §2.3):

- One desktop toast is 397 × 62 px, 1.9 % of a 1440 × 900 viewport.
- It appears in one frame with no transition, while in the same moment the Save spinner stops,
  the header greeting re-renders and the focus ring lands back on Save — the opposite corner.
- On tall viewports it lands over the social card and the footer and borrows their look.

### Ranked Causes

The research ranks five causes; each variant below is described by which of them it addresses.

1. **No edge.** 1.09–1.14:1 against every neighbour, no border, no shadow. All breakpoints.
2. **Away from the locus of attention.** 221–368 px from Save on desktop and tablet, in the
   corner scanned last. Mobile is not affected.
3. **No onset signal.** No motion or elevation while three other things change at once.
4. **Overlaps content and borrows its look.** Sits on the white social card and the footer.
5. **Small and low-weight.** About 2 % of the viewport; only the icon is saturated.

## 3. Who Is Affected

- **Every signed-in user who saves settings**, at every breakpoint. A missed confirmation makes
  users unsure whether the e-mail or password change happened, invites a second submit and, for
  an e-mail change, hides the instruction to confirm the new address.
- **Users with low vision or screen magnification.** A zoomed viewport shows the area around the
  focused Save button; a notification in the far bottom-right corner is outside it.
- **Keyboard and screen-reader users.** They already receive every outcome through the hidden
  live regions. Their experience must stay exactly as it is in every variant.
- **The team lead**, who reviews and picks the winner, and **the designer**, who owns the Figma
  source of truth and has drawn only C (desktop only).
- **Future feature teams.** The winner becomes the app-wide way to confirm an outcome, so every
  later page inherits the choice and raises outcomes through the notifications feature.
- **Whoever later builds the real notification service.** They replace the mock repository and
  extract the feature into its own module; both must be possible without touching callers.

## 4. Goals and Non-Goals

### Goals

1. Give the team lead three genuinely different, working variants to compare on the real page and
   in Storybook, each at desktop, tablet and mobile, for every success and error outcome.
2. Make every variant pass a measurable salience floor, so even the losing designs are better
   than today's.
3. Keep every accessibility guarantee of today's notification unchanged in every variant.
4. Turn the team lead's choice into a single remaining implementation, with the losers, their
   tests and the switch removed, so the code base does not carry three designs for good.
5. Keep the notification contract page-agnostic, so the winner is reusable app-wide.
6. Establish notifications as a capability of their own: the feature
   `src/modules/user/features/notifications/`, raising every outcome through a repository
   contract backed by a mock, with a contract and types that leak nothing from the user module,
   so that it can later move to its own module and switch to a real back end without changing
   any caller.

### Non-Goals

- A real notification back end, or any call to user-service #526 (store) or #527 (real-time
  delivery). The only repository implementation is the mock.
- Extracting the feature into its own module now. It stays inside the user module, ready to move.
- A notification centre, history, unread state or badge in variants A and B. Only C shows them,
  and only from the mock.
- Enabling the header bell in A and B. It stays natively disabled there.
- Server-pushed or asynchronous notifications.
- An auto-dismiss timer, in any variant.
- New or changed outcome copy. All variants say the same eight messages (§7).
- Per-field success marks in variant B (R10; an optional extension later).
- A user study, analytics or an A/B test with real users.
- Hybrid designs (for example A's look in B's position) inside this bundle.
- Adding `/settings` to the Lighthouse URL list.

> Assumption: hybrids are out of scope. If the team lead wants one, it is recorded as the outcome
> of the review and planned as a new follow-up, so this bundle compares exactly three designs.

## 5. The Three Variants

What the user sees, described for a product audience. Measurements are CSS px; "desktop",
"tablet" and "mobile" mean 1440, 1024 and 375 px wide. Every variant shows the same messages,
announces them the same way, has no timer and never moves focus when it appears.

### Variant A: Elevated Toast (`toast`, the default)

The notification stays where it is today, but stops looking like page content.

- **Look.** The Figma tint stays as the fill (green for success, red for error). A 1 px border in
  the tone colour (`#2E7D32` success, `#DC3939` error) gives an edge of 4.95:1 and 4.33:1 on the
  page. A 4 px accent bar in the same tone runs down the leading edge. The existing shell popover
  shadow lifts the card off the page, as the user menu already does.
- **Onset.** It slides in from the edge and fades in over about 150–200 ms. With reduced motion
  turned on, it appears in place without movement.
- **Desktop.** Bottom right, 397 px wide, 12 px from the right edge and 24 px from the bottom;
  up to three stack upwards.
- **Tablet.** Bottom right, 397 px wide, 24 px from the edges. On a tall tablet it is still far
  below Save, but it no longer blends into the social card or the footer.
- **Mobile.** Full width at the bottom with 15 px gutters, just below Save after focus returns
  there. The page keeps reserving space so the stack never hides the focused control.
- **Success and error.** Green or red tone on border, bar and icon. The transient save error keeps
  its Retry action; every toast keeps its close button, and closing returns focus to Save.
- **Causes addressed:** 1, 3, 4 and 5. It does not move the notification closer to Save (2).
- **Figma:** no frame. A replaces today's look as soon as it merges (R5).

### Variant B: Inline Status at the Action (`inline`)

The outcome appears inside the settings card, directly below the Save and Clear row.

- **Look.** A status block inside the card, using the card's own tokens: the outcome icon, the
  message, and a tone accent (`#2E7D32` 5.13:1, `#DC3939` 4.48:1 against the white card). It is
  part of the card, so it never floats over anything.
- **Onset.** The content below the action row moves down to make room; the block fades in. With
  reduced motion it simply appears.
- **Desktop and tablet.** 0–16 px below Save, the full width of the card's content area, in the
  same scroll position the user is already looking at.
- **Mobile.** Directly under the stacked Save and Clear buttons, card width.
- **Several outcomes at once.** A save that changes name, e-mail and password shows up to three
  lines in one block, in the same order as today.
- **Resend.** "Надіслати повторно" outcomes (`resent`, `resend_failed`) appear at the e-mail row
  where the user clicked, not at Save (R9).
- **Dismissal.** No close button (R11). The status stays until the next submit or Clear.
- **Success and error.** Green or red tone; the transient save error shows Retry inline beside
  the message. Focus stays on Save after the save settles, as today.
- **Causes addressed:** 2, 3 and 4. Nothing overlaps, so no space has to be reserved.
- **Figma:** no frame.

> Assumption: B's entrance is a fade of the block only; the space it opens is not animated, so
> the surrounding layout never moves in slow motion under the pointer.

> Assumption: B shows all outcomes of one save in a single block and replaces the whole block on
> the next submit or Clear, so stale lines never mix with new ones.

### Variant C: Bell-Merged Notification (`bell`)

The outcome grows out of the header bell at the top right, as the designer drew in `397:16713`.

- **Look on desktop (1440 and wider).** A white pill wraps the bell and fuses with a 256 × 62
  card hanging below it (visible extent about 1087–1366 × 8–125). The card shows the message and
  the time of the outcome. The drawn stroke (1.44:1) is replaced by a tone stroke of at least 3:1,
  and the card carries the existing card shadow (R6).
- **Tablet (1024–1439 shell layout).** Figma draws no merged shape here. The fallback is the bell
  dropdown's caret card (`377:18485`): a card with a small caret pointing at the bell, anchored to
  the bell wherever the header places it (mid-header at 1024) (R7).
- **Mobile (below 1024).** The same caret card under the 24 px bell glyph, about 313 px wide.
- **Onset.** It drops in from the bell with a short entrance; with reduced motion it appears in
  place.
- **Scrolling.** It lives in the sticky header, so it stays in view while the page scrolls. While
  it shows, the page reserves space at the top so it never hides the focused control.
- **Several outcomes at once.** Up to three rows inside the one card.
- **The bell itself.** In C the bell is enabled, as Figma draws it, and carries an unread badge
  count from the mock. The other variants keep it disabled.
- **History in the bell dropdown.** Pressing the bell opens the notification centre of
  `377:18485`: the mocked history with read and unread rows and timestamps. The outcomes the
  user just raised appear in it as unread, and the badge counts them.
- **Success and error.** Green or red tone on stroke and icon; the transient save error shows
  Retry in the card; each row has a close button that returns focus to Save.
- **Causes addressed:** 3 and 4, by elevation and motion. It makes cause 2 worse: about 943 px
  from Save at 1440 × 900, the farthest of the three (research §4.3).

> Assumption: C keeps a close button on each row of the merged card. The frame draws only a
> message and a timestamp, but with no timer the card would otherwise stay until the user leaves.
> Closing the card does not mark the outcome as read; it stays unread in the history.

> Assumption: C's dropdown in this comparison shows the history, the unread marks, the badge and
> "Позначити всі прочитаними" (the frame's "Отметить все прочитанными"). Deleting a row, drawn
> in `377:18485`, is left out of the first comparison: it adds a destructive action and its own
> confirmation states without telling the team lead anything about visibility.

> Assumption: the dropdown follows the menu-button pattern the user menu already uses: the bell
> exposes its expanded state, opening never happens on its own, Escape and an outside click
> close it, and focus returns to the bell. The merged card appearing never opens the dropdown.

> Assumption: the timestamp is visual only. It is the moment the outcome was shown, formatted
> through the locale-aware formatter, and it is not part of the announcement.

### Side by Side

| Measure (research §4.4) | Today       | A          | B             | C               |
| ----------------------- | ----------- | ---------- | ------------- | --------------- |
| Edge contrast           | 1.09–1.14:1 | ≥ 4.33:1   | ≥ 4.48:1 tone | ≥ 3:1 (planned) |
| From Save, 1440 × 900   | ~555 px     | ~555 px    | ~0–16 px      | ~943 px         |
| From Save, mobile       | below Save  | below Save | below Save    | top of screen   |
| Overlaps page content   | yes         | yes        | no            | yes, at the top |
| Space reserved for it   | bottom      | bottom     | none          | top             |
| Figma frame             | yes         | no         | no            | desktop only    |
| Changes the app shell   | no          | no         | no            | yes             |
| Header bell             | disabled    | disabled   | disabled      | enabled         |
| History, unread, badge  | none        | none       | none          | mocked          |

## 6. How the Team Lead Compares and Decides

### Two Places to Look

1. **Storybook on GitHub Pages** (<https://vilnacrm-org.github.io/crm/>). Each variant has
   stories for a single success, three combined successes, the transient error with Retry and a
   permanent error, at desktop, tablet and mobile, plus a reduced-motion view; C adds its
   dropdown with mocked history and unread rows. Pages publishes only from `main`, so the
   variants appear there after the merge (R4); before it, Storybook runs locally with
   `make storybook-start`. Pages is live: `storybook deploy` succeeded on `main` on 2026-11-10.
2. **The real `/settings` page**, switched by the runtime setting `notificationStyle`. The same
   built image shows A, B or C depending on a value set at container start; an unknown value stops
   the container from starting (R1). Locally that is `make start-prod` with the value set; the
   team lead changes name, e-mail and password, resends the confirmation link, and triggers the
   error outcomes from the mock.

> Assumption: the container variable is `APP_CONFIG_NOTIFICATION_STYLE`, following the existing
> `APP_CONFIG_*` naming. The architecture stage may rename it.

> Assumption: whether the per-PR sandbox renders the runtime block is unknown (R3). Until the
> owner says otherwise, the documented review path is Storybook plus `make start-prod`.

### Evidence the Team Lead Reviews

The QA stage fills a comparison sheet from the running test stack: the four measures of §8 for
each variant at 1440 × 900, 1024 × 1366 and 375 × 812, with one screenshot per variant, viewport
and outcome kind (success, error). The team lead reviews the sheet and the live page together.

> Assumption: the QA stage owns the comparison sheet and posts it where the team lead reviews
> (the pull request). The numbers are evidence for the decision, not an automatic winner.

### Picking the Winner and Removing the Losers

1. The team lead names one variant, or "none, revise", and the product owner confirms. The
   decision and its reason are recorded in this bundle.
2. A follow-up story, planned in this bundle and blocked on the decision, removes the two losing
   renderers, their stories, tests and visual baselines, and the `notificationStyle` setting
   itself, in one change that keeps every gate green. The notifications feature, its contract and
   its mock repository stay whichever variant wins: they are the capability, not a variant.
3. If C loses, the bell returns to disabled, and the dropdown, the badge and the repository's
   history and unread operations go with C. The feature keeps exactly the operations the winner
   uses, so no dead path survives the 100 % mutation gate.
4. The designer is asked to draw the winner's missing frames, so Figma stays the source of truth.

> Assumption: the removal story also deletes the new enum setting kind unless another setting
> uses it by then, so the temporary switch leaves nothing behind (R2: `[no-adr]`).

## 7. Scope

### Outcomes Every Variant Must Show

All current notification outcomes, from `settings.toasts.*`:

Success:

- `saved`: «Зміни збережено».
- `email_sent`: «Ми надіслали посилання для підтвердження на нову адресу».
- `password_changed`: «Ви успішно змінили пароль».
- `resent`: «Посилання для підтвердження надіслано повторно».

Error:

- `save_failed_transient`: «Не вдалося зберегти зміни. Перевірте з’єднання та спробуйте ще
  раз.»
- `save_failed`: «Не вдалося зберегти зміни. Спробуйте пізніше.»
- `rate_limited`: «Забагато спроб. Спробуйте пізніше.»
- `resend_failed`: «Не вдалося надіслати посилання. Спробуйте ще раз.»

`save_failed_transient` carries the Retry action. One save can raise up to three successes at
once (`saved`, `email_sent`, `password_changed`); each variant must show that combination.

### In Scope

- The notifications feature `src/modules/user/features/notifications/`: the variant-neutral
  contract every page raises outcomes through, its public types and its repository contract.
- The mock repository: fixtures in the local GraphQL or REST mock stack and the existing test
  mocks; a seeded history for C; never a call to user-service.
- The three visible renderers, all fed by that feature.
- For C only: the enabled bell, its unread badge and the dropdown with the mocked history.
- The `notificationStyle` runtime setting, its validation at container start and its default.
- Storybook stories for each variant and outcome at the three breakpoints.
- Unit, accessibility, end-to-end and visual coverage of each variant on `/settings`.
- The QA comparison sheet and the team-lead review.
- The follow-up story that removes the losers and the setting.

### Out of Scope

Everything in "Non-Goals" (§4), plus new consumers of the notification beyond `/settings`.

## 8. Success Criteria and Measures

### Floors Every Variant Must Meet

A variant that misses one of these is not ready for review.

| Measure                                      | Target                 | Measured by     |
| -------------------------------------------- | ---------------------- | --------------- |
| Edge contrast against its backdrop           | ≥ 3:1                  | token tests     |
| Same text announced, same region and level   | identical to today     | unit + e2e      |
| Focus moved when a notification appears      | never                  | keyboard spec   |
| Focus after close (A, C)                     | Save, else the `h1`    | keyboard spec   |
| Focused control fully hidden                 | never, incl. 320 × 256 | e2e clearance   |
| Movement under `prefers-reduced-motion`      | none                   | unit + visual   |
| Auto-dismiss timer                           | none                   | unit            |
| Mobile touch targets                         | ≥ 44 px                | mobile e2e lane |
| Visible edge in forced-colors mode           | kept                   | unit            |
| axe violations on `/settings` states         | 0 in three engines     | a11y lanes      |
| Bell dropdown (C): Escape, focus to bell     | pass                   | keyboard spec   |
| Outcome shown when the mock repository fails | yes, same as success   | unit + e2e      |

The 3:1 edge floor is a **product rule modelled on WCAG 1.4.11**, not a WCAG requirement: a
non-interactive message container is not a component that 1.4.11 covers (research §2.1, R15). It
is written as a product rule so nobody argues it away as "not required". The backdrop is the page
`#FBFBFB` for A and C and the white card for B's tone accent.

### Comparative Measures (R16)

Recorded per variant at 1440 × 900, 1024 × 1366 and 375 × 812; they inform the pick.

| Measure                   | Definition                                                     |
| ------------------------- | -------------------------------------------------------------- |
| Edge contrast             | the ratio actually rendered, from the floor table above        |
| Distance from Save        | centre of Save to centre of the first outcome, in px           |
| In the viewport at settle | the whole first outcome visible when the save settles (yes/no) |
| Overlap                   | page controls covered at settle, with one and three outcomes   |
| Team-lead review          | "clearly seen" yes/no per breakpoint, plus the ranked choice   |

Today's baseline for comparison is the committed `main` baselines at `8b24105e`: about 555 px from
Save at 1440 × 900 and three toasts covering Clear on mobile.

### Done Means

- All three variants meet every floor, run on `/settings` behind the setting, and appear in
  Storybook on Pages.
- The comparison sheet is posted and the team lead has recorded a choice.
- The removal story has landed: one renderer, no setting, no orphaned tests or baselines.
- The notifications feature remains, with its mock repository and a contract that imports
  nothing from the rest of the user module.

## 9. App-Wide Reuse

- The contract says **what** happened (message, kind, optional action), never **how** it looks.
  A page raises outcomes the same way whichever variant is active.
- No renderer contains settings-specific code. Settings is the first consumer, not the owner.
- A and C need nothing from the page. B needs the page to place an anchor where the status
  belongs (on settings: below the action row, and at the e-mail row for resend).
- Every variant raises outcomes through the notifications feature, not a page-local queue
  (owner decision; this supersedes R17's "lift only when C needs it").
- The feature's contract and types name notification concepts only (message, kind, action,
  time, read state). They import no user-module type, so moving the feature to its own module
  changes import paths at most, never a caller's code.
- The shell header (C) reads the feature through a channel that keeps `src/components/` free of
  module imports; the architecture stage chooses it.

> Assumption: the visible outcome (toast, inline status or merged card) clears when the user
> leaves the page that raised it, as today. C's history keeps the outcome as an unread row for
> the rest of the browser session.

> Assumption: showing and announcing an outcome never waits on the repository. Where the mock
> stack is not reachable (a deployment without it, or a mock failure), the outcome still appears
> and is announced, and C's history shows only this session's outcomes.

## 10. Constraints

- **Accessibility guarantees are not renegotiated:** two always-mounted hidden live regions
  (polite for success, assertive for errors); no visible renderer carries a role (R13); no focus
  theft; focus return on close; no timer (WCAG 2.2.1); focus never covered (2.4.11); 44 px mobile
  targets; a forced-colors edge; WCAG 2.1 AA as the binding standard.
- **Motion** respects `prefers-reduced-motion` in every variant and is CSS only, so no new
  dependency.
- **Performance:** the eager entrypoint may grow only by the small setting reader; the settings
  and shell chunks stay inside the gzip and raw budgets; the auth pages' paint path is untouched;
  the Lighthouse floors on the audited URLs hold. Budgets are never raised.
- **Quality gates are raise-only:** 100 % coverage, 100 % mutation score, zero jscpd clones,
  ESLint and TypeScript clean, rust-code-analysis limits, i18n parity, no `data-testid`, the
  console gate. Three renderers share one content piece rather than cloning it.
- **No suppressions:** no `eslint-disable`, `@ts-ignore`, allowlist entry, skipped test or
  re-baseline used to force a pass. Baselines are re-recorded only for the intended look change:
  A replaces today's 18 toast baselines; B and C add their own (about 36), deleted with the losers.
- **Extractable boundary:** the notifications feature is reached only through its public
  barrel; its contract and types import nothing from the rest of the user module, and its only
  repository implementation is the mock. Dependency-cruiser boundary rules apply unchanged.
- **The enabled bell (C)** follows the user menu's menu-button pattern: expanded state, Escape,
  outside click, focus return to the bell, 44 px on mobile. A and B keep it natively disabled.
- **Design gate:** A and B have no Figma frame and C has none for tablet or mobile, so the UX stage
  records the intended look for each and an owner confirmation or explicit deviation.
- **Planning only here:** this bundle writes no production code; nothing is committed, and no
  issue or pull request is opened until the owner approves.

## 11. Risks

- **C is the most expensive variant and may lose on distance.** Built as drawn and judged on
  the same sheet as A and B.
- **Three implementations linger after the pick.** The removal story is planned now, blocked
  only on the decision.
- **Unchosen code ships on `main` behind the setting until then.** The default is `toast`, and
  an invalid value stops the container from starting.
- **B pushes the content below the action row down.** Only content below Save moves, never
  Save itself.
- **B's status may be partly below the fold on short viewports.** Measured as "in the viewport
  at settle".
- **C covers the top of the content under the sticky header.** Space is reserved at the top
  while it shows (R14).
- **C anchors to a bell whose position varies with the header width.** Anchored to the bell
  element, never to a constant.
- **Storybook alone shows the variants out of context.** The runtime switch shows them on the
  real page.
- **The sandbox may not let the team lead switch variants.** The `make start-prod` path is
  documented; the owner is asked.
- **Visual baselines grow by about 36 during the comparison.** Accepted; the removal story
  deletes the losers' baselines.
- **The designer disagrees with looks drawn without frames.** The questions in §12 are answered
  before code.
- **The floor is read as optional because WCAG does not require it.** It is stated as a product
  rule (R15).
- **Extraction risk.** A feature that lives in the user module drifts into using its internals
  (types, the auth state, settings helpers), so moving it later breaks callers. Mitigation: the
  contract imports nothing from the user module, callers use the barrel only, and a boundary
  rule or test pins it.
- **Mock-versus-real contract drift.** The mock defines the shape of history, unread state and
  timestamps before user-service #526 and #527 define theirs, so the real API may differ.
  Mitigation: keep the repository contract minimal and domain-named, map the transport shape
  inside the repository only, and re-check the contract when #526 publishes a schema.
- **Enabling the bell for C.** The bell is disabled in every shipped page today; enabling it
  turns a decorative control into a menu on every protected page, with new keyboard, focus and
  badge semantics, and new header baselines under C. Mitigation: enabled only while
  `notificationStyle` is `bell`, the user-menu pattern, and keyboard and axe coverage; if C
  loses, the bell returns to disabled.
- **A deployment without the mock stack.** A built image runs where no mock endpoint exists.
  Mitigation: outcomes never wait on the repository; C's history degrades to this session.

## 12. Open Design Questions for the Designer

1. **A has no frame.** Confirm the tint fill with a 1 px tone border, a 4 px accent bar and the
   popover shadow, or choose the white or the dark (inverse) fill the research also measured.
2. **B has no frame.** Confirm the block below the action row, its look inside the card, no close
   button, persistence until the next submit or Clear, and resend outcomes at the e-mail row.
3. **C on tablet and mobile.** `397:16963` (tablet) draws no notification and the mobile frames
   draw only the dropdown and the user menu. Confirm the caret-card fallback under the bell.
4. **C enables the bell.** `397:16713` draws an enabled white bell with a badge on the
   dashboard; the app ships it disabled and grey. Under C it becomes enabled with a mocked unread
   badge. Confirm the enabled look, the badge style and count cap, and that A and B keep it
   disabled.
5. **C's stroke.** The drawn `#D0D4D8` is 1.44:1; confirm a tone stroke that reaches 3:1.
6. **C's close control and timestamp.** The frame draws no close button; confirm one per row.
   Confirm the timestamp format (time only, or date and time).
7. **Motion.** Confirm direction and duration of each entrance (A from the edge, B fade, C from
   the bell) and the reduced-motion fallback.
8. **C's dropdown.** Confirm "Позначити всі прочитаними", whether closing the merged card should
   mark the outcome read, and that row deletion waits for a later change.
9. **After the pick.** Will the designer draw the winner's missing frames for all breakpoints?

## 13. Dependencies

- **Not required:** user-service #526 (notification store) and #527 (real-time delivery). The
  only repository implementation is the mock, and it never calls them. A later change swaps in a
  real repository once they ship.
- **Required, in this repository:** the existing notification contract and queue, moved behind the
  new notifications feature; the local GraphQL or REST mock stack and the existing test mocks,
  which gain notification fixtures; the runtime
  configuration layer, extended with its first non-boolean setting; the Storybook Pages workflow
  (live); the test stack's container entrypoint, which renders the runtime block.
- **People:** the team lead for the review and pick, the product owner to confirm, the designer
  for §12, and the owner's approval before anything is committed.
- **Tools:** Figma MCP access for the design check on file `xZ7ccrH6d4QyqLQsayFSEX`.

## 14. Decisions Shaping the Product

From the run summary (binding): three variants each attacking a different cause; one contract and
one runtime switch; a follow-up that removes the losers; the accessibility guarantees kept; the
3:1 edge floor; nothing committed before approval; the adopted research defaults R1-R17, of
which R1, R2, R4, R5, R6, R7, R9, R10, R11 and R13 shape this brief directly.

From the owner (2026-11-11, superseding "C is client-side only" and R17): a notifications feature
in `src/modules/user/features/notifications/` behind a repository contract with a mock; a
contract that leaks no user-module internals; every variant raising outcomes through it; C free
to show a mocked history, unread state and badge in the bell dropdown. R8's "never enable the
bell" now holds for A and B only.

Taken by this stage (marked inline): no hybrids; B fades in without animating the layout; B shows
one block per save; C keeps a close button per row; C's timestamp is visual only; the container
variable name; the sandbox question deferred to the owner; QA owns the comparison sheet; the
removal story also removes the enum setting kind; visible outcomes clear on leaving the page
while C's history keeps them for the session; outcomes never wait on the repository; C's
dropdown has mark-all-read but no row deletion; closing C's card leaves the row unread; the bell
uses the user-menu pattern.

## 15. Brief Distillate

- Problem: the settings notification separates from the page by 1.09–1.14:1, has no border,
  shadow or motion, and sits ~555 px from Save at 1440 × 900 (368 px below on a tall tablet).
- Ranked causes: no edge; far from Save; no onset signal; overlaps and borrows content's look;
  small (1.9 % of the viewport).
- Owner decision: a notifications feature in `src/modules/user/features/notifications/` behind a
  repository contract with a mock (mock stack + test mocks, never user-service #526/#527); every
  variant raises outcomes through it; contract and types import no user-module internals.
- A `toast` (default, replaces today's look): same position; tone border, 4 px accent bar, popover
  shadow, 150–200 ms entrance; fixes causes 1, 3, 4, 5; bell stays disabled.
- B `inline`: status block in the card below the Save/Clear row (0–16 px from Save); resend
  outcomes at the e-mail row; no close, persists until next submit or Clear; fixes 2, 3, 4.
- C `bell`: merged pill + card at the bell (≥ 1440, `397:16713`), caret card below 1440; tone
  stroke ≥ 3:1; close per row; ~943 px from Save; bell enabled with a mocked unread badge and a
  dropdown of mocked history (`377:18485`) with mark-all-read, no row deletion.
- One enum runtime setting `notificationStyle` (`toast`, `inline`, `bell`; default `toast`);
  an unknown value fails container start; `[no-adr]`.
- All three merge so Storybook on Pages (live, main-only) shows them; the real page is switched at
  container start (`make start-prod`; sandbox support unknown).
- Every variant covers all eight `settings.toasts.*` outcomes, the combined three-success save,
  and the transient error's Retry; copy is unchanged; outcomes never wait on the repository.
- Floors: edge ≥ 3:1 (product rule modelled on WCAG 1.4.11); announcements only in the two hidden
  live regions; no focus theft; focus return on close; no timer; focus never covered; reduced
  motion; 44 px; forced colors; C's dropdown keyboard pattern.
- Comparative measures at 1440 × 900, 1024 × 1366, 375 × 812: edge contrast, distance from Save,
  in viewport at settle, overlap, team-lead review; QA posts the sheet.
- Team lead picks, owner confirms; a removal story deletes the losing renderers, tests, stories,
  baselines and the setting; the notifications feature and its mock stay; if C loses, the bell
  returns to disabled and the history and unread paths go.
- Gates raise-only: 100 % coverage and mutation, jscpd 0, metrics, i18n parity, perf budgets,
  boundary rules, no suppressions; re-baselines only for the intended looks.
- Risks to carry: extraction (feature drifting into user-module internals), mock-versus-real
  contract drift against #526/#527, enabling the bell on every protected page under C.
- Open for design: A and B looks, C tablet/mobile fallback, enabled bell and badge, C stroke,
  close and timestamp, dropdown actions, motion, frames for the winner.
