---
status: 'complete'
workflowType: 'run-summary'
project_name: 'crm'
date: '2026-09-29'
issue: 250
corrected: '2026-09-29 (pass 1; adversarial validation 2; readiness 2; pass 2; readiness 3; pass 3)'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/250'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/pull/185'
  - 'specs/250-ui-toolkit/planning-artifacts/research-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/brief-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/prd-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/architecture-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/epics-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/readiness-250-ui-toolkit-2026-09-29.md'
---

# Run Summary: #250 ui-toolkit installation

## Task Framing

- **Issue:** [#250](https://github.com/VilnaCRM-Org/crm/issues/250), "Wire @vilnacrm/ui-toolkit
  into CRM". Its "blocked" premise is stale: CRM already runs React 19.2.8, MUI 9.4.0, i18next
  26 and react-i18next 17, which satisfy every toolkit peer.
- **Scope set by the product owner:** "we do not want to create new modules/components for now,
  we can do the ui-kit installation". #250 is therefore an installation. It covers:
  - the pinned v0.5.0 release tarball;
  - narrow, reviewed policy edits for each gate the dependency trips;
  - a sha256 provenance manifest with `make lint-ui-toolkit` / `make update-ui-toolkit`;
  - Jest ESM wiring;
  - ADR-016 and docs;
  - consumption only through existing, provably identical seams.
- **Out of scope:**
  - new modules, components, `UI*` primitives or adapters;
  - the toolkit `styles.css` and fonts;
  - `UiThemeProvider`;
  - filing upstream issues or PRs.
- **Workspace:** `/home/dima/Desktop/crm-worktrees/250-ui-toolkit`, branch
  `feat/250-ui-toolkit` off `origin/main` 4689eca6. BMAD `planning_artifacts` is
  `specs/250-ui-toolkit/planning-artifacts`.
- **Mode:** autonomous. Decisions are recorded inline as `> Assumption:` lines. The planning
  stages write specs only, with no production code, tests, configs or Makefile edits. No heavy
  local suites run.

> Assumption: the only toolkit seam adopted is `src/components/ui-breakpoints`, through the named
> exports `crmBreakpointsTheme` and `heightBreakpoints`. `ui-color-theme` stays CRM-local
> because `crmColorTheme` is a superset palette with a different `success` colour. See section 4
> of the research artifact.

## Bundle

- **Directory:** `specs/250-ui-toolkit/planning-artifacts/` in the worktree
  `/home/dima/Desktop/crm-worktrees/250-ui-toolkit` (branch `feat/250-ui-toolkit`, untracked
  until Story 1.1's commit).
- **Artifacts, in chain order:**
  1. [research](./research-250-ui-toolkit-2026-09-29.md)
  2. [brief](./brief-250-ui-toolkit-2026-09-29.md)
  3. [PRD](./prd-250-ui-toolkit-2026-09-29.md)
  4. [architecture](./architecture-250-ui-toolkit-2026-09-29.md)
  5. [epics and stories](./epics-250-ui-toolkit-2026-09-29.md)
  6. [readiness report](./readiness-250-ui-toolkit-2026-09-29.md)
  7. this run summary
- **Status:** every artifact carries `status: 'complete'` in its frontmatter.
- **Not produced:** a UX design artifact. The change has no user-facing surface; readiness
  section 4 records UX as not applicable.

## Subagent Execution Log

| Phase       | BMAD command             | Artifact                                         |
| ----------- | ------------------------ | ------------------------------------------------ |
| 1. Analysis | technical-research       | research note: crm-state (inline input)          |
| 1. Analysis | technical-research       | research note: toolkit (inline input)            |
| 1. Analysis | technical-research       | research note: website (inline input)            |
| 1. Analysis | technical-research       | research note: gates (inline input)              |
| 1. Analysis | analyst                  | `research-250-ui-toolkit-2026-09-29.md`          |
| 1. Analysis | create-brief             | `brief-250-ui-toolkit-2026-09-29.md`             |
| 1. Analysis | validate-brief           | brief validated: 9 findings fixed                |
| 2. Planning | create-prd               | `prd-250-ui-toolkit-2026-09-29.md`               |
| 2. Planning | validate-prd             | PRD validated: 16 findings fixed                 |
| 3. Solution | create-architecture      | `architecture-250-ui-toolkit-2026-09-29.md`      |
| 3. Solution | validate-architecture    | architecture validated: 12 defects fixed         |
| 3. Solution | create-epics-stories     | `epics-250-ui-toolkit-2026-09-29.md`             |
| 3. Solution | validate-epics-stories   | epics validated: 7 findings fixed                |
| 3. Solution | implementation-readiness | `readiness-250-ui-toolkit-2026-09-29.md` (PASS)  |
| 3. Solution | correction pass 1        | research, brief, PRD, architecture, epics fixed  |
| 3. Solution | validate-arch + epics 2  | adversarial round 2: 9 defects fixed             |
| 3. Solution | implementation-readiness | iteration 2: FAIL (1 major, N1); F1-F9 resolved  |
| 3. Solution | correction pass 2        | N1 to N5 fixed: architecture, epics, research    |
| 3. Solution | implementation-readiness | iteration 3: PASS (0/0/2 minor/1 info); N1-N5 ok |
| 3. Solution | correction pass 3        | R3-1, R3-2 fixed at source; readiness follow-up  |
| 4. Handoff  | run-summary (finalize)   | `run-summary-250-ui-toolkit-2026-09-29.md`       |

## Stage Notes: create-prd

- **Artifact:** [PRD](./prd-250-ui-toolkit-2026-09-29.md), 18 FRs and 20 NFRs, each with
  acceptance criteria and a verification method (make target plus CI workflow / job).
- **Issue #250 trace:** C1 (upgrade) satisfied pre-existing; C2 (pinned tarball) satisfied;
  C3 (replace primitives) partial, one seam, the rest deferred with the research reasons;
  C4 (fonts) deferred on the Lighthouse `totalSizeBytes` budget; C5 (adapters) satisfied by
  preservation, since no primitive is replaced.
- **NFRs:** coverage 100, mutation `break` 100, zero lint, `tsc`, jscpd, metrics,
  depcruise, markdownlint and visual ceilings, 0 ratchet relaxations, eager raw 470,000 B
  unchanged with no eager toolkit import, gzip budgets, Lighthouse floors, a11y, supply
  chain, and a required CI check list (NFR-20).

> Assumption: the profile's `lighthouse_mobile: 85` and the enforced mobile performance
> assertion 0.84 disagree; #250 lowers neither, and reconciling them is out of scope (PRD Q1).
>
> Assumption: `make update-ui-toolkit` refuses to write when the installed version differs
> from the pinned URL version (PRD FR-9).
>
> Assumption: ADR-016 stays with #250; no open PR adds a `docs/adr/016-*` file (re-verified
> 2026-09-29).

## Stage Notes: validate-prd

- **Artifact:** [PRD](./prd-250-ui-toolkit-2026-09-29.md), fixed in place; its section 15 holds
  the validation record. Result: pass after 16 fixes. Checked against the brief, the research,
  issue #250 and the live worktree (workflows, `Makefile`, Lighthouse configs, profile, budgets).
- **Traceability:** every issue checkbox (C1 to C5) and, newly, every body directive (D1 to D5)
  maps to an FR; every brief goal, metric, constraint and risk maps to a requirement; an orphan
  check confirms FR-1 to FR-18 and NFR-1 to NFR-20 each trace back.
- **Thresholds and suppressions:** nothing is lowered. NFR-8 then bound the stricter profile
  mobile floor 0.85 over the enforced 0.84 (superseded in correction pass 1, which restates the
  asserted 0.84 and adds an escalation route). NFR-5 lists every suppression artifact at 0.
- **Scope:** still no new component, module, `UI*` primitive or adapter; five brief non-goals
  were added to the PRD's Out of Scope.
- **Gates:** NFR-4 gained `lint-prettier` and `lint-shell`; FR-17 gained the stale
  `SECURITY.md` lockfile claim and the Copilot quality-gate paragraph; NFR-13 pins the
  Dockerfiles unchanged; NFR-20 now names every PR check by its real check-run name.

> Assumption: where `.claude/react-sdlc.yml` (`lighthouse_mobile: 85`) and
> `lighthouserc.mobile.js` (0.84) disagree, the stricter value binds #250, and the CI assertion
> stays unedited (PRD NFR-8, Q1). Superseded in correction pass 1 (readiness F7).
>
> Assumption: `make perf-budget` is local-only; CI byte evidence comes from
> `bundle size / measure and gate` and `bundle size / PR report` (PRD NFR-6, NFR-7).
>
> Assumption: `make update-ui-toolkit` writes an `artifacts` list sorted by `path` and is tested
> only with an injected fetch (PRD FR-9).

## Stage Notes: create-architecture

- **Artifact:** [architecture](./architecture-250-ui-toolkit-2026-09-29.md): 13 decisions
  (AD-1 to AD-13), the ADR-016 outline, a file-level plan (13 added, 14 after correction pass 2;
  18 modified; the rest listed as unchanged), a test strategy, bundle analysis, rollback and a
  CI evidence plan.
- **Seam:** `ui-breakpoints` imports `crmBreakpointsTheme` and `heightBreakpoints` by name and
  re-exports them as `export const` plus `export default`; no comment, no function, zero
  mutants. `ui-color-theme` and every other primitive stay CRM-local (reason codes R1 to R9;
  R10 and R11 were added in correction pass 1).
- **Jest:** only `jest.config.ts` changes (subpath mapper, transform-allowlist entry, coverage
  inclusion); `jest.mutation.config.ts` inherits them, proven by every Stryker dry run.
- **Lockfile gate:** two exact, package-bound fixed-string tokens are stripped by a POSIX `awk`
  pass before the unchanged URL scan, so the same URL under another package, a lookalike host,
  a wrong tag, a git spec and a URL appended after the token all still fail (6 new fixtures).
- **Provenance:** `scripts/ci/ui-toolkit/` holds four injected classes and a constants module;
  two thin CLIs back `make lint-ui-toolkit` (in `make lint` and `CI_LINT_TARGETS`, after
  `lint-licenses`) and `make update-ui-toolkit` (networked, in neither list). The verifier has
  seven failure classes and walks the whole package root for extra files.
- **Bundle:** 0 B eager; about +17 B gzip per async copy of the seam, at most six copies.
- **Validation:** four gaps in the PRD were closed here (package-bound lockfile token, whole-root
  extra-file walk, five pin statements instead of four, a sixth async chunk).

> Assumption: the lockfile exception is a fixed-string token, and the anchored,
> backreference-based version regex lives in the verifier, because POSIX ERE has no portable
> backreference.
>
> Assumption: the manifest adds one field website lacks, `tarballSha256`; only
> `make update-ui-toolkit` derives it, and the offline gate checks its shape.
>
> Assumption: the PRD's optional `CC0-1.0` pass case in `check-licenses.test.ts` is declined:
> that file's allowlist is a fixture, so the case would prove nothing about the Makefile.
>
> Assumption: the refresher does not unpack the tarball to cross-check its contents; that would
> need a tar reader, which is beyond an installation.
>
> Assumption: ADR-016 lands as `Approved`, matching ADR-010 to ADR-015.

## Stage Notes: validate-architecture

- **Mode:** adversarial review of the
  [architecture](./architecture-250-ui-toolkit-2026-09-29.md). Every claim was checked against
  the worktree and the installed v0.5.0 package. Scratch probes ran in the session scratchpad
  or in a deleted `node_modules/.cache` folder; no repository file other than these specs
  changed.
- **Findings: 12 defects, all fixed in place** (architecture section 21.4):
  - 3 PRD inconsistencies:
    - FR-4 and NFR-13 said "whole-line" with 5 fixtures, now package-bound prefix tokens with
      6 must-fail fixtures and 1 must-pass;
    - FR-10, NFR-19 and J3 said four pin surfaces, now five;
    - FR-8 named `main()`, now injected classes with `run()`.
  - 2 false claims:
    - "Stryker runs the seam test in every shard" is wrong under `enableFindRelatedTests`;
    - unit ts-jest was called transpile-only.
  - 2 verifier hardenings:
    - `ARTIFACT_PATH_PATTERN` now rejects `.` and `..` segments;
    - symlinks and other non-regular entries are `extra` and are never followed.
  - 2 forgotten Makefile details: the `.PHONY` entries, and `SCAFFOLD_VERIFY_TARGETS` staying
    unedited.
  - 1 test-typing trap: `lint-tsc` infers `.mjs` constructor shapes, so an extra fake key is
    TS2353.
  - 2 unanalysed risks: the Trivy/SBOM stop rule, and the Storybook and dependency-cruiser
    resolution of the exports-only subpath.
- **Confirmed by probe:**
  - Seam values: 310 leaves, 0 differences; identity `toBe` passes.
  - `tsc` passes, and a `551` must-fail probe fails.
  - ESLint gives 0 findings, and the scratch Jest run with the proposed mapper and transform
    is green.
  - `enhanced-resolve` with the dependency-cruiser options resolves the subpath.
  - Lockfile token strip: 0 rogue URLs on the real lock and 4 of 4 rogue lines caught, under
    GNU and busybox `awk`.
  - The anchored release regex rejects 6 of 6 lookalikes.
  - The 331 digests equal website's manifest; the install has 0 symlinks.
  - gitleaks v8.30.1 finds nothing in the manifest shape, and Prettier accepts it.
  - CODEOWNERS already covers `/config/`, `/scripts/` and `/Makefile`.
- **Not re-litigated:** AD-1 to AD-13 stand. No new module, component or `src` file was
  introduced.
- **Carried forward:** the brief still says "four" pin surfaces, "5 of 5" fixtures and
  `main()` (lines 219, 231, 267, 297, 328). It is an upstream input and was not edited here;
  the PRD and the architecture now bind. Fixed at the source in correction pass 1.

> Assumption: a Trivy or SBOM error on the tarball-URL entry is a stop-and-escalate blocker
> whose remedy is an upstream registry publish; it is never suppressed (architecture
> section 19).
>
> Assumption: the three new test files (`tests/unit/scripts/ui-toolkit-integrity.test.ts`,
> `tests/unit/scripts/ui-toolkit-checksums.test.ts` and
> `tests/unit/tooling/ui-toolkit-pin.test.ts`) start with the three-line
> `/** @jest-environment node */` block docblock, never the `//` line form, which Jest 30
> ignores (corrected in correction pass 2, readiness N1). The mutation config excludes
> `tests/unit/scripts/` and `tests/unit/tooling/`, so the Stryker node-environment variant is
> not needed.

## Stage Notes: create-epics-stories

- **Artifact:** [epics and stories](./epics-250-ui-toolkit-2026-09-29.md), 4 epics and 8
  stories, headers in the bmalph form `## Epic N:` / `### Story N.M:`. The bmalph story parser
  reads all 8 stories with 0 warnings and 5 to 13 acceptance criteria each.
- **Epics:**
  1. Contributors install the pinned toolkit with every supply-chain gate still closed
     (Story 1.1 `CC0-1.0`; Story 1.2 dependency commit plus the lockfile tokens and fixtures).
  2. Maintainers can prove, offline, that the installed toolkit is the pinned release
     (Story 2.1 refresher, manifest and pin test; Story 2.2 verifier and `make lint-ui-toolkit`).
  3. CRM screens read their breakpoints from the toolkit with no visible change (Story 3.1:
     Jest wiring, the one-file seam, the identity test and every no-regression lane).
  4. Reviewers and contributors find every decision documented (Story 4.1 ADR-016 and
     `docs/ui-toolkit.md`; Story 4.2 five doc-sync surfaces; Story 4.3 the PR evidence record).
- **Dependencies:** 1.1 then 1.2; Epic 2 and Epic 3 both follow 1.2 and are independent of each
  other; Epic 4 follows 2.2 and 3.1, because the docs name `make lint-ui-toolkit` and the seam.
- **Coverage:** 18 of 18 FRs, 20 of 20 NFRs and the architecture requirements AR-1 to AR-16
  each map to at least one story; the map is in the epics document.
- **Scope:** no story adds a component, module, `UI*` primitive, adapter or `src/` directory;
  the `src/` diff is one file (Story 3.1).

> Assumption: the architecture's four commit groups are split into 8 stories, keeping their
> order, so each commit is green on its own under the Husky `git add -A` hook.
>
> Assumption: Story 2.1 (refresher and manifest) precedes Story 2.2 (verifier), because the
> real-repository pin test reads the committed manifest. Story 2.1 therefore also asserts the
> per-statement drift cases against `UiToolkitPinSource` and a link case against
> `UiToolkitInstallSource`, so global coverage stays 100% before the verifier lands.
>
> Assumption: `CONTRIBUTING.md` (FR-17 surface 3) moves into Story 1.1 and ADR-013 (surface 4)
> into Story 1.2, next to the gate edits they describe; Story 4.2 syncs the other five surfaces.
>
> Assumption: the no-regression CI evidence (bundle, Lighthouse, axe, visual, e2e, Storybook) is
> part of Story 3.1's acceptance criteria, and Story 4.3 records the numbers in the PR.

## Stage Notes: validate-epics-stories

- **Artifact:** [epics and stories](./epics-250-ui-toolkit-2026-09-29.md), validated against
  the [PRD](./prd-250-ui-toolkit-2026-09-29.md) and the
  [architecture](./architecture-250-ui-toolkit-2026-09-29.md) and fixed in place. It now holds
  4 epics and 7 stories, plus a pull-request stage that is not a Ralph story. The notes above
  that name 8 stories are superseded.
- **Findings, each fixed:**
  1. Forward safety: the old Story 1.1 (`CC0-1.0`) could not be committed alone. The worktree
     already carries the toolkit, `scripts/ci/check-lockfile-registries.sh` exits 1 on it
     (measured), and the Husky hook runs `make lint` after `git add -A`. The old Stories 1.1
     and 1.2 are merged into one Story 1.1, as architecture commit group 1 already said.
  2. Coverage: Story 2.1 now tests the builder's `[pin]` refusal and the first generation with
     no manifest, both branches the 100% gate needs in that story's own commit.
  3. FR-10: a missing and a doubled `TOOLKIT_URL` gate literal are now drift cases.
  4. FR-8: the `install` group covers another installed version, and the `pin` group has
     explicit cases.
  5. Completability: the old Story 4.3 needed a pushed branch and finished CI. It now drafts the
     PR title and body in
     `specs/250-ui-toolkit/implementation-artifacts/pr-description-250-ui-toolkit.md`, and
     opening the PR and filling the evidence moved to a pull-request stage run by
     `/fe-sdlc-finish-pr`.
  6. Testability: Story 3.1 now states the production build, the Lighthouse resource-summary
     assertions, the eager-closure probe (NFR-6) and the Jest-before-seam order.
  7. Dependency marks: `Dependency: independent` or `dependent on Story N.M`, the keywords the
     implement stage dispatches on.
- **Dependencies:** 1.1 -> 2.1 -> 2.2 -> 3.1 -> 4.1 -> 4.2 -> 4.3 -> pull-request stage, in
  document order, one at a time. Story 3.1 is also dependent on Story 2.2 for commit grouping
  (correction pass 2, readiness N3); it had read "either order" before. The seam and its Jest
  wiring share Story 3.1, wiring first.
- **Parser check:** bmalph `parseStoriesWithWarnings` reads 7 stories with 0 warnings and 5 to
  15 acceptance criteria each.
- **Coverage:** 18 of 18 FRs, 20 of 20 NFRs and AR-1 to AR-16 map to a story; FR-15 and
  NFR-20 finish in the pull-request stage.
- **Lint:** Prettier reports the file unchanged; `markdownlint-cli2` and the repository
  `markdownlint` (with the ignore file bypassed) report 0 issues; no line exceeds 100
  characters.

> Assumption: the untracked `specs/250-ui-toolkit/` folder is swept into Story 1.1's commit by
> the hook's `git add -A`; that is accepted, because every earlier `specs/*` folder is tracked.
>
> Assumption: the implement stage commits each story through the hook, which runs `make lint`
> and `make test-unit-all`; that is the hook's run, never bypassed. Pushing and opening the PR
> wait for the user's approval in `/fe-sdlc-finish-pr`.
>
> Open question: none blocking. EQ4 in the epics document records the commit versus push
> boundary.

## Stage Notes: implementation-readiness

- **Artifact:** [readiness report](./readiness-250-ui-toolkit-2026-09-29.md), iteration 1 of 5,
  architect (Winston) in Validate mode over the brief, research, PRD, architecture and epics.
- **Coverage:** 18 of 18 FRs, 20 of 20 NFRs and AR-1 to AR-16 have a delivering story; no
  forward dependency; the epics are actor outcomes, not technical layers.
- **Repository spot-check:** the pin lines, the installed package facts, the seam values and
  its 21 importers, the Jest and mutation configs, the Makefile and Bats line references, the
  lockfile gate arms, the ratchet extractor, the docs-gate ignores and ADR numbering all match
  the worktree.
- **Findings:** 0 critical, 0 major, 8 minor, 1 info. The minors are absorbed in place by the
  named stories (readiness section 9.1): `make install` before the license gate (F1), the bump
  recipe (F2), the register names (F3), the missing SPDX list in `CONTRIBUTING.md` (F4), the
  pin-source method split (F5), superseded brief counts (F6), a noise route for the mobile
  floor (F7), and the unverified Dependabot behaviour (F8).
- **Verdict:** PASS.

> Assumption: the minor findings are handled inside Stories 1.1, 2.1 and 4.1 and the
> pull-request stage rather than by another planning iteration; none changes a requirement.

## Stage Notes: correction pass 1

- **Trigger:** two inputs the bundle missed. First, ui-toolkit PR #185 (closes ui-toolkit #184,
  "Unblocks VilnaCRM-Org/crm#250") merged to the toolkit's `main` at 2026-09-28T23:36Z, after
  v0.5.0 was released; v0.5.0 is still the latest release, the 0.5.0 release PR (#182) is still
  open, and no newer tag exists. Second, the readiness findings F1 to F9.
- **Decision:** install the latest released version, v0.5.0, now; neither wait for the next
  release nor pin the toolkit's unreleased `main`. Every piece is designed so the next release
  is a pin bump (architecture AD-14, epics AR-17).
- **#185 applied across the bundle:**
  - research section 12 (new addendum) records what #185 adds and what it leaves;
  - the checksum gate gains `releaseChecksum` and a `.sha256` cross-check that records
    `"absent"` for v0.5.0 (verified: the release lists only the tarball) and requires
    `"matched"` for every later pin, enforced offline through a frozen
    `RELEASES_WITHOUT_CHECKSUM = ['0.5.0']` (architecture 9.1 to 9.5, PRD FR-7 to FR-9);
  - the Jest subpath mapper keeps working when the `default` condition arrives and becomes
    removable after the bump; `transformIgnorePatterns` and the `.mjs` transform stay
    (architecture 6.3, PRD FR-3);
  - the keep-local register gains R10 (contained `UiButton` has no `:focus-visible` outline)
    and R11 (CRM's `section[aria-label]` skeleton) and an "After #185" column: `ui-typography`
    and `ui-footer` become adoptable after the next release; `ui-button` and `ui-form` stay
    local on R10; the skeletons stay local on R11; `ui-container` stays local on R3, because
    #185 only drops its `aria-label` (superseded by adversarial validation 2: R3 never applied
    to the container, so it is adoptable, and `ui-footer` stays local on R2);
  - epics Epic 5 (deferred, blocked) holds four deferred stories, each
    `Dependency: blocked on ui-toolkit release > 0.5.0`, outside the dispatch set, with
    headings bmalph does not parse;
  - PRD section 4 marks issue checkbox C3 "replace CRM-local primitives" as partly met, with
    the remainder deferred for that reason;
  - the ADR-016 outline gains a sixth considered option, a driver, a negative consequence, a
    reversal trigger and the #185 link.
- **Readiness findings, each fixed at its source:**
  - F1: Story 1.1 runs `make start`, then `make install` (`bun install --frozen-lockfile` in
    the dev container, then `make husky`; the target exists at `Makefile:947`), then confirms
    the toolkit in the dev container before `make lint-licenses`; the verifier's stale-volume
    remedy is `make install`.
  - F2: architecture 17.1 is the one binding bump recipe, in the bare-URL `bun add` form that
    the toolkit's CONSUMING.md and `website`'s docs use; PRD J3, the brief and Story 4.1 defer
    to it.
  - F3: architecture section 12 is the single union register; PRD FR-12 and Story 4.1 match
    it row by row.
  - F4: `CONTRIBUTING.md` gains one sentence beside its `ALLOWED_LICENSES` pointer; no list.
  - F5: `UiToolkitPinSource.readPackagePin()` (statement 1, refresher) and
    `compareStatements()` (all five, verifier and pin test); the five statements are
    enumerated once in AD-9 and counted the same everywhere.
  - F6: the brief and research counts were corrected upstream (five statements, 6 must-fail
    plus 1 must-pass fixtures, classes with `run()`, the unit ts-jest mode), not only noted.
  - F7: PRD NFR-8 restates the asserted mobile floor from `lighthouserc.mobile.js` (0.84,
    `median-run` over 3 runs) instead of binding the profile's 85, and adds an escalation
    route for runner noise; nothing is raised or lowered.
  - F8: `.github/dependabot.yml` has no `ignore` or `allow` list; the risk that the `bun`
    updater fails its weekly job on a tarball-URL entry is brief R14, research risk 11, an
    ADR-016 negative consequence and a post-merge check. Evidence: three `bun` Dependabot
    update jobs succeeded against `website`'s `main` two minutes after its #459 merged; no
    weekly scan has run yet.
  - F9: four commit points instead of seven, with the Husky hook load (`make format`,
    `make lint`, `make test-unit-all` per commit) stated; never `--no-verify`.
- **Parser check:** bmalph `parseStoriesWithWarnings` still reads 7 stories with 0 warnings;
  Epic 5 is not parsed.
- **Not edited:** the readiness report (iteration 1 stays the record of what it found).

> Assumption: the correction pass edits the upstream brief and research in place, because
> readiness F6 asked for the stale counts to be fixed rather than carried forward.

## Stage Notes: adversarial validation 2

- **Commands:** `validate-architecture` and `validate-epics-stories`, adversarial, after
  correction pass 1. Checked against `gh pr view 185 -R VilnaCRM-Org/ui-toolkit` and its
  merged source (`crm-footer.tsx`, `form-parts.tsx`, `ui-container`, `ui-theme.ts`,
  `ui-typography`, `release-provenance.yml`, `package.json`, CONSUMING.md), the installed
  v0.5.0 build, the `Makefile`, both `lighthouserc` files, both repositories'
  `.github/dependabot.yml`, `config/docs-policy.json`, `CONTRIBUTING.md` and CRM's own
  `ui-container`, `ui-footer` and `ui-typography`.
- **Defects fixed in place (9):**
  1. `ui-container` was kept local on R3, but v0.5.0 `UiContainer` reads only `md`, `lg` and
     `xl` (768, 1024, 1440, as in CRM) with CRM's styles and props; its one difference is the
     prohibited `aria-label`, which #185 drops. New register reason R12; adoptable after the
     bump as Deferred 5.5 (architecture 12, 12.1; PRD FR-12, section 4; brief; research 3.4).
  2. `ui-footer` was marked adoptable, but the `crm` variant renders its link labels through
     `UiTypography` without `inheritTheme`, so the kit `body1` font family replaces `Golos`;
     it stays local on R2 and Deferred 5.3 is also blocked upstream.
  3. `UiForm`'s title and error banner have the same gap; `ui-form` lists R2 beside R10, and
     Deferred 5.4 names it.
  4. Research still said the footer's breakpoints were not diffed; they equal CRM's in v0.5.0.
  5. The pin test asserted a literal `0.5.0`, so every bump would edit a test; it now compares
     with the manifest's `version` (architecture 15.4, PRD FR-10, Story 2.1).
  6. The bump recipe's "exact" diff omitted the docs version and the ADR edit that the ADR
     drift gate (`architectureDrift.manifestKeys: ["dependencies"]`) requires; architecture
     17.1 and Deferred 5.1 now agree.
  7. Every Epic 5 swap imports a component subpath's `default` export, which the documented
     import rule forbids; the amendment is scoped per subpath (architecture 12.1, Epic 5).
  8. #185 set the toolkit `main`'s version to `0.5.0`, so a `main` build self-reports the
     release version; recorded in AD-14 and research 12.1.
  9. Register reason codes R10 to R12 collide with the brief's risk IDs; both registers now
     say the codes are register-local.
- **Confirmed, no change:** `.sha256` format and v0.5.0's single `.tgz` asset, release PR
  #182 open, `make install` at `Makefile:947`, the 17-target `lint:` aggregate, the 0.84
  `median-run` mobile assertion against the profile's 85, no Dependabot `ignore` or `allow`
  list in either repository, the Epic 5 headings outside bmalph's patterns, and 18 of 18 FRs
  and 20 of 20 NFRs mapped.

## Stage Notes: implementation-readiness iteration 2

- **Artifact:** [readiness report](./readiness-250-ui-toolkit-2026-09-29.md), overwritten as
  iteration 2 of 5, architect (Winston) in Validate mode over all six artifacts.
- **Iteration-1 findings:** F1 to F9 are all resolved at their source; none reopens.
- **ui-toolkit #185:** reflected identically in all six artifacts (status, the install-v0.5.0
  decision, the checksum gate, the Jest wiring, the register and the deferred Epic 5).
  Re-verified through `gh`: merged 2026-09-28T23:36:34Z, v0.5.0 latest with one `.tgz`
  asset whose recorded digest equals `tarballSha256`, release PR #182 open, toolkit `main`
  at version `0.5.0`.
