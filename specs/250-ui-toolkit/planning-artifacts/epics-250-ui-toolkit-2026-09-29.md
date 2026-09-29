---
status: 'complete'
workflowType: 'epics'
stepsCompleted:
  - 'step-01-validate-prerequisites'
  - 'step-02-design-epics'
  - 'step-03-create-stories'
  - 'step-04-final-validation'
validation: 'validate-epics-stories rounds 1 and 2, 2026-09-29 (see Final Validation)'
corrected: '2026-09-29 (pass 1: #185, readiness F1 to F9; pass 2: N1 to N4; pass 3: R3-1, R3-2)'
project_name: 'crm'
date: '2026-09-29'
issue: 250
author: 'pm (John), autonomous run'
inputDocuments:
  - 'specs/250-ui-toolkit/planning-artifacts/prd-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/architecture-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/research-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/brief-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/run-summary-250-ui-toolkit-2026-09-29.md'
  - 'https://github.com/VilnaCRM-Org/crm/issues/250'
  - 'https://github.com/VilnaCRM-Org/website/pull/459'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/pull/185'
  - 'CLAUDE.md'
  - '.claude/react-sdlc.yml'
  - '.husky/pre-commit'
  - 'package.json'
  - 'Makefile'
  - 'tests/bats/make-target-coverage.tsv'
  - 'tests/bats/makefile_targets.bats'
  - '.markdownlint.yaml'
  - '.github/dependabot.yml'
  - 'docker-compose.yml'
  - 'lighthouse/lighthouserc.mobile.js'
---

# Epics and Stories: installing `@vilnacrm/ui-toolkit` into CRM (#250)

**Author:** pm (John), autonomous BMAD run. **Date:** 2026-09-29.

Predecessors: [technical research](./research-250-ui-toolkit-2026-09-29.md),
[product brief](./brief-250-ui-toolkit-2026-09-29.md), [PRD](./prd-250-ui-toolkit-2026-09-29.md)
and [architecture](./architecture-250-ui-toolkit-2026-09-29.md). Run log:
[run summary](./run-summary-250-ui-toolkit-2026-09-29.md).

## Overview

This document breaks the PRD's 18 FRs and 20 NFRs, and the architecture's decisions AD-1 to
AD-14, into 4 epics and 7 stories, plus one pull-request stage that is not a Ralph story. Each
story is sized for one implementing agent, depends only on earlier stories, and leaves
`make lint` and the unit suite green at its commit point (Story Conventions).

**Dispatch set of this pull request:** Stories 1.1, 2.1, 2.2, 3.1, 4.1, 4.2 and 4.3, then the
pull-request stage. Nothing else is dispatched. A fifth epic, "Epic 5 (deferred, blocked)",
records the adoption of the CRM opt-ins that ui-toolkit PR #185 merged to the toolkit's `main`
after v0.5.0. Every story in it is marked `Dependency: blocked on ui-toolkit release > 0.5.0`,
and none of it is part of this pull request. Its headings deliberately do not use the bmalph
`## Epic N:` and `### Story N.M:` forms, so the implement stage cannot pick them up.

The scope is the product owner's: _"we do not want to create new modules/components for now, we
can do the ui-kit installation"_. No story adds a component, module, `UI*` primitive, adapter or
`src/` directory. The only `src/` file that changes is `src/components/ui-breakpoints/index.ts`
(Story 3.1).

> Assumption: the architecture's commit group 1 (gates plus the dependency lines) stays one
> story, because the working tree already holds the toolkit in `package.json` and `bun.lock`, so
> neither gate edit alone turns `make lint` green. Groups 2 to 4 are split into 6 smaller
> stories, each green on its own. The order of the groups is kept.
>
> Assumption: this is a brownfield change with no starter template, so Epic 1 Story 1 is the
> dependency commit, not a project setup (step 4 starter-template check: not applicable).

## Requirements Inventory

### Functional Requirements

- FR-1: A contributor can install the toolkit on the current stack; all nine peers are already
  satisfied and no peer version changes.
- FR-2: The toolkit resolves from one pinned v0.5.0 GitHub release tarball URL, named the same
  way in `package.json` and both `bun.lock` lines, and is not in `trustedDependencies`;
  `lint-tsc` and the production build pass with the seam importing it.
- FR-3: Jest (unit, integration, mutation) resolves named toolkit subpaths through one
  `moduleNameMapper` entry and one `transformIgnorePatterns` entry in `jest.config.ts` only.
- FR-4: `lint-lockfile` accepts exactly the pinned URL through two package-bound line-prefix
  tokens, with 6 must-fail fixtures and 1 must-pass fixture; ADR-013 names the exception.
- FR-5: `lint-licenses` accepts `CC0-1.0` as the one new SPDX id; `CONTRIBUTING.md` gains one
  sentence naming it beside its `ALLOWED_LICENSES` pointer (no list is added).
- FR-6: ADR-016 ships with the `dependencies` change and passes `lint-adr` and the ADR drift gate
  without an escape hatch.
- FR-7: `config/ui-toolkit-checksums.json` (331 artifacts) and `make lint-ui-toolkit` verify the
  installed toolkit offline, inside `make lint` and `CI_LINT_TARGETS`.
- FR-8: The verifier fails closed on 7 of 7 tamper or drift classes, as an injected class whose
  `run()` returns an exit code; the `manifest` class also enforces the `releaseChecksum` rule.
- FR-9: `make update-ui-toolkit` regenerates the manifest, cross-checks the release's published
  `.sha256` when it has one (v0.5.0 has none), refuses in 4 classes (`[pin]`, `[install]`,
  `[download]`, `[checksum]`), and stays out of `make lint`.
- FR-10: A tooling test keeps the five machine-read version statements equal, with a must-fail
  case.
- FR-11: `src/components/ui-breakpoints` is backed by the named `crmBreakpointsTheme` and
  `heightBreakpoints`, with an identical public API and a one-file `src/` diff.
- FR-12: `docs/ui-toolkit.md` carries the one keep-local register of architecture section 12
  (the union list, reasons R1 to R12, and the "After #185" outlook per row).
- FR-13: Toolkit fonts and `styles.css` are not wired; the budget reason is recorded.
- FR-14: No CRM primitive is replaced, so every accessibility and security behaviour is kept.
- FR-15: ADR-016 and the PR description each list the 7 deviations from the issue text.
- FR-16: `docs/ui-toolkit.md` covers the pin, the digest gate, the stale-container fix
  (`make install`), the one binding bump recipe, the import rule, the keep-local register, the
  deferred #185 adoption and the 11 upstream follow-ups with their statuses.
- FR-17: Seven doc-sync surfaces reflect the new targets, the license and the lockfile exception.
- FR-18: Both new make targets meet the Bats make-target contract, and `CI_LINT_TARGETS` and
  `lint:` keep an identical order.

### NonFunctional Requirements

- NFR-1: Jest global coverage stays 100/100/100/100; the verifier enters through a
  `collectCoverageFrom` inclusion, never a path-keyed threshold or a new exclusion.
- NFR-2: Stryker thresholds stay `{ 100, 100, 100 }` with 0 survivors; no scope narrowing and no
  `Stryker disable`.
- NFR-3: 0 ESLint errors and warnings, 0 `tsc` errors, no suppression, no strictness change.
- NFR-4: 0 jscpd clones, 0 metrics hard failures, 0 depcruise violations, 0 markdownlint errors,
  0 Prettier findings, 0 ShellCheck findings; their configs are unchanged.
- NFR-5: 0 weakened ratchet values and 0 suppression artifacts; the only widenings are one exact
  URL and one SPDX id.
- NFR-6: The eager entrypoint is unchanged: 470,000 B raw budget untouched, no eager toolkit
  import, eager gzip delta at most 64 B.
- NFR-7: Gzip and per-asset budgets hold; summed non-initial gzip delta at most 256 B.
- NFR-8: Lighthouse assertions hold unedited, as asserted: mobile performance at least 0.84
  (median of 3 runs), desktop performance at least 0.95; the profile's mobile 85 is reported
  beside the median, and a median in `[0.84, 0.85)` follows the PRD's escalation route.
- NFR-9: 0 new axe violations; `A11Y_EXCEPTIONS` unchanged; keyboard contract passes.
- NFR-10: 0 visual diffs and 0 re-recorded baselines on every project; e2e passes unchanged.
- NFR-11: Docs claim only offline verification of installed artifacts, never install-time
  integrity.
- NFR-12: The toolkit passes as `CC0-1.0`; vendored `swiper@14.0.6` (MIT) and the OFL fonts are
  recorded in ADR-016.
- NFR-13: Exactly one non-npm resolution is accepted; no Dockerfile, compose file or
  `install-bun.sh` change.
- NFR-14: gitleaks finds 0 leaks; `.gitleaks.toml` keeps its two allowlist entries.
- NFR-15: Dependency, image and SBOM scans pass unsuppressed; the scanner blind spot is recorded.
- NFR-16: `config/security-headers.json` and `serve.json` are unchanged.
- NFR-17: No new class, free function or type in `src/**/*.ts`; no new code comment (two
  existing comments are amended to stay true, architecture section 16); tests follow the
  liveness rules.
- NFR-18: The `index.d.mts` parse does not push `static testing` or a mutation shard past its
  timeout.
- NFR-19: The bump recipe plus the FR-10 test keep the five version statements equal; the
  Dependabot `bun` job risk is recorded and checked after merge.
- NFR-20: Every listed CI check is green on the final PR head, with no re-run masking a flake;
  the Husky hook runs at four commit points only.

### Additional Requirements

From the architecture (each AD is binding on the stories that name it):

- AR-1 (AD-1): keep the tarball URL pin; verify installed bytes offline against a committed
  manifest.
- AR-2 (AD-2): adopt one seam, `ui-breakpoints`, through named exports in the import-then-
  `export const` shape of architecture section 5.1.
- AR-3 (AD-3): `ui-color-theme` stays CRM-local, with its reversal trigger.
- AR-4 (AD-4): no toolkit stylesheet and no toolkit fonts.
- AR-5 (AD-5): edit only `jest.config.ts`; `jest.mutation.config.ts` inherits.
- AR-6 (AD-6): the lockfile exception is two fixed-string, package-bound tokens stripped by one
  POSIX `awk` pass; the URL regex is unchanged.
- AR-7 (AD-7): `CC0-1.0` joins `ALLOWED_LICENSES`.
- AR-8 (AD-8): verifier and refresher are small injected classes under `scripts/ci/ui-toolkit/`;
  library files use no `import.meta`, no top-level `await`, no `process.exit()`.
- AR-9 (AD-9): one pin, stated five ways, read through two explicit `UiToolkitPinSource`
  methods: `readPackagePin()` (statement 1 only, for the refresher) and `compareStatements()`
  (all five, for the verifier and the tooling test).
