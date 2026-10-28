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
- `UserEntity`, `SignInDto`, `SignUpDto`, `RestorePasswordDto`, `CreateNewPasswordDto`,
  `TwoFactorDto` (types) — the board's User domain, see "The User domain types" below.

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

- `RegistrationResponseSchema` — the registration response validator.
- `AuthErrorHandler` (type) — the injected error-handler type; the concrete
  class is DI-wired, not exported as a value.
- `RegistrationResponse`, `SafeUserInfo` (types).

Everything else is **private** to the module and must not cross the boundary:
`repositories/*-impl.ts`, `store/*-mapper.ts`, the `lib/api-errors/*`
subclasses, factories, and every file under `types/**` and `utils/**`. The User domain types
below are no exception to the file rule: they cross the boundary only as re-exports of the module
barrel, never by a deep `types/user/*` import.

### The User domain types (TB-2)

`src/modules/user/types/user/` holds the `[type]` cards of the Miro board's User module frame,
one type-only file per card: `UserEntity`, `SignInDto`, `SignUpDto` (which `extends SignInDto`),
`RestorePasswordDto`, `CreateNewPasswordDto` and `TwoFactorDto` (the board's `2FADTO`, one
`twoFactorCode` field holding a canonical TOTP or recovery code). They are plain `readonly` data
interfaces with no logic; the business rules stay in user-service.

The two-factor code unions the sign-in challenge and the settings section share live in
`src/modules/user/types/two-factor/code.ts`, and `TwoFactorCodeNormalizer`
(`src/modules/user/lib/two-factor-code-normalizer.ts`) turns what a person typed into the canonical
code or `null`. It is an undecorated class with one public method and no collaborator, never
registered in the container; each hook builds one per mount.

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
`<Outlet context={…} />` typed as `ProtectedOutletContext`
(`src/routes/types/protected-outlet-context.ts`), and `AppLayout` forwards it.

The outlet context is the **only seam** through which a non-auth feature reads or writes auth
state. Besides `signOut` it carries the known two-factor status (`twoFactorStatus`, a
`TwoFactorStatus` of `'enabled'`, `'disabled'` or `'unknown'`) and `setTwoFactorStatus`.
`ProtectedRoute` reads the status from `useAuthStore` with a selector, and `setTwoFactorStatus`
calls `useAuthStore.setState` with an `AuthStatePatch` holding that one field and nothing else, so
the settings feature never imports the auth stores. The status lives in memory beside the token and
returns to `'unknown'` with it when the session ends. The app shell and its user-menu slot keep
receiving `signOut` alone, typed as `SignOutContext`
(`Pick<ProtectedOutletContext, 'signOut'>`).

`AppLayout` also forwards `signOut` to the app shell, and the shell's user chip and menu are the
one piece of this module that appears in it. They are not exported through the barrel: the
settings route contract declares them as `shell.userMenu` (a lazy `user-menu` chunk), and the
route composer hands `AppLayout` the loaded component as a prop (see "Shell slots" in
`src/routes/README.md`). The `user` module stays out of every public page's chunks.

`signOut` comes from the `useSignOut` hook (`stores/use-sign-out.ts`). It loads `@auth/stores` with
a **dynamic** `import()` through a `ChunkRetryLoader`, so the eager entrypoint does not grow, and
calls `authActions.logout()` on the singleton. A final load failure is reported through
`observabilityCore` with `source: 'auth:sign-out'` and leaves the user on the protected page. Each
shell sign-out control (the sidebar or drawer row and the chip-menu item) runs `signOut` through
`useOnceCallback`, so the control that was used stays inert until it remounts; the other one can
still be used. This failure is deliberately silent (accepted in the approved design: no live region
on the page), and there is no busy state while the chunk loads; surfacing either is a design-owner
follow-up. Once the token is cleared, the guard redirects to `/sign-in` with `state.focusMain: true`
— set only after a sign-out, never for an unauthenticated visit — and `AuthPageLayout` moves focus
to its `<main>` once, through the same `useArrivalFocus` hook (`src/hooks/use-arrival-focus.ts`)
that `AppLayout` uses after a login. The hook then replaces the entry's state with
`focusMain: false` (keeping `from`), so returning to that entry with Back never moves focus again,
even though `AuthPageLayout` remounts with every auth page.

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

### One mapper names the user for the settings header and the shell chip

**Context.** The settings header already derived a display name and monogram from the full name;
the header chip in the app shell shows the same two values.

