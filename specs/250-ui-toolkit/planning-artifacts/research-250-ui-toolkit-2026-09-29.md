---
status: 'complete'
workflowType: 'research'
researchType: 'technical'
project_name: 'crm'
date: '2026-09-29'
issue: 250
corrected: '2026-09-29 (pass 1: #185 addendum, F6 and F8; pass 2: N2; pass 3: R3-1, R3-2)'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/250'
  - 'https://github.com/VilnaCRM-Org/website/pull/459'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/pull/185'
  - '.github/dependabot.yml'
  - '/home/dima/Desktop/crm-worktrees/plans/discovery-106-250-2026-09-28.md'
  - 'research note: crm-state (analyst, 2026-09-29, inline in the run task)'
  - 'research note: toolkit (analyst, 2026-09-29, inline in the run task)'
  - 'research note: website (analyst, 2026-09-29, inline in the run task)'
  - 'research note: gates (analyst, 2026-09-29, inline in the run task)'
  - 'package.json'
  - 'bun.lock'
  - 'node_modules/@vilnacrm/ui-toolkit/package.json'
  - 'src/components/ui-breakpoints/index.ts'
  - 'src/components/ui-color-theme/index.ts'
  - 'jest.config.ts'
  - 'Makefile'
  - 'scripts/ci/check-lockfile-registries.sh'
  - 'scripts/ci/gate-ratchet/extractors.mjs'
  - 'config/docs-policy.json'
  - 'config/performance-budget.json'
  - 'docs/adr/template.md'
---

# Technical Research: installing `@vilnacrm/ui-toolkit` into CRM (#250)

This artifact merges four analyst research notes (crm-state, toolkit, website prior art, gates)
into one verified baseline for the #250 planning chain. Where the notes disagreed, the
disagreement was re-measured in the worktree on 2026-09-29, and the resolution is recorded in
section 9. Section 12 is an addendum written in correction pass 1: it records ui-toolkit PR #185,
merged to the toolkit's `main` after v0.5.0 was released, and what it changes for this plan.
The same pass corrected the counts in sections 6 and 8 that the architecture had superseded.

## 1. Scope and binding constraints

- The product owner scoped the work: _"we do not want to create new modules/components for
  now, we can do the ui-kit installation"_. #250 is therefore an **installation**. It covers:
  - the pinned dependency;
  - every repository gate the dependency trips, each passed by a narrow, reviewed policy edit;
  - provenance (a sha256 manifest plus make targets);
  - Jest ESM wiring;
  - ADR-016 and docs;
  - consumption only through existing seams whose values are provably identical.
- No new component, module, `UI*` primitive or adapter. A primitive that is not a drop-in stays
  CRM-local with a recorded reason. Toolkit gaps are recorded as upstream follow-ups and are not
  filed.
