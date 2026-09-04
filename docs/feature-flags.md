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

```ts
// In a React component or hook
import useFeatureFlag from '@/hooks/use-feature-flag';

const showForgotPassword = useFeatureFlag('forgotPassword');
```

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
3. Declare `APP_CONFIG_FLAG_<UPPER_SNAKE_NAME>` (empty) in both `.env` and `.env.example`, and
   pass it through the `prod` service in `docker-compose.test.yml`.
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
APP_CONFIG_FLAG_FORGOT_PASSWORD=true docker compose -f docker-compose.yml \
  -f docker-compose.test.yml up -d --force-recreate prod
```

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
3. Delete `APP_CONFIG_FLAG_<NAME>` from `.env`, `.env.example` and `docker-compose.test.yml`.
4. Delete the flag-specific tests and collapse the remaining ones onto the surviving behaviour.
5. Unset the variable in every environment. Leaving it set is harmless — the renderer will reject
   it on the next restart, which is the intended signal that the environment is stale.

## Current flags

| Flag             | Default | Meaning                                                       |
| ---------------- | ------- | ------------------------------------------------------------- |
| `forgotPassword` | `false` | Shows the "Forgot password?" link on the sign-in options row. |
| `oauthProviders` | `false` | Shows the OAuth provider row on the sign-in / sign-up form.   |
| `rememberMe`     | `false` | Shows the remember-me checkbox on the sign-in options row.    |

`forgotPassword` is the worked example of stage 1. The link points at
`ROUTE_PATHS.passwordRecovery`, and the recovery route does not exist yet — which is exactly why
the flag defaults to `false`. Enable it only once the recovery flow is implemented, then follow
stage 3 and delete the flag.

`oauthProviders` and `rememberMe` (issue #150) are stage-1 flags for the same reason: each gates a
control whose backing flow does not exist yet — the provider buttons open an endpoint no server
implements, and the checkbox persists nothing. Default-off keeps the UI free of dead-end
affordances; enable one only when its flow ships, then follow stage 3 and delete the flag.

That precondition is enforced, not merely documented:
`tests/unit/tooling/runtime-config-contract.test.ts` fails the build if the committed default for
`forgotPassword` is ever flipped to `true` while no route contract registers
`ROUTE_PATHS.passwordRecovery`. A flag that gates a link should carry the same kind of gate.

## Rules

- **Default off.** A new flag ships disabled. The only reason to declare a default of `true` is a
  kill switch retrofitted onto behaviour that already ships, and that should be rare enough to
  argue for in review.
- **Boolean only.** Flags are on/off. Anything that needs a value is a configuration setting
  (`apiBaseUrl`, `graphqlUrl`), not a flag.
- **No nesting.** Do not gate a flag on another flag; the combinations are untestable.
- **No flag in a hot loop.** Read it once per component, not per iteration.
- **Give it an owner and a removal trigger** in the pull request that introduces it — "remove when
  the recovery flow ships", not "remove eventually".
