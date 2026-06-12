---
status: 'complete'
workflowType: 'architecture'
project_name: 'crm'
date: '2026-06-11'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/48'
inputDocuments:
  - 'specs/planning-artifacts/loader-animation/prd.md'
  - 'specs/planning-artifacts/loader-animation/ux-design.md'
  - 'https://github.com/VilnaCRM-Org/crm/issues/48'
  - 'src/components/ui-form/index.tsx'
  - 'src/components/ui-button/index.tsx'
  - 'src/components/ui-button/theme.ts'
  - 'src/components/skeletons/base/styles.ts'
  - 'src/components/skeletons/ui-skeleton-button/styles.ts'
  - 'src/components/skeletons/auth-skeleton/index.tsx'
  - 'src/components/skeletons/auth-skeleton/styles.ts'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx'
  - 'src/styles/colors.ts'
  - 'tests/visual/take-visual-snapshot.ts'
---

# Architecture Decision Document — Loader Animation Redesign (Issue #48)

_This document builds on the canonical loader taxonomy (L1–L5), the PRD FR/NFR ids,_ _and the
accessibility requirements (Group A–F + NFR1–NFR5). It defines the concrete_ _component
architecture, file layout, refactor points, DRY/complexity/perf strategy,_ _and testing architecture
for implementation. All load-bearing facts (the usage-point_ _inventory, the contrast figures, the
existing reduced-motion test emulation, the_ _palette tokens, and the i18n namespace) are re-derived
directly from source here —_ _there is no separate "loader-usage-audit" / "loader-token-reference"
/_ _"loader-contrast-analysis" file in the repository, and none is assumed; the relevant_ _findings
are folded inline below and cite verifiable file:line evidence._

## Project Context Analysis

### Requirements Overview

**Functional Requirements.** The PRD defines 25 functional requirements grouped into six capability
areas, all mapping to issue #48's four acceptance criteria (AC1–AC4):

- **Shared motion API (FR1–FR3):** one DRY motion source under `src/components/skeletons/base/`,
  exposing named timing tokens, a `motionSafeShimmer` base, and a `LoaderMotion.shape()` factory;
  five `UI*` loaders (L1–L5) each in its own folder.
- **Per-loader behavior (FR4–FR8):** L1 `UISkeletonPlaceholder` (page/form load), L2
  `UISubmitLoadingButton` (submit-button-as-loader — the primary product direction), L3
  `UIInlineLoader` (inline three-dot), L4 `UISectionLoader` (opt-in region veil), L5 `UIProgressBar`
  (reserved determinate).
- **Registration submit state (FR9–FR12):** `aria-disabled`-not-`disabled` focusable submit,
  in-flight early-return guard, retained accessible name, contrast-defect fix.
- **Reduced motion (FR13–FR14):** a single shared `prefers-reduced-motion` query constant applied at
  every animation coordination point; per-loader static affordance.
- **A11y semantics (FR15–FR19):** one `role="status"` per region (and never a second, nested
  live-region owner), container `aria-busy`, decorative shimmer `aria-hidden`, L1 landmark removal,
  debounced polite announcement, persistent (mounted-empty) status.
- **Migration + i18n (FR20–FR25):** the one existing loader migrated, new silent waits instrumented,
  the dead auth-skeleton re-export removed, and new loading announcement keys added under the
  existing `auth` namespace in both `en.json` and `uk.json`.

**Non-Functional Requirements.** The dominant architectural drivers are NFR2/NFR3 (the auth mobile
Lighthouse budget — visual is pure CSS, no new dependency, no new eager import on the auth paint
path; the small JS announcement layer runs on submit, post-paint), NFR11/NFR12 (jscpd DRY at
`minTokens 75 / threshold 0`, and rca metrics: ≤10 functions/file, file LLOC ≤120, function LLOC
≤10, args ≤3), NFR1 (zero CLS), NFR4–NFR10 (WCAG 2.1 AA), and NFR13–NFR16 (semantic-query tests,
regenerated visual snapshots, i18n completeness). "Feasible under all gates by construction" (G6) is
a first-class consumer of the design.

### Scale & Complexity

- Primary domain: frontend design system / accessibility / motion.
- Complexity level: **medium** — the primitives exist (the shimmer, the skeleton family, the
  57px-radius match between skeleton button and real submit button), but the change touches the auth
  critical path, an existing contrast/landmark defect, two forms, the switcher, reduced motion,
  i18n, and visual snapshots simultaneously, under five CI gates.
- Operational sensitivity: **high on the auth paint path** (mobile Lighthouse is the only score that
  counts), low elsewhere.
- Estimated architectural components: one extended shared `base/` motion module plus five loader
  folders plus three refactored consumers.

### Technical Constraints & Dependencies

The architecture must respect the verified codebase facts:

- The shimmer is **pure CSS** via `@emotion/react` `keyframes` in
  `src/components/skeletons/base/styles.ts`. No animation library exists or may be added.
- Every existing skeleton style file **spreads `baseSkeletonStyle`** and layers geometry on top
  (`ui-skeleton-button/styles.ts`, `ui-skeleton-text`, `ui-skeleton-block` use factory functions).
  This base-plus-geometry-override pattern is the model the loader family must follow to stay DRY.
- `SKELETON_BORDER_RADIUS = '57px'` already equals the real submit button radius
  (`ui-button/theme.ts` `contained.borderRadius: '57px'`), so the L2 in-place morph is a drop-in
  transformation.
- **The only spinner/loader in all of `src` today** is the single
  `<CircularProgress size={70} sx={styles.loader}/>` in `ui-form/index.tsx:116` (`SubmitControls`).
  It is the **only** `role="progressbar"` (MUI default) anywhere in `src`. The disabled theme
  (`ui-button/theme.ts:28-31`) is white on `#E1E7EA` (~1.25:1). The switcher (`form-section`
  `SwitcherButton`) and the retry button (`registration-error-view` `ErrorButtons`) render **no**
  loader today — they are disabled-only silent waits. This distinction is load-bearing for AC1 (see
  Migration).
- The auth-skeleton root is a **region landmark**
  (`<Box component="section" aria-label={t('auth.loadingForm')}>`, `auth-skeleton/index.tsx:115`) on
  decorative content, and `STATIC_SX = { animation: 'none', backgroundSize: '100% 100%' }` (line 18)
  is the existing static fallback to generalize. The box-shadow `shadowPulseAnimation` on the
  wrapper (`auth-skeleton/styles.ts`) and `ui-skeleton-input`'s
  `{ animation: 'none', backgroundSize: '100% 100%' }` static object are additional, separate
  animation/static points (reconciled below). `prefers-reduced-motion` is handled **nowhere in
  source**, but the visual-snapshot harness already emulates it
  (`tests/visual/take-visual-snapshot.ts:59` calls `page.emulateMedia({ reducedMotion: 'reduce' })`)
  — so existing baselines already capture the static path.
- Apollo/DI/zod are deferred off the auth critical path; nothing new may be eager-imported onto the
  auth paint path.

### Cross-Cutting Concerns Identified

- One source of motion truth shared by five loaders (jscpd `threshold 0`).
- Per-file complexity budget (rca: ≤10 functions/file, function LLOC ≤10, args ≤3).
- Auth critical-path weight (visual pure CSS, no new dep, no new eager import; the submit-path
  announcement layer adds small JS post-paint only).
- WCAG conformance: status vs. decorative split, **no nested live regions**, persistent
  (mounted-empty) status, focus-safe submit, focus management on settle, contrast, reduced motion
  across every loop, no announcement spam.
- Zero layout shift across desktop + mobile.
- i18n completeness in both locales, under the existing `auth` namespace; module i18n JSON is
  generated from source keys.
- Semantic-only selectors (no `data-testid` in `src/**`).

## Starter Template Evaluation

### Primary Technology Domain

Brownfield extension of an existing React 18.3 + MUI v7 + Emotion design system. This is not a
greenfield decision; the loader foundation already exists in `src/components/skeletons/`. The
architectural question is **how to extend the existing shimmer base into a five-member family
without re-declaring motion** and **how to morph the submit button in place without touching the
auth performance budget**.

### Foundation Options Considered

