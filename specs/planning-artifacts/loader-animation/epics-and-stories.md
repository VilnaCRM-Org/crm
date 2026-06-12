---
status: 'complete'
workflowType: 'epics'
project_name: 'crm'
date: '2026-06-11'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/48'
inputDocuments:
  - 'specs/planning-artifacts/loader-animation/prd.md'
  - 'specs/planning-artifacts/loader-animation/ux-design.md'
  - 'specs/planning-artifacts/loader-animation/architecture.md'
  - 'https://github.com/VilnaCRM-Org/crm/issues/48'
  - 'src/components/ui-form/index.tsx'
  - 'src/components/ui-button/index.tsx'
  - 'src/components/ui-button/theme.ts'
  - 'src/components/skeletons/base/styles.ts'
  - 'src/components/skeletons/auth-skeleton/styles.ts'
  - 'src/components/skeletons/ui-skeleton-button/styles.ts'
  - 'src/modules/user/features/auth/index.tsx'
  - 'src/modules/user/features/auth/components/auth-skeleton/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx'
  - 'tests/visual/take-visual-snapshot.ts'
---

# crm - Epic Breakdown: Loader Animation Redesign (Issue #48)

## Overview

This document provides the complete epic and story breakdown for the loader animation redesign,
decomposing the requirements from the PRD (FR1–FR25, NFR1–NFR16), the UX Design Specification
(UXAC1–UXAC10, L1–L5 spec cards), and the Architecture Decision Document (file deltas,
DRY/metrics/perf strategy) into implementable stories.

The change replaces the CRM's fragmented loading experience with a single skeleton-based loader
family of five types (L1–L5) sharing one CSS-shimmer motion source. The headline behavior is the
**submit-button-as-loader (L2)**: the pressed submit button morphs in place into a fairly-visible
shimmering skeleton track instead of a flat disabled rectangle plus a detached 70px spinner.

Every story is right-sized to respect the rust-code-analysis (rca) per-file metric caps (≤10
functions/file, file LLOC ≤120, function LLOC ≤10, args ≤3, exit points ≤3), the jscpd DRY gate
(`minTokens 75`, `threshold 0`), the no-`data-testid` selector rule, and the auth mobile Lighthouse
budget. All acceptance criteria use semantic queries only.

## Verified Source Inventory (replaces the never-produced loader audit)

The five loader planning documents originally cited as inputs (`loader-usage-audit.md`,
`loader-taxonomy.md`, `loader-token-reference.md`, `loader-accessibility-requirements.md`,
`loader-contrast-analysis.md`) were never produced — they do not exist in
`specs/planning-artifacts/`. To keep AC1 ("used at all identified loader usage points") traceable to
verifiable evidence, the usage-point inventory is re-derived directly from source and folded inline
here. Every claim below was checked against the listed file paths.

### Existing loaders to migrate (real, in-flight today)

| ID  | Site                    | Verified fact                                                                                                                                                                                                     | Action                                                  |
| --- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| EX1 | `ui-form/index.tsx:116` | The **only** spinner in all of `src/`: one `<CircularProgress size={70}>` rendered beside the disabled submit button. `grep` for `CircularProgress`/`role="progressbar"` across `src/` returns this single match. | Replace with the in-place L2 morph; delete the spinner. |

This is the entire set of "existing loader usages to migrate." AC1's "migrate existing loader
usages" therefore reduces to **removing exactly one spinner**, not four.

### Silent waits to newly instrument (no loader exists there today)

| ID  | Site                                            | Verified fact                                                                                                                                                                  | Action                                                                                    |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| NW1 | `form-section/index.tsx` switcher loading state | Today the switcher only goes `disabled`; there is **no** spinner/loader.                                                                                                       | **Add** an L3 inline loader where none existed.                                           |
| NW2 | `registration-error-view.tsx` retry button      | The retry button (`ErrorButtons` → `UIButton`) only goes `disabled`; **no** loader today. The button is nested inside a `role="alert" aria-live="polite"` container (line 97). | **Add** an L2 loading affordance, but with no nested live region (see FR22a/Story 4.2).   |
| NW3 | Auth page-load skeleton                         | `auth/index.tsx:16` already renders `<AuthSkeleton/>` as the Suspense fallback.                                                                                                | Migrate to L1 wiring + remove the landmark (this is an existing skeleton, not a spinner). |

These three are **new loader additions / re-wirings**, not migrations of pre-existing loaders.
Justification against issue #48 "out of scope" ("large UX redesigns unrelated to loader behavior"):
each addition instruments an **existing** loading state that the user can already trigger (switching
forms, retrying, lazy-chunk load) and that today gives ambiguous or no feedback — directly serving
the user's stated intent ("the user clearly understands something is happening"). No new flow,
screen, or interaction is introduced. Adding a perceivable, accessible cue to an already-silent wait
is loader behavior, not a UX redesign of the flow.

### Duplicate auth-skeleton: dead code, not a live migration

The module-local folder `src/modules/user/features/auth/components/auth-skeleton/` is a thin
re-export of `@/components/skeletons/auth-skeleton` with **zero importers** — `grep` finds none, and
`src/modules/user/features/auth/index.tsx` already imports the canonical
`@/components/skeletons/auth-skeleton` directly. It is therefore a **dead-code deletion**, not a
repoint-importers-then-delete migration (see FR21/Story 4.4).

### Existing test-harness reduced-motion emulation (must be accounted for)

`tests/visual/take-visual-snapshot.ts:59` calls
`page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' })` and line 68 sets
`animations: 'disabled'`; every auth/skeleton/registration visual spec runs through this helper.
Consequences the plan must honor:

- The existing L1 auth-skeleton baselines already capture the **static** state. They are not
  "animated shimmer" baselines.
- Once the single `@media (prefers-reduced-motion: reduce)` rule lands, these snapshots shift to the
  static fallback — the meaning of existing baselines changes, so they must be intentionally
  regenerated.
- The current harness **cannot** observe the animated shimmer. Any verification of the animated
  branch needs a **separate, non-reduced-motion visual project** that does not set
  `reducedMotion: 'reduce'` / `animations: 'disabled'` (see Story 5.4a).

## Requirements Inventory

### Functional Requirements