- Worktree: `/home/dima/Desktop/crm-worktrees/250-ui-toolkit`, branch `feat/250-ui-toolkit`,
  base `origin/main` 4689eca6 (includes #106). The only uncommitted changes are the toolkit
  lines in `package.json:14` and `bun.lock` (`:18`, `:1476`).

> Assumption: "provably identical" applies to the **whole exported theme object** (deep
> JSON-equal), not only to the keys CRM reads today. This is the stricter of the two readings,
> and it is the only one that no future consumer can falsify.

## 2. Current state (verified)

### 2.1 The stack already satisfies the toolkit

Issue #250's "blocked" premise is stale. `package.json:8-22` pins:

- React 19.2.8
- `@mui/material` and `@mui/system` ^9.4.0 (9.4.0 installed)
- `@emotion/*` ^11
- i18next ^26.4.2 and react-i18next ^17.0.14
- react-hook-form ^7.88.0

Every toolkit peer range is satisfied (section 3.2).

### 2.2 The dependency is already added

- `package.json:14` pins the v0.5.0 release tarball:

  ```text
  https://github.com/VilnaCRM-Org/ui-toolkit/releases/download/v0.5.0/vilnacrm-ui-toolkit-0.5.0.tgz
  ```

- `node_modules/@vilnacrm/ui-toolkit/package.json` reports version `0.5.0`, which is also the
  latest release (published 2026-09-28).
- The `bun.lock:1476` entry is `[spec, { peerDependencies }]` with **no integrity field**. Bun
  records no hash for a remote tarball, so the lockfile does not pin the bytes.
- The toolkit has no nested `node_modules`, so its `createTheme` runs on CRM's single
  `@mui/material` 9.4.0.

### 2.3 The eager (initial-entrypoint) closure imports no seam

The static, non-type edges from `src/index.tsx` were followed with dependency-cruiser, and the
imports in `index.tsx`, `app.tsx`, `providers/app-providers.tsx` and `components/layouts/*` were
spot-checked again today. The closure holds 64 local modules. The eager `src/components` files
are:

- `error-boundary/*`, `layouts/*`, `route-fallback/*` and `ui-live-status`
- `src/styles/theme.ts`, `colors.ts` and `fonts.css`, plus `src/index.css`

Split points reached from the eager set:

- `app-routes.ts` loads home and not-found.
- `auth/routes/index.ts` loads sign-in and sign-up.
- `footer-loader.ts:4` loads `ui-footer`.
- `use-sign-out` loads the auth store.
- Sentry and web-vitals load dynamically.

**Neither theme seam is in the initial entrypoint.** `ui-breakpoints` is reached only from
route and footer chunks: auth-skeleton through `auth-page-layout`, which is part of the sign-in
chunk, and ui-footer through `footer-loader`.

### 2.4 The two seams

| Seam                      | Src importers | Test importers     | In a prod bundle   |
| ------------------------- | ------------- | ------------------ | ------------------ |
| `ui-breakpoints/index.ts` | 21 (lazy)     | 5 direct, 79 reach | yes (route chunks) |
| `ui-color-theme/index.ts` | 1 (orphan)    | 5 direct           | **no**             |

**`src/components/ui-breakpoints/index.ts`**

- A `createTheme` with breakpoints `xs 320 / sm 480 / md 768 / lg 1024 / xl 1440`, plus
  `heightBreakpoints = { compact: 550, medium: 700 } as const`.
- Consumers read only:
  - `.breakpoints.values.{sm,md,lg,xl}`
  - `.breakpoints.up('md'|'lg'|'xl')` and `.down('md')`
  - `heightBreakpoints.compact` and `.medium` (only the two registration-notification style
    files)
- The file is inside `collectCoverageFrom`, because only `theme.ts` is excluded
  (`jest.config.ts:58`). It is also inside the 245-file Stryker mutate scope.

**`src/components/ui-color-theme/index.ts`**

- A `createTheme` palette of **22** tokens, counted again today. The website note's figure of
  21 is wrong.
- Its only src importer, `src/components/ui-typography/theme.ts:4`, has **zero importers**
  (grep over `src`, `tests` and `.storybook`).
- The file survives because:
  - dependency-cruiser `no-orphans` needs both no in-edges and no out-edges;
  - coverage and mutation exclude `theme.ts`.
- Result: the colour seam ships in no production bundle. Five test files import it directly.

### 2.5 Other theme hosts (not seams; stay CRM-local)

- `src/styles/theme.ts` is eager through `AppProviders`. It carries Golos, `customFonts.inter`,
  and the contrast tokens `linkText #0074B5` and `linkTextHover #00588A`. The toolkit has no
  counterpart for them.
- `tests/unit/utils/render-with-providers.tsx` uses its own `testTheme`.
- `.storybook/preview.tsx` wraps stories in the app theme.
- Lazy per-component `createTheme` sites: ui-button, ui-form-input-field, ui-link,
  ui-text-field, and the auth provider buttons.
- MUI augmentation lives in three files:
  - `src/styles/mui-augmentation.d.ts`
  - `src/components/ui-typography/mui-theme-augmentation.d.ts` (19 palette keys and 10
    typography variants)
  - `src/components/types/ui-color-theme/palette-augmentation.ts`

  The toolkit ships **no** `declare module '@mui/...'`, so its `Theme`-typed exports inherit
  CRM's augmentation.

### 2.6 Fonts

- CRM `fonts.css` declares `Golos` in 6 weights and `Inter` in 3, as woff2 with
  `font-display: swap`, 273,168 B in total.
- The toolkit's `styles.css` declares `Golos Text` and `Inter` as TTF with no `font-display`,
  1,348,788 B in total.
- Neither seam chunk touches CSS or fonts.
- Importing `styles.css` would break the Lighthouse `totalSizeBytes` budget of 480,000 B. Under
  `font-src 'self'` it would also have to be served locally. It is out of scope.

## 3. Toolkit inventory (v0.5.0, installed)

### 3.1 Manifest

- `license: CC0-1.0`, with a `LICENSE` file. `build/THIRD-PARTY-NOTICES.txt` lists a vendored
  `swiper@14.0.6` (MIT), and the fonts carry `Golos-OFL.txt` and `Inter-OFL.txt`.
- No `dependencies` field. `sideEffects: ["**/*.css"]`.
- Exports:
  - `"."`
  - `"./styles.css"`, `"./locales"`, `"./package.json"`
  - `"./*"` mapping to `{ types: build/*.d.mts, import: build/*.mjs }`

  There is **no `require` or `default` condition** in v0.5.0, so
  `require.resolve('@vilnacrm/ui-toolkit/ui-breakpoints')` throws
  `ERR_PACKAGE_PATH_NOT_EXPORTED`. ui-toolkit #185 adds a `default` condition on the toolkit's
  `main`; no release carries it yet (section 12).

- `engines: ^20.19.0 || ^22.13.0 || >=24`, which `.nvmrc` 24.8.0 satisfies.
- `scripts.prepare: "husky"`. Bun runs no lifecycle script for an untrusted tarball dependency,
  so the risk is low. Keep the toolkit out of `trustedDependencies`.
- The installed tree has 333 files: 330 under `build/`, plus `package.json`, `README.md` and
  `LICENSE`.
- GitHub release asset: `vilnacrm-ui-toolkit-0.5.0.tgz`, 1,326,192 B,
  `sha256:bb3d61a6f9d354c38cfa2e4f013a7f07190f4d5df6bbba864ccc2e9476aa0c72`.

### 3.2 Peers

All required (no `peerDependenciesMeta`), and all satisfied:

- `@emotion/react` ^11 (11.14.0) and `@emotion/styled` ^11 (11.14.1)
- `@mui/material` and `@mui/system` ^9 (9.4.0)
- `react` and `react-dom` ^19 (19.2.8)
- `react-hook-form` ^7 (7.88.0)
- `i18next` >=23 <27 (26.4.2) and `react-i18next` >=14 <18 (17.0.15)

### 3.3 The two seam subpaths

| Subpath          | Named exports                                   | `default`     |
| ---------------- | ----------------------------------------------- | ------------- |
| `ui-breakpoints` | `crmBreakpointsTheme`, `heightBreakpoints`, ... | website theme |
| `ui-color-theme` | `crmColorTheme`, `sharedPalette`, ...           | website theme |

- `ui-breakpoints.mjs` (286 B) loads `chunk-BSIOUHDK.mjs` (316 B). That chunk runs **two**
  module-scope `createTheme` calls, one for the website (xs 375, sm 640) and one for CRM.
- `ui-color-theme.mjs` (212 B) loads `chunk-X5TAXM3T.mjs` (1,148 B). That chunk runs two
  `createTheme({ palette: { ...sharedPalette } })` calls with identical input.
- Neither chunk carries a `/*#__PURE__*/` annotation (grep count 0). An esbuild probe with MUI
  external keeps the unused website theme in both closures. Rspack was not measured.
- The bare import of `chunk-F3OUBKDZ.mjs` (224 B) is dropped under `sideEffects`.
- Types: `crmBreakpointsTheme` and `crmColorTheme` are typed `Theme`, and `heightBreakpoints`
  is `{ readonly compact: 550; readonly medium: 700 }`. Every subpath `.d.mts` re-exports from
  the 151,265 B `index.d.mts`.

### 3.4 Other subpaths: all stay CRM-local

Recorded reasons for keeping each CRM primitive, as the "stays CRM-local" register:

- **ui-button (8 importers):** the toolkit `UiButton` renders an extra `role="status"` div. That
  makes `UIForm` status queries ambiguous and changes the a11y tree. It is not a drop-in.
- **ui-typography (11), ui-link (2):** they pull `chunk-WXH4AINV`, whose module-scope guard
  falls back to the website theme unless every `sharedPalette` key and custom variant is
  present. `ui-link` also has contracts CRM does not model.
- **ui-back-to-main (2), ui-form (2), auth-skeleton and ui-skeleton-\* (4):** their chunks
  import the **website** breakpoints (`f`, xs 375 / sm 640) at module scope, so their `sm`
  layout moves from 480 to 640. `ui-form` also renders its title and error banner through
  `UiTypography`, which carries the `chunk-WXH4AINV` fallback above.
- **ui-container (3):** its chunk (`chunk-FS4VJUUK.mjs`) also imports the website
  breakpoints, but its only media rules read `md`, `lg` and `xl`, which are 768, 1024 and
  1440 in both themes, and its padding values and `children`-only props equal CRM's. The one
  difference is `aria-label="container"` on a generic `div`, which ARIA prohibits and CRM
  does not render. Correction: an earlier revision filed it under the `sm` reason above.
- **ui-footer (3):** a render-time bare `process.env.REACT_APP_VILNACRM_USAGE_POLICY_URL` read,
  which is absent from `.env.example`, plus the website breakpoints, plus link labels
  rendered through `UiTypography` (the `chunk-WXH4AINV` fallback).
- **ui-form-input-field and ui-text-field-form (1):** a different API surface. Swapping it
  would need an adapter, and adapters are out of scope.
- **ui-text-field and ui-input (0 src importers):** the CRM file is dead in production. There
  is nothing to consume.
- **error-boundary and ui-error-boundary (5, eager):** it sits on the eager path under the
  470,000 B raw budget, and CRM's reliability model (ADR-007) is not modelled upstream.
- **No toolkit counterpart:** ui-live-status, ui-offline-notice, ui-async-section,
  route-fallback, layouts, not-found, render-with-theme.

## 4. Seam value-diff verdicts

Method: the CRM seam values were rebuilt with the same `createTheme`, and the toolkit subpaths
were imported through `node_modules`. This was re-run in the worktree on 2026-09-29.

| Seam             | Deep-equal                   | Verdict                  |
| ---------------- | ---------------------------- | ------------------------ |
| `ui-breakpoints` | yes (0 of 310 leaves differ) | **adopt** (named export) |
| `ui-color-theme` | no (10 palette keys differ)  | **stay CRM-local**       |

**ui-breakpoints: identical.**

- `JSON.stringify(crmBreakpointsTheme) === JSON.stringify(<CRM theme>)`, re-run today: `true`.
- `up('md')` gives `@media (min-width:768px)` and `down('md')` gives
  `@media (max-width:767.95px)`, the same as CRM.
- `heightBreakpoints` is `{ compact: 550, medium: 700 }` with the same literal types.
- The subpath `default` is the website theme (xs 375). The existing
  `tests/unit/components/ui-breakpoints/breakpoints-theme.test.ts` asserts `up('xs')` is
  `320px`, so it would already catch a wrong `default` import.

**ui-color-theme: not identical.**

- All 22 CRM tokens are equal, including the derived light/dark/contrastText values, and every
  non-palette part of the theme is equal.
- 10 palette keys differ (re-run today):
  - `success` becomes `#38B386`, where CRM has MUI's default `#2e7d32`.
  - 9 keys are added: `strokeDanger`, `white`, `patchMethod`, `getMethodHover`,
    `putMethodHover`, `postMethodHover`, `deleteMethodHover`, `patchMethodHover` and
    `mutedInkHover`.
- `crmColorTheme` and `websiteColorTheme` are value-identical but are separate objects. A
  mistaken `default` import would therefore be invisible to value assertions and to the type
  system.
- The seam also has no production consumer, so the swap would buy nothing shipped. It would
  change what five tests read, and it would add one wasted `createTheme`.

> Assumption: adopt `ui-breakpoints` only, through its **named** exports `crmBreakpointsTheme`
> and `heightBreakpoints`. `ui-color-theme` stays CRM-local. The recorded reason: a superset
> palette plus a different `success` fails the whole-object identity bar, the seam has no
> production consumer, and the swap would add a wasted module-scope `createTheme`.
>
> Assumption: the dead `src/components/ui-typography/theme.ts` is left untouched. Deleting it is
> cleanup, not installation. It is recorded as a follow-up.

## 5. Eager-path verdict per seam

| Seam             | Initial entrypoint | Where it lands                               |
| ---------------- | ------------------ | -------------------------------------------- |
| `ui-breakpoints` | not reached        | sign-in, sign-up, home, not-found, ui-footer |
| `ui-color-theme` | not reached        | nowhere (not adopted, orphan importer)       |

- **The 470,000 B raw initial-entrypoint budget is unaffected** as long as no eager module
  imports the toolkit. Any "eager auth paint path" wording in the notes means the lazily loaded
  `/sign-in` route chunk, not the initial entrypoint.
- **The route-chunk delta is small.**
  - esbuild estimate for `ui-breakpoints`: +71 B raw / +17 B gzip minified, from the extra
    website `createTheme`.
  - Per-asset headroom: the largest asset is 317,727 of 400,000 B raw
    (`config/performance-budget.json` `measuredBaseline`).
  - Runtime: about 0.28 ms for one extra `createTheme` on first load of the chunk.
- **Headroom figures conflict, and none of them binds this change.**
  - "Eager raw about 467.9 of 470,000" comes from session memory of PR #302 CI.
  - The critic notes that CI prints only gzip.
  - The last committed raw baseline is 387,749 B (2026-07-20).

> Assumption: the true Rspack delta is taken from the CI `bundle-size` comment and
> `make perf-budget` on the PR. No local production build is run (no-heavy-local-suites rule).
> Any growth in the initial entrypoint is a defect in the implementation, not a budget change.

## 6. Gate inventory and minimal compliant change

Worktree status measured today:

- `sh scripts/ci/check-lockfile-registries.sh` exits 1. It lists the tarball URL twice.
- `lint-licenses` exits 1 on `@vilnacrm/ui-toolkit@0.5.0: CC0-1.0`.
- Jest fails with `Cannot find module` as soon as a seam imports the subpath.

| #   | Gate                        | State now | Minimal compliant change            |
| --- | --------------------------- | --------- | ----------------------------------- |
| G1  | `lint-lockfile`             | red       | exact-URL literal exception         |
| G2  | `lint-licenses`             | red       | add `CC0-1.0` to `ALLOWED_LICENSES` |
| G3  | Jest resolution             | red\*     | mapper + `transformIgnorePatterns`  |
| G4  | Coverage 100% (seam)        | at risk   | import-then-`export const` shape    |
| G5  | Provenance (new)            | absent    | `lint-ui-toolkit` + manifest        |
| G6  | Verifier coverage           | new file  | `collectCoverageFrom` inclusion     |
| G7  | ADR drift + `lint-adr`      | red\*\*   | ADR-016 + README index row          |
| G8  | Docs gates                  | n/a       | `docs/ui-toolkit.md`, refs exist    |
| G9  | Make-target contract (bats) | new       | tsv rows + list edits               |

\* Red once a seam imports the toolkit. \*\* Red on the PR, because the `dependencies` map
changed.

### G1: `lint-lockfile` (`scripts/ci/check-lockfile-registries.sh:41-47`)

- Keep `ALLOWED='^https://registry\.npmjs\.org(/|$)'` unchanged.
- Strip two exact, package-bound, fixed-string tokens for the pinned v0.5.0 URL (the workspace
  specifier and the head of the packages entry) before the unchanged URL scan, and only when a
  line starts with one (architecture AD-6). Use no host-wide `github.com` regex, because
  busybox and GNU grep differ. A URL-only whole-line exception (`grep -vxF`), the form first
  proposed here, would let the same URL pass under another package name.
- Six must-fail fixtures in `tests/bats/lockfile_registries.bats`:
  - the same URL under another package
  - another repo's release asset
  - a wrong tag or asset name
  - the lookalike host `github.com.evil.example`
  - a git-spec form
  - a rogue URL appended after the sanctioned packages-entry token on the same line
- One must-pass fixture holds both sanctioned lines plus a registry entry.
- The existing "passes on the real bun.lock" case turns green.
- Update the prose in `docs/adr/013-bun-package-manager.md:28`.

### G2: `lint-licenses` (`Makefile:578`)

- Append `;CC0-1.0`. This is the documented second-line remedy: the toolkit is first-party, and
  CRM itself is CC0-1.0.
- `CONTRIBUTING.md:840-846` holds no list of SPDX ids; it points to `ALLOWED_LICENSES` in the
  `Makefile`. Add one sentence there naming `CC0-1.0` and its reason, not a new list. A CC0
  pass case in `tests/unit/scripts/check-licenses.test.ts`, which keeps its own fixture list,
  would prove nothing about the `Makefile` and is declined (architecture section 8).

### G1 and G2: review route

Neither edit is ratchet-guarded: `config/gate-thresholds.manifest.json` matches neither file.
Both are reviewed through CODEOWNERS, which routes `/Makefile`, `/scripts/` and `/config/` to
@Kravalg.

> Assumption: no `gate-relaxation` label is needed. Both edits are narrow, reviewed widenings
> outside the ratchet manifest, and they are justified in ADR-016.

### G3: Jest (`jest.config.ts` only)

`jest.mutation.config.ts` spreads the base config, so it inherits the change.

| Probe                          | Result                          |
| ------------------------------ | ------------------------------- |
| no change                      | `Cannot find module`            |
| `transformIgnorePatterns` only | `Cannot find module`            |
| mapper only                    | `Must use import to load ES...` |
| mapper + ignore-pattern        | **pass**                        |

- Add `@vilnacrm/ui-toolkit/|` to the joined `transformIgnorePatterns` allowlist
  (`jest.config.ts:84-89`).
- Add
  `'^@vilnacrm/ui-toolkit/([a-z-]+)$': '<rootDir>/node_modules/@vilnacrm/ui-toolkit/build/$1.mjs'`
  before `'^@/(.*)$'`.
- Map no bare root and no `styles.css`, because neither is used.
- Leave `customExportConditions: ['']` alone; adding `import` would re-resolve msw and others.
- `moduleFileExtensions` needs no `mjs`.
- `.mjs` is transformed by babel-jest to CommonJS (`jest.config.ts:78-81`), and no
  `--experimental-vm-modules` is set anywhere.
- Only `jest.mutation.config.ts` sets ts-jest `isolatedModules: true`; the unit config uses the
  plain `ts-jest` preset (corrected by architecture section 5.2). `lint-tsc` resolves the
  toolkit imports with 0 diagnostics under `moduleResolution: bundler`.

### G4: seam shape (coverage and mutation)

- `export { crmBreakpointsTheme as default, heightBreakpoints } from '...'` compiles to getter
  functions. It scored **50% functions** in a suite that reads only `default`, which breaks the
  100% gate.
- This shape scores 100/100/100/100 and yields zero Stryker mutants:

  ```ts
  import {
    crmBreakpointsTheme,
    heightBreakpoints as toolkitHeights,
  } from '@vilnacrm/ui-toolkit/ui-breakpoints';

  export const heightBreakpoints = toolkitHeights;
  export default crmBreakpointsTheme;
  ```

- The seam then leaves the scored mutant set, which is fine under `ignoreStatic`. The shard
  repack is handled by the ownership-authoritative merge.

> Assumption: the import-then-`export const` shape is mandated for the breakpoints seam. Named
> imports are the only toolkit import form allowed; `default`, `Ui*` and `website*` imports are
> not.

### G5: provenance (port of website #459)

- `config/ui-toolkit-checksums.json` has the keys `comment`, `algorithm: sha256`,
  `version: 0.5.0`, `tarballUrl` and `artifacts`.
  - `artifacts` is a **list of `{ path, sha256 }`**, not a map. A path used as a key next to a
    hex value trips the gitleaks `generic-api-key` rule, and CRM runs full-history
    `make scan-secrets`.
  - The CRM install matches the website's 331 entries 331/331, with 0 mismatches and 0 extra
    files.
- `scripts/ci/verify-ui-toolkit.mjs` plus a small CLI entry. It is hermetic and fails closed on
  each of these:
  - wrong algorithm, or an empty manifest
  - a non-release pin
  - version or `tarballUrl` drift
  - the package is not installed, or has the wrong version
  - a digest mismatch, or a missing file
  - an **extra** file in the install
- Build the verifier as classes with constructor-injected I/O whose `run()` returns an exit
  code (architecture AD-8), not a `main()` function. The thin CLI sets `process.exitCode`
  instead of calling `process.exit()`, and the library files use no `import.meta`, because CRM
  transforms `.mjs` to CommonJS in Jest.
- `make lint-ui-toolkit` runs as `$(EXEC_DEV_TTYLESS) node scripts/ci/verify-ui-toolkit.mjs`,
  like `lint-licenses`, because it reads `node_modules`.
- `make update-ui-toolkit` regenerates the manifest. The docs forbid running it to clear a red
  gate.

> Assumption: the manifest covers exactly the website's 331 paths (`build/**` plus
> `package.json`), so it is byte-comparable across repositories. `LICENSE` and `README.md` stay
> unhashed, as on website.
>
> Assumption: the manifest also records the release asset digest (`bb3d61a6...0c72`) as a
> documented field. Only the networked `update-ui-toolkit` checks it; `lint-ui-toolkit` stays
> offline. From the first release after ui-toolkit #185, the refresher also cross-checks the
> published `.sha256` asset; v0.5.0 has none (section 12).
>
> Assumption: the manifest is regenerated with `update-ui-toolkit` rather than copied from
> website. The digests are identical, and regenerating gives the stronger provenance story.

