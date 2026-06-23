---
status: 'complete'
workflowType: 'architecture'
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
  - 'src/modules/user/features/auth/i18n/en.json'
  - 'src/modules/user/features/auth/i18n/uk.json'
---

# Architecture - MUI Submit-Button Loader (Issue #48)

**Author:** BMad (Architect) **Date:** 2026-06-18 **Source:** VilnaCRM-Org/crm#48

## Approach Summary

This is a narrow, brownfield UI change that swaps the detached-spinner-plus-grey-button busy
treatment in the shared `UIForm` for MUI v7's **native** `@mui/material/Button` loading API
(`loading` + `loadingPosition="center"` + `loadingIndicator`). All work concentrates in four
existing files plus one tiny new live-region primitive and the four i18n keys already present.
No new dependency lands: `CircularProgress` is already imported on the auth path today
(`src/components/ui-form/index.tsx` line 1), and the native `loading` API ships with the
project's `@mui/material@^7.3.1` (verified against the 7.3.11 docs in MUI_FACTS).

The design is deliberately centralised. Both auth forms (login and registration) already route
through `UIForm` → `FormBody` → `SubmitControls`, so the loading behaviour is implemented **once**
in `SubmitControls`/`FormBody` and inherited by both consumers — this is the jscpd-safe path
(NFR2) and keeps the change off the per-form files except for one stable-label adjustment
(below). There is **no** brand-fill theme override: the native loading button is natively
`disabled`, so it reuses the existing `:disabled` rule and renders the grey `#E1E7EA` pill — which
**matches the Figma design** (node 439:19256). The accessible busy state is carried by `aria-busy`
on the `<form>` (FR6) and exactly one polite live region announcing the localized `submitting`
string (FR7).

One real-file subtlety the PRD/UX assumed but did not name: today the submit label is computed by
`getSubmitLabelKey(mode, isSubmitting)`
(`src/modules/user/features/auth/utils/get-submit-label-key.ts`), which **swaps the button
children** from `submit_button` ("Sign in") to `submitting` ("Signing in…") while submitting.
Because `loadingPosition="center"` keeps the children in the DOM as the accessible name (just
visually hidden), leaving that swap in place would make the loading button's accessible name
"Signing in…" rather than the stable submit label, weakening FR10/AR1. The architecture therefore
moves the `submitting` string out of the button children and into the live region, and feeds the
button a **stable** `submit_button` label in both states (see the file plan and §SubmitControls).

```text
BEFORE (main)                          AFTER (this design)
<form noValidate>                      <form noValidate aria-busy={submitting}>   (FR6)
  …fields…                               …fields…
  <UIButton disabled={submitting||…}>    <UIButton loading={submitting}            (FR1-FR4, FR9)
     {submitting?…submitting:…label}        loadingPosition="center"
  </UIButton>                              loadingIndicator={<CircularProgress…>}>
  {submitting && <CircularProgress         {submitLabel}        (stable, FR10/AR1)
     size=70 sx={styles.loader}/>}       </UIButton>
</form>                                   <UILiveStatus message={busyMessage}/>     (FR7/AR3)
                                       </form>
```

## Component-Level Design

### (a) `UIButton` — pass through `loading` / `loadingPosition` / `loadingIndicator`

`UIButton` (`src/components/ui-button/index.tsx`) wraps MUI `<Button>` in a `<ThemeProvider>` and
returns `React.cloneElement(baseButton, rest)`. The `loading`, `loadingPosition`, and
`loadingIndicator` props are already part of `ButtonProps` in `@mui/material@7.3.x`, and
`UiButtonProps extends ButtonProps`, so they flow through `...rest` into `cloneElement` **with no
signature change** — `UIButton` needs no new prop and no new type. The call site simply passes
them.

How this interacts with `UIButton`'s clone/anchor logic:

- `resolveLinkTarget(to) ?? href` decides `resolvedComponent` (`'a'` vs `'button'`). Loading is a
  **button-only** concern; the auth submit control is always a `<button type="submit">` (no `to`,
  no `href`), so it always resolves to the `'button'` branch where `type` is forwarded and `href`
  is `undefined`. The native `loading` API targets the underlying `ButtonBase`/`<button>` and is
  irrelevant to the anchor branch.