- **Coverage:** 18 of 18 FRs, 20 of 20 NFRs, AR-1 to AR-17; no forward dependency; one
  existing `src/` file.
- **New findings (N1 to N5):** 0 critical, 1 major, 2 minor, 2 info.
  - N1 (major): `// @jest-environment node` in architecture 15.2, Story 2.1 and the
    validate-architecture assumption below is inert in Jest 30; `jest-docblock` 30.5.0 reads
    only a leading `/** ... */` block (measured: the line form parses to `{}`), and every
    node-scoped precedent in `tests/unit/tooling/` uses the block form. Iteration 1 wrongly
    confirmed a line-form precedent.
  - N2 (minor): upstream follow-up 11 is "open" in research 11 and "partly merged" in
    architecture 13.
  - N3 (minor): the epics' "either order" for Epics 2 and 3 can split commit group 2.
  - N4 (info): Story 4.3's PR draft is outside architecture 14.1.
  - N5 (info): two stale line pointers in architecture 1.2 and 9.7.
- **Verdict:** FAIL, on N1 alone.

> Assumption: N1 is major although the tests would most likely pass in the jsdom-fetch
> environment: the acceptance criterion is met verbatim while its purpose silently fails, and
> an implementer following the story cannot notice it (readiness section 5.1).

## Stage Notes: correction pass 2

