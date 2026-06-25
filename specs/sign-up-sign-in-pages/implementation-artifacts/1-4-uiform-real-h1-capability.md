# Story 1.4: Add the real-`<h1>` capability to `UIForm`/`FormHeader` (C1)

Status: done

## Story

As an assistive-technology user,
I want each auth page to have exactly one real `<h1>`,
so the page has a programmatic title and a non-skipping heading order rather than zero headings.

## Acceptance Criteria

1. Given a `UIForm` rendered with `titleComponent="h1"`, When the title is queried, Then it is
   exposed as `getByRole('heading', { level: 1 })` and the underlying tag is `<h1>` (AR1, C1,
   AC10).
2. Given a `UIForm` rendered WITHOUT `titleComponent`, When the title is queried, Then it is a
   `<p>` (the existing default is preserved; non-auth callers unaffected) (AR1, FR14).
3. Given the change, When the title size is measured, Then `variant="h4"` styling is unchanged
   (no visual change) (NFR1, AR1).
4. Given the props type, When inspected, Then `titleComponent` is optional and lives in the
   type-only `types/ui-form/index.ts`; the logic file declares no `interface`/`type` (NFR7).

## Tasks / Subtasks

- [x] Task 1: Add the optional `titleComponent` prop to the type-only `UIForm` types (AC: 4)
  - [x] 1.1 In `src/components/types/ui-form/index.ts`, add
        `titleComponent?: React.ElementType` to `UIFormProps`
  - [x] 1.2 In the same file, add `titleComponent?: React.ElementType` to `FormBodyProps`
  - [x] 1.3 Keep the file type-only — no runtime `const`/`function`/`class`; the logic file
        declares no `interface`/`type`

- [x] Task 2: Thread `titleComponent` through the logic file to `FormHeader` (AC: 1, 2, 3)
  - [x] 2.1 In `src/components/ui-form/index.tsx`, forward `titleComponent` from `UIForm`
        through `FormBody` to `FormHeader`
  - [x] 2.2 In `FormHeader`, render
        `<UITypography variant="h4" component={titleComponent} sx={styles.formTitle}>`
  - [x] 2.3 Confirm the omitted-prop path preserves `UITypography`'s `component || 'p'` default
        so non-auth callers stay a `<p>` and `variant="h4"` styling is unchanged

- [x] Task 3: Unit-test the `<h1>`/`<p>` behavior (AC: 1, 2)
  - [x] 3.1 In `tests/unit/components/ui-form/index.test.tsx`, add a `titleComponent="h1"` case
        asserting `getByRole('heading', { level: 1 })` and the exact `<h1>` tag
  - [x] 3.2 Add/confirm a case where omitting `titleComponent` still renders a `<p>` for
        non-auth callers (AC10), with an exact-tag assertion (NFR13)

## Dev Notes

- Files to modify (Files touched): `src/components/ui-form/index.tsx` (thread `titleComponent`
  through `UIForm` → `FormBody` → `FormHeader`) and `src/components/types/ui-form/index.ts`
  (add `titleComponent?: React.ElementType` to `UIFormProps` and `FormBodyProps`). No files are
  created or deleted in this story.
- Today `FormHeader` renders the title as `<UITypography variant="h4" sx={styles.formTitle}>`
  with no `component` prop; `UITypography` defaults `component={component || 'p'}`, so the title
  is a `<p>` and each auth page currently has zero real headings (C1).
- The change is additive and optional, like the existing `subtitle`/`showTitle` props: when
  `titleComponent` is omitted the `component || 'p'` default is preserved and non-auth `UIForm`
  callers are untouched. `UITypography` already forwards `component`, so no `UITypography` change
  is needed.
- `variant="h4"` is retained so the title size is unchanged (no visual change, NFR1); only the
  rendered element becomes a real heading.
- Scope boundary: this story threads the prop and asserts it in isolation. The two form
  consumers wire `titleComponent="h1"` in Story 1.5.
- Type-only files convention (issue #88, NFR7): `titleComponent` lives only in
  `src/components/types/ui-form/index.ts`; the logic file `src/components/ui-form/index.tsx`
  must not declare or export `interface`/`type`. Type files stay type-only and are imported with
  `import type`.
- Repo gates that must pass: `make lint-metrics` (rust-code-analysis — additive, no new
  function), `make lint-dup` (jscpd), ESLint, TypeScript, and dependency-cruiser (type-only
  rules). Satisfy each gate by refactoring — no `eslint-disable`/`@ts-ignore`/suppression
  directives, and no new inline code comments.
- Tests: source ships no `data-testid`; locate the title via semantic queries
  (`getByRole('heading', { level: 1 })`, `getByText`). Generate any arbitrary title/text test
  data via the shared Faker builders under `tests/builders/` (`@tests/*` alias); keep literals
  only when the value is the test case. Keep unit/integration coverage at 100% over the changed
  lines.

### References

- Epic:
  specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-4

## Dev Agent Record

**Agent Model Used:** Opus 4.8 (BMAD Dev agent, Amelia)

**Completion Notes:**

- Added optional `titleComponent` to `UIFormProps`/`FormBodyProps` and threaded it through
  `UIForm` → `FormBody` → `FormHeader`, which renders
  `<UITypography variant="h4" component={titleComponent}>`. Omitted → the `<p>` default is kept,
  so non-auth callers are unaffected; `variant="h4"` size is unchanged (NFR1).
- Typed `titleComponent` as `TitleHeadingComponent` (`'h1'..'h6'`), not `React.ElementType`:
  `UITypography`'s `component` prop is a fixed tag union, so `ElementType` failed `tsc`.
- Deviation (forced by the rca PLOC <= 40 gate — `UIForm` already sat at 40): extracted a
  one-line `useUIForm` hook (`use-ui-form.ts`) returning `{ methods, submitting }`, and moved
  `FormBody` to read `methods` from `useFormContext` (dropping its `methods` prop). Behavior is
  identical — all 16 `UIForm` tests plus the login/registration form tests pass.
  `react/jsx-props-no-spreading` ruled out a rest-spread alternative.
- Gates green: ESLint, `tsc`, dependency-cruiser (type-only), jscpd, rca metrics; the `ui-form`
  files are 100% covered; no suppressions and no inline comments.

**File List:**

- `src/components/ui-form/index.tsx` (modified — thread `titleComponent`; `FormBody` via context)
- `src/components/ui-form/use-ui-form.ts` (new — `useUIForm` hook)
- `src/components/types/ui-form/index.ts` (modified — `titleComponent`, `TitleHeadingComponent`,
  `UseUIFormOptions`/`UseUIFormResult`; removed `methods` from `FormBodyProps`)
- `tests/unit/components/ui-form/index.test.tsx` (modified — `<h1>` and `<p>` cases)

**Change Log:**

- 2026-06-25: Implemented Story 1.4 — real-`<h1>` capability via `titleComponent`.