**Decision.** `UserDisplayNameMapper` (`store/user-display-name-mapper.ts`, token
`AUTH_TOKENS.UserDisplayNameMapper`, registered as a singleton) is the only place the rule lives.
A name of three or more words reads as `<first> <last>` from the first two words reversed, and the
monogram is the upper-cased first letter of each word of the display name; an empty name yields an
empty monogram, which both consumers draw as the person glyph. `useDisplayName` serves the
settings header and `useCurrentUser` the chip, which reads `ProfileProvider` once per pathname
change and keeps the previous identity when a read ends the session.

**Rejected.** A copy of the rule in the chip (it would drift from the header); resolving the user
from the JWT (see the previous record).

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
field-error text app-wide; borders keep `error.main`. The resend control uses a token that already
passes (`linkText` `#0074B5`, 5.04:1); the greeting keeps the Figma grey under its own entry, below.

**Rejected.** A new contrast exception for the field errors (the defect is fixable at the token);
darkening `error.main` itself (it would change every border and icon that meets 3:1 today).

### The settings greeting keeps the Figma grey

**Context.** The Figma frames of section `6242:41691` draw "Вітаємо!" in the grey `#969B9D`, about
2.81:1 on white, below WCAG 1.4.3; the plan (PRD FR-26, architecture §5.10) proposed `#57595B`
(7.03:1) at the source, as the field errors are fixed above.

