---
status: 'complete'
workflowType: 'prd'
project_name: 'crm'
date: '2026-06-18'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/48'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/48'
  - 'src/components/ui-form/index.tsx'
  - 'src/components/ui-form/styles.ts'
  - 'src/components/ui-button/index.tsx'
  - 'src/components/ui-button/theme.ts'
  - 'src/styles/colors.ts'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx'
  - 'src/modules/user/features/auth/utils/get-submit-label-key.ts'
  - 'src/modules/user/features/auth/i18n/en.json'
  - 'src/modules/user/features/auth/i18n/uk.json'
---

# PRD - MUI Submit-Button Loader (Issue #48)

**Author:** BMad (Product Manager) **Date:** 2026-06-18 **Source:** VilnaCRM-Org/crm#48

## Executive Summary

Replace the auth submit button's split, partly-inaccessible busy treatment — a
detached 70px `CircularProgress` below a grey, low-contrast disabled button — with
Material-UI v7's **native in-button loading state**: while submitting, the same
button keeps its brand fill, hides its label, shows a centered spinner, and goes
non-interactive, with the busy state exposed programmatically via `aria-busy` and a
single polite announcement.

The goal is one accessible, zero-layout-shift "working" cue on the login and
registration forms — readable, WCAG 2.2 AA-clean (contrast, name/role/value, focus,
status messages), and double-submit-safe — delivered with no new dependency and
within every existing repo gate (Lighthouse, jscpd, rca metrics, no-`data-testid`,
no suppressions, i18n en/uk parity, mutation, 100% integration coverage). Scope is
deliberately narrow: only the shared submit button; the deleted L1-L5 loader family
is not reintroduced, and the retry button, page skeleton, and switcher are
unchanged.

## Overview & Context

The auth submit flow currently signals "working" with two separate visuals. The
shared `UIForm` `SubmitControls` function (`src/components/ui-form/index.tsx`,
lines 101-119) renders the submit `UIButton` and then, while `submitting` is
true, a **detached** `CircularProgress color="primary" size={70}` that drops in
**below** the button (`styles.loader = { display: 'block', margin: '1rem auto 0' }`).
At the same moment the button is set `disabled`, so the contained theme rule in
`src/components/ui-button/theme.ts` (`&:disabled` → `backgroundColor:
background.subtle (#E1E7EA)`, `color: background.default (#FFFFFF)`) fires and the
button greys out to white-on-grey.

A second, related defect lives in the label wiring. Both forms compute the submit
label through `t(getSubmitLabelKey(mode, isSubmitting))`
(`src/modules/user/features/auth/utils/get-submit-label-key.ts`), and that util
**swaps the button children to the `submitting` string while submitting**. With
the native `loadingPosition="center"` treatment, MUI derives the loading
accessible name from the button's children, so a state-dependent label would make
the busy button announce "Signing in…" instead of its stable submit label —
directly defeating FR10/AR1. The label must therefore become stable across idle
and loading states.

This treatment has three concrete problems:

1. **Layout shift.** The size-70 spinner appears below the button only while
   submitting, pushing surrounding content and changing the form height between
   idle and busy states.
2. **A WCAG 1.4.3 contrast defect.** The grey disabled state renders the label as
   white text on `#E1E7EA`, roughly a 1.2:1 ratio — far below the 4.5:1 minimum.
3. **Split, redundant signaling.** The greyed button and the detached spinner are
   two separate "busy" cues that are not tied together, and the `<form noValidate>`
   carries **no** `aria-busy` and **no** live-region announcement, so assistive
   technology gets no programmatic busy signal at all.

