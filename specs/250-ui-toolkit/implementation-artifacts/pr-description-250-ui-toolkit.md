# feat(#250): install the UI toolkit from a digest-verified release tarball

## Summary

This installs `@vilnacrm/ui-toolkit` v0.5.0, the latest toolkit release, from its GitHub release
tarball. CRM reads one value from it, through its existing breakpoints seam.

- **The "blocked" premise is stale.** Issue #250 describes the work as blocked on React 19 and
  MUI 9. `package.json` already pins React 19.2.8, `@mui/material` 9.4.0, i18next 26.4.2 and
  react-i18next 17.0.15, and all nine required toolkit peers are satisfied. This change
  upgrades no framework.
- **The scope is installation only.** The product owner narrowed the issue: _"we do not want
  to create new modules/components for now, we can do the ui-kit installation"_. This pull
  request adds no module, no component, no `UI*` primitive and no adapter, and it changes
  nothing a user can see.

## What changes

- **The pin.** `package.json` and both `bun.lock` lines name one release tarball URL:

  ```text
  https://github.com/VilnaCRM-Org/ui-toolkit/releases/download/v0.5.0/vilnacrm-ui-toolkit-0.5.0.tgz
  ```

  The package is not in `trustedDependencies`, so Bun runs none of its lifecycle scripts.

- **The digest gate.** Bun records no integrity for a remote tarball, so
  `config/ui-toolkit-checksums.json` records the SHA-256 of the 331 installed artifacts and the
  tarball's own digest. `make lint-ui-toolkit` verifies the installed tree offline against it,
  in `make lint` and in the CI lint phase. `make update-ui-toolkit` regenerates the manifest
  for a version bump, over the network, and stays out of `make lint`.
- **The precise claim.** Installed build artifacts are verifiable offline, and
  `bun install --frozen-lockfile` itself fetches unverified bytes. The gate detects a tampered
  or drifted install after the fact and fails `make lint`; it does not verify the download.
- **Jest.** `jest.config.ts` gains one `moduleNameMapper` entry for named toolkit subpaths, one
  `transformIgnorePatterns` entry and one `collectCoverageFrom` inclusion for the verifier.
  `jest.mutation.config.ts` inherits all three and is not edited.
- **The seam.** `src/components/ui-breakpoints/index.ts` imports `crmBreakpointsTheme` and
  `heightBreakpoints` by name from `@vilnacrm/ui-toolkit/ui-breakpoints` and re-exports them.
  It is the only changed file in `src/`. The exported object is deep-equal to CRM's former
  theme (0 of 310 leaves differ), and `up('md')` and `down('md')` produce the same media
  queries as before. No eager module imports the toolkit.
- **Docs.** ADR-016 records the decision, `docs/ui-toolkit.md` is the contributor page (import
  rule, bump recipe, keep-local register, upstream follow-ups), and the command, gate and
  security docs name the new gates and the lockfile exception.

## Allowlist widenings and thresholds

Exactly two allowlists widen, by one entry each:

1. **The lockfile gate** (`scripts/ci/check-lockfile-registries.sh`) accepts one exact
   tarball URL, bound to the `@vilnacrm/ui-toolkit` package name. Every other non-npm
   resolution is still rejected, and must-fail Bats fixtures pin that.
2. **The license gate** (`ALLOWED_LICENSES` in the `Makefile`) accepts `CC0-1.0`, the toolkit's
   license and the license of this repository.

No binding threshold is weakened, so no `gate-relaxation` label applies. Both widenings sit
outside the gate ratchet manifest and are reviewed here and in ADR-016. The diff adds no
suppression artifact of any kind, and the ADR drift gate is satisfied by ADR-016 itself, with
no escape hatch.

## Deviations from the issue text

Seven deviations, each recorded here and in ADR-016:

1. The "blocked" premise is stale: all nine peers are already satisfied, and no framework
   upgrade is part of this change.
2. v0.5.0 is installed instead of v0.3.0: it is the latest release.
3. Primitive replacement is partly deferred and adapters are ruled out: the swaps that
   ui-toolkit #185 enables wait for the next toolkit release, and the product owner's scope
   excludes adapters.
4. Fonts are deferred: the toolkit's TTF fonts total 1,348,788 B against the 480,000 B
   Lighthouse `totalSizeBytes` budget, and `font-src 'self'` would require serving them
   locally; CRM keeps its own woff2 fonts and never imports the toolkit's `styles.css`.
5. Jest uses a subpath mapper instead of one pointed at `build/index.mjs`, because only named
   subpath exports are sanctioned.
6. `crmColorTheme` is not adopted: it differs from CRM's palette in 10 keys.
7. Website PR #459 is the prior art instead of #458.

## ui-toolkit #185

