---
status: 'complete'
workflowType: 'product-brief'
stepsCompleted: [1, 2, 3, 4, 5, 6]
validated: '2026-09-29 (validate-brief, 9 findings fixed in place)'
corrected: '2026-09-29 (pass 1: ui-toolkit#185, readiness F2, F6 and F8; pass 3: R3-1, R3-2)'
project_name: 'crm'
date: '2026-09-29'
issue: 250
author: 'analyst (Mary), autonomous run'
inputDocuments:
  - 'https://github.com/VilnaCRM-Org/crm/issues/250'
  - 'https://github.com/VilnaCRM-Org/ui-toolkit/pull/185'
  - 'specs/250-ui-toolkit/planning-artifacts/research-250-ui-toolkit-2026-09-29.md'
  - 'specs/250-ui-toolkit/planning-artifacts/run-summary-250-ui-toolkit-2026-09-29.md'
  - 'https://github.com/VilnaCRM-Org/website/pull/459'
  - '/home/dima/Desktop/crm-worktrees/plans/discovery-106-250-2026-09-28.md'
  - 'package.json'
  - 'CLAUDE.md'
  - '.claude/react-sdlc.yml'
---

# Product Brief: installing `@vilnacrm/ui-toolkit` into CRM (#250)

Predecessor: [technical research](./research-250-ui-toolkit-2026-09-29.md). Run log:
[run summary](./run-summary-250-ui-toolkit-2026-09-29.md). Every figure below is taken from the
research artifact, which re-measured it in the worktree on 2026-09-29, unless it is marked as a
new target.

## 1. Executive Summary

CRM and `website` are meant to render one VilnaCRM design system, and the shared package
`@vilnacrm/ui-toolkit` exists for that. Issue #250 calls the work "blocked on the React 19 /
MUI 9 upgrade". That premise is stale: `package.json` already pins React 19.2.8, MUI ^9.4.0,
i18next ^26.4.2 and react-i18next ^17.0.14, which satisfy every toolkit peer.

The product owner has narrowed the scope: _"we do not want to create new modules/components
for now, we can do the ui-kit installation"_. This brief therefore defines #250 as an
**installation**, not a migration:

- pin the v0.5.0 release tarball;
- make every repository gate it trips pass through a narrow, reviewed policy edit that weakens
  nothing;
- add offline provenance for the installed bytes (a sha256 manifest plus `make` targets);
- wire Jest for the ESM-only package;
- record the decision in ADR-016 and a docs page;
- consume the toolkit through exactly one existing seam whose value is provably identical:
  `src/components/ui-breakpoints`, via the named exports `crmBreakpointsTheme` and
  `heightBreakpoints`.

Users see no change. The value is a verified, governed dependency that later swaps can build on
without re-litigating supply chain, licensing, test wiring or bundle policy.

ui-toolkit PR #185 merged to the toolkit's `main` after v0.5.0 was released. It adds opt-in CRM
behaviour (native button loading, `UiForm` offline notice and heading level, a CRM footer
variant, skeleton ids, theme-inheriting typography), a `default` export condition and a
per-release `.sha256` asset. No release carries it yet (research section 12).

> Assumption: #250 installs v0.5.0, the latest release, now, and designs every piece so that
> the next release is a pin bump. The swaps #185 makes possible are a deferred follow-up,
> blocked on a toolkit release above 0.5.0; they stay swaps behind existing CRM seams and
> props, with no new component.

## 2. Core Vision

### Problem Statement

CRM maintains its own copies of primitives and theme tokens that the toolkit also ships. There
is no sanctioned path to depend on the toolkit at all: the package is not on npm, is ESM-only,
and its lockfile entry carries no integrity hash. Four repository gates currently reject it or
cannot express it:

- `lint-lockfile` fails on the non-npm tarball URL;
- `lint-licenses` fails on `CC0-1.0`, which is not in `ALLOWED_LICENSES`;
- Jest fails with `Cannot find module` the moment a seam imports a toolkit subpath;
- the ADR drift gate fails because the `dependencies` map changed.

### Problem Impact

