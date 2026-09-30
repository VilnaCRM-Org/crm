---
status: 'complete'
workflowType: 'architecture'
stepsCompleted:
  - 'step-01-init'
  - 'step-02-context'
  - 'step-03-starter'
  - 'step-04-decisions'
  - 'step-05-patterns'
  - 'step-06-structure'
  - 'step-07-validation'
  - 'step-08-complete'
  - 'validate-architecture (adversarial, 12 defects fixed, section 21.4)'
  - 'validate-architecture round 2 (adversarial, 7 defects fixed, section 21.6)'
corrected: '2026-09-29 (pass 1: #185, F1-F9, 21.5; pass 2: N1-N5, 21.7; pass 3: R3-1/2, 21.9)'
project_name: 'crm'
date: '2026-09-29'
issue: 250
author: 'architect (Winston), autonomous run'
inputDocuments:
  - 'specs/250-ui-toolkit/planning-artifacts/research-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/brief-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/prd-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/run-summary-250-ui-toolkit-2026-09-29.md'
  - '/home/dima/Desktop/crm-worktrees/plans/discovery-106-250-2026-09-28.md'
  - 'https://github.com/VilnaCRM-Org/crm/issues/250'
  - 'https://github.com/VilnaCRM-Org/website/pull/459'
  - 'CLAUDE.md'
  - '.claude/react-sdlc.yml'
  - 'package.json'
  - 'bun.lock'
  - 'node_modules/@vilnacrm/ui-toolkit/package.json'
  - 'node_modules/@vilnacrm/ui-toolkit/build/ui-breakpoints.mjs'
  - 'node_modules/@vilnacrm/ui-toolkit/build/chunks/chunk-BSIOUHDK.mjs'
  - 'src/components/ui-breakpoints/index.ts'
  - 'tests/unit/components/ui-breakpoints/breakpoints-theme.test.ts'
  - 'jest.config.ts'
  - 'jest.mutation.config.ts'
  - 'Makefile'
  - 'scripts/ci/check-lockfile-registries.sh'
  - 'scripts/ci/check-licenses.mjs'
  - 'scripts/ci/gate-ratchet/extractors.mjs'
  - 'tests/bats/lockfile_registries.bats'
  - 'tests/bats/makefile_targets.bats'
  - 'tests/bats/make-target-coverage.tsv'
  - 'tests/bats/issue_78_contract.bats'
  - 'eslint.config.mjs'
  - 'rsbuild.config.ts'
  - 'config/docs-policy.json'
  - 'config/performance-budget.json'
  - '.gitleaks.toml'
  - '.markdownlint.yaml'
  - 'docs/adr/template.md'
  - 'docs/adr/README.md'
  - 'docs/adr/013-bun-package-manager.md'
  - 'node_modules/@vilnacrm/ui-toolkit/build/ui-breakpoints.d.mts'
  - 'node_modules/@vilnacrm/ui-toolkit/build/index.d.mts'
  - 'stryker.config.mjs'
  - 'scripts/ci/mutation-scope.mjs'
  - '.dependency-cruiser.js'
  - '.storybook/main.ts'
  - '.github/CODEOWNERS'
  - 'https://github.com/VilnaCRM-Org/website/blob/main/config/ui-toolkit-checksums.json'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/pull/185'
  - '.github/dependabot.yml'
  - '.husky/pre-commit'
  - 'lighthouse/lighthouserc.mobile.js'
  - 'CONTRIBUTING.md'
---

# Architecture: installing `@vilnacrm/ui-toolkit` into CRM (#250)

**Author:** architect (Winston), autonomous BMAD run. **Date:** 2026-09-29.

Predecessors: [technical research](./research-250-ui-toolkit-2026-09-29.md),
[product brief](./brief-250-ui-toolkit-2026-09-29.md) and
[PRD](./prd-250-ui-toolkit-2026-09-29.md). Run log:
[run summary](./run-summary-250-ui-toolkit-2026-09-29.md).

This document turns the PRD's 18 FRs and 20 NFRs into file-level decisions an implementer can
follow without re-deciding anything. Figures come from the research artifact unless marked
"re-verified", which means re-read in the worktree on 2026-09-29 for this document.

## 1. Project Context Analysis

### 1.1 Requirements Overview

- **Install (FR-1 to FR-3):** the v0.5.0 release tarball is already in `package.json:14` and
  `bun.lock:18,1476` (re-verified). Rspack and `tsc` resolve it natively; Jest does not.
- **Gates (FR-4 to FR-6, FR-18):** four repository gates go red once the dependency lands or a
  seam imports it: `lint-lockfile`, `lint-licenses`, Jest resolution and the ADR drift gate.
- **Provenance (FR-7 to FR-10):** a committed digest manifest, an offline verifier in
  `make lint`, a networked refresher, and one enforced version string.
- **Consumption (FR-11 to FR-14):** exactly one existing file in `src/` changes. Every other
  CRM primitive stays local, with a recorded reason.
- **Docs (FR-15 to FR-17):** ADR-016, `docs/ui-toolkit.md` and seven doc-sync surfaces.

### 1.2 Technical Constraints

- The v0.5.0 `exports` map has only `types` and `import` conditions, no `require` or
  `default` (re-verified in `node_modules/@vilnacrm/ui-toolkit/package.json`). ui-toolkit #185
  adds a `default` condition on the toolkit's `main`; no release carries it yet (section 6.3).
- `bun.lock` records no integrity for a remote tarball (re-verified: line 1476 ends at the
  `peerDependencies` object).
- `scripts/**` is ESLint-ignored (`eslint.config.mjs:520`, re-verified), but `lint-deps`
  cruises `.` (target `Makefile:494`, recipe 495), `lint-tsc` includes `scripts/**/*` with
  `allowJs: true`, and
  Prettier formats `.mjs`. New scripts are therefore still gated.
- The eager raw budget of 470,000 B cannot be raised, and no eager module may import the
  toolkit.
- Coverage is 100% global, and mutation `break` is 100. `collectCoverageFrom` exclusions and
  path-keyed thresholds are ratcheted no-grow (`extractors.mjs:60-87`, re-verified), while
  inclusions are no-shrink, so an added inclusion is a strengthening.

### 1.3 Cross-Cutting Concerns

- **Supply chain:** provenance, licensing, scanner blind spots and egress.
- **Identity:** a consumed value must be deep-equal to what it replaces, so visual,
  accessibility and behaviour baselines cannot move.
- **Honesty of gates:** every new gate needs a must-fail fixture, and every widening must be
  the narrowest one that works.

### 1.4 Scale Assessment

Medium complexity, brownfield. One `src/` file changes. About 25 files change in total,
most of them tooling, tests and docs (section 14).

## 2. Technology Baseline (starter evaluation)

A starter template does not apply to a brownfield dependency install. The baseline is:

- **Toolkit version:** v0.5.0, the latest release (2026-09-28), already installed.
  ui-toolkit #185 merged to the toolkit's `main` after it and is unreleased (AD-14).
- **Dependency form:** the GitHub release tarball URL. A git ref cannot be used: the entry
  points live in a gitignored `build/`, and bun does not build a git dependency.
- **Stack:** React 19.2.8, `@mui/material` 9.4.0, Emotion 11, i18next 26.4.2,
  react-i18next 17.0.15 and react-hook-form 7.88.0 satisfy all nine required peers.
- **Runtime:** Node 24.8.0 (`.nvmrc`) satisfies `engines`
  (`^20.19.0 || ^22.13.0 || >=24`).

> Assumption: no peer-dependency version changes in this PR. The issue's "blocked on React 19
> and MUI 9" premise is stale, and ADR-016 says so.

## 3. Core Architectural Decisions

Each decision names what is chosen, why, and which alternative it rules out. They map one to
one onto the ADR-016 outline in section 4.

### AD-1: Pin the release tarball URL, verify the installed bytes offline

- **Chosen:** keep the `package.json` URL pin. Add `config/ui-toolkit-checksums.json` and
  `make lint-ui-toolkit`, which verifies the installed tree against it offline.
- **Why:** it is the only form bun can install that carries the built output. A committed
  manifest is the only integrity evidence available, because the lockfile carries none.
- **Rejected:** a git dependency (no build step); vendoring `build/` into the repository
  (a 1.3 MB binary-heavy diff, and it defeats upgrades); waiting for a registry publish (it
  blocks the product owner's scoped install indefinitely).

### AD-2: Adopt exactly one seam, `ui-breakpoints`, through named exports

- **Chosen:** `src/components/ui-breakpoints/index.ts` imports `crmBreakpointsTheme` and
  `heightBreakpoints` by name and re-exports them, keeping its public API.
- **Why:** the whole exported object is deep-equal to CRM's (0 of 310 leaves differ), so the
  21 lazy importers and every baseline are unaffected.
- **Rejected:** the subpath `default` export, which is the website theme (xs 375, sm 640).

### AD-3: `ui-color-theme` stays CRM-local

- **Why:** 10 palette keys differ (`success` changes, 9 keys are added), the seam has no
  production consumer, and the swap would add a wasted module-scope `createTheme`.
- **Reversal trigger:** a CRM consumer reads a toolkit-only palette key, or upstream ships a
  CRM-distinct palette.

### AD-4: No toolkit stylesheet and no toolkit fonts

- **Why:** the TTF fonts total 1,348,788 B against the Lighthouse `totalSizeBytes` budget of
  480,000 B, and `font-src 'self'` would require serving them locally. CRM keeps
  `src/styles/fonts.css` (woff2, `font-display: swap`, 273,168 B).

### AD-5: Wire Jest through one mapper entry and one transform-allowlist entry

- **Chosen:** edit `jest.config.ts` only. `jest.mutation.config.ts` spreads the base config, so
  it inherits both entries without an edit.
- **Rejected:** mapping the bare root or `styles.css` (neither is sanctioned), and adding an
  `import` export condition (it would re-resolve msw and others).

### AD-6: The lockfile gate accepts one exact package-bound token

- **Chosen:** strip exactly two fixed-string, package-bound tokens (the workspace specifier and
  the packages-entry head) before the existing URL scan, which is otherwise unchanged.
- **Rejected:** a host-wide `github.com` regex (lookalike hosts, busybox versus GNU `grep`
  differences), and a URL-only exception (the same URL under another package would pass).

### AD-7: `CC0-1.0` joins `ALLOWED_LICENSES`

- **Why:** the package is first-party, CRM itself is CC0-1.0, and "replace the dependency"
  does not apply. It is the documented second-line remedy: one reviewed SPDX id.

### AD-8: Verifier and refresher are small injected classes under `scripts/ci/ui-toolkit/`

- **Chosen:** library classes with constructor-injected I/O, plus two thin CLI entry files. No
  `import.meta`, no `process.exit()`, and no top-level `await`, because Jest runs `.mjs`
  through babel-jest as CommonJS.
- **Why:** every failure branch can then be driven in-process from a unit test and covered by
  the global 100%.

### AD-9: One pin, stated five ways, enforced in two layers

- **Chosen:** five machine-read pin statements, always counted the same way: (1) the
  `package.json` dependency, (2) the `bun.lock` workspace line, (3) the `bun.lock` packages
  entry, (4) the manifest's `version` and `tarballUrl`, and (5) the `TOOLKIT_URL` literal in
  the lockfile gate. `UiToolkitPinSource` exposes two explicit methods (section 9.2):
  `readPackagePin()` reads statement 1 only, for the refresher, which runs before any manifest
  exists; `compareStatements()` reads all five and returns `drift` findings, for the verifier
  and for a tooling test that runs on the real repository without needing `node_modules`.

### AD-10: Cover the verifier through a `collectCoverageFrom` inclusion

- **Chosen:** add `'<rootDir>/scripts/ci/ui-toolkit/**/*.mjs'` to the inclusions. The
  precedent is `scripts/localization-generator.js`.
- **Rejected:** website's path-keyed `coverageThreshold`, which the gate ratchet scores as a
  weakening (`coverageThreshold.pathOverrides` is no-grow).

### AD-11: No new ESLint import-restriction rule in #250

- **Why:** a new `no-restricted-imports` selector needs its own must-fail fixture and rot
  guard, which is enforcement work beyond installation. The import rule is documented, and the
  Jest mapper resolves only `[a-z-]+` subpaths. The rule is a Growth item.

### AD-12: ADR number 016 belongs to #250

- **Why:** `docs/adr` ends at 015 and no open PR adds a `docs/adr/016-*` file. The #114 spec
  that also names 016 is untracked and renumbers when it lands.

### AD-13: No Dockerfile, compose, workflow or budget file changes

- **Why:** every image already runs `bun install --frozen-lockfile`. The Dockerfile golden-text
  and image-hardening tests stay green unedited. The new gate rides `make lint` inside
  `static testing`, so no workflow changes.

### AD-14: Install the latest release now; make the next release a pin bump

- **Chosen:** pin v0.5.0, the latest release, in this change. ui-toolkit PR #185 (opt-in CRM
  behaviour, a `default` export condition, a per-release `.sha256` asset) merged to the
  toolkit's `main` on 2026-09-28T23:36Z, after v0.5.0; the 0.5.0 release PR (#182) is still
  open and no newer tag exists. Every piece is designed so the next release is a pin bump:
  - the checksum gate works without a published `.sha256` (v0.5.0) and cross-checks the
    published asset when the pinned release has one (section 9.5);
  - the Jest mapper keeps working when the `default` condition arrives, and becomes removable
    (section 6.3);
  - the keep-local register says, per primitive, whether #185 resolves its reason (section 12);
  - the swaps #185 enables are a deferred epic, blocked on a toolkit release above 0.5.0 and
    outside this pull request's dispatch set (epics, Epic 5).
