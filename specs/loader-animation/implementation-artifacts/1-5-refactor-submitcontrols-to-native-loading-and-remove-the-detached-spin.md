# Story 1.5: Refactor `SubmitControls` to native loading and remove the detached spinner

Status: done

**User story.** As a user, I want the busy state shown inside the same submit
button (label hidden, centered spinner, grey disabled fill) instead of a spinner
dropping in below it, so the form does not shift while submitting.

**Description.** Rewrite `SubmitControls` (`ui-form/index.tsx` lines 101-119): set
`loading={submitting}` (a real boolean so MUI's loading wrapper stays stably mounted
and never reflows — FR8), `loadingPosition="center"`,
`loadingIndicator={<SubmitSpinner />}`, and `disabled={isSubmitDisabled}` (the old
`disabled={submitting || isSubmitDisabled}` OR collapses because `loading` supplies
the native disabled — FR3/FR9). Render `{submitLabel}` as stable children in both
states (MUI hides it visually under `loadingPosition="center"` but keeps it in the
DOM as the accessible name — FR1, FR10, AR1). Delete the detached
`<CircularProgress color="primary" size={70} sx={styles.loader} />` on line 116 and
drop the `CircularProgress` import from `index.tsx`. Remove the
`loader: { display:'block', margin:'1rem auto 0' }` block from `ui-form/styles.ts`
(FR5).

Thread a new **required** `submittingLabel: string` prop through `UIFormProps` →
`FormBodyProps` → `SubmitControlsProps` so the i18n-agnostic `UIForm` stays free of
`mode` knowledge (no hardcoded English — NFR6). `submittingLabel` is REQUIRED (no
default, never `''`); it is consumed only by the live region in `FormBody` (1.6),
not by the spinner. Because the prop is required, this refactor and the consumer
wiring that supplies it (Story 1.7) land in the **same change set** so the tree
never compiles through a nameless-spinner / missing-label state.

**Acceptance Criteria.**

- Given `submitting` is true, When `SubmitControls` renders, Then exactly one
  progress indicator exists and it is inside the button, with the label's
  `visibility: hidden` (label still in DOM) (FR1, FR2, AC1).
- Given the refactor, When the DOM is inspected during submit, Then no
  `CircularProgress` exists outside the button and no `styles.loader` element
  exists (FR5, AC1).
- Given `submitting` is true, When the button is queried, Then it has the native
  `disabled` attribute and its accessible name equals the localized `submit_button`
  label exactly (FR3, FR10, AR1, AC2, AC5).
- Given `submitting` is false, When `SubmitControls` renders, Then `loading` is the
  literal `false` and the button is interactive unless `isSubmitDisabled` (FR8, R2).
- Given the props type, When `submittingLabel` is omitted, Then the build fails
  (the prop is required, no default) (D3).
- Given the file after the rewrite, When measured by rca, Then `SubmitControls`
  stays single-return, ≤3 args (props object), and the file remains ≤10 units
  (NFR3).

**Files touched.** `src/components/ui-form/index.tsx`
(`SubmitControls`, `UIFormProps`/`FormBodyProps`/`SubmitControlsProps`, drop the
`CircularProgress` import), `src/components/ui-form/styles.ts` (remove `loader`).

**Tests to add/update.** Unit (`tests/unit/components/ui-form/index.test.tsx`):
one-in-button-indicator + no-sibling-spinner; native `disabled` while submitting;
stable accessible name equal to `submit_button`. Update any test asserting the old
detached spinner or the `submitting` child text. Exact-string assertions for
mutation hardening (AC11).

**Dependencies.** 1.1 (disabled/loading fill), 1.3 (`SubmitSpinner`); precedes 1.6
(same file); lands in the same change set as 1.7 (required `submittingLabel`).

**Definition of Done.** `SubmitControls` rewritten; detached spinner and
`styles.loader` removed; unit tests green; metrics/jscpd/ESLint/TS pass; no
suppression/`data-testid`/inline comment.

---

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `d885123` — run `git show --stat d885123`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
