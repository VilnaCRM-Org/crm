# Story 1.10: Delete the in-place toggler machinery (FR13)

Status: draft

## Story

As a maintainer,
I want the dead in-place toggle/switch code removed once the routed pages exist,
so that there is no orphan importer, a green build, and a clean dependency graph.

## Acceptance Criteria

1. Given the codebase after deletion, When searched, Then nothing imports
   `form-section/index.tsx`, `use-login-switcher.ts`, `login-switch-actions.ts`,
   `utils/load-login-form.ts`, `styles.formSwitcherError`, `AuthMode`, or the deleted
   `types/form-section/*`; the build, `make lint-tsc`, and dependency-cruiser pass (FR13, AC14).
2. Given `lazy-module-loader.ts`, When searched, Then it is still imported by
   `load-registration-notification.ts` and is NOT deleted (FR13).
3. Given `form-section/styles.ts`, When read, Then `formSwitcherError` and the `paletteColors`
   import are gone, while `formSection`/`formWrapper`/`fieldGapMargins` remain (FR13).
4. Given `form-section/types.ts`, When read, Then `AuthMode` is gone and `RegistrationView` +
   `AuthVariants` remain (FR13).
5. Given the i18n decision on `sign_in.errors.load_failed`, When applied, Then en/uk stay at
   parity (NFR9, AC20).

## Tasks / Subtasks

- [ ] Task 1: Delete the toggler source modules (AC: 1, 2)
  - [ ] 1.1 Delete `src/modules/user/features/auth/index.tsx` (old `Authentication` page;
        chrome now in `AuthPageLayout`)
  - [ ] 1.2 Delete `src/modules/user/features/auth/components/form-section/index.tsx`
        (`FormSection`, `AuthBody`, `SwitcherButton`, `SwitcherError`, `FormSwitcher`,
        `FormSectionLayout`, `useFormSectionViewModel`, `getSwitcherLabelKey`)
  - [ ] 1.3 Delete `src/modules/user/features/auth/components/form-section/use-login-switcher.ts`
  - [ ] 1.4 Delete
        `src/modules/user/features/auth/components/form-section/login-switch-actions.ts`
        (`LoginSwitchController` + `LOAD_LOGIN_ERROR_KEY`)
  - [ ] 1.5 Delete `src/modules/user/features/auth/utils/load-login-form.ts` (`loginFormLoader`)
  - [ ] 1.6 Keep `src/modules/user/features/auth/utils/lazy-module-loader.ts` (still used by
        `load-registration-notification.ts`)

- [ ] Task 2: Delete the toggler type-only files (AC: 1)
  - [ ] 2.1 Delete `src/modules/user/features/auth/types/form-section/index.ts`
        (`FormSectionLayoutProps`)
  - [ ] 2.2 Delete `src/modules/user/features/auth/types/form-section/login-switch-actions.ts`
  - [ ] 2.3 Delete `src/modules/user/features/auth/types/form-section/use-login-switcher.ts`

- [ ] Task 3: Prune the surviving form-section files (AC: 3, 4, 5)
  - [ ] 3.1 In `src/modules/user/features/auth/components/form-section/styles.ts`, remove
        `formSwitcherError` (`:42-56`) and the now-unused `paletteColors` import (`:7`); keep
        `formSection`/`formWrapper` and the `fieldGapMargins` re-export
  - [ ] 3.2 In `src/modules/user/features/auth/components/form-section/types.ts`, remove
        `AuthMode` (`:3`); keep `RegistrationView` (`:4`) and `AuthVariants`
  - [ ] 3.3 Apply the i18n decision on `sign_in.errors.load_failed` in
        `src/modules/user/features/auth/i18n/en.json` and `uk.json`; if removed, remove from
        BOTH locales for parity; keep `sign_up.errors.load_failed`