- AR-10 (AD-10): coverage through a `collectCoverageFrom` inclusion.
- AR-11 (AD-11): no new ESLint import-restriction rule; the import rule is documented.
- AR-12 (AD-12): ADR number 016 belongs to #250.
- AR-13 (AD-13): no Dockerfile, compose, workflow or budget file changes.
- AR-14 (section 18): one pull request; stories land in the order below.
- AR-15 (section 19): a Trivy or SBOM error on the tarball-URL entry is a stop-and-escalate
  blocker, never suppressed.
- AR-16 (section 15.7): `make install` first, then only focused Jest, ESLint, Prettier, `tsc`,
  the lockfile script and `make lint-ui-toolkit` run by hand; Bats, image builds, Lighthouse,
  visual, e2e, Stryker and Trivy run in CI only. The Husky hook's run at each of the four
  commit points (section 18) is the only full-suite run made locally.
- AR-17 (AD-14): install v0.5.0, the latest release, now; never wait for or pin the toolkit's
  unreleased `main`; design the checksum gate, the Jest wiring and the register so the next
  release is a pin bump, and leave the #185 adoption to the deferred Epic 5.

### UX Design Requirements

None. No UX design document exists for #250, and the change must render nothing new: every
visual, accessibility and behavioural baseline stays identical (NFR-9, NFR-10).

> Assumption: the step-1 UX extraction is not applicable; the no-visible-change guarantees are
> carried as acceptance criteria of Story 3.1 instead.

### FR Coverage Map

- FR-1: Epic 1 - peer stack already satisfied, dependency committed.
- FR-2: Epic 1 - pinned URL committed; Epic 3 - `tsc` and build pass with the seam.
- FR-3: Epic 3 - Jest subpath mapper and transform entry.
- FR-4: Epic 1 - lockfile exception and its fixtures.
- FR-5: Epic 1 - `CC0-1.0` license id.
- FR-6: Epic 4 - ADR-016.
- FR-7: Epic 2 - manifest and offline gate.
- FR-8: Epic 2 - verifier failure classes.
- FR-9: Epic 2 - manifest refresher.
- FR-10: Epic 2 - version-equality test.
- FR-11: Epic 3 - breakpoints seam.
- FR-12: Epic 4 - keep-local register; the "adoptable after #185" rows are delivered later by
  the deferred Epic 5, which is not dispatched here.
- FR-13: Epic 3 - no fonts wired; Epic 4 - reason recorded.
- FR-14: Epic 3 - behaviour preserved.
- FR-15: Epic 4 - deviations in ADR-016 and the drafted PR description.
- FR-16: Epic 4 - contributor page.
- FR-17: Epic 1 - `CONTRIBUTING.md`, ADR-013; Epic 4 - the other five surfaces.
- FR-18: Epic 2 - make-target contract for both targets.

## Epic List

1. **Epic 1: Contributors install the pinned toolkit with every supply-chain gate still
   closed.** The dependency is committed and `make lint` passes, with one SPDX id and one exact
   URL as the only widenings. FRs: FR-1, FR-2, FR-4, FR-5, FR-17 (part).
2. **Epic 2: Maintainers can prove, offline, that the installed toolkit is the pinned
   release.** A committed digest manifest, a networked refresher and a fail-closed gate in
   `make lint`. FRs: FR-7, FR-8, FR-9, FR-10, FR-18.
3. **Epic 3: CRM screens read their breakpoints from the toolkit with no visible change.** The
   one identical seam, wired through Jest, with every no-regression lane green. FRs: FR-2
   (part), FR-3, FR-11, FR-13 (part), FR-14.
4. **Epic 4: Reviewers and contributors find every decision, rule and deviation documented.**
   ADR-016, the contributor page, the doc-sync surfaces and the drafted PR description. FRs:
   FR-6, FR-12, FR-13 (part), FR-15, FR-16, FR-17 (part).

5. **Epic 5 (deferred, blocked): CRM adopts the ui-toolkit #185 opt-ins after the next
   toolkit release.** Not dispatched by this pull request; every story waits for a ui-toolkit
   release above 0.5.0. FRs: the deferred part of FR-12 (C3).

Epic 2 and Epic 3 both build on Epic 1 and neither needs the other. Epic 4 documents what Epics
1 to 3 deliver, so it comes last. Epic 5 follows a future toolkit release, not any story here.

## Story Conventions

- **Fields:** each story gives the user story, the requirements it implements, the files it
  touches, its verification commands, one `Dependency:` line, and its acceptance criteria, in
  that order.
- **Dependency marks:** `Dependency: independent` or `Dependency: dependent on Story N.M[, ...]`
  (the `/fe-sdlc-implement` dispatch input). Every dependent story runs sequentially in the
  order of this document; no two stories run at the same time in the one worktree, because the
  pre-commit hook stages the whole tree.
- **Local-light verification** runs from the worktree root: focused Jest on the touched test
  files (`docker compose exec -T dev bun x jest <path>`), ESLint and Prettier on changed files,
  `make lint-tsc`, and the cheap lint targets named per story. Nothing else is run by hand.
- **CI-only verification** is named as `<workflow name> / <job name>`, exactly as GitHub reports
  the check run.
- **Always binding, for every story:** no suppression artifact of any kind (the NFR-5 list), no
  lowered floor or raised ceiling, no new comment in code, scripts, tests or config (exactly two
  existing comments are amended so that they stay true: the lockfile-gate header clause of
  Story 1.1 and the Bats scaffold-exclusion ordinal comment of Story 2.2; `##` make help text
  and Markdown are not code comments; architecture section 16), every new test follows the
  test-liveness rules (no skipped, focused or assertion-free test, no conditional `expect`), and
  `make format` before `make lint` per `CLAUDE.md`.

- **Commit points (readiness F9):** the implement stage commits four times, at the ends of
  Story 1.1, Story 2.2 (taking Stories 2.1 and 2.2), Story 3.1, and Story 4.3 (taking Stories
  4.1 to 4.3), matching architecture section 18. Each story names its commit point. A story
  without one leaves its work in the tree for the next story of its group, and the stories of
  a group run back to back.
- **Hook load, stated honestly:** `.husky/pre-commit` runs `make format`, `git add -A`,
  `make lint` (the 17-target lint aggregate, 18 once `lint-ui-toolkit` joins; several targets
  are Docker-backed) and `make test-unit-all` (client and server unit suites with coverage).
  Four commit points mean four full lint-and-unit runs locally, not seven; a rejected commit
  costs one more run after its fix. This is the only full-suite load the plan puts on the
  local machine, it sits against the owner's no-heavy-local-suites preference, and it is
  never avoided with `--no-verify` or `HUSKY=0`.

> Assumption: the hook's run is the hook's, not a planned local suite. Stories are committed
> only at the four commit points, so the hook's `git add -A` sweeps exactly one commit group's
> files into each commit.
>
> Assumption: `specs/250-ui-toolkit/` is untracked when implementation starts. The hook sweeps
> it into Story 1.1's commit, which is accepted: every earlier `specs/*` folder is tracked, and
> markdownlint ignores `**/planning-artifacts/`.

## Epic 1: Contributors install the pinned toolkit with every supply-chain gate still closed

A contributor checks out the branch, runs `make start`, `make install` and `make lint`, and the
pinned v0.5.0 toolkit installs with the frozen lockfile while the license and lockfile gates
still reject every other licence and every other non-npm resolution. Covers FR-1, FR-2 (pin
part), FR-4, FR-5, FR-17 surfaces 3 and 4, NFR-5, NFR-12, NFR-13, NFR-15.

### Story 1.1: Commit the pinned tarball with its two narrow gate widenings

As a contributor,
I want the v0.5.0 release tarball committed as a dependency, `make lint-licenses` to accept its
`CC0-1.0` license, and `make lint-lockfile` to accept exactly its one URL for its one package,
So that the frozen install works while every other licence and every other non-npm resolution
is still rejected.

**Requirements:** FR-1, FR-2 (pin part), FR-4, FR-5, FR-17 (surfaces 3 and 4), NFR-5, NFR-12
(license part), NFR-13, NFR-15 (CI part), AR-6, AR-7, AR-13, AR-15.

**Files touched:**

- `package.json`, `bun.lock`: the toolkit lines already present in the worktree (`package.json`
  line 14, `bun.lock` lines 18 and 1476), committed unchanged.
- `Makefile`: `ALLOWED_LICENSES` (line 578 today) gains `;CC0-1.0` at its end.
- `CONTRIBUTING.md`: one sentence added to the license-policy paragraph (lines 840 to 846
  today), beside its `ALLOWED_LICENSES` pointer, naming `CC0-1.0` and why it is allowed. The
  file has no SPDX list, and none is added.
- `scripts/ci/check-lockfile-registries.sh`: `TOOLKIT_PKG`, a one-line `TOOLKIT_URL` literal,
  `WORKSPACE_TOKEN`, `PACKAGE_TOKEN`, and the `awk` strip in front of arm (a).
- `tests/bats/lockfile_registries.bats`: 6 must-fail and 1 must-pass `@test` cases.
- `tests/bats/make-target-coverage.tsv`: the `lint-lockfile` row's details gain
  "sanctioned-tarball".
- `docs/adr/013-bun-package-manager.md`: the lockfile-gate prose (line 28 today) names the one
  exact-URL exception.

**Verification (local-light), in this order:**

1. `make start` brings up the dev container.
2. `make install` (`Makefile:947` today) runs
   `docker compose exec -T dev bun install --frozen-lockfile`, then `make husky`. This step is
   mandatory: `node_modules` is a named volume (`docker-compose.yml`), Docker seeds it from
   the image only when it is empty, and an existing worktree volume keeps its old tree.
   Without it `make lint-licenses` passes vacuously (the toolkit is absent), and the later
   `make update-ui-toolkit` and focused Jest runs fail.
3. The dev container holds the toolkit:
   `docker compose exec -T dev test -f node_modules/@vilnacrm/ui-toolkit/package.json` exits
   0, and that file's `version` is `0.5.0`, so the license evaluation below is not vacuous.
4. `make lint-licenses` (dev container) exits 0 on the installed production tree.
5. `sh scripts/ci/check-lockfile-registries.sh` (or `make lint-lockfile`) exits 0 on the real
   `bun.lock`; it exits 1 on the same tree today.
6. `make lint-shell` reports 0 ShellCheck findings.
7. `make lint-docs` and `make lint-md` pass with the ADR-013 and `CONTRIBUTING.md` edits.
8. `git diff origin/main -- Makefile` shows exactly one changed line.

**Verification (CI-only):** `bats testing / bats`; `static testing / static`;
`unit testing / unit` (the unedited `check-licenses.test.ts` must-fail cases, and the
image-hardening and Dockerfile golden-text tests); `supply-chain security / dependency scan`,
`supply-chain security / image scan`, `sbom / generate`.

Dependency: independent

**Acceptance Criteria:**