FR1: The repository provides a single shared source of loader motion in
`src/components/skeletons/base/`, exposing named timing tokens (`SHIMMER_DURATION`,
`PULSE_DURATION`, `STAGGER_STEP`, `MOTION_EASING`, `MOTION_ITERATION`), a `motionSafeShimmer` base
style, and a `LoaderMotion.shape({ width, height, borderRadius })` geometry factory, so no loader
re-declares the shimmer keyframe, gradient, or timing. FR2: All five loader types (L1–L5) derive
their motion from the FR1 shared source via base-plus-geometry-override composition; no loader
`styles.ts` contains a duplicated motion block. FR3: The loader family is delivered as five `UI*`
components, each in its own folder (`index.tsx` + `styles.ts` + `types.ts`): `UISkeletonPlaceholder`
(L1), `UISubmitLoadingButton` (L2), `UIInlineLoader` (L3), `UISectionLoader` (L4), and
`UIProgressBar` (L5). FR4: L1 `UISkeletonPlaceholder` mirrors the final form layout (title,
subtitle, three field rows, submit button, divider, four social buttons, switcher) using the shimmer
base with a per-row `STAGGER_STEP` cascade. Trigger: the lazy `FormSection` chunk resolving at
`src/modules/user/features/auth/index.tsx:16`. FR5: L2 `UISubmitLoadingButton` makes the submit
button become a skeleton-gray shimmering track in place within its own reserved box (57px radius):
track fill `#C7CDD6`, a 1px `#6E7375` boundary (≥3:1 on both the `#FFFFFF` card and the `#C7CDD6`
track — see NFR5), retained submitting label in `#404142`, left-to-right shimmer sweep; the separate
`size={70}` `CircularProgress` is removed. Trigger: `submitting` true in `SubmitControls`, used by
both forms and the retry button. FR6: L3 `UIInlineLoader` is a small three-dot indeterminate
indicator animating `opacity` on the `PULSE_DURATION` band with a `STAGGER_STEP` travel, dots
colored `#969B9D`. Trigger: the login/register switcher loading state and small inline waits. FR7:
L4 `UISectionLoader` is an opt-in region/overlay shimmer veil sized to fill a section's reserved
box; it MUST NOT be placed on the auth critical-path Suspense boundaries (which keep
`fallback={null}`), and MUST NOT be imported by `index.tsx`, `app.tsx`, or `auth/index.tsx`. FR8: L5
`UIProgressBar` is a reserved determinate bar whose fill is driven by a real `0–100` value via
`transform: scaleX()` with `linear` easing, track `#E1E7EA`, fill `#1EAEFF`, with any percentage
label rendered adjacent (never on the fill); it ships with no consumer wired and MUST NOT be used
for indeterminate auth submit. FR9: While submitting, the registration (and login) submit button
uses `aria-disabled="true"` + `aria-busy="true"` and NOT the native HTML `disabled` attribute,
keeping it focusable and `type="submit"`; the pre-submit-disabled state (`isSubmitDisabled`) MAY
keep native `disabled`. FR10: Every focusable `aria-disabled` submit/retry control early-returns
(no-op) when a submission is already in flight, so retaining focusability via FR9 cannot cause a
double submission. The guard holds for both the form submit path (`buildSubmitHandler` in `ui-form`)
and the retry path (`registration-error-view`). FR11: The submit button retains a non-empty
accessible name throughout the transition: the visible label swaps from the submit key to the
submitting key (`sign_up.form.submit_button` → `sign_up.form.submitting`) and that text remains
present. FR12: The existing `:disabled` `UIButton` styling that renders white text (`#FFFFFF`) on
`#E1E7EA` is removed; the genuinely-disabled pre-submit text is remediated to `#404142` on `#E1E7EA`
(≥4.5:1). FR13: A single shared reduced-motion mechanism is defined once in the FR1 source and
referenced by all five loaders. Because three looping animations live outside the shimmer base (the
box-shadow wrapper pulse, L3's opacity pulse, L5's `scaleX` transition), the reduced-motion contract
is applied at **three coordination points** (see NFR8) — not a single inherited rule — and the net
guarantee is that no loader animation is `infinite`/looping under `prefers-reduced-motion: reduce`
and every loader's `animation`/`transition` resolves to `none`. FR14: Under reduced motion each
loader renders a clear, perceivable static affordance: L1/L4 static gray fills; L2 static `#C7CDD6`
fill retaining `#6E7375` border and label; L3 three static `#969B9D` dots at full opacity; L5 jumps
directly to its current value with `transition: none`. No loader is hidden (no transparent/`none`
fill). FR15: Each loading region that has **no existing live-region owner** exposes exactly one
element with `role="status"` + `aria-live="polite"` carrying a meaningful (visually-hidden where
appropriate) message; never more than one status owner per region. A region that already has a
live-region owner (e.g. a `role="alert"` container) MUST NOT gain a nested `role="status"` (see
FR22a). FR16: The container that wraps each loading region sets `aria-busy="true"` while pending and
`aria-busy="false"` when content remains in place and settles; for L2 the form/submit-area wrapper
toggles `aria-busy` with `submitting` on the **in-place revert** path. On the **view-replacement**
path (success/error) the busy container is unmounted and replaced by the `role="alert"` view, so
`aria-busy="false"` is asserted only where the container survives (see Story 3.2 / Story 5.1). FR17:
All decorative shimmer/pulse/spinner visuals carry `aria-hidden="true"` and no `role`; the removed
`CircularProgress` no longer exposes `role="progressbar"`. L5 is the only member that exposes
`role="progressbar"` with `aria-valuenow`/`min`/`max` and an accessible name. FR18: L1 no longer
renders a region landmark for decorative loading content: the auth-skeleton root is a non-landmark
container (not `<section aria-label=…>`) that holds the single FR15 status owner. FR19: The loading
announcement updates only on a genuine idle→loading transition and is announced **exactly once** per
real episode; a debounce (~150–300ms) suppresses duplicate/flicker announcements but never
suppresses the initial loading utterance for a genuine (non-instant) submission. It uses
`aria-live="polite"`, and on settle hands off to the existing `role="alert"` success/error views and
clears. FR20: The L2 submit state replaces the `SubmitControls`
disabled-button-plus-`size={70}`-`CircularProgress` pattern (`ui-form/index.tsx:116`) for both the
registration form and the login form. FR21: The L1 placeholder replaces the `AuthSkeleton` Suspense
fallback (`auth/index.tsx:16`), and the **dead** duplicate auth-skeleton re-export at
`src/modules/user/features/auth/components/auth-skeleton/` — which has zero importers — is deleted.
No importer repointing is required because none exist. FR22: The L3 inline loader is added to the
previously-silent login/register switcher loading state (`form-section/index.tsx`), and the
registration retry button (`registration-error-view.tsx`) gains an L2 loading affordance. FR22a: On
the retry path the enclosing `role="alert" aria-live="polite"` container
(`registration-error-view.tsx:97`) is already the single live-region owner. The retry loading state
MUST NOT introduce a nested `role="status"`/`UILoaderStatus`; the pending state is conveyed by
`aria-busy` on the retry button (and the alert's existing content), keeping exactly one live-region
owner per region. FR23: No auth-path loader uses MUI `CircularProgress` after migration (the single
`ui-form/index.tsx:116` spinner is removed), and the intentionally-minimal critical-path Suspense
fallbacks (`index.tsx:27`, `app.tsx:40`, the `form-section` login `aria-hidden` fallback) remain
unchanged. L4/L5 MUST NOT be imported on the auth critical path. FR24: A new submit-status key
(`sign_up.form.submitting_status` and the login analogue) is added to both `en.json` and `uk.json`,
distinct from the visible button label key. FR25: A switcher loading key (`auth.switching_form`) and
any generic loading copy used by L1/L3/L4 status regions are added to both `en.json` and `uk.json`;
`auth.loadingForm` is reused for L1. No new loading string ships in only one locale. FR26: Focus is
managed across the loading→settle boundary. If the focused submit/retry control is removed or
replaced on settle, focus is programmatically moved to a deterministic target — the `role="alert"`
outcome view on success/error (so the result is read and actionable), or the restored real button on
in-place revert — and never dropped to `document.body`.

### NonFunctional Requirements

NFR1 (Layout Stability): No loader introduces layout shift; each reserves the exact box of the
content it represents; the submit area's bounding box is geometrically identical before vs. during
`submitting`. CLS contribution from loaders is zero. NFR2 (Performance): All loader code on the auth
critical path is pure CSS, adds no new runtime dependency, and adds no new eager import on the auth
paint path; mobile Lighthouse performance stays at or above the CI threshold. NFR3 (Critical-path
exclusion): L4 and L5 are excluded from the auth critical paint path (L4 opt-in only on non-critical
boundaries; L5 unused). A lint/test asserts `index.tsx`, `app.tsx`, and `auth/index.tsx` do not
import L4 or L5. NFR4 (WCAG 1.4.3 Contrast Minimum): No loader or loading-state control renders text
below 4.5:1; the submitting label is `#404142` on `#C7CDD6` (6.40:1); the white-on-`#E1E7EA` defect
is removed. NFR5 (WCAG 1.4.11 Non-Text Contrast): Each loading control's perceivable boundary meets
≥3:1 against every surface it sits on. L2 uses a `#6E7375` border, which is **4.80:1 on the
`#FFFFFF` card and 3.00:1 on the `#C7CDD6` track** — both ≥3:1. (The previously specified `#969B9D`
border is only **2.81:1 on white and 1.76:1 on the track**, failing 1.4.11, and is rejected.) NFR6
(WCAG 2.2.2 Pause/Stop/Hide): No loader runs auto-playing looping motion that cannot be stopped;
honoring `prefers-reduced-motion` provides the mechanism. NFR7 (WCAG 2.3.3 Animation from
Interactions): Motion triggered around interactions is suppressed under reduced motion. NFR8
(reduced motion — three coordination points): Under `prefers-reduced-motion: reduce` no loader
animation is `infinite` and every loader's `animation`/`transition` resolves to `none`. Because
looping motion lives in three separate style objects, the reduced-motion block is applied at all
three: (a) `motionSafeShimmer` for the shimmer boxes (L1/L2/L4 fills); (b) the same
`REDUCED_MOTION_QUERY` block on `formWrapperPulse`/the box-shadow pulse **and** on L3's opacity
keyframe; (c) `transition: none` for L5's `scaleX`. A test enumerates **every**
`@keyframes`/animation in the family and asserts each is disabled. NFR9 (WCAG 4.1.2
Name/Role/Value): Every interactive loading control exposes a correct name/role/value; decorative
visuals expose none; the submit button keeps its name and a focusable role throughout. NFR10 (WCAG
4.1.3 Status Messages): Loading state changes are conveyed via a single polite status region per
loading region without moving focus, and the status live region is mounted empty up-front (see
NFR12a) so the polite announcement fires reliably. NFR11 (jscpd / DRY): No copy-pasted clone at or
above the gate threshold (`minTokens 75`, `minLines 5`, `threshold 0`) exists across the loader
files; the ≥75-token motion block, the visually-hidden CSS, the reduced-motion query, the L2 surface
fragment, and the **submit/button breakpoint-geometry ladder** each live in exactly one place.
Satisfied by deduplication, never ignore/suppress. NFR11a (breakpoint-ladder single definition): The
`ui-skeleton-button` height/`minWidth` ladder (`3.125rem` + `19.6875rem` @375; `4.375rem`/`33.75rem`
@md; `26.375rem` @lg; `3.875rem` @xl) is itself ~75+ tokens over 5+ lines. L1's submit bar and L2's
track MUST consume that ladder from one exported fragment under `skeletons/base/` (or directly from
`ui-skeleton-button`), never re-declare it, or jscpd fails. NFR12 (rca metrics): Every new/changed
file stays within rca policy (function cyclomatic ≤10, cognitive ≤15, args ≤3, exit points ≤3,
function LLOC ≤10, ≤10 functions per file counting closures/component bodies/hooks, file LLOC ≤120);
loader params are grouped into typed option objects and each loader lives in its own folder. The
`UIButton` `loading` branch keeps its function bodies ≤10 LLOC and exits ≤3. NFR12a (live-region
mount timing): Each persistent loading region's `role="status"` node is rendered on initial render
of the host (form, switcher) **mounted empty**; only its text content changes on idle→loading and
loading→settle. The live-region element and its text are never inserted in the same commit. NFR13
(unit/integration coverage): `make test-unit-client` passes with new assertions for `role="status"`,
`aria-busy`, the reduced-motion static branch, the `aria-disabled`-not-`disabled` submit semantics,
focus management on settle, and the removal of the `CircularProgress`/region-landmark; all selectors
are semantic (no `data-testid`). NFR14 (visual coverage): `make test-visual` passes with
intentionally regenerated snapshots for the auth skeleton (L1, static), the authentication form
submit state (L2, new baseline), and the registration-notification retry state, across the existing
viewport/browser matrix (chromium, firefox, webkit; mobile and desktop). A **separate**
non-reduced-motion visual project (not using `reducedMotion: 'reduce'` / `animations: 'disabled'`)
covers the animated shimmer branch; the existing reduced-motion-emulating harness covers the static
branch. NFR15 (selectors): Source ships no `data-testid`; all tests locate loaders by
`getByRole('status' | 'alert' | 'button' | 'progressbar')`, `getByText`, and
`queryByRole(..., { hidden })`. NFR16 (i18n completeness): Every new loading/announcement string
exists in both `en.json` and `uk.json`; keys live in source module i18n JSON. A test asserts each
new key is present in both locale files.

### Additional Requirements

(From the Architecture Decision Document — technical/file-level requirements that shape story
implementation.)

- No starter template applies — this is a brownfield extension of the existing
  `src/components/skeletons/` layer (Option 1 selected; a parallel `loaders/` tree and any animation
  library/MUI `Skeleton`/`LinearProgress` were rejected for jscpd/perf reasons).
- The shared motion source is `src/components/skeletons/base/styles.ts` (additive: timing tokens,
  `shimmerAnimationValue`, `pulseAnimationValue`, `motionSafeShimmer`, `REDUCED_MOTION_QUERY`) plus
  two new files `base/loader-motion.ts` (class with static `shape()`) and
  `base/loader-motion.types.ts` (type-only `LoaderShape`), and one exported breakpoint-geometry
  ladder fragment (NFR11a).
- A shared a11y primitive folder `src/components/skeletons/ui-loader-status/` (`index.tsx` +
  `styles.ts` + `types.ts` + `use-debounced-status.ts`) is the single owner of the
  `role="status" aria-live="polite"` contract and the visually-hidden CSS (the repo has no
  visually-hidden helper today). It is mounted empty up-front per NFR12a.
- `SKELETON_BORDER_RADIUS = '57px'` already equals the real submit button radius
  (`ui-button/theme.ts` `contained.borderRadius`), so the L2 in-place morph is a drop-in.
- `UIButton` is a verified `forwardRef` that wraps MUI `<Button>` and applies `...rest` via
  `React.cloneElement` inside a local `ThemeProvider`. The new CSS-only `loading` boolean prop, when
  set, swaps the rendered surface to the L2 skeleton and applies `aria-disabled`/`aria-busy` while
  stripping native `disabled` (keeping `type="submit"` focusable). Because `aria-disabled` does
  **not** stop MUI from firing `onClick`, the double-submit guard (FR10) is load-bearing and MUST
  exist on **both** the `buildSubmitHandler` path and the retry handler. The L2 style fragment lives
  once in `ui-submit-loading-button/styles.ts` and is consumed by both `SubmitControls` and the
  retry button.
- `SubmitControls` (`ui-form/index.tsx`) refactor: remove the `CircularProgress` import + branch,
  delete the `loader` style (`ui-form/styles.ts`), split native `disabled` (pre- submit only) from
  `loading={submitting}`, add the double-submit guard inside `buildSubmitHandler`, add `aria-busy` +
  `aria-label` to the `<form>`, render one `UILoaderStatus`. `SubmitControlsProps` keeps exactly
  three fields (no new arg).
- `registration-form.tsx` and `login-form.tsx` are unchanged (they already feed
  `UIForm.isSubmitting`); the L2 morph is inherited by both forms.
- Debounce/announcement logic lives in a dedicated hook file
  (`ui-loader-status/use-debounced-status.ts`) so no consumer file exceeds the function-count cap.
- Two-auth-skeleton consolidation: the module-local re-export has zero importers, so it is deleted
  outright (no repointing step).
- The first implementation step is extending `base/styles.ts` + adding
  `loader-motion.ts(.types.ts)` + the breakpoint-ladder fragment, then verifying `make lint-dup` /
  `make lint-metrics` stay green before building the five loader folders.

### UX Design Requirements

(Extracted from the UX Design Specification and the canonical taxonomy. Each is specific enough to
drive a story with testable acceptance criteria.)

UX-DR1: One shared motion source-of-truth in `base/` exposing the named tokens, the single
`motionSafeShimmer` reduced-motion variant, the `REDUCED_MOTION_QUERY` constant, the
`LoaderMotion.shape()` factory, and the breakpoint-ladder fragment; the ≥75-token motion block and
the ladder each exist exactly once (Section 4). UX-DR2: A family-wide timing/easing scale — shimmer
`1.4s ease-in-out infinite alternate` (L1/L2/L4), pulse `1.0s` (L3, L4 glow), stagger `120ms` (L1/L4
rows, L3 dots), determinate `~200ms linear scaleX` (L5). Animate only compositable properties:
`background-position`/`opacity`/`transform: scaleX`. **`box-shadow` is removed from the
animated-property whitelist** — animating a large blur radius forces a per-frame repaint (jank/paint
risk) and is not GPU-compositable. Any glow must be the `opacity` of a pseudo-element/overlay
carrying a pre-rendered static `box-shadow`, or dropped (Section 2). UX-DR3: L1 spec — full
auth-form silhouette, per-row stagger cascade, shimmer tint `#D3D8E0`, non-landmark
`<div aria-busy>` root with one `UILoaderStatus`, reserved boxes at every breakpoint (Section 5.1).
UX-DR4: L2 spec — in-place morph in the reserved button box; track `#C7CDD6`, 1px `#6E7375` ≥3:1
border (3.00:1 on track, 4.80:1 on card), retained `#404142` 6.40:1 label, left→right sweep, no
sibling spinner; three signal channels (motion + contrast/border + text) so it reads "submitting"
not "disabled" (Section 5.2, Section 6). UX-DR5: L3 spec — three `#969B9D` dots, opacity pulse
`1.0s` with `120ms` travel, fixed reserved inline box, wrapper `role="status"`, dots `aria-hidden`
(Section 5.3). UX-DR6: L4 spec — opt-in region veil, `%`/`vh`-relative blocks, optional glow
implemented as `opacity` on a static-shadow overlay (never animated `box-shadow`), container
`aria-busy` + one status, underlying region `inert`/`aria-hidden`; excluded from auth critical path
(Section 5.4). UX-DR7: L5 spec — determinate track `#E1E7EA` + fill `#1EAEFF`, `scaleX` linear fill,
brand-tint riding glow on filled portion only, `role="progressbar"` with value attributes, adjacent
label never on the fill; reduced-motion jumps to value with `transition: none` (Section 5.5).
UX-DR8: Reduced-motion contract — three coordination points (UX Section 3, mirroring NFR8): the
shimmer base, the box-shadow/L3-opacity block, and L5's transition. Per-loader static affordance;
nothing hidden, nothing `infinite`, every `animation`/`transition` resolves to `none`. UX-DR9:
Per-type accessibility wiring — exactly one `role="status"` per region **that has no existing
live-region owner**, `aria-busy` containers, decorative `aria-hidden`, L1 landmark removed,
`progressbar` only on L5, focus-safe `aria-disabled` submit/retry, the status node mounted empty
up-front, a single debounced polite announcement handing off to `role="alert"`, and **no nested live
region** on the retry path (Section 7). UX-DR10: Contrast remediation — remove white-on-`#E1E7EA`
(1.25:1), L2 label 6.40:1, L2 border `#6E7375` ≥3:1 on both surfaces, pre-submit disabled text
`#404142` on `#E1E7EA` (≈8.6:1); never put text on brand blue (Section 6.3). UX-DR11: i18n keys —
`sign_up.form.submitting_status`, `sign_in.form.submitting_status`, `auth.switching_form`,
`common.loading` (and `common.uploading` reserved for L5) added to both `en.json` and `uk.json`;
`auth.loadingForm` reused for L1 (Section "i18n keys to add"). UX-DR12: Visual coverage — the
existing reduced-motion-emulating harness regenerates the static L1/retry baselines; a separate
non-reduced-motion project covers the animated shimmer; add a new `submitting`-state baseline for L2
across chromium/firefox/webkit · mobile/desktop and a bounding-box geometry-equality assertion
(Section "Visual").

### FR Coverage Map

FR1: E1 — Shared motion tokens + `motionSafeShimmer` + `LoaderMotion.shape` + ladder fragment in
`base/` (Story 1.1). FR2: E1, E2 — Base-plus-geometry composition (Story 1.1; reinforced by each
loader story 2.1–2.5 and verified by Story 5.5 jscpd gate). FR3: E2 — Five `UI*` loader folders
(Stories 2.1, 2.2, 2.3, 2.4, 2.5). FR4: E2 — L1 `UISkeletonPlaceholder` layout + stagger (Story
2.1); migration in E4 (Story 4.1). FR5: E3 — L2 submit-button morph (Stories 3.1, 3.2, 3.3). FR6: E2
— L3 `UIInlineLoader` (Story 2.3); migration in E4 (Story 4.2). FR7: E2 — L4 `UISectionLoader`
opt-in (Story 2.4); negative assertion in E5 (Story 5.6). FR8: E2 — L5 `UIProgressBar` determinate
(Story 2.5). FR9: E3 — `aria-disabled`-not-`disabled` focusable submit (Story 3.2). FR10: E3, E4 —
In-flight early-return guard on submit (Story 3.2) and retry (Story 4.2). FR11: E3 — Retained
accessible name / label swap (Story 3.2). FR12: E3 — `UIButton` `:disabled` contrast fix (Story
3.1). FR13: E1 — Single shared reduced-motion mechanism (Story 1.2); applied at three points in E2,
verified in E5 (Story 5.3). FR14: E1, E2 — Per-loader perceivable static affordance (Story 1.2 base;
loaders 2.1–2.5); verified Story 5.3. FR15: E1 — `UILoaderStatus` single-status owner (Story 1.3);
consumed across E2/E3/E4. FR16: E1, E3, E4 — `aria-busy` containers (Story 1.3 contract; Story 3.2
form; Story 4.1 L1 root), scoped to in-place revert vs view replacement. FR17: E2, E3 — Decorative
`aria-hidden`, no stray `progressbar` (Stories 2.1–2.5, 3.2); L5 keeps `progressbar` (Story 2.5).
FR18: E2, E4 — L1 landmark removal (Story 2.1 root change; Story 4.1 fallback migration). FR19: E1,
E3 — Debounced single polite announcement + hand-off (Story 1.3 hook; Story 3.2 submit). FR20: E4 —
L2 replaces `SubmitControls` dual pattern for both forms (Story 4.3, built on E3). FR21: E4 — L1
replaces `AuthSkeleton` fallback + dead-code deletion (Story 4.1, 4.4). FR22: E4 — L3 added to
switcher; L2 affordance added to retry (Story 4.2). FR22a: E4 — No nested live region on retry path
(Story 4.2); verified Story 5.2. FR23: E4 — No auth-path `CircularProgress`; critical-path fallbacks
unchanged; L4/L5 off the critical path (Story 4.4; negative assertion Story 5.6). FR24: E1 —
`*.submitting_status` keys in both locales (Story 1.4). FR25: E1 — `auth.switching_form` +
`common.loading`/`common.uploading` in both locales (Story 1.4). FR26: E3, E4 — Focus management on
settle (Story 3.2 submit; Story 4.2 retry); verified Story 5.1. FR27: E2, E6 — co-located Storybook
previews authored per loader (Stories 2.1–2.5) plus the consolidated preview (Story 6.1); verified
Story 6.1. FR28: E6 — Storybook a11y/docs addons render and `make storybook-build` succeeds with the
family (Story 6.1); verified Story 6.1.

## Epic List

### Epic 1: Shared Loader Foundation

Contributors get one DRY, dependency-free motion source plus the shared a11y status primitive, the
three-point reduced-motion contract, geometry + breakpoint-ladder factories, and i18n keys — so
every subsequent loader is a thin, gate-clean geometry override that inherits correct motion,
reduced-motion behavior, and announcement semantics for free. **FRs covered:** FR1, FR2, FR13, FR14
(base), FR15, FR16 (contract), FR19, FR24, FR25 **NFRs/UX-DRs:** NFR8, NFR11, NFR11a, NFR12, NFR12a,
NFR16, UX-DR1, UX-DR2, UX-DR8 (base), UX-DR9 (status primitive), UX-DR11

### Epic 2: The Five Loader Components

Developers have a complete, taxonomy-named `UI*` loader family (L1–L5), each in its own folder, each
rendering correct motion, reserved geometry, reduced-motion static affordance, and accessibility
semantics — usable in isolation (Storybook/unit) before any consumer is migrated. **FRs covered:**
FR3, FR4, FR6, FR7, FR8, FR14 (per loader), FR17, FR18 (root shape) **NFRs/UX-DRs:** NFR1, NFR3,
NFR5, NFR8, NFR9, NFR11, NFR12, UX-DR3, UX-DR5, UX-DR6, UX-DR7

### Epic 3: Registration Submit-Button Loading State (The Hero Case)

The user's primary direction: the pressed submit button visibly becomes a fairly-visible shimmering
skeleton track in place — focusable, named, contrast-fixed, double-submit-safe, focus-managed, and
announced — replacing the disabled-button-plus-70px-spinner pattern. Delivered at the
`ui-button`/`ui-form` layer so both forms and the retry button inherit it. **FRs covered:** FR5,
FR9, FR10, FR11, FR12, FR16 (form wrapper), FR19 (submit), FR26 **NFRs/UX-DRs:** NFR1, NFR2, NFR4,
NFR5, NFR9, NFR10, NFR12, UX-DR4, UX-DR10

### Epic 4: Migrate the One Existing Loader and Instrument the Silent Waits

The single existing spinner is migrated to L2, the silent switcher/retry waits are newly
instrumented (without nesting live regions), the auth page skeleton is re-wired to L1, and the dead
duplicate auth-skeleton re-export is deleted — so the loader experience is consistent with zero
auth-path `CircularProgress`, while the intentionally-minimal critical-path fallbacks stay untouched
to protect the Lighthouse budget. **FRs covered:** FR16 (L1 root), FR18 (fallback), FR20, FR21,
FR22, FR22a, FR23, FR26 **NFRs/UX-DRs:** NFR1, NFR2, NFR3, NFR16

### Epic 5: Testing, Visual Snapshots, and Reduced-Motion Coverage

The redesign is provably correct and regression-safe: semantic-query unit tests cover the new
a11y/reduced-motion/contrast/no-spinner/focus behavior, visual snapshots are intentionally
regenerated (static via the existing harness; animated via a new project), a bounding-box assertion
proves zero layout shift, negative-assertion checks fail if L4/L5 reach the critical path, and the
jscpd/rca/selector gates are green. **FRs covered:** (verification of) FR5, FR7, FR9–FR19, FR22a,
FR23, FR26; FR13/FR14 reduced motion **NFRs/UX-DRs:** NFR1, NFR3, NFR8, NFR11, NFR11a, NFR12, NFR13,
NFR14, NFR15, UX-DR12

### Epic 6: Docs, Storybook, and Cleanup/Consolidation

The loader family is documented for future contributors (Storybook stories + a loader taxonomy/usage
doc), and the migration's loose ends are cleaned up (deleted duplicate folder verified gone, no dead
`CircularProgress`/`loader`-style references, CLAUDE.md notes the family), so the redesign is
maintainable and the "choose the right loader" decision is a lookup. **FRs covered:**
(closeout/traceability of) FR3, FR7, FR8, FR21, FR23 **NFRs/UX-DRs:** NFR11, NFR12, UX-DR1–UX-DR7
(documentation of the spec cards)

