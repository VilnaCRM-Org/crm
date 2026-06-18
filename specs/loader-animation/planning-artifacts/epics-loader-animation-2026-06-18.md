---
status: 'complete'
workflowType: 'epics'
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

# Epics & Stories - MUI Submit-Button Loader (Issue #48)

**Author:** BMad (Product Manager) **Date:** 2026-06-18 **Source:** VilnaCRM-Org/crm#48

## Overview

This document decomposes the MUI native submit-button loader into one Epic and a
sequence of small, vertically-sliced stories. Each story is sized to stay under
the rca metrics gate (NFR3: ≤10 functions/closures per file, Cyclomatic ≤10,
Cognitive ≤15, ABC ≤17, ≤3 args, ≤3 exit points, function LLOC ≤10) and to land a
shippable slice of behavior with its own tests. Stories are grounded strictly in
the real files confirmed during planning; the deleted L1-L5 loader family is **not**
reintroduced — there is no shared loader component, no `role="progressbar"`
announcement, and no morph/enter-exit motion.

The change is centralized: both auth forms route through shared
`UIForm` → `FormBody` → `SubmitControls`
(`src/components/ui-form/index.tsx`), so the busy behavior is implemented once and
inherited by login and registration. The brand-fill fix is a theme override keyed
on `buttonClasses.loading`; the accessible busy state is `aria-busy` on the
`<form>` plus exactly one polite live region carrying the localized `submitting`
string.

Requirement IDs (FR1-FR10, NFR1-NFR9, AR1-AR6, AC1-AC11) are defined in the PRD
and referenced verbatim here for traceability.

## Epic 1: Native in-button submit loader for the auth forms

**Epic goal.** Replace the detached `size={70}` `CircularProgress` plus grey
disabled button in shared `UIForm` with MUI v7's native
`@mui/material/Button` loading API (`loading` + `loadingPosition="center"` +
`loadingIndicator`), keeping the brand `#1EAEFF`/`#0399ED` contained fill, hiding
the label visually while preserving the accessible name, drawing a conformant
focus indicator, removing the layout shift, and exposing the busy state via
`aria-busy` and a single polite announcement — all within existing repo gates
with no new dependency and no suppressions.

**Epic scope.** The submit button of the login
(`.../auth-forms/login-form.tsx`) and registration
(`.../auth-forms/registration-form.tsx`) forms, both routed through
`UIForm`/`SubmitControls`. Out of scope and unchanged: the retry button
(`registration-error-view.tsx`, `auth.error.tryAgain`), the page-load
`AuthSkeleton`, the login/register switcher, all validation logic, submit
handlers, and the auth store.

**Epic acceptance.** AC1-AC11 are all met; `make lint`, `make lint-dup`,
`make lint-metrics`, unit + integration (100% over `src/**`), visual (the
forced-reduced-motion project plus the non-visual reduced-motion-conditional
assertion), e2e, and the Lighthouse CI gate (~0.85) pass with no new suppressions,
no `data-testid`, and no new inline code comments.

---

### Story 1.1: Brand fill, conformant focus indicator, and reduced-motion guard via theme override

**User story.** As a user submitting an auth form, I want the submit button to
stay brand blue while it works (not turn grey) and to show a clearly visible focus
ring when I tab to it, so the busy state reads as "working", the spinner has enough
contrast to be perceivable, and the keyboard focus is never lost.

**Description.** Three theme fixes land together because they all live in
`src/components/ui-button/theme.ts` and they all touch the same contained-button
rule set:

1. **Loading fill.** The native loading button is natively `disabled`, so the
   existing `MuiButton.styleOverrides.contained['&:disabled']` rule
   (`backgroundColor: paletteColors.background.subtle` `#E1E7EA`,
   `color: background.default` `#FFFFFF`) fires today and renders white-on-grey
   (~1.2:1). Add a loading-scoped override keyed on the imported
   `buttonClasses.loading` so the `.MuiButton-contained.MuiButton-loading` selector
   (two classes) outranks `.MuiButton-contained:disabled` (single pseudo) without
   weakening the ordinary validation-disabled grey. The loading fill becomes the
   darker active brand blue `#0399ED` (`paletteColors.primary.active`). The label
   stays white (`background.default`); the spinner stroke is dark (Story 1.3), so
   the spinner clears 1.4.11 on its own (`#404142` on `#0399ED` = 4.67:1).
2. **Focus indicator (in scope).** Today `:focus-visible` is collapsed into the
   shared `:hover` rule, which shifts to `#00A3FF` with `boxShadow: 'none'` —
   `#00A3FF` on `#1EAEFF` is only ~1.18:1, i.e. effectively no visible focus ring.
   Split `:focus-visible` OUT of the `:hover` rule and give it a distinct,
   conformant indicator: `outline: '2px solid #404142'` + `outlineOffset: '2px'`,
   drawn OUTSIDE the fill so it clears ≥3:1 against BOTH the `#1EAEFF`/`#0399ED`
   fill (`#404142` is ~4.67:1 on `#0399ED`) and the white page (`#404142` is ~9:1
   on white). The outline MUST NOT be cancelled by `boxShadow: 'none'`. This
   feature touches this exact control and asserts NFR7/AR5, so it owns the fix;
   there is no "pre-existing / out of scope" deferral.
3. **Reduced-motion guard.** Add a nested `@media (prefers-reduced-motion: reduce)`
   block under the loading selector that sets `animation: 'none'` on the indicator
   SVG (via the imported `circularProgressClasses.svg`).

