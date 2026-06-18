---
status: 'complete'
workflowType: 'ux-design'
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

# UX Design - MUI Submit-Button Loader (Issue #48)

**Author:** BMad (UX Designer) **Date:** 2026-06-18 **Source:** VilnaCRM-Org/crm#48

## Purpose & Scope

This document specifies the interaction and visual design for the auth submit
button's busy state, replacing the detached `size={70}` `CircularProgress` plus
grey disabled button with MUI v7's native in-button loading treatment. It builds
on the PRD's requirements (FR1-FR10, NFR1-NFR9, AR1-AR6) and resolves the open
design decisions the PRD delegated here: the spinner contrast choice (AR2),
measured on the native grey `#E1E7EA` disabled fill the loading button adopts,
the focus indicator (NFR7/AR5), the motion and reduced-motion behavior
(NFR8/AR6), the bilingual announcement copy (NFR6/AR3), and the focus model
(AR5). Scope is the **submit button** of the login and registration forms, both
routed through shared `UIForm` → `SubmitControls`
(`src/components/ui-form/index.tsx`). The retry button, page `AuthSkeleton`, and
login/register switcher are out of scope and unchanged.

## Interaction Model & State Machine

The submit button is one element across all states. Only the busy presentation
changes; geometry, accessible name, and DOM children are constant (FR8, FR10).

### States

| State                | Trigger                                                  | Visual                                                            | Interactive            | a11y exposure                                           |
| -------------------- | -------------------------------------------------------- | ----------------------------------------------------------------- | ---------------------- | ------------------------------------------------------- |
| idle                 | Form valid-or-untouched, not submitting                  | `#1EAEFF` fill, white label, 57px radius                          | Yes                    | name = submit label                                     |
| hover                | Pointer over idle button                                 | `#00A3FF` fill (`primary.hover`)                                  | Yes                    | name = submit label                                     |
| focus-visible        | Keyboard focus on idle button                            | `#1EAEFF` fill + `2px solid #404142` outline, `2px` offset        | Yes                    | name = submit label                                     |
| active               | Pressed (pointer/keyboard) on idle button                | `#0399ED` fill (`primary.active`)                                 | Yes                    | name = submit label                                     |
| loading              | `submitting === true`                                    | `#E1E7EA` grey disabled fill, label removed, white spinner        | No (native disabled)   | name = submit label; `aria-busy` form                   |
| disabled-not-loading | `isSubmitDisabled === true`, not submitting              | `#E1E7EA` grey fill, white label                                  | No                     | name = submit label, native `disabled`                  |
| error (login)        | Login submit failed; `submitting` back to `false`        | Returns to idle/disabled per validity; `ErrorBanner` shows        | Per validity           | error banner is the error channel                       |
| error (registration) | Registration submit failed; `submitting` back to `false` | Form view swaps to notification view; `ErrorBanner` never renders | n/a (button unmounted) | notification view receives focus + is the error channel |

The loading and disabled-not-loading states share the **same** native grey
`#E1E7EA` fill: the `loading` prop natively `disabled`s the button, so it
inherits the existing `&&.Mui-disabled` rule (FR4; `StyledEngineProvider
injectFirst` requires the doubled class selector) — this matches the Figma design
(node 439:19256, a grey `#E1E7EA` pill). The button color does change between
idle (`#1EAEFF`) and loading (grey `#E1E7EA`), and that greying is correct and
desired. There is no custom loading-fill override; the loading state visually
matches the validation-disabled state by design, and the white spinner plus the
removed label (the loading-state label color is `transparent`) distinguish the
busy intent.

### State transition sketch

```text
        focus/hover                 press
 idle ───────────────► hover ───────────────► active
  ▲  ▲                                          │
  │  │            submit handler fires          │
  │  └──────────────────────────────────────────┘
  │                     │
  │           submitting = true (FR3)
  │                     ▼
  │                  loading ──────────── request resolves
  │                     │                        │
  │       success ◄─────┴─────► error            │
  │   (success view)         (error channel,     │
  │                           submitting=false) ──┘
  │                     │
  └─────────────────────┘   (button re-enabled per form validity, login only)

 isSubmitDisabled = true  ──►  disabled-not-loading  (grey, separate path)
```