## Epic 1: Shared Loader Foundation

Contributors get one DRY, dependency-free motion source plus the shared a11y status primitive, the
three-point reduced-motion contract, geometry + breakpoint-ladder factories, and i18n keys — so
every subsequent loader is a thin, gate-clean geometry override that inherits correct motion,
reduced-motion behavior, and announcement semantics for free.

### Story 1.1: Promote Motion Tokens, Add the Geometry Factory, and Extract the Ladder

As a design-system developer, I want named timing tokens, composed animation-value strings, a
`LoaderMotion.shape()` geometry factory, and one exported submit/button breakpoint-geometry ladder
defined once in `skeletons/base/`, So that all five loaders derive motion from one source, no loader
re-declares the shimmer keyframe/gradient/timing, and the breakpoint ladder reused by L1's submit
bar and L2 cannot trip jscpd.

**Acceptance Criteria:**

**Given** `src/components/skeletons/base/styles.ts` is opened **When** a developer inspects the
exports **Then** `SHIMMER_DURATION = '1.4s'`, `PULSE_DURATION = '1.0s'`, `STAGGER_STEP = '120ms'`,
`MOTION_EASING = 'ease-in-out'`, and `MOTION_ITERATION = 'infinite alternate'` are exported **And**
`shimmerAnimationValue` and `pulseAnimationValue` compose those tokens with the existing
`shimmerAnimation` / `shadowPulseAnimation` keyframes **And** `baseSkeletonStyle.animation` consumes
`shimmerAnimationValue` (no inlined `1.4s`/`1.5s` string remains in that block)