Geometry (`57px` radius, padding) is untouched. This story is theme-only: static
object literals, no new function, no consumer wiring yet.

**Acceptance Criteria.**

- Given the auth theme, When the submit button carries `buttonClasses.loading`,
  Then its computed `background-color` is `#0399ED` and its label `color` is
  `#FFFFFF`, Then the `&:disabled` grey rule is overridden by specificity (FR4,
  AR2, AC3).
- Given a form that is invalid (validation-disabled, not loading), When the button
  is rendered, Then it still shows the existing grey `#E1E7EA` (the override is
  scoped to the loading class only) (FR4, R2).
- Given the button receives keyboard focus, When `:focus-visible` is computed, Then
  the rule is distinct from `:hover` and applies `outline: 2px solid #404142` with
  `outlineOffset: 2px`, and `boxShadow: 'none'` does not remove it; the indicator
  clears ≥3:1 against the `#1EAEFF`/`#0399ED` fill and the white page (NFR7, AR5,
  WCAG 2.4.7 Focus Visible, WCAG 2.4.11 Focus Appearance).
- Given `prefers-reduced-motion: reduce`, When the loading indicator renders, Then
  its SVG has `animation: none` (NFR8, AR6, AC7).
- Given the override, When the button geometry is measured, Then `border-radius`
  stays `57px` and no dimension changes (FR8).
- Given the change, When `buttonClasses` / `circularProgressClasses` are
  referenced, Then they are imported (never hardcoded) and no suppression or inline
  comment is added (NFR5, R1).

**Files touched.** `src/components/ui-button/theme.ts`.

**Tests to add/update.** Unit (`tests/unit/components/ui-button.test.tsx` or a new
sibling): render a contained MUI `Button loading` under the theme and assert the
loading-class computed `backgroundColor` is `#0399ED` and label `color` white;
assert the plain `:disabled` (no loading) path keeps `#E1E7EA`; assert
`:focus-visible` is a separate rule that emits `outline: 2px solid #404142` /
`outlineOffset: 2px` and is not erased by `boxShadow: 'none'`; assert the
reduced-motion media rule is **conditional** — `animation: none` is emitted only
under `prefers-reduced-motion: reduce` and is absent without it. Assert exact color
strings (mutation hardening for the fill and focus-outline mutants, AC11/NFR9).

**Dependencies.** None (first story; pure theme).

**Definition of Done.** Theme override merged; unit
color/specificity/focus-visible/reduced-motion assertions green; `make lint-metrics`
(theme.ts has no new function), ESLint, TS pass; no suppression, no `data-testid`,
no inline comment.

---

### Story 1.2: Confirm `UIButton` passes the native loading props through `cloneElement`

**User story.** As a developer wiring the loader, I want `UIButton` to forward the
native `loading`/`loadingPosition`/`loadingIndicator` props unchanged, so the
shared button gains the loading behavior with no new prop or type.

**Description.** `UIButton` (`src/components/ui-button/index.tsx`) wraps MUI
`<Button>` and returns `React.cloneElement(baseButton, rest)`; `UiButtonProps
extends ButtonProps`, and `loading`/`loadingPosition`/`loadingIndicator` are part
of `ButtonProps` in `@mui/material@7.3.x`, so they already flow through `...rest`
into `cloneElement` with **no signature change**. Loading is button-only: the auth
submit control always resolves to the `'button'` branch (no `to`, no `href`), where
`type="submit"` is forwarded; the anchor branch is untouched and is not wired for
loading. This story adds **no production code** — it locks the behavior with a test
so a future refactor of the clone/anchor logic cannot silently drop the props.

**Acceptance Criteria.**

- Given a `UIButton` with `type="submit" loading loadingPosition="center"`, When
  rendered, Then the underlying element has the native `disabled` attribute and the
  MUI loading class is present (props reached the inner `<Button>`) (FR1, FR3).
- Given a `UIButton` with `loadingIndicator={node}` and `loading`, When rendered,
  Then the provided indicator node is in the DOM inside the button (FR2).
- Given a `UIButton` with `to`/`href` (anchor branch), When rendered, Then it
  resolves to an anchor and no loading wiring is applied (documented constraint;
  callers must not combine `to`/`href` with `loading`).

**Files touched.** None in `src/` (behavior confirmed); test file only.

**Tests to add/update.** Unit
(`tests/unit/components/ui-button.test.tsx` / `button.test.tsx`): assert the three
loading props pass through to the inner button; assert the anchor branch is
unaffected. Locate elements via `getByRole` (NFR4).

**Dependencies.** 1.1 (the loading class the test observes is styled there; the
pass-through test can co-assert the fill).

**Definition of Done.** Pass-through tests green; no `UIButton` signature change;
ESLint/TS/metrics pass; no `data-testid`.

---

### Story 1.3: Extract the dark in-button spinner (`SubmitSpinner`)

**User story.** As a user, I want a single centered spinner inside the submit
button while it works, with enough contrast against the blue fill to be clearly
perceivable, so the busy state is visible without any element appearing below the
button.