#### Option 1 (Selected): Extend the existing skeleton motion base

Promote the inlined motion constants in `skeletons/base/styles.ts` into named tokens, add one
`motionSafeShimmer` reduced-motion variant and one `LoaderMotion` geometry factory, and build each
loader as a thin per-folder geometry override that calls the factory.

- Lowest structural change; reuses the established base-plus-override pattern.
- Keeps the ≥75-token motion block in exactly one place → jscpd `threshold 0` safe.
- Pure CSS, dependency-free → auth budget safe.

#### Option 2 (Rejected): A new top-level `src/components/loaders/` family

A parallel loader tree separate from `skeletons/` would duplicate the shimmer
gradient/keyframe/timing (jscpd failure) or force every loader to cross-import from
`skeletons/base/` anyway — the same coupling without the cohesion. Rejected: it adds a project
boundary without a requirement and risks a second motion source.

#### Explicitly Rejected: an animation library or MUI `Skeleton`/`LinearProgress`

`framer-motion`, `react-spring`, MUI `Skeleton`, or MUI `LinearProgress` would each add a runtime
dependency and eager weight on the auth paint path (NFR2/NFR3 violation). The pure-CSS shimmer
already satisfies the motion need. L5 uses a hand-rolled `scaleX` bar, not `LinearProgress`, to
avoid the dependency and the `progressbar` text-contrast traps.

### Selected Foundation: Extend `src/components/skeletons/`

**Rationale.** The repository already establishes "one shared motion base + per-shape geometry
overrides" with factory functions (`getBlockSkeletonStyles`, `getTextSkeletonStyles`). The loader
family is a natural extension of that pattern. Reusing it is the lowest-risk, most maintainable
choice and is the only one that simultaneously satisfies jscpd `threshold 0`, the rca per-file
budget, and the auth Lighthouse budget.

### Initialization Command

```bash
# No new starter initialization applies.
# This is a brownfield extension of the existing skeleton/loader layer.
```

## Component Architecture

### Shared Motion Source-of-Truth (FR1, FR2, FR13, NFR11)

The single source of motion truth is `src/components/skeletons/base/`. Three additive, non-breaking
changes to the existing `styles.ts`, plus two new small files.

**1. Promote inlined motion constants into named tokens** (extends the existing `styles.ts`; the
`1.5s ease-in-out infinite alternate` string currently appears in both `baseSkeletonStyle` and
`auth-skeleton/styles.ts` `formWrapperPulse` — this absorbs that duplication):

```ts
// src/components/skeletons/base/styles.ts — additive
export const SHIMMER_DURATION = '1.4s';
export const PULSE_DURATION = '1.0s';
export const STAGGER_STEP = '120ms';
export const MOTION_EASING = 'ease-in-out';
export const MOTION_ITERATION = 'infinite alternate';

export const shimmerAnimationValue = `${shimmerAnimation} ${SHIMMER_DURATION} ${MOTION_EASING} ${MOTION_ITERATION}`;
export const pulseAnimationValue = `${shadowPulseAnimation} ${PULSE_DURATION} ${MOTION_EASING} ${MOTION_ITERATION}`;
```

`baseSkeletonStyle.animation` is rewritten to consume `shimmerAnimationValue`;
`auth-skeleton/styles.ts` `formWrapperPulse.animation` consumes `pulseAnimationValue`.

> **Paint-cost note (box-shadow is not compositable).** `pulseAnimationValue` drives
> `shadowPulseAnimation`, which animates `box-shadow` (blur radius `20px → 60px`). Animating
> `box-shadow` forces a full repaint of the blurred shadow every frame and is **not**
> GPU-compositable — a known jank source, especially on the auth critical Lighthouse path. The
> animated-property whitelist therefore **excludes `box-shadow`** (see Reduced-Motion + the L1/L4
> notes). The wrapper "glow" is retained only as an opacity transition on a pseudo-element that
> carries a **static** pre-rendered `box-shadow` (opacity is compositable); the looping `box-shadow`
> blur animation is dropped. `pulseAnimationValue` is reserved for opacity-based pulses (L3 dots),
> not for animating shadow blur on a loop.

**2. Add the single reduced-motion query constant + shimmer variant** (FR13 — one query string,
referenced by every animation coordination point so no per-loader file re-declares the media-query
literal):

```ts
// src/components/skeletons/base/styles.ts — additive
export const REDUCED_MOTION_QUERY = '@media (prefers-reduced-motion: reduce)';

export const motionSafeShimmer = {
  ...baseSkeletonStyle,
  [REDUCED_MOTION_QUERY]: {
    animation: 'none',
    backgroundImage: 'none',
    backgroundColor: SKELETON_BORDER_COLOR, // static #E1E7EA fill — affordance preserved
  },
};
```

> **Reduced motion is three coordination points, not one (FR13).** `motionSafeShimmer` only stops
> the **shimmer-box** animation. The animation family has three independent looping/transition
> sources that each need the **same `REDUCED_MOTION_QUERY` block** applied in their own style
> object: (a) `motionSafeShimmer` for shimmer boxes (L1/L2/L4 fills); (b) the wrapper glow opacity
> pulse and L3's opacity-pulse keyframe — each must carry a `REDUCED_MOTION_QUERY` branch setting
> `animation: 'none'` / opacity `1`; (c) L5's `scaleX` transition — must set `transition: 'none'`
> under `REDUCED_MOTION_QUERY`. The "one query string referenced everywhere" claim is about the
> **constant**, not a single inherited rule. The box-shadow wrapper pulse is the easy-to-miss one
> (it lives on the wrapper, not the skeleton boxes); with `box-shadow` removed from the whitelist
> the remaining wrapper glow is an opacity transition, which the same `REDUCED_MOTION_QUERY` branch
> disables.

**3. Add the geometry factory + its type-only file** (own files to respect "≤10 functions/file" and
the types-in-type-only-files convention):

```ts
// src/components/skeletons/base/loader-motion.ts  (class, not free functions)
import { motionSafeShimmer } from './styles';
import type { LoaderShape } from './loader-motion.types';

export default class LoaderMotion {
  public static shape({ width, height, borderRadius }: LoaderShape): object {
    return { ...motionSafeShimmer, width, height, borderRadius };
  }
}
```

```ts
// src/components/skeletons/base/loader-motion.types.ts  (type-only)
export interface LoaderShape {
  width: string | number;
  height: string | number;
  borderRadius: string | number;
}
```

Single-definition shared assets that live exactly once under `base/`: `shimmerAnimation`,
`shadowPulseAnimation`, `shimmerGradient`, `baseSkeletonStyle`, `motionSafeShimmer`, `LoaderMotion`,
the timing tokens, `REDUCED_MOTION_QUERY`, the submit/button breakpoint geometry ladder
(`submitButtonLadder`, see DRY Strategy), `SKELETON_BORDER_RADIUS` (`57px`), `SKELETON_BORDER_COLOR`
(`#E1E7EA`). No loader re-declares motion.

### New palette token for the L2 lifted fill (FR5, NFR4)

The L2 track uses a fill lighter-on-paper than the skeleton `#E1E7EA` border but darker than the
page so the same `0.6α` sweep reads clearly. The chosen fill is **not** an existing palette token
(verified against `src/styles/colors.ts`: it defines `background.subtle #E1E7EA`,
`grey.50 / text.secondary #969B9D`, `text.primary #404142`, `primary.main #1EAEFF`, but **nothing
`#C7CDD6`**). To honor the project's centralized-color convention (no raw magic hex in
`*/styles.ts`), a **named token is added to `src/styles/colors.ts`** and referenced everywhere:

```ts
// src/styles/colors.ts — additive
// loaderTrack: lifted skeleton-track fill for the L2 submit-loading surface.
loaderTrack: '#C7CDD6',
```

`ui-submit-loading-button/styles.ts` references `colors.loaderTrack` (never a raw `#C7CDD6`). The
token list above and the migration table are updated accordingly. If a later calibration prefers an
existing token over a new one, the token swap happens in this single place.

### The Five Loader Components (FR3 — `UI*`, one folder each)

