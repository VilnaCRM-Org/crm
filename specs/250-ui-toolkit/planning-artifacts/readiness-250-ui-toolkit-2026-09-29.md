---
status: 'complete'
workflowType: 'implementation-readiness'
stepsCompleted:
  - 'step-01-document-discovery'
  - 'step-02-prd-analysis'
  - 'step-03-epic-coverage-validation'
  - 'step-04-ux-alignment'
  - 'step-05-epic-quality-review'
  - 'step-06-final-assessment'
iteration: 3
previousIteration: '2 (FAIL; 0 critical, 1 major, 2 minor, 2 info; N1 to N5)'
project_name: 'crm'
date: '2026-09-29'
issue: 250
author: 'architect (Winston), autonomous run, implementation-readiness in Validate mode'
inputDocuments:
  - 'specs/250-ui-toolkit/planning-artifacts/research-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/brief-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/prd-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/architecture-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/epics-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/run-summary-250-ui-toolkit-2026-09-29.md'
  - 'https://github.com/VilnaCRM-Org/crm/issues/250'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/pull/185'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/pull/182'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/releases/tag/v0.5.0'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/blob/main/.github/workflows/release-provenance.yml'
  - 'CLAUDE.md'
  - '.claude/react-sdlc.yml'
  - '.github/dependabot.yml'
  - '.github/workflows'
  - '.dependency-cruiser.js'
  - 'package.json'
  - 'bun.lock'
  - 'node_modules/@vilnacrm/ui-toolkit/package.json'
  - 'node_modules/jest-docblock'
  - 'jest.config.ts'
  - 'Makefile'
  - 'tests/bats/makefile_targets.bats'
  - 'tests/bats/make-target-coverage.tsv'
  - 'tests/bats/lockfile_registries.bats'
  - 'tests/unit/tooling/image-hardening.test.ts'
  - 'tests/unit/tooling/merge-queue-gates.test.ts'
  - 'tests/unit/tooling/commitlint-gate.test.ts'
  - 'lighthouse/lighthouserc.mobile.js'
  - 'docs/adr'
  - 'CONTRIBUTING.md'
  - 'SECURITY.md'
  - '.claude/skills/quality-standards/SKILL.md'
---

# Implementation Readiness: installing `@vilnacrm/ui-toolkit` into CRM (#250)

**Assessor:** architect (Winston), autonomous BMAD run, `implementation-readiness` in Validate
mode, iteration 3 of 5. **Date:** 2026-09-29.

Inputs: [research](./research-250-ui-toolkit-2026-09-29.md),
[brief](./brief-250-ui-toolkit-2026-09-29.md), [PRD](./prd-250-ui-toolkit-2026-09-29.md),
[architecture](./architecture-250-ui-toolkit-2026-09-29.md) and
[epics and stories](./epics-250-ui-toolkit-2026-09-29.md). Run log:
[run summary](./run-summary-250-ui-toolkit-2026-09-29.md).

Iteration 1 passed with F1 to F9 (8 minor, 1 info). Iteration 2 confirmed them resolved and
failed on one major finding (N1, an inert Jest pragma) plus N2 to N5. Correction pass 2 fixed
N1 to N5 in the architecture, the epics and the research. This iteration re-reads the whole
bundle, re-checks F1 to F9 and N1 to N5, re-checks ui-toolkit PR #185 across the artifacts and
against the toolkit repository, and spot-checks the CRM repository again. Worktree:
`/home/dima/Desktop/crm-worktrees/250-ui-toolkit`, branch `feat/250-ui-toolkit`, head
`4689eca6`, `package.json` and `bun.lock` modified (the toolkit lines only),
`specs/250-ui-toolkit/` untracked.

> Assumption: the workflow's menus and "wait for input" points are skipped. The run is
> autonomous and every step auto-proceeds; decisions are recorded as `> Assumption:` lines.
>
> Assumption: this report overwrites iteration 2 in the orchestrator-named file. Iteration 2's
> findings survive here as the N1 to N5 resolution table (section 3.2) and in the run summary.

## 1. Document Discovery