**Given** the new files `base/loader-motion.ts` and `base/loader-motion.types.ts` exist **When** a
developer inspects them **Then** `loader-motion.types.ts` is a type-only file exporting
`interface LoaderShape { width; height; borderRadius }` **And** `LoaderMotion` is a default-exported
class with a single static method `shape({ width, height, borderRadius }: LoaderShape)` that returns
the shared base spread plus those three geometry values (one options-object argument, satisfying
args ≤3)

**Given** the submit/button breakpoint ladder is the same in L1's submit bar and L2 **When** a
developer inspects `base/` **Then** the height/`minWidth` ladder (`3.125rem` + `19.6875rem` @375;
`4.375rem`/ `33.75rem` @md; `26.375rem` @lg; `3.875rem` @xl) is exported once as a single fragment
(or consumed directly from `ui-skeleton-button`) and is **not** re-declared in any loader
`styles.ts`

**Given** the auth-skeleton wrapper pulse previously inlined `1.5s ease-in-out infinite alternate`
**When** `auth-skeleton/styles.ts` `formWrapperPulse.animation` is inspected **Then** it consumes
`pulseAnimationValue` instead of a duplicated literal string

**Given** the foundation change is complete **When** `make lint-dup` and `make lint-metrics` run
**Then** both pass (no ≥75-token clone introduced, including the ladder; each new file ≤10 functions
and ≤120 LLOC)

### Story 1.2: Add the Three-Point Reduced-Motion Contract

As a design-system developer, I want the `@media (prefers-reduced-motion: reduce)` rule defined once
as `REDUCED_MOTION_QUERY` and applied at all three coordination points — the shimmer base, the
box-shadow/L3-opacity block, and L5's transition, So that every looping animation in the family
(including the wrapper box-shadow pulse that lives outside the shimmer base) actually stops under
reduced motion.

**Acceptance Criteria:**

**Given** `base/styles.ts` is opened **When** a developer inspects the exports **Then**
`REDUCED_MOTION_QUERY = '@media (prefers-reduced-motion: reduce)'` is exported **And**
`motionSafeShimmer` spreads `baseSkeletonStyle` and adds the `REDUCED_MOTION_QUERY` block setting
`animation: 'none'`, `backgroundImage: 'none'`, and a static
`backgroundColor: SKELETON_BORDER_COLOR` (`#E1E7EA`)

**Given** the box-shadow wrapper pulse (`formWrapperPulse`) and L3's opacity keyframe are separate
style objects, not part of `baseSkeletonStyle` **When** their styles are inspected **Then** each
also carries a `REDUCED_MOTION_QUERY` block setting `animation: 'none'` (the single-inherited-rule
assumption is explicitly rejected; three application sites are required)

**Given** `box-shadow` is paint-bound and not GPU-compositable **When** the wrapper glow is
implemented **Then** the looping animation does **not** animate `box-shadow`; any glow is the
`opacity` of an overlay/pseudo-element carrying a pre-rendered static `box-shadow`, and `box-shadow`
is absent from the animated-property whitelist

**Given** L5 uses a `scaleX` transition rather than a keyframe **When** its reduced-motion branch is
inspected **Then** it sets `transition: 'none'` under `REDUCED_MOTION_QUERY` (referencing the
exported constant, not a re-typed literal)

**Given** the change is complete **When** `make lint-dup` and `make lint-metrics` run **Then** both
pass

### Story 1.3: Add the Shared `UILoaderStatus` A11y Primitive and Debounce Hook

As a design-system developer, I want a single `UILoaderStatus` component that owns the
`role="status" aria-live="polite"` contract and the visually-hidden CSS, mounts empty up-front, and
a debounce hook that always announces a genuine transition once, So that every owner-less loading
region announces exactly once, politely, reliably, with no duplicated status markup or clip-rect
CSS.

**Acceptance Criteria:**

**Given** the folder `src/components/skeletons/ui-loader-status/` exists with `index.tsx` +
`styles.ts` + `types.ts` + `use-debounced-status.ts` **When** a developer inspects it **Then**
`types.ts` is type-only exporting the props shape `{ message: string }` **And** `styles.ts` contains
the visually-hidden clip-rect fragment defined exactly once

**Given** `<UILoaderStatus message="Loading" />` is rendered **When** the test queries the tree
**Then** `getByRole('status')` resolves with `aria-live="polite"` and text content `"Loading"`
**And** `getAllByRole('status')` has length exactly 1 **And** the status text node is visually
hidden (off-screen clip-rect), not `display:none`, not `aria-hidden`

**Given** the host (form/switcher) renders before loading begins **When** the host first mounts with
no active loading **Then** the `role="status"` node already exists with empty/whitespace content
(mounted empty up-front per NFR12a) and only its `textContent` changes when loading toggles

**Given** the `use-debounced-status.ts` hook drives a message **When** the loading state toggles on
and off faster than the debounce window (~150–300ms) **Then** a sub-debounce resolution writes the
message **zero** times **And** for a genuine (non-instant) episode the message is written **exactly
once** and cleared on settle (the debounce suppresses flicker, never the initial real utterance)

**Given** the primitive and hook files exist **When** `make lint-metrics` runs **Then** each file
stays within the per-file caps (≤10 functions, file LLOC ≤120, function LLOC ≤10, args ≤3, exit
points ≤3)

### Story 1.4: Add Loader i18n Keys to Both Locales

As an internationalization-conscious developer, I want all new loading/announcement keys added to
both `en.json` and `uk.json`, So that every loader's status message is a complete sentence available
in both locales with no i18n drift.

**Acceptance Criteria:**

