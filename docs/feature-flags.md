# Feature flags

Feature flags let a deployed instance turn behaviour on or off **without a rebuild or a code
change** — incremental rollout for new work, and an emergency kill switch for shipped work
(issue #145).

A flag is not a permanent configuration option. Every flag is a temporary construct with a
planned removal date; a flag that outlives its rollout becomes an untested code path.

## How a flag is evaluated

Flags live in the `flags` object of the runtime configuration block in the HTML shell. The
production container renders that block from `APP_CONFIG_FLAG_*` environment variables at
start-up, so the same image behaves differently per environment. See
`src/config/runtime/README.md` for the mechanism.

A React component or hook reads a flag through `useFeatureFlag(name)` from
`@/hooks/use-feature-flag`, the container-free bridge; `name` is a member of the `FeatureFlag`
union. A container-resolved class injects the service instead:

```ts
// In a container-resolved class
import { inject, injectable } from 'tsyringe';

import RUNTIME_TOKENS from '@/config/runtime/tokens';
import type { FeatureFlagService } from '@/config/runtime/feature-flag-service';

@injectable()
export default class SomeService {
  constructor(
    @inject(RUNTIME_TOKENS.FeatureFlagService) private readonly flags: FeatureFlagService
  ) {}
}
```

Both paths resolve to the same singleton. The value is constant for the lifetime of the document,
so a flag read needs no subscription and no live-region announcement.

`isEnabled(flag)` returns the value from the runtime configuration when it is a boolean, and the
flag's declared default otherwise. An unknown flag name is a **compile error** (the `FeatureFlag`
union), and an `APP_CONFIG_FLAG_*` variable naming a flag that does not exist **fails container
start** — a typo can never silently do nothing.

## Lifecycle

### 1. Introduce — default off

A new flag is added with a default of `false`, so merging it changes nothing that ships. This is
what makes a flag safe to merge before the feature is finished.

1. Add the name to the `FeatureFlag` union in `src/config/runtime/types/feature-flag.ts` and to
   `FEATURE_FLAG_DEFAULTS` in `src/config/runtime/feature-flag-service.ts` with the value `false`.
2. Add the key to the `flags` object in `public/index.html` with the value `false`, and to the
   `flags` shape in `src/config/runtime/app-config-schema.ts`.
3. Declare `APP_CONFIG_FLAG_<UPPER_SNAKE_NAME>` (empty) in the tracked `.env.example` (and in
   your local `.env`), and pass it through the `prod` service in `docker-compose.test.yml`.
4. Gate the code with `useFeatureFlag(...)` / `isEnabled(...)`.
5. Test **both** branches. The off branch is what ships, so it is the one that must keep every
   existing assertion, visual baseline and e2e flow green; the on branch needs its own coverage
   because 100% branch coverage is enforced.

Add the flag and its gated code in the same change. A flag with no call site is dead
configuration, and gated code with no flag is an unreviewed feature.

### 2. Roll out — enable per environment

Set the variable on the target environment and restart the container. No rebuild, no redeploy of
a new artifact:

```sh
APP_CONFIG_FLAG_<UPPER_SNAKE_NAME>=true docker compose -f docker-compose.yml \
  -f docker-compose.test.yml up -d --force-recreate prod
```

`<UPPER_SNAKE_NAME>` is the flag's name in upper snake case; the line is a template, not a
command to paste.

Roll forward one environment at a time (staging, then production). To disable, set the variable
back to `false` (or clear it, which restores the declared default) and restart. Because the value
is read from the HTML shell and `index.html` is served `no-cache`, the change takes effect on the
next page load.

Keep the default `false` in the committed block while a flag is rolling out. Flipping the
committed default is step 3, not a shortcut for step 2.

### 3. Remove — delete the flag, keep one branch

Once the feature is enabled everywhere and stable, the flag has to go. Removal is not optional
housekeeping: while a flag exists, one of its two branches is running untested in production.

1. Delete the call sites, keeping the code of the branch that won.
2. Delete the name from the `FeatureFlag` union, `FEATURE_FLAG_DEFAULTS`,
   `app-config-schema.ts`, and the `flags` object in `public/index.html`.
3. Delete `APP_CONFIG_FLAG_<NAME>` from `.env.example` (and your local `.env`) and
   `docker-compose.test.yml`.
