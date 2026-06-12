---
status: 'complete'
workflowType: 'prd'
project_name: 'crm'
date: '2026-06-11'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/48'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/48'
  - 'src/components/ui-form/index.tsx'
  - 'src/components/ui-button/index.tsx'
  - 'src/components/ui-button/theme.ts'
  - 'src/components/skeletons/base/styles.ts'
  - 'src/components/skeletons/auth-skeleton/index.tsx'
  - 'src/components/skeletons/auth-skeleton/styles.ts'
  - 'src/components/skeletons/ui-skeleton-button/styles.ts'
  - 'src/modules/user/features/auth/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx'
  - 'src/modules/user/features/auth/i18n/en.json'
  - 'src/modules/user/features/auth/i18n/uk.json'
  - 'src/styles/colors.ts'
  - 'tests/visual/take-visual-snapshot.ts'
---

# Product Requirements Document - Loader Animation Redesign (Issue #48)

**Author:** BMad (Product Manager) **Date:** 2026-06-11 **Source:**
[VilnaCRM-Org/crm#48](https://github.com/VilnaCRM-Org/crm/issues/48)

## Inputs and Evidence Base

This PRD does not rely on any external planning memo. Every usage-point, contrast, and animation
claim below is re-derived directly from source in this repository (the files listed in
`inputDocuments`), so each acceptance criterion traces to verifiable code rather than to a separate
audit document. The loader-usage inventory, taxonomy, token reference, contrast values, and
accessibility requirements are folded inline here (Overview, the Loader Usage Inventory section,
Functional Requirements, and the Non-Functional Requirements). Where the GitHub issue says "audit
all current loader usage points", the audit result is the Loader Usage Inventory table below,
grounded in grep over `src/`.

## Overview / Context

The CRM's loading experience is fragmented and partially inaccessible. A form submission today shows
a `disabled` gray `UIButton` **plus** a separate 70px MUI `CircularProgress` rendered beside it
(`SubmitControls` in `src/components/ui-form/index.tsx`, line 116). Page loads use a well-built
shimmer skeleton (`AuthSkeleton`) that is, however, exposed to assistive technology as a **region
landmark** on decorative content (`src/components/skeletons/auth-skeleton/index.tsx:115`,
`<Box component="section" aria-label={t('auth.loadingForm')}>`). Several waits — the login/register
switcher and the registration retry button — show no loader at all. No source CSS honors
`prefers-reduced-motion` (the shimmer in `src/components/skeletons/base/styles.ts` runs
`1.5s ease-in-out infinite alternate` unconditionally), and the disabled submit label renders white
text on `#E1E7EA` at ~1.25:1 — a live WCAG 1.4.3 failure shipping today.

> **Reduced-motion is already emulated in the test harness.** Although no _source_ CSS handles
> `prefers-reduced-motion`, the visual-snapshot harness already forces it:
> `tests/visual/take-visual-snapshot.ts:59` calls
> `page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })`, and the
> auth/skeleton/registration visual specs inherit that. This means **every existing baseline already
> captures the static (non-animated) state**. Adding a source
> `@media (prefers-reduced-motion: reduce)` rule therefore does **not** change those baselines'
> meaning (they were already reduced-motion), but it does mean a snapshot taken under the default
> harness can never exercise the animated path. The test plan (NFR14, NFR17) accounts for this
> explicitly with a separate non-reduced-motion visual project so the shimmer is actually covered.

This PRD defines a single, **skeleton-based loader family of five types** that all share the
existing CSS shimmer as their common motion language. The five types — referenced by name and id
throughout this and all downstream artifacts — are:

| Id  | Component (UI\*)        | Context                              | Motion base               |
| --- | ----------------------- | ------------------------------------ | ------------------------- |
| L1  | `UISkeletonPlaceholder` | Page / form initial load             | shimmer 1.4s ease-in-out  |
| L2  | `UISubmitLoadingButton` | **Submit-button loading (required)** | shimmer 1.4s, in-place    |
| L3  | `UIInlineLoader`        | Small inline indeterminate indicator | pulse 1.0s (opacity)      |
| L4  | `UISectionLoader`       | Route / section / overlay load       | shimmer 1.4s + pulse 1.0s |
| L5  | `UIProgressBar`         | Determinate progress (reserved)      | linear fill (`scaleX`)    |

The headline behavior change — and the explicit product direction — is that the **submit button
itself becomes the loader (L2)**: on submit it turns into a skeleton-gray shimmering track in its
own reserved box. It must remain **fairly visible / unmistakable** so the user clearly reads "I
submitted, something is happening", never a flat ambiguous disabled rectangle and never a detached
spinner.

This is a brownfield change confined to the design-system loader layer plus its audited consumers.
It builds on the existing pure-CSS shimmer (one source of motion truth) so it stays within the
strict auth-page mobile Lighthouse budget and the repo's jscpd (DRY), rust-code-analysis (rca,
metrics), and no-`data-testid` selector gates.

## Loader Usage Inventory (the issue's "audit", re-derived from source)

This table is the authoritative usage-point inventory. It distinguishes **(a) existing loaders to
migrate** from **(b) silent waits to newly instrument** — a distinction the issue's "migrate
existing loader usages" task blurs. There is exactly **one** spinner/`progressbar` in all of `src`
today; everything else listed is an _addition_ where no loader existed, justified against the
issue's intent below.