**Description.** Add a tiny new component file
`src/components/ui-form/submit-spinner.tsx`:
`SubmitSpinner()` returns
`<CircularProgress sx={{ color: customColors.text.primary }} thickness={4.5} size={28} />`.
The stroke color is the dark `#404142` (`customColors.text.primary` — it lives in
`customColors.text`, NOT `paletteColors`), which on the `#0399ED` loading fill from
1.1 measures 4.67:1, comfortably clearing WCAG 1.4.11 (3:1). The spinner MUST NOT
be white and MUST NOT use `color="inherit"`; the white-on-`#0399ED` option (3.10:1)
is rejected as too marginal for a thin anti-aliased stroke. `thickness={4.5}` and
`size={28}` give a prominent ring inside the fixed box without leaving it. The
spinner carries NO accessible name: it does not take a `label`/`aria-label` prop and
does not expose a labelled progressbar — the button's accessible name comes from its
stable `submit_button` children (Story 1.7), and the `submitting` string is used
only by the live region (Story 1.6). The spinner is its own file so
`ui-form/index.tsx` stays under the per-file ≤10 functions/closures cap (NFR3). No
spinner motion override lives here (reduced motion is handled by the theme, 1.1).

The spinner is built to pass 1.4.11 on its own AND is supplementary: busy is also
conveyed by `aria-busy`, the native `disabled` state, the fill shift, and the live
region. Belt-and-suspenders, not "decorative-and-excused."

**Acceptance Criteria.**

- Given `SubmitSpinner`, When rendered, Then exactly one `CircularProgress` exists
  with stroke color `customColors.text.primary` (`#404142`), `thickness=4.5`, and
  `size=28`; it is NOT white and does NOT use `color="inherit"` (FR2, AR2, WCAG
  1.4.11).
- Given the spinner, When its accessibility tree is inspected, Then it exposes no
  accessible name and contributes no separately-named progressbar node (AR1, D4).
- Given the file, When measured by rca, Then it defines a single component
  function under all thresholds (NFR3).

**Files touched.** `src/components/ui-form/submit-spinner.tsx` (new).

**Tests to add/update.** Unit (new
`tests/unit/components/ui-form/submit-spinner.test.tsx`): render and assert one
indicator, the exact stroke `color` `#404142`, `thickness=4.5`, and `size=28`;
assert it is not white / not `color="inherit"`; assert it exposes no accessible
name (queried by role, no `data-testid`). Full coverage of the new file (NFR9).

**Dependencies.** None for rendering; pairs with 1.5 which consumes it.

**Definition of Done.** File added and 100% covered; metrics/ESLint/TS pass; no
suppression/`data-testid`/inline comment.

---

### Story 1.4: Add the single polite live-region primitive (`UILiveStatus`)

**User story.** As a screen-reader user, I want one polite announcement of the
busy state, so I know the form is submitting without a duplicate or competing
message.

**Description.** Add a dependency-free primitive
`src/components/ui-live-status/index.tsx`:
`UILiveStatus({ message }: { message: string })` returns a visually-hidden
`<span role="status" aria-atomic="true">{message}</span>`. `role="status"` carries
the implicit `aria-live="polite"`, so it is the correct WCAG 4.1.3 Status Messages
primitive — do NOT ship a bare `aria-live` span without `role="status"`. It uses
MUI's existing `@mui/utils` `visuallyHidden` style object
(`position: absolute` + `clip`, already a transitive dependency, no new package, no
critical-path weight per NFR1), so the region adds **zero layout box** and cannot
contribute to layout shift (AC6). It is never nested inside another live region.
There is no `role="progressbar"` announcement source. This story adds the primitive
only; `FormBody` wires it in 1.6.

**Acceptance Criteria.**

- Given `UILiveStatus` with a non-empty `message`, When rendered, Then a single
  `role="status"` region (implicit `aria-live="polite"`) with `aria-atomic="true"`
  contains that text (FR7, AR3, WCAG 4.1.3 Status Messages).
- Given `message=''`, When rendered, Then the region is present but empty (so the
  empty→text→empty announcement cycle works) (FR7).
- Given the rendered region, When its computed style is inspected, Then it uses MUI
  `visuallyHidden` (`position: absolute` + `clip`) and therefore occupies no layout
  box (zero layout shift) (AC6, AR3).
- Given the primitive, When checked, Then no `data-testid` and no second live
  region exist; it is dependency-free (NFR1, NFR4, R7).

**Files touched.** `src/components/ui-live-status/index.tsx` (new).

**Tests to add/update.** Unit (new
`tests/unit/components/ui-live-status/index.test.tsx`): assert `role="status"` and
`aria-atomic="true"` (and the implicit polite live region), the `visuallyHidden`
zero-layout style (`position: absolute` + `clip`), and the empty-message branch.
Query by role and text (NFR4). Full coverage (NFR9).

**Dependencies.** None.

**Definition of Done.** Primitive added and 100% covered; metrics/ESLint/TS pass;
no suppression/`data-testid`/inline comment.

---

### Story 1.5: Refactor `SubmitControls` to native loading and remove the detached spinner

**User story.** As a user, I want the busy state shown inside the same submit
button (label hidden, centered spinner) instead of a spinner dropping in below it,
so the form does not shift while submitting.

**Description.** Rewrite `SubmitControls` (`ui-form/index.tsx` lines 101-119): set
`loading={submitting}` (a real boolean so MUI's loading wrapper stays stably mounted
and never reflows — FR8), `loadingPosition="center"`,
`loadingIndicator={<SubmitSpinner />}`, and `disabled={isSubmitDisabled}` (the old
`disabled={submitting || isSubmitDisabled}` OR collapses because `loading` supplies
the native disabled — FR3/FR9). Render `{submitLabel}` as stable children in both
states (MUI hides it visually under `loadingPosition="center"` but keeps it in the
DOM as the accessible name — FR1, FR10, AR1). Delete the detached
`<CircularProgress color="primary" size={70} sx={styles.loader} />` on line 116 and
drop the `CircularProgress` import from `index.tsx`. Remove the
`loader: { display:'block', margin:'1rem auto 0' }` block from `ui-form/styles.ts`
(FR5).