**Decision.** The product owner kept the Figma token (2026-10-21). `#settings-greeting` carries a
scoped `color-contrast` exception in `tests/utils/a11y/axe-config.ts`, the tenth entry, tracked with
the other palette debt in [issue #276](https://github.com/VilnaCRM-Org/crm/issues/276) and deleted
when it closes; the name beside the greeting stays `#1A1C1E`.

**Rejected.** `#57595B` at the source (the page would stop matching the frames); an unscoped
exception (the gate accepts one rule, one selector, a reason and a tracking issue per entry).

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

## Two-factor authentication decisions

The durable decisions of two-factor authentication
([issue #331](https://github.com/VilnaCRM-Org/crm/issues/331)). They live here rather than in an
ADR by the maintainer's decision, and each one states its context, the decision and the options
it rejected. The full design is
[the two-factor architecture](../../../specs/two-factor-authentication/planning-artifacts/architecture-two-factor-authentication-2026-10-06.md).
What [Password recovery decisions](#password-recovery-decisions) and
[User Settings decisions](#user-settings-decisions) already record — the board's layers, the
container-free provider loader, `UserServiceErrorTransformer`, the pending-schema mechanism, the
session link and the `/settings` page — is referenced below, not repeated.

### GraphQL-only sign-in, with the REST login removed

**Context.** Sign-in was a REST placeholder that posted to the create-user endpoint and could not
express a second step. user-service implements `signInUser` and the 2FA mutations over GraphQL on
`main` only; the pinned `v2.8.0` has none of them, and the user's rule is that every
user-service operation goes through a GraphQL repository.

**Decision.** `useSignInSubmit` resolves `GraphQLSignInProvider` through the container-free
`AuthProviderLoader`, writes the result to `useAuthStore` and records the security signal; the
provider calls the transport-only `GraphQLSignInRepository` and translates through
`GraphQLSignInTransformer` and `UserServiceErrorTransformer`. `LoginAPI`, `api-config.ts`,
`LoginResponseMapper` and `AuthRepositoryImpl.login` are deleted; registration (`createUser`) and
logout are unchanged. Production sign-in has no backend until user-service ships `signInUser`,
exactly as the REST placeholder had none.

**Rejected.** Keeping the REST placeholder behind a flag-selected sign-in Strategy (a Strategy over
a placeholder with no working backend); waiting for the user-service release before building
(it blocks on an unscheduled tag).

### The sign-in failure card

The result card reads its text from the failure reason of the `AuthError`
(`invalid_credentials`, `locked`, `rate_limited`, `transient`), never from the upstream message,
so two different 401 answers render the same card. `LoginSubmitter.retryable` mirrors
`AuthError.retryable`, which only `transient` sets, and the card offers "Спробувати ще раз" only
then; "Назад" is always there. When a retry settles with a reason that offers no Retry, the
focused button leaves the card, so the heading takes focus back and the alert announces the new
text.

**Open design decision.** The card's contained button (white on the brand `#1EAEFF`, 2.45:1) and
the outlined one match no `A11Y_EXCEPTIONS` entry, and no browser axe scan opens this card, so the
`color-contrast` rule is not exercised for it. A scan needs a scoped exception under issue #276,
which is the owner's call; none was added here.

### The challenge page against Figma (frames 72:4846, 72:4882, 72:4918)

The Figma MCP was reachable, and the three frames were read on 2026-10-27. The page keeps their
structure: the shared card with "Назад", the title, the subtitle and a row of six cells above the
submit. What it deliberately does not copy, for Follow-up 5.4 to reconcile with design:

- **Copy (D1).** The frames still carry the e-mail wording ("Ми надіслали Вам лист на пошту …")
  and a "Надіслати код ще раз" row with a `00:34` countdown. The page uses the authenticator copy
  from the PRD and has no e-mail, resend row or countdown.
- **Tablet cells.** The 1024 frame draws cells of about 86 × 130 px that fill the card; the page
  keeps the 64 × 86 desktop cell (8 px gap) from the `md` breakpoint up and the 49 × 64 cell
  (4 px gap) below it,
  so the card width stays the sign-in card's at every width.
- **Pin-input overrides (NFR-6).** The cell border is `paletteColors.border.strong`, the invalid
  border the error red and the focus ring the shared two-colour ring, where the frames draw a thin
  grey border only.

- **Recovery mode (D12).** None of the three frames draws it; the research lists the recovery-code
  entry as a missing frame. The mode is built from the story's own acceptance criteria: one
  labelled field with the `XXXX-XXXX` helper, no placeholder, the strong grey border and the
  shared invalid state, and a `UILinkButton` toggle in the form footer, which replaces the frames'
  "Надіслати код ще раз" row. Design owns the final look.

The live measurement at 1440, 1024 and 375 px on port 3005 could not run in this worktree, whose
shared `node_modules` lacks `zustand` and the ui-toolkit, so the dev server cannot build. The
recorded frame sizes (card 502 × 404, cells 64 × 86 at 8 px, mobile cells 49 × 64 at 4 px) are what
the pin-input styles and their tests pin; the measurement is left for CI or the owner.

### The pending file lives in #315's mechanism

**Context.** No user-service tag declares the six operations, and the pinned schema is what
codegen and the local mock read.

**Decision.** `src/api/contracts/pending/two-factor-authentication.graphql` opens with
`# pending-against: v2.8.0` and holds one `extend type Mutation`, the input, payload and
payload-data types in the upstream field order, and `scalar Iterable`, declared once. `codegen.ts`
maps `Iterable` to `unknown`, never `any`, and the stateless mock answers the six operations from
`docker/apollo-server/lib/two-factor-resolvers.ts`. The pin bump deletes the file by hand; there
is no expiry checker.

**Rejected.** A second mechanism for this feature (two ways to extend the schema); hand-written
operation types (they would drift from the contract); a stateful mock (every refusal is exercised
by `page.route` stubs and msw handlers, where CI runs it).

### The token and the pending session stay in memory, in `useAuthStore`

**Context.** A pending session id is a credential for one challenge, and the access token must
not outlive the tab. The auth paint path stays free of tsyringe, Apollo and zod.

**Decision.** `pendingSessionId`, `twoFactorStatus` and `recoveryCodesRemaining` live in the
Zustand store `useAuthStore` beside the token, never inside it, and hooks write them with
`setState`; the store gains no action and no `persist` middleware. A reload, a logout and arrival
on `/sign-in` clear the pending session. No refresh token is kept anywhere in client state, and
the id never appears in a URL or in `history.state`. See
[`docs/state-architecture.md`](../../../docs/state-architecture.md).

**Rejected.** Persisting either value (a stolen tab or a stray log would replay a session);
carrying the id in the URL or router state (it would reach history and referrers); a challenge
actions class on the store (the board draws the hook writing State directly).

### The challenge is a page-guarded public route

**Context.** A sign-in can return a challenge in every environment, so the route must be reachable
whether or not the settings flag is on, yet it must not render without a pending session.

**Decision.** `/sign-in/two-factor` is registered with `guard: 'public'` and no flag. The page
renders only while a pending session id exists in the store; without one — a typed URL, a reload,
a new tab or Forward — it replaces itself with `/sign-in`, with no notice and no request. A
completed challenge calls the same `postLogin.proceed()` as a password sign-in, and the redirect
target never lands on the challenge itself.

**Rejected.** Gating the route behind a flag (a challenge could not complete where the flag is
off); a protected route (the user has no token yet); keeping the challenge across a reload (the
server session lives 300 s and allows five attempts, and the client holds no copy of it).

### The 2FA section lives in `features/settings` and reaches auth state through the outlet context

**Context.** Sibling features may not import each other, yet the section must know whether 2FA is
on and tell the app when that changes.

**Decision.** `TwoFactorSettings` fills the slot of the settings `UserProfile` page and reaches
`TwoFactorSettingsProvider` through React hooks. The known status — `'enabled'`, `'disabled'` or
`'unknown'` — is read and written only through the protected outlet context that `ProtectedRoute`
provides: `signOut`, `twoFactorStatus` and `setTwoFactorStatus`, the last of which calls
`useAuthStore.setState` with an `AuthStatePatch` and nothing else. That context is the only seam
through which a non-auth feature reads or writes auth state; `SignOutContext` stays the pick of
`signOut` that the shell and its user-menu slot receive.

**Rejected.** Importing `useAuthStore` from the settings feature (a feature-to-feature edge that
dependency-cruiser forbids); a status query (user-service has no 2FA query, and `User` exposes no
2FA field); a second store for the status (two sources for one fact).

### The flag gates only the 2FA section

**Context.** The operations are mocked until a release carries them, so production must keep the
management UI hidden, while the challenge must keep working wherever a sign-in returns one.

**Decision.** `twoFactorAuth` is a runtime flag shipped `false`, declared in the `FeatureFlag`
union, `FEATURE_FLAG_DEFAULTS`, the strict schema, the committed block and `.env.example`. The
`UserProfile` page reads it with `useFeatureFlag('twoFactorAuth')` when it renders and shows the
section only while it is on. No route contract lists it and no sign-in code reads it. The test
stack passes `APP_CONFIG_FLAG_TWO_FACTOR_AUTH=${APP_CONFIG_FLAG_TWO_FACTOR_AUTH:-true}`, so every
browser lane renders the section by default (an explicit `false` runs without it), and production
enables it in Follow-up 5.1; the flag is deleted once production has run with it on.

**Rejected.** A flag that selects the sign-in transport (the decision above removed the choice); a
route-level flag on the challenge (see the previous records); no flag at all (production would
show management screens against a backend that cannot answer them).

### 2FA failures are classified by rows appended to the shared transformer

**Context.** user-service answers the 2FA refusals with a status and an English message and no
`extensions.code`, and two 401s on one operation (a wrong code and an expired session) differ only
by their text.

**Decision.** `UserServiceErrorTransformer` gains the reasons `locked`, `invalid_code`,
`expired_session`, `setup_not_initiated`, `already_enabled`, `not_enabled` and `reauth_required`.
A `423` gives `locked`; six exact messages give the others, matched whole, with or without a
status; `twoFactorCode` joins the properties whose violations classify as `violation`. The rows
are appended to the two-step classification above, and every earlier row keeps its result. The
sign-in and settings Data providers map the reason to their own outcome; no hook reads a GraphQL
shape or an English message.

**Rejected.** A contains-match on the message (`Invalid two-factor code. Retry` must not classify
as a wrong code); reading `extensions.code` (upstream sends none); a second classifier per feature
(the shape step is shared).

### The QR encoder is `qrcode-generator`, drawn as SVG in the settings chunk

**Context.** user-service returns an `otpauthUri` and the raw `secret`, never an image. The
secret must not leave the browser, and the content security policy allows only same-origin
images and `data:`.

**Decision.** `qrcode-generator` (MIT, pinned exactly) encodes the URI at error correction `M`.
`qr-code-image.tsx` is the only file that imports it; it reads the module matrix and draws one
`<svg role="img">` path on a white quiet zone of four modules, with no `dangerouslySetInnerHTML`,
no `data:` URI, no network and no `eval`. The encoder is loaded with the settings chunk, never
the eager entry or the auth chunks. A decoder (`jsqr`, Apache-2.0) is a `devDependency` used only
by a round-trip test that decodes the drawn path back to the exact URI.

**Rejected.** A QR image service (it would send the secret to a third party); a canvas or
`data:` image (a second rendering path outside the security headers' review); hand-rolling the
encoder (an untested numeric core).

**Built in Story 3.1.** `QrCodeImage` takes a `value` and a `label` (`QrCodeImageProps`), merges
each row's runs of dark modules into one subpath and caps its width at 200 px; the Figma size is
measured where Story 3.4 composes it. `useCopyToClipboard` publishes `ClipboardCopy` (`status`
`idle` / `copied` / `failed` and `copy({ text, fallbackTarget })`): it writes through
`navigator.clipboard.writeText`, and when the API is missing (an insecure origin) or rejects it
selects the target's contents and reports `failed`, never moving focus.
`tests/unit/tooling/qr-code-containment.test.ts` pins that `qrcode-generator` has one importer
and that nothing outside the settings feature imports the image or the hook.

### The 2FA settings path is a Data provider, a Transformer and a transport-only Repository

**Context.** The four settings mutations carry secrets: the setup answer holds the TOTP secret
and the otpauth URI, confirm and regenerate hold the recovery codes. None of them may reach the
Apollo cache, a log or a type that is not named.

**Decision.** `TwoFactorSettingsProvider` (`settings/data-providers/`) takes exactly three
collaborators: `GraphQLTwoFactorSettingsRepository`, `GraphQLTwoFactorSettingsTransformer` and the
shared `UserServiceErrorTransformer`. Each of its four methods resolves a
`TwoFactorSettingsOutcome`: `changed` with a `TwoFactorSettingsEntity`, or `failed` with one of nine
reasons. The repository only sends: one uncached `mutate` per call with a fresh `clientMutationId`,
the caller's signal and, for confirm and disable, the `TwoFactorDto` code; an already aborted signal
throws an `AbortError` before Apollo is called. The transformer holds the failure table as
module-level data and narrows each answer through the zod schemas in
`settings/utils/response-schemas.ts`, so a recovery code list that is not an array of strings is a
`server` failure. The documents select only `otpauthUri` and `secret`, `recoveryCodes`, or
`success`. The provider records no security signal; `session_ended` covers a transport 401 and
"Access Denied.", and the session link has already ended the session by then.

**Code fact (2026-10-27).** The settings feature gains `data-providers/index.ts`, which default
exports the profile provider and names the 2FA one. `repositories/` and `transformers/` already had
such barrels, and the 2FA provider's file name is too long to import on one line under the 100
column limit, which prettier cannot wrap for a single specifier.

### The 2FA section is coordinated by hooks that hold the secrets in React state

**Context.** The settings section turns 2FA on, off and regenerates its recovery codes. The TOTP
secret, the otpauth URI and the recovery codes must live only as long as the view that shows them.

**Decision.** `useTwoFactorSettings` resolves the provider with `useService`, reads
`twoFactorStatus` and `setTwoFactorStatus` from the outlet context, builds one
`TwoFactorCodeNormalizer` per mount and composes `useTwoFactorSetup`, `useTwoFactorDisable` and
`useRecoveryCodesRegenerate`. Nothing is sent on mount. Each operation is a `TwoFactorOperationPlan`:
typed module-level data naming the view after a changed outcome, the status to record and one row
per expected failure. `useTwoFactorSettle` applies a plan; a failure with no row becomes the
`rate_limited` banner or the Retry-able `transient` one, and `session_ended` publishes nothing and
calls neither `recordStatus` nor a sign-out, because the session link has ended the session and the
`ProtectedRoute` redirect unmounts the section. `useSettledSubmit` and `useCodeSubmit` wrap
`useAbortableSubmit` with the settle step and the code normalisation (six digits to confirm, six
digits or `XXXX-XXXX` to disable). Retry keeps no captured input: the banner action clicks the
form's own submit through `useSubmitRetry`, so react-hook-form validates and the normaliser reads
the field as it is now, and a submit that is disabled while a request runs cannot send twice. The
same holds for the sign-in challenge. Each banner failure bumps `bannerOccurrence`, which `UIForm`
keys its banner by, so a second failure in a row mounts a fresh banner that takes focus and is
announced again; offline, the Retry action is `aria-disabled` and described by the offline
notice. `useTwoFactorTransition` keeps the
entity and the view state, and reconciles every transition: the URI and key survive only in the
`setup` view, the recovery codes only in `codes`, and the status follows the view, so "Готово", a
stale setup and unmount all leave an entity with `null` secrets.

### The 2FA card against the Figma frames (313:10242, 313:10480, 313:10606)

**Check.** `figma-design-check` ran against the CRM design file with the Figma MCP answering. The
desktop frame puts the setup card (479 px wide) beside the 675 px profile column, and the tablet and
mobile frames stack it below; `SettingsGrid` already has that 479 px second column, so the card is
its second child. The card takes its tokens from the frame: a white card with a 1 px `#E1E7EA`
border and a 12 px radius, the title in Golos Bold 22 `#1A1C1E`, a divider under the header, 24 px
`#E1E7EA` step badges with Inter Medium 16 `#57595B`, step text in Golos SemiBold 16 `#404142`, the
QR code in a `#FBFBFB` frame with a 12 px radius, and the key chip on `#EAECEE` with a 4 px radius
and Golos SemiBold 16 `#57595B`.

**Deviations, all recorded.** The frames carry no off view and no start button, so the off view is
built from the story: a description, the three steps and the contained "Почати налаштування"
submit. The frames show the key twice, as the manual key under the QR code and again under step 3;
the card shows it once, with a separate outlined "Скопіювати ключ" button (border `#80878A`, text
`#1B2327`) in place of the copy glyph inside the chip. The Google logo is dropped, the app is named
in the step text only, and the info-circle callout that quotes a seven-day reset is not built,
because the product makes no such promise. The frames have no section heading; the `h2` is added so
the card is a named region, and the `h3` carries the view title and takes focus on arrival. Copy is
Ukrainian from the story; the frames' Russian text is not used. Live measurement on port 3005 could
not run here, so the sizes above are pinned in unit tests and the CI visual lane is the measurement.

### The codes view, the status headings and the flag gate

The codes view is a `UIForm` whose submit is "Готово". It shows the eight codes as an ordered list
(`#1A1C1E` on `#EAECEE`), an outlined "Скопіювати коди" button that copies them newline-separated
through `useCopyToClipboard`, and a `UICheckbox` "Я зберіг(-ла) коди в надійному місці". While the
box is unticked the form passes `submitBlockedReason`, so "Готово" stays focusable, is
`aria-disabled` and described by the reason, and sends nothing; the ticked state is local to the view,
and the view that replaces it holds no code. The on view and any off view with a status code show one
focused level-3 status heading, the only announcement: "Двофакторну автентифікацію ввімкнено" with a
decorative icon, "вже ввімкнено", "Налаштування застаріло. Почніть знову.", "вимкнено" and "вже
вимкнено". `/settings` mounts the card as the second child of `SettingsGrid` through a small
`TwoFactorSection` that reads the `twoFactorAuth` flag, so with the flag off no 2FA hook is called
and the grid renders as before. The views for disable, regenerate and re-authentication belong to the
next story.

### Turning 2FA off and regenerating the codes

**Figma.** The three frames (313:10242, 313:10480, 313:10606) draw only the setup card; they hold no
on view, no disable or regenerate confirmation and no re-authentication message, so these views are
built from the story copy and the card's tokens, and no state is invented beyond it.

**Behaviour.** The on view keeps its status heading and adds two outlined buttons, "Вимкнути" and
"Створити нові резервні коди" (border `#80878A`, text `#1B2327`). Each opens a `UIForm` confirmation
with a focused level-3 title, "Скасувати" in the form's footer, and the banners of the other views.
The disable form has one labelled "Код підтвердження" text field with no placeholder; it takes six
digits or `XXXX-XXXX` (the hook normalises it) and shows the format or wrong-code text with
`aria-invalid`, described by the helper text, with focus back in the field after every settle.
"Скасувати" or Escape returns to the on view with focus on the button that opened the confirmation:
`usePreviousView` records the view each view came from once per change, and the panel hands it to
the views through `ArrivalContext`, so the plain on view takes focus on its heading only when a
transition (done, setup 409) brought the user there and never on first render. A regenerate refused
for a stale sign-in shows the re-authentication message, focused, with an outlined "Увійти знову"
(text `#1A1C1E`) that runs the outlet `signOut` as `callbacks.signInAgain`; the section never ends a
session on its own.

### The low recovery codes notice

**Figma.** There is no frame for the notice, so it takes the settings card tokens (white, 1 px
`#E1E7EA` border, 12 px radius) and the story's colours: the link `#0074B5`, the outlined
"Закрити сповіщення" button with border `#80878A` and text `#1B2327`, and the shared `2px #404142`
focus ring.

**Behaviour.** A challenge that completed with a recovery code and reported two or fewer remaining
codes leaves that number in the auth store. `ProtectedRoute` reads it through
`useRecoveryCodesBanner` and puts the lazily loaded `RecoveryCodesNotice` into the outlet context as
`banner`; `AppLayout` renders it first inside `<main>`, so a page without one keeps exactly the DOM
it had. The hook builds the lazy component once per mount in a `useState` initializer, from a
`ThemedChunkLoader` over a `ChunkRetryLoader` and `muiThemeShellLoader`, behind the non-null
`RouteFallback`; with no count the chunk is never requested, and a chunk that cannot load renders
nothing rather than breaking the page. The notice is a polite `role="status"` region that mounts
empty, is filled in an effect and never takes focus; the count has uk one, few, many and other
forms and en one and other forms, and zero reads "Резервні коди закінчилися". The link goes to
`/settings` client-side and, like the button and arriving on `/settings`, clears the count;
sign-out and a reload clear it because the store is memory-only.

### The challenge and notice copy are lazy catalogs

**Context.** The first cut put `two_factor.*` and `recovery_codes_notice.*` in the auth catalog,
so 3,749 B of the minified merged catalog (about 0.9 KB gzip) shipped in the eager `index.js` of
every page, and the CI Lighthouse `resource-summary:script:size` budget failed on `/sign-in`, the
two recovery pages and `/`.

**Decision.** Both are lazy catalogs in `config/i18n-catalog-policy.json`. The challenge copy lives
in `features/auth/routes/two-factor-catalog/i18n` and registers when the `two-factor-challenge`
route module evaluates, before `RecoveryPageLayout` sets the title; its owners are that route, the
`components/two-factor` folder, the two challenge hooks that name its keys and the auth route
contract for `meta.titleKey`. The notice copy lives in `components/recovery-codes-notice/i18n` and
registers when the lazy `recovery-codes-notice` chunk evaluates; its owners are that component
and `use-recovery-notice-message.ts`. The sign-in notices the challenge sends back
(`sign_in.notices.two_factor_expired`, `sign_in.notices.account_locked`) stay in the auth catalog,
because `/sign-in` renders them. Tests use `createTwoFactorLocaleI18n` and
`createCodesNoticeLocaleI18n`; the `performance serving` test pins that no eager module
imports either catalog or a challenge or notice component.

**Rejected.** Keeping the copy eager (it costs every page, including those that never show a
challenge); one catalog for both (the notice renders in the protected shell, the challenge on a
public route, so either owner would pull the other's keys into its chunk).

### The 2FA card in the browser lane

`tests/e2e/modules/user/features/settings/two-factor-settings.spec.ts` drives the card with a seeded
token and both flags forced on through `overrideRuntimeConfig`, with the setup and confirm answers
stubbed by `two-factor-settings-responses.ts` (each with a unit test) and the profile by
`stubProfile`. It covers the flag gate, the Authorization header, the busy status, focus on each new
heading, the QR image, the key in groups of four, both clipboard paths, the three confirm outcomes,
the recovery codes and the acknowledgement, Retry that sends exactly one more request, the shared
`2px #1A1C1E` focus ring and the pin cells inside the card at 320, 360, 600, 767, 768 and 1024 px.
`expectNoSecrets` runs after the steps that hold a secret. Playwright and the production stack are
CI-only, so this spec ran nowhere in the local loop. `two-factor-manage.spec.ts` does the same for
turning 2FA off and regenerating the codes, and also drives the re-authentication sign-in back to
`/settings`. The same applies to the bundle-size report that
must show `qrcode-generator` only in the `settings` chunk: the PR comment is the evidence, and a
sighting in the eager entry, an auth chunk or the deferred DI chunk is a defect to fix, not a budget
to raise.

### `UIForm` explains a submit that cannot be pressed yet

**Context.** The recovery codes view of Story 3.4 must not let "Готово" send before the user
confirms they saved the codes, but a natively disabled button leaves keyboard and screen reader
users without the reason, because it drops out of the tab order.

**Decision.** `UIForm` takes a scalar `submitBlockedReason`. While it is set, the submit is
`aria-disabled="true"` instead of `disabled`, keeps its contained style and stays focusable; the
form refuses the submit event, so click, Enter and Space call neither `onSubmit` nor validation;
and the reason shows under the button in `#404142`, its id appended to `aria-describedby` after the
offline notice id. A native disabled state wins: offline, `isSubmitDisabled` and submitting hide
the reason and set `disabled`. Without the prop every existing form renders as before. The wiring
sits in `use-form-submission.ts` and `use-submit-block.ts`, each with its own test.

### `UIPinInput` adopts the toolkit pin input with the project's overrides

**Context.** The code is six digits typed or pasted. The toolkit's `UiPinInput` supplies the cells
but its default border, focus ring, gap and placeholder do not meet the accessibility target.

**Decision.** `src/components/ui-pin-input/` is the only file importing
`@vilnacrm/ui-toolkit/ui-pin-input`. It overrides the rest border with `#80878A`, paints the shared
`focusVisibleRing` (`2px solid #404142`, offset `2px`), sets the cell gap and size per breakpoint
(8 px and 64 × 86 px from `md`; 4 px and at most 49 × 64 px below it), hides the toolkit's
constant `placeholder="0"` with a transparent `::placeholder` colour, and takes the group label
and a per-cell label from the caller. It adds no live region: one element carries the error
message. `docs/ui-toolkit.md` lists the overrides.

**Rejected.** Forking the toolkit component (it would stop tracking the pin); six separate text
inputs (no paste handling); an `sx` breakpoint key for the sizes (the project's `md` comes from
`breakpointsTheme`, not the MUI default).

### Both surfaces are scanned and tabbed in every state

**Context.** The challenge and the settings card each have several states that only differ by
what a screen reader announces and where Tab goes, and the route scan alone sees one of them.

**Decision.** Four Playwright specs under `tests/e2e/a11y/` cover them in all three desktop
engines: `two-factor-challenge-states` and `two-factor-settings-states` run the allowlisted axe
scan plus the no-positive-`tabindex` check (`expectCleanScan`) on every state, and
`two-factor-challenge-keyboard` and `two-factor-settings-keyboard` walk the tab order with
`expectTabOrder`, then check Enter, Space, Escape, the focus target of each change and the
colours with `toHaveCSS`. `A11Y_EXCEPTIONS` keeps its ten entries; the unit test that pins the
count is unchanged. The keyboard specs start from the heading that holds focus after the
transition; the challenge climbs with Shift+Tab to reach back-to-main, and the off view starts
from a click on the section heading. The
settings card paints its outlined buttons with the settings ring, `2px solid #1A1C1E`, offset
2 px, as `profile-form` does; the pin cells and the challenge's own controls keep `#404142`
and the mode toggle `#0074B5`. The story text named `#404142` for every new control, and the
code decides: the settings ring is the page's, not the toolkit's.

**Not done here.** The NVDA and VoiceOver pass (group name, cell names, one error, whether the
hidden `placeholder="0"` is read) needs a person with both screen readers; its evidence is
listed for Follow-up 5.7, and the specs above do not stand in for it.

### Both surfaces have a touch lane

**Context.** The cells, the toggle and the confirmation controls are new tap targets whose size
and layout only a device context measures.

**Decision.** `tests/e2e/mobile/two-factor-challenge-touch.spec.ts` and
`two-factor-settings-touch.spec.ts` run on `mobile-chrome` and `mobile-safari` against GraphQL
stubs per `operationName`. Sign-in, the challenge in both modes, enrolment, turning 2FA off and
regenerating the codes finish with `tap()`; the code is typed with the keyboard after the first
cell is tapped, as a phone keyboard would. They pin 44 CSS px for the cells, the fields and every
submit, 24 CSS px for "Назад", the mode toggle, the copy buttons and the checkbox, no horizontal
overflow at 320, 390 and 412 px, every setup or challenge cell inside its card's content box at 320,
360, 600 and 767 px, and a submit that stays in view when the layout viewport shrinks to keyboard
height. The reduced-motion check pins what the feature itself declares: the card, the section and
the heading carry no `transition-duration` or `animation-name`, and the page's `scroll-behavior`
is not `smooth`; MUI's own button transitions are the toolkit's and are not measured.

### The visual baselines come from CI

**Context.** Baselines recorded on a laptop differ from the pinned Playwright image by font
hinting and sub-pixel rasterisation, so a local run would fail the first CI run.

**Decision.** `tests/visual/visual-comparison.two-factor.spec.ts` and
`tests/visual/mobile/two-factor.spec.ts` are committed without images. The first CI `visual
tests` run on the branch fails on the missing baselines and uploads the actual screenshots as an
artifact; those files, copied unchanged into the matching `-snapshots` folders, are the baselines.
No existing baseline changes. The desktop spec records the challenge in authenticator mode and the
settings off state on the full 13-size matrix, and recovery mode, the wrong-code error, setup with
the fixed secret and QR, the recovery codes, on, the disable confirmation, re-authentication,
`/sign-in` with the expired notice and `/` with the low-codes notice at desktop, tablet and mobile
sizes. The mobile spec records the challenge and the settings off state on both device projects.
Each test asserts the expected heading before the snapshot's `waitForStableDom` runs, so a redirect
or a not-found page is never recorded in its place.

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
