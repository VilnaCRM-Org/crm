---
status: 'complete'
workflowType: 'prd'
stepsCompleted:
  - 'step-01-init'
  - 'step-02-discovery'
  - 'step-02b-vision'
  - 'step-02c-executive-summary'
  - 'step-03-success'
  - 'step-04-journeys'
  - 'step-05-domain'
  - 'step-06-innovation'
  - 'step-07-project-type'
  - 'step-08-scoping'
  - 'step-09-functional'
  - 'step-10-nonfunctional'
  - 'step-11-polish'
  - 'step-12-complete'
validated: '2026-09-29 (validate-prd, 16 findings fixed in place; see section 15)'
corrected: '2026-09-29 (pass 1: ui-toolkit#185, F1 to F9; pass 3: R3-1, R3-2; section 15)'
project_name: 'crm'
date: '2026-09-29'
issue: 250
author: 'pm (John), autonomous run'
classification:
  projectType: 'web_app (React SPA) - internal dependency and build-governance change'
  domain: 'general (software supply chain)'
  complexity: 'medium'
  projectContext: 'brownfield'
inputDocuments:
  - 'specs/250-ui-toolkit/planning-artifacts/research-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/brief-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/run-summary-250-ui-toolkit-2026-09-29.md'
  - 'https://github.com/VilnaCRM-Org/crm/issues/250'
  - 'https://github.com/VilnaCRM-Org/website/pull/459'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/pull/185'
  - '.claude/react-sdlc.yml'
  - '.github/dependabot.yml'
  - '.husky/pre-commit'
  - 'CONTRIBUTING.md'
  - 'config/performance-budget.json'
  - 'lighthouse/lighthouserc.desktop.js'
  - 'lighthouse/lighthouserc.mobile.js'
  - 'stryker.config.mjs'
  - 'jest.config.ts'
  - 'Makefile'
  - 'src/components/ui-breakpoints/index.ts'
  - 'CLAUDE.md'
  - 'SECURITY.md'
  - 'AGENTS.md'
  - '.github/copilot-instructions.md'
  - '.github/workflows/'
  - 'tests/bats/makefile_targets.bats'
---

# Product Requirements Document: installing `@vilnacrm/ui-toolkit` into CRM (#250)

**Author:** pm (John), autonomous BMAD run. **Date:** 2026-09-29.

Predecessors: [technical research](./research-250-ui-toolkit-2026-09-29.md) and
[product brief](./brief-250-ui-toolkit-2026-09-29.md). Run log:
[run summary](./run-summary-250-ui-toolkit-2026-09-29.md). Figures are taken from the research
artifact, which re-measured them in the worktree on 2026-09-29, unless marked as re-verified
here. This PRD carries the brief's goals G-1 to G-6 into functional requirements, its metrics
M-1 to M-14 into acceptance criteria, its constraints into NFRs and its risks into section 10.

## 1. Executive Summary

CRM and `website` are meant to render one VilnaCRM design system through the shared
`@vilnacrm/ui-toolkit` package. Issue #250 describes that work as blocked on React 19 and MUI 9.
The block is gone: `package.json` pins React 19.2.8, `@mui/material` ^9.4.0, i18next ^26.4.2
and react-i18next ^17.0.14, and every toolkit peer range is satisfied.

The product owner narrowed the scope: _"we do not want to create new modules/components for
now, we can do the ui-kit installation"_. This PRD specifies that installation:

- the v0.5.0 release tarball as a first-class, pinned dependency;
- every repository gate it trips passing through a narrow, reviewed policy edit;
- offline provenance for the installed bytes, enforced in `make lint`;
- Jest wiring for the ESM-only package;
- ADR-016 and a docs page that record every decision and deviation;
- exactly one consumed seam, `src/components/ui-breakpoints`, whose value is deep-equal to the
  CRM value it replaces (0 of 310 leaves differ).

End users see nothing change. Contributors gain a governed dependency that later primitive swaps
can build on without re-deciding supply chain, licensing, test wiring or bundle policy.

ui-toolkit PR #185 merged to the toolkit's `main` on 2026-09-28T23:36Z, after v0.5.0 was
released. It adds opt-in CRM behaviour (`UiButton` native loading, `UiForm` heading level and
offline notice, a `crm` footer variant, skeleton ids, theme-inheriting typography), a `default`
export condition and a per-release `.sha256` asset. v0.5.0 is still the latest release, and no
newer tag exists.

> Assumption: this change installs the latest released version, v0.5.0, now. It neither waits
> for the release that will carry #185 nor pins the toolkit's unreleased `main`, which has no
> release asset, attestation or checksum to pin. Every piece is built so the next release is a
> pin bump (architecture AD-14): the checksum gate works without a published `.sha256` and
> cross-checks it when the pinned release has one (FR-9), the Jest wiring keeps working when
> the `default` condition arrives (FR-3), and the swaps #185 enables are a deferred follow-up,
> blocked on a toolkit release above 0.5.0 (section 4).

### What Makes This Special

- **Identity, not similarity.** A seam is adopted only if the whole exported object is
  deep-equal to CRM's. Visual, accessibility and behavioural baselines therefore cannot move.
- **Honest provenance.** Bun records no integrity for a remote tarball. A committed sha256
  manifest over 331 installed artifacts makes the installed build verifiable offline, and the
  claim is stated as exactly that.
- **Zero weakening.** No floor lowered, no ceiling raised, no suppression, no `gate-relaxation`
  label. The two allowlist widenings are one exact URL and one SPDX id.

## 2. Project Classification

- **Project type:** web app (React SPA); the change is dependency and build governance, not a
  user-facing feature.
- **Domain:** general, with software supply-chain concerns (CWE-494, SPDX licensing, SBOM).
- **Complexity:** medium. The `src/` diff is one file, but the change crosses the nine gates
  G1 to G9 of research section 6.