- **Scope:** readiness iteration 2's N1 to N5, fixed at their source; the readiness report is
  not edited, and the brief and the PRD needed no change.
- **N1 (major):** architecture 15.2, Stories 2.1 and 2.2, and the validate-architecture
  assumption above now require the three-line `/** @jest-environment node */` block docblock
  and name all three new test files. The measured `jest-docblock` 30.5.0 behaviour is recorded
  in architecture 15.2.
- **N2:** research section 11 item 11 now carries architecture 13's status, "partly merged
  (unreleased)", and its wording (a registry, or a signed digest or attestation); Story 4.1
  names architecture section 13 as the one source of the 11 statuses. PRD section 12 already
  counted "parts of 6, 9 and 11" and is unchanged.
- **N3:** Story 3.1 reads `Dependency: dependent on Story 1.1, Story 2.2` with a commit-grouping
  assumption, and the dependency graph is one chain in document order.
- **N4:** architecture 14.1 lists Story 4.3's PR draft as the fourteenth added file.
- **N5:** architecture 9.7 points at `makefile_targets.bats:475-483`. Architecture 1.2 names the
  `lint-deps` target at `Makefile:494` and its recipe at 495: re-measured on the worktree and on
  `origin/main`, the readiness report's 493 is itself one line off, and the old `:495` named
  the recipe.