- The architecture does **not** wire loading into the anchor path. There is no auth-path anchor
  that needs a loading state, and MUI's loading wrapper assumes a real button element. The
  constraint is documented, not enforced with new code, to keep `UIButton` minimal (rca NFR3):
  callers that pass `to`/`href` must not also pass `loading`. Both auth forms satisfy this by
  construction.
- `cloneElement` merges `rest` onto `baseButton`; because `baseButton` already carries
  `component`, `href`, and `type`, the loading props arrive purely additive and do not collide.

### (b) `ui-button/theme.ts` — loading reuses the disabled grey `#E1E7EA` + white spinner; label hidden while loading; conformant focus indicator

The native loading button is **natively `disabled`**, so it picks up the contained disabled rule.
Because crm wraps MUI in `StyledEngineProvider injectFirst`, MUI's own `.Mui-disabled` styles are
injected first and a plain `:disabled` override loses on source order — so the disabled rule is
written as **`&&.Mui-disabled`** (`backgroundColor: paletteColors.background.subtle` `#E1E7EA`,
`color: paletteColors.background.default` `#FFFFFF`). This renders the grey `#E1E7EA` pill with a
white label — exactly the desired loading appearance, **matching the Figma design** (node
439:19256). There is **no** loading-scoped fill override (no `buttonClasses.loading` rule, no
`buttonClasses` import): the disabled grey is correct and desired while loading (R1/R2).

While loading the label word must be **removed** (only the spinner shows). MUI hides the
center-loading label via `color: transparent`, but the `&&.Mui-disabled` rule above sets the label
`#FFFFFF`, which would override that and leak the white text. So one extra rule —
**`&&.Mui-disabled.MuiButton-loading { color: 'transparent' }`** — re-hides the label in the loading
state only (the plain disabled state keeps its white label). The white spinner has its own color and
is unaffected.

```ts
import { circularProgressClasses } from '@mui/material/CircularProgress';
// '&&.Mui-disabled' (injectFirst-safe) -> grey #E1E7EA fill + white label.
// '&&.Mui-disabled.MuiButton-loading' -> label color transparent (word hidden while loading).
// No buttonClasses fill override; reduced-motion guard below.
```

- The idle/enabled contained fill remains `#1EAEFF` (`paletteColors.primary.main`); the `:active`
  (pressed) state still uses `#0399ED` (`paletteColors.primary.active`). Both are untouched. The
  plain `:disabled` (invalid form) and the loading state share the one `&&.Mui-disabled` grey rule.
- **Spinner color (AR2/FR4) — white, a design-accepted 1.4.11 deviation.** The loading indicator is
  a `CircularProgress` stroked **white** (`paletteColors.background.default` `#FFFFFF`),
  `thickness={4.5}`, `size={28}` — matching the Figma white-on-grey design. White on `#E1E7EA` is
  **1.26:1**, below the 3:1 non-text-contrast floor; this is a **deliberate deviation accepted by
  the design owner** (a dark `#404142` indicator at 8.12:1 was considered and **not** chosen). The
  busy state is also conveyed by `aria-busy`, the native `disabled` state, the polite live region,
  the spinner's motion, and the removed label — so the deviation is bounded (AR2/AR2b). The focus
  indicator (below) is a separate concern and keeps the dark `#404142` outline.
- **Focus indicator is in scope (NFR7/AR5, WCAG 2.4.7 / 2.4.11).** Today `:focus-visible` is folded
  into the shared `:hover` rule — both collapse to `#00A3FF` with `boxShadow: 'none'`, so a focused
  fill of `#00A3FF` against the idle `#1EAEFF` fill is **1.18:1**, i.e. effectively no visible focus
  ring. This work **splits `:focus-visible` out of the `:hover` rule** and gives it a distinct,
  conformant indicator: `outline: '2px solid #404142'` + `outlineOffset: '2px'`, drawn **outside**
  the fill so it clears ≥3:1 against **both** the grey `#E1E7EA` loading fill (`#404142` ≈ 8.12:1 on
  `#E1E7EA`, inner) **and** the white page (`#404142` ≈ 10.22:1 on white, outer). The indicator must
  **not** be erased by `boxShadow: 'none'`. This feature touches that exact control and asserts
  NFR7/AR5, so it owns the fix — it is no longer deferred as "pre-existing / out of scope".
