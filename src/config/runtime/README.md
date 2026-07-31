# Runtime configuration (`@/config/runtime`)

Deployment-time configuration that an administrator can change **without a rebuild**, plus the
typed feature-flag service that reads it (issue #145).

`@/config/env` (issue #112) is the **build-time** layer: `REACT_APP_*` values are inlined into the
JS bundle by RSBuild, so changing one requires a new build. This module is the **runtime** layer:
its values live in the HTML shell, which the production container rewrites at start-up. Build-time
values remain as defaults; runtime values win.

## Where the configuration lives

The configuration is an inline JSON block in the HTML shell, `public/index.html`:

```json
{ "flags": { "forgotPassword": false } }
```

It is carried by a `script` element with `id="app-runtime-config"` and
`type="application/json"` — a data block, not executable code, so it stays valid under a strict
Content-Security-Policy without a nonce.

`serve.json` already sends `Cache-Control: no-cache` for `/` and `/index.html`, so a redeploy is
never served from a stale cache.

### Why inline and not a fetched `app-config.json`

The auth pages are gated by a Lighthouse mobile performance floor that has no headroom
(`lighthouse/lighthouserc.mobile.js`). A separate config request is **not** discoverable by the
preload scanner — it can only start after `index.js` executes — so awaiting it before
`root.render()` serializes a full round trip onto FCP and LCP. An inline block costs zero
requests and zero added latency, and it is read synchronously, which also keeps the module-eval
router construction in `src/routes/routes.tsx` working unchanged.

## Why two layers

Same reasoning as `@/config/env`, and measured on this codebase before choosing:

| File                   | Deps  | Reads          | Use it from                            |
| ---------------------- | ----- | -------------- | -------------------------------------- |
| `app-config-source.ts` | none  | lazy, memoized | paint path / any zod-free code         |
| `app-config.ts`        | `zod` | once, frozen   | container-resolved code wanting typing |
| `app-config-schema.ts` | `zod` | —              | the zod contract (constraints)         |
| `types/*.ts`           | none  | —              | the hand-authored interfaces           |

Importing `zod` from the boot path was measured against a production build: the eager entrypoint
grows from 373 kB to 436 kB raw (+62 kB) with `zod`, or to 418 kB (+45 kB) with `zod/mini`,
against a hard 470 kB `raw.maxInitialEntrypointBytes` budget. Both fit the byte budget, but the
extra parse and evaluation work lands on the critical path that the 0.84 mobile floor cannot
absorb. So the split mirrors `raw-env.ts` / `env.ts` exactly.

- **`appConfigSource`** (`@/config/runtime/app-config-source`) — dependency-free singleton and the
  only place that touches the DOM block. It memoizes on the block's text, so repeated reads are
  free and a test that rewrites the block is picked up. Import it **directly** on the paint path.
- **`appConfig`** (`@/config/runtime/app-config`) — parses the same snapshot through the zod
  schema **once** at module load, freezes it, and **fails fast** with an aggregated
  (`z.prettifyError`) message. It is registered as `RUNTIME_TOKENS.AppConfig` and injected into
  `GraphQLUrl`, which lives behind the dynamic-import DI composition root — so `zod` never reaches
  the auth paint path.

The `AppConfigValues` interface is hand-authored rather than `z.infer`, because a `types/` file
may not import the runtime schema (dependency-cruiser `type-files-no-runtime-imports`, issue #88).
The `private readonly values: AppConfigValues` assignment in `app-config.ts` is the compile-time
check that the two stay in sync.

## Where invalid configuration is caught

Fail-fast happens at the earliest point that can act on it, not only in the browser:

1. **Container start** — `scripts/docker-entrypoint.sh` runs `scripts/render-app-config.js`,
   which rejects a non-`http(s)` URL, a flag value that is not exactly `true`/`false`, and an
   `APP_CONFIG_FLAG_*` variable naming a flag that does not exist. The entrypoint exits non-zero,
   so a misconfigured deployment never starts serving.
2. **Browser boot** — `src/index.tsx` calls `appConfigSource.load()` before `createRoot`, so a
   malformed or non-object JSON block throws immediately with a named error instead of silently
   degrading to defaults.
3. **Container-resolved code** — `appConfig` zod-validates the same snapshot when the DI graph
   loads, and `tests/unit/config/runtime/app-config-defaults.test.ts` validates the **committed**
   block in `public/index.html` against the schema, so the shipped default cannot drift from the
   contract.

## Settings

| Key            | Environment variable                 | Falls back to           |
| -------------- | ------------------------------------ | ----------------------- |
| `apiBaseUrl`   | `APP_CONFIG_API_BASE_URL`            | `REACT_APP_MOCKOON_URL` |
| `graphqlUrl`   | `APP_CONFIG_GRAPHQL_URL`             | `REACT_APP_GRAPHQL_URL` |
| `flags.<name>` | `APP_CONFIG_FLAG_<UPPER_SNAKE_NAME>` | the declared default    |

`apiBaseUrl` is read by `@/utils/url-builder` (the REST origin), `graphqlUrl` is injected into
`GraphQLUrl` (the Apollo endpoint), and flags are read through `featureFlagService`.

Each URL setting falls back to the build-time variable its consumer already read before this
module existed, so existing deployments behave exactly as before until an `APP_CONFIG_*` value is
supplied. Note the REST fallback is `REACT_APP_MOCKOON_URL`, not `REACT_APP_API_BASE_URL` —
`url-builder` has always used the former, and this change deliberately does not repoint it.

A runtime URL that is not an absolute `http(s)` URL is treated as absent by the paint-path reader,
so a malformed value falls back to the build-time default instead of reaching `fetch`. The zod
layer rejects it outright (`z.url({ protocol: /^https?$/ })`), matching what the container
entrypoint enforces. All three validators accept the same set, including single-label Docker
hostnames such as `http://prod:3001` — note `z.httpUrl()` would **not**, because it additionally
requires a dotted hostname, which would let a value pass container start and then fail in the
browser.

**Not covered:** `mainLanguage` / `fallbackLanguage` stay build-time. `src/i18n.js` initializes
i18next at module evaluation and is CommonJS, and `src/config/i18n-config.js` is `require`d by
node tooling without a TypeScript loader, so making the language runtime-configurable is a
restructuring of the i18n boot path rather than a config change. Tracked separately.

## Feature flags

`featureFlagService` (`@/config/runtime/feature-flag-service`) is a container-free class exported
as a module singleton and registered as `RUNTIME_TOKENS.FeatureFlagService`, mirroring the
observability render-path leaves (issue #115). Registering the instance as a value is what lets
container-resolved classes inject it instead of value-importing it (issue #130), while the auth
paint path can still read a flag without loading tsyringe.

React components read a flag through `useFeatureFlag` (`@/hooks/use-feature-flag`):

```ts
const showForgotPassword = useFeatureFlag('forgotPassword');
```

The flag name is a `FeatureFlag` union member, so a typo is a compile error. Flag lifecycle —
introduce, roll out, remove — is documented in `docs/feature-flags.md`.

## Adding a setting

1. Add the key to the JSON block in `public/index.html` (this block is the source of truth for
   which flags exist — `render-app-config.js` rejects any flag it does not find there).
2. Add the field to `app-config-schema.ts` and to the matching interface in `types/`.
3. For a flag: add the name to the `FeatureFlag` union in `types/feature-flag.ts` and to
   `FEATURE_FLAG_DEFAULTS` in `feature-flag-service.ts`.
4. For a URL setting: add the `APP_CONFIG_*` variable to `URL_SETTINGS` in
   `scripts/render-app-config.js`.
5. Declare the environment variable in **both** `.env` and `.env.example`
   (`make check-env-sync`), and pass it through the `prod` service in `docker-compose.test.yml`.
6. Read it through `appConfigSource` (paint path) or `appConfig` (container-resolved code) — never
   from the DOM directly.
