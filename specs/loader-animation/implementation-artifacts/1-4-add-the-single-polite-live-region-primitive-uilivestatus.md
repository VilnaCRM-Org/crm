# Story 1.4: Add the single polite live-region primitive (`UILiveStatus`)

Status: done

**User story.** As a screen-reader user, I want one polite announcement of the
busy state, so I know the form is submitting without a duplicate or competing
message.

**Description.** Add a dependency-free primitive
`src/components/ui-live-status/index.tsx`:
`UILiveStatus({ message }: { message: string })` returns a visually-hidden
`<span role="status" aria-atomic="true">{message}</span>`. `role="status"` carries
the implicit `aria-live="polite"`, so it is the correct WCAG 4.1.3 Status Messages
primitive — do NOT ship a bare `aria-live` span without `role="status"`. It uses
MUI's existing `@mui/utils` `visuallyHidden` style object
(`position: absolute` + `clip`, already a transitive dependency, no new package, no
critical-path weight per NFR1), so the region adds **zero layout box** and cannot
contribute to layout shift (AC6). It is never nested inside another live region.
There is no `role="progressbar"` announcement source. This story adds the primitive
only; `FormBody` wires it in 1.6.

**Acceptance Criteria.**

- Given `UILiveStatus` with a non-empty `message`, When rendered, Then a single
  `role="status"` region (implicit `aria-live="polite"`) with `aria-atomic="true"`
  contains that text (FR7, AR3, WCAG 4.1.3 Status Messages).
- Given `message=''`, When rendered, Then the region is present but empty (so the
  empty→text→empty announcement cycle works) (FR7).
- Given the rendered region, When its computed style is inspected, Then it uses MUI
  `visuallyHidden` (`position: absolute` + `clip`) and therefore occupies no layout
  box (zero layout shift) (AC6, AR3).
- Given the primitive, When checked, Then no `data-testid` and no second live
  region exist; it is dependency-free (NFR1, NFR4, R7).

**Files touched.** `src/components/ui-live-status/index.tsx` (new).

**Tests to add/update.** Unit (new
`tests/unit/components/ui-live-status/index.test.tsx`): assert `role="status"` and
`aria-atomic="true"` (and the implicit polite live region), the `visuallyHidden`
zero-layout style (`position: absolute` + `clip`), and the empty-message branch.
Query by role and text (NFR4). Full coverage (NFR9).

**Dependencies.** None.

**Definition of Done.** Primitive added and 100% covered; metrics/ESLint/TS pass;
no suppression/`data-testid`/inline comment.

---

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `bf7be5c` — run `git show --stat bf7be5c`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