**Given** `src/modules/user/features/auth/i18n/en.json` and `uk.json` are opened **When** a
developer inspects them **Then** `sign_up.form.submitting_status` exists in both ("Submitting
registration, please wait" / "Надсилання реєстрації, зачекайте") **And**
`sign_in.form.submitting_status` exists in both ("Signing in, please wait" / "Виконується вхід,
зачекайте") **And** `auth.switching_form` exists in both ("Switching form, please wait" /
"Перемикання форми, зачекайте") **And** `common.loading` exists in both ("Loading" / "Завантаження")

**Given** the existing `auth.loadingForm` key **When** L1 status copy is chosen **Then**
`auth.loadingForm` is reused for L1 (no new duplicate key is added for it)

**Given** the submit-status keys are added **When** they are compared with the existing
visible-label keys (`sign_up.form.submitting` = "Signing up…") **Then** `*.submitting_status` is a
distinct key (a complete sentence), separate from the short visible label

**Given** any new key is present in one locale **When** the other locale file is inspected **Then**
the same key exists there too (no key ships in only one locale)

## Epic 2: The Five Loader Components

Developers have a complete, taxonomy-named `UI*` loader family (L1–L5), each in its own folder, each
rendering correct motion, reserved geometry, reduced-motion static affordance, and accessibility
semantics — usable in isolation before any consumer is migrated. **Each story in this epic ships a
co-located `*.stories.tsx` Storybook preview with its component** (FR27/FR28); the cross-cutting
preview affordances (reduced-motion toggle, a11y/docs addons, consolidated build) are finished in
Story 6.1.

### Story 2.1: Build L1 `UISkeletonPlaceholder` (Non-Landmark, Status-Owning)

As a developer, I want an `L1` placeholder that mirrors the auth-form layout with a staggered
shimmer, a non-landmark root, and one status owner, So that page/form load shows a shift-free,
accessible skeleton that inherits the shared motion and reduced-motion behavior.

**Acceptance Criteria:**

**Given** the folder `src/components/skeletons/ui-skeleton-placeholder/` exists with `index.tsx` +
`styles.ts` + `types.ts` **When** the L1 component is rendered **Then** it composes the existing
`ui-skeleton-text`/`ui-skeleton-input`/`ui-skeleton-block`/ `ui-skeleton-button` primitives into the
form silhouette (title, subtitle, three field rows, submit bar, divider, four social blocks,
switcher) **And** field rows carry a per-row `animation-delay` of `index * STAGGER_STEP` **And** the
submit bar consumes the shared breakpoint-ladder fragment (NFR11a), not a re-declared ladder

**Given** L1 is rendered **When** the accessibility tree is queried **Then** the root is a plain
non-landmark container carrying `aria-busy="true"` **And**
`queryByRole('region', { name: /loading authentication form/i })` is null **And**
`getAllByRole('status')` has length exactly 1 with `auth.loadingForm` text **And**
`queryByRole('progressbar')` is null **And** every shimmer box is `aria-hidden` (not in the a11y
tree)

**Given** `prefers-reduced-motion: reduce` is mocked as matching **When** L1 renders **Then** the
reduced-motion static branch is applied and the computed `animation` resolves to `none` (no
`infinite`) **And** the static fill is a non-transparent `#E1E7EA` (the affordance is perceivable,
not hidden)

**Given** the L1 files exist **When** `make lint-metrics` and `make lint-dup` run **Then** both pass
(geometry-only `styles.ts`; component split into small sub-bodies so the file stays ≤10
functions/≤120 LLOC)

### Story 2.2: Build L2 `UISubmitLoadingButton` Surface Component

As a developer, I want the L2 skeleton-track surface as a standalone `UI*` component with the lifted
fill, ≥3:1 border on both surfaces, retained-label slot, and left→right sweep, So that the
submit-button morph and the retry button can both consume one L2 style fragment without duplication.

**Acceptance Criteria:**

**Given** the folder `src/components/skeletons/ui-submit-loading-button/` exists with `index.tsx` +
`styles.ts` + `types.ts` **When** the component renders **Then** the track surface uses
`LoaderMotion.shape(...)` over a `#C7CDD6` fill with a 1px `#6E7375` border and
`borderRadius: 57px`, and the label slot color is `#404142` **And** the `#6E7375` border is verified
≥3:1 against both `#FFFFFF` (4.80:1) and the `#C7CDD6` track (3.00:1) (the `#969B9D` 2.81:1/1.76:1
border is not used) **And** the shimmer sweep direction is left→right (forward/reading direction)
**And** the track consumes the shared breakpoint-ladder fragment (NFR11a) so the box equals the real
button without re-declaring the ladder

**Given** L2 renders its decorative track **When** the a11y tree is queried **Then** the decorative
shimmer surface is `aria-hidden` and exposes no `role` **And** `queryByRole('progressbar')` is null

**Given** `prefers-reduced-motion: reduce` is mocked as matching **When** L2 renders **Then** the
static `#C7CDD6` fill branch is applied while the `#6E7375` border and the label slot remain
(computed `animation` resolves to `none`; fill is non-transparent)

**Given** the L2 style fragment exists **When** the retry path and the submit path both need the
surface (Epic 3/4) **Then** the fragment is exported once and consumed by both (no copy-paste;
`make lint-dup` passes)

### Story 2.3: Build L3 `UIInlineLoader` (Three-Dot Pulse)

As a developer, I want an `L3` three-dot inline indicator with an opacity pulse, staggered travel,
fixed reserved box, and a status wrapper, So that small inline waits (switcher) have a clear,
accessible, reflow-free indicator.

**Acceptance Criteria:**

**Given** the folder `src/components/skeletons/ui-inline-loader/` exists with `index.tsx` +
`styles.ts` + `types.ts` **When** L3 renders **Then** it renders three `#969B9D` dots animating
`opacity` (≈`0.35 → 1`) on `pulseAnimationValue` with `animation-delay: index * STAGGER_STEP`
**And** the dots sit in a fixed-width reserved inline box

**Given** L3 renders **When** the a11y tree is queried **Then** the wrapper is `role="status"`
`aria-live="polite"` with a visually-hidden message (`auth.switching_form` when used by the
switcher) **And** the dots are `aria-hidden` (e.g. `queryAllByRole('img')` is empty) **And** there
is no `role="progressbar"`

**Given** `prefers-reduced-motion: reduce` is mocked as matching **When** L3 renders **Then** the
dots are static at full `opacity: 1` (reduced-motion branch via the shared `REDUCED_MOTION_QUERY`;
computed `animation` resolves to `none`; dots not hidden)

**Given** the L3 files exist **When** `make lint-metrics` and `make lint-dup` run **Then** both pass

### Story 2.4: Build L4 `UISectionLoader` (Opt-In Region Veil)

As a developer, I want an opt-in `L4` section veil sized to fill a section's reserved box, with
optional compositable glow, a status owner, and an `inert` underlying region, So that non-critical
lazy boundaries can show a calm visible cue without touching the auth critical path.

**Acceptance Criteria:**

**Given** the folder `src/components/skeletons/ui-section-loader/` exists with `index.tsx` +
`styles.ts` + `types.ts` **When** L4 renders **Then** it renders one-to-three
`LoaderMotion.shape(...)` blocks sized `%`/`vh`-relative to the section, with an optional glow
implemented as `opacity` on a static-shadow overlay (never animated `box-shadow`) **And** the
container carries `aria-busy="true"` and exactly one `role="status"` owner **And** the blocks are
`aria-hidden`

**Given** L4 is used over content **When** the veiled region is inspected **Then** the underlying
region is marked `inert`/`aria-hidden` while loading

**Given** `prefers-reduced-motion: reduce` is mocked as matching **When** L4 renders **Then** the
static `#E1E7EA` block branch is applied (computed `animation` resolves to `none`; no glow;
non-transparent fill; nothing hidden) **And** `make lint-metrics`/`make lint-dup` pass

### Story 2.5: Build L5 `UIProgressBar` (Determinate, Reserved)

As a developer, I want a determinate `L5` progress bar driven by a real `0–100` value via `scaleX`
with a proper `progressbar` role, So that future percentage flows have one consistent, accessible,
on-brand bar that never fakes indeterminate progress and stays off the auth path.

**Acceptance Criteria:**

**Given** the folder `src/components/skeletons/ui-progress-bar/` exists with `index.tsx` +
`styles.ts` + `types.ts` **When** L5 renders with a value **Then** the fill uses
`transform: scaleX(value/100)` with `linear` easing (`transform-origin: left`) over a `#E1E7EA`
track with a `#1EAEFF` fill **And** any percentage label is rendered adjacent (never on the fill)

**Given** L5 renders **When** the a11y tree is queried **Then** `getByRole('progressbar')` resolves
with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and an accessible name **And** it
is the only family member exposing `role="progressbar"`

**Given** `prefers-reduced-motion: reduce` is mocked as matching **When** L5 renders **Then** the
fill `transition` resolves to `none` and the fill jumps directly to the current value (no `infinite`
animation; the riding glow is dropped); the filled width still reflects the value (not hidden)

**Given** L5 ships **When** the codebase is audited **Then** L5 has no wired consumer and is not
imported on the auth paint path; `make lint-metrics`/`make lint-dup` pass

## Epic 3: Registration Submit-Button Loading State (The Hero Case)

The user's primary direction: the pressed submit button visibly becomes a fairly-visible shimmering
skeleton track in place — focusable, named, contrast-fixed, double-submit-safe, focus-managed, and
announced — replacing the disabled-button-plus-70px-spinner pattern.

### Story 3.1: Fix `UIButton` Disabled Contrast and Add the CSS-Only `loading` Prop

As a developer, I want `UIButton` to fix the white-on-`#E1E7EA` disabled defect and gain a pure-CSS
`loading` prop that swaps to the L2 surface with `aria-disabled`/`aria-busy` while stripping native
`disabled`, So that the contrast defect is removed at the source and both forms and the retry button
can opt into the focusable L2 state without a new component or dependency.

**Acceptance Criteria:**

**Given** `src/components/ui-button/theme.ts` is opened **When** the `:disabled` rule is inspected
**Then** the white text (`#FFFFFF`) on `#E1E7EA` pairing is removed **And** the genuinely-disabled
(pre-submit) text is `#404142` on `#E1E7EA` (≥4.5:1, ≈8.6:1)

**Given** `UIButton` is the verified `forwardRef` wrapping MUI `<Button>` via `React.cloneElement`
inside a local `ThemeProvider` **When** `UIButton` is rendered with `loading` set **Then** it swaps
its rendered surface to the L2 skeleton (from the `ui-submit-loading-button` fragment) inside its
own reserved box **And** it applies `aria-disabled="true"` and `aria-busy="true"` instead of the
native `disabled` attribute, while keeping `type="submit"` focusable **And**
`expect(button).not.toBeDisabled()` holds

**Given** `aria-disabled` does not stop MUI `<Button>` from firing `onClick` **When** the `loading`
branch is specified **Then** activation prevention relies on the FR10 in-flight guard at the
handler, not on `aria-disabled` alone (documented here as a precondition for Story 3.2 and Story
4.2)

**Given** the `loading` prop is purely CSS state **When** the auth paint path is audited **Then** no
new runtime dependency is added and the L2 styles are not eager-imported at `ui-button` module top
level (only reached through the submit path)

**Given** the change is complete **When** `make lint-dup` and `make lint-metrics` run **Then** both
pass (the L2 surface fragment is referenced, not copy-pasted; the `loading` branch keeps `UIButton`
bodies ≤10 LLOC and exits ≤3)

### Story 3.2: Refactor `SubmitControls` to the In-Place L2 Morph

As an end user submitting the auth/registration form, I want the submit button I pressed to visibly
become a shimmering loading track (focusable, named, announced) with no spinner and no layout shift,
and to keep keyboard focus sensible when the form settles, So that I clearly understand "I submitted
and something is happening" and I am never stranded after the result lands.

**Acceptance Criteria:**

**Given** `src/components/ui-form/index.tsx` `SubmitControls` is opened **When** the loading branch
is inspected **Then** the `CircularProgress` import and the
`{submitting ? <CircularProgress.../> : null}` branch are removed **And** the `loader` style is
deleted from `src/components/ui-form/styles.ts` **And** `SubmitControlsProps` still has exactly
three fields (`submitting`, `isSubmitDisabled`, `submitLabel`) — no new argument

**Given** a form is submitting **When** the submit area is queried **Then**
`getByRole('button', { name: /signing up/i })` resolves with `aria-disabled="true"`,
`aria-busy="true"`, and `not.toBeDisabled()` **And** `queryByRole('progressbar')` is null (no
spinner) **And** native `disabled` is used only for the pre-submit `isSubmitDisabled` state **And**
the visible label swaps `submit_button` → `submitting` and remains a non-empty accessible name
throughout

**Given** "settle" means two distinct outcomes for the form container **When** the in-place revert
path runs (submit fails and the `<form>` stays mounted) **Then** the `<form>` (with an `aria-label`)
has `aria-busy="true"` during submit, then `aria-busy="false"` after settle (the container survives,
so `false` is observable) **When** the view-replacement path runs (registration success/error
replaces the form subtree with the `role="alert"` notification view) **Then** the busy `<form>` is
**removed** (no `aria-busy="false"` is asserted on the unmounted node) and `getByRole('alert')` is
present instead

**Given** a submission is already in flight **When** the submit action is triggered again **Then**
the `onSubmit` callback is invoked exactly once (the in-flight early-return guard in
`buildSubmitHandler` makes re-entry a no-op), independent of `aria-disabled`

**Given** submission begins and then resolves **When** the status region is observed **Then** the
persistent `getByRole('status')` (mounted empty up-front) carries the `*.submitting_status` message
exactly once during a genuine submit and is cleared on settle, handing off to the existing
`getByRole('alert')` success/error view **And** there is exactly one loading-related announcement
queued per submit (the button's label change alone does not trigger a second live announcement; no
`aria-live` is placed on the button)

**Given** the focused submit control is removed or replaced on settle **When** the success/error
view replaces the form **Then** focus is programmatically moved to the `role="alert"` outcome
container (so it is read and actionable), and `document.activeElement` is never `document.body`
**When** the in-place revert path runs **Then** focus returns to the restored real submit button

**Given** the refactor is complete **When** `make lint-metrics` runs **Then** `SubmitControls` stays
a pure presentational component within the per-file caps (guard logic inside `buildSubmitHandler`;
exit points ≤3)

### Story 3.3: Verify Zero Layout Shift and Geometry Parity for the Submit Area

As an end user on desktop and mobile, I want the submit area to occupy the exact same box before and
during loading, So that submitting never shoves the layout (the 70px sibling that caused shift is
gone).

**Acceptance Criteria:**

**Given** the submit area is measured **When** `submitting` is toggled true then false **Then** a
Playwright bounding-box assertion shows the submit area's geometry is identical in both states (no
element appears/disappears beside the button)

