# Story 1.5: Add `/sign-up` page + `SignUpFormSection` (real `<h1>` and swap link)

Status: done

## Story

As a visitor,
I want a dedicated `/sign-up` page that renders the registration form with the OAuth row and a
link to `/sign-in`,
so that registration is a bookmarkable, independently-titled URL.

## Acceptance Criteria

1. Given a `GET /sign-up`, When the route renders, Then `AuthPageLayout` wraps
   `SignUpFormSection` (registration form, title "Registration"), the OAuth row, and the swap
   link, behind the route-level lazy chunk and the `AuthSkeleton` Suspense fallback (FR1, FR8,
   FR12, AC1).
2. Given `/sign-up`, When the heading is queried, Then there is exactly one
   `getByRole('heading', { level: 1 })` whose text is the form title "Registration" (AR1, C1,
   AC10).
3. Given `/sign-up`, When the swap link is queried, Then it is `getByRole('link', { name })`
   with `href="/sign-in"` and text "Already have an account?" (FR5, FR7, AC5).
4. Given `/sign-up`, When the bundle/chunk graph is asserted (mock), Then login code is NOT
   imported (FR12, AC1).
5. Given a registration view change to `success`/`error`, When `oauthInert` is recomputed, Then
   the OAuth row becomes `inert` (preserving today's behavior) (FR14, AC7).
6. Given the new files, When measured by rca, Then `sign-up/index.tsx` and
   `sign-up-form-section.tsx` each define a single component under all thresholds (NFR3).

## Tasks / Subtasks

- [x] Task 1: Add the `/sign-up` route-level page (AC: 1, 2, 6)
  - [x] 1.1 Create `src/modules/user/features/auth/sign-up/index.tsx` exporting a default
        `SignUp` that lazily imports `SignUpFormSection` and wraps it in `<AuthPageLayout>`
  - [x] 1.2 Call `usePageTitle('sign_up.title')` inside `SignUp` (hook authored in Story 1.7)
  - [x] 1.3 Keep each file to a single component so it stays under the rca thresholds (NFR3)

- [x] Task 2: Add the `SignUpFormSection` inner lazy chunk (AC: 1, 3, 5)
  - [x] 2.1 Create `src/modules/user/features/auth/sign-up/sign-up-form-section.tsx` owning the
        `registrationView` state and rendering `<AuthFormSection>` with `RegistrationForm`
  - [x] 2.2 Pass `oauthInert={view !== 'form'}` so a `success`/`error` view marks the OAuth row
        `inert` (preserves today's derivation)
  - [x] 2.3 Pass `switcher={<AuthSwitcher to="/sign-in"
labelKey="sign_up.form.switcher_text_have_account" />}` reusing the existing i18n key
  - [x] 2.4 Wire `RegistrationForm` unchanged via its retained `onViewChange` prop and the
        `RegistrationView` type; import no login code (FR12)

- [x] Task 3: Thread the real `<h1>` into the registration form (AC: 2)
  - [x] 3.1 Add `titleComponent="h1"` to the `<UIForm<RegisterUserDto>>` in
        `src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx`
        (the only edit to that file)

- [x] Task 4: Add/update tests (AC: 1, 2, 3, 4, 5)
  - [x] 4.1 Add `tests/unit/modules/user/features/auth/sign-up/index.test.tsx`: `/sign-up`
        renders Registration (`<h1>` "Registration"), the swap link to `/sign-in`, and the OAuth
        row, and asserts no login code is imported (mock assertion)
  - [x] 4.2 Update
        `tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-form.test.tsx`
        to assert the title is a real `<h1>` and fix any harness coupling to the deleted
        `FormSection`
  - [x] 4.3 Use semantic selectors only (`getByRole`/`getByText`); no `data-testid`

## Dev Notes

- New file `src/modules/user/features/auth/sign-up/index.tsx`: route-level page lazily imported
  by `app.tsx`; `SignUp` lazily imports `SignUpFormSection` and wraps it in `<AuthPageLayout>`,
  preserving the route chunk + inner lazy chunk shape behind the `AuthSkeleton` Suspense
  fallback (FR1, FR8, FR12).
- New file `src/modules/user/features/auth/sign-up/sign-up-form-section.tsx`: owns the only
  surviving toggler state — `registrationView` — exactly as `useFormSectionViewModel` did, minus
  all switch machinery; renders `<AuthFormSection>` feeding it `RegistrationForm` and an
  `AuthSwitcher`. `RegistrationForm` is reused unchanged; its `onViewChange` prop and the
  `RegistrationView` type are retained.
- Modify `src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx`:
  add `titleComponent="h1"` to the `<UIForm<RegisterUserDto>>` in `RegistrationFormPanel` — the
  only edit to that file (AR1, C1).
- The swap link shows `sign_up.form.switcher_text_have_account` ("Already have an account?")
  linking to `/sign-in` (FR7), reusing the existing i18n key (NFR9); `/sign-up` imports no login
  code (FR12).
- `oauthInert` replaces the old `showNotification` derivation: `oauthInert={view !== 'form'}`, so
  a `success`/`error` view marks the OAuth row `inert` (AC7); the registration notification flow,
  `useRegistrationForm`, and validators are untouched (FR14).
- `usePageTitle('sign_up.title')` (authored in Story 1.7) sets the per-route document title; the
  render assertions here pass with the hook present.
- Repo gates that apply to this story: rust-code-analysis metrics (each new file a single
  component under all thresholds, NFR3); jscpd DRY gate (`make lint-dup` — the section/chrome
  reuse keeps clones under the floor); type-only files (NFR7); no ESLint/TypeScript suppressions
  and no new inline code comments; semantic selectors only, no `data-testid` in `src/**` (NFR5);
  Faker test builders for arbitrary domain data; 100% coverage over `src/**` (NFR10).
- Accessibility decisions honored here: D3 keeps "Authentication" as the sign-in title
  (unchanged; this page's `<h1>` is "Registration"); D1 (switcher `#969B9D` color, waived) and
  D2 (current switcher text) are unchanged — neither is implemented in this story.
- Dependencies: Story 1.1 (`AuthSwitcher`), 1.2 (`AuthFormSection`), 1.3 (`AuthPageLayout`), 1.4
  (`titleComponent` thread); the `usePageTitle` assertion lands once Story 1.7 adds the hook.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-5

## Dev Agent Record

**Agent Model Used:** Opus 4.8 (BMAD Dev agent, Amelia)

**Completion Notes:**

- Added the `/sign-up` route page + `SignUpFormSection` lazy chunk, and added `titleComponent="h1"`
  to the registration form's `UIForm` (C1, AR1).
- Deviation: the spec placed these at `auth/sign-up/`, but the repo dependency-cruiser
  `feature-allowed-folders` rule restricts the feature root to
  assets/components/hooks/i18n/repositories/routes/stores/types/utils — route pages must live under
  `routes/`. Relocated to `auth/routes/sign-up/` (this applies to Story 1.6 sign-in and the Story
  1.8 routing imports as well).
- `SignUpFormSection` owns the surviving `registrationView` state; `oauthInert={view !== 'form'}`
  reproduces the old `showNotification` derivation (AC5). The swap link is the `AuthSwitcher` to
  `/sign-in` ("Already have an account?"); no login code is imported (FR12).
- AC2 (real `<h1>` "Registration"): the page test renders the real chain (registration internals
  mocked) and asserts `getByRole('heading', { level: 1, name: 'Registration' })`; the
  registration-form test additionally asserts `UIForm` receives `titleComponent="h1"`.
- Gates green: ESLint, tsc, dependency-cruiser, jscpd, rca metrics; both new files 100% covered;
  no suppressions and no inline comments.

**File List:**

- `src/modules/user/features/auth/routes/sign-up/index.tsx` (new)
- `src/modules/user/features/auth/routes/sign-up/sign-up-form-section.tsx` (new)
- `src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx`
  (modified — `titleComponent="h1"`)
- `tests/unit/modules/user/features/auth/routes/sign-up/index.test.tsx` (new)
- `tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-form.test.tsx`
  (modified — `titleComponent` assertion)

**Change Log:**

- 2026-06-25: Implemented Story 1.5 — `/sign-up` page (relocated to `routes/`).