- **Records:** architecture 21.7 (21.8 is now Readiness), the epics' correction-pass-2 notes,
  and each edited file's `corrected` frontmatter.

> Assumption: the brief is not edited for N3; it names no story order.

## Stage Notes: implementation-readiness iteration 3

- **Artifact:** [readiness report](./readiness-250-ui-toolkit-2026-09-29.md), overwritten as
  iteration 3 of 5, architect (Winston) in Validate mode over all six artifacts.
- **Earlier findings:** F1 to F9 and N1 to N5 all resolved at their source; none reopens. N1
  re-measured with `jest-docblock` 30.5.0 (line form `{}`, block form
  `{"jest-environment":"node"}`). N5: iteration 2's own `Makefile:493` was wrong; 494 is the
  `lint-deps:` target, as correction pass 2 says.
- **ui-toolkit #185:** consistent in all six artifacts and with the toolkit repository: merged
  2026-09-28T23:36:34Z, v0.5.0 latest with one `.tgz` asset whose digest equals
  `tarballSha256`, release PR #182 open, toolkit `main` at `0.5.0` with a `default` export
  condition, and a `.sha256` written by `sha256sum` in `release-provenance.yml`.
- **Coverage:** 18 of 18 FRs, 20 of 20 NFRs, AR-1 to AR-17; one dependency chain in document
  order; four commit points; one existing `src/` file.
