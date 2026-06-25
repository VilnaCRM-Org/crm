---
status: 'complete'
workflowType: 'prd'
project_name: 'crm'
date: '2026-06-25'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/31'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/31'
  - 'src/app.tsx'
  - 'src/modules/user/features/auth/index.tsx'
  - 'src/modules/user/features/auth/components/protected-route/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/styles.ts'
  - 'src/modules/user/features/auth/components/form-section/types.ts'
  - 'src/modules/user/features/auth/components/form-section/use-login-switcher.ts'
  - 'src/modules/user/features/auth/components/form-section/login-switch-actions.ts'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-success-view.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-notification.tsx'
  - 'src/modules/user/features/auth/utils/load-login-form.ts'
  - 'src/modules/user/features/auth/types/form-section/index.ts'
  - 'src/modules/user/features/auth/i18n/en.json'
  - 'src/modules/user/features/auth/i18n/uk.json'
  - 'src/components/ui-button/index.tsx'
  - 'src/components/ui-back-to-main/index.tsx'
  - 'src/components/ui-typography/index.tsx'
  - 'src/components/ui-form/index.tsx'
  - 'src/components/ui-live-status/index.tsx'
  - 'src/styles/colors.ts'
  - 'lighthouse/constants.js'
  - 'lighthouse/lighthouserc.mobile.js'
  - 'tests/visual/constants.ts'
  - 'tests/unit/app.test.tsx'
  - 'tests/unit/components/protected-route.test.tsx'
  - 'tests/unit/tooling/lighthouse-constants.test.ts'
  - 'tests/unit/tooling/auth-test-port.test.ts'
  - 'tests/e2e/modules/back-to-main.spec.ts'
  - 'tests/e2e/components/skeletons/auth-skeleton.spec.ts'
  - 'tests/e2e/modules/user/features/auth/components/form-section/auth-forms/login-form.spec.ts'
  - 'tests/e2e/modules/user/features/auth/components/form-section/auth-forms/constants/constants.ts'
  - 'tests/memory-leak/tests/auth-skeleton.js'
  - 'tests/memory-leak/tests/signup.js'
---

# PRD - Split Auth into Routed /sign-up and /sign-in Pages (Issue #31)

**Author:** BMad (Product Manager) **Date:** 2026-06-25 **Source:** VilnaCRM-Org/crm#31

## Executive Summary

Split the single in-place-toggling authentication page (`/authentication`,
`src/modules/user/features/auth/index.tsx`) into **two separately-routed pages** —
`/sign-up` (registration) and `/sign-in` (login) — and replace the local-state "swap"
control under the form with a real, URL-changing **link**. Today the page defaults to
the registration view (`useState<AuthMode>('register')` in
`src/modules/user/features/auth/components/form-section/use-login-switcher.ts:15`) and
flips to the login view client-side via a `<button onClick>`
(`SwitcherButton`, `src/.../form-section/index.tsx:43-66`), lazily loading the login
chunk in-place (`LoginSwitchController.switchToLogin`,
`src/.../form-section/login-switch-actions.ts:22-34`). The URL never changes, so the
two states are not linkable, shareable, or independently titled.

This refactor delivers the issue's "clean, reusable components without changing the UI"
mandate by extracting three reusable building blocks — **`AuthPageLayout`**,
**`AuthFormSection`**, and **`AuthSwitcher`** — and wiring two thin route-level page
components (`SignUp`, `SignIn`). The `/authentication` route is **removed entirely**
(D-REMOVE); an unauthenticated visit to a protected route now redirects to **`/sign-in`**
(D-REDIRECT), replacing today's `<Navigate to="/authentication" replace />`
(`src/.../protected-route/index.tsx:8`). The swap control becomes a semantic
`<a href>` (via `UIButton to=…`, mirroring `UIBackToMain`,
`src/components/ui-back-to-main/index.tsx:19`), so it changes the URL, opens in a new
tab, and is announced as a "link".

The mandatory accessibility-lead review returned **NO-SHIP** until a set of
**visual-neutral** blockers are addressed; this PRD folds them into hard requirements:
a real `<h1>` per page (C1), a conformant `#404142` focus-visible ring on the swap link
(C2), per-route `document.title` (M1), `<html lang>` sync (M2), error-view focus
management (M4), and corrected notification politeness/announcement (M5). Two
a11y items that _would_ change visible pixels — the switcher text color (`#969B9D`,
2.81:1, vs WCAG 1.4.3) and explicit link-destination text (vs 2.4.9 AAA) — are surfaced
as **Open Decisions** (D1, D2) with recommendations, honoring the issue's "no
**unintentional** visual regression" framing. "Refactor all tests" is explicit user
scope: every test layer (unit, integration, e2e, visual, memory-leak, load) plus
Lighthouse/CI config is updated, and visual baselines are regenerated to stay identical
to today's auth page modulo the justified a11y changes.