**Given** the breakpoint ladder **When** L2 renders at mobile, md, lg, and xl **Then** its
height/`minWidth`/radius/padding match the real submit button at each breakpoint
(`3.125rem`/`4.375rem`/`3.875rem`; `19.6875rem`/`33.75rem`/`26.375rem`; `57px`; `20px 32px`) via the
shared ladder fragment

**Given** loaders are measured for CLS **When** the auth flow is profiled **Then** the loaders'
contribution to Cumulative Layout Shift is zero on desktop and mobile

## Epic 4: Migrate the One Existing Loader and Instrument the Silent Waits

The single existing spinner is migrated to L2, the silent switcher/retry waits are newly
instrumented (without nesting live regions), the auth page skeleton is re-wired to L1, and the dead
duplicate auth-skeleton re-export is deleted.

### Story 4.1: Migrate the Auth Page Skeleton to L1 and Remove the Landmark

As an end user (including a screen-reader user) loading the auth page, I want the page-load skeleton
to be the new L1 placeholder with a status owner and no mislabeled landmark, So that the loading
state is announced once and does not pollute the landmark menu.

**Acceptance Criteria:**

**Given** `src/modules/user/features/auth/index.tsx:16` Suspense fallback **When** the lazy
`FormSection` chunk is resolving **Then** the fallback renders the L1 `UISkeletonPlaceholder`
(canonical `@/components/skeletons/auth-skeleton` retargeted)

**Given** the auth-skeleton root previously was `<Box component="section" aria-label=…>` **When**
the migrated skeleton renders **Then** the root is a non-landmark `<div>` carrying
`aria-busy="true"` with one child `UILoaderStatus` (`auth.loadingForm`) **And**
`queryByRole('region', { name: /loading authentication form/i })` is null while
`getByRole('status')` resolves **And** `aria-busy` clears when the real form mounts

**Given** the migration is complete **When** the skeleton's animation timing is inspected **Then**
it consumes the shared `1.4s` shimmer and the `pulseAnimationValue` glow (now an `opacity`-based
overlay, not an animated `box-shadow`), with no inlined duplicated timing

### Story 4.2: Instrument the Switcher (L3) and the Retry Button (L2, No Nested Live Region)

As an end user switching auth forms or retrying a failed registration, I want a visible inline
loader where today there is only a silent disabled state, without breaking screen-reader
announcements, So that I receive clear feedback that the switch/retry is in progress.

**Acceptance Criteria:**

**Given** the login/register switcher loading state (`form-section/index.tsx`, `isLoadingLogin`),
which has no loader today **When** the switch is loading **Then** an `L3 UIInlineLoader` renders
beside the switcher and the host control carries `aria-busy="true"` **And** `getByRole('status')`
carries the `auth.switching_form` message (this region has no existing live-region owner, so one
`role="status"` is added)

**Given** the registration retry button (`registration-error-view.tsx`), which is nested inside the
`role="alert" aria-live="polite"` container at line 97 and has no loader today **When** a retry is
in flight **Then** the retry button uses the L2 `loading` variant via the same `UIButton` path
(`aria-disabled`/`aria-busy`, no native `disabled`, no spinner) **And** **no**
`UILoaderStatus`/`role="status"` is rendered inside the error view **And**
`within(getByRole('alert')).queryAllByRole('status')` returns 0 and there are zero nested
`aria-live` regions (the enclosing alert remains the single live-region owner; the pending state is
conveyed by `aria-busy` on the retry button)

**Given** the retry button is focusable while `aria-disabled` **When** retry is triggered twice in
flight **Then** the retry handler in `registration-error-view` early-returns and `onRetry` fires
exactly once (FR10 holds on the retry path, not only on `buildSubmitHandler`)

**Given** retry settles **When** the alert content updates or the view changes **Then** focus is not
dropped to `document.body`; it rests on the alert container or the restored retry button (FR26)

### Story 4.3: Switch Both Forms' Submit State to L2 via the Shared Path

As an end user of either the registration or the login form, I want both forms' submit buttons to
use the L2 morph, So that the submit loading experience is identical and consistent across both
forms.

**Acceptance Criteria:**

**Given** `registration-form.tsx` and `login-form.tsx` **When** their integration with `UIForm` is
inspected **Then** both remain unchanged at the consumer level (they already feed
`UIForm.isSubmitting`) and inherit the L2 morph through `SubmitControls`

**Given** the registration form is submitting **When** the submit button is queried **Then** it
shows the L2 track with the retained "Signing up…" label, `aria-disabled`, `aria-busy`, and no
`CircularProgress`

**Given** the login form is submitting **When** the submit button is queried **Then** it shows the
L2 track with the retained "Signing in…" label, `aria-disabled`, `aria-busy`, and no
`CircularProgress`

### Story 4.4: Delete the Dead Duplicate Auth-Skeleton and Purge the Auth-Path Spinner

As a maintainer, I want the dead duplicate auth-skeleton re-export deleted and the single auth-path
`CircularProgress` removed, while the minimal critical-path fallbacks stay untouched, So that there
is one canonical skeleton, no stray spinner, and the Lighthouse budget is protected.

**Acceptance Criteria:**

**Given** the module-local re-export `src/modules/user/features/auth/components/auth-skeleton/`
**When** importers are audited with `grep` **Then** the re-export has **zero** importers (confirmed:
`auth/index.tsx` already imports the canonical `@/components/skeletons/auth-skeleton` directly)
**And** the folder is deleted as dead code — no importer-repointing step is performed because there
is nothing to repoint

**Given** the auth flow after migration **When** the codebase is grepped **Then** the single
`ui-form/index.tsx` `CircularProgress` is gone and no auth-path usage of MUI `CircularProgress`
remains **And** the existing-loader migration (the one spinner) and the silent-wait instrumentation
(switcher, retry, page skeleton) are all complete

**Given** the intentionally-minimal critical-path fallbacks (`index.tsx:27`, `app.tsx:40`, the
`form-section` login `aria-hidden` fallback) **When** they are inspected **Then** they remain
unchanged (`null` / `aria-hidden`), and no loader (including L4/L5) is eager-imported on the auth
paint path

## Epic 5: Testing, Visual Snapshots, and Reduced-Motion Coverage

The redesign is provably correct and regression-safe.

### Story 5.1: Unit Tests for Submit-State A11y, Focus, and Spinner Removal

As a developer, I want `make test-unit-client` to assert the new `SubmitControls`/L2 semantics using
semantic queries only, So that the focus-safe submit, no-spinner, single-announcement,
focus-on-settle, and double-submit-guard behaviors are regression-protected.

**Acceptance Criteria:**

**Given** `tests/unit/components/ui-form.test.tsx` is updated **When** the submit-state tests run
**Then** during submit `getByRole('button', { name: /signing up/i })` has `aria-disabled`,
`aria-busy`, and `not.toBeDisabled()` **And** `queryByRole('progressbar')` is null **And**
triggering submit twice in flight asserts `onSubmit` was called once

**Given** the two settle paths are distinguished **When** the in-place revert path is tested (submit
fails, form remains) **Then** `getByRole('form')` shows `aria-busy` true→false on settle and focus
returns to the restored submit button **When** the view-replacement path is tested (success/error
replaces the form) **Then** the busy form is removed (no `aria-busy="false"` asserted on the
unmounted node), `getByRole('alert')` is present, and `document.activeElement` is the alert
container (never `document.body`)