`submitting` is derived once in `UIForm`: `isSubmitting ?? methods.formState.isSubmitting`
(`index.tsx` line 169). The loading state owns the busy presentation; the error
channel differs per form (see Error case below).

## Visual Spec of the Loading State

### Geometry parity / zero layout shift (FR8)

The button keeps its full `styles.submitButton` box in every state: `width: 100%`,
`height: 3.125rem` (mobile) → `4.375rem` (md+), responsive `minWidth`
(`19.6875rem` @375, `33.75rem` @md, `26.375rem` @lg), `borderRadius: 57px`,
`boxShadow: none`. MUI's `loadingPosition="center"` overlays the spinner and sets
the children to `visibility: hidden` inside the existing box — nothing is added
below the button. Passing a real boolean `loading={submitting}` keeps MUI's
loading wrapper stably mounted so toggling busy never reflows (per MUI guidance
for v7.3.x). The detached spinner and `styles.loader` are removed (FR5).

```text
IDLE                          LOADING (center)
┌────────────────────────┐    ┌────────────────────────┐
│       Sign Up          │    │          ◠             │   ← spinner overlay
└────────────────────────┘    └────────────────────────┘
   #1EAEFF, label shown          #E1E7EA grey, label visibility:hidden
   (same box, same radius)       (same box, same radius — no shift)

BEFORE (main, rejected)
┌────────────────────────┐
│       Sign Up          │  ← greyed #E1E7EA, white label 1.26:1
└────────────────────────┘
          ◯  (size=70)      ← detached spinner BELOW → layout shift
```

### Label hide mechanic (FR1, FR10)

The localized label stays as the button's children at all times; MUI hides it
visually via the loading wrapper (`visibility: hidden`). The label is never
swapped to an empty node, so the accessible name persists (AR1). This is the
single source of the accessible name; no separate `aria-label` is required on
the button, and none is placed on the spinner indicator (see announcement
section).

### Spinner size / stroke / color (FR2, AR2)

| Property    | Value                                              | Rationale                                                                                                                                                                  |
| ----------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Component   | `CircularProgress` (already on auth path)          | No new dependency (NFR1)                                                                                                                                                   |
| `size`      | `28`                                               | Prominent inside the 50/70px button, replacing the old size-70 presence without leaving the box                                                                            |
| `color`     | white `paletteColors.background.default` `#FFFFFF` | Matches the Figma design (node 439:19256): a white indicator on the grey disabled pill, consistent with the button's white-on-grey disabled treatment (see decision below) |
| `thickness` | `4.5` (override MUI default `3.6`)                 | A thicker stroke makes the white ring more legible on the grey fill                                                                                                        |
| position    | `loadingPosition="center"`                         | Centered overlay, hides label                                                                                                                                              |

## The Spinner Contrast Decision

**Decision (design owner): the loading button uses the native grey `#E1E7EA`
(`paletteColors.background.subtle`) disabled fill — matching the Figma design
(node 439:19256) — with a WHITE spinner (`#FFFFFF`, `paletteColors.background.default`)
and the white submit label, exactly like the approved disabled-button design.**
This keeps the busy state visually identical to the rest of the auth button's
white-on-grey disabled treatment rather than introducing a contrasting dark
indicator. No theme fill override is added: the `loading` prop natively
`disabled`s the button, so it uses the existing `&&.Mui-disabled` grey rule
(`StyledEngineProvider injectFirst` requires the doubled class selector). The
label is set to `transparent` only in the loading state
(`&&.Mui-disabled.MuiButton-loading`) so the word is removed while the white
spinner shows; the spinner keeps its own `#FFFFFF` color.

### Contrast: a deliberate, design-owner-accepted deviation

White `#FFFFFF` on the grey `#E1E7EA` fill is **1.26:1**, below the WCAG 1.4.11
(non-text contrast) 3:1 floor for a meaningful graphical object. This is an
**accepted deviation**, decided by the design owner, to match the approved Figma
design. A dark `#404142` indicator (which would measure 8.12:1 and clear 1.4.11)
was considered and explicitly **not** chosen — the design calls for the plain
white-on-grey disabled look.

