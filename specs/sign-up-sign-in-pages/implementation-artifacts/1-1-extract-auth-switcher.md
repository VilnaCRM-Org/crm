# Story 1.1: Extract `AuthSwitcher` — the swap control as a real link with conformant focus

Status: done

## Story

As a keyboard / assistive-technology user,
I want the "switch to the other auth page" control to be a real link with a visible focus
indicator,
so it is announced as a "link", navigates (changes the URL), opens in a new tab, and is never
lost when I tab to it.

## Acceptance Criteria

1. Given an `AuthSwitcher to="/sign-in" labelKey="sign_up.form.switcher_text_have_account"`,
   When rendered, Then exactly one `getByRole('link', { name })` exists with `href="/sign-in"`
   (a non-empty string) and visible text "Already have an account?" (FR5, FR7, FR10, AR7,
   AC5).
2. Given an `AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account"`,
   When rendered, Then the link has `href="/sign-up"` and text "Don't have an account yet?"
   (FR5, FR7, AC5).
3. Given the rendered link, When its attributes are inspected, Then it has no `disabled`
   attribute, no `aria-pressed`, and no `aria-current`, and its `href` is never empty (FR6,
   AR7, AC6).
4. Given the swap link is MUI `<Button component="a" href>`, When its role is inspected, Then it
   carries **no** explicit `role` attribute (`getAttribute('role')` is null) and
   `queryByRole('button', { name })` returns null — MUI must not override the native anchor role
   (Stryker-hardened against MUI-upgrade drift) (AR7, AC6, WCAG 4.1.2, a11y review Gap 4).
5. Given the switcher receives keyboard focus, When `:focus-visible` is computed, Then it
   applies `outline: 2px solid #404142` with `outlineOffset: 2px` (not `#1EAEFF`); the
   indicator clears ≥3:1 against the white wrapper (10.23:1) (AR2, AC11, WCAG 2.4.7, 2.4.11).
6. Given the resting (unfocused) state, When the computed style is read, Then no outline is
   drawn and the text color stays `customColors.text.secondary` `#969B9D` (D1 deferred,
   NFR1).
7. Given the new files, When measured by rca, Then `index.tsx` defines a single component and
   `styles.ts` defines zero functions, both under all thresholds (NFR3).

## Tasks / Subtasks

- [x] Task 1: Add the `AuthSwitcher` link component (AC: 1, 2, 3, 4, 7)
  - [x] 1.1 Create `src/modules/user/features/auth/components/auth-switcher/index.tsx`
        rendering `UIButton` with a non-empty literal `to` so a real `<a href>` resolves
  - [x] 1.2 Drop the old `SwitcherButton` behaviors — no `onClick`, `disabled`,
        `onMouseEnter`/`onFocus`/`onTouchStart` prefetch, `aria-current`, or `aria-pressed`
  - [x] 1.3 Keep the component a single body under all rca thresholds (no extra functions)
- [x] Task 2: Add the switcher styles with a conformant focus ring (AC: 5, 6, 7)
  - [x] 2.1 Create `src/modules/user/features/auth/components/auth-switcher/styles.ts` as a
        single object literal copying the former `formSwitcherButton` rule verbatim
  - [x] 2.2 Add a new `:focus-visible` rule: `outline: 2px solid #404142`, `outlineOffset: 2px`
        (not `#1EAEFF`), so resting-state screenshots are unchanged
- [x] Task 3: Add the type-only props file (AC: 1, 2)
  - [x] 3.1 Create `src/modules/user/features/auth/types/auth-switcher/index.ts` with
        `AuthSwitcherProps { to: string; labelKey: string }`, imported via `import type`
- [x] Task 4: Add full-coverage unit tests (AC: 1, 2, 3, 4, 5, 6)
  - [x] 4.1 Add the unit test asserting `getByRole('link', { name })` href/name for both `to`
        values, the absent `disabled`/`aria-pressed`/`aria-current`, the null `role` +
        `queryByRole('button')`, the `:focus-visible` ring, and the resting state