- Geometry is untouched: `borderRadius: '57px'`, padding, and `styles.submitButton`'s responsive
  width/height are unchanged, so there is zero layout shift (FR8). The focus indicator is drawn
  outside the box via `outline`/`outlineOffset` and so adds no layout box of its own.
- Reduced motion is handled here too: a `@media (prefers-reduced-motion: reduce)` block under the
  disabled/loading selector sets `animation: 'none'` on the indicator's SVG
  (`& .${circularProgressClasses.svg}` via the imported `circularProgressClasses`), giving a static
  ring under reduced motion. This is a quality / snapshot-stability / best-practice measure (the
  WCAG 2.3.3 criterion it relates to is AAA, not an AA gate) (NFR8/AR6 — see Test Strategy).

### (c) `ui-form/index.tsx` `SubmitControls` — drive `loading` from `submitting`, drop the detached spinner

`SubmitControls` (lines 101-119) is rewritten to remove the detached `CircularProgress` and to
drive the button's native loading instead:

```text
<UIButton
  type="submit"
  loading={submitting}
  loadingPosition="center"
  loadingIndicator={<SubmitSpinner />}
  disabled={isSubmitDisabled}
  variant="contained"
  sx={styles.submitButton}
>
  {submitLabel}
</UIButton>
```

- `loading={submitting}` is a real boolean (not `submitting || undefined`) so MUI's loading
  wrapper is stably mounted and toggling busy never reflows (MUI_FACTS / FR8).
- `disabled={isSubmitDisabled}` keeps the **validation**-disabled path (grey) independent of
  loading; the `loading` prop supplies the native `disabled` while busy, so the old
  `disabled={submitting || isSubmitDisabled}` OR collapses to `disabled={isSubmitDisabled}` (FR3,
  R2). Both the validation-disabled and the loading states render the same grey `#E1E7EA` fill,
  which is intended. While `submitting` is true the button is non-interactive and cannot re-fire
  submit (FR9).
- The detached `<CircularProgress color="primary" size={70} sx={styles.loader} />` on line 116 is
  deleted; no spinner renders outside the button (FR5/AC1).
- **Stable accessible name (FR10/AR1):** `submitLabel` passed to `SubmitControls` must be the
  `submit_button` string in **both** states. The two call sites stop calling
  `getSubmitLabelKey(mode, isSubmitting)` and pass `t('<mode>.form.submit_button')` directly. MUI
  hides this label visually under `loadingPosition="center"` but keeps it in the DOM, so the
  accessible name persists. `getSubmitLabelKey` (and its unit test) are removed since its only role
  was the now-undesired swap.
- The custom `loadingIndicator` is a `CircularProgress` stroked **white**
  (`paletteColors.background.default` `#FFFFFF`), `thickness={4.5}`, `size={28}` — matching the
  removed size-70 spinner's prominence inside the fixed box and the Figma white-on-grey design.
  White on `#E1E7EA` is 1.26:1, a deliberate design-owner-accepted 1.4.11 deviation (AR2/AR2b). It
  carries **no** `aria-label`:
  the button's own children supply the accessible name (see precedence note below), so the indicator
  must not place a competing name on the control. It is extracted into its own tiny component file
  (`SubmitSpinner`) to keep `SubmitControls` small and respect the per-file function/closure cap
  (NFR3 — see file plan).
- **`submittingLabel` is a REQUIRED prop, never empty (FR10/AR1).** `busyMessage` is the localized
  `submitting` string. Rather than re-deriving the i18n key inside the shared (i18n-agnostic)
  `UIForm`, the `submitting` string is threaded in as a new **required** `submittingLabel: string`
  prop on `UIFormProps` (mirroring the already-required `submitLabel: string`, which today carries no
  `?`), populated by each auth form. Making it required — not optional with a default, never `''` —
  is deliberate: both auth callers already supply it, and the type system then forbids the case where
  the live-region message would be `''` while `submitting` is true. An optional-with-`undefined`/`''`
  prop is reachable by construction on a shared component and would produce a silent live region
  during a busy state whose visible button label is hidden by `loadingPosition="center"` — exactly
  what FR10/AR1/AR3 prevent. This keeps `UIForm` free of `mode` knowledge and avoids hardcoding any
  English string (NFR6).
