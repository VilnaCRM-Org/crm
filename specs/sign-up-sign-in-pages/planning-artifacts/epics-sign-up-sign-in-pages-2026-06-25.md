---
status: 'complete'
workflowType: 'epics'
project_name: 'crm'
date: '2026-06-25'
issue: 'https://github.com/VilnaCRM-Org/crm/issues/31'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/31'
  - 'specs/sign-up-sign-in-pages/planning-artifacts/prd-sign-up-sign-in-pages-2026-06-25.md'
  - 'specs/sign-up-sign-in-pages/planning-artifacts/architecture-sign-up-sign-in-pages-2026-06-25.md'
  - 'src/app.tsx'
  - 'src/modules/user/features/auth/index.tsx'
  - 'src/modules/user/features/auth/components/protected-route/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/index.tsx'
  - 'src/modules/user/features/auth/components/form-section/styles.ts'
  - 'src/modules/user/features/auth/components/form-section/types.ts'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-success-view.tsx'
  - 'src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx'
  - 'src/modules/user/features/auth/utils/load-login-form.ts'
  - 'src/modules/user/features/auth/types/form-section/index.ts'
  - 'src/modules/user/features/auth/i18n/en.json'
  - 'src/modules/user/features/auth/i18n/uk.json'
  - 'src/components/ui-button/index.tsx'
  - 'src/components/ui-back-to-main/index.tsx'
  - 'src/components/ui-typography/index.tsx'
  - 'src/components/ui-form/index.tsx'
  - 'src/components/types/ui-form/index.ts'
  - 'src/styles/colors.ts'
  - 'lighthouse/constants.js'
  - 'lighthouse/lighthouserc.mobile.js'
  - 'tests/visual/constants.ts'
  - 'tests/unit/app.test.tsx'
  - 'tests/unit/components/protected-route.test.tsx'
  - 'tests/unit/tooling/lighthouse-constants.test.ts'
  - 'tests/unit/tooling/auth-test-port.test.ts'
  - 'tests/unit/tooling/performance-serving.test.ts'
  - 'tests/e2e/modules/back-to-main.spec.ts'
  - 'tests/e2e/components/skeletons/auth-skeleton.spec.ts'
  - 'tests/e2e/modules/user/features/auth/components/form-section/auth-forms/login-form.spec.ts'
  - 'tests/e2e/modules/user/features/auth/components/form-section/auth-forms/constants/constants.ts'
  - 'tests/memory-leak/tests/auth-skeleton.js'
  - 'tests/memory-leak/tests/signup.js'
  - '_bmad/config.yaml'
  - 'specs/README.md'
---

# Epics & Stories - Split Auth into Routed /sign-up and /sign-in Pages (Issue #31)

**Author:** BMad (Product Manager) **Date:** 2026-06-25 **Source:** VilnaCRM-Org/crm#31

## Overview

This document decomposes the auth-page split into **one Epic** and a sequence of small,
vertically-sliced stories. Each story is sized to stay under the rca metrics gate (NFR3:
≤10 functions/closures per file, Cyclomatic ≤10, Cognitive ≤15, ABC ≤17, ≤3 args, ≤3 exit
points, function LLOC ≤10 / file LLOC ≤120) and to land a shippable slice with its own
tests. Stories are grounded strictly in the real files confirmed during planning — the
old in-place toggler (`src/modules/user/features/auth/components/form-section/index.tsx`,
`use-login-switcher.ts`, `login-switch-actions.ts`, `utils/load-login-form.ts`) is
**replaced** by route navigation, not preserved.

The design is deliberately **centralized** to satisfy the jscpd DRY gate (NFR4) and the
issue's "clean, reusable, modular" mandate (issue AC2): the page chrome, the form-section
shell, and the swap link are each extracted **once** into a new reusable component —
`AuthPageLayout`, `AuthFormSection`, `AuthSwitcher` — consumed by both pages. Two thin
route-level pages (`SignUp`, `SignIn`) wrap their own lazily-imported form section behind
the existing `AuthSkeleton` Suspense fallback, preserving today's `Authentication` (route
chunk) + `FormSection` (inner lazy chunk) shape while removing login code from `/sign-up`
and registration code from `/sign-in` (better for the mobile Lighthouse budget, NFR2).

The mandatory accessibility-lead review returned **NO-SHIP** until a set of
**visual-neutral** blockers are addressed; this Epic folds them into stories: one real
`<h1>` per page via a `titleComponent` capability on `UIForm`→`FormHeader` (C1/AR1), a
`#404142` `:focus-visible` ring on `AuthSwitcher` (C2/AR2), per-route `document.title` +
`<html lang>` (M1/M2 → AR3/AR4), and corrected notification politeness/focus (M4/M5 →
AR5/AR6). All are DOM/attribute/`:focus-visible`-only, so the resting-state screenshot is
unchanged (NFR1). The two pixel-changing a11y items — switcher color (D1) and explicit
link text (D2) — are **NOT** implemented here; they remain gated behind the PRD's Open
Decisions.

Requirement IDs (FR1-FR14, NFR1-NFR14, AR1-AR7, AC1-AC22, D1-D2) are defined in the PRD
and referenced verbatim here for traceability. The user-confirmed decisions D-URL
(`/sign-up` + `/sign-in`), D-REDIRECT (protected → `/sign-in`), and D-REMOVE (drop
`/authentication`, no alias) are fixed and appear inside FR1-FR4, not as Open Decisions.

## Epic 1: Split the auth page into routed /sign-up and /sign-in pages

**Epic goal.** Replace the single in-place-toggling authentication page
(`/authentication`, `src/modules/user/features/auth/index.tsx` + the
`form-section/index.tsx` toggler) with two independently-routed, lazily-loaded pages —
`/sign-up` (registration) and `/sign-in` (login) — whose under-form swap control is a
real, URL-changing `<a href>` link (via `UIButton to=…`, mirroring `UIBackToMain`). Do
this by extracting three reusable components (`AuthPageLayout`, `AuthFormSection`,
`AuthSwitcher`), wiring two thin pages, removing `/authentication` entirely (D-REMOVE),
redirecting protected access to `/sign-in` (D-REDIRECT), and folding the visual-neutral
a11y blockers (real `<h1>`, `#404142` focus ring, per-route title, `<html lang>`,
notification focus/politeness) into the change — keeping the rendered UI pixel-identical
to today modulo the justified, design-owner-gated a11y changes, and refactoring every
test layer plus the Lighthouse/CI config to the new routes within all existing repo gates,
with no new dependency, no suppressions, and no new inline comments.

**Epic scope.** The auth feature under `src/modules/user/features/auth/`: routing
(`src/app.tsx`), the protected route, the new layout/section/switcher/page components, the
`UIForm`→`FormHeader` `titleComponent` thread, the registration notification a11y
attributes (M4/M5 only — no logic change), the toggler deletion, the Lighthouse constants

