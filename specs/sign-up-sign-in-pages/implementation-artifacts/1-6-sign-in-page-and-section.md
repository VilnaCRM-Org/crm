# Story 1.6: Add `/sign-in` page + `SignInFormSection` (real `<h1>` and swap link)

Status: draft

## Story

As a returning user,
I want a dedicated `/sign-in` page that renders the login form with the OAuth row and a link
to `/sign-up`, so login is its own bookmarkable, independently-titled URL and is reachable
directly (not only via a toggle).

## Acceptance Criteria

1. Given a `GET /sign-in`, When the route renders, Then `AuthPageLayout` wraps
   `SignInFormSection` (login form, title "Authentication"), the OAuth row, and the swap link,
   behind the route-level lazy chunk and the `AuthSkeleton` fallback (FR2, FR8, FR12, AC2).
2. Given `/sign-in`, When the heading is queried, Then there is exactly one
   `getByRole('heading', { level: 1 })` whose text is the login title "Authentication" (AR1,
   C1, AC10).
3. Given `/sign-in`, When the swap link is queried, Then it is `getByRole('link', { name })`
   with `href="/sign-up"` and text "Don't have an account yet?" (FR5, FR7, AC5).
4. Given `/sign-in`, When the bundle/chunk graph is asserted (mock), Then registration code is
   NOT imported (FR12, AC2).
5. Given the new files, When measured by rca, Then `sign-in/index.tsx` and
   `sign-in-form-section.tsx` each define a single component under all thresholds (NFR3).

## Tasks / Subtasks

- [ ] Task 1: Add the `/sign-in` route-level page (AC: 1, 2, 5)
  - [ ] 1.1 Create `src/modules/user/features/auth/sign-in/index.tsx` as the route-level
        `SignIn` page that lazily imports `./sign-in-form-section` and wraps it in
        `AuthPageLayout`
  - [ ] 1.2 Call `usePageTitle('sign_in.title')` in `SignIn` so the page sets its own
        localized `document.title` (hook delivered by Story 1.7)
  - [ ] 1.3 Keep the page a single component under the rca caps (NFR3)
- [ ] Task 2: Add `SignInFormSection` (login section, swap link, constant OAuth state) (AC: 1, 3, 4)
  - [ ] 2.1 Create `src/modules/user/features/auth/sign-in/sign-in-form-section.tsx` rendering
        `AuthFormSection` with `oauthInert={false}` (login has no notification view)
  - [ ] 2.2 Pass `switcher={<AuthSwitcher to="/sign-up"
labelKey="sign_up.form.switcher_text_no_account" />}` so the swap link points at
        `/sign-up` and reuses the existing i18n key (NFR9)
  - [ ] 2.3 Render `LoginForm` unchanged as the section child; import no registration code
        (FR12)
- [ ] Task 3: Give the login form a real `<h1>` (AC: 2)
  - [ ] 3.1 Add `titleComponent="h1"` to the `<UIForm<LoginUserDto>>` in
        `src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx`
        (the only edit to that file)
- [ ] Task 4: Tests for the `/sign-in` page and the login title (AC: 1, 2, 3, 4)
  - [ ] 4.1 Add `tests/unit/modules/user/features/auth/sign-in/index.test.tsx`: assert
        `/sign-in` renders Login (`<h1>` "Authentication"), the swap link to `/sign-up`, and
        the OAuth row, using semantic queries (NFR5)
  - [ ] 4.2 In the same test, assert no registration code is imported (mock assertion) (AC2)
  - [ ] 4.3 Update
        `tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx`
        to assert the title is a real `<h1>` and fix any harness coupling to the deleted
        `FormSection` (AC10, AC15)
  - [ ] 4.4 Build test data with the `@faker-js/faker` builders under `tests/builders/`; keep
        hardcoded literals only for fixed contract strings (titles, hrefs, i18n text)

## Dev Notes

- New files to create: `src/modules/user/features/auth/sign-in/index.tsx` (route-level
  `SignIn` page) and `src/modules/user/features/auth/sign-in/sign-in-form-section.tsx` (lazy
  inner chunk). Modify only
  `src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx` to add
  `titleComponent="h1"`.
- `LoginForm` is reused unchanged (`auth-forms/login-form.tsx:15-34`), rendering
  `<UIForm<LoginUserDto> title={t('sign_in.title')}>`. Login has no notification view, so
  `oauthInert={false}` is constant.
- `LoginForm` becomes the route's own lazy chunk, so `loginFormLoader`
  (`utils/load-login-form.ts`) and the request-id stale-guard in `login-switch-actions.ts`
  are no longer needed — their deletion is Story 1.10, not this story.
- D3: keep "Authentication" (`sign_in.title`) as the sign-in title — it is the real `<h1>`
  text and the source of the page's `document.title`; do not rename it here.
- D1 (switcher color `#969B9D` kept) and D2 (explicit link-destination text) are NOT
  implemented here; they stay gated behind the PRD Open Decisions. The swap link reuses
  `AuthSwitcher` (Story 1.1) verbatim, so its resting text color stays
  `customColors.text.secondary` `#969B9D`.
- Gap 4: the swap link must carry no `role="button"` — `AuthSwitcher` renders a real
  `<a href>` via `UIButton to=…`, so MUI must not override the native anchor role; do not add
  a `role` here.
- Gaps 1 and 2 (error-view focus target and success live-region timing/sequencing) concern
  the registration notification views and are out of scope for `/sign-in` — login has no
  success/error notification view.
- Dependencies: Stories 1.1 (`AuthSwitcher`), 1.2 (`AuthFormSection`), 1.3
  (`AuthPageLayout`), 1.4 (`titleComponent` thread). The `usePageTitle` document-title
  assertion lands once Story 1.7 adds the hook; the render assertions here pass with the hook
  present. Parallelizable with Story 1.5.
- Repo gates that must pass: `make format` then `make lint` — rust-code-analysis metrics
  (`make lint-metrics`, single component per new file under all thresholds), jscpd DRY
  (`make lint-dup`, the section/chrome reuse keeps clones under the 75-token floor), ESLint,
  TypeScript, and dependency-cruiser. Unit + integration coverage must stay 100% over
  `src/**`.
- Type-only files (issue #88): new prop types live in their own `types/` files imported via
  `import type`; logic files declare no `interface`/`type`. The two new page files are
  `.tsx` components (NFR6-exempt from the no-free-function gate).
- No `data-testid` in `src/**`; locate elements by user-facing semantics
  (`getByRole('heading')`, `getByRole('link')`, role/text), never by test id (NFR5).
- No new ESLint/TypeScript suppressions, no inline code comments, no `eslint-disable` —
  satisfy every gate by refactoring, not by silencing.

### References

- Epic: specs/sign-up-sign-in-pages/planning-artifacts/epics-sign-up-sign-in-pages-2026-06-25.md#story-1-6