The deviation is bounded because the busy state does **not** rely on the
spinner's static contrast alone. It is also conveyed by:

- `aria-busy="true"` on the `<form>` (AR4),
- the native `disabled` attribute on the button (FR3),
- one polite `role="status"` live region announcing the localized `submitting`
  string (AR3),
- the spinner's **motion** (a moving indicator reads as "working" independent of
  its static contrast),
- the label being **removed** (the button visibly changes from its label to a
  spinner).

This is the accepted tradeoff: visual fidelity to the design over the 1.4.11
guideline for the decorative spinner, with the busy state still fully exposed
programmatically and through motion. The focus indicator (a separate concern)
remains the dark `#404142` outline, which clears 3:1 — see the focus section.

### Resulting contrast budget

```text
spinner / fill contrast budget
white ring on #E1E7EA (grey load)  = 1.26 : 1   below 3:1 — design-accepted deviation (see above)
white label on #E1E7EA (grey)      = 1.26 : 1   shown when disabled; hidden while loading (transparent)
focus outline #404142 on #E1E7EA   = 8.12 : 1   ✓ 1.4.11 (focus indicator, unchanged)
```

The spinner ships **white** (matching the design) at `1.26:1` on the `#E1E7EA`
grey fill — a deliberate, design-owner-accepted 1.4.11 deviation, with the busy
state carried by `aria-busy`, the disabled state, the live region, and the
spinner's motion. The plain validation-disabled state keeps the pre-existing
`1.26:1` white label (label visible), which is **out of scope** for this change.

## Focus Indicator (In Scope) — 2.4.7 / 2.4.11

The current contained-button theme does **not** provide a conformant focus
indicator, and this feature **owns the fix** (NFR7, AR5): it touches this exact
control and asserts a visible-focus requirement, so the defect is in scope here,
not deferred.

### The defect this replaces

In `src/components/ui-button/theme.ts` the contained variant folds focus into the
hover rule:

```ts
'&:hover, &:focus-visible': {
  backgroundColor: paletteColors.primary.hover, // #00A3FF
  boxShadow: 'none',
},
```

`:focus-visible` shares the `:hover` rule and only shifts the fill from `#1EAEFF`
to the near-identical hover blue `#00A3FF` — a shift measuring just **1.18:1**
between the two states — with `boxShadow` explicitly removed. There is no
outline, ring, or shape change, so keyboard focus is visually indistinguishable
from pointer hover. A `1.18:1` background-color shift between two similar blues is
effectively **no focus ring**: it does not satisfy **2.4.7 Focus Visible** and
does not meet **2.4.11 Focus Appearance** (2.2 AA) minimum-area/contrast
requirements.

### The conformant indicator (in scope)

Split `:focus-visible` **out** of the shared `:hover` rule and give it a
distinct, conformant indicator:

```ts
'&:hover': {
  backgroundColor: paletteColors.primary.hover, // #00A3FF
  boxShadow: 'none',
},
'&:focus-visible': {
  outline: '2px solid #404142',
  outlineOffset: '2px',
},
```

The `2px solid #404142` outline is drawn **outside** the fill (`outlineOffset:
'2px'`), so it clears ≥3:1 against **both** the button fill and the white page:
`#404142` is **4.17:1** on the idle `#1EAEFF` fill (and **8.12:1** on the grey
`#E1E7EA` loading/disabled fill) and **10.22:1** on white. Because it is an
`outline` (not a `boxShadow`), it is **not** removed by any `boxShadow: 'none'`
rule. This satisfies 2.4.7 (a clearly visible focus state) and 2.4.11 (sufficient
area and contrast of the focus indicator) for the submit button.

This replaces the prior "pre-existing defect, track separately" framing: the
loader diff edits this rule, asserts NFR7/AR5, and therefore lands the fix.

## Motion Spec & Reduced Motion

### Default motion