## Dev Notes

- New files (Files touched): `src/modules/user/features/auth/components/auth-switcher/index.tsx`,
  `src/modules/user/features/auth/components/auth-switcher/styles.ts`, and the type-only
  `src/modules/user/features/auth/types/auth-switcher/index.ts`.
- `to` is always a non-empty literal route (`'/sign-up'` or `'/sign-in'`), so
  `resolveLinkTarget(to)` yields a non-empty string and `UIButton` resolves `'a'` — a real
  `<a href>` renders, mirroring the `UIBackToMain` pattern (`to="/"`).
- No `aria-current`/`aria-pressed`: the swap points to a sibling page (AR7). A navigable link
  must never announce "unavailable" — none of the old `SwitcherButton` `onClick`/`disabled`/
  `onIntent` prefetch handlers are carried over (FR6, WCAG 4.1.2).
- a11y review Gap 4: the swap link must carry no `role=button` — assert `getAttribute('role')`
  is null and `queryByRole('button', { name })` is null, Stryker-hardened against MUI drift.
- Focus ring uses `#404142` (`colors.ts:58`, 10.23:1 on the white wrapper), clearing the WCAG
  1.4.11 ≥3:1 non-text floor; `UIBackToMain`'s `#1EAEFF` (2.46:1) is explicitly NOT reused
  (AR2). Because it is `:focus-visible`-only, it never paints in the resting screenshot (NFR1).
- `styles.ts` copies the former `formSwitcherButton` rule verbatim
  (`display:block`, `padding:0`, `margin:'1.4375rem auto 0'`, `fontFamily:'Golos'`,
  `fontWeight:500`, `fontSize:'0.9375rem'`, `lineHeight:1.2`,
  `color: customColors.text.secondary` `#969B9D`, plus the lg/xl media tweaks) so resting is
  pixel-identical (NFR1, D1 keep `#969B9D` waived).
- D2/D3 are unchanged by this story: the switcher text stays as-is and the sign-in page keeps
  its "Authentication" title — neither is touched here.
- Repo gates that must pass: `make lint-dup` (the copied `formSwitcherButton` rule is moved,
  not duplicated — the source rule is removed in Story 1.9, so no ≥75-token clone coexists),
  `make lint-metrics` (rca: single component, zero functions in `styles.ts`), ESLint (no
  `data-testid`, no free functions outside the exempt `.tsx`), TypeScript, and
  dependency-cruiser (type-only file imported via `import type`).
- Type-only convention (NFR7): props live in the `types/auth-switcher/` folder with no runtime
  constructs; logic files do not declare `interface`/`type`.
- Tests: locate by role/text (semantic selectors, no `data-testid`); use exact strings for the
  golden href/name/i18n assertions; full coverage of both new runtime files (NFR10).
- No suppressions (no `eslint-disable`/`@ts-ignore`), no new inline comments; satisfy every
  gate by refactoring.

### References

- Epic:
  specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-1
- Implemented in commit 22a4429a: feat(#31) extract AuthSwitcher link with conformant focus
  ring.

## Dev Agent Record

### Agent Model Used

Opus 4.8 (Ralph loop).

### Completion Notes

- `AuthSwitcher` renders a real `<a href>` via `UIButton` with a `:focus-visible` `#404142`
  ring; the old `SwitcherButton` behaviors (onClick/disabled/prefetch/aria-current) are dropped.
- Unit tests cover both `to` values, the absent role/aria attributes (Gap 4), the focus ring,
  and the resting state at 100% line coverage; all repo gates pass.

### File List

- src/modules/user/features/auth/components/auth-switcher/index.tsx
- src/modules/user/features/auth/components/auth-switcher/styles.ts
- src/modules/user/features/auth/types/auth-switcher/index.ts
- tests/unit/modules/user/features/auth/components/auth-switcher.test.tsx

### Change Log

- 2026-06-25: Story drafted and implemented (commit 22a4429a); status set to done.