- Design drift between CRM and `website` has no mechanical way to shrink.
- Every future toolkit swap would have to solve provenance, licensing, Jest ESM and bundle
  policy inside a UI change, where those decisions get the least review.
- The lockfile pins a URL but not bytes, so a re-uploaded release asset would install
  different code unnoticed (CWE-494, raised by both AI reviewers on website PR #459).

### Why Existing Solutions Fall Short

- **Issue #250 as written** assumes a full primitive swap with adapters and fonts. The research
  shows most toolkit primitives are not drop-ins: several bind the **website** breakpoints at
  module scope (`sm` 640 instead of CRM's 480), `UiButton` adds a `role="status"` node, and
  `UiFooter` reads an undeclared env var at render time. Adapters are new components, which the
  product owner has ruled out.
- **Website PR #459** solved the same installation, but its choices do not transfer as-is: it
  took the subpath `default` exports (the website themes), added a path-keyed coverage threshold
  (which CRM's no-grow gate ratchet rejects), and edited two Jest configs (CRM's mutation config
  inherits the base).
- **Doing nothing** leaves the dependency half-added in the worktree, with red gates.

### Proposed Solution

A single change that makes the dependency first-class and inert:

1. Keep the pinned v0.5.0 tarball already in `package.json` and `bun.lock`.
2. Pass each tripped gate with the smallest reviewed edit (lockfile exact-URL exception,
   `CC0-1.0` license entry, Jest mapper plus `transformIgnorePatterns`, ADR-016).
3. Add `config/ui-toolkit-checksums.json` with `make lint-ui-toolkit` (offline, fail-closed,
   part of `make lint`) and `make update-ui-toolkit` (networked regeneration).
4. Re-point `src/components/ui-breakpoints/index.ts` at the named toolkit exports, using the
   import-then-`export const` shape that keeps coverage at 100% and adds no mutants.
5. Document the seam rule and a "stays CRM-local" register of every primitive that was not
   swapped, with its reason.

### Key Differentiators

- **Identity, not similarity.** The only adopted seam is deep-JSON-equal to CRM's value (0 of
  310 leaves differ). Visual, a11y and behavioural baselines cannot move.
- **Provenance CRM can check offline.** A post-install digest gate over 331 installed
  artifacts (the 330 files under `build/` plus `package.json`), stated honestly as "installed
  build artifacts are verifiable", not as install-time integrity.
- **Zero weakening.** No floor lowered, no ceiling raised, no suppression, no `gate-relaxation`
  label.

## 3. Goals

- **G-1 Install:** `@vilnacrm/ui-toolkit` v0.5.0 resolves in the build, in `tsc`, in the unit
  and integration Jest suites and in Stryker, from one pinned release tarball.
- **G-2 Gates green by narrow edits:** every gate the dependency trips passes through an exact,
  reviewed edit justified in ADR-016.
- **G-3 Provenance:** a fail-closed, hermetic verifier proves the installed artifacts match a
  committed sha256 manifest, with must-fail coverage for each failure class.
- **G-4 One identical seam:** `ui-breakpoints` consumes `crmBreakpointsTheme` and
  `heightBreakpoints`; nothing observable changes.
- **G-5 Recorded decisions:** ADR-016, `docs/ui-toolkit.md`, the CRM-local register and the
  upstream follow-up list exist and pass the docs gates.
- **G-6 Consistent version:** v0.5.0 is the same string in `package.json`, `bun.lock`, the
  manifest, the lockfile-gate literal, the docs and the ADR.

## 4. Non-Goals

The product owner's constraint is binding: **no new modules, components, `UI*` primitives or
adapters in #250.** Everything below is deferred, each with the recorded reason from the
research register (section 3.4 and section 4).

### Deferred primitive swaps (stay CRM-local)

The reasons below hold for v0.5.0. Where ui-toolkit #185 resolves one, the primitive stays
CRM-local in #250 and becomes adoptable through the #185 opt-in after the next toolkit release,
as a follow-up swap behind the existing CRM seam; the architecture's section 12 is the binding
register.

- `ui-button`: toolkit `UiButton` renders an extra `role="status"` div, which makes `UIForm`
  status queries ambiguous and changes the a11y tree, and its contained variant has no
  `:focus-visible` outline. #185 makes the status region opt-out (`loadingMode="native"`);
  the outline stays open, so the button stays local after the next release too.
- `ui-typography`: its chunk's module-scope guard falls back to the website theme. #185 adds
  `inheritTheme`, so it is adoptable after the next release.
- `ui-link`: the same guard, plus contracts CRM does not model; #185 does not change it.
- `ui-container`: its styles and props equal CRM's (its only media rules read `md`, `lg` and
  `xl`, which match), but v0.5.0 renders a prohibited `aria-label="container"`. #185 drops
  it, so it is adoptable after the next release.