`CircularProgress` indeterminate variant runs its continuous MUI rotate
keyframes. No custom duration or easing is introduced; the stock spin is the
busy motion. The button fill changes from idle `#1EAEFF` to the native grey
`#E1E7EA` disabled fill when loading begins, but this is the existing instant
`:disabled` swap — no custom fill-transition, enter/exit morph, or timing is
introduced, consistent with the PRD's narrow, no-loader-family scope.

### prefers-reduced-motion (NFR8, AR6)

Reduced-motion handling here is a **quality / snapshot-stability / best-practice**
requirement, **not** an AA conformance gate — WCAG 2.3.3 Animation from
Interactions is AAA, and a continuously rotating spinner is not a 2.3.1
flashing/seizure hazard. We do not over-claim `animation: none` as an AA
obligation; it is shipped because it is the right quality bar and it stabilizes
the forced-reduced-motion visual snapshots (risk R4).

MUI's `CircularProgress` has no built-in reduced-motion guard, and the
visual/e2e harness forces reduced motion
(`tests/visual/take-visual-snapshot.ts` → `emulateMedia({ reducedMotion: 'reduce' })`).
Under `@media (prefers-reduced-motion: reduce)` the indicator's spin is
suppressed with `animation: none` on the spinner SVG, leaving a static partial
ring. The unit assertion is that `animation: none` appears **only inside** the
`prefers-reduced-motion: reduce` media query (never unconditionally). The busy
state is still fully conveyed by `aria-busy` (AR4), the native `disabled`
attribute (FR3), the white spinner, and the polite live region (AR3) — so
suppressing the spin loses no information.

```text
prefers-reduced-motion: no-preference   →  spinner rotates (MUI keyframes)
prefers-reduced-motion: reduce          →  animation: none (static ring)
                                            state still announced + aria-busy + disabled + white spinner
```

## Accessible Announcement Copy & Live-Region Semantics

### Reused keys (NFR6, AR3)

No new strings are invented; the existing per-form `submitting` keys are reused
verbatim and stay in sync across `en.json` / `uk.json`.

| Form         | Key                       | English       | Ukrainian  |
| ------------ | ------------------------- | ------------- | ---------- |
| Registration | `sign_up.form.submitting` | `Signing up…` | `Обробка…` |
| Login        | `sign_in.form.submitting` | `Signing in…` | `Вхід…`    |

The accessible name comes from the existing `submit_button` keys, preserved as
children while loading (FR10, AR1): `sign_up.form.submit_button` = `Sign Up` /
`Реєстрація`; `sign_in.form.submit_button` = `Sign in` / `Увійти до облікового
запису`.

### Live-region semantics (FR7, AR3, NFR7)

Exactly **one** polite, non-assertive live region announces the busy state with
the localized `submitting` string. The region renders a `span` with
`role="status"` (which carries an implicit `aria-live="polite"`) plus
`aria-atomic="true"` — **not** a bare `<span aria-live="polite">` without
`role="status"`. `role="status"` is the on-point WCAG 4.1.3 Status Messages
idiom and is the more robustly supported pattern across screen readers, which
handle dynamic text injection into a generic span inconsistently. It is rendered
once per form as a sibling form child — never nested inside another live region —
so it stays the single spoken source.

There is **no** `role="progressbar"` wired as a second announcement source, and
the custom `loadingIndicator` / `CircularProgress` carries **no** `aria-label`:
the submitting string is used **only** by the live region, and the button's
accessible name stays its stable `submit_button` children (no competing name on
the indicator).

```text
<form aria-busy={submitting}>            ← FR6 / AR4
  ErrorBanner                            ← LOGIN only; registration passes error={null}
  …fields…
  <Button loading={submitting}>          ← FR1-FR4, FR10
     {submitLabel}                       ← always present (the accessible name)
     loadingIndicator: CircularProgress  ← white #FFFFFF on grey #E1E7EA, size 28, thickness 4.5, NO aria-label
  </Button>
  <span role="status" aria-atomic="true">  ← FR7 / AR3 / 4.1.3: the ONE announcement
     {submitting ? t('…submitting') : ''}
  </span>
</form>
```