- **Why:** the one adopted seam is identical in v0.5.0, so the installation needs nothing from
  #185. A `main` build has no release asset to pin, no provenance attestation and no `.sha256`,
  and bun does not build a git dependency. #185 also set the toolkit `main`'s `package.json`
  version to `0.5.0` (re-verified), so a `main` build reports the released version: the
  `[install]` version check cannot tell the two apart, and only the digest classes can.
- **Rejected:** waiting for the next release (it blocks the product owner's installation-only
  scope on another repository's release train); pinning the toolkit's `main` through a git ref
  or a locally built tarball (no release asset, no attestation, an unreviewable diff).

> Assumption: this change installs v0.5.0 and does not wait for, or pin, an unreleased `main`.
> The first release after #185 is taken by the deferred Epic 5 with the section 17.1 recipe,
> and nothing in this change has to be rewritten for it.
>
> Assumption: ADR-016 lands with `Status: Approved`, as ADR-010 to ADR-015 did in the PRs that
> implemented them; the PR review is the approval.

## 4. ADR-016 Content Outline

File: `docs/adr/016-ui-toolkit-installation.md`. Title line:

```text
# ADR-016: UI toolkit installed from a digest-verified tarball, consumed only via identical seams
```

The README index is a bullet list, not a table. Its new item,
`- [ADR-016: <title>](./016-ui-toolkit-installation.md)`, reuses that title. At about 133
characters it is long, like the ADR-014 item already is, but its last space falls before
column 100, so it passes MD013 in non-strict mode (`tables: true` does not apply to a list).

Metadata block, in template order:

- `- Status: Approved`
- `- Deciders: [@kravalg](https://github.com/kravalg)`
- `- Date: <date of the implementing commit>`
- `**Technical Story**:` issue #250 plus the product owner's installation-only scope.

Sections (the seven required by `config/docs-policy.json`, plus the optional
"Pros and Cons of the Options"). The template's HTML comment is not copied.

1. **Context and Problem Statement**
   - CRM and website should render one design system; #250 asked to consume it.
   - The "blocked" premise is stale: all nine peers are satisfied.
   - The dependency trips four gates, and bun records no integrity for a remote tarball.
   - ui-toolkit #185 merged after v0.5.0 and is unreleased; this ADR installs v0.5.0 (AD-14).
2. **Decision Drivers**
   - The product owner scope: no new modules, components, `UI*` primitives or adapters.
   - Root cause, never suppression; raise-only quality floors.
   - The 470,000 B eager raw budget and the 480,000 B Lighthouse total budget.
   - Offline, hermetic lint gates; a single version string.
   - Install from a published release only, so the next release is a pin bump (AD-14).
3. **Considered Options**
   1. Release tarball, digest gate, identical seams only (chosen).
   2. Git dependency.
   3. Vendor the build output into the repository.
   4. Wait for a registry publish.
   5. Adopt primitives through adapters (ruled out by the product owner).
   6. Wait for the toolkit release that carries ui-toolkit #185, or pin its unreleased `main`.
4. **Decision Outcome** names every artifact: the manifest, the two scripts, both make
   targets, the lockfile token, `ALLOWED_LICENSES`, the Jest entries, the seam, the docs page.
   It restates the seam evidence (0 of 310 leaves differ; `up('md')` is
   `@media (min-width:768px)` and `down('md')` is `@media (max-width:767.95px)`). It states the
   `.sha256` rule: v0.5.0 has no published checksum asset, and every later pin must match its
   published one (section 9.5).
5. **Positive Consequences:** a governed dependency; baselines unchanged; tamper detection for
   installed bytes; the next swap is a UI decision only.
6. **Negative Consequences:**
   - The integrity claim is post-install only: `bun install --frozen-lockfile` fetches
     unverified bytes, and the gate detects tampering afterwards.
   - Trivy and the SBOM cannot key a URL-versioned package, and the vendored `swiper@14.0.6`
     (MIT) is invisible to them and to the license gate. The fonts carry OFL notices.
   - Every install needs egress to `github.com` and `objects.githubusercontent.com`.
   - Dependabot cannot bump a URL dependency; bumps are manual (recipe in the docs).
   - Dependabot's `bun` updater may fail the whole weekly `bun` job on a tarball-URL entry
     instead of skipping it, which would stop every other npm update without a red check.
     `website` runs the same shape: three `bun` update jobs against its `main` succeeded after
     its #459 merged, but no weekly scan has run yet. The first CRM weekly `bun` run after
     merge is checked, and a failure is escalated to the maintainer (section 20).
   - The CRM opt-ins of ui-toolkit #185 are not usable until the next toolkit release; their
     adoption is a deferred follow-up (section 12.1).
   - The breakpoints chunk also builds the unused website theme (upstream follow-up 1).
   - Both allowlists sit outside the gate ratchet and rely on CODEOWNERS review.
7. **Pros and Cons of the Options:** one `###` per option with `#### Good (<option>)` and
   `#### Bad (<option>)` headings, each unique, as ADR-013 does.
8. **Deviations from the issue text** (a subsection of Decision Outcome, 7 of 7): the stale
   "blocked" premise; v0.5.0 instead of v0.3.0; primitive replacement partly deferred (the
   swaps ui-toolkit #185 enables wait for the next toolkit release) and adapters ruled out;
   fonts deferred; a subpath Jest mapper instead of `build/index.mjs`; `crmColorTheme` not
   adopted; website PR #459 as prior art instead of #458.
9. **Reversal triggers:** for the colour seam (AD-3); for fonts, a woff2 upstream build that
   fits the budget; for the lint rule, the first PR that imports a second subpath; for the
   #185 opt-ins, a toolkit release above 0.5.0 (Epic 5 of the epics document).
10. **Links:** issue #250, website PR #459, ui-toolkit PR #185, ADR-004, ADR-006, ADR-013,
    `docs/ui-toolkit.md`.

## 5. Seam Design

### 5.1 The one changed `src/` file

`src/components/ui-breakpoints/index.ts` becomes exactly:

```ts
import {
  crmBreakpointsTheme,
  heightBreakpoints as toolkitHeightBreakpoints,
} from '@vilnacrm/ui-toolkit/ui-breakpoints';

export const heightBreakpoints = toolkitHeightBreakpoints;

export default crmBreakpointsTheme;
```

- **Why this shape:** `export { x as default } from` compiles to getter functions, which
  measured 50% function coverage in a suite that reads only `default`. This shape has no
  function, scores 100/100/100/100 and yields zero Stryker mutants.
- **ESLint:** one external import group, alphabetised specifiers, no free function, no class,
  no type declaration. `import/no-extraneous-dependencies` passes because the package is in
  `dependencies`. `import/no-unresolved` is off.
- **Public API:** `default` stays a `Theme` and `heightBreakpoints` stays
  `{ readonly compact: 550; readonly medium: 700 }`, so none of the 21 importers change
  (re-verified: 21 files under `src`).
- **No comments** are added to the file; the rationale lives in ADR-016.

### 5.2 Typing and MUI augmentation

- `crmBreakpointsTheme` is declared `Theme`, imported inside the toolkit's `index.d.mts` from
  `'@mui/material'`. The toolkit ships no `declare module '@mui/...'` (re-verified), so CRM's
  three augmentation files keep applying to that `Theme` unchanged.
- The explicit `Theme` import in today's seam is dropped; the type flows from the toolkit
  declaration.
- The 9 toolkit-only palette keys are not augmented (no consumer).
- `lint-tsc` resolves the subpath under `moduleResolution: bundler` with 0 diagnostics. The
  subpath's `types` entry is `build/ui-breakpoints.d.mts`, which re-exports from `./index.mjs`,
  so the declarations come from `index.d.mts` (re-verified).
- Jest needs no types mapper. The unit config uses the plain `ts-jest` preset, and only
  `jest.mutation.config.ts` sets ts-jest `isolatedModules: true`. Either way, type information
  comes from `tsconfig.json` (bundler resolution, `types` condition), and the runtime mapping
  comes from `moduleNameMapper` (section 6).

> Assumption: re-verified on 2026-09-29 without editing the repository. `tsc` with the root
> config type-checked a scratch copy of the section 5.1 seam plus a consumer that assigns
> `heightBreakpoints.compact` to the literal type `550` (0 errors under `strict` and
> `exactOptionalPropertyTypes`). The probe is not vacuous: changing the literal to `551` fails
> with TS2322. ESLint gave 0 findings on the seam text linted from stdin as
> `src/components/ui-breakpoints/index.ts`. A scratch Jest config spreading the unit config plus
> the section 6.1 entries passed the four existing breakpoint tests against that seam.

### 5.3 Import rule (documented, not linted)

- Allowed: named exports from `@vilnacrm/ui-toolkit/<subpath>`, today only `crmBreakpointsTheme`
  and `heightBreakpoints` from `ui-breakpoints`.
- Forbidden: the root barrel (346,575 B raw, about 60 chunks, `swiper`), `styles.css`, any
  subpath `default` (website themes), any `website*` or `Ui*` export.

## 6. Jest ESM Wiring

### 6.1 `jest.config.ts` (the only edited config)

Two entries, both measured as the minimum that passes (research G3):

```ts
transformIgnorePatterns: [
  [
    '/node_modules/(?!',
    '@faker-js/|msw/|@mswjs/|@bundled-es-modules/|until-async/|rettime/|',
    'outvariant/|strict-event-emitter/|headers-polyfill/|is-node-process/|@open-draft/|',
    '@vilnacrm/ui-toolkit/',
    ')',
  ].join(''),
  '\\.pnp\\.[^\\/]+$',
],
```

```ts
moduleNameMapper: {
  '^@auth$': '<rootDir>/src/modules/user/features/auth',
  '^@auth/(.*)$': '<rootDir>/src/modules/user/features/auth/$1',
  '^@tests/(.*)$': '<rootDir>/tests/$1',
  '^@scripts/(.*)$': '<rootDir>/scripts/$1',
  '^@vilnacrm/ui-toolkit/([a-z-]+)$': '<rootDir>/node_modules/@vilnacrm/ui-toolkit/build/$1.mjs',
  '^@/(.*)$': '<rootDir>/src/$1',
  '^(\\.{1,2}/.+)\\.js$': '$1',
},
```

- The new mapper entry sits before `'^@/(.*)$'`. The two cannot overlap today, but keeping
  package mappers ahead of the catch-all alias makes order irrelevant later.
- The chunk's own relative imports (`./chunks/chunk-BSIOUHDK.mjs`) resolve natively once
  babel-jest has turned the entry into CommonJS; its `@mui/material` import resolves to CRM's
  single MUI 9.4.0.
- `collectCoverageFrom` gains `'<rootDir>/scripts/ci/ui-toolkit/**/*.mjs'` next to
  `'<rootDir>/scripts/localization-generator.js'` (AD-10).
- Unchanged: `customExportConditions: ['']`, `moduleFileExtensions` (no `mjs` needed, because
  the mapper names the full file), the `.mjs` babel-jest transform, and every threshold.

### 6.2 `jest.mutation.config.ts` (inherits, not edited)

- It spreads `base`, so `moduleNameMapper`, `transformIgnorePatterns` and
  `collectCoverageFrom` all arrive unchanged. It overrides only the `ts|tsx` transform.
- `tests/unit/scripts/` and `tests/unit/tooling/` are already in its `testPathIgnorePatterns`,
  so the verifier tests never run under Stryker, and `scripts/` is outside the mutate root.
- **Evidence:** `stryker.config.mjs` sets `jest.enableFindRelatedTests: true`, so a shard's dry
  run executes only the tests related to its own mutate files. `breakpoints-theme.test.ts` (and
  every component test that reaches the seam) therefore runs in the shard that owns
  `src/components/ui-breakpoints/index.ts` and in each shard owning one of its 21 importers, not
  in every shard. A missing mapper would fail those dry runs with `Cannot find module`, so the
  shards that reach the seam prove the inheritance.

> Assumption: no tooling test pins the mapper text. The breakpoints test (unit and dry run)
> is the behavioural proof, and a text pin would add churn without catching anything more.

### 6.3 When the `default` condition arrives (next release)

ui-toolkit #185 adds a `default` condition next to `import` on every JavaScript entry point
(root, `locales`, and the `./*` wildcard); `./styles.css` stays a bare file target. After a pin
bump to a release that carries it:

- **The mapper keeps working unchanged.** Jest applies a `moduleNameMapper` match before it
  resolves package `exports`, and the mapper names the same `build/<subpath>.mjs` file the
  `default` condition names, so the bump itself needs no Jest edit.
- **The mapper entry becomes removable.** CommonJS-mode Jest resolves with the `require` and
  `default` conditions plus `customExportConditions: ['']`, so the subpath then resolves
  without it. Removing it is optional, belongs to the bump follow-up (Epic 5), and is proven
  by deleting the entry and running the focused breakpoints test. If that run cannot resolve
  the `.mjs` file, `mjs` joins `moduleFileExtensions`, as the toolkit's CONSUMING.md suggests;
  that is a resolution setting, not a threshold. Today `mjs` is not needed, because the mapper
  names the full file.
- **What stays required:** the `@vilnacrm/ui-toolkit/` entry in `transformIgnorePatterns` and
  the existing `.mjs` babel-jest transform. Resolution is not transformation: without them,
  `require()` still fails on the package's `import` and `export` syntax.
- **What does not change:** `customExportConditions`, `jest.mutation.config.ts` and every
  threshold. `styles.css` is still never imported, so it needs no style stub.

> Assumption: the mapper stays in this change. v0.5.0 has no `default` condition, so without
> the mapper Jest reports `Cannot find module` (research G3); removing it is a follow-up that
> cannot be tested until the next release is pinned.

## 7. Lockfile Gate Design (`scripts/ci/check-lockfile-registries.sh`)

### 7.1 Sanctioned tokens

bun.lock carries the toolkit twice (re-verified; indentation differs, 8 and 4 spaces):

```text
        "@vilnacrm/ui-toolkit": "<URL>",
    "@vilnacrm/ui-toolkit": ["@vilnacrm/ui-toolkit@<URL>", { "peerDependencies": ...
```

The script gains two literals and derives two fixed-string tokens from them:

```sh
TOOLKIT_PKG='@vilnacrm/ui-toolkit'
TOOLKIT_URL='<URL>'
WORKSPACE_TOKEN="\"$TOOLKIT_PKG\": \"$TOOLKIT_URL\""
PACKAGE_TOKEN="\"$TOOLKIT_PKG\": [\"$TOOLKIT_PKG@$TOOLKIT_URL\", {"
```

Here `<URL>` stands for the full v0.5.0 release URL (research section 2.2), written on one line
in the script so the verifier's `GATE_LITERAL_PATTERN` (section 9.4) can read it back.

### 7.2 Algorithm

- Arm (a) no longer scans `$LOCK` directly. It scans the output of one POSIX `awk` pass that,
  per line, removes leading blanks and then, if the line **starts with** a sanctioned token,
  drops exactly that token and keeps the rest of the line. `index()`, `substr()`, `sub()` and
  `length()` are POSIX, so busybox and GNU `awk` behave the same.
- Everything left over, including any text after a token, still goes through the unchanged
  `grep -oE 'https?://[^" ]+' | grep -vE "$ALLOWED"` scan. A URL appended after the sanctioned
  prefix on the same line is still caught.
- `ALLOWED='^https://registry\.npmjs\.org(/|$)'` is unchanged.
- The backslash-escape arm and the non-URL specifier arm (b) still scan the raw `$LOCK`, so a
  `github:` or `git+ssh:` form of the toolkit is rejected exactly as today.
- The success message is unchanged, so every existing Bats assertion keeps matching.
- Comments: the existing header sentence "resolves from somewhere other than the npm registry
  allowlist" is amended by one clause naming the single sanctioned release tarball, so the
  header stays true. No other comment in the script is added or changed. This is one of the
  two amended comments that section 16 allows.

> Assumption: re-verified on 2026-09-29 with a scratch copy of this algorithm (never committed).
> Today's gate reports exactly the two toolkit lines through arm (a); arm (b) matches nothing,
> because `@https:` is not one of its schemes. With the tokens stripped, the real `bun.lock`
> yields 0 rogue URLs under both GNU `awk` and `busybox awk`. It still reports 4 of 4 rogue
> lines: a URL appended after the packages-entry token, the URL under `foo`, the lookalike host,
> and the URL with a suffix.
>
> Assumption: the exception is an exact fixed-string match, not a regex. POSIX ERE has no
> backreference, so a regex could not bind the tag version to the asset version portably; the
> anchored version-consistency regex lives in the verifier and the tooling test (section 9.4),
> where JavaScript supports it.

### 7.3 Must-fail fixtures (`tests/bats/lockfile_registries.bats`)

Each is a new `@test` with a heredoc lockfile and asserts `status -eq 1`:

1. the exact toolkit URL under another package name (`"foo": ["foo@<URL>", {`);
2. another repository's release asset under the toolkit name;
3. the toolkit name with a wrong tag (`v0.5.1`) or a wrong asset name;
4. the lookalike host `https://github.com.evil.example/VilnaCRM-Org/...`;
5. the git-spec form `"@vilnacrm/ui-toolkit@github:VilnaCRM-Org/ui-toolkit#v0.5.0"`;
6. a rogue URL appended after the sanctioned packages-entry token on the same line.

One new must-pass fixture holds both sanctioned lines plus a registry entry and asserts
`status -eq 0`. The existing "make lint-lockfile passes on the real repository bun.lock" case
(`:182`) turns from red to green with no edit. The `lint-lockfile` row in
`make-target-coverage.tsv` gains "sanctioned-tarball" in its details text.

## 8. License Edit

- `Makefile:578`: `ALLOWED_LICENSES = MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause;0BSD;CC-BY-4.0`
  becomes `...;CC-BY-4.0;CC0-1.0`. The comment block above it is unchanged.
- `tests/unit/scripts/check-licenses.test.ts` is **not** edited. Its `ALLOWED` constant is a
  fixture independent of the Makefile, so a CC0 case there would prove nothing about the real
  list. The binding proof is `make lint-licenses` on the real tree.
- `CONTRIBUTING.md:840-846` holds no list of SPDX ids: it points to `ALLOWED_LICENSES` in the
  `Makefile` and says the list is trimmed to what the production tree contains. It gains one
  sentence beside that pointer naming `CC0-1.0` and its reason (the first-party toolkit is
  CC0-1.0, as CRM itself is). No list is added, and the "trimmed to exactly what the
  production tree contains today" claim stays true.

> Assumption: the PRD's optional CC0 pass case is declined, for the reason above.

## 9. Provenance: Manifest, Verifier and Refresher

### 9.1 Manifest format (`config/ui-toolkit-checksums.json`)

```json
{
  "comment": "SHA-256 digests of the installed toolkit files; see docs/ui-toolkit.md.",
  "algorithm": "sha256",
  "version": "0.5.0",
  "tarballUrl": "<URL>",
  "tarballSha256": "bb3d61a6f9d354c38cfa2e4f013a7f07190f4d5df6bbba864ccc2e9476aa0c72",
  "releaseChecksum": "absent",
  "artifacts": [
    { "path": "build/Golos-OFL.txt", "sha256": "<64 hex>" },
    { "path": "package.json", "sha256": "<64 hex>" }
  ]
}
```

- The real file is `JSON.stringify(manifest, null, 2)` plus a newline, which Prettier accepts
  as-is; each artifact object is expanded over four lines (the one-line form above is
  shorthand).
- `artifacts` is a list of `{ path, sha256 }`, sorted by `path` with a plain code-unit sort,
  holding exactly 331 entries: 330 files under `build/` plus `package.json`. `LICENSE` and
  `README.md` are not hashed, matching website, so the list is byte-comparable across repos.
- `releaseChecksum` records what the refresher found for the release's published
  `vilnacrm-ui-toolkit-<v>.tgz.sha256` asset: `"matched"` (the asset exists and names the same
  digest as `tarballSha256`) or `"absent"` (the release has no such asset). `"absent"` is
  valid only for a version listed in `RELEASES_WITHOUT_CHECKSUM`, which holds exactly `0.5.0`
  (section 9.4). ui-toolkit #185 adds the asset to every release after v0.5.0.
- `tarballSha256` is the digest recorded once in this repository, which the toolkit's
  CONSUMING.md asks consumers to keep: a published `.sha256` proves only that the tarball
  matches the checksum published beside it, so both assets replaced together would still
  agree with each other. The committed field is what a re-uploaded pair would contradict.
- The key names avoid the gitleaks `generic-api-key` keywords (`key`, `token`, `secret`,
  `auth`, `api`, `access`), and no path is a JSON key. Three path values do contain `auth`
  (`build/auth-skeleton.*`). `.gitleaks.toml` is not edited.

> Assumption: re-verified on 2026-09-29. The digest-pinned `GITLEAKS_IMAGE` (v8.30.1), run with
> the repository's `.gitleaks.toml`, reports no leaks on this shape (website's 331 entries plus
> `tarballSha256`). It also reports none on a compacted one-object-per-line variant. The binding
> proof stays `supply-chain security / secret scan` over the full history.
>
> Assumption: re-verified on 2026-09-29. Every one of the 331 digests in website's merged
> `config/ui-toolkit-checksums.json` equals the sha256 of the same file installed in this
> worktree, including `package.json`. A separate bun install therefore produces the same bytes,
> so the manifest is reproducible across machines. All 331 paths match
> `ARTIFACT_PATH_PATTERN`, and they are already in code-unit order.
>
> Assumption: `tarballSha256` and `releaseChecksum` are the two fields website's manifest
> lacks. The verifier checks their shape and the `releaseChecksum` rule offline; only the
> networked refresher derives them. The gitleaks probe above predates `releaseChecksum`; its
> key holds no keyword and its value is one of two fixed words, and the binding proof stays
> `supply-chain security / secret scan`.

### 9.2 Files and classes

All logic lives in a new directory `scripts/ci/ui-toolkit/`, next to the `gate-ratchet/`
precedent. Class names follow the CLAUDE.md role-suffix table even though `scripts/` is outside
the ESLint class gate, per the repository owner's classes-only preference.

| File                                           | Export                             |
| ---------------------------------------------- | ---------------------------------- |
| `ui-toolkit/ui-toolkit-policy.mjs`             | frozen constants object            |
| `ui-toolkit/ui-toolkit-pin-source.mjs`         | `class UiToolkitPinSource`         |
| `ui-toolkit/ui-toolkit-install-source.mjs`     | `class UiToolkitInstallSource`     |
| `ui-toolkit/ui-toolkit-integrity-verifier.mjs` | `class UiToolkitIntegrityVerifier` |
| `ui-toolkit/ui-toolkit-checksums-builder.mjs`  | `class UiToolkitChecksumsBuilder`  |
| `verify-ui-toolkit.mjs` (CLI)                  | none; runs the verifier            |
| `update-ui-toolkit.mjs` (CLI)                  | none; runs the builder             |

Paths are relative to `scripts/ci/`. Roles:

- **Policy constants** (no functions): `PACKAGE_NAME`, `PACKAGE_ROOT`
  (`node_modules/@vilnacrm/ui-toolkit`), `CHECKSUMS_PATH`, `LOCKFILE_GATE_PATH`,
  `ALGORITHM` (`sha256`), `UNHASHED_FILES` (`LICENSE`, `README.md`), `CHECKSUM_SUFFIX`
  (`.sha256`), `CHECKSUM_STATES` (`absent`, `matched`), `RELEASES_WITHOUT_CHECKSUM`
  (exactly `['0.5.0']`, frozen), and the patterns in section 9.4.
- **`UiToolkitPinSource`** reads through an injected `readFile` and does not need
  `node_modules`. It has two explicit methods, so no caller depends on a statement it cannot
  have yet:
  - `readPackagePin()` reads only statement 1, the `package.json` dependency, and returns
    `{ spec, version }` or a `pin` finding when the spec does not match
    `RELEASE_URL_PATTERN`. The refresher uses it, so the first generation works before any
    manifest exists.
  - `compareStatements()` reads all five statements of AD-9 and returns `drift` findings: any
    disagreement, and any `bun.lock` shape or gate literal found zero times or more than once.
    The verifier and `tests/unit/tooling/ui-toolkit-pin.test.ts` use it.
- **`UiToolkitInstallSource`** reads the installed tree through injected `readFile` and
  `readDir` (`withFileTypes`). It returns the installed version, a recursive file list relative
  to the package root, and the sha256 of one file's raw bytes. It descends only into real
  directories and lists only regular files. Any other entry (a symbolic link, a FIFO, a socket)
  is reported as an `extra` finding by its relative path, and a link is never followed, so a
  link to a file outside the package cannot be hashed in place of package bytes. The v0.5.0
  install has no such entry (re-verified: 333 regular files, 0 links).
- **`UiToolkitIntegrityVerifier`** validates the manifest, asks the two sources for findings,
  and `run({ stdout, stderr })` returns an exit code.
- **`UiToolkitChecksumsBuilder`** derives a new manifest from the installed tree and a
  downloaded asset, and `run()` writes it only when every check passes.
- **CLI entries** construct the classes with `node:fs`, `globalThis.fetch` and
  `process.stdout`/`stderr`, then assign `process.exitCode` from the resolved `run()` result,
  using top-level `await`. The AD-8 ban on `import.meta` and top-level `await` binds only the
  library files Jest loads. Node runs the two CLI files as native ESM, and no test imports
  them. They hold no branch, so they are
  left out of `collectCoverageFrom`, like `check-licenses.mjs` and
  `gate-ratchet/extract-cli.mjs`. `make lint-ui-toolkit` exercises the verifier entry on every
  pull request.

No new file carries a comment; the rationale is in `docs/ui-toolkit.md`.

### 9.3 Verifier failure classes

Every finding is one line of the form `- [<class>] <detail>`, indented by two spaces. The run prints
`ui-toolkit integrity: FAIL` on stderr and returns 1 if there is any finding, otherwise prints
`ui-toolkit integrity: OK (v0.5.0, 331 artifacts verified, 0 extra files)` and returns 0. An
unexpected exception is caught and reported as a `[manifest]` or `[install]` finding, never
as a crash with exit 0.

| #   | Class      | Fails when                                                |
| --- | ---------- | --------------------------------------------------------- |
| 1   | `manifest` | bad algorithm, list, path, hex or `releaseChecksum`       |
| 2   | `pin`      | `package.json` spec is not a release-tarball URL          |
| 3   | `drift`    | any of the five pin statements disagree                   |
| 4   | `install`  | package absent, or installed version differs from the pin |
| 5   | `digest`   | an installed file's sha256 differs from the manifest      |
| 6   | `missing`  | a manifest path is absent from the install                |
| 7   | `extra`    | an installed file is neither in the manifest nor unhashed |

Details per class:

- **manifest:** `algorithm !== 'sha256'`; `artifacts` not a non-empty array; an entry whose
  `path` fails the artifact pattern (which rejects `.` and `..` segments, section 9.4); an
  entry whose `sha256` or the
  `tarballSha256` fails `^[0-9a-f]{64}$`; a duplicate path; a list not sorted by `path`; a
  `releaseChecksum` outside `CHECKSUM_STATES`; `releaseChecksum: "absent"` for a `version`
  not in `RELEASES_WITHOUT_CHECKSUM`. The last rule is what makes the checksum cross-check
  mandatory for every pin after v0.5.0, offline and without trusting the refresher's run.
- **drift** is `UiToolkitPinSource.compareStatements()`: it compares `package.json`
  `dependencies['@vilnacrm/ui-toolkit']`, the `bun.lock` workspace line, the `bun.lock`
  packages entry, the manifest `tarballUrl` (and `version` against the URL's version), and
  the `TOOLKIT_URL` literal in the lockfile gate. Each `bun.lock` shape and the gate literal
  must occur **exactly once**; zero or two is drift.
- **install:** a missing `node_modules/@vilnacrm/ui-toolkit/package.json` returns early with
  the stale-container remedy in the message: run `make install`, which runs
  `bun install --frozen-lockfile` in the dev container and refreshes the `node_modules` named
  volume. The gate never passes on a stale tree.
- **extra** walks the **whole package root**, not only `build/`, so an added root file (for
  example an `index.js`) or a nested `node_modules/` fails too. This is stricter than website,
  which walked `build/` only.

### 9.4 Anchored patterns (version consistency)

```ts
RELEASE_URL_PATTERN = new RegExp(
  String.raw`^https://github\.com/VilnaCRM-Org/ui-toolkit/releases/download/` +
    String.raw`v(\d+\.\d+\.\d+)/vilnacrm-ui-toolkit-\1\.tgz$`
);
ARTIFACT_PATH_PATTERN = /^(?:package\.json|build(?:\/(?!\.{1,2}(?:\/|$))[A-Za-z0-9._-]+)+)$/;
DIGEST_PATTERN = /^[0-9a-f]{64}$/;
WORKSPACE_LINE_PATTERN = /^\s*"@vilnacrm\/ui-toolkit": "([^"]+)",?$/m;
PACKAGE_LINE_PATTERN = /^\s*"@vilnacrm\/ui-toolkit": \["@vilnacrm\/ui-toolkit@([^"]+)", \{/m;
GATE_LITERAL_PATTERN = /^TOOLKIT_URL='([^']+)'$/m;
CHECKSUM_LINE_PATTERN = /^([0-9a-f]{64}) {2}(vilnacrm-ui-toolkit-\d+\.\d+\.\d+\.tgz)\n?$/;
```

- The `\1` backreference forces the tag version and the asset version to be equal, so a
  `v0.5.0` tag with a `0.5.1` asset is a `pin` finding. Re-verified: the pattern accepts the
  real URL and rejects the `0.5.1` asset, the host `github.com.evil.example`, a lower-case
  `vilnacrm-org` owner, an appended query, `http:` and a trailing newline.
- The negative lookahead in `ARTIFACT_PATH_PATTERN` rejects any `.` or `..` segment. A path
  such as `build/./index.mjs` would otherwise pass the pattern and be read as `build/index.mjs`,
  so the same file would sit under two names in the manifest. With the lookahead, no separate
  substring check for `..` is needed.
- The captured version is what `version` in the manifest and the installed `package.json`
  are compared with.
- The pin statements are located with the `g` variants of the three pin-line patterns, so the
  "exactly once" count is explicit.
- `CHECKSUM_LINE_PATTERN` reads the published `.sha256` asset, which is `sha256sum` output
  for one file: 64 lower-case hex digits, two spaces, the asset basename and at most one
  newline. The captured basename must equal the basename of the pinned `tarballUrl`, so a
  sidecar written for another asset cannot vouch for this one.

> Assumption: the release pattern hard-codes the `VilnaCRM-Org/ui-toolkit` repository and
> asset name. Moving either upstream is a reviewed change to this constant, never a wildcard.

### 9.5 Refresher (`make update-ui-toolkit`)

`UiToolkitChecksumsBuilder.run()` performs, in order:

1. read the pin through `UiToolkitPinSource.readPackagePin()`; stop with `[pin]` if it is not
   a release URL;
2. read the installed version; stop with `[install]` if it differs from the pin's version;
3. `await fetch(tarballUrl)`; stop with `[download]` on a rejected promise or a non-2xx
   status (redirects to `objects.githubusercontent.com` are followed by `fetch`);
4. hash the response bytes into `tarballSha256`;
5. `await fetch(tarballUrl + CHECKSUM_SUFFIX)` and settle `releaseChecksum`:
   - a 2xx body that matches `CHECKSUM_LINE_PATTERN`, names the pinned asset's basename and
     carries the step 4 digest gives `"matched"`;
   - a 2xx body that is malformed, names another asset, or carries another digest stops with
     `[checksum]`;
   - a 404 gives `"absent"` when the pinned version is in `RELEASES_WITHOUT_CHECKSUM`, and
     stops with `[checksum]` otherwise;
   - a rejected promise or any other non-2xx status stops with `[download]`;
6. list the installed tree, hash every file except `UNHASHED_FILES`, and sort by `path`;
7. write the manifest once, through the injected `writeFile`.

Any stop happens before step 7, so a refusal leaves the committed manifest byte-identical. It
returns 1 on a refusal and 0 after a write. It keeps the `comment` of the existing manifest,
or a default when none exists. The four refusal classes are `[pin]`, `[install]`,
`[download]` and `[checksum]`.

The checksum gate is therefore release-agnostic: for v0.5.0 it records `"absent"` (verified
2026-09-29: the v0.5.0 release lists only the tarball asset), and for any later release it
refuses to write unless the published asset exists and agrees. The offline verifier enforces
the same rule on the committed manifest (section 9.3), so a hand-edited `"absent"` for a later
version fails `make lint` without network access. `RELEASES_WITHOUT_CHECKSUM` is frozen at
`['0.5.0']`, and the tooling test pins it (section 15.4), so widening it is a reviewed diff.

> Assumption: the refresher does not unpack the tarball to cross-check its contents against
> the installed tree. That needs a hand-written tar reader and its fixtures, which is beyond an
> installation; the recorded `tarballSha256` still lets a reviewer compare against the GitHub
> release page and makes a re-uploaded asset visible on the next refresh.
>
> Assumption: the `.sha256` cross-check runs in the networked refresher only. `lint-ui-toolkit`
> stays offline and hermetic, and enforces the recorded outcome instead (section 9.3).

### 9.6 Make targets

```makefile
lint-ui-toolkit: ## Verify installed ui-toolkit bytes against the committed digests (issue #250)
    $(EXEC_DEV_TTYLESS) node scripts/ci/verify-ui-toolkit.mjs

