# `user` module

Auth, registration, 2FA, and profile for VilnaCRM. This document is the
**public API contract** for the module: what other modules and the app shell
may import, and how the boundary is machine-enforced (issue #107).

## Public API

Code outside a boundary imports the `user` module **only** through a public
barrel — never a deep internal path.

### Module barrel — `@/modules/user` (`src/modules/user/index.ts`)

- `ApiError` — the module's public error type (consumed by the shared
  `error-parser`).
- `AuthRepository` (type) — the public repository interface.
- `LoginResponse` (type) — the public login response shape.
- `UserEntity`, `SignInDto`, `SignUpDto`, `RestorePasswordDto`, `CreateNewPasswordDto`
  (types) — the board's User domain, see "The User domain types" below.

Two deliberate deviations from the issue's illustrative example, both forced by
this codebase:

- **Route entry components stay out of the barrel.** The issue example shows
  `Authentication` / `ProtectedRoute` here, but the feature owns its routes
  through its `routes/index` **route contract** (`@auth/routes`), which
  **code-splits** the page entries (`load: () => import('./sign-up|sign-in')`);
  the app-shell registry consumes that contract and the composer imports the
  `protected-route` guard directly. Re-exporting components from this barrel
  would (a) defeat lazy-loading (the auth page's mobile Lighthouse budget) and
  (b) pull React into every consumer of the barrel — including the plain
  `error-parser` util. They remain the documented router-only exception below.
- **The feature interface/response types are re-exported by their leaf type
  paths, not through the `@auth` barrel.** The `@auth` barrel re-exports
  `AuthErrorHandler`, whose implementation imports `error-parser`, which imports
  this barrel for `ApiError`; routing the module barrel through `@auth` therefore
  forms a `module ↔ feature` cycle (`no-circular`, verified). The module root
  `index` is the module's sanctioned composition point (`no-feature-internal-imports`
  intentionally exempts it), so it re-exports the feature's **leaf type files**
  directly — matching the issue's own example.

### Feature barrel — `@auth` (`src/modules/user/features/auth/index.ts`)

- `LoginResponseSchema`, `RegistrationResponseSchema` — response validators.
- `AuthErrorHandler` (type) — the injected error-handler type; the concrete
  class is DI-wired, not exported as a value.
- `LoginResponse`, `RegistrationResponse`, `SafeUserInfo` (types).

Everything else is **private** to the module and must not cross the boundary:
`repositories/*-impl.ts`, `store/*-mapper.ts`, the `lib/api-errors/*`
subclasses, factories, and every file under `types/**` and `utils/**`. The User domain types
below are no exception to the file rule: they cross the boundary only as re-exports of the module
barrel, never by a deep `types/user/*` import.

### The User domain types (TB-2)

`src/modules/user/types/user/` holds the `[type]` cards of the Miro board's User module frame,
one type-only file per card: `UserEntity`, `SignInDto`, `SignUpDto` (which `extends SignInDto`),
`RestorePasswordDto` and `CreateNewPasswordDto`. They are plain `readonly` data interfaces with
no logic; the business rules stay in user-service.

TB-2: a board type crosses component and form boundaries as itself (`UIForm<SignInDto>`), and
form values may only `extends` a DTO to add UI-only fields. The `*Dto` and `*Entity` names are
reserved for this folder;
[`tests/unit/tooling/domain-type-names.test.ts`](../../../tests/unit/tooling/domain-type-names.test.ts)
fails when an interface or alias with either suffix is declared anywhere else in `src/`.

## Two sanctioned exceptions

Both are narrow, documented, and enforced by dependency-cruiser — not a
free-for-all.