Material-UI v7.3.1 (already the project's MUI version) ships a **native** Button
loading API on `@mui/material/Button` — the `loading`, `loadingPosition`, and
`loadingIndicator` props — that replaces the deprecated `@mui/lab` `LoadingButton`.
With `loading={submitting}` and `loadingPosition="center"`, MUI visually hides the
button label, overlays a centered `CircularProgress`, and natively disables the
button — all within the button's fixed geometry, with zero layout shift.

This PRD specifies replacing the detached-spinner-plus-grey-button treatment with
that in-button native loading treatment, scoped narrowly to the **submit button of
the login and registration forms**. `CircularProgress` is already imported on the
auth path today, so no new heavy dependency is introduced. This feature is
deliberately narrow: the previously over-built five-loader family (L1-L5) was
deleted and is **not** reintroduced here.

## Goals & Non-Goals

### Goals

- Show busy state **inside** the submit button: hide the label, overlay a centered
  spinner, keep the button's `#1EAEFF` brand fill and `57px`-radius geometry.
- Remove the detached `size={70}` `CircularProgress` and the layout shift it causes.
- Make the busy state programmatically perceivable: `aria-busy` on the `<form>`
  plus exactly one polite announcement reusing the localized `submitting` string.
- Resolve the spinner-on-brand-blue contrast concern with a concrete, justified
  choice — a dark `#404142` indicator on the `#0399ED` loading fill (4.67:1) —
  rather than relying on the rejected grey disabled state.
- Give the idle / re-enabled submit button a distinct, conformant focus indicator
  (a visible outline clearing ≥3:1 against both the fill and the white page).
- Keep the submit label stable across idle and loading states so the busy button
  retains its submit-label accessible name.
- Provide a free double-submit guard via the natively disabled button.
- Land within every existing repo gate (Lighthouse, jscpd, rca metrics,
  no-data-testid, no suppressions, i18n parity, mutation, 100% integration
  coverage) with no new suppressions.

### Non-Goals

- No reintroduction of the deleted L1-L5 loader family or any new shared loader
  component.
- No change to the retry button, the page-load `AuthSkeleton`, or the login/register
  switcher.
- No change to form validation logic, submit handlers, or the auth store.
- No migration to `@mui/lab` `LoadingButton` (use native `@mui/material/Button`).
- No new dependency; `CircularProgress` is already on the auth path.

## Scope

### In Scope

- The **submit button** of the registration form
  (`src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx`)
  and the login form (`.../login-form.tsx`), both of which render through the shared
  `UIForm` → `SubmitControls`.
- `src/components/ui-form/index.tsx` (`SubmitControls`, `FormBody` `<form>`),
  `src/components/ui-form/styles.ts` (removal of `styles.loader`),
  `src/components/ui-button/index.tsx` (pass-through of the loading-related props),
  and `src/components/ui-button/theme.ts` (loading-specific fill override).
- `src/modules/user/features/auth/utils/get-submit-label-key.ts` — removal of the
  state-dependent label swap (see FR11), and the two consumers that call it.
- Reuse (no edit to) the existing `submitting` / `submit_button` i18n keys under
  `sign_up.form` and `sign_in.form` in `en.json` + `uk.json`; all four keys
  already exist, and only the wiring of which key feeds the button versus the live
  region changes.

### Out of Scope / Unchanged

- The retry button (`registration-error-view.tsx`, `auth.error.tryAgain`).
- The page-load `AuthSkeleton`.
- The login/register switcher.
- Any non-auth consumer of `UIButton` or `UIForm`.

## Functional Requirements

Requirement IDs are stable and are referenced by the UX, Architecture, and Epics
documents.

- **FR1 — Hide the visible label while submitting.** While `submitting` is true,
  the submit button's text label MUST be visually hidden via MUI's
  `loadingPosition="center"` (which sets the children to `visibility: hidden`),
  not removed from the DOM.
- **FR2 — Centered in-button spinner.** A single `CircularProgress` MUST be
  overlaid in the center of the submit button via the native `loadingIndicator`
  prop. No spinner renders outside the button.
- **FR3 — Disabled / non-interactive while submitting.** While `submitting` is
  true, the button MUST be natively `disabled` (the `loading` prop sets the
  underlying `ButtonBase` `disabled`), so it cannot be clicked or re-activated and
  cannot trigger form submission.
- **FR4 — Keep the brand fill while loading.** The button MUST retain a brand blue
  fill while loading — it MUST NOT show the grey `#E1E7EA` disabled state. A
  loading-specific theme/sx rule keyed on `buttonClasses.loading`
  (`.MuiButton-loading`) MUST override the `&:disabled` grey rule, using the darker
  active brand blue `#0399ED` to signal busy and provide the high-contrast field
  for the dark spinner (see AR2). The geometry (`57px` radius, responsive
  width/height) MUST stay identical.
- **FR5 — Remove the detached spinner.** The standalone `CircularProgress
color="primary" size={70}` rendered after the button in `SubmitControls`
  (`index.tsx` line 116) and the `styles.loader` block in `styles.ts` MUST be
  removed.
- **FR6 — `aria-busy` on the form.** The `<form noValidate>` in `FormBody` MUST
  carry `aria-busy={submitting}`.
- **FR7 — Single polite announcement.** Exactly **one** polite live region MUST
  announce the busy state, reusing the existing localized `submitting` string
  (`sign_up.form.submitting`, `sign_in.form.submitting`). There MUST be no
  duplicate or nested live regions.
- **FR8 — Zero layout shift.** The form's layout and the button's box MUST NOT
  change dimensions between idle and submitting states; the label-to-spinner swap
  happens inside the button's fixed geometry.
- **FR9 — Double-submit guard.** Because the button is natively disabled while
  `submitting`, re-submission MUST be prevented for the duration of the in-flight
  request; no separate guard logic is added.
- **FR10 — Preserve the accessible name.** The localized submit label MUST remain
  the button's children while loading (MUI hides it visually only), so the button
  retains an accessible name. The submit button MUST NOT become a nameless
  spinner-only control.
- **FR11 — Stable submit label.** The submit label MUST be stable
  (`submit_button`) in both idle and loading states. The existing
  `getSubmitLabelKey` label-swap, which today changes the button children to the
  `submitting` string while submitting, MUST be removed so that — under
  `loadingPosition="center"` — the loading accessible name stays the submit label
  rather than the "submitting" string. Both consumers MUST switch from
  `t(getSubmitLabelKey(mode, isSubmitting))` to a stable
  `t('<mode>.form.submit_button')`. The `submitting` string remains in use, but
  only as the polite live-region announcement (FR7), not as the button's children.

## Non-Functional Requirements

Requirement IDs are stable and are referenced by the UX, Architecture, and Epics
documents.

- **NFR1 — Lighthouse budget.** The change MUST keep the auth-page mobile
  Lighthouse score at or above the CI gate (~0.85; CI score is authoritative). No
  new heavy dependency may be added to the auth critical path; `CircularProgress`
  is already imported there.
- **NFR2 — jscpd DRY gate.** The implementation MUST pass `make lint-dup`
  (`.jscpd.json`: `minTokens 75`, `minLines 5`, `threshold 0`, mode `mild`) by
  deduplicating shared markup/style, never by ignore directives.
- **NFR3 — rca metrics gate.** The implementation MUST pass `make lint-metrics`:
  ≤10 functions/closures per file, Cyclomatic ≤10, Cognitive ≤15, ABC ≤17, ≤3
  args, ≤3 exit points, function LLOC ≤10 / PLOC ≤40 / SLOC ≤45, file LLOC ≤120 /
  PLOC ≤300 / SLOC ≤350, MI (VS) ≥20.
- **NFR4 — No data-testid.** Source MUST ship no `data-testid`; tests MUST locate
  the button and announcement via `getByRole` / `getByLabelText` / `getByText`,
  using a stable `id` only as a last resort.
- **NFR5 — No suppressions.** No `eslint-disable`, `@ts-ignore`, or equivalent
  suppression may be added; the brand-fill fix is a theme/sx override only. No new
  inline code comments are added; rationale lives in PR/docs.
- **NFR6 — i18n parity.** Any i18n key used MUST exist in both `en.json` and
  `uk.json` and stay in sync via the localization generator. Existing keys
  (`sign_up.form.submitting` = "Signing up…" / "Обробка…",
  `sign_in.form.submitting` = "Signing in…" / "Вхід…") are reused; no English
  string is hard-coded. No JSON edits are required — all four keys already exist.
- **NFR7 — WCAG conformance.** The result MUST satisfy WCAG 1.4.3 (contrast,
  resolving the rejected grey state), 1.4.11 (non-text contrast for the dark
  spinner and the focus outline), 4.1.2 (name/role/value — preserved accessible
  name and busy state), 4.1.3 (status messages — the polite busy announcement via
  `role="status"`), 2.4.3 (focus order on the error-return path), 2.4.7 (focus
  visible), and 2.4.11 (focus appearance — the in-scope, distinct focus indicator
  on the idle / re-enabled submit button). See Accessibility Requirements.
- **NFR8 — Reduced motion.** Under `prefers-reduced-motion: reduce`, the spinner
  animation MUST be suppressed (`animation: none` on the indicator) since the
  visual/e2e harness forces reduced motion
  (`tests/visual/take-visual-snapshot.ts` → `emulateMedia({ reducedMotion:
'reduce' })`). This is a quality / snapshot-stability / best-practice
  requirement, **not** an AA gate — WCAG 2.3.3 (Animation from Interactions) is
  AAA, so this MUST NOT be over-claimed as AA conformance. Busy state is still
  conveyed by `aria-busy`, native disabled, and the live region; the spin is
  decorative. The unit assertion MUST confirm `animation: none` appears **only**
  inside the `prefers-reduced-motion: reduce` media query.
- **NFR9 — Mutation + integration coverage.** The change MUST keep 100%
  integration coverage over `src/**` with new branches (loading vs idle, both
  forms) exercised by tests, and MUST leave **no surviving Stryker mutant on the
  new branches**: the loading-fill color (`#0399ED`), the
  `submit_button`-versus-`submitting` key selection, and the `aria-busy` value.

## Accessibility Requirements

These requirements expand NFR7/NFR8 and MUST be validated by the accessibility
review.

- **AR1 — Accessible name preserved (WCAG 4.1.2).** Implements FR10/FR11. The
  button's accessible name is **exactly** its stable localized `submit_button`
  children, kept in the DOM and hidden only via `visibility: hidden` by MUI's
  center position. Any `aria-label` on the `loadingIndicator` / `CircularProgress`
  MUST be dropped — do **not** put a competing name on the indicator and do **not**
  wire a labelled progressbar. The `submitting` string is used ONLY by the live
  region (FR7), never as a name on the indicator. The authoritative test asserts
  the button's accessible name **equals** (exact match, not "contains") the
  localized `submit_button` label in **both** idle and loading states, and asserts
  no separately-exposed progressbar node contributes a name. The button MUST never
  be a nameless spinner, and MUST NOT have its accessible name swapped to the
  "submitting" string.
- **AR2 — Spinner non-text contrast (WCAG 1.4.11).** White on the idle `#1EAEFF`
  fill is **2.46:1**, below the 3:1 requirement for meaningful non-text
  indicators. The resolution (per FR4) shifts the button fill to the darker active
  blue `#0399ED` **while loading** and draws the spinner in dark
  `customColors.text.primary` (`#404142`) — **not** white — at `thickness={4.5}`
  and `size={28}`. The indicator MUST NOT be white and MUST NOT use
  `color="inherit"`. Dark `#404142` on `#0399ED` is **4.67:1**, comfortably
  clearing the 1.4.11 3:1 floor for a thin anti-aliased stroke. The white-on-
  `#0399ED` 3.10:1 option is explicitly **rejected** as too marginal for a thin
  anti-aliased stroke and MUST NOT be cited as the conformance basis anywhere.
  (Import note: `#404142` is `customColors.text.primary`, under `customColors.text`,
  **not** `paletteColors`.)
- **AR2b — Supplementary, belt-and-suspenders (WCAG 1.4.11 framing).** The spinner
  is built to pass 1.4.11 on its own (the 4.67:1 stroke) **and** is supplementary:
  busy is also conveyed by `aria-busy` (AR4), the native `disabled` attribute, the
  fill shift to `#0399ED`, and the polite live region (AR3). This is
  belt-and-suspenders, **not** "decorative-and-excused." The UX document MUST
  record and justify the dark-stroke contrast math and the `thickness` / `size`
  values.
- **AR3 — Single polite live region (WCAG 4.1.2, 4.1.3).** Implements FR7. Exactly
  one polite, non-assertive live region — a `UILiveStatus` span with `role="status"`
  (which carries implicit `aria-live="polite"`) plus `aria-atomic="true"` —
  announces the busy state with the localized `submitting` string. No nested or
  duplicate live regions; no `role="progressbar"` is wired as a second announcement
  source, and the indicator carries no name (per AR1).
- **AR4 — Form busy state.** Implements FR6. `aria-busy={submitting}` on the
  `<form>` exposes the busy state programmatically.
- **AR5 — Focus behavior (WCAG 2.4.7, 2.4.11, 2.4.3).** Because the button becomes
  natively `disabled` while loading, it leaves the tab order and, if it held focus
  at submit time, the browser moves focus to `<body>`. The single polite live
  region announces the busy state regardless of focus location, but announcing
  busy does **not** restore a focus position. The explicit focus behavior is
  therefore:
  - **Distinct focus indicator (in scope):** the idle / re-enabled submit button
    MUST present a distinct, conformant focus indicator. Today
    `src/components/ui-button/theme.ts` collapses `:focus-visible` into the shared
    `:hover` rule (`#00A3FF` with `boxShadow: 'none'` ⇒ ~1.18:1 against the
    `#1EAEFF` fill — effectively no visible focus). The fix splits `:focus-visible`
    OUT of `:hover` and adds an `outline: '2px solid #404142'` with `outlineOffset:
'2px'`, drawn **outside** the fill so it clears ≥3:1 against both the
    `#1EAEFF` / `#0399ED` fill and the white page (`#404142` is ~4.67:1 on
    `#0399ED` and ~9:1 on white). The outline MUST NOT be removed by `boxShadow:
'none'`. This feature touches that exact control and asserts NFR7/AR5, so it
    **owns** this fix — it is NOT deferred as pre-existing or out of scope.
  - **Registration error path (in-place):** because submit drives the button to
    native `disabled` (moving focus to `<body>`), and the registration form passes
    `error={null}` so the failure swaps to `RegistrationNotificationPanel`, the
    notification view MUST receive focus on mount (`tabIndex={-1}` + focus its
    heading / error text). This feature creates the `<body>`-focus condition, so it
    owns the remediation even though the fix lands in the notification component. An
    e2e assertion (see Acceptance Criteria) MUST confirm that after a registration
    failure focus is on a meaningful element, not `<body>`. This is the concrete
    remediation for the 2.4.3 focus-order gap and MUST be documented in
    UX/Architecture.
  - **Login error path (in-place):** the existing login `ErrorBanner` focus-move
    path (give it `tabIndex={-1}` and focus it on mount) is preserved so
    keyboard/SR users are not stranded at `<body>` after the round-trip.
  - **Success path (form unmounts):** login/registration success unmount the form,
    so focus management belongs to the destination view; that boundary is out of
    scope for this feature.
- **AR6 — Reduced motion.** Implements NFR8. Under `prefers-reduced-motion:
reduce`, the indicator does not spin; the busy state remains conveyed by AR3/AR4
  and the native disabled attribute.

## Acceptance Criteria

Each criterion is testable and traceable to the requirement IDs above.

- **AC1 (FR1, FR2, FR5).** On submit, the submit button shows a centered spinner
  with its text label visually hidden, and no `CircularProgress` element exists
  anywhere outside the button (the `size={70}` detached spinner and `styles.loader`
  are gone). Verified by unit test asserting one in-button progress indicator and
  no sibling spinner.
- **AC2 (FR3, FR9).** While submitting, the submit button has the native
  `disabled` attribute, is not in the tab order, cannot be clicked, and a second
  submit attempt does not fire the submit handler again. Verified by unit/e2e test.
- **AC3 (FR4, AR2, AR2b).** While submitting, the button's computed background is
  the brand blue `#0399ED` (not `#E1E7EA`), and the spinner stroke is dark
  `#404142` (`customColors.text.primary`) at `thickness={4.5}` / `size={28}` — not
  white and not `color="inherit"` — giving a 4.67:1 dark-on-`#0399ED` non-text
  contrast; the `57px`-radius geometry is unchanged. Verified by unit test on the
  loading-class style and the indicator props, plus a visual snapshot.
- **AC4 (FR6, AR4).** The `<form>` exposes `aria-busy="true"` exactly while
  submitting and `aria-busy="false"` otherwise. Verified by unit test querying the
  form's `aria-busy`.
- **AC5 (FR10, FR11, AR1).** The button's accessible name **equals** (exact match,
  not "contains") its stable localized `submit_button` label in **both** idle and
  loading states (the `getSubmitLabelKey` label-swap is removed, so the name never
  becomes the "submitting" string), and **no** separately-exposed progressbar node
  contributes a name (no `aria-label` on the indicator). Verified by RTL
  `getByRole('button')` accessible-name assertion (exact equality) in both states
  (no `data-testid`, satisfying NFR4).