update-ui-toolkit: ## Rewrite config/ui-toolkit-checksums.json (networked, issue #250)
    $(EXEC_DEV_TTYLESS) node scripts/ci/update-ui-toolkit.mjs
```

Recipe lines are tab-indented in the real `Makefile`; they are shown with spaces here because
the Markdown linter rejects hard tabs in code blocks.

- Both run in the dev container, like `lint-licenses`, because they read `node_modules`.
- `lint-ui-toolkit` joins `CI_LINT_TARGETS` (`Makefile:252`) and `lint:` (`Makefile:706`)
  directly after `lint-licenses`, in the same position in both lists. The `lint:` help text
  gains "the ui-toolkit digest gate".
- `update-ui-toolkit` joins neither list: it needs network access.
- Both targets sit after `lint-licenses` in the Makefile, with no comment block.
- Both names join the `.PHONY` line that already lists `lint-lockfile lint-licenses`
  (`Makefile:288`). Every existing lint gate is declared phony there. A stray file named
  `lint-ui-toolkit` in the checkout would otherwise let Make skip the recipe and report success.

### 9.7 Make-target contract (Bats)

- `tests/bats/make-target-coverage.tsv` gains two rows (the contract sorts, so position is
  free):
  - `lint-ui-toolkit`, `bats`, `tests/bats/makefile_targets.bats`, "Validated as the
    dev-container digest verifier and as a member of the CI lint target list."
  - `update-ui-toolkit`, `bats`, `tests/bats/makefile_targets.bats`, "Validated as the
    dev-container manifest refresh command, outside the lint aggregate."
- `tests/bats/makefile_targets.bats`:
  - `:37` (`ci-lint`) and `:42` (`ci`): insert `lint-ui-toolkit` after `lint-licenses`.
  - The heredoc table in the "build, formatting, lint" test gains two rows:
    `lint-ui-toolkit|docker compose exec -T dev node scripts/ci/verify-ui-toolkit.mjs|` and
    `update-ui-toolkit|docker compose exec -T dev node scripts/ci/update-ui-toolkit.mjs|`.
    Both rows name their target as a whole token, which the evidence check requires.
  - `:485` scaffold exclusion list: append `lint-ui-toolkit`. The ordinal comment at
    `:475-483` gains "The tenth, lint-ui-toolkit, reads only the installed package, its
    manifest, `package.json`, `bun.lock` and the lockfile gate", and its count sentence is
    updated. `SCAFFOLD_VERIFY_TARGETS` in the `Makefile` is **not** edited. The test derives
    its expectation as the `lint:` prerequisites minus this exclusion list. Adding the gate to
    `lint:` and to the exclusion list together keeps both sides equal. This is the second of
    the two amended comments that section 16 allows.
- `CI_LINT_TARGETS mirrors the lint prerequisite set exactly` (`:532`) stays green because
  both lists change together.

## 10. Fonts Decision

- No import of `@vilnacrm/ui-toolkit/styles.css` anywhere (`src`, `.storybook`, `tests`).
- `src/styles/fonts.css`, the served woff2 files, `public/index.html` and the CSP are
  unchanged. `tests/unit/tooling/font-assets.test.ts` stays green unedited.
- Reason, recorded in ADR-016 and the docs: 1,348,788 B of TTF against the 480,000 B
  Lighthouse total budget, no `font-display`, and `font-src 'self'`.
- The family-name mismatch (`Golos Text` versus CRM's `Golos`) is upstream follow-up 7.

## 11. Bundle Analysis per Seam

| Seam             | Eager raw | Lazy delta per copy    | Copies | Runtime  |
| ---------------- | --------- | ---------------------- | ------ | -------- |
| `ui-breakpoints` | 0 B       | about +71 B / +17 B gz | 1 to 6 | +0.28 ms |
| `ui-color-theme` | 0 B       | 0 B (not adopted)      | 0      | none     |

- **Eager:** none of the 64 modules in the `src/index.tsx` closure imports either seam
  (re-verified: `layouts`, `error-boundary`, `route-fallback`, `ui-live-status`, `styles`,
  `index.tsx`, `app.tsx` and `providers` have no importer). The initial entrypoint, and so the
  470,000 B raw budget, is untouched.
- **Lazy:** the toolkit chunk imports `createTheme` from `@mui/material`, the same specifier
  CRM's seam uses today, so no vendor bytes are added. The delta is the second (website)
  `createTheme` call and its values object: an esbuild estimate of +71 B raw and +17 B gzip,
  minified. The re-exporting `ui-breakpoints.mjs` adds a few bytes of glue; the
  `chunk-F3OUBKDZ.mjs` side-effect import is dropped under `sideEffects: ["**/*.css"]`.
- **Copies:** `splitChunks` uses Rspack's default preset (`rsbuild.config.ts:141-143`), whose
  shared group needs 20 KB, so a small shared module is duplicated into each async chunk that
  imports it. The seam is reached from up to six async chunks: sign-in, sign-up, home and
  not-found, the lazy `ui-footer`, and the lazy registration notification. The worst case is
  about 6 x 17 = 102 B gzip, inside the PRD's 256 B non-initial ceiling (NFR-7).
- **Runtime:** one extra `createTheme` (about 0.28 ms) the first time a chunk evaluates.
- **Types:** `index.d.mts` (151,265 B) is parsed by `lint-tsc` and the Stryker TypeScript
  checker; tracked as NFR-18.
- **Other resolvers:** four more resolvers read the exports-only subpath, and each one reaches
  the `import` condition.
  - Rspack (`rsbuild.config.ts`) and dependency-cruiser both list `import` among their
    conditions. For dependency-cruiser this was re-verified with `enhanced-resolve` using the
    `.dependency-cruiser.js` options: the subpath resolves under `node_modules`, so
    `not-to-unresolvable` and `no-non-package-json` stay silent.
  - Storybook (`@storybook/react-webpack5`, `.storybook/main.ts`) compiles `.ts` with a
    `babel-loader` whose `@babel/preset-env` keeps ES modules for webpack 5
    (`supportsStaticESM`). Webpack therefore resolves the subpath through the `import`
    condition. The chunk's relative imports carry the full `.mjs` extension, which webpack's
    `fullySpecified` rule for `.mjs` requires. Every story of a seam importer (`ui-button`,
    `ui-form`, skeletons) exercises this path, and `storybook testing / storybook-build` is the
    binding proof.

> Assumption: the real Rspack figures come from the PR's `bundle size / PR report` comment. No
> local production build runs (no heavy local suites). An eager delta above 64 B gzip is a
> defect in the implementation, not a budget question.

## 12. Per-Component Keep-Local Register

This is the one binding register (readiness F3). PRD FR-12 and `docs/ui-toolkit.md` list
exactly these rows and reason codes: the union of the earlier PRD and architecture lists, so
`ui-text-field-form` sits beside `ui-form-input-field`, `ui-error-boundary` beside
`error-boundary`, and the app theme `src/styles/theme.ts` has its own row.

Reason codes, used in the table and in `docs/ui-toolkit.md`. Each holds for v0.5.0; the last
column of the table says whether ui-toolkit #185 resolves it. The codes R1 to R12 belong to
this register only; they are not the brief's risk IDs R1 to R14.

- **R1** extra `role="status"` node changes the a11y tree and `UIForm` queries.
- **R2** module-scope fallback to the website theme (`chunk-WXH4AINV` guard).
- **R3** module-scope website breakpoints: `sm` moves from 480 to 640.
- **R4** render-time bare `process.env.REACT_APP_VILNACRM_USAGE_POLICY_URL` read.
- **R5** different API surface; would need an adapter (out of scope).
- **R6** no `src` importer; nothing to swap.
- **R7** eager path under the 470,000 B budget; ADR-007 reliability model not upstream.
- **R8** no toolkit counterpart.
- **R9** whole-object value differs (AD-3).
- **R10** the contained `UiButton` has no `:focus-visible` outline, which CRM's has; #185 left
  it out on purpose (it changes the website's visuals and needs a design-checked change).
- **R11** CRM's skeleton is a named `section[aria-label]`; the toolkit skeleton deliberately
  stays a nameless busy container (toolkit DEV-14).
- **R12** v0.5.0 `UiContainer` puts `aria-label="container"` on a generic `div`, which ARIA
  prohibits and CRM's container does not render. Its styles and props equal CRM's: its only
  media rules read `md`, `lg` and `xl` from the website breakpoints, and those are 768, 1024
  and 1440, as in CRM (re-verified in `chunk-FS4VJUUK.mjs` and `chunk-BSIOUHDK.mjs`), so R3
  does not apply to it.

Column "After #185" gives the outlook once a toolkit release above 0.5.0 is pinned:
**adoptable** means keep-local in this change and adoptable through the #185 opt-in as a
follow-up swap behind the existing CRM seam and props (section 12.1); **local** means the
named reason still holds after #185.

| CRM primitive or theme                      | Importers  | Now   | Reason    | After #185      |
| ------------------------------------------- | ---------- | ----- | --------- | --------------- |
| `ui-breakpoints`                            | 21 (lazy)  | adopt | -         | adopted (bump)  |
| `ui-color-theme`                            | 1 (orphan) | local | R9        | local: R9       |
| `ui-button`                                 | 8          | local | R1 R10    | local: R10      |
| `ui-typography`                             | 11         | local | R2        | adoptable (5.2) |
| `ui-link`                                   | 2          | local | R2 R5     | local: R2 R5    |
| `ui-container`                              | 3          | local | R12       | adoptable (5.5) |
| `ui-back-to-main`                           | 2          | local | R3        | local: R3       |
| `ui-form`                                   | 2          | local | R2 R3 R10 | local: R2 R10   |
| `auth-skeleton`, `ui-skeleton-*`            | 4          | local | R3 R11    | local: R11      |
| `ui-footer`                                 | 3          | local | R2 R3 R4  | local: R2       |
| `ui-form-input-field`, `ui-text-field-form` | 1          | local | R5        | local: R5       |
| `ui-text-field`, `ui-input`                 | 0          | local | R6        | local: R6       |
| `error-boundary`, `ui-error-boundary`       | 5 (eager)  | local | R7        | local: R7       |
| `ui-live-status`                            | eager      | local | R8        | local: R8       |
| `ui-offline-notice`                         | -          | local | R8        | local: R8       |
| `ui-async-section`, `route-fallback`        | -          | local | R8        | local: R8       |
| layouts, not-found                          | -          | local | R8        | local: R8       |
| `render-with-theme`                         | tests only | local | R8        | local: R8       |
| `src/styles/theme.ts` (app theme)           | eager      | local | R8        | local: R8       |

What #185 does and does not change, per row:

- `ui-button`: `loadingMode="native"` resolves R1 (native `disabled` grey, the consumer's
  `loadingIndicator`, no own status region, matching CRM pattern 5), but R10 remains.
- `ui-typography`: `inheritTheme` resolves R2 (variants come from the ambient MUI theme, so
  the kit theme need not sit on the eager path).
- `ui-link`, `ui-back-to-main`: unchanged by #185.
- `ui-container`: #185 drops the prohibited `aria-label="container"` (R12) and changes nothing
  else. Its styles and its `children`-only props already equal CRM's (R12), so after the bump
  the toolkit `UiContainer` renders the same markup and styles as CRM's `UIContainer`.
- `ui-form`: the `sm` rule resolves at render time through `resolveUiTheme` (R3, given a `crm`
  UI theme in scope), and `titleComponent`, `submitLoadingMode` and `offlineNotice` (a port
  of crm#147) cover CRM's heading, loader and offline notice. Two reasons remain: its submit
  is still the contained `UiButton` (R10), and its title and error banner render through
  `UiTypography` without `inheritTheme` (`form-parts.tsx`), so the kit typography applies
  (R2).
- `auth-skeleton`, `ui-skeleton-*`: `idPrefix=""` gives CRM's bare `auth-skeleton-*` ids and
  the `sm` rules resolve at render time, but R11 remains.
- `ui-footer`: `variant="crm"` reads no `process.env` (R4) and renders the logo plus same-tab
  privacy and usage-policy links. Its media rules read `md`, `lg` and `xl` from the toolkit's
  website breakpoints, which equal CRM's 768, 1024 and 1440 in v0.5.0 (R3 does not bite; the
  swap re-diffs them against the pinned release). R2 remains: the variant renders each link
  label through `UiTypography` without `inheritTheme` (`crm-footer.tsx`), so the label takes
  the kit theme's `body1` (the fallback `uiTheme`, or a UI theme in scope), whose font family
  is MUI's default, not CRM's `Golos`. The footer stays local until upstream passes
  `inheritTheme` there (upstream follow-up 8).
- `ui-live-status`, `ui-offline-notice`: the #185 offline notice is internal to `UiForm`, not
  an exported primitive, so R8 stands.

Not changed either: the Storybook preview theme and `tests/unit/utils/render-with-providers.tsx`
(`testTheme`). No toolkit component renders in CRM, so neither needs the toolkit guard.

### 12.1 After the next toolkit release (deferred, not in this change)

The adoptable rows become Epic 5 of the epics document, which is blocked on a ui-toolkit
release above 0.5.0 and is not part of this pull request's dispatch set. Each swap:

- happens behind an existing CRM seam and its current props: the CRM file keeps its path,
  export and props and renders the toolkit component with the opt-in set, so no importer
  changes and no component, module, `UI*` primitive or adapter is added;
- starts with the pin bump of section 17.1, which the checksum gate cross-checks against the
  release's published `.sha256` (section 9.5);
- carries its own value-diff and baseline evidence: 0 visual diffs, 0 new axe violations,
  the keyboard contract, the eager budget (NFR-6) and the Lighthouse floors;
- keeps a row local, with a new reason, if that evidence shows any difference;
- amends the import rule of section 5.3 for that one component subpath only: a toolkit
  component is its subpath's `default` export (for example `@vilnacrm/ui-toolkit/ui-container`),
  which the rule forbids today because the theme subpaths' defaults are the website themes.
  Theme-subpath defaults, the root barrel and `styles.css` stay forbidden.

The adoptable rows are `ui-typography` (Deferred 5.2) and `ui-container` (Deferred 5.5); each
is blocked only on the release. `ui-footer`, `ui-button` and `ui-form` join the epic as
blocked twice: on the release, and on an upstream change. For the footer that change is
`inheritTheme` on its link labels (R2); for the button and the form it is a contained
`:focus-visible` outline (R10), and for the form also `inheritTheme` on its title and error
banner (R2). `auth-skeleton` does not join it: R11 is a deliberate toolkit decision, not an
open gap.

## 13. Upstream Gap List (recorded in the docs, not filed)

Statuses are as of 2026-09-29. "Merged in #185, unreleased" means fixed on the toolkit's
`main` after v0.5.0; it reaches CRM only through the deferred Epic 5.

1. Annotate the module-scope `createTheme` calls `/*#__PURE__*/`, or split the website and CRM
   themes into separate chunks.
2. Stop exporting the website theme as the unnamed `default` of shared subpaths.
3. Give CRM a distinct palette, or drop `crmColorTheme` (today value-identical to
   `websiteColorTheme`, a superset of CRM's palette, with a different `success`).
4. Ship MUI module augmentation for the extra palette keys.
5. Add a `default` or `require` export condition, or document the Jest mapper recipe.
   Merged in #185, unreleased (section 6.3).
6. Bind components to a theme variant instead of the module-scope website breakpoints
   (skeletons, container, footer, form, back-to-main, card list). Partly merged in #185,
   unreleased: the `ui-form` and skeleton `sm` rules resolve at render time. Open: the
   container, footer and back-to-main rules, and `UiForm`'s title and error banner, which
   render through `UiTypography` without `inheritTheme` (R2).
7. Fonts: woff2 with `font-display: swap`; reconcile the `Golos Text` and `Golos` names.
8. Replace `UiFooter`'s render-time `process.env` read with a prop. Merged in #185 as
   `variant="crm"`, unreleased. Open: that variant renders its link labels through
   `UiTypography` without `inheritTheme`, so they take the kit `body1` (R2).
9. Remove `UiButton`'s extra `role="status"` node, or make it opt-in, and give the contained
   variant a `:focus-visible` outline. The first half is merged in #185 as
   `loadingMode="native"`, unreleased; the outline is open (R10).
10. Drop `scripts.prepare` from the published manifest; fix source maps pointing at
    `../../src`.
11. Publish to a registry that records integrity, or attach a signed digest or attestation to
    each release, so consumers can verify the tarball itself. Attestation met for v0.5.0, by
    ui-toolkit #178 (before #185): `release-provenance.yml` ran on the v0.5.0 publication,
    packed the tarball again from the `v0.5.0` tag (commit `2fb38e4e`) and attested it with
    `actions/attest-build-provenance`. That rebuild reproduced the published bytes, so
    `gh attestation verify vilnacrm-ui-toolkit-0.5.0.tgz -R VilnaCRM-Org/ui-toolkit` passes on
    the pinned asset (`sha256:bb3d61a6...`). What it proves: the workflow at `refs/tags/v0.5.0`
    built a tarball with that digest from the tag's source. It does not prove that the asset
    was uploaded by that workflow: the job's later `gh release upload --clobber` was refused
    ("Cannot delete asset from an immutable release"), so the asset is the original upload,
    identical to the attested bytes by digest. Nor does it cover the installed tree or the
    lockfile; the committed manifest and `make lint-ui-toolkit` stay the offline proof. Merged
    in #185, unreleased: a `.sha256` sidecar uploaded in that same post-publication step, which
    section 9.5 cross-checks. Open: a registry that records integrity, so the lockfile pins
    bytes.

## 14. File-Level Change Plan

No file is deleted, and no directory is added under `src/`. The one new directory is
`scripts/ci/ui-toolkit/`, inside the existing tooling tree.

### 14.1 Added (14)

| Path                                                      | Purpose                     |
| --------------------------------------------------------- | --------------------------- |
| `config/ui-toolkit-checksums.json`                        | digest manifest (9.1)       |
| `scripts/ci/ui-toolkit/ui-toolkit-policy.mjs`             | constants, patterns (9.4)   |
| `scripts/ci/ui-toolkit/ui-toolkit-pin-source.mjs`         | five pin statements         |
| `scripts/ci/ui-toolkit/ui-toolkit-install-source.mjs`     | installed tree reader       |
| `scripts/ci/ui-toolkit/ui-toolkit-integrity-verifier.mjs` | verifier (9.3)              |
| `scripts/ci/ui-toolkit/ui-toolkit-checksums-builder.mjs`  | refresher (9.5)             |
| `scripts/ci/verify-ui-toolkit.mjs`                        | CLI for `lint-ui-toolkit`   |
| `scripts/ci/update-ui-toolkit.mjs`                        | CLI for `update-ui-toolkit` |
| `tests/unit/scripts/ui-toolkit-integrity.test.ts`         | verifier cases (15.2)       |
| `tests/unit/scripts/ui-toolkit-checksums.test.ts`         | refresher cases (15.3)      |
| `tests/unit/tooling/ui-toolkit-pin.test.ts`               | real-repo pin check (15.4)  |
| `docs/adr/016-ui-toolkit-installation.md`                 | ADR-016 (section 4)         |
| `docs/ui-toolkit.md`                                      | contributor page (17.1)     |

The fourteenth, a spec file whose path is too long for the table, is
`specs/250-ui-toolkit/implementation-artifacts/pr-description-250-ui-toolkit.md`, the pull
request draft of epics Story 4.3. `.markdownlintignore` lists only `**/planning-artifacts/`, so
commit 4's hook runs `lint-md` on it; Story 4.3 already requires `make lint-md` to pass on it.

### 14.2 Modified (18)

- `package.json`, `bun.lock`: already carry the pin; committed as they are.
- `src/components/ui-breakpoints/index.ts`: the seam shape (5.1).
- `jest.config.ts`: mapper, transform allowlist and coverage inclusion (6.1).
- `scripts/ci/check-lockfile-registries.sh`: the sanctioned tokens (section 7).
- `Makefile`: the license id, two targets, both lint lists, the `.PHONY` line and the `lint:`
  help text.
- `tests/unit/components/ui-breakpoints/breakpoints-theme.test.ts`: one identity test (15.1).
- `tests/bats/lockfile_registries.bats`: six must-fail and one must-pass fixture (7.3).
- `tests/bats/makefile_targets.bats`: the mirrors, the table rows, the exclusions (9.7).
- `tests/bats/make-target-coverage.tsv`: two rows and one details edit.
- `docs/adr/README.md`: the ADR-016 index row.
- `docs/adr/013-bun-package-manager.md`: names the lockfile exception.
- `CLAUDE.md`, `AGENTS.md`: the command lists.
- `CONTRIBUTING.md`: one sentence naming `CC0-1.0` and its reason, beside the
  `ALLOWED_LICENSES` pointer (section 8).
- `SECURITY.md`: the lockfile provenance entry.
- `.github/copilot-instructions.md`: the quality-gates paragraph.
- `.claude/skills/quality-standards/SKILL.md`: the gate table row.

### 14.3 Explicitly unchanged

- `jest.mutation.config.ts`, `stryker.config.mjs`, `scripts/ci/mutation-scope.mjs`.
- `config/performance-budget.json`, both `lighthouse/lighthouserc.*.js`,
  `config/gate-thresholds.manifest.json`, `.jscpd.json`, `config/metrics-policy.json`.
- `eslint.config.mjs`, `.dependency-cruiser.js`, `tsconfig*.json`.
- Every Dockerfile, compose file, workflow, `scripts/docker/install-bun.sh`.
- `.gitleaks.toml`, `config/security-headers.json`, `serve.json`, `public/index.html`.
- `src/styles/**`, `src/components/ui-color-theme/**`, `src/components/ui-typography/theme.ts`
  (dead, follow-up), `.storybook/**`, `tests/unit/utils/render-with-providers.tsx`.
- `tests/unit/scripts/check-licenses.test.ts` (section 8).

## 15. Test Strategy

### 15.1 Seam (`breakpoints-theme.test.ts`)

- The four existing tests pass with zero edits: they pin values, media queries, key order and
  the height map, and they would already catch the website `default` (xs 375).
- One added test: after `jest.resetModules()`, import both `@/components/ui-breakpoints` and
  `@vilnacrm/ui-toolkit/ui-breakpoints`, then assert
  `expect(breakpointsTheme).toBe(crmBreakpointsTheme)` and
  `expect(heightBreakpoints).toBe(toolkitHeightBreakpoints)`. Both imports share one module
  registry, so identity holds; the test pins the named export independently of values.
- The test runs in `unit testing` and in the dry run of every Stryker shard that reaches the
  seam (section 6.2).
- Re-verified on 2026-09-29 with a scratch test file under the section 6.1 config. Both `toBe`
  assertions pass, and the subpath `default` is a different object from `crmBreakpointsTheme`.
  A leaf walk of `crmBreakpointsTheme` against a locally built
  `createTheme({ breakpoints: { values: … } })` found 310 leaves and 0 differences.
  `down('md')` is `@media (max-width:767.95px)`.

### 15.2 Verifier (`tests/unit/scripts/ui-toolkit-integrity.test.ts`)

- An in-memory file system (a `Map` from path to bytes) backs injected `readFile` and
  `readDir`; no fixture files on disk and no `node_modules` access.
- One pass case: a three-file fake install whose manifest matches, output `OK`, exit 0.
- Seven must-fail groups, one per class in section 9.3, each asserting exit 1 and the class
  tag in stderr. The `manifest` and `drift` groups use `it.each` over their sub-cases (bad
  algorithm, empty list, a `..` path, a `.` segment path, bad hex, duplicate, unsorted, a
  `releaseChecksum` outside `CHECKSUM_STATES`, and `releaseChecksum: "absent"` for a version
  outside `RELEASES_WITHOUT_CHECKSUM`; each of the five pin statements mismatched, and a
  missing or doubled `bun.lock` line). The pass case also covers `"matched"` for a version
  outside the list, and `"absent"` for `0.5.0`. The `install` group's missing-package case
  asserts the `make install` remedy text. The `extra`
  group covers an unlisted root file, a nested `node_modules/` file, and a symbolic-link entry
  that is reported without being read.
- All three new test files, `tests/unit/scripts/ui-toolkit-integrity.test.ts`,
  `tests/unit/scripts/ui-toolkit-checksums.test.ts` and
  `tests/unit/tooling/ui-toolkit-pin.test.ts`, start with the three-line block docblock that
  `tests/unit/tooling/image-hardening.test.ts`, `merge-queue-gates.test.ts` and
  `commitlint-gate.test.ts` use:

  ```ts
  /**
   * @jest-environment node
   */
  ```

  Jest 30 reads the pragma through `docblock.parse(docblock.extract(source))` in
  `jest-runner`, and `jest-docblock` 30.5.0 extracts only a leading `/** ... */` block. A
  `// @jest-environment node` line parses to `{}` and is ignored without a warning, so the file
  would run in `tests/jsdom-fetch-environment.cjs`; the block form parses to
  `{"jest-environment":"node"}` (measured, readiness N1). The byte fixtures, `node:crypto` and
  the injected `fetch` response then live in one Node realm instead of the jsdom one. The
  mutation config excludes `tests/unit/scripts/` and `tests/unit/tooling/`, so Stryker's
  node-environment variant is not needed.