4. Delete the flag-specific tests and collapse the remaining ones onto the surviving behaviour.
5. Unset the variable in every environment **before** the removal deploys. Leaving it set to a
   non-empty value is not harmless: the renderer rejects it as an unknown flag, the entrypoint
   exits non-zero and the container does not start. That failure is the intended signal that the
   environment is stale, but it is an outage if nobody unsets the variable first.

## Current flags

### `userSettings`

Gates the `/settings` page (issue #330), the three coming-soon settings pages
`/settings/integrations`, `/settings/webhooks` and `/settings/billing` (issue #362), and their entry
points in the app shell: the sidebar and drawer Settings group, whose items declare
`flag: 'userSettings'`, and the user menu's profile and Settings links, which load the current-user
chunk only while the flag is on. The `FeatureFlag` union has this one member,
`FEATURE_FLAG_DEFAULTS.userSettings` is `false`, the committed block ships
`{ "flags": { "userSettings": false } }`, and the schema's `flags` object is strict, so a block or
an environment that still names a removed flag fails fast.

- **Default:** `false`. Against user-service v2.8.0, which authenticates nobody, a shipped `true`
  would read and update an arbitrary user, so the committed default and
  `FEATURE_FLAG_DEFAULTS` must stay `false` (a contract test fails otherwise).
- **Roll out:** on in the test stack once the page is complete, then in production after the
  user-service authentication surface ships (request G1). The test stack is on:
  `docker-compose.test.yml` passes
  `APP_CONFIG_FLAG_USER_SETTINGS=${APP_CONFIG_FLAG_USER_SETTINGS:-true}` to the `prod` service, so
  the Playwright, a11y and visual suites see the shell's Settings navigation group, the user menu's
  profile and Settings links, the `/settings` page and the three `/settings/…` coming-soon pages,
  while `docker-compose.yml` and the committed block stay `false`. Set the variable to `false` to
  run the stack without the page.
- **Owner:** the user settings feature (issue #330).
- **Removal trigger:** delete the flag once production has it on and the page is stable; step 3
  of the lifecycle above applies.

### `forgotPassword` (removed)

`forgotPassword`, the first flag, gated the sign-in "Forgot password?" link. Issue #309 removed
it by a product decision to show the link in the form before the recovery flow existed, so it
skipped stage 2. The link points at `ROUTE_PATHS.passwordRecovery`, which #315 registers
together with `/password-reset`, so the flow ships with no flag in any environment: the test
stack, the sandboxes and production all render it. Production depends on its user-service
serving the reset mutations; until a release carries them, the flow there answers with the
retryable transient error rather than a missing page.
`tests/unit/tooling/runtime-config-contract.test.ts` pins that the link is rendered and the
route is registered, with e2e rows in `tests/e2e/route-coverage.tsv`. Any environment that still
sets `APP_CONFIG_FLAG_FORGOT_PASSWORD` to a non-empty value fails container start with
`Known flags: userSettings.` and must unset it.

## Gating a route

A route contract declares `flag: 'userSettings'` instead of reading the flag itself; the eager
`RouteFlagGate` renders the not-found page while the flag is off, above `ProtectedRoute`, so a
visitor without a token gets the same page and the chunk is never requested. `/settings` is the
example (`src/modules/user/features/settings/routes/index.ts`); the mechanics are in
[`src/routes/README.md`](../src/routes/README.md#flagged-routes-issue-330). Gate the entry points
too: a shell navigation item declares the same `flag` (`NavigationLeaf.flag`, used in
`src/components/ui-app-shell/navigation-items.ts`), which `useAvailableNavigationItems` drops while
the flag is off, and the user menu renders its profile and Settings links only while
`useFeatureFlag('userSettings')` is on.

## Rules

- **Default off.** A new flag ships disabled. The only reason to declare a default of `true` is a
  kill switch retrofitted onto behaviour that already ships, and that should be rare enough to
  argue for in review.
- **Boolean only.** Flags are on/off. Anything that needs a value is a configuration setting
  (`apiBaseUrl`, `graphqlUrl`), not a flag.
- **No nesting.** Do not gate a flag on another flag; the combinations are untestable.
- **No flag in a hot loop.** Read it once per component, not per iteration.
- **Give it an owner and a removal trigger** in the pull request that introduces it — "remove when
  the new flow is enabled in production", not "remove eventually".