**Given** the persistent status node **When** a genuine submit runs **Then** `getByRole('status')`
exists before submit with empty content, carries the submitting message exactly once during submit,
then clears and hands off to `getByRole('alert')`; no second announcement is queued by the button
label change

**Given** all assertions **When** the test selectors are inspected **Then** no `data-testid` is used
(only role/label/text/`{ hidden }` queries), and `make test-unit-client` passes

### Story 5.2: Unit Tests for Each Loader's Status/Decorative Semantics and No Nested Live Regions

As a developer, I want unit tests for L1–L5 plus the retry path covering the status owner,
`aria-busy`, decorative hiding, `progressbar`-only-on-L5, and the no-nested-live-region rule, So
that the family's accessibility semantics are verified in isolation.

**Acceptance Criteria:**

**Given** L1 is rendered **When** queried **Then** exactly one `role="status"`; root
`aria-busy="true"`; `queryByRole('region', {...})` null; `queryByRole('progressbar')` null

**Given** L3 (switcher) is rendered **When** queried **Then** exactly one `role="status"` with
`auth.switching_form`; dots not in the a11y tree

**Given** the registration retry path is rendered in its `role="alert"` host **When** queried
**Then** `within(getByRole('alert')).queryAllByRole('status')` returns 0 and there are zero nested
`aria-live` regions; the retry button carries `aria-busy` while pending

**Given** L5 is rendered **When** queried **Then** `getByRole('progressbar')` exposes
`aria-valuenow`/`min`/`max`

**Given** L1, L2, L3, L4 are rendered **When** queried for `progressbar` **Then**
`queryByRole('progressbar')` is null for each (only L5 exposes it)

**Given** the suite **When** it runs **Then** all selectors are semantic and `make test-unit-client`
passes

### Story 5.3: Reduced-Motion Coverage (Enumerated Animations + Perceivable Affordance)

As a reduced-motion user, I want automated proof that **every** animation in the family settles and
that each loader still shows a perceivable static affordance, So that no looping animation leaks
through (including the wrapper box-shadow pulse) and no loader collapses to invisible.

**Acceptance Criteria:**

**Given** a shared test helper mocks
`window.matchMedia('(prefers-reduced-motion: reduce)') => { matches: true }` (added to
`jest.setup.ts`), and the jsdom design reads it where a JS branch is required **When** each loader
is rendered in jsdom **Then** the reduced-motion static branch is asserted as applied for L1–L5

**Given** the family contains multiple keyframes/animations (shimmer, `formWrapperPulse` box-shadow
replacement, L3 opacity pulse, L5 `scaleX` transition) **When** a Playwright project using
`emulateMedia({ reducedMotion: 'reduce' })` renders each loader and each animation site **Then** the
test enumerates **every** `@keyframes`/animation in the family and asserts each computed
`animation`/`animation-name` resolves to `none` (and `transition: none` for L5) — not merely that
`animation-iteration-count !== 'infinite'` (the iteration-count check is kept only as a secondary
guard)

**Given** the "nothing hidden" guarantee (FR14) **When** each loader renders under reduced motion
**Then** a perceivable static affordance is asserted: computed `background-color`/`border` is a
non-transparent value for L1/L2/L4, dot `opacity` is 1 for L3, and L5's fill width/`scaleX` reflects
the value

**Given** the reduced-motion checks **When** `make test-unit-client` and `make test-visual` run
**Then** both pass with the reduced-motion assertions included

### Story 5.4: Regenerate Static Visual Snapshots (Existing Reduced-Motion Harness)

As a maintainer, I want the static baselines regenerated through the existing
reduced-motion-emulating harness for the surfaces whose static render changed, plus a new L2
submit-state baseline, So that `make test-visual` is green with intended pixels only.

**Acceptance Criteria:**

**Given** `tests/visual/take-visual-snapshot.ts:59` already sets
`emulateMedia({ reducedMotion: 'reduce' })` and line 68 sets `animations: 'disabled'` **When** the
L1 auth-skeleton, retry/error notification surfaces change their static render **Then** their
existing baselines under `...auth-skeleton.spec.ts-snapshots/*` and
`...registration-notification.spec.ts-snapshots/*` are intentionally **regenerated** as static-state
captures across chromium/firefox/webkit and mobile/desktop **And** the plan acknowledges these
baselines were already static (not animated) and that the new reduced-motion media query shifts
their meaning to the static fallback

**Given** there is no existing submit/submitting visual state in the 370-byte authentication spec
**When** the L2 submit state is added **Then** a **new** `submitting`-state screenshot path is added
to the authentication spec and a full chromium/firefox/webkit × viewport baseline set is generated
from scratch (this is a new spec + baselines, not a regeneration), and a bounding-box assertion
proves the submit area is geometry-identical with `submitting` toggled

**Given** the full matrix **When** `make test-visual` runs **Then** it passes with only the
intentionally regenerated/added snapshots changed

### Story 5.4a: Add a Non-Reduced-Motion Visual Project for the Animated Shimmer

As a maintainer, I want a separate visual project that does NOT emulate reduced motion or disable
animations, So that the animated shimmer branch (L1/L2) actually gets visual coverage instead of
only the static fallback.

**Acceptance Criteria:**

**Given** the existing harness disables animations and cannot observe the shimmer **When** a new
visual project/spec is added **Then** it renders the animated loaders **without**
`emulateMedia({ reducedMotion: 'reduce' })` and **without** `animations: 'disabled'`, capturing the
animated shimmer path (e.g. a deterministic mid-sweep frame), so the animated branch has non-zero
coverage

**Given** both projects exist **When** the suite is described **Then** it states explicitly that the
reduced-motion-emulating harness covers the static branch and the new project covers the animated
branch, and that existing baselines shifted to static when the media query landed

**Given** the new project **When** `make test-visual` runs **Then** it passes with the
animated-branch baselines committed intentionally

### Story 5.5: Verify the DRY, Metrics, and Selector Gates Are Green

As a maintainer, I want the jscpd, rca, and no-`data-testid` gates to pass for the entire change, So
that the loader family is DRY, within complexity budgets, and free of test-only hooks by
construction.

**Acceptance Criteria:**

**Given** all loader and consumer files **When** `make lint-dup` runs (also run right after the
foundation step, before authoring the loader folders) **Then** it reports zero clones ≥75 tokens
across the loader files (the motion block, visually-hidden CSS, reduced-motion query, L2 surface,
and the **breakpoint-geometry ladder** each exist exactly once)

**Given** all new/changed files **When** `make lint-metrics` runs **Then** every file is within the
hard-fail caps (function cyclomatic ≤10, cognitive ≤15, args ≤3, exit points ≤3, function LLOC ≤10,
≤10 functions/file, file LLOC ≤120), including the `UIButton` `loading` branch

**Given** the source and tests **When** ESLint runs **Then** there is no `data-testid` in `src/**`
and no `eslint-disable`/suppression was used to satisfy any gate

### Story 5.6: Negative Assertions, i18n Completeness, and aria-busy Settle Coverage

As a maintainer, I want explicit negative-assertion and completeness checks so weak coverage
mappings become real, So that L4/L5 cannot reach the critical path, every new key exists in both
locales, and L1's `aria-busy` true→false-on-settle is directly asserted.

**Acceptance Criteria:**

**Given** the auth critical path (`index.tsx`, `app.tsx`, `auth/index.tsx`) **When** a lint/test
runs **Then** it **fails** if any of those files import L4 (`UISectionLoader`) or L5
(`UIProgressBar`) (FR7/FR23/NFR3 negative assertion), and asserts no `CircularProgress` import
remains on the auth path

**Given** the new i18n keys (`*.submitting_status`, `auth.switching_form`, `common.loading`,
`common.uploading`) **When** an i18n completeness test runs **Then** it asserts each key exists in
**both** `en.json` and `uk.json` (FR24/FR25/NFR16)

**Given** L1 settles when the real form mounts **When** the assertion runs **Then** the L1 root
`aria-busy` is `"true"` while pending and `"false"`/removed on settle (FR16 for L1 explicitly
asserted, not only in prose)

**Given** these checks **When** `make test-unit-client` (and the lint/test for the import guard) run
**Then** all pass with semantic selectors only

### Story 5.7: Confirm the Auth Mobile Lighthouse Budget Holds

As a maintainer, I want CI to confirm the auth mobile Lighthouse performance stays at/above the
threshold after the redesign, So that the pure-CSS, dependency-free, spinner-removing change does
not regress the budget.

**Acceptance Criteria:**

**Given** the migrated auth flow **When** the CI mobile Lighthouse audit runs **Then** the
performance score is at or above the CI threshold

**Given** the auth paint path **When** dependencies/imports are audited **Then** no new runtime
dependency and no new eager import were added on the auth path, and the MUI `CircularProgress` was
removed from it (L4 off-critical, L5 unused)

## Epic 6: Docs, Storybook, and Cleanup/Consolidation

The loader family is documented for future contributors and the migration's loose ends are cleaned
up.

### Story 6.1: Storybook Preview for the Loader Family (FR27/FR28)

As a developer choosing a loader, I want an interactive Storybook preview of L1–L5 — every state,
with a reduced-motion toggle and the a11y addon — So that I can see and accessibility-check each
loader in isolation and pick the right one without reading source.

> Each loader's `*.stories.tsx` is **co-located and authored with its component in Epic 2**
> (Stories 2.1–2.5). This story closes the family out by adding the cross-cutting preview
> affordances (global reduced-motion toggle, a11y/docs addons, the L2 state matrix) and verifying
> the consolidated build.

**Acceptance Criteria:**

**Given** co-located stories exist for `UISkeletonPlaceholder`, `UISubmitLoadingButton`,
`UIInlineLoader`, `UISectionLoader`, and `UIProgressBar` **When** Storybook is built **Then** each
loader has an animated-default story and a static/reduced-motion story; L2 additionally exposes
`idle` / `submitting` / `disabled`; and L5 exposes determinate values (0/50/100) **And**
`make storybook-build` succeeds with the family included

**Given** a reviewer opens any loader story **When** they flip the global reduced-motion control
(Storybook `globalTypes` / a `parameters` emulation of `prefers-reduced-motion: reduce`) **Then**
the whole family switches between the animated and static branches without source edits, mirroring
the three-point reduced-motion contract

**Given** the Storybook a11y and docs addons **When** each loader story renders **Then** its role,
`aria-busy`, `role="status"` ownership, accessible name, and the no-nested-live-region rule are
inspectable, and the a11y addon reports no violations on the previews

