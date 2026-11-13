---
status: complete
workflowType: research
project_name: crm
date: 2026-11-11
feature: notification-visibility-variants
issue: none
author: 'analyst, autonomous run'
inputDocuments:
  - specs/notification-visibility-variants/planning-artifacts/run-summary-notification-visibility-variants-2026-11-11.md
  - specs/user-settings/planning-artifacts/architecture-user-settings-2026-10-06.md
  - src/modules/user/README.md
  - src/components/ui-app-shell/README.md
  - src/config/runtime/README.md
  - docs/feature-flags.md
  - docs/state-architecture.md
  - CLAUDE.md
  - config/performance-budget.json
  - config/i18n-catalog-policy.json
  - .claude/skills/figma-design-check/SKILL.md
  - 'Figma xZ7ccrH6d4QyqLQsayFSEX: 397:16713, 397:18093, 397:16963, 397:17089, 378:21909, 377:18485'
---

# Research: notification visibility variants

The team lead reports that the outcome notification on `/settings` "is not clearly seen". This
research establishes what ships today, why it is missed (ranked and measured), what the industry
guidance says, how each of the three decided variants fits this repository, and which repository
gates shape the plan. It writes no production code.

All coordinates are CSS px. Contrast ratios are WCAG 2.x relative-luminance ratios computed with
`python3 -I` on 2026-11-11. File references are `path:line` on `main` at `8b24105e`.

## 1. Current state

### 1.1 Components and contract

- **`UIToastStack`**, `src/components/ui-toast/index.tsx:12-42`: two always-mounted
  `UILiveStatus` regions, then the fixed stack.
- **`UIToast`**, `src/components/ui-toast/ui-toast.tsx:56-77`: icon, message, optional action,
  and a close button described by the message.
- **Styles**, `src/components/ui-toast/styles.ts:33-120`: fixed stack, `zIndex: 1400`, tinted
  fill, no border, no shadow, no motion.
- **Types**, `src/components/types/ui-toast/index.ts:3-63`: `ToastDraft`, `ToastItem`, the
  `*Set` collections, `UIToastStackProps`, `ToastQueue`.
- **Queue**, `src/hooks/use-toast-queue.ts:8-60`: page-local reducer, `MAX_TOASTS = 3`, the
  alternating announcement mark.
- **Focus**, `src/components/ui-toast/use-toast-focus.ts:23-81`: closing moves focus to the next
  or previous close button, then Save, then the `h1`.
- **Clearance**, `src/components/ui-toast/use-stack-clearance.ts:5-45`: sets
  `scroll-padding-bottom` and `body` `padding-bottom` to the stack height (WCAG 2.4.11).
- **Live regions**, `src/components/ui-live-status/index.tsx:20-26`: visually hidden
  `role="status"` or `role="alert"` with `aria-atomic`.
- **Close label**, `src/components/ui-toast/i18n/{en,uk}.json`: lazy catalog `ui_toast.close`,
  registered at `ui-toast.tsx:19`.

Geometry from `styles.ts`:

- Mobile (< 480): `left/right/bottom 0.9375rem` (15), full width, `maxHeight calc(50dvh - 15px)`.
- From 480 (`sm`): `right/bottom 1.5rem` (24), width `24.8125rem` (397).
- From 1025 (`lg + 1`): `right 0.75rem` (12).
- Toast: radius 12, padding 16 (mobile) or 19/18/19/20, Golos 600, 14 px (mobile) or 16 px,
  text `#1A1C1E`. One single-line toast is 52 px tall on mobile and 62 px from 480.

### 1.2 Consumers

- `useProfileSave` maps each changed aspect to one success draft
  (`use-profile-save.ts:43-47`: `saved`, `email_sent`, `password_changed`) and each failure
  reason to one error draft, with a Retry action only for `transient` (`:49-53`, `:75-87`). It
  calls `props.toasts.show(drafts)` then dispatches `settled` (`:99-102`), and
  `useSettledFocus` moves focus to Save, or to the `h1` while Save is disabled
  (`use-settled-focus.ts:3-21`).
- `useEmailResend` shows `resent` or a failure toast (`use-email-resend.ts:26-37`).
- `UserProfile` owns the queue and the refs and renders `SettingsToasts` last inside
  `UIShellContent` (`routes/user-profile/index.tsx:38-49`, `:51-82`).