- **Given** the uncommitted toolkit lines, **When** they are committed, **Then**
  `package.json` `dependencies` holds exactly
  `.../releases/download/v0.5.0/vilnacrm-ui-toolkit-0.5.0.tgz` and both `bun.lock` occurrences
  name the same URL, **And** no peer-dependency version changes, the installed versions satisfy
  the nine peer ranges of PRD FR-1, and no `trustedDependencies` entry is added.
- **Given** `ALLOWED_LICENSES` reads `MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause;0BSD;CC-BY-4.0`,
  **When** the story is applied, **Then** it reads the same list followed by `;CC0-1.0`, **And**
  no other id is added, removed or reordered, and the comment block above it is unchanged.
- **Given** `make start` and then `make install` have run, and the dev container reports the
  toolkit at version `0.5.0`, **When** `make lint-licenses` runs, **Then** it exits 0, **And**
  the toolkit is evaluated as `CC0-1.0` by `spdx-satisfies`.
- **Given** `tests/unit/scripts/check-licenses.test.ts`, **When** the unit suite runs in CI,
  **Then** it passes unedited, **And** its disallowed AND-compound and unknown-license cases still
  fail the checker.
- **Given** `CONTRIBUTING.md`, **When** a contributor reads the license-policy paragraph,
  **Then** exactly one added sentence beside the `ALLOWED_LICENSES` pointer names `CC0-1.0`
  and its reason (a first-party VilnaCRM package; CRM itself is `CC0-1.0`), **And** no SPDX
  list is added, the "trimmed to exactly what the production tree contains today" claim stays
  true, and the remediation order (replace first, then one reviewed id) is unchanged.
- **Given** the lockfile gate, **When** it is edited, **Then** `ALLOWED` stays
  `^https://registry\.npmjs\.org(/|$)`, **And** the script defines `TOOLKIT_PKG` and a
  single-line `TOOLKIT_URL='<full v0.5.0 URL>'` literal that matches `^TOOLKIT_URL='([^']+)'$`,
  and derives the two tokens of architecture section 7.1.
- **Given** a lockfile line, **When** arm (a) runs, **Then** one POSIX `awk` pass removes leading
  blanks and drops a sanctioned token only when the line starts with it, **And** the rest of the
  line still goes through the unchanged `grep -oE` URL scan, while the backslash-escape arm and
  arm (b) still scan the raw lockfile.
- **Given** the real `bun.lock`, **When** `make lint-lockfile` runs, **Then** it exits 0 with the
  unchanged success message.
- **Given** the Bats suite in CI, **When** `lockfile_registries.bats` runs, **Then** each of 6 new
  fixtures exits 1: the URL under another package, another repository's asset, a wrong tag or
  asset name, the host `github.com.evil.example`, the `github:` spec form, and a rogue URL
  appended after the packages-entry token, **And** one new fixture with both sanctioned lines
  plus a registry entry exits 0, and the existing real-repository case passes unedited.
- **Given** the script header comment, **When** it is read, **Then** exactly one clause naming
  the single sanctioned release tarball is added, **And** no other comment in the script is
  added or changed.
- **Given** every Dockerfile, compose file and `scripts/docker/install-bun.sh`, **When** the PR
  diff is inspected, **Then** none changed, **And** the image-hardening and golden-text tests
  pass unedited.
- **Given** the CI supply-chain scans, **When** they run on the PR, **Then** they pass with no
  `.trivyignore`, no lowered `TRIVY_SEVERITY` and no narrowed target, **And** if a scanner
  errors on the tarball-URL entry, the implementer stops, records the error in the PR and
  escalates it as a blocker (AR-15).
- **Given** `docs/adr/013-bun-package-manager.md`, **When** it is read, **Then** it states that
  the lockfile gate accepts one exact, package-bound release-tarball URL for
  `@vilnacrm/ui-toolkit`, **And** `make lint-adr` still passes.
- **Given** the committed story, **When** the pre-commit hook runs `make lint`, **Then** it passes
  with both widenings in place, **And** the PR diff contains no suppression artifact and needs
  no `gate-relaxation` label.

Commit point: yes (commit 1 of 4).

> Assumption: the license id and the lockfile tokens land in one commit with the dependency
> lines. Measured on 2026-09-29: the worktree's lockfile gate exits 1 on the two toolkit URLs,
> and the toolkit's `license` is `CC0-1.0`, so either gate edit alone leaves `make lint` red and
> the hook would reject the commit (architecture section 18, commit group 1).

## Epic 2: Maintainers can prove, offline, that the installed toolkit is the pinned release

A maintainer or CI job can show, without network access, that the installed toolkit matches a
committed sha256 manifest, and can regenerate that manifest for a bump with one make target.
The gate fails closed on every tamper or drift class, including a stale dev container. Covers
FR-7, FR-8, FR-9, FR-10, FR-18, NFR-1, NFR-14, NFR-19.

### Story 2.1: Regenerate the digest manifest with make update-ui-toolkit

As a maintainer,
I want `make update-ui-toolkit` to write a sorted sha256 manifest of the installed toolkit and a
test that keeps the five pin statements equal,
So that the installed bytes have a committed, reviewable record and a bump cannot leave one
version string behind.

**Requirements:** FR-7 (manifest part), FR-9, FR-10, FR-18 (`update-ui-toolkit`), NFR-1,
NFR-4, NFR-14, NFR-17, NFR-19, AR-8, AR-9, AR-10, AR-17.

**Files touched:**

- `scripts/ci/ui-toolkit/ui-toolkit-policy.mjs` (new): frozen constants (including
  `CHECKSUM_SUFFIX`, `CHECKSUM_STATES` and `RELEASES_WITHOUT_CHECKSUM = ['0.5.0']`) and the
  patterns of architecture section 9.4, including `CHECKSUM_LINE_PATTERN`.
- `scripts/ci/ui-toolkit/ui-toolkit-pin-source.mjs` (new): `class UiToolkitPinSource` with the
  two methods `readPackagePin()` and `compareStatements()`.
- `scripts/ci/ui-toolkit/ui-toolkit-install-source.mjs` (new): `class UiToolkitInstallSource`.
- `scripts/ci/ui-toolkit/ui-toolkit-checksums-builder.mjs` (new):
  `class UiToolkitChecksumsBuilder`.
- `scripts/ci/update-ui-toolkit.mjs` (new): branch-free CLI entry.
- `config/ui-toolkit-checksums.json` (new): generated by `make update-ui-toolkit`.
- `tests/unit/scripts/ui-toolkit-checksums.test.ts` (new): refresher and install-source cases.
- `tests/unit/tooling/ui-toolkit-pin.test.ts` (new): real-repository pin check.
- `jest.config.ts`: `collectCoverageFrom` gains `'<rootDir>/scripts/ci/ui-toolkit/**/*.mjs'`.
- `Makefile`: the `update-ui-toolkit` target after `lint-licenses`, and its `.PHONY` entry.
- `tests/bats/make-target-coverage.tsv`: one `update-ui-toolkit` row.
- `tests/bats/makefile_targets.bats`: one heredoc row
  `update-ui-toolkit|docker compose exec -T dev node scripts/ci/update-ui-toolkit.mjs|`.

**Verification (local-light):**

- `make install` has run in this worktree (Story 1.1), so the dev container holds v0.5.0.
- `make update-ui-toolkit` (networked: the release asset, and a `.sha256` request that answers
  404 for v0.5.0) writes the manifest with `releaseChecksum: "absent"`.
- `docker compose exec -T dev bun x jest tests/unit/scripts/ui-toolkit-checksums.test.ts
tests/unit/tooling/ui-toolkit-pin.test.ts --coverage=false`.
- `make lint-tsc`; Prettier `--check` on every new file.

**Verification (CI-only):** `unit testing / unit` (global 100% coverage);
`integration testing / integration`; `bats testing / bats`; `static testing / static`;
`gate ratchet / no binding threshold weakened`; `supply-chain security / secret scan`;
`codecov / codecov`.

Dependency: dependent on Story 1.1

**Acceptance Criteria:**

- **Given** the library files, **When** they are reviewed, **Then** each exports one class with
  constructor-injected I/O (or, for the policy file, one frozen constants object), **And** none
  uses `import.meta`, top-level `await` or `process.exit()`, none exports a module-level
  instance, and none carries a comment.
- **Given** `UiToolkitChecksumsBuilder.run()`, **When** it runs, **Then** it reads the
  `package.json` pin through `UiToolkitPinSource.readPackagePin()` only, checks the installed
  version, fetches the asset, hashes it, fetches `<asset URL>.sha256` and settles
  `releaseChecksum`, lists and hashes the installed tree except `LICENSE` and `README.md`,
  sorts by `path` and writes once, **And** it returns 0 after the write.
- **Given** `UiToolkitPinSource`, **When** its methods are reviewed, **Then**
  `readPackagePin()` reads only `package.json` and returns `{ spec, version }` or a `pin`
  finding, and `compareStatements()` reads all five pin statements of architecture AD-9 and
  returns `drift` findings, **And** the builder calls only `readPackagePin()`.
- **Given** no `config/ui-toolkit-checksums.json` exists yet (the first generation in this
  story), **When** the builder runs with an injected fetch, **Then** it does not read the
  manifest as a pin statement and writes the manifest with the default `comment`, **And** a
  second case with an existing manifest keeps that manifest's `comment`.
- **Given** a `package.json` pin that is not a release-tarball URL (a semver range, and a
  `v0.5.0` tag with a `0.5.1` asset), **When** the builder runs, **Then** it returns 1 with a
  `[pin]` finding, **And** neither the injected fetch nor `writeFile` is called.
- **Given** an installed version that differs from the pinned URL's version, **When** the
  builder runs with an injected fetch, **Then** it returns 1 with an `[install]` finding, **And**
  the injected `writeFile` is never called.
- **Given** an injected fetch whose tarball request rejects, one whose tarball request answers
  404, one whose `.sha256` request rejects, and one whose `.sha256` request answers 500,
  **When** the builder runs, **Then** each returns 1 with a `[download]` finding, **And**
  `writeFile` is never called and no test touches the network.
- **Given** a `.sha256` body that is malformed, one that names another asset, one that carries
  another digest, and a `.sha256` 404 for a pinned version outside
  `RELEASES_WITHOUT_CHECKSUM`, **When** the builder runs, **Then** each returns 1 with a
  `[checksum]` finding, **And** `writeFile` is never called.
- **Given** a fixture tree and a pinned `0.5.0` URL whose `.sha256` request answers 404,
  **When** the builder succeeds, **Then** the written JSON is list-shaped, sorted by `path`,
  excludes `LICENSE` and `README.md`, carries the fake asset's sha256 as `tarballSha256` and
  `releaseChecksum: "absent"`.
- **Given** a fixture tree and a pinned `0.6.0` URL whose `.sha256` body names the asset and
  carries the asset's digest, **When** the builder succeeds, **Then** the written JSON carries
  `releaseChecksum: "matched"`, **And** no code or constant changed between this case and the
  `0.5.0` case, which is what makes the next release a pin bump.
