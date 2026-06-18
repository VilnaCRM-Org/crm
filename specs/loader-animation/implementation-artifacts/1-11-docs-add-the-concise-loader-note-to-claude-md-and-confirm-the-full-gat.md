# Story 1.11: Docs: add the concise Loader note to CLAUDE.md and confirm the full gate sweep

Status: done

**User story.** As a future contributor, I want a short, accurate note describing
the in-button submit loader and what is intentionally out of scope, so I don't
reintroduce a detached spinner or the deleted loader family.

**Description.** Update the "Important Patterns" → loader note in
`CLAUDE.md` to describe the **live** treatment: the auth
submit button uses MUI native `loading` + `loadingPosition="center"`, goes natively
`disabled` to the grey `#E1E7EA` fill while loading (the same disabled state shown
in the design, node 439:19256, not a brand-fill override), draws a distinct
conformant `:focus-visible` outline, hides the label visually while preserving the
accessible name, renders one **white** `#FFFFFF` centered `SubmitSpinner` (thickness 4.5,
size 28, 1.26:1 on the grey fill — design-accepted), carries `aria-busy` on the `<form>`,
and announces via one polite `UILiveStatus` (`role="status"`) — with no
`role="progressbar"`, no detached spinner, and no L1-L5 loader family. Rationale
lives here and in the PR (no inline code comments — NFR5). Then run the full gate
sweep: `make format` then `make lint` (ESLint, tsc, `make lint-dup`,
`make lint-metrics`), unit + integration, visual + e2e, and confirm the Lighthouse
CI gate (~0.85) — all green with no suppressions.

**Acceptance Criteria.**

- Given CLAUDE.md, When the loader note is read, Then it accurately describes the
  in-button native loading treatment (grey `#E1E7EA` disabled fill, dark spinner,
  focus outline, `role="status"` announcement) and the out-of-scope items, and is
  markdownlint-clean (documentation accuracy).
- Given `make lint-dup`, `make lint-metrics`, ESLint, and TS, When run, Then all
  pass with no new suppressions, ignores, or inline code comments (NFR2, NFR3,
  NFR5, AC8).
- Given the Lighthouse CI run, When scored, Then the auth-page mobile score stays
  at/above ~0.85 with no new heavy dependency on the auth critical path (NFR1,
  AC10).

**Files touched.** `CLAUDE.md`.

**Tests to add/update.** None (docs); the gate sweep re-runs all suites.

**Dependencies.** 1.1-1.10 (document the finished behavior; sweep verifies the
whole epic).

**Definition of Done.** CLAUDE.md loader note updated and markdownlint-clean; full
gate sweep green (lint, metrics, jscpd, unit, integration 100%, visual, e2e,
mutation, Lighthouse); no suppressions; PR #102 refreshed.

---

## Dev Notes (finalization)

CLAUDE.md "Important Patterns" gained a Submit-button loader note describing the live
treatment (MUI native loading, grey #E1E7EA disabled fill, white label removed while
loading, white centered SubmitSpinner, aria-busy with one role=status announcement, the
doubled Mui-disabled injectFirst override, and the out-of-scope items). NOTE: the spinner
ships WHITE per the design owner (matches Figma node 439:19256, white-on-grey);
white-on-grey is 1.26:1, a deliberate and accepted WCAG 1.4.11 deviation (accessibility-lead
review waived for the loader by the design owner); the busy state is also conveyed by
aria-busy, native disabled, the polite live region, and the spinner motion.

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** pending (loader-finalization change set).
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