- The tests pass each constructor exactly the keys it destructures. `lint-tsc` type-checks
  these TypeScript tests against types it infers from the untyped `.mjs` sources
  (`allowJs: true` without `checkJs`). An extra key in an object literal would be an
  excess-property error there, even though Jest would run the test. Re-verified: a scratch
  `.mjs` class destructuring `{ readFile, readDir }` makes `tsc` report TS2353 for a literal
  that also passes `stdout`.
- A thrown `readFile` error inside the digest loop proves the "never crash with exit 0" path.
- No conditional `expect`; `assertOk` / `assertError` from `tests/utils/assert-result.ts` are
  not needed because the API returns an exit code and strings.

### 15.3 Refresher (`tests/unit/scripts/ui-toolkit-checksums.test.ts`)

- Injected `fetch`, `readFile`, `readDir` and `writeFile` spies; no network. The fake `fetch`
  answers the tarball URL and the `.sha256` URL separately.
- `[pin]`: a semver range, and a `v0.5.0` tag with a `0.5.1` asset; neither `fetch` nor
  `writeFile` is called.
- `[install]`: installed version differs from the pin; `writeFile` never called; exit 1.
- `[download]`: the tarball `fetch` rejects, or resolves with status 404; the `.sha256`
  `fetch` rejects, or resolves with status 500; each leaves `writeFile` uncalled.