Each loader is its own folder under `src/components/skeletons/`, with `index.tsx` + `styles.ts` +
`types.ts` (the established skeleton-folder shape) **plus a co-located `*.stories.tsx` Storybook
preview** authored with the component (FR27/FR28; follows the existing
`auth-skeleton.stories.tsx` pattern, reuses the static/`disableAnimation` opt-out so no story
scaffolding is duplicated, and renders under the a11y/docs addons). The shared visually-hidden
status text is a new tiny primitive (below) so no two loaders re-author the off-screen clip-rect
CSS.

| Id  | Component (`UI*`)       | Folder (proposed)                                    |
| --- | ----------------------- | ---------------------------------------------------- |
| L1  | `UISkeletonPlaceholder` | `src/components/skeletons/ui-skeleton-placeholder/`  |
| L2  | `UISubmitLoadingButton` | `src/components/skeletons/ui-submit-loading-button/` |
| L3  | `UIInlineLoader`        | `src/components/skeletons/ui-inline-loader/`         |
| L4  | `UISectionLoader`       | `src/components/skeletons/ui-section-loader/`        |
| L5  | `UIProgressBar`         | `src/components/skeletons/ui-progress-bar/`          |

Shared a11y primitive (one folder, reused by status-bearing loaders that have **no** existing
live-region owner — see Accessibility Wiring for the retry exception):

```text
src/components/skeletons/ui-loader-status/
  index.tsx     # persistent <span role="status" aria-live="polite" sx={visuallyHidden}>{message}</span>
  styles.ts     # visuallyHidden clip-rect fragment (single definition, FR15)
  types.ts      # { message: string }
  use-debounced-status.ts  # debounce/transition hook (FR19)
```

`UILoaderStatus` is the **single owner** of the `role="status" aria-live="polite"` contract and the
visually-hidden CSS (the repo currently has no visually-hidden helper — grep found none). It renders
an **always-present** `<span role="status" aria-live="polite">` whose `{message}` is `''` when idle
and the loading sentence when active; mounting is **never** gated on the loading flag (FR15, see
Live-Region Mounting below). It is rendered **only** in regions that do not already have a
live-region owner.

#### L1 — `UISkeletonPlaceholder` (FR4, FR18, FR21)

The composed page/form placeholder. The **existing** `auth-skeleton` is retargeted, not re-authored:
`index.tsx` keeps `TitleBlock`/`FieldRows`/`SocialBlocks`/`DividerBlock`/ `FormBody` as-is but (a)
changes the root from `<Box component="section" aria-label=…>` to a plain non-landmark `<div>`
carrying `aria-busy="true"` (FR18), and (b) renders one persistent
`<UILoaderStatus message={t('auth.loadingForm')} />` child (FR15). `styles.ts` adds the per-row
`animation-delay: index * STAGGER_STEP` cascade. The wrapper "glow" is an opacity-animated
pseudo-element carrying a **static** `box-shadow` (no looping `box-shadow` blur animation — see
paint-cost note), with a `REDUCED_MOTION_QUERY` branch disabling the opacity loop. The new
`ui-skeleton-placeholder` folder is a thin re-export wrapper around the canonical `auth-skeleton` so
the loader family has a uniform `UI*` entry point while the heavy composition stays in
`auth-skeleton`.

#### L2 — `UISubmitLoadingButton` (FR5, FR9–FR12, FR20) — primary product direction

The submit button **becomes** a shimmering skeleton track in place, same box, 57px radius.
`index.tsx` renders a `<button type="submit" aria-disabled aria-busy>` whose surface uses
`LoaderMotion.shape(...)` over the `colors.loaderTrack` (`#C7CDD6`) fill with a 1px `#969B9D`
border, retaining the submitting label in `text.primary #404142` (6.40:1 on the track). `styles.ts`
consumes the shared `submitButtonLadder` geometry fragment (DRY Strategy) so the box equals the real
button. No sibling spinner. See "Submit-button loading state" below for the full
`SubmitControls`/`ui-button` refactor, including how the rendered surface is swapped and native
`disabled` is stripped while keeping the control focusable.

> **Border contrast — corrected figure.** The `#969B9D` border on the `#FFFFFF` card computes to
> **2.81:1** (WCAG relative-luminance formula), which **FAILS** 1.4.11 Non-Text Contrast (≥3:1); on
> the lifted `#C7CDD6` track the border ratio is lower still. The earlier "3.04:1" figure was wrong
> and is corrected to **2.81:1** everywhere it appeared. The perceivable-boundary requirement is
> therefore met by **darkening the border** to `text.primary #404142`, which computes to **≈10.4:1
> on `#FFFFFF`** and **≈8.0:1 on `#C7CDD6`** — both clear ≥3:1 against the card and the track. The
> L2 border token is `colors.text.primary` (`#404142`), not `grey.50`. The label remains `#404142`
> on `#C7CDD6` (6.40:1, PASS 1.4.3).

#### L3 — `UIInlineLoader` (FR6, FR22)

Three `#969B9D` dots animating `opacity` on `pulseAnimationValue` with
`animation-delay: index * STAGGER_STEP`. `index.tsx` wraps the dots in one persistent
`UILoaderStatus`; dots are `aria-hidden`. `styles.ts` carries a `REDUCED_MOTION_QUERY` branch
pinning opacity to `1` (no loop). Fixed reserved inline box (no reflow of host text). Used by the
previously-silent switcher and the registration retry path — though on the retry path the dots are
decorative only and **no** `UILoaderStatus` is rendered (the enclosing `role="alert"` is the
live-region owner; see Accessibility Wiring).

#### L4 — `UISectionLoader` (FR7)

One-to-three `LoaderMotion.shape(...)` blocks sized to fill a section, an optional opacity-pulse
glow (pseudo-element static shadow, never an animated `box-shadow` loop), one persistent
`UILoaderStatus`, container `aria-busy`. **Opt-in only** — never placed on the auth critical-path
Suspense fallbacks. Its opacity-pulse glow carries a `REDUCED_MOTION_QUERY` branch.

#### L5 — `UIProgressBar` (FR8)

The only determinate, branded member. `index.tsx` renders `role="progressbar"` with
`aria-valuenow/min/max` and a track+fill where the fill is `transform: scaleX(value/100)` with
`linear` easing (≈200ms). `styles.ts` carries the `#E1E7EA` track / `#1EAEFF` fill; under
`REDUCED_MOTION_QUERY` the fill `transition` is `none` (jumps to value). Because it carries a real
value, `role="progressbar"` is correct and no `UILoaderStatus` is needed. Ships with no wired
consumer.

### Component / Data-Flow Description

```text
src/components/skeletons/base/
  styles.ts ──exports──▶ shimmerAnimation, shadowPulseAnimation, shimmerGradient,
                         baseSkeletonStyle, motionSafeShimmer, timing tokens,
                         REDUCED_MOTION_QUERY, submitButtonLadder, SKELETON_BORDER_*
  loader-motion.ts ─────▶ LoaderMotion.shape({ width, height, borderRadius })
        │
        ├──▶ ui-skeleton-placeholder (L1) ─┐
        ├──▶ ui-submit-loading-button (L2) ─┤
        ├──▶ ui-inline-loader (L3) ─────────┼─▶ each styles.ts = geometry + LoaderMotion.shape(...)
        ├──▶ ui-section-loader (L4) ────────┤      index.tsx = render + (persistent) UILoaderStatus
        └──▶ ui-progress-bar (L5) ──────────┘

ui-loader-status (UILoaderStatus) ──▶ single role="status" aria-live="polite" owner,
                                       mounted empty up-front, only where no existing
                                       live-region owner exists (FR15)

Consumers (data flow at runtime):
  auth/index.tsx  ──Suspense fallback──▶  L1 (FormSection chunk resolving)
  ui-form SubmitControls  ──submitting=true──▶  L2 (in place, container aria-busy, persistent status)
  form-section FormSwitcher  ──isLoadingLogin=true──▶  L3 (switcher, persistent status)
  registration-error-view ErrorButtons  ──isSubmitting=true──▶  L3 dots only
                                          (NO UILoaderStatus — enclosing role="alert" owns the region)
```

