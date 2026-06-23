# Story 1.8: Unit + integration test pass: 100% coverage and mutation hardening

Status: done

**User story.** As a maintainer, I want the loading behavior fully covered with
exact-value assertions for both forms, so coverage stays 100% over `src/**` and
mutants on the fill, focus outline, key choice, and `aria-busy` value are killed.

**Description.** Consolidate and complete the unit/integration suite so every new
branch is exercised for **both** forms: loading vs idle, `aria-busy` true/false,
`submitting ? submittingLabel : ''`, the `#E1E7EA` grey disabled/loading fill (the
same rule covers idle-invalid and loading), the `#404142` focus outline vs `:hover`,
the `#404142` spinner stroke, and the stable `submit_button` accessible name while
loading. Add the double-submit assertion: while `submitting`, a second submit attempt
does not re-invoke the handler (FR9). Add a `jest-axe` check confirming no duplicate
live region and no name/role/value violation (AC5). Assertions use exact
strings/attributes (not truthiness) so Stryker mutants on the fill color, the focus
outline, the spinner stroke, the `submit_button` vs `submitting` key, and the
`aria-busy` value are caught (NFR9/AC11). The new `submit-spinner.tsx` and
`ui-live-status/index.tsx` reach 100% via these render paths. No auth-store change,
so the `clearInstances()` spy hazard does not apply.

**Acceptance Criteria.**

- Given the full unit/integration run, When coverage is computed, Then it is 100%
  over `src/**`, including the new files and both new branch pairs (NFR9, AC11).
- Given `submitting` is true, When a second submit fires, Then the submit handler is
  not re-invoked (FR9, AC2).
- Given Stryker runs, When mutants alter the fill color, the focus outline, the
  spinner stroke, the key, or the `aria-busy` value, Then the assertions kill them
  (NFR9, AC11).
- Given the tests, When selectors are reviewed, Then no `data-testid` is used —
  `getByRole`/`getByLabelText`/`getByText` only (NFR4).
- Given the button's accessible name is asserted, When idle and loading, Then it
  EQUALS the localized `submit_button` label exactly and no separately-exposed
  progressbar node contributes a name (AR1, D4).

**Files touched.** `tests/unit/components/ui-form/index.test.tsx`,
`tests/unit/components/ui-button.test.tsx`,
`tests/unit/components/ui-form/submit-spinner.test.tsx`,
`tests/unit/components/ui-live-status/index.test.tsx`, login/registration form unit
tests.

**Tests to add/update.** As above; both forms exercised; double-submit and axe
assertions added.

**Dependencies.** 1.1-1.7 (all production behavior in place).

**Definition of Done.** `make test-unit-all` and integration green at 100% over
`src/**`; Stryker results healthy; no `data-testid`/suppression.

---

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `934a779` — run `git show --stat 934a779`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
