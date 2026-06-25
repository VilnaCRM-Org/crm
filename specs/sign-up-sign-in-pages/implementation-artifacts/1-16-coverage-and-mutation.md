# Story 1.16: Unit + integration coverage to 100% and mutation hardening (NFR10/NFR13)

Status: draft

## Story

As a maintainer,
I want every new source file fully covered with exact-value assertions and every deleted-file
test removed,
so that coverage stays 100% over `src/**` and Stryker reports no surviving mutant on the new
branches.

## Acceptance Criteria

1. Given the full unit + integration run, When coverage is computed, Then it is 100% over
   `src/**`, including every new file, with no deleted-file test lingering (NFR10, AC17).
2. Given Stryker runs, When mutants alter a route literal, the swap `href`, a notification role,
   the `#404142` ring, the `<h1>` tag, `document.title`, `<html lang>`, or the `/sign-in`
   redirect, Then the exact-value assertions kill them (NFR13, AC21).
3. Given the tests, When selectors are reviewed, Then no `data-testid` is added to `src/**` and
   elements are located by role/label/text (NFR5).
4. Given the auth store, When the suite runs, Then no `clearInstances()` spy hazard is hit (the
   store is unchanged) (NFR10, R10).

## Tasks / Subtasks

- [ ] Task 1: Consolidate per-file unit coverage for every new source file (AC: 1, 3)
  - [ ] 1.1 Verify the Stories 1.1-1.7 unit tests fully exercise `auth-switcher`,
        `auth-form-section`, `auth-page-layout`, `sign-up/index` + `sign-up-form-section`,
        `sign-in/index` + `sign-in-form-section`, and `hooks/use-page-title`
  - [ ] 1.2 Verify the `UIForm` `titleComponent` branch is exercised (Story 1.8/1.9 tests)
  - [ ] 1.3 Confirm `app`/`protected-route`/tooling tests (Stories 1.8/1.9/1.12) and the
        route-agnostic store/repo/skeleton integration suites cover their files
  - [ ] 1.4 Confirm all element queries use `getByRole`/`getByLabelText`/`getByText` with no
        `data-testid` added to `src/**`

- [ ] Task 2: Remove deleted-module tests and confirm no store spy hazard (AC: 1, 4)
  - [ ] 2.1 Remove the deleted toggler tests (Story 1.10) so no deleted-file test lingers
  - [ ] 2.2 Confirm the auth store is untouched so the `clearInstances()`
        module-load-captured-store spy hazard (R10) is not triggered

- [ ] Task 3: Add exact-value mutation-hardening assertions (AC: 2)
  - [ ] 3.1 Assert the exact route literals `/sign-up` and `/sign-in`
  - [ ] 3.2 Assert the exact swap-link `href`
  - [ ] 3.3 Assert the exact notification politeness values (`status` / `alert`)
  - [ ] 3.4 Assert the exact `#404142` ring color, the `<h1>` tag, `document.title`, and
        `<html lang>`
  - [ ] 3.5 Assert the exact `/sign-in` redirect target
  - [ ] 3.6 Replace any user/auth domain literals with `@tests/builders` values (NFR8)

- [ ] Task 4: Verification (AC: 1-4)
  - [ ] 4.1 Run `make test-unit-all` plus integration and confirm green at 100% over `src/**`
  - [ ] 4.2 Run `make test-mutation` and confirm no surviving mutant on the new branches
  - [ ] 4.3 Confirm no `data-testid` in `src/**` and no lint/TS suppression in the suite

## Dev Notes

- Test files only — no production source changes in this story. Touch the new
  component/page/hook unit tests (Stories 1.1-1.7), the deleted toggler tests (Story 1.10),
  the `app`/`protected-route`/tooling tests (Stories 1.8/1.9/1.12), and the route-agnostic
  integration suites verified for coverage.
- Coverage gate: the global 100% coverage over `src/**` must hold after the add/delete churn;
  every NEW source file is fully exercised and every DELETED-module test (Story 1.10) is
  removed (NFR10, AC17).
- Mutation hardening (NFR13, AC21): add exact-value (not truthy) assertions so Stryker kills
  mutants on the route literals (`/sign-up`, `/sign-in`), the swap-link `href`, the
  notification politeness values (`status` / `alert`), the `#404142` ring, the `<h1>` tag,
  `document.title`, `<html lang>`, and the `/sign-in` redirect target.
- The auth store is untouched, so the `clearInstances()` module-load-captured-store spy hazard
  is NOT triggered — note it, but no action is needed (R10).
- Selectors: source ships no `data-testid`; locate elements by role/label/text
  (`getByRole`/`getByLabelText`/`getByText`), falling back to a stable `id` only when no
  semantic query fits (NFR5).
- Test data: new/updated unit tests reuse `@tests/builders` (`buildUser`, `buildCredentials`,
  `buildLoginResponse`, …) for any user/auth domain data rather than hardcoded literals
  (NFR8). Keep literals only where the value IS the test case or a fixed contract (route
  paths, color codes, error codes, i18n strings).
- Repo gates apply to the test changes: rust-code-analysis metrics, jscpd duplication,
  type-only files convention, no ESLint/TypeScript suppressions, and no new inline comments —
  satisfy each by refactoring, never by disable directives.
- Accessibility values are asserted exactly so mutation tests pin them: the error notification
  uses `role="alert"` and the success notification uses `role="status"`; the focus ring is
  `#404142`; the page exposes one `<h1>`, a correct `document.title`, and `<html lang>`.
- D3 is honored: the sign-in title stays "Authentication" — assert this exact title text rather
  than changing it.

### References

- Epic:
  specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-16
