# Story 1.2: Confirm `UIButton` passes the native loading props through `cloneElement`

Status: done

**User story.** As a developer wiring the loader, I want `UIButton` to forward the
native `loading`/`loadingPosition`/`loadingIndicator` props unchanged, so the
shared button gains the loading behavior with no new prop or type.

**Description.** `UIButton` (`src/components/ui-button/index.tsx`) wraps MUI
`<Button>` and returns `React.cloneElement(baseButton, rest)`; `UiButtonProps
extends ButtonProps`, and `loading`/`loadingPosition`/`loadingIndicator` are part
of `ButtonProps` in `@mui/material@7.3.x`, so they already flow through `...rest`
into `cloneElement` with **no signature change**. Loading is button-only: the auth
submit control always resolves to the `'button'` branch (no `to`, no `href`), where
`type="submit"` is forwarded; the anchor branch is untouched and is not wired for
loading. This story adds **no production code** — it locks the behavior with a test
so a future refactor of the clone/anchor logic cannot silently drop the props.

**Acceptance Criteria.**

- Given a `UIButton` with `type="submit" loading loadingPosition="center"`, When
  rendered, Then the underlying element has the native `disabled` attribute and the
  MUI loading class is present (props reached the inner `<Button>`) (FR1, FR3).
- Given a `UIButton` with `loadingIndicator={node}` and `loading`, When rendered,
  Then the provided indicator node is in the DOM inside the button (FR2).
- Given a `UIButton` with `to`/`href` (anchor branch), When rendered, Then it
  resolves to an anchor and no loading wiring is applied (documented constraint;
  callers must not combine `to`/`href` with `loading`).

**Files touched.** None in `src/` (behavior confirmed); test file only.

**Tests to add/update.** Unit
(`tests/unit/components/ui-button.test.tsx` / `button.test.tsx`): assert the three
loading props pass through to the inner button; assert the anchor branch is
unaffected. Locate elements via `getByRole` (NFR4).

**Dependencies.** 1.1 (the disabled/loading state the test observes is styled there;
the pass-through test can co-assert the grey fill).

**Definition of Done.** Pass-through tests green; no `UIButton` signature change;
ESLint/TS/metrics pass; no `data-testid`.

---

## Dev Agent Record

- **Agent Model Used:** Claude (Ralph autonomous loop) plus Claude Code backfill.
- **Commit:** `6f07c56` — run `git show --stat 6f07c56`.
- **File List:** see "Files touched" / "Tests" above and the commit.
- **Change Log:** implemented to the story acceptance criteria; lint and unit suite green.
