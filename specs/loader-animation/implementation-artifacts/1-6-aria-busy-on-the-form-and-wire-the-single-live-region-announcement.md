# Story 1.6: `aria-busy` on the form and wire the single live-region announcement

Status: done

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

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `f450ea2` — run `git show --stat f450ea2`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