- Copy: `settings.toasts.*` in `src/modules/user/features/settings/i18n/{en,uk}.json`, eight keys:
  `saved`, `email_sent`, `password_changed`, `resent`, `save_failed_transient`, `save_failed`,
  `rate_limited`, `resend_failed`.

### 1.3 Design record

- Architecture §5.8 (`architecture-user-settings-2026-10-06.md:1340-1430`): new primitive used
  by settings alone, no timer, at most three, FIFO, never takes focus, fixed bottom-right
  (mobile: bottom, full width) from Figma `315:11754` / `318:13410`; "**Motion.** None"
  (`:1426-1427`).
- Amendments 2026-10-21 (`:1432-1452`): no toast carries a role; two always-mounted regions;
  widened focus return; success icon `success.text` `#2E7D32` because Figma `#38B386` is 2.34:1;
  a `CanvasText` border only in forced-colors mode.
- Amendment 2026-11-05 (`:1420-1425`): the clearance covers the stack, also at 320 × 256.
- `src/modules/user/README.md:582-595`, "Outcomes are toasts with no timer". Rejected: a timer,
  and a toast per field error.

### 1.4 Tests a change will touch

- **Unit, primitive:** `tests/unit/components/ui-toast/` (`styles.tokens`, `toast-icon`,
  `ui-toast`, `ui-toast-stack`, `use-stack-clearance`, `use-toast-focus`),
  `tests/unit/hooks/use-toast-queue.test.ts`, `tests/unit/styles/colors.test.ts`.
- **Unit, settings:** under `tests/unit/modules/user/features/settings/`, the route tests
  `routes/user-profile/index.{page,resend,toasts}.test.tsx`, the hook tests
  `hooks/use-{profile-save,email-resend,email-row,profile-form-model}.test.*`, and
  `components/{profile-form,user-profile-settings}/index.test.tsx`.
- **a11y, jsdom:** `tests/unit/a11y/{ui-toast,profile-form,profile-load,settings-page-states}`
  `.a11y.test.tsx`.
- **Tooling:** `tests/unit/tooling/performance-serving.test.ts:548` (`ui_toast` never in the
  eager catalog), `tests/unit/lib/locale-catalog/lazy-catalog-loader.test.ts`.
- **E2E:** `tests/e2e/modules/user/features/settings/{settings-save,settings-failures}.spec.ts`;
  the helper `utils/settings-page.ts:23-93`, which finds a toast through its close button's
  parent; `tests/e2e/mobile/settings-touch.spec.ts` (toast clearance).
- **a11y, E2E:** `tests/e2e/a11y/settings-states.a11y.spec.ts` (axe over success and error
  toasts), `tests/e2e/a11y/settings-keyboard.a11y.spec.ts` (toast close focus rules).
- **Visual:** `tests/visual/visual-comparison.settings.spec.ts:103-125`, 18 baselines named
  `uk-settings-{success-toasts,transient-toast}-{desktop,tablet,mobile}-{engine}-linux.png`
  for chromium, firefox and webkit.
- **Storybook:** `src/components/ui-toast/{ui-toast,ui-toast-stack,toast-icon}.stories.tsx`;
  `.storybook/preview.tsx:10-11,47` registers the toast catalog.

There is no integration test of the toast. `tests/visual/mobile/settings.spec.ts` captures the
resting page only, so no variant changes it unless the resting page changes. The selector helper
in `settings-page.ts:49` (`toastClose(page).locator('xpath=..')`) assumes the close button's parent
holds the message; variants B and C must keep a structure that helper can follow, or the helper
is generalised.

## 2. Why it is "not clearly seen"

### 2.1 Measured contrast

| Pair                                                        | Ratio   |
| ----------------------------------------------------------- | ------- |
| success surface `#E8F4EF` on page `#FBFBFB`                 | 1.09:1  |
| error surface `#FDECEC` on page `#FBFBFB`                   | 1.10:1  |
| success surface on white card / social tile `#FFFFFF`       | 1.13:1  |
| error surface on white `#FFFFFF`                            | 1.14:1  |
| success surface on sidebar current-row tint `#E8F7FF`       | 1.03:1  |
| card and tile border `#E1E7EA` on page                      | 1.21:1  |
| Figma `397:18093` stroke `#D0D4D8` on page                  | 1.44:1  |
| `grey[50]` `#969B9D` on page (outlined Clear button border) | 2.72:1  |
| text `#1A1C1E` on success surface                           | 15.15:1 |
| icon `success.text` `#2E7D32` on success surface            | 4.55:1  |
| icon `error.main` `#DC3939` on error surface                | 3.92:1  |