- **Accessible-name precedence (WCAG 4.1.2).** The button's accessible name **is** its stable
  localized `submit_button` children in **both** idle and loading states — MUI keeps them in the DOM
  under `loadingPosition="center"`, only `visibility: hidden`. The indicator carries **no**
  `aria-label`, so there is no competing name on the control and no labelled `progressbar` is wired.
  The `submittingLabel` string is used **only** by the live region, never as an indicator name. A
  unit test asserts the button's accessible name **equals** the localized `submit_button` label
  exactly (not "contains") in both states, and that no separately-exposed `progressbar` node
  contributes a name.

### (d) Form-level `aria-busy`

`FormBody`'s `<form noValidate>` (line 135) gains `aria-busy={submitting}` so the busy state is
exposed programmatically (FR6/AR4): `aria-busy="true"` exactly while submitting, `"false"`
otherwise. `submitting` is already in scope in `FormBody` (passed from `UIForm`,
`isSubmitting ?? methods.formState.isSubmitting`, line 169) — no new prop is needed for this.

### (e) Single polite live-region primitive + i18n keys

A small, dependency-free `UILiveStatus` primitive renders the one polite announcement
(FR7/AR3). It is intentionally minimal so it adds no critical-path weight (NFR1) and no second
live region anywhere:

```text
export default function UILiveStatus({ message }: { message: string }): JSX.Element {
  return (
    <span role="status" aria-atomic="true" style={visuallyHidden}>
      {message}
    </span>
  );
}
```

- `role="status"` carries the implicit `aria-live="polite"` (so it is polite, not assertive, and not
  nested in another live region) plus an explicit `aria-atomic="true"`. A bare `aria-live` span
  without `role="status"` is **not** shipped — `role="status"` is the on-point primitive for the
  busy announcement (WCAG 4.1.3 Status Messages). It is rendered **once** per form inside `FormBody`,
  as a sibling after `SubmitControls`. `message` is the localized `submitting` string while
  submitting and `''` otherwise, so the announcement fires once on the empty→text transition and
  clears on text→empty.
- `visuallyHidden` is MUI's existing `@mui/utils` `visuallyHidden` style object (already a
  transitive dependency, no new package) — `position: absolute` + `clip`, so the region adds **zero
  layout box** and contributes no layout shift while it is off-screen but announced; no `data-testid`
  is used (NFR4) — tests query it by `role="status"`/text.
- **Fix `ErrorBanner`'s contradictory dual politeness.** Today `ErrorBanner`
  (`ui-form/index.tsx` line 63) declares **both** `role="alert"` (implicit `aria-live="assertive"`)
  **and** `aria-live="polite"` on the same node — a contradictory dual declaration where assertive
  wins in most engines. This work drops the redundant `aria-live="polite"` and keeps `role="alert"`
  alone (assertive is correct for an error), so the error region declares politeness exactly once.
- **Busy and error are intentionally different politeness levels and cannot fire for the same
  event.** `busy` = `polite` (the `UILiveStatus` region) and `error` = `assertive` (the
  `role="alert"` `ErrorBanner`) are deliberately distinct, and a single submit transition is either a
  success/in-flight event or an error event, never both. This is not asserted as an emergent "never
  coexist" property — it is enforced by deriving the busy message from the same `submitting` state
  that the error path tears down. **Login is the sharp case:** in `login-form.tsx` the `error` string
  is a real prop driven by `useLoginSubmitter`, and `submitting` flips `true → false` in the same
  state update that surfaces the error, so there is no guaranteed intermediate render where
  `submitting` is `false` **and** `error` is still `null`. The ordering guarantee is therefore made
  explicit and concrete: the polite busy region reads `''` in the render where `ErrorBanner` is
  present, because `UILiveStatus`'s `message` is `submitting ? submittingLabel : ''` and `submitting`
  is already `false` in that commit. A unit test on the login error path asserts that, in the render
  where `ErrorBanner` is mounted, the polite `role="status"` busy region's text is `''` — so only one
  announcement fires per transition (`jest-axe` alone cannot catch a sequencing/double-announce
  issue, so this is an explicit text assertion, not just an axe pass).