When `submitting` flips true the live region text changes from empty to e.g.
`Signing in…` and is announced once; when it flips false the text empties and
nothing further is spoken.

### Fast-submit zero-announcement case

For a very fast submit (the "fast submit" edge case), `submitting` can flip
true→false within the same frame/microtask batch, so the live region may be set
and cleared before the assistive-technology buffer reads it — the "exactly one
announcement" contract can silently become **zero**. This is accepted as-is: no
minimum-duration latch is added. The busy state is still conveyed by
`aria-busy={submitting}` on the `<form>` and the native `disabled` attribute on
the button regardless of whether the polite region speaks, and a sub-frame busy
window is below the threshold where a spoken announcement is useful. The contract
is therefore "at most one announcement; zero on a sub-frame submit," not
"guaranteed exactly one."

## Focus Behavior & Double-Submit Prevention

### Focus while loading (AR5)

In MUI v7.3.x the loading button is **natively** `disabled` (the `loading` prop
sets `ButtonBase` `disabled`, not focusable `aria-disabled`). Consequences,
designed for deliberately:

- The button leaves the tab order while loading and cannot be focused or clicked.
- If it held focus at submit time, the browser moves focus to `<body>`. This
  `<body>`-focus condition is created by this feature (the button goes natively
  disabled at submit), so this feature owns the remediation on every error path
  (see Focus return on completion). The single polite `role="status"` region
  announces the busy state regardless of focus location (AR3/AR5).

### Idle / re-enabled focus indicator (resolved in scope)

The idle and re-enabled focus indicator is **resolved in scope** by this feature
— see the "Focus Indicator (In Scope) — 2.4.7 / 2.4.11" section. The
`:focus-visible` rule is split out of `:hover` and given a `2px solid #404142`
outline at `2px` offset, replacing the prior `1.18:1` near-invisible fill shift.
The UX **asserts** 2.4.7 / 2.4.11 conformance for the submit button.

### Focus return on completion

- **Success (registration):** the success view renders; focus management belongs
  to that view (out of scope here), and the submit button is unmounted.
- **Error (login):** `submitting` returns to `false`, the button re-enables per
  form validity, and the existing `ErrorBanner` (fed by the `error` prop in
  `login-form.tsx`) renders above the form to carry the error message and move
  focus to itself. The user can re-focus the now-enabled submit button.
- **Error (registration):** `registration-form.tsx` passes `error={null}` to
  `UIForm` (hardcoded, line 41), so `ErrorBanner` never renders for registration.
  On failure the form view swaps to `RegistrationNotificationPanel`, which
  surfaces `errorText` in a separate notification view; the submit button is
  unmounted with the form view. Because this feature creates the `<body>`-focus
  condition, the notification view **must receive focus on mount**
  (`tabIndex={-1}` plus programmatic focus of its heading / error text) so focus
  is never stranded on `<body>`. This remediation is owned by this feature even
  though it lands in the notification component, and is asserted by an e2e check
  (see Edge Cases / Story 1.10): after a registration failure, focus is on a
  meaningful element, not `<body>`.
- **Login success:** navigation proceeds; the form is replaced.

### Double-submit prevention (FR3, FR9)

Because the button is natively `disabled` while `submitting`, it cannot be
re-activated and a native-disabled submit button cannot trigger form submission.
This is a free double-submit guard — no separate guard logic is added.

## Before / After Comparison

| Aspect                 | Before (main)                                                     | After (this design)                                                    |
| ---------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Busy visual            | Grey button + detached `size={70}` spinner below                  | Same button, label hidden, centered white spinner                      |
| Layout                 | Spinner pushes content → shift (FR8 violated)                     | Zero shift; swap inside fixed box (FR8)                                |
| Button fill (busy)     | `#E1E7EA` grey, white label 1.26:1 (label visible)                | `#E1E7EA` grey (Figma), label removed, white spinner 1.26:1 (accepted) |
| Focus indicator        | `:focus-visible` = `:hover` fill shift 1.18:1 (2.4.7/2.4.11 fail) | `2px solid #404142` outline + `2px` offset, ≥3:1 (2.4.7/2.4.11)        |
| Signaling              | Two split, untied cues                                            | One unified in-button cue + one announcement                           |
| `aria-busy`            | Absent on `<form>`                                                | `aria-busy={submitting}` on `<form>` (FR6)                             |
| Announcement           | None                                                              | One polite `role="status"` region, localized (FR7)                     |
| Accessible name (busy) | Fragile                                                           | Preserved (label stays as children) (FR10/AR1)                         |
| Reduced motion         | Unhandled spin (snapshot flake risk)                              | `animation: none` static ring (NFR8/AR6, quality)                      |
| Error-path focus       | Registration failure strands focus on `<body>`                    | Notification view receives focus on mount (AR5)                        |
| Double-submit          | Disabled, detached spinner below                                  | Native disabled grey, in-button spinner (FR3/FR9)                      |