### G6: covering the verifier

- A path-keyed `coverageThreshold` is ratcheted **no-grow**
  (`scripts/ci/gate-ratchet/extractors.mjs:82-87`). Website's per-file threshold would therefore
  trip `gate ratchet`, so it must not be ported.
- Add the script to the `collectCoverageFrom` **inclusions** instead. The precedent is
  `scripts/localization-generator.js`, and only the exclusion list is no-grow. The global 100%
  then covers the verifier.
- Put its test in `tests/unit/scripts/`. That directory is outside Stryker, and `scripts/` is
  outside the `src` mutate root.

### G7: ADR drift and `lint-adr`

- A `dependencies` change triggers the ADR drift gate (`config/docs-policy.json` `manifestKeys`).
- `docs/adr` currently ends at 015. ADR-016 needs:
  - the filename `016-<kebab>.md` and the title `# ADR-016: ...`
  - `Status`, `Deciders: [@kravalg](https://github.com/kravalg)` and `Date`
  - the 7 required sections
  - a row in `docs/adr/README.md`

> Assumption: ADR-016 belongs to #250. The #114 spec that also claims 016 is untracked in the
> main checkout and absent from open PR #230, so #114 renumbers when it lands.

### G8: documentation gates

- `docs/ui-toolkit.md` covers the pin, the digest gate, the bump recipe, the seam rule and the
  CRM-local register.
