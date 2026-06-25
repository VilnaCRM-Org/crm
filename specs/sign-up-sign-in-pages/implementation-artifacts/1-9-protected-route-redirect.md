# Story 1.9: Protected-route redirect to `/sign-in` (D-REDIRECT)

Status: done

## Story

As an unauthenticated user hitting a protected route,
I want to be redirected to `/sign-in`,
so that I land on the login page rather than the removed `/authentication` route.

## Acceptance Criteria

1. Given no auth token, When `ProtectedRoute` renders, Then it returns
   `<Navigate to="/sign-in" replace/>` and the test lands on the `/sign-in` element (not
   `/authentication`) (FR4, D-REDIRECT, AC4).
2. Given an auth token, When `ProtectedRoute` renders, Then it renders the protected
   `<Outlet/>` (unchanged) (FR4, AC4).
3. Given the test, When the redirect target is asserted, Then it is the exact string
   `/sign-in` (mutation hardening) (NFR13, AC21).

## Tasks / Subtasks

- [x] Task 1: Flip the protected-route redirect target to `/sign-in` (AC: 1, 2)
  - [x] 1.1 In `src/modules/user/features/auth/components/protected-route/index.tsx`, change
        the `<Navigate to="/authentication" replace/>` target to `<Navigate to="/sign-in"
replace/>`, keeping `useAuthToken()` and the `<Outlet/>` branch unchanged
  - [x] 1.2 Confirm this is the single-literal change only — no other logic, props, or imports
        are touched
- [x] Task 2: Update the protected-route unit test to the new target (AC: 1, 3)
  - [x] 2.1 In `tests/unit/components/protected-route.test.tsx`, change the route element and
        redirect target `/authentication` → `/sign-in` (lines `:22,35`)
  - [x] 2.2 Assert the unauthenticated render lands on the `/sign-in` element with the exact
        string `/sign-in` asserted so Stryker kills a mutated route string (NFR13)
  - [x] 2.3 Keep the authenticated-token case rendering the protected `<Outlet/>` (unchanged)

## Dev Notes

- Source change is a single literal in
  `src/modules/user/features/auth/components/protected-route/index.tsx`:
  `ProtectedRoute` (`protected-route/index.tsx:8`) currently returns
  `token ? <Outlet/> : <Navigate to="/authentication" replace/>` via `useAuthToken()`; flip the
  navigate target to `/sign-in` only. `useAuthToken()` and the `<Outlet/>` branch are unchanged
  (FR4, D-REDIRECT).
- Test change is in `tests/unit/components/protected-route.test.tsx` only: redirect target
  `/authentication` → `/sign-in` at `:22,35`, asserting the exact `/sign-in` string for mutation
  hardening (NFR13, AC21).
- Dependencies: Stories 1.6 (`/sign-in` page) and 1.8 (the `/sign-in` route/element) must exist
  for the integration-style "lands on `/sign-in`" assertion; the source one-liner itself is
  independent.
- Repo gates that must pass: rust-code-analysis metrics (`make lint-metrics`), jscpd duplication
  (`make lint-dup`), and the full `make lint` (ESLint, tsc) suite. No new eslint/ts suppression
  directives and no new inline code comments — fix the code to satisfy the gates.
- Type-only files convention (issue #88) is not exercised here — no new types are introduced; do
  not add or export `interface`/`type` in this logic file.
- Semantic selectors / no `data-testid` (pattern 4): no new `data-testid` may be added in
  `src/**`. The pre-existing mock-stub `data-testid` already in
  `tests/unit/components/protected-route.test.tsx` is test-only and stays at warn level (NFR5,
  R13); do not introduce new ones — locate elements by user-facing semantics.
- Faker test builders (issue #101): this story asserts route-string contracts, so the
  `/sign-in` and `/authentication` literals are fixed-contract values, not arbitrary domain data
  — keep them as literals rather than generating them.
- Coverage: unit + integration enforce 100% over `src/**`; the changed branch must stay fully
  covered by both the unauthenticated-redirect and authenticated-`<Outlet/>` cases.

### References

- Epic:
  specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-9

## Dev Agent Record

**Agent Model Used:** Opus 4.8 (BMAD Dev agent, Amelia)

**Completion Notes:**

- Changed `ProtectedRoute`'s unauthenticated redirect from the removed `/authentication` to
  `/sign-in` (D-REDIRECT, FR4) — a one-line `Navigate to` change; `useAuthToken()` and the
  `<Outlet/>` branch are unchanged.
- Updated `protected-route.test.tsx`: the redirect-target route is now `/sign-in`; also added a
  `/sign-up` stub and assert it is NOT rendered, so a mutated redirect target (`/sign-up` or the old
  `/authentication`) is killed (mutation hardening, AC21). The mock-stub `data-testid` queries stay
  warn-level per NFR5/R13.
- Gates green: ESLint, tsc, dependency-cruiser, jscpd, rca metrics; protected-route 100% covered; no
  suppressions and no inline comments.

**File List:**

- `src/modules/user/features/auth/components/protected-route/index.tsx` (modified)
- `tests/unit/components/protected-route.test.tsx` (modified)

**Change Log:**

- 2026-06-25: Implemented Story 1.9 — protected-route redirect → `/sign-in`.