## Edge Cases

### Fast submit (request resolves almost immediately)

`submitting` may flash true→false in a few frames. The button geometry never
changes, so a fast flash causes no layout jolt. The polite live region may
announce `Signing in…` briefly or — for a sub-frame submit — not at all (see the
fast-submit zero-announcement case above); `aria-busy` and native disabled still
convey the state. No debounce is added — the design tolerates a short flash.

### Error after submit

On failure `submitting` returns to `false` and the button leaves loading. The
error channel differs per form: **login** re-shows the button (fill back to
idle/hover per validity, label re-shown) and the existing `ErrorBanner` renders
the error above the form via the `error` prop and moves focus to itself; the live
region empties. For login this also confirms R7 — by the time `ErrorBanner`
renders, `submitting` is already `false`, so the polite region's text is empty
and the two never compete. **Registration** passes `error={null}`, so
`ErrorBanner` never renders; the form view swaps to
`RegistrationNotificationPanel`, which owns the error display and **receives
focus on mount** (`tabIndex={-1}` + focuses its heading / error text) so focus is
never stranded on `<body>` (AR5, Story 1.10). R7 holds for registration too: the
only live region in the form view is the single polite `role="status"`, which
empties when `submitting` flips false, and the notification view is a separate,
non-nested surface — there is never a second competing live region in either
path.

### Very long label

`submit_button` localizations vary in length — Ukrainian login is `Увійти до
облікового запису` (markedly longer than English `Sign in`). The button already
wraps/sizes this label in the idle state via `styles.submitButton`; loading does
not change the box, so a long label never alters loading geometry. While loading
the label is `visibility: hidden` (it still occupies its laid-out space), so the
spinner stays centered within the same box the long label produced — no shift
between the long-label idle and loading states.

### Validation-disabled vs loading collision

If the form is invalid (`isSubmitDisabled`) the button is grey and not loading;
it never enters the loading path because submission cannot fire. The loading
button uses the **same** native grey `#E1E7EA` disabled fill (no override), so
the two disabled-looking states share the fill by design — the white spinner and
the hidden label are what distinguish the busy state, and the `:disabled` rule is
reused as-is rather than weakened.

## Requirement Traceability

- Interaction model & states → FR3, FR9, AR5.
- Geometry / zero shift → FR8, AC6.
- Label hide / accessible name → FR1, FR10, AR1, AC5.
- In-button spinner / detached removal → FR2, FR5, AC1.
- Contrast decision (native grey `#E1E7EA` disabled fill, no override + white spinner; white-on-grey 1.26:1 is a design-accepted deviation) → FR4, AR2, AC3.
- Focus indicator (`:focus-visible` split out; `2px solid #404142` + `2px` offset, ≥3:1; replaces the 1.18:1 defect) → NFR7, AR5, AC2.
- Registration error-path focus (notification view focused on mount, not `<body>`) → AR5, Story 1.10.
- Motion / reduced motion (quality / snapshot stability, not AA) → NFR8, AR6, AC7.
- Announcement copy + single polite `role="status"` region (4.1.3) → FR6, FR7, AR3, AR4, NFR6, NFR7, AC4, AC5, AC9.
- Focus + double-submit → FR3, FR9, AR5, AC2.
- Gate posture (no new dep, no suppressions, no `data-testid`) → NFR1-NFR5, AC8, AC10.