- `lint-doc-references`: every `make` target the docs name must exist, so the docs land in the
  same change as the targets.
- `lint-doc-links`: never link into `node_modules/` or `specs/`.
- Update the command list in CLAUDE.md and AGENTS.md.

### G9: make-target contract

- Add `lint-ui-toolkit` to `CI_LINT_TARGETS` (`Makefile:252`) and to `lint:` (`Makefile:706`),
  keeping the order identical in both.
- Mirror the full lists in `tests/bats/makefile_targets.bats:37,42`.
- Add it to the scaffold exclusion list at `:485` and amend the ordinal comment at `:473-483`
  (a "tenth" sentence and its count), one of the two existing comments the change amends
  (architecture section 16).
- Add two `tests/bats/make-target-coverage.tsv` rows. Their evidence file must name each target
  as a whole token.
- Membership-regex tests (`ci-config-gates.test.ts`, `security-headers-contract.test.ts`) stay
  green when a target is appended.

### Unaffected gates (verified)

- jscpd and rust-code-analysis scan `src` only, and the seam shrinks.
- dependency-cruiser resolves `exports` with the `import` condition
  (`.dependency-cruiser.js:857-861`).
- ESLint's `import/no-unresolved` is off.
- a11y and visual baselines are unaffected, because the breakpoints values are identical.
- Dockerfile golden tests are unaffected, because no Dockerfile text changes.
- Trivy and SBOM need no config edit. They cannot see the toolkit, as recorded under risks.
- `.github/dependabot.yml` needs no edit either: its `bun` lane has no `ignore` or `allow`
  list. Whether the `bun` updater skips a tarball-URL entry or fails its whole weekly job is
  not yet known for CRM; it is risk 11.