State flow for L2 (the load-bearing path): `useRegistrationForm` / `useLoginSubmitter` expose
`isSubmitting` → passed to `UIForm` as `isSubmitting` → `UIForm` computes `submitting` → `FormBody`
→ `SubmitControls` toggles L2 and the `<form>`/wrapper `aria-busy`. No store, DI, Apollo, or zod is
touched on this path.

## Submit-Button Loading State (FR5, FR9–FR12, FR20)

The headline change, refactored across `ui-form` and `ui-button`. The **visual is pure CSS** (no new
dependency, no new eager import on the auth paint path); the **accessibility/announcement layer adds
small JS** (a debounce timer + a live-region effect + a focus-safe guard) that runs **on submit,
after paint**, so the Lighthouse paint-time budget is unaffected while the "zero JS" framing is
corrected to "zero JS on the paint path."

### `src/components/ui-button` — a `loading` variant (FR12)

`UIButton` (verified) is a `forwardRef` that wraps MUI `<Button>` and applies `...rest` via
`React.cloneElement` inside a local `ThemeProvider`. The contrast defect (`theme.ts:28-31`, white on
`#E1E7EA`, ~1.25:1) is fixed at the source: the genuinely-`:disabled` (pre-submit) pairing becomes
`text.primary #404142` on `background.subtle #E1E7EA` (≈8.6:1). The button gains an optional
`loading` boolean prop in `UiButtonProps`.

**How the surface swaps without exceeding rca and without breaking the aria contract.** When
`loading` is set, `UIButton` renders the `UISubmitLoadingButton` style fragment as its rendered
surface (the cloned child keeps `type="submit"`) and applies `aria-disabled="true"` +
`aria-busy="true"` **instead of** native `disabled`. Because MUI `<Button>` still fires `onClick`
when only `aria-disabled` is set (it is not natively disabled), the in-flight guard (FR10) is
**load-bearing on every focusable `aria-disabled` control**, not just the form path. The added
`loading` branch is a single conditional that selects the surface + aria attributes; it keeps each
`UIButton` function body ≤10 LLOC and exit points ≤3 by computing the surface/attrs once and passing
them through the existing `cloneElement`/`ThemeProvider` path (no new render branch tree). No
`CircularProgress`, no animation library; the `UISubmitLoadingButton` styles are imported lazily
through the `ui-form` submit path, not eagerly at `ui-button` module top level.

### `src/components/ui-form/index.tsx` — refactor `SubmitControls` (FR5, FR9–FR11, FR20)

Current `SubmitControls` (lines 101–119) renders the disabled button **plus**
`<CircularProgress size={70}>`. The refactor:

1. **Remove** the `CircularProgress` import (line 1) and the
   `{submitting ? <CircularProgress.../> : null}` branch (line 116), and delete the `loader` style
   (`ui-form/styles.ts:94-97`). This removes the 70px sibling that caused layout shift (NFR1) and
   removes the **only** MUI `CircularProgress` / `role="progressbar"` from `src` and from the auth
   paint path (FR23, NFR3).
2. **Split** the disabled prop: native `disabled` is used **only** for the genuine pre-submit
   `isSubmitDisabled`; the **submitting** state passes `loading={submitting}` to `UIButton`, which
   sets `aria-disabled`/`aria-busy` and keeps the button focusable and `type="submit"` (FR9).
   `SubmitControlsProps` already carries `submitting`, `isSubmitDisabled`, `submitLabel` — no new
   args (rca args ≤3 preserved).
3. **Guard double-submit (FR10):** wrap the existing `buildSubmitHandler` so it early-returns when a
   submission is in flight (the focusable button can be re-activated; the guard makes re-entry a
   no-op). Implemented inside `buildSubmitHandler` so `SubmitControls` stays a pure presentational
   component.
4. **Announce (FR15, FR19):** the `<form>` in `FormBody` (line 135) gains `aria-busy={submitting}`.
   `SubmitControls` renders **one persistent** `<UILoaderStatus>` (mounted empty on initial render,
   **not** gated on `submitting`) whose text becomes `t('sign_up.form.submitting_status')` on the
   idle→loading transition and clears on settle; the existing `ErrorBanner role="alert"` /
   registration success/error `role="alert"` views carry the outcome announcement. The status node
   is a **sibling of**, not a descendant of, the `aria-busy` element (avoids AT swallowing polite
   messages inside a busy subtree). The debounce timer is cleared on unmount to avoid a dangling
   `setTimeout` (no leak / `act()` warning).
5. **Retain accessible name (FR11):** the label still swaps via `getSubmitLabelKey` (`submit_button`
   → `submitting`); the L2 track keeps the visible `#404142` label, and the persistent
   `role="status"` sentence is the **single** spoken loading announcement (the button-label change
   alone does not trigger a live announcement because there is no `aria-live` on the button — see
   Accessibility Wiring "single announcement channel").

**Form reachability in tests (no minted landmark name).** Do **not** add an `aria-label` to the
`<form>` purely to make `getByRole('form')` resolve. If the form needs an accessible name it uses
`aria-labelledby` pointing to the **existing visible form title** (the h4/title node), so the
landmark name matches the heading and no landmark-vs-heading drift or extra landmark name is
introduced on the auth page. Where no name is needed for users, tests locate the form via
role+context or via the submit button rather than minting a landmark name. The auth-page landmark
count/naming is asserted unchanged.

Both `registration-form.tsx` (passes `isSubmitting={form.isSubmitting}`) and `login-form.tsx`
(passes `isSubmitting={isSubmitting}`) are unchanged — they already feed `UIForm.isSubmitting`, so
the L2 morph is inherited by both forms with zero consumer edits.

### Auth Lighthouse budget protection

- L2's **visual** is **pure CSS** (`LoaderMotion.shape` over Emotion `sx`); it adds no runtime dep
  and no JS animation. The `CircularProgress` removal _reduces_ MUI surface on the auth paint path
  (NFR2/NFR3). The accessibility layer (debounce timer, live-region effect, focus-safe guard) is
  small JS that runs **on submit, post-paint** — not on initial paint — so the Lighthouse paint-time
  budget holds.
- `UISubmitLoadingButton` styles are reached only through the `ui-form` submit path; no loader is
  eager-imported by `auth/index.tsx`, `app.tsx`, or `index.tsx`. The critical-path Suspense
  fallbacks (`index.tsx:27`, `app.tsx:40`, the `form-section` login `<Box aria-hidden>` at line 35)
  stay unchanged (FR23).

## Reduced-Motion Implementation (FR13, FR14, NFR8)

One **query constant**, applied at **every** animation coordination point (not one inherited rule —
see the FR13 note above):

- **(a) Shimmer boxes.** `motionSafeShimmer` (in `base/styles.ts`) carries the
  `REDUCED_MOTION_QUERY` block. Because every shimmer loader's geometry comes through
  `LoaderMotion.shape(...)` (which spreads `motionSafeShimmer`), shimmer fills inherit the static
  fallback without re-declaring the query literal.
- **(b) Opacity pulses.** L3's dot keyframe and the L1/L4 wrapper-glow opacity pulse each carry
  their **own** `REDUCED_MOTION_QUERY` branch (`animation: 'none'` / opacity `1`), referencing the
  shared constant. The previously-looping `box-shadow` blur animation is removed from the whitelist
  entirely (paint-cost note), so there is no `box-shadow` loop to leak.
- **(c) L5 transition.** `ui-progress-bar/styles.ts` sets `transition: 'none'` under
  `REDUCED_MOTION_QUERY` so the fill jumps to value.
- Per-loader static affordance (FR14): L1/L4 → static `#E1E7EA` fill; L2 → static `#C7CDD6`
  (`colors.loaderTrack`) fill keeping the `#404142` 3:1+ border + label; L3 → three static `#969B9D`
  dots; L5 → jumps to value. No loader is hidden.
- The existing `STATIC_SX` opt-out in `auth-skeleton` and the `ui-skeleton-input`
  `{ animation: 'none', backgroundSize: '100% 100%' }` static object are **consolidated** to consume
  the single static source (the `motionSafeShimmer` reduced-motion fill / a shared `staticSkeleton`
  fragment) so the repo holds **one** static-skeleton notion, not three near-duplicates. The
  Storybook `disableAnimation` opt-out remains a separate, explicit author-controlled path
  (documented as intentional).