- **Context:** brownfield, on `origin/main` 4689eca6 (includes #106).

## 3. Success Criteria

### User Success

- **Contributors:** one docs page and one ADR answer how to import (named subpath exports
  only), how to bump (the one binding recipe of architecture section 17.1), and why each
  primitive is still CRM-local.
- **Maintainer ([@kravalg](https://github.com/kravalg)):** every policy widening is exact,
  justified in ADR-016 and visible in one CODEOWNERS review.
- **End users:** 0 visual snapshot changes, 0 new axe violations, Lighthouse scores at or above
  their floors.

### Business Success

- The toolkit dependency is installed and verified, so the next swap is a UI decision only.
- Issue #250 closes as scoped by the product owner, with each deferred checkbox recorded.

### Technical Success

The brief's metrics are binding acceptance criteria. Each maps to FRs and NFRs in section 11:

- M-1 to M-5: gate outcomes (FR-4 to FR-10, NFR-14).
- M-6 to M-8: raise-only quality floors (NFR-1 to NFR-5).
- M-9 to M-12: no-observable-change guarantees (FR-11, NFR-6 to NFR-10).
- M-13 and M-14: scope discipline (FR-11, FR-10, FR-15).

### Measurable Outcomes

- All FR acceptance criteria hold on the PR head.
- Every CI check in NFR-20 is green on the PR head, with no re-run used to mask a flake.

## 4. Product Scope

### MVP (this PR)

- Dependency pinned at the v0.5.0 release tarball (already in `package.json` and `bun.lock`).
- Gate edits: lockfile exact-URL exception, `CC0-1.0` license entry, Jest subpath mapper plus
  `transformIgnorePatterns` entry, ADR-016.
- Provenance: checksum manifest, verifier script, `make lint-ui-toolkit` and
  `make update-ui-toolkit` (which cross-checks a release's published `.sha256` when it has
  one), make-target contract rows.
- Tests: verifier must-fail cases, lockfile must-fail fixtures, version-equality test, seam
  identity assertion. The optional `CC0-1.0` license pass case is declined (FR-5).
- Seam: `ui-breakpoints` re-pointed at the named CRM exports.
- Docs: ADR-016, `docs/ui-toolkit.md`, and the doc-sync surfaces listed in FR-17.

### Deferred: blocked on a ui-toolkit release above 0.5.0 (not in this PR)

Epic 5 of the epics document. Its stories are marked
`Dependency: blocked on ui-toolkit release > 0.5.0` and are not part of this pull request's
dispatch set. They are swaps behind existing CRM seams and props, with no new module,
component, `UI*` primitive or adapter:

- the pin bump to the next release, through the binding recipe (architecture section 17.1),
  with the `.sha256` cross-check and the optional removal of the Jest subpath mapper;
- `ui-typography` through `UiTypography` `inheritTheme`;
- `ui-container` through `UiContainer`, once #185 has dropped its `aria-label`;
- `ui-footer` through `UiFooter` `variant="crm"`, also blocked on an upstream change that
  renders its link labels with `inheritTheme` (FR-12 register reason R2);
- `ui-button` and `ui-form` through `loadingMode="native"` and the `UiForm` options, which are
  also blocked on an upstream contained `:focus-visible` outline (register reason R10), and
  the form also on `inheritTheme` for its title and error banner (R2).

Each deferred swap imports a component subpath's `default` export, so it also amends the
documented import rule for that one subpath (architecture section 12.1).

### Growth (after #250, each its own issue)

- Primitive swaps that #185 does not unblock, reconsidered one at a time once upstream fixes
  land, each with its own value-diff and baseline evidence.
- An import-restriction lint gate for the toolkit, with must-fail fixtures.

### Vision

- The toolkit ships from a registry that records integrity, so the lockfile pins the bytes, and
  CRM and `website` render the same primitives.

### Out of Scope

- New modules, components, `UI*` primitives or adapters (product owner constraint).
- Toolkit `styles.css`, fonts, `UiThemeProvider` / `createUiTheme`.
- Adopting `ui-color-theme` (research section 4).
- The Storybook preview theme and the `renderWithProviders` test theme.
- CRM MUI module augmentation for the 9 toolkit-only palette keys.
- An import-restriction lint gate for the toolkit (Growth; it needs its own must-fail fixture).
- Deleting the dead `src/components/ui-typography/theme.ts` (Q4).
- Filing upstream issues or PRs, or editing issue #250 (Q2); gaps are recorded in section 12
  only.

### Issue #250 Scope Trace

The issue's five checkboxes are labelled C1 to C5 here.

| ID  | Issue checkbox                  | Status in this PR              | FRs           |
| --- | ------------------------------- | ------------------------------ | ------------- |
| C1  | React 19 + MUI 9 upgrade        | satisfied (pre-existing)       | FR-1          |
| C2  | Add toolkit at pinned tarball   | satisfied                      | FR-2 to FR-10 |
| C3  | Replace CRM-local primitives    | partial: 1 seam; rest deferred | FR-11, FR-12  |
| C4  | Wire fonts                      | deferred with reason           | FR-13         |
| C5  | Keep a11y/security via adapters | satisfied by preservation      | FR-14         |

- **C3 deferral reason:** in v0.5.0 no primitive other than the breakpoints theme is a drop-in
  (research section 3.4), and adapters are ruled out by the product owner. ui-toolkit #185
  resolves some of the reasons, but only on the toolkit's unreleased `main`. C3 is therefore
  met partially: one seam now; `ui-typography` and `ui-container` (and `ui-footer`,
  `ui-button` and `ui-form` once their upstream typography and focus-outline changes also
  land) in the deferred Epic 5, blocked on a toolkit release above 0.5.0; every other
  primitive stays CRM-local with its reason (FR-12).
- **C4 deferral reason:** the toolkit TTF fonts total 1,348,788 B, which breaks the Lighthouse
  `totalSizeBytes` budget of 480,000 B, and they would need local serving under
  `font-src 'self'`.
- **C5 reading:** no primitive is replaced, so no CRM accessibility or security behaviour is
  dropped and no adapter is needed.

The issue body also carries five directives outside the checklist, labelled D1 to D5:

| ID  | Issue directive                             | Delivered as                  | FRs          |
| --- | ------------------------------------------- | ----------------------------- | ------------ |
| D1  | Report a peer mismatch, never force install | no mismatch exists            | FR-1         |
| D2  | Install from the GitHub release tarball     | v0.5.0 tarball, not v0.3.0    | FR-2, FR-15  |
| D3  | Jest mapper to `build/index.mjs` + ignore   | subpath mapper + ignore entry | FR-3, FR-15  |
| D4  | CRM takes `crmColorTheme`                   | deviated: stays CRM-local     | FR-12, FR-15 |
| D5  | Check the performance budget before fonts   | checked; fonts deferred       | FR-13        |

The issue's goal (consume toolkit primitives instead of CRM-local copies) is C3, and its prior
art pointer (website#458) is replaced by website#459 in FR-15.

> Assumption: the PR closes #250 as scoped by the product owner. The deferred parts of C3 and C4
> are listed in `docs/ui-toolkit.md` and can be reopened as new issues by the maintainer; the
> #185 part of C3 is already planned as the blocked Epic 5.

## 5. User Journeys

### J1: Contributor installs and verifies (happy path)

A contributor checks out the branch and runs `make start`, then `make install`, then
`make lint`. `make install` runs `bun install --frozen-lockfile` in the dev container, which
refreshes the `node_modules` named volume: Docker seeds that volume from the image only when it
is empty, so an existing volume keeps its old tree until then. The frozen install fetches the
pinned tarball, `lint-ui-toolkit` confirms 331 of 331 digests, and the unit suites resolve the
breakpoints seam through the Jest mapper. Nothing else in their workflow changes. Reveals
FR-2, FR-3, FR-7, FR-11.

### J2: Contributor with a stale dev container (edge case)

After a host-side `bun add`, or on a worktree whose volume predates the pin, the dev
container's `node_modules` volume still holds the old tree. `make lint` fails in
`lint-ui-toolkit` with "not installed or wrong version". The failure message and the docs tell
them to run `make install`; the gate then passes. The gate never passes on a stale tree.
Reveals FR-8, FR-16.

### J3: Maintainer bumps the toolkit

The maintainer follows the one binding recipe in architecture section 17.1, with no variant:
`docker compose exec -T dev bun add "<new release URL>"` (which rewrites `package.json` and both
`bun.lock` lines and installs the new tree), then an edit of the `TOOLKIT_URL` literal in the
lockfile gate, then `make update-ui-toolkit`, then `make lint-lockfile lint-ui-toolkit`. For any
release after v0.5.0 the refresher refuses to write unless the release's published `.sha256`
asset exists and agrees. The version-equality test fails until all five machine-read pin
statements agree. Reveals FR-9, FR-10, FR-16.

### J4: Reviewer audits the supply-chain change

A human or AI reviewer (CodeRabbit, cubic) asks about CWE-494 and the allowlist widenings.
ADR-016 answers: installed artifacts are verified offline against a committed manifest; install
itself is not integrity-checked; the lockfile exception is one exact URL; the license widening
is one SPDX id for a first-party CC0 package. Reveals FR-4, FR-5, FR-6, NFR-11 to NFR-13.

### J5: Tampered or drifted install (failure path)

A re-uploaded release asset, a hand-edited file under `build/`, or an extra injected file
changes the installed tree. `lint-ui-toolkit` fails closed in `static testing` and names the
failing class. Reveals FR-8.

### J6: End user

A CRM user loads `/sign-in`, `/sign-up`, `/` and the 404 page. Layout, focus order and
announcements are identical, because the only consumed value is deep-equal to the one it
replaces. Reveals FR-11, NFR-9, NFR-10.

## 6. Domain Requirements (software supply chain)

- **Provenance:** the lockfile pins a URL but not bytes, so the repository must carry its own
  offline digest record (FR-7, FR-8).
- **Licensing:** the SPA ships dependency code to browsers, so the toolkit license must pass
  semantic SPDX evaluation (FR-5). The vendored `swiper@14.0.6` (MIT) is recorded in ADR-016.
- **Scanner visibility:** Trivy and the SBOM cannot key a URL-versioned package, and the
  vendored `swiper` is invisible to them. This is recorded, not fixed (NFR-15).
- **Egress:** installs now need `github.com` and `objects.githubusercontent.com`. No egress
  allowlist exists today; the need is recorded in ADR-016.

## 7. Innovation Analysis

Not applicable. This is an installation of an existing first-party package; the novelty is
limited to the identity bar and the offline digest gate, both ported from website PR #459.

## 8. Project-Type Requirements (React SPA consuming an ESM-only package)

- **Module format:** the toolkit exports only an `import` condition. Rspack and `tsc`
  (`moduleResolution: bundler`) resolve it natively; CommonJS-mode Jest needs a mapper.
- **Import surface:** only named exports from `@vilnacrm/ui-toolkit/<subpath>` are sanctioned.
  The root barrel costs 346,575 B raw and pulls about 60 chunks including `swiper`; `styles.css`
  carries the fonts; the subpath `default` exports are the website themes.
- **Code splitting:** the adopted seam is reached only from route and footer chunks, never from
  the initial entrypoint (research section 2.3).
- **Browser support:** toolkit output is already esbuild-lowered; SWC down-levels it against
  the Baseline 2023 query during the production build.

> Assumption: SWC down-levelling of toolkit ESM is harmless and is confirmed by the CI production
> build, not by a local build.

## 9. Functional Requirements

Each FR states a capability, its acceptance criteria and its verification method. "Verify"
names the `make` target and the CI check that proves it. A CI check is written as
`<workflow name> / <job name>`, exactly as GitHub reports the check run (re-verified against
`.github/workflows/*.yml` on 2026-09-29).

### 9.1 Dependency Installation

#### FR-1: Peer stack satisfied without an upgrade (C1)

A contributor can install the toolkit on the CRM stack as it stands: every toolkit peer range is
already satisfied, and no framework upgrade is part of this change.

- **Status:** C1 satisfied, pre-existing.
- **Acceptance:**
  - Installed versions satisfy all nine required peers: `react` and `react-dom` ^19 (19.2.8),
    `@mui/material` and `@mui/system` ^9 (9.4.0), `@emotion/react` and `@emotion/styled` ^11,
    `react-hook-form` ^7, `i18next` `>=23 <27` (26.4.2), `react-i18next` `>=14 <18` (17.0.15).
  - No peer-dependency version changes in `package.json`.
  - ADR-016 states that the issue's "blocked" premise is stale.
- **Verify:** `make start`, then `make install` (frozen install into the dev container's
  `node_modules` volume); review of the `package.json` diff; `static testing / static`.

#### FR-2: Toolkit resolves from one pinned release tarball (C2)

A contributor can build and type-check code that imports `@vilnacrm/ui-toolkit` v0.5.0,
resolved from a single pinned GitHub release tarball.

- **Acceptance:**
  - `package.json` `dependencies` holds exactly the URL
    `.../ui-toolkit/releases/download/v0.5.0/vilnacrm-ui-toolkit-0.5.0.tgz`, spelled in full
    in research section 2.2 and already at `package.json:14`; both `bun.lock` occurrences
    (`:18`, `:1476`) name the same URL.
  - The toolkit is absent from `trustedDependencies`, so no lifecycle script runs.
  - `make lint-tsc` reports 0 diagnostics with the seam importing the toolkit.
  - The production build (Rspack) succeeds with the seam importing the toolkit.
- **Verify:** `make lint-tsc` in `static testing / static`; the production build in
  `bundle size / measure and gate` and `e2e testing / test`.

#### FR-3: Jest resolves named toolkit subpaths (C2)

A contributor can load a named toolkit subpath export in the unit, integration and mutation
Jest runs.

- **Acceptance:**
  - Only `jest.config.ts` changes: one `moduleNameMapper` entry matching
    `^@vilnacrm/ui-toolkit/([a-z-]+)$` to the subpath's `build/<subpath>.mjs`, placed before the
    `^@/(.*)$` entry, and one `transformIgnorePatterns` allowlist entry for the package.
  - The bare root and `styles.css` are not mapped. `customExportConditions` and
    `moduleFileExtensions` are unchanged. `jest.mutation.config.ts` is not edited (it spreads the
    base config).
  - `tests/unit/components/ui-breakpoints/breakpoints-theme.test.ts` passes against the
    toolkit-backed seam.
  - The wiring survives the next release: a `moduleNameMapper` match applies before package
    `exports` resolution and names the same file the `default` condition added by ui-toolkit
    #185 names, so a pin bump needs no Jest edit. After that bump the mapper entry becomes
    removable; the `transformIgnorePatterns` entry and the `.mjs` transform stay required
    (architecture section 6.3). The removal is not part of this change.
- **Verify:** `make test-unit-client` (`unit testing / unit`), `make test-integration`
  (`integration testing / integration`), `mutation testing` shards.

### 9.2 Gate Compliance by Narrow Edits

#### FR-4: Lockfile gate accepts exactly the pinned URL (C2)

A contributor can pass `lint-lockfile` with the one pinned toolkit URL, while the gate still
rejects every other non-npm resolution.

- **Acceptance:**
  - The npm registry regex `^https://registry\.npmjs\.org(/|$)` is unchanged.
  - The exception is two exact, package-bound, fixed-string tokens for the v0.5.0 URL, not a
    regex: the workspace specifier and the head of the packages entry. Each is stripped only
    when a line starts with it (after leading blanks). The rest of that line still goes
    through the unchanged URL scan, and there is no host-wide `github.com` pattern
    (architecture AD-6).
  - `make lint-lockfile` exits 0 on the real `bun.lock`.
  - `tests/bats/lockfile_registries.bats` fails the gate on 6 of 6 must-fail fixtures:
    - the same URL under another package;
    - another repo's release asset;
    - a wrong tag or asset name;
    - the host `github.com.evil.example`;
    - a git-spec form;
    - a rogue URL appended after the sanctioned token on the same line.

    One must-pass fixture holds both sanctioned lines plus a registry entry.

  - `docs/adr/013-bun-package-manager.md` prose names the exception.
- **Verify:** `make lint-lockfile` in `static testing / static`; `make test-bats` in
  `bats testing / bats`.

#### FR-5: License gate accepts the toolkit's CC0-1.0 (C2)

A contributor can pass `lint-licenses` with the toolkit's `CC0-1.0` license, with no other
widening of the allowlist.

- **Acceptance:**
  - `ALLOWED_LICENSES` in the `Makefile` gains exactly one id, `CC0-1.0`; no other id changes.
  - `make lint-licenses` exits 0 on the production tree.
  - Every existing must-fail case in `tests/unit/scripts/check-licenses.test.ts` still fails
    (disallowed AND-compound, unknown license).
  - `CONTRIBUTING.md` holds no list of SPDX ids; it points to `ALLOWED_LICENSES` in the
    `Makefile`. It gains exactly one sentence beside that pointer naming `CC0-1.0` and its
    reason (first-party package; CRM itself is CC0-1.0). No list is added.
- **Verify:** `make lint-licenses` in `static testing / static`; `unit testing / unit`.

> Assumption: a `CC0-1.0` pass case in `check-licenses.test.ts` is declined, because that file's
> allowlist is its own fixture (architecture section 8); the real-tree run of `lint-licenses` is
> the binding proof.

#### FR-6: ADR drift gate satisfied by ADR-016 (C2)

A reviewer can read the architecture decision record that ships with the `dependencies`
change.

- **Acceptance:**
  - `docs/adr/016-<kebab-slug>.md` exists with the title `# ADR-016: ...`, a valid `Status`,
    `Deciders: [@kravalg](https://github.com/kravalg)`, a `Date`, and every section the
    template requires.
  - `docs/adr/README.md` carries its index row.
  - ADR-016 records: the stale "blocked" premise, v0.5.0 instead of v0.3.0, the identity bar,
    the single adopted seam, the colour-seam deferral with its reversal trigger, the two
    allowlist widenings, the precise provenance claim, the scanner blind spot, the egress need,
    and the deviations listed in FR-15.
  - `make lint-adr` exits 0, and the ADR drift gate passes without the `adr:not-required` label
    or a `[no-adr]` line.
- **Verify:** `make lint-docs` and the ADR-drift steps in `static testing / static`.

> Assumption: ADR-016 belongs to #250. No open PR adds a `docs/adr/016-*` file (re-verified
> 2026-09-29); the #114 spec that also names 016 is untracked and renumbers when it lands.

### 9.3 Provenance

#### FR-7: Offline verification of the installed toolkit (C2)

A maintainer or CI job can prove, without network access, that the installed toolkit matches a
committed sha256 manifest.

- **Acceptance:**
  - `config/ui-toolkit-checksums.json` holds `comment`, `algorithm: "sha256"`,
    `version: "0.5.0"`, `tarballUrl`, the release asset digest
    (`bb3d61a6...0c72`) as a documented field, `releaseChecksum: "absent"` (v0.5.0 publishes
    no `.sha256` asset), and `artifacts` as a **list** of `{ path, sha256 }` objects (not a
    path-keyed map).
  - `artifacts` holds exactly 331 entries: the 330 files under `build/` plus `package.json`;
    `LICENSE` and `README.md` are not hashed.
  - `make lint-ui-toolkit` runs the verifier in the dev container and exits 0 on the real tree
    with 331 of 331 matching, 0 mismatches and 0 extra files.
  - `lint-ui-toolkit` is a member of both `CI_LINT_TARGETS` and the `lint:` aggregate, in the
    same order.
- **Verify:** `make lint-ui-toolkit` via `make lint` in `static testing / static`.

> Assumption: the manifest is regenerated with `make update-ui-toolkit` rather than copied from
> `website`; the digests are identical either way, and regeneration is the stronger story.

#### FR-8: Verifier fails closed on every tamper or drift class (C2)

A maintainer can rely on the verifier to reject each way the installed tree can diverge from
the manifest.

- **Acceptance:** one must-fail unit case per class, each ending with a non-zero exit code and
  a message naming the class (7 of 7):
  1. wrong algorithm, empty manifest, or a `releaseChecksum` that is not `"matched"` for a
     version outside the frozen `RELEASES_WITHOUT_CHECKSUM` list (exactly `0.5.0`);
  2. a non-release pin in `package.json`;
  3. version or `tarballUrl` drift between manifest and `package.json`;
  4. package not installed, or installed at another version, with the remedy `make install`
     in the message;
  5. a digest mismatch;
  6. a missing file;
  7. an extra file in the installed tree.
- **Acceptance (design constraints the tests rely on):** the verifier is a class with
  constructor-injected I/O whose `run()` returns an exit code. The thin CLI entry sets
  `process.exitCode` instead of calling `process.exit()`. The library files Jest loads use no
  `import.meta` and no top-level `await`, because Jest transforms `.mjs` to CommonJS
  (architecture AD-8).
- **Verify:** `tests/unit/scripts/` verifier test in `unit testing / unit`.

#### FR-9: Manifest regeneration for a version bump (C2)

A maintainer can regenerate the manifest for a new pinned version with one make target.

- **Acceptance:**
  - `make update-ui-toolkit` fetches the pinned release asset, records its sha256, fetches the
    release's published `<asset>.sha256` (added to every release after v0.5.0 by ui-toolkit
    #185), and rewrites `artifacts` from the installed tree.
  - It refuses to write, exits non-zero and leaves the committed manifest byte-identical in 4
    refusal classes, each with must-fail unit cases and an injected fetch; no unit test
    touches the network:
    - `[pin]`: the `package.json` spec is not a release-tarball URL;
    - `[install]`: the installed version differs from the version in the pinned URL;
    - `[download]`: the tarball or `.sha256` request is rejected or answers a non-2xx status
      other than a `.sha256` 404;
    - `[checksum]`: the `.sha256` body is malformed, names another asset or carries another
      digest, or the `.sha256` answers 404 for a version outside `RELEASES_WITHOUT_CHECKSUM`.
  - Two pass cases with an injected fetch and a fixture tree prove the rewritten manifest is
    list-shaped and sorted by `path`: one where the `.sha256` answers 404 for `0.5.0` and the
    manifest records `releaseChecksum: "absent"`, one for a later version whose `.sha256`
    agrees and the manifest records `"matched"`. So the gate works for v0.5.0 today, and the
    next release is a pin bump with the cross-check switched on by its data, not by an edit.
  - It is not a member of `make lint` or `CI_LINT_TARGETS` (it needs network access), and the
    docs forbid running it to clear a red `lint-ui-toolkit`.
- **Verify:** `bats testing / bats` (make-target contract, FR-18); the unit cases above in
  `unit testing / unit`, inside the global 100% coverage (NFR-1).

> Assumption: the rewritten `artifacts` list is sorted by `path`, so a regeneration diff is
> stable and reviewable.
>
> Assumption: only `update-ui-toolkit` checks the release asset digest and its published
> `.sha256`; `lint-ui-toolkit` stays offline and hermetic, and enforces the recorded
> `releaseChecksum` rule from the committed manifest.

#### FR-10: One version string across the machine-read surfaces (C2)

A maintainer can rely on a test to stop the five machine-read statements of the toolkit
version from drifting apart.

- **Acceptance:**
  - A tooling test fails unless all five statements name the same version and URL (v0.5.0
    in this change):
    `package.json`, the `bun.lock` workspace line, the `bun.lock` packages entry, the manifest
    `version` / `tarballUrl`, and the lockfile-gate literal. Each `bun.lock` shape and the gate
    literal must occur exactly once (architecture AD-9). Every artifact counts these five
    statements the same way.
  - The test carries at least one must-fail case (a mismatched literal), and pins
    `RELEASES_WITHOUT_CHECKSUM` to exactly `['0.5.0']`. It hard-codes no pinned version, so a
    bump edits no test (architecture section 15.4).
  - The docs page and ADR-016 name v0.5.0 (review-checked).
- **Verify:** `unit testing / unit`; PR review.

### 9.4 Seam Consumption and Deferred Replacements

#### FR-11: Breakpoints seam backed by the toolkit's named CRM exports (C3, partial)

Every existing importer of `src/components/ui-breakpoints` can keep reading its theme and height
breakpoints, now supplied by the toolkit's named CRM exports with values identical to today's.

- **Acceptance:**
  - The seam imports `crmBreakpointsTheme` and `heightBreakpoints` by name from
    `@vilnacrm/ui-toolkit/ui-breakpoints`, re-exports the height map as an `export const`, and
    default-exports the theme. No subpath `default`, `Ui*` or `website*` import.
  - The seam's public API (default export, `heightBreakpoints`) is unchanged, so its 21
    lazily loaded `src` importers are not edited.
  - Every existing value assertion in `breakpoints-theme.test.ts` passes with 0 edits; one
    added assertion pins identity (`toBe`) against the named `crmBreakpointsTheme`.
  - The `src/` diff touches exactly this one file; 0 new directories under `src/components`,
    `src/modules` or `src/features`.
  - Coverage of the seam is 100/100/100/100, and it adds 0 scored Stryker mutants.
  - ADR-016 restates the deep-equality evidence (0 of 310 leaves differ;
    `up('md')` = `@media (min-width:768px)`, `down('md')` = `@media (max-width:767.95px)`).
- **Verify:** `unit testing / unit`; `mutation testing / merge and enforce gate`;
  `git diff --stat origin/main -- src` in the PR lists exactly 1 file.

> Assumption: a re-export (`export { x as default } from ...`) is forbidden for the seam, because
> it compiles to getters that measured 50% function coverage; the import-then-`export const`
> shape is mandated.

#### FR-12: Register of primitives that stay CRM-local (C3, partly deferred)

Contributors can find, for every CRM primitive or theme not swapped, the recorded reason, and
whether ui-toolkit #185 makes it adoptable after the next toolkit release.

- **Acceptance:** `docs/ui-toolkit.md` carries the one register of architecture section 12,
  row for row and with its reason codes R1 to R12 (register-local codes, not the brief's risk
  IDs); this list, that section and the docs page name the same rows (readiness F3). Each row
  is keep-local in this change:
  - `ui-button` (R1 extra `role="status"` node; R10 contained variant has no `:focus-visible`
    outline). After #185: R1 is opt-out through `loadingMode="native"`, R10 stays open.
  - `ui-typography` (R2 module-scope website-theme fallback). After #185: adoptable through
    `inheritTheme`.
  - `ui-link` (R2, R5 contracts CRM does not model). After #185: unchanged.
  - `ui-container` (R12 a prohibited `aria-label="container"` on a generic `div`; its styles
    and props already equal CRM's, since its only media rules read `md`, `lg` and `xl`).
    After #185: the `aria-label` is dropped, so it is adoptable.
  - `ui-back-to-main` (R3 website breakpoints at module scope, `sm` 480 becomes 640). After
    #185: unchanged.
  - `ui-form` (R2 its title and error banner use the kit typography; R3; R10 through its
    contained submit). After #185: R3 resolved at render time and the heading, loader and
    offline notice covered by opt-ins; R2 and R10 stay open.
  - `auth-skeleton`, `ui-skeleton-*` (R3; R11 CRM's skeleton is a named `section[aria-label]`
    the toolkit deliberately does not model). After #185: R3 resolved, `idPrefix` gives the
    bare ids; R11 stays.
  - `ui-footer` (R2, R3, R4 render-time bare `process.env` read). After #185: R4 resolved by
    `variant="crm"`, and its `md`, `lg` and `xl` equal CRM's; R2 stays open, because the
    variant renders its link labels through `UiTypography` without `inheritTheme`.
  - `ui-form-input-field`, `ui-text-field-form` (R5 different API; would need an adapter).
    After #185: unchanged.
  - `ui-text-field`, `ui-input` (R6 no `src` importer). After #185: unchanged.
  - `error-boundary`, `ui-error-boundary` (R7 eager path; ADR-007 not modelled upstream).
    After #185: unchanged.
  - `ui-live-status`, `ui-offline-notice`, `ui-async-section`, `route-fallback`, layouts,
    not-found, `render-with-theme`, `src/styles/theme.ts` (R8 no toolkit counterpart). After
    #185: unchanged; the #185 offline notice is internal to `UiForm`.
  - `ui-color-theme` (R9: 10 palette keys differ, `success` changes and 9 keys are added; no
    production consumer), with the reversal trigger "a CRM consumer reads a toolkit-only palette
    key, or upstream ships a CRM-distinct palette". After #185: unchanged.
- **Acceptance (deferred adoption):** every row marked adoptable is a swap behind the existing
  CRM seam and props in the deferred Epic 5, blocked on a toolkit release above 0.5.0, and is
  not delivered by this PR.
- **Verify:** `make lint-docs` in `static testing / static`; PR review of the docs register
  against architecture section 12, row by row.

> Assumption: the issue's instruction to "take `crmColorTheme`" is superseded by the
> whole-object identity bar; the deviation is recorded in ADR-016 (FR-15).
>
> Assumption: each verdict is judged against v0.5.0, the installed release. A reason that #185
> resolves is recorded as "keep-local in this change; adoptable through the #185 opt-in after
> the next toolkit release", never as adopted, because no release carries #185 yet.

#### FR-13: Fonts deferred with the budget reason (C4)

A contributor can find why the toolkit fonts are not wired; CRM keeps serving its own fonts.

- **Acceptance:** no import of `@vilnacrm/ui-toolkit/styles.css` anywhere; `src/styles/fonts.css`
  and the served font files are unchanged; `docs/ui-toolkit.md` and ADR-016 record the
  1,348,788 B TTF total against the 480,000 B Lighthouse `totalSizeBytes` budget and the
  `font-src 'self'` constraint.
- **Verify:** `git grep -n 'ui-toolkit/styles.css' -- src .storybook` finds 0 matches;
  `make lint-security-headers` (no CSP change) in `static testing / static`;
  `performance testing / lighthouse desktop` and `performance testing / lighthouse mobile`.

#### FR-14: CRM accessibility and security behaviour preserved (C5)

An end user keeps every CRM accessibility and security behaviour, with no adapter introduced.

- **Acceptance:** no CRM primitive is replaced (FR-11 is a value-identical theme swap); 0 new
  files under `src/components`, `src/modules`, `src/features`; the `A11Y_EXCEPTIONS` list is
  unchanged; the axe and keyboard lanes pass (NFR-9).
- **Verify:** `accessibility testing / axe component gate` and
  `accessibility testing / axe route scans and keyboard contract`;
  `git diff --stat --diff-filter=A origin/main -- src` in the PR lists 0 files.

### 9.5 Documentation and Governance

#### FR-15: Deviations from the issue text are recorded

Readers of the issue can see where the delivered scope differs from its text, and why.

- **Acceptance:** ADR-016 and the PR description both list these 7 deviations: the stale
  "blocked" premise; v0.5.0 instead of v0.3.0; primitive replacement partly deferred (the swaps
  ui-toolkit #185 enables wait for the next toolkit release) and adapters ruled out; fonts
  deferred; a subpath Jest mapper instead of one pointed at `build/index.mjs`;
  `crmColorTheme` not adopted; website PR #459 used as prior art instead of #458.
- **Verify:** PR review counts 7 of 7 deviations in ADR-016 and 7 of 7 in the PR description.

#### FR-16: Contributor documentation for the toolkit

Contributors can learn how to consume, verify and bump the toolkit from one page.

- **Acceptance:** `docs/ui-toolkit.md` covers the pin, the digest gate and its precise claim
  (including the `.sha256` rule), the stale-container fix (J2, `make install`), the one binding
  bump recipe of architecture section 17.1 (J3), the import rule (named subpath exports only;
  never the root barrel, `styles.css` or a `default`), the FR-12 register, the deferred #185
  adoption, and the 11 upstream follow-ups with their statuses. It links no path under
  `node_modules/` or `specs/`, and every `make` target it names exists.
- **Verify:** `make lint-doc-references` and `make lint-doc-links` via `make lint-docs` in
  `static testing / static`.

#### FR-17: Doc-sync surfaces updated

A contributor reading any existing document that lists commands, licenses or gates sees the
change reflected there.

- **Acceptance:** each of these 7 surfaces is updated:
  1. the `CLAUDE.md` "Code Quality" command list names `make lint-ui-toolkit` and
     `make update-ui-toolkit`;
  2. the `AGENTS.md` "Code Quality" command block names both targets;
  3. `CONTRIBUTING.md` gains one sentence beside its `ALLOWED_LICENSES` pointer naming
     `CC0-1.0` and its reason (it has no SPDX list to extend);
  4. ADR-013 names the lockfile exception;
  5. the gate table in `.claude/skills/quality-standards/SKILL.md` names
     `make lint-ui-toolkit` next to `make lint-licenses`;
  6. the `SECURITY.md` "Lockfile provenance" entry, which today says every package resolves from
     the npm registry allowlist, names the one exact-URL exception and the `lint-ui-toolkit`
     digest gate;
  7. the `.github/copilot-instructions.md` "Quality gates" paragraph lists the toolkit digest
     gate beside the lockfile provenance gate.
- **Verify:** `make lint-docs` and `make lint-md` in `static testing / static`; PR review.

#### FR-18: New make targets meet the make-target contract

A maintainer can rely on the Bats make-target contract to cover both new targets.

- **Acceptance:**
  - `tests/bats/make-target-coverage.tsv` gains one row per target, each naming an evidence
    file that names the target as a whole token.
  - In `tests/bats/makefile_targets.bats`, the `ci-lint` and `ci` recipe mirrors (lines 37 and
    42 today) and the scaffold exclusion list (line 485 today, with its ordinal comment) name
    `lint-ui-toolkit`.
  - `CI_LINT_TARGETS` and `lint:` in the `Makefile` keep an identical order.
- **Verify:** `make test-bats` in `bats testing / bats`; `make verify-scaffold` in
  `scaffold testing / scaffold`.

## 10. Non-Functional Requirements

Every quality value below is a **raise-only floor or a zero ceiling**. The profile
`.claude/react-sdlc.yml` `quality.*` and the gate ratchet forbid lowering a floor or raising a
ceiling; a run that cannot meet one is fixed at the root cause.

### 10.1 Quality Floors (raise-only)

#### NFR-1: Test coverage

- **Criterion:** Jest global coverage stays 100% branches, functions, lines and statements
  (profile `coverage_*: 100`). The verifier script is covered through a `collectCoverageFrom`
  **inclusion**; no path-keyed `coverageThreshold` entry is added, and the exclusion list does
  not grow.
- **Verify:** `make test-unit-all` in `unit testing / unit`; `make test-integration` in
  `integration testing / integration`; `codecov / codecov`;
  `gate ratchet / no binding threshold weakened`.

#### NFR-2: Mutation score

- **Criterion:** `stryker.config.mjs` `thresholds` stay `{ high: 100, low: 100, break: 100 }`
  (profile `mutation_msi: 100`), with 0 survivors. The mutate scope in
  `scripts/ci/mutation-scope.mjs` is not narrowed, and no `Stryker disable` comment is added.
- **Verify:** `mutation testing / merge and enforce gate`.

#### NFR-3: Lint and type ceilings

- **Criterion:** 0 ESLint errors and 0 warnings, 0 `tsc` errors (profile `eslint_*: 0`,
  `tsc_errors: 0`); 0 new `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `!` or casts; the
  `tsconfig.json` strictness flag set is unchanged.
- **Verify:** `make lint-eslint`, `make lint-tsc` in `static testing / static`;
  `eslint-suppressions / eslint-suppressions`.

#### NFR-4: Duplication, metrics, architecture, formatting and Markdown ceilings

- **Criterion:** 0 jscpd clones, 0 rust-code-analysis hard failures, 0 dependency-cruiser
  violations, 0 markdownlint errors (profile `jscpd_clones`, `metrics_enforced`,
  `depcruise_violations`, `markdownlint_errors`). `.jscpd.json`,
  `config/metrics-policy.json` and `.dependency-cruiser.js` are unchanged.
- **Criterion (formatting and shell):** 0 Prettier `--check` findings over every new or edited
  file (manifest JSON, verifier `.mjs`, tests, Markdown), and 0 ShellCheck findings on the edited
  `scripts/ci/check-lockfile-registries.sh`.
- **Verify:** `make lint-dup`, `make lint-metrics`, `make lint-deps`, `make lint-md`,
  `make lint-prettier`, `make lint-shell` in `static testing / static`;
  `rust-code-analysis / rust-code-analysis`; `dependency cruiser / dependency-cruiser`.

#### NFR-5: No threshold relaxation

- **Criterion:** the gate ratchet reports 0 weakened values; no `gate-relaxation` label is
  applied; no entry leaves `config/gate-thresholds.manifest.json`.
- **Criterion (no suppression):** the diff adds 0 of each suppression artifact: `eslint-disable`,
  `@ts-ignore`, `@ts-expect-error`, `Stryker disable`, a depcruise ignore, a jscpd ignore, a
  `.trivyignore`, a gitleaks allowlist entry, an `A11Y_EXCEPTIONS` entry, a console-gate
  allowlist entry, `test.skip` / `it.skip` / `.fixme`, `adr:not-required` or `[no-adr]`. The only
  allowlist widenings are the one exact URL (FR-4) and the one SPDX id (FR-5).
- **Verify:** `gate ratchet / no binding threshold weakened`;
  `eslint-suppressions / eslint-suppressions`; PR diff review against the list above.

> Assumption: the lockfile and license allowlists sit outside the ratchet manifest, so their two
> narrow widenings are reviewed through CODEOWNERS and justified in ADR-016 rather than labelled.

### 10.2 Performance and Bundle Budgets

#### NFR-6: Eager entrypoint unchanged

- **Criterion:** `config/performance-budget.json` is not edited;
  `raw.maxInitialEntrypointBytes` stays 470,000 B and the Rspack raw hint passes. No module in
  the initial-entrypoint closure of `src/index.tsx` imports `@vilnacrm/ui-toolkit`. The eager
  gzip delta in the CI `bundle-size` comment is at most 64 B.
- **Verify:** `bundle size / measure and gate` (production build with Rspack `hints: 'error'`
  plus the gzip budget report) and `bundle size / PR report`; a dependency-cruiser reachability
  probe from `src/index.tsx` or a `bundle-stats.json` check, cited in the PR. `make perf-budget`
  is the local equivalent and is not run locally (no heavy local suites).

> Assumption: the 64 B allowance covers only the Rspack runtime's async chunk map; any eager
> import of the toolkit is a defect regardless of size.

#### NFR-7: Gzip and per-asset budgets

- **Criterion:** `gzip.maxInitialEntrypointBytes` 165,000 B, `gzip.maxAssetBytes` 130,000 B and
  `raw.maxAssetBytes` 400,000 B all hold. The summed gzip delta over all non-initial JS assets,
  new chunks included, is at most 256 B (esbuild estimate: +17 B).
- **Verify:** `bundle size / measure and gate` and `bundle size / PR report`.

> Assumption: the 256 B ceiling is a review threshold for this change only, not a budget entry.

#### NFR-8: Lighthouse floors

- **Criterion:** the assertions in `lighthouse/lighthouserc.*.js` hold, unedited. Re-read on
  2026-09-29, they are:
  - desktop (`numberOfRuns: 3`): performance, accessibility and best practices at least 0.95;
    SEO at least 0.90;
  - mobile (`numberOfRuns: 3`): performance at least **0.84**, asserted with
    `aggregationMethod: 'median-run'`; accessibility, best practices and SEO at least 0.90;
  - resource summary (both): script at most 265,000 B, total at most 480,000 B, script count
    warn 25.
- **Criterion (profile floor):** `.claude/react-sdlc.yml` sets `lighthouse_mobile: 85` and
  `lighthouse_desktop: 95`. Desktop agrees with the assertion. Mobile does not: the profile
  says 85 and the enforced assertion says 0.84, a pre-existing gap this change neither opened
  nor may close. This change raises and lowers neither value, and never edits either file.
- **Criterion (escalation route for runner noise):** the change adds no eager byte, so the
  mobile median is expected to match `main`. The review and QA stages read the CI median and
  act as follows:
  - median at least 0.85: pass, recorded in the PR.
  - median in `[0.84, 0.85)`: the CI check is green but under the profile floor. Compare with
    the latest green `performance testing / lighthouse mobile` run on `main`. If that run is
    also below 0.85, or this PR's eager gzip delta is 0 B and its median lies within the spread
    of `main`'s three runs, record the figure as the pre-existing profile gap and escalate to
    the maintainer ([@kravalg](https://github.com/kravalg)) in the PR instead of blocking. If
    `main` is at or above 0.85 and this PR is lower by more than that spread, treat it as a
    regression and fix it at its root cause.
  - median below 0.84: the CI check is red. Fix it at its root cause. If the bundle-size
    evidence shows no eager change and `main`'s latest run is in the same band, record the
    three per-URL runs, attach them to the PR, and escalate to the maintainer as runner noise.
    Any re-run is the maintainer's recorded decision, never a silent retry until green
    (NFR-20); the nightly flake audit remains the place that owns flakiness.
- **Verify:** `make lighthouse-desktop`, `make lighthouse-mobile` in
  `performance testing / lighthouse desktop` and `performance testing / lighthouse mobile`;
  the PR records the mobile median and, when the route above applies, the comparison run.

> Assumption: the binding CI floor is the asserted 0.84 median, restated from the file rather
> than replaced by the profile's 85 (readiness F7). The profile's 85 is reported beside it at
> review and QA. Raising the assertion to 0.85 is a separate strengthening the maintainer
> decides on (Q1); a value is never moved to make a run pass.

### 10.3 Accessibility

#### NFR-9: No accessibility regression

- **Criterion:** 0 new axe violations against `WCAG_AA_TAGS` in the component lane and on every
  route; `A11Y_EXCEPTIONS` unchanged (4 entries); the sign-in keyboard contract passes unchanged.
  This holds because the only consumed value is deep-equal to the one it replaces.
- **Verify:** `make test-a11y` in `accessibility testing / axe component gate` and
  `accessibility testing / axe route scans and keyboard contract`.

#### NFR-10: No visual or behavioural regression

- **Criterion:** 0 visual snapshot diffs across the desktop engines and the `mobile-chrome` and
  `mobile-safari` projects (profile `visual_diffs: 0`); 0 baselines re-recorded; the e2e suite
  passes unchanged.
- **Verify:** `make test-visual` in `visual tests / visual-test`; `make test-e2e` in
  `e2e testing / test`.

### 10.4 Supply Chain and Security

#### NFR-11: Precise provenance claim

- **Criterion:** ADR-016 and `docs/ui-toolkit.md` state that installed build artifacts are
  verifiable offline, and that `bun install --frozen-lockfile` itself fetches unverified bytes.
  No document claims install-time integrity. Where they cite the v0.5.0 build-provenance
  attestation, they say it proves a tag build of the tarball's digest, not the asset upload,
  the installed tree or the lockfile (architecture section 13 item 11).
- **Verify:** PR review finds the offline-verification sentence in both files, and a search of
  the diff for "integrity" finds no sentence that attributes install-time integrity to the
  lockfile or to `bun install`.

#### NFR-12: License policy

- **Criterion:** the toolkit passes semantic SPDX evaluation as `CC0-1.0`; `ALLOWED_LICENSES`
  grows by exactly that id; the vendored `swiper@14.0.6` (MIT) and the OFL fonts are recorded in
  ADR-016.
- **Verify:** `make lint-licenses` in `static testing / static`.

#### NFR-13: Lockfile policy

- **Criterion:** exactly one non-npm resolution is accepted, by two exact package-bound
  line-prefix tokens (FR-4), and any text after a token is still scanned; the
  toolkit is not in `trustedDependencies`; the lockfile resolves with `--frozen-lockfile` in
  every Docker image build; no Dockerfile, compose file or `scripts/docker/install-bun.sh` text
  changes, so the image-hardening and Dockerfile golden-text tests stay green unedited.
- **Verify:** `make lint-lockfile`; `bats testing / bats`; `unit testing / unit`; every workflow
  that runs `make start` or builds an image. `dockerfile performance` is path-filtered on the
  Dockerfiles and is expected not to run.

#### NFR-14: Secret scanning

- **Criterion:** gitleaks reports 0 findings over the full history including the manifest;
  `.gitleaks.toml` keeps exactly its two allowlist entries.
- **Verify:** `make scan-secrets` in `supply-chain security / secret scan`.

> Assumption: the list-shaped manifest avoids the known `generic-api-key` trigger. A hit is fixed
> by reshaping the manifest, never by widening the allowlist.

#### NFR-15: Dependency, image and SBOM scans stay green

- **Criterion:** `supply-chain security / dependency scan` and `image scan` pass with no
  `.trivyignore`, no lowered `TRIVY_SEVERITY` and no narrowed target; `sbom / generate`
  succeeds. The scanners' blind spot for a URL-versioned package and the vendored `swiper` is
  recorded in ADR-016.
- **Verify:** `supply-chain security / dependency scan`, `supply-chain security / image scan`;
  `sbom / generate`.

#### NFR-16: Security headers and CSP unchanged

- **Criterion:** `config/security-headers.json` and `serve.json` are not edited; no new
  external style or font origin is needed.
- **Verify:** `make lint-security-headers` in `static testing / static`;
  `security testing / security headers`.

### 10.5 Maintainability and Conventions

#### NFR-17: Code conventions

- **Criterion:** no new class, free function or type declaration in `src/**/*.ts`; no new
  code comment in code, scripts, tests or config, and exactly two existing comments amended so
  that they stay true, the lockfile-gate header and the Bats scaffold-exclusion comment
  (architecture section 16; rationale lives in ADR-016 and the docs); every new test follows
  test-liveness rules (no skipped, focused or assertion-free test, no conditional `expect`).
- **Verify:** `make lint-eslint` (class-only, type-file and test-liveness selectors) in
  `static testing / static`; `git diff origin/main -- src` shows 0 added comment lines.

#### NFR-18: Tooling cost

- **Criterion:** the added `index.d.mts` parse (151,265 B) does not push `static testing` or any
  mutation shard past its `timeout-minutes`.
- **Verify:** job durations on the PR, compared with the latest `main` run.

#### NFR-19: Manual bump safety

- **Criterion:** because Dependabot cannot bump a URL dependency, the bump recipe (J3) plus the
  FR-10 test are sufficient to keep the five machine-read version statements equal.
- **Criterion (Dependabot lane, readiness F8):** `.github/dependabot.yml` is not edited (its
  `bun` lane has no `ignore` or `allow` list). The risk that the `bun` updater fails the whole
  weekly job on the tarball-URL entry, instead of skipping it, is recorded in ADR-016 as a
  negative consequence (brief R14). Evidence so far: `website` merged the same shape (#459) at
  2026-09-28T23:34Z, and three `bun` Dependabot update jobs against its `main` succeeded at
  23:36Z; they were rebases of existing pull requests, not a weekly scan.
- **Verify:** FR-10 must-fail case in `unit testing / unit`. The PR records the `website`
  evidence and, if it has run, `website`'s first weekly `bun` scan (Monday 2026-10-05). After
  merge, the first CRM weekly `bun` "Dependabot Updates" run must succeed; a failure is
  escalated to the maintainer, and its remedy (for example an `ignore` entry for the package
  in the `bun` lane) is a reviewed follow-up, not part of this PR.

### 10.6 CI Evidence

#### NFR-20: Required CI evidence on the PR head

- **Criterion:** every check below is green on the final PR head, with no flake masked by a
  re-run:
  - `static testing / static` (includes `make lint`, ADR drift, docs gates);
  - `unit testing / unit`, `integration testing / integration`, `bats testing / bats`;
  - `mutation testing / shard N` (every shard) and `mutation testing / merge and enforce gate`;
  - `bundle size / measure and gate` and `bundle size / PR report`;
  - `performance testing / lighthouse desktop` and `performance testing / lighthouse mobile`;
  - `accessibility testing / axe component gate` and
    `accessibility testing / axe route scans and keyboard contract`;
  - `visual tests / visual-test` and `e2e testing / test`;
  - `gate ratchet / no binding threshold weakened`, `dependency cruiser / dependency-cruiser`,
    `eslint-suppressions / eslint-suppressions`, `rust-code-analysis / rust-code-analysis`,
    `scaffold testing / scaffold`;
  - `supply-chain security / secret scan`, `/ dependency scan`, `/ image scan`, and
    `sbom / generate`;
  - `security testing / Analyze`, `/ preloaded-auth seed gate`, `/ security headers`;
  - `storybook testing / storybook-build` (triggered by `package.json`, `bun.lock` and
    `src/components/**`) and `codecov / codecov`;
  - every other check that reports on the PR head: `memory leak testing`, `load testing`,
    `contract testing`, `commitlint`, `workflow security / zizmor` and
    `format yaml files / yamlfmt`.
- **Evidence record:** the PR description quotes the `bundle-size` eager and non-initial gzip
  deltas (NFR-6, NFR-7), the `lint-ui-toolkit` 331/331 line (FR-7), the mobile Lighthouse
  median with the NFR-8 route taken, and the Dependabot evidence of NFR-19.
- **Local execution:** `make install` first, then only focused Jest, ESLint, Prettier and
  `tsc` on changed files run by hand; Bats, image builds, Lighthouse, visual and Trivy run in
  CI only. The Husky pre-commit hook runs `make format`, `make lint` and `make test-unit-all`
  on every commit; the plan keeps that to four commits (architecture section 18) and never
  skips the hook.

## 11. Traceability

### Brief Goals to Requirements

- G-1 Install: FR-1, FR-2, FR-3.
- G-2 Gates green by narrow edits: FR-4, FR-5, FR-6, FR-18, NFR-5.
- G-3 Provenance: FR-7, FR-8, FR-9, NFR-11.
- G-4 One identical seam: FR-11, FR-14, NFR-6, NFR-9, NFR-10.
- G-5 Recorded decisions: FR-6, FR-12, FR-13, FR-15, FR-16, FR-17.
- G-6 Consistent version: FR-10, NFR-19.

### Brief Metrics to Requirements

- M-1: FR-4, FR-5, FR-7. M-2: FR-4. M-3: FR-8. M-4: FR-7.
- M-5: FR-6, FR-16, NFR-14, NFR-20.
- M-6: NFR-1. M-7: NFR-2, FR-11. M-8: NFR-5.
- M-9: NFR-6. M-10: NFR-7. M-11: NFR-8, NFR-9, NFR-10. M-12: FR-11.
- M-13: FR-11, FR-14. M-14: FR-10, FR-15.

### Brief Constraints to Requirements

- Product owner (no new modules, components, `UI*` primitives, adapters): FR-11, FR-14,
  NFR-17.
- Root cause, never suppression: NFR-3, NFR-5.
- Raise-only quality floors: NFR-1, NFR-2, NFR-4, NFR-5, NFR-8.
- Budgets (470,000 B eager raw, no eager toolkit import): NFR-6, NFR-7.
- Code conventions (classes only, type-only files, no new code comment, I/O-injected verifier):
  NFR-17, FR-8.
- Governance (ADR drift, make-target contract, docs gates): FR-6, FR-16, FR-17, FR-18.
- Imports (named subpath exports only): FR-11, FR-16.
- Process (no heavy local suites; CI evidence): NFR-20.
- Supply chain (brief section 2 problem impact and risks): NFR-12 to NFR-16, NFR-18.

### Issue #250 to Requirements

- Checklist C1 to C5 and directives D1 to D5: the two tables in section 4.

### Journeys to Requirements

- J1: FR-2, FR-3, FR-7, FR-11. J2: FR-8, FR-16. J3: FR-9, FR-10, FR-16.
- J4: FR-4, FR-5, FR-6, NFR-11 to NFR-13. J5: FR-8. J6: FR-11, NFR-9, NFR-10.

### Orphan Check

Every FR (FR-1 to FR-18) and every NFR (NFR-1 to NFR-20) appears in at least one list above,
and every brief goal, metric, constraint, risk and issue item maps to at least one requirement.

## 12. Risks and Upstream Follow-ups

The risk register is the brief's section 9 (R1 to R14; R14 was added in correction pass 1).
Each risk is covered here as follows:

- R1 post-install integrity only: NFR-11. R2 scanner blind spot: NFR-15.
- R3 root-barrel import: FR-16 import rule; lint gate deferred to Growth.
- R4 wrong `default` export: FR-11 identity assertion. R5 egress: ADR-016 (section 6).
- R6 stale container: J2, FR-8. R7 manual bumps: FR-10, NFR-19.
- R8 unratcheted allowlists: NFR-5 assumption, CODEOWNERS. R9 gitleaks: NFR-14.
- R10 eager headroom: NFR-6. R11 ADR number: FR-6. R12 issue text: FR-15.
- R13 type-parse cost: NFR-18. R14 Dependabot `bun` job on the URL entry: NFR-19.

The 11 upstream follow-ups in research section 11 are recorded in `docs/ui-toolkit.md` (FR-16)
and are not filed as issues or PRs. ui-toolkit #185 has merged items 5 and 8 and parts of 6, 9
and 11 on the toolkit's `main`; item 11's attestation half is already met for v0.5.0 by
ui-toolkit #178. Each item carries its status there.

## 13. Open Questions

- **Q1:** the profile floor `lighthouse_mobile: 85` and the enforced mobile performance
  assertion 0.84 disagree.

  > Assumption: the asserted 0.84 median binds CI, restated from `lighthouserc.mobile.js`,
  > and the profile's 85 is reported beside it; neither value is raised or lowered (NFR-8,
  > corrected in correction pass 1). A median in `[0.84, 0.85)` follows the NFR-8 escalation
  > route. Raising the assertion to 0.85 is a separate strengthening the maintainer decides
  > on; it is not part of the installation. The change adds nothing to the initial
  > entrypoint, so the mobile score is expected to match the latest `main` run.

- **Q2:** should the PR edit the issue #250 title and body?

  > Assumption: no GitHub edits in this run; the PR description states the corrected premise
  > and the installation-only scope (FR-15).

- **Q3:** what is the real Rspack byte delta?

  > Assumption: settled by the CI `bundle-size` comment on the PR (NFR-6, NFR-7); no local
  > production build.

- **Q4:** should the dead `src/components/ui-typography/theme.ts` be deleted?

  > Assumption: no. It is cleanup, not installation, and it would move the `src/` diff past
  > FR-11's one-file limit. It is recorded as a follow-up in `docs/ui-toolkit.md`.

- **Q5:** should this PR wait for the release that carries ui-toolkit #185, or pin the
  toolkit's `main`, so that more primitives can be swapped now?

  > Assumption: neither. v0.5.0 is installed now (architecture AD-14), the design makes the next
  > release a pin bump, and the #185 swaps are the deferred Epic 5, blocked on a toolkit release
  > above 0.5.0 and outside this PR's dispatch set.

## 14. Next Step

Hand this PRD to the architect for `create-architecture`, then to the PM for
`create-epics-stories`. The FR list is the capability contract: no downstream artifact adds a
component, module, adapter or seam beyond FR-11.

## 15. Validation Record

`validate-prd` checked this PRD on 2026-09-29 against the
[brief](./brief-250-ui-toolkit-2026-09-29.md), the
[research](./research-250-ui-toolkit-2026-09-29.md), issue #250 and the live worktree. Result:
**pass after 16 fixes applied in place.**

### Checks that passed unchanged

- **No lowered threshold:** coverage 100, Stryker `{ 100, 100, 100 }`, the 470,000 B, 400,000
  B, 165,000 B and 130,000 B budgets, the Lighthouse assertions (desktop 0.95 / 0.95 / 0.95 /
  0.90, mobile 0.84 / 0.90 / 0.90 / 0.90) and the zero ceilings all match the files re-read on
  2026-09-29, and no requirement edits one of them.
- **No new component:** the `src/` diff is one existing file (FR-11); the verifier lives in
  `scripts/ci/`, which is tooling, not a module or component.
- **Figures:** 21 seam importers, 9 peers, 4 `A11Y_EXCEPTIONS` entries, 2 gitleaks allowlists,
  every named `make` target present in the `Makefile`, `docs/adr` ending at 015, and the
  `CI_LINT_TARGETS` / `lint:` lines at `Makefile:252` / `:706` all re-verified.
- **Implementation detail:** file paths, regexes and the seam shape are named on purpose. For a
  build-governance change they are the capability contract, and each is backed by a
  measurement in the research artifact.

### Findings fixed

1. 13 FR statements described system state instead of an actor capability; FR-1 to FR-6, FR-8,
   FR-10, FR-11, FR-13, FR-14, FR-17 and FR-18 now use the "[actor] can" form.
2. CI checks were named by job id (`bundle size / build`, `gate ratchet / ratchet`,
   `performance testing / performance`, the two a11y jobs) or by bare workflow name; all now use
   the check-run names in `.github/workflows/*.yml`.
3. NFR-6 and NFR-7 cited `make perf-budget` as CI evidence, but no workflow runs it; they now
   cite `bundle size / measure and gate` and mark `make perf-budget` as local-only.
4. NFR-20 omitted six checks that report on every PR (memory leak, load, contract, commitlint,
   zizmor, yamlfmt) and did not say why `storybook testing` triggers; both added.
5. NFR-8 took the weaker enforced 0.84 as the mobile floor, although the raise-only profile
   floor is 85; the stricter value now binds, and Q1 is updated. (Superseded by correction
   pass 1, item 8: NFR-8 restates the asserted 0.84 and routes the gap to escalation.)
6. FR-17 missed two stale surfaces: `SECURITY.md` (says every package resolves from the npm
   registry allowlist) and the `.github/copilot-instructions.md` quality-gate paragraph; the
   list is now 7 numbered surfaces.
7. NFR-4 missed `make lint-prettier` and `make lint-shell`, which the new JSON, `.mjs` and
   Markdown files and the edited `check-lockfile-registries.sh` trip; added.
8. "No suppressions" was spread over several NFRs with gaps (depcruise, jscpd, console-gate,
   skip, ADR escape hatches); NFR-5 now lists every suppression artifact at 0.
9. FR-9 had no measurable failure behaviour; it now needs 2 must-fail refusals and 1 pass case,
   all with an injected fetch, and stays out of `CI_LINT_TARGETS`. (Correction pass 1 raised
   this to 4 refusal classes and 2 pass cases.)
10. The issue trace covered only checkboxes C1 to C5; the five body directives D1 to D5 (peer
    mismatch, tarball, Jest mapper, `crmColorTheme`, font budget) are now traced.
11. Out of Scope omitted five brief non-goals (Storybook and test themes, palette augmentation,
    the import-restriction gate, the dead `theme.ts`, issue edits); added.
12. Traceability left FR-14 out of the goal map and had no constraint map or orphan check; all
    three added.
13. NFR-13 did not require the Dockerfiles, compose files and `install-bun.sh` to stay
    unchanged, which the image-hardening and golden-text tests depend on; added.
14. FR-18 did not locate the scaffold exclusion list; it now names
    `tests/bats/makefile_targets.bats` lines 37, 42 and 485.
15. Six "PR review" verifications were not countable; FR-11, FR-13, FR-14, FR-15, NFR-11 and
    NFR-17 now name a count, a diff command or a search.
16. Vague or partial wording: "about nine gates" is now G1 to G9, and FR-2 names both
    `bun.lock` occurrences of the URL.

> Assumption: the validation report lives in this section and in the run summary rather than
> in a separate report file, matching the brief's validation record.

### Correction pass 1 (2026-09-29)

Applied after `implementation-readiness` iteration 1 and after ui-toolkit PR #185 merged to the
toolkit's `main`:

1. **#185:** the executive summary records the merge and the decision to install v0.5.0 now;
   section 4 adds the deferred, blocked Epic 5 and marks C3 as partly met with the reason; FR-3
   states how the Jest wiring behaves when the `default` condition arrives; FR-12 carries the
   "After #185" outlook per row; FR-15 words the deviation as "partly deferred"; Q5 is new.
2. **Checksum gate:** FR-7 adds `releaseChecksum`, FR-8 folds its rule into the `manifest`
   class, and FR-9 now has 4 refusal classes (`[pin]`, `[install]`, `[download]`,
   `[checksum]`) and 2 pass cases, so it works for v0.5.0 and cross-checks later releases.
3. **F1:** J1 and FR-1 run `make install` after `make start`; J2 and FR-8 name `make install`
   as the remedy.
4. **F2:** J3 defers to the one binding recipe of architecture section 17.1.
5. **F3:** FR-12 is the union register of architecture section 12, with R10 and R11.
6. **F4:** FR-5 and FR-17 ask for one `CONTRIBUTING.md` sentence, not a list entry.
7. **F5:** FR-10 states that every artifact counts the five pin statements the same way.
8. **F7:** NFR-8 restates the asserted mobile floor (0.84, median of 3 runs) instead of
   binding the profile's 85, and adds the escalation route for runner noise.
9. **F8:** NFR-19 records the Dependabot `bun` risk, the `website` evidence and a post-merge
   check; section 12 maps R14.
10. **F9:** NFR-20 states the Husky hook load and the four commit points.

### Adversarial validation 2 (2026-09-29)

`validate-architecture` and `validate-epics-stories` re-ran adversarially after correction
pass 1, against ui-toolkit #185's merged source and the installed v0.5.0 build:

1. **FR-12, `ui-container`:** its R3 reason was false (its media rules read only `md`, `lg`
   and `xl`, equal to CRM's); the real v0.5.0 difference is the prohibited `aria-label`
   (R12), which #185 drops, so the row is adoptable after the next release.
2. **FR-12, `ui-footer` and `ui-form`:** #185 does not make the footer adoptable: its `crm`
   variant renders link labels through `UiTypography` without `inheritTheme` (R2). `UiForm`'s
   title and error banner do the same, so the form lists R2 beside R10.
3. **Section 4:** the deferred list and the C3 reason follow the corrected register, and
   the import-rule amendment each swap needs is stated.
4. **FR-10:** the pin test hard-codes no version, so the next release stays a pin bump.

### Correction pass 3 (readiness iteration 3)

1. **R3-1:** section 12 and NFR-11 now reflect the existing v0.5.0 build-provenance
   attestation and bound what the docs may claim for it (architecture section 13 item 11).
2. **R3-2:** NFR-17 states the one comment rule of architecture section 16: no new code
   comment, and two existing comments amended to stay true.