## 7. Prior art: website PR #459

The PR merged on 2026-09-28 as `dd41eb7`.

### Carries over

- The release-tarball URL pin. A git ref cannot be used: the entry points live in a gitignored
  `build/`, and bun will not build a git dependency.
- The list-shaped manifest.
- The hermetic, I/O-injected verifier with extra-file rejection.
- The `lint-ui-toolkit` and `update-ui-toolkit` pair.
- The Context / Decision / Consequences ADR structure with reversal triggers.
- A docs page with a three-command bump recipe.
- Rationale in docs, never in a new code comment (architecture section 16).

### Changes for CRM

- Kebab-case script naming.
- A dev-container exec mode.
- A single Jest config: mutation inherits it.
- `collectCoverageFrom` instead of a path threshold, because of the ratchet.
- Named CRM exports, never the defaults (website took the defaults, which are its own themes).
- A Deciders line of `[@kravalg](https://github.com/kravalg)`, where website wrote
  "Deciders: website maintainers".

### Does not carry over

- Fonts and `styles.css`, `.woff2` rules, and the Storybook font loader.
- Adapters and `UiThemeProvider`.
- Visual re-baselining.
- Website CI sharding.

### Review lessons from website

- CodeRabbit and cubic both raised CWE-494 (no integrity in the lock). The answer is the digest
  gate, stated precisely as "installed build artifacts are verifiable offline".