| Type            | File                                        | Lines | State    |
| --------------- | ------------------------------------------- | ----- | -------- |
| Research        | `research-250-ui-toolkit-2026-09-29.md`     | 783   | complete |
| Brief           | `brief-250-ui-toolkit-2026-09-29.md`        | 483   | complete |
| PRD             | `prd-250-ui-toolkit-2026-09-29.md`          | 1193  | complete |
| Architecture    | `architecture-250-ui-toolkit-2026-09-29.md` | 1600  | complete |
| Epics & stories | `epics-250-ui-toolkit-2026-09-29.md`        | 1342  | complete |
| UX design       | none                                        | -     | n/a      |

- Every document is whole, none is sharded, and each carries `status: 'complete'`; the four
  edited since iteration 2 carry a `corrected` frontmatter entry naming pass 2.
- No UX document exists, correctly: the change renders nothing new (NFR-9, NFR-10).
- Precedence when artifacts disagree is unchanged: architecture, then PRD, then epics for story
  mechanics, then brief and research.

## 2. Assessment

### 2.1 PRD Analysis

- 18 FRs and 20 NFRs, each with acceptance criteria and a named `make` target or CI check. The
  PRD was not edited in correction pass 2 and needed no edit: N1 to N5 lived downstream of it.
- Open questions Q1 to Q5 each carry an assumption; none blocks a story.

### 2.2 Epic Coverage

- FR coverage 18 of 18, NFR coverage 20 of 20, AR-1 to AR-17 all mapped; the coverage map in
  the epics agrees with the delivering stories.
- Dispatch set: Stories 1.1, 2.1, 2.2, 3.1, 4.1, 4.2 and 4.3, then the pull-request stage. The
  Epic 5 headings (`## Epic 5 (deferred, blocked): ...`, `### Deferred 5.N: ...`) do not match
  the bmalph `## Epic N:` and `### Story N.M:` forms, so they cannot be dispatched.