- No `role="progressbar"` is wired anywhere: the indicator carries no name, the busy announcement
  comes solely from the `role="status"` live region, and no labelled progressbar node is exposed.
- **i18n keys (reused, no new strings):** `sign_up.form.submitting` (`Signing up…` / `Обробка…`),
  `sign_in.form.submitting` (`Signing in…` / `Вхід…`), `sign_up.form.submit_button`
  (`Sign Up` / `Реєстрація`), `sign_in.form.submit_button` (`Sign in` /
  `Увійти до облікового запису`). All four already exist in both `en.json` and `uk.json` and stay
  in sync via the localization generator (NFR6/AC9). No JSON edits are required; the only change is
  **which** key feeds the button (always `submit_button`) versus the live region (`submitting`).

## File-by-File Change Plan

| Path                                                                                      | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui-button/theme.ts`                                                       | Add `import { circularProgressClasses } from '@mui/material/CircularProgress'`. **Do not** add (and remove if present) any `import { buttonClasses }` or `&.${buttonClasses.loading}` fill override — the native `loading` prop disables the button, so the existing `:disabled` rule (grey `#E1E7EA`) is reused as-is (matches Figma node 439:19256). Add only a `@media (prefers-reduced-motion: reduce)` rule under the disabled/loading selector setting `animation: 'none'` on the indicator SVG. The spinner stroke is **white** (`paletteColors.background.default`, `#FFFFFF`) — set in `submit-spinner.tsx`, not here — thickness `4.5`, size `28` (1.26:1 on the grey fill, a design-accepted 1.4.11 deviation; not `color="inherit"`). **Split `:focus-visible` out of the `:hover` rule** and give it a conformant indicator: `outline: '2px solid #404142'` + `outlineOffset: '2px'`, drawn outside the fill (≥3:1 on the grey `#E1E7EA` fill and the white page), and not erased by `boxShadow: 'none'` (NFR7/AR5). No change to `:disabled` fill; `:active` stays `#0399ED`; idle stays `#1EAEFF`. |
| `src/components/ui-button/index.tsx`                                                      | No signature change. Confirm `loading`/`loadingPosition`/`loadingIndicator` flow through `...rest` into `cloneElement`; loading stays button-only (anchor branch untouched).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/components/ui-form/index.tsx`                                                        | `SubmitControls`: remove detached `<CircularProgress size={70}>`; set `loading={submitting}`, `loadingPosition="center"`, `loadingIndicator={<SubmitSpinner/>}`, `disabled={isSubmitDisabled}`; render `{submitLabel}` (stable, the sole accessible name). `FormBody`: add `aria-busy={submitting}` to `<form>` and render `<UILiveStatus message={submitting ? submittingLabel : ''} />` once after `SubmitControls`. `ErrorBanner`: drop the redundant `aria-live="polite"`, keep `role="alert"` alone (assertive, declared once). Thread `submittingLabel` through `UIFormProps`/`FormBodyProps`/`SubmitControlsProps` as a **required** `submittingLabel: string` (mirroring the already-required `submitLabel: string`; do **not** declare it optional with a default — required forbids the empty/silent live-region state). Drop the `CircularProgress` import.                                                                                                                                                                                                                                            |
| `src/components/ui-form/submit-spinner.tsx`                                               | **New.** `SubmitSpinner()` → `<CircularProgress thickness={4.5} size={28} sx={{ color: paletteColors.background.default }} />` — white stroke (1.26:1 on the grey `#E1E7EA` fill, a design-accepted 1.4.11 deviation), **no** `aria-label` (the button children are the accessible name; no competing name on the indicator). Own file to respect the ≤10 functions/closures-per-file cap (NFR3).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `src/components/ui-form/styles.ts`                                                        | Remove the `loader: { display: 'block', margin: '1rem auto 0' }` block (FR5). `submitButton` geometry unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/components/ui-live-status/index.tsx`                                                 | **New.** `UILiveStatus` polite live-region primitive — `<span role="status" aria-atomic="true">` (implicit `aria-live="polite"`), visually hidden via MUI `visuallyHidden` (`position: absolute` + `clip`, zero layout box). Dependency-free.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx`        | `submitLabel={t('sign_in.form.submit_button')}` (stable); add `submittingLabel={t('sign_in.form.submitting')}`. Drop `getSubmitLabelKey` import/usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx` | `submitLabel={t('sign_up.form.submit_button')}` (stable) on `UIForm` in `RegistrationFormPanel`; add `submittingLabel={t('sign_up.form.submitting')}`. Drop `getSubmitLabelKey` import/usage.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/modules/user/features/auth/utils/get-submit-label-key.ts`                            | **Remove.** Its only purpose was swapping children to `submitting`, which now breaks the stable accessible name (FR10/AR1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/modules/user/features/auth/i18n/{en,uk}.json`                                        | No change. The four reused keys already exist and stay in sync (NFR6).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Gate-Compliance Notes

