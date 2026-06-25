# Story 1.2: Extract `AuthFormSection` — the reusable section shell

Status: done

## Story

As a developer,
I want one presentational section shell that wraps the form, the OAuth row, and the switcher
slot,
so both pages share the exact same geometry and the jscpd gate is satisfied by reuse rather
than copy-paste.

## Acceptance Criteria

1. Given `AuthFormSection` with `children`, `oauthInert={false}`, and a `switcher` node, When
   rendered, Then the children, the OAuth row (`AuthProviderButtons` inside the
   `auth-provider-buttons-container` `InertBox`), and the switcher node all appear inside a
   `<section>` with the shared `formSection`/`formWrapper` styling (FR9, NFR1).
2. Given `oauthInert={true}`, When rendered, Then the OAuth `InertBox` is `inert`; Given
   `oauthInert={false}`, Then it is not `inert` (both branches) (FR9, AC7).
3. Given the section, When inspected, Then it carries no `mode`, no `t`, and no switch
   callback (the toggler state is gone) (FR13).
4. Given the new files, When measured by rca, Then `index.tsx` defines a single component
   under all thresholds and the type lives in its own type-only file (NFR3, NFR7).

## Tasks / Subtasks

- [x] Task 1: Create the presentational `AuthFormSection` shell (AC: 1, 2, 3)
  - [x] 1.1 Add `src/modules/user/features/auth/components/auth-form-section/index.tsx`
        lifting the `<section>`/`formWrapper` shell from `form-section/index.tsx:124-139`,
        made presentational and parameterized via `{ children, oauthInert, switcher }`
  - [x] 1.2 Reuse `styles.formSection`/`styles.formWrapper` from `form-section/styles.ts:13-14`
        (re-exports of `auth-form-shared-styles`) so the geometry stays pixel-identical (NFR1)
  - [x] 1.3 Reuse `InertBox` from `form-section/inert-box.tsx` wrapping `AuthProviderButtons`
        with the existing `id="auth-provider-buttons-container"`, driving its `inert` from
        `oauthInert`
  - [x] 1.4 Omit any `mode`, `t`, or switch callback; render the `switcher` node as a slot only
- [x] Task 2: Add the type-only props file (AC: 4)
  - [x] 2.1 Add `src/modules/user/features/auth/types/auth-form-section/index.ts` declaring
        `AuthFormSectionProps { children: ReactNode; oauthInert: boolean; switcher: ReactNode }`
        with type-level constructs only (NFR7)
  - [x] 2.2 Import the props back into `index.tsx` via `import type` (no runtime import)
- [x] Task 3: Add unit coverage and pass all gates (AC: 1, 2, 4)
  - [x] 3.1 Add `tests/unit/modules/user/features/auth/components/auth-form-section/`
        `index.test.tsx` rendering with a stub child + stub switcher and asserting children,
        OAuth row, and switcher slot are present
  - [x] 3.2 Assert both `oauthInert` branches toggle the OAuth `InertBox` `inert` attribute,
        with `InertBox` stubbed to expose its `inert` prop (NFR5)
  - [x] 3.3 Reach 100% coverage and confirm `make lint-dup`/`lint-metrics`/ESLint/TS/
        dependency-cruiser all pass (NFR3, NFR10)

## Dev Notes

- Files to create: `src/modules/user/features/auth/components/auth-form-section/index.tsx`
  (new) and `src/modules/user/features/auth/types/auth-form-section/index.ts` (new,
  type-only). No existing file is modified or deleted by this story.
- The shell is lifted from `FormSectionLayout` (`form-section/index.tsx:124-139`) and made
  presentational and parameterized: `function AuthFormSection({ children, oauthInert,`
  `switcher })` renders `<Box component="section" sx={styles.formSection}>` wrapping
  `<Box sx={styles.formWrapper}>` with `children`, the `InertBox`, then the `switcher` node.
- `oauthInert` replaces the old
  `showNotification = mode==='register' && registrationView!=='form'` derivation
  (`form-section/index.tsx:121`): the sign-up section computes it from its own
  `registrationView`, the sign-in section passes a constant `false` (FR9).
- Reuse, do not copy: `styles.formSection`/`styles.formWrapper` come from
  `form-section/styles.ts:13-14` (re-exports of shared `auth-form-shared-styles`) and
  `InertBox` from `form-section/inert-box.tsx`, so geometry is pixel-identical (NFR1) and the
  jscpd copy/paste gate is satisfied by reuse, never by ignore directives.
- No toggler state: the section carries no `mode`, no `t`, and no switch callback (FR13).
- Type-only files (NFR7): `AuthFormSectionProps` lives in its own
  `types/auth-form-section/index.ts` with only type-level constructs; the component imports it
  via `import type`. The component is exempt from the no-free-function gate as a React `*.tsx`.
- Repo gates that must pass: rust-code-analysis metrics (`index.tsx` is a single component
  under all thresholds, NFR3), jscpd duplication (`make lint-dup`), type-only-files ESLint and
  dependency-cruiser rules, ESLint, and TypeScript — with no `eslint-disable`/`@ts-ignore`
  suppressions and no new inline comments.
- Selectors: tests prefer user-facing semantic queries; the OAuth row is located by its
  existing `id="auth-provider-buttons-container"` only as a last resort, and source ships no
  `data-testid` (NFR5).
- Test data uses the shared Faker builders under `tests/builders/` (imported via `@tests/*`)
  for any generated values; coverage must stay at 100% over `src/**` (NFR10).
- Accessibility for this story: the `inert` primitive on the OAuth row is reused as-is
  (confirmed correct); the pinned notification a11y items (Gap 1 focus target, Gap 2 success
  live-region timing, Gap 4 swap-link role) are owned by later stories and out of scope here.

### References

- Epic:
  specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-2

## Dev Agent Record

**Agent Model Used:** Opus 4.8 (BMAD Dev agent, Amelia)

**Completion Notes:**

- Extracted the presentational `AuthFormSection` shell verbatim from `FormSectionLayout`
  (`form-section/index.tsx:124-139`), parameterized by `{ children, oauthInert, switcher }`;
  carries no `mode`, `t`, or switch callback (FR13).
- Reused `styles.formSection`/`formWrapper`, `InertBox`, and `AuthProviderButtons` from
  `form-section/` — geometry stays pixel-identical (NFR1) and jscpd is satisfied by reuse.
- accessibility-lead signed off the extraction (no role/landmark/heading change; `inert` reused).
- Gates green: ESLint, tsc, dependency-cruiser (type-only), jscpd, rca metrics; new files 100%
  covered; no suppressions and no inline comments.

**File List:**

- `src/modules/user/features/auth/components/auth-form-section/index.tsx` (new)
- `src/modules/user/features/auth/types/auth-form-section/index.ts` (new, type-only)
- `tests/unit/modules/user/features/auth/components/auth-form-section/index.test.tsx` (new)

**Change Log:**

- 2026-06-25: Implemented Story 1.2 — extracted `AuthFormSection`.