> **The test harness already emulates reduced motion.** `tests/visual/take-visual-snapshot.ts:59`
> and the auth/skeleton/registration visual specs call
> `page.emulateMedia({ reducedMotion: 'reduce' })`. Therefore the regenerated L1/L2/L3 baselines
> capture the **static** fallback, not the animated shimmer — and once the new
> `REDUCED_MOTION_QUERY` rules land, existing baselines shift to the static state by definition.
> Animated coverage is provided by a dedicated non-reduced-motion visual project (see Testing).

## Accessibility Wiring (FR15–FR19, NFR4–NFR10)

| Concern                                                  | Implementation                                                                                                                                                                                                                                                                                               | Requirement      |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| One status owner per region; **no nested live regions**  | `UILoaderStatus` (`role="status" aria-live="polite"`) rendered exactly once per region that has **no existing** live-region owner; on the retry path the enclosing `role="alert"` is the sole owner and **no** `UILoaderStatus` is rendered                                                                  | FR15             |
| Persistent (mounted-empty) status                        | `UILoaderStatus` is always present in the DOM with `message=''` when idle; only its text content changes on transition — mounting is never gated on `submitting`                                                                                                                                             | FR15             |
| Status is a sibling of `aria-busy`, not nested inside it | the `role="status"` node is placed as a sibling of the `aria-busy` element so a busy subtree does not swallow the polite message                                                                                                                                                                             | FR16             |
| Container busy state                                     | `aria-busy` on L1 root `<div>`, on the `<form>` (L2), on the host control (L3/L4)                                                                                                                                                                                                                            | FR16             |
| Decorative visuals hidden                                | all shimmer/pulse boxes + dots `aria-hidden="true"`, no role; `CircularProgress` removed (the only `progressbar` in `src` is gone)                                                                                                                                                                           | FR17             |
| L1 landmark removed                                      | root changes from `<section aria-label>` to plain `<div aria-busy>` + persistent status child                                                                                                                                                                                                                | FR18             |
| Debounced, polite, single utterance                      | status text set on transition only, debounced ~150–300ms; **a genuine idle→loading transition is always announced once** (the debounce suppresses duplicate/flicker re-announcements, never the initial loading utterance); cleared on settle; hands off to existing `role="alert"` views; never `assertive` | FR19             |
| Single announcement channel                              | the `role="status"` sentence is the one spoken loading announcement; there is **no** `aria-live` on the button, so the visible label swap does not produce a second utterance                                                                                                                                | FR19             |
| Focus-safe submit + in-flight guard on every control     | `aria-disabled`+`aria-busy` not native `disabled`; `type="submit"` retained; double-submit guarded in `buildSubmitHandler` **and** in the retry handler in `registration-error-view`                                                                                                                         | FR9, FR10        |
| Focus management on settle                               | on success/error, if the focused submit/retry control is removed/replaced, focus is programmatically moved to the `role="alert"` outcome view (so the error/success is read and actionable); on in-place revert, focus stays on the restored button — never dropped to `document.body`                       | FR9              |
| Contrast                                                 | submit label `#404142` on `#C7CDD6` (6.40:1); border `#404142` (≈10.4:1 on `#FFFFFF`, ≈8.0:1 on `#C7CDD6`); disabled text `#404142` on `#E1E7EA` (≈8.6:1)                                                                                                                                                    | NFR4, NFR5, FR12 |

### Retry path — no nested live region (FR22)

The registration retry button is rendered **inside** a container that is already
`role="alert" aria-live="polite"` (`registration-error-view.tsx:97`). Per WAI-ARIA, live regions
must not be nested. Therefore the retry path routes the visual loader (L3 dots / the
`UIButton loading` surface) **without** rendering a `UILoaderStatus` / `role="status"`: the
enclosing `role="alert"` is the single live-region owner, `aria-busy` on the retry button conveys
the pending state, and the alert's existing content carries any announcement. The retry handler in
`registration-error-view` gets its **own** in-flight early-return guard (FR10) because the
`aria-disabled` retry button is still activatable. Acceptance criteria: `queryAllByRole('status')`
**inside the error-view alert returns 0**, and there are **zero nested `aria-live` regions** on the
retry path; retry cannot double-fire.

### aria-busy settle semantics (FR16)

`aria-busy="false"` is only observable where the busy element **remains mounted**. Registration
**success replaces** the `<form>` subtree with the `role="alert"` view, so the form no longer exists
to flip to `false`. The ACs therefore distinguish two settle paths: (a) **in-place revert** (submit
fails, form remains) → assert `aria-busy` flips `true`→`false` on the still-mounted form; (b) **view
replacement** (success) → assert the busy form is **unmounted** and the `role="alert"` outcome view
is present instead. No AC asserts `aria-busy="false"` on an unmounted node.

### i18n keys to add (both `en.json` + `uk.json`, under the existing `auth` namespace, FR24, FR25, NFR16)

There is **no `common` namespace and no shared/common i18n module** in the repo — the only module
i18n files that exist are `src/modules/user/features/auth/i18n/{en,uk}.json`, and module i18n JSON
is generated per-feature. Bare `common.*` keys have no home, so all new strings live under the
existing `auth` namespace. Verified existing keys: `auth.loadingForm`, `sign_up.form.submitting`
("Signing up…"), `sign_in.form.submitting`, `sign_up.form.submit_button`. New keys to add to
`src/modules/user/features/auth/i18n/{en,uk}.json`:

| Key                              | en                                     | uk                                 |
| -------------------------------- | -------------------------------------- | ---------------------------------- |
| `sign_up.form.submitting_status` | "Submitting registration, please wait" | "Надсилання реєстрації, зачекайте" |
| `sign_in.form.submitting_status` | "Signing in, please wait"              | "Виконується вхід, зачекайте"      |
| `auth.switching_form`            | "Switching form, please wait"          | "Перемикання форми, зачекайте"     |

`auth.loadingForm` is reused for L1. L4/L5 ship with **no** auth-path consumer, so they carry **no**
new i18n key today; any string they need is added under `auth.*` when the first real consumer lands
(no `common.loading` / `common.uploading` keys are minted now). Each new string ships in both
locales in the same change.

## Migration Plan — Existing Loader vs. Newly-Instrumented Waits (FR20–FR23)

**The inventory is one existing loader plus three silent waits — not four loaders to migrate.** The
**only** spinner/loader (and the only `role="progressbar"`) in all of `src` today is the single
`CircularProgress` in `ui-form/index.tsx:116`. So issue #48's "migrate existing loader usages" and
FR23 ("no auth-path `CircularProgress` remains") reduce to **removing exactly one spinner**. The
switcher and the retry button render **no** loader today; adding loaders there is **new
instrumentation of silent waits**, not a migration. This separation keeps AC1 honest and guards the
issue's out-of-scope ("large UX redesigns unrelated to loader behavior"): the new additions are
justified below against the user's stated intent and issue scope, not relabeled as migrations.

### (a) Existing loaders to migrate

| #   | Usage point (verified)                                                                              | Today                                                                    | Migration                                                                                           | FR                        |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ------------------------- |
| 1   | `ui-form/index.tsx:116` `SubmitControls` (both forms via `registration-form.tsx`, `login-form.tsx`) | disabled button + the **only** `CircularProgress` (`size={70}`) in `src` | L2 in-place morph; **remove the spinner**; `aria-disabled`/`aria-busy`; persistent `UILoaderStatus` | FR5, FR9–FR12, FR20, FR23 |

### (b) Silent waits to newly instrument (additions, not migrations)

| #   | Usage point (verified)                                              | Today                                                               | New instrumentation                                                                                                                        | Justification                                                                                                                                    | FR         |
| --- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| 2   | `form-section/index.tsx` `SwitcherButton` (`isLoadingLogin`)        | disabled-only, **no loader**                                        | add `UIInlineLoader` (L3) + persistent `UILoaderStatus`; host `aria-busy`; `auth.switching_form`                                           | the switcher is a real wait with zero feedback today; adding a small inline indicator is loader behavior, not a flow redesign                    | FR6, FR22  |
| 3   | `registration-error-view.tsx` `ErrorButtons` retry (`isSubmitting`) | disabled-only, **no loader**; lives inside `role="alert"` (line 97) | retry uses the `UIButton loading` surface (L3 dots) with `aria-busy`; **no `UILoaderStatus`** (alert owns the region); own in-flight guard | the retry is a real submit with zero pending feedback today; the existing `role="alert"` already announces, so only a visual affordance is added | FR22, FR10 |