- **AC6 (FR8).** No layout shift occurs between idle and submitting: the form
  height and the button box are identical in both states. Verified by visual
  regression snapshots (idle vs submitting) and a CLS-oriented check.
- **AC7 (NFR8, AR6).** Under forced `prefers-reduced-motion: reduce`, the indicator
  renders without spin animation (`animation: none`), and the visual snapshot is
  stable. Verified by the reduced-motion visual harness.
- **AC8 (NFR2, NFR3, NFR5).** `make lint-dup`, `make lint-metrics`, ESLint, and TS
  all pass with no new suppressions, ignores, or inline code comments. Verified in
  CI.
- **AC9 (NFR6).** Both `sign_up.form.submitting` / `sign_in.form.submitting` and
  the corresponding `submit_button` keys exist and stay in sync across `en.json`
  and `uk.json`; no English string is hard-coded and no JSON edits are required.
  Verified by i18n parity check.
- **AC10 (NFR1).** The auth-page mobile Lighthouse CI score stays at or above the
  ~0.85 gate, with no new heavy dependency on the auth critical path. Verified by CI
  Lighthouse run.
- **AC11 (NFR9).** Integration coverage over `src/**` stays at 100% with new
  loading/idle branches covered for both forms, and Stryker reports **no surviving
  mutant** on the new branches (loading-fill color, `submit_button`-versus-
  `submitting` key selection, and `aria-busy` value). Verified in CI.