- Specs drifted behind the version bump. Keep v0.5.0 consistent across every artifact.

## 8. Risks

1. **The integrity guarantee is post-install only.** `bun install --frozen-lockfile` fetches
   unverified bytes, and the gate only detects tampering afterwards. ADR-016 states the claim as
   "installed build artifacts".
2. **SCA blind spot.** Trivy and the SBOM cannot key a URL-versioned package, and the vendored
   `swiper@14.0.6` is invisible to Trivy, the SBOM and the license gate. The seams never load
   swiper; only the root barrel does. How CycloneDX renders the entry is visible only in CI
   `sbom / generate`.
3. **Root-barrel import.** It costs 346,575 B raw unminified, pulls about 60 chunks including
   swiper, and no gate forbids it.
4. **Wrong-export trap.** The subpath defaults are the website themes. For breakpoints the
   existing value test catches it; for colour, only an identity assertion would.
5. **Egress.** Every install now needs github.com and objects.githubusercontent.com egress: four
   Dockerfiles, the bats and Makefile installs, and the bundle-size base build. No egress
   allowlist exists today.
6. **Stale dev-container `node_modules`.** `node_modules` is a named volume, and Docker seeds
   it from the image only when it is empty, so an existing volume keeps its old tree. After a
   host `bun add`, `lint-ui-toolkit` fails with "not installed or wrong version". That is
   fail-closed and correct. The fix is `make install`, which runs
   `bun install --frozen-lockfile` in the dev container.
7. **Manual bumps.** Dependabot `bun` cannot bump a URL dependency. A bump rewrites
   `package.json` and both `bun.lock` lines, the lockfile-gate literal and the manifest. A
   tooling test pins the five machine-read pin statements as equal (architecture AD-9).
8. **Allowlists are unratcheted.** The license and lockfile allowlists are guarded only by
   CODEOWNERS review.
9. **Tooling cost.** Parsing `index.d.mts` adds a little time and memory to `tsc` and to the
   Stryker typescript-checker.
10. **Gitleaks over 331 hex digests has not been run.** The list shape avoids the known
    `generic-api-key` trigger. A hit cannot be cleared by widening the allowlist.