| Site (verified)                                                                                          | Today                                                     | Category                           | New loader                | Justification                                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui-form/index.tsx:116` `SubmitControls` `CircularProgress size={70}`                                    | the **only** spinner / `role="progressbar"` in `src`      | **(a) existing loader to migrate** | L2                        | Direct migration: replace the one detached spinner with the in-place submit-button loader.                                                                                                          |
| `auth/index.tsx:16` `<Suspense fallback={<AuthSkeleton/>}>`                                              | shimmer skeleton, mislabeled region landmark              | **(a) existing loader to migrate** | L1                        | The skeleton exists; this migrates it (fix landmark, add status owner) and consolidates the duplicate folder.                                                                                       |
| `form-section/index.tsx:103` switcher (`SwitcherButton`, `disabled={isLoadingLogin}`)                    | silent — disabled only, no loader                         | **(b) newly instrument**           | L3                        | The switcher gives a keyboard/SR user no pending feedback. Adding L3 is loader behavior, not a UX redesign — in scope per issue #48 and the user's "every wait shows a clear loading state" intent. |
| `registration-error-view.tsx:72` retry button (`ErrorButtons`, `disabled={isSubmitting \|\| isClosing}`) | silent — disabled only, no loader                         | **(b) newly instrument**           | aria-busy only (see FR22) | The retry sits inside an existing `role="alert"` live region (line 97); adding pending feedback here is loader behavior, in scope, but MUST NOT add a nested status region (FR22).                  |
| `index.tsx` root Suspense, `app.tsx` route Suspense, `form-section` login `aria-hidden` fallback         | intentionally minimal (`fallback={null}` / `aria-hidden`) | out of scope (critical path)       | none (L4 opt-in only)     | Kept minimal to protect the mobile Lighthouse budget (FR23, NFR3).                                                                                                                                  |

**Scope guard.** Items in category (b) add a loader where none existed; that is loader behavior
(issue #48 in-scope), not one of the issue's out-of-scope "large UX redesigns unrelated to loader
behavior". No flow is restructured; only its existing wait gains an accessible pending cue.

## Project Classification

- **Project Type:** Frontend feature — shared UI design-system components and their migration into
  existing consumers.
- **Domain:** Design system / accessibility / motion.
- **Complexity:** Medium — the primitives exist, but the change touches the auth critical path, an
  existing a11y/contrast defect, two forms, reduced-motion, i18n, and visual snapshots
  simultaneously, under multiple CI gates.
- **Project Context:** Brownfield — targeted redesign of loading states in an existing CRM frontend,
  consolidating duplicated skeleton implementations.

## Goals & Non-Goals

### Goals

- **G1 — Consistency:** one loader family used at **100% of the inventoried loader usage points**
  (the table above), with the dead-code duplicate `auth-skeleton` re-export removed.
- **G2 — The submit-button-as-loader (the user's primary direction):** the pressed submit button
  morphs in place into a fairly-visible shimmering skeleton track, replacing the
  disabled-button-plus-70px-spinner pattern.
- **G3 — Accessibility conformance:** correct pending-state semantics (`role="status"`, `aria-busy`,
  decorative `aria-hidden`, focus-safe `aria-disabled`), no nested live regions, deterministic focus
  on settle, and removal of the live white-on-`#E1E7EA` contrast defect.