### (c) Dead-code removal and untouched critical-path fallbacks

| #   | Item (verified)                                                                   | Today                                                                                                                                                    | Action                                                              | FR         |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ---------- |
| 4   | `src/modules/user/features/auth/components/auth-skeleton/` re-export              | thin re-export of `@/components/skeletons/auth-skeleton`, with **zero importers** (grep finds none; `auth/index.tsx` already imports the canonical path) | **delete the dead re-export** — no importer-repointing exists to do | FR21       |
| 5   | `index.tsx:27`, `app.tsx:40`, `form-section/index.tsx:35` critical-path fallbacks | `null` / `<Box aria-hidden>`                                                                                                                             | **unchanged** (protect Lighthouse budget)                           | FR23, NFR3 |
| 6   | `ui-button/theme.ts:28-31` `:disabled` white-on-`#E1E7EA`                         | ~1.25:1 contrast defect                                                                                                                                  | recolor disabled text to `#404142`; add `loading` variant           | FR12, NFR4 |

> **Auth-skeleton "consolidation" is a dead-code deletion, not a migration of live usages.**
> `src/modules/user/features/auth/components/auth-skeleton/` has **zero importers** (grep confirms
> none), and `auth/index.tsx` already imports `@/components/skeletons/auth-skeleton` directly. There
> is therefore no "repoint importers, then delete" work — the re-export is simply removed. FR21's
> acceptance criterion is "the re-export folder is deleted and grep for its path returns no
> importers," not the vacuous "all importers point to the canonical path."

## DRY Strategy — Pass jscpd (`minTokens 75`, `minLines 5`, `threshold 0`) (NFR11)

The ≥75-token motion block must exist in exactly one place. Explicit shared-fragment plan:

- **Motion block** (gradient + `backgroundSize` + animation + reduced-motion query): lives only in
  `base/styles.ts` (`baseSkeletonStyle` / `motionSafeShimmer`). No loader `styles.ts` re-declares
  it; each spreads it via `LoaderMotion.shape(...)`.