11. **Dependabot `bun` job with a tarball-URL entry.** If the updater fails the whole weekly
    `bun` job instead of skipping the entry, every other npm update stops, and no pull-request
    check turns red. Evidence so far is partial: `website` merged the same dependency shape at
    2026-09-28T23:34Z (#459), and three `bun` Dependabot update jobs ran against that `main`
    at 23:36Z and succeeded. Those were rebases of existing grouped pull requests, not a fresh
    weekly scan; `website`'s first weekly scan with the entry falls on Monday 2026-10-05. CRM
    has no evidence of its own until its first weekly `bun` run after merge.

## 9. Contradictions between notes, and how they were resolved

- **Swap both seams (crm-state) or breakpoints only (toolkit, gates)?** Resolved for
  breakpoints only, under the whole-object identity bar (section 4).
- **Number of colour tokens: 22 or 21 (website)?** 22, counted today.
- **Number of differing palette keys: 9, 10, 11 or "13 leaves"?** 10 keys differ: `success`
  plus 9 additions. The website note's 11 miscounted, and "13" counts leaves, not keys.
- **Seams "on the eager auth paint path" (toolkit)?** They are not in the initial entrypoint.
  The auth-skeleton import sits in the lazy sign-in chunk, and `ui-color-theme` ships nowhere.
- **Re-export seam safe (toolkit) or 50% function coverage (gates)?** The gates measurement is
  adopted, which mandates the import-then-`export const` shape.
- **Port website's path-keyed coverage threshold (website)?** No: it trips the no-grow ratchet
  (gates), so a `collectCoverageFrom` inclusion is used instead.
- **Edit two Jest configs, as website did?** One: `jest.mutation.config.ts` spreads the base.

## 10. Open questions, each resolved autonomously

- Should the colour seam swap if the product owner accepts consumed-token identity?

  > Assumption: no. The decision is recorded in ADR-016 with the reversal trigger "a CRM
  > consumer reads the toolkit-only palette keys, or upstream ships a CRM-distinct palette".

- Should a new ESLint `no-restricted-imports` rule ban the bare `@vilnacrm/ui-toolkit`,
  `styles.css` and the `default` export?

  > Assumption: no new lint gate in #250. A new selector needs its own must-fail fixture and is
  > an enforcement change beyond installation. Instead, ADR-016 and the docs forbid those
  > imports, and the Jest mapper only resolves `[a-z-]+` subpaths. The gate is an upstream-safe
  > follow-up.

- Should the breakpoints test add an identity assertion (`toBe(crmBreakpointsTheme)`)?

  > Assumption: yes, as a test-only addition. It pins the named export independently of the
  > values.

- Should the extra toolkit palette keys get CRM type augmentation?

  > Assumption: no. They stay untyped until a consumer needs them.

- Should `LICENSE` be hashed, or the tarball re-hashed offline?

  > Assumption: no, to match website. The asset digest is checked only by `update-ui-toolkit`.

- What is the real Rspack byte delta?

  > Assumption: it is settled by the PR's CI bundle-size comment. The expected delta is 0 B on
  > the initial entrypoint and tens of bytes on the route chunks.

- Does SWC down-level toolkit ESM?

  > Assumption: harmless. The toolkit output is already esbuild-lowered, and `compat/compat`
  > applies only to `src`. It is confirmed by the CI production build.

## 11. Upstream follow-ups (recorded, not filed)

The statuses were added in correction pass 1 and match architecture section 13 item for item
(item 11 aligned in correction pass 2, readiness N2, and corrected in pass 3, readiness R3-1).
"Merged (unreleased)" means ui-toolkit #185 fixed it on the toolkit's `main` after v0.5.0; no
release carries it yet (section 12).

1. Annotate the module-scope `createTheme` calls `/*#__PURE__*/`, or split the website and CRM
   themes into separate chunks, so a consumer does not pay for the other product's theme.
   Status: open.
2. Stop exporting the website theme as the unnamed `default` of shared subpaths. Status: open.
3. Give CRM a distinct palette, or drop `crmColorTheme`: today it is value-identical to
   `websiteColorTheme` and a superset of CRM's palette, with a different `success`.
   Status: open.
4. Ship MUI module augmentation for the extra palette keys. Status: open.
5. Add a `default` or `require` export condition, or document the Jest mapper recipe for
   CommonJS consumers. Status: merged (unreleased); every entry point gains `default`, and
   `styles.css` stays a bare file target.
6. Bind components to a theme variant instead of the module-scope website breakpoints. This
   affects the skeletons, container, footer, form and back-to-main. Status: partly merged
   (unreleased); the `ui-form` and `auth-skeleton` `sm` rules resolve at render time through
   `resolveUiTheme`, while the container and back-to-main styles are unchanged, and
   `UiForm`'s title and error banner still render through `UiTypography` without
   `inheritTheme`.
7. Fonts: ship woff2 with `font-display: swap`, and reconcile the `Golos Text` / `Golos` family
   name. Status: open.
8. Replace the render-time bare `process.env.REACT_APP_VILNACRM_USAGE_POLICY_URL` in `UiFooter`
   with a prop. Status: merged (unreleased) as the opt-in `variant="crm"`, which reads no
   `process.env`. Still open: that variant renders its link labels through `UiTypography`
   without `inheritTheme`, so they take the kit `body1`, whose font family is MUI's default,
   not CRM's `Golos`.
9. Remove the extra `role="status"` div from `UiButton`, or make it opt-in, and give the
   contained variant a `:focus-visible` outline. Status: the first half is merged (unreleased)
   as `loadingMode="native"`; the outline is open, left out of #185 on purpose because it
   changes the website's visuals and needs a design-checked change.
10. Drop `scripts.prepare` from the published manifest, and fix source maps that point to
    `../../src`. Status: open.
11. Publish to a registry that records integrity, or attach a signed digest or attestation to
    each release, so consumers can verify the tarball itself. Status: attestation met for
    v0.5.0, by ui-toolkit #178 (before #185). `release-provenance.yml` packed the tarball again
    from the `v0.5.0` tag and attested it; the rebuild reproduced the published bytes, so
    `gh attestation verify vilnacrm-ui-toolkit-0.5.0.tgz -R VilnaCRM-Org/ui-toolkit` passes on
    the pinned asset. It proves that the workflow at `refs/tags/v0.5.0` built a tarball with
    that digest from the tag's source, not that the workflow uploaded the asset (its
    `--clobber` re-upload was refused on the immutable release), and it covers neither the
    installed tree nor the lockfile. Merged (unreleased): a `.sha256` sidecar uploaded in that
    same post-publication step (architecture section 9.5). Open: a registry that records
    integrity, so the lockfile pins bytes. Architecture section 13 item 11 is the full text.

## 12. Addendum: ui-toolkit PR #185 (correction pass 1)

### 12.1 Facts

- ui-toolkit PR #185 ("opt-in crm behaviour for button, form, footer, skeleton and
  typography") closes ui-toolkit #184 and says it "Unblocks VilnaCRM-Org/crm#250". It merged
  to the toolkit's `main` at 2026-09-28T23:36Z, after v0.5.0 was released (2026-09-28T07:54Z).