- **Given** an installed tree with a symbolic link, **When** `UiToolkitInstallSource` lists it,
  **Then** the link is reported as a non-regular entry by its relative path, **And** it is never
  followed or read.
- **Given** the real repository after `make update-ui-toolkit`, **When** the manifest is read,
  **Then** it holds `algorithm: "sha256"`, `version: "0.5.0"`, the full `tarballUrl`,
  `tarballSha256` `bb3d61a6f9d354c38cfa2e4f013a7f07190f4d5df6bbba864ccc2e9476aa0c72`,
  `releaseChecksum: "absent"` and exactly 331 `{ path, sha256 }` entries (330 under `build/`
  plus `package.json`), **And** every digest equals the one in website's merged manifest.
- **Given** the manifest file, **When** Prettier and gitleaks check it, **Then** Prettier reports
  no change to `JSON.stringify(manifest, null, 2)` plus a newline, **And** gitleaks reports 0
  leaks in CI with `.gitleaks.toml` unedited.
- **Given** `tests/unit/tooling/ui-toolkit-pin.test.ts`, **When** it runs
  `compareStatements()` over the real repository, **Then** it reports zero findings and
  `readPackagePin()` captures the version that the committed manifest's `version` names,
  with no hard-coded pinned version in the test, **And** a `readFile` that swaps the gate
  literal for `v0.5.1` yields exactly one `drift` finding, and `RELEASES_WITHOUT_CHECKSUM`
  equals exactly `['0.5.0']` and is frozen.
- **Given** the five pin statements, **When** the pin tests run, **Then** an `it.each` over each
  statement mismatched, over a missing and a doubled `bun.lock` line of each shape, and over a
  missing and a doubled `TOOLKIT_URL` gate literal yields a `drift` finding for each case.
- **Given** `jest.config.ts`, **When** the coverage inclusion is added next to
  `scripts/localization-generator.js`, **Then** every library file added in this story is at
  100/100/100/100 from this story's tests alone, **And** no exclusion or path-keyed threshold is
  added and the gate ratchet scores the inclusion as a strengthening.
- **Given** the two test files this story adds, `tests/unit/scripts/ui-toolkit-checksums.test.ts`
  and `tests/unit/tooling/ui-toolkit-pin.test.ts`, **When** they are read, **Then** each starts
  with the `@jest-environment node` block docblock, a leading three-line `/** ... */` comment
  as in `tests/unit/tooling/image-hardening.test.ts`, never the
  `// @jest-environment node` line form, which Jest 30 ignores without a warning (architecture
  section 15.2), **And** each constructor call passes exactly the keys the class destructures,
  so `lint-tsc` reports no TS2353.
- **Given** the `Makefile`, **When** `update-ui-toolkit` is added, **Then** it runs
  `$(EXEC_DEV_TTYLESS) node scripts/ci/update-ui-toolkit.mjs`, is declared `.PHONY`, and is in
  neither `lint:` nor `CI_LINT_TARGETS`, **And** its coverage row and heredoc row name it as a
  whole token so `bats testing / bats` passes.

> Assumption: the architecture places the per-statement drift cases in the verifier test
> (section 15.2). This story also asserts them against `UiToolkitPinSource` directly, and tests
> `UiToolkitInstallSource` on a link, so that global coverage stays at 100% before the verifier
> exists (Story 2.2). The verifier test still adds its own drift and `extra` groups.

Commit point: none; this story's work is committed with Story 2.2 (commit 2 of 4).

> Assumption: the refresher reads only the `package.json` pin through `readPackagePin()` and
> the installed version (architecture sections 9.2, 9.5 and 17.1), so it runs before the
> manifest exists; the `[pin]` and first-generation cases above are what keep the builder at
> 100% branch coverage.
>
> Assumption: this story still keeps its own files at 100/100/100/100 from its own tests,
> although its commit point is Story 2.2's, so the pair stays reviewable as two units.

### Story 2.2: Fail make lint on any tamper or drift of the installed toolkit

As a maintainer,
I want `make lint-ui-toolkit` to verify the installed toolkit against the committed manifest
inside `make lint`, and to name the failing class,
So that a re-uploaded asset, an edited file, an extra file or a stale dev container is caught in
`static testing` before it merges.

**Requirements:** FR-7 (gate part), FR-8, FR-18 (`lint-ui-toolkit`), NFR-1, NFR-4, NFR-17,
AR-8, AR-9, AR-16.

**Files touched:**

- `scripts/ci/ui-toolkit/ui-toolkit-integrity-verifier.mjs` (new):
  `class UiToolkitIntegrityVerifier`.
- `scripts/ci/verify-ui-toolkit.mjs` (new): branch-free CLI entry.
- `tests/unit/scripts/ui-toolkit-integrity.test.ts` (new): one pass case and seven must-fail
  groups.
- `Makefile`: the `lint-ui-toolkit` target; `CI_LINT_TARGETS` (line 252 today) and `lint:`
  (line 706 today) gain it directly after `lint-licenses`; its `.PHONY` entry (line 288 today);
  the `lint:` help text gains "the ui-toolkit digest gate".
- `tests/bats/make-target-coverage.tsv`: one `lint-ui-toolkit` row.
- `tests/bats/makefile_targets.bats`: the `ci-lint` and `ci` mirrors (lines 37 and 42 today),
  one heredoc row, and the scaffold exclusion list (line 485 today) with its ordinal comment and
  count sentence (lines 473 to 483 today), the second of the two amended comments.
  No other comment is added.

**Verification (local-light):**

- `make lint-ui-toolkit` prints
  `ui-toolkit integrity: OK (v0.5.0, 331 artifacts verified, 0 extra files)` and exits 0.
- `docker compose exec -T dev bun x jest tests/unit/scripts/ui-toolkit-integrity.test.ts
--coverage=false`.
- `make lint-tsc`; Prettier `--check` on every new file.

**Verification (CI-only):** `static testing / static` (the `make lint` log shows the OK line);
`unit testing / unit`; `bats testing / bats`; `scaffold testing / scaffold`;
`codecov / codecov`.

Dependency: dependent on Story 2.1

**Acceptance Criteria:**

- **Given** a three-file fake install whose manifest matches, **When** `run({ stdout, stderr })`
  runs, **Then** it prints the OK line and returns 0.
- **Given** one must-fail group per class (`manifest`, `pin`, `drift`, `install`, `digest`,
  `missing`, `extra`), **When** each runs, **Then** it returns 1, prints
  `ui-toolkit integrity: FAIL` on stderr and a `- [<class>] <detail>` line naming the class,
  **And** all 7 of 7 groups are present.
- **Given** the `manifest` group, **When** its `it.each` runs, **Then** a bad algorithm, an empty
  list, a `..` path, a `.` segment path, bad hex, a duplicate path, an unsorted list, a
  `releaseChecksum` outside `CHECKSUM_STATES` and `releaseChecksum: "absent"` for a version
  outside `RELEASES_WITHOUT_CHECKSUM` each fail, **And** the pass case accepts `"absent"` for
  `0.5.0` and `"matched"` for a later version.
- **Given** the `pin` group, **When** it runs, **Then** a `package.json` spec that is not a
  release-tarball URL fails, **And** a `v0.5.0` tag with a `0.5.1` asset name fails as `pin`.
- **Given** the `install` group, **When** it runs, **Then** a missing
  `node_modules/@vilnacrm/ui-toolkit/package.json` and an installed version other than the
  pinned one each fail, **And** the missing-package finding names the remedy `make install`
  (which runs `bun install --frozen-lockfile` in the dev container), so the gate never passes
  on a stale tree.
- **Given** the `extra` group, **When** it runs, **Then** an unlisted root file, a nested
  `node_modules/` file and a symbolic link each fail, **And** the link is reported without being
  read.
- **Given** a `readFile` that throws inside the digest loop, **When** the verifier runs, **Then**
  the error becomes a `[manifest]` or `[install]` finding and the run returns 1, never a crash
  with exit 0.
- **Given** the verifier walks the installed tree, **When** it looks for extra files, **Then** it
  walks the whole package root, not only `build/`.
- **Given** the CLI entry, **When** Node runs it, **Then** it constructs the verifier with
  `node:fs` and `process.stdout` / `stderr` and assigns `process.exitCode` from `run()`, **And**
  it is not listed in `collectCoverageFrom`.
- **Given** the `Makefile`, **When** the target is added, **Then** `lint-ui-toolkit` runs
  `$(EXEC_DEV_TTYLESS) node scripts/ci/verify-ui-toolkit.mjs`, is `.PHONY`, and sits directly
  after `lint-licenses` in both `CI_LINT_TARGETS` and `lint:`, **And** the two lists keep an
  identical order.
- **Given** `tests/bats/makefile_targets.bats`, **When** the Bats suite runs in CI, **Then** the
  mirrors, the heredoc row and the scaffold exclusion list name `lint-ui-toolkit`, **And**
  `SCAFFOLD_VERIFY_TARGETS` in the `Makefile` is not edited.
- **Given** global coverage, **When** the unit suite runs in CI, **Then** the verifier file is at
  100/100/100/100 and global coverage stays 100% with no new exclusion.
- **Given** `tests/unit/scripts/ui-toolkit-integrity.test.ts`, **When** it is read, **Then** it
  starts with the same three-line `@jest-environment node` block docblock as Story 2.1's two
  test files, never the `//` line form, **And** each constructor call passes exactly the keys
  the class destructures, so `lint-tsc` reports no TS2353.

Commit point: yes (commit 2 of 4, taking Stories 2.1 and 2.2).

## Epic 3: CRM screens read their breakpoints from the toolkit with no visible change

Every existing importer of `src/components/ui-breakpoints` keeps reading the same theme and
height breakpoints, now supplied by the toolkit's named CRM exports. Because the consumed value
is the same object, no pixel, focus order, announcement, byte budget or Lighthouse score moves.
Covers FR-2 (tsc and build part), FR-3, FR-11, FR-13 (no-wiring part), FR-14, NFR-2, NFR-3,
NFR-6 to NFR-10, NFR-16 to NFR-18.

### Story 3.1: Back the breakpoints seam with the toolkit's named CRM exports

As an end user of CRM,
I want the sign-in, sign-up, home and 404 pages to look and behave exactly as before,
So that the toolkit installation is invisible to me while contributors gain one shared source of
breakpoint values.

**Requirements:** FR-2 (tsc and build), FR-3, FR-11, FR-13 (no wiring), FR-14, NFR-1 to NFR-3,
NFR-6 to NFR-10, NFR-16, NFR-17, NFR-18, AR-2, AR-3, AR-4, AR-5, AR-11, AR-17.

**Files touched (in this order):**

