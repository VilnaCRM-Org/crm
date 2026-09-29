# ADR-016: UI toolkit installed from a digest-verified tarball, consumed only via identical seams

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-29

**Technical Story**: Issue [#250](https://github.com/VilnaCRM-Org/crm/issues/250) asked CRM to
consume the shared `@vilnacrm/ui-toolkit` package. The product owner narrowed it to the
installation alone: _"we do not want to create new modules/components for now, we can do the
ui-kit installation"_. This record covers that installation: how the dependency is pinned and
verified, which gates it passes through, and which single value CRM reads from it.

## Context and Problem Statement

CRM and `website` are meant to render one VilnaCRM design system, and the toolkit is where it
lives. Issue #250 describes the work as blocked on React 19 and MUI 9. That premise is stale:
`package.json` already pins React 19.2.8, `@mui/material` 9.4.0, i18next 26.4.2 and
react-i18next 17.0.15, and all nine required toolkit peers are satisfied, so no framework upgrade
is part of this change.

The toolkit is published only as a GitHub release tarball, not to a registry, and its entry
points live in a gitignored `build/` directory. Adding it trips four repository gates:
`make lint-lockfile` (the URL is not the npm registry), `make lint-licenses` (the package is
`CC0-1.0`, which the allowlist did not hold), Jest (the package exports only an `import`
condition, which CommonJS-mode Jest cannot resolve) and the ADR drift gate (the `dependencies`
map changes). Bun records no integrity for a remote tarball in `bun.lock`, so nothing in the
repository could say whether the installed bytes are the released ones.

ui-toolkit PR [#185](https://github.com/VilnaCRM-Org/ui-toolkit/pull/185) (CRM opt-ins, a
`default` export condition and a per-release `.sha256` asset) merged to the toolkit's `main`
after v0.5.0 and is in no release yet. This record installs v0.5.0, the latest release.

## Decision Drivers

- The product owner's scope: no new modules, components, `UI*` primitives or adapters.
- Root cause, never suppression; quality floors are raise-only, and every widening of an
  allowlist is the narrowest one that works.
- The 470,000 B eager raw budget and the 480,000 B Lighthouse `totalSizeBytes` budget.
- Offline, hermetic lint gates, and a single version string across every machine-read pin.
- Install from a published release only, so the next release is a pin bump.
- No visible change: every visual, accessibility and behaviour baseline stays identical.

## Considered Options

1. **Release tarball, digest gate, identical seams only** — pin the release tarball URL, verify
   the installed bytes offline against a committed manifest, and read only values that are
   identical to CRM's own.
2. **Git dependency** — depend on the toolkit repository at a tag.
3. **Vendor the build output** — commit the toolkit's `build/` into this repository.
4. **Wait for a registry publish** — install only once the toolkit is on a registry that
   records integrity.
5. **Adopt primitives through adapters** — wrap toolkit components behind CRM props.
6. **Wait for the release that carries ui-toolkit #185, or pin its `main`** — take the CRM
   opt-ins now by waiting for their release or by pinning unreleased code.

## Decision Outcome

Chosen option: **"Release tarball, digest gate, identical seams only"**, because it is the only
form Bun can install that carries the built output, it answers the lockfile's missing integrity
with a committed record, and it changes nothing a user can see. The artifacts that implement it:

- The pin: `package.json` names the v0.5.0 release tarball URL, and both `bun.lock` lines carry
  the same URL. The package is not in `trustedDependencies`, so Bun runs none of its lifecycle
  scripts.
- The manifest: `config/ui-toolkit-checksums.json` holds the SHA-256 of 331 installed files
  (330 under `build/` plus `package.json`; `LICENSE` and `README.md` are not hashed), the
  release tarball's own digest (`tarballSha256`) and the outcome of the published-checksum
  check (`releaseChecksum`).
- The two scripts: `scripts/ci/verify-ui-toolkit.mjs` and `scripts/ci/update-ui-toolkit.mjs`,
  thin entry files over constructor-injected classes in `scripts/ci/ui-toolkit/`.
- Both make targets: `make lint-ui-toolkit` verifies the installed tree offline and sits in
  `make lint` and `CI_LINT_TARGETS` directly after `lint-licenses`; `make update-ui-toolkit`
  regenerates the manifest over the network and stays out of `make lint`.
- The lockfile token: `scripts/ci/check-lockfile-registries.sh` strips two fixed-string,
  package-bound tokens built from its `TOOLKIT_URL` literal before its unchanged URL scan, so
  exactly this URL under exactly this package name passes.
- The license: `ALLOWED_LICENSES` in the `Makefile` gains `CC0-1.0`.
- The Jest entries: `jest.config.ts` gains one `moduleNameMapper` entry for named subpaths, one
  `transformIgnorePatterns` entry and one `collectCoverageFrom` inclusion for the verifier;
  `jest.mutation.config.ts` inherits all three.
- The seam: `src/components/ui-breakpoints/index.ts` imports `crmBreakpointsTheme` and
  `heightBreakpoints` by name from `@vilnacrm/ui-toolkit/ui-breakpoints` and re-exports them.
  It is the single seam and the only changed file in `src/`.
- The docs page: [`docs/ui-toolkit.md`](../ui-toolkit.md) carries the import rule, the bump
  recipe, the keep-local register and the upstream follow-ups.

The seam evidence: the whole exported object is deep-equal to CRM's former theme, with 0 of 310
leaves different; `up('md')` is `@media (min-width:768px)` and `down('md')` is
`@media (max-width:767.95px)`, exactly as before. The subpath's `default` export is the website
theme (xs 375, sm 640) and is never read.

The colour seam is deferred: `src/components/ui-color-theme` stays CRM-local, because 10
palette keys differ from the toolkit's `crmColorTheme` (`success` changes and 9 keys are added),
the seam has no production consumer, and the swap would add a wasted module-scope
`createTheme`. Every other CRM primitive stays local too, with the reason recorded in the
keep-local register of [`docs/ui-toolkit.md`](../ui-toolkit.md).

The `.sha256` rule: v0.5.0 has no published checksum asset, so its manifest records
`releaseChecksum: "absent"`. Every later pin must match its published
`vilnacrm-ui-toolkit-<version>.tgz.sha256` asset: the refresher refuses to write otherwise, and
the offline verifier rejects `"absent"` for any version other than 0.5.0.

The provenance claim, stated precisely: installed build artifacts are verifiable offline, and
`bun install --frozen-lockfile` itself fetches unverified bytes. The lockfile pins a URL, not
bytes; the gate detects a tampered or drifted install after the fact and fails `make lint`.
The v0.5.0 build-provenance attestation proves that a build of the `v0.5.0` tag produced a
tarball with that digest; it does not prove the upload, the installed tree or the lockfile.

The ui-toolkit #185 decision: v0.5.0 is installed now, and the next release is a pin bump. The
checksum gate already handles a release that publishes a `.sha256`, the Jest mapper keeps
working when the `default` condition arrives, and the keep-local register says per primitive
whether #185 resolves its reason. Adopting the #185 opt-ins is a deferred follow-up, blocked on
a toolkit release above 0.5.0.

### Deviations from the issue text

Seven deviations, each recorded here and in the pull-request description:

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

### Reversal triggers

- The colour seam stays local until a CRM consumer reads a toolkit-only palette key, or
  upstream ships a CRM-distinct palette.
- Fonts are revisited when the toolkit ships a woff2 build that fits the budget.
- An ESLint import-restriction rule is added by the first pull request that imports a second
  toolkit subpath.
- The #185 opt-ins are adopted after a toolkit release above 0.5.0.

## Positive Consequences

- The dependency is governed: one exact URL, one SPDX id, one version string held equal in five
  machine-read places by the verifier and a tooling test.
- Every visual, accessibility and behaviour baseline is unchanged, because the one value CRM
  reads is identical to the one it replaces, and no eager module imports the toolkit.
- A tampered, drifted or stale install fails `make lint` offline, naming the failing class.
- The next toolkit swap is a UI decision only: the install, the gates and the bump recipe are
  in place.

## Negative Consequences

- The integrity claim is post-install only: `bun install --frozen-lockfile` fetches unverified
  bytes, and the gate detects tampering afterwards.
- Trivy and the SBOM cannot key a URL-versioned package, so the toolkit and its vendored
  `swiper@14.0.6` (MIT) are invisible to them; `swiper` is invisible to the license gate too.
  The fonts inside the package carry OFL notices (`Golos-OFL.txt`, `Inter-OFL.txt`).
- Every install needs egress to `github.com` and `objects.githubusercontent.com`.
- Dependabot cannot bump a URL dependency; bumps are manual, through the recipe in
  [`docs/ui-toolkit.md`](../ui-toolkit.md).
- Dependabot's `bun` updater may fail the whole weekly `bun` job on a tarball-URL entry instead
  of skipping it, which would stop every other npm update without a red check. `website` runs
  the same shape: three `bun` update jobs against its `main` succeeded after its #459 merged, but
  no weekly scan has run yet. The first CRM weekly `bun` run after merge is checked, and a
  failure is escalated to the maintainer.
- The CRM opt-ins of ui-toolkit #185 are not usable until the next toolkit release.
- The breakpoints chunk also builds the unused website theme (upstream follow-up 1).
- Both allowlist widenings (the lockfile URL token and `CC0-1.0`) sit outside the gate ratchet
  and rely on CODEOWNERS review.

## Pros and Cons of the Options

### Release tarball with a digest gate

Pin the release URL, verify installed bytes offline, read identical values only.

#### Good (release tarball)

- Installs the built output from a published release
- The committed manifest supplies the integrity evidence the lockfile lacks
- No visible change, no new component, and every gate passes without suppression

#### Bad (release tarball)

- Two allowlists widen by one entry each
- Integrity is proven after install, not during it; bumps are manual

### Git dependency

Depend on the toolkit repository at a tag.

#### Good (git dependency)

- A tag is human-readable and needs no release asset

#### Bad (git dependency)

- The entry points live in a gitignored `build/`, and Bun does not build a git dependency, so
  nothing importable is installed

### Vendoring the build output

Commit the toolkit's `build/` into this repository.

#### Good (vendoring)

- No network at install time; the bytes are reviewed in the diff

#### Bad (vendoring)

- A 1.3 MB, binary-heavy diff on every release, and upgrades stop being a pin bump

### Waiting for a registry publish

Install only once the toolkit is on a registry that records integrity.

#### Good (registry publish)

- The lockfile would pin bytes, and the scanners would see the package

#### Bad (registry publish)

- Blocks the product owner's scoped installation indefinitely on another repository's plans

### Adapters over toolkit primitives

Wrap toolkit components behind CRM props.

#### Good (adapters)

- CRM could render toolkit components now

#### Bad (adapters)

- Ruled out by the product owner's scope, and every adapter would move a visual or
  accessibility baseline that this change must keep

### Waiting for ui-toolkit #185

Wait for the release that carries ui-toolkit #185, or pin its unreleased `main`.

#### Good (waiting for #185)

- The CRM opt-ins would be available at once

#### Bad (waiting for #185)

- Waiting blocks the installation on another repository's release train
- A `main` build has no release asset, no attestation and no `.sha256`, reports the same 0.5.0
  version, and Bun does not build a git dependency

## Links

- [Issue #250 — install the UI toolkit](https://github.com/VilnaCRM-Org/crm/issues/250)
- [website PR #459 — prior art](https://github.com/VilnaCRM-Org/website/pull/459)
- [ui-toolkit PR #185 — CRM opt-ins](https://github.com/VilnaCRM-Org/ui-toolkit/pull/185)
- [ADR-004](./004-major-dependency-upgrade-cadence.md) — the Dependabot lanes
- [ADR-006](./006-browser-security-header-baseline.md) — the `font-src 'self'` baseline
- [ADR-013](./013-bun-package-manager.md) — the lockfile gate's one exception
- [`docs/ui-toolkit.md`](../ui-toolkit.md) — import rule, bump recipe, keep-local register
