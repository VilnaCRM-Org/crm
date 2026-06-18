# Story 1.9: Visual baseline (forced reduced motion) plus a conditional reduced-motion assertion

Status: done

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
shift) and the grey `#E1E7EA` disabled/loading fill (FR8, AC6, AC7).
(2) **Reduced-motion guard is conditional (non-visual).** Replace the
previously-proposed "prove it spins via snapshot" case with a unit/DOM assertion
(covered in 1.1's tests) that the theme's
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
  loading fill is the grey `#E1E7EA` (matching the design) (FR8, AC6).
- Given forced reduced motion, When the loading state is captured, Then the
  indicator is a static ring and the snapshot is stable (no spin flake) (NFR8, AR6,
  AC7, R4).
- Given the reduced-motion guard assertion, When the theme is evaluated, Then
  `animation: none` on the indicator SVG appears only inside the
  `@media (prefers-reduced-motion: reduce)` block and not at the default rule,
  confirming the guard is conditional, not unconditional (NFR8, AR6).

**Files touched.** A new/extended visual spec under `tests/visual/...` for the
zero-shift + `#E1E7EA` baselines (preserving the existing `-{projectName}-` snapshot
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

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `ab1ca30` — run `git show --stat ab1ca30`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