- `[checksum]`: a `.sha256` body that is malformed, that names another asset, or that carries
  another digest; and a 404 for a pinned version outside `RELEASES_WITHOUT_CHECKSUM`; each
  leaves `writeFile` uncalled.
- Pass, v0.5.0 shape: the `.sha256` URL answers 404 for version `0.5.0`, and the written JSON
  carries `releaseChecksum: "absent"`.
- Pass, later-release shape: a pinned `0.6.0` URL whose `.sha256` body names the asset and the
  step 4 digest; the written JSON carries `releaseChecksum: "matched"`.
- Both pass cases assert that the written JSON is list-shaped, sorted by `path`, excludes
  `LICENSE` and `README.md`, carries the fake asset's sha256, and keeps the existing
  `comment`; a first-generation case with no manifest writes the default `comment`.

### 15.4 Pin consistency (`tests/unit/tooling/ui-toolkit-pin.test.ts`)

- Runs `UiToolkitPinSource.compareStatements()` with the real `readFileSync` over the real
  repository: zero findings. `readPackagePin()` on the same repository captures the version
  that the committed manifest's `version` names. The test holds no hard-coded pinned version
  (it would be a sixth statement to edit on every bump); `0.5.0` appears in it only inside
  `RELEASES_WITHOUT_CHECKSUM`, which a bump does not change.