- **rca per-file function/closure cap (NFR3).** `ui-form/index.tsx` already defines several
  component functions (`ErrorBanner`, `FormHeader`, `buildSubmitHandler`, `SubmitControls`,
  `FormBody`, `UIForm`). The new spinner and live-region units therefore get **their own files**
  (`submit-spinner.tsx`, `ui-live-status/index.tsx`) rather than crowding `index.tsx` toward the
  10-unit limit. `SubmitControls` stays small (single return, ≤3 args via its props object,
  Cyclomatic/Cognitive/ABC well under limits); `theme.ts` additions are static object literals
  (no new functions). File LLOC/PLOC/SLOC stay far under the file caps.
- **jscpd DRY (NFR2).** The loading logic lives once in shared `SubmitControls`/`FormBody`; both
  forms inherit it. The two per-form edits are single-line prop changes (`submitLabel` /
  `submittingLabel`) — well under the 75-token / 5-line clone floor and not near-identical blocks.
  No copy-paste of markup or style; dedupe by centralization, never by ignore directives.
- **No new heavy import (NFR1).** `CircularProgress` is already on the auth path
  (`ui-form/index.tsx`); the native `loading` API is part of the already-bundled `@mui/material`
  Button. `circularProgressClasses` / `visuallyHidden` are zero-runtime imports from packages
  already present. The auth-page mobile Lighthouse CI score stays at/above the ~0.85 gate (AC10).
- **No `data-testid` (NFR4).** Source ships none. Tests locate the button via `getByRole('button',
{ name })`, the live region via its text/role, and the form via `getByRole('form')` or container
  `aria-busy`. A stable `id` is only a last resort and is not introduced here.
- **No suppressions / no inline comments (NFR5).** The grey loading fill is the native disabled
  state (no override needed); the stable-name fix is a prop change; the live region is a primitive.
  No `eslint-disable`, `@ts-ignore`, or equivalent, and no new inline code comments — rationale lives
  in this doc and the PR.

## Test Strategy

- **Unit (Jest, jsdom).** Extend `tests/unit/components/ui-form/index.test.tsx` and
  `tests/unit/components/ui-button.test.tsx`:
  - AC1: while submitting, exactly one progress indicator exists and it is **inside** the button;
    no sibling `CircularProgress` and no `styles.loader` element (FR1/FR2/FR5).
  - AC2/AC9-double-submit: the submitting button has the native `disabled` attribute and a second
    submit attempt does not re-invoke the handler (FR3/FR9).
  - AC3: the loading button's computed background is the native disabled grey `#E1E7EA`
    (`paletteColors.background.subtle`, matching Figma — the same as the validation-disabled state,
    with no loading-fill override) and the spinner stroke is white (`paletteColors.background.default`,
    `#FFFFFF`, 1.26:1 on the grey fill — a design-accepted 1.4.11 deviation), `thickness={4.5}`,
    `size={28}`; geometry (57px radius)
    unchanged (FR4/AR2). Asserted via the `:disabled` rule / class presence; assert that **no**
    `buttonClasses.loading` fill override exists.
  - AC3-focus (NFR7/AR5): assert `:focus-visible` is split out of `:hover` and resolves to
    `outline: 2px solid #404142` + `outlineOffset: 2px`, not `boxShadow: 'none'` and not the old
    `#00A3FF` collapse. A focus-indicator contrast assertion confirms `#404142` clears ≥3:1 against
    both the grey `#E1E7EA` fill (8.12:1, inner) and the white page (10.22:1, outer)
    (WCAG 2.4.7 / 2.4.11).
  - AC4: `<form>` exposes `aria-busy="true"` while submitting and `"false"` otherwise (FR6/AR4).
  - AC5: exactly one `role="status"` live region (implicit polite, `aria-atomic="true"`) announces
    the localized `submitting` string; the button's accessible name **equals** the localized
    `submit_button` label exactly (not "contains") in **both** idle and loading states; the loading
    indicator carries **no** competing name and **no** separately-exposed `progressbar` node
    contributes a name (FR7/FR10/AR1/AR3) — queried by `getByRole`/`getByText`, no `data-testid`
    (NFR4). An `axe`/`jest-axe` assertion confirms no name/role/value violation, and WCAG 4.1.3
    status-message conformance.
  - AC5-sequencing (login error path): assert `ErrorBanner` declares politeness once
    (`role="alert"`, no `aria-live="polite"`), and that in the render where `ErrorBanner` is present
    the `role="status"` busy region's text is `''` — so the polite busy and assertive error regions
    never announce for the same transition. `jest-axe` alone cannot catch a double-announce, so this
    is an explicit text assertion driven by the shared `submitting` state.
  - Both forms exercised (login + registration) so loading/idle branches are covered for each.
  - Remove `get-submit-label-key` unit test alongside the util; assert each form now passes a
    stable `submit_button` label.