- **Submit/button breakpoint geometry ladder.** The verified `ui-skeleton-button/styles.ts`
  height/`minWidth` ladder (`height 3.125rem` + `minWidth 19.6875rem` @375;
  `height 4.375rem`/`minWidth 33.75rem` @md; `minWidth 26.375rem` @lg; `height 3.875rem` @xl) is
  itself ~75+ tokens over 5+ lines. L2 (`ui-submit-loading-button`) must be geometry-identical to it
  and L1's submit bar reuses it — **three** files carrying the same ladder would trip jscpd.
  **Remediation:** extract the ladder into **one** exported fragment `submitButtonLadder` under
  `skeletons/base/` (or have `UISubmitLoadingButton` consume `ui-skeleton-button`'s ladder directly)
  and **spread** it in L1's submit bar and L2's track instead of re-declaring it. This ladder is on
  the explicit single-definition list. (This was the single most likely jscpd failure; it is now a
  named shared fragment.)
- **Status/`aria-live`/visually-hidden block**: lives only in `ui-loader-status`. Every status
  region renders `<UILoaderStatus>`, so the `role="status" aria-live="polite"` + clip-rect CSS is
  never copy-pasted.
- **Static-skeleton fragment**: the reduced-motion static fill is the **single** static source; the
  pre-existing `STATIC_SX` (`auth-skeleton/index.tsx:18`) and the `ui-skeleton-input`
  `{ animation:'none', backgroundSize:'100% 100%' }` object both consume it, removing two
  pre-existing near-clones rather than adding a third variant.
- **Reduced-motion media query**: the literal `@media (prefers-reduced-motion: reduce)` string is
  referenced via `REDUCED_MOTION_QUERY` from `base/styles.ts` at every coordination point (shimmer
  base, L3 opacity branch, wrapper-glow opacity branch, L5 transition branch), so the query string
  is not duplicated.
- **Timing strings**: `1.4s … infinite alternate` exists once in `shimmerAnimationValue`; the
  previously-duplicated `auth-skeleton` pulse string is rewired to `pulseAnimationValue`, _removing_
  a pre-existing near-clone.
- **Submit-button skeleton surface**: defined once in `ui-submit-loading-button/styles.ts` and
  consumed by both `SubmitControls` (L2) and the retry button via the `UIButton` `loading` variant —
  one fragment, two consumers.

Remediation policy: satisfy the gate by deduplication only; no `jscpd:ignore` directives. The first
implementation step runs `make lint-dup` after the foundation (`base/styles.ts` +
`submitButtonLadder` + `motionSafeShimmer`) lands, **before** the loader folders are authored.

## Complexity Strategy — Pass rca per File (NFR12)

Hard limits to respect: function cyclomatic ≤10, cognitive ≤15, args ≤3, exit points ≤3, function
LLOC ≤10, file LLOC ≤120, ≤10 functions/file (closures + component bodies + hooks all count).

- **One folder per loader** (`index.tsx` + `styles.ts` + `types.ts`) keeps each file far under 10
  functions and 120 LLOC. Composition lives in small sub-components, mirroring how
  `auth-skeleton/index.tsx` already splits `TitleBlock`/`FieldRows`/`SocialBlocks`/
  `DividerBlock`/`FormBody` (each a tiny function).
- **Args ≤3 via option objects**: `LoaderMotion.shape({ width, height, borderRadius })` takes one
  object. Loader props are single typed objects in each `types.ts`.
- **`LoaderMotion` is a class with static methods** (per the classes-over-free-functions
  convention), keeping the function count low and grouped.
- **`UIButton` `loading` branch** computes surface + aria attributes once (one conditional) and
  threads them through the existing `cloneElement`/`ThemeProvider` call, so each `UIButton` function
  body stays ≤10 LLOC and exit points ≤3.
- **`SubmitControls` stays ≤3 args**: `SubmitControlsProps` already has exactly three fields
  (`submitting`, `isSubmitDisabled`, `submitLabel`); the new `loading` behavior is derived from
  `submitting`, not a new arg. The double-submit guard lives inside `buildSubmitHandler` (one extra
  early-return; exit points stay ≤3); the retry guard lives inside the retry handler in
  `registration-error-view`.
- **Debounce/announcement logic** for L2/L3 lives in a small dedicated hook file
  (`ui-loader-status/use-debounced-status.ts`) so no consumer file exceeds the function-count cap
  and the debounce branch stays within cognitive ≤15; the timer is cleared on unmount.

## Testing Architecture (NFR13, NFR14, NFR15)

### Unit / integration (`make test-unit-client`, semantic queries only)

- **L1 (`UISkeletonPlaceholder`):** `getByRole('status')` length is exactly 1 and has
  `auth.loadingForm` text (FR15); `queryByRole('region', { name: /loading authentication form/i })`
  is null (FR18); root has `aria-busy="true"` (FR16); `queryByRole('progressbar')` is null (FR17).
  The `role="status"` node **exists before** load begins (mounted empty).
- **L2 / `SubmitControls`:** before submit, `getByRole('status')` exists with empty text (persistent
  mount, FR15). During submit, `getByRole('button', { name: /signing up/i })` resolves with
  `aria-disabled="true"`, `aria-busy="true"`, `not.toBeDisabled()` (FR9, FR11); triggering submit
  twice in flight calls `onSubmit` once (FR10); `getByRole('status')` receives the
  `submitting_status` text exactly **once** per submit (no second utterance — there is no
  `aria-live` on the button) (FR19); `queryByRole('progressbar')` is null (no `CircularProgress`,
  FR17). **Settle is split:** (a) **error/revert path** — the form stays mounted and
  `getByRole('form')` `aria-busy` flips `true`→`false`; (b) **success path** — the busy form is
  **unmounted** and `getByRole('alert')` is present instead (no `aria-busy="false"` asserted on an
  unmounted node, FR16). On settle, `document.activeElement` is the `role="alert"` view
  (replacement) or the restored button (revert) — **never** `document.body` (FR9 focus management).
- **Retry path (`registration-error-view`):** while submitting, `queryAllByRole('status')` **inside
  the error-view `role="alert"`** returns **0** and there are **zero nested `aria-live` regions**
  (FR22); the retry button has `aria-busy="true"`; activating retry twice in flight calls the
  handler once (FR10).
- **L3 (switcher):** switcher loading renders `getByRole('status')` with `auth.switching_form`
  (persistent, FR15); dots are not in the a11y tree (`queryAllByRole('img')` is empty, FR17).
- **L5:** `getByRole('progressbar')` with `aria-valuenow/min/max` (FR8); no `UILoaderStatus`.
- **Reduced motion (mechanism is CSS-only — no jsdom media-query assertion).** Reduced motion is
  implemented purely as `@media (prefers-reduced-motion: reduce)` blocks (`REDUCED_MOTION_QUERY`).
  jsdom does **not** evaluate media queries or compute styles from them, and **no `matchMedia` mock
  exists** (`jest.setup.ts` loads only reflect-metadata + jest-dom), so there is **no JS-observable
  "static branch" to assert** in jsdom. The unit layer therefore asserts only that the
  **`REDUCED_MOTION_QUERY` key is present in the style object** for every animated loader (a
  JS-inspectable SX key, not a runtime media match). The **authoritative** reduced-motion
  verification is the Playwright `emulateMedia({ reducedMotion: 'reduce' })` path (see Visual),
  asserting computed `animation-iteration-count !== 'infinite'` and `transition: none` for L5.
  **Every** `@keyframes`/animation in the family is enumerated and asserted disabled under reduced
  motion: shimmer base, L3 dot opacity pulse, the L1/L4 wrapper-glow opacity pulse, and L5's
  `scaleX` transition — not just the shimmer base. (PRD M4, Story 5.3 are aligned to this CSS-only
  mechanism; no "jsdom static-branch" claim remains.)
- All selectors are `getByRole`/`getByText`/`getByLabelText`/`queryByRole(..., { hidden })` — **no
  `data-testid`** (NFR15).

### Visual (`make test-visual`, mobile + desktop, chromium/firefox/webkit)

The harness already forces reduced motion (`tests/visual/take-visual-snapshot.ts:59`; every
auth/skeleton/registration spec calls `emulateMedia({ reducedMotion: 'reduce' })`), so existing
baselines already capture the **static** path and the new `REDUCED_MOTION_QUERY` rules will shift
them to the static fallback by definition. Plan:

- **Existing reduced-motion baselines (regenerate, will show the static fallback):**
  - `tests/visual/visual-comparison.auth-skeleton.spec.ts-snapshots/*` — L1 landmark→`div`
    - persistent status child + stagger (structure-affecting; regenerate). Static fill, not animated
      shimmer (harness reduced-motion).
  - `tests/visual/visual-comparison.authentication.spec.ts-snapshots/*` — L2 submit state (button
    morph replaces disabled-button + 70px spinner; geometry-identical box, pixels change;
    regenerate). Add a `submitting`-state screenshot and a bounding-box assertion proving the submit
    area is geometry-identical with `submitting` toggled (NFR1, AC2).
  - `tests/visual/visual-comparison.registration-notification.spec.ts-snapshots/*` — retry button
    L3/`loading` variant (regenerate).
- **New non-reduced-motion visual project (animated coverage).** Add a dedicated Playwright project
  (or per-spec override) that sets `emulateMedia({ reducedMotion: 'no-preference' })` so the
  **animated** shimmer/dots are actually captured. Without this, the static emulation gives the
  animated path **zero** visual coverage. This project asserts the animated branch is present (e.g.
  a shimmer-state screenshot and/or a computed `animation-iteration-count: infinite` assertion) for
  L1/L2/L3.
- **Reduced-motion verification** (Playwright `emulateMedia({ reducedMotion: 'reduce' })`, the
  existing default): assert **no** loader's `animation-iteration-count` is `infinite` and L5's
  `transition` is `none`, enumerating every animation in the family (FR13, NFR8, AC3).

The visual specs already use `interceptAuthFormChunks()`; the same interception drives L1/L2
visibility for the new shots.

## Project Structure & Boundaries

### Target-state Repository Change Delta (planning only)

**New files:**

```text
src/components/skeletons/base/
  loader-motion.ts                       # LoaderMotion.shape factory (class)
  loader-motion.types.ts                 # LoaderShape (type-only)
src/components/skeletons/ui-loader-status/
  index.tsx | styles.ts | types.ts       # persistent role=status + visually-hidden owner
  use-debounced-status.ts                # debounce/transition hook, timer cleared on unmount (FR19)
src/components/skeletons/ui-skeleton-placeholder/
  index.tsx | styles.ts | types.ts       # L1 UI* wrapper over auth-skeleton
src/components/skeletons/ui-submit-loading-button/
  index.tsx | styles.ts | types.ts       # L2
src/components/skeletons/ui-inline-loader/
  index.tsx | styles.ts | types.ts       # L3
src/components/skeletons/ui-section-loader/
  index.tsx | styles.ts | types.ts       # L4
src/components/skeletons/ui-progress-bar/
  index.tsx | styles.ts | types.ts       # L5
```

**Modified files:**

```text
src/components/skeletons/base/styles.ts                 # timing tokens, motionSafeShimmer, REDUCED_MOTION_QUERY, submitButtonLadder
src/components/skeletons/auth-skeleton/index.tsx        # landmark→div+aria-busy, persistent UILoaderStatus child (L1); STATIC_SX consumes shared static source
src/components/skeletons/auth-skeleton/styles.ts        # rewire wrapper glow → opacity transition (drop box-shadow loop); stagger; REDUCED_MOTION_QUERY branch
src/components/skeletons/ui-skeleton-input/styles.ts    # static object consumes shared static source (dedupe)
src/components/ui-form/index.tsx                        # remove CircularProgress; aria-disabled/busy; persistent status sibling; guard; focus mgmt on settle
src/components/ui-form/styles.ts                        # delete `loader` style
src/components/ui-button/index.tsx                      # add `loading` variant: swap surface, strip native disabled, aria-disabled/busy, keep type=submit
src/components/ui-button/theme.ts                       # fix :disabled contrast (#404142 on #E1E7EA)
src/styles/colors.ts                                    # add loaderTrack (#C7CDD6) token
src/modules/user/features/auth/components/form-section/index.tsx           # L3 on switcher + persistent status
src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx  # retry loading variant (NO status), own in-flight guard, focus on alert
src/modules/user/features/auth/i18n/en.json            # new auth.* loading-status keys
src/modules/user/features/auth/i18n/uk.json            # new auth.* loading-status keys
tests/visual/*-snapshots/*                              # regenerate reduced-motion baselines; add non-reduced-motion project
tests/unit/components/ui-form.test.tsx                  # aria-disabled/persistent-status/no-spinner/focus/settle-split assertions
```

**Deleted:**

```text
src/modules/user/features/auth/components/auth-skeleton/   # dead re-export, zero importers (delete)
```

### Architectural Boundaries

- **Motion boundary:** `base/` owns the shimmer keyframe, gradient, timing tokens, reduced-motion
  query, the `submitButtonLadder` geometry fragment, and `LoaderMotion`. Loaders own only their
  divergent geometry. No loader declares motion or re-declares the ladder.
- **A11y boundary:** `ui-loader-status` owns the `role="status"`/`aria-live`/visually-hidden
  contract and is rendered **only** where no existing live-region owner exists. Loaders compose it;
  they never re-author status semantics, and never nest a status inside a `role="alert"`/another
  live region.
- **Auth critical-path boundary:** loaders' visuals are pure CSS and reached only through their
  consumers' loading branches; nothing new is eager-imported by `index.tsx`/`app.tsx`/
  `auth/index.tsx`. The submit announcement layer's JS runs post-paint. Critical-path fallbacks stay
  `null`/`aria-hidden`.
- **Consumer boundary:** `registration-form.tsx`/`login-form.tsx` are untouched — they feed
  `UIForm.isSubmitting`; the L2 morph is inherited.

### Requirements-to-Structure Mapping

| Capability area                         | Files                                                                                                                         |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Shared motion API (FR1–FR3, FR13)       | `base/styles.ts`, `base/loader-motion.ts(.types.ts)`                                                                          |
| Five loaders (FR4–FR8)                  | `ui-skeleton-placeholder`, `ui-submit-loading-button`, `ui-inline-loader`, `ui-section-loader`, `ui-progress-bar`             |
| Submit state (FR9–FR12, FR20)           | `ui-form/index.tsx`, `ui-form/styles.ts`, `ui-button/index.tsx`, `ui-button/theme.ts`, `styles/colors.ts`                     |
| A11y wiring (FR15–FR19)                 | `ui-loader-status/*`, `auth-skeleton/index.tsx`, `ui-form/index.tsx`, `form-section/index.tsx`, `registration-error-view.tsx` |
| Migration / instrumentation (FR21–FR23) | `auth/index.tsx`, delete module re-export, `form-section/index.tsx`, `registration-error-view.tsx`                            |
| i18n (FR24–FR25)                        | `auth/i18n/{en,uk}.json`                                                                                                      |
| Tests (NFR13–NFR15)                     | `tests/unit/components/ui-form.test.tsx`, `tests/visual/*` (incl. new non-reduced-motion project)                             |

### Data Flow (CI gate view)

```text
PR to main
  → static testing workflow → make format → make lint
    → lint-eslint   : no data-testid in src/** (NFR15)
    → lint-tsc      : types compile (type-only files)
    → lint-dup      : jscpd threshold 0 — one motion source, one status source, one submitButtonLadder (NFR11)
    → lint-metrics  : rca per-file budget — one folder per loader, option objects (NFR12)
  → make test-unit-client : persistent role=status / aria-busy / aria-disabled / no-spinner / no-nested-live-region / focus-on-settle (NFR13)
  → make test-visual      : regenerated reduced-motion baselines + new non-reduced-motion (animated) project (NFR14)
  → mobile Lighthouse     : pure-CSS visual, no new dep, no new eager import; CircularProgress removed (NFR2/NFR3)
```

## Risks / Tradeoffs

- **R1 — L2 reads as merely disabled.** Mitigation: lift fill to `#C7CDD6` (`colors.loaderTrack`),
  add a `#404142` border (≥3:1 on both card and track), keep the `#404142` label, run a forward
  shimmer. (FR5, NFR4/NFR5.)
- **R2 — Visual regression / CLS on the auth flow.** Mitigation: in-place morph in the reserved box,
  spinner removed, bounding-box equality assertion, intentional snapshot regeneration. (NFR1, NFR14,
  AC2.)
- **R3 — jscpd failure from repeated shimmer/status/ladder fragments.** Mitigation: single
  `motionSafeShimmer` + `LoaderMotion.shape` + `UILoaderStatus` + `submitButtonLadder`; loaders
  carry only divergent geometry; run `make lint-dup` after the foundation step. (NFR11.)
- **R4 — rca failure (functions/file, args, LLOC).** Mitigation: one folder per loader, option
  objects, `LoaderMotion` class, debounce hook in its own file, single-conditional `UIButton`
  `loading` branch. (NFR12.)
- **R5 — Auth Lighthouse regression.** Mitigation: pure-CSS visual, no new dep/eager import; the
  announcement JS runs post-paint; L2 _removes_ `CircularProgress`; L4 off-critical, L5 unused.
  (NFR2/NFR3.)
- **R6 — Reduced-motion leak (a loop survives).** Mitigation: `REDUCED_MOTION_QUERY` applied at
  **all three** coordination points (shimmer base; opacity pulses incl. the wrapper glow; L5
  transition), `box-shadow` removed from the whitelist so no shadow loop exists; a test enumerates
  **every** animation and asserts each is disabled under reduced motion. (FR13, NFR8.)
- **R7 — Screen-reader spam / nested live regions / double announcement.** Mitigation: exactly one
  `UILoaderStatus` per region **and never inside an existing live-region owner** (the retry path
  renders none — the `role="alert"` owns it); status mounted empty up-front; single spoken channel
  (no `aria-live` on the button); debounced but the initial loading utterance is always announced
  once. (FR15, FR17–FR19, FR22.)
- **R8 — i18n drift / phantom namespace.** Mitigation: new keys live under the existing `auth`
  namespace (no `common` module exists) and are added to both locales in the same change; L4/L5 mint
  no key until a real consumer lands. (FR24/FR25, NFR16.)
- **R9 — Migrating both forms breaks existing `ui-form` tests.** Mitigation: update
  `tests/unit/components/ui-form.test.tsx` to persistent `role="status"` + `aria-disabled`
  - no-`CircularProgress` + split-settle + focus-management semantics; keep the genuine pre-submit
    `disabled` path working. (FR9, FR12, NFR13.)
- **R10 — Focusable submit/retry enables double submission.** Mitigation: in-flight early-return in
  `buildSubmitHandler` **and** in the retry handler in `registration-error-view`. (FR10.)
- **R11 — Focus lost at settle.** Mitigation: on success/error the focus moves to the `role="alert"`
  outcome view; on revert focus stays on the restored button; an AC asserts `document.activeElement`
  is never `document.body` after settle. (FR9.)
- **R12 — box-shadow pulse jank on the auth path.** Mitigation: `box-shadow` removed from the
  animated-property whitelist; the looping `shadowPulseAnimation` blur animation is dropped; any
  glow is an opacity transition on a pseudo-element carrying a static `box-shadow`. (NFR2/NFR8.)
- **R13 — Reduced-motion SR user gets no loading signal.** Mitigation: a genuine idle→loading
  transition is announced **once** even under reduced motion (the debounce suppresses only
  duplicate/flicker re-announcements), and `aria-busy` + the persistent `role="status"` provide a
  motion-independent signal; an AC asserts exactly one announcement for a real submission under
  `prefers-reduced-motion`. (FR19, NFR8.)
- **Tradeoff — `ui-button` gains a `loading` prop.** Accepted: a single boolean is cheaper and more
  cohesive than a second button component, keeps the L2 fragment in one place (DRY), and serves both
  `SubmitControls` and the retry button. The accessibility layer adds small post-paint JS
  (timer/effect/guard), accepted as off the paint path.

## Architecture Validation

### Coherence

All decisions chain coherently: one motion source (`base/`) feeds five geometry-only loaders; one
status source (`ui-loader-status`) provides the announcement contract and is rendered only where no
live-region owner already exists; the submit refactor removes the single spinner and switches to
focus-safe `aria-disabled` with managed focus on settle. No decision conflicts with the auth budget,
jscpd, or rca, and every load-bearing figure (2.81:1 corrected border, the one-spinner inventory,
the empty `common` namespace, the existing reduced-motion emulation) is re-derived from source.

### Requirements Coverage

FR1–FR25 and NFR1–NFR16 each map to a named file/decision above; AC1 (the one existing loader
migrated + the silent waits instrumented + the dead re-export removed), AC2 (no CLS/regression), AC3
(reduced motion across every animation), AC4 (tests pass) are each satisfied by the migration
tables, the bounding-box + visual plan (with the added non-reduced-motion project), the three-point
`REDUCED_MOTION_QUERY` coordination, and the unit/visual test architecture respectively.

### Readiness Assessment

**Status:** READY FOR IMPLEMENTATION. **Confidence:** High — medium-complexity brownfield change on
a verified foundation; the 57px radius match, the existing base-plus-override pattern, the corrected
contrast target, and the existing `isSubmitting` data flow make the load-bearing L2 morph low-risk.

**First implementation step:** extend `base/styles.ts` with the timing tokens, `motionSafeShimmer`,
`REDUCED_MOTION_QUERY`, and the extracted `submitButtonLadder`; add `loader-motion.ts(.types.ts)`;
add the `loaderTrack` token to `colors.ts`; consolidate the existing static-skeleton objects onto
the single static source; then verify `make lint-dup` and `make lint-metrics` stay green **before**
building the five loader folders.