- Must-fail: `compareStatements()` with a `readFile` that swaps the gate literal for `v0.5.1`
  reports one `drift` finding.
- `RELEASES_WITHOUT_CHECKSUM` equals exactly `['0.5.0']` and is frozen, so adding a release
  to it is a visible, reviewed test edit.

### 15.5 Shell gates (Bats)

- `lockfile_registries.bats`: section 7.3.
- `makefile_targets.bats` and the coverage manifest: section 9.7.

### 15.6 Coverage and mutation accounting

- Unit coverage: the five library files enter the global 100% through the new inclusion and
  must reach 100/100/100/100 from sections 15.2 to 15.4.
- Integration coverage: the integration run never imports them; the existing
  `scripts/localization-generator.js` inclusion is in the same position and integration CI is
  green today, which is the precedent.
- Mutation: the seam has no mutable token; `scripts/` is outside the mutate root; the shard
  repack is absorbed by the ownership-authoritative merge.

### 15.7 Local versus CI

Locally, `make install` first (it refreshes the dev container's `node_modules` named volume,
which Docker seeds from the image only when it is empty), then only focused Jest on the four
touched test files, ESLint and Prettier on changed files, `tsc`,
`sh scripts/ci/check-lockfile-registries.sh` and `make lint-ui-toolkit`. The Husky hook's own
run at each of the four commit points (section 18) is the only full-suite run made locally.
Bats, image builds, Lighthouse, visual and Trivy run in CI only.