- `ui-back-to-main`, `ui-form`, `auth-skeleton`, `ui-skeleton-button`, `ui-skeleton-input`:
  their chunks import the website breakpoints at module scope, so `sm` moves from 480 to 640.
  #185 moves the `ui-form` and skeleton `sm` rules to render time; the form's submit is still
  the contained `UiButton`, its title and error banner still render through `UiTypography`
  without `inheritTheme`, and CRM's skeleton is a named `section[aria-label]` the toolkit
  deliberately does not model, so all of them stay local.
- `ui-footer`: render-time bare `process.env.REACT_APP_VILNACRM_USAGE_POLICY_URL` read (absent
  from `.env.example`) plus website breakpoints. #185 adds `variant="crm"`, which reads no
  `process.env`, and its breakpoints match CRM's; but the variant renders its link labels
  through `UiTypography` without `inheritTheme`, so it stays local until upstream fixes that.
- `ui-form-input-field`, `ui-text-field-form`: a different API surface; swapping needs an
  adapter.
- `ui-text-field`, `ui-input`: the CRM files have no `src` importer, so there is nothing to
  consume.
- `error-boundary` / `ui-error-boundary`: on the eager path under the 470,000 B raw budget, and
  ADR-007's reliability model is not modelled upstream.
- `ui-live-status`, `ui-offline-notice`, `ui-async-section`, `route-fallback`, layouts,
  not-found, `render-with-theme`, `src/styles/theme.ts`: no toolkit counterpart. The #185
  offline notice is internal to `UiForm`, not a separate primitive.

### Deferred theme and asset work

- `ui-color-theme` stays CRM-local: `crmColorTheme` adds 9 palette keys and changes `success`
  to `#38B386`, it has no production consumer, and the swap adds a wasted `createTheme`.
- Toolkit `styles.css` and fonts (1,348,788 B of TTF, no `font-display`) would break the
  480,000 B Lighthouse `totalSizeBytes` budget and need local serving under `font-src 'self'`.
- `UiThemeProvider` / `createUiTheme`, the Storybook preview theme and the
  `renderWithProviders` test theme.
- CRM module augmentation for the 9 extra toolkit palette keys.

### Deferred enforcement and cleanup

- A new ESLint `no-restricted-imports` rule banning the bare root import, `styles.css` and the
  `default` exports. It needs its own must-fail fixture and is enforcement, not installation.
- Deleting the dead `src/components/ui-typography/theme.ts`.
- Filing upstream issues or PRs in `ui-toolkit`. Gaps are recorded in section 9 only.

### Deviations from the issue #250 text

Each is recorded again in ADR-016 and in the PR description:

- "Blocked on React 19 / MUI 9": stale; the stack already satisfies every peer.
- `v0.3.0` in the install snippet: replaced by v0.5.0, the latest release.
- "Replace CRM-local primitives", "thin adapter": partly deferred; the product owner ruled out
  new components and adapters, and in v0.5.0 no primitive other than the breakpoints theme is a
  drop-in. The swaps that ui-toolkit #185 enables wait for the next toolkit release.
- "Wire fonts": deferred; the toolkit TTFs break the Lighthouse `totalSizeBytes` budget.
- Jest `moduleNameMapper` "pointed at `build/index.mjs`": replaced by a subpath mapper to
  `build/<subpath>.mjs`, because the root barrel costs 346,575 B raw and is never imported.
- "Take `crmColorTheme`": not adopted (assumption below).
- Prior art website#458 (the parity analysis): the installation is modelled on the merged
  website#459 instead, which is the part that transfers.