- **G4 — Reduced-motion respect:** every loader settles to a static affordance under
  `prefers-reduced-motion: reduce` (never loops), across all three motion mechanisms in the family
  (shimmer, box-shadow/opacity pulse, and L5's transition).
- **G5 — Zero layout shift:** every loader reserves its final content box; the submit area is
  geometry-identical before vs. during loading.
- **G6 — Feasible under all gates by construction:** pure CSS, dependency-free, one shared motion
  source plus a shared breakpoint-geometry fragment (jscpd), per-loader folders (rca), semantic
  queries (no `data-testid`), green CI on the auth Lighthouse budget.

### Non-Goals

- Large UX redesigns unrelated to loader behavior (per issue #48 "Out of Scope") — e.g. replacing
  existing flows with full skeleton screens, or restructuring the auth/registration UX.
- Re-architecting forms, routing, or the data layer beyond what migrating loaders requires.
- Building a new percentage flow (L5 ships as a reserved primitive only; no current consumer).
- Forcing a visible veil onto critical-path Suspense boundaries (L4 stays opt-in and off the auth
  critical path).
- Introducing any animation library or new eager dependency on the auth paint path.

## Personas

### Persona 1: End User Submitting the Auth/Registration Form (Primary)

Mid-task at the product's front door. Needs immediate, certain feedback that their action registered
and the system is working. A greyed button plus a detached spinner is ambiguous; L2's in-place morph
(shimmer + retained label, no movement) makes "I submitted, it's loading" unmistakable.

### Persona 2: End User With a Reduced-Motion Preference

Has `prefers-reduced-motion: reduce` set (vestibular sensitivity, focus, or comfort). Needs no
looping/auto-playing animation but still a clear loading affordance. The family settles to a static
gray fill (plus L2's 3:1 border and visible label; L5 jumps to value).

### Persona 3: End User Relying on a Screen Reader

Needs to be told, politely and once, that work is pending and when it finishes — including the
reduced-motion intersection, where the shimmer is static and gives no motion cue, so the
announcement is the _only_ signal. Today loaders are silent or expose a stale landmark / unlabeled
spinner. The family announces via a single `role="status" aria-live="polite"` per region (mounted
empty up-front), marks containers `aria-busy`, hides decorative shimmer, never nests live regions,
and keeps the submit button focusable via `aria-disabled` with deterministic focus on settle.

### Persona 4: Developer Consuming the Shared Loader API (Secondary)

Needs a small, predictable set of `UI*` loader components to drop into any pending state without
reinventing timing, easing, reduced-motion, ARIA, or layout reservation — and without tripping jscpd
by copy-pasting shimmer styles or the submit-button breakpoint ladder. Choosing the right loader is
a taxonomy lookup; correct a11y/reduced-motion comes for free.

### Persona 5: Reviewers and CI Gates (Oversight Stakeholder)

The change must pass the auth mobile Lighthouse budget, jscpd, rca metrics, the no-`data-testid`
rule, and i18n completeness. "Feasible under the gates" is a first-class consumer of the design.

## Functional Requirements

Each FR is atomic, testable, and traceable. FR ids are the canonical reference reused by the UX,
Architecture, and Epics artifacts.

### Shared Loader Family & Motion API

- **FR1:** The repository provides a single shared source of loader motion in
  `src/components/skeletons/base/`, exposing named timing tokens (`SHIMMER_DURATION = '1.4s'`,
  `PULSE_DURATION = '1.0s'`, `STAGGER_STEP = '120ms'`, `MOTION_EASING = 'ease-in-out'`,
  `MOTION_ITERATION = 'infinite alternate'`), a single
  `REDUCED_MOTION_QUERY = '@media (prefers-reduced-motion: reduce)'` constant, a `motionSafeShimmer`
  base style, and a `LoaderMotion.shape({ width, height, borderRadius })` geometry factory, so no
  loader re-declares the shimmer keyframe, gradient, or timing.
- **FR2:** All five loader types (L1–L5) derive their motion from the FR1 shared source via
  base-plus-geometry-override composition; no loader `styles.ts` contains a duplicated motion block.
- **FR2a:** The submit/button **breakpoint-geometry ladder** (height `3.125rem` +
  `minWidth 19.6875rem` @≥375; height `4.375rem` / `minWidth 33.75rem` @md; `minWidth 26.375rem`
  @lg; height `3.875rem` @xl), currently in `ui-skeleton-button/styles.ts`, is extracted into
  **one** exported style fragment under `skeletons/base/` and spread by L1's submit-bar placeholder
  and L2's track (or L2 consumes `ui-skeleton-button`'s ladder directly). The ladder is declared
  exactly once; no two files re-declare it. This is a named entry in the DRY single-definition list
  (NFR11).
- **FR3:** The loader family is delivered as five `UI*` components, each in its own folder
  (`index.tsx` + `styles.ts` + `types.ts`): `UISkeletonPlaceholder` (L1), `UISubmitLoadingButton`
  (L2), `UIInlineLoader` (L3), `UISectionLoader` (L4), and `UIProgressBar` (L5).

### Per-Loader-Type Behavior & Trigger

- **FR4 — L1 `UISkeletonPlaceholder`:** A page/form-load placeholder that mirrors the final form
  layout (title, subtitle, three field rows, submit button, divider, four social buttons, switcher)
  using the shimmer base with a per-row `STAGGER_STEP` cascade. Its submit-bar placeholder consumes
  the FR2a shared ladder. The legacy wrapper "glow" is **not** animated via box-shadow (see FR4a).
  **Trigger:** the lazy `FormSection` chunk (imported at
  `src/modules/user/features/auth/index.tsx:8`) is resolving and the
  `<Suspense fallback={<AuthSkeleton/>}>` at `src/modules/user/features/auth/index.tsx:16` is
  showing.
- **FR4a — Wrapper glow is compositor-safe:** The existing `shadowPulseAnimation` that animates
  `box-shadow` on the L1/L4 form wrapper (`auth-skeleton/styles.ts:17-19`, applied independently of
  `baseSkeletonStyle`) is **not** animated as a continuous loop. Animating `box-shadow` forces a
  per-frame repaint of a large blur radius (a known jank source on the auth Lighthouse path), so the
  wrapper glow is either dropped or, if a glow is desired, expressed as the **opacity** of a
  pseudo-element/overlay carrying a pre-rendered static `box-shadow` (opacity is GPU-compositable).
  Either way the looping `box-shadow` keyframe is removed.
- **FR5 — L2 `UISubmitLoadingButton`:** The submit button **becomes** a skeleton-gray shimmering
  track **in place** within its own reserved box (57px radius, same dimensions as the real button
  via the FR2a ladder): track fill `#C7CDD6`, a 1px `#969B9D` boundary, and the retained submitting
  label in `#404142`. The shimmer sweep runs left-to-right. The separate `size={70}`
  `CircularProgress` is removed. **Trigger:** `submitting` is true in `SubmitControls`
  (`src/components/ui-form/index.tsx`), used by both `registration-form.tsx` and `login-form.tsx`,
  and the retry button in `registration-error-view.tsx`.
- **FR6 — L3 `UIInlineLoader`:** A small three-dot indeterminate indicator animating `opacity` on
  the `PULSE_DURATION` band with a `STAGGER_STEP` travel, dots colored `#969B9D`. **Trigger:** the
  login/register switcher loading state (`form-section/index.tsx:103`, today silent/disabled-only)
  and any small inline wait too small for a full skeleton.
- **FR7 — L4 `UISectionLoader`:** An opt-in region/overlay shimmer veil sized to fill a section's
  reserved box, using the shimmer base plus an optional soft glow expressed via the FR4a
  compositor-safe overlay (never a looping `box-shadow`). **Trigger:** a developer opts a
  **non-critical** lazy route/section boundary into a visible loading cue; it MUST NOT be placed on
  the auth critical-path Suspense boundaries, which keep `fallback={null}`.
- **FR8 — L5 `UIProgressBar`:** A reserved **determinate** bar whose **solid** fill is driven by a
  real `0–100` value via `transform: scaleX()` with `linear` easing, track `#E1E7EA`, fill
  `#1EAEFF`, with any percentage label rendered adjacent (never on the fill). To avoid non-uniform
  `scaleX` distorting inner texture, the riding brand-glow shimmer is **not** placed on the scaled
  fill element: it is rendered on a separate, non-scaled, absolutely-positioned overlay clipped to
  the filled region so its shimmer wavelength stays constant as the bar grows. **Trigger:** a future
  flow supplies a real percentage; it ships with no consumer wired and MUST NOT be used for
  indeterminate auth submit.

### Registration Submit-Button Loading State (User Intent)

- **FR9:** While submitting, the registration (and login) submit button uses
  `aria-disabled="true"` + `aria-busy="true"` and **not** the native HTML `disabled` attribute,
  keeping it focusable and `type="submit"`; the genuinely pre-submit-disabled state
  (`isSubmitDisabled`) MAY keep native `disabled`.
- **FR9a — Decouple `disabled` from `loading` in `SubmitControls`:** `SubmitControls` today couples
  the two inputs via `disabled={submitting || isSubmitDisabled}`
  (`src/components/ui-form/index.tsx:110`). The control MUST derive native `disabled` **solely**
  from `isSubmitDisabled` and route `submitting` **exclusively** through a `loading=` input to the
  button, never OR-combining the two. Without this decoupling the `aria-disabled`-not-`disabled`
  focusable-submit guarantee (FR9) cannot hold.
- **FR9b — `UIButton` `loading` surface swap and re-entrancy:** `UIButton` (a `forwardRef` wrapping
  MUI `<Button>` and applying `...rest` via `React.cloneElement` inside a local `ThemeProvider`)
  gains a `loading` input. When `loading` is set, `UIButton` renders the L2 skeleton surface, strips
  the native `disabled` attribute, applies `aria-disabled="true"` + `aria-busy="true"`, and keeps
  `type="submit"` focusable. Because `aria-disabled` does **not** prevent MUI from firing `onClick`,
  every focusable `aria-disabled` submit/retry control MUST be guarded by an in-flight early-return
  (FR10) — including the retry path. The added branch MUST keep `UIButton` function bodies within
  rca limits (LLOC ≤10, exit points ≤3).
- **FR10:** The submit handler early-returns (no-op) when a submission is already in flight, so
  retaining focusability via FR9 cannot cause a double submission. This guard MUST exist on
  **every** focusable `aria-disabled` loading control: the form submit handler (`buildSubmitHandler`
  in `ui-form`) **and** the retry handler in `registration-error-view`. The retry handler must not
  double-fire while a retry is in flight.
- **FR11:** The visible-label-swap mechanism **already exists** (scope = keep it working):
  `getSubmitLabelKey(mode, isSubmitting)` already swaps the visible label from the submit key to the
  submitting key (e.g. `sign_up.form.submit_button` → `sign_up.form.submitting`) and both forms
  already pass it. The submit button retains a non-empty accessible name throughout the transition
  via this swap, and the button is never reduced to a bare unlabeled track. The **visible label
  key** (`*.form.submitting`, short text such as "Signing up…") and the **announced status key**
  (`*.form.submitting_status`, full sentence — FR24) are distinct roles; see the FR24 role table.
  The visible-label key MUST NOT be reused for the status region.
- **FR12:** The existing `:disabled` `UIButton` styling that renders white text (`#FFFFFF`) on
  `#E1E7EA` is removed; the genuinely-disabled pre-submit text is remediated to `#404142` on
  `#E1E7EA` (≥4.5:1).

### Reduced-Motion Behavior

- **FR13:** The shared `animation: none` reduced-motion rule, defined once via the FR1
  `REDUCED_MOTION_QUERY` constant inside `motionSafeShimmer`, scopes to the **shimmer/pulse loaders
  L1–L4** so no shimmer/opacity-pulse animation is `infinite`/looping under reduced motion. This
  single rule is **not** inherited by all five members: the determinate L5 is driven by a
  `transform: scaleX` CSS _transition_ (not a keyframe animation), which `animation: none` does not
  affect; L5 therefore adds its own `transition: none` branch (FR14). The reduced-motion contract is
  enforced at **three coordination points**, not one: (a) `motionSafeShimmer` for the shimmer boxes
  (L1, L2, L4 fills, and L3's dots where opacity-driven), (b) the same `REDUCED_MOTION_QUERY` block
  applied to the FR4a wrapper-glow overlay (the box-shadow/opacity pulse) and to L3's opacity
  keyframe — these are separate style objects, not part of `baseSkeletonStyle`, so they must
  reference the constant explicitly — and (c) L5's `transition: none`.
- **FR14:** Under reduced motion each loader renders a clear static affordance: L1/L4 show static
  gray fills and a static (non-pulsing) glow; L2 shows a static `#C7CDD6` fill retaining its
  `#969B9D` 3:1 border and visible label; L3 shows three static `#969B9D` dots; L5 jumps directly to
  its current value with `transition: none`. No loader is hidden under reduced motion.

### Accessible Pending-State Semantics

- **FR15:** Each independent loading region exposes **exactly one** element with `role="status"` +
  `aria-live="polite"` carrying a meaningful (visually-hidden where appropriate) message; there is
  never more than one status owner per region, **and** no `role="status"` is added to a region that
  already has a live-region owner (see FR22). The status node is mounted **persistently and empty
  up-front** on the host's initial render (e.g. the form and the switcher), and only its **text
  content** changes on the idle→loading and loading→settle transitions — the live-region element and
  its text are never mounted in the same commit (some screen readers will not announce a region
  whose node and text appear together).
- **FR16:** The container that wraps each loading region sets `aria-busy="true"` while pending and
  `aria-busy="false"` (or removes it) when content is ready; for L2 the form/submit-area wrapper
  toggles `aria-busy` with `submitting`. Because the success/error path replaces the form subtree
  with the `role="alert"` notification view, `aria-busy="false"` is only observable on the
  **in-place revert / error-stays-on-form** path; on **view replacement** the busy form unmounts and
  the alert view appears instead (see FR16a, FR22, and the Story-level ACs).
- **FR16a — Settle taxonomy:** "Settle" has two distinct shapes that the ACs MUST distinguish: **(i)
  in-place revert** (submit fails and the form remains, or a loading region reverts) — the busy
  container flips `aria-busy` to `false` and the status text clears; **(ii) view replacement**
  (registration success, and error views that replace the form) — the busy form **unmounts** and the
  existing `role="alert"` view appears. Assertions of `aria-busy="false"` apply only to (i); for
  (ii) the assertion is "the busy form is gone and the `role="alert"` view is present".
- **FR17:** All decorative shimmer/pulse/spinner visuals (the L1/L2/L3/L4 boxes and dots) carry
  `aria-hidden="true"` and no `role`; the removed `CircularProgress` no longer exposes
  `role="progressbar"`. L5 is the only member that exposes `role="progressbar"` with
  `aria-valuenow`/`aria-valuemin`/ `aria-valuemax` and an accessible name.
- **FR18:** L1 no longer renders a region landmark for decorative loading content: the auth-skeleton
  root (today `auth-skeleton/index.tsx:115`,
  `<Box component="section" aria-label={t('auth.loadingForm')}>`) becomes a non-landmark container
  (not `<section aria-label=…>`) that holds the single FR15 status owner.
- **FR19 — Announce onset immediately; debounce only the clear:** The loading announcement is
  written **immediately** on a genuine idle→loading transition (no onset debounce), so even a fast
  (~200ms) resolution still leaves the loading message spoken before hand-off. Only the **clear**
  (loading→settle) is debounced/throttled to suppress flicker on rapid toggles. The status uses
  `aria-live="polite"` (never `assertive` for loading). On settle the region hands off to the
  existing `role="alert"` success/error view. The contract guarantees that **for any submission
  duration, either the loading status or the settle alert is always spoken** — the user is never
  left with zero feedback (this holds under `prefers-reduced-motion` too, where the static shimmer
  provides no motion cue; see FR23a).
- **FR19a — Single loading announcement per submit:** Exactly one loading-related announcement is
  queued per submit episode. The visible button label change (FR11) MUST NOT itself trigger a
  redundant live announcement: the submit button carries **no** `aria-live`, so only the sibling
  `role="status"` region speaks the loading sentence. The button's name change conveys state
  visually and to focus; the status region conveys it to the live-region channel.

### Migration / Instrumentation of Every Inventoried Usage Point

- **FR20:** The L2 submit state replaces the `SubmitControls`
  disabled-button-plus-`size={70}`-`CircularProgress` pattern (`ui-form/index.tsx:116`) for both the
  registration form (`registration-form.tsx:42`) and the login form (`login-form.tsx:26`). This is a
  **migration of the single existing spinner** (Loader Usage Inventory category (a)).
- **FR21 — Remove the dead duplicate (not a migration):** The module-local re-export at
  `src/modules/user/features/auth/components/auth-skeleton/` is a thin re-export of the canonical
  `@/components/skeletons/auth-skeleton` with **zero importers** (verified by grep;
  `src/modules/user/features/auth/index.tsx` already imports the canonical path at line 3). It is
  therefore **deleted as dead code**, not migrated; there are no importers to repoint. L1 replaces
  the canonical `AuthSkeleton` Suspense fallback at `auth/index.tsx:16`.
- **FR22 — Switcher gets L3; retry path uses `aria-busy` only (no nested live region):** The L3
  inline loader is **added** (Loader Usage Inventory category (b)) to the previously-silent
  login/register switcher loading state (`form-section/index.tsx:103`), which has no existing
  live-region owner, so L3 carries its own `role="status"`. The registration **retry** button
  (`registration-error-view.tsx:72`) sits **inside** a container that is already
  `role="alert" aria-live="polite"` (`registration-error-view.tsx:97`). To avoid nesting live
  regions (which screen readers announce unpredictably), the retry path MUST **not** render a
  `UILoaderStatus`/`role="status"`: the enclosing `role="alert"` is the single live-region owner.
  Retry pending state is conveyed by `aria-busy` on the retry button (and/or the alert container),
  and any announcement rides the alert's existing content. `UILoaderStatus` is reserved for regions
  with **no** existing live-region owner (the submit form, the switcher).
- **FR23:** No auth-path loader uses MUI `CircularProgress` after migration (the one at
  `ui-form/index.tsx:116` is the only one in `src`), and the intentionally-minimal critical-path
  Suspense fallbacks (the root Suspense in `src/index.tsx`, the route Suspense in `src/app.tsx`, and
  the `form-section` login `aria-hidden` fallback) remain unchanged to protect the Lighthouse
  budget. These critical-path boundaries are referenced by symbol; their exact line numbers are not
  load-bearing for this requirement.
- **FR23a — Reduced-motion screen-reader floor:** For a reduced-motion screen-reader user the
  shimmer is static (no motion cue), so the announcement is the only perceivable loading signal. A
  genuine idle→loading transition MUST therefore always be announced once under
  `prefers-reduced-motion` (FR19's onset-immediate rule guarantees this), and the persistent
  `aria-busy` + empty-mounted `role="status"` (FR15) provide a debounce-independent signal. This
  loader's loading status is announced **exactly once** for any real (non-instant) submission,
  including under reduced motion.

### Focus Management at Settle

- **FR26 — Deterministic focus on the loading→settle hand-off:** When the focused L2 submit control
  is removed or replaced on settle, focus MUST NOT silently drop to `document.body` (a WCAG 2.4.3 /
  3.2.x concern after the most important interaction in the flow). On **view replacement** (FR16a
  (ii)) focus moves programmatically to the `role="alert"` success/error container so the outcome is
  read and actionable; on **in-place revert** (FR16a (i)) focus remains on (or returns to) the
  restored submit button. After settle, `document.activeElement` is the alert container or the
  restored submit control — never `body`.

### i18n Loading Announcements (en + uk)

- **FR24:** A new submit-status key (`sign_up.form.submitting_status` = "Submitting registration,
  please wait" / "Надсилання реєстрації, зачекайте", and the login analogue
  `sign_in.form.submitting_status`) is added to **both** `en.json` and `uk.json` under
  `src/modules/user/features/auth/i18n/`, distinct from the visible button label key so the
  announced message is a complete sentence. The visible-label and announced-status keys map to
  distinct roles:

  | Role                 | Key                        | Content style         | Where it renders                              |
  | -------------------- | -------------------------- | --------------------- | --------------------------------------------- |
  | Visible button label | `*.form.submitting`        | short ("Signing up…") | the focusable button's text / accessible name |
  | Announced status     | `*.form.submitting_status` | full sentence         | the sibling `role="status"` region (FR15)     |

  The visible-label key (`*.form.submitting`) MUST NOT be used for the status region, and the status
  key (`*.form.submitting_status`) MUST NOT be used as the button label.

- **FR25:** A switcher loading key (`auth.switching_form`) and any generic loading copy used by
  L1/L4 status regions are added to **both** `en.json` and `uk.json`; the existing
  `auth.loadingForm` key is reused for L1. No new loading string ships in only one locale.

### Developer Preview (Storybook)

- **FR27:** Every loader (L1–L5) ships an interactive **Storybook preview** via a co-located
  `*.stories.tsx` authored alongside the component (in Epic 2, not deferred). Each story exposes
  the loader's full state set: the animated default, the **reduced-motion / static** fallback, and
  any type-specific states — L2 previews `idle` / `submitting` / `disabled`, and L5 previews
  determinate values (e.g. 0 / 50 / 100). The stories reuse the shared static / `disableAnimation`
  opt-out (no duplicated story scaffolding → jscpd-safe) and follow the existing
  `auth-skeleton.stories.tsx` / `button.stories.tsx` pattern.
- **FR28:** The loader stories render under the project's Storybook a11y and docs addons so the
  preview doubles as an accessibility surface (roles, accessible names, and reduced-motion behavior
  are inspectable), and `make storybook-build` succeeds with the loader family included.

## Non-Functional Requirements

NFR ids are canonical and reused downstream.

### Layout Stability

- **NFR1:** No loader introduces layout shift on desktop or mobile: each loader reserves the exact
  box of the content it represents, and the submit area's bounding box is geometrically identical
  before vs. during the `submitting` state (no 70px sibling appears/disappears). Cumulative Layout
  Shift contribution from loaders is zero.

### Performance & Dependencies (Auth Lighthouse Budget)

- **NFR2:** All loader code on the auth critical path is pure CSS (Emotion `keyframes`/`sx`), adds
  no new runtime dependency, and adds no new eager import on the auth paint path; mobile Lighthouse
  performance stays at or above the CI threshold. No loader animates `box-shadow` on a loop (FR4a),
  so the auth paint path carries no per-frame blurred-shadow repaint.
- **NFR3:** L4 and L5 are excluded from the auth critical paint path (L4 opt-in only on non-critical
  boundaries; L5 unused), so the family ships without regressing the auth budget.

### Accessibility (WCAG 2.1 AA)

- **NFR4 (1.4.3 Contrast Minimum):** No loader or loading-state control renders text below 4.5:1;
  the submitting label is `#404142` on `#C7CDD6` (6.40:1) and the white-on-`#E1E7EA` defect is
  removed.
- **NFR5 (1.4.11 Non-Text Contrast):** Each loading control's perceivable boundary meets ≥3:1. The
  boundary-defining edge for L2 is the **border against the white card** (`#969B9D` on `#FFFFFF` =
  **2.81:1**, computed by the WCAG relative-luminance formula). **This FAILS the 3:1 requirement.**
  The previously cited 3.04:1 is incorrect. The inner border-vs-track edge (`#969B9D` on the
  `#C7CDD6` track) is even lower and is **not** the boundary-defining edge. Therefore the L2
  boundary MUST be remediated to reach ≥3:1 on **both** the white card and the `#C7CDD6` track
  before it can be claimed as passing — by darkening the border to a token computed against
  `#404142`/`text.secondary` candidates (re-verify the chosen value on both `#FFFFFF` and
  `#C7CDD6`), or by relying on a different perceivable-boundary mechanism that demonstrably reaches
  3:1. The acceptance check for NFR5/FR5 is the recomputed ratio on both adjacent surfaces, not the
  original figure.
- **NFR6 (2.2.2 Pause, Stop, Hide):** No loader runs auto-playing looping motion that cannot be
  stopped; honoring `prefers-reduced-motion` (NFR8) provides the stop/hide mechanism.
- **NFR7 (2.3.3 Animation from Interactions):** Motion triggered around interactions (submit,
  switch) is suppressed under reduced motion.
- **NFR8 (reduced motion):** Under `prefers-reduced-motion: reduce` no loader animation is
  `infinite` and no L5 `transition` runs; the static-affordance behavior of FR13/FR14 holds across
  all three coordination points (shimmer, pulse/glow, L5 transition).
- **NFR9 (4.1.2 Name, Role, Value):** Every interactive loading control exposes a correct
  name/role/value; decorative visuals expose none (FR17); the submit button keeps its name and a
  focusable role throughout (FR9/FR11), and carries no `aria-live` itself (FR19a).
- **NFR10 (4.1.3 Status Messages):** Loading state changes are conveyed via a single polite status
  region per loading region (mounted empty up-front, never nested inside another live region)
  without moving focus during loading, with deterministic focus only on settle (FR15, FR16, FR19,
  FR22, FR26).

### Code Quality Gates

- **NFR11 (jscpd / DRY):** No copy-pasted clone at or above the gate threshold (`minTokens 75`,
  `minLines 5`, `threshold 0`) exists across the loader files. The ≥75-token motion block lives only
  in the FR1 shared source, **and** the submit/button breakpoint-geometry ladder lives only in the
  FR2a shared fragment (the verified `ui-skeleton-button` ladder is itself ~75+ tokens over 5+
  lines, so re-declaring it across L1/L2 would trip the gate). The DRY single-definition list
  explicitly includes: the shimmer motion block, the visually-hidden CSS, and the FR2a breakpoint
  ladder. `make lint-dup` is run after the shared-foundation step (before authoring the loader
  folders) per the architecture's first-implementation-step guidance. The gate is satisfied by
  deduplication, never by ignore/suppress directives.
- **NFR12 (rca metrics):** Every new/changed file stays within the rca policy (function cyclomatic
  ≤10, cognitive ≤15, args ≤3, exit points ≤3, function LLOC ≤10, ≤10 functions per file counting
  closures/component bodies/hooks, file LLOC ≤120); loader params are grouped into typed option
  objects, the `UIButton` `loading` branch (FR9b) stays within these limits, and each loader lives
  in its own folder.

### Testing & Cross-Platform

- **NFR13 (unit/integration coverage):** `make test-unit-client` passes with new assertions for
  `role="status"` (including the empty-mounted-up-front node and single-utterance-per-submit
  checks), `aria-busy` (scoped per FR16a), the `aria-disabled`-not-`disabled` submit semantics with
  `disabled`/`loading` decoupled (FR9a), the retry double-fire guard (FR10), zero nested live
  regions on the retry path (FR22), deterministic focus on settle (FR26), and the removal of the
  `CircularProgress`/region-landmark; all selectors are semantic (no `data-testid`, per NFR15).
  Reduced-motion is **not** asserted via a JS "static-branch" check in jsdom (see NFR17).
- **NFR14 (visual coverage):** `make test-visual` passes with intentionally regenerated snapshots
  for the auth skeleton (L1), the authentication form submit state (L2), and the
  registration-notification retry state across the existing viewport and browser matrix (chromium,
  firefox, webkit; mobile and desktop). Because the default harness forces
  `emulateMedia({ reducedMotion: 'reduce' })` (`tests/visual/take-visual-snapshot.ts:59`), these
  baselines capture the **static** affordance; the **animated** shimmer is covered by the dedicated
  non-reduced-motion project in NFR17. Regenerating these baselines after the source media query
  lands does not change their meaning (they were already reduced-motion).
- **NFR15 (selectors):** Source ships no `data-testid` (ESLint error in `src/**`); all tests locate
  loaders by `getByRole('status' | 'alert' | 'button' | 'progressbar')`, `getByText`, and
  `queryByRole(..., { hidden })`.

### i18n Completeness

- **NFR16:** Every new loading/announcement string exists in both `en.json` and `uk.json`; keys live
  in source module i18n JSON (the module i18n files are generated).

### Reduced-Motion Verification Mechanism (coherent, single strategy)

- **NFR17:** Reduced motion is implemented as **CSS-only** via the shared `REDUCED_MOTION_QUERY`
  block (FR13). jsdom does **not** evaluate media queries or compute styles from them, and no
  `window.matchMedia` mock exists in the repo, so there is **no JS-observable "static branch"** to
  assert in a unit test — every prior "jsdom static-branch assertion" claim is dropped.
  Reduced-motion behavior is verified **only** at two levels:
  - **Playwright reduced-motion project (authoritative):** under
    `emulateMedia({ reducedMotion: 'reduce' })`, assert each loader's computed
    `animation-iteration-count` is never `infinite` and L5's computed `transition` is `none`. This
    visual/computed-style project is the real proof of FR13/FR14/NFR8.
  - **Playwright non-reduced-motion project (animation coverage):** a separate project that does
    **not** emulate reduced motion, so the shimmer/pulse animated branch is actually exercised and
    snapshotted (without it, the forced reduced-motion harness would give the animated path zero
    coverage). This project enumerates **every** `@keyframes`/animation in the family (the shimmer
    base, the L3 opacity keyframe, and the FR4a glow overlay) and asserts each is running when
    reduced motion is off, and disabled when it is on.
  - **jsdom unit level (at most):** may assert that the static SX object/class is present in the
    rendered `style`/`sx` prop only insofar as the reduced-motion rule is a JS-inspectable key; it
    does **not** assert a runtime-resolved media match. No `matchMedia` mock is added (it would be
    inert because nothing in the CSS-only design reads `matchMedia`).

## Acceptance Criteria

Each issue #48 acceptance criterion (AC) is mapped to the FRs/NFRs that satisfy it, plus an explicit
"done" check.

### Issue AC1 — "New loader is used at all identified loader usage points"

- **Satisfied by:** FR20 (migrate the one existing spinner), FR21 (delete dead duplicate; L1 on the
  canonical fallback), FR22 (instrument the silent switcher and retry), FR23 (no `CircularProgress`
  remains; critical-path fallbacks kept); G1. The "identified usage points" are the Loader Usage
  Inventory table, derived from grep over `src/`, not from any external audit document.
- **Done when:** the submit dual-pattern (both forms) uses L2; the auth page skeleton uses L1 with
  the dead-code duplicate deleted; the switcher uses L3; the retry conveys pending via `aria-busy`
  with no nested live region; no auth-path `CircularProgress` remains; a code audit/grep finds zero
  un-instrumented inventoried usage points.

### Issue AC2 — "No layout shifts or visible regressions on desktop and mobile"

- **Satisfied by:** NFR1 (no layout shift), FR5 (in-place morph, spinner removed), NFR14
  (regenerated cross-browser desktop+mobile snapshots).
- **Done when:** a Playwright bounding-box assertion shows the submit area is geometry-identical
  with `submitting` toggled; `make test-visual` passes on the full matrix with intended snapshots
  only.

### Issue AC3 — "Reduced-motion users receive simplified/non-animated behavior"

- **Satisfied by:** FR13, FR14 (three-point reduced-motion contract + per-loader static affordance),
  FR23a (reduced-motion SR floor); NFR6, NFR7, NFR8, NFR17.
- **Done when:** under `prefers-reduced-motion: reduce`, every loader's computed
  `animation-iteration-count` is never `infinite` and L5's `transition` is `none` (Playwright
  reduced-motion project; **no** jsdom static-branch claim), L5 jumps to value, and the animated
  branch is independently covered by the non-reduced-motion project (NFR17).

### Issue AC4 — "Relevant tests pass (make test-unit-client, make test-visual)"

- **Satisfied by:** NFR13, NFR14, NFR15, NFR17.
- **Done when:** `make test-unit-client` and `make test-visual` are green in CI with the new
  a11y/reduced-motion/contrast assertions and regenerated snapshots, including the separate animated
  (non-reduced-motion) visual project.

### Issue task coverage (cross-check)

- "Audit all current loader usage points" → the Loader Usage Inventory table (re-derived from
  `src/`), reflected in FR20–FR23.
- "Define animation parameters (timing, easing, sizing, color)" → FR1 tokens, FR2a ladder, FR4–FR8
  per-type motion/sizing/color.
- "Implement in shared UI component(s)" → FR1, FR2, FR2a, FR3, FR9b.
- "Add reduced-motion via prefers-reduced-motion" → FR13, FR14, NFR17.
- "Ensure accessible semantics where loaders communicate pending state" → FR15– FR19a, FR22, FR26,
  NFR4, NFR5, NFR9, NFR10.
- "Migrate existing loader usages" → FR20 (the single spinner) + FR21 (dead-code deletion); the
  switcher/retry are **new instrumentation** (FR22), not migrations.
- "Update unit tests and visual snapshots" → NFR13, NFR14, NFR15, NFR17.

### Per-FR acceptance checks

| FR        | Acceptance check (testable)                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FR1       | Shared tokens + `REDUCED_MOTION_QUERY` + `motionSafeShimmer` + `LoaderMotion.shape` exported from `skeletons/base/`.                                   |
| FR2       | jscpd reports zero loader-file motion clones ≥75 tokens (NFR11).                                                                                       |
| FR2a      | The breakpoint ladder is declared once under `base/` and spread by L1/L2; jscpd finds no ladder clone.                                                 |
| FR3       | Five `UI*` loader folders exist, each `index.tsx`+`styles.ts`+`types.ts`.                                                                              |
| FR4 (L1)  | Placeholder mirrors form layout; rows stagger; mounts on the `auth/index.tsx:16` fallback.                                                             |
| FR4a      | No looping `box-shadow` animation; any glow is an opacity-animated overlay over a static shadow.                                                       |
| FR5 (L2)  | Submitting button is a `#C7CDD6` shimmer track, label kept, no spinner; boundary recomputed to ≥3:1 on both card and track (NFR5).                     |
| FR6 (L3)  | Three pulsing `#969B9D` dots render on switcher loading.                                                                                               |
| FR7 (L4)  | Section veil renders only on opted-in non-critical boundary; absent on auth critical path.                                                             |
| FR8 (L5)  | Determinate bar with `role="progressbar"` + value attrs; solid `scaleX` fill; riding glow on a separate non-scaled clipped overlay; unused by default. |
| FR9       | Submitting button has `aria-disabled="true"`, `aria-busy="true"`, not `disabled`, focusable.                                                           |
| FR9a      | `SubmitControls` sets native `disabled` from `isSubmitDisabled` only; `submitting` routed via `loading=`, never OR-combined.                           |
| FR9b      | `UIButton loading` swaps to the L2 surface, strips native `disabled`, keeps `type="submit"` focusable, stays within rca limits.                        |
| FR10      | Triggering submit twice while in flight invokes `onSubmit` once; retry cannot double-fire.                                                             |
| FR11      | `getByRole('button', { name: /signing up/i })` resolves during submit; status uses the distinct `*_status` key, not the label key.                     |
| FR12      | No white-on-`#E1E7EA` text; pre-submit disabled text ≥4.5:1.                                                                                           |
| FR13      | Reduced-motion disables shimmer (L1–L4) via `REDUCED_MOTION_QUERY`; L5 separately sets `transition:none` (three points).                               |
| FR14      | Each loader shows its specified static affordance; none hidden; L5 jumps to value.                                                                     |
| FR15      | `getAllByRole('status')` length is exactly 1 per loading region; the node exists empty before loading and only its text changes.                       |
| FR16      | In-place revert toggles `aria-busy` true→false; view replacement unmounts the busy form (FR16a).                                                       |
| FR16a     | Settle ACs distinguish in-place revert (aria-busy→false) from view replacement (busy form gone, alert present).                                        |
| FR17      | `queryByRole('progressbar')` is null for L1–L4; non-null only for L5.                                                                                  |
| FR18      | `queryByRole('region', { name: /loading authentication form/i })` is null; status present.                                                             |
| FR19      | Onset announced immediately (no debounce); only the clear is debounced; either loading status or settle alert is spoken for any duration.              |
| FR19a     | Exactly one loading announcement per submit; the button carries no `aria-live`.                                                                        |
| FR20      | Both forms' submit uses L2; the one `CircularProgress` is removed.                                                                                     |
| FR21      | The module-local `auth-skeleton` re-export is deleted; grep confirms zero importers existed.                                                           |
| FR22      | `queryAllByRole('status')` inside the error-view alert returns 0; zero nested `aria-live` regions; switcher has its own status.                        |
| FR23      | Grep finds no auth-path `CircularProgress`; critical-path fallbacks unchanged.                                                                         |
| FR23a     | For a real (non-instant) submission the loading status is announced exactly once, including under reduced motion.                                      |
| FR26      | After settle, `document.activeElement` is the alert container or the restored submit control, never `body`.                                            |
| FR24–FR25 | Each new key present in both `en.json` and `uk.json`; visible-label and status keys are distinct.                                                      |

## Success Metrics

- **M1 — Usage coverage:** 100% of inventoried usage points handled (one spinner migrated to L2,
  dead duplicate deleted, switcher on L3, retry on `aria-busy`); zero auth-path `CircularProgress`;
  one canonical `auth-skeleton`. \*(code audit
  - grep.)\*
- **M2 — Zero CLS:** loaders contribute 0 to Cumulative Layout Shift on desktop and mobile;
  submit-area bounding box byte-identical with `submitting` toggled. _(Playwright bounding-box +
  Lighthouse CLS.)_
- **M3 — WCAG conformance:** the L2 boundary is recomputed to **≥3:1 on both the white card and the
  `#C7CDD6` track** before being claimed as passing (the original 3.04:1 figure was wrong; `#969B9D`
  on white is **2.81:1**, a fail — see NFR5); submitting label 6.40:1 (≥4.5:1); exactly one
  `role="status"` per region with no nested live regions; correct `aria-busy` and `aria-hidden`;
  focus-safe `aria-disabled` with deterministic focus on settle. \*(axe/Playwright
  - RTL semantic assertions + recomputed-contrast checks on both adjacent surfaces.)\*
- **M4 — Reduced motion:** every loader non-`infinite` and L5 `transition:none` under
  `prefers-reduced-motion: reduce`; L5 jumps to value. Verified by the Playwright reduced-motion
  project; the animated branch is covered by the separate non-reduced-motion project. **No jsdom
  static-branch assertion** is used (NFR17). _(Playwright reduced-motion + non-reduced-motion
  projects.)_
- **M5 — Auth budget held:** mobile Lighthouse performance at/above the CI threshold; no new eager
  imports/deps on the auth path; no looping `box-shadow` repaint on the auth path. _(CI
  Lighthouse.)_
- **M6 — Test/visual coverage green:** `make test-unit-client` and `make test-visual` pass with the
  new assertions and regenerated snapshots, including the animated visual project. _(CI.)_
- **M7 — Gates green:** jscpd (including the shared breakpoint ladder), rca, and the
  no-`data-testid` selector gate all pass. _(`make lint-dup`, `make lint-metrics`, ESLint.)_

## Dependencies

- **Existing skeleton system** (`src/components/skeletons/base/styles.ts`,
  `ui-skeleton-block/input/text/button`, `auth-skeleton`) — the foundation extended by FR1/FR2/FR2a;
  the 57px skeleton button radius already matches the real submit button radius (low-risk L2 morph).
  The `ui-skeleton-button` breakpoint ladder becomes the shared FR2a fragment.
- **`SubmitControls`** in `src/components/ui-form/index.tsx` and its consumers
  (`registration-form.tsx`, `login-form.tsx`, `registration-error-view.tsx`) — the integration
  points for L2 (FR5, FR20), the `disabled`/`loading` decoupling (FR9a), and the focusable-submit
  semantics (FR9–FR11).
- **`UIButton`** (`src/components/ui-button/index.tsx`, a `forwardRef` wrapping MUI `<Button>` via
  `cloneElement` inside a local `ThemeProvider`) and its theme (`src/components/ui-button/theme.ts`)
  — the `loading` surface swap (FR9b) and the contrast fix (FR12, the `:disabled` styling).
- **`registration-error-view`** (`registration-error-view.tsx`, retry button at line 72 inside the
  `role="alert"` container at line 97) — the no-nested-live- region constraint (FR22) and the retry
  re-entrancy guard (FR10).
- **Auth i18n** (`src/modules/user/features/auth/i18n/{en,uk}.json`) — new keys (FR24, FR25); module
  i18n files are generated, so keys live in source JSON.
- **Existing alert semantics** (`role="alert" aria-live="polite"` in registration success/error
  views; assertive auth-error-boundary) — the hand-off + focus target for FR19/FR26 and the existing
  live-region owner on the retry path (FR22).
- **Visual harness** (`tests/visual/take-visual-snapshot.ts:59`,
  `emulateMedia({ reducedMotion: 'reduce' })`) — already forces reduced motion; drives the
  NFR14/NFR17 split between static baselines and the dedicated animated project.
- **CI gates** — auth mobile Lighthouse budget, jscpd (`.jscpd.json`), rca
  (`config/metrics-policy.json` / `make lint-metrics`), ESLint no-`data-testid`,
  `make test-unit-client`, `make test-visual`.

## Risks

- **R1 — L2 reads as "merely disabled," missing user intent.** _Mitigation:_ lift the track to
  `#C7CDD6` (not `#E1E7EA`), reach a **verified ≥3:1** border on both the white card and the track
  (NFR5 — the original 3.04:1 was wrong; `#969B9D` on white is 2.81:1, so darken the border), keep
  the visible label, run a forward shimmer (FR5, NFR4, NFR5).
- **R2 — Visual regression / layout shift on the auth flow.** _Mitigation:_ reserve every box, morph
  L2 in place with the 70px spinner removed, assert byte-identical geometry, regenerate snapshots
  intentionally (NFR1, NFR14).
- **R3 — jscpd failure from repeated shimmer styles or the breakpoint ladder across files.**
  _Mitigation:_ single `motionSafeShimmer` + `LoaderMotion.shape` **and** a single shared FR2a
  breakpoint-ladder fragment; per-loader files carry only divergent geometry; run `make lint-dup`
  after the shared-foundation step (FR1, FR2, FR2a, NFR11).
- **R4 — rca failure (functions-per-file / args / LLOC), incl. the `UIButton` `loading` branch.**
  _Mitigation:_ one folder per loader, grouped option objects, helpers in their own files, keep the
  `UIButton loading` branch within limits (FR3, FR9b, NFR12).
- **R5 — Auth Lighthouse regression.** _Mitigation:_ pure CSS, no new deps/eager imports; **no
  looping `box-shadow` repaint** (FR4a); L4 off-critical, L5 unused (NFR2, NFR3).
- **R6 — Reduced motion leaks (a loop survives).** _Mitigation:_ enforce the three coordination
  points (shimmer base, the FR4a glow overlay + L3 opacity keyframe, and L5's `transition:none`);
  enumerate **every** keyframe/animation and assert each is disabled under reduced motion via the
  Playwright projects — not a jsdom static branch (FR13, NFR8, NFR17, M4).
- **R7 — Screen-reader spam / double announcement / nested live regions.** _Mitigation:_ exactly one
  `role="status"` per region, mounted empty up-front; the retry path uses `aria-busy` only (no
  status nested in the existing alert); onset announced once with no `aria-live` on the button;
  removed L1 landmark; suppressed `progressbar` on decorative loaders (FR15, FR17, FR18, FR19,
  FR19a, FR22).
- **R8 — i18n drift (key in one locale only).** _Mitigation:_ add every key to both locales in the
  same change (FR24, FR25, NFR16).
- **R9 — Migrating both forms breaks existing submit/disabled tests.** _Mitigation:_ update
  `ui-form` tests to the decoupled `disabled`/`loading` + `aria-disabled` + `role="status"`
  semantics; keep the pre-submit genuinely-disabled path working (FR9, FR9a, FR12, NFR13).
- **R10 — Focusable submitting/retry button enables double submission.** _Mitigation:_ guard
  **both** the submit handler and the retry handler with an in-flight early-return (FR10, FR9b).
- **R11 — Focus drops to `body` on settle.** _Mitigation:_ deterministic focus to the `role="alert"`
  view on replacement, or to the restored button on revert (FR26).
- **R12 — Fast submit drops the only SR signal (esp. under reduced motion).** _Mitigation:_ announce
  onset immediately, debounce only the clear, guarantee either the loading status or the settle
  alert is always spoken; persistent `aria-busy` + empty-mounted status as a debounce-independent
  signal (FR19, FR23a).

## Out of Scope

- Large UX redesigns unrelated to loader behavior (replacing flows with full skeleton screens;
  restructuring auth/registration UX) — per issue #48. Adding an accessible pending cue to the
  already-existing switcher and retry waits (FR22) is loader behavior, not such a redesign.
- Re-architecting forms, routing, or data layer beyond loader migration and the
  `SubmitControls`/`UIButton` `loading` decoupling required for FR9/FR9a/FR9b.
- Building a new determinate-percentage flow; L5 ships as a reserved primitive with no wired
  consumer (FR8).
- Forcing a visible L4 veil onto critical-path Suspense boundaries; the auth critical-path fallbacks
  stay `null`/`aria-hidden` (FR7, FR23, NFR3).
- New animation libraries or any new eager dependency on the auth paint path (NFR2).
- Brand-tinted shimmer, additional CRM-surface loaders (lists/dashboards), and the first L4/L5
  production consumers — future vision, not this PRD.