> Correction to the run summary: the social tiles are `#FFFFFF` with a `#E1E7EA` border
> (`social-networks/styles.ts:72-74`), not light blue. The 1.01:1 row compared against a guessed
> `#E5F5FD`; the real ratio against the tile is 1.13:1. The run-summary row has been corrected.
> The conclusion is unchanged: every edge of the toast is at or below 1.14:1.

The text and the icon pass comfortably; the container does not separate from anything around it.
Its only saturated element is a 24 px icon.

> Note on WCAG 1.4.11: the criterion requires 3:1 for the visual information needed to identify
> a user-interface component and for graphical objects. A non-interactive message container is
> neither, so the current toast does not fail 1.4.11 (its close button glyph is 15.15:1). The
> run summary's 3:1 "salience floor" is therefore a product rule modelled on 1.4.11, stricter than
> WCAG, and should be written that way in the PRD so no one argues it away as "not required".

### 2.2 Placement relative to Save

Save is `16.875rem` (270) wide at the left of the card's action row
(`profile-form/styles.ts:172-186`). Positions below come from the CSS above and the committed
baselines; the full-page baselines place Save at page `y` 828–890 (1440), 842–912 (1024) and
787–837 (375).

| Viewport    | Save (x × y)      | One toast (x × y)    | Gap                          |
| ----------- | ----------------- | -------------------- | ---------------------------- |
| 1440 × 900  | 540–810 × 828–890 | 1031–1428 × 814–876  | 221 px right; centres 555 px |
| 1440 × 1000 | 540–810 × 828–890 | 1031–1428 × 914–976  | 221 px right, 24 px lower    |
| 1024 × 1366 | 295–634 × 842–912 | 603–1000 × 1280–1342 | 368 px below, over footer    |
| 375 × 812   | 26–350, scrolled  | 15–360 × 745–797     | just below Save              |

The 1440 × 1000, 1024 × 1366 and 375 × 1082 sizes are the visual-test `notFoundScreens`
(`tests/visual/constants.ts`); rows assume `scrollY` 0 except on mobile, where Save is scrolled
into view.

- At 1440 the message text starts at `x` 1083, 273 px right of Save's right edge, in the corner
  that F- and Z-pattern scanning reaches last.
- On tall viewports (1024 × 1366, the 1920 × 1080 "full" screen) the stack lands far below the
  action row, over the social card and the footer, where the baselines show it reading as part of
  the social card (`uk-settings-success-toasts-{desktop,tablet}-chromium-linux.png`).
- On mobile the geometry is good: focus returns to Save and the clearance keeps it above the
  stack, so the toast is the next thing below the thumb. Mobile suffers only from the colour.
- Side finding: in `uk-settings-success-toasts-mobile-chromium-linux.png` three toasts cover the
  Clear button (page `y` 841–891 vs the first toast at 875). This is not a 2.4.11 failure (Clear is
  not focused, and `scroll-padding-bottom` handles focus scrolling), but it shows how much of a
  small screen the stack takes.

### 2.3 Size, motion and competing changes

- One desktop toast is 397 × 62, 1.9 % of a 1440 × 900 viewport.
- It appears in one frame with no transition, shadow or border (`styles.ts:56-79`; §5.8
  "**Motion.** None").
- At the same commit several other things change: the Save spinner stops and its label returns,
  `adoption.adopt(user)` re-renders the greeting and name in `ProfileHeader`
  (`use-profile-save.ts:97`, `user-profile-settings/index.tsx:54`), and the focus ring lands back
  on Save. The eye is pulled to Save and the card, the opposite corner from the toast.
- The app's visual language is built from near-white surfaces with 1.0–1.25:1 edges (cards
  `#FFFFFF` with `#E1E7EA` borders, the sidebar current-row tint, `#F4F5F6` footer pills, the
  disabled `#E1E7EA` header buttons). A pale tinted card is one more of these, not an event.

### 2.4 Ranked causes

1. **The container has no edge.** 1.09–1.14:1 against every neighbour, no border, no shadow.
   This affects all breakpoints and is the cheapest to fix.
2. **It appears away from the locus of attention.** 221–273 px right of Save at 1440 and up to
   368 px below it on tall viewports, in the lowest-attention corner. Mobile is not affected.