> Assumption: the issue's instruction to "take `crmColorTheme`" is superseded by the
> whole-object identity bar in the research (section 4). The deviation is recorded in ADR-016
> with the reversal trigger "a CRM consumer reads a toolkit-only palette key, or upstream ships
> a CRM-distinct palette".

## 5. Users and Stakeholders

### Primary users

- **CRM contributors (human and AI agents).** They add or bump the toolkit, touch the
  breakpoints seam, and later propose swaps. Success for them: one docs page and one ADR tell
  them how to import (named subpath exports only), how to bump (the one binding recipe of
  architecture section 17.1), and why each primitive is still local.
- **The product owner / maintainer, [@kravalg](https://github.com/kravalg).** Decider on
  ADR-016 and CODEOWNERS reviewer of `/Makefile`, `/scripts/` and `/config/`. Success: every
  policy widening is exact, justified and visible in one review.

### Secondary users and stakeholders

- **AI reviewers (CodeRabbit, cubic).** They will re-raise CWE-494 and supply-chain questions;
  ADR-016 must answer them precisely.
- **`ui-toolkit` maintainers.** Consumers of the recorded upstream follow-up list.
- **`website` team.** Owners of the prior art; CRM's manifest is byte-comparable with theirs.
- **CRM end users.** No visible change; they are protected by unchanged visual, a11y and
  Lighthouse baselines.

### Contributor journey

1. **Discover:** `docs/ui-toolkit.md` and ADR-016, linked from the ADR index.
2. **Use:** import a named export from a `@vilnacrm/ui-toolkit/<subpath>` path, never the root
   barrel, `styles.css` or a `default`.
3. **Verify:** `make lint` runs `lint-ui-toolkit`; a stale dev-container install fails closed
   with a clear message.
4. **Bump:** follow the one binding recipe in architecture section 17.1: `bun add` the new
   release URL in the dev container (it rewrites `package.json` and both `bun.lock` lines),
   edit the lockfile-gate literal, run `make update-ui-toolkit`, then run the lockfile and
   digest gates; a tooling test keeps the five machine-read pin statements equal.

## 6. Success Metrics

All metrics are binary or numeric and are read from CI or from a committed file.

### Gate outcomes (must all hold on the PR)

- **M-1** `make lint-lockfile`, `make lint-licenses` and `make lint-ui-toolkit` exit 0 on the
  real tree.
- **M-2** `lint-lockfile` fails on each must-fail fixture: the URL under another package,
  another repo's asset, a wrong tag or asset name, the host `github.com.evil.example`, a
  git-spec form, and a rogue URL appended after the sanctioned token on the same line (6 of
  6); one must-pass fixture with both sanctioned lines passes.
- **M-3** The verifier fails closed on each failure class: wrong algorithm or empty manifest,
  non-release pin, version or URL drift, package missing or wrong version, digest mismatch,
  missing file, extra file (7 of 7).
- **M-4** The manifest lists exactly 331 artifacts (330 `build/**` files plus `package.json`)
  and matches the installed tree 331/331, with 0 mismatches and 0 extra files.
- **M-5** `make lint`, `make test-unit-all`, `make test-integration` and `make lint-docs` pass;
  `make scan-secrets` (gitleaks) reports 0 findings over the manifest.

### Quality floors (unchanged, raise-only)

- **M-6** Jest coverage stays 100/100/100/100, and the verifier script is covered through a
  `collectCoverageFrom` inclusion, not a path threshold.
- **M-7** Stryker `break` stays 100 with 0 survivors; the seam adds 0 scored mutants.
- **M-8** `gate ratchet` reports 0 relaxations; no `gate-relaxation` label is applied.

### No-observable-change guarantees

- **M-9** No module in the initial-entrypoint closure imports `@vilnacrm/ui-toolkit` (checked
  on the emitted `bundle-stats.json` or by dependency-cruiser from `src/index.tsx`), the Rspack
  raw hint passes with `raw.maxInitialEntrypointBytes` unchanged at 470,000 B, and the eager
  gzip delta in the CI `bundle-size` comment is at most 64 B.
- **M-10** The summed gzip delta over all non-initial JS assets, new chunks included, is at
  most 256 B in the CI `bundle-size` comment (esbuild estimate +17 B gzip).
- **M-11** 0 visual snapshots changed, 0 new axe violations, Lighthouse desktop and mobile
  scores at or above the floors asserted in the unedited `lighthouserc` files (mobile
  performance 0.84, median of 3 runs).
- **M-12** The existing value assertions in `breakpoints-theme.test.ts` pass with 0 of them
  edited, and one added assertion pins identity (`toBe`) against the named
  `crmBreakpointsTheme`. The deep-equality evidence (0 of 310 leaves differ) is restated in
  ADR-016.

### Scope discipline

- **M-13** The `src/` diff touches exactly one file, `src/components/ui-breakpoints/index.ts`;
  0 new directories under `src/components`, `src/modules` or `src/features`.
- **M-14** v0.5.0 appears identically in the 6 places listed in G-6. A tooling test pins the
  five machine-read pin statements (`package.json`, the `bun.lock` workspace line, the
  `bun.lock` packages entry, the manifest, the lockfile-gate literal); review covers the docs
  and the ADR.

> Assumption: M-10's 256 B gzip ceiling is a new review threshold for this change only, set at
> about 15 times the esbuild estimate. It is not a budget entry and does not touch
> `config/performance-budget.json`. It is summed over all non-initial assets because Rspack's
> `splitChunks` `default` preset may place the toolkit module in a shared async chunk rather
> than in each route chunk, so a per-route reading could miss it.
>
> Assumption: M-9 is structural, not "0 B". The Rspack runtime in the initial entrypoint embeds
> the async chunk map, so a changed or added async chunk can move eager bytes without any eager
> module importing the toolkit. The 64 B gzip allowance covers that map only; any eager import
> of the toolkit is a defect regardless of size.
>
> Assumption: success is judged on the single #250 PR. There is no post-release adoption metric,
> because the installation deliberately changes nothing a user can see.

## 7. Scope

### In scope (the installation MVP)

- Dependency: the v0.5.0 tarball already in `package.json:14` and `bun.lock`.
- Gate edits: exact-URL exception in `scripts/ci/check-lockfile-registries.sh`; `CC0-1.0` in
  `ALLOWED_LICENSES`; Jest `moduleNameMapper` for `^@vilnacrm/ui-toolkit/([a-z-]+)$` plus the
  `transformIgnorePatterns` entry, in `jest.config.ts` only.
- Provenance: the list-shaped checksum manifest, `scripts/ci/verify-ui-toolkit.mjs`,
  `make lint-ui-toolkit` (in `CI_LINT_TARGETS` and `lint:`), `make update-ui-toolkit`, their
  `tests/bats/make-target-coverage.tsv` rows and Bats list mirrors.
- Tests: the verifier's must-fail unit test in `tests/unit/scripts/` with the script added to
  the `collectCoverageFrom` inclusions (M-3, M-6); the six must-fail and one must-pass
  lockfile fixtures in `tests/bats/lockfile_registries.bats` (M-2); a tooling test pinning the
  five machine-read pin statements equal (M-14). A `CC0-1.0` pass case in
  `check-licenses.test.ts` was later declined (architecture section 8).
- Seam: the breakpoints re-point in the import-then-`export const` shape, plus an identity
  assertion in the existing breakpoints test.
- Docs: ADR-016 with `Deciders: [@kravalg](https://github.com/kravalg)` and its README index
  row; `docs/ui-toolkit.md`; the ADR-013 lockfile prose; one `CONTRIBUTING.md` sentence
  naming `CC0-1.0` beside its `ALLOWED_LICENSES` pointer; the
  command lists in `CLAUDE.md` and `AGENTS.md`; the gate table in
  `.claude/skills/quality-standards/SKILL.md`, which lists `make lint-licenses` today.

### Definition of done

All of M-1 to M-14 hold on the PR, and the CRM-local register and upstream follow-up list are
committed in `docs/ui-toolkit.md`.

### Future vision (after #250, each its own issue)

- Upstream fixes land (section 9), then primitive swaps are reconsidered one at a time, each
  with its own value-diff and baseline evidence. ui-toolkit #185 has already landed several on
  the toolkit's `main`; the swaps it enables are a deferred epic, blocked on the next toolkit
  release and outside the #250 pull request.
- An import-restriction lint gate for the toolkit, with must-fail fixtures.
- A registry release with integrity, so the lockfile itself pins the bytes.

## 8. Constraints

- **Product owner:** no new modules, components, `UI*` primitives or adapters.
- **Root cause, never suppression:** no `eslint-disable`, ignore entry, lowered threshold or
  widened allowlist beyond the one exact URL and one license id.
- **Quality floors are raise-only** (`.claude/react-sdlc.yml` `quality.*`, the gate ratchet):
  100% coverage, 100% mutation `break`, zero-violation lint ceilings.
- **Budgets:** 470,000 B raw initial entrypoint cannot be raised; nothing eager may import the
  toolkit.
- **Code conventions:** classes only in non-React `src/**/*.ts`; type-only files; no new code
  comment, with two existing comments amended to stay true (architecture section 16;
  rationale goes in docs); the verifier is a set of classes with
  constructor-injected I/O whose `run()` returns an exit code, and its library files avoid
  `import.meta`, top-level `await` and `process.exit()`, because Jest transforms `.mjs` to
  CommonJS.
- **Governance:** the ADR drift gate needs ADR-016 in the same PR; new `make` targets need
  `make-target-coverage.tsv` rows and `CI_LINT_TARGETS` membership; docs may only name targets
  that exist and must not link into `node_modules/` or `specs/`.
- **Imports:** named subpath exports only; never the root barrel, `styles.css` or a subpath
  `default` (those are the website themes).
- **Process:** no heavy local suites; bundle and visual evidence comes from CI.

## 9. Risks

| ID  | Risk                                  | Mitigation                                   |
| --- | ------------------------------------- | -------------------------------------------- |
| R1  | Integrity is post-install only        | State the claim precisely in ADR-016         |
| R2  | Trivy / SBOM / licenses miss `swiper` | Seams never load it; recorded in ADR-016     |
| R3  | Root-barrel import (346,575 B raw)    | Docs forbid it; lint gate is a follow-up     |
| R4  | Wrong `default` export imported       | Value test plus new identity assertion       |
| R5  | Installs now need github.com egress   | Recorded; no Dockerfile text changes         |
| R6  | Stale dev-container `node_modules`    | Verifier fails closed with a clear message   |
| R7  | Bumps are manual (no Dependabot)      | Bump recipe plus version-equality test       |
| R8  | License / lockfile lists unratcheted  | CODEOWNERS review plus ADR-016 rationale     |
| R9  | Gitleaks over 331 digests unverified  | List shape; CI `scan-secrets` is the proof   |
| R10 | Eager raw headroom is unmeasured      | M-9: no eager toolkit import                 |
| R11 | ADR-016 number collides with #114     | #250 takes 016; #114 renumbers on landing    |
| R12 | Issue text disagrees with the scope   | Deviations listed in section 4, and ADR-016  |
| R13 | `tsc` / Stryker parse `index.d.mts`   | 151,265 B once per program; CI-measured      |
| R14 | Dependabot `bun` job fails on the URL | ADR-016 records it; first weekly run checked |

> Assumption: R11 is resolved in favour of #250, because the #114 spec that also claims 016 is
> untracked and absent from open PR #230.
>
> Assumption: R14 was added in correction pass 1 (readiness F8). `website` has run with the
> same dependency shape since 2026-09-28, and three `bun` Dependabot update jobs against it
> succeeded, but no weekly scan has run yet (research risk 11).

### Upstream follow-ups (recorded, not filed)

1. `/*#__PURE__*/` on module-scope `createTheme` calls, or split website and CRM theme chunks.
2. Stop exporting the website theme as the unnamed `default` of shared subpaths.
3. A CRM-distinct palette, or drop `crmColorTheme`.
4. Ship MUI module augmentation for the extra palette keys.
5. Add a `default` or `require` export condition, or document the Jest mapper recipe
   (merged in #185, unreleased).
6. Bind components to a theme variant instead of module-scope website breakpoints (partly
   merged in #185 for `ui-form` and the skeletons, unreleased).
7. Ship woff2 fonts with `font-display: swap` and reconcile `Golos Text` / `Golos`.
8. Replace `UiFooter`'s render-time `process.env` read with a prop (merged in #185 as
   `variant="crm"`, unreleased; its link labels still skip `inheritTheme`, open).
9. Make `UiButton`'s extra `role="status"` div opt-in (merged in #185, unreleased), and give
   the contained variant a `:focus-visible` outline (open).
10. Drop `scripts.prepare` from the published manifest; fix source maps into `../../src`.
11. Publish to a registry that records integrity, or attest each release (attestation met
    for v0.5.0 by ui-toolkit #178, verifiable with `gh attestation verify`; it proves a tag
    build of the tarball, not the installed tree; #185 adds a `.sha256` sidecar, unreleased;
    a registry that records integrity is open).

## 10. Open Questions

Each is resolved autonomously for planning; the PRD may revisit them.

- Should the issue title and body be corrected (the "blocked" premise, v0.3.0, full-swap
  scope)?

  > Assumption: no GitHub edits in this run. The PR description states the corrected premise
  > and the installation-only scope.

- Does the #250 PR close the issue, or leave it open for the deferred swaps?

  > Assumption: the PR closes #250 as scoped by the product owner. The deferred swaps are
  > listed in `docs/ui-toolkit.md` and can be reopened as new issues by the maintainer.

- Are the real Rspack deltas within M-9 and M-10?

  > Assumption: settled by the CI `bundle-size` comment on the PR; no local production build.

## 11. Next Step

Hand this brief to the PM for `create-prd`, carrying forward G-1 to G-6 as functional scope,
M-1 to M-14 as acceptance criteria, section 8 as NFRs and section 9 as the risk register.

## 12. Validation Record

`validate-brief` checked this brief on 2026-09-29 against the research artifact, issue #250
and the product-owner constraint, and fixed 9 findings in place:

1. M-9 claimed a 0 B raw eager delta that CI does not report and the async chunk map can
   break; it is now structural plus a 64 B gzip allowance.
2. M-10 read per route chunk; it is now summed over all non-initial assets.
3. M-12 compared against a CRM theme that no longer exists after the swap; it now pins the
   unedited value assertions plus the identity assertion.
4. M-5 named "the integration suite"; it now names `make test-integration`.
5. The in-scope list omitted the tests M-2, M-3, M-6 and M-14 depend on, and one doc-sync
   surface.
6. The bump journey skipped refreshing `bun.lock`, which G-6 requires.
7. The issue-text deviations were only a generic risk row; they are now listed in section 4.
8. "331 build artifacts" was imprecise; it is 330 `build/` files plus `package.json`.
9. Research risk 9 (type-parse cost) had no row; it is now R13.

Checked and consistent: the stack versions in `package.json`, the single adopted seam, the
colour-seam deferral, `docs/adr` ending at 015 with no open PR adding an ADR, and every other
figure against the research artifact.

### Correction pass 1 (2026-09-29)

Applied after the readiness report, to bring this upstream input in line with the PRD and the
architecture instead of only noting the drift (readiness F6):

1. The bump journey now defers to the one binding recipe in architecture section 17.1 (F2).
2. "Four" machine-read version strings became the five pin statements (M-14, section 7).
3. M-2 and the in-scope test list now count 6 must-fail fixtures and 1 must-pass fixture.
4. The verifier constraint names injected classes with `run()`, not `main()`.
5. The declined `CC0-1.0` pass case and the one-sentence `CONTRIBUTING.md` edit are stated.
6. ui-toolkit #185 is recorded: the v0.5.0 decision, the re-framed deferred swaps and the
   upstream follow-up statuses.
7. R14, the Dependabot `bun` job risk, was added (F8).

Correction pass 3 (readiness iteration 3): follow-up 11 records the existing v0.5.0
attestation (R3-1), and the code-conventions line states the one comment rule (R3-2).

Adversarial validation 2 (2026-09-29) corrected two deferred-swap verdicts against #185's
merged source: `ui-container` is adoptable after the next release, and `ui-footer` is not.