## 16. Implementation Patterns and Consistency Rules

- **Naming:** kebab-case files (`ui-toolkit-integrity-verifier.mjs`), `UiToolkit*` classes with
  a table suffix (`Source`, `Verifier`, `Builder`), `lint-*` and `update-*` make targets.
- **I/O:** constructor injection only; no module-level instance or singleton is exported.
- **Errors:** findings are data (`{ className, detail }`); only `run()` turns them into text
  and an exit code.
- **Docs, not comments:** no new comment anywhere in code, scripts, tests or config. Exactly
  two existing comments are amended, each only so that it stays true: the lockfile gate header
  in `scripts/ci/check-lockfile-registries.sh` gains one clause naming the sanctioned release
  tarball (section 7.2), and the Bats scaffold-exclusion comment at
  `makefile_targets.bats:473-483` gains the "tenth, lint-ui-toolkit" sentence and an updated
  count sentence (section 9.7). A make target's `##` help text and Markdown documentation are
  not code comments. This section is the one statement of the rule; every other artifact
  refers to it.
- **One version string:** `v0.5.0` and the full URL appear in exactly five machine-read places,
  and the verifier and the tooling test compare all five.

## 17. Documentation Updates

### 17.1 `docs/ui-toolkit.md` (new)

Sections: what is installed (the pin and the peers); how to import (the rule in 5.3); the
digest gate and its precise claim ("installed build artifacts are verifiable offline;
`bun install --frozen-lockfile` itself fetches unverified bytes"), including the `.sha256`
rule (v0.5.0 has no published checksum; every later pin must match its published one); stale
dev container (J2 remedy: `make install`); bumping (below); the keep-local register (section
12, with its "After #185" column); the deferred ui-toolkit #185 adoption (section 12.1); fonts
(section 10); the 11 upstream follow-ups with their statuses (section 13). It links no path
under `node_modules/` or `specs/`, and every `make` target it names exists in the same change.

**Bump recipe.** This is the one binding recipe (readiness F2). PRD J3, the docs page and
Epic 5 reproduce it; none of them carries a variant. Run it from a host terminal with the dev
container up (`make start`), in this order:

1. `docker compose exec -T dev bun add "<new release URL>"`. This is the bare-URL form the
   toolkit's CONSUMING.md and `website`'s docs use: bun names the dependency from the
   tarball's own manifest, rewrites `package.json` and both `bun.lock` lines, and installs the
   new tree into the dev container's `node_modules` volume. The recipe never hand-edits
   `package.json` and then runs a plain `bun install`; `bun add` does both in one step.
2. Edit `TOOLKIT_URL` in `scripts/ci/check-lockfile-registries.sh` to the same URL. This is
   the one manual edit, and the verifier's `drift` class fails until it matches.
3. Run the refresher, then both gates:

```bash
make update-ui-toolkit
make lint-lockfile lint-ui-toolkit
```

The refresher reads only the `package.json` pin (`readPackagePin()`) and the installed version
(section 9.5), so step 2 can come before or after it; doing it second keeps every pin
statement consistent before any digest is written. For any release after v0.5.0 the refresher
also requires the release's published `.sha256` asset to exist and to agree, and records
`releaseChecksum: "matched"`. The machine-read part of the diff is exactly: one
`package.json` line, the two `bun.lock` lines (plus any peer-range change the new release
makes, which is then a reviewed peer decision), the gate literal and the manifest. The bump
also edits the version named in `docs/ui-toolkit.md` and records the new pin in ADR-016:
changing the `dependencies` map trips the ADR drift gate (`config/docs-policy.json`,
`architectureDrift.manifestKeys`), which the ADR edit satisfies without the escape hatch. No
script, test or constant changes. Running `make update-ui-toolkit` to clear a red
`lint-ui-toolkit` without re-reviewing the release is forbidden.

### 17.2 Doc-sync surfaces (PRD FR-17)

1. `CLAUDE.md` "Code Quality" block: add `make lint-ui-toolkit` and `make update-ui-toolkit`;
   the `make lint-lockfile` comment becomes "npm registry allowlist plus one pinned tarball".
2. `AGENTS.md` "Code Quality" block: the same two targets.
3. `CONTRIBUTING.md:840-846`: one sentence beside the `ALLOWED_LICENSES` pointer naming
   `CC0-1.0` and why it is allowed; no SPDX list is added (section 8).
4. `docs/adr/013-bun-package-manager.md:28`: the lockfile gate now has one exact exception.
5. `.claude/skills/quality-standards/SKILL.md:28`: a "UI toolkit digest" row next to Licenses.
6. `SECURITY.md:133-134`: the provenance entry names the exception and the digest gate.
7. `.github/copilot-instructions.md:97`: list the toolkit digest gate beside the lockfile gate.

Plus `docs/adr/README.md` (index row) and ADR-016 itself.

## 18. Implementation Sequencing

One pull request, exactly four commits in this order, so every commit is self-consistent:

1. **Gates:** lockfile tokens and Bats fixtures; `CC0-1.0` (epics Story 1.1).
2. **Provenance:** policy, sources, verifier, builder, CLIs, manifest (generated by
   `make update-ui-toolkit`), tests, make targets, Bats rows, the coverage inclusion (Stories
   2.1 and 2.2).
3. **Jest and seam:** mapper and transform entries; the seam; the identity test (Story 3.1).
4. **Docs:** ADR-016, the README row, `docs/ui-toolkit.md`, the seven doc-sync surfaces and
   the drafted PR text (Stories 4.1 to 4.3).

The dependency lines in `package.json` and `bun.lock` go in commit 1, because the lockfile
gate's must-pass case needs them. Each commit message ends with `(#250)`.

**Hook load, stated honestly (readiness F9).** `.husky/pre-commit` runs `make format`
(Prettier and qlty), `git add -A`, `make lint` (the 17-target lint aggregate, several of them
Docker-backed: `lint-metrics`, `lint-shell`, `lint-actionlint`, `lint-compose`; 18 targets
once `lint-ui-toolkit` joins in commit 2) and `make test-unit-all` (the client and server unit
suites, with coverage). Every commit therefore runs the full lint aggregate and the full unit
suite locally. That sits against the owner's no-heavy-local-suites preference, so the plan
keeps it to four hook runs, one per commit above, instead of one per story (seven); a commit
the hook rejects costs one more run after the fix. The hook's run is the only full-suite run
made locally, and it is never skipped: no `--no-verify`, no `HUSKY=0`.

> Assumption: four commits, not seven, is the answer to F9. Stories 2.1 and 2.2 share commit
> 2, and Stories 4.1 to 4.3 share commit 4; the earlier story of each pair leaves its work in
> the tree and the later story's commit takes both, which the hook's `git add -A` does anyway.
> Each commit point is green on its own, which is all the hook checks.

## 19. Rollback

- **Full rollback:** revert the squash commit. It restores the CRM-local seam, removes the
  dependency, the gates, the manifest and the docs. Nothing persists at runtime (no storage,
  no runtime config, no served asset), so no migration is needed. Contributors then run
  `make install` (`bun install --frozen-lockfile` in the dev container) to drop the package
  from their dev-container volume.
- **Partial rollback (keep the install, drop the seam):** restore the previous 20-line
  `ui-breakpoints/index.ts` and remove the identity test. Every value test still passes, so it
  is a one-file revert.
- **Triggers:** `lint-ui-toolkit` fails on an unchanged pin (a re-uploaded asset); a visual or
  axe diff traced to the seam; a toolkit peer bump that CRM cannot follow.
- **Scanner failure on the URL entry:** Trivy's `bun.lock` parser and the CycloneDX generator
  have never seen a tarball-URL package in this repository, and neither runs locally. If
  `supply-chain security / dependency scan`, `image scan` or `sbom / generate` goes red because
  of the toolkit entry, the implementer does not add a `.trivyignore` entry, lower
  `TRIVY_SEVERITY` or narrow the target. The implementer stops, records the scanner's error in
  the PR, and escalates it as a blocker whose remedy is upstream follow-up 11 (a registry
  publish). A scanner that simply omits the component is the documented blind spot, not a
  failure.

> Assumption: there is no local evidence either way. Trivy is CI-only under the no-heavy-local-
> suites rule, and website's #459 gives no Trivy precedent for `bun.lock`. The stop rule is
> therefore fixed now rather than left for the implementer to decide under time pressure.

## 20. CI Evidence Plan

Every check below must be green on the final head, with no re-run hiding a flake:

- `static testing / static`: its log shows the `lint-ui-toolkit` OK line with 331 artifacts,
  the lockfile gate pass line and the license gate count. The ADR drift steps pass without an
  escape hatch.
- `unit testing / unit`, `integration testing / integration`, `bats testing / bats`,
  `codecov / codecov`.
- `mutation testing / shard N` (all) and `mutation testing / merge and enforce gate` at 100%.
- `bundle size / measure and gate` and `bundle size / PR report`: the PR description quotes
  the eager gzip delta (at most 64 B, expected 0 B) and the summed non-initial delta (at most
  256 B).
- `performance testing / lighthouse desktop` and `/ lighthouse mobile`, against the floors
  asserted in the unedited `lighthouserc` files: mobile performance at least 0.84 as the median
  of 3 runs per URL. The profile's `lighthouse_mobile: 85` is reported beside it, and a median
  in `[0.84, 0.85)` follows the escalation route in PRD NFR-8, never an edit of a floor.
- Dependabot, after merge: the first weekly `bun` "Dependabot Updates" run on `main` succeeds
  and proposes no change to `@vilnacrm/ui-toolkit`. Before merge, the PR records `website`'s
  evidence (three `bun` update jobs succeeded against its `main` after #459) and, if it has run
  by then, the outcome of `website`'s first weekly `bun` scan. A failed run is escalated to the
  maintainer as a supply-chain blocker for the Dependabot lane; it is not a PR check.
- `accessibility testing / axe component gate` and
  `/ axe route scans and keyboard contract`; `visual tests / visual-test` with 0 diffs;
  `e2e testing / test`.
- `gate ratchet / no binding threshold weakened`: the report shows the new inclusion as a
  strengthening and no weakening.
- `supply-chain security / secret scan`, `/ dependency scan`, `/ image scan`,
  `sbom / generate`: the PR description records how CycloneDX lists the toolkit component.
- `security testing / Analyze`, `/ preloaded-auth seed gate`, `/ security headers`.
- `dependency cruiser / dependency-cruiser`, `eslint-suppressions / eslint-suppressions`,
  `rust-code-analysis / rust-code-analysis`, `scaffold testing / scaffold`,
  `storybook testing / storybook-build`.
- Every other check that reports on the head (memory leak, load, contract, commitlint,
  zizmor, yamlfmt).

## 21. Architecture Validation

### 21.1 Coherence

- AD-2 and AD-5 agree: the seam imports one subpath; the mapper resolves exactly that shape.
- AD-6 and AD-9 agree: the gate literal is exact, and the verifier compares it with the other
  four statements.
- AD-10 and NFR-1 agree: the inclusion grows coverage, and nothing is excluded.
- AD-4 and NFR-8 agree: no stylesheet or font bytes reach any page.

### 21.2 Requirements Coverage

| Requirement            | Covered by                |
| ---------------------- | ------------------------- |
| FR-1, FR-2             | section 2; AD-1; 14.2     |
| FR-3                   | section 6                 |
| FR-4                   | section 7                 |
| FR-5                   | section 8                 |
| FR-6, FR-15            | section 4                 |
| FR-7, FR-8             | 9.1 to 9.4, 15.2          |
| FR-9                   | 9.5, 15.3                 |
| FR-10, NFR-19          | AD-9, 9.4, 15.4           |
| FR-11, FR-14           | section 5, 15.1           |
| FR-12                  | section 12                |
| FR-13                  | section 10                |
| FR-16, FR-17           | section 17                |
| FR-18                  | 9.6, 9.7                  |
| NFR-1, NFR-2           | AD-10, 15.6               |
| NFR-3 to NFR-5, NFR-17 | 5.1, 14.3, 16             |
| NFR-6, NFR-7, NFR-18   | section 11                |
| NFR-8 to NFR-10        | sections 5, 10; 20        |
| NFR-11 to NFR-16       | sections 4, 7, 8, 9; 14.3 |
| NFR-20                 | section 20                |

### 21.3 Gaps Found and Resolved Here

1. The PRD's lockfile exception, taken literally as a URL-only `grep -vxF`, would let the
   same URL pass under another package. Resolved by the package-bound tokens (AD-6).
2. Website's verifier walks only `build/`, so a new root file would pass. Resolved by walking
   the whole package root (9.3).
3. The PRD's version-equality test covered four surfaces (the PRD now says five);
   `bun.lock` has two occurrences, so the check compares five statements and requires each
   `bun.lock` shape exactly once.
4. The registration notification is a sixth async chunk that bundles the seam; the byte
   ceiling still holds (section 11).

### 21.4 Adversarial Validation (validate-architecture, 2026-09-29)

Every claim was checked against the worktree and the installed package, and scratch probes
were run outside the repository or deleted afterwards. The review found 12 defects, fixed in
place:

1. **PRD out of sync on the lockfile exception.** FR-4 and NFR-13 still said "whole-line" and
   listed 5 fixtures; AD-6 strips a package-bound line prefix and needs 6 must-fail fixtures
   plus 1 must-pass. The PRD was corrected.
2. **PRD out of sync on the pin surfaces.** FR-10 and NFR-19 counted four surfaces, but AD-9
   compares five statements, with each `bun.lock` shape required exactly once. The PRD was
   corrected.
3. **PRD named a `main()` function.** FR-8 did, where AD-8 has injected classes with `run()`
   and branch-free CLI entries. The PRD was corrected.
4. **False "every shard" claim.** Under `enableFindRelatedTests` only the shards reaching the
   seam run its test (6.2, 15.1).
5. **Unit ts-jest mislabelled.** It was called transpile-only; only the mutation config is
   (5.2).
6. **Path aliasing via `.` segments.** `ARTIFACT_PATH_PATTERN` accepted `build/./x`; it now
   rejects `.` and `..` segments (9.3, 9.4).
7. **Unspecified link handling.** Symlinks and other non-regular entries are now `extra` and
   are never followed (9.2, 15.2).
8. **Missing `.PHONY` entries** for both new targets (9.6, 14.2).
9. **Implicit `SCAFFOLD_VERIFY_TARGETS`.** It is now stated to stay unedited (9.7).
10. **Test typing trap.** `lint-tsc` infers `.mjs` constructor shapes, so an extra fake key
    fails with TS2353 (15.2, reproduced).
11. **No response defined for a scanner error on the URL entry** (section 19).
12. **Unanalysed resolvers.** Storybook's webpack and dependency-cruiser resolution of the
    exports-only subpath were not covered (section 11).

Claims attacked and confirmed:

- The seam values are identical: 310 leaves, 0 differences.
- The seam's re-export typing compiles under `strict` and `exactOptionalPropertyTypes`.
- ESLint accepts the seam.
- The Jest mapper works under CommonJS Jest with `customExportConditions: ['']`.
- The eager closure never reaches the seam; its importers are all lazy style or theme files.
- The anchored release regex rejects other GitHub URLs.
- The lockfile token strip behaves the same under GNU `awk` and `busybox awk`.
- The ratchet scores an inclusion as no-shrink.
- CODEOWNERS already covers `/config/`, `/scripts/` and `/Makefile`.
- `check-env-sync`, Dockerfiles, `.dockerignore` and `config/gate-thresholds.manifest.json`
  need no edit.
- gitleaks passes the manifest shape.
- Prettier accepts `JSON.stringify(…, null, 2)`.
- The 331 digests are identical to website's.
- The seam stays in the mutate scope with 0 mutants, which the ownership-authoritative merge
  handles.
- The ADR title is 97 characters, under `heading_line_length` 100.

> Assumption: the class-only rule does not reach `scripts/` (ESLint ignores `scripts/**`, and
> the #100 selectors are scoped to `src/**/*.ts`). The verifier follows it anyway, by the
> owner's preference (section 9.2). No verifier file lives under `src/`, so no ESLint class or
> naming selector, rca metric or jscpd scan applies to it.

### 21.5 Correction Pass 1 (2026-09-29)

Applied after `implementation-readiness` iteration 1, and after ui-toolkit PR #185 merged to the
toolkit's `main` (post-v0.5.0, unreleased):

1. **#185 decision:** AD-14 installs v0.5.0 now and makes the next release a pin bump; the
   ADR-016 outline gains a considered option, a driver, a negative consequence, a reversal
   trigger and the link (section 4).
2. **Checksum gate:** the manifest gains `releaseChecksum`; the refresher cross-checks the
   published `.sha256` when the release has one and gains the `[checksum]` refusal; the
   verifier enforces the rule offline, with `RELEASES_WITHOUT_CHECKSUM` frozen at `['0.5.0']`
   (sections 9.1 to 9.5, 15.2 to 15.4).
3. **Jest:** section 6.3 states that the mapper keeps working when `default` arrives and
   becomes removable, while `transformIgnorePatterns` and the `.mjs` transform stay required.
4. **Register (F3):** section 12 is the single union register, with R10, R11 and an
   "After #185" column; section 12.1 frames the deferred adoption.
5. **Bump recipe (F2):** section 17.1 is the one binding recipe, in the bare-URL `bun add`
   form the toolkit and `website` document.
6. **Pin source (F5):** `readPackagePin()` and `compareStatements()`; the five statements are
   enumerated once in AD-9.
7. **CONTRIBUTING.md (F4):** one sentence beside the `ALLOWED_LICENSES` pointer, no list.
8. **Stale volume (F1):** the remedy is `make install` (sections 9.3, 15.7, 19).
9. **Mobile floor (F7):** section 20 reads the asserted 0.84 median and routes a
   `[0.84, 0.85)` median to escalation.
10. **Dependabot (F8):** a negative consequence in ADR-016 and a post-merge check in
    section 20.
11. **Hook load (F9):** four commit points instead of seven, with the load stated
    (section 18).

### 21.6 Adversarial Validation 2 (after correction pass 1)

`validate-architecture` re-ran adversarially on 2026-09-29 against ui-toolkit PR #185 (merged
source on the toolkit's `main`), the installed v0.5.0 build, the `Makefile`, both
`lighthouserc` files, `.github/dependabot.yml`, `config/docs-policy.json` and CRM's own
components. Defects fixed in place:

1. **A keep-local reason #185 resolves was kept.** `ui-container` was held local on R3, but
   v0.5.0 `UiContainer` reads only `md`, `lg` and `xl` (equal to CRM's) and has CRM's styles
   and props; its one difference is the prohibited `aria-label`, which #185 drops. New reason
   R12; the row is adoptable after the bump (Deferred 5.5).
2. **A claim #185 does not deliver.** `ui-footer` was marked adoptable, but the `crm` variant
   renders its link labels through `UiTypography` without `inheritTheme`, so the kit `body1`
   (MUI's default font family, not `Golos`) applies. The row stays local on R2 and Deferred
   5.3 is blocked on that upstream change as well. The same holds for `UiForm`'s title and
   error banner, so `ui-form` now lists R2 beside R10.
3. **Stale "not diffed" claim.** The footer's `md`, `lg` and `xl` equal CRM's in v0.5.0
   (`chunk-BSIOUHDK.mjs`); the swap still re-diffs them against the pinned release.
4. **The bump was not a pure pin bump.** The pin test asserted a literal `0.5.0`, and the
   recipe's "exact" diff left out the ADR edit that the ADR drift gate requires for any
   `dependencies` change. The test now compares with the manifest's `version` (15.4), and
   17.1 names the docs and ADR edits.
5. **Import-rule conflict in the deferred epic.** Every Epic 5 swap imports a component
   subpath's `default` export, which section 5.3 forbids; 12.1 now scopes the amendment.
6. **Unrecorded #185 side effect.** #185 set the toolkit `main`'s version to `0.5.0`, so a
   `main` build is indistinguishable from the release by version alone (AD-14).
7. **Ambiguous codes.** Register reasons R10 to R12 collide with the brief's risk IDs; section
   12 now says the codes are register-local.

Claims attacked and confirmed: the `.sha256` asset format (`sha256sum` output, one line), the
v0.5.0 release carrying only the `.tgz`, release PR #182 still open, `make install` at
`Makefile:947`, the 17-target `lint:` aggregate, the mobile assertion 0.84 `median-run` over
3 runs against the profile's 85, no `ignore` or `allow` list in either repository's `bun`
Dependabot lane, `website`'s first weekly scan falling on Monday 2026-10-05, the `default`
condition on every JavaScript entry point in #185, the Jest `customExportConditions: ['']`
and `.mjs` babel-jest transform, and bmalph reading exactly Stories 1.1 to 4.3.

### 21.7 Correction Pass 2 (readiness iteration 2)

Readiness iteration 2 failed on one major finding and raised four more; each is fixed here at
its source:

1. **N1, inert Jest pragma.** Section 15.2 prescribed `// @jest-environment node`, which Jest 30
   ignores. It now prescribes the three-line block docblock for all three new test files, names
   them, and drops the claim that the line form was an existing precedent.
2. **N2, one status for follow-up 11.** Section 13 marks item 11 "partly merged in #185,
   unreleased", and research section 11 now carries the same status and wording.
3. **N3, commit grouping.** Unchanged here: section 18 already fixes the commit order. The
   epics now state that document order binds and mark Story 3.1 dependent on Story 2.2.
4. **N4, the PR draft.** Section 14.1 lists Story 4.3's
   `pr-description-250-ui-toolkit.md` as the fourteenth added file.
5. **N5, line pointers.** Section 9.7 now points at `makefile_targets.bats:475-483`. Section
   1.2 names both lines of `lint-deps`, re-measured on this worktree: the target is
   `Makefile:494` and the `depcruise` recipe `Makefile:495`, so the old `:495` pointed at the
   recipe and was right.

> Assumption: readiness N5 gives `Makefile:493` (recipe 494). Re-measured on the worktree and on
> `origin/main`, `lint-deps:` is line 494, so the pointer names both lines instead of moving to 493.

### 21.8 Readiness

Ready for `create-epics-stories`. No component, module, adapter or seam is added beyond
FR-11.

### 21.9 Correction Pass 3 (readiness iteration 3)

Readiness iteration 3 passed with two minors; both are fixed here at their source:

1. **R3-1, follow-up 11 status.** Section 13 item 11 now records the existing v0.5.0
   build-provenance attestation and what it does and does not prove. Re-verified on
   2026-09-29: the downloaded asset hashes to the pinned `tarballSha256`;
   `gh attestation verify` (gh 2.101.0) passes with signer workflow `release-provenance.yml`
   and source ref `refs/tags/v0.5.0`; `gh api .../attestations/sha256:bb3d61a6...` returns two
   SLSA v1 provenance statements (run 36394249277, attempts 1 and 2) and one GitHub release
   attestation (`gh release verify-asset v0.5.0` passes); the release is `immutable: true`,
   and the job log shows the attestation created before the refused asset replacement. No
   design changes: the attestation covers the release tarball, not the installed tree.
2. **R3-2, one comment rule.** Section 16 states the rule once: no new comment, and exactly
   two existing comments amended to stay true. Sections 7.2 and 9.7 point to it.

> Assumption: wiring `gh attestation verify` into a gate stays out of scope. It would be a new
> networked gate outside this installation, and the offline digest manifest already proves the
> installed bytes.

## 22. Open Questions (each resolved autonomously)

- Should `scripts/ci/ui-toolkit/` be flat files instead of a directory?

  > Assumption: a directory, following `scripts/ci/gate-ratchet/`, so one coverage glob covers
  > the library and the CLIs stay outside it.

- Should the verifier also run the lockfile gate?

  > Assumption: no. Each gate keeps one responsibility; the verifier only reads the gate's
  > literal for the pin comparison.

- Should `lint-ui-toolkit` run on the host instead of the dev container?

  > Assumption: the dev container, like `lint-licenses`, because the host may have no
  > `node_modules`; the failure message names the reinstall command (`make install`).

- Should this change wait for the release carrying ui-toolkit #185, or pin its `main`?

  > Assumption: neither (AD-14). v0.5.0 is installed now; the #185 opt-ins are adopted by the
  > deferred Epic 5 after the next release, through the section 17.1 recipe.