Thread a new **required** `submittingLabel: string` prop through `UIFormProps` →
`FormBodyProps` → `SubmitControlsProps` so the i18n-agnostic `UIForm` stays free of
`mode` knowledge (no hardcoded English — NFR6). `submittingLabel` is REQUIRED (no
default, never `''`); it is consumed only by the live region in `FormBody` (1.6),
not by the spinner. Because the prop is required, this refactor and the consumer
wiring that supplies it (Story 1.7) land in the **same change set** so the tree
never compiles through a nameless-spinner / missing-label state.

**Acceptance Criteria.**

- Given `submitting` is true, When `SubmitControls` renders, Then exactly one
  progress indicator exists and it is inside the button, with the label's
  `visibility: hidden` (label still in DOM) (FR1, FR2, AC1).
- Given the refactor, When the DOM is inspected during submit, Then no
  `CircularProgress` exists outside the button and no `styles.loader` element
  exists (FR5, AC1).
- Given `submitting` is true, When the button is queried, Then it has the native
  `disabled` attribute and its accessible name equals the localized `submit_button`
  label exactly (FR3, FR10, AR1, AC2, AC5).
- Given `submitting` is false, When `SubmitControls` renders, Then `loading` is the
  literal `false` and the button is interactive unless `isSubmitDisabled` (FR8, R2).
- Given the props type, When `submittingLabel` is omitted, Then the build fails
  (the prop is required, no default) (D3).
- Given the file after the rewrite, When measured by rca, Then `SubmitControls`
  stays single-return, ≤3 args (props object), and the file remains ≤10 units
  (NFR3).

**Files touched.** `src/components/ui-form/index.tsx`
(`SubmitControls`, `UIFormProps`/`FormBodyProps`/`SubmitControlsProps`, drop the
`CircularProgress` import), `src/components/ui-form/styles.ts` (remove `loader`).

**Tests to add/update.** Unit (`tests/unit/components/ui-form/index.test.tsx`):
one-in-button-indicator + no-sibling-spinner; native `disabled` while submitting;
stable accessible name equal to `submit_button`. Update any test asserting the old
detached spinner or the `submitting` child text. Exact-string assertions for
mutation hardening (AC11).

**Dependencies.** 1.1 (fill), 1.3 (`SubmitSpinner`); precedes 1.6 (same file); lands
in the same change set as 1.7 (required `submittingLabel`).

**Definition of Done.** `SubmitControls` rewritten; detached spinner and
`styles.loader` removed; unit tests green; metrics/jscpd/ESLint/TS pass; no
suppression/`data-testid`/inline comment.

---

### Story 1.6: `aria-busy` on the form and wire the single live-region announcement

**User story.** As an assistive-technology user, I want the form to expose its busy
state and announce it once, so I'm told the submission is in progress regardless of
where my focus is.

**Description.** In `FormBody` (`ui-form/index.tsx`), add `aria-busy={submitting}`
to the `<form noValidate>` (line 135) so it reads `"true"` while submitting and
`"false"` otherwise (FR6, AR4). Render `<UILiveStatus message={submitting ?
submittingLabel : ''} />` exactly once, as a sibling after `SubmitControls`, so the
localized `submitting` string is announced on the empty→text transition and cleared
on text→empty (FR7, AR3). `submitting` and `submittingLabel` are already in
`FormBody` scope from 1.5 — no extra prop is needed here.

While `ui-form/index.tsx` is open, fix the contradictory `ErrorBanner` politeness:
it currently sets `role="alert"` AND `aria-live="polite"` (contradictory, since
`role="alert"` already implies assertive). Drop the redundant `aria-live="polite"`
and keep `role="alert"` (D7). Busy clears before an error renders, so the busy
region and the `ErrorBanner` never coexist (R7). No `role="progressbar"`
announcement is wired.

**Acceptance Criteria.**

- Given `submitting` is true, When the form is queried, Then `aria-busy="true"`;
  When false, Then `aria-busy="false"` (FR6, AR4, AC4).
- Given `submitting` is true, When the live region is queried, Then exactly one
  `role="status"` region announces the localized `submitting` string and there is
  no second live region for the same event (FR7, AR3, AC5, WCAG 4.1.3).
- Given the `ErrorBanner`, When its attributes are inspected, Then it carries
  `role="alert"` and NO redundant `aria-live="polite"` (D7).
- Given a `jest-axe` run on the submitting form, When evaluated, Then there is no
  duplicate-live-region and no name/role/value violation (AC5, NFR7).

**Files touched.** `src/components/ui-form/index.tsx` (`FormBody`, `ErrorBanner`).

**Tests to add/update.** Unit (`tests/unit/components/ui-form/index.test.tsx`):
`aria-busy` true/false; exactly one `role="status"` region with the localized
string; `ErrorBanner` has `role="alert"` and no `aria-live`; a `jest-axe`
assertion. Both branches exercised (NFR9).

**Dependencies.** 1.4 (`UILiveStatus`), 1.5 (`submittingLabel` thread + same file).

**Definition of Done.** `aria-busy` and one live region wired; `ErrorBanner`
politeness fixed; unit + axe green; metrics/ESLint/TS pass; no
suppression/`data-testid`/inline comment.

