---
status: 'complete'
workflowType: 'architecture'
project_name: 'crm'
date: '2026-06-25'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/31'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/31'
  - 'specs/sign-up-sign-in-pages/planning-artifacts/prd-sign-up-sign-in-pages-2026-06-25.md'
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
  - 'src/modules/user/features/auth/utils/load-login-form.ts'
  - 'src/modules/user/features/auth/utils/lazy-module-loader.ts'
  - 'src/modules/user/features/auth/types/form-section/index.ts'
  - 'src/modules/user/features/auth/types/form-section/login-switch-actions.ts'
  - 'src/modules/user/features/auth/types/form-section/use-login-switcher.ts'
  - 'src/modules/user/features/auth/i18n/en.json'
  - 'src/modules/user/features/auth/i18n/uk.json'
  - 'src/components/ui-button/index.tsx'
  - 'src/components/types/ui-button/index.ts'
  - 'src/components/ui-back-to-main/index.tsx'
  - 'src/components/ui-typography/index.tsx'
  - 'src/components/ui-form/index.tsx'
  - 'src/components/types/ui-form/index.ts'
  - 'src/components/ui-live-status/index.tsx'
  - 'src/styles/colors.ts'
  - 'lighthouse/constants.js'
  - 'lighthouse/lighthouserc.mobile.js'
  - 'tests/visual/constants.ts'
  - 'tests/visual/take-visual-snapshot.ts'
  - 'tests/visual/visual-comparison.authentication.spec.ts'
  - 'tests/visual/visual-comparison.auth-skeleton.spec.ts'
  - 'tests/unit/app.test.tsx'
  - 'tests/unit/app-root.test.tsx'
  - 'tests/unit/components/protected-route.test.tsx'
  - 'tests/unit/modules/user/features/auth/index.test.tsx'
  - 'tests/unit/tooling/lighthouse-constants.test.ts'
  - 'tests/unit/tooling/auth-test-port.test.ts'
  - 'tests/unit/tooling/performance-serving.test.ts'
  - 'tests/e2e/modules/back-to-main.spec.ts'
  - 'tests/e2e/components/skeletons/auth-skeleton.spec.ts'
  - 'tests/e2e/modules/user/features/auth/components/form-section/auth-forms/login-form.spec.ts'
  - 'tests/e2e/modules/user/features/auth/components/form-section/auth-forms/registration-form.spec.ts'
  - 'tests/e2e/modules/user/features/auth/components/form-section/auth-forms/constants/constants.ts'
  - 'tests/memory-leak/tests/auth-skeleton.js'
  - 'tests/memory-leak/tests/signup.js'
  - '_bmad/config.yaml'
  - 'specs/README.md'
---

# Architecture - Split Auth into Routed /sign-up and /sign-in Pages (Issue #31)

**Author:** BMad (Architect) **Date:** 2026-06-25 **Source:** VilnaCRM-Org/crm#31

## Approach Summary

This is a brownfield routing + component-extraction refactor. Today a single page
(`src/modules/user/features/auth/index.tsx`, the `Authentication` component) renders one form
section (`src/modules/user/features/auth/components/form-section/index.tsx`) that toggles between
the registration and login views **in place**: `useLoginSwitcher` holds `useState<AuthMode>`
(default `'register'`, `use-login-switcher.ts:15`), and `SwitcherButton` (`index.tsx:43-66`) is a
`<button onClick>` that lazily loads the login chunk and calls `startTransition(() =>
setMode('login'))` (`login-switch-actions.ts:39`). The URL never changes. This work splits that into
**two route-level pages** — `/sign-up` and `/sign-in` — and turns the swap control into a real
`<a href>` that **navigates** (FR1-FR5). The `/authentication` route is removed (FR3, D-REMOVE) and
`ProtectedRoute` redirects unauthenticated users to `/sign-in` (FR4, D-REDIRECT).

The design is deliberately **centralised** to satisfy the jscpd DRY gate (NFR4) and the issue's
"clean, reusable, modular" mandate (AC2): the page chrome, the form-section shell, and the swap link
are each extracted **once** into a new reusable component — `AuthPageLayout`, `AuthFormSection`,
`AuthSwitcher` — and consumed by both pages. Each page (`SignUp`, `SignIn`) is a thin route-level
lazy chunk whose form section is itself a separate lazy chunk Suspended behind the existing
`AuthSkeleton` fallback (FR8, FR9, FR12), preserving today's `Authentication` (route chunk) +
`FormSection` (inner lazy chunk) shape. Because `/sign-up` no longer bundles login code and
`/sign-in` no longer bundles registration code, the split is **better** for the budget-sensitive
mobile Lighthouse path (NFR2).

The mandatory accessibility-lead review returned **NO-SHIP** until a set of **visual-neutral**
blockers are addressed; this architecture folds them into concrete file changes: one real `<h1>` per
page via a new `titleComponent` capability on `UIForm`→`FormHeader` (C1/AR1), a `#404142`
`:focus-visible` ring on `AuthSwitcher` (C2/AR2), per-route `document.title` + `<html lang>` in the
`app.tsx` i18n effect (M1/M2 → AR3/AR4), and corrected notification politeness/focus on the
registration views (M4/M5 → AR5/AR6). All of these are DOM/attribute/`:focus-visible`-only, so the
resting-state screenshot is unchanged (NFR1). The two pixel-changing a11y items — switcher color
(D1) and explicit link text (D2) — are **not implemented here**; they are gated behind the PRD's
Open Decisions.

```text
BEFORE (main)                              AFTER (this design)
createBrowserRouter([                      createBrowserRouter([
  ProtectedRoute -> '/' ButtonExample,       ProtectedRoute -> '/' ButtonExample,   (unchanged)
  '/authentication' -> <Authentication/>     '/sign-up'  -> <SignUp/>   (lazy)       (FR1)
])                                            '/sign-in'  -> <SignIn/>   (lazy)       (FR2)
                                           ])    (no '/authentication')              (FR3)

Authentication                             SignUp                SignIn
 └ FormSection (toggler)                    └ AuthPageLayout      └ AuthPageLayout    (FR8)
    mode state + <button> swap                 └ SignUpFormSection   └ SignInFormSection (FR12)
    lazy login chunk in place                     └ AuthFormSection     └ AuthFormSection (FR9)
                                                     <RegistrationForm>    <LoginForm>
                                                     <AuthSwitcher         <AuthSwitcher
                                                       to="/sign-in"/>       to="/sign-up"/>  (FR5/FR10)
```

No new runtime dependency lands. `UIButton`'s string-`to`→`<a href>` resolution
(`ui-button/index.tsx:27-34`) and the established `UIBackToMain` precedent (`to="/"`,
`ui-back-to-main/index.tsx:19`) are reused verbatim, so the swap link is a full-document `<a href>`
with conformant native focus reset (AR7) — not a client-side `<Link>` (a deliberate,
a11y-validated choice, Risk R2). The auth paint path stays container-free: no DI container, no Apollo,
no zod is added to the page or layout chunks (NFR2).

## Component-Level Design

### `AuthPageLayout` (NEW) — reusable page chrome

**Location:** `src/modules/user/features/auth/components/auth-page-layout/index.tsx` (a `.tsx`
component, exempt from the no-free-function gate, NFR6). Implements **FR8**.

This is the chrome lifted verbatim from `auth/index.tsx:11-26`:

```text
<>
  <UIBackToMain />
  <Box component="main" sx={{ flexGrow:1, display:'flex', flexDirection:'column' }}>
    <AuthErrorBoundary>
      <Suspense fallback={<AuthSkeleton />}>{children}</Suspense>
    </AuthErrorBoundary>
  </Box>
  <UIFooter />
</>
```

