---
status: 'complete'
workflowType: 'ux'
project_name: 'crm'
date: '2026-06-11'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/48'
inputDocuments:
  - 'specs/planning-artifacts/loader-animation/prd.md'
  - 'https://github.com/VilnaCRM-Org/crm/issues/48'
  - 'src/components/skeletons/base/styles.ts'
  - 'src/components/skeletons/auth-skeleton/styles.ts'
  - 'src/components/skeletons/ui-skeleton-button/styles.ts'
  - 'src/components/skeletons/ui-skeleton-input/styles.ts'
  - 'src/components/ui-form/index.tsx'
  - 'src/components/ui-button/theme.ts'
  - 'src/modules/user/features/auth/components/form-section/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx'
  - 'src/modules/user/features/auth/index.tsx'
  - 'tests/visual/take-visual-snapshot.ts'
  - 'src/styles/colors.ts'
---

# UX Design Specification — Loader Animation Redesign (Issue #48)

**Author:** Sally (UX Designer) **Date:** 2026-06-11 **Source:**
[VilnaCRM-Org/crm#48](https://github.com/VilnaCRM-Org/crm/issues/48)

This is the visual and interaction source-of-truth for the five-type loader family (L1–L5) defined
in the PRD. It specifies every animated property, exact color, breakpoint size, reduced-motion
fallback, accessibility semantic, and layout-reservation technique an engineer needs to build the
family without re-deriving a single value. Everything inherits from **one shared motion source**
(Section 4) so the family stays DRY-gate clean (NFR11) and on the auth Lighthouse budget (NFR2).

> **Inputs note.** Every usage-point, token, contrast, and accessibility fact in this document is
> **re-derived directly from source** — file:line citations appear inline throughout — and is
> consistent with the PRD that ships alongside it. AC1 ("used at all identified loader usage
> points") traces to the grep-verifiable usage inventory in Section 5, not to any separate audit
> document.

A note on voice before we begin. Picture the person at the front door of the product: they have just
typed their email, their password, their name. They press **Sign Up**, and for a held breath nothing
about the world tells them whether the machine heard them. Today that breath is filled by a button
that goes flat and gray — indistinguishable from a button that is simply switched off — beside a
70-pixel spinner that jumped into existence and shoved the layout sideways. The user cannot tell _"I
submitted"_ from _"this is broken."_ Every decision in this document exists to replace that
ambiguous breath with a clear, calm, unmistakable signal: **you did it, and the system is working on
it right now.** That is the job. The five loaders are how we do it consistently everywhere a wait
can happen.

---

## 1. UX Goals & Principles

### 1.1 Experience goals

| Ref  | Goal                                                                                                                          | What the user feels                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| UXG1 | **Certainty on submit (the headline).** The pressed button visibly _becomes_ the loader in place — gray, shimmering, labeled. | "It heard me. It's working." Never "is this broken or just off?" |
| UXG2 | **One family, one language.** Every wait in the product speaks the same shimmer dialect at a different scale.                 | Familiarity — they've seen this motion before, so they trust it. |
| UXG3 | **Stillness, not jank.** Nothing jumps, grows, or pushes other content. The loader occupies the exact box the content will.   | Calm. The page is composed, not thrashing.                       |
| UXG4 | **Inclusive by default.** Reduced-motion users get a still, clear affordance; screen-reader users are told once, politely.    | "This product was built for me too."                             |
| UXG5 | **Legible at every moment.** No sub-4.5:1 text, no invisible boundaries; the loading edge is always perceivable.              | They can read the state, not guess it.                           |

### 1.2 Design principles

- **P1 — The control that was pressed becomes the feedback.** For L2 we do not bolt a spinner _next
  to_ the button; the button itself transforms. Feedback at the locus of action is the strongest
  possible "I heard you" signal. _(Serves FR5, the user's primary direction.)_
- **P2 — Motion signals on passive surfaces; contrast signals on active ones.** A page skeleton (L1)
  the user is merely watching can whisper with a faint sweep — motion alone reads as "loading." A
  button the user is actively _waiting on_ (L2) must shout a little: lifted fill + a ≥3:1 border +
  retained text, so it is "fairly visible," never merely-disabled. _(Serves the contrast analysis
  verdict and FR5/NFR5.)_
- **P3 — Looping motion is ambient, so it eases; determinate motion is honest, so it is linear.**
  L1–L4 are system-driven, continuous, ping-pong — `ease-in-out`, never springs. Only L5 maps real
  time to real progress — `linear`. _(Serves the taxonomy motion decision;
  `to-spring-or-not-to-spring`: `easing-linear-only-progress`.)_
- **P4 — One delight idiom: directional staggered light.** The premium feel comes entirely from
  light moving in the reading direction with a small per-element delay — cascade (L1, L4), forward
  sweep (L2), traveling pulse (L3), riding glow (L5). We never animate layout to feel "rich."
  _(Serves NFR1 zero-CLS.)_
- **P5 — Reserve the box, always.** Every loader is sized to the final content's footprint so the
  swap-in is invisible. Stillness (P/UXG3) is achieved structurally, not by luck. _(Serves NFR1.)_
- **P6 — Announce once, politely, then hand off.** Exactly one live-region owner per loading region,
  debounced, cleared on settle, handing the closing word to the existing `role="alert"`
  success/error views. Loading is never assertive. **A region that already has a live-region owner
  does not get a second one** (the retry path's `role="alert"` is its owner — see Section 7.1).
  _(Serves FR15, FR19, NFR10.)_
- **P7 — Decorative visuals are invisible to assistive tech.** Shimmer boxes and dots carry
  `aria-hidden`; the single status text is the only thing spoken. _(Serves FR17.)_

---

## 2. Motion / Timing Scale

The family runs on **two looping bands plus one stagger delay plus one determinate tween** —
coherent, on-tempo, and defined exactly once.

| Band                   | Token              | Value    | Easing        | Iteration             | Property animated                                              | Used by                        |
| ---------------------- | ------------------ | -------- | ------------- | --------------------- | -------------------------------------------------------------- | ------------------------------ |
| Shimmer                | `SHIMMER_DURATION` | `1.4s`   | `ease-in-out` | `infinite alternate`  | `background-position`                                          | L1, L2, L4                     |
| Pulse (opacity)        | `PULSE_DURATION`   | `1.0s`   | `ease-in-out` | `infinite alternate`  | `opacity`                                                      | L3                             |
| Glow (overlay opacity) | `PULSE_DURATION`   | `1.0s`   | `ease-in-out` | `infinite alternate`  | `opacity` of a pre-rendered static-`box-shadow` pseudo-element | L1, L4 wrapper glow (optional) |
| Stagger                | `STAGGER_STEP`     | `120ms`  | (delay only)  | n/a                   | `animation-delay`                                              | L1, L4 rows; L3 dots           |
| Progress               | (per value)        | `~200ms` | `linear`      | n/a (driven by value) | `transform: scaleX()`                                          | L5                             |

**Why these numbers.**

- `1.4s` shimmer is nudged from today's inlined `1.5s` toward band-center — a touch more life
  without becoming busy. It is the family's "structural" tempo: big surfaces breathing slowly.
- `1.0s` pulse is deliberately _faster_ than the shimmer so a pulsing element reads as "actively
  working" against the calmer shimmer. It is the "active inline" tempo.
- `120ms` stagger ≈ 1/12 of a shimmer cycle — enough to make light _rake_ across rows rather than
  blink in lockstep, small enough to feel like one gesture. It is **time-based**, so the cascade
  feels identical at 375px and at 1440px.
- `~200ms linear` tween (L5 only): honest time↔progress, the one place easing would _lie_ about how
  far along you are.

**On `alternate` + `ease-in-out` (easing coherence).** Both looping bands use
`ease-in-out infinite alternate`, which means the motion **decelerates to zero velocity at both
extremes of every half-cycle** — there is a brief dwell/pause at each end of the bounce. We keep it
deliberately, not by inertia: the ping-pong avoids the hard position-snap that `infinite`
(non-alternate) would produce when `background-position` wraps `100% → 0%`, and the gentle dwell
reads as "breathing" on the large passive surfaces (L1/L4). **The one place a continuous sweep
matters more than a calm bounce is L2** ("fairly visible / actively working"); there the short dwell
is acceptable because the _contrast_ channel (lifted fill + ≥3:1 border + label) carries the
"working" signal independent of motion, so the sweep does not have to feel perfectly continuous to
do its job. If a future iteration wants a perfectly continuous L2 sweep, switch L2 alone to
`animation-direction: normal` with a position reset and a `linear`/`ease` curve; the family default
stays `alternate` for the breathing surfaces.

**Animated-property whitelist — split by what the GPU can actually do.**

| Tier                                                     | Properties                                                      | Why                                                                                                                                                                                                                                                                                              |
| -------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Truly compositor-only (off main thread)**              | `transform: scaleX`, `opacity`                                  | Handled on the compositor thread; no paint, no layout. Use freely.                                                                                                                                                                                                                               |
| **Paint-cheap but NOT compositor (repaints each frame)** | `background-position`                                           | The gradient is **re-rasterized every frame** — this is a _paint_ operation, not a pure compositor operation. Acceptable here **only because** the painted areas (skeleton boxes, the L2 track) are small and bounded, so per-frame raster cost is negligible. It is **not** "GPU-compositable." |
| **Forbidden (paint-bound, expensive)**                   | `box-shadow` (animated), `width / height / top / left / margin` | Animating `box-shadow` forces a **full repaint of the blurred shadow every frame** (large blur radius = expensive raster) — a well-known jank source; never animate it on a loop. Geometry properties cause layout + CLS.                                                                        |

**Zero-CLS claim (kept separate and still valid):** because the family never animates
`width / height / top / left / margin`, loaders contribute **zero** to Cumulative Layout Shift
(NFR1). This is a layout guarantee and is independent of — and must not be conflated with — the
(more nuanced) compositor/paint discussion above.

**Glow without box-shadow jank.** Where a soft "glow" is wanted on a wrapper (L1/L4), do **not**
animate `box-shadow`. Instead, render a pseudo-element that carries a **static** `box-shadow` and
animate its **`opacity`** (compositor-only) between two values. This delivers the same pulsing-glow
read with zero per-frame raster. The legacy `shadowPulseAnimation` in
`src/components/skeletons/base/styles.ts:12` (which animates `box-shadow` from
`0px 7px 20px 0px …0.2` to `0px 7px 60px 0px …0.8`) is therefore **retired from the animated path**
— it is replaced by the static-shadow-plus-opacity overlay, or dropped entirely. See Section 4.4 and
the architecture's `pulseAnimationValue` note.

---

## 3. Reduced-Motion Strategy

**Important context — the test harness already emulates reduced motion.** It is **not** true that
"no `prefers-reduced-motion` handling exists in the codebase": no _runtime CSS_ handles it, but the
**visual-snapshot harness already forces it**. `tests/visual/take-visual-snapshot.ts:59` and every
auth/skeleton/registration visual spec call `page.emulateMedia({ reducedMotion: 'reduce' })`. This
has two consequences the plan must respect:

1. Today's baselines are _already_ captured under reduced motion, so they show the
   currently-unconditional shimmer **as it renders under emulated reduce** (the CSS does not yet
   branch, so motion still appears). **Once the new `@media (prefers-reduced-motion: reduce)` rule
   lands, those existing baselines shift to the STATIC fallback** and must be regenerated knowingly
   — see Section 10 / UXAC10 and the test plan.
2. If we rely solely on the existing reduced-motion specs, the **animated path gets zero visual
   coverage**. We therefore add an explicit **non-reduced-motion visual project** (or a dedicated
   story) so the animated shimmer is actually snapshotted — see UXAC10.

**Contract — one shared rule for the shimmer boxes, plus two more coordination points.** A single
`@media (prefers-reduced-motion: reduce)` block lives in the shared source (Section 4) and is
inherited by the shimmer boxes via `motionSafeShimmer`. **But spreading `motionSafeShimmer` does
NOT, by itself, stop every looping animation in the family** — three loops live outside the shimmer
base and need their own coordinated reduced-motion handling:

| Coordination point                                                                            | What it covers                                                                                                                                                                                                               | Why it is separate                                                                                                                                                                                    |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (a) `motionSafeShimmer`                                                                       | The shimmer boxes (L1/L2/L4 `background-position`)                                                                                                                                                                           | The shared base.                                                                                                                                                                                      |
| (b) Same `REDUCED_MOTION_QUERY` applied to the **glow overlay** AND **L3's opacity keyframe** | L1/L4 wrapper glow (the legacy `formWrapperPulse` lived on the wrapper, _not_ in `baseSkeletonStyle` — verified `auth-skeleton/styles.ts:17`); L3's `opacity 0.35→1` pulse is a different keyframe set, not the shimmer base | These animations are applied **independently** of the skeleton boxes, so they do not inherit the base media query. The wrapper glow is the easiest to miss precisely because it lives on the wrapper. |
| (c) `transition: none` on **L5**                                                              | L5's `scaleX` value tween                                                                                                                                                                                                    | L5 is a transition, not a keyframed loop; it needs its own opt-out.                                                                                                                                   |

So **reduced motion = three coordination points, not one.** FR13's "single rule" wording is
reconciled to this reality: a single _shared shimmer rule_ exists, but the contract requires it to
be **applied at three sites**. The architecture's per-file `REDUCED_MOTION_QUERY` branches for L3/L5
are not a contradiction — they are points (b) and (c) of this same contract.

**No loader animation is ever `infinite` under reduced motion** (NFR8). Nothing is hidden — the user
still gets a clear, static loading affordance (FR14).

| Loader | Reduced-motion fallback (what remains)                                                                                                                                                                                    |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| L1     | Static `#E1E7EA` fills in the full form silhouette. Layout reserved → still unmistakably "loading." Stagger **and** the wrapper glow both stop (glow via point (b)).                                                      |
| L2     | Static **`#C7CDD6`** fill, **`#404142` ≥3:1 border retained**, **label retained** ("Signing up…"). Changed fill + ≥3:1 edge + text still say "active/loading" with zero motion.                                           |
| L3     | Three **static `#969B9D` dots at full opacity** (opacity floor stops at 1, not at 0.35 — point (b) — so the dots stay at their full `3.04:1` non-text contrast, never the dimmed minimum; see Section 5.3). Travel stops. |
| L4     | Static `#E1E7EA` block(s); no shimmer, no glow (glow via point (b)). The veil still marks the region.                                                                                                                     |
| L5     | Drop the riding shimmer **and** the tween (`transition: none` — point (c)); the fill **jumps** straight to its current value. Progress is information, so it still updates — just without motion.                         |

**Verification mechanism — one coherent path (CSS-only + Playwright).** Reduced motion is
implemented purely as CSS `@media (prefers-reduced-motion: reduce)` blocks. **jsdom does not
evaluate media queries or compute styles from them**, and no `matchMedia` mock exists anywhere in
the repo (verified: `jest.setup.ts` loads only `reflect-metadata` + `jest-dom`; `setup-bun-dom.ts`
has none; no `matchMedia` in `tests/` or `src/`). A CSS-only media query therefore produces **zero
JS-observable difference in jsdom** — there is no runtime "static branch" to assert. We resolve the
previously-contradictory verification story as follows:

- **Authoritative reduced-motion assertion → Playwright** with
  `emulateMedia({ reducedMotion: 'reduce' })` (the harness already does this, see above): assert
  each loader's computed `animation-iteration-count` is **never `infinite`**, and enumerate every
  `@keyframes`/animation in the family (shimmer, L3 opacity pulse, glow overlay opacity) asserting
  each is disabled, plus L5 `transition: none`.
- **jsdom may assert only what is JS-inspectable:** that the static SX object / class carrying the
  reduced-motion rule is present in the element's `style`/`sx` prop (i.e. the rule is an inspectable
  key in the emitted style object), **not** that a runtime media match flipped a branch. No
  `matchMedia` mock is added, because nothing in the design reads `matchMedia` in JS (keeping the
  auth path free of an extra JS read).

This replaces every "jsdom static-branch assertion that the reduced-motion branch is applied" claim
with the split above. PRD M4, the Architecture, and Epics Story 5.3 are updated to match.

---

## 4. Shared Base (DRY Source-of-Truth)

All five loaders extend **one** motion module in `src/components/skeletons/base/styles.ts`.
Per-loader `styles.ts` files carry **only** geometry + a spread of the shared style — mirroring the
existing `getBlockSkeletonStyles` / `getTextSkeletonStyles` factory pattern. The ≥75-token motion
block exists in exactly one place, so the jscpd gate (`minTokens 75`, `minLines 5`, `threshold 0`)
never sees a clone (NFR11).

### 4.1 Tokens — promote today's inlined strings into named exports

```css
/* base/styles.ts (conceptual) — the family's motion constants, defined once */
/* SHIMMER_DURATION : 1.4s   structural sweep band */
/* PULSE_DURATION   : 1.0s   active inline accent / glow-overlay band */
/* STAGGER_STEP     : 120ms  per-element cascade delay */
/* MOTION_EASING    : ease-in-out   (looping ambient → ease, never spring) */
/* MOTION_ITERATION : infinite alternate   (ping-pong, no hard restart snap) */

@keyframes shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 100% 0;
  }
}

.skeleton-base {
  background-image: linear-gradient(
    90deg,
    rgba(211, 216, 224, 0) 0%,
    rgba(211, 216, 224, 0.6) 49.13%,
    rgba(211, 216, 224, 0) 100%
  );
  background-size: 200% 100%;
  /* shimmerAnimationValue = shimmer SHIMMER_DURATION MOTION_EASING MOTION_ITERATION */
  animation: shimmer 1.4s ease-in-out infinite alternate;
}
```

### 4.2 The single reduced-motion rule — inherited by the shimmer boxes

```css
/* motionSafeShimmer = .skeleton-base + this ONE media query (REDUCED_MOTION_QUERY),
   reused by every shimmer box. NOTE: the glow overlay (4.4) and L3's opacity pulse
   must ALSO apply REDUCED_MOTION_QUERY — see Section 3, coordination point (b). */
@media (prefers-reduced-motion: reduce) {
  .skeleton-base {
    animation: none;
    background-image: none;
    background-color: #e1e7ea; /* SKELETON_BORDER_COLOR — static gray affordance */
  }
}
```

### 4.3 The single geometry factory — thin per-loader overrides

```css
/* LoaderMotion.shape({ width, height, borderRadius }) returns motionSafeShimmer
   spread + those three geometry values. Each loader's styles.ts calls it and
   adds only its breakpoint object — no loader re-declares the gradient/keyframe. */

/* L1 row, md breakpoint */
.l1-input-row {
  /* LoaderMotion.shape */
  height: 4.9375rem;
  border-radius: 0.5rem;
}
/* L2 submit track, md */
.l2-submit-track {
  /* LoaderMotion.shape + submitButtonLadder */
}
/* L4 panel block */
.l4-block {
  /* LoaderMotion.shape */
  height: 40%;
  border-radius: 0.75rem;
}
```

### 4.4 The shared submit/button breakpoint-geometry ladder (jscpd-critical)

The verified `ui-skeleton-button/styles.ts` height/`minWidth` ladder (`height 3.125rem` +
`minWidth 19.6875rem` @375 · `height 4.375rem` / `minWidth 33.75rem` @md · `minWidth 26.375rem` @lg
· `height 3.875rem` @xl) is itself **~75+ tokens over 5+ lines**. L1's submit bar **and** L2's track
both need this _exact_ geometry. Re-declaring it in three files (`ui-skeleton-button`, L1's submit
bar, `ui-submit-loading-button`) **will trip jscpd** (minTokens 75, minLines 5, threshold 0, mode
mild). Therefore:

- Extract the ladder into **one** exported style fragment under `skeletons/base/` (e.g.
  `submitButtonLadder`), **or** have `UISubmitLoadingButton` consume `ui-skeleton-button`'s ladder
  directly.
- L1's submit bar and L2's track **spread that one fragment** instead of re-declaring it.
- The ladder is added to the **explicit single-definition list** in the DRY strategy (Section 4.5 /
  NFR11), alongside the shimmer block and visually-hidden CSS.
- Run `make lint-dup` **after the foundation step** (the architecture's "first implementation step")
  and again after authoring the loader folders, before proceeding.

### 4.5 The glow overlay — static shadow, animated opacity

```css
/* Replaces the retired box-shadow keyframe. A pseudo-element carries a STATIC
   box-shadow; only its opacity animates (compositor-only, no per-frame raster). */
.loader-glow::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: 0px 7px 60px 0px rgba(211, 216, 224, 0.8); /* static, pre-rendered */
  opacity: 0.25;
  animation: glow-opacity 1s ease-in-out infinite alternate; /* opacity only */
}
@keyframes glow-opacity {
  0% {
    opacity: 0.25;
  }
  100% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  /* coordination point (b) */
  .loader-glow::after {
    animation: none;
    opacity: 0.4;
  }
}
```

Each loader folder is `index.tsx` + `styles.ts` + `types.ts` (≤10 functions/file, function LLOC ≤10,
args grouped into one options object — NFR12). Single-definition shared assets under `base/`:
`shimmerAnimation`, the **glow-opacity** keyframe (the box-shadow keyframe is retired),
`shimmerGradient`, `baseSkeletonStyle`, `motionSafeShimmer`, `LoaderMotion`,
**`submitButtonLadder`**, the Section-2 tokens, `SKELETON_BORDER_RADIUS` (`57px`),
`SKELETON_BORDER_COLOR` (`#E1E7EA`).

---

## 5. The Five Loader Types — Full Spec Cards

Breakpoint ladder used throughout (verified against `src/components/ui-breakpoints` and
`base/styles.ts`): base `<375px` · `SMALL_MOBILE 375` · `md 768` · `lg 1024` · `xl 1440`.

### 5.0 Usage-point inventory — re-derived from source (replaces the phantom audit)

The issue task "migrate existing loader usages" and FR23 ("no auth-path `CircularProgress` remains")
reduce, **in verified fact**, to removing **exactly one spinner**. Conflating "add a loader where
none existed" with "migrate an existing loader" inflates AC1 coverage, so the inventory is split:

**(a) Existing loaders to MIGRATE (the only spinner in all of `src/`):**

| Existing loader                                                  | Source                                                     | Action                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------- |
| The **only** `CircularProgress` / `role="progressbar"` in `src/` | `ui-form/index.tsx:116` (`size={70}`, in `SubmitControls`) | Delete; the submit button **becomes** the L2 loader. |

Grep confirms this is the **single** spinner/`role="progressbar"` in the codebase. The page
skeleton, the switcher, and the retry button **do not use any spinner/loader today** — so they are
not "migrations."

**(b) Silent waits to NEWLY INSTRUMENT (no loader exists there today):**

| Silent wait               | Source                                                        | New loader                                                                | Justification vs issue #48                                                                                                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Switcher (login↔register) | `form-section` `SwitcherButton`, `form-section/index.tsx:103` | L3 (new)                                                                  | The switcher currently gives **no** feedback (disabled-only). Adding L3 directly serves the issue's "Ensure accessible semantics where loaders communicate pending state" — it instruments an existing _silent pending state_, not a "large UX redesign." |
| Retry                     | `registration-error-view.tsx` `ErrorButtons` (retry button)   | L2 variant (new) — **but see Section 7.1 for its live-region constraint** | The retry has a real in-flight wait today with no perceivable loading signal. Instrumenting it is in-scope ("accessible semantics … pending state").                                                                                                      |
| L1 page skeleton          | `auth/index.tsx:16` fallback                                  | L1 (already a skeleton)                                                   | Enhancement of an existing skeleton's semantics, not a new spinner.                                                                                                                                                                                       |
| Lazy boundaries (L4)      | opt-in only                                                   | L4 (new, off critical path)                                               | Opt-in; must not brush "large UX redesigns unrelated to loader behavior" — kept off auth critical path and not forced on any flow that intentionally had no loader.                                                                                       |

**Scope guard.** Adding L3/L2-retry instruments _flows that already wait silently_; it does **not**
redesign flows that intentionally have no wait. This is the issue's "accessible semantics where
loaders communicate pending state," not the out-of-scope "large UX redesigns / replacing flows with
skeleton screens."

### 5.1 L1 — `UISkeletonPlaceholder` (page / form initial load)

**Serves:** FR4, FR18, FR21 · **Replaces:** `auth/index.tsx:16` `AuthSkeleton` fallback. **Dead-code
removal (not a migration):** the module-local
`src/modules/user/features/auth/components/auth-skeleton/` folder is a thin re-export with **ZERO
importers** — grep finds none, and `src/modules/user/features/auth/index.tsx` already imports the
canonical `@/components/skeletons/auth-skeleton` directly. FR21 / Story 4.4 is therefore a
**dead-code deletion**: there are no importers to repoint, so the re-export is simply deleted. Do
**not** present it as migrating live usages.

**Anatomy.** A pixel-faithful silhouette of the final auth form, top to bottom: title bar → two
subtitle lines → three field rows (label chip + input pill) → submit button bar → divider with
centered text chip → four social-button blocks (responsive grid) → switcher text chip. Composed from
the existing `ui-skeleton-text` / `ui-skeleton-input` / `ui-skeleton-block` / `ui-skeleton-button`
primitives, all drawing on the shared base.

**States.** `idle` (not mounted) → `loading` (mounted while the lazy `FormSection` chunk resolves,
shimmering) → `settled` (unmounted; real form swaps into the same box). No hover/focus states —
decorative, non-interactive.

**Animation parameters.**

| Element                 | Token              | Duration              | Easing                               | Property                                                                                                         |
| ----------------------- | ------------------ | --------------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| All bars                | `SHIMMER_DURATION` | `1.4s`                | `ease-in-out` (`infinite alternate`) | `background-position` (over `backgroundSize: 200% 100%`)                                                         |
| Row cascade             | `STAGGER_STEP`     | `index × 120ms` delay | (delay only)                         | `animation-delay` → light rakes top-to-bottom                                                                    |
| Wrapper glow (optional) | `PULSE_DURATION`   | `1.0s`                | `ease-in-out` (`infinite alternate`) | **`opacity`** of a pseudo-element carrying a static `box-shadow` (Section 4.4) — **never animated `box-shadow`** |

**Sizing per breakpoint (rem).** Input rows: `clamp(3rem, 4vw, 4rem)` base → `4.9375rem` at md →
capped `4rem` at xl (verbatim from `ui-skeleton-input/styles.ts`). Submit bar: consumes the **shared
`submitButtonLadder`** (Section 4.4) — `3.125rem` base/mobile → `4.375rem` at md/lg → `3.875rem` at
xl; `minWidth` `19.6875rem` (≥375) → `33.75rem` (md) → `26.375rem` (lg/xl). Radii mirror real
content: `57px` pills, `0.5rem` input containers.

**Colors / contrast.** Shimmer tint `#D3D8E0` at 0.6α peak; static fill / borders `#E1E7EA`. Gray
skeleton family only — never brand blue. The sweep peak is ~1.17–1.23:1 _by design_ — on a passive
page skeleton, **motion** (not contrast) signals "loading" (principle P2; contrast analysis §2).
Carries **no text**, so no 4.5:1 obligation applies.

**Reduced-motion fallback.** Via `motionSafeShimmer` (point a) + the glow overlay's own
`REDUCED_MOTION_QUERY` (point b): shimmer, stagger, and glow all stop → every bar is a flat
`#E1E7EA` fill; layout stays reserved.

**Accessibility.** Root is a plain `<div aria-busy="true">` — **not** a `<section aria-label=…>`
landmark (FR18: remove the mislabeled region landmark). Exactly one child
`role="status" aria-live="polite"` with **visually-hidden** `auth.loadingForm` ("Loading
authentication form"), **mounted empty on first render and only its text populated** when loading
begins (live-region mounting rule, Section 7.2). All shimmer boxes `aria-hidden="true"` (FR17).
`aria-busy` clears when the real form mounts. No focus management.

**No-layout-shift technique.** Every shape mirrors its real control's box, so the swap is
pixel-stable at all breakpoints (P5/NFR1). The minimal `form-section` LoginForm `<Box aria-hidden>`
fallback stays as-is (fast path, FR23).

---

### 5.2 L2 — `UISubmitLoadingButton` (submit-button loading — THE required state)

**Serves:** FR5, FR9, FR10, FR11, FR12, FR16, FR20 · **Replaces:** the `SubmitControls`
disabled-button-plus-`size={70}`-`CircularProgress` pattern (`ui-form/index.tsx:116`) for
`registration-form.tsx:42` and `login-form.tsx:26`. **Also used (as a new instrumentation, not a
migration) by** the `registration-error-view.tsx` retry button — **with the live-region exception in
Section 7.1** (the retry path renders **no** `role="status"`).

> This is the user's explicit, primary direction. See the dedicated deep-dive in Section 6 for the
> before/after, the rationale, and the exact emotion `sx`.

**Anatomy.** The real submit button's box, in place, same `57px` radius: a lifted skeleton-gray
track + a 1px **`#404142`** boundary + the retained centered label, with the shimmer sweeping
left→right across the track. **No sibling spinner.**

**States.** `idle` (real `#1EAEFF` button, label "Sign Up") → `loading` (`submitting === true`:
morphs to the gray shimmer track, label "Signing up…", `aria-disabled`/`aria-busy`) → `settled`
(reverts to real button **or** the view is replaced by the success/error alert; see the **focus
hand-off** rule below and Section 9). The pre-submit `isSubmitDisabled` state is a _separate_
genuinely-disabled appearance (Section 6.4).

**How `UIButton loading` swaps its surface (verified component contract).** `UIButton` is a
`forwardRef` wrapping MUI `<Button>` and applying `...rest` via `React.cloneElement` inside a local
`ThemeProvider`. When `loading` is set:

- It renders the **L2 skeleton track surface** as the button's content/background and **strips the
  native `disabled` attribute**, applying `aria-disabled="true"`
  - `aria-busy="true"` instead, while keeping `type="submit"` and the element **focusable**. (MUI
    `<Button disabled>` plus the theme `&:disabled` styling is what produces today's disabled look;
    we bypass it.)
- **Re-entrancy guard is load-bearing and must exist on BOTH paths.** `aria-disabled` does **not**
  prevent MUI from firing `onClick`, so a focusable `aria-disabled` submit/retry control **can
  double-fire** unless guarded. The submit path is guarded by the early-return in
  `buildSubmitHandler` (`ui-form`). The **retry path has no such guard today** — FR10 requires an
  explicit in-flight guard added to the retry handler in `registration-error-view` so retry cannot
  double-fire. (Unit AC below.)
- The added `loading` branch must keep `UIButton` within rca limits: function bodies ≤10 LLOC, exit
  points ≤3 — extract the surface-swap into a small helper if needed rather than branching inline.

**Animation parameters.**

| Element     | Token              | Duration | Easing                               | Property                                                          |
| ----------- | ------------------ | -------- | ------------------------------------ | ----------------------------------------------------------------- |
| Track sweep | `SHIMMER_DURATION` | `1.4s`   | `ease-in-out` (`infinite alternate`) | `background-position`, **left→right** (forward/reading direction) |

**Sizing per breakpoint (rem).** Geometry-identical to the real button by **spreading the shared
`submitButtonLadder`** (Section 4.4 — not a re-declared ladder): height `3.125rem` mobile →
`4.375rem` md/lg → `3.875rem` xl; `minWidth` `19.6875rem` (≥375) / `33.75rem` (md) / `26.375rem`
(lg/xl); radius `57px`; padding `20px 32px` (verbatim from `ui-button/theme.ts`).

**Colors / contrast (all WCAG-verified, contrast analysis §3 — corrected).**

| Surface    | Value                                                                        | Pair               | Ratio      | WCAG                              |
| ---------- | ---------------------------------------------------------------------------- | ------------------ | ---------- | --------------------------------- |
| Track fill | `#C7CDD6` (lifted from `#E1E7EA` so the 0.6α sweep reads — "fairly visible") | —                  | —          | in-flux fill, no SC               |
| Boundary   | `1px #404142` (`text.primary`)                                               | on `#FFFFFF` card  | **9.93:1** | **1.4.11 PASS**                   |
| Boundary   | `1px #404142`                                                                | on `#C7CDD6` track | **3.45:1** | **1.4.11 PASS**                   |
| Label      | `#404142` (`text.primary`)                                                   | on `#C7CDD6` track | **6.40:1** | **1.4.3 PASS**                    |
| (rejected) | `#969B9D` border                                                             | on `#FFFFFF`       | **2.81:1** | **FAIL** (and lower on the track) |
| (never)    | `#FFFFFF`                                                                    | on track           | 1.60:1     | FAIL — never use                  |

> **Corrected border (was the load-bearing defect).** The previously-cited `#969B9D` border ratio of
> **3.04:1 was wrong**: the true WCAG ratio for `#969B9D` on `#FFFFFF` is **2.81:1**, which
> **FAILS** 1.4.11 (≥3:1), and on the `#C7CDD6` track it is even lower. We therefore **darken the
> boundary to `#404142` (`text.primary`)**, which reaches **9.93:1 on the `#FFFFFF` card and 3.45:1
> on the `#C7CDD6` track** — clearing ≥3:1 against **both** the card and the track. The "each
> loading-control boundary ≥3:1" criterion is met by this corrected design. The false `3.04:1`
> figure is removed everywhere it appeared.

**Reduced-motion fallback.** Sweep freezes to a static `#C7CDD6` fill; the `#404142` ≥3:1 border and
the "Signing up…" label remain. Changed fill + ≥3:1 edge

- text still read "loading," motionless.

**Accessibility.** `aria-disabled="true"` + `aria-busy="true"`, **not** native `disabled` (FR9) —
stays focusable so a keyboard/SR user is not stranded; `type="submit"` preserved; the submit handler
early-returns while in-flight so focusability cannot double-submit (FR10), **and the retry handler
has its own in-flight guard** (above). Accessible name always present — the visible label _is_ the
name, swapping `submit_button` → `submitting` (FR11). The `size={70}` `CircularProgress` is
**deleted** (FR17/FR20).

- **Submit form path:** the submit area owns **one** `role="status" aria-live="polite"`
  (`UILoaderStatus`), **mounted empty on the form's initial render** (Section 7.2), carrying the new
  `sign_up.form.submitting_status` ("Submitting registration, please wait" / "Надсилання реєстрації,
  зачекайте") — written **once** on the idle→loading transition, debounced 150–300ms (FR19); on
  settle it hands off to the existing `role="alert"` view and clears (P6). **Exactly one**
  announcement channel: the button's visible-label change (its name) is **not** wrapped in
  `aria-live`, so it does not double-speak against the status sentence (Section 7.3).
- **Retry path:** renders **NO `role="status"`** — see Section 7.1. The enclosing `role="alert"`
  already owns the live region; `aria-busy` on the retry button conveys pending state.

**Focus-visible on the L2 track (FR20 / 2.4.7).** The L2 surface is a shimmer track, but the control
is still a focusable `<button>`. The real button's `&:focus-visible` ring lives in the MUI theme and
is **bypassed** when the surface is swapped, so the L2 track **must carry its own visible focus
indicator** (a focus ring on the `<button>` that remains visible while it renders the shimmer
surface). This keeps 2.4.7 (Focus Visible) intact alongside the 2.1.1/2.4.3/4.1.2 claims, and
prevents a keyboard user from being confused by a focusable control that looks like a skeleton
placeholder. **AC:** the submitting button shows a focus indicator and remains in tab order with its
accessible name.

**Focus hand-off at loading→settle (FR; 2.4.3 / 3.2.x).** If the focused submitting control is
**removed or replaced** on settle (success/error replaces the submit subtree with the `role="alert"`
view), focus must be moved programmatically to a deterministic target — the `role="alert"` summary
(so the outcome is read and actionable). On the **in-place revert** path, focus returns to the
restored real button. Focus must **never** drop to `document.body`. **AC:** after settle,
`document.activeElement` is the alert container (replacement) or the restored button (revert), never
`body`.

**No-layout-shift technique.** Morphs **inside the reserved box**; toggling `submitting` is
geometry-neutral at every breakpoint because no 70px sibling appears/disappears (the root cause of
today's shift). Playwright bounding-box assertion confirms byte-identical geometry (NFR1/M2).

---

### 5.3 L3 — `UIInlineLoader` (small inline indeterminate indicator)

**Serves:** FR6, FR22 · **Instruments (new):** the silent login/register switcher loading state
(`form-section/index.tsx:103`). The switcher gives **no** feedback today (disabled-only), so this is
a new addition, not a migration of an existing loader (Section 5.0).

**Anatomy.** Three small dots in a fixed-width inline box, sized to sit inside or beside a small
control where a full skeleton track is overkill and a 70px spinner is absurd.

**States.** `idle` (absent) → `loading` (three dots travelling) → `settled` (removed). The host
control is `aria-busy` while loading.

**Animation parameters.**

| Element    | Token            | Duration              | Easing                               | Property                                              |
| ---------- | ---------------- | --------------------- | ------------------------------------ | ----------------------------------------------------- |
| Each dot   | `PULSE_DURATION` | `1.0s`                | `ease-in-out` (`infinite alternate`) | `opacity` **`0.5 → 1`** (raised floor — see contrast) |
| Dot travel | `STAGGER_STEP`   | `index × 120ms` delay | (delay only)                         | `animation-delay` → gentle left-to-right rhythm       |

Opacity-only at this size (compositor-only, no sweep geometry, no layout). Faster `1.0s` tempo so it
clearly reads "actively working," distinct from a passive placeholder. This opacity keyframe is a
**separate** keyframe set from the shimmer base, so it must apply `REDUCED_MOTION_QUERY` itself
(Section 3, point b).

**Sizing per breakpoint (rem).** Dots `0.375rem` each in a fixed reserved inline box; identical
across breakpoints (incidental sizing, not structural). The reserved box prevents the host text line
from reflowing on toggle.

**Colors / contrast (corrected for the animated minimum).** Dots `#969B9D` (`grey.50`) are a
non-text graphic at **3.04:1 on white** at _full_ opacity. The plan previously asserted ≥3:1 "on the
white/`#F4F5F6` surface" **without accounting for the opacity minimum** — at the old `0.35α` floor
the blended dot color rises to roughly `#DADCDE` (≈1.4:1 on white), **well below the 1.4.11 3:1
floor for part of every cycle** — a borderline defect. **Fix:** the opacity floor is raised so the
dots stay ≥3:1 throughout the cycle. At `opacity 0.5` the blended dot over `#FFFFFF` is ≈`#CBCED0`
(≈**2.0:1** — still short), so for a graphic that must stay ≥3:1 we **keep the dot color at full
`#969B9D` (3.04:1) and animate `transform`/translate or a subtle scale instead of opacity** for the
"travel" read, OR cap the opacity band at `0.85 → 1` (blended ≈`#9EA2A4`, ≈**2.9:1** — still
borderline on white). **Chosen approach:** animate **dot position/scale (`transform`) with the color
held at full `#969B9D`**, so the non-text contrast never dips below **3.04:1** at any frame. Under
reduced motion the dots are static at full opacity (3.04:1). The verified minimum-state ratio is
therefore **3.04:1 on `#FFFFFF`** (and the dots are not placed on `#F4F5F6` in the switcher
context). No text on the dots → no 4.5:1 obligation.

**Reduced-motion fallback.** Travel stops; three static `#969B9D` dots at full opacity (**3.04:1**)
remain as an unmistakable in-progress mark. Never hidden.

**Accessibility.** Wrapper is `role="status" aria-live="polite"` with a visually-hidden label (new
`auth.switching_form`, both locales); **mounted empty up-front** on the switcher host and only its
text updated on toggle (Section 7.2). Dots `aria-hidden="true"`. Host control carries
`aria-busy="true"`. Polite, never assertive. **No** `role="progressbar"` (indeterminate). Inline →
no focus change.

**Decorative-hiding test (corrected contract).** The dots are plain `<span>`/`<div>` elements, which
**never have an implicit `img` role** — so `queryAllByRole('img')` is empty **whether or not**
`aria-hidden` is present and does **not** verify the decorative contract (FR17). The real assertion
is: each dot element has `aria-hidden="true"` (e.g.
`container.querySelectorAll('[aria-hidden="true"]')` matches the dots) **and** the only thing in the
a11y tree is the `role="status"` message. The misleading `queryAllByRole('img')` check is removed.

**No-layout-shift technique.** Fixed reserved inline box; the host control's line-box is unaffected
when the loader toggles.

---

### 5.4 L4 — `UISectionLoader` (route / section / overlay load)

**Serves:** FR7 · **Replaces:** nothing forced — an **opt-in** upgrade of a blank `fallback={null}`
on a **non-critical** boundary (first candidate: the login-form lazy boundary when a visible cue is
wanted).

**Anatomy.** A region-sized shimmer veil/placeholder between "tiny inline" (L3) and "full
structural" (L1) — one or more `ui-skeleton-block` fills sized to the section's reserved box, for
surfaces whose internal layout is not known precisely enough to justify a pixel-accurate skeleton.

**States.** `idle` (absent / `fallback={null}` on critical paths) → `loading` (veil shimmering; the
underlying region is veiled — see boundary rule below) → `settled` (removed; real section revealed).

**Animation parameters.**

| Element            | Token              | Duration              | Easing                               | Property                                                                                              |
| ------------------ | ------------------ | --------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Blocks             | `SHIMMER_DURATION` | `1.4s`                | `ease-in-out` (`infinite alternate`) | `background-position`                                                                                 |
| Block cascade      | `STAGGER_STEP`     | `index × 120ms` delay | (delay only)                         | `animation-delay` (same idiom as L1, smaller scale)                                                   |
| Optional card glow | `PULSE_DURATION`   | `1.0s`                | `ease-in-out` (`infinite alternate`) | **`opacity`** of a static-`box-shadow` pseudo-element (Section 4.4) — **never animated `box-shadow`** |

**Sizing per breakpoint (rem / %).** Blocks are `%`/`vh`-relative to the section
(`getBlockSkeletonStyles(width, height, borderRadius)`); panel radius `0.75rem` (12px). On mobile
collapses to a single full-width block; at ≥md may show 2–3 stacked lines. Always sized to fill the
section box → no CLS on replace.

**Colors / contrast.** Gray family only — `#D3D8E0` sweep on `#E1E7EA` blocks. No brand blue. No
text → no 4.5:1 obligation.

**Reduced-motion fallback.** Via `motionSafeShimmer` (point a) + the glow overlay's own
`REDUCED_MOTION_QUERY` (point b): static `#E1E7EA` block(s), no shimmer, no glow. The veil still
visibly marks the region.

**Accessibility — status owner MUST be a sibling of the veiled region.** Container
`aria-busy="true"` + exactly **one** `role="status" aria-live="polite"` (`UILoaderStatus`) with a
section-appropriate visually-hidden label (reuse `auth.loadingForm` for the form section; add
generic `common.loading` elsewhere), **mounted empty up-front** (Section 7.2). Blocks `aria-hidden`.

- **Boundary rule (corrected).** The `UILoaderStatus` (`role="status"`) **MUST be a sibling of the
  veiled region, never a descendant of it.** If the status node were a child of a region marked
  `aria-hidden="true"`, its text would be removed from the accessibility tree and **never
  announced** (`aria-hidden` hides the whole subtree, including any live region inside it).
- **`inert` vs `aria-hidden` — pick one (prefer `inert`).** `inert` already removes the subtree from
  focus **and** the accessibility tree, so adding `aria-hidden` on top is redundant. Use **`inert`**
  on the veiled underlying content, keep the `UILoaderStatus` **outside** the inert subtree, and do
  not also set `aria-hidden` on the same region.
- One status owner per boundary — never nest an L4 status inside an L1 status; `aria-busy` clears on
  swap-in. **AC:** with the region `inert`, `getByRole('status')` still resolves and is **not**
  within the inert subtree.

**No-layout-shift technique.** Blocks reserve the section's final footprint at each breakpoint; the
veil sits over the reserved box and never animates size. **Excluded from the auth critical paint
path** (FR7/NFR3) — the root boundaries (`index.tsx:27`, `app.tsx:40`) and the login fallback stay
`null`/`aria-hidden` to protect the mobile Lighthouse budget.

---

### 5.5 L5 — `UIProgressBar` (determinate progress — reserved, opt-in)

**Serves:** FR8 · **Replaces:** nothing today (the audit found no determinate progress). Ships as
the forward-looking determinate slot so future percentage flows use one consistent, on-brand,
accessible bar — never a faked indeterminate shimmer (a fake bar stalling at 90% _degrades_
perceived performance).

**Anatomy.** A horizontal track + a fill driven by a real `0–100` value, plus an optional percentage
label rendered **adjacent** (never on the fill). The **only** determinate, branded member.

**States.** `idle` (value 0) → `loading` (fill tweening between real values, faint brand shimmer
riding the filled portion) → `settled` (value 100 / unmounted).

**Animation parameters.**

| Element     | Token              | Duration       | Easing                               | Property                                                                                 |
| ----------- | ------------------ | -------------- | ------------------------------------ | ---------------------------------------------------------------------------------------- |
| Fill edge   | per value          | `~200ms` tween | **`linear`**                         | `transform: scaleX()` (origin left; compositor-only, not layout `width`)                 |
| Riding glow | `SHIMMER_DURATION` | `1.4s`         | `ease-in-out` (`infinite alternate`) | `background-position`, brand-tint `rgba(30,174,255,0.25)` on the **filled portion only** |

`linear` appears **only here** — honest time↔progress (principle P3).

**Sizing per breakpoint (rem).** Full-width fluid track at every breakpoint; height `~0.5rem`;
radius the family pill (`57px` scaled); `transform-origin: left`.

**Colors / contrast.** Track `#E1E7EA`; fill **`#1EAEFF`** (`primary.main`) — the single sanctioned
brand-color loader, justified because it carries **no text on the fill**, so the white-on-`#1EAEFF`
(2.46:1) and `#404142`-on-blue (4.17:1) text failures never arise (contrast analysis §4). Any
percentage label sits adjacent in `#404142` on the white card (≥4.5:1).

**Reduced-motion fallback.** Drop the riding shimmer and the tween (`transition: none` — Section 3,
point c); the fill **jumps** to the exact percentage. Progress is information, not decoration — it
still updates.

**Accessibility — announcements the markup actually produces.** `role="progressbar"` with
`aria-valuenow` / `aria-valuemin="0"` / `aria-valuemax="100"` and an accessible name (e.g.
`common.uploading`, both locales). The **one** member that legitimately keeps `progressbar` (it has
a value); L2/L3 suppress it because they are indeterminate (FR17).

> **Correction — `aria-valuenow` is NOT auto-announced.** A `role="progressbar"` whose
> `aria-valuenow` updates is **not** spoken automatically by screen readers as it changes; the value
> is announced **on focus or on query**, not on every update. The earlier "announce milestones
> politely, not every frame" wording implied automatic spoken milestone updates that this markup
> **will not deliver**. Resolved as: the progressbar value is available **on demand** (focus/query),
> and we **drop the "announce milestones" language** for the default. **If** spoken milestones are
> later desired (e.g. "50 percent"), add a **separate visually-hidden**
> `role="status" aria-live="polite"` written **only at milestones**. Since L5 ships with **no
> consumer today**, deferring that live-region milestone decision is acceptable — but the spec does
> **not** claim announcements the markup won't produce.

**No-layout-shift technique.** Track reserves full width; `scaleX` is layout- and
resolution-independent; the adjacent label wraps below on narrow widths without shifting the bar.
**Off the auth critical path** (unused by default, FR8/NFR3).

---

## 6. Deep-Dive — The Registration Submit-Button Loading State (L2)

This is the heart of issue #48 and the user's explicit direction. It deserves its own section
because the difference between "merely disabled" and "clearly submitting" lives entirely in details
that are easy to get wrong.

### 6.1 Before → After

**Before (today, `SubmitControls`, `ui-form/index.tsx:116`).**

- The `UIButton` goes `disabled`: theme paints it `#E1E7EA` fill with `#FFFFFF` text. The "Signing
  up…" label is **white on near-white** = **1.25:1** — a live WCAG 1.4.3 failure. The user
  effectively sees a flat gray rectangle with no readable text.
- Simultaneously a **separate `size={70}` `CircularProgress`** renders beside the button. It pops
  into existence, **shoving the layout** (a 70px element appears where there was none), and exposes
  `role="progressbar"` with **no accessible name** and **no `aria-busy`** on any container.
- Net read: _"a disabled gray box and a spinner that jumped in"_ — ambiguous ("broken? or off?") and
  inaccessible.

**After (L2 — the button becomes the loader).**

- The same button **morphs in place** into a **lifted gray shimmer track** (`#C7CDD6`) with a
  **visible `#404142` ≥3:1 border** and the **retained, legible label** "Signing up…" in `#404142`
  (**6.40:1**). The shimmer sweeps left→right.
- **No spinner** — the 70px sibling is deleted, so **nothing moves** in the layout.
- It is `aria-disabled`/`aria-busy` (focusable, name preserved, visible focus ring), and one polite
  `role="status"` announces the submit once (submit-form path only — the retry path uses the
  existing `role="alert"`, Section 7.1).
- Net read: _"the button I pressed is now visibly working"_ — certain, calm, legible, accessible.

### 6.2 Why gray + shimmer reads as "submitting" — and stays fairly visible

The user's worry is precise: a flat gray disabled button is indistinguishable from "off," and a
too-subtle skeleton would read the same. We defeat that on three independent channels, so the signal
survives even if any one channel is weak for a given user:

1. **Motion channel (the shimmer).** A static control is "off"; a _moving_ one is "working." The
   left→right sweep in the reading direction reads as "moving the form forward." Today's button has
   zero motion of its own — the spinner carried it. Now the button carries it.
2. **Contrast channel (the lifted fill + ≥3:1 border).** This is the crux of "fairly visible." A
   passive page skeleton can whisper (P2), but a button the user is _waiting on_ must be
   unmistakable. We **lift the fill from `#E1E7EA` to `#C7CDD6`** so the same 0.6α sweep reads
   clearly instead of vanishing into near-white, and we add a **`#404142` 1px border at 9.93:1 on
   the card / 3.45:1 on the track** — a perceivable boundary that exists _independent of the sweep_
   and _independent of motion_ (so it survives reduced-motion and low-contrast displays). The old
   `#E1E7EA` border was 1.25:1 — invisible; the once-proposed `#969B9D` border was **2.81:1 — also
   failing** — so we darkened it to `#404142`.
3. **Text channel (the retained, legible label).** The label never disappears into a bare track.
   "Signing up…" stays present as a literal statement of state, now at **6.40:1** instead of the old
   **1.25:1**.

Three channels, three different failure modes covered: a user who cannot perceive the faint sweep
still sees the border and reads the label; a reduced-motion user loses the sweep but keeps border +
label; a user who skims past text still sees motion + a distinctly darker, bordered box. _That_ is
"fairly visible / unmistakable," and it is never "merely disabled."

### 6.3 The contrast fix, stated exactly (reconciled with FR12)

The defect is fixed by **recoloring the shared `:disabled` text token, not by deleting the
`:disabled` rule** — because that rule has a **wider blast radius than a delete should touch.** The
verified `theme.ts` `:disabled` rule (`backgroundColor: background.subtle`,
`color: background.default = #FFFFFF`) is used by the **genuinely pre-submit-disabled** button
**and** by the switcher/retry disabled states — **not only** the submitting button. Deleting it
outright would change **every** disabled `UIButton` in the app. So, consistent with FR12
("remediated to `#404142` on `#E1E7EA`"):

- **Recolor** the shared `:disabled` text token from `#FFFFFF` to **`#404142`** (on `#E1E7EA` =
  **8.19:1**, PASS 1.4.3) — do **not** delete the rule. This change affects **all** disabled
  `UIButton`s (switcher, retry, pre-submit); **verify each visually.** _(The earlier "≈8.6:1" figure
  was inexact; the true ratio for `#404142` on `#E1E7EA` is **8.19:1**.)_
- During **submitting**, the L2 control is **no longer native-`disabled`** (it is `aria-disabled`),
  so it owns its own track colors regardless of the `:disabled` rule — the recolor above governs the
  _genuinely_ disabled states, while L2's track colors are set by the L2 surface.
- L2 label: `#404142` on `#C7CDD6` = **6.40:1** (PASS 1.4.3).
- L2 border: `#404142` on `#FFFFFF` = **9.93:1**, on `#C7CDD6` = **3.45:1** (PASS 1.4.11 against
  both).

### 6.4 Two distinct disabled-looking states (do not conflate)

| State                   | Trigger                                 | Native `disabled`?                     | Appearance                                                                        | A11y                                                                                                             |
| ----------------------- | --------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Pre-submit disabled** | `isSubmitDisabled` (form invalid/empty) | **Yes** (genuinely inert)              | Static `#E1E7EA` fill, text **`#404142` (8.19:1)**                                | Standard disabled; exempt from 1.4.3 but remediated anyway                                                       |
| **Submitting (L2)**     | `submitting === true`                   | **No** → `aria-disabled` + `aria-busy` | `#C7CDD6` shimmer track, **`#404142` border**, label retained, visible focus ring | Focusable, named, polite `role="status"` (submit path) / `role="alert"`-owned (retry path), handler early-return |

### 6.5 Exact emotion `sx` sketch

The track style is **`LoaderMotion.shape(...)` + the shared `submitButtonLadder` + the lifted fill +
the ≥3:1 border + the label color** — geometry only on top of the shared base, so jscpd sees no
clone. Conceptually:

```css
/* L2 submit-track (emotion sx, conceptual) — extends motionSafeShimmer */
.ui-submit-loading-button {
  /* shared motion (from LoaderMotion.shape → motionSafeShimmer): */
  background-image: linear-gradient(
    90deg,
    rgba(211, 216, 224, 0) 0%,
    rgba(211, 216, 224, 0.6) 49.13%,
    rgba(211, 216, 224, 0) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s ease-in-out infinite alternate; /* left→right */

  /* lifted fill so the sweep is "fairly visible" (not #E1E7EA): */
  background-color: #c7cdd6;

  /* perceivable >=3:1 boundary, motion-independent (3.45:1 on track, 9.93:1 on card): */
  border: 1px solid #404142;
  border-radius: 57px; /* SKELETON_BORDER_RADIUS — already matches */
  padding: 20px 32px; /* identical to the real button */

  /* legible retained label: */
  color: #404142; /* 6.40:1 on #C7CDD6 */
  display: inline-flex;
  align-items: center;
  justify-content: center;

  /* geometry comes from the SHARED submitButtonLadder fragment (Section 4.4),
     spread here — NOT re-declared — so jscpd sees no clone across L1/L2/skeleton-button */
}

/* visible focus indicator — the MUI theme's :focus-visible ring is bypassed when
   the surface is swapped, so the L2 track owns its own (FR20 / 2.4.7): */
.ui-submit-loading-button:focus-visible {
  outline: 2px solid #1eaeff;
  outline-offset: 2px;
}

/* inherited reduced-motion: freeze, keep fill + border + label */
@media (prefers-reduced-motion: reduce) {
  .ui-submit-loading-button {
    animation: none;
    background-image: none;
    background-color: #c7cdd6; /* static — NOT #E1E7EA; stays visible */
    /* border #404142 and color #404142 are unchanged → still reads "loading" */
  }
}
```

In TS terms, the consuming component renders the track via the same focusable
`<button type="submit" aria-disabled aria-busy>` element so name/role/focus are preserved
(FR9–FR11), with the label as its text child. On the **submit-form path** a sibling visually-hidden
`role="status"` (mounted empty up-front) carries `sign_up.form.submitting_status`; on the **retry
path** there is **no** sibling `role="status"` (the enclosing `role="alert"` is the live-region
owner — Section 7.1).

---

## 7. Accessibility Section — Per-Type → WCAG SC Mapping

### 7.1 Live-region ownership — no nesting (the retry path has a pre-existing owner)

WAI-ARIA forbids **nested live regions**: a `role="status"` (live) inside a `role="alert"` (live)
causes screen readers to behave unpredictably (double announcements, dropped announcements, or
re-announcing the entire alert subtree on every status update). The verified source places the
registration **retry button INSIDE** a container that is already `role="alert" aria-live="polite"`
(`registration-error-view.tsx:97`). Therefore:

- **On the retry path, do NOT render a `UILoaderStatus` / `role="status"`.** The enclosing
  `role="alert" aria-live="polite"` is **already the single live-region owner** for that region.
  Convey the retry's pending state with **`aria-busy`** on the retry button (or the alert
  container), and let the alert's existing content carry any announcement.
- **Reserve `UILoaderStatus` for regions with no existing live-region owner** — the **submit form**
  (L2 submit path) and the **switcher** (L3). The plan's own R7 "exactly one `role="status"` per
  region" rule is satisfied by recognizing the alert as the retry region's owner.
- **AC:** `queryAllByRole('status')` **inside the error-view alert returns 0**, and there are **zero
  nested `aria-live` regions** on the retry path.

### 7.2 Live-region mounting — mount empty up-front, then fill (no same-commit insert)

Many screen readers (notably VoiceOver/Safari and some NVDA/Firefox combinations) **will not
announce** a live region whose **element and text are inserted in the same commit** — the live
region must already be present (and empty) in the accessibility tree **before** its text is injected
for a polite announcement to fire reliably. Therefore each `UILoaderStatus` (L1, L2 submit path, L3,
L4) is **rendered persistently — mounted empty on the initial render of its host** (the form, the
switcher, the section), and **only its text content** is updated on the idle→loading and
loading→settle transitions. **Never mount the live-region element and its text in the same commit.**
**AC:** the `role="status"` node exists _before_ loading begins (empty/whitespace content) and
**only its `textContent` changes** when submitting/loading toggles.

### 7.3 Announcement hygiene — exactly one channel, debounce never suppresses the first utterance

- **One channel per event.** The focusable submitting button keeps its visible label as its
  accessible name ("Signing up…"), **and** a sibling `role="status"` announces the loading sentence.
  To avoid double speech, the **button label change is NOT wrapped in `aria-live`** (a name change
  alone does not trigger a live announcement), so the status sentence is the **single** spoken
  loading announcement. **AC:** exactly **one** loading-related announcement is queued per submit
  (status updated once; no `aria-live` on the button itself).
- **Debounce suppresses duplicates, not the first utterance.** The 150–300ms debounce exists to drop
  _flicker/duplicate_ announcements and to let sub-debounce (instant) resolutions stay silent — it
  must **not** swallow the **initial** idle→loading utterance for a _genuine_ (non-instant)
  submission. This matters most for the **reduced-motion screen-reader intersection**: that user
  gets a **static** shimmer (no motion cue), so if the announcement were also debounced away they
  would receive **no perceivable "submitting" signal at all.** Policy: a genuine idle→loading
  transition is **always announced once**; `aria-busy` on the container plus the persistent
  `role="status"` provide the SR signal independent of the debounce. **AC:** for a real
  (non-instant) submission the loading status is announced **exactly once even under
  `prefers-reduced-motion`**.

### 7.4 Per-type mapping

| Loader              | role / progressbar                                  | `aria-busy` (container)             | `aria-live` owner                           | Accessible name            | Visually-hidden text                  | Decorative `aria-hidden`                | Focus                                                                   | WCAG SCs satisfied                                              |
| ------------------- | --------------------------------------------------- | ----------------------------------- | ------------------------------------------- | -------------------------- | ------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| **L1**              | `status` (1, in `<div>` — **no** region landmark)   | yes (root)                          | own `status` (polite)                       | n/a (decorative)           | `auth.loadingForm`                    | all bars                                | none (non-interactive)                                                  | 1.3.1, 4.1.3, 4.1.2                                             |
| **L2 (submit)**     | `status` (1, in submit area); **no** progressbar    | yes (form/submit wrapper)           | own `status` (polite)                       | label text ("Signing up…") | `sign_up.form.submitting_status`      | (no decorative spinner — deleted)       | **retained** (`aria-disabled`, not `disabled`) + **visible focus ring** | 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7, 4.1.2, 4.1.3                |
| **L2 (retry)**      | **no `status`** (alert owns it); **no** progressbar | yes (retry button / alert)          | **existing `role="alert"`** (no new status) | label text                 | (none added)                          | (no decorative spinner)                 | retained + visible focus ring + **in-flight guard**                     | 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7, 4.1.2                       |
| **L3**              | `status` (1, wrapper); **no** progressbar           | yes (host control)                  | own `status` (polite)                       | n/a (decorative dots)      | `auth.switching_form`                 | dots (`aria-hidden`, asserted directly) | none (inline)                                                           | 1.3.1, 1.4.11, 4.1.2, 4.1.3                                     |
| **L4**              | `status` (1, **sibling** of veiled region)          | yes (container; region **`inert`**) | own `status` (polite)                       | n/a                        | `auth.loadingForm` / `common.loading` | blocks                                  | none                                                                    | 1.3.1, 4.1.2, 4.1.3                                             |
| **L5**              | **`progressbar`** (valuenow/min/max)                | optional                            | (none by default; value on demand)          | `common.uploading`         | n/a (role carries value)              | n/a                                     | n/a                                                                     | 1.3.1, 4.1.2                                                    |
| **Family (motion)** | —                                                   | —                                   | —                                           | —                          | —                                     | —                                       | —                                                                       | **2.2.2, 2.3.3, 2.3.1** (reduced-motion settles, no `infinite`) |

**Announcement hygiene (all status-bearing loaders, P6/FR19):** announce only on a genuine
transition (idle→loading, loading→settled); debounce 150–300ms to drop **duplicate/flicker**
announcements (never the first genuine utterance, §7.3); write the message **once** per episode;
`aria-live` is always `polite` (assertive is reserved for the existing error boundary); on settle,
clear the status and hand off to the existing `role="alert"` success/error views. **Exactly one
live-region owner per region** — never nested (§7.1).

---

## 8. Responsive Section

| Loader                              | base `<375`                                                              | `≥375` (SMALL_MOBILE)        | `md 768`                                                  | `lg 1024`            | `xl 1440`                           |
| ----------------------------------- | ------------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------- | -------------------- | ----------------------------------- |
| **L1** rows / submit                | input `clamp(3,4vw,4)rem`; submit `3.125rem` (shared ladder), full-width | submit `minWidth 19.6875rem` | input `4.9375rem`; submit `4.375rem`, `minWidth 33.75rem` | `minWidth 26.375rem` | input cap `4rem`; submit `3.875rem` |
| **L2** submit track (shared ladder) | `3.125rem`, full-width                                                   | `minWidth 19.6875rem`        | `4.375rem`, `minWidth 33.75rem`                           | `minWidth 26.375rem` | `3.875rem`                          |
| **L3** dots                         | `0.375rem` dots, fixed box                                               | (same)                       | (same)                                                    | (same)               | (same)                              |
| **L4** blocks                       | single full-width block                                                  | (same)                       | 2–3 stacked lines                                         | (same)               | (same)                              |
| **L5** bar                          | full-width, `~0.5rem` tall, label wraps below                            | (same)                       | label may sit inline-adjacent                             | (same)               | (same)                              |

Stagger is **time-based** (`120ms`), so cascade feel is identical at every width. L1/L2 sizes come
from the **shared `submitButtonLadder`** so the reserved box equals the real control on every
breakpoint **and** the ladder exists in exactly one place (jscpd-safe, Section 4.4) — the foundation
of zero-CLS (Section 5 / NFR1). The breakpoint ladder (`375 / 768 / 1024 / 1440`) matches
`ui-breakpoints` and `base/styles.ts`.

---

## 9. States Matrix

Per loader, across the five states the prompt requires.

| Loader          | idle                                         | loading                                                                                                                                | success (settle)                                                                                   | error (settle)                                                                                            | reduced-motion (during loading)                                                                  |
| --------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **L1**          | not mounted                                  | full silhouette shimmering, `aria-busy`, 1 polite status (mounted empty up-front)                                                      | unmount; real form swaps into same box                                                             | unmount; error boundary renders                                                                           | static `#E1E7EA` fills, no sweep/stagger/glow, layout reserved                                   |
| **L2 (submit)** | real `#1EAEFF` button, "Sign Up"             | `#C7CDD6` track + `#404142` border + "Signing up…", left→right sweep, `aria-disabled`/`aria-busy`, visible focus ring, 1 polite status | **in-place revert → `aria-busy` flips to false, focus returns to restored button**; status cleared | **view replaced by `role="alert"` error view → busy form unmounts; focus moved to alert**; status cleared | static `#C7CDD6` fill, `#404142` border + label retained, no sweep; loading still announced once |
| **L3**          | absent                                       | 3 dots travelling (transform; color held at full `#969B9D` 3.04:1), host `aria-busy`, 1 polite status                                  | removed; target form/view shown                                                                    | removed; error path shown                                                                                 | 3 static `#969B9D` dots, full opacity (3.04:1)                                                   |
| **L4**          | absent / `fallback={null}` on critical paths | veil over **`inert`** region, status as **sibling** (outside inert), `aria-busy`, 1 polite status                                      | removed; section revealed                                                                          | removed; error path shown                                                                                 | static `#E1E7EA` block(s), no sweep/glow                                                         |
| **L5**          | value 0                                      | fill tweening (`scaleX`, `linear`) + brand riding glow, `role="progressbar"` (value on demand)                                         | value 100 / unmount                                                                                | bar stops at last value; adjacent error copy                                                              | fill **jumps** to value, `transition: none`, no glow                                             |

Across all rows: **idle and loading occupy the same box** (no shift on entry); **loading → settle**
never moves layout (in-place revert or same-box swap), and the **aria-busy=false assertion applies
only to the in-place revert path** — on view replacement the busy form **unmounts** and the
`role="alert"` view appears instead (see UXAC6); reduced-motion **never hides** the affordance and
**never loops**.

---

## 10. Acceptance Criteria for the UX

The design is accepted when all of the following hold (each traces to PRD FRs/NFRs and to issue #48
ACs):

- **UXAC1 — Family coverage (issue AC1; FR20–FR23).** L2 replaces the **single** dual
  disabled-button-plus-spinner pattern (`ui-form/index.tsx:116` — the **only** spinner in `src/`);
  L1 enhances the auth skeleton and the **dead-code re-export is deleted** (no importers to
  repoint); L3 **newly instruments** the silent switcher; the retry button is **newly instrumented**
  with the L2 variant (no new `role="status"`, §7.1). No auth-path `CircularProgress` remains. Grep
  confirms the inventory in Section 5.0 (one migration + the new instrumentations), not a phantom
  audit.
- **UXAC2 — Submit-button-as-loader (FR5; user direction).** During submit the button itself is a
  `#C7CDD6` shimmer track with a `#404142` ≥3:1 border and a retained "Signing up…" label; no
  separate spinner exists; it reads as "submitting," never as "merely disabled," on all three
  channels (Section 6.2).
- **UXAC3 — Zero layout shift (issue AC2; NFR1).** Playwright bounding-box shows the submit area is
  geometry-identical with `submitting` toggled; every loader reserves its final box; CLS
  contribution from loaders is 0 on desktop and mobile. No `width/height/top/left/margin` is
  animated.
- **UXAC4 — Contrast fixed (NFR4/NFR5).** No loader text is below 4.5:1 (L2 label 6.40:1; recolored
  disabled text `#404142` on `#E1E7EA` = 8.19:1); every loading boundary is ≥3:1 against **both**
  its backdrop and its track (L2 border `#404142` = 9.93:1 on card / 3.45:1 on track); L3 dots hold
  **3.04:1 at every frame**; the white-on-`#E1E7EA` defect is gone. **The false 3.04:1 / failing
  2.81:1 `#969B9D` border is not used.**
- **UXAC5 — Reduced motion settles (issue AC3; FR13/FR14, NFR6–8).** Under
  `prefers-reduced-motion: reduce` **every** family animation — the shimmer, the L3
  opacity/transform pulse, the glow-overlay opacity, and the L5 `scaleX` transition — is disabled at
  its **own** coordination point (Section 3: a/b/c); the **Playwright** reduced-motion project
  asserts computed `animation-iteration-count` is never `infinite` for each enumerated keyframe and
  `transition: none` for L5; each loader shows its specified static affordance; L5 jumps to value;
  nothing is hidden. **No "jsdom static-branch" media-match assertion is claimed** (jsdom cannot
  evaluate media queries); jsdom asserts only that the static reduced-motion SX key is present.
- **UXAC6 — Accessible pending semantics (FR15–FR19, NFR9/NFR10).** Exactly one **live-region
  owner** per region (the retry path's owner is the existing `role="alert"` —
  **`queryAllByRole('status')` inside the alert is 0**, zero nested `aria-live`); each
  `role="status"` is **mounted empty up-front** and only its text changes on toggle; containers
  toggle `aria-busy` (**aria-busy=false asserted only on the in-place revert path; on view
  replacement the busy form unmounts and the alert view is present**); decorative dots assert
  `aria-hidden="true"` **directly** (not via `queryAllByRole('img')`); L1 is no longer a region
  landmark; `progressbar` appears only on L5 and is **not** claimed to auto-announce; the
  submit/retry buttons stay focusable via `aria-disabled` with names intact, a **visible focus
  ring**, and a **re-entrancy guard on both the submit and retry handlers**; **focus is moved
  deterministically on settle** (to the alert on replacement, to the restored button on revert,
  never to `body`); announcements are polite, debounced (duplicates only — the first genuine
  utterance always fires, including under reduced motion), single, and hand off to `role="alert"` on
  settle.
- **UXAC7 — DRY + metrics by construction (NFR11/NFR12).** All five loaders extend the one
  `motionSafeShimmer` base via `LoaderMotion.shape`; the **shared `submitButtonLadder` breakpoint
  fragment** is defined **once** and spread by L1's submit bar and L2's track (no re-declared
  ladder); no copied ≥75-token block exists; `make lint-dup` is run after the foundation step and
  after the loader folders; each loader is its own `index.tsx`+`styles.ts`+`types.ts` folder with
  grouped option params; the `UIButton loading` branch keeps function bodies ≤10 LLOC and exits ≤3.
- **UXAC8 — Budget held (NFR2/NFR3).** Pure CSS, dependency-free, no new eager import on the auth
  paint path; **no `matchMedia` JS read added** (reduced motion stays CSS-only); L4 off-critical, L5
  unused; **no animated `box-shadow`** (glow is static-shadow + animated opacity); mobile Lighthouse
  performance stays at/above the CI threshold.
- **UXAC9 — i18n complete (FR24/FR25, NFR16).** Every new loading/announcement key
  (`sign_up.form.submitting_status` + login analogue, `auth.switching_form`, `common.loading`,
  `common.uploading`) exists in **both** `en.json` and `uk.json`.
- **UXAC10 — Tests green + animated coverage (issue AC4; NFR13/NFR14/NFR15).**
  `make test-unit-client` passes with the new semantic-query assertions
  (status/aria-busy/reduced-motion static-SX-key/`aria-disabled`-not-`disabled`/
  spinner-removed/no-region-landmark/dots-`aria-hidden`/retry-no-status/
  focus-on-settle/no-double-fire). `make test-visual` passes with **intentionally regenerated**
  L1/L2/L3 snapshots — **acknowledging that the existing baselines, captured under the harness's
  `emulateMedia({ reducedMotion: 'reduce' })` (`take-visual-snapshot.ts:59`), will shift to the
  STATIC fallback once the media query lands** — across the chromium/firefox/webkit · mobile/desktop
  matrix. A **dedicated non-reduced-motion visual project (or story)** snapshots the **animated
  shimmer** so the animated branch has real coverage (it would otherwise get zero), plus the
  reduced-motion project asserts the static branch. All selectors semantic, no `data-testid`.

## 11. Storybook Preview

Every loader ships an interactive Storybook preview (PRD FR27/FR28), co-located as
`*.stories.tsx` and authored with the component (Epic 2). The preview is both a design showcase
and an accessibility surface — each loader is inspectable in isolation before any consumer is
migrated.

| Loader                     | Story states to expose                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------- |
| L1 `UISkeletonPlaceholder` | Animated default; reduced-motion/static fallback; the composed auth-page placeholder     |
| L2 `UISubmitLoadingButton` | `idle`; `submitting` (shimmer track + retained label); `disabled`; reduced-motion/static |
| L3 `UIInlineLoader`        | Animated three-dot pulse; reduced-motion/static                                          |
| L4 `UISectionLoader`       | Veil over sample content; reduced-motion/static                                          |
| L5 `UIProgressBar`         | Determinate 0 / 50 / 100; reduced-motion/static                                          |

Requirements:

- Stories reuse the shared static / `disableAnimation` opt-out — no duplicated story scaffolding
  (jscpd-safe) — following the existing `auth-skeleton.stories.tsx` / `button.stories.tsx` pattern.
- A global reduced-motion toggle (Storybook `globalTypes` or a `parameters` emulation of
  `prefers-reduced-motion: reduce`) lets a reviewer flip the whole family between the animated and
  static branches without editing source, mirroring the three-point reduced-motion contract (§3).
- The Storybook a11y and docs addons render for every story so each loader's role, `aria-busy`,
  `role="status"`, accessible name, and the no-nested-live-region rule (§7) are inspectable.
- `make storybook-build` succeeds with the loader family included.