**Given** the existing `auth-skeleton.stories.tsx` static story pattern **When** the new stories are
written **Then** they reuse the established static/`disableAnimation` opt-out path for the static
variants (no duplicated story scaffolding that would trip jscpd)

### Story 6.2: Document the Loader Taxonomy and Update CLAUDE.md

As a contributor, I want a loader taxonomy/usage doc and a CLAUDE.md note describing the family, So
that choosing among L1–L5 and finding the shared motion source is a quick lookup.

**Acceptance Criteria:**

**Given** the loader documentation **When** a contributor reads it **Then** it lists the five `UI*`
loaders (L1–L5) with purpose, motion base, the served usage point (one existing spinner migrated;
switcher/retry/page-skeleton instrumented), and the shared `base/` motion source +
`LoaderMotion.shape` + breakpoint-ladder fragment **And** it states the three-point reduced-motion
contract, the one-`role="status"`-per- owner-less-region rule, and the no-nested-live-region rule on
the retry path

**Given** `CLAUDE.md` **When** the loader family is referenced **Then** a brief note points to the
loader family and its single motion source-of-truth (consistent with the existing
skeleton/architecture sections)

**Given** the docs change only **When** `make lint-md` runs **Then** it passes (markdownlint-clean:
ATX headings, fenced code with language, no trailing spaces)

### Story 6.3: Final Cleanup and Dead-Reference Audit

As a maintainer, I want a final audit confirming no dead `CircularProgress`/`loader`-style
references and the dead duplicate folder is gone, So that the migration leaves no orphaned code or
styles behind.

**Acceptance Criteria:**

**Given** the post-migration codebase **When** it is grepped **Then** the deleted `loader` style
(`ui-form/styles.ts`) has no remaining references **And**
`src/modules/user/features/auth/components/auth-skeleton/` no longer exists and had no importers
when deleted **And** no auth-path file imports MUI `CircularProgress`

**Given** the full change set **When** `make format` then `make lint` run **Then** both pass
(ESLint, tsc, markdown, lint-dup, lint-metrics) with no suppression directives

**Given** the cleanup is complete **When** the family is reviewed **Then** each loader remains its
own `index.tsx` + `styles.ts` + `types.ts` folder and all shared assets (motion, visually-hidden
CSS, reduced-motion query, L2 surface, breakpoint ladder) live exactly once under
`base/`/`ui-loader-status/`

## Traceability — Coverage Matrix (FR → Story)

| FR    | Story/Stories                         | Verification story |
| ----- | ------------------------------------- | ------------------ |
| FR1   | 1.1                                   | 5.5                |
| FR2   | 1.1; reinforced 2.1–2.5               | 5.5                |
| FR3   | 2.1, 2.2, 2.3, 2.4, 2.5               | 6.3                |
| FR4   | 2.1, 4.1                              | 5.2, 5.4           |
| FR5   | 3.1, 3.2, 3.3                         | 5.1, 5.4           |
| FR6   | 2.3, 4.2                              | 5.2                |
| FR7   | 2.4                                   | 5.2, 5.6           |
| FR8   | 2.5                                   | 5.2                |
| FR9   | 3.1, 3.2                              | 5.1                |
| FR10  | 3.2, 4.2                              | 5.1, 5.2           |
| FR11  | 3.2, 4.3                              | 5.1                |
| FR12  | 3.1                                   | 5.1, 5.4           |
| FR13  | 1.2; applied 2.1–2.5                  | 5.3                |
| FR14  | 1.2, 2.1, 2.2, 2.3, 2.4, 2.5          | 5.3                |
| FR15  | 1.3; consumed 2.1, 2.3, 2.4, 3.2, 4.1 | 5.1, 5.2           |
| FR16  | 1.3 (contract), 3.2, 4.1              | 5.1, 5.6           |
| FR17  | 2.1, 2.2, 2.3, 2.4, 2.5, 3.2          | 5.2                |
| FR18  | 2.1, 4.1                              | 5.2                |
| FR19  | 1.3, 3.2                              | 5.1                |
| FR20  | 3.2, 4.3                              | 5.1, 5.4           |
| FR21  | 4.1, 4.4                              | 6.3                |
| FR22  | 4.2                                   | 5.2, 5.4           |
| FR22a | 4.2                                   | 5.2                |
| FR23  | 4.4                                   | 5.6, 5.7, 6.3      |
| FR24  | 1.4                                   | 5.6                |
| FR25  | 1.4                                   | 5.6                |
| FR26  | 3.2, 4.2                              | 5.1                |
| FR27  | 2.1, 2.2, 2.3, 2.4, 2.5, 6.1          | 6.1                |
| FR28  | 6.1                                   | 6.1                |

### Issue #48 Acceptance-Criterion Coverage

| Issue AC                                                            | Satisfying stories                             |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| AC1 — New loader used at all identified usage points                | 4.1, 4.2, 4.3, 4.4 (built on 2.1–2.5, 3.x)     |
| AC2 — No layout shifts or visible regressions on desktop and mobile | 3.3, 5.4, 5.4a                                 |
| AC3 — Reduced-motion users receive simplified/non-animated behavior | 1.2, 2.1–2.5 (per loader), 5.3                 |
| AC4 — Relevant tests pass (make test-unit-client, make test-visual) | 5.1, 5.2, 5.3, 5.4, 5.4a (gates 5.5, 5.6, 5.7) |

### Issue #48 Task Coverage

| Issue task                                                  | Stories                            |
| ----------------------------------------------------------- | ---------------------------------- |
| Audit all current loader usage points                       | Verified Source Inventory; 4.1–4.4 |
| Define animation parameters (timing, easing, sizing, color) | 1.1, 1.2; 2.1–2.5 per-type spec    |
| Implement in shared UI component(s)                         | 1.1, 1.3, 2.1–2.5, 3.1             |
| Add reduced-motion via prefers-reduced-motion               | 1.2, 5.3                           |
| Ensure accessible semantics for pending state               | 1.3, 2.1–2.5, 3.1, 3.2, 4.1, 4.2   |
| Migrate existing loader usages (the one spinner)            | 4.1 (re-wire), 4.3, 4.4            |
| Instrument silent waits (switcher, retry)                   | 4.2                                |
| Update unit tests and visual snapshots                      | 5.1, 5.2, 5.3, 5.4, 5.4a           |

### NFR / UX-DR Coverage (supplementary)

| Requirement    | Story/Stories                         |
| -------------- | ------------------------------------- |
| NFR1           | 2.1–2.5, 3.2, 3.3, 5.4                |
| NFR2           | 3.1, 4.4, 5.7                         |
| NFR3           | 2.4, 2.5, 4.4, 5.6, 5.7               |
| NFR4           | 3.1, 3.2, 5.1, 5.4                    |
| NFR5           | 2.2, 3.1, 3.2                         |
| NFR6/NFR7/NFR8 | 1.2, 2.1–2.5, 5.3                     |
| NFR9           | 2.1–2.5, 3.1, 3.2, 5.2                |
| NFR10          | 1.3, 3.2, 5.1                         |
| NFR11          | 1.1, 1.2, 1.3, 2.1–2.5, 3.1, 5.5, 6.1 |
| NFR11a         | 1.1, 2.1, 2.2, 3.3, 5.5               |
| NFR12          | 1.1, 1.3, 2.1–2.5, 3.1, 3.2, 5.5, 6.3 |
| NFR12a         | 1.3, 3.2, 5.1                         |
| NFR13          | 5.1, 5.2, 5.3, 5.6                    |
| NFR14          | 5.3, 5.4, 5.4a                        |
| NFR15          | 5.1, 5.2, 5.5                         |
| NFR16          | 1.4, 5.6                              |
| UX-DR1–UX-DR2  | 1.1, 1.2; documented 6.2              |
| UX-DR3         | 2.1, 4.1                              |
| UX-DR4         | 2.2, 3.1, 3.2                         |
| UX-DR5         | 2.3, 4.2                              |
| UX-DR6         | 2.4                                   |
| UX-DR7         | 2.5                                   |
| UX-DR8         | 1.2, 5.3                              |
| UX-DR9         | 1.3, 2.1–2.5, 3.2, 4.1, 4.2           |
| UX-DR10        | 3.1, 3.2                              |
| UX-DR11        | 1.4                                   |
| UX-DR12        | 5.3, 5.4, 5.4a                        |

## Validation Summary

- **FR coverage:** All 28 FRs (FR1–FR28, including FR22a) map to at least one implementing story and
  at least one verification story (see matrix). No FR is uncovered.
- **Evidence-grounded inventory:** The phantom loader-planning inputs are removed; AC1 now traces to
  the Verified Source Inventory, re-derived from source. The "existing loaders to migrate" set is
  exactly one spinner; switcher/retry/page-skeleton are explicitly labeled new
  instrumentation/re-wiring and justified against issue #48 "out of scope."
- **Contrast correctness:** The L2 border is corrected to `#6E7375` (≥3:1 on both `#FFFFFF` 4.80:1
  and `#C7CDD6` 3.00:1); the false 3.04:1 / true 2.81:1 `#969B9D` value is rejected everywhere it
  appeared.
- **Reduced-motion coherence:** The contract is stated as three coordination points (not one
  inherited rule); the box-shadow pulse is removed from the animated whitelist; verification
  enumerates every animation and asserts `animation`/`transition` resolves to `none` plus a
  perceivable static affordance; a `matchMedia` mock is added for the jsdom branch.
- **Live-region integrity:** The retry path adds no nested `role="status"` (FR22a); status nodes
  mount empty up-front (NFR12a); the submit announcement is asserted exactly once.
- **Settle semantics:** `aria-busy="false"` is asserted only on the surviving in-place revert path;
  the success path asserts form removal + alert presence + focus hand-off (FR26).
- **Visual coverage realism:** The existing reduced-motion-emulating harness covers the static
  branch (baselines acknowledged as static and intentionally regenerated); a new non-reduced-motion
  project (5.4a) covers the animated shimmer; the L2 submit state is a new baseline set, not a
  regeneration.
- **Negative assertions:** A lint/test fails if L4/L5 reach the auth critical path; i18n
  completeness asserts each key in both locales; L1 `aria-busy` true→false is asserted (Story 5.6).
- **Epic independence & ordering:** E1 stands alone and enables E2–E6; within each epic, every story
  depends only on previous stories (3.2 needs 3.1; 4.2/4.3 need 3.x; 5.x verify 1–4). No forward
  dependencies.
- **Right-sizing for gates:** Each story scopes to its own folder/file(s); the motion block,
  visually-hidden CSS, reduced-motion query, L2 surface, and breakpoint ladder are each defined
  exactly once, so files stay ≤10 functions/≤120 LLOC and jscpd stays at zero clones.
