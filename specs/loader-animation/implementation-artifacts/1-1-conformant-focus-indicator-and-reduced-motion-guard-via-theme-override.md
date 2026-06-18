# Story 1.1: Conformant focus indicator and reduced-motion guard via theme override

Status: done

**User story.** As a user submitting an auth form, I want the submit button to
show the same grey disabled appearance while it works (matching the design) and to
show a clearly visible focus ring when I tab to it, so the busy state reads as
"disabled / working", the spinner has enough contrast to be perceivable, and the
keyboard focus is never lost.

**Description.** Two theme fixes land together because they both live in
`src/components/ui-button/theme.ts` and they both touch the same contained-button
rule set:

1. **Loading fill = the disabled grey.** The native loading button is natively
   `disabled`, so the existing `MuiButton.styleOverrides.contained['&:disabled']`
   rule (`backgroundColor: paletteColors.background.subtle` `#E1E7EA`,
   `color: background.default` `#FFFFFF`) fires today and is exactly what we want:
   the loading button shows the grey `#E1E7EA` pill from the Figma design (node
   439:19256). There is NO loading-scoped fill override — the previous
   `buttonClasses.loading` rule that set the fill to `#1EAEFF`/`#0399ED` was
   REMOVED, along with its `buttonClasses` fill import. The label stays white
   (`background.default`) but is hidden during loading via `loadingPosition="center"`
   (`visibility: hidden`, Story 1.5), so the white-on-grey label contrast does not
   apply to the busy state. The spinner stroke is **white** (`#FFFFFF`,
   `paletteColors.background.default`; Story 1.3) — **1.26:1** on the grey `#E1E7EA` fill, a
   deliberate design-owner-accepted WCAG 1.4.11 deviation (Figma node 439:19256). The busy
   state does not rely on spinner contrast: it is bounded by `aria-busy`, the native disabled
   state, the polite `UILiveStatus` live region, and the reduced-motion guard. (`#404142` is
   the focus-outline color, not the spinner.)
2. **Focus indicator (in scope).** Today `:focus-visible` is collapsed into the
   shared `:hover` rule, which shifts to `#00A3FF` with `boxShadow: 'none'` —
   `#00A3FF` on the surrounding fill is only ~1.18:1, i.e. effectively no visible
   focus ring. Split `:focus-visible` OUT of the `:hover` rule and give it a
   distinct, conformant indicator: `outline: '2px solid #404142'` +
   `outlineOffset: '2px'`, drawn OUTSIDE the fill so it clears ≥3:1 against BOTH the
   `#E1E7EA` loading/disabled fill (`#404142` is 8.12:1 on `#E1E7EA`) and the white
   page (`#404142` is 10.22:1 on white). The outline MUST NOT be cancelled by
   `boxShadow: 'none'`. This feature touches this exact control and asserts
   NFR7/AR5, so it owns the fix; there is no "pre-existing / out of scope" deferral.
3. **Reduced-motion guard.** Add a nested `@media (prefers-reduced-motion: reduce)`
   block under the loading selector that sets `animation: 'none'` on the indicator
   SVG (via the imported `circularProgressClasses.svg`).

Geometry (`57px` radius, padding) is untouched. The idle/enabled contained fill
keeps its existing brand `#1EAEFF` (`paletteColors.primary.main`); the `:active`
(pressed) state keeps its existing `#0399ED` (`paletteColors.primary.active`) fill,
unchanged. This story is theme-only: static object literals, no new function, no
consumer wiring yet.

**Acceptance Criteria.**

- Given the auth theme, When the submit button is natively `disabled` (loading),
  Then its computed `background-color` is the grey `#E1E7EA` (matching the design)
  via the existing `&:disabled` rule and no brand-fill override is applied (FR4,
  AR2, AC3).
- Given a form that is invalid (validation-disabled, not loading), When the button
  is rendered, Then it shows the same grey `#E1E7EA` (the loading state reuses this
  identical disabled rule; no override distinguishes them) (FR4, R2).
- Given the button receives keyboard focus, When `:focus-visible` is computed, Then
  the rule is distinct from `:hover` and applies `outline: 2px solid #404142` with
  `outlineOffset: 2px`, and `boxShadow: 'none'` does not remove it; the indicator
  clears ≥3:1 against the `#E1E7EA` fill (8.12:1) and the white page (10.22:1)
  (NFR7, AR5, WCAG 2.4.7 Focus Visible, WCAG 2.4.11 Focus Appearance).
- Given `prefers-reduced-motion: reduce`, When the loading indicator renders, Then
  its SVG has `animation: none` (NFR8, AR6, AC7).
- Given the change, When the button geometry is measured, Then `border-radius`
  stays `57px` and no dimension changes (FR8).
- Given the change, When `circularProgressClasses` is referenced, Then it is
  imported (never hardcoded) and no suppression or inline comment is added (NFR5,
  R1).

**Files touched.** `src/components/ui-button/theme.ts`.

**Tests to add/update.** Unit (`tests/unit/components/ui-button.test.tsx` or a new
sibling): render a contained MUI `Button loading` under the theme and assert the
natively-disabled (loading) computed `backgroundColor` is the grey `#E1E7EA`;
assert the plain `:disabled` (no loading) path also keeps `#E1E7EA` (same rule);
assert `:focus-visible` is a separate rule that emits `outline: 2px solid #404142` /
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

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `c36aa74` — run `git show --stat c36aa74`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