- Architecture 14.1 now lists 14 added files (the fourteenth is Story 4.3's PR draft) and 14.2
  lists 18 modified; every file is owned by exactly one dispatchable story.

### 2.3 UX Alignment

No UX document, and none is implied: the only `src/` change is a value-identical re-export in
`src/components/ui-breakpoints/index.ts`. The no-change obligation is carried by NFR-9,
NFR-10 and Story 3.1's axe, keyboard, visual and e2e criteria. The Figma design check does not
apply.

### 2.4 Epic Quality

- **User value:** each dispatchable epic names an actor outcome; Epic 5 is a deferred record.
- **Dependencies:** one chain, `1.1 -> 2.1 -> 2.2 -> 3.1 -> 4.1 -> 4.2 -> 4.3 -> PR stage`,
  and the epics state that document order binds. Story 3.1 is `dependent on Story 1.1,
Story 2.2`, with the commit-grouping reason recorded. No forward dependency.
- **Sizing and commits:** seven stories, four commit points (after 1.1, 2.2, 3.1 and 4.3), each
  green on its own under the Husky hook, never `--no-verify` or `HUSKY=0`.
- **Acceptance criteria:** Given / When / Then with counts, exact strings and commands, and
  explicit error paths (`[pin]`, `[install]`, `[download]`, `[checksum]`, seven verifier
  classes, six lockfile must-fail fixtures, the scanner stop rule).
- **Scope:** no new module, component, `UI*` primitive, adapter or `src/` directory; the `src/`
  diff is one existing file. The product owner's installation-only constraint holds.

### 2.5 ui-toolkit #185 Consistency

Checked in all six artifacts and re-verified through `gh` for this iteration:

- **Status:** merged to the toolkit's `main` at 2026-09-28T23:36:34Z; v0.5.0 (2026-09-28) is
  the latest release; release PR #182 is open; no newer tag; the toolkit `main` `package.json`
  says `0.5.0`, and its `./*` export now carries `default` beside `types` and `import`. The
  research 12.1, PRD section 1, architecture AD-14, the epics overview and the run summary all
  say so.
- **Decision:** install v0.5.0 now, neither wait nor pin `main`; the next release is a pin bump
  (AD-14, AR-17, PRD Q5, epics EQ5, research 12.2). Consistent everywhere.
- **Checksum gate:** `releaseChecksum` with `"absent"` only for
  `RELEASES_WITHOUT_CHECKSUM = ['0.5.0']` and `"matched"` for later pins; the `.sha256` shape
  (`sha256sum` output, two spaces, asset basename) matches `release-provenance.yml` on the
  toolkit `main`, which writes it with `sha256sum` and uploads it beside the tarball. PRD FR-7
  to FR-9, architecture 9.1 to 9.5, Stories 2.1 and 2.2 and Deferred 5.1 agree case for case.
- **Jest:** the subpath mapper survives the `default` condition and becomes removable after the
  bump; the transform entry stays (PRD FR-3, architecture 6.3, Story 3.1, Deferred 5.1).
- **Register:** PRD FR-12, architecture section 12, the brief and the research name the same
  rows. Adoptable after the bump: `ui-typography` and `ui-container` (R12). Also blocked
  upstream: `ui-footer` (R2), `ui-button` (R10), `ui-form` (R2, R10). Local: the rest.
- **Upstream follow-ups:** research 11 and architecture 13 now carry the same eleven statuses
  (N2 resolved), and Story 4.1 names architecture 13 as their one source. Status 11 is,
  however, inaccurate against the toolkit repository (R3-1).

## 3. Resolution of Earlier Findings

### 3.1 Iteration 1 (F1 to F9)

| ID  | Sev.  | Iteration-1 finding              | Status   | Re-checked in iteration 3            |
| --- | ----- | -------------------------------- | -------- | ------------------------------------ |
| F1  | minor | Story 1.1 used `make start` only | resolved | Story 1.1 steps 1 to 3; FR-1         |
| F2  | minor | J3 recipe differed from 17.1     | resolved | one recipe (arch 17.1); 5.1 matches  |
| F3  | minor | Register names differed          | resolved | union register; FR-12 row for row    |
| F4  | minor | No SPDX list to extend           | resolved | one sentence (FR-5, arch 17.2, 1.1)  |
| F5  | minor | Pin-source API split implicit    | resolved | `readPackagePin`/`compareStatements` |
| F6  | minor | Superseded counts upstream       | resolved | no stale "four", "5 of 5", `main()`  |
| F7  | minor | No 0.84-0.85 median route        | resolved | 0.84 `median-run` x3; profile 85     |
| F8  | minor | Dependabot `bun` behaviour open  | resolved | 3 lanes, no `ignore` or `allow`      |
| F9  | info  | Seven local hook runs            | resolved | four commit points everywhere        |

None reopens. The only strings from F6 that still appear are in records that say they were
replaced (brief 476, research 352 and 450, architecture 21.4).

### 3.2 Iteration 2 (N1 to N5)

| ID  | Sev.  | Iteration-2 finding                 | Status   | Evidence of the fix              |
| --- | ----- | ----------------------------------- | -------- | -------------------------------- |
| N1  | major | `// @jest-environment node` inert   | resolved | arch 15.2; Stories 2.1, 2.2      |
| N2  | minor | Follow-up 11 status disagreed       | resolved | research 11 = arch 13; Story 4.1 |
| N3  | minor | "Either order" split commit group 2 | resolved | Story 3.1 deps; one-chain graph  |
| N4  | info  | PR draft outside the file plan      | resolved | arch 14.1, fourteenth added file |
| N5  | info  | Two stale line pointers             | resolved | arch 1.2 `:494`/495; 9.7 475-483 |

- **N1:** architecture 15.2 prescribes the three-line block docblock for all three new test
  files by path, with the measured parser behaviour; Story 2.1 names its two files and
  Story 2.2 the third; the run summary's assumption matches. Re-measured for this iteration
  with `jest-docblock` 30.5.0 in the worktree: the `//` line form parses to `{}`, the block
  form to `{"jest-environment":"node"}`; `image-hardening.test.ts`,
  `merge-queue-gates.test.ts` and `commitlint-gate.test.ts` all open with the block form.
- **N2:** both lists mark item 11 "partly merged (unreleased)" with the same wording. The two
  artifacts now agree; whether that shared status is right is R3-1.
- **N3:** `Dependency: dependent on Story 1.1, Story 2.2` plus the assumption that the edge is
  commit grouping, not code; the graph reads "Document order binds".
- **N5:** iteration 2's own pointer was wrong. `Makefile:494` is the `lint-deps:` target and
  495 its `depcruise` recipe (re-read); correction pass 2 names both, which is right.
  `makefile_targets.bats:475` holds the "Seven exclusions" sentence and 483 the last line of
  that comment; the exclusion list is 485.

## 4. Repository Fact Spot-Check

### 4.1 Confirmed

Re-read in the worktree, or through `gh`, for this iteration:

- **Pin:** `package.json:14`, `bun.lock:18` and `bun.lock:1476` name the same v0.5.0 URL; the
  1476 entry carries peers and no integrity field.
- **Release:** v0.5.0 has one asset, `vilnacrm-ui-toolkit-0.5.0.tgz`, GitHub digest
  `sha256:bb3d61a6f9d354c38cfa2e4f013a7f07190f4d5df6bbba864ccc2e9476aa0c72`, the
  `tarballSha256` of PRD FR-7, architecture 9.1 and Story 2.1; no `.sha256` asset.
- **Installed tree:** 333 regular files, 0 symbolic links, `version` `0.5.0`, `license`
  `CC0-1.0`; the `./*` export is `{ types, import }` with no `default`;
  `build/ui-breakpoints.mjs` exports `crmBreakpointsTheme` and `heightBreakpoints`.
- **Makefile:** `CI_LINT_TARGETS` at 252 and `lint:` at 706 list the same 17 targets in the same
  order, `lint-licenses` then `lint-i18n`; `.PHONY` lint line at 288; `lint-deps` at 494;
  `ALLOWED_LICENSES` at 578 ends `...;0BSD;CC-BY-4.0`; `install` at 947.
- **Bats:** mirrors at `makefile_targets.bats:37` and `:42`; ordinal comment at 473 to 483
  ("Seven exclusions" at 475, "The ninth" at 481); exclusion list at 485 with nine names; mirror
  test at 532; `make-target-coverage.tsv` rows 118 (`lint-lockfile`) and 134
  (`lint-licenses`); `lockfile_registries.bats:182` is the real-repository case.
- **Jest:** `jest.config.ts` has no `mjs` in `moduleFileExtensions`, transforms `.mjs` with
  babel-jest, and lists `scripts/localization-generator.js` in `collectCoverageFrom`, the
  precedent for the ui-toolkit inclusion. That file is loaded only by a unit test, so the
  integration run (same list, `tests/integration` roots) is unaffected by an inclusion whose
  files only unit tests load.
- **dependency-cruiser:** `no-orphans` flags only modules with no edges; each new library file
  is imported by its CLI entry or a test, and each CLI entry imports a library file.
- **Seam:** `src/components/ui-breakpoints/index.ts` is 20 lines with 21 `src` importers;
  `breakpoints-theme.test.ts` has 4 tests.
- **Lighthouse and profile (F7):** `lighthouserc.mobile.js` asserts `minScore: 0.84` with
  `aggregationMethod: 'median-run'` over `numberOfRuns: 3`; the profile says
  `lighthouse_mobile: 85`.
- **Dependabot (F8):** `bun`, `github-actions` and `docker` lanes; no `ignore` or `allow`.
- **Docs gates and anchors:** `docs/adr` ends at ADR-015; no open CRM PR adds a
  `docs/adr/016-*` file (PR #230, the only #114 PR, touches no ADR; checked across all 151 of
  its files). `SECURITY.md:133-134`, `CONTRIBUTING.md:840-846`, ADR-013 line 28 and the
  quality-standards Licenses row at line 28 are where the stories say.
- **CI check names:** `gate ratchet / no binding threshold weakened`,
  `bundle size / measure and gate`, `accessibility testing / axe component gate`,
  `supply-chain security / dependency scan`, `security testing / security headers` and the
  `mutation testing / shard N` matrix match the workflow and job names.
- **Open PRs:** Dependabot PRs #304 and #256 edit `package.json` and `bun.lock`; whichever
  merges first forces a rebase of the toolkit lines, which Story 1.1's frozen install and
  `make lint-lockfile` re-check. No other open PR touches a file in the plan.

### 4.2 Inaccurate

- **R3-1, the v0.5.0 tarball is already attested.** The toolkit's `release-provenance.yml`
  (present since ui-toolkit #178, 2026-09-25, before v0.5.0) runs on `release: published`,
  repacks the tarball from the tag and attests it with `actions/attest-build-provenance`. Its
  v0.5.0 run (2026-09-28T07:54:38Z) passed the attest step and failed only the later "Replace
  the release asset" step, so the asset was never replaced (created 07:54:35Z, not updated).
  `gh api repos/VilnaCRM-Org/ui-toolkit/attestations/sha256:bb3d61a6...` returns 3
  attestations whose subject is `vilnacrm-ui-toolkit-0.5.0.tgz` with the pinned digest, built by
  `release-provenance.yml` at `refs/tags/v0.5.0`. Research 11 and architecture 13 item 11
  nevertheless say the follow-up is only "partly merged in #185" and that "the asset is a plain
  digest, not a signed digest or an attestation", and Story 4.1 copies that status into
  `docs/ui-toolkit.md` (FR-16). The attestation half of follow-up 11 is met for the very
  release CRM pins; what remains open is a registry that records integrity, and the lockfile
  still pins no bytes.

## 5. New Findings

Severity scale: critical blocks implementation; major would make a story fail or mislead a
gate; minor is a wording, consistency or risk note an implementer can absorb in place; info
needs no action.

| ID   | Artifact         | Severity | Finding                                                    |
| ---- | ---------------- | -------- | ---------------------------------------------------------- |
| R3-1 | res, arch, epics | minor    | Follow-up 11 omits the existing v0.5.0 attestation         |
| R3-2 | arch, epics      | minor    | "One amended comment" rule vs the Bats ordinal comment     |
| R3-3 | arch, Epic 5     | info     | #185's provenance job replaces the asset after publication |

Critical findings: 0. Major findings: 0. Minor findings: 2. Info findings: 1.

### 5.1 Detail and Handling

- **R3-1 (minor; absorb in Story 4.1, or fix at source first).** The docs page and ADR-016 must
  not publish a wrong provenance status. Correct item 11 in architecture 13 (the one source)
  and research 11 to: "the v0.5.0 tarball carries a GitHub build-provenance attestation from
  `release-provenance.yml` (ui-toolkit #178), verifiable with `gh attestation verify
vilnacrm-ui-toolkit-0.5.0.tgz -R VilnaCRM-Org/ui-toolkit`; #185 adds a plain `.sha256`
  sidecar for later releases (unreleased); open: a registry that records integrity, so the
  lockfile pins bytes". No design changes: the attestation covers the tarball, not the
  installed tree, so the committed digest manifest and `make lint-ui-toolkit` stay the offline
  proof, and wiring `gh attestation verify` into a gate would be a new networked gate outside
  this installation. It does not make any story fail or mislead any gate, hence minor.
- **R3-2 (minor; absorb in Story 2.2).** The epics' Story Conventions ("no added code comment
  beyond the one amended lockfile-gate header clause"), architecture 7.2 ("No other comment is
  added") and architecture 16 ("the one amended comment is the lockfile gate header") contradict
  architecture 9.7 and Story 2.2, which add a "tenth, lint-ui-toolkit" sentence to the Bats
  ordinal comment at `makefile_targets.bats:473-483` and update its count. The Bats edit is the
  right one: that comment enumerates every exclusion and would be false without it. Resolve by
  reading the rule as "two existing comments are amended to stay true, and no new comment is
  added", and state that in the conventions if the epics are edited again.
- **R3-3 (info; Epic 5 only, outside the dispatch set).** On the toolkit `main`,
  `release-provenance.yml` repacks, attests and re-uploads the tarball with `--clobber`, then
  uploads the `.sha256`, after the release is published. A bump run inside that window, or
  after the job fails as it did for v0.5.0, gets no `.sha256` and the refresher refuses with
  `[checksum]`, which is fail-closed and correct. Deferred 5.1 and architecture 17.1 should say
  to wait for a green `release provenance` run on the new tag before running the recipe, and to
  escalate upstream when that run is red.

> Assumption: R3-1 is minor, not major. It is a wrong status line in a documentation
> deliverable, not a mechanism a criterion prescribes: every gate, test and story outcome is the
> same whichever status is written, and Story 4.1's reviewer reads the docs page against this
> report.
>
> Assumption: R3-2 is minor because both sides name the same edit and the Bats file cannot
> stay true without it; an implementer following Story 2.2, the more specific instruction,
> does the right thing.

## 6. Unresolved Risks (carried, unchanged)

- **Trivy or SBOM on the tarball-URL entry:** a stop-and-escalate blocker (AR-15), never a
  suppression; no local evidence either way.
- **Mobile floor:** the NFR-8 route covers a median in `[0.84, 0.85)` and a red run with no
  eager change.
- **Dependabot:** the first CRM weekly `bun` run after merge is the evidence.
- **Commit boundary (EQ4):** commits inside an approved `/fe-sdlc-implement` run, at four
  points; push and PR only through `/fe-sdlc-finish-pr` on the user's approval.
- **ADR number:** the untracked #114 spec in the main checkout also names ADR-016 and
  renumbers when it lands (AD-12).
- **Lockfile rebase:** Dependabot PRs #304 and #256 edit `bun.lock`; a rebase keeps the two
  toolkit lines byte-identical or re-runs Story 1.1's checks.

## 7. Summary and Recommendations

### 7.1 Overall Readiness Status

**Ready.** F1 to F9 and N1 to N5 are all resolved at their source, including the one major
finding that failed iteration 2. ui-toolkit #185 is reflected identically in all six artifacts
and matches the toolkit repository. Coverage is 18 of 18 FRs, 20 of 20 NFRs and AR-1 to AR-17;
the stories form one chain in document order with four commit points; the `src/` diff is one
existing file, so the installation-only scope holds. The two new minors are wording that
Stories 4.1 and 2.2 absorb in place, and the info note touches only the deferred Epic 5.

### 7.2 Critical Issues Requiring Immediate Action

None. No critical or major finding.

### 7.3 Recommended Next Steps

1. `/fe-sdlc-implement` against the epics, from Story 1.1 with `make start` and
   `make install` first, then 2.1, 2.2, 3.1, 4.1, 4.2 and 4.3, committing only at the four
   commit points. Epic 5 is not dispatched.
2. Story 4.1 writes follow-up 11 with the attestation fact of R3-1, and Story 2.2 amends the
   Bats ordinal comment as architecture 9.7 says (R3-2). Optionally, fix both at source first
   in architecture 13, research 11 and the epics' Story Conventions.
3. Then `/fe-sdlc-review`, `/fe-sdlc-qa` and `/fe-sdlc-finish-pr`, which pushes and opens the
   PR only on the user's approval.

### 7.4 Final Note

This iteration found 3 new issues in 2 categories (repository accuracy, cross-artifact
consistency): 0 critical, 0 major, 2 minor and 1 info. All nine iteration-1 findings and all
five iteration-2 findings are resolved.

## 8. Iteration 3 follow-up

Correction pass 3 (2026-09-29) fixed both minors at their source; R3-1 and R3-2 are
**resolved**.

| ID   | Status   | Fixed in                                                             |
| ---- | -------- | -------------------------------------------------------------------- |
| R3-1 | resolved | arch 13 item 11, 21.9; research 11; brief; PRD 12, NFR-11; Story 4.1 |
| R3-2 | resolved | arch 16 (one rule), 7.2, 9.7; conventions, NFR-17, Stories 1.1, 2.2  |
| R3-3 | open     | info only; Epic 5, outside the dispatch set; see the note below      |

- **R3-1, re-verified.** The v0.5.0 asset, downloaded again, hashes to the pinned
  `tarballSha256` (`bb3d61a6...`). With gh 2.101.0,
  `gh attestation verify vilnacrm-ui-toolkit-0.5.0.tgz -R VilnaCRM-Org/ui-toolkit` passes,
  also with `--signer-workflow` set to `release-provenance.yml` and
  `--source-ref refs/tags/v0.5.0`. Of the 3 attestations on the digest, two are SLSA v1 build
  provenance (run 36394249277, attempts 1 and 2) and one is GitHub's release attestation for
  the immutable release (`gh release verify-asset` passes). Section 4.2's count of 3 includes
  that release attestation, which `release-provenance.yml` did not build.
- **What the attestation proves (from R3-3).** The job packs the tarball again from the tag
  and attests those bytes; the rebuild matched the published asset. Its replace step then
  failed with "Cannot delete asset from an immutable release", so the asset is the original
  upload, identical by digest. The attestation proves a tag build of that digest, not the
  upload, the installed tree or the lockfile; the offline manifest stays the install proof.
- **R3-2.** Architecture 16 states the rule once: no new comment in code, scripts, tests or
  config, and exactly two existing comments amended to stay true (the lockfile-gate header
  and the Bats scaffold-exclusion comment). Every other artifact points to it.
- **R3-3, sharpened.** v0.5.0 is `immutable: true`, and the refused step on the toolkit
  `main` also uploads the `.sha256`. If later releases stay immutable, that post-publication
  upload may never land, and the refresher refuses every bump with `[checksum]` (fail-closed).
  Deferred 5.1 should confirm the `.sha256` asset exists before the recipe and escalate
  upstream if it does not. No dispatchable story changes.

Verdict: PASS
