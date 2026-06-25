# Story 1.13: E2E refactor + new swap-navigation spec + registration-error focus

Status: done

## Story

As a user,
I want the swap link to actually navigate between `/sign-up` and `/sign-in` in both
directions, the forms to work on the new routes, and my focus to land meaningfully after a
registration failure, so the routed flow is correct and accessible end-to-end.

## Acceptance Criteria

1. Given `/sign-up`, When the swap link is clicked, Then the URL becomes `/sign-in`; Given
   `/sign-in`, When its swap link is clicked, Then the URL becomes `/sign-up` — both via
   `getByRole('link', { name })` + `toHaveURL` (FR5, AC5, NFR13).
2. Given the login form on `/sign-in`, When navigated to directly (no toggler click), Then it
   renders and submits as before (FR2, AC2, AC15).
3. Given the registration form on `/sign-up`, When submitted, Then `toHaveURL('/sign-up')` and
   the flow behaves as before (FR1, AC1, AC15).
4. Given a registration failure, When the error notification mounts, Then focus is on a
   meaningful element (not `<body>`) while the form is `inert` (AR5, M4, AC12).
5. Given the specs, When selectors are reviewed, Then no `*ByTestId` is used to locate the swap
   link or headings — role/label/text only (NFR5).

## Tasks / Subtasks

- [x] Task 1: Rename auth routes across the existing e2e specs (AC: 2, 3)
  - [x] 1.1 Update
        `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/constants/constants.ts`
        — `REGISTRATION_URL='/authentication'` → `/sign-up` (`:10`)
  - [x] 1.2 Update
        `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/login-form.spec.ts`
        — `AUTH_URL='/authentication'` → navigate directly to `/sign-in`, dropping
        `gotoLogin`'s switcher click (`:8,18-21`)
  - [x] 1.3 Update `tests/e2e/components/skeletons/auth-skeleton.spec.ts` —
        `AUTH_URL='/authentication'` → `/sign-up` (`:8`); skeleton behavior unchanged
  - [x] 1.4 Update `tests/e2e/modules/back-to-main.spec.ts` — `page.goto('/authentication')` +
        `toHaveURL(/\/authentication$/)` → `/sign-up` (`:15-16`)
  - [x] 1.5 Verify
        `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/registration-form.spec.ts`
        resolves through the constant and asserts `toHaveURL('/sign-up')`

- [x] Task 2: Add the new swap-navigation spec (AC: 1, 5)
  - [x] 2.1 Create `tests/e2e/modules/user/features/auth/swap-navigation.spec.ts`
  - [x] 2.2 From `/sign-up`, locate
        `getByRole('link', { name: switcher_text_have_account })`, click → assert
        `toHaveURL(/\/sign-in$/)`
  - [x] 2.3 From `/sign-in`, locate the reciprocal link → click → assert
        `toHaveURL(/\/sign-up$/)`; assert the control is a link (`<a href>`)

- [x] Task 3: Add the registration-error focus assertion (AC: 4, 5)
  - [x] 3.1 After a registration failure, assert the active element is a meaningful element
        (the error view), explicitly NOT `<body>`, while the form is `inert`
  - [x] 3.2 Source generated user/credential data from `@tests/builders` (`buildUser`,
        `buildCredentials`), seeded via `seedFaker()` — no hardcoded literals
  - [x] 3.3 Locate elements by role/label/text only — no `*ByTestId` for the swap link or
        headings

## Dev Notes

- Files to modify:
  `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/constants/constants.ts`,
  `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/login-form.spec.ts`,
  `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/registration-form.spec.ts`
  (verify only), `tests/e2e/components/skeletons/auth-skeleton.spec.ts`, and
  `tests/e2e/modules/back-to-main.spec.ts`.
- File to create:
  `tests/e2e/modules/user/features/auth/swap-navigation.spec.ts` (new).
- The login submit/busy/error specs and the registration-form spec are preserved on the new
  routes (AC15); Mockoon drives the API as today.
- The swap control is now a real link, so reach it via `getByRole('link', { name })`, not the
  old `page.locator('button', { hasText })`; the switcher click is removed from the login
  reach-path (navigate directly to `/sign-in`).
- Gap 1 (a11y review): the registration-error focus target is a meaningful element outside the
  alert and before the retry control — assert focus is on that element (not `<body>`) while the
  form is `inert` (AR5, M4, AC12, WCAG 2.4.3).
- Semantic selectors only: locate by `getByRole` / label / text; the source ships no
  `data-testid`, and no `*ByTestId` may be used to locate the swap link or headings (NFR5).
- Test data comes from the shared Faker builders under `@tests/builders` (`buildUser`,
  `buildCredentials`), seeded deterministically via `seedFaker()` — not hardcoded literals
  (NFR8).
- Honor the pinned decisions unchanged in these specs: D1 keeps the `#969B9D` switcher color
  (waived), D2 keeps the current switcher text, and D3 keeps "Authentication" as the sign-in
  title — assertions must match the current text/colors, not the deferred D1/D2 variants.
- Repo gates that still apply: no ESLint/TypeScript suppressions, no new inline code comments,
  and `make test-e2e` must pass green on the new routes.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-13

## Dev Agent Record

**Agent Model Used:** Opus 4.8 (BMAD Dev agent, Amelia)

**Completion Notes:**

- Updated e2e route refs: e2e `constants.ts` `REGISTRATION_URL` → `/sign-up`; `login-form.spec`
  `gotoLogin` now navigates directly to `/sign-in` (switcher click + `switcherToLogin` removed);
  e2e `auth-skeleton.spec` `AUTH_URL` → `/sign-up`; `back-to-main.spec` `goto` + `toHaveURL` →
  `/sign-up`; `registration-form.spec` failure-focus `querySelector('h4')` → heading-agnostic
  (`h1..h6`) to match the new `h2` notification heading + the focus wrapper.
- Added `tests/e2e/modules/user/features/auth/swap-navigation.spec.ts`: from `/sign-up` the swap
  link (`a[href="/sign-in"]` with the switcher text) navigates to `/sign-in`, and the reciprocal
  from `/sign-in` → `/sign-up` (both directions; asserts it is a real `<a href>` + `toHaveURL`).
- Deviation: the AC says `getByRole('link')`, but the repo's testing-library ESLint rule
  (`prefer-screen-queries`) flags Playwright's `page.getByRole`; used the repo's e2e convention
  `page.locator('a[href=...]').filter({ hasText })` instead (same intent). No suppressions.
- Per the agreed "file changes, CI runs stacks" plan these specs RUN in CI (`make test-e2e`,
  Mockoon-backed); locally validated via ESLint + tsc + dependency-cruiser (the unit gate does not
  execute Playwright).

**File List:**

- MODIFIED: e2e `auth-forms/constants/constants.ts`, `auth-forms/login-form.spec.ts`,
  `auth-forms/registration-form.spec.ts`, `components/skeletons/auth-skeleton.spec.ts`,
  `modules/back-to-main.spec.ts`.
- NEW: `tests/e2e/modules/user/features/auth/swap-navigation.spec.ts`.

**Change Log:**

- 2026-06-25: Implemented Story 1.13 — e2e route refactor + swap-navigation spec (CI runs the suite).
