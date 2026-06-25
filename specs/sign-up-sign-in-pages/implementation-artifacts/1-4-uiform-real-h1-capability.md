# Story 1.4: Add the real-`<h1>` capability to `UIForm`/`FormHeader` (C1)

Status: draft

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

- [ ] Task 1: Add the optional `titleComponent` prop to the type-only `UIForm` types (AC: 4)
  - [ ] 1.1 In `src/components/types/ui-form/index.ts`, add
        `titleComponent?: React.ElementType` to `UIFormProps`
  - [ ] 1.2 In the same file, add `titleComponent?: React.ElementType` to `FormBodyProps`
  - [ ] 1.3 Keep the file type-only — no runtime `const`/`function`/`class`; the logic file
        declares no `interface`/`type`

- [ ] Task 2: Thread `titleComponent` through the logic file to `FormHeader` (AC: 1, 2, 3)
  - [ ] 2.1 In `src/components/ui-form/index.tsx`, forward `titleComponent` from `UIForm`
        through `FormBody` to `FormHeader`
  - [ ] 2.2 In `FormHeader`, render
        `<UITypography variant="h4" component={titleComponent} sx={styles.formTitle}>`
  - [ ] 2.3 Confirm the omitted-prop path preserves `UITypography`'s `component || 'p'` default
        so non-auth callers stay a `<p>` and `variant="h4"` styling is unchanged

- [ ] Task 3: Unit-test the `<h1>`/`<p>` behavior (AC: 1, 2)
  - [ ] 3.1 In `tests/unit/components/ui-form/index.test.tsx`, add a `titleComponent="h1"` case
        asserting `getByRole('heading', { level: 1 })` and the exact `<h1>` tag
  - [ ] 3.2 Add/confirm a case where omitting `titleComponent` still renders a `<p>` for
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