1. **DI composition roots** (issue #109) — the thin aggregator
   (`src/config/dependency-injection-config.ts`) holds no registrations; it
   collects the per-module / per-infra registrars. The **user-module root**
   (`src/modules/user/config/di.ts`) wires this module's concrete
   implementations (Apollo, auth repositories, mappers, auth utils) into the
   tsyringe container against its own token module
   (`src/modules/user/config/tokens.ts`, `AUTH_TOKENS`) and may deep-import
   them. The impls stay private to everyone else.
2. **App-shell router** (`src/routes/`) mounts the feature through its
   module-owned **route contract barrel** (`@auth/routes` →
   `features/auth/routes/index`), which lazy-`load`s the page entries, plus the
   `protected-route` guard (resolved by the composer for `guard: 'protected'`).
   The router may reach a feature **only** through that `routes/index` contract
   and the guard — deep-importing a page (`@auth/routes/sign-up`) is forbidden.
   A single eager barrel would pull the whole feature into one chunk and defeat
   lazy-loading (the auth page's mobile Lighthouse budget), so the pages stay
   `import()`-split inside the contract. Governed by
   `no-routes-import-feature-internals` (issue #105); see `src/routes/README.md`.

## Sign-out through the protected outlet context (issue #106)

The module barrel cannot export `authActions` (it would close a `no-circular`
cycle and break barrel purity), and code outside the module may not import
`@auth/stores`. The sign-out action therefore reaches protected pages through
react-router **outlet context**: `ProtectedRoute` renders
`<Outlet context={{ signOut }} />` typed as `ProtectedOutletContext`
(`src/routes/types/protected-outlet-context.ts`), and `AppLayout` forwards it.

`signOut` comes from the `useSignOut` hook (`stores/use-sign-out.ts`). It loads
`@auth/stores` with a **dynamic** `import()` through a `ChunkRetryLoader`, so
the eager entrypoint does not grow, and calls `authActions.logout()` on the
singleton. A final load failure is reported through `observabilityCore` with
`source: 'auth:sign-out'` and leaves the user on the protected page, where the
button can be pressed again. This failure is deliberately silent (accepted in
the approved design: no live region on the page), and there is no busy state
while the chunk loads; surfacing either is a design-owner follow-up. Once the
token is cleared, the guard redirects to `/sign-in` with
`state.focusMain: true` — set only after a sign-out, never for an
unauthenticated visit — and `AuthPageLayout` moves focus to its `<main>` once,
through the same `useArrivalFocus` hook (`src/hooks/use-arrival-focus.ts`) that
`AppLayout` uses after a login. The hook then replaces the entry's state with
`focusMain: false` (keeping `from`), so returning to that entry with Back never
moves focus again, even though `AuthPageLayout` remounts with every auth page.

## Password recovery decisions

The durable decisions of the password recovery flow
([issue #315](https://github.com/VilnaCRM-Org/crm/issues/315)). They live here rather than in
an ADR by the maintainer's decision, and each one states its context, the decision and the
options it rejected. The full design is
[the password recovery architecture](../../../specs/create-new-password/planning-artifacts/architecture-create-new-password-2026-10-05.md).

### Layers follow the Miro board

**Context.** The board's User/Auth frame draws a root page component, React hooks, a
`[Data provider]`, `[Transformer]`s and a `[Repository]`; it draws no frontend controller or
service. The auth tree cannot reach `@/providers/di` (the paint-path carve-out).

**Decision.** A root page `[component]<route>` renders React hooks built on the shared
`useAbortableSubmit`. The hooks reach the Data provider `PasswordRecoveryProvider` through one
container-free `AuthProviderLoader` in `@auth/stores/index.ts`. The provider calls the Repository
`GraphQLPasswordRecoveryRepository` and hands every result to two Transformers:
`UserServiceErrorTransformer` (module-shared, GraphQL failure → `UserServiceFailure`) and
`PasswordRecoveryTransformer` (failure or success → recovery outcome). Data providers live in
`features/<f>/data-providers/`, feature Transformers in `features/<f>/transformers/` and
module-shared ones in `src/modules/<m>/transformers/`; all three folders are in
`config/module-shape.json`, the DI-collaborator gate and the component gate
`components-no-direct-injectable-import`.

**Rejected.** Controller and service classes (not on the board); a proxy, a factory and an
interface per flow (one implementation needs none of them); error translation inside the
repository (the board puts it on the Data provider ⇄ Transformer edge).

### The Data provider loads through `AuthProviderLoader`

**Context.** The auth render path cannot reach `@/providers/di` (`useService`), and only the
feature's composition root, `@auth/stores/index.ts`, may import the DI container. Sign-in already
solves this with `DeferredAuthActions`, which loads the container on the first auth action.

**Decision.** `AuthProviderLoader` sits beside `DeferredAuthActions` in `@auth/stores/index.ts`
and serves the board's `[Data provider]` layer: `resolve(token)` imports
`@/config/dependency-injection-config` through a `ChunkRetryLoader` on the first call (memoized,
a failed import forgotten), resolves the token from the container, and captures a final import
failure once with the source `auth:provider-load` and a failed `container.resolve` (a DI wiring
error, such as an unregistered token) once with the source `auth:provider-resolve`, rethrowing
both. `useAuthProviderLoader`
builds one loader per page mount in a `useState` initializer, so no module-level instance exists.
The page hands that loader to `useResetPassword` or `useCreateNewPassword` as a parameter, so
their tests pass a stub loader and the loader hook's test checks mount-local identity. The pages
therefore reach `PasswordRecoveryProvider` without tsyringe, zod, Apollo or the repository on the
paint path.

**Rejected.** `useService` (forbidden on the auth paint path); a module-level loader singleton
(untestable without module mocking); adding the provider's steps to `DeferredAuthActions` (it
writes the auth store, and the recovery outcomes are page-local).

### GraphQL through the container's Apollo client

**Context.** Both steps are user-service GraphQL mutations. The variables carry an e-mail, a
reset token and a new password, and the process-wide `InMemoryCache` would keep them.

**Decision.** The repository calls the container's `AUTH_TOKENS.ApolloClient` with two
generated documents, `RequestPasswordReset` and `ConfirmPasswordReset`, each selecting only
`clientMutationId`, with `fetchPolicy: 'no-cache'`. The link chain gains no retry link: a reset
request sends an e-mail and a confirm consumes a token, so a retry is user-initiated only. Both
methods resolve `void` whatever the payload. No failure is silenced: the link's error link reports
every network and GraphQL error it sees, and the repository reports a rejection that never reached
the link (a client-side bug, not an abort) through the injected `ObservabilityService` with the
source `auth:password-recovery`, then rethrows it for the Data provider to classify.

**Rejected.** REST transport (the user-service contract for these steps is GraphQL); the
default cache policy (it writes the token and password under `ROOT_MUTATION`); a transport retry
(duplicate side effects); selecting `user` (nothing identifying is needed).

### Failures are classified in two steps

**Context.** user-service answers an input violation with `<property>: <reason>` and
`extensions.status` 422, a domain refusal with a bare translated message and no code, and an
endpoint limiter with HTTP 429.

**Decision.** `UserServiceErrorTransformer.normalize` classifies by shape first — abort, network
status, a violated input property prefix, a numeric `extensions.status`, any other message as a
refusal, otherwise unknown — and `PasswordRecoveryTransformer.fromFailure` then maps that failure
by step (`request` or `confirm`) to one recovery outcome through a data table. No step reads a
translated message for meaning.

**Rejected.** Classification by message text (translated, unstable); one transformer per
operation (#330 and #331 reuse the shape step and append rows only).

### One request outcome for every address

**Context.** A reset request must not tell an attacker whether an address has an account.

**Decision.** Every resolved request becomes the same `RecoverySentOutcome` with the masked
address; only an invalid e-mail, the per-address rate limit, a network or a server failure
differ, and none of those depends on the account existing.

**Rejected.** A "no such account" message (account enumeration).

### Pending schema extension until user-service releases the mutations

**Context.** user-service declares both mutations on `main` only; the pinned contract v2.8.0
has neither.

**Decision.** The declarations are copied verbatim from user-service `main` into one pending
extension under `src/api/contracts/` that codegen and the stateless local Apollo mock read (see
[the contracts guide](../../api/contracts/README.md)). The follow-up contract pin bump to the
first release that declares them deletes the extension and its wiring.

**Rejected.** Waiting for a release (blocks the feature); a commit-SHA pin (the pin check needs
equal `vX.Y.Z` tags); a self-expiring checker (a manual follow-up deletion is simpler).

### The reset token stays in memory

**Context.** The reset link carries a credential in its query string.

**Decision.** `useResetToken` reads the `token` parameter once, keeps it only in memory, and
strips it from the URL with a `replace` navigation in a layout effect before the form paints. No
input renders it, and it never reaches the cache, the history or telemetry. The hook returns
the usable token as a plain `string | null` (issue #315's layer stack), which the form section
hands to the confirm form as its `token` default. `useCreateNewPassword` never sees the token
outside the submitted `CreateNewPasswordDto`; when the API reports the link as invalid it
returns the `invalid` view, so the form unmounts and no retry is offered with the token; the page
then passes `active = false` to `useResetToken`, which drops the token from memory (FR-22).

**Rejected.** Keeping the token in the URL or in storage (history, referrers, logs); a token
handle that the flow hook writes back into, an edge the board does not draw.

### One shared password policy

**Context.** The new password must satisfy the same policy as sign-up, and the live rule list
must not drift from the validator.

**Decision.** The shared `PasswordValidator` enforces the policy and exposes the rule results
the live list renders; it is never weaker than the API.

**Rejected.** A second recovery-only policy; a policy copied rule for rule from the API.

### Retry is the form's own submit

**Context.** Issue #315's sequence diagrams show a transient failure as "banner + Retry", and
both recovery cards end in a single primary button.

**Decision.** While the transient banner shows (`network` or `server`, which are retryable),
`useRecoveryFailureBanner` reports `retry`, and the form's submit reads
`auth.error.tryAgain` ("Спробувати ще раз") instead of "Підтвердити". It resubmits the current
values; the rate-limit banner keeps "Підтвердити". When the banner hides after five seconds the
label returns to "Підтвердити".

**Rejected.** A second Retry button beside the banner (two primary actions for one request).

### Sign-in and sign-up results use one notification

**Context.** Sign-up already replaced its form with the website's full-card notification for
every server result; sign-in showed failures as red text under the form, always reading "unknown
error", and redirected silently on success.

**Decision.** Sign-in uses the same lazily loaded `RegistrationNotification` with
`flow="signIn"`. A settled failure shows the error card: a focused h2 "Трапилась помилка", the
message in an alert filled after mount (mapped from the `AuthError` kind and HTTP 429, never the
backend text), and both "Спробувати ще раз" (resubmits the last values) and "Назад" (aborts any
running request, returns to the form with the values kept and focuses the e-mail field). A sign-in
shows the success card (focused h2 "Вітаємо!", "Ви успішно увійшли" in a status region,
"Продовжити"); its button performs the existing redirect to the preserved destination with focus on
`<main>`, and nothing redirects on a timer. While a card shows, the form, its submit and the OAuth
row are inert; its buttons use `aria-disabled` while busy so focus is never dropped. A page that
mounts with a token already present never shows the card.

**Rejected.** The red banner (no heading, no recovery action, easy to miss); a notice on the
destination page (still a silent swap to `/`); a timed auto-redirect (WCAG 2.2.1).

### The sandbox demo walks the whole flow

**Context.** A pull-request sandbox is a static site with no backend, and no environment
delivers the reset e-mail before user-service releases the mutations.

**Decision.** Like the demo login (issue #309), `SandboxDemoSessionProvider` issues a fixed demo
reset token for exactly `demo@vilnacrm.com` and accepts only that token, and only while the demo
is active (a non-production build or a sandbox host). `GraphQLPasswordRecoveryRepository`
resolves both steps for those inputs without calling the API, standing in for it the way the
pending contract and the local mock do. On the sent step, `SandboxDemoResetLink` replaces the
e-mail with a link to `/password-reset` carrying the token. Outside an approved sandbox host,
production deployments render nothing new.

**Rejected.** Reading the link from mock-server logs (unusable on a sandbox); a demo path for
every address (it would bypass the browser specs that stub GraphQL).

### Both routes are public

**Context.** A signed-in user may still follow a reset link.

**Decision.** Both recovery routes use `guard: 'public'`; neither redirects a signed-in user nor
touches `useAuthStore`.

**Rejected.** Redirecting signed-in users away (breaks a link opened in a signed-in browser).

### The "Назад" colour overrides the Figma token

**Context.** Figma `72:5605` draws the "Назад" row of the recovery cards in `Font/300`
`#969B9D`, about 2.8:1 on white, below WCAG 1.4.3.

**Decision.** `CardBackControl` renders the text and chevron in `Font/200` `#404142`
(`customColors.text.primary`, about 10:1), keeping the Golos Medium 15/18 type of the frame. The
design owner is asked to confirm the token. The primary result links ("До входу", "Запросити
нове посилання") keep the Figma pill, white on `#1EAEFF` (2.45:1); one scoped `color-contrast`
entry in `A11Y_EXCEPTIONS` covers exactly those two links under issue #276. The owner confirmed
that choice on 2026-10-14, following the DEV-67 decision for the sign-in "Забули пароль?" link:
the brand fill stays until #276 resolves the palette for every exempted control at once.

**Rejected.** Shipping the Figma grey (fails WCAG 1.4.3); a second contrast exception for the
back row; an accessible `#0074B5` fill or a dark label on the two links alone, which would leave
them unlike the Figma frames and every other brand-colour control before #276 decides.

### No feature flag

**Context.** The planning bundle kept a `forgotPassword` flag `false` by default and enabled it
in the test stack after the route registration. Issue #309 has since removed that flag: the
sign-in "Забули пароль?" link renders unconditionally and points at
`ROUTE_PATHS.passwordRecovery`.

**Decision.** The flow ships without a flag; registering the route contract is what makes the
link land on the recovery page instead of the not-found page.

**Rejected.** Re-introducing the flag (it would gate a link that already ships, see
[the feature-flag lifecycle](../../../docs/feature-flags.md)).

### Domain Outcome

**Context.** The board's User module draws `UserEntity` and its DTOs, and the business rules
live in user-service.

**Decision.** `UserEntity` and the DTOs (`SignInDto`, `SignUpDto`, `RestorePasswordDto`,
`CreateNewPasswordDto`) are data-only interfaces in `src/modules/user/types/user/`, exported
from the module barrel. `RestorePasswordDto` is the forgotten-password request;
the sign-in and sign-up credential types of the auth feature were renamed to `SignInDto` and
`SignUpDto`, and the forms are typed by the DTOs.

**Rejected.** Per-feature DTO copies; a parallel `*FormValues` copy of each DTO; behaviour or
validation on the domain types.

### Upstream requests

The flow depends on user-service for three things: a reset link host on the SPA origin, a
release tag that declares both mutations, and (optionally) a machine-readable code on GraphQL
errors. The GraphQL limiter gaps are tracked upstream in
[user-service #462](https://github.com/VilnaCRM-Org/user-service/issues/462),
[#469](https://github.com/VilnaCRM-Org/user-service/issues/469) and
[#470](https://github.com/VilnaCRM-Org/user-service/issues/470).

## User Settings decisions

The durable decisions of the user settings page
([issue #330](https://github.com/VilnaCRM-Org/crm/issues/330)). They live here rather than in an
ADR by the maintainer's decision, and each one states its context, the decision and the options
it rejected. The full design is
[the settings architecture](../../../specs/user-settings/planning-artifacts/architecture-user-settings-2026-10-06.md).
What [Password recovery decisions](#password-recovery-decisions) already record — the board's
layers and folders, `UserServiceErrorTransformer`, the lazy-catalog mechanism and the shared
password policy — is referenced below, not repeated.

### One flag, read when the route renders

**Context.** user-service v2.8.0 authenticates nobody, so the page ships off in production and on
in the test stack. The router is built at module evaluation, before the guarded runtime-config
load, and the mobile Lighthouse floor has no headroom for another eager read.

**Decision.** A route contract declares one `flag`. `RouteMapper` copies it into the route's
`handle`, and an eager `RouteFlagGate` above `ProtectedRoute` reads the flag when the route
renders and shows the not-found page while it is off, so neither the redirect nor the page chunk
is reached.

**Rejected.** Filtering the contracts by flag while the router is built (it would read the block
before the guarded load); gating inside the page chunk (`ProtectedRoute` redirects first and the
chunk is requested).

### The current user is the first edge of `users(first: 1)`

**Context.** The pinned schema has no `me` query, and upstream scopes the `users` collection to
its owner.

**Decision.** The page reads `users(first: 1)` and sends the IRI of that edge back verbatim in
`updateUser`; nothing decodes the JWT.

**Rejected.** Decoding the token for an id (a second source of identity, and a format the SPA
does not own); a pending schema extension for a `me` query (a contract the backend has not
agreed to).

### The settings layers follow the Miro board

**Context.** The folders, the Data provider ⇄ Transformer edge and the container-free loader
belong to the recovery flow above. The settings page is the board's
`UserProfile [component]<route>`.

**Decision.** A `UserProfile` route renders the `UserProfileSettings` and `ChangePassword`
components, which run React hooks over `useAbortableSubmit`. The `ProfileProvider` Data provider
is the translation boundary: it takes three injected collaborators (the Repository, the
Transformer and `ObservabilityService`), hands every result and every rejection to
`GraphQLProfileTransformer`, which composes #315's `UserServiceErrorTransformer`, calls
`GraphQLProfileRepository`, and captures a failure that never reached the link, as #315's
recovery flow does. Every value that crosses a layer carries a named type (TB-1), and the
recovery flow's `UserEntity` is passed down as itself rather than copied (TB-2).

**Rejected.** Controller, service and handler classes (not on the board); a deps bag in place of
three injected collaborators; a second Transformer for failures (the shape step is shared).

### Only changed fields travel, through the container's Apollo client

**Context.** The update carries the current password and a new one, and the process-wide
`InMemoryCache` would keep them; a retried update could be applied twice.

**Decision.** `updateUser` receives a change-only input that always carries the `id` and the
current password. It runs with `fetchPolicy: 'no-cache'`, a minimal selection, the abort signal
and no retry link. `resendEmailToUser` selects only `id` and `confirmed`.

**Rejected.** Sending the whole form (it would overwrite unchanged fields and re-trigger the
uniqueness check on an unchanged e-mail); the default cache policy (it would keep passwords); a
transport retry (duplicate side effects).

### Settings appends rows to the two-step classification and amends it for five texts

**Context.** #315's "Failures are classified in two steps" rejects classification by message
text. user-service answers the owner refusal and the wrong current password with a bare message
and no code (user-service G8), and the e-mail uniqueness violation differs from other e-mail
violations only by its text.

**Decision.** `UserServiceErrorTransformer` gains a 401 status row and the `initials` and
password properties. This entry amends #315's decision by name: whole-message matching is allowed
for exactly the listed upstream texts until G8 ships codes. Three rows in a new exact-message
step between the violation step and the generic refusal step cover "Access Denied.", "Old
password is invalid" and "Старий пароль невірний"; the e-mail uniqueness text, in en and uk, is
a set read inside the violation step that yields the taken reason. Every other message still
classifies by shape, so #315's "never reads the message for meaning" case stays green.
`GraphQLProfileTransformer` then maps the failure to field errors or to one of four reasons.

It also amends #315's violation step by name. API Platform reports several constraint violations
of one `updateUser` as a multi-line message, so the step reads one `FieldViolation` per line
instead of one for the whole message. A line with an unknown property is flagged, not dropped:
the set carries `complete: false` and keeps every recognised line. The rule that an unknown line
means no field errors and one toast lives in `GraphQLProfileTransformer`, the settings consumer,
so the shared step stays shape-only. On the confirm step of password recovery a `token` line
anywhere in the message still gives `invalid_link`, before or after a `newPassword` line and
beside an unknown line.

**Rejected.** Matching `extensions.code` (upstream drops it); a substring or case-insensitive
match of a message (it would turn a translation change into a silent misclassification); half
field errors and half toast for one failure.

### One rule ends a session, in the link

**Context.** A token the backend no longer accepts leaves the user on a page whose every call
fails.

**Decision.** `SessionLinkFactory` adds the Bearer token to every non-anonymous operation and,
on a transport 401, ends the session exactly as `logout()` does: observability, the sandbox demo
session and the cleared store. It records the token each request carried on the operation
context and ends the session only while the store still holds that token, so a late 401 for a
request sent with an earlier token, or with none, leaves a session begun since, or a sign-out
already done, alone. Whether a network error is a 401 is asked of #315's
`UserServiceErrorTransformer` (`reason === 'unauthenticated'`), so the link and the settings
hooks, which do nothing on `session_ended` and rely on the link, read the status in one place.
The link receives its five collaborators as one `SessionLinkDeps` value
(`AUTH_TOKENS.SessionLinkDeps`): the store, `CLEARED_AUTH_STATE` itself rather than a copy, the
sandbox demo session, `ObservabilityService` and the error transformer, because a constructor may
take three arguments under `make lint-metrics`. `ProtectedRoute`, which now remembers that it saw a
token, then shows the `session_ended` notice on `/sign-in`, in its own neutral info tone. #315's
`RequestPasswordReset` and `ConfirmPasswordReset` are anonymous, so a reset link opened while
signed in never ends the session.

**Rejected.** Ending a session on a GraphQL error or on another status (a validation failure is
not a dead session); a per-feature 401 rule (every feature would repeat it); the green success
check for the notice (it is not a success); a sign-out class shared by `logout()` and the link
(a new `*Handler` module singleton, which the board rules out); injecting the render-path
`authActions` (the container would import the auth composition root that lazily imports the
container, a cycle dependency-cruiser's `no-circular` rejects), so `logout()` and the link each
run the three steps against the same `CLEARED_AUTH_STATE`.

### Two-factor authentication has its own page

**Context.** Figma `72:4846` draws the 2FA code entry as a standalone page.

**Decision.** That challenge is #331's own public route, not part of `/settings`. The settings
grid keeps only a slot for the 2FA settings card of Figma `313:10242`, and a one-child grid keeps
the profile card's width.

**Rejected.** Rendering the challenge inside `/settings` (the user is not signed in yet).

### Outcomes are toasts with no timer

**Context.** One Save can succeed for the name, fail for the e-mail and be rejected for the
password, and a confirmation that disappears can be missed.

**Decision.** `UIToastStack` shows at most three toasts with no timer. Success texts are
announced through one always-mounted polite region and error texts through one always-mounted
assertive region, so neither is a region created and filled in the same commit. Closing the last
toast returns focus to Save, or to the page heading while Save is disabled. The success icon uses
`success.text` (`#2E7D32`, 4.55:1 on the success surface), since the Figma `#38B386` is 2.34:1,
under the 3:1 graphics floor. A field error is shown on its field, never as a toast.

**Rejected.** A timer (a confirmation could be lost before it is read); a toast per field error
(the user would fix the wrong place).

### The settings copy is a lazy catalog

**Context.** `src/i18n.js` imports the merged catalog into the eager `index.js` that `/sign-in`
downloads, and its mobile Lighthouse budget has no headroom.

**Decision.** `settings/i18n` is listed in `config/i18n-catalog-policy.json` and registered
when the route module evaluates, by the mechanism #315 introduced. The rule list's
`password_policy.*` keys leave the recovery catalog for a catalog the shared
`UIPasswordPolicyRules` component owns, so a key resolves wherever the component renders, and the
toast's `ui_toast.close` is a lazy catalog `components/ui-toast` owns, since only the settings
chunk renders a toast. Every lazy catalog registers through one container-free
`lazyCatalogLoader` (`src/lib/locale-catalog`) that takes the owner's JSON as a named
`LocaleCatalogPair`, so the owner keeps its static import and a new catalog adds no class.

**Rejected.** The eager merged catalog (it grows `index.js` on `/sign-in`); reusing #315's lazy
recovery keys outside their owners (they would render raw); one loader class and module singleton
per catalog (three byte-identical copies, and #331 would add a fourth).

### Field-error contrast is fixed at the source

**Context.** `MuiFormHelperText` error text uses `paletteColors.error.main` (`#DC3939`), about
4.48:1 on white at 14 px, below WCAG 1.4.3.

**Decision.** A new token, `paletteColors.error.text` (`#C62828`, about 5.62:1), colours the
field-error text app-wide; borders keep `error.main`. The greeting and the resend control use
tokens that already pass, and `A11Y_EXCEPTIONS` gains no entry.

**Rejected.** A new contrast exception (the defect is fixable at the token); darkening
`error.main` itself (it would change every border and icon that meets 3:1 today).

### The local mock is a stateless happy path

**Context.** The local Apollo mock is for development, and the browser lanes cannot reach it.

**Decision.** `users`, `updateUser` (the owner check and one e-mail violation) and
`resendEmailToUser` (the same owner check) answer from one seeded user. Every other error shape —
the transport 401, the wrong password, the taken e-mail, 429, 5xx, the time-out — lives in msw and
`page.route`.

**Rejected.** A stateful mock that models 401, 429, 5xx and the time-out (it would be a second,
untested implementation of the backend).

### Upstream requests of the settings page

The page depends on user-service for the items below, filed as issues. None of them blocks the
test stack, and G1 blocks production only. The page is tracked in
[crm #330](https://github.com/VilnaCRM-Org/crm/issues/330).

- **G1** — release `main`'s authentication surface:
  [user-service #513](https://github.com/VilnaCRM-Org/user-service/issues/513).
- **G2** — a `me` query for the signed-in user:
  [#515](https://github.com/VilnaCRM-Org/user-service/issues/515).
- **G3** — the caller's own unchanged e-mail is rejected as already taken:
  [#516](https://github.com/VilnaCRM-Org/user-service/issues/516).
- **G4** — profile changes without the current password, and OAuth users:
  [#518](https://github.com/VilnaCRM-Org/user-service/issues/518), with the password-policy
  mismatch in [#517](https://github.com/VilnaCRM-Org/user-service/issues/517).
- **G5** — avatar field, upload and storage:
  [#519](https://github.com/VilnaCRM-Org/user-service/issues/519).
- **G6** — signed-in social link, list and unlink:
  [#520](https://github.com/VilnaCRM-Org/user-service/issues/520).
- **G7** — GraphQL `updateUser` and `deleteUser` bypass the rate limiters:
  [#521](https://github.com/VilnaCRM-Org/user-service/issues/521).
- **G8** — a machine-readable `extensions.code` on domain errors:
  [#522](https://github.com/VilnaCRM-Org/user-service/issues/522).

[#514](https://github.com/VilnaCRM-Org/user-service/issues/514) (CORS headers for `X-Request-Id`
and `X-Correlation-Id`) is the production blocker for every GraphQL call from the SPA. The page,
its shared pieces and its layer stack are described in the
[settings feature README](features/settings/README.md).

## Enforcement

`make lint` runs all three gates; fix a violation by routing through the
barrel, never with a suppression.

- **dependency-cruiser** `no-module-internal-imports` — outside-module code may
  reach a module only through its `index`.
- **dependency-cruiser** `no-feature-internal-imports` — module-level
  `store` / `types` / `lib` / `hooks` / `utils` / `config` may reach a feature
  only through its `index` (except the module DI composition root
  `config/di.ts`, which wires the feature's internals — issue #109).
- **ESLint** `no-restricted-imports` — a fast in-editor signal that blocks deep
  imports under `@/modules/*/*` and `@auth/*/*` from outside the boundary.

dependency-cruiser is the authoritative graph-level gate; ESLint is the fast
signal. Neither may be weakened to pass.

## Adding a compliant module or feature

Generate it — `make new-module name=<m> feature=<f>` (or `make new-feature
module=<m> feature=<f>`) emits the folders, barrels, DI wiring, i18n pair and
test skeletons already compliant with every gate. The folder law and the full
file list live in [`docs/scaffolding.md`](../../../docs/scaffolding.md).

The barrel rules the generator follows, and that you must keep following as the
module grows:

1. Keep the barrel(s): `src/modules/<m>/index.ts` (module) and the feature entry
   `src/modules/<m>/features/<f>/index.*`. This feature uses a re-export barrel
   (`index.ts`); a generated feature ships an entry component (`index.tsx`) that
   the route contract lazy-loads. Either way it is the **only** path in, so expose
   only what must cross the boundary — if you are unsure, it is private.
2. Keep the barrel lean and one-way (module `index` → feature internals) so
   `no-circular` stays green. Export a service's **type** and DI-wire its class
   when only the type crosses the boundary.
3. Import across the boundary through the barrel. For a deeply nested feature,
   add a bare alias like `@auth` in `tsconfig.paths.json`, `jest.config.ts`,
   and `rsbuild.config.ts`.
4. Run `make lint-deps` and iterate until green. Never weaken a rule.