3. **No onset signal while attention is captured elsewhere.** No motion or elevation, while the
   Save button, the header greeting and the focus ring change in the same commit.
4. **It overlaps content and borrows its look.** On desktop and tablet the stack sits over the
   white social card and the footer, so it reads as page furniture.
5. **Small and low-weight.** About 2 % of the viewport; the only saturated element is the icon.

Variant A attacks causes 1, 3, 4 and 5; B attacks 2 and 3 (and 4, since nothing overlaps); C
attacks 3 and 4 by elevation but makes cause 2 worse (§4.3).

## 3. Industry and standards guidance

### 3.1 Design-system and UX guidance

- **NN/g, "Indicators, Validations, and Notifications"** distinguishes indicators (contextual,
  placed near the element they describe), validations (inline at the field) and notifications
  (general system events). A save outcome on a form is closest to an indicator or validation,
  which argues for a message near the form (variant B).
- **Carbon** separates inline notifications (non-disruptive, confined to the related area,
  persistent until dismissed or resolved) from toasts (for messages not tied to a particular
  section). Carbon's accessibility guidance says neither takes focus.
- **Polaris / Shopify** use toasts for short confirmations of a user action and avoid toasts for
  errors, except persistent ones such as connection errors; a condition needing attention in the
  page context uses a banner.
- **GOV.UK** uses a success notification banner at the top of the page for an outcome the user
  caused, and warns that banners are overlooked when overused.
- **Atlassian flags** suit confirmations needing minimal interaction; they overlay content at the
  bottom left, from the navigation side, and stack.
- **Material 3 snackbars** (from prior knowledge, not re-verified in this run) appear at the
  bottom on an inverse (dark) surface, which is the common answer to the "pale toast on a pale
  page" problem.

Consensus: a confirmation of a form submission is best near the form or on an elevated,
high-contrast surface; a pale, unelevated card in a far corner is the pattern every source warns
against. No source recommends a notification that grows out of a notification-centre bell for a
direct result of the user's own action; that pattern belongs to asynchronous, system-originated
events (the bell dropdown `377:18485` is exactly such a centre).

### 3.2 WCAG constraints every variant keeps

| Criterion                     | Level | What it means here                                    |
| ----------------------------- | ----- | ----------------------------------------------------- |
| 4.1.3 Status Messages         | AA    | announce without focus: keep both hidden live regions |
| 2.2.1 Timing Adjustable       | A     | no auto-dismiss timer (already decided)               |
| 2.4.11 Focus Not Obscured     | AA    | an overlay (A, C) never fully hides the focused item  |
| 2.4.3 Focus Order             | A     | no focus theft on show; fixed focus return on close   |
| 1.4.11 Non-text Contrast      | AA    | glyphs ≥ 3:1; the container floor is a product rule   |
| 1.4.10 Reflow                 | AA    | works at 320 CSS px and at 320 × 256                  |
| 2.5.8 Target Size (Minimum)   | AA    | 24 px; the repository holds 44 px on mobile (NFR-6)   |
| 2.3.3 Animation from Interact | AAA   | honour `prefers-reduced-motion`                       |
| Forced colors (not an SC)     | n/a   | keep a `CanvasText` edge; tints vanish there          |

2.4.11 and 2.5.8 are WCAG 2.2 criteria; the binding standard here is 2.1 AA
(`docs/accessibility/acceptance-standard.md`), but the settings work already adopted 2.4.11.

Sources:

