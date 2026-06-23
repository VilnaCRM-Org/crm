# Story 1.3: Extract the dark in-button spinner (`SubmitSpinner`)

Status: done

**User story.** As a user, I want a single centered spinner inside the submit
button while it works, with enough contrast against the grey disabled fill to be
clearly perceivable, so the busy state is visible without any element appearing
below the button.

**Description.** Add a tiny new component file
`src/components/ui-form/submit-spinner.tsx`:
`SubmitSpinner()` returns
`<CircularProgress sx={{ color: customColors.text.primary }} thickness={4.5} size={28} />`.
The stroke color is the dark `#404142` (`customColors.text.primary` — it lives in
`customColors.text`, NOT `paletteColors`), which on the `#E1E7EA` grey loading fill
from 1.1 measures 8.12:1, comfortably clearing WCAG 1.4.11 (3:1). The spinner MUST
NOT be white and MUST NOT use `color="inherit"`; a white spinner on `#E1E7EA` is
only 1.26:1 (fails 1.4.11), so the dark `#404142` stroke is the correct choice and
is even better on the grey fill. `thickness={4.5}` and `size={28}` give a prominent
ring inside the fixed box without leaving it. The spinner carries NO accessible
name: it does not take a `label`/`aria-label` prop and does not expose a labelled
progressbar — the button's accessible name comes from its stable `submit_button`
children (Story 1.7), and the `submitting` string is used only by the live region
(Story 1.6). The spinner is its own file so `ui-form/index.tsx` stays under the
per-file ≤10 functions/closures cap (NFR3). No spinner motion override lives here
(reduced motion is handled by the theme, 1.1).

The spinner is built to pass 1.4.11 on its own AND is supplementary: busy is also
conveyed by `aria-busy`, the native `disabled` state, and the live region.
Belt-and-suspenders, not "decorative-and-excused."

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

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `9cf57a8` — run `git show --stat 9cf57a8`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