This lands within every existing repo gate: ESLint (no `data-testid`, no `static`/free
functions in `src/**/*.ts`), type-only files (#88), Faker builders (#101), rca metrics,
jscpd DRY, 100% integration coverage over `src/**`, visual regression, Lighthouse mobile
≥ ~0.85, i18n en/uk parity, no suppressions, and Stryker mutation.

## Overview & Context

### Current state (verified against the repo)

- **Routing** — `src/app.tsx:12-26` builds `createBrowserRouter` with two entries: a
  `ProtectedRoute` wrapper whose only child is `{ path: '/', element: <ButtonExample/> }`
  (`app.tsx:13-21`), and `{ path: '/authentication', element: <Authentication/> }`
  (`app.tsx:22-25`, lazy at `app.tsx:10`). The router renders inside
  `<React.Suspense fallback={null}>` (`app.tsx:40`). An `useEffect` (`app.tsx:31-38`)
  syncs `document.documentElement.dir` from `i18n.dir(i18n.language)` on
  `languageChanged`, but **never** sets `document.documentElement.lang` (M2) and
  **never** sets `document.title` (M1).
- **Protected route** — `src/.../protected-route/index.tsx:8` returns
  `token ? <Outlet/> : <Navigate to="/authentication" replace/>` using
  `useAuthToken()`.
- **Auth page** — `src/.../auth/index.tsx:11-26` renders `<UIBackToMain/>` +
  `<Box component="main" sx={{flexGrow:1,display:'flex',flexDirection:'column'}}>`
  wrapping `<AuthErrorBoundary>` → `<Suspense fallback={<AuthSkeleton/>}>` → lazy
  `<FormSection/>` (`index.tsx:9`), then `<UIFooter/>`.
- **In-place toggler** — `src/.../form-section/index.tsx` holds: `AuthBody` (login →
  `<Suspense fallback={<Box aria-hidden/>}><LoginForm/></Suspense>` via
  `loginFormLoader.load()`, else `<RegistrationForm/>`; `index.tsx:26-41`);
  `SwitcherButton` (a `<UIButton onClick onMouseEnter/onFocus/onTouchStart disabled>` —
  a `<button>`, not a link; `index.tsx:43-66`); `getSwitcherLabelKey` (`index.tsx:20-24`);
  `FormSwitcher` = `SwitcherError` (renders `sign_in.errors.load_failed` on chunk-load
  failure) + `SwitcherButton`; and `FormSectionLayout` (`index.tsx:111-141`) →
  `<Box component="section" sx={styles.formSection}>` → `<Box sx={styles.formWrapper}>`
  (`<AuthBody/>` + `<InertBox id="auth-provider-buttons-container" inert={showNotification}>`
  `<AuthProviderButtons/></InertBox>`) + `<FormSwitcher/>`, where
  `showNotification = mode==='register' && registrationView!=='form'`
  (`index.tsx:121`). Switch machinery lives in `use-login-switcher.ts` and
  `login-switch-actions.ts` (request-id stale guard + `startTransition`), backed by the
  `loginFormLoader` singleton (`src/.../utils/load-login-form.ts`).
- **The two forms (UNCHANGED logic)** — `LoginForm`
  (`.../auth-forms/login-form.tsx:15-34`) renders `<UIForm<LoginUserDto>
title={t('sign_in.title')} subtitle={t('sign_in.subtitle')}
submitLabel={t('sign_in.form.submit_button')} …>`. `RegistrationForm`
  (`.../auth-forms/registration-form.tsx:72-83`) renders `RegistrationFormPanel`
  (`<UIForm<RegisterUserDto> title={t('sign_up.title')}
subtitle={t('sign_up.subtitle')} …>` in an `InertBox` keyed by `form.formKey`,
  `inert={form.view!=='form'}`) + `RegistrationNotificationPanel` (lazy
  `RegistrationNotification` shown when `form.view!=='form'`), driven by
  `useRegistrationForm`.
- **Shared primitives** — `UIButton` (`src/components/ui-button/index.tsx`) resolves a
  string `to` into `component='a'` + `href` (`index.tsx:27-34`), rendering a real
  `<a href>` (full-document navigation), so `UIButton to="/x"` is a plain anchor (NOT a
  client-side router `Link`); this is exactly the `UIBackToMain` precedent
  (`ui-back-to-main/index.tsx:19`, `to="/"`). `UITypography` defaults
  `component={component || 'p'}` (`ui-typography/index.tsx:18`), so `variant="h4"` is
  visual-only — without an explicit `component`, the element is a `<p>`. `FormHeader`
  renders `<UITypography variant="h4" sx={styles.formTitle}>{title}</UITypography>` with
  **no** `component` prop (`ui-form/index.tsx:46-48`) → the form title is a `<p>`, so
  each auth page currently has **zero real headings** (C1). `UIForm`'s `FormBody`
  already carries `aria-busy` + a polite `UILiveStatus` (`ui-form/index.tsx:100,114`),
  and `UILiveStatus` is a `role="status"` + `aria-atomic` span
  (`ui-live-status/index.tsx`).
- **Notification views** — `RegistrationSuccessView`
  (`.../auth-forms/registration-success-view.tsx`) and `RegistrationErrorView`
  (`.../auth-forms/registration-error-view.tsx`) **both** wrap content in
  `<Box role="alert" …>` (success `:110`, error `:111`) **and** auto-focus a heading via
  `useFocusOnMount` + `tabIndex={-1}` (success `:22-31`, error `:22-31`); both headings
  hardcode `component="h4"` (success `:26`, error `:26`). The error view therefore
  **already** manages focus (M4 = verify-and-document), but `role="alert"` (assertive)
  PLUS an auto-focused heading is a competing-read defect on **both** views, and
  `role="alert"` is the wrong politeness for the **success** result (M5).
- **i18n** — `sign_up.title` = "Registration"; `sign_in.title` = "Authentication";
  `sign_up.form.switcher_text_have_account` = "Already have an account?";
  `sign_up.form.switcher_text_no_account` = "Don't have an account yet?";
  `sign_in.errors.load_failed` is used only by the in-place switch-failure path
  (`en.json:18-90`). en/uk must stay at parity.
- **Colors** — `customColors.text.secondary` = `#969B9D` (`src/styles/colors.ts:59`,
  the switcher color, `styles.ts:26`); `customColors.text.primary` = `#404142`
  (`colors.ts:58`); `paletteColors.primary.main` = `#1EAEFF` (`colors.ts:2`, the
  `UIBackToMain` ring color).

### Why this change

The product owner expanded #31 in kickoff: the single toggling page must become two
real, linkable URLs so each registration / login flow is bookmarkable, shareable,
distinctly titled, and independently route-loaded. That requires the swap to _navigate_
(change the URL) instead of toggling React state — which in turn makes the swap control
a primary navigation element and surfaces the latent a11y debt the accessibility-lead
flagged. Shipping two distinct URLs with identical `<title>` would introduce a **new**
WCAG 2.4.2 failure, so per-route titles are not optional. The split is also **better**
for the Lighthouse budget: `/sign-up` no longer bundles login code at all.

## Goals & Non-Goals

### Goals

- Serve registration at **`/sign-up`** and login at **`/sign-in`** as two
  independently-routed, lazily-loaded pages; remove `/authentication` entirely
  (D-REMOVE) with no redirect or alias.
- Redirect unauthenticated access to a protected route to **`/sign-in`** (D-REDIRECT).
- Replace the in-place toggle `<button>` with a real, URL-changing **link**
  (`<a href>`) under the form, announced as a "link", new-tab-capable, with no
  `disabled`/loading state.
- Extract clean, reusable, modular components — `AuthPageLayout`, `AuthFormSection`,
  `AuthSwitcher` — satisfying issue AC2 and the jscpd DRY gate by sharing markup/style
  rather than duplicating it.
- Keep the rendered UI **pixel-identical** to today's auth page except for the
  justified, design-owner-gated a11y changes — and even C2's focus ring is
  resting-state-neutral (`:focus-visible`-only).
- Fold the visual-neutral a11y blockers into requirements: a real `<h1>` per page (C1),
  a conformant focus-visible ring on the swap link (C2), per-route `document.title`
  (M1), `<html lang>` (M2), error-view focus management (M4), notification
  politeness/announcement correctness (M5).
- Refactor **every** test layer (unit, integration, e2e, visual, memory-leak, load) and
  CI/Lighthouse config to the new routes and the button→link swap, and regenerate visual
  baselines to remain identical to today modulo the intentional a11y changes.
- Land within every existing repo gate with no new suppressions and no new inline code
  comments.

### Non-Goals

- No change to form **logic**: login/registration submit handlers, validation
  (`form-section/validations`), the registration notification flow, the auth store, the
  repositories, or `useRegistrationForm` are unchanged (modulo the M4/M5 a11y attribute
  fixes on the notification views).
- No back-compat alias or redirect for `/authentication` (D-REMOVE).
- No client-side React Router `<Link>` for the swap (the established `UIButton`/
  `UIBackToMain` pattern is a full-document `<a href>`, and full-load native focus reset
  is conformant — managed focus is not required and would be wrong).
- No skip link (R4 — deferred; landmarks satisfy bypass).
- No restyling beyond C2's `:focus-visible` ring (resting-state-neutral) and the two
  Open Decisions (D1, D2) if accepted by the design owner.
- No AAA link-destination text change in #31 (D2 recommended as a follow-up).
- No new runtime dependency on the auth critical path; the auth paint path stays
  container-free (deferred-DI composition root + dependency-free reactive var).

## Scope

### In Scope

- **Routing** (`src/app.tsx`): add `{ path: '/sign-up', element: <SignUp/> }` and
  `{ path: '/sign-in', element: <SignIn/> }` (both lazy at route level); remove the
  `/authentication` entry; keep `/` protected → `ButtonExample`. Add per-route title
  management and `<html lang>` to the existing i18n effect.
- **Protected route** (`src/.../protected-route/index.tsx`): redirect to `/sign-in`.
- **New reusable components** (locations finalized in Architecture):
  - `AuthPageLayout` — page chrome extracted from `auth/index.tsx`: `<UIBackToMain/>` +
    `<main>` Box + `<AuthErrorBoundary>` + `<Suspense fallback={<AuthSkeleton/>}>`
    `{children}</Suspense>` + `<UIFooter/>`; preserves the AuthSkeleton-while-chunk-loads
    behavior.
  - `AuthFormSection` — presentational `<section>`/`formWrapper` shell extracted from
    `FormSectionLayout`: wraps the form + the `InertBox`/`AuthProviderButtons` OAuth row
    - the switcher; props ≈ `{ children, oauthInert, switcher }`.
  - `AuthSwitcher` — the swap control as a real link:
    `<UIButton to={to} sx={styles.formSwitcherButton}>{t(labelKey)}</UIButton>`, with the
    new `#404142` `:focus-visible` ring; NO `disabled`/loading; `to` always a non-empty
    string.
  - `SignUpFormSection` (lazy chunk) — owns `registrationView` state; renders
    `<AuthFormSection oauthInert={view!=='form'} switcher={<AuthSwitcher to="/sign-in"
labelKey="sign_up.form.switcher_text_have_account"/>}>` around
    `<RegistrationForm onViewChange={setView}/>`.
  - `SignInFormSection` (lazy chunk) — `<AuthFormSection oauthInert={false}
switcher={<AuthSwitcher to="/sign-up"
labelKey="sign_up.form.switcher_text_no_account"/>}>` around `<LoginForm/>`.
  - `SignUp` / `SignIn` route-level page components — `AuthPageLayout` wrapping the
    lazily-imported page-specific form section; each sets its per-route `document.title`.
- **Real `<h1>` capability** (C1): add a `headingLevel`/`titleComponent` capability to
  `UIForm` → `FormHeader` (or own the `<h1>` at page level) so each page renders exactly
  one real `<h1>` (the form title) while keeping `variant="h4"` for size; audit the
  notification `component="h4"` headings so h1→h4 does not skip a level.
- **Notification a11y** (M4, M5): success view → `role="status"` (polite); error view →
  keep `role="alert"` (assertive) but do **not** auto-focus inside the assertive subtree
  (one mechanism per view per APG); verify/preserve error-view focus-on-mount so focus is
  not stranded on `<body>` under `inert`; remove the redundant `aria-label` duplicating
  the visible title.
- **Deletions** (replaced by routing/navigation): the old `auth/index.tsx`
  `Authentication` page; `form-section/index.tsx` (toggler), `use-login-switcher.ts`,
  `login-switch-actions.ts`; `utils/load-login-form.ts` (only importers are the three
  toggler files — verified, safe to delete) and its type files; the toggler-tied parts of
  `types/form-section/*` and `FormSectionLayoutProps`; `styles.formSwitcherError` and the
  now-unused `paletteColors` import in `form-section/styles.ts`; `AuthMode` in `types.ts`
  (keep `RegistrationView`). `sign_in.errors.load_failed` becomes unused (leave OR remove,
  keep en/uk parity).
- **Config / CI**: `lighthouse/constants.js` (`/authentication` → `/sign-up`),
  `lighthouse/lighthouserc.mobile.js` comment (≈`:29`), and `_bmad/config.yaml` +
  `specs/README.md` housekeeping (referenced by the epics, executed by the loop).
- **All test layers + visual baselines** — see NFR10 and the Test Strategy in the
  Architecture/Epics.

### Out of Scope / Unchanged

- Login/registration form fields, validators, submit handlers, the registration
  notification flow logic, `useRegistrationForm`, repositories, and the auth store.
- The page-load `AuthSkeleton` behavior and the `AuthErrorBoundary`.
- The OAuth provider buttons (`AuthProviderButtons`) and the `inert` primitive on the
  OAuth row (confirmed correct).
- `UIBackToMain` itself (R3 — its hardcoded `aria-label="Back"` overriding the localized
  visible text is a recommended follow-up, not #31).
- The k6 signup load test's API target (it hits the GraphQL/mock API, not the SPA route).
- D2's AAA link-destination text (follow-up).
- R1 (decorative confetti `aria-hidden`), R2 (hover/focus underline after any color
  fix), R4 (skip link), R5 (removing the obsolete in-place lazy
  `Suspense fallback={<Box aria-hidden/>}`) — recommended follow-ups (R5 disappears
  naturally with the toggler deletion).

## Functional Requirements

Requirement IDs are stable and are referenced by the Architecture and Epics documents.

- **FR1 — Registration at `/sign-up`.** A `GET /sign-up` MUST render the registration
  page: `AuthPageLayout` wrapping `SignUpFormSection` (the `RegistrationForm` with its
  OAuth row and switcher). The page MUST be a lazy route-level chunk (App-level
  `<Suspense fallback={null}>`), and the inner form section MUST Suspend with the
  `AuthSkeleton` fallback while its chunk loads (preserving today's behavior).
- **FR2 — Login at `/sign-in`.** A `GET /sign-in` MUST render the login page:
  `AuthPageLayout` wrapping `SignInFormSection` (the `LoginForm` with its OAuth row and
  switcher), lazy at the route level with the same `AuthSkeleton` fallback.
- **FR3 — Remove `/authentication` (D-REMOVE).** The `/authentication` route MUST be
  removed from `createBrowserRouter` with **no** redirect and **no** back-compat alias;
  a request to `/authentication` resolves to the router's not-matched behavior, not to an
  auth page.
- **FR4 — Protected-route redirect to `/sign-in` (D-REDIRECT).** `ProtectedRoute` MUST
  redirect an unauthenticated user (no token) to `/sign-in` via
  `<Navigate to="/sign-in" replace/>`; an authenticated user still renders the
  protected `<Outlet/>`.
- **FR5 — URL-changing swap link.** The swap control under the form MUST be a real
  semantic link (`<a href>`) that **navigates** (changes the URL) between the two pages:
  `/sign-up` → `/sign-in` ("Already have an account?") and `/sign-in` → `/sign-up`
  ("Don't have an account yet?"). It MUST be rendered via `UIButton to={destination}`
  (resolving to `component='a'` + a non-empty `href`), mirroring `UIBackToMain`. It MUST
  open in a new tab when so requested by the browser, and MUST be announced by assistive
  technology as a "link".
- **FR6 — No `disabled`/loading on the swap link.** The swap link MUST NOT carry the old
  `disabled`/loading/`onIntent` prefetch behavior; a navigable link announced
  "unavailable" is a WCAG 4.1.2 name/role/value mismatch. The destination (`to`/`href`)
  MUST always resolve to a non-empty string.
- **FR7 — Switcher label by page.** `/sign-up` MUST show
  `t('sign_up.form.switcher_text_have_account')` ("Already have an account?") linking to
  `/sign-in`; `/sign-in` MUST show `t('sign_up.form.switcher_text_no_account')` ("Don't
  have an account yet?") linking to `/sign-up`. Existing i18n keys are reused; no visible
  copy is renamed (subject to D2).
- **FR8 — Reusable layout (`AuthPageLayout`).** The page chrome (back link, `<main>`,
  error boundary, suspense+skeleton, footer) MUST be a single reusable component consumed
  by both `SignUp` and `SignIn`, with no per-page duplication of that chrome.
- **FR9 — Reusable form section (`AuthFormSection`).** The `<section>`/`formWrapper`
  shell, the OAuth `InertBox` row, and the switcher slot MUST be a single reusable
  presentational component parameterized by `{ children, oauthInert, switcher }`,
  consumed by both `SignUpFormSection` and `SignInFormSection`.
- **FR10 — Reusable switcher (`AuthSwitcher`).** The swap link MUST be a single reusable
  component parameterized by `{ to, labelKey }`, applying `styles.formSwitcherButton`
  plus the C2 focus-visible ring, used on both pages.
- **FR11 — Per-route document title (M1).** `/sign-up` and `/sign-in` MUST set distinct
  `document.title` values ("Sign up - …" / "Sign in - …"), sourced from the same i18n
  keys that feed each page's `<h1>` (`sign_up.title` / `sign_in.title`), and re-applied
  on `languageChanged` (mirroring the existing `dir` effect in `app.tsx:31-38`).
- **FR12 — Preserve lazy-loading shape.** Each page MUST remain lazy at the route level,
  and its form section MUST remain a separate lazy chunk Suspended behind the
  `AuthSkeleton`; `/sign-up` MUST NOT bundle login code and `/sign-in` MUST NOT bundle
  registration code.
- **FR13 — Remove the in-place toggler machinery.** `form-section/index.tsx`,
  `use-login-switcher.ts`, `login-switch-actions.ts`, `utils/load-login-form.ts`,
  `styles.formSwitcherError`, the `AuthMode` type, and the toggler-tied
  `types/form-section/*` (incl. `FormSectionLayoutProps`) MUST be deleted; navigation
  replaces them. No code path may import a deleted module after the change.
- **FR14 — Forms unchanged.** `LoginForm` and `RegistrationForm` (and their fields,
  validators, submit handlers, notification flow, and store) MUST continue to function
  identically; the only edits to the registration notification views are the M4/M5 a11y
  attribute changes (AR4/AR5), not logic changes.

## Non-Functional Requirements

Requirement IDs are stable and are referenced by the Architecture and Epics documents.

- **NFR1 — No unintentional visual regression.** The rendered UI of `/sign-up` and
  `/sign-in` MUST be **pixel-identical** to today's `/authentication` page (register and
  login states respectively), except for the explicitly justified, design-owner-gated
  a11y changes. C1 (real `<h1>`), M1, M2, M4, M5 are DOM/attribute-only and produce **no**
  visual change; C2's `:focus-visible` ring does **not** change the resting-state
  screenshot. D1 (switcher color) and D2 (link text) are the only changes that _would_
  alter pixels and MUST NOT be shipped without an Open-Decision resolution.
- **NFR2 — Lighthouse budget.** The change MUST keep the auth-page mobile Lighthouse
  score at or above the CI gate (~0.85; CI score is authoritative). `/sign-up` is the
  budget-sensitive page (it was the default-register `/authentication`). The auth paint
  path MUST stay container-free; the lazy form section MUST NOT be eager-imported; the
  split must not regress the budget (and should improve it, since `/sign-up` no longer
  bundles login code).
- **NFR3 — rca metrics gate.** Every new/changed file MUST pass `make lint-metrics`:
  ≤10 functions/closures per file, Cyclomatic ≤10, Cognitive ≤15, ABC ≤17, ≤3 args, ≤3
  exit points, function LLOC ≤10 / PLOC ≤40 / SLOC ≤45, file LLOC ≤120 / PLOC ≤300 /
  SLOC ≤350, Halstead + MI bands. New units get their own files as a file nears 10
  functions.
- **NFR4 — jscpd DRY gate.** The implementation MUST pass `make lint-dup`
  (`.jscpd.json`: `minTokens 75`, `minLines 5`, `threshold 0`, mode `mild`) by sharing
  markup/style through `AuthPageLayout`/`AuthFormSection`/`AuthSwitcher`, never by ignore
  directives. The two page sections and two pages MUST NOT duplicate ≥75-token blocks.
- **NFR5 — No `data-testid`; semantic selectors.** Source MUST ship no `data-testid`
  (ESLint `error` in `src/**`); tests MUST locate elements by role/label/text
  (`getByRole`, `getByLabelText`, `getByText`), using a stable `id` only as a last
  resort. The swap link MUST be locatable as `getByRole('link', { name })`.
- **NFR6 — No `static`/free functions in `src/**/_.ts`.** Any non-React `.ts`logic MUST
use instance methods on a class (no`static`, no standalone/`export`functions, no
top-level arrow/function-expression`const`s), per the `no-restricted-syntax`gate;
React`.tsx`components and`use-_` hooks are exempt.
- **NFR7 — Type-only files (#88).** New component prop types (e.g. `AuthPageLayout`,
  `AuthFormSection`, `AuthSwitcher` props) MUST live in dedicated per-area `types/` files,
  imported via `import type`; logic files MUST declare no `interface`/`type`. Enforced by
  ESLint + dependency-cruiser (`type-files-imported-as-type-only`,
  `type-files-no-runtime-imports`).
- **NFR8 — Faker builders (#101).** Tests MUST generate arbitrary user/auth domain data
  via `@tests/builders` (`buildUser`, `buildCredentials`, …), seeded deterministically;
  hardcode only when the value IS the test case or a fixed contract (route strings, i18n
  keys, error codes, golden text).
- **NFR9 — i18n en/uk parity.** Any i18n key used MUST exist in both `en.json` and
  `uk.json` and stay in sync via the localization generator; no English string may be
  hard-coded in `src/**`. Existing switcher/title keys are reused; if
  `sign_in.errors.load_failed` is removed, it MUST be removed from both locales.
- **NFR10 — All-layers test refactor + 100% integration coverage.** Every test layer MUST
  be updated for the route rename and button→link swap, and the **global 100% coverage
  over `src/**`** gate MUST hold: every NEW source file (pages, layout, sections,
switcher) is fully covered, and tests for DELETED files are removed. Specifically:
unit (`app.test.tsx`, `app-root.test.tsx`, `components/protected-route.test.tsx`,
`tooling/lighthouse-constants.test.ts`, `tooling/auth-test-port.test.ts`,
`tooling/performance-serving.test.ts`, the form-section/page test rewrite, the deleted
`index.test.tsx`); integration (route-agnostic store/repo/skeleton tests verified, new
files covered); e2e (`auth-forms/login-form.spec.ts`AUTH_URL + switcher locator,`auth-forms/constants/constants.ts` `REGISTRATION_URL`, `skeletons/auth-skeleton.spec.ts`AUTH_URL,`back-to-main.spec.ts` goto+URL, plus a NEW swap-nav spec asserting the URL
changes in both directions); visual (`constants.ts` `PAGES`, split
`visual-comparison.authentication.spec.ts`into sign-up + sign-in,`visual-comparison.auth-skeleton.spec.ts`); memory-leak (`auth-skeleton.js`,
`signup.js` route paths); load (verify no SPA route reference).
- **NFR11 — Visual baseline regeneration.** Renaming the spec/page keys changes the
  expected PNG filenames; baselines under `tests/visual/__snapshots__*` MUST be
  regenerated (`make test-visual-update`, requiring Docker + the prod stack) and MUST be
  visually identical to today's auth page modulo the intentional a11y changes. This is a
  real execution dependency on a working Docker/browser environment.
- **NFR12 — No suppressions, no new inline comments.** No `eslint-disable`, `@ts-ignore`,
  `prettier-ignore`, markdownlint/editorconfig disable, and no new inline code comments
  may be added; rationale lives in the spec/PR. Gate failures MUST be fixed at the root,
  never silenced.
- **NFR13 — Mutation testing.** Tests MUST assert exact strings/attributes (route
  literals, `href` values, `role`/politeness values, the `#404142` ring, the `<h1>` tag,
  `document.title`, `<html lang>`), not truthiness, so Stryker reports no surviving
  mutant on the new branches.
- **NFR14 — commitlint / merge discipline.** Commit headers MUST be ≤100 chars and carry
  a `(#31)` scope; the repo is **squash-merge only** and a `cubic` bot rewrites PR bodies
  and strips manual `Closes #N`, so the issue auto-close reference MUST ride the
  commit/squash message, not the PR body.

## Accessibility Requirements

These requirements expand NFR1/NFR2 and MUST be validated by the accessibility review.
All of AR1-AR7 are **visual-neutral** (resting-state); the visual-affecting items are the
Open Decisions D1/D2.

- **AR1 — One real `<h1>` per page (C1; WCAG 1.3.1, 2.4.6).** Each of `/sign-up` and
  `/sign-in` MUST render exactly one real `<h1>` — the form title — by passing an explicit
  heading element to `FormHeader` (e.g. `component="h1"` while keeping `variant="h4"` for
  size) or owning the `<h1>` at the page level. The fix MUST be DOM-only with **no**
  visual/pixel change. The notification `component="h4"` headings MUST be audited so the
  page heading order (h1 → h4) does not skip a level; if it would, adjust the
  notification heading level accordingly (still no visual change, since `variant` governs
  size).
- **AR2 — Swap-link focus indicator (C2; WCAG 2.4.7, 1.4.11).** `AuthSwitcher` MUST add a
  `&:focus-visible` outline using `customColors.text.primary` `#404142` (10.23:1 on the
  white form wrapper, clearing the 3:1 non-text minimum) with `outlineOffset: 2px`. It
  MUST NOT reuse `UIBackToMain`'s `#1EAEFF` ring (only 2.46:1 on white — fails 1.4.11).
  Because the ring is `:focus-visible`-only, it MUST NOT change the resting-state
  screenshot (NFR1).
- **AR3 — Per-route title (M1; WCAG 2.4.2, Level A).** Implements FR11. `document.title`
  MUST differ between `/sign-up` and `/sign-in`, be sourced from the page's heading i18n
  keys, and be re-applied on `languageChanged`. Shipping two URLs with identical titles
  is a new 2.4.2 failure and is prohibited.
- **AR4 — `<html lang>` (M2; WCAG 3.1.1, Level A).** `app.tsx` MUST set
  `document.documentElement.lang = i18n.language` in the same effect that syncs `dir`
  (`app.tsx:31-38`), re-applied on `languageChanged`, so the default Ukrainian (`uk`)
  content is not announced with an English voice. Visual-neutral one-liner.
- **AR5 — Error-view focus management (M4; WCAG 2.4.3).** When the registration
  notification appears the form + OAuth row become `inert`. The ERROR view
  (`registration-error-view.tsx`) MUST move focus to a meaningful element on mount (it
  already uses `useFocusOnMount` + `tabIndex={-1}` on its heading, `:22-31`) so focus is
  not stranded on `<body>` under `inert`; this PRD REQUIRES verifying and preserving that
  behavior. No visual change.
- **AR6 — Notification politeness & single announce (M5; WCAG 4.1.3, 4.1.2).** The
  SUCCESS view MUST use `role="status"` (polite) instead of `role="alert"` (today
  `registration-success-view.tsx:110`); the ERROR view MUST keep `role="alert"`
  (assertive, `registration-error-view.tsx:111`) but MUST NOT auto-focus a heading inside
  the assertive subtree (per APG, one announcement mechanism per view — auto-focusing
  inside an `alert` competes with the live read). The redundant `aria-label` that
  duplicates the visible title (e.g. `contentBox aria-label`,
  `registration-success-view.tsx:111`) MUST be removed. No visual change.
- **AR7 — Swap link semantics confirmed (WCAG 4.1.2).** The swap link MUST be a true
  link (navigation, changes URL, new-tab works, announced "link"); it MUST NOT carry
  `aria-current`/`aria-pressed` (it points to a sibling page), MUST NOT be `disabled`, and
  full-document-load native focus reset to the top is ACCEPTABLE and conformant (managed
  focus is NOT required and would be wrong — same reasoning as `UIBackToMain`). Tab order
  MUST be BackToMain → form fields → submit → swap link → footer.

## Acceptance Criteria

Each criterion is testable and traceable to the requirement IDs above.

- **AC1 (FR1, FR12).** Navigating to `/sign-up` renders the registration form (title
  "Registration") inside `AuthPageLayout`, with the OAuth row and the swap link, behind
  the route-level lazy chunk and the `AuthSkeleton` Suspense fallback; `/sign-up` does not
  load login code. Verified by unit/e2e render + a bundle/chunk assertion.
- **AC2 (FR2, FR12).** Navigating to `/sign-in` renders the login form (title
  "Authentication") inside `AuthPageLayout` with the same chrome; `/sign-in` does not load
  registration code. Verified by unit/e2e render + a bundle/chunk assertion.
- **AC3 (FR3).** No route matches `/authentication` (no redirect, no alias); the unit
  router test asserts `/sign-up` and `/sign-in` render and `/authentication` does not
  resolve to an auth page. Verified by unit test (`app.test.tsx`).
- **AC4 (FR4).** With no token, `ProtectedRoute` renders `<Navigate to="/sign-in"
replace/>` (the test lands on the `/sign-in` element, not `/authentication`); with a
  token it renders the protected child. Verified by unit test
  (`components/protected-route.test.tsx`, route element `/sign-in`).
- **AC5 (FR5, FR7, AR7).** The swap control is an `<a href>` with the correct
  destination: on `/sign-up` `href="/sign-in"` with text "Already have an account?", on
  `/sign-in` `href="/sign-up"` with text "Don't have an account yet?"; it is exposed as a
  link (`getByRole('link', { name })`) and clicking it changes the URL. Verified by unit
  RTL `getByRole('link')` href/name assertions and a NEW e2e spec asserting `toHaveURL`
  flips `/sign-up` ↔ `/sign-in` in both directions.
- **AC6 (FR6, AR7).** The swap link is never `disabled`, carries no
  `aria-pressed`/`aria-current`, and its `href` is always a non-empty string. Verified by
  unit test asserting the anchor has a non-empty `href` and no disabled/pressed/current
  state.
- **AC7 (FR8, FR9, FR10, NFR4).** `AuthPageLayout`, `AuthFormSection`, and `AuthSwitcher`
  are each a single reusable component consumed by both pages with no duplicated
  ≥75-token block; `make lint-dup` passes with no ignore directives. Verified by code
  review + CI jscpd.
- **AC8 (FR11, AR3).** `document.title` is distinct on `/sign-up` vs `/sign-in`, sourced
  from the page heading i18n keys, and updates on `languageChanged`. Verified by unit test
  asserting `document.title` per route and after a simulated language change.
- **AC9 (AR4).** `document.documentElement.lang` equals `i18n.language` after mount and
  after `languageChanged`. Verified by unit test on the `app.tsx` effect.
- **AC10 (AR1).** Each page has exactly one element with role `heading` level 1 whose
  text is the form title, and the heading order does not skip a level (notification heading
  levels adjusted so the heading order does not skip a level — see Architecture: h4 → h2).
  Verified by unit RTL `getByRole('heading', { level: 1 })` (exact tag `<h1>`) and an axe
  heading-order check. The resting-state visual snapshot is unchanged (NFR1).
- **AC11 (AR2).** `AuthSwitcher` applies a `&:focus-visible` `outline` of
  `2px solid #404142` with `outlineOffset: 2px` (not `#1EAEFF`), and the resting-state
  screenshot is unchanged. Verified by unit test on the focus-visible style and a visual
  snapshot equality (resting state).
- **AC12 (AR5).** After a registration failure, focus lands on the error view's heading/
  error text (`tabIndex={-1}` + focus-on-mount), not `<body>`, while the form + OAuth row
  are `inert`. Verified by an e2e assertion on the active element after the failed
  round-trip (WCAG 2.4.3).
- **AC13 (AR6).** The SUCCESS notification uses `role="status"` (polite) and the ERROR
  notification uses `role="alert"` (assertive) with no auto-focus inside the assertive
  subtree and no redundant title-duplicating `aria-label`; axe reports no duplicate/
  competing live regions. Verified by unit RTL role assertions + axe (WCAG 4.1.3, 4.1.2).
- **AC14 (FR13).** No source module imports `form-section/index.tsx`,
  `use-login-switcher.ts`, `login-switch-actions.ts`, `utils/load-login-form.ts`,
  `styles.formSwitcherError`, `AuthMode`, or the deleted `types/form-section/*`; the build,
  TypeScript, and dependency-cruiser pass with those files removed. Verified by CI
  (grep + `make lint-tsc` + dep-cruiser).
- **AC15 (FR14).** Login and registration submit, validation, and the notification flow
  behave identically to before (only the M4/M5 a11y attributes changed). Verified by the
  preserved/ported form, validation, and store tests plus e2e form-submission specs.
- **AC16 (NFR1, NFR11).** Regenerated visual baselines for `/sign-up` and `/sign-in` are
  visually identical to today's auth page (register/login) modulo the intentional a11y
  changes; the visual regression suite passes. Verified by `make test-visual` against the
  regenerated baselines.
- **AC17 (NFR10).** Integration coverage over `src/**` stays at 100% with all new files
  covered and deleted-file tests removed; the full unit/integration/e2e/memory-leak
  suites pass on the new routes. Verified in CI.
- **AC18 (NFR2).** The `/sign-up` mobile Lighthouse CI score stays at or above the ~0.85
  gate with no eager import of the lazy form section and no new auth-path dependency.
  Verified by the CI Lighthouse run and updated `lighthouse/constants.js`
  (`/sign-up`).
- **AC19 (NFR3, NFR4, NFR6, NFR7, NFR12).** `make lint-metrics`, `make lint-dup`, ESLint
  (no `data-testid`, no `static`/free functions in `src/**/*.ts`), dependency-cruiser
  (type-only files), and TypeScript all pass with no new suppressions, ignores, or inline
  code comments. Verified in CI.
- **AC20 (NFR9).** Every i18n key used exists in both `en.json` and `uk.json` and stays in
  sync; no English string is hard-coded in `src/**`; if `sign_in.errors.load_failed` is
  removed it is removed from both locales. Verified by the i18n parity check.
- **AC21 (NFR13).** Stryker reports no surviving mutant on the new branches: route
  literals (`/sign-up`, `/sign-in`), the swap-link `href`, the notification politeness
  values (`status`/`alert`), the `#404142` ring, the `<h1>` tag, `document.title`, and
  `<html lang>` are each asserted by exact-value tests. Verified by `make test-mutation`.
- **AC22 (FR1-FR4, NFR10).** Lighthouse/CI and tooling config no longer reference
  `/authentication` where the route is meant: `lighthouse/constants.js` lists `/sign-up`,
  `tooling/lighthouse-constants.test.ts` expects `…/sign-up`, `tooling/auth-test-port.test.ts`
  asserts the `constants.js` `/sign-up` ternary string, and `performance-testing.yml` still
  does NOT contain the literal route. Verified by the tooling unit tests.

## Open Decisions

These two items conflict with the issue's "keep all styles the same" and therefore MUST
be resolved by the design owner before any pixel-changing implementation. Both have a
clear recommendation; if deferred, an explicit waiver MUST be recorded. (D-URL,
D-REDIRECT, D-REMOVE are already user-confirmed and are NOT open — they appear in FR1-FR4
as fixed decisions.)

> **STATUS — D1, D2, D3 all RESOLVED 2026-06-25** by the design owner (@RudoiDmytro). **D1:
> KEEP `#969B9D`** (recorded waiver, see below). **D2: KEEP current text** (AAA naming deferred
> to a follow-up). **D3: KEEP "Authentication"** as the `/sign-in` title+heading (rename deferred
> to a follow-up). Net effect: the resting screenshot stays **pixel-identical**; only the
> zero-pixel DOM/attribute a11y items (C1/M1/M2/M4/M5) and the resting-neutral
> `:focus-visible` ring (C2) ship. Visual baselines are regenerated for byte-stability
> only and MUST match today's auth page modulo C1/C2/M\*. D3 was raised by the
> pre-implementation accessibility-lead review (Gap 3); that review also pinned three
> implementation items into the epics (error-view focus target outside `role="alert"`;
> live-region announcement timing + submit→success sequencing; an AC asserting the swap link
> carries no MUI `role="button"`).

- **D1 — Switcher text color contrast (from a11y C3; WCAG 1.4.3 AA).**
  `customColors.text.secondary` `#969B9D` (`src/styles/colors.ts:59`,
  `form-section/styles.ts:26`) on the white form wrapper is **2.81:1**; normal text needs
  **4.5:1**. This is **pre-existing**, but the refactor promotes the switcher to a
  now-primary navigation control. Fixing it (darken to ≥`#767676` 4.54:1, or reuse
  `#404142` 10.23:1) **WILL change the resting screenshot** and break the pixel-identical
  constraint. **Recommendation: FIX it** — an AA body-text failure on a primary nav
  control should be fixed, not waived. Requires a design-owner decision; if deferred,
  record an explicit, dated waiver and keep `#969B9D`. **Flagged prominently.**
  - **RESOLVED 2026-06-25 — WAIVED (design owner @RudoiDmytro).** KEEP `#969B9D`. This is
    an explicit, dated waiver of WCAG 1.4.3 AA for the switcher text color, taken to honor
    the issue's pixel-identical constraint on the resting state. The contrast fix is
    deferred to a tracked follow-up. Implementation MUST NOT change `customColors.text.secondary`
    or `form-section/styles.ts` switcher color; visual baselines for the switcher's resting
    color stay unchanged.
- **D2 — Explicit link destination in text (from a11y M3; WCAG 2.4.9 AAA).** "Already
  have an account?" / "Don't have an account yet?" **PASS** WCAG 2.4.4 (AA) _in context_
  but **FAIL** 2.4.9 (AAA, link-text-only). The accessible improvement is to name the
  destination ("… Sign in" / "… Sign up") as a single composed i18n key **per locale**
  (do NOT string-concatenate uk/en — word order differs). This **DOES** change visible
  text. **Recommendation: keep the current text for #31** (AA passes in context); track
  the AAA naming improvement as a follow-up. If the design owner wants it now, it becomes
  a scoped copy change with new parity-checked keys.
  - **RESOLVED 2026-06-25 — KEEP (design owner @RudoiDmytro).** KEEP the current switcher
    text for #31 (WCAG 2.4.4 AA passes in context). The 2.4.9 AAA destination-naming is
    deferred to a separate follow-up. No visible text change and no new i18n keys in this PR.
- **D3 — `/sign-in` title + `<h1>` text "Authentication" descriptiveness (from a11y review
  Gap 3; WCAG 2.4.2 A / 2.4.6 AA).** `sign_in.title` = "Authentication" is distinct from
  "Registration" (2.4.2 A passes), but is a weak/ambiguous title+heading for the login page now
  that two auth pages exist. Renaming to "Sign in" would change the visible `<h1>` text and break
  the pixel-identical constraint (NFR1), so the loop cannot change it silently.
  - **RESOLVED 2026-06-25 — KEEP (design owner @RudoiDmytro).** KEEP "Authentication" as the
    `/sign-in` `document.title` and `<h1>` text for #31 (pixel-identical, consistent with D1/D2).
    Track a "Sign in" rename (with en/uk parity-checked keys + a regenerated `/sign-in` baseline)
    as a follow-up. No `sign_in.title` change in this PR.

## Risks & Mitigations

| ID  | Risk                                                                                                                      | Mitigation                                                                                                                                                                                                                                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | A reviewer reads "keep all styles the same" literally and rejects the justified a11y changes as visual regressions.       | NFR1 + Open Decisions frame the intent precisely: C1/M1/M2/M4/M5 are DOM/attribute-only (zero pixels) and C2 is `:focus-visible`-only (resting-state-neutral); the only pixel-changing items (D1, D2) are gated behind design-owner Open Decisions, not silently shipped. |
| R2  | Using `UIButton to=…` produces a full-document reload, surprising reviewers expecting client-side `<Link>`.               | This is the established, accessibility-validated pattern (`UIBackToMain`, `ui-back-to-main/index.tsx:19`); full-load native focus reset is conformant (AR7). Architecture documents the deliberate choice; FR5/FR6 codify it.                                             |
| R3  | The swap link reused with `UIBackToMain`'s `#1EAEFF` ring would fail 1.4.11 (2.46:1 on white).                            | AR2 mandates the `#404142` ring (10.23:1); AC11 unit-tests the exact `:focus-visible` outline value, and Stryker (NFR13/AC21) kills a mutated color.                                                                                                                      |
| R4  | Shipping two URLs with identical titles introduces a NEW WCAG 2.4.2 failure.                                              | FR11/AR3/AC8 require distinct per-route `document.title` sourced from the heading keys and re-applied on `languageChanged`.                                                                                                                                               |
| R5  | Deleting `load-login-form.ts` / toggler files breaks a hidden importer.                                                   | Verified `loginFormLoader` is imported only by the three toggler files being deleted (`form-section/index.tsx`, `use-login-switcher.ts`, `login-switch-actions.ts`); FR13/AC14 require a green build + dep-cruiser after deletion.                                        |
| R6  | The component split duplicates ≥75-token markup/style across the two pages/sections and trips jscpd.                      | FR8/FR9/FR10 + NFR4: the chrome, section shell, and switcher are single shared components; AC7 + CI jscpd verify with no ignore directives.                                                                                                                               |
| R7  | New small components push a file over the rca ≤10-functions/closures cap.                                                 | NFR3: each new unit (layout, section, switcher, two sections, two pages, type-only files) is its own small file; `make lint-metrics` gates it.                                                                                                                            |
| R8  | Visual baselines cannot be regenerated without Docker + the prod stack, blocking the visual gate.                         | NFR11 calls this out as a real execution dependency; baseline regen (`make test-visual-update`) is an explicit story with the Docker/browser prerequisite.                                                                                                                |
| R9  | Renaming routes regresses the auth-page Lighthouse budget.                                                                | NFR2/AC18: keep the auth paint path container-free, do not eager-import the lazy form section; the split removes login code from `/sign-up`, improving rather than regressing the budget; `lighthouse/constants.js` points at `/sign-up`.                                 |
| R10 | The 100% integration coverage gate fails because a new file is uncovered or a deleted-file test lingers.                  | NFR10/AC17: every new file gets tests and every deleted-module test is removed in the same change; DI gotcha (`clearInstances()` breaking module-load-captured store spies) is noted but not triggered (store unchanged).                                                 |
| R11 | `role="alert"` + auto-focus on the success view double-announces, and assertive politeness is wrong for a success result. | AR6/AC13: success → `role="status"` (polite, no auto-focus competition); error keeps `role="alert"` without auto-focus inside the assertive subtree; redundant `aria-label` removed.                                                                                      |
| R12 | The `(#31)`-scoped squash message or auto-close reference is dropped because the cubic bot rewrites the PR body.          | NFR14: the `Closes #31` reference rides the commit/squash message (squash-merge-only repo), not the PR body; commitlint header ≤100 chars with `(#31)` scope.                                                                                                             |
| R13 | A test smuggles in `data-testid` (the existing `protected-route.test.tsx` mock stubs use it) into `src/**`.               | NFR5: `src/**` ships no `data-testid`; the swap link/`<h1>` are located by role/label/text; mock-stub `*ByTestId` queries in tests stay at warn-level and are valid where used.                                                                                           |

## Success Metrics

- **Routing correctness:** `/sign-up` and `/sign-in` render their respective forms;
  `/authentication` matches nothing; unauthenticated protected access lands on `/sign-in`
  (FR1-FR4, AC1-AC4).
- **Navigation semantics:** the swap control is an `<a href>` that changes the URL in both
  directions, is announced "link", opens in a new tab, and is never `disabled`
  (FR5-FR7, AR7, AC5-AC6).
- **Reuse / DRY:** exactly three new reusable components (`AuthPageLayout`,
  `AuthFormSection`, `AuthSwitcher`) consumed by both pages with zero ≥75-token
  duplication; `make lint-dup` green (FR8-FR10, NFR4, AC7).
- **Accessibility:** axe reports no heading, name/role/value, or live-region violation;
  each page has exactly one real `<h1>`; the swap link has a ≥3:1 `#404142` focus ring;
  per-route `document.title` and `<html lang>` are managed; the error view moves focus to
  a meaningful element; success/error politeness is correct (AR1-AR7, AC8-AC13).
- **No unintentional visual regression:** regenerated `/sign-up` and `/sign-in` baselines
  are visually identical to today's auth page modulo the design-owner-gated a11y changes;
  the visual suite passes (NFR1, NFR11, AC11, AC16).
- **Clean teardown:** the in-place toggler machinery is fully removed with no orphan
  importer, a green build, and dep-cruiser passing (FR13, AC14).
- **Gate health:** Lighthouse CI ≥ ~0.85 on `/sign-up`; `make lint-metrics` /
  `make lint-dup` / ESLint / TypeScript / dependency-cruiser green with no suppressions or
  new inline comments; i18n en+uk in sync; 100% integration coverage retained over
  `src/**`; no surviving Stryker mutant on the new branches; all-layers test refactor
  complete (NFR2-NFR13, AC17-AC22).
- **Decision discipline:** D1 (switcher color) and D2 (link text) are resolved by the
  design owner (fix or recorded waiver) before any pixel-changing edit; no visual-affecting
  a11y change ships unresolved.