- v0.5.0 is still the latest release. The 0.5.0 release pull request (#182) is still open, and
  no newer tag exists. Nothing in #185 is installable from a release today.
- Every behaviour change is opt-in. The website's defaults are unchanged.

| Toolkit surface      | What #185 adds (opt-in unless stated)                              |
| -------------------- | ------------------------------------------------------------------ |
| `UiButton`           | `loadingMode="native"`: native `disabled` grey, own indicator      |
| `UiButton` (default) | sr-only `role="status"` renders only when `loading` is defined     |
| `UiForm`             | `titleComponent`, `submitLoadingMode`, `offlineNotice`             |
| `UiFooter`           | `variant="crm"`: logo plus same-tab policy links, no `process.env` |
| `UiContainer`        | drops `aria-label="container"` (not opt-in)                        |
| `AuthSkeleton`       | `idPrefix` (`""` gives bare `auth-skeleton-*` ids), divider id     |
| `UiTypography`       | `inheritTheme`: variants from the ambient MUI theme                |
| `ui-form`, skeleton  | `sm` rules resolved at render time through `resolveUiTheme`        |
| `exports`            | a `default` condition next to `import` on every JS entry point     |
| release workflow     | uploads `vilnacrm-ui-toolkit-<v>.tgz.sha256` beside the tarball    |

- `UiButton` `loadingMode="native"` matches CRM pattern 5: native `disabled` into the grey
  `#E1E7EA` state, label ink hidden, the consumer's `loadingIndicator` honoured, and no status
  region of its own.
- The `UiForm` offline notice is a port of crm#147: an always-mounted `role="status"` span
  after the title; while offline the submit is disabled and described by it; focus moves from
  the submit to the notice when the connection drops; the restored copy shows for 5 s. It is
  internal to `UiForm`, not a separate export.
- The `sm` rules of `ui-form` and `auth-skeleton` move from 640 to 480 only when a `crm` UI
  theme is in scope; the website theme still gives 640.
- The `UiFooter` `crm` variant reads its `md`, `lg` and `xl` media rules from the toolkit's
  own `ui-breakpoints` module default, the website theme. In v0.5.0 those values are 768,
  1024 and 1440 (`chunk-BSIOUHDK.mjs`), equal to CRM's. It nests the toolkit `UiContainer`,
  and it renders each link label through `UiTypography` **without** `inheritTheme`
  (`crm-footer.tsx`), so the label takes the kit theme's `body1`: `resolveUiTheme` falls back
  to the website `uiTheme` under CRM's theme, and neither kit theme overrides `body1`'s font
  family. The footer therefore still differs from CRM's typography after #185.
- `UiForm`'s title (`FormHeader`) and error banner render through `UiTypography` without
  `inheritTheme` too (`form-parts.tsx`), and its submit is the contained `UiButton`.
- `UiContainer` after #185 is `<Box sx={styles.container}>` with the unchanged styles, the
  same markup and styles as CRM's `UIContainer`.
- #185 also set the toolkit `main`'s `package.json` version from `0.4.0` to `0.5.0`, the
  already published version. A build of `main` therefore reports the released version; only
  a digest comparison tells it from the v0.5.0 tarball.
- The `.sha256` asset is `sha256sum` output for the attested tarball: one line,
  `<64 hex>  vilnacrm-ui-toolkit-<v>.tgz`. v0.5.0 predates the step and has no such asset.
  The toolkit's corrected CONSUMING.md states that `bun.lock` stores no integrity hash for a
  tarball URL, and that a sidecar alone proves only that the tarball matches the checksum
  published beside it; the digest that proves the pin is one the consumer records once.
- The `default` condition lets a CommonJS-mode Jest resolve the root and every JS subpath
  without a `moduleNameMapper` entry. The package still has to be exempted in
  `transformIgnorePatterns` and its `.mjs` files still need a transform; `./styles.css` stays
  a bare file target with no `default` condition.
- Not changed on purpose: the contained `UiButton` still has no `:focus-visible` outline, which
  CRM's button has. CRM's `section[aria-label]` skeleton selector also stays CRM-side: the
  toolkit skeleton deliberately stays a nameless busy container (toolkit DEV-14).

### 12.2 Consequences for this plan

> Assumption: #250 installs the latest released version, v0.5.0, now. It neither waits for the
> next toolkit release nor pins an unreleased `main`: a `main` build has no release asset to
> pin, no provenance attestation, and would bypass the release train the toolkit's own
> checksum step belongs to. Every piece is designed so that the next release is a pin bump
> (architecture AD-14).

- **Checksum gate.** The refresher cross-checks the published `.sha256` asset when the pinned
  release has one, and records that it did; v0.5.0 is the one release allowed to have none
  (architecture section 9.5). The committed `tarballSha256` stays the consumer-recorded digest
  that CONSUMING.md asks for.
- **Jest.** The subpath mapper keeps working after the `default` condition arrives, because a
  `moduleNameMapper` match is applied before package `exports` resolution and names the same
  file. It becomes removable after the bump; the `transformIgnorePatterns` entry and the
  existing `.mjs` babel-jest transform stay required (architecture section 6.3).
- **Keep-local register.** #185 resolves some keep-local reasons and leaves others. The
  resolved ones become "keep-local in this change; adoptable through the #185 opt-in after the
  next toolkit release", as swaps behind the existing CRM seams and props, with no new
  component. The unresolved ones stay keep-local with their reason (architecture section 12).
- **Scope.** The adoption work is a deferred epic, blocked on a ui-toolkit release above 0.5.0,
  and is not part of this pull request's dispatch set (epics, Epic 5).
- **Adversarial validation 2.** Read against #185's merged source, the per-row verdicts
  changed twice: `ui-container` is adoptable after the bump (its only v0.5.0 difference is
  the prohibited `aria-label`, register reason R12), and `ui-footer` is not (its `crm` variant
  still renders link labels without `inheritTheme`, R2). A swap also imports a component
  subpath's `default` export, so each one amends the documented import rule for that subpath.