- **AC12 (FR7, AR3).** Exactly one polite live region announces the localized
  `submitting` string, rendered as a `UILiveStatus` span with `role="status"`
  (implicit `aria-live="polite"`) plus `aria-atomic="true"`; there is no bare
  `aria-live` span without `role="status"`, and no nested or duplicate live
  regions. Verified by RTL `getByRole('status')` and an axe check showing no
  duplicate live regions (WCAG 4.1.3).
- **AC13 (NFR7, AR5).** The idle / re-enabled submit button presents a distinct
  focus indicator: `:focus-visible` is split out of `:hover` and applies `outline:
'2px solid #404142'` with `outlineOffset: '2px'`, drawn outside the fill and not
  removed by `boxShadow: 'none'`, clearing ≥3:1 against both the `#1EAEFF` /
  `#0399ED` fill and the white page. Verified by unit test on the `:focus-visible`
  style (WCAG 2.4.7, 2.4.11).
- **AC14 (AR5).** After a registration failure, focus lands on a meaningful element
  (the `RegistrationNotificationPanel` heading / error text via `tabIndex={-1}`),
  **not** `<body>`; the existing login `ErrorBanner` focus-move path is preserved.
  Verified by an e2e assertion on the active element after the failed round-trip
  (WCAG 2.4.3).