1. `jest.config.ts`: one `moduleNameMapper` entry `'^@vilnacrm/ui-toolkit/([a-z-]+)$'` to
   `'<rootDir>/node_modules/@vilnacrm/ui-toolkit/build/$1.mjs'`, placed before `'^@/(.*)$'`,
   and `'@vilnacrm/ui-toolkit/'` appended to the `transformIgnorePatterns` allowlist.
2. `src/components/ui-breakpoints/index.ts`: exactly the shape of architecture section 5.1.
3. `tests/unit/components/ui-breakpoints/breakpoints-theme.test.ts`: one added identity test.

**Verification (local-light):**

- `docker compose exec -T dev bun x jest
tests/unit/components/ui-breakpoints/breakpoints-theme.test.ts --coverage=false`.
- `make lint-tsc` (0 diagnostics); `docker compose exec -T dev bun x eslint
src/components/ui-breakpoints/index.ts jest.config.ts`; Prettier `--check` on the three files.
- `git diff --stat origin/main -- src` lists exactly 1 file, and
  `git diff --stat --diff-filter=A origin/main -- src` lists 0 files.
- `git grep -n 'ui-toolkit/styles.css' -- src .storybook tests` finds 0 matches.

**Verification (CI-only):** `unit testing / unit`; `integration testing / integration`;
`mutation testing / shard N` (every shard) and `mutation testing / merge and enforce gate`;
`bundle size / measure and gate` and `bundle size / PR report`;
`performance testing / lighthouse desktop` and `performance testing / lighthouse mobile`;
`accessibility testing / axe component gate` and
`accessibility testing / axe route scans and keyboard contract`; `visual tests / visual-test`;
`e2e testing / test`; `storybook testing / storybook-build`;
`dependency cruiser / dependency-cruiser`; `rust-code-analysis / rust-code-analysis`;
`security testing / security headers`.

Dependency: dependent on Story 1.1, Story 2.2

**Acceptance Criteria:**

- **Given** the Jest wiring, **When** the story is applied, **Then** the mapper and transform
  entries land in the same commit as the seam and ahead of it, **And** no seam importer's test
  can fail with `Cannot find module '@vilnacrm/ui-toolkit/ui-breakpoints'`.
- **Given** the seam file, **When** the story is applied, **Then** it imports
  `crmBreakpointsTheme` and `heightBreakpoints as toolkitHeightBreakpoints` by name from
  `@vilnacrm/ui-toolkit/ui-breakpoints`, declares
  `export const heightBreakpoints = toolkitHeightBreakpoints;` and
  `export default crmBreakpointsTheme;`, **And** it has no subpath `default`, `Ui*` or
  `website*` import, no `export { x as default } from` form, no comment and no type import.
- **Given** the seam's 21 `src` importers, **When** the PR diff is inspected, **Then** none of
  them changed, **And** `default` is still a `Theme` and `heightBreakpoints` is still
  `{ readonly compact: 550; readonly medium: 700 }`.
- **Given** `breakpoints-theme.test.ts`, **When** it runs, **Then** its four existing tests pass
  with 0 edits, **And** one added test calls `jest.resetModules()`, imports the seam and the
  toolkit subpath, and asserts `toBe` identity for both the theme and the height map.
- **Given** `jest.config.ts`, **When** it is edited, **Then** this story adds only the mapper
  entry and the transform-allowlist entry to it, the bare root and `styles.css` are not mapped,
  and `customExportConditions`, `moduleFileExtensions` and every threshold are unchanged,
  **And** `jest.mutation.config.ts` is not edited.
- **Given** the type checker, ESLint and the production build, **When** they run, **Then**
  `make lint-tsc` and ESLint report 0 findings on the seam and the Rspack production build in
  CI succeeds with the seam importing the toolkit, **And** no `!`, cast, `@ts-expect-error` or
  `eslint-disable` is added.
- **Given** coverage and mutation, **When** CI runs, **Then** the seam is at 100/100/100/100,
  adds 0 scored Stryker mutants, and the merged mutation score stays 100%, **And** the shards
  that reach the seam pass their dry run through the inherited mapper.
- **Given** the `bundle size` report, **When** the PR is built in CI, **Then** no module in the
  `src/index.tsx` initial closure imports the toolkit (proved by a dependency-cruiser
  reachability probe or a `bundle-stats.json` check), the eager gzip delta is at most 64 B
  (expected 0 B), and the summed non-initial gzip delta is at most 256 B, **And**
  `config/performance-budget.json` is not edited.
- **Given** Lighthouse CI, **When** it runs, **Then** desktop performance, accessibility and best
  practices are at least 0.95 and SEO at least 0.90, mobile accessibility, best practices and
  SEO are at least 0.90, and the resource-summary script and total size assertions hold,
  **And** the mobile performance median (3 runs, `median-run`) is at least the asserted 0.84,
  with both `lighthouserc` files and the profile unedited; a median in `[0.84, 0.85)` is
  recorded and handled by the PRD NFR-8 escalation route, never by editing a floor.
- **Given** the accessibility lanes, **When** they run, **Then** there are 0 new axe violations
  on every component and route, `A11Y_EXCEPTIONS` keeps its 4 entries, **And** the sign-in
  keyboard contract passes unchanged.
- **Given** the visual and e2e lanes, **When** they run, **Then** there are 0 snapshot diffs on
  every desktop project, `mobile-chrome` and `mobile-safari`, and 0 re-recorded baselines,
  **And** the e2e suite passes unchanged.
- **Given** the fonts and the colour seam, **When** the diff is inspected, **Then** no file
  imports `@vilnacrm/ui-toolkit/styles.css`, and `src/styles/**`,
  `src/components/ui-color-theme/**`, `config/security-headers.json` and `serve.json` are
  unchanged, **And** Storybook builds in CI with the seam resolved through webpack's `import`
  condition.
- **Given** the CI job durations, **When** they are compared with the latest `main` run,
  **Then** neither `static testing` nor any mutation shard nears its `timeout-minutes` because of
  the added `index.d.mts` parse.

