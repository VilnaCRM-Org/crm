# Story 1.3: Extract `AuthPageLayout` — the reusable page chrome

Status: done

## Story

As a developer,
I want one reusable component for the page chrome (back link, `<main>`, error boundary,
suspense + skeleton, footer),
so that both pages share it with no duplication and the AuthSkeleton-while-chunk-loads
behavior is preserved.

## Acceptance Criteria

1. Given `AuthPageLayout` with a child, When rendered, Then the back link (`UIBackToMain`),
   a `<main>` landmark, the child inside `<AuthErrorBoundary>` + `<Suspense>`, and the footer
   (`UIFooter`) all appear in that order (FR8, FR12).
2. Given a child that suspends, When it is loading, Then the `AuthSkeleton` fallback renders
   (skeleton-while-chunk-loads behavior preserved) (FR1, FR12).
3. Given a child that throws a chunk-load error, When it errors, Then the `AuthErrorBoundary`
   fallback renders (behavior preserved) (FR8).
4. Given the new files, When measured by rca, Then `index.tsx` defines a single component
   under all thresholds and the prop type lives in its own type-only file (NFR3, NFR7).

## Tasks / Subtasks

- [x] Task 1: Add the `AuthPageLayout` component (AC: 1, 2, 3, 4)
  - [x] 1.1 Create `src/modules/user/features/auth/components/auth-page-layout/index.tsx`
        with the chrome lifted verbatim from `auth/index.tsx:12-25`
  - [x] 1.2 Mirror the imports from `auth/index.tsx:1-7` (`Box`, `Suspense`, `AuthSkeleton`,
        `UIBackToMain`, `UIFooter`, `AuthErrorBoundary`)
  - [x] 1.3 Keep the `<main>` `sx` literal, `<AuthErrorBoundary>`, and
        `<Suspense fallback={<AuthSkeleton/>}>` identical to today's (FR8, FR12, NFR1)

- [x] Task 2: Add the type-only props file (AC: 4)
  - [x] 2.1 Create `src/modules/user/features/auth/types/auth-page-layout/index.ts` with
        `AuthPageLayoutProps { children: ReactNode }`, imported via `import type` (NFR7)

- [x] Task 3: Cover the new layout with unit tests (AC: 1, 2, 3, 4)
  - [x] 3.1 Add
        `tests/unit/modules/user/features/auth/components/auth-page-layout/index.test.tsx`
  - [x] 3.2 Port the header / `<main>` / skeleton-while-loading / footer and
        error-boundary-fallback assertions from the to-be-deleted
        `tests/unit/modules/user/features/auth/index.test.tsx`
  - [x] 3.3 Use semantic queries (`getByRole('main')`, role/text) per NFR5 and reach 100%
        coverage of the new layout (NFR10)

## Dev Notes

- New files to create: `src/modules/user/features/auth/components/auth-page-layout/index.tsx`
  and `src/modules/user/features/auth/types/auth-page-layout/index.ts` (type-only).
- The chrome is lifted **verbatim** from `auth/index.tsx:12-25`; imports mirror
  `auth/index.tsx:1-7`. The `<main>` `sx` literal, `<AuthErrorBoundary>`, and
  `<Suspense fallback={<AuthSkeleton/>}>` stay identical so the skeleton-while-loading
  behavior and the error-boundary fallback are preserved unchanged (FR8, FR12).
- Both `SignUp` and `SignIn` consume this single component, so the ~10-line chrome is not a
  > 75-token clone across the two pages — satisfy the jscpd DRY gate by reuse (NFR4), not
  > copy-paste or ignore directives.
- The `.tsx` component is exempt from the no-free-function / no-static gate (NFR6); the
  prop type lives in the dedicated type-only file and is imported with `import type` —
  enforced by ESLint and dependency-cruiser, do not declare `interface`/`type` in the logic
  file (NFR7).
- Stay under the rust-code-analysis metrics caps: `index.tsx` defines a single component
  under all thresholds (Cyclomatic ≤10, Cognitive ≤15, ABC ≤17, ≤3 args, ≤3 exit points,
  function LLOC ≤10 / file LLOC ≤120) (NFR3).
- Tests locate elements by user-facing semantics (`getByRole('main')`, role/text) — no
  `data-testid` in `src/**` and no `*ByTestId` in tests (NFR5). Use the shared Faker
  builders for any arbitrary domain data and keep 100% coverage over `src/**` (NFR10).
- No new ESLint/TypeScript suppressions, no new inline code comments — satisfy every gate
  by writing conformant code, never by silencing it.
- No accessibility-decision items (D1 switcher color, D2 switcher text, D3 sign-in title,
  Gap 1 error-view focus, Gap 2 success live-region, Gap 4 swap-link role) apply to this
  story — the chrome carries no switcher, notification, or page title; those land in
  Stories 1.1, 1.5/1.6, 1.7, and 1.11.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-3

## Dev Agent Record

**Agent Model Used:** Opus 4.8 (BMAD Dev agent, Amelia)

**Completion Notes:**

- Lifted the page chrome verbatim from `auth/index.tsx:12-25` into `AuthPageLayout`,
  parameterized by `children` (replacing the hardcoded `<FormSection/>`); the `<main>` sx,
  `AuthErrorBoundary`, and `Suspense fallback={<AuthSkeleton/>}` are unchanged (FR8, FR12, NFR1).
- Ported the header/main/skeleton-while-loading/footer and error-boundary-fallback assertions
  from the to-be-deleted `auth/index.test.tsx` (that deletion lands in Story 1.10).
- Landmark structure preserved (one `<main>`, `UIBackToMain`/`UIFooter` siblings) — covered by
  the pre-implementation accessibility-lead review.
- Gates green: ESLint, tsc, dependency-cruiser (type-only), jscpd, rca metrics; new files 100%
  covered; no suppressions and no inline comments.

**File List:**

- `src/modules/user/features/auth/components/auth-page-layout/index.tsx` (new)
- `src/modules/user/features/auth/types/auth-page-layout/index.ts` (new, type-only)
- `tests/unit/modules/user/features/auth/components/auth-page-layout/index.test.tsx` (new)

**Change Log:**

- 2026-06-25: Implemented Story 1.3 — extracted `AuthPageLayout`.