- **Integration coverage (100% over `src/**`, NFR9/AC11).** The new `submit-spinner.tsx`and`ui-live-status/index.tsx`are tiny and fully covered by the rendering paths above; the new
loading/idle and`aria-busy`true/false branches in`SubmitControls`/`FormBody`are each hit.
Per the team's DI/coverage gotcha, the auth store is unaffected (no store change), so no`clearInstances()` spy hazard applies here.
- **Reduced-motion guard verification (where it lives).** The guard's correctness is **not** proven
  by the forced-reduced-motion visual snapshot. `tests/visual/take-visual-snapshot.ts` does two
  things: it emulates `reducedMotion: 'reduce'` **and** injects a global
  `*, *::before, *::after { animation: none !important }` reset (the `__pw-disable-animations` init
  script) plus `animations: 'disabled'` on `toHaveScreenshot`. That global `!important` reset
  dominates and would render a static spinner **even if the theme's media-query guard were missing**,
  so the forced-reduced-motion snapshot can only verify **layout stability** (zero shift), not the
  `@media (prefers-reduced-motion: reduce)` rule. The guard is therefore proven by two other checks:
  (a) the non-reduced-motion visual project below, which shows motion is present when not suppressed,
  and (b) the authoritative **unit/CSS assertion** that the `@media (prefers-reduced-motion: reduce)`
  rule sets `animation: none` on the indicator SVG (`circularProgressClasses.svg`) — this is the
  guard test, not the snapshot.
- **Playwright visual.** Two cases:
  1. **Forced reduced motion (existing harness).** `tests/visual/take-visual-snapshot.ts` already
     calls `emulateMedia({ reducedMotion: 'reduce' })` and injects the global `animation: none`
     reset, so the loading state snapshots deterministically — idle vs submitting must show identical
     form height and button box (zero shift, AC6). This case verifies layout stability **only**; per
     the note above it does **not** verify the reduced-motion media-query guard, so AC7's guard claim
     rests on the unit/CSS assertion, not this snapshot.
  2. **Non-reduced-motion case.** A separate spec/project that does **not** rely on the global
     animation reset, emulating `reducedMotion: 'no-preference'`, freezing the spinner at a fixed
     frame (or masking the indicator) to assert the spinning indicator renders inside the button with
     the grey `#E1E7EA` disabled fill — demonstrating motion is present when not suppressed, i.e. the
     guard is conditional, not unconditional.
- **E2E (Playwright).** Extend the auth-form specs under
  `tests/e2e/modules/user/features/auth/...`: submit triggers the in-button busy state, the button
  is non-interactive (native disabled) for the in-flight request, a second click does not double
  submit (FR9), and on error the button re-enables with `ErrorBanner` shown (AR5 focus path).
  Because the button goes natively `disabled` at submit, focus lands on `<body>`; assert the
  remediation: on the **registration** error path (which swaps to `RegistrationNotificationPanel`,
  since `registration-form` passes `error={null}`), focus moves to a meaningful element — the
  notification view's heading/error text via `tabIndex={-1}` — **not** `<body>` (AR5, Story 1.10).
  Keep the existing login `ErrorBanner` focus-move path. Mockoon drives the API as today.