- Props: `{ children: ReactNode }` — the lazily-imported, page-specific form section. The prop type
  (`AuthPageLayoutProps`) lives in a type-only file (NFR7, pattern #88), imported with
  `import type`.
- The `<main>` `sx` literal, the `<AuthErrorBoundary>`, and the `<Suspense fallback={<AuthSkeleton/>}>`
  are **identical** to today's, so the AuthSkeleton-while-chunk-loads behaviour and the
  error-boundary fallback are preserved unchanged (FR1, FR12; the `index.test.tsx` shell assertions
  port to this component). Imports mirror `auth/index.tsx:1-7`: `AuthSkeleton`, `UIBackToMain`,
  `UIFooter`, `AuthErrorBoundary`.
- Both `SignUp` and `SignIn` consume this single component, so the chrome is not duplicated
  (NFR4): the ~10-line chrome block would otherwise be a >75-token clone across the two pages.

### `AuthFormSection` (NEW) — reusable presentational section shell

**Location:** `src/modules/user/features/auth/components/auth-form-section/index.tsx`. Implements
**FR9**.

This is the `<section>`/`formWrapper` shell lifted from `FormSectionLayout`
(`form-section/index.tsx:111-141`), made presentational and parameterised:

```text
<Box component="section" sx={styles.formSection}>
  <Box sx={styles.formWrapper}>
    {children}                                       (the form: Registration | Login)
    <InertBox id="auth-provider-buttons-container" inert={oauthInert}>
      <AuthProviderButtons />
    </InertBox>
  </Box>
  {switcher}                                          (an <AuthSwitcher/>)
</Box>
```

- Props: `{ children: ReactNode; oauthInert: boolean; switcher: ReactNode }`. Type-only file
  (`AuthFormSectionProps`, NFR7). No `mode`, no `t`, no switch callbacks — all toggler state is gone.
- `styles.formSection` and `styles.formWrapper` are reused from `form-section/styles.ts:13-14`
  (which re-export the shared `auth-form-shared-styles`), so the section geometry is pixel-identical
  (NFR1). `InertBox` is reused from `form-section/inert-box.tsx` with the existing
  `id="auth-provider-buttons-container"` (preserving the OAuth row's `inert` primitive, confirmed
  correct).
- `oauthInert` replaces the old `showNotification = mode==='register' && registrationView!=='form'`
  derivation (`form-section/index.tsx:121`): the sign-up section computes it from its own
  `registrationView`, the sign-in section passes `false` (login has no notification view).
- Both `SignUpFormSection` and `SignInFormSection` render this single shell with no duplicated
  markup (NFR4), replacing the duplicated `formSection`/`formWrapper`/`InertBox` block.

### `AuthSwitcher` (NEW) — the swap control as a real link

**Location:** `src/modules/user/features/auth/components/auth-switcher/index.tsx` (+ its own
`styles.ts`, see below). Implements **FR5, FR6, FR7, FR10, AR2, AR7**.

```text
function AuthSwitcher({ to, labelKey }: AuthSwitcherProps): JSX.Element {
  const { t } = useTranslation();
  return (
    <UIButton to={to} disableRipple sx={authSwitcherStyles.switcher}>
      {t(labelKey)}
    </UIButton>
  );
}
```

- Props: `{ to: string; labelKey: string }` (type-only file `AuthSwitcherProps`, NFR7). `to` is
  **always** a non-empty literal route (`'/sign-up'` or `'/sign-in'`), so `resolveLinkTarget(to)`
  (`ui-button/index.tsx:8-18`) yields a non-empty string, `resolvedComponent` becomes `'a'`, and a
  real `<a href>` renders (FR5, FR6, AR7). It is announced "link" and opens in a new tab via the
  browser — exactly the `UIBackToMain` pattern.
- **No `disabled`, no `onClick`, no `onMouseEnter`/`onFocus`/`onTouchStart` `onIntent` prefetch**:
  the old `SwitcherButton` (`form-section/index.tsx:43-66`) carried all of these; they are dropped
  (FR6). A navigable link must never announce "unavailable" (WCAG 4.1.2). There is no `aria-current`
  / `aria-pressed` (it points to a sibling page, AR7).
- **Styling (AR2/C2).** The switcher reuses today's `formSwitcherButton` rule
  (`form-section/styles.ts:15-41`: `display:block`, `padding:0`, `margin:'1.4375rem auto 0'`,
  `fontFamily:'Golos'`, `fontWeight:500`, `fontSize:'0.9375rem'`, `lineHeight:1.2`,
  `color: customColors.text.secondary` `#969B9D`, `textTransform:'none'`, plus the lg/xl media
  tweaks) so the resting state is pixel-identical (NFR1). It **adds** a `:focus-visible` rule that
  did not exist before:

  ```ts
  '&:focus-visible': {
    outline: `2px solid ${customColors.text.primary}`,   // #404142, 10.23:1 on white
    outlineOffset: '2px',
  }
  ```

  `#404142` (`colors.ts:58`) clears the 1.4.11 ≥3:1 non-text floor on the white form wrapper; the
  `UIBackToMain` ring color `#1EAEFF` (`paletteColors.primary.main`, `colors.ts:3`) is **2.46:1** and
  is explicitly NOT reused (AR2). Because the ring is `:focus-visible`-only, it never paints in the
  resting-state screenshot (NFR1, AC11). This new style object lives in a dedicated
  `auth-switcher/styles.ts` (a small object literal, no functions) rather than being bolted onto the
  toggler's `form-section/styles.ts` that is being slimmed.

- The switcher text color stays `#969B9D` (D1 is deferred unless the design owner resolves it).

### `SignUp` page (NEW) + `SignUpFormSection` (NEW lazy chunk)

**Locations:** `src/modules/user/features/auth/sign-up/index.tsx` (route-level page) and
`src/modules/user/features/auth/sign-up/sign-up-form-section.tsx` (lazy inner chunk). Implements
**FR1, FR7, FR11, FR12, AR1, AR3**.

`SignUp` (route page, lazily imported by `app.tsx`):

```text
const SignUpFormSection = lazy(() => import('./sign-up-form-section'));
export default function SignUp(): JSX.Element {
  usePageTitle('sign_up.title');                 // FR11/AR3 — see app.tsx note (M1)
  return <AuthPageLayout><SignUpFormSection /></AuthPageLayout>;
}
```

`SignUpFormSection` owns the only surviving toggler state — `registrationView` — exactly as
`useFormSectionViewModel` did (`form-section/index.tsx:143-167`), minus all switch machinery:

```text
export default function SignUpFormSection(): JSX.Element {
  const [view, setView] = useState<RegistrationView>('form');
  return (
    <AuthFormSection
      oauthInert={view !== 'form'}
      switcher={<AuthSwitcher to="/sign-in" labelKey="sign_up.form.switcher_text_have_account" />}
    >
      <RegistrationForm onViewChange={setView} />
    </AuthFormSection>
  );
}
```

- `RegistrationForm` is reused unchanged (`auth-forms/registration-form.tsx:72-83`); its
  `onViewChange` prop and `RegistrationView` type (`form-section/types.ts:4`) are retained. The
  registration notification flow, `useRegistrationForm`, and validators are untouched (FR14).
- `/sign-up` shows `sign_up.form.switcher_text_have_account` ("Already have an account?") linking to
  `/sign-in` (FR7), reusing the existing i18n key (`en.json:59`, NFR9). It does NOT import login
  code (FR12).
- `usePageTitle` (a `use-*` hook, NFR6-exempt) sets `document.title` from the page's heading key and
  re-applies on `languageChanged` — see the app.tsx title note below (FR11/AR3/M1).

### `SignIn` page (NEW) + `SignInFormSection` (NEW lazy chunk)

**Locations:** `src/modules/user/features/auth/sign-in/index.tsx` and
`src/modules/user/features/auth/sign-in/sign-in-form-section.tsx`. Implements **FR2, FR7, FR11,
FR12, AR1, AR3**.

```text
const SignInFormSection = lazy(() => import('./sign-in-form-section'));
export default function SignIn(): JSX.Element {
  usePageTitle('sign_in.title');
  return <AuthPageLayout><SignInFormSection /></AuthPageLayout>;
}

export default function SignInFormSection(): JSX.Element {
  return (
    <AuthFormSection
      oauthInert={false}
      switcher={<AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account" />}
    >
      <LoginForm />
    </AuthFormSection>
  );
}
```

- `LoginForm` is reused unchanged (`auth-forms/login-form.tsx:15-34`), rendering
  `<UIForm<LoginUserDto> title={t('sign_in.title')}>`. Login has no notification view, so
  `oauthInert={false}` is constant.
- `/sign-in` shows `sign_up.form.switcher_text_no_account` ("Don't have an account yet?") linking to
  `/sign-up` (FR7, `en.json:60`). It does NOT import registration code (FR12).
- `LoginForm` is now the **route's own** lazy chunk, so `loginFormLoader`
  (`utils/load-login-form.ts`) and the request-id stale-guard in `login-switch-actions.ts` are no
  longer needed (FR13). The `lazy(() => import('./sign-in-form-section'))` at the page level plus
  React Router's route-level chunking give the same defer-login-until-needed behaviour the toggler's
  `loginFormLoader.load()` gave, but keyed on the URL instead of a button click.

### `app.tsx` routing (MODIFY) — add `/sign-up` + `/sign-in`, remove `/authentication`

**File:** `src/app.tsx`. Implements **FR1, FR2, FR3, FR12**.

`createBrowserRouter` (`app.tsx:12-26`) is rewritten: the `ProtectedRoute → '/' ButtonExample`
branch (`app.tsx:13-21`) is kept verbatim; the `{ path: '/authentication', element: <Authentication/> }`
entry (`app.tsx:22-25`) is **removed**; two new lazy route entries are added:

```text
const SignUp = lazy(async () => import('@auth/sign-up'));
const SignIn = lazy(async () => import('@auth/sign-in'));
// ...
{ path: '/sign-up', element: <SignUp /> },
{ path: '/sign-in', element: <SignIn /> },
```

- The `Authentication` lazy import (`app.tsx:10`) is removed; the new pages are lazy at the route
  level under the unchanged `<React.Suspense fallback={null}>` (`app.tsx:40`), preserving the route
  chunking that `performance-serving.test.ts:51-63` asserts (NFR2) — that test's expected strings
  are updated to the two new lazy imports (see file plan).
- No `/authentication` route remains and **no** redirect/alias is added (FR3). A request to
  `/authentication` falls through to react-router's not-matched behaviour.

### `app.tsx` title + lang effect (MODIFY) — M1 / M2 → AR3 / AR4

**File:** `src/app.tsx` (the `useEffect` at `app.tsx:31-38`). Implements **AR4 (M2)**; the
`usePageTitle` hook implements **FR11/AR3 (M1)**.

Today the effect syncs only `document.documentElement.dir` from `i18n.dir(i18n.language)` on the
initial render and on `languageChanged` (`app.tsx:32-37`). It **never** sets `.lang` (M2) and
**never** sets `document.title` (M1).

- **AR4 (`<html lang>`)**: the same effect adds `document.documentElement.lang = i18n.language`
  alongside the existing `applyDir()`, re-applied on `languageChanged` and torn down via the
  existing `i18n.off` cleanup. This is a visual-neutral one-liner inside the **existing** effect, so
  it adds no new closure/exit point and the `app.test.tsx` language-change test extends to assert
  `document.documentElement.lang` (AC9). The effect must stay under the rca caps (≤3 exit points,
  Cognitive ≤15); the title concern is therefore **not** crammed into this effect — it is a separate
  per-page hook (below).
- **FR11/AR3 (`document.title`)**: a small **`usePageTitle(titleKey: string)`** hook
  (`src/modules/user/features/auth/hooks/use-page-title.ts`, a `use-*` hook so NFR6-exempt) is
  called by each page. It reads `t(titleKey)`, composes the localized document title (e.g.
  `"<heading> - VilnaCRM"`), sets `document.title`, and subscribes to `languageChanged` to
  re-apply — mirroring the `dir` effect's subscribe/cleanup shape (`app.tsx:36-37`). Sourcing the
  title from the **same** i18n keys that feed each page's `<h1>` (`sign_up.title` /
  `sign_in.title`, `en.json:19,69`) guarantees the two pages differ (Sign up ≠ Authentication) and
  avoids a new WCAG 2.4.2 failure. Putting it in a per-page hook (not the shared app effect) keeps
  each page's title self-describing and the app effect single-responsibility (rca, NFR3). A unit
  test asserts `document.title` per route and after a simulated `languageChanged` (AC8, NFR13).