---

### Story 1.7: Switch both forms to the stable submit label + `submittingLabel`; remove `getSubmitLabelKey`

**User story.** As a screen-reader user, I want the submit button to keep its real
name ("Sign in" / "Sign Up") while loading instead of changing to "Signing in…", so
the control's accessible name is stable and meaningful.

**Description.** Today the label is computed by `getSubmitLabelKey(mode,
isSubmitting)`
(`src/modules/user/features/auth/utils/get-submit-label-key.ts`), which swaps the
button children from `submit_button` to `submitting` while submitting. Because
`loadingPosition="center"` keeps children in the DOM as the accessible name, that
swap would make the loading name "Signing in…", weakening FR10/AR1. Change both
consumers to pass a **stable** `submitLabel={t('<mode>.form.submit_button')}` and a
new required `submittingLabel={t('<mode>.form.submitting')}` (feeding the live
region only). Login:
`t('sign_in.form.submit_button')` + `t('sign_in.form.submitting')`. Registration
(in `RegistrationFormPanel`): `t('sign_up.form.submit_button')` +
`t('sign_up.form.submitting')`. Remove the now-unused `getSubmitLabelKey` import in
both, then delete `get-submit-label-key.ts` and its unit test.

Because `submittingLabel` is required (1.5), this consumer wiring and the
`SubmitControls` refactor that introduces the prop land in the **same change set**;
the `getSubmitLabelKey` removal happens in the same step so the tree never compiles
through a nameless-spinner state (D3). The two **form test files** currently couple
to the util and must be edited in lockstep or they fail to compile/run:
`tests/.../auth-forms/registration-form.test.tsx` and `login-form.test.tsx` each
`jest.mock('@auth/utils/get-submit-label-key', …)`, and `login-form.test.tsx`
derives its label assertion from that mock's
`${mode}.${isSubmitting ? 'submitting' : 'submit_button'}` return — remove the mock
and switch any label assertion to the stable `submit_button` name. No i18n JSON
changes: all four keys already exist and stay in sync (`sign_up.form.submitting`
"Signing up…"/"Обробка…", `sign_in.form.submitting` "Signing in…"/"Вхід…",
`sign_up.form.submit_button` "Sign Up"/"Реєстрація", `sign_in.form.submit_button`
"Sign in"/"Увійти до облікового запису") — NFR6/AC9.

**Acceptance Criteria.**

- Given either form is loading, When the submit button's accessible name is read,
  Then it equals the localized `submit_button` label exactly (not "contains"), not
  the `submitting` string, in both idle and loading states (FR10, AR1, AC5, D4).
- Given either form, When it renders, Then `submittingLabel` is the localized
  `submitting` string and feeds the live region only (the spinner carries no name)
  (FR7, NFR6, D4).
- Given the codebase after this story, When searched, Then `getSubmitLabelKey`, its
  unit test, and the two form-test `jest.mock` references to it no longer exist and
  nothing imports it (clean removal).
- Given the i18n parity check, When run, Then `submitting` and `submit_button` exist
  and match across `en.json` and `uk.json` with no hardcoded English (NFR6, AC9).

**Files touched.**
`src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx`,
`.../registration-form.tsx`,
`src/modules/user/features/auth/utils/get-submit-label-key.ts` (removed),
`tests/.../auth-forms/registration-form.test.tsx`,
`tests/.../auth-forms/login-form.test.tsx` (remove the `getSubmitLabelKey`
`jest.mock` and switch any label assertion to the stable `submit_button` name),
`tests/.../auth/utils/get-submit-label-key.test.ts` (removed).

**Tests to add/update.** Update login/registration unit tests to drop the
`get-submit-label-key` `jest.mock` import, assert the stable `submit_button` name
exactly while loading, and assert `submittingLabel` is passed; delete the
`get-submit-label-key` unit test. i18n parity check (existing) re-runs green.

**Dependencies.** 1.5 + 1.6 (the required `submittingLabel` prop and live region
must exist before the consumers feed them; lands in the same change set as 1.5).

**Definition of Done.** Both forms pass stable label + `submittingLabel`;
`getSubmitLabelKey` removed with its test and the two form-test mocks; per-form unit
tests green; jscpd (two single-line prop edits stay under the 75-token/5-line floor
— NFR2); metrics/ESLint/TS pass; no suppression/`data-testid`/inline comment.

---

### Story 1.8: Unit + integration test pass: 100% coverage and mutation hardening

**User story.** As a maintainer, I want the loading behavior fully covered with
exact-value assertions for both forms, so coverage stays 100% over `src/**` and
mutants on the fill, focus outline, key choice, and `aria-busy` value are killed.

**Description.** Consolidate and complete the unit/integration suite so every new
branch is exercised for **both** forms: loading vs idle, `aria-busy` true/false,
`submitting ? submittingLabel : ''`, the `#0399ED` loading fill vs the `#E1E7EA`
validation-disabled grey, the `#404142` focus outline vs `:hover`, the `#404142`
spinner stroke, and the stable `submit_button` accessible name while loading. Add
the double-submit assertion: while `submitting`, a second submit attempt does not
re-invoke the handler (FR9). Add a `jest-axe` check confirming no duplicate live
region and no name/role/value violation (AC5). Assertions use exact
strings/attributes (not truthiness) so Stryker mutants on the fill color, the focus
outline, the spinner stroke, the `submit_button` vs `submitting` key, and the
`aria-busy` value are caught (NFR9/AC11). The new `submit-spinner.tsx` and
`ui-live-status/index.tsx` reach 100% via these render paths. No auth-store change,
so the `clearInstances()` spy hazard does not apply.