v0.5.0, the latest release, is installed. ui-toolkit #185 (the CRM opt-ins, a `default` export
condition and a per-release `.sha256` asset) is merged to the toolkit's `main` but is in no
release yet. Adopting its opt-ins is the deferred Epic 5 of this plan, blocked on a toolkit
release above 0.5.0; the next release is a pin bump through the recipe in `docs/ui-toolkit.md`.

## Issue #250 checklist

- **React 19 + MUI 9 upgrade:** met, pre-existing; no upgrade is needed.
- **Add the toolkit at a pinned tarball:** met.
- **Replace CRM-local primitives:** partly met. The breakpoints seam now comes from the
  toolkit. In v0.5.0 no other primitive is a drop-in, and adapters are ruled out by the
  product owner. The swaps that ui-toolkit #185 enables wait for a toolkit release above
  0.5.0 (the deferred Epic 5); every other primitive stays CRM-local, with its reason in the
  keep-local register of `docs/ui-toolkit.md`.
- **Wire fonts:** deferred, for the budget and `font-src 'self'` reasons in deviation 4.
- **Keep accessibility and security via adapters:** met by preservation; no primitive is
  replaced, so no CRM accessibility or security behaviour is dropped.

## Upstream gaps

The toolkit gaps found during this work are listed, with their statuses, under "Upstream
follow-ups" in `docs/ui-toolkit.md`. Nothing is filed against the toolkit repository by this
pull request, and issue #250 is not edited.

## CI evidence

Local checks were light only: focused Jest, `tsc`, ESLint and Prettier on changed files,
markdownlint, the docs gates, the lockfile gate and the offline digest gate. Every full suite
runs in CI. Every check below must be green on the final head, with no re-run hiding a flake.

- [ ] `static testing / static`
- [ ] `unit testing / unit`
- [ ] `integration testing / integration`
- [ ] `bats testing / bats`
- [ ] `mutation testing / shard 0` to `mutation testing / shard 23` (all 24 shards)
- [ ] `mutation testing / merge and enforce gate` (100%)
- [ ] `bundle size / measure and gate`
- [ ] `bundle size / PR report`
- [ ] `performance testing / lighthouse desktop`
- [ ] `performance testing / lighthouse mobile`
- [ ] `accessibility testing / axe component gate`
- [ ] `accessibility testing / axe route scans and keyboard contract`
- [ ] `visual tests / visual-test` (0 diffs)
- [ ] `e2e testing / test`
- [ ] `gate ratchet / no binding threshold weakened`
- [ ] `dependency cruiser / dependency-cruiser`
- [ ] `eslint-suppressions / eslint-suppressions`
- [ ] `rust-code-analysis / rust-code-analysis`
- [ ] `scaffold testing / scaffold`
- [ ] `supply-chain security / secret scan`
- [ ] `supply-chain security / dependency scan`
- [ ] `supply-chain security / image scan`
- [ ] `sbom / generate`
- [ ] `security testing / Analyze`
- [ ] `security testing / preloaded-auth seed gate`
- [ ] `security testing / security headers`
- [ ] `storybook testing / storybook-build`
- [ ] `codecov / codecov`
- [ ] `memory leak testing / memory-leak-testing`
- [ ] `load testing / homepage load testing`
- [ ] `load testing / signup load testing`
- [ ] `contract testing / OpenAPI breaking-change gate`
- [ ] `commitlint / conventional commit contract`
- [ ] `workflow security / zizmor`
- [ ] `format yaml files / yamlfmt`
- [ ] Every other check that reports on the head

### Evidence record

- **Eager gzip delta** (`bundle size / PR report`, at most 64 B, expected 0 B): `pending`
- **Summed non-initial gzip delta** (`bundle size / PR report`, at most 256 B): `pending`
- **Digest gate line** (`static testing / static`, expected
  `ui-toolkit integrity: OK (v0.5.0, 331 artifacts verified, 0 extra files)`): `pending`
- **Mobile performance median** (`performance testing / lighthouse mobile`, median of 3 runs
  against the asserted 0.84, the profile's 85 beside it): `pending`
- **PRD NFR-8 route taken**, with the latest green `main` comparison run when the route needs
  it: `pending`
- **CycloneDX record of the toolkit** (`sbom / generate`: how it lists the component, or that
  it omits it as the documented blind spot): `pending`
- **Reachability probe** (no module in the `src/index.tsx` initial closure imports the
  toolkit): `pending`
- **Job durations** (`static testing / static` and the mutation shards, against the latest
  `main` run): `pending`
- **Dependabot evidence** (PRD NFR-19: the three `website` `bun` update jobs after its #459,
  and its first weekly `bun` scan if it has run): `pending`

Closes #250

🤖 Generated with [Claude Code](https://claude.com/claude-code)