## Risks & Mitigations

| ID  | Risk                                                                                                                                                                                                 | Mitigation                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | The `&:disabled` grey theme rule bleeds into the loading state, regressing FR4/AR2.                                                                                                                  | Key the loading override on `buttonClasses.loading` (specificity `.MuiButton-contained.MuiButton-loading` beats `.MuiButton-contained:disabled`); add a unit test asserting `#0399ED` while loading (AC3).                                                                                                        |
| R2  | Loading and ordinary validation-disabled states get conflated, weakening the real disabled style.                                                                                                    | Scope the brand-fill override to the loading class only; the plain `:disabled` (invalid) state keeps the existing grey.                                                                                                                                                                                           |
| R3  | Spinner contrast stays below 3:1 if a white stroke is kept on the idle `#1EAEFF` fill (2.46:1) or even the loading `#0399ED` fill (3.10:1, rejected as too marginal for a thin anti-aliased stroke). | FR4/AR2 mandate the `#0399ED` loading fill **and** a dark `#404142` (`customColors.text.primary`) stroke at `thickness={4.5}` / `size={28}`: `#404142` on `#0399ED` is 4.67:1, comfortably clearing 1.4.11; the UX doc records the dark-stroke contrast math. AC3 unit-tests the indicator color and props.       |
| R4  | Forced reduced motion in the visual harness causes snapshot flake from the continuous spin.                                                                                                          | NFR8/AC7: set `animation: none` under `prefers-reduced-motion: reduce`.                                                                                                                                                                                                                                           |
| R5  | Focus loss to `<body>` when the focused button becomes disabled, stranding keyboard/SR users at `<body>` after the error round-trip (AR5).                                                           | The polite live region announces busy state; on the registration error path move focus to the `RegistrationNotificationPanel` heading/error text (`tabIndex={-1}`, focus on mount), and keep the existing login `ErrorBanner` focus-move path per AR5 (AC14); success-path focus belongs to the destination view. |
| R6  | A nameless or mislabeled spinner-only button (WCAG 4.1.2 failure) if children are swapped to empty or to the "submitting" string, or a competing name on the indicator.                              | FR10/FR11/AR1: keep the stable `submit_button` label as children (MUI hides it visually), remove the `getSubmitLabelKey` swap, and drop any `aria-label` on the indicator; AC5 asserts the accessible name equals `submit_button` exactly with no progressbar name.                                               |
| R7  | A second live region, a bare `aria-live` span, or a `role="progressbar"` announcement duplicates or weakens the polite message.                                                                      | FR7/AR3: exactly one polite live region via `UILiveStatus` (`role="status"` + `aria-atomic="true"`); no bare `aria-live` span and no extra progressbar announcement wired (AC12).                                                                                                                                 |
| R8  | Shared style/markup duplicated across the two forms trips jscpd.                                                                                                                                     | Both forms already route through shared `UIForm`/`SubmitControls`; keep the loading logic centralized there (NFR2).                                                                                                                                                                                               |
| R9  | rca file/function thresholds exceeded if loading logic crowds `SubmitControls`/`UIButton`.                                                                                                           | Keep additions small and, if needed, extract a helper into its own file per the per-file function cap (NFR3).                                                                                                                                                                                                     |
| R10 | The `:focus-visible` rule stays collapsed into `:hover` (`#00A3FF`, `boxShadow: 'none'` ⇒ ~1.18:1), leaving the idle/re-enabled button with no visible focus (WCAG 2.4.7/2.4.11).                    | AR5: split `:focus-visible` out of `:hover` and apply `outline: '2px solid #404142'` + `outlineOffset: '2px'` outside the fill (≥3:1 on fill and white page); not removed by `boxShadow: 'none'`. AC13 unit-tests the focus style.                                                                                |