### `protected-route` (MODIFY) — redirect to `/sign-in`

**File:** `src/modules/user/features/auth/components/protected-route/index.tsx`. Implements **FR4
(D-REDIRECT)**.

The single return (`protected-route/index.tsx:8`) changes the navigate target:

```text
return token ? <Outlet /> : <Navigate to="/sign-in" replace />;
```

`useAuthToken()` and the `<Outlet/>` branch are unchanged. The unit test
(`components/protected-route.test.tsx:22,35`) updates the route element and the redirect target to
`/sign-in` (AC4). NFR13: the test asserts the exact `/sign-in` target so a mutated route string is
killed by Stryker.

### `UIForm` / `FormHeader` real-`<h1>` capability (MODIFY) — C1 → AR1

**Files:** `src/components/ui-form/index.tsx` (the `FormHeader`/`UIForm` functions) +
`src/components/types/ui-form/index.ts`. Implements **AR1 (C1), AC10**.

Today `FormHeader` renders the title as `<UITypography variant="h4" sx={styles.formTitle}>`
(`ui-form/index.tsx:46-48`) with **no** `component` prop; `UITypography` defaults
`component={component || 'p'}` (`ui-typography/index.tsx:18`), so the title is a `<p>` and each page
has **zero** real headings. The fix threads an optional `titleComponent` through `UIFormProps` →
`FormBodyProps` → `FormHeader`:

```text
// types/ui-form/index.ts — add to UIFormProps and FormBodyProps:
titleComponent?: React.ElementType;     // e.g. 'h1'
```

```text
// ui-form/index.tsx FormHeader:
<UITypography variant="h4" component={titleComponent} sx={styles.formTitle}>{title}</UITypography>
```

- `variant="h4"` is retained (size unchanged, NFR1); `component={titleComponent}` makes the element
  a real heading. When `titleComponent` is omitted the default `component || 'p'` behaviour is
  preserved, so non-auth `UIForm` callers are untouched (this is additive, like the existing optional
  `subtitle`/`showTitle` props). `UITypography` already forwards `component`
  (`ui-typography/index.tsx:9,18`), so no `UITypography` change is needed.
- Both `LoginForm` and `RegistrationForm` pass `titleComponent="h1"` to their `UIForm`
  (`login-form.tsx:21-30`, `registration-form.tsx:34-45`), giving each page **exactly one** real
  `<h1>` whose text is the form title (`getByRole('heading', { level: 1 })`, AC10). This is the
  single-line per-form addition; the rest of each form is unchanged (FR14).
- **Heading-order audit (AR1).** The notification views hardcode `component="h4"`
  (`registration-success-view.tsx:26`, `registration-error-view.tsx:26`). With a page `<h1>`, the
  jump h1 → h4 skips levels (h2, h3). Because the notification replaces the form region while shown
  (the form is `inert`), the `<h1>` and the `<h4>` are not concurrently in the visible reading order
  in a way that asserts a child relationship; nonetheless, to keep `axe` heading-order clean
  (AC10), the notification headings are changed to `component="h2"` (still `variant`-governed size,
  so **no visual change**, NFR1). This is the only edit to those two files beyond M5 (below).

### `AuthSwitcher` focus-visible theme (DESIGN NOTE) — C2 → AR2