- **Mutation (Stryker).** New branches (`loading` true/false, `aria-busy` true/false,
  `submitting ? submittingLabel : ''`) and the reused disabled-grey loading state must be killed by
  the unit assertions above (AC11) — assert exact strings/attributes, not mere truthiness, so mutants
  on the fill color (`#E1E7EA`), the `submit_button` vs `submitting` key, and the `aria-busy` value
  are caught.

## Rollout / Sequencing

1. Theme first: confirm the native `loading` prop reuses the existing `:disabled` grey `#E1E7EA`
   (no override; matches Figma node 439:19256) with the white spinner, add the
   reduced-motion guard, and **split `:focus-visible` out of `:hover`** with the conformant `#404142`
   outline/offset in `ui-button/theme.ts`; confirm `UIButton` passes loading props through `...rest`
   (no signature change).
2. New primitives: add `submit-spinner.tsx` and `ui-live-status/index.tsx`.
3. Shared form: rewrite `SubmitControls` (native loading, drop detached spinner, stable
   `submitLabel`, `submittingLabel` prop), add `aria-busy` + `UILiveStatus` in `FormBody`, thread
   the new prop through `UIFormProps`/`FormBodyProps`/`SubmitControlsProps`; remove `styles.loader`.
4. Consumers: switch both forms to the stable `submit_button` label + `submittingLabel`; delete
   `get-submit-label-key.ts` and its test.
5. Registration-error focus remediation (AR5/D6): because the button goes natively `disabled` at
   submit, focus lands on `<body>`; on the registration error path, give
   `RegistrationNotificationPanel` `tabIndex={-1}` and focus its heading/error text on mount so focus
   is never stranded on `<body>`. This feature creates the `<body>`-focus condition, so it owns the
   one-component remediation. Keep the existing login `ErrorBanner` focus-move path.
6. Tests: unit + axe (including the focus-indicator contrast assertion), then the two visual cases
   and e2e (including the registration-error focus assertion).
7. Run `make format` then `make lint` (eslint, tsc, `make lint-dup`, `make lint-metrics`), unit and
   integration suites, visual/e2e, and confirm the Lighthouse CI gate — all green with no
   suppressions before opening/refreshing PR #102.

This sequence is internally consistent because `submittingLabel` is a **required** prop (see §(c)):
adding a required prop to `UIFormProps` in step 3 makes the consumers fail to type-check until they
supply it, so steps 3 and 4 are landed in the **same** change set — the shared-form prop threading
and both consumer updates ship together rather than relying on a default to keep the tree compiling
between them. (The only auth callers of `UIForm` are the two auth forms, both updated in step 4, so
no unedited consumer is left without the prop.) The label/util change in step 4 is otherwise isolated
to those two consumers.

## Out-of-Scope Confirmation

Unchanged by this work: the retry button (`registration-error-view.tsx`, `auth.error.tryAgain`),
the page-load `AuthSkeleton`, the login/register switcher, all form validation logic, submit
handlers, and the auth store. The plain validation-disabled state keeps its pre-existing white-on-grey
label (`#E1E7EA` fill, white label, ~1.26:1) — that disabled-label contrast is **explicitly out of
scope** for this change and is **not** "fixed" here (in the loading state the label is hidden by
`loadingPosition="center"`, so it does not apply to the busy state). **One in-scope exception
(AR5/D6):** because this feature makes the submit button go natively `disabled` (stranding focus on
`<body>`), the registration notification view (`RegistrationNotificationPanel`) receives a
focus-on-mount fix (`tabIndex={-1}` + focus its heading/error text); this feature owns that
remediation since it creates the `<body>`-focus condition. No migration to `@mui/lab`
`LoadingButton`. No new dependency. The previously deleted L1-L5 loader family is **not**
reintroduced — there is no shared loader component, no `role="progressbar"` wired anywhere, and no
morph/enter-exit motion. `UIButton`'s new loading props are additive and idle by default, so non-auth
`UIButton` callers are untouched. The only auth callers of `UIForm` are the two auth forms (both
updated here), so the new **required** `submittingLabel` prop adds no obligation to any other
consumer.