## Success Metrics

- **Layout stability:** zero detached spinner in the DOM during submit; idle-vs-busy
  CLS contribution is 0 for the auth form (FR5, FR8, AC1, AC6).
- **Accessibility:** axe reports no contrast or name/role/value violation on the
  submitting submit button; exactly one polite announcement via `role="status"`;
  button accessible name equals the localized `submit_button` label exactly in both
  states with no progressbar name; the idle/re-enabled button has a distinct ≥3:1
  focus outline; the registration error path moves focus to the notification
  heading/error text rather than stranding at `<body>`, and the login `ErrorBanner`
  focus-move path is preserved (NFR7, AR1-AR5, AC3-AC5, AC12-AC14).
- **Contrast:** white on the idle `#1EAEFF` fill is 2.46:1; the loading fill is
  `#0399ED` and the spinner is drawn in dark `#404142` (`customColors.text.primary`,
  `thickness={4.5}` / `size={28}`) for a 4.67:1 dark-on-`#0399ED` non-text contrast
  that clears 1.4.11; the focus outline (`#404142`) is ~4.67:1 on `#0399ED` and ~9:1
  on white; the label is never white-on-grey (WCAG 1.4.3/1.4.11 pass). The rejected
  white-on-`#0399ED` 3.10:1 option is not the conformance basis.
- **Gate health:** Lighthouse CI ≥ ~0.85, `make lint-dup` / `make lint-metrics` /
  ESLint / TS green with no suppressions, i18n en+uk in sync with no JSON edits,
  100% integration coverage retained, no surviving Stryker mutant on the new
  branches (NFR1-NFR3, NFR5, NFR6, NFR9, AC8-AC11).
- **Scope discipline:** retry button, page skeleton, and switcher are unchanged;
  no L1-L5 loader family reintroduced.