**Acceptance Criteria.**

- Given the full unit/integration run, When coverage is computed, Then it is 100%
  over `src/**`, including the new files and both new branch pairs (NFR9, AC11).
- Given `submitting` is true, When a second submit fires, Then the submit handler is
  not re-invoked (FR9, AC2).
- Given Stryker runs, When mutants alter the fill color, the focus outline, the
  spinner stroke, the key, or the `aria-busy` value, Then the assertions kill them
  (NFR9, AC11).
- Given the tests, When selectors are reviewed, Then no `data-testid` is used —
  `getByRole`/`getByLabelText`/`getByText` only (NFR4).
- Given the button's accessible name is asserted, When idle and loading, Then it
  EQUALS the localized `submit_button` label exactly and no separately-exposed
  progressbar node contributes a name (AR1, D4).

**Files touched.** `tests/unit/components/ui-form/index.test.tsx`,
`tests/unit/components/ui-button.test.tsx`,
`tests/unit/components/ui-form/submit-spinner.test.tsx`,
`tests/unit/components/ui-live-status/index.test.tsx`, login/registration form unit
tests.

**Tests to add/update.** As above; both forms exercised; double-submit and axe
assertions added.

**Dependencies.** 1.1-1.7 (all production behavior in place).

**Definition of Done.** `make test-unit-all` and integration green at 100% over
`src/**`; Stryker results healthy; no `data-testid`/suppression.

---

### Story 1.9: Visual baseline (forced reduced motion) plus a conditional reduced-motion assertion

**User story.** As a reviewer, I want a visual baseline proving zero layout shift
and the static loading ring under reduced motion, plus a non-visual assertion that
the reduced-motion guard is conditional (not unconditional), so the spin is
suppressed only under `prefers-reduced-motion` and not in general.

**Description.** Two cases, split by what each can actually prove. (1) **Forced
reduced motion (existing harness).** `tests/visual/take-visual-snapshot.ts` already
calls `emulateMedia({ reducedMotion: 'reduce' })`, injects a global
`animation: none !important` init-script style, **and** passes `toHaveScreenshot(…,
{ animations: 'disabled' })`. Those last two each freeze CSS animations at capture
time regardless of `prefers-reduced-motion`, so this helper can only ever snapshot a
frozen frame — a "prove the spinner spins" snapshot through anything resembling it
is not achievable. Use this path for what it is good at: capture idle-vs-submitting
baselines for the auth form and assert identical form height and button box (zero
shift) and the `#0399ED` fill (FR8, AC6, AC7). (2) **Reduced-motion guard is
conditional (non-visual).** Replace the previously-proposed "prove it spins via
snapshot" case with a unit/DOM assertion (covered in 1.1's tests) that the theme's
`@media (prefers-reduced-motion: reduce)` rule emits `animation: none` on the
indicator SVG **only** under reduced motion and is **absent** without it — proving
the guard is conditional rather than blanket, with no dependency on a bespoke
capture path. Reduced motion here is a quality / snapshot-stability / best-practice
requirement (WCAG 2.3.3 is AAA), not an AA gate; do not over-claim it as AA.
Snapshot file names for case (1) follow the existing
`-{projectName}-{platform}` convention so baselines do not collide.

**Acceptance Criteria.**

- Given the forced-reduced-motion harness, When idle and submitting snapshots are
  compared, Then form height and button box are identical (zero shift) and the
  loading fill is `#0399ED` (FR8, AC6).
- Given forced reduced motion, When the loading state is captured, Then the
  indicator is a static ring and the snapshot is stable (no spin flake) (NFR8, AR6,
  AC7, R4).
- Given the reduced-motion guard assertion, When the theme is evaluated, Then
  `animation: none` on the indicator SVG appears only inside the
  `@media (prefers-reduced-motion: reduce)` block and not at the default rule,
  confirming the guard is conditional, not unconditional (NFR8, AR6).

**Files touched.** A new/extended visual spec under `tests/visual/...` for the
zero-shift + `#0399ED` baselines (preserving the existing `-{projectName}-` snapshot
convention); baseline PNGs. The conditional-guard assertion lives in the theme unit
test (Story 1.1) — no new visual project is added for it.

**Tests to add/update.** The forced-reduced-motion visual spec plus committed
baselines, and the conditional reduced-motion theme assertion (shared with 1.1).

**Dependencies.** 1.1, 1.5, 1.6, 1.7 (the loading UI must be final before baselines
are frozen).

**Definition of Done.** `make test-visual` green; baselines committed; zero-shift
and contrast assertions pass; the reduced-motion guard is proven conditional via the
theme unit assertion.

---

### Story 1.10: E2E: in-button busy state, non-interactive button, double-submit, error re-enable, focus

**User story.** As a user, I want submitting to disable the button and show the
in-button loader for the in-flight request, prevent a double submit, re-enable the
button on error, and keep my focus on a meaningful element after a failure, so the
flow is correct and accessible end-to-end.

**Description.** Extend the auth-form e2e specs under
`tests/e2e/modules/user/features/auth/components/form-section/auth-forms/` (which
already contains `registration-form.spec.ts` and shared `utils/`). With Mockoon
driving the API as today: submitting triggers the in-button busy state, the button
is non-interactive (native disabled) for the in-flight request, a second click does
not double-submit (FR9), and on error `submitting` returns to `false` and the button
re-enables per validity. Add equivalent coverage for the login form. Locate elements
by role/label/text (NFR4).