- **New findings (R3-1 to R3-3):** 0 critical, 0 major, 2 minor, 1 info.
  - R3-1 (minor): the pinned v0.5.0 tarball already carries 3 GitHub build-provenance
    attestations from `release-provenance.yml` (ui-toolkit #178), whose v0.5.0 run attested
    the published digest and failed only the asset-replace step; research 11 and architecture
    13 call follow-up 11 "partly merged in #185" and the asset "not an attestation". Story 4.1
    writes the corrected status.
  - R3-2 (minor): the "one amended comment" rule (epics conventions, architecture 7.2 and 16)
    contradicts the Bats ordinal-comment amendment in architecture 9.7 and Story 2.2; the Bats
    amendment is right, because that comment enumerates the exclusions.
  - R3-3 (info): #185's provenance job re-uploads the tarball with `--clobber` and then the
    `.sha256` after publication; Deferred 5.1 should wait for a green run on the new tag (the
    refresher's `[checksum]` refusal is already fail-closed).
- **Verdict:** PASS.

> Assumption: R3-1 and R3-2 are absorbed in place by Stories 4.1 and 2.2 rather than by a
> third correction pass; neither changes a requirement, a gate or a story outcome.
> (Superseded: correction pass 3 fixed both at their source.)

## Stage Notes: correction pass 3

- **R3-1:** follow-up 11 now records the v0.5.0 build-provenance attestation (ui-toolkit
  #178) in architecture 13 (the one source), research 11, the brief and PRD section 12, with
  what it proves: a tag build of the pinned digest, not the asset upload (the job's
  `--clobber` was refused on the immutable release), the installed tree or the lockfile. PRD
  NFR-11 and Story 4.1 bound what the docs may claim for it. Re-verified: the downloaded asset
  hashes to `tarballSha256`; `gh attestation verify` (gh 2.101.0) and
  `gh release verify-asset` pass; of the 3 attestations, 2 are SLSA provenance and 1 is
  GitHub's release attestation.
- **R3-2:** architecture 16 states one comment rule (no new comment; two existing comments
  amended to stay true: the lockfile-gate header and the Bats scaffold-exclusion comment);
  architecture 7.2 and 9.7, the epics' Story Conventions, NFR-17, Stories 1.1 and 2.2, PRD
  NFR-17, the brief and research 7 point to it.
- **Readiness:** section 8, "Iteration 3 follow-up", marks R3-1 and R3-2 resolved and
  sharpens R3-3 (an immutable release may never receive the post-publication `.sha256`);
  the verdict stays PASS.
- **Files:** all six planning artifacts and this run summary; each edited file's `corrected`
  frontmatter names pass 3.

## Validation Rounds per Artifact

- **research:** no dedicated validate command exists for technical research. It was checked
  twice downstream: by `validate-brief` (round 1) and by the readiness spot-check (round 5).
  Correction pass 1 (round 6) corrected its superseded counts in place (readiness F6) and added
  the ui-toolkit #185 addendum (section 12). Correction pass 2 (round 9) aligned upstream
  follow-up 11 with architecture section 13 (readiness N2).
- **brief:** 1 round, `validate-brief`, pass after 9 fixes in place. Correction pass 1 fixed its
  stale counts (five pin statements, 6 must-fail plus 1 must-pass fixtures, classes with
  `run()`), deferred its bump journey to the binding recipe, and added R14.
- **PRD:** 1 round, `validate-prd`, pass after 16 fixes in place (PRD section 15). The
  validate-architecture round fixed 3 more PRD inconsistencies (FR-4, FR-8, FR-10, NFR-13,
  NFR-19, J3). Correction pass 1 applied #185 and F1 to F9 (PRD section 15, "Correction pass
  1").
- **architecture:** 1 round, `validate-architecture` (adversarial), pass after 12 defects
  fixed in place (architecture section 21.4). Correction pass 1 added AD-14 and the items of
  section 21.5. Adversarial validation 2 fixed 7 more (section 21.6). Correction pass 2 fixed
  readiness N1, N2, N4 and N5 (section 21.7).
- **epics and stories:** 1 round, `validate-epics-stories`, pass after 7 findings fixed in
  place. Correction pass 1 added the deferred Epic 5 and commit points; adversarial validation
  2 added Deferred 5.5 and re-blocked 5.3. Correction pass 2 fixed readiness N1 to N3 in
  Stories 2.1, 2.2, 3.1 and 4.1 and in the dependency graph. The bmalph story parser still
  reads 7 stories with 0 warnings.
- **readiness report:** produced by `implementation-readiness`, iteration 1 (PASS); not
  edited by the correction pass; overwritten by iteration 2 (FAIL on N1), which keeps F1 to F9
  as its resolution table, and by iteration 3 (PASS), which keeps F1 to F9 and N1 to N5.

| Round | Command                  | Artifact          | Result                   |
| ----- | ------------------------ | ----------------- | ------------------------ |
| 1     | validate-brief           | brief             | pass, 9 fixes in place   |
| 2     | validate-prd             | PRD               | pass, 16 fixes in place  |
| 3     | validate-architecture    | architecture      | pass, 12 fixes in place  |
| 4     | validate-epics-stories   | epics             | pass, 7 fixes in place   |
| 5     | implementation-readiness | all               | PASS, 0 critical/0 major |
| 6     | correction pass 1        | all but readiness | #185 plus F1 to F9 fixed |
| 7     | validate-arch + epics    | all but readiness | 9 defects fixed in place |
| 8     | implementation-readiness | all               | FAIL, 0 critical/1 major |
| 9     | correction pass 2        | arch, epics, res. | N1 to N5 fixed at source |
| 10    | implementation-readiness | all               | PASS, 0 critical/0 major |
| 11    | correction pass 3        | all               | R3-1, R3-2 fixed, PASS   |

## Readiness Iterations

| Iteration | Verdict | Findings               | Action                              |
| --------- | ------- | ---------------------- | ----------------------------------- |
| 1 of 5    | PASS    | 9 (0/0/8 minor/1 info) | fixed at source (correction pass 1) |
| 2 of 5    | FAIL    | 5 (0/1 major/2/2 info) | fixed at source (correction pass 2) |
| 3 of 5    | PASS    | 3 (0/0/2 minor/1 info) | fixed at source (correction pass 3) |

Iteration 1 passed with no critical or major finding. Correction pass 1 then fixed the eight
minors and the info note at their source, together with ui-toolkit #185, instead of leaving
them to be absorbed inside the stories. Iteration 2 confirmed F1 to F9 resolved and #185
consistent, and failed on one major finding: the inert `// @jest-environment node` pragma
(N1). Correction pass 2 fixed N1 to N5 at their source. Iteration 3 confirmed F1 to F9 and N1
to N5 resolved and passed with two minors (the existing v0.5.0 attestation missing from
follow-up 11, and the comment-rule wording) and one info note on the deferred Epic 5.
Correction pass 3 fixed both minors at their source and recorded it in the readiness report's
"Iteration 3 follow-up"; R3-3 stays an info note on Epic 5.

## Open Questions and Warnings

None blocks implementation. Every question was resolved autonomously and recorded where it
arose; the ones an implementer or reviewer must keep in view are:

- **ui-toolkit #185 (PRD Q5, epics EQ5, architecture AD-14):** merged to the toolkit's `main`
  after v0.5.0 and unreleased. #250 installs v0.5.0; the #185 swaps are the deferred Epic 5,
  blocked on a toolkit release above 0.5.0 and outside this dispatch set.
- **Mobile Lighthouse floor (PRD NFR-8 and Q1, epics EQ3, readiness F7):**
  `lighthouserc.mobile.js` asserts 0.84 as the median of 3 runs, and the profile says 85. The
  asserted 0.84 is the CI floor, the profile's 85 is reported beside it, neither file is
  edited, and a median in `[0.84, 0.85)` (or a red run with no eager change) follows the NFR-8
  escalation route: compare with the latest green `main` run and escalate to the maintainer.
- **Dependabot on a URL dependency (brief R14, PRD NFR-19, readiness F8):** partial evidence
  only. Three `bun` update jobs succeeded against `website`'s `main` after its #459; no weekly
  scan has run yet. ADR-016 names the risk; the first CRM weekly `bun` run after merge is
  checked and a failure is escalated.
- **Trivy / SBOM on the tarball entry (architecture section 19, AR-15):** an error there is a
  stop-and-escalate blocker whose remedy is an upstream registry publish, never a suppression.
- **Commit boundary (epics EQ4, readiness F9):** the user's standing rule is to commit and
  push only on explicit approval. The plan assumes commits made inside an approved
  `/fe-sdlc-implement` run are in scope, at four commit points (after Stories 1.1, 2.2, 3.1
  and 4.3), each through the Husky hook (four full `make lint` plus `make test-unit-all` runs,
  never `--no-verify`); push and PR wait for `/fe-sdlc-finish-pr`. Confirm this before
  starting if the approval does not cover commits.
- **GitHub edits (PRD Q2):** no edit to issue #250 and no upstream issue or PR; the 11 toolkit
  gaps live in research section 11, now with their #185 statuses, and go into
  `docs/ui-toolkit.md` (FR-16).
- **Byte delta (PRD Q3):** settled by the CI `bundle size` comment, not a local build.
- **Dead `src/components/ui-typography/theme.ts` (PRD Q4):** not deleted; recorded as a
  follow-up so the `src/` diff stays one file.
- **Markdown gate scope:** `.markdownlintignore` lists `**/planning-artifacts/`, so
  `make lint-md` never reads this bundle. It was linted directly instead (see below).

> Assumption: the commit-boundary warning is surfaced here instead of being resolved, because
> it depends on the approval the user gives when starting the implement stage.

## Recommended Next Step

Readiness iteration 3 passed. Run
`/fe-sdlc-implement` (bmalph and Ralph, claude-code driver) against
`specs/250-ui-toolkit/planning-artifacts/epics-250-ui-toolkit-2026-09-29.md`, starting at
Story 1.1 with `make start` and `make install` first, then 2.1 -> 2.2 -> 3.1, then 4.1 -> 4.2
-> 4.3, committing only at the four commit points; readiness R3-1 and R3-2 are already fixed
at source (correction pass 3). Epic 5 is not dispatched. After that,
`/fe-sdlc-review`, `/fe-sdlc-qa` and `/fe-sdlc-finish-pr`, which pushes and opens the PR only on
the user's approval.

## Bundle Lint

Run from the worktree root over the six files edited in correction pass 1 and again after
adversarial validation 2, on 2026-09-29 (the readiness report was not edited):

- `bun x prettier --write`: every file formatted.
- `bun x markdownlint --ignore-path /dev/null` (the `make lint-md` binary with the ignore file
  bypassed, reading `.markdownlint.yaml`): 0 issues.
- No line is longer than 100 characters, tables included.
- bmalph `parseStoriesWithWarnings` over the epics: 7 stories, 0 warnings.

Readiness iteration 2 (2026-09-29) rewrote the readiness report and updated this run summary,
and ran the same `bun x prettier --write` and `bun x markdownlint --ignore-path /dev/null`
over both files: 0 issues, no line over 100 characters.

Correction pass 2 (2026-09-29) ran the same `bun x prettier --write` and
`bun x markdownlint --ignore-path /dev/null` over the four files it edited (architecture,
epics, research and this run summary): 0 issues, no line over 100 characters.

Readiness iteration 3 (2026-09-29) rewrote the readiness report and updated this run summary,
and ran the same `bun x prettier --write` and `bun x markdownlint --ignore-path /dev/null`
over both files: 0 issues, no line over 100 characters.

Correction pass 3 (2026-09-29) ran the same `bun x prettier --write` and
`bun x markdownlint --ignore-path /dev/null` over the seven files it edited: 0 issues, no line
over 100 characters.