- **Given** the Jest wiring, **When** a later release adds the `default` export condition
  (ui-toolkit #185), **Then** the mapper still wins over `exports` resolution and names the
  same file, so the bump needs no Jest edit, **And** this story neither removes the mapper
  nor adds `mjs` to `moduleFileExtensions`; that optional clean-up belongs to the deferred
  Epic 5 (architecture section 6.3).

Commit point: yes (commit 3 of 4).

> Assumption: the dependency on Story 2.2 is commit grouping, not code (readiness N3). The seam
> needs nothing from Epic 2, but if this story ran between Stories 2.1 and 2.2, the hook's
> `git add -A` at this commit point would sweep Story 2.1's uncommitted files into commit 3.
>
> Assumption: the partial rollback for this story is a one-file revert of the seam plus removal
> of the identity test; the Jest entries can stay because they resolve nothing else
> (architecture section 19).
>
> Assumption: the CI-lane criteria above are judged on the PR head by the pull-request stage
> below; Ralph completes this story on the local-light evidence and the story's commit.

## Epic 4: Reviewers and contributors find every decision, rule and deviation documented

A reviewer can read, in one ADR, why the toolkit is installed the way it is and where the
delivered scope differs from the issue text; a contributor can learn from one page how to
import, verify and bump it; and every existing document that lists commands, licenses or gates
is in sync. Covers FR-6, FR-12, FR-13 (record part), FR-15, FR-16, FR-17 (surfaces 1, 2, 5, 6,
7), NFR-11, NFR-12 (record), NFR-15 (record).

### Story 4.1: Record the installation in ADR-016 and the contributor page

As a reviewer and as a contributor,
I want ADR-016 to state every decision and deviation, and `docs/ui-toolkit.md` to explain how to
import, verify and bump the toolkit,
So that the supply-chain questions are answered once and the next toolkit change is a UI
decision only.

**Requirements:** FR-1 (stale premise stated), FR-6, FR-10 (docs name v0.5.0), FR-12, FR-13
(record), FR-15 (ADR part), FR-16, NFR-11, NFR-12 (record), NFR-15 (record), NFR-19 (record),
AR-3, AR-11, AR-12, AR-17.

**Files touched:**

- `docs/adr/016-ui-toolkit-installation.md` (new).
- `docs/adr/README.md`: one index bullet reusing the ADR title.
- `docs/ui-toolkit.md` (new).

**Verification (local-light):**

- `make lint-docs` (`lint-adr`, `lint-doc-coverage`, `lint-doc-references`, `lint-doc-links`).
- `make lint-md`; Prettier `--check` on the three files.

**Verification (CI-only):** `static testing / static`, including the ADR-drift steps with no
`adr:not-required` label and no `[no-adr]` line.

Dependency: dependent on Story 2.2, Story 3.1

**Acceptance Criteria:**

- **Given** ADR-016, **When** `make lint-adr` runs, **Then** it passes, **And** its title line is
  the one fixed in architecture section 4 (97 characters, on one line), followed in template
  order by `- Status: Approved`,
  `- Deciders: [@kravalg](https://github.com/kravalg)`, `- Date:` and `**Technical Story**:`.
- **Given** ADR-016's sections, **When** they are read, **Then** they are the seven required by
  `config/docs-policy.json` plus "Pros and Cons of the Options", with unique `#### Good (...)`
  and `#### Bad (...)` headings for the six considered options of architecture section 4
  (the sixth being "wait for the release that carries ui-toolkit #185, or pin its `main`"),
  **And** the template's HTML comment is not copied.
- **Given** ADR-016's content, **When** a reviewer reads it, **Then** it records the stale
  "blocked" premise, v0.5.0 instead of v0.3.0, the identity bar with the seam evidence (0 of 310
  leaves differ; `up('md')` is `@media (min-width:768px)`, `down('md')` is
  `@media (max-width:767.95px)`), the single seam, the colour-seam deferral with its reversal
  trigger, the two allowlist widenings, the scanner blind spot, the vendored `swiper@14.0.6`
  (MIT) and OFL fonts, the egress need and the manual-bump cost, **And** it records the
  ui-toolkit #185 decision (v0.5.0 installed now, the next release a pin bump, the `.sha256`
  rule, the #185 opt-ins deferred to a follow-up with the reversal trigger "a toolkit release
  above 0.5.0") and, as a negative consequence, the Dependabot `bun` job risk with its
  post-merge check.
- **Given** the deviations subsection of ADR-016, **When** it is counted, **Then** it lists 7 of
  7: the stale premise, v0.5.0, primitives partly deferred (the #185 swaps wait for the next
  release) and adapters ruled out, fonts deferred, the subpath Jest mapper, `crmColorTheme`
  not adopted, and website PR #459 instead of #458.
- **Given** ADR-016 and `docs/ui-toolkit.md`, **When** they describe provenance, **Then** both
  say installed build artifacts are verifiable offline and that
  `bun install --frozen-lockfile` itself fetches unverified bytes, **And** no sentence attributes
  install-time integrity to the lockfile or to `bun install`, **And** where they cite the
  v0.5.0 build-provenance attestation, they say it proves a tag build of that digest, not the
  upload, the installed tree or the lockfile (architecture section 13 item 11).
- **Given** `docs/ui-toolkit.md`, **When** a contributor reads it, **Then** it covers the v0.5.0
  pin and its peers, the import rule (named subpath exports only; never the root barrel,
  `styles.css`, a subpath `default`, `website*` or `Ui*`), the digest gate with the `.sha256`
  rule, the stale-container remedy `make install`, the bump recipe, the fonts decision with
  1,348,788 B against the 480,000 B budget and `font-src 'self'`, the deferred #185 adoption
  (architecture section 12.1), and the 11 upstream follow-ups with the statuses of architecture
  section 13, the one source for them (research section 11 carries the same statuses).
- **Given** the keep-local register in `docs/ui-toolkit.md`, **When** it is compared row by row
  with architecture section 12 and PRD FR-12, **Then** all three name the same rows (the union
  list, including `ui-text-field-form` beside `ui-form-input-field`, `ui-error-boundary` beside
  `error-boundary`, and `src/styles/theme.ts`), the same reason codes R1 to R12 and the same
  "After #185" outlook, **And** `ui-color-theme` carries its reversal trigger.
- **Given** the bump recipe, **When** it is read, **Then** it is the architecture section 17.1
  recipe word for word (`bun add` of the bare release URL in the dev container, the
  `TOOLKIT_URL` edit, `make update-ui-toolkit`, `make lint-lockfile lint-ui-toolkit`), with no
  variant, **And** it forbids running `make update-ui-toolkit` to clear a red
  `lint-ui-toolkit` without re-reviewing the release.
- **Given** both new files, **When** the docs gates run, **Then** every `make` target they name
  exists, every relative link and anchor resolves, **And** neither links a path under
  `node_modules/` or `specs/`.
- **Given** `docs/adr/README.md`, **When** it is read, **Then** it carries one bullet
  `- [ADR-016: <title>](./016-ui-toolkit-installation.md)` in number order, **And** `make lint-md`
  passes on it.

Commit point: none; this story's work is committed with Story 4.3 (commit 4 of 4).

> Assumption: `Status: Approved` follows ADR-010 to ADR-015, which were approved by the PR that
> implemented them; the `Date` is the date of the implementing commit.

### Story 4.2: Sync the command, gate and security docs with the new gate

As a contributor or AI agent reading any existing guide,
I want the command lists, the gate table, the security policy and the Copilot instructions to
name the toolkit gates and the lockfile exception,
So that no document tells me something the repository no longer does.

**Requirements:** FR-17 (surfaces 1, 2, 5, 6, 7), NFR-4 (Markdown), NFR-11.

**Files touched:**

- `CLAUDE.md`: the "Code Quality" command block names `make lint-ui-toolkit` and
  `make update-ui-toolkit`; the `make lint-lockfile` comment becomes "npm registry allowlist
  plus one pinned tarball". The managed react-frontend-sdlc block is not touched.
- `AGENTS.md`: the "Code Quality" command block names both targets.
- `.claude/skills/quality-standards/SKILL.md`: a "UI toolkit digest" row next to the Licenses
  row (line 28 today).
- `SECURITY.md`: the "Lockfile provenance" entry (lines 133 and 134 today) names the one
  exact-URL exception and the `lint-ui-toolkit` digest gate.
- `.github/copilot-instructions.md`: the quality-gates paragraph (line 97 today) lists the
  toolkit digest gate beside the lockfile provenance gate.

**Verification (local-light):**

- `make lint-docs` (`lint-doc-references` proves both targets exist) and `make lint-md`.
- Prettier `--check` on the five files.

**Verification (CI-only):** `static testing / static`.

Dependency: dependent on Story 4.1

**Acceptance Criteria:**

- **Given** `CLAUDE.md` and `AGENTS.md`, **When** a contributor reads their "Code Quality"
  blocks, **Then** both list `make lint-ui-toolkit` and `make update-ui-toolkit` with one-line
  descriptions, **And** the managed governance block between its markers is byte-identical.
- **Given** the quality-standards skill, **When** its gate table is read, **Then** a row names
  `make lint-ui-toolkit` next to `make lint-licenses`, **And** the table stays within 100
  characters per row.
- **Given** `SECURITY.md`, **When** the lockfile provenance entry is read, **Then** it no longer
  says every package resolves from the npm registry allowlist without exception, **And** it
  names the single package-bound tarball URL and the offline digest gate with the precise
  claim.
- **Given** `.github/copilot-instructions.md`, **When** its quality-gates paragraph is read,
  **Then** the toolkit digest gate is listed beside the lockfile provenance gate.
- **Given** the five edited files, **When** `make lint-docs` and `make lint-md` run, **Then** both
  pass, **And** every `make` target named exists.

Commit point: none; this story's work is committed with Story 4.3 (commit 4 of 4).

### Story 4.3: Draft the pull request title and description for the finish stage

As the maintainer ([@kravalg](https://github.com/kravalg)),
I want a ready pull request title and description that state the corrected premise, the 7
deviations and an evidence checklist for every required CI check,
So that the finish stage opens the pull request from reviewed text and I can approve it on
evidence, with every widening visible in one review.

**Requirements:** FR-15 (PR part), NFR-5, NFR-20 (checklist), AR-14.

**Files touched:**

- `specs/250-ui-toolkit/implementation-artifacts/pr-description-250-ui-toolkit.md` (new): the
  title line and the description body that `/fe-sdlc-finish-pr` passes to `gh pr create`.

**Verification (local-light):**

- `make lint-commit-message` on the squash header `<PR title> (#250)`, fed on stdin.
- `make lint-md` and Prettier `--check` on the new file.
- A search of the story range's diff for the NFR-5 suppression artifacts finds none.

**Verification (CI-only):** none; the pull-request stage below consumes this file.

Dependency: dependent on Story 4.2

**Acceptance Criteria:**

- **Given** the drafted title, **When** it is linted as `<title> (#250)`, **Then**
  `make lint-commit-message` exits 0, **And** the header is at most 100 characters.
- **Given** the drafted description, **When** it is read, **Then** it states the stale "blocked"
  premise and the installation-only scope set by the product owner, **And** it lists the same 7
  deviations, in the same words, as ADR-016's deviations subsection.
- **Given** the drafted description, **When** it is read, **Then** it names the two allowlist
  widenings (the one exact tarball URL and `CC0-1.0`) and states that no `gate-relaxation`
  label applies, **And** it contains `Closes #250`.
- **Given** the evidence checklist, **When** it is compared with PRD NFR-20, **Then** it names
  every listed check as `<workflow name> / <job name>`, **And** it holds one empty slot each for
  the eager and non-initial gzip deltas, the `lint-ui-toolkit` OK line, the mobile performance
  median with the PRD NFR-8 route taken (and the `main` comparison run when the route needs
  it), the CycloneDX record of the toolkit, the reachability probe result, the job durations
  against the latest `main` run, and the Dependabot evidence of PRD NFR-19.
- **Given** the drafted description, **When** it is read, **Then** it states that v0.5.0, the
  latest release, is installed, that ui-toolkit #185 is merged but unreleased, and that the
  adoption of its opt-ins is the deferred Epic 5, **And** it marks the issue's "replace
  CRM-local primitives" checkbox as partly met, with that reason.
- **Given** the upstream toolkit gaps, **When** the draft is read, **Then** it points to
  `docs/ui-toolkit.md` for them, **And** it files nothing against the toolkit repository and
  does not edit issue #250.
- **Given** the draft, **When** it is checked, **Then** it ends with the attribution line the
  session prescribes for pull-request descriptions, **And** it pushes nothing and opens no pull
  request.

Commit point: yes (commit 4 of 4, taking Stories 4.1 to 4.3).

> Assumption: opening the pull request, pushing and filling the evidence slots belong to
> `/fe-sdlc-finish-pr`, which runs after the user approves the push; a Ralph story that pushed
> or waited on CI could never finish locally and would bypass that approval.

## Pull Request Stage (not a Ralph story)

Executed by `/fe-sdlc-finish-pr` on the pushed branch, from the Story 4.3 draft. It is not a
`### Story` heading, so bmalph does not put it in the Ralph fix plan. It closes the CI half of
FR-15 and NFR-20, and records the evidence for NFR-6, NFR-7, NFR-8, NFR-15 and NFR-18:

- Open the pull request with the drafted title and description, then fill every evidence slot
  from the finished checks: the `bundle size / PR report` eager gzip delta (at most 64 B) and
  summed non-initial delta (at most 256 B); the `static testing / static` line
  `ui-toolkit integrity: OK (v0.5.0, 331 artifacts verified, 0 extra files)`; the
  `performance testing / lighthouse mobile` median against the asserted 0.84 (median of 3
  runs), with the profile's 85 beside it; how `sbom / generate` lists the toolkit component, or
  that it omits it (the documented blind spot); the eager-closure probe; and the
  `static testing` and mutation-shard durations against the latest `main` run.
- Mobile median in `[0.84, 0.85)`, or a red mobile check with no eager change: follow the PRD
  NFR-8 escalation route. Compare with the latest green `main` run; if `main` is in the same
  band, record the figures as the pre-existing profile gap or runner noise and escalate to the
  maintainer ([@kravalg](https://github.com/kravalg)) instead of blocking. Never edit
  `lighthouserc.mobile.js` or the profile, and never re-run silently until green.
- Dependabot (PRD NFR-19): record `website`'s evidence (three `bun` update jobs succeeded
  against its `main` after #459; its first weekly `bun` scan if it has run by then). After
  merge, check the first CRM weekly `bun` "Dependabot Updates" run; a failure is escalated to
  the maintainer as a follow-up, not fixed inside this pull request.
- Every check in PRD NFR-20 is green on the final head, no re-run masks a flake, and no
  `gate-relaxation` label is applied.
- A Trivy or SBOM error on the tarball-URL entry stops the stage and is escalated as a blocker
  (AR-15), never suppressed.

> Assumption: the PR closes #250 as scoped by the product owner; the deferred parts of the
> issue's checkboxes C3 and C4 stay listed in `docs/ui-toolkit.md` for the maintainer to reopen
> as new issues.

## Epic 5 (deferred, blocked): CRM adopts the ui-toolkit #185 opt-ins after the next release

**DEFERRED, BLOCKED: not part of this pull request's dispatch set.** ui-toolkit PR #185 merged
opt-in CRM behaviour to the toolkit's `main` on 2026-09-28T23:36Z, after v0.5.0; no release
carries it yet (research section 12). This epic starts only once a ui-toolkit release above
0.5.0 exists, as its own issue and pull request. The headings below deliberately avoid the
bmalph `## Epic N:` and `### Story N.M:` forms, so `/fe-sdlc-implement` cannot dispatch them
from this document.

A maintainer can then swap the rows that architecture section 12 marks "adoptable"
(`ui-typography`, `ui-container`) to the toolkit, behind the existing CRM seams and props:
each CRM file keeps its path, export and props and renders the toolkit component with the
opt-in set. `ui-footer`, `ui-button` and `ui-form` are here too, each also blocked on an
upstream change (register reasons R2 and R10). No module, component, `UI*` primitive or
adapter is added, and every no-regression bar of Epic 3 applies to each swap. Each swap
imports a toolkit component as its subpath's `default` export, so it amends the documented
import rule for that one subpath only (architecture section 12.1); theme-subpath defaults,
the root barrel and `styles.css` stay forbidden. Covers the deferred part of FR-12 and of
issue checkbox C3.

### Deferred 5.1: Bump the toolkit pin to the next release

As a maintainer, I want the pin moved to the first release that carries ui-toolkit #185, so
that the opt-ins can be consumed and the checksum cross-check is exercised on a real sidecar.

Dependency: blocked on ui-toolkit release > 0.5.0

**Acceptance Criteria:**

- **Given** a ui-toolkit release above 0.5.0, **When** the architecture section 17.1 recipe
  runs unchanged, **Then** `make update-ui-toolkit` writes `releaseChecksum: "matched"` after
  cross-checking the release's published `.sha256`, **And** no script, constant or pattern is
  edited, and `RELEASES_WITHOUT_CHECKSUM` still equals `['0.5.0']`.
- **Given** the bump diff, **When** it is reviewed, **Then** it holds only the `package.json`
  line, the two `bun.lock` lines, the `TOOLKIT_URL` literal, the manifest, the version named
  in `docs/ui-toolkit.md` and the ADR-016 record of the new pin, **And** no test changes, the
  ADR edit satisfies the ADR drift gate that the `dependencies` change trips (no escape
  hatch), and any peer-range change the release makes is a reviewed peer decision, never a
  forced install.
- **Given** the Jest subpath mapper, **When** the entry is deleted in a scratch run of the
  focused breakpoints test, **Then** the entry is removed only if that run passes (adding `mjs`
  to `moduleFileExtensions` if resolution needs it), **And** the `transformIgnorePatterns`
  entry and the `.mjs` transform stay (architecture section 6.3).
- **Given** every Epic 1 to Epic 3 gate, **When** CI runs, **Then** each passes unchanged, and
  the breakpoints seam still passes its identity test against the new release.

### Deferred 5.2: Back ui-typography with UiTypography inheritTheme

As an end user, I want CRM text to render exactly as before while it comes from the toolkit,
so that CRM and `website` share the typography primitive.

Dependency: blocked on ui-toolkit release > 0.5.0; dependent on Deferred 5.1

**Acceptance Criteria:**

- **Given** `src/components/ui-typography`, **When** it is swapped, **Then** it keeps its path,
  export and props and renders the toolkit `UiTypography` with `inheritTheme`, **And** none of
  its 11 importers changes and no file is added under `src/`.
- **Given** the swap, **When** CI runs, **Then** there are 0 visual diffs, 0 new axe
  violations, the keyboard contract passes, the eager entrypoint stays inside NFR-6 with no
  kit theme on the eager path, and the Lighthouse floors of NFR-8 hold.
- **Given** any measured difference, **When** it is found, **Then** the row stays keep-local
  with a new reason in the register, **And** nothing is re-baselined to pass.

### Deferred 5.3: Back ui-footer with UiFooter variant="crm"

As an end user, I want the footer to look and link exactly as before while it comes from the
toolkit.

Dependency: blocked on ui-toolkit release > 0.5.0, and on an upstream `crm` footer variant
that renders its link labels with `UiTypography` `inheritTheme` (register reason R2);
dependent on Deferred 5.1

**Acceptance Criteria:**

- **Given** the `crm` variant's media rules, **When** they are value-diffed against the pinned
  release, **Then** its `md`, `lg` and `xl` equal CRM's 768, 1024 and 1440 (they do in
  v0.5.0), **And** the swap stops, with the row kept local, if they do not.
- **Given** the footer's link labels, **When** they render, **Then** their font family,
  weight, size and line height equal CRM's (`Golos`, from the ambient CRM theme), **And** the
  row stays local on R2 while the variant renders them without `inheritTheme`.
- **Given** `src/components/ui-footer`, **When** it is swapped, **Then** it keeps its path,
  export, props and lazy loader and renders `UiFooter` with `variant="crm"`, passing CRM's own
  policy hrefs through `privacyHref` and `usagePolicyHref` where they differ from the defaults,
  **And** no `process.env` read reaches the render path.
- **Given** the swap, **When** CI runs, **Then** the Epic 3 visual, axe, keyboard, e2e and
  budget bars hold unchanged.

### Deferred 5.4: Back ui-button and ui-form with the native loading and form opt-ins

As an end user, I want the auth forms to keep CRM's loading, heading, offline and focus
behaviour while they come from the toolkit.

Dependency: blocked on ui-toolkit release > 0.5.0, on an upstream contained `UiButton`
`:focus-visible` outline (register reason R10), and on `UiForm` rendering its title and
error banner with `inheritTheme` (R2); dependent on Deferred 5.1

**Acceptance Criteria:**

- **Given** `UiButton` `loadingMode="native"`, **When** a submit is in flight, **Then** CRM
  pattern 5 holds: native `disabled` grey `#E1E7EA`, the label kept for the accessible name,
  CRM's `SubmitSpinner` as `loadingIndicator`, and one polite status region on the form only.
- **Given** `UiForm` with `titleComponent="h1"`, `submitLoadingMode="native"` and
  `offlineNotice`, **When** the connection drops and returns, **Then** the crm#147 behaviour
  holds: an always-mounted `role="status"` notice after the heading, the submit disabled and
  described by it while offline, and the restored copy for 5 s.
- **Given** the `sm` rules, **When** the form and its skeleton render, **Then** `sm` is 480,
  through a `crm` UI theme placed off the eager path, **And** `auth-skeleton` stays keep-local
  (R11).
- **Given** the swap, **When** CI runs, **Then** the Epic 3 visual, axe, keyboard, e2e and
  budget bars hold unchanged, including a visible `:focus-visible` outline on the submit.

### Deferred 5.5: Back ui-container with UiContainer

As an end user, I want every padded page section to lay out exactly as before while its
container comes from the toolkit.

Dependency: blocked on ui-toolkit release > 0.5.0; dependent on Deferred 5.1

**Acceptance Criteria:**

- **Given** the pinned release's `UiContainer`, **When** it is value-diffed against CRM's
  `UIContainer`, **Then** it renders a `Box` with no `aria-label` and the same padding at the
  same `md`, `lg` and `xl` widths, **And** the swap stops, with the row kept local, if any
  value differs (register reason R12 is resolved by #185 dropping the `aria-label`).
- **Given** `src/components/ui-container`, **When** it is swapped, **Then** it keeps its
  path, export and `children`-only props and renders the toolkit `UiContainer`, **And** none
  of its 3 importers changes and no file is added under `src/`.
- **Given** the swap, **When** CI runs, **Then** the Epic 3 visual, axe, keyboard, e2e and
  budget bars hold unchanged on the home, back-to-main and footer surfaces.

## Requirements to Story Coverage Map

Every FR and NFR is covered by at least one story. The first story named is the one that
delivers the requirement; later entries record or evidence it. "PR stage" is the section above.

Functional requirements:

- FR-1: Story 1.1 (install), Story 4.1 (stale premise in ADR-016).
- FR-2: Story 1.1 (pin, no `trustedDependencies`), Story 3.1 (`tsc`, production build).
- FR-3: Story 3.1.
- FR-4: Story 1.1.
- FR-5: Story 1.1.
- FR-6: Story 4.1.
- FR-7: Story 2.1 (manifest), Story 2.2 (gate in `make lint`).
- FR-8: Story 2.2.
- FR-9: Story 2.1.
- FR-10: Story 2.1, Story 4.1 (docs name v0.5.0).
- FR-11: Story 3.1.
- FR-12: Story 4.1 (the register, all rows keep-local in this change). The adoptable rows are
  delivered later by the deferred Epic 5, which is outside this dispatch set.
- FR-13: Story 3.1 (nothing wired), Story 4.1 (reason recorded).
- FR-14: Story 3.1.
- FR-15: Story 4.1 (ADR-016), Story 4.3 (drafted PR description), PR stage (published).
- FR-16: Story 4.1.
- FR-17: Story 1.1 (surfaces 3 and 4), Story 4.2 (surfaces 1, 2, 5, 6, 7).
- FR-18: Story 2.1 (`update-ui-toolkit`), Story 2.2 (`lint-ui-toolkit`).

Non-functional requirements:

- NFR-1: Story 2.1, Story 2.2, Story 3.1.
- NFR-2: Story 3.1.
- NFR-3: Story 3.1, with every story bound by the Story Conventions.
- NFR-4: Story 1.1 (ShellCheck), Story 2.1 and Story 2.2 (Prettier), Story 4.1 and Story 4.2
  (markdownlint), Story 3.1 (metrics, jscpd, depcruise).
- NFR-5: Story 1.1, Story 4.3, with every story bound by the Story Conventions.
- NFR-6: Story 3.1, PR stage (evidence).
- NFR-7: Story 3.1, PR stage (evidence).
- NFR-8: Story 3.1, PR stage (evidence and, when needed, the escalation route).
- NFR-9: Story 3.1.
- NFR-10: Story 3.1.
- NFR-11: Story 4.1, Story 4.2.
- NFR-12: Story 1.1, Story 4.1 (record).
- NFR-13: Story 1.1.
- NFR-14: Story 2.1.
- NFR-15: Story 1.1 (scans), Story 4.1 (record), PR stage (CycloneDX record).
- NFR-16: Story 3.1.
- NFR-17: Story 3.1, Story 2.1, Story 2.2, with every story bound by the Story Conventions.
- NFR-18: Story 3.1, PR stage (evidence).
- NFR-19: Story 2.1, Story 4.1 (Dependabot risk in ADR-016), PR stage (Dependabot evidence).
- NFR-20: Story 4.3 (checklist), PR stage (green head).

Architecture requirements: AR-1 Story 1.1 and Story 2.1; AR-2 to AR-5 Story 3.1 (AR-3 and AR-4
also Story 4.1); AR-6 and AR-7 Story 1.1; AR-8 to AR-10 Story 2.1 and Story 2.2; AR-11 Story
3.1 and Story 4.1; AR-12 Story 4.1; AR-13 Story 1.1; AR-14 Story 4.3 and the PR stage; AR-15
Story 1.1 and the PR stage; AR-16 every story's verification split; AR-17 Story 2.1 (checksum
gate for both release shapes), Story 3.1 (Jest wiring that survives the bump), Story 4.1 (ADR
and register) and the deferred Epic 5.

Issue #250 checklist (PRD section 4): C1 Story 1.1; C2 Epics 1 and 2; C3 partly: Story 3.1
(one seam) and Story 4.1 (the register), with the remainder in the deferred Epic 5, blocked on
a ui-toolkit release above 0.5.0; C4 Story 3.1 and Story 4.1; C5 Story 3.1.

**Dispatch set:** exactly the 7 stories above plus the PR stage. The five deferred stories of
Epic 5 are not dispatched, are not counted in the coverage figures of this pull request, and
each carries `Dependency: blocked on ui-toolkit release > 0.5.0`.

## Story Dependency Graph

```text
1.1 -> 2.1 -> 2.2 -> 3.1 -> 4.1 -> 4.2 -> 4.3 -> (PR stage)
```

Document order binds: 1.1, 2.1, 2.2, 3.1, 4.1, 4.2, 4.3, one at a time. Story 3.1 needs only
Story 1.1 in code, but it is marked dependent on Story 2.2 as well, because commits are grouped:
run between Stories 2.1 and 2.2, its commit point would sweep Story 2.1's uncommitted files into
commit 3 (readiness N3). Epic 4 waits for both epics, because ADR-016 and the contributor page
name `make lint-ui-toolkit` (checked by `lint-doc-references`) and the adopted seam. Within
Story 3.1, the Jest wiring precedes the seam (its first acceptance criterion).

Commit points: after Story 1.1, Story 2.2, Story 3.1 and Story 4.3 (four hook runs in all).

The deferred Epic 5 is not in this graph. It hangs off a future toolkit release:

```text
ui-toolkit release > 0.5.0 -> Deferred 5.1 -> Deferred 5.2
                                           \-> Deferred 5.3 (also needs upstream R2)
                                           \-> Deferred 5.4 (also needs upstream R2, R10)
                                           \-> Deferred 5.5
```

## Final Validation

Step 4 of the workflow, first run at creation and re-run by `validate-epics-stories` on
2026-09-29. Findings of the re-run, each fixed in this document:

- **V1, forward safety (fixed):** the old Story 1.1 (`CC0-1.0`) could not be committed alone.
  The worktree already holds the toolkit in `package.json` and `bun.lock`, the lockfile gate
  exits 1 on it today, and the hook runs `make lint` over the whole tree. Old Stories 1.1 and
  1.2 are merged into Story 1.1, matching architecture commit group 1; later stories are
  renumbered from 8 to 7.
- **V2, coverage (fixed):** Story 2.1 had no case for the builder's `[pin]` refusal or for the
  first generation with no manifest, both branches of `UiToolkitChecksumsBuilder`; either gap
  breaks global 100% coverage in that story's own commit. Both are now acceptance criteria.
- **V3, FR-10 (fixed):** the exactly-once rule covers the gate literal too; Story 2.1 now asserts
  a missing and a doubled `TOOLKIT_URL` literal, not only the `bun.lock` shapes.
- **V4, FR-8 (fixed):** Story 2.2's `install` group named only the absent package; the
  other-version case and the `pin` group's cases are now explicit.
- **V5, completability (fixed):** the old Story 4.3 touched no file and required a pushed branch
  and finished CI, which Ralph cannot reach and which would push without the user's approval.
  It now drafts the title and description locally; the CI half moved to the pull-request stage,
  run by `/fe-sdlc-finish-pr`.
- **V6, testable criteria (fixed):** Story 3.1 now states the production build, the Lighthouse
  resource-summary assertions and the eager-closure proof method (NFR-6), and orders the Jest
  wiring ahead of the seam.
- **V7, dependency marks (fixed):** each `Dependency:` line now reads `independent` or
  `dependent on Story N.M`, the keywords the implement stage dispatches on.
- **V8, parseability (checked):** the headers match bmalph's `^## Epic N:` and
  `^### Story N.M:` patterns, every acceptance criterion starts with `- **Given**`, and
  continuation lines are indented, so the parser reads 7 stories with 0 warnings.

Standing checks:

- **FR coverage:** 18 of 18 FRs and 20 of 20 NFRs map to at least one story, and each mapped
  story carries an acceptance criterion for it.
- **Starter template:** not applicable (brownfield).
- **Entity creation:** there is no database. Each file is created by the first story that needs
  it: the manifest in Story 2.1, the verifier in Story 2.2, the docs page in Story 4.1.
- **Story quality:** each story fits one agent session, names its files, and has testable
  Given / When / Then criteria with counts, exact strings or commands.
- **Epic structure:** each epic delivers an outcome to a named actor (contributor, maintainer,
  end user, reviewer), not a technical layer.
- **Forward dependencies:** none. Every `Dependency:` line points to an earlier story, and each
  of the four commit points leaves `make lint` and the unit suite green.
- **Scope:** no story adds a component, module, `UI*` primitive, adapter or `src/` directory;
  the `src/` diff across all stories is one file.

> Assumption: the ADR drift gate compares the whole PR against its merge base, so it is judged
> once, on the PR head. Story 1.1 already touches `docs/adr/013-bun-package-manager.md`, and
> ADR-016 (Story 4.1) is the record that gate expects for the `dependencies` change.

Correction pass 1 (2026-09-29), after `implementation-readiness` iteration 1 and ui-toolkit
PR #185:

- **C1, #185:** Epic 5 (deferred, blocked) added with four deferred stories, each marked
  `Dependency: blocked on ui-toolkit release > 0.5.0`; the overview, the coverage map and the
  graph state that it is outside the dispatch set; AR-17 carries architecture AD-14.
- **C2, checksum gate:** Story 2.1 tests both release shapes (`"absent"` for `0.5.0`,
  `"matched"` for a later version) and the `[checksum]` refusals; Story 2.2 adds the
  `releaseChecksum` cases to the `manifest` group.
- **C3, readiness F1:** Story 1.1 runs `make start`, then `make install`, then confirms the
  toolkit in the dev container before `make lint-licenses`; later stories rely on it.
- **C4, F2 and F3:** Story 4.1 checks the bump recipe word for word against architecture
  section 17.1, and the register row by row against architecture section 12 and PRD FR-12.
- **C5, F4:** Story 1.1 adds one `CONTRIBUTING.md` sentence, not a list entry.
- **C6, F5:** Story 2.1 names `readPackagePin()` and `compareStatements()`.
- **C7, F7:** Story 3.1, the PR stage and EQ3 use the asserted 0.84 median and the escalation
  route.
- **C8, F8:** Story 4.1 records the Dependabot risk in ADR-016; the PR stage records the
  evidence and the post-merge check.
- **C9, F9:** four commit points instead of seven, with the hook load stated in the Story
  Conventions.
- **Parser check:** the dispatchable headings are unchanged, so bmalph still reads 7 stories;
  the Epic 5 headings match neither bmalph pattern.

Adversarial validation 2 (2026-09-29, `validate-epics-stories` after correction pass 1),
checked against ui-toolkit #185's merged source and the installed v0.5.0 build:

- **A2-1, register:** `ui-container` was kept local on a false R3; its one v0.5.0 difference
  is the prohibited `aria-label` (R12), which #185 drops. Deferred 5.5 is added, so Epic 5
  now holds five deferred stories.
- **A2-2, over-claim:** Deferred 5.3 treated the footer as adoptable, but the `crm` variant
  renders its link labels without `inheritTheme` (R2); 5.3 is now also blocked upstream, and
  5.4 names the same gap for `UiForm`'s title and error banner.
- **A2-3, pin bump:** Story 2.1's pin test no longer hard-codes `0.5.0`, and Deferred 5.1's
  diff names the ADR edit that the ADR drift gate requires for a `dependencies` change.
- **A2-4, import rule:** the Epic 5 introduction scopes the import-rule amendment each swap
  needs (a component subpath's `default` export).
- **Checked, no change:** headers `## Epic N:` and `### Story N.M:` on Epics 1 to 4 only;
  bmalph reads 7 stories with 0 warnings; the dispatch set, the coverage map (18 of 18 FRs,
  20 of 20 NFRs) and the four commit points are unchanged.

Correction pass 2 (2026-09-29), after `implementation-readiness` iteration 2:

- **D1, readiness N1 (major):** Story 2.1 and Story 2.2 now require the three-line
  `@jest-environment node` block docblock and name all three new test files; the
  `// @jest-environment node` line form they required is ignored by Jest 30, so the tests
  would have run in the jsdom-fetch environment with the criterion met word for word.
- **D2, N2:** Story 4.1 takes the 11 upstream statuses from architecture section 13.
- **D3, N3:** Story 3.1 is also dependent on Story 2.2, for commit grouping, and the dependency
  graph states that document order binds; the old "either order" sentence is gone.
- **D4, N4:** architecture section 14.1 now lists Story 4.3's PR draft; the story is unchanged.
- **Parser check:** the headings are unchanged, and each `Dependency:` line keeps the
  `dependent on Story N.M[, ...]` form, so bmalph still reads 7 stories.

Correction pass 3 (2026-09-29), after `implementation-readiness` iteration 3:

- **E1, R3-1:** Story 4.1 still takes follow-up 11 from architecture section 13, which now
  records the existing v0.5.0 attestation; its provenance criterion bounds what the docs may
  claim for that attestation.
- **E2, R3-2:** the Story Conventions, NFR-17 and Stories 1.1 and 2.2 state one comment rule:
  no new comment, and exactly two existing comments amended to stay true (architecture
  section 16).
- **Parser check:** headings and `Dependency:` lines are unchanged; bmalph still reads 7
  stories.

## Open Questions

- **EQ1:** should Story 2.1 and Story 2.2 merge into one story, as the architecture's single
  "provenance" commit does?

  > Assumption: no. The refresher comes first because the real-repository pin test reads the
  > committed manifest, and splitting keeps each commit reviewable. Each story is green alone.

- **EQ2:** should the no-regression CI evidence be its own story?

  > Assumption: no. It is part of Story 3.1's acceptance criteria, because the seam is the only
  > change that can move it, and the pull-request stage records the numbers.

- **EQ3:** the PRD's Q1 (profile mobile floor 0.85 against the enforced 0.84) is carried over
  unchanged.

  > Assumption: corrected in correction pass 1 (readiness F7). The asserted 0.84 median binds
  > Story 3.1 and the pull-request stage as the CI floor, the profile's 85 is reported beside
  > it, and a median in `[0.84, 0.85)` follows the PRD NFR-8 escalation route; neither
  > Lighthouse config nor the profile is edited.

- **EQ4:** the implement stage commits each story through the hook, while the user's standing
  rule is to commit and push only on approval.

  > Assumption: commits made by the approved implement stage are in scope, at the four commit
  > points only; pushing and opening the pull request are not, and wait for the user's
  > approval in `/fe-sdlc-finish-pr`.

- **EQ5:** should the stories adopt the ui-toolkit #185 opt-ins now, since #185 says it
  "unblocks crm#250"?

  > Assumption: no. #185 is merged to the toolkit's `main` but unreleased; this change installs
  > v0.5.0 (architecture AD-14). The adoption is the deferred Epic 5, blocked on a toolkit
  > release above 0.5.0 and outside this dispatch set.