- [NN/g: Indicators, Validations, and Notifications](https://www.nngroup.com/articles/indicators-validations-notifications/)
- [Carbon: notification pattern](https://carbondesignsystem.com/patterns/notification-pattern)
- [Carbon: notification accessibility](https://carbondesignsystem.com/components/notification/accessibility)
- [Shopify app design: alerts](https://shopify.dev/docs/apps/design/user-experience/alerts)
- [GOV.UK Design System: notification banner](https://design-system.service.gov.uk/components/notification-banner)
- [DfE design history: success, error and notification banners](https://becoming-a-teacher.design-history.education.gov.uk/register-of-training-providers/how-we-show-success-error-and-notification-banners)
- [Atlassian Design: flag](https://atlassian.design/components/flag)
- W3C, for 4.1.3, 2.4.11, 1.4.11 and 2.3.3:
  [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/)

## 4. Feasibility per variant

The shared base: the existing `ToastQueue` contract (`show(ToastDraftSet)`, `dismiss(id)`,
`announcement`, `alert`) already separates what is said from how it looks. The two hidden live
regions live in `UIToastStack` today; moving them into a variant-neutral host keeps announcement
identical across A, B and C, so only the visible renderer differs. That is the natural "one
contract".

> Assumption: announcements stay in the two always-mounted hidden regions for every variant, and
> no visible renderer carries a role. Rationale: a visible region with a role in B or C would
> double-announce and would be created and filled in one commit, which the 2026-10-21 amendment
> already rejected.

### 4.1 Variant A: elevated toast

- **Scope:** `src/components/ui-toast/styles.ts` and new colour tokens in
  `src/styles/colors.ts`; no layout or API change. Lowest risk.
- **Edge options that meet the 3:1 floor on `#FBFBFB`:**

| Option                                 | Edge on page    | Notes                          |
| -------------------------------------- | --------------- | ------------------------------ |
| Tint fill, 1 px tone border, 4 px bar  | 4.95:1 / 4.33:1 | keeps the Figma hues           |
| White fill, 1 px tone border, 4 px bar | 4.95:1 / 4.33:1 | like the user-menu popover     |
| Inverse fill `#1A1C1E`, white text     | 16.52:1         | Material-like; new icon tokens |
| Neutral `grey[50]` `#969B9D` border    | 2.72:1          | fails the floor; do not use    |

Ratios are success `#2E7D32` / error `#DC3939` against `#FBFBFB`; white text on `#1A1C1E` is
17.09:1.

- On the inverse fill, `#4CAF50` reaches 6.15:1 and `#DC3939` only 3.81:1 (still ≥ 3:1 for an
  icon), so the error icon would want a lighter red token.
- **Elevation:** `customColors.shell.popoverShadow` (`0 8px 27px rgba(49,59,67,0.14)`,
  `colors.ts:94`) already exists; the user menu pairs it with an inset 1 px ring
  (`user-menu/styles.ts:178`), a ready precedent.
- **Motion:** an entrance of about 150–200 ms (slide from the edge plus fade). Precedents for
  reduced-motion handling: `ui-navigation-drawer/use-drawer-motion.ts`,
  `ui-toast/styles.ts:27-29`. Under `prefers-reduced-motion: reduce` the toast appears without
  transform.
- **Recommended default for A:** tint fill kept, 1 px tone border, 4 px tone accent on the
  inline-start edge, `popoverShadow`, entrance motion. It fixes causes 1, 3, 4 and 5 and keeps
  the Figma colours as the fill.
- **Tests:** `styles.tokens.test.ts`, `colors.test.ts`, the 18 toast baselines, Storybook.

### 4.2 Variant B: inline status at the action

- **Mount point exists.** `ProfileFormFields` already renders a polite `role="status"` paragraph
  between the actions divider and Save for "no changes" (`profile-form/index.tsx:143-148`,
  `styles.ts:164-171`). `UIForm` also takes a `footer` slot rendered after the submit button
  (`ui-form/index.tsx:119-128`; settings passes `ClearButton`).
- **Place it below the action row, not above Save.** Inserting a 50–60 px block above Save after
  the click pushes Save and Clear down under the pointer; below the row only the social card
  moves. The existing no-changes paragraph above Save already shifts the row by its height plus
  16 px (`styles.ts:170`), so B should not copy that position.
- **Distance:** effectively 0–16 px from Save at every breakpoint, inside the card, in the same
  scroll position, never overlapping anything. It needs no clearance hook: B removes
  `useStackClearance` from its path.
- **Resend outcome belongs at the e-mail row.** `EmailStatusRow` (`email-status-row.tsx`) is where
  the user clicked "Надіслати повторно"; B should show `resent` / `resend_failed` there, not at
  Save.
- **Per-field success marks** (a check plus "Збережено" under each saved field) are feasible with
  the `describedBy` path `UIFormField` already supports (`profile-form/index.tsx:79`), but they
  multiply states (three fields, password cleared after save) and tests. Recommended as an
  optional extension, not part of the first comparison.
- **Retry:** the transient error's action renders inline beside the message; focus stays on Save
  after settle as today.
- **Close button:** an inline status is page content, not an overlay. Recommended: no close;
  it persists until the next submit or Clear. The "focus returns on close" guarantee then does not
  arise for B.
- **Figma:** no frame. The card's own tokens apply (radius 12, Golos, `paletteColors.*`).

### 4.3 Variant C: notification merged with the bell

- **Figma facts** (read 2026-11-11):
  - `397:18093` is a union of a 48 × 117 pill at (1087, 8) and a 256 × 62 card at (1110, 63);
    the bubble's visible extent is 1087–1366 × 8–125. Message `397:18094` at (1101, 78), 179 × 18;
    timestamp `397:18095` at (1101, 96), 100 × 18.
  - The stroke `#D0D4D8` is 1.44:1 on the page; the shadow `0 8px 27px #313B430D` equals the
    existing `customColors.shell.cardShadow` (`colors.ts:93`).
  - `397:16713` is drawn on the Management board (dashboard), not on `/settings`, with the
    **enabled** white bell and a badge "8" on the list button. In the app the bell is natively
    disabled, `#E1E7EA` with a `#D0D4D8` glyph (`ui-app-shell/README.md:105-110`).
- **Correction to the run summary on tablet and mobile frames:**
  - `397:16963` (tablet) draws **no** notification surface at all, only badge counts.
  - `397:17089` (mobile) draws the bell dropdown `Frame 412` (313 × 371 at 39, 143).
  - `378:21909` (mobile) draws the **user menu** `Frame 426` ("Мой профиль", "Настройки",
    "Выйти"), not the bell dropdown.
  - The dropdown `377:18485` has a 26 × 6 caret (`Polygon 2`) above a 313-wide card, which is the
    natural visual language for a tablet and mobile fallback.
- **Bell position per shell layout** (`ui-app-shell/README.md:57-103`; shell breakpoints differ
  from the settings breakpoints):

| Shell layout | Range     | Bell box (x, y, size)   | Note                          |
| ------------ | --------- | ----------------------- | ----------------------------- |
| desktop      | ≥ 1440    | 1087, 8, 48 × 48        | only width with a merged look |
| tablet       | 1024–1439 | 639, 6, 52 × 52 at 1024 | mid-header, not at the edge   |
| mobile       | < 1024    | 200, 16, 24 × 24 at 375 | glyph only; no merged design  |

The tablet bell moves with the header width, so C must anchor to the bell element, never to a
constant.

- **Where it can be built.** The header is in `UIAppShell`, a lazy chunk under
  `src/components/`, which must not import `src/modules/`. Two routes:
  - **C1, page-owned overlay** that measures the bell from outside: the page would have to find
    the shell's button by role and name. Brittle and couples a module to shell internals.
  - **C2, shell-hosted outlet (recommended):** a client-state store in `src/lib/` (the
    `src/lib/connectivity/use-connectivity-store.ts` precedent; Zustand per ADR-002 and
    `docs/state-architecture.md:58-134`) that the page writes through the same contract and
    `UIAppHeader` reads, rendering the card absolutely positioned under the bell inside the
    sticky header (`zIndex 1100`, `ui-app-header/styles.ts:21`). The card then stays in view while
    the page scrolls. This also lifts the queue from page-local to app-wide, which "has to work
    app-wide" needs anyway.
- **Salience risk.** At 1440 × 900 the card centre is about 943 px from Save's centre, the
  farthest of the three variants and farther than today's 555 px. It sits above the fold at all
  times (sticky header) and is elevated, but it relies on the user looking up. Without an onset
  signal it may be noticed less than today's toast. It needs entrance motion with the same
  reduced-motion rule as A, and a stroke that meets the floor (for example the tone colour
  instead of `#D0D4D8`).
- **Focus not obscured (top edge).** A card hanging 61 px below the 64 px header covers the top of
  the viewport. `useStickyFocusClearance` (`ui-app-shell/use-sticky-focus-clearance.ts:1-26`) only
  clears the 64 px header; C needs its own top clearance while shown (the mirror of
  `useStackClearance`).
- **Timestamp.** The design shows date and time. Client-side, it can be the moment of `show`,
  formatted through the `datetime` i18next formatter or `LocaleFormatter` (raw `Intl` is banned,
  CLAUDE.md Important Patterns 10).
- **Bell stays disabled; no badge increment.** No store, history or unread state
  (user-service #526 and #527 are open). The pill around a disabled bell is a design question.
- **Bundle:** the outlet store is imported by the shell chunk and the settings chunk. The shell
  loads only on protected routes (`protected-layout`), so the auth paint path does not grow.

### 4.4 Comparison at a glance

| Measure                 | Today       | A          | B             | C               |
| ----------------------- | ----------- | ---------- | ------------- | --------------- |
| Edge contrast on page   | 1.09–1.14:1 | ≥ 4.33:1   | card-internal | 1.44:1 as drawn |
| From Save at 1440 × 900 | ~555 px     | ~555 px    | ~0–16 px      | ~943 px         |
| From Save on mobile     | below Save  | below Save | below Save    | top of screen   |
| Overlaps page content   | yes         | yes        | no            | yes, at the top |
| Needs focus clearance   | bottom      | bottom     | none          | top             |
| Figma frame             | yes         | no         | no            | desktop only    |
| Touches the shell       | no          | no         | no            | yes             |

B's edge is the card itself; an inline status inside it needs no page-level floor, only a tone
accent that meets 3:1 against white (`#2E7D32` 5.13:1, `#DC3939` 4.48:1). C's stroke is fixable
with a tone colour.

## 5. Repository constraints that shape the plan

- **Runtime switch** (CLAUDE.md "Runtime configuration and feature flags (issue #145)", line
  2587; `docs/feature-flags.md` "Rules"): flags are **boolean only**, "anything that needs a value
  is a configuration setting". No flags exist today (`FeatureFlag = never`,
  `feature-flag-service.ts:4`; `public/index.html:27-29` ships `{ "flags": {} }`). A three-way
  switch therefore means a new **enum setting**, which the layer does not support yet:
  - `app-config-schema.ts:15-19` is a strict object with two URLs and `flags`; add a
    `z.enum([...]).optional()` field.
  - `AppConfigSource.text()` is typed to `AppConfigUrlKey` (`app-config-source.ts:21-25`); an
    enum reader is new.
  - `scripts/render-app-config.js` handles only `URL_SETTINGS` and `APP_CONFIG_FLAG_*`
    (`:29-68`); an enum validator that fails container start on an unknown value is new.
  - `.env.example`, `docker-compose.test.yml:19-20` pass-through, `make check-env-sync`,
    `tests/unit/scripts/render-app-config.test.js`, `tests/unit/config/runtime/*`,
    `tests/unit/tooling/runtime-config-contract.test.ts`.
  - Two booleans instead (`inline`, `bell`) would allow an invalid "both on" combination, which
    the "no nesting" rule exists to prevent.
- **ADR drift gate** (CLAUDE.md line 1771): `src/config/**` is an ADR-required surface, so the
  enum setting needs an ADR touch or the `adr:not-required` label / `[no-adr]` line. No new
  dependency is needed (motion is CSS), so `package.json` stays out.
- **Where the switch can be seen.** The runtime block is rendered by the container entrypoint.
  `docker-compose.test.yml` runs it, so e2e and visual tests can select a variant. Whether the
  per-PR sandbox (`.github/workflows/sandbox-creating.yml`, an AWS CodePipeline) runs the
  entrypoint is not visible from this repository.
- **Storybook on Pages** (CLAUDE.md line 2816): publishes only from `main`; "Nothing deploys from
  a pull request". The team lead sees variant stories on Pages only after a merge to `main`;
  before that, Storybook runs locally (`make storybook-start`).
- **Lazy catalogs** (`config/i18n-catalog-policy.json`): new copy for a renderer (C's header
  label, a timestamp phrase) goes in a catalog its owner registers through `lazyCatalogLoader`,
  never the eager catalog; `performance-serving.test.ts:548` pins `ui_toast` out of the eager
  set. C's shell-side strings belong to the `ui-app-shell` catalog.
- **Performance budgets** (`config/performance-budget.json`): `/settings` is not a Lighthouse URL
  (`lighthouse/constants.js:17-29`), but the gzip per-chunk (130 000) and raw per-asset
  (400 000) budgets apply to the settings and shell chunks. An enum reader in `appConfigSource`
  lands in the eager `index` (raw entrypoint budget 470 000); keep it a few lines.
- **Visual baselines:** 18 toast PNGs exist. If A becomes the default look, they are
  re-recorded once. B and C each need their own success and transient-error captures at the
  three `notFoundScreens` sizes in three engines (18 each), selected through the runtime block.
  Re-baselining is allowed only for a deliberate look change, never to force a pass.
- **100 % coverage and 100 % mutation** (CLAUDE.md lines 302, 363): every renderer, the selector
  and each branch of the enum validator need assertions; static style literals need the
  isolated-load pattern (`tests/unit/utils/isolated-module.ts`). The follow-up that deletes the
  losing variants must delete their tests in the same change.
- **jscpd at 70 tokens** (line 1305): three renderers repeating icon, message, action and close
  markup will clone. Extract one shared content piece; keep each variant's file to its frame.
- **rust-code-analysis** (line 1216): rca caps 10 functions per file, closures count; function
  LLOC ≤ 10; split renderers and hooks accordingly.
- **No static or free functions in `.ts`, class naming** (lines 2246, 2303): the variant choice
  is best a hook (`use-*.ts`, exempt) and a component map, not a new class. If a class is needed,
  `*Strategy` (interchangeable algorithm) is the matching suffix.
- **Type-only files** (CLAUDE.md pattern 7): renderer props and the setting's type go in
  `src/components/types/...` and `src/config/runtime/types/`.
- **No `data-testid`** (pattern 4): tests locate by role and name; the e2e helper that climbs from
  the close button must keep working or be generalised.
- **Console gate** (line 72): an `act()` warning from an entrance animation or a late layout
  effect fails the emitting test; await the settled state.
- **Accessibility gates** (line 574): jest-axe over each renderer and the Playwright axe scan of
  `/settings` states; `settings-keyboard.a11y.spec.ts` must cover each variant's focus rules.
- **figma-design-check** (`.claude/skills/figma-design-check/SKILL.md:83-89`): for "no design
  exists for this surface", the gate says to tell the user and confirm the intended look before
  coding. A and B have no frame, and C has no tablet or mobile frame, so the UX stage must record
  the intended look and an owner confirmation (or an explicit deviation) for each.
- **App-wide reach** (`docs/state-architecture.md`): today the queue is page-local
  (`use-toast-queue.ts`). A second consumer, or C, needs it in a `src/lib/` store.

## 6. Risks and open questions

Each item gives the question or risk, then the recommended default.

- **R1. Enum setting or booleans for the switch?** One enum setting, for example
  `notificationStyle` with the values `toast` (A), `inline` (B) and `bell` (C), default `toast`;
  container start fails on any other value.
- **R2. ADR for the new setting kind?** `adr:not-required` with a `[no-adr]` rationale (temporary,
  removed by the follow-up). Write an ADR only if the enum setting kind outlives the comparison.
- **R3. Does the sandbox run the container entrypoint?** Unknown from this repository. Plan for
  Storybook plus `make start-prod` with the variable set, and ask the owner how the team lead
  reviews.
- **R4. Pages publishes only from `main`.** Merge the variants behind the setting with A as the
  default, so Pages shows all three; the follow-up deletes the two not chosen.
- **R5. Does A replace today's look as the default?** Yes. The shipped look is the defect; the
  committed baselines on `main` are the "before" reference, so no fourth renderer is kept.
- **R6. C is the farthest from Save (~943 px at 1440 × 900).** Keep C as the designer's intent, but
  require entrance motion and a stroke of at least 3:1, and compare it with A and B on the same
  measures.
- **R7. C on tablet and mobile has no merged design.** Fall back to the dropdown's caret card
  (`377:18485`) anchored under the bell; record it as a design question.
- **R8. C wraps a disabled bell that Figma draws enabled.** Draw the pill around the disabled
  bell as it is, flag the mismatch for design, and never enable the bell.
- **R9. B above or below Save?** Below the action row, so Save never shifts under the pointer;
  resend outcomes go to the e-mail row.
- **R10. B per-field success marks.** Out of the first comparison; an optional extension.
- **R11. B close button.** None; the status persists until the next submit or Clear.
- **R12. Visual baseline growth (B and C add about 36 PNGs).** Accept it for the comparison
  window; the follow-up deletes the losers' baselines.
- **R13. Double announcements if a visible renderer has a role.** Announce only through the two
  hidden regions; renderers carry no role.
- **R14. C covers focus near the top of the viewport.** Add a top clearance while the card shows,
  mirroring `useStackClearance`.
- **R15. The salience floor read as a WCAG requirement.** State it in the PRD as a product rule
  modelled on 1.4.11, with the measured ratios.
- **R16. Measuring "clearly seen" objectively.** Compare edge contrast, distance from Save at
  1440, 1024 and 375, presence in the viewport at settle, and overlap, plus the team lead's
  review.
- **R17. App-wide reach before a second consumer exists.** Lift the queue into a `src/lib/` store
  only when C (or another consumer) needs it; A and B can stay page-local.