- tooling tests, and the full test refactor across unit, integration, e2e, visual,
  memory-leak, and load layers plus visual baseline regeneration. Out of scope and unchanged:
  login/registration form fields, validators (`form-section/validations`), submit handlers,
  the registration notification **flow** logic, `useRegistrationForm`, the auth store, the
  repositories, `AuthErrorBoundary`, the page-load `AuthSkeleton`, the OAuth provider buttons
  and the `inert` primitive on the OAuth row, the submit-button loader (issue #48),
  `lazy-module-loader.ts` (still used by `load-registration-notification.ts`), the k6 signup
  load test API target, D1 (switcher color), D2 (explicit link text), and the recommended
  follow-ups R1-R5.

**Epic acceptance.** AC1-AC22 are all met; `make format` then `make lint` (ESLint, tsc,
`make lint-dup`, `make lint-metrics`), dependency-cruiser, unit + integration (100% over
`src/**`), e2e, visual (regenerated `/sign-up` + `/sign-in` baselines), memory-leak,
Stryker mutation, and the Lighthouse CI gate (~0.85 on `/sign-up`) all pass with no new
suppressions, no `data-testid` in `src/**`, and no new inline code comments. The commit
header is ≤100 chars with a `(#31)` scope and the `Closes #31` reference rides the
squash message (squash-merge-only repo; the `cubic` bot rewrites the PR body).

---

### Story 1.1: Extract `AuthSwitcher` — the swap control as a real link with a conformant focus ring

**User story.** As a keyboard / assistive-technology user, I want the "switch to the other
auth page" control to be a real link with a visible focus indicator, so it is announced as
a "link", navigates (changes the URL), opens in a new tab, and is never lost when I tab to
it.

**Description.** Add `src/modules/user/features/auth/components/auth-switcher/index.tsx`
(a `.tsx` component, exempt from the no-free-function gate, NFR6):

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

`to` is **always** a non-empty literal route (`'/sign-up'` or `'/sign-in'`), so
`resolveLinkTarget(to)` (`ui-button/index.tsx:8-18`) yields a non-empty string,
`resolvedComponent` becomes `'a'` (`ui-button/index.tsx:28`), and a real `<a href>` renders
— exactly the `UIBackToMain` pattern (`ui-back-to-main/index.tsx:19`, `to="/"`). The old
`SwitcherButton` (`form-section/index.tsx:43-66`) carried `onClick`, `disabled`, and
`onMouseEnter`/`onFocus`/`onTouchStart` `onIntent` prefetch — **none** of these are
carried over (FR6); a navigable link must never announce "unavailable" (WCAG 4.1.2). No
`aria-current`/`aria-pressed` (it points to a sibling page, AR7).

Add `src/modules/user/features/auth/components/auth-switcher/styles.ts` — a single object
literal (no functions, NFR6). Its `switcher` rule is the former `formSwitcherButton` rule
copied **verbatim** from `form-section/styles.ts:15-41` (e.g. `display:block`, `padding:0`,
`margin:'1.4375rem auto 0'`, `fontFamily:'Golos'`, `fontWeight:500`,
`fontSize:'0.9375rem'`, `fontStyle:'normal'`, `lineHeight:1.2`, `letterSpacing:0`,
`color: customColors.text.secondary` `#969B9D`, `textTransform:'none'`, plus the lg/xl media
tweaks) so the resting state is pixel-identical
(NFR1, D1 deferred), **plus** a new `:focus-visible` rule that did not exist before:

```ts
'&:focus-visible': {
  outline: `2px solid ${customColors.text.primary}`, // #404142, 10.23:1 on white
  outlineOffset: '2px',
},
```

`#404142` (`colors.ts:58`) clears the WCAG 1.4.11 ≥3:1 non-text floor on the white form
wrapper; `UIBackToMain`'s `#1EAEFF` (`paletteColors.primary.main`, `colors.ts:2`) is 2.46:1
and is explicitly NOT reused (AR2). Because the ring is `:focus-visible`-only, it never
paints in the resting-state screenshot (NFR1). Add the type-only file
`src/modules/user/features/auth/types/auth-switcher/index.ts`:
`AuthSwitcherProps { to: string; labelKey: string }`, imported via `import type` (NFR7).

**Acceptance Criteria.**

- Given an `AuthSwitcher to="/sign-in" labelKey="sign_up.form.switcher_text_have_account"`,
  When rendered, Then exactly one `getByRole('link', { name })` exists with `href="/sign-in"`
  (a non-empty string) and visible text "Already have an account?" (FR5, FR7, FR10, AR7,
  AC5).
- Given an `AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account"`,
  When rendered, Then the link has `href="/sign-up"` and text "Don't have an account yet?"
  (FR5, FR7, AC5).
- Given the rendered link, When its attributes are inspected, Then it has no `disabled`
  attribute, no `aria-pressed`, and no `aria-current`, and its `href` is never empty (FR6,
  AR7, AC6).
- Given the swap link is MUI `<Button component="a" href>`, When its role is inspected, Then it
  carries **no** explicit `role` attribute (`getAttribute('role')` is null) and
  `queryByRole('button', { name })` returns null — MUI must not override the native anchor role
  (Stryker-hardened against MUI-upgrade drift) (AR7, AC6, WCAG 4.1.2, a11y review Gap 4).
- Given the switcher receives keyboard focus, When `:focus-visible` is computed, Then it
  applies `outline: 2px solid #404142` with `outlineOffset: 2px` (not `#1EAEFF`); the
  indicator clears ≥3:1 against the white wrapper (10.23:1) (AR2, AC11, WCAG 2.4.7, 2.4.11).
- Given the resting (unfocused) state, When the computed style is read, Then no outline is
  drawn and the text color stays `customColors.text.secondary` `#969B9D` (D1 deferred,
  NFR1).
- Given the new files, When measured by rca, Then `index.tsx` defines a single component and
  `styles.ts` defines zero functions, both under all thresholds (NFR3).

**Files touched.** `src/modules/user/features/auth/components/auth-switcher/index.tsx`
(new), `src/modules/user/features/auth/components/auth-switcher/styles.ts` (new),
`src/modules/user/features/auth/types/auth-switcher/index.ts` (new, type-only).

**Tests to add/update.** Unit (new
`tests/unit/modules/user/features/auth/components/auth-switcher/index.test.tsx`):
`getByRole('link', { name })` href/name for both `to` values (exact strings, NFR13); assert
no `disabled`/`aria-pressed`/`aria-current`; assert the anchor has no `role` attribute and
`queryByRole('button', { name })` is null (Gap 4); assert the `:focus-visible` outline resolves
to exactly `2px solid #404142` + `outlineOffset: 2px`; assert the resting state has no outline.
Locate by role/text (NFR5). Full coverage of both new files (NFR10).

**Dependencies.** None (first story; reuses the existing `UIButton` + `customColors`).

**Definition of Done.** `AuthSwitcher` + styles + type file added and 100% covered; exact
href/name/focus-ring assertions green; `make lint-dup` (the copied `formSwitcherButton` rule
is intentionally moved, not duplicated — the source rule is removed in Story 1.9, so no
≥75-token clone coexists across the change set), `make lint-metrics`, ESLint (no
`data-testid`, no free functions), TS, dependency-cruiser (type-only) all pass; no
suppression, no inline comment.

---

### Story 1.2: Extract `AuthFormSection` — the reusable section shell

**User story.** As a developer, I want one presentational section shell that wraps the
form, the OAuth row, and the switcher slot, so both pages share the exact same geometry and
the jscpd gate is satisfied by reuse rather than copy-paste.

**Description.** Add `src/modules/user/features/auth/components/auth-form-section/index.tsx`
— the `<section>`/`formWrapper` shell lifted from `FormSectionLayout`
(`form-section/index.tsx:124-139`), made presentational and parameterized:

```text
function AuthFormSection({ children, oauthInert, switcher }: AuthFormSectionProps) {
  return (
    <Box component="section" sx={styles.formSection}>
      <Box sx={styles.formWrapper}>
        {children}
        <InertBox id="auth-provider-buttons-container" inert={oauthInert}>
          <AuthProviderButtons />
        </InertBox>
      </Box>
      {switcher}
    </Box>
  );
}
```

`styles.formSection` and `styles.formWrapper` are reused from `form-section/styles.ts:13-14`
(re-exports of the shared `auth-form-shared-styles`), so the geometry is pixel-identical
(NFR1). `InertBox` is reused from `form-section/inert-box.tsx` with the existing
`id="auth-provider-buttons-container"`, preserving the OAuth row's `inert` primitive
(confirmed correct). There is **no** `mode`, no `t`, no switch callback — all toggler state
is gone (FR9). `oauthInert` replaces the old
`showNotification = mode==='register' && registrationView!=='form'` derivation
(`form-section/index.tsx:121`): the sign-up section computes it from its own
`registrationView`, the sign-in section passes a constant `false`. Add the type-only file
`src/modules/user/features/auth/types/auth-form-section/index.ts`:
`AuthFormSectionProps { children: ReactNode; oauthInert: boolean; switcher: ReactNode }`
(NFR7).

**Acceptance Criteria.**

- Given `AuthFormSection` with `children`, `oauthInert={false}`, and a `switcher` node, When
  rendered, Then the children, the OAuth row (`AuthProviderButtons` inside the
  `auth-provider-buttons-container` `InertBox`), and the switcher node all appear inside a
  `<section>` with the shared `formSection`/`formWrapper` styling (FR9, NFR1).
- Given `oauthInert={true}`, When rendered, Then the OAuth `InertBox` is `inert`; Given
  `oauthInert={false}`, Then it is not `inert` (both branches) (FR9, AC7).
- Given the section, When inspected, Then it carries no `mode`, no `t`, and no switch
  callback (the toggler state is gone) (FR13).
- Given the new files, When measured by rca, Then `index.tsx` defines a single component
  under all thresholds and the type lives in its own type-only file (NFR3, NFR7).

**Files touched.** `src/modules/user/features/auth/components/auth-form-section/index.tsx`
(new), `src/modules/user/features/auth/types/auth-form-section/index.ts` (new, type-only).

**Tests to add/update.** Unit (new
`tests/unit/modules/user/features/auth/components/auth-form-section/index.test.tsx`): render
with a stub child + stub switcher and assert children, OAuth row, and switcher slot are
present; assert both `oauthInert` branches toggle the OAuth `InertBox` `inert` attribute.
Locate the OAuth row by its existing `id="auth-provider-buttons-container"` only as a last
resort (NFR5). Full coverage (NFR10).

**Dependencies.** None for rendering (it consumes any `children`/`switcher` node); pairs
with Stories 1.5/1.6 which feed it `RegistrationForm`/`LoginForm` and an `AuthSwitcher`.

**Definition of Done.** `AuthFormSection` + type file added and 100% covered; both
`oauthInert` branches asserted; `make lint-dup`/`lint-metrics`/ESLint/TS/dependency-cruiser
pass; no suppression, no `data-testid`, no inline comment.

---

### Story 1.3: Extract `AuthPageLayout` — the reusable page chrome

**User story.** As a developer, I want one reusable component for the page chrome (back
link, `<main>`, error boundary, suspense + skeleton, footer), so both pages share it with no
duplication and the AuthSkeleton-while-chunk-loads behavior is preserved.

**Description.** Add `src/modules/user/features/auth/components/auth-page-layout/index.tsx`
— the chrome lifted verbatim from `auth/index.tsx:12-25`:

```text
function AuthPageLayout({ children }: AuthPageLayoutProps): JSX.Element {
  return (
    <>
      <UIBackToMain />
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AuthErrorBoundary>
          <Suspense fallback={<AuthSkeleton />}>{children}</Suspense>
        </AuthErrorBoundary>
      </Box>
      <UIFooter />
    </>
  );
}
```

Imports mirror `auth/index.tsx:1-7`: `Box`, `Suspense`, `AuthSkeleton`, `UIBackToMain`,
`UIFooter`, `AuthErrorBoundary`. The `<main>` `sx` literal, the `<AuthErrorBoundary>`, and
the `<Suspense fallback={<AuthSkeleton/>}>` are **identical** to today's, so the
skeleton-while-loading behavior and the error-boundary fallback are preserved unchanged
(FR8, FR12). Both `SignUp` and `SignIn` consume this single component, so the ~10-line
chrome is not a >75-token clone across the two pages (NFR4). Add the type-only file
`src/modules/user/features/auth/types/auth-page-layout/index.ts`:
`AuthPageLayoutProps { children: ReactNode }` (NFR7).

**Acceptance Criteria.**

- Given `AuthPageLayout` with a child, When rendered, Then the back link (`UIBackToMain`),
  a `<main>` landmark, the child inside `<AuthErrorBoundary>` + `<Suspense>`, and the footer
  (`UIFooter`) all appear in that order (FR8, FR12).
- Given a child that suspends, When it is loading, Then the `AuthSkeleton` fallback renders
  (skeleton-while-chunk-loads behavior preserved) (FR1, FR12).
- Given a child that throws a chunk-load error, When it errors, Then the `AuthErrorBoundary`
  fallback renders (behavior preserved) (FR8).
- Given the new files, When measured by rca, Then `index.tsx` defines a single component
  under all thresholds and the prop type lives in its own type-only file (NFR3, NFR7).

**Files touched.** `src/modules/user/features/auth/components/auth-page-layout/index.tsx`
(new), `src/modules/user/features/auth/types/auth-page-layout/index.ts` (new, type-only).

**Tests to add/update.** Unit (new
`tests/unit/modules/user/features/auth/components/auth-page-layout/index.test.tsx`):
header/`<main>`/skeleton-while-loading/footer + error-boundary-fallback assertions ported
from the to-be-deleted `tests/unit/modules/user/features/auth/index.test.tsx`, using
semantic queries (`getByRole('main')`, role/text) per NFR5. Full coverage of the new layout
(NFR10).

**Dependencies.** None (chrome is self-contained); consumed by Stories 1.5/1.6.

**Definition of Done.** `AuthPageLayout` + type file added and 100% covered; chrome + skeleton

- error-boundary assertions green; `make lint-dup`/`lint-metrics`/ESLint/TS/dependency-cruiser
  pass; no suppression, no `data-testid`, no inline comment.

---

### Story 1.4: Add the real-`<h1>` capability to `UIForm`/`FormHeader` (C1)

**User story.** As an assistive-technology user, I want each auth page to have exactly one
real `<h1>`, so the page has a programmatic title and a non-skipping heading order rather
than zero headings.

**Description.** Today `FormHeader` renders the title as
`<UITypography variant="h4" sx={styles.formTitle}>` (`ui-form/index.tsx:46-48`) with **no**
`component` prop; `UITypography` defaults `component={component || 'p'}`
(`ui-typography/index.tsx:18`), so the title is a `<p>` and each auth page currently has
**zero** real headings (C1). Thread an **optional** `titleComponent` through `UIFormProps` →
`FormBodyProps` → `FormHeader`:

```text
// src/components/types/ui-form/index.ts — add to UIFormProps and FormBodyProps:
titleComponent?: React.ElementType; // e.g. 'h1'
```

```text
// src/components/ui-form/index.tsx FormHeader:
<UITypography variant="h4" component={titleComponent} sx={styles.formTitle}>{title}</UITypography>
```

`variant="h4"` is retained (size unchanged, NFR1); `component={titleComponent}` makes the
element a real heading. When `titleComponent` is omitted the existing `component || 'p'`
default is preserved, so non-auth `UIForm` callers are untouched (additive, like the
existing optional `subtitle`/`showTitle` props at `ui-form/index.tsx:129-130`).
`UITypography` already forwards `component` (`ui-typography/index.tsx:18`), so no
`UITypography` change is needed. This story threads the prop and asserts it in isolation; the
two form consumers wire `titleComponent="h1"` in Story 1.5.

**Acceptance Criteria.**

- Given a `UIForm` rendered with `titleComponent="h1"`, When the title is queried, Then it is
  exposed as `getByRole('heading', { level: 1 })` and the underlying tag is `<h1>` (AR1, C1,
  AC10).
- Given a `UIForm` rendered WITHOUT `titleComponent`, When the title is queried, Then it is a
  `<p>` (the existing default is preserved; non-auth callers unaffected) (AR1, FR14).
- Given the change, When the title size is measured, Then `variant="h4"` styling is unchanged
  (no visual change) (NFR1, AR1).
- Given the props type, When inspected, Then `titleComponent` is optional and lives in the
  type-only `types/ui-form/index.ts`; the logic file declares no `interface`/`type` (NFR7).

**Files touched.** `src/components/ui-form/index.tsx` (thread `titleComponent` through
`UIForm` → `FormBody` → `FormHeader`), `src/components/types/ui-form/index.ts` (add
`titleComponent?: React.ElementType` to `UIFormProps` and `FormBodyProps`).

**Tests to add/update.** Unit (`tests/unit/components/ui-form/index.test.tsx`): add a
`titleComponent="h1"` case asserting `getByRole('heading', { level: 1 })` and the exact
`<h1>` tag; confirm the default (no `titleComponent`) still renders a `<p>` for non-auth
callers (AC10). Exact-tag assertion (NFR13).

**Dependencies.** None (additive, optional prop). Precedes Story 1.5 (the consumers that pass
`titleComponent="h1"`).

**Definition of Done.** `titleComponent` threaded and optional; existing callers compile
unchanged; `<h1>`/`<p>` unit assertions green; `lint-metrics` (additive, no new function),
ESLint, TS, dependency-cruiser (type-only) pass; no suppression, no `data-testid`, no inline
comment.

---

### Story 1.5: Add `/sign-up` page + `SignUpFormSection` (with the real `<h1>` and swap link)

**User story.** As a visitor, I want a dedicated `/sign-up` page that renders the
registration form with the OAuth row and a link to `/sign-in`, so registration is a
bookmarkable, independently-titled URL.

**Description.** Add `src/modules/user/features/auth/sign-up/index.tsx` (route-level page,
lazily imported by `app.tsx`) and `src/modules/user/features/auth/sign-up/sign-up-form-section.tsx`
(lazy inner chunk):

```text
const SignUpFormSection = lazy(() => import('./sign-up-form-section'));
export default function SignUp(): JSX.Element {
  usePageTitle('sign_up.title');
  return <AuthPageLayout><SignUpFormSection /></AuthPageLayout>;
}

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

`SignUpFormSection` owns the only surviving toggler state — `registrationView` — exactly as
`useFormSectionViewModel` did (`form-section/index.tsx:143-167`), minus all switch machinery.
`RegistrationForm` is reused unchanged (`auth-forms/registration-form.tsx:72-83`); its
`onViewChange` prop and the `RegistrationView` type (`form-section/types.ts:4`) are retained.
The registration notification flow, `useRegistrationForm`, and validators are untouched
(FR14). `/sign-up` shows `sign_up.form.switcher_text_have_account` ("Already have an
account?") linking to `/sign-in` (FR7), reusing the existing i18n key (NFR9), and imports no
login code (FR12). Add `titleComponent="h1"` to the `<UIForm<RegisterUserDto>>` in
`RegistrationFormPanel` (`registration-form.tsx:34-45`) — the only edit to that file (AR1).
The page calls `usePageTitle('sign_up.title')` for its document title (added in Story 1.7).

**Acceptance Criteria.**

- Given a `GET /sign-up`, When the route renders, Then `AuthPageLayout` wraps
  `SignUpFormSection` (registration form, title "Registration"), the OAuth row, and the swap
  link, behind the route-level lazy chunk and the `AuthSkeleton` Suspense fallback (FR1,
  FR8, FR12, AC1).
- Given `/sign-up`, When the heading is queried, Then there is exactly one
  `getByRole('heading', { level: 1 })` whose text is the form title "Registration" (AR1, C1,
  AC10).
- Given `/sign-up`, When the swap link is queried, Then it is `getByRole('link', { name })`
  with `href="/sign-in"` and text "Already have an account?" (FR5, FR7, AC5).
- Given `/sign-up`, When the bundle/chunk graph is asserted (mock), Then login code is NOT
  imported (FR12, AC1).
- Given a registration view change to `success`/`error`, When `oauthInert` is recomputed,
  Then the OAuth row becomes `inert` (preserving today's behavior) (FR14, AC7).
- Given the new files, When measured by rca, Then `sign-up/index.tsx` and
  `sign-up-form-section.tsx` each define a single component under all thresholds (NFR3).

**Files touched.** `src/modules/user/features/auth/sign-up/index.tsx` (new),
`src/modules/user/features/auth/sign-up/sign-up-form-section.tsx` (new),
`src/modules/user/features/auth/components/form-section/auth-forms/registration-form.tsx`
(add `titleComponent="h1"`).

**Tests to add/update.** Unit (new
`tests/unit/modules/user/features/auth/sign-up/index.test.tsx`): `/sign-up` renders
Registration (`<h1>` "Registration"), the swap link to `/sign-in`, and the OAuth row; assert
no login code is imported (mock assertion). Update
`tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-form.test.tsx`
to assert the title is a real `<h1>` and fix any harness coupling to the deleted `FormSection`
(AC10, AC15). Semantic selectors only (NFR5).

**Dependencies.** 1.1 (`AuthSwitcher`), 1.2 (`AuthFormSection`), 1.3 (`AuthPageLayout`),
1.4 (`titleComponent` thread). The `usePageTitle` assertion lands once Story 1.7 adds the hook;
the render assertions here pass with the hook present.

**Definition of Done.** `/sign-up` page + section added and 100% covered; `<h1>`, swap link,
OAuth row, and chunk-isolation assertions green; `make lint-dup` (the section/chrome reuse
keeps clones under the floor), `lint-metrics`, ESLint, TS, dependency-cruiser pass; no
suppression, no `data-testid`, no inline comment.

---

### Story 1.6: Add `/sign-in` page + `SignInFormSection` (with the real `<h1>` and swap link)

**User story.** As a returning user, I want a dedicated `/sign-in` page that renders the
login form with the OAuth row and a link to `/sign-up`, so login is its own bookmarkable,
independently-titled URL and is reachable directly (not only via a toggle).

**Description.** Add `src/modules/user/features/auth/sign-in/index.tsx` and
`src/modules/user/features/auth/sign-in/sign-in-form-section.tsx`:

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

`LoginForm` is reused unchanged (`auth-forms/login-form.tsx:15-34`), rendering
`<UIForm<LoginUserDto> title={t('sign_in.title')}>`. Login has no notification view, so
`oauthInert={false}` is constant. `/sign-in` shows `sign_up.form.switcher_text_no_account`
("Don't have an account yet?") linking to `/sign-up` (FR7), reusing the existing key (NFR9),
and imports no registration code (FR12). `LoginForm` is now the **route's own** lazy chunk,
so `loginFormLoader` (`utils/load-login-form.ts`) and the request-id stale-guard in
`login-switch-actions.ts` are no longer needed — deletion happens in Story 1.10. Add
`titleComponent="h1"` to the `<UIForm<LoginUserDto>>` in `login-form.tsx:21-30` — the only
edit to that file (AR1). The page calls `usePageTitle('sign_in.title')` (Story 1.7).

**Acceptance Criteria.**

- Given a `GET /sign-in`, When the route renders, Then `AuthPageLayout` wraps
  `SignInFormSection` (login form, title "Authentication"), the OAuth row, and the swap link,
  behind the route-level lazy chunk and the `AuthSkeleton` fallback (FR2, FR8, FR12, AC2).
- Given `/sign-in`, When the heading is queried, Then there is exactly one
  `getByRole('heading', { level: 1 })` whose text is the login title "Authentication" (AR1,
  C1, AC10).
- Given `/sign-in`, When the swap link is queried, Then it is `getByRole('link', { name })`
  with `href="/sign-up"` and text "Don't have an account yet?" (FR5, FR7, AC5).
- Given `/sign-in`, When the bundle/chunk graph is asserted (mock), Then registration code is
  NOT imported (FR12, AC2).
- Given the new files, When measured by rca, Then `sign-in/index.tsx` and
  `sign-in-form-section.tsx` each define a single component under all thresholds (NFR3).

**Files touched.** `src/modules/user/features/auth/sign-in/index.tsx` (new),
`src/modules/user/features/auth/sign-in/sign-in-form-section.tsx` (new),
`src/modules/user/features/auth/components/form-section/auth-forms/login-form.tsx` (add
`titleComponent="h1"`).

**Tests to add/update.** Unit (new
`tests/unit/modules/user/features/auth/sign-in/index.test.tsx`): `/sign-in` renders Login
(`<h1>` "Authentication"), the swap link to `/sign-up`, and the OAuth row; assert no
registration code is imported. Update
`tests/unit/modules/user/features/auth/components/form-section/auth-forms/login-form.test.tsx`
to assert the title is a real `<h1>` and fix any harness coupling to the deleted `FormSection`
(AC10, AC15). Semantic selectors only (NFR5).

**Dependencies.** 1.1, 1.2, 1.3, 1.4 (same primitives as Story 1.5). Parallelizable with
Story 1.5.

**Definition of Done.** `/sign-in` page + section added and 100% covered; `<h1>`, swap link,
OAuth row, and chunk-isolation assertions green; `make lint-dup`/`lint-metrics`/ESLint/TS/
dependency-cruiser pass; no suppression, no `data-testid`, no inline comment.

---

### Story 1.7: Per-route `document.title` via `usePageTitle` (M1 → AR3)

**User story.** As an assistive-technology user, I want `/sign-up` and `/sign-in` to have
distinct, localized document titles, so the two URLs are not announced with the same title.

**Description.** The SPA never manages `document.title` (it stays the static "VilnaCRM" for
every route); shipping two distinct URLs with identical titles would introduce a **new**
WCAG 2.4.2 failure (M1). Add `src/modules/user/features/auth/hooks/use-page-title.ts` — a
`use-*` hook (NFR6-exempt). `usePageTitle(titleKey: string)` reads `t(titleKey)`, composes
the localized document title (e.g. `"<heading> - VilnaCRM"`), sets `document.title`, and
subscribes to `languageChanged` to re-apply — mirroring the subscribe/cleanup shape of the
existing `dir` effect (`app.tsx:31-38`). Sourcing the title from the **same** i18n keys that
feed each page's `<h1>` (`sign_up.title` = "Registration" / `sign_in.title` =
"Authentication") guarantees the two pages differ and avoids the 2.4.2 failure (FR11, AR3).
Putting it in a per-page hook (not the shared app effect) keeps each page self-describing and
the app effect single-responsibility under the rca caps (NFR3). The pages added in Stories
1.5/1.6 already call `usePageTitle('sign_up.title')` / `usePageTitle('sign_in.title')`.

**Acceptance Criteria.**

- Given a component calling `usePageTitle('sign_up.title')`, When it mounts, Then
  `document.title` is the localized composed title containing "Registration" (FR11, AR3,
  AC8).
- Given a component calling `usePageTitle('sign_in.title')`, When it mounts, Then
  `document.title` is the localized composed title containing "Authentication", distinct from
  the sign-up title (FR11, AR3, AC8).
- Given a `languageChanged` event, When it fires, Then `document.title` is re-applied from the
  same key in the new language (FR11, AR3, AC8).
- Given the hook unmounts, When cleanup runs, Then it unsubscribes from `languageChanged`
  (no leak) (NFR3).
- Given the hook file, When inspected, Then it is a `use-*` hook (NFR6-exempt) and declares no
  `static` member or free function (NFR6).

**Files touched.** `src/modules/user/features/auth/hooks/use-page-title.ts` (new).

**Tests to add/update.** Unit (new
`tests/unit/modules/user/features/auth/hooks/use-page-title.test.tsx`): assert
`document.title` is set from the i18n key, differs between the two keys, re-applies on a
simulated `languageChanged`, and the cleanup unsubscribes (AC8). Exact title-string
assertions (NFR13).

**Dependencies.** None to author the hook; Stories 1.5/1.6 consume it (their `document.title`
assertions depend on this hook existing).

**Definition of Done.** `usePageTitle` added and 100% covered; per-route + language-change +
cleanup assertions green; `lint-metrics`/ESLint/TS pass; no suppression, no `data-testid`, no
inline comment.

---

### Story 1.8: Routing — add `/sign-up` + `/sign-in`, remove `/authentication`, add `<html lang>` (M2)

**User story.** As a visitor, I want `/sign-up` and `/sign-in` to be real routes and
`/authentication` to no longer exist, and as a Ukrainian-speaking screen-reader user I want
the page announced in the correct language.

**Description.** Rewrite `createBrowserRouter` (`app.tsx:12-26`): keep the
`ProtectedRoute → '/' ButtonExample` branch (`app.tsx:13-21`) verbatim; **remove** the
`{ path: '/authentication', element: <Authentication/> }` entry (`app.tsx:22-25`) and the
`Authentication` lazy import (`app.tsx:10`) — with **no** redirect and **no** alias (FR3,
D-REMOVE); add two new lazy route entries:

```text
const SignUp = lazy(async () => import('@auth/sign-up'));
const SignIn = lazy(async () => import('@auth/sign-in'));
// ...
{ path: '/sign-up', element: <SignUp /> },
{ path: '/sign-in', element: <SignIn /> },
```

The pages are lazy at the route level under the unchanged
`<React.Suspense fallback={null}>` (`app.tsx:40`), preserving the route chunking
`performance-serving.test.ts` asserts (NFR2, FR12). In the existing i18n `useEffect`
(`app.tsx:31-38`), add `document.documentElement.lang = i18n.language` alongside `applyDir()`,
re-applied on `languageChanged` and torn down via the existing `i18n.off` cleanup (AR4, M2) —
a visual-neutral one-liner inside the existing effect that adds no new closure/exit point, so
it stays under the rca caps (≤3 exit points, Cognitive ≤15). The `document.title` concern is
deliberately NOT crammed here — it is the per-page `usePageTitle` hook (Story 1.7) — keeping
the app effect single-responsibility (NFR3).

**Acceptance Criteria.**

- Given a `GET /sign-up`, When the router resolves, Then `<SignUp/>` renders; Given a
  `GET /sign-in`, Then `<SignIn/>` renders (FR1, FR2, AC1, AC2).
- Given a `GET /authentication`, When the router resolves, Then no auth page renders (no
  redirect, no alias; it falls through to react-router's not-matched behavior) (FR3, AC3).
- Given the app mounts, When the i18n effect runs, Then
  `document.documentElement.lang === i18n.language`; Given a `languageChanged` event, Then
  `lang` is re-applied (AR4, M2, AC9).
- Given the router, When the chunk graph is asserted, Then `/sign-up` and `/sign-in` are
  route-level lazy chunks (route-level code splitting preserved) (FR12, NFR2, AC18).
- Given the effect after the edit, When measured by rca, Then it stays ≤3 exit points and
  Cognitive ≤15 (the `lang` assignment adds no closure) (NFR3).

**Files touched.** `src/app.tsx` (routes + the `<html lang>` line in the i18n effect).

**Tests to add/update.** Unit (`tests/unit/app.test.tsx`): replace `pushState('/authentication')`
(`:21`) with a `/sign-up` render case and add a `/sign-in` render case; assert
`/authentication` resolves to no auth page (AC3); rename the mocked auth module path(s) to the
new page modules; assert `document.documentElement.lang` after a simulated `languageChanged`
(AC9). Update `tests/unit/app-root.test.tsx` mocked auth page module path(s); the `/` protected
-outlet assertion stays. Exact route literals + exact `lang` value (NFR13).

**Dependencies.** 1.5 (`SignUp`), 1.6 (`SignIn`) — the routes must point at existing pages.
Story 1.9 (`ProtectedRoute → /sign-in`) is paired but independent.

**Definition of Done.** Routes rewritten; `/authentication` removed; `<html lang>` added; the
app effect stays under the rca caps; `app.test.tsx`/`app-root.test.tsx` green; `make lint`/
`lint-metrics`/dependency-cruiser pass; no suppression, no `data-testid`, no inline comment.

---

### Story 1.9: Protected-route redirect to `/sign-in` (D-REDIRECT)

**User story.** As an unauthenticated user hitting a protected route, I want to be redirected
to `/sign-in`, so I land on the login page rather than the removed `/authentication` route.

**Description.** `ProtectedRoute` (`protected-route/index.tsx:8`) currently returns
`token ? <Outlet/> : <Navigate to="/authentication" replace/>` using `useAuthToken()`. Change
the navigate target to `/sign-in`:

```text
return token ? <Outlet /> : <Navigate to="/sign-in" replace />;
```

`useAuthToken()` and the `<Outlet/>` branch are unchanged (FR4, D-REDIRECT). This is a
single-literal change; NFR13 requires asserting the exact `/sign-in` target so Stryker kills a
mutated route string.

**Acceptance Criteria.**

- Given no auth token, When `ProtectedRoute` renders, Then it returns
  `<Navigate to="/sign-in" replace/>` and the test lands on the `/sign-in` element (not
  `/authentication`) (FR4, D-REDIRECT, AC4).
- Given an auth token, When `ProtectedRoute` renders, Then it renders the protected `<Outlet/>`
  (unchanged) (FR4, AC4).
- Given the test, When the redirect target is asserted, Then it is the exact string `/sign-in`
  (mutation hardening) (NFR13, AC21).

**Files touched.**
`src/modules/user/features/auth/components/protected-route/index.tsx`.

**Tests to add/update.** Unit (`tests/unit/components/protected-route.test.tsx`): change the
route element + redirect target `/authentication` → `/sign-in` (`:22,35`); assert the
unauthenticated render lands on the `/sign-in` element. The pre-existing mock-stub
`data-testid` here is test-only and stays warn-level (NFR5, R13). Exact `/sign-in` assertion
(NFR13).

**Dependencies.** 1.6/1.8 (the `/sign-in` route/element must exist for the integration-style
assertion). The source one-liner is independent.

**Definition of Done.** Redirect target flipped to `/sign-in`; `protected-route.test.tsx`
green with the exact target asserted; `make lint`/`lint-metrics` pass; no suppression, no new
`data-testid` in `src/**`, no inline comment.

---

### Story 1.10: Delete the in-place toggler machinery (FR13)

**User story.** As a maintainer, I want the dead in-place toggle/switch code removed once the
routed pages exist, so there is no orphan importer, a green build, and a clean dependency
graph.

**Description.** Now that `SignUp`/`SignIn` + the shared components replace the toggler,
delete the machinery (FR13). `grep loginFormLoader|load-login-form` confirms `loginFormLoader`
is imported ONLY by the three toggler source files and their two tests — all removed here —
plus its own definition, so deletion is safe (R5, AC14). Delete:

- `src/modules/user/features/auth/index.tsx` (old `Authentication` page; chrome now in
  `AuthPageLayout`).
- `src/modules/user/features/auth/components/form-section/index.tsx` (the toggler:
  `FormSection`, `AuthBody`, `SwitcherButton`, `SwitcherError`, `FormSwitcher`,
  `FormSectionLayout`, `useFormSectionViewModel`, `getSwitcherLabelKey`).
- `src/modules/user/features/auth/components/form-section/use-login-switcher.ts`.
- `src/modules/user/features/auth/components/form-section/login-switch-actions.ts`
  (`LoginSwitchController` + `LOAD_LOGIN_ERROR_KEY`).
- `src/modules/user/features/auth/utils/load-login-form.ts` (`loginFormLoader`).
- `src/modules/user/features/auth/types/form-section/index.ts` (`FormSectionLayoutProps`),
  `.../types/form-section/login-switch-actions.ts`, `.../types/form-section/use-login-switcher.ts`.

Modify (prune the toggler-only parts, keep what the new code needs):

- `src/modules/user/features/auth/components/form-section/styles.ts` — remove `formSwitcherError`
  (`:42-56`) and the now-unused `paletteColors` import (`:7`); keep `formSection`/`formWrapper`
  (still re-exported / consumed by `AuthFormSection`) and the `fieldGapMargins` re-export. The
  `formSwitcherButton` rule (`:15-41`) now lives in `auth-switcher/styles.ts` (Story 1.1).
- `src/modules/user/features/auth/components/form-section/types.ts` — remove `AuthMode` (`:3`);
  keep `RegistrationView` (`:4`, used by `SignUpFormSection` + `RegistrationForm`) and
  `AuthVariants`.
- `src/modules/user/features/auth/i18n/en.json` + `uk.json` — `sign_in.errors.load_failed`
  becomes unused (only the deleted in-place switch read it); leave OR remove. If removed,
  remove from **both** locales for parity (NFR9). `sign_up.errors.load_failed` stays (used by
  `AuthErrorBoundary` paths).

`src/modules/user/features/auth/utils/lazy-module-loader.ts` is **kept** (still used by
`load-registration-notification.ts`). Verify no orphan importer via `grep` + `make lint-tsc` +
dependency-cruiser.

**Acceptance Criteria.**

- Given the codebase after deletion, When searched, Then nothing imports `form-section/index.tsx`,
  `use-login-switcher.ts`, `login-switch-actions.ts`, `utils/load-login-form.ts`,
  `styles.formSwitcherError`, `AuthMode`, or the deleted `types/form-section/*`; the build,
  `make lint-tsc`, and dependency-cruiser pass (FR13, AC14).
- Given `lazy-module-loader.ts`, When searched, Then it is still imported by
  `load-registration-notification.ts` and is NOT deleted (FR13).
- Given `form-section/styles.ts`, When read, Then `formSwitcherError` and the `paletteColors`
  import are gone, while `formSection`/`formWrapper`/`fieldGapMargins` remain (FR13).
- Given `form-section/types.ts`, When read, Then `AuthMode` is gone and `RegistrationView` +
  `AuthVariants` remain (FR13).
- Given the i18n decision on `sign_in.errors.load_failed`, When applied, Then en/uk stay at
  parity (NFR9, AC20).

**Files touched.** Deletions and prunes as listed above
(`src/modules/user/features/auth/index.tsx`; `.../form-section/index.tsx`,
`use-login-switcher.ts`, `login-switch-actions.ts`; `.../utils/load-login-form.ts`; the three
`.../types/form-section/*`; `.../form-section/styles.ts`; `.../form-section/types.ts`;
`.../i18n/en.json` + `uk.json`).

**Tests to add/update.** Delete the toggler tests:
`tests/unit/modules/user/features/auth/components/form-section/index.test.tsx`,
`tests/unit/modules/user/features/auth/components/form-section.test.tsx`,
`tests/unit/modules/user/features/auth/components/form-section/login-switch-actions.test.ts`,
and `tests/unit/modules/user/features/auth/index.test.tsx` (its chrome assertions ported to
the `auth-page-layout` test in Story 1.3). Their behavior is re-covered by the new
page/section/switcher tests (NFR10).

**Dependencies.** 1.1, 1.2, 1.3, 1.5, 1.6, 1.8 (the replacements must exist and be wired
before the toggler is removed). Pairs with Story 1.9.

**Definition of Done.** Toggler machinery deleted; styles/types pruned; i18n parity preserved;
`grep` + `make lint-tsc` + dependency-cruiser confirm no orphan importer; deleted-module tests
removed; build green; no suppression, no `data-testid`, no inline comment.

---

### Story 1.11: Notification a11y — politeness, single-announce, focus, heading order (M4/M5)

**User story.** As a screen-reader user, I want the registration success and error
notifications to be announced once with the correct politeness and to place focus
meaningfully, so I am not double-read and my focus is never stranded on `<body>` while the
form is `inert`.

**Description.** Both notification views currently wrap content in `<Box role="alert">`
(success `registration-success-view.tsx:110`, error `registration-error-view.tsx:111`) AND
auto-focus a heading via `useFocusOnMount` + `tabIndex={-1}` (success `:22-31`, error
`:22-31`); both headings hardcode `component="h4"` (success `:26`, error `:26`). This
double-mechanism is a competing-read defect, and `role="alert"` (assertive) is the wrong
politeness for a SUCCESS result (M5). Apply attribute-only fixes (no logic change, FR14):

- **Success view** (`registration-success-view.tsx`): container `role="alert"` →
  `role="status"` (polite, `:110`); heading `component="h4"` → `component="h2"` (`:26`,
  heading-order so page `<h1>` → notification does not skip levels); remove the redundant
  `contentBox aria-label={t('notifications.success.title')}` (`:111`) that duplicates the
  visible title. Keep `useFocusOnMount` focus-on-mount (the success subtree is polite, so the
  focused heading does not compete with an assertive read) (AR6, M5).
  **Live-region timing (a11y review Gap 2):** because the success panel mounts already-populated
  behind Suspense, a polite region inserted fully-formed may not announce. The implementation
  MUST use the region-exists-first pattern — the `role="status"` container is present (empty)
  before its message text is set — OR, if that is impractical given the mount shape, mandate and
  record a manual NVDA/VoiceOver verification step in Story 1.11/1.13 documenting the chosen
  mechanism. **Submit→success sequencing contract:** `UIForm`'s persistent polite `UILiveStatus`
  ("submitting") message MUST be empty before the notification region announces, so only one
  polite region carries a message at the success moment (`inert` removes the form's `UILiveStatus`
  from the a11y tree — state this as a relied-upon property, and assert the sequencing).
- **Error view** (`registration-error-view.tsx`): per APG, do NOT auto-focus a
  heading inside the assertive `alert` subtree (it competes with the live read), while still
  preserving a meaningful focus target so focus is not stranded on `<body>` under `inert`
  (AR5/M4 — verify and preserve). **Pinned DOM structure (a11y review Gap 1):** move
  `role="alert"` (assertive) off the outermost Box onto a thin inner box that wraps **only**
  the error message text (so the assertive read is just the message). Add a `tabIndex={-1}`
  focus wrapper that is a parent/sibling **outside** the `role="alert"` element **and precedes
  the retry button in DOM order**; `useFocusOnMount` targets that wrapper. The heading becomes
  `component="h2"` (`:26`). This guarantees: focus ≠ `<body>`, focus is NOT contained by the
  `role="alert"` node, and a single forward `Tab` from the focus wrapper reaches the retry
  button. Rework `FocusableErrorHeading`/`useFocusOnMount` to this structure (AR5, AR6, M4, M5).

`variant`/size are unchanged, so all of these are DOM/attribute-only with **no** visual change
(NFR1). The existing `tests/visual/visual-comparison.registration-notification.spec.ts` spec and
its baselines are unaffected: the M4/M5 changes are attribute-only (role/heading/`aria-label`)
with no variant/size/layout change, so no baseline regeneration is needed there.

**Acceptance Criteria.**

- Given a registration success, When the notification renders, Then its container is
  `role="status"` (polite, not `role="alert"`), there is no redundant title-duplicating
  `aria-label`, and `axe` reports no duplicate/competing live region (AR6, M5, AC13, WCAG
  4.1.3, 4.1.2).
- Given a registration failure, When the error notification renders, Then its container keeps
  `role="alert"` (assertive) and there is NO auto-focused heading inside that assertive subtree
  (one announcement mechanism per APG) (AR6, M5, AC13).
- Given a registration failure, When the error view mounts, Then focus lands on the
  `tabIndex={-1}` wrapper that is **not** `<body>` and is **not contained by** the `role="alert"`
  node (`expect(alertNode).not.toContainElement(document.activeElement)`), while the form + OAuth
  row are `inert`, And a single forward `Tab` from that wrapper reaches
  `getByRole('button', { name: <retry> })` (AR5, M4, AC12, WCAG 2.4.3, Gap 1).
- Given a registration success, When the notification announces, Then the `role="status"` region
  follows the region-exists-first pattern (present-then-populated) OR a documented manual
  NVDA/VoiceOver pass is recorded, And the form's `UILiveStatus` "submitting" message is empty at
  the moment the success region carries its message (single polite region) (AR6, M5, AC13, WCAG
  4.1.3, Gap 2).
- Given either notification heading, When inspected, Then it is `component="h2"` (heading order
  h1 → h2, no skip) with unchanged `variant` size (AR1, NFR1, AC10).
- Given the views, When compared to before, Then only role/heading-level/`aria-label`/focus
  attributes changed — no flow logic changed (FR14, AC15).

**Files touched.**
`src/modules/user/features/auth/components/form-section/auth-forms/registration-success-view.tsx`,
`src/modules/user/features/auth/components/form-section/auth-forms/registration-error-view.tsx`.

**Tests to add/update.** Unit
(`tests/unit/modules/user/features/auth/components/form-section/auth-forms/registration-notification.test.tsx`):
assert success `role="status"`, error `role="alert"`, headings `component="h2"`, no redundant
`aria-label`, no auto-focus inside the assertive subtree, and a meaningful error focus target;
add a `jest-axe` no-competing-live-region / no-heading-order-skip check. Assert exact
role/politeness values (NFR13). E2E focus assertion lives in Story 1.13 (AC12).

**Dependencies.** 1.4/1.5/1.6 (the page `<h1>` exists, so the h1 → h2 heading-order fix is
meaningful). Independent of routing.

**Definition of Done.** Success → `role="status"`, error → `role="alert"`, headings `h2`, no
redundant `aria-label`, no competing focus, meaningful error focus target; unit + axe green;
visual snapshot unchanged (resting state); `make lint`/`lint-metrics` pass; no suppression, no
`data-testid`, no inline comment.

---

### Story 1.12: Lighthouse + tooling config — point the audited page at `/sign-up`

**User story.** As a maintainer, I want the Lighthouse page list and the tooling tests to
reference `/sign-up` instead of `/authentication`, so the CI budget gate audits the real
budget-sensitive page and the tooling assertions stay green.

**Description.** The audited `pages` array appends `/authentication`
(`lighthouse/constants.js:17`); change it to `/sign-up` (the budget-sensitive page that was
the default-register `/authentication`):

```text
normalizedBaseUrl === '/' ? '/sign-up' : `${normalizedBaseUrl}/sign-up`,
```

`lighthouserc.mobile.js` consumes `pages` indirectly; only its explanatory comment names
`/authentication` (`lighthouserc.mobile.js:29`) — update that comment to `/sign-up` (the 0.85
mobile gate is unchanged, NFR2). Update the tooling unit tests: `lighthouse-constants.test.ts`
expects `['http://prod:3001', 'http://prod:3001/authentication']` (`:28`) → `…/sign-up`;
`auth-test-port.test.ts` asserts the `constants.js` `/authentication` ternary string (`:36-38`)
→ the `/sign-up` ternary, and keeps `expect(workflow).not.toContain('/authentication')` (`:30`)
(the route lives in `constants.js`, not `performance-testing.yml`), optionally adding
`not.toContain('/sign-up')`; `performance-serving.test.ts` replaces the
`Authentication = lazy(...)` expected string (`:55-57,61`) with the new `SignUp`/`SignIn` lazy
imports while keeping the route-level-code-splitting intent (NFR2).

**Acceptance Criteria.**

- Given `lighthouse/constants.js`, When the `pages` array is computed, Then the second entry is
  the `/sign-up` URL (not `/authentication`) (NFR2, AC18, AC22).
- Given `lighthouse-constants.test.ts`, When run, Then it expects `…/sign-up` and passes
  (AC22).
- Given `auth-test-port.test.ts`, When run, Then it asserts the `constants.js` `/sign-up`
  ternary string and still asserts `performance-testing.yml` does NOT contain the route (AC22).
- Given `performance-serving.test.ts`, When run, Then it asserts the new `SignUp`/`SignIn` lazy
  imports and the route-level splitting intent (NFR2, AC18).
- Given `lighthouserc.mobile.js`, When read, Then its comment names `/sign-up` and the 0.85
  gate is unchanged (NFR2).

**Files touched.** `lighthouse/constants.js`, `lighthouse/lighthouserc.mobile.js`,
`tests/unit/tooling/lighthouse-constants.test.ts`, `tests/unit/tooling/auth-test-port.test.ts`,
`tests/unit/tooling/performance-serving.test.ts`.

**Tests to add/update.** The three tooling unit tests above, updated to the `/sign-up` route
and the new lazy imports (exact expected strings, NFR13).

**Dependencies.** 1.8 (the new `SignUp`/`SignIn` lazy imports that `performance-serving.test.ts`
asserts must exist).

**Definition of Done.** `constants.js` audits `/sign-up`; the `lighthouserc.mobile.js` comment
updated; the three tooling tests green; `make lint`/`lint-metrics` pass; no suppression, no
inline comment.

---

### Story 1.13: E2E refactor + new swap-navigation spec + registration-error focus

**User story.** As a user, I want the swap link to actually navigate between `/sign-up` and
`/sign-in` in both directions, the forms to work on the new routes, and my focus to land
meaningfully after a registration failure, so the routed flow is correct and accessible
end-to-end.

**Description.** Update the e2e specs for the route rename and the button→link swap, and add
the new swap-navigation coverage (Mockoon drives the API as today):

- `auth-forms/constants/constants.ts` — `REGISTRATION_URL='/authentication'` → `/sign-up`
  (`:10`); `registration-form.spec.ts` resolves through it and asserts `toHaveURL('/sign-up')`
  (AC1).
- `auth-forms/login-form.spec.ts` — `AUTH_URL='/authentication'` → navigate directly to
  `/sign-in` (drop `gotoLogin`'s switcher click, `:8,18-21`); the switcher `page.locator('button',
{hasText})` is no longer needed to reach login, and the swap is now a link
  (`getByRole('link', { name })`) (FR2, AC2).
- `components/skeletons/auth-skeleton.spec.ts` — `AUTH_URL='/authentication'` → `/sign-up`
  (`:8`); skeleton behavior unchanged (it is `AuthPageLayout`'s Suspense fallback) (FR1, AC1).
- `modules/back-to-main.spec.ts` — `page.goto('/authentication')` + `toHaveURL(/\/authentication$/)`
  → `/sign-up` (`:15-16`) (FR1).
- **New** `tests/e2e/modules/user/features/auth/swap-navigation.spec.ts` — from `/sign-up`,
  `getByRole('link', { name: switcher_text_have_account })`, click → `toHaveURL(/\/sign-in$/)`;
  from `/sign-in`, the reciprocal link → `toHaveURL(/\/sign-up$/)`. Assert both directions and
  that the control is a link (`<a href>`) (FR5, AC5, NFR13).
- **Registration-error focus** — after a registration failure, assert the active element is a
  meaningful element (the error view), explicitly NOT `<body>`, while the form is `inert` (AR5,
  M4, AC12, WCAG 2.4.3).
- Generated user/credential data continues to come from `@tests/builders` (e.g. `buildUser`,
  `buildCredentials`), seeded via `seedFaker()` — not hardcoded literals (NFR8).

The login submit/busy/error specs and the registration-form spec are preserved on the new
routes (AC15). Locate elements by role/label/text (NFR5).

**Acceptance Criteria.**

- Given `/sign-up`, When the swap link is clicked, Then the URL becomes `/sign-in`; Given
  `/sign-in`, When its swap link is clicked, Then the URL becomes `/sign-up` — both via
  `getByRole('link', { name })` + `toHaveURL` (FR5, AC5, NFR13).
- Given the login form on `/sign-in`, When navigated to directly (no toggler click), Then it
  renders and submits as before (FR2, AC2, AC15).
- Given the registration form on `/sign-up`, When submitted, Then `toHaveURL('/sign-up')` and
  the flow behaves as before (FR1, AC1, AC15).
- Given a registration failure, When the error notification mounts, Then focus is on a
  meaningful element (not `<body>`) while the form is `inert` (AR5, M4, AC12).
- Given the specs, When selectors are reviewed, Then no `*ByTestId` is used to locate the swap
  link or headings — role/label/text only (NFR5).

**Files touched.**
`tests/e2e/modules/user/features/auth/components/form-section/auth-forms/constants/constants.ts`,
`tests/e2e/modules/user/features/auth/components/form-section/auth-forms/login-form.spec.ts`,
`tests/e2e/modules/user/features/auth/components/form-section/auth-forms/registration-form.spec.ts`
(verify), `tests/e2e/components/skeletons/auth-skeleton.spec.ts`,
`tests/e2e/modules/back-to-main.spec.ts`,
`tests/e2e/modules/user/features/auth/swap-navigation.spec.ts` (new).

**Tests to add/update.** The route-rename edits, the new swap-navigation spec (both
directions), and the registration-error focus assertion above.

**Dependencies.** 1.5, 1.6, 1.8, 1.9 (the pages, routes, and redirect must be live), 1.11 (the
error-view focus behavior being asserted).

**Definition of Done.** `make test-e2e` green on the new routes; the swap-navigation spec
asserts both directions; the registration-error-focus assertion passes; no `*ByTestId` for the
swap link/headings; no suppression.

---

### Story 1.14: Visual — split specs into sign-up + sign-in and regenerate baselines (NFR1/NFR11)

**User story.** As a reviewer, I want regenerated `/sign-up` and `/sign-in` visual baselines
that are identical to today's auth page modulo the justified a11y changes, so "no visual
regression" is proven.

**Description.** Renaming the routes changes the visual page keys and the expected PNG
filenames (NFR11). Update `tests/visual/constants.ts` `PAGES` (`:92-95`): replace
`AUTH: '/authentication'` with `SIGN_UP: '/sign-up'` and `SIGN_IN: '/sign-in'`. Split
`tests/visual/visual-comparison.authentication.spec.ts` into
`visual-comparison.sign-up.spec.ts` (snapshots `PAGES.SIGN_UP`) and a new
`visual-comparison.sign-in.spec.ts` (snapshots `PAGES.SIGN_IN`) — login was only reachable via
the toggle before and now has its own route, so it gets its own snapshots. Update
`visual-comparison.auth-skeleton.spec.ts` `PAGES.AUTH` → `PAGES.SIGN_UP` (`:15`). Verify
`tests/visual/take-visual-snapshot.ts` — `if (url === PAGES.HOME)` seeds a token (`:33-35`);
`/sign-up` and `/sign-in` are public and need NO token, so confirm no seeding branch is added.
Regenerate baselines under `tests/visual/*-snapshots/` via `make test-visual-update` (Docker +
the prod stack) so the new `/sign-up` baseline is visually identical to today's register state
and the new `/sign-in` baseline matches today's login state — modulo the visual-neutral a11y
changes (C1/M1/M2/M4/M5 are DOM/attribute-only; C2 is `:focus-visible`-only; D1/D2 are NOT
applied). This is a real execution dependency on a working Docker/browser environment (R8).

**Acceptance Criteria.**

- Given `tests/visual/constants.ts`, When read, Then `PAGES` has `SIGN_UP: '/sign-up'` and
  `SIGN_IN: '/sign-in'` and no `AUTH` key (NFR11).
- Given the split specs, When run, Then `visual-comparison.sign-up.spec.ts` snapshots
  `/sign-up` and `visual-comparison.sign-in.spec.ts` snapshots `/sign-in` across the configured
  screen sizes (NFR11, AC16).
- Given the regenerated baselines, When `make test-visual` runs, Then the `/sign-up` baseline
  is visually identical to today's register state and `/sign-in` to today's login state, modulo
  the justified a11y changes; the resting-state focus ring (C2) does not appear in the snapshot
  (NFR1, AC11, AC16).
- Given `take-visual-snapshot.ts`, When inspected, Then no token-seeding branch is added for
  the public auth routes (NFR11).
- Given the auth-skeleton spec, When run, Then it points at `PAGES.SIGN_UP` and its skeleton
  PNG content is unchanged (NFR11).

**Files touched.** `tests/visual/constants.ts`,
`tests/visual/visual-comparison.authentication.spec.ts` (renamed →
`visual-comparison.sign-up.spec.ts`), `tests/visual/visual-comparison.sign-in.spec.ts` (new),
`tests/visual/visual-comparison.auth-skeleton.spec.ts`, `tests/visual/take-visual-snapshot.ts`
(verify), the regenerated/renamed baseline PNGs under `tests/visual/*-snapshots/`.

**Tests to add/update.** The split sign-up/sign-in specs, the `PAGES` change, the auth-skeleton
spec route key, and the regenerated baseline PNGs (`make test-visual-update`, Docker).

**Dependencies.** 1.5, 1.6, 1.8 (the routes/pages must render their final UI), 1.1, 1.4, 1.11
(the visual-neutral a11y changes must be in place before baselines are frozen).

**Definition of Done.** `make test-visual` green against the regenerated baselines; `/sign-up`

- `/sign-in` baselines visually identical to today modulo the justified a11y changes; no
  resting-state focus ring in the snapshot; no suppression.

---

### Story 1.15: Memory-leak route paths and single-route signup scenario (NFR10)

**User story.** As a maintainer, I want the memory-leak scenarios to use the new routes, so the
MemLab suite exercises `/sign-up` and no longer drives the removed toggler `<button>`.

**Description.** Update the MemLab route paths: `tests/memory-leak/tests/auth-skeleton.js`
`pushState('/authentication')` → `/sign-up` (`:14`); the baseline `/__memlab_away__` is
unchanged. `tests/memory-leak/tests/signup.js` `ROUTE_PATH='/authentication'` → `/sign-up`
(`:8`); the in-page mode-switch helpers (`ensureRegistrationForm`/`restoreLoginView`/
`clickSwitcherByText`, `:52-87`) targeted the old toggler `<button>` — on `/sign-up` the form
is registration by default and the swap is now cross-route, so drop the switch-back-to-login
dance and simplify to a single-route signup fill scenario (NFR10). Any generated domain data
in the scenario keeps using `@faker-js/faker` / the shared builders as today (NFR8).

**Acceptance Criteria.**

- Given `auth-skeleton.js`, When run, Then it navigates to `/sign-up` and the leak baseline is
  unchanged (NFR10).
- Given `signup.js`, When run, Then it navigates to `/sign-up`, fills and submits the
  registration form without any toggler/switcher interaction, and reports no leak (NFR10).
- Given `signup.js`, When read, Then the cross-mode switcher helpers
  (`ensureRegistrationForm`/`restoreLoginView`/`clickSwitcherByText`) are removed (the swap is
  cross-route) (NFR10).

**Files touched.** `tests/memory-leak/tests/auth-skeleton.js`,
`tests/memory-leak/tests/signup.js`.

**Tests to add/update.** The two MemLab scenarios above (route paths + simplified signup flow).

**Dependencies.** 1.5, 1.8 (the `/sign-up` route/page must exist).

**Definition of Done.** `make test-memory-leak` green; both scenarios use `/sign-up`; the
toggler dance removed from `signup.js`; no suppression.

---

### Story 1.16: Unit + integration coverage to 100% and mutation hardening (NFR10/NFR13)

**User story.** As a maintainer, I want every new source file fully covered with exact-value
assertions and every deleted-file test removed, so coverage stays 100% over `src/**` and
Stryker reports no surviving mutant on the new branches.

**Description.** Consolidate the unit/integration suite so the global **100% coverage over
`src/**`** gate holds after the add/delete churn: every NEW source file (`auth-switcher`,
`auth-form-section`, `auth-page-layout`, `sign-up/index`+`sign-up-form-section`,
`sign-in/index`+`sign-in-form-section`, `hooks/use-page-title`, the `UIForm` `titleComponent`branch) is fully exercised (the per-file tests from Stories 1.1-1.7 plus the route-agnostic
store/repo/skeleton integration suites), and every DELETED-module test (Story 1.10) is removed.
The auth store is untouched, so the`clearInstances()` module-load-captured-store spy hazard is
NOT triggered — note it but no action needed (R10). Add exact-value (not truthy) assertions for
mutation hardening so Stryker kills mutants on: the route literals (`/sign-up`, `/sign-in`), the
swap-link `href`, the notification politeness values (`status`/`alert`), the `#404142`ring, the`<h1>`tag,`document.title`, `<html lang>`, and the `/sign-in`redirect target (NFR13, AC21).
New/updated unit tests reuse`@tests/builders` for any user/auth domain data rather than
hardcoded literals (NFR8).

**Acceptance Criteria.**

- Given the full unit + integration run, When coverage is computed, Then it is 100% over
  `src/**`, including every new file, with no deleted-file test lingering (NFR10, AC17).
- Given Stryker runs, When mutants alter a route literal, the swap `href`, a notification role,
  the `#404142` ring, the `<h1>` tag, `document.title`, `<html lang>`, or the `/sign-in`
  redirect, Then the exact-value assertions kill them (NFR13, AC21).
- Given the tests, When selectors are reviewed, Then no `data-testid` is added to `src/**` and
  elements are located by role/label/text (NFR5).
- Given the auth store, When the suite runs, Then no `clearInstances()` spy hazard is hit (the
  store is unchanged) (NFR10, R10).

**Files touched.** Test files only: the new component/page/hook unit tests (Stories 1.1-1.7),
the deleted toggler tests (Story 1.10), the `app`/`protected-route`/tooling tests
(Stories 1.8/1.9/1.12), and the route-agnostic integration suites verified for coverage.

**Tests to add/update.** Coverage consolidation + exact-value mutation-hardening assertions
across the above; deleted-module tests removed.

**Dependencies.** 1.1-1.12 (all production behavior + tooling in place).

**Definition of Done.** `make test-unit-all` + integration green at 100% over `src/**`;
`make test-mutation` shows no surviving mutant on the new branches; no `data-testid` in
`src/**`; no suppression.

---

### Story 1.17: Housekeeping, docs, and full gate sweep

**User story.** As a maintainer, I want the BMAD config and specs index pointed at this spec,
and the full gate sweep confirmed green, so the spec is discoverable and the change is provably
within every repo gate before the PR.

**Description.** Housekeeping (applied by the loop, referenced here):
`_bmad/config.yaml` `planning_artifacts`/`implementation_artifacts` → `specs/sign-up-sign-in-pages/...`
(currently `specs/makefile-playwright-targets/...`, `:9-10`); add a `sign-up-sign-in-pages` row
to the `specs/README.md` "Current Specs" table (`:18-23`). Then run the full gate sweep:
`make format` then `make lint` (ESLint, tsc, `make lint-dup`, `make lint-metrics`),
dependency-cruiser, unit + integration (100% over `src/**`), e2e, visual (regenerated
baselines), memory-leak, Stryker, and confirm the Lighthouse CI gate (~0.85 on `/sign-up`) —
all green with no suppressions and no new inline code comments. The commit header is ≤100 chars
with a `(#31)` scope and `Closes #31` rides the squash message (squash-merge-only; the `cubic`
bot rewrites the PR body and strips manual closers) (NFR14).

**Acceptance Criteria.**

- Given `_bmad/config.yaml`, When read, Then `planning_artifacts`/`implementation_artifacts`
  point at `specs/sign-up-sign-in-pages/...` (housekeeping).
- Given `specs/README.md`, When read, Then the "Current Specs" table has a
  `sign-up-sign-in-pages` row and is markdownlint-clean (housekeeping).
- Given `make lint-dup`, `make lint-metrics`, ESLint, TS, and dependency-cruiser, When run,
  Then all pass with no new suppressions, ignores, or inline code comments (NFR3, NFR4, NFR6,
  NFR7, NFR12, AC19).
- Given the i18n parity check, When run, Then every used key exists in both `en.json` and
  `uk.json` with no hardcoded English; if `sign_in.errors.load_failed` was removed it is gone
  from both (NFR9, AC20).
- Given the Lighthouse CI run, When scored, Then the `/sign-up` mobile score is at/above the
  ~0.85 gate with no eager import of the lazy form section and no new auth-path dependency
  (NFR2, AC18).
- Given the commit, When created, Then its header is ≤100 chars with a `(#31)` scope and the
  squash message carries `Closes #31` (NFR14).

**Files touched.** `_bmad/config.yaml`, `specs/README.md` (housekeeping). No `src/` change.

**Tests to add/update.** None (housekeeping + docs); the gate sweep re-runs all suites.

**Dependencies.** 1.1-1.16 (the whole Epic; the sweep verifies the finished work).

**Definition of Done.** `_bmad/config.yaml` + `specs/README.md` updated and markdownlint-clean;
full gate sweep green (lint, metrics, jscpd, dependency-cruiser, unit + integration 100%, e2e,
visual, memory-leak, mutation, Lighthouse); no suppressions; commit `(#31)`-scoped with
`Closes #31` in the squash message.

---

## Sequencing & Dependency Summary

Stories are ordered so the tree compiles at every step. The reusable primitives (1.1-1.4) are
added first and are independently unit-tested; the pages (1.5/1.6) wire them; the per-page title
hook (1.7) is consumed by the pages; routing (1.8) and the redirect (1.9) swap the URLs once the
pages exist; the toggler is deleted (1.10) only after its replacements are live and wired; the
notification a11y (1.11) is attribute-only and independent of routing; tooling/Lighthouse (1.12),
e2e (1.13), visual (1.14), memory-leak (1.15) follow the live routes; coverage/mutation (1.16)
and housekeeping + gate sweep (1.17) close out the Epic.

`titleComponent` (1.4) is **optional**, so it does not break existing `UIForm` callers; the new
components/pages (1.1-1.7) compile against the still-present old `/authentication` route until
1.8 swaps routing; and the toggler deletion (1.10) only runs after the pages that replace it
exist — `grep loginFormLoader` confirms the only importers are the three toggler files being
deleted, so no unedited consumer is left dangling (R5, AC14).

```text
1.1 AuthSwitcher ─┐
1.2 AuthFormSection ─┤
1.3 AuthPageLayout ──┼─► 1.5 /sign-up ─┐
1.4 UIForm h1 ───────┘   1.6 /sign-in ─┤
1.7 usePageTitle ───────────────────────┤
                                         ├─► 1.8 routing+lang ─► 1.9 redirect ─► 1.10 delete toggler
1.11 notification a11y (independent) ────┘                                              │
                                                                                        ▼
   1.8 ─► 1.12 lighthouse/tooling                                          1.16 coverage+mutation
   {1.5,1.6,1.8,1.9,1.11} ─► 1.13 e2e                                                   │
   {1.5,1.6,1.8,1.1,1.4,1.11} ─► 1.14 visual                                            ▼
   {1.5,1.8} ─► 1.15 memory-leak                              1.1-1.16 ─► 1.17 housekeeping + gate sweep
```

Critical path: (1.1 ‖ 1.2 ‖ 1.3 ‖ 1.4) → (1.5 ‖ 1.6) → 1.7 → 1.8 → 1.9 → 1.10 → 1.16 → 1.17.
Story 1.11 is parallelizable from the start (attribute-only); 1.12-1.15 feed in once the routes
are live and converge into 1.16/1.17.

## Traceability Matrix

Every requirement (FR/NFR/AR/AC/D) and the key WCAG SCs map to the stories that satisfy them;
every story traces to ≥1 requirement.

| Req         | Statement (short)                                                  | Stories                           |
| ----------- | ------------------------------------------------------------------ | --------------------------------- |
| FR1         | Registration at `/sign-up` (lazy, skeleton)                        | 1.5, 1.8, 1.12, 1.13, 1.14, 1.15  |
| FR2         | Login at `/sign-in` (lazy, skeleton)                               | 1.6, 1.8, 1.13, 1.14              |
| FR3         | Remove `/authentication` (no alias)                                | 1.8                               |
| FR4         | Protected-route redirect to `/sign-in`                             | 1.9                               |
| FR5         | URL-changing swap link (`<a href>`)                                | 1.1, 1.5, 1.6, 1.13               |
| FR6         | No `disabled`/loading on the swap link                             | 1.1                               |
| FR7         | Switcher label + destination by page                               | 1.1, 1.5, 1.6                     |
| FR8         | Reusable layout (`AuthPageLayout`)                                 | 1.3, 1.5, 1.6                     |
| FR9         | Reusable form section (`AuthFormSection`)                          | 1.2                               |
| FR10        | Reusable switcher (`AuthSwitcher`)                                 | 1.1                               |
| FR11        | Per-route `document.title`                                         | 1.5, 1.6, 1.7                     |
| FR12        | Preserve lazy-loading shape (chunk isolation)                      | 1.5, 1.6, 1.8                     |
| FR13        | Remove in-place toggler machinery                                  | 1.10                              |
| FR14        | Forms unchanged (only M4/M5 attrs)                                 | 1.5, 1.6, 1.11                    |
| NFR1        | No unintentional visual regression                                 | 1.1, 1.4, 1.11, 1.14              |
| NFR2        | Lighthouse budget (lazy chunks, container-free)                    | 1.8, 1.12, 1.17                   |
| NFR3        | rca metrics gate (per-file caps)                                   | 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8 |
| NFR4        | jscpd DRY via shared components                                    | 1.1, 1.2, 1.3, 1.17               |
| NFR5        | No `data-testid`; semantic selectors                               | 1.1, 1.5, 1.6, 1.9, 1.13, 1.16    |
| NFR6        | No `static`/free functions in `src/**/*.ts`                        | 1.1, 1.7, 1.17                    |
| NFR7        | Type-only files (#88)                                              | 1.1, 1.2, 1.3, 1.4                |
| NFR8        | Faker builders (#101) for test data                                | 1.13, 1.15, 1.16                  |
| NFR9        | i18n en/uk parity                                                  | 1.5, 1.6, 1.10, 1.17              |
| NFR10       | All-layers test refactor + 100% coverage                           | 1.10, 1.13, 1.15, 1.16            |
| NFR11       | Visual baseline regeneration                                       | 1.14                              |
| NFR12       | No suppressions, no new inline comments                            | 1.17 (all stories)                |
| NFR13       | Mutation hardening (exact-value asserts)                           | 1.1, 1.7, 1.8, 1.9, 1.13, 1.16    |
| NFR14       | commitlint / squash-merge discipline                               | 1.17                              |
| AR1         | One real `<h1>` per page (C1)                                      | 1.4, 1.5, 1.6, 1.11               |
| AR2         | Swap-link focus indicator `#404142` (C2)                           | 1.1                               |
| AR3         | Per-route title (M1)                                               | 1.5, 1.6, 1.7                     |
| AR4         | `<html lang>` (M2)                                                 | 1.8                               |
| AR5         | Error-view focus management (M4)                                   | 1.11, 1.13                        |
| AR6         | Notification politeness & single announce (M5)                     | 1.11                              |
| AR7         | Swap-link semantics (link, no pressed/current/disabled)            | 1.1                               |
| AC1         | `/sign-up` renders registration, no login code                     | 1.5, 1.8, 1.13                    |
| AC2         | `/sign-in` renders login, no registration code                     | 1.6, 1.8, 1.13                    |
| AC3         | `/authentication` matches nothing                                  | 1.8                               |
| AC4         | Unauthenticated → `/sign-in` element                               | 1.9                               |
| AC5         | Swap link `<a href>` correct destination, changes URL              | 1.1, 1.5, 1.6, 1.13               |
| AC6         | Swap link never disabled/pressed/current, non-empty href           | 1.1                               |
| AC7         | Three reusable components, no ≥75-token clone                      | 1.1, 1.2, 1.3                     |
| AC8         | Distinct per-route `document.title` + languageChanged              | 1.5, 1.6, 1.7                     |
| AC9         | `<html lang>` equals `i18n.language` (+ change)                    | 1.8                               |
| AC10        | One `<h1>` per page, heading order no skip                         | 1.4, 1.5, 1.6, 1.11               |
| AC11        | `:focus-visible` `2px solid #404142`, resting unchanged            | 1.1, 1.14                         |
| AC12        | Registration error focus not on `<body>`                           | 1.11, 1.13                        |
| AC13        | Success `role="status"`, error `role="alert"`, no dup announce     | 1.11                              |
| AC14        | No orphan importer of deleted modules; green build                 | 1.10                              |
| AC15        | Login/registration submit + flow unchanged                         | 1.5, 1.6, 1.11, 1.13              |
| AC16        | Regenerated baselines visually identical                           | 1.14                              |
| AC17        | 100% integration coverage over `src/**`                            | 1.16                              |
| AC18        | `/sign-up` Lighthouse ≥ ~0.85                                      | 1.8, 1.12, 1.17                   |
| AC19        | lint-metrics/lint-dup/ESLint/dep-cruiser/TS pass                   | 1.17                              |
| AC20        | i18n keys exist + in sync; load_failed parity                      | 1.10, 1.17                        |
| AC21        | No surviving Stryker mutant on new branches                        | 1.16                              |
| AC22        | Lighthouse/CI/tooling no longer reference `/authentication`        | 1.12                              |
| D1          | Switcher color contrast (deferred — `#969B9D` kept)                | 1.1 (deferred)                    |
| D2          | Explicit link-destination text (deferred follow-up)                | 1.1, 1.5, 1.6 (text unchanged)    |
| WCAG 1.3.1  | Info & Relationships — real `<h1>`, heading semantics              | 1.4, 1.5, 1.6                     |
| WCAG 2.4.2  | Page Titled — distinct per-route `document.title`                  | 1.5, 1.6, 1.7                     |
| WCAG 2.4.6  | Headings & Labels — descriptive `<h1>`                             | 1.4, 1.5, 1.6                     |
| WCAG 2.4.7  | Focus Visible — `:focus-visible` ring on the swap link             | 1.1                               |
| WCAG 2.4.11 | Focus Appearance — ≥3:1 `#404142` focus indicator                  | 1.1                               |
| WCAG 3.1.1  | Language of Page — `<html lang>` synced to `i18n.language`         | 1.8                               |
| WCAG 4.1.2  | Name, Role, Value — link semantics, no false "unavailable"         | 1.1, 1.11                         |
| WCAG 4.1.3  | Status Messages — correct notification politeness, single announce | 1.11                              |