- [ ] Task 4: Remove the deleted-module tests and verify no orphan importer (AC: 1, 2)
  - [ ] 4.1 Delete
        `tests/unit/modules/user/features/auth/components/form-section/index.test.tsx`,
        `tests/unit/modules/user/features/auth/components/form-section.test.tsx`,
        `tests/unit/modules/user/features/auth/components/form-section/login-switch-actions.test.ts`,
        and `tests/unit/modules/user/features/auth/index.test.tsx` (chrome assertions ported to
        the `auth-page-layout` test in Story 1.3)
  - [ ] 4.2 Confirm via `grep` + `make lint-tsc` + dependency-cruiser that nothing imports the
        deleted modules, `styles.formSwitcherError`, `AuthMode`, or `loginFormLoader`, and the
        build is green

## Dev Notes

- Delete the toggler source: `src/modules/user/features/auth/index.tsx`;
  `src/modules/user/features/auth/components/form-section/index.tsx`,
  `use-login-switcher.ts`, `login-switch-actions.ts`;
  `src/modules/user/features/auth/utils/load-login-form.ts`.
- Delete the toggler type-only files: `src/modules/user/features/auth/types/form-section/index.ts`,
  `.../types/form-section/login-switch-actions.ts`, `.../types/form-section/use-login-switcher.ts`.
- Modify `src/modules/user/features/auth/components/form-section/styles.ts` — remove
  `formSwitcherError` (`:42-56`) and the unused `paletteColors` import (`:7`); keep
  `formSection`/`formWrapper`/`fieldGapMargins`. The `formSwitcherButton` rule (`:15-41`) now
  lives in `auth-switcher/styles.ts` (Story 1.1).
- Modify `src/modules/user/features/auth/components/form-section/types.ts` — remove `AuthMode`
  (`:3`); keep `RegistrationView` (`:4`, used by `SignUpFormSection` + `RegistrationForm`) and
  `AuthVariants`.
- Modify `src/modules/user/features/auth/i18n/en.json` + `uk.json` — `sign_in.errors.load_failed`
  is now unused (only the deleted in-place switch read it); leave OR remove. If removed, remove
  from both locales for parity (NFR9). `sign_up.errors.load_failed` stays (used by
  `AuthErrorBoundary` paths).
- Keep `src/modules/user/features/auth/utils/lazy-module-loader.ts` — still imported by
  `load-registration-notification.ts` (do not delete).
- `grep loginFormLoader|load-login-form` confirms `loginFormLoader` is imported ONLY by the three
  toggler source files and their two tests — all removed here — plus its own definition, so
  deletion is safe (R5, AC14). Verify no orphan importer via `grep` + `make lint-tsc` +
  dependency-cruiser.
- Delete the toggler tests:
  `tests/unit/modules/user/features/auth/components/form-section/index.test.tsx`,
  `tests/unit/modules/user/features/auth/components/form-section.test.tsx`,
  `tests/unit/modules/user/features/auth/components/form-section/login-switch-actions.test.ts`,
  and `tests/unit/modules/user/features/auth/index.test.tsx`; their behavior is re-covered by the
  new page/section/switcher tests (NFR10).
- Type-only files convention (NFR7): the surviving `form-section/types.ts` must declare only
  type-level constructs; do not co-locate runtime there.
- Repo gates: `make lint-metrics` (rust-code-analysis), `make lint-dup` (jscpd), ESLint, TS, and
  dependency-cruiser must pass after the prune; keep en/uk i18n at parity (NFR9). Coverage stays
  at 100% over `src/**` (NFR10) once the dead modules and their tests are removed together.
- No suppressions (no `eslint-disable`/`@ts-ignore`), no new inline code comments, no
  `data-testid` in `src/**`; locate by user-facing semantics (NFR5). Tests use the shared Faker
  builders for any generated domain data (NFR13).
- Dependencies: Stories 1.1, 1.2, 1.3, 1.5, 1.6, 1.8 must land first (the replacements must exist
  and be wired before the toggler is removed); pairs with Story 1.9.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-10