Covered under `AuthSwitcher` above; called out separately because it is the one a11y change that
touches **style** (a `:focus-visible` rule) rather than DOM/attributes. The rule is appended in the
new `auth-switcher/styles.ts`, NOT in the MUI `ui-button/theme.ts` (which already owns the submit
button's own conformant `#404142` focus indicator from issue #48 — unrelated control). Keeping the
switcher's ring in its component-scoped `sx` avoids touching the global button theme and keeps the
change auditable. AC11 unit-tests the exact `2px solid #404142` + `outlineOffset: 2px` value; NFR13
ensures a mutated color is killed.

### `lighthouse/constants.js` (MODIFY) — point the audited page at `/sign-up`

**File:** `lighthouse/constants.js` (`constants.js:15-18`). Implements **NFR2, AC18, AC22**.

The audited `pages` array currently appends `/authentication` (`constants.js:17`). It changes to
`/sign-up` (the budget-sensitive page that was the default-register `/authentication`):

```text
normalizedBaseUrl === '/' ? '/sign-up' : `${normalizedBaseUrl}/sign-up`,
```

- `lighthouserc.mobile.js` consumes `pages` indirectly (`lighthouserc.mobile.js:1,6`); only its
  explanatory comment names `/authentication` (`lighthouserc.mobile.js:29`) — that comment is
  updated to `/sign-up`. The 0.85 mobile gate and assertions (`lighthouserc.mobile.js:31-34`) are
  unchanged (NFR2).
- `lighthouse-constants.test.ts:28` expects `['http://prod:3001', 'http://prod:3001/authentication']`
  → updated to `…/sign-up` (AC22). `auth-test-port.test.ts:36-38` asserts the `constants.js` ternary
  string contains `/authentication` → updated to the `/sign-up` ternary; `auth-test-port.test.ts:30`
  `expect(workflow).not.toContain('/authentication')` keeps its intent (the route lives in
  `constants.js`, not `performance-testing.yml`); per the context guidance it may additionally assert
  `not.toContain('/sign-up')` to keep the route out of the workflow (AC22).

## File-by-File Change Plan

Every `src`, test, and config file added / modified / deleted. `specs/**` is lint-excluded but the
two housekeeping files are listed because the epics reference them and the loop applies them.

| Path                                                                                                                | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app.tsx`                                                                                                       | **Modify.** Replace the `/authentication` route with `{ path: '/sign-up' }` + `{ path: '/sign-in' }`; add `SignUp`/`SignIn` lazy imports, remove the `Authentication` lazy import. In the existing i18n `useEffect`, add `document.documentElement.lang = i18n.language` next to `applyDir()` (AR4/M2), re-applied on `languageChanged`. (FR1-FR3, FR12, AR4)                                                                                                                                                                     |
| `src/modules/user/features/auth/components/protected-route/index.tsx`                                               | **Modify.** `<Navigate to="/sign-in" replace />` (was `/authentication`). (FR4)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `src/modules/user/features/auth/components/auth-page-layout/index.tsx`                                              | **New.** `AuthPageLayout({ children })` — `<UIBackToMain/>` + `<main>` Box + `<AuthErrorBoundary>` + `<Suspense fallback={<AuthSkeleton/>}>{children}</Suspense>` + `<UIFooter/>`, lifted from `auth/index.tsx`. (FR8, FR12)                                                                                                                                                                                                                                                                                                      |
| `src/modules/user/features/auth/types/auth-page-layout/index.ts`                                                    | **New (type-only).** `AuthPageLayoutProps { children: ReactNode }`. (NFR7)                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `src/modules/user/features/auth/components/auth-form-section/index.tsx`                                             | **New.** `AuthFormSection({ children, oauthInert, switcher })` — `<section>`/`formWrapper` shell + `InertBox` OAuth row + switcher slot, lifted from `FormSectionLayout`. Reuses `styles.formSection`/`formWrapper` + `InertBox` + `AuthProviderButtons`. (FR9, NFR4)                                                                                                                                                                                                                                                             |
| `src/modules/user/features/auth/types/auth-form-section/index.ts`                                                   | **New (type-only).** `AuthFormSectionProps { children: ReactNode; oauthInert: boolean; switcher: ReactNode }`. (NFR7)                                                                                                                                                                                                                                                                                                                                                                                                             |
| `src/modules/user/features/auth/components/auth-switcher/index.tsx`                                                 | **New.** `AuthSwitcher({ to, labelKey })` → `<UIButton to={to} disableRipple sx={authSwitcherStyles.switcher}>{t(labelKey)}</UIButton>` — real `<a href>`, no `disabled`/loading/`onIntent`. (FR5, FR6, FR7, FR10, AR7)                                                                                                                                                                                                                                                                                                           |
| `src/modules/user/features/auth/components/auth-switcher/styles.ts`                                                 | **New.** `switcher` style object: the former `formSwitcherButton` rule (verbatim) + `&:focus-visible { outline: '2px solid #404142'; outlineOffset: '2px' }` using `customColors.text.primary`. Object literal only (no functions). (AR2, C2, NFR1)                                                                                                                                                                                                                                                                               |
| `src/modules/user/features/auth/types/auth-switcher/index.ts`                                                       | **New (type-only).** `AuthSwitcherProps { to: string; labelKey: string }`. (NFR7)                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `src/modules/user/features/auth/sign-up/index.tsx`                                                                  | **New.** `SignUp` route page: `usePageTitle('sign_up.title')`; `<AuthPageLayout><SignUpFormSection/></AuthPageLayout>` with `SignUpFormSection` lazily imported. (FR1, FR11, FR12, AR3)                                                                                                                                                                                                                                                                                                                                           |
| `src/modules/user/features/auth/sign-up/sign-up-form-section.tsx`                                                   | **New (lazy chunk).** Owns `useState<RegistrationView>('form')`; renders `<AuthFormSection oauthInert={view!=='form'} switcher={<AuthSwitcher to="/sign-in" labelKey="sign_up.form.switcher_text_have_account"/>}><RegistrationForm onViewChange={setView}/></AuthFormSection>`. (FR1, FR7, FR12)                                                                                                                                                                                                                                 |
| `src/modules/user/features/auth/sign-in/index.tsx`                                                                  | **New.** `SignIn` route page: `usePageTitle('sign_in.title')`; `<AuthPageLayout><SignInFormSection/></AuthPageLayout>` with `SignInFormSection` lazily imported. (FR2, FR11, FR12, AR3)                                                                                                                                                                                                                                                                                                                                           |
| `src/modules/user/features/auth/sign-in/sign-in-form-section.tsx`                                                   | **New (lazy chunk).** `<AuthFormSection oauthInert={false} switcher={<AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account"/>}><LoginForm/></AuthFormSection>`. (FR2, FR7, FR12)                                                                                                                                                                                                                                                                                                                            |
| `src/modules/user/features/auth/hooks/use-page-title.ts`                                                            | **New (`use-*` hook).** `usePageTitle(titleKey)` sets `document.title` from `t(titleKey)` + " - VilnaCRM", re-applied on `languageChanged` with cleanup. (FR11, AR3, M1)                                                                                                                                                                                                                                                                                                                                                          |
| `src/components/ui-form/index.tsx`                                                                                  | **Modify.** Thread optional `titleComponent?: React.ElementType` through `UIForm` → `FormBody` → `FormHeader`; `FormHeader` renders `<UITypography variant="h4" component={titleComponent} …>`. Additive; default behaviour unchanged for other callers. (AR1, C1)                                                                                                                                                                                                                                                                |
| `src/components/types/ui-form/index.ts`                                                                             | **Modify (type-only).** Add `titleComponent?: React.ElementType` to `UIFormProps` and `FormBodyProps`. (AR1, NFR7)                                                                                                                                                                                                                                                                                                                                                                                                                |
| `src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx`                                  | **Modify.** Add `titleComponent="h1"` to `<UIForm<LoginUserDto>>` (the only change). (AR1)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx`                           | **Modify.** Add `titleComponent="h1"` to the `<UIForm<RegisterUserDto>>` in `RegistrationFormPanel` (the only change). (AR1)                                                                                                                                                                                                                                                                                                                                                                                                      |
| `src/modules/user/features/auth/components/form-section/auth-forms/registration-success-view.tsx`                   | **Modify.** Container `role="alert"` → `role="status"` (polite, `:110`); heading `component="h4"` → `component="h2"` (`:26`, heading-order); remove the redundant `contentBox aria-label={t('notifications.success.title')}` (`:111`) that duplicates the visible title. Keep `useFocusOnMount` focus-on-mount. (AR6, M5, AC13)                                                                                                                                                                                                   |
| `src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx`                     | **Modify.** Keep container `role="alert"` (`:111`); heading `component="h4"` → `component="h2"` (`:26`); remove the auto-`useFocusOnMount` focus inside the assertive `alert` subtree (one announcement mechanism per APG) while preserving a meaningful focus target so focus is not stranded on `<body>` under `inert` (AR5/M4). Verify focus management against the inert form. (AR5, AR6, M4, M5)                                                                                                                             |
| `src/modules/user/features/auth/index.tsx`                                                                          | **Delete.** Old `Authentication` page; chrome moved to `AuthPageLayout`, pages are `SignUp`/`SignIn`. (FR8, FR13)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `src/modules/user/features/auth/components/form-section/index.tsx`                                                  | **Delete.** The in-place toggler (`FormSection`, `AuthBody`, `SwitcherButton`, `SwitcherError`, `FormSwitcher`, `FormSectionLayout`, `useFormSectionViewModel`, `getSwitcherLabelKey`). Replaced by routing + new components. (FR13)                                                                                                                                                                                                                                                                                              |
| `src/modules/user/features/auth/components/form-section/use-login-switcher.ts`                                      | **Delete.** Toggler hook. (FR13)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `src/modules/user/features/auth/components/form-section/login-switch-actions.ts`                                    | **Delete.** `LoginSwitchController` + `LOAD_LOGIN_ERROR_KEY`. (FR13)                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/modules/user/features/auth/utils/load-login-form.ts`                                                           | **Delete.** `loginFormLoader` singleton — verified imported ONLY by the three toggler files above (`grep loginFormLoader` → those three + this file). Login is now the `/sign-in` route's own lazy chunk. (FR13, AC14)                                                                                                                                                                                                                                                                                                            |
| `src/modules/user/features/auth/utils/lazy-module-loader.ts`                                                        | **Keep (no change).** Still used by `load-registration-notification.ts` — must NOT be deleted.                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `src/modules/user/features/auth/types/form-section/index.ts`                                                        | **Delete.** `FormSectionLayoutProps` (toggler-only). (FR13)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `src/modules/user/features/auth/types/form-section/login-switch-actions.ts`                                         | **Delete.** `SwitchDeps`, `LoadLoginErrorKey`/`LoadLoginErrorKeyValue` (toggler-only). (FR13)                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `src/modules/user/features/auth/types/form-section/use-login-switcher.ts`                                           | **Delete.** `LoginSwitcher` (toggler-only). (FR13)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `src/modules/user/features/auth/components/form-section/styles.ts`                                                  | **Modify.** Remove `formSwitcherError` (`:42-56`) and the now-unused `paletteColors` import (`:7`); the `formSwitcherButton` rule moves to `auth-switcher/styles.ts`. Keep `formSection`/`formWrapper` (re-exports still consumed by `auth-form-section`) and the `fieldGapMargins` re-export. (FR13)                                                                                                                                                                                                                             |
| `src/modules/user/features/auth/components/form-section/types.ts`                                                   | **Modify.** Remove `AuthMode` (`:3`); keep `RegistrationView` (`:4`, still used by the sign-up section + `RegistrationForm`) and `AuthVariants`. (FR13)                                                                                                                                                                                                                                                                                                                                                                           |
| `src/modules/user/features/auth/i18n/en.json`                                                                       | **Modify (optional).** `sign_in.errors.load_failed` (`:72`) becomes unused (only the deleted in-place switch read it); leave OR remove. If removed, remove from both locales for parity. `sign_up.errors.load_failed` (`:63`) stays (used by `AuthErrorBoundary` paths). (NFR9)                                                                                                                                                                                                                                                   |
| `src/modules/user/features/auth/i18n/uk.json`                                                                       | **Modify (optional).** Mirror the `en.json` `load_failed` decision; keep en/uk parity. (NFR9)                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lighthouse/constants.js`                                                                                           | **Modify.** `/authentication` → `/sign-up` in the `pages` ternary (`:17`). (NFR2, AC18, AC22)                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `lighthouse/lighthouserc.mobile.js`                                                                                 | **Modify.** Update the `/authentication` comment (`:29`) to `/sign-up`. (AC22)                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `tests/unit/app.test.tsx`                                                                                           | **Modify.** `pushState('/authentication')` (`:21`) → render `/sign-up` (and a `/sign-in` case); rename the mocked module + asserted text from `'@/modules/user/features/auth'` to the new page modules; assert `document.documentElement.lang` after `languageChanged` (AC9). Add a `/sign-in` render assertion and assert `/authentication` matches no auth page (AC3). (AC3, AC8, AC9, NFR10)                                                                                                                                   |
| `tests/unit/app-root.test.tsx`                                                                                      | **Modify.** Update the mocked auth page module path(s) (`:45-48`) to the new pages; the `/` protected-outlet assertion stays. (NFR10)                                                                                                                                                                                                                                                                                                                                                                                             |
| `tests/unit/components/protected-route.test.tsx`                                                                    | **Modify.** Route element + redirect target `/authentication` → `/sign-in` (`:22,35`); assert the unauthenticated render lands on the `/sign-in` element (AC4). Note: the mock stub `data-testid` here is test-only and stays at warn-level (NFR5/R13). (AC4)                                                                                                                                                                                                                                                                     |
| `tests/unit/modules/user/features/auth/index.test.tsx`                                                              | **Delete.** Old `Authentication` shell test; the chrome assertions port to a new `auth-page-layout` test. (NFR10)                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `tests/unit/modules/user/features/auth/components/auth-page-layout/index.test.tsx`                                  | **New.** Header/main/skeleton/footer-while-loading + error-boundary-fallback assertions ported from the deleted `index.test.tsx` (using semantic queries / stable ids per NFR5). 100% coverage of the new layout (NFR10).                                                                                                                                                                                                                                                                                                         |
| `tests/unit/modules/user/features/auth/components/auth-form-section/index.test.tsx`                                 | **New.** Renders children + OAuth row (`InertBox` `inert` toggled by `oauthInert`) + switcher slot; covers both `oauthInert` branches. (NFR10)                                                                                                                                                                                                                                                                                                                                                                                    |
| `tests/unit/modules/user/features/auth/components/auth-switcher/index.test.tsx`                                     | **New.** `getByRole('link', { name })` has the correct `href` (`/sign-in` or `/sign-up`), non-empty; no `disabled`/`aria-pressed`/`aria-current`; the `:focus-visible` outline resolves to `2px solid #404142` + `outlineOffset: 2px` (exact value, NFR13). (AC5, AC6, AC11)                                                                                                                                                                                                                                                      |
| `tests/unit/modules/user/features/auth/sign-up/index.test.tsx`                                                      | **New.** `/sign-up` renders Registration (`<h1>` "Registration"), the swap link to `/sign-in`, OAuth row; `document.title` set + updates on `languageChanged`; no login code imported (mock assertion). (AC1, AC5, AC8, AC10)                                                                                                                                                                                                                                                                                                     |
| `tests/unit/modules/user/features/auth/sign-in/index.test.tsx`                                                      | **New.** `/sign-in` renders Login (`<h1>` "Authentication"), the swap link to `/sign-up`, OAuth row; `document.title`; no registration code imported. (AC2, AC5, AC8, AC10)                                                                                                                                                                                                                                                                                                                                                       |
| `tests/unit/modules/user/features/auth/hooks/use-page-title.test.tsx`                                               | **New.** `usePageTitle` sets `document.title` from the i18n key and re-applies on `languageChanged`; cleanup unsubscribes. (AC8, NFR13)                                                                                                                                                                                                                                                                                                                                                                                           |
| `tests/unit/modules/user/features/auth/components/form-section/index.test.tsx`                                      | **Delete.** Toggler tests (deleted module). (NFR10)                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `tests/unit/modules/user/features/auth/components/form-section.test.tsx`                                            | **Delete.** Toggler render/switch tests (deleted module); behavior re-covered by the new page/section/switcher tests. (NFR10)                                                                                                                                                                                                                                                                                                                                                                                                     |
| `tests/unit/modules/user/features/auth/components/form-section/login-switch-actions.test.ts`                        | **Delete.** `LoginSwitchController` tests (deleted module). (NFR10)                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `tests/unit/components/ui-form/index.test.tsx`                                                                      | **Modify.** Add a `titleComponent="h1"` assertion (`getByRole('heading', { level: 1 })`) and confirm the default (no `titleComponent`) still renders a `<p>` for non-auth callers. (AC10)                                                                                                                                                                                                                                                                                                                                         |
| `tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx`                      | **Modify.** Assert the title is a real `<h1>` (`titleComponent="h1"`); fix any harness coupling to the deleted `FormSection`. (AC10, AC15)                                                                                                                                                                                                                                                                                                                                                                                        |
| `tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-form.test.tsx`               | **Modify.** Assert the title is a real `<h1>`; fix any `FormSection` coupling. (AC10, AC15)                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-notification.test.tsx`       | **Modify.** Success → `role="status"`, error → `role="alert"`; headings `component="h2"`; no redundant `aria-label`; no auto-focus inside the assertive subtree; error keeps a meaningful focus target. Assert exact role/politeness values (NFR13). (AC13, AC12)                                                                                                                                                                                                                                                                 |
| `tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-notification.i18n.test.tsx`  | **Verify (unchanged).** Asserts only localized text content (i18n strings) and back/retry/`onShown`/`onBack` behaviour — it queries by `getByText`/`getByRole('button')` and asserts **neither** role/politeness **nor** heading level. The M5 (role/politeness) and heading-order (`h4`→`h2`) changes do not affect it. (NFR10)                                                                                                                                                                                                  |
| `tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-notification.styles.test.ts` | **Verify (unchanged).** Asserts only `notificationSection.borderRadius === '16px'`; asserts neither role/politeness nor heading level, so the M5 / heading-order changes do not affect it. (NFR10)                                                                                                                                                                                                                                                                                                                                |
| `tests/unit/tooling/lighthouse-constants.test.ts`                                                                   | **Modify.** Expected `pages` `…/authentication` → `…/sign-up` (`:28`). (AC22)                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `tests/unit/tooling/auth-test-port.test.ts`                                                                         | **Modify.** Update the `constants.js` `/authentication` ternary expectation to `/sign-up` (`:36-38`); keep `workflow not.toContain('/authentication')` (`:30`), optionally add `not.toContain('/sign-up')`. (AC22)                                                                                                                                                                                                                                                                                                                |
| `tests/unit/tooling/performance-serving.test.ts`                                                                    | **Modify.** Replace the `Authentication = lazy(...)` expected string (`:55-57,61`) with the new `SignUp`/`SignIn` lazy imports; keep the route-level-code-splitting intent (NFR2). (AC18)                                                                                                                                                                                                                                                                                                                                         |
| `tests/integration/...` (auth store/repo/skeleton suites)                                                           | **Verify (mostly unchanged).** Route-agnostic; the auth store is untouched so the `clearInstances()` module-load-captured-store spy hazard is NOT triggered. Ensure every NEW src file is covered to hold 100% over `src/**` and that deleted-file tests are removed. (NFR10, AC17)                                                                                                                                                                                                                                               |
| `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/login-form.spec.ts`                        | **Modify.** `AUTH_URL='/authentication'` → navigate directly to `/sign-in` (drop `gotoLogin`'s switcher click, `:8,18-21`); switcher locator `page.locator('button', {hasText})` is no longer needed to reach login. (FR2, AC2)                                                                                                                                                                                                                                                                                                   |
| `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/constants/constants.ts`                    | **Modify.** `REGISTRATION_URL='/authentication'` → `/sign-up` (`:10`). (FR1)                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `tests/e2e/modules/user/features/auth/components/form-section/auth-forms/registration-form.spec.ts`                 | **Modify.** Uses `REGISTRATION_URL` (`:17,39,62`) → resolves to `/sign-up` via the constants change; assert `toHaveURL('/sign-up')` (AC1). Also update the failure-focus assertion `active.querySelector('h4')` (`:133`, in the "moves focus to a meaningful element (not body) after a registration failure" test) to `querySelector('h2')` (or make it heading-level-agnostic, e.g. `querySelector('h1,h2,h3,h4,h5,h6')`) to match the notification heading moving from `component="h4"` to `component="h2"` (AR1). (AC1, AC12) |
| `tests/e2e/components/skeletons/auth-skeleton.spec.ts`                                                              | **Modify.** `AUTH_URL='/authentication'` → `/sign-up` (`:8`). Skeleton behavior unchanged (it is `AuthPageLayout`'s Suspense fallback). (FR1, AC1)                                                                                                                                                                                                                                                                                                                                                                                |
| `tests/e2e/modules/back-to-main.spec.ts`                                                                            | **Modify.** `page.goto('/authentication')` + `toHaveURL(/\/authentication$/)` → `/sign-up` (`:15-16`). (FR1)                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `tests/e2e/modules/user/features/auth/swap-navigation.spec.ts`                                                      | **New.** From `/sign-up`, `getByRole('link', { name: switcher_text_have_account })`, click → `toHaveURL(/\/sign-in$/)`; from `/sign-in`, the reciprocal link → `toHaveURL(/\/sign-up$/)`. Assert both directions and that the control is a link (`<a href>`). (FR5, AC5, NFR13)                                                                                                                                                                                                                                                   |
| `tests/visual/constants.ts`                                                                                         | **Modify.** `PAGES` (`:92-95`): replace `AUTH: '/authentication'` with `SIGN_UP: '/sign-up'` and `SIGN_IN: '/sign-in'`. (NFR1, NFR11)                                                                                                                                                                                                                                                                                                                                                                                             |
| `tests/visual/take-visual-snapshot.ts`                                                                              | **Verify.** `if (url === PAGES.HOME)` seeds a token (`:33-35`); `/sign-up` and `/sign-in` are public and need NO token — confirm no seeding branch is added. (NFR11)                                                                                                                                                                                                                                                                                                                                                              |
| `tests/visual/visual-comparison.authentication.spec.ts`                                                             | **Rename → split.** Becomes `visual-comparison.sign-up.spec.ts` (snapshots `PAGES.SIGN_UP`) plus a new `visual-comparison.sign-in.spec.ts` (snapshots `PAGES.SIGN_IN`) — login was only reachable via the toggle before; it now has its own route. (NFR1, NFR11, AC16)                                                                                                                                                                                                                                                            |
| `tests/visual/visual-comparison.sign-in.spec.ts`                                                                    | **New.** Sign-in route visual snapshots across `screenSizes`. (NFR11, AC16)                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `tests/visual/visual-comparison.auth-skeleton.spec.ts`                                                              | **Modify.** `PAGES.AUTH` → `PAGES.SIGN_UP` (`:15`). (NFR11)                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `tests/visual/visual-comparison.authentication.spec.ts-snapshots/*`                                                 | **Regenerate/rename.** Baseline PNGs are renamed to the new spec/page keys (`make test-visual-update`, Docker + prod stack). New `/sign-up` baseline must be visually identical to today's register state; new `/sign-in` baseline matches today's login state (modulo the visual-neutral a11y changes). (NFR11, AC16)                                                                                                                                                                                                            |
| `tests/visual/visual-comparison.sign-in.spec.ts-snapshots/*`                                                        | **New baselines.** Generated for the sign-in route (login state). (NFR11, AC16)                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `tests/visual/visual-comparison.auth-skeleton.spec.ts-snapshots/*`                                                  | **Verify/regenerate.** Skeleton PNGs unchanged in content; regenerate only if the route-key change alters file resolution. (NFR11)                                                                                                                                                                                                                                                                                                                                                                                                |
| `tests/memory-leak/tests/auth-skeleton.js`                                                                          | **Modify.** `pushState('/authentication')` → `/sign-up` (`:14`); baseline `/__memlab_away__` unchanged. (NFR10)                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `tests/memory-leak/tests/signup.js`                                                                                 | **Modify.** `ROUTE_PATH='/authentication'` → `/sign-up` (`:8`). The in-page mode-switch helpers (`ensureRegistrationForm`/`restoreLoginView`/`clickSwitcherByText`, `:52-87`) targeted the old toggler `<button>`; on `/sign-up` the form is registration by default, so drop the switch-back-to-login dance (the swap is now cross-route). Simplify to a single-route signup fill scenario. (NFR10)                                                                                                                              |
| `tests/load/...` (k6 signup)                                                                                        | **Verify (unchanged).** `tests/load/signup*` hit the GraphQL/mock API, not the SPA route; `auth-test-port.test.ts:65-95` asserts the signup load files + `config.json.dist endpoints.signup` exist — none reference the SPA URL. No change. (NFR10)                                                                                                                                                                                                                                                                               |
| `_bmad/config.yaml`                                                                                                 | **Modify (housekeeping).** `planning_artifacts` / `implementation_artifacts` → `specs/sign-up-sign-in-pages/...` (currently `makefile-playwright-targets`, `:9-10`). Applied by the loop.                                                                                                                                                                                                                                                                                                                                         |
| `specs/README.md`                                                                                                   | **Modify (housekeeping).** Add a `sign-up-sign-in-pages` row to the "Current Specs" table (`:18-23`). Applied by the loop.                                                                                                                                                                                                                                                                                                                                                                                                        |

## Gate-Compliance Notes

- **rca per-file ≤10 functions/closures → new files (NFR3).** The deleted
  `form-section/index.tsx` packed eight functions (`getSwitcherLabelKey`, `AuthBody`,
  `SwitcherButton`, `SwitcherError`, `FormSwitcher`, `FormSectionLayout`, `useFormSectionViewModel`,
  `FormSection`) into one file — near the cap. The replacement spreads responsibilities across
  separate small files: `auth-page-layout/index.tsx` (1 fn), `auth-form-section/index.tsx` (1 fn),
  `auth-switcher/index.tsx` (1 fn) + `auth-switcher/styles.ts` (0 fns, object literal),
  `sign-up/index.tsx` + `sign-up/sign-up-form-section.tsx` (1 fn each), `sign-in/index.tsx` +
  `sign-in/sign-in-form-section.tsx` (1 fn each), and `hooks/use-page-title.ts` (1 hook). Each is
  well under the ≤10 cap and the LLOC/PLOC/SLOC file caps (≤120/300/350). The `app.tsx` effect gains
  one assignment (no new closure/exit point); `usePageTitle` is its own hook so the title concern
  does not push the app effect past Cognitive ≤15 / ≤3 exit points. The `ui-form/index.tsx`
  `titleComponent` thread is additive (no new function). Each new prop type is its own type-only
  file.
- **jscpd DRY → shared components (NFR4).** The page chrome, the section shell, and the switcher are
  each a single shared component consumed by both pages; the two pages and two form sections differ
  only by a route literal, an i18n key, and a constant `oauthInert` — well under the 75-token /
  5-line clone floor (`.jscpd.json`). Without `AuthPageLayout`/`AuthFormSection`/`AuthSwitcher`, the
  ~10-line chrome and the section/`InertBox` blocks would be >75-token clones across `SignUp`/`SignIn`.
  Deduplication is by extraction, never by ignore directives.
- **Lighthouse budget → lazy route chunks + container-free paint (NFR2).** Both pages are lazy at the
  route level (`app.tsx`), and each form section is a further lazy chunk Suspended behind
  `AuthSkeleton` — so `/sign-up` ships no login code and `/sign-in` ships no registration code
  (FR12). No DI container, Apollo, or zod is added to the page/layout/switcher chunks; the auth state
  primitives (`auth-var`, `use-auth-token`) stay container-free. The lazy form section is NOT
  eager-imported. `performance-serving.test.ts` continues to assert route-level splitting (updated
  strings). `lighthouse/constants.js` points the audited page at `/sign-up`.
- **Type-only files (#88, NFR7).** Every new prop type (`AuthPageLayoutProps`,
  `AuthFormSectionProps`, `AuthSwitcherProps`) lives in a dedicated `types/<area>/index.ts`, imported
  via `import type`; the `titleComponent` addition goes in `types/ui-form/index.ts`. Component files
  declare no `interface`/`type`. Enforced by ESLint + dependency-cruiser
  (`type-files-imported-as-type-only`, `type-files-no-runtime-imports`).
- **No free functions in `.ts` (#100, NFR6).** All new behavioral units are React components
  (`.tsx`, exempt) or `use-*` hooks (`use-page-title.ts`, exempt). No new non-React `.ts` logic file
  introduces a `static` member or a standalone/`export const` arrow function. The deleted
  `login-switch-actions.ts` (a class, compliant) and `load-login-form.ts` (a `const` singleton) are
  removed, not modified.
- **No `data-testid`; semantic selectors (NFR5).** Source ships none. The swap link is located by
  `getByRole('link', { name })`, the `<h1>` by `getByRole('heading', { level: 1 })`, the OAuth row by
  its existing `id="auth-provider-buttons-container"` only as a last resort. The pre-existing mock
  stub `data-testid` in `protected-route.test.tsx`/`app.test.tsx` is test-only (warn-level) and is
  not introduced into `src/**` (R13).
- **No suppressions / no new inline comments (NFR12).** Every gate is satisfied by structure (new
  files, shared components, type-only files), not by `eslint-disable`, `@ts-ignore`,
  `prettier-ignore`, or markdownlint/editorconfig disables; rationale lives in this doc and the PR.
- **i18n parity (NFR9).** All keys used already exist in both `en.json` and `uk.json`
  (`sign_up.title`, `sign_in.title`, `sign_up.form.switcher_text_have_account` /
  `…_no_account`). If `sign_in.errors.load_failed` is removed it is removed from both locales.
- **commitlint / squash-merge (NFR14).** Each commit header ≤100 chars with a `(#31)` scope; the
  `Closes #31` reference rides the squash message (squash-merge-only; the `cubic` bot rewrites the PR
  body and strips manual closers).

## Test Strategy

- **Unit (Jest, jsdom).**
  - **Routing/redirect:** `app.test.tsx` renders `/sign-up` and `/sign-in` and asserts
    `/authentication` resolves to no auth page (AC3); the language-change test asserts
    `document.documentElement.lang` (AC9). `protected-route.test.tsx` asserts the unauthenticated
    render lands on the `/sign-in` element (AC4). Exact route literals asserted (NFR13).
  - **New components:** `auth-page-layout` (header/main/skeleton/footer + error-boundary, ported from
    the deleted `index.test.tsx`), `auth-form-section` (both `oauthInert` branches),
    `auth-switcher` (`getByRole('link')` href/name, no `disabled`/`aria-pressed`/`aria-current`,
    exact `:focus-visible` `2px solid #404142` + `outlineOffset: 2px`) (AC5, AC6, AC11).
  - **Pages:** `sign-up` / `sign-in` each assert one real `<h1>` with the correct title, the swap
    link target, the OAuth row, per-route `document.title` (+ `languageChanged`), and a chunk-isolation
    mock assertion that login code is absent from `/sign-up` and registration code from `/sign-in`
    (AC1, AC2, AC8, AC10).
  - **UIForm:** `titleComponent="h1"` renders a real heading; omitting it preserves the `<p>` default
    (AC10).
  - **Notifications:** success `role="status"`, error `role="alert"`, headings `component="h2"`, no
    redundant `aria-label`, no auto-focus inside the assertive subtree, error keeps a meaningful focus
    target — asserted by exact role/politeness strings + `jest-axe` (no duplicate/competing live
    region, no heading-order skip) (AC13).
  - **Tooling:** `lighthouse-constants.test.ts`, `auth-test-port.test.ts`, `performance-serving.test.ts`
    expected strings updated to `/sign-up` and the new lazy imports (AC18, AC22).
  - Deleted-module tests (`form-section/index.test.tsx`, `form-section.test.tsx`,
    `login-switch-actions.test.ts`, auth `index.test.tsx`) are removed.
- **Integration (Jest, 100% over `src/**`).** Route-agnostic store/repo/skeleton suites are verified
unchanged (the auth store is untouched, so the `clearInstances()`spy hazard is not triggered).
Every new src file (layout, section, switcher, two pages, two sections,`use-page-title`) is fully
  covered by the unit/integration render paths so the global 100% gate holds; deleted-file tests are
  removed in the same change (NFR10, AC17).
- **E2E (Playwright + Mockoon).** Update `AUTH_URL`/`REGISTRATION_URL` to `/sign-up` and navigate
  `/sign-in` directly (no toggler click). New `swap-navigation.spec.ts` asserts the link flips
  `/sign-up` ↔ `/sign-in` in both directions via `getByRole('link', { name })` + `toHaveURL` (AC5).
  The login submit/busy/error specs and the registration-form spec are preserved on the new routes
  (AC15). The `registration-form.spec.ts` is **modified** (not merely route-verified): besides
  resolving `REGISTRATION_URL` to `/sign-up`, its failure-focus assertion `active.querySelector('h4')`
  (`registration-form.spec.ts:133`) is updated to `querySelector('h2')` (or made heading-level-agnostic)
  so it matches the notification heading moving `component="h4"` → `component="h2"` (AR1). AC12: assert
  focus lands on a meaningful element on the registration error view (not `<body>`) while the form is
  `inert` (WCAG 2.4.3). `back-to-main.spec.ts` goto + URL updated.
- **Visual (Playwright) + baseline regen (NFR11).** `tests/visual/constants.ts` `PAGES` gets
  `SIGN_UP`/`SIGN_IN`; the authentication spec is split into `sign-up` + `sign-in` specs (login now
  has its own route); `auth-skeleton` spec points at `PAGES.SIGN_UP`. Baselines are regenerated via
  `make test-visual-update` (Docker + prod stack) and MUST be visually identical to today's auth page
  (register / login) modulo the visual-neutral a11y changes — C1/M1/M2/M4/M5 are DOM/attribute-only
  and C2 is `:focus-visible`-only, so the resting-state PNGs match (AC11, AC16). This is a real
  execution dependency on a working Docker/browser environment (R8).
- **Memory-leak (MemLab).** `auth-skeleton.js` and `signup.js` route paths → `/sign-up`; `signup.js`
  drops the cross-mode switcher dance (the swap is now cross-route; `/sign-up` is registration by
  default) and becomes a single-route signup scenario (NFR10).
- **Load (k6).** Unchanged: the signup load tests hit the GraphQL/mock API, not the SPA route;
  `auth-test-port.test.ts` still finds the signup load files and `config.json.dist endpoints.signup`.
- **Lighthouse (CI).** The mobile run audits `/sign-up` via the updated `lighthouse/constants.js`;
  the ≥0.85 gate must hold or improve (the split removes login code from `/sign-up`) (AC18, NFR2).
- **Mutation (Stryker).** Exact-value assertions on the route literals (`/sign-up`, `/sign-in`), the
  swap-link `href`, the notification politeness values (`status`/`alert`), the `#404142` ring, the
  `<h1>` tag, `document.title`, and `<html lang>` ensure no surviving mutant on the new branches
  (NFR13, AC21).

## Rollout / Sequencing

1. **Reusable primitives first.** Add `AuthSwitcher` (+ `styles.ts` with the `#404142`
   `:focus-visible` ring) and its type file; add `AuthFormSection` + type file; add `AuthPageLayout`
   - type file. Each is self-contained and unit-tested in isolation (AC7, AC11).
2. **`UIForm` real-`<h1>` capability.** Thread `titleComponent` through `UIFormProps`/`FormBodyProps`
   → `FormHeader`; it is **optional**, so existing callers keep compiling. Add the `<h1>` unit
   assertion (AC10).
3. **Page sections + pages.** Add `SignUpFormSection`/`SignInFormSection` (consuming the shared
   section + switcher) and `SignUp`/`SignIn` (consuming `AuthPageLayout` + the `usePageTitle` hook).
   Add `use-page-title.ts`. Add `titleComponent="h1"` to both forms.
4. **Routing + redirect + lang.** Rewrite `app.tsx` routes (add `/sign-up`, `/sign-in`; remove
   `/authentication`), add `<html lang>` to the i18n effect; flip `ProtectedRoute` to `/sign-in`.
5. **Notification a11y (M4/M5).** Success → `role="status"` + heading `h2` + drop redundant
   `aria-label`; error keeps `role="alert"` + heading `h2`, drop auto-focus inside the assertive
   subtree while preserving a meaningful focus target.
6. **Delete the toggler.** Remove `auth/index.tsx`, `form-section/index.tsx`,
   `use-login-switcher.ts`, `login-switch-actions.ts`, `utils/load-login-form.ts`, the three
   `types/form-section/*`, `styles.formSwitcherError` + `paletteColors` import, and `AuthMode`.
   Verify no orphan importer (`grep` + `make lint-tsc` + dep-cruiser) (AC14). Keep
   `lazy-module-loader.ts` (still used by registration-notification).
7. **Config / CI.** Update `lighthouse/constants.js` (`/sign-up`) and the `lighthouserc.mobile.js`
   comment; update the tooling unit tests (`lighthouse-constants`, `auth-test-port`,
   `performance-serving`).
8. **Tests by layer.** Unit (new component/page/hook tests; delete toggler tests; UIForm h1;
   notification roles) → e2e (route renames + new swap-nav spec + error-focus) → memory-leak route
   paths → visual `PAGES` + split specs → **regenerate visual baselines** (`make test-visual-update`,
   Docker) → confirm Lighthouse CI.
9. **Housekeeping (loop).** Point `_bmad/config.yaml` at the new spec folder; add the
   `sign-up-sign-in-pages` row to `specs/README.md`.
10. **Gate sweep.** `make format` then `make lint` (eslint, tsc, `make lint-dup`, `make
lint-metrics`), dependency-cruiser, unit + integration (100% over `src/**`), e2e + visual,
    Stryker, Lighthouse — all green, no suppressions, before opening/refreshing the PR (commit
    header ≤100 chars, `(#31)` scope, `Closes #31` in the squash message).

This sequence is internally consistent: `titleComponent` is **optional**, so step 2 does not break
existing callers; the new components/pages (steps 1-3) compile against the still-present old route
until step 4 swaps routing; and the toggler deletion (step 6) only runs after the pages that replace
it exist and are wired. The only callers of the deleted modules are the toggler files themselves
(verified by `grep loginFormLoader` → the three toggler files + its own definition), so no unedited
consumer is left dangling.

## Out-of-Scope Confirmation

Unchanged by this work: login/registration form fields, validators
(`form-section/validations`), submit handlers (`use-login-submitter`, `useRegistrationForm`), the
registration notification **flow** logic (only the M4/M5 a11y attributes change), the auth store,
the repositories, the `AuthErrorBoundary`, the page-load `AuthSkeleton`, the OAuth provider buttons
and the `inert` primitive on the OAuth row, and the submit-button loader (issue #48). No back-compat
alias/redirect for `/authentication` (FR3, D-REMOVE). No client-side React Router `<Link>` for the
swap — the established full-document `UIButton`/`UIBackToMain` `<a href>` with conformant native
focus reset is used (AR7, Risk R2). `lazy-module-loader.ts` is retained (still used by
`load-registration-notification.ts`) — only `load-login-form.ts` is deleted. The two pixel-changing
a11y items are NOT implemented here: **D1** (switcher color `#969B9D`, 2.81:1) stays as-is unless the
design owner resolves the Open Decision, and **D2** (explicit link-destination text) is a tracked
follow-up. The recommended a11y follow-ups R1 (decorative confetti `aria-hidden`), a11y follow-up R2
(hover/focus underline after any color fix), R3 (`UIBackToMain` hardcoded `aria-label="Back"`), and R4
(skip link)
are out of scope; R5 (the obsolete in-place `Suspense fallback={<Box aria-hidden/>}`) disappears
naturally with the toggler deletion. The k6 signup load tests' API target (GraphQL/mock) is
unchanged.
