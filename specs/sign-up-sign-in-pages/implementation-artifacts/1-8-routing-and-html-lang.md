# Story 1.8: Routing — add `/sign-up` + `/sign-in`, remove `/authentication`, `<html lang>` (M2)

Status: done

## Story

As a visitor,
I want `/sign-up` and `/sign-in` to be real routes and `/authentication` to no longer exist,
and as a Ukrainian-speaking screen-reader user I want the page announced in the correct language.

## Acceptance Criteria

1. Given a `GET /sign-up`, When the router resolves, Then `<SignUp/>` renders; Given a
   `GET /sign-in`, Then `<SignIn/>` renders (FR1, FR2, AC1, AC2).
2. Given a `GET /authentication`, When the router resolves, Then no auth page renders (no
   redirect, no alias; it falls through to react-router's not-matched behavior) (FR3, AC3).
3. Given the app mounts, When the i18n effect runs, Then
   `document.documentElement.lang === i18n.language`; Given a `languageChanged` event, Then
   `lang` is re-applied (AR4, M2, AC9).
4. Given the router, When the chunk graph is asserted, Then `/sign-up` and `/sign-in` are
   route-level lazy chunks (route-level code splitting preserved) (FR12, NFR2, AC18).
5. Given the effect after the edit, When measured by rca, Then it stays ≤3 exit points and
   Cognitive ≤15 (the `lang` assignment adds no closure) (NFR3).

## Tasks / Subtasks

- [x] Task 1: Rewrite the router in `src/app.tsx` for the new auth routes (AC: 1, 2, 4)
  - [x] 1.1 Keep the `ProtectedRoute → '/' ButtonExample` branch (`app.tsx:13-21`) verbatim
  - [x] 1.2 Remove the `{ path: '/authentication', element: <Authentication/> }` entry
        (`app.tsx:22-25`) and the `Authentication` lazy import (`app.tsx:10`) — no redirect,
        no alias (FR3, D-REMOVE)
  - [x] 1.3 Add `const SignUp = lazy(async () => import('@auth/sign-up'));` and
        `const SignIn = lazy(async () => import('@auth/sign-in'));`
  - [x] 1.4 Add `{ path: '/sign-up', element: <SignUp /> }` and
        `{ path: '/sign-in', element: <SignIn /> }`, keeping the unchanged
        `<React.Suspense fallback={null}>` (`app.tsx:40`) so route chunking is preserved

- [x] Task 2: Add `<html lang>` to the existing i18n effect in `src/app.tsx` (AC: 3, 5)
  - [x] 2.1 In the i18n `useEffect` (`app.tsx:31-38`), set
        `document.documentElement.lang = i18n.language` alongside `applyDir()`
  - [x] 2.2 Re-apply the `lang` on the `languageChanged` event and tear it down via the existing
        `i18n.off` cleanup, adding no new closure or exit point so the effect stays under the
        rca caps (≤3 exit points, Cognitive ≤15)

- [x] Task 3: Update unit tests for the new routes and `<html lang>` (AC: 1, 2, 3)
  - [x] 3.1 In `tests/unit/app.test.tsx`, replace `pushState('/authentication')` (`:21`) with a
        `/sign-up` render case and add a `/sign-in` render case
  - [x] 3.2 Assert `/authentication` resolves to no auth page (AC3); rename the mocked auth
        module path(s) to the new page modules
  - [x] 3.3 Assert `document.documentElement.lang` after a simulated `languageChanged` (AC9)
  - [x] 3.4 Update `tests/unit/app-root.test.tsx` mocked auth page module path(s); the `/`
        protected-outlet assertion stays

## Dev Notes

- Only `src/app.tsx` changes in source (routes + the `<html lang>` line in the i18n effect).
- Routes are lazy at the route level under the unchanged `<React.Suspense fallback={null}>`
  (`app.tsx:40`), preserving the route chunking `performance-serving.test.ts` asserts
  (NFR2, FR12).
- `/authentication` is removed with no redirect and no alias (FR3, D-REMOVE) — it falls through
  to react-router's not-matched behavior.
- The `document.title` concern stays in the per-page `usePageTitle` hook (Story 1.7), not in the
  app effect, keeping the app effect single-responsibility (NFR3).
- The `lang` assignment is a visual-neutral one-liner inside the existing effect that adds no new
  closure or exit point, so it stays under the rca caps (≤3 exit points, Cognitive ≤15).
- Tests: `tests/unit/app.test.tsx` and `tests/unit/app-root.test.tsx`. Use exact route literals
  and the exact `lang` value (NFR13).
- Test data for any generated user/auth values uses the shared Faker builders under
  `tests/builders/` via the `@tests/*` alias; keep hardcoded literals only where the value IS
  the contract (route paths, the `lang` value).
- Locate elements by user-facing semantics (`getByRole`, `getByLabelText`, `getByText`); source
  ships no `data-testid`.
- Repo gates must pass: `make lint` / `lint-metrics` (rust-code-analysis), jscpd duplication,
  type-only files convention, and dependency-cruiser — with no eslint/TypeScript suppressions,
  no inline comments, and 100% coverage maintained.
- Dependencies: 1.5 (`SignUp`) and 1.6 (`SignIn`) must exist so the routes point at real pages;
  Story 1.9 (`ProtectedRoute → /sign-in`) is paired but independent.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-8

## Dev Agent Record

**Agent Model Used:** Opus 4.8 (BMAD Dev agent, Amelia)

**Completion Notes:**

- Rewrote `app.tsx` routing: removed `/authentication` + its lazy import (no redirect, no alias),
  added route-level lazy `/sign-up` → `SignUp` and `/sign-in` → `SignIn` (imported from
  `@auth/routes/...` per the Story 1.5 relocation). Kept the ProtectedRoute → `/` branch verbatim.
- Added `document.documentElement.lang = i18n.language` to the existing i18n effect (renamed
  `applyDir` → `applyHtmlAttrs`), re-applied on `languageChanged` via the same listener/cleanup —
  no new closure or exit point (M2, AR4; stays under the rca caps).
- Tests: rewrote `app.test.tsx` to render via a `react-router-dom` mock (`createBrowserRouter`
  returns the route array; `RouterProvider` builds a `createMemoryRouter` at a controllable path).
  This avoids the dual-React-instance breakage of `jest.resetModules` and lets one App instance be
  tested at `/sign-up`, `/sign-in`, and the removed `/authentication` (renders no auth page), with
  `<html lang>` assertions incl. on `languageChanged`. Updated `app-root.test.tsx` mocks to the two
  new page modules.
- Gates green: ESLint, tsc, dependency-cruiser, jscpd, rca metrics; `app.tsx` 100% covered; no
  suppressions and no inline comments.

**File List:**

- `src/app.tsx` (modified — routes + `<html lang>`)
- `tests/unit/app.test.tsx` (rewritten)
- `tests/unit/app-root.test.tsx` (modified — auth page mocks)

**Change Log:**

- 2026-06-25: Implemented Story 1.8 — routing for `/sign-up` + `/sign-in`, removed
  `/authentication`, `<html lang>` sync.