Because the submit button goes natively `disabled` at submit, focus moves to
`<body>`. The two error paths must each land focus on a meaningful element, and this
feature owns that remediation because it creates the `<body>`-focus condition:

- **Login:** the existing `ErrorBanner` focus-return path renders and receives focus
  (AR5) — keep and assert it.
- **Registration:** `registration-form` passes `error={null}`, so the failure swaps
  to `RegistrationNotificationPanel` rather than rendering `ErrorBanner`. The
  notification view MUST receive focus on mount (`tabIndex={-1}` + focus its
  heading/error text). Add an e2e assertion that after a registration failure, focus
  is on a meaningful element — explicitly NOT on `<body>` (AR5, D6, WCAG 2.4.3).

**Acceptance Criteria.**

- Given a valid submit, When the request is in flight, Then the submit button is
  natively `disabled`, shows the in-button loader, and the form reports
  `aria-busy="true"` (FR1, FR3, FR6).
- Given the button is loading, When a second activation is attempted, Then the
  submit handler does not fire again (FR9, AC2).
- Given a login request fails, When the response resolves, Then `aria-busy` returns
  to `"false"`, the button re-enables per validity, and `ErrorBanner` is shown and
  receives focus (AR5).
- Given a registration request fails, When the notification view mounts, Then focus
  moves to a meaningful element (the notification heading/error text) and is NOT on
  `<body>` (AR5, D6).
- Given the specs, When selectors are reviewed, Then no `data-testid` is used
  (NFR4).

**Files touched.** `.../auth-forms/registration-form.spec.ts` and a login spec
(new or extended) plus any shared `utils/`.

**Tests to add/update.** E2E flows above for both forms, including the
registration-failure focus assertion (focus not on `<body>`).

**Dependencies.** 1.1, 1.5, 1.6, 1.7 (final UI behavior); pairs with 1.9.

**Definition of Done.** `make test-e2e` green for both forms; double-submit,
error-re-enable, and registration-error-focus paths covered; no `data-testid`.

---

### Story 1.11: Docs: add the concise Loader note to CLAUDE.md and confirm the full gate sweep

**User story.** As a future contributor, I want a short, accurate note describing
the in-button submit loader and what is intentionally out of scope, so I don't
reintroduce a detached spinner or the deleted loader family.

**Description.** Update the "Important Patterns" → loader note in
`/home/dima/Desktop/crm/CLAUDE.md` to describe the **live** treatment: the auth
submit button uses MUI native `loading` + `loadingPosition="center"`, keeps the
brand contained fill shifting to `#0399ED` while loading (not the grey disabled
state), draws a distinct conformant `:focus-visible` outline, hides the label
visually while preserving the accessible name, renders one dark `#404142` centered
`SubmitSpinner` (thickness 4.5, size 28, 4.67:1 — not white), carries `aria-busy` on
the `<form>`, and announces via one polite `UILiveStatus` (`role="status"`) — with
no `role="progressbar"`, no detached spinner, and no L1-L5 loader family. Rationale
lives here and in the PR (no inline code comments — NFR5). Then run the full gate
sweep: `make format` then `make lint` (ESLint, tsc, `make lint-dup`,
`make lint-metrics`), unit + integration, visual + e2e, and confirm the Lighthouse
CI gate (~0.85) — all green with no suppressions.

**Acceptance Criteria.**

- Given CLAUDE.md, When the loader note is read, Then it accurately describes the
  in-button native loading treatment (dark spinner, focus outline, `role="status"`
  announcement) and the out-of-scope items, and is markdownlint-clean (documentation
  accuracy).
- Given `make lint-dup`, `make lint-metrics`, ESLint, and TS, When run, Then all
  pass with no new suppressions, ignores, or inline code comments (NFR2, NFR3,
  NFR5, AC8).
- Given the Lighthouse CI run, When scored, Then the auth-page mobile score stays
  at/above ~0.85 with no new heavy dependency on the auth critical path (NFR1,
  AC10).

**Files touched.** `/home/dima/Desktop/crm/CLAUDE.md`.

**Tests to add/update.** None (docs); the gate sweep re-runs all suites.

**Dependencies.** 1.1-1.10 (document the finished behavior; sweep verifies the
whole epic).

**Definition of Done.** CLAUDE.md loader note updated and markdownlint-clean; full
gate sweep green (lint, metrics, jscpd, unit, integration 100%, visual, e2e,
mutation, Lighthouse); no suppressions; PR #102 refreshed.

---

## Sequencing & Dependency Summary

Stories are ordered to keep the tree compiling at every step. Because
`submittingLabel` is a **required** prop (D3), Story 1.5 (which introduces it) and
Story 1.7 (which supplies it from both consumers and removes `getSubmitLabelKey`)
land in the **same change set** — the tree never compiles through a missing-label /
nameless-spinner state:

1. **1.1 Theme override** (loading fill + conformant `:focus-visible` outline +
   reduced-motion guard) — foundation, no consumer wiring.
2. **1.2 `UIButton` pass-through** — lock the props flow (test-only; depends on 1.1
   for the observed loading class).
3. **1.3 `SubmitSpinner`** and **1.4 `UILiveStatus`** — independent new primitives,
   parallelizable.
4. **1.5 `SubmitControls` refactor + 1.7 consumers** (single change set) — native
   loading, drop detached spinner + `styles.loader`, thread the required
   `submittingLabel`, switch both forms to the stable label, and remove
   `getSubmitLabelKey` (needs 1.1, 1.3).
5. **1.6 `aria-busy` + live region + `ErrorBanner` politeness** in `FormBody` (needs
   1.4, 1.5; same file as 1.5).
6. **1.8 Unit/integration 100% + mutation** (needs 1.1-1.7).
7. **1.9 Visual baseline + conditional reduced-motion assertion** (needs 1.1, 1.5,
   1.6, 1.7) and **1.10 E2E** (same deps) — parallelizable.
8. **1.11 Docs + full gate sweep** (needs 1.1-1.10).

```text
1.1 ──► 1.2
  └────► 1.5+1.7 ──► 1.6 ──► 1.8 ──► 1.9
1.3 ────►─┘                  └────► 1.10
1.4 ──────────────► 1.6                  └─► 1.11
```

Critical path: 1.1 → (1.5 + 1.7) → 1.6 → 1.8 → (1.9 ‖ 1.10) → 1.11. Stories 1.3,
1.4, and 1.2 feed in early and can be done alongside the critical path.

## Traceability Matrix

Every requirement maps to the stories that satisfy it.

| Req         | Statement (short)                                                     | Stories                  |
| ----------- | --------------------------------------------------------------------- | ------------------------ |
| FR1         | Hide visible label while submitting (visually)                        | 1.2, 1.5, 1.9            |
| FR2         | Centered in-button spinner, none outside                              | 1.2, 1.3, 1.5            |
| FR3         | Disabled / non-interactive while submitting                           | 1.2, 1.5, 1.10           |
| FR4         | Keep brand fill (`#0399ED`), not grey, while loading                  | 1.1, 1.5                 |
| FR5         | Remove detached `size={70}` spinner + `styles.loader`                 | 1.5                      |
| FR6         | `aria-busy` on the `<form>`                                           | 1.6, 1.10                |
| FR7         | Exactly one polite announcement (localized `submitting`)              | 1.4, 1.6, 1.7            |
| FR8         | Zero layout shift idle↔submitting                                     | 1.1, 1.5, 1.9            |
| FR9         | Double-submit guard via native disabled                               | 1.5, 1.8, 1.10           |
| FR10        | Preserve accessible name (stable `submit_button`)                     | 1.5, 1.7, 1.8            |
| NFR1        | Lighthouse ≥ ~0.85, no new heavy dep                                  | 1.4, 1.11                |
| NFR2        | jscpd DRY gate (dedupe, no ignores)                                   | 1.5, 1.7, 1.11           |
| NFR3        | rca metrics gate (per-file caps, complexity)                          | 1.1, 1.3, 1.4, 1.5, 1.11 |
| NFR4        | No `data-testid`; semantic queries                                    | 1.2, 1.3, 1.4, 1.8, 1.10 |
| NFR5        | No suppressions / no inline comments                                  | 1.1, 1.5, 1.7, 1.11      |
| NFR6        | i18n parity en/uk; no hardcoded English                               | 1.7, 1.11                |
| NFR7        | WCAG 1.4.3 / 1.4.11 / 4.1.2 / 4.1.3 / 2.4.7 / 2.4.11                  | 1.1, 1.3, 1.4, 1.6, 1.8  |
| NFR8        | Reduced motion: `animation: none` (quality, not AA)                   | 1.1, 1.9                 |
| NFR9        | 100% integration coverage + mutation health                           | 1.3, 1.4, 1.8            |
| AR1         | Accessible name preserved (stable `submit_button`, no indicator name) | 1.3, 1.5, 1.7            |
| AR2         | Spinner non-text contrast 4.67:1 (`#404142` on `#0399ED`)             | 1.1, 1.3                 |
| AR3         | Single polite live region (`role="status"`, zero layout)              | 1.4, 1.6                 |
| AR4         | Form busy state (`aria-busy`)                                         | 1.6                      |
| AR5         | Focus indicator + error focus + re-enable path                        | 1.1, 1.10                |
| AR6         | Reduced-motion conveyance                                             | 1.1, 1.9                 |
| AC1         | One in-button indicator, no sibling spinner                           | 1.5, 1.8                 |
| AC2         | Native disabled + no double submit                                    | 1.8, 1.10                |
| AC3         | Loading fill `#0399ED`, white label, geometry kept                    | 1.1, 1.9                 |
| AC4         | `aria-busy` true/false                                                | 1.6, 1.8                 |
| AC5         | One polite region + exact accessible name                             | 1.6, 1.7, 1.8            |
| AC6         | No layout shift (visual + CLS)                                        | 1.4, 1.9                 |
| AC7         | Reduced-motion static ring, stable snapshot                           | 1.1, 1.9                 |
| AC8         | Lint-dup / lint-metrics / ESLint / TS, no suppressions                | 1.11                     |
| AC9         | i18n keys exist + in sync en/uk                                       | 1.7, 1.11                |
| AC10        | Lighthouse CI ≥ ~0.85                                                 | 1.11                     |
| AC11        | Integration 100% + mutation healthy                                   | 1.8                      |
| WCAG 2.4.7  | Focus Visible — distinct `:focus-visible` outline                     | 1.1                      |
| WCAG 2.4.11 | Focus Appearance — ≥3:1 focus indicator, not removed                  | 1.1                      |
| WCAG 4.1.3  | Status Messages — `role="status"` busy announcement                   | 1.4, 1.6                 |
