# ADR-016: UI toolkit installed from a digest-verified tarball and consumed through CRM seams

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-29

**Technical Story**: Issue [#250](https://github.com/VilnaCRM-Org/crm/issues/250) asked CRM to
consume the shared `@vilnacrm/ui-toolkit` package. The product owner narrowed it to the
installation alone: _"we do not want to create new modules/components for now, we can do the
ui-kit installation"_. This record covers that installation: how the dependency is pinned and
verified, which gates it passes through, and which single value CRM reads from it. It then
records the v0.6.0 adoption, which the product owner scoped to seven components rendered behind
their existing CRM seams: the container, typography, the four skeleton leaves and back-to-main.

## Context and Problem Statement

CRM and `website` are meant to render one VilnaCRM design system, and the toolkit is where it
lives. Issue #250 describes the work as blocked on React 19 and MUI 9. That premise is stale:
`package.json` already pinned React 19.2.8 (19.3.0 since #307), `@mui/material` 9.4.0, i18next
26.4.2 and react-i18next 17.0.15, and all nine required toolkit peers are satisfied, so no
framework upgrade is part of this change.

The toolkit is published only as a GitHub release tarball, not to a registry, and its entry
points live in a gitignored `build/` directory. Adding it trips four repository gates:
`make lint-lockfile` (the URL is not the npm registry), `make lint-licenses` (the package is
`CC0-1.0`, which the allowlist did not hold), Jest (the package exports only an `import`
condition, which CommonJS-mode Jest cannot resolve) and the ADR drift gate (the `dependencies`
map changes). Bun records no integrity for a remote tarball in `bun.lock`, so nothing in the
repository could say whether the installed bytes are the released ones.

ui-toolkit PR [#185](https://github.com/VilnaCRM-Org/ui-toolkit/pull/185) (CRM opt-ins, a
`default` export condition and a per-release `.sha256` asset) merged to the toolkit's `main`
after v0.5.0, so at installation it was in no release and v0.5.0, then the latest release, was
installed first. v0.6.0, hand-cut on 2026-09-30, is the first release carrying #185 and ui-toolkit
[#187](https://github.com/VilnaCRM-Org/ui-toolkit/pull/187) (the contained focus outline, form and
footer `inheritTheme`, link tones, woff2 fonts and the published MUI augmentation).

## Decision Drivers

- The product owner's scope: no new modules, components, `UI*` primitives or adapters.
- Root cause, never suppression; quality floors are raise-only, and every widening of an
  allowlist is the narrowest one that works.
- The 470,000 B eager raw budget and the 480,000 B Lighthouse `totalSizeBytes` budget.
- Offline, hermetic lint gates, and a single version string across every machine-read pin.
- Install from a published release only, so the next release is a pin bump.
- No visible change at installation: every recorded visual and behaviour baseline stays
  identical, and any later change is taken only as a recorded, accepted delta (the v0.6.0
  adoption lists them).

## Considered Options

1. **Release tarball, digest gate, seams behind CRM props** — pin the release tarball URL,
   verify the installed bytes offline against a committed manifest, and read toolkit values
   only behind CRM's existing seams: identical values at installation, and the recorded deltas
   of the v0.6.0 adoption afterwards.
2. **Git dependency** — depend on the toolkit repository at a tag.
3. **Vendor the build output** — commit the toolkit's `build/` into this repository.
4. **Wait for a registry publish** — install only once the toolkit is on a registry that
   records integrity.
5. **Adopt primitives through adapters** — wrap toolkit components behind CRM props.
6. **Wait for the release that carries ui-toolkit #185, or pin its `main`** — take the CRM
   opt-ins now by waiting for their release or by pinning unreleased code.

## Decision Outcome

Chosen option: **"Release tarball, digest gate, seams behind CRM props"**, because it is the
only form Bun can install that carries the built output, it answers the lockfile's missing
integrity with a committed record, and the v0.5.0 installation changed nothing a user can see.
The v0.6.0 adoption below accepts the deltas it lists. The artifacts that implement it:

- The pin: `package.json` names the v0.8.0 release tarball URL, and both `bun.lock` lines carry
  the same URL; the first pin was v0.5.0, then v0.6.0. The package is not in
  `trustedDependencies`, so Bun runs none of its lifecycle scripts.
- The manifest: `config/ui-toolkit-checksums.json` holds the SHA-256 of 338 installed files
  (337 under `build/` plus `package.json`; `LICENSE` and `README.md` are not hashed), the
  release tarball's own digest (`tarballSha256`) and the outcome of the release-digest
  cross-check (`releaseChecksum`).
- The two scripts: `scripts/ci/verify-ui-toolkit.mjs` and `scripts/ci/update-ui-toolkit.mjs`,
  thin entry files over constructor-injected classes in `scripts/ci/ui-toolkit/`.
- Both make targets: `make lint-ui-toolkit` verifies the installed tree offline and sits in
  `make lint` and `CI_LINT_TARGETS` directly after `lint-licenses`; `make update-ui-toolkit`
  regenerates the manifest over the network and stays out of `make lint`. It hashes the files of
  the downloaded, digest-verified tarball, not the installed tree, and refuses to write when the
  installed tree differs from them.
- The lockfile token: `scripts/ci/check-lockfile-registries.sh` strips two fixed-string,
  package-bound tokens built from its `TOOLKIT_URL` literal before its unchanged URL scan, so
  exactly this URL under exactly this package name passes.
- The license: `ALLOWED_LICENSES` in the `Makefile` gains `CC0-1.0`.
- The Jest entries: `jest.config.ts` gains one `moduleNameMapper` entry for named subpaths, one
  `transformIgnorePatterns` entry and one `collectCoverageFrom` inclusion for the verifier;
  `jest.mutation.config.ts` inherits all three.
- The seam: `src/components/ui-breakpoints/index.ts` imports `crmBreakpointsTheme` and
  `heightBreakpoints` by name from `@vilnacrm/ui-toolkit/ui-breakpoints` and re-exports them.
  It was the single seam and the only changed file in `src/` until the v0.6.0 adoption below.
- The docs page: [`docs/ui-toolkit.md`](../ui-toolkit.md) carries the import rule, the bump
  recipe, the keep-local register and the upstream follow-ups.

The seam evidence: the whole exported object is deep-equal to CRM's former theme, with 0 of 310
leaves different; `up('md')` is `@media (min-width:768px)` and `down('md')` is
`@media (max-width:767.95px)`, exactly as before. The subpath's `default` export is the website
theme (xs 375, sm 640) and is never read.

The colour seam is deferred: `src/components/ui-color-theme` stays CRM-local, because 10
palette keys differ from the toolkit's `crmColorTheme` (`success` changes and 9 keys are added),
the seam has no production consumer, and the swap would add a wasted module-scope
`createTheme`. At installation every other CRM primitive stayed local too; since the v0.6.0
adoption below, each primitive that still stays local has its reason recorded in the
keep-local register of [`docs/ui-toolkit.md`](../ui-toolkit.md).

The release-digest rule: every pin is cross-checked against the digest GitHub computes
server-side for the release asset. The refresher reads the release from the GitHub API and
refuses to write the manifest unless the release is `immutable` and its
`vilnacrm-ui-toolkit-<version>.tgz` asset's `digest` is `sha256:` plus the downloaded tarball's
digest; it then records `releaseChecksum: "matched"`, the only value the offline verifier
accepts. No release is exempt. The rule replaces a published `.sha256` sidecar asset, which an
immutable release can never receive: the toolkit's post-publication upload is refused with
HTTP 422 (ui-toolkit [#190](https://github.com/VilnaCRM-Org/ui-toolkit/issues/190)).

The provenance claim, stated precisely: installed build artifacts are verifiable offline, and
`bun install --frozen-lockfile` itself fetches unverified bytes. The lockfile pins a URL, not
bytes; the gate detects a tampered or drifted install after the fact and fails `make lint`.
The v0.5.0 build-provenance attestation proves that a build of the `v0.5.0` tag produced a
tarball with that digest; it does not prove the upload, the installed tree or the lockfile.

The ui-toolkit #185 decision: v0.5.0 was installed first, and the release carrying #185 was a
pin bump. The checksum gate cross-checks every release against its asset's server-side digest,
and the Jest mapper kept working when the `default` condition arrived in v0.6.0.

### The v0.6.0 adoption

v0.6.0 is pinned, and seven toolkit components now render in CRM, each behind the CRM seam it
replaces. The seam keeps its path, export and props, so no importer changes and no component,
module, `UI*` primitive or adapter is added; option 5 stays rejected.

- `ui-container`: the seam renders the subpath's `default` export. Markup, `sx` and props are
  identical to CRM's former container.
- `ui-typography`: the seam always sets `inheritTheme`, so every variant resolves from the
  ambient CRM theme and the DOM and serialized CSS are unchanged.
- `ui-skeleton-text`, `-block`, `-button` and `-input`: value-identical geometry, colours,
  breakpoints and ids. `AuthSkeleton`, the composite, stays local.
- `ui-back-to-main`: the seam passes the translated label and CRM's own arrow image as the
  icon, so the layout, colours, font size and accessible name are CRM's.

The CRM style modules these replace are deleted, every seam has a unit test that imports it
directly, and the import rule is amended: an adopted subpath is imported by its `default`
export only, inside its own seam, and an ESLint `no-restricted-imports` gate enforces it
alongside the root barrel, `styles.css`, `ui-color-theme` and the `ui-breakpoints` default,
which stay forbidden.

The accepted deltas. The back-to-main letter-spacing below 1024 px moves recorded visual
baselines; the accessibility deltas after it move none:

- The back-to-main label's letter-spacing below 1024 px changes from `0.00938em`, an accident of
  CRM's old `UIButton` wrapping the children in a bare Roboto-default MUI theme, to `normal`.
  That matches Figma (node 15:1104 and the 15:999 band: Golos Text Medium 15/18, letter-spacing
  0). The affected sub-1024 px visual baselines of sign-in, sign-up, not-found and the mobile
  lane are re-recorded for it.
- The back-to-main focus ring changes from `#1EAEFF` (2.46:1 on white, under the 3:1 of
  SC 1.4.11) to `#1A1C1E` (about 17:1). The toolkit exposes no prop to keep the old colour, and
  the Figma node for the band (15:999) defines no focus state, so there is no design value to
  diverge from.
- The back-to-main link carried an `aria-label` equal to its visible text, so its accessible
  name was unchanged and label-in-name held; since v0.8.0 it carries none and is named by that
  text alone. Its icon wrapper is `aria-hidden`, which leaves the accessibility tree unchanged
  because the image was already hidden.
- Each skeleton leaf is `aria-hidden="true"`: an empty decorative shape, with no spoken content
  lost. The loading state is still exposed by CRM's named `AuthSkeleton` section.
- The leaves' shimmer is static under `prefers-reduced-motion: reduce` and gains a `GrayText`
  outline under forced colours. The local `AuthSkeleton` card pulse still animates under
  reduced motion.

The measured cost, on the installed v0.6.0 build: the seven subpaths add 26,469 B raw
(8,098 B gzip) of toolkit code beyond what `ui-breakpoints` already loads; back-to-main's own
closure is 19,779 B raw of that, because it renders `UiButton`. The closure also carries three
module-scope `createTheme` calls CRM never reads. All of it lands in lazily loaded chunks
(sign-in, sign-up, home, not-found and the footer); no seam is in the `src/index.tsx` closure,
so the eager path and its 470,000 B budget are untouched. The per-chunk gzip budget and the
mobile Lighthouse floor are measured in CI.

The button, form, footer, link, fields, `AuthSkeleton`, colour theme, app theme and fonts stay
local. Each reason is in the keep-local register of [`docs/ui-toolkit.md`](../ui-toolkit.md),
and the upstream change that would remove it is in that page's adoption section.

### The v0.8.0 bump: checkbox and text-link adoption (#309)

v0.8.0 is pinned (it carries v0.7.0, ui-toolkit #186, and ui-toolkit #204). For the seams
adopted in v0.6.0 the only observable change is that `UiBackToMain` no longer copies its label
into `aria-label` (ui-toolkit #199): the link is named by its visible text alone.

`ui-checkbox` is adopted behind `src/components/ui-checkbox`, replacing the remember-me box CRM
drew itself. The toolkit component is the Figma checkbox (nodes 7:94 and 7:95): a 24 px box with
an 8 px radius and a `#D0D4D8` border, filled `#1EAEFF` with the white 16 px tick when checked,
which CRM's local box drew in the disabled grey instead. Since v0.8.0 the toolkit draws the tick
and a 2 px `#404142` keyboard focus ring offset 2 px itself, with forced-colours handling, so CRM
deleted its own tick and outline. CRM keeps one delta through the seam's `sx`: the box is 20 px
below 768 px, as the mobile sign-in frame 15:1043 draws it, the consumer override the toolkit
README documents.

The toolkit `ui-link` is adopted for one surface only, behind a new narrow seam
`src/components/ui-text-link` that renders it with `appearance="text"` and `tone="brand"`: the
sign-in "Забули пароль?" link (Figma 15:793, 15:959, 19:855). The link renders unconditionally:
the `forgotPassword` flag that hid it was removed by the user's decision (#309), so until #315
registers `/password-recovery` it lands on the not-found page. CRM's own `src/components/ui-link`
stays local (R2 R5 R17), and the ESLint gate lets only the new seam import the subpath. The brand
tone is 2.45:1 on white, under SC 1.4.3, and the checked box is 2.45:1, under SC 1.4.11; that is
the product owner's decision (toolkit DEV-67), accepted and recorded in
[`docs/ui-toolkit.md`](../ui-toolkit.md). The visible link is covered by one `color-contrast`
entry in `A11Y_EXCEPTIONS` scoped to that link alone and tracked by #276.

### Deviations from the issue text

Seven deviations, each recorded here and in the pull-request description:

1. The "blocked" premise is stale: all nine peers are already satisfied, and no framework
   upgrade is part of this change.
2. v0.5.0 was installed instead of v0.3.0, as the latest release, and v0.6.0 is pinned now.
3. Primitive replacement is partial and adapters are ruled out: v0.6.0 replaces seven
   components behind their seams, the rest stay local with a recorded reason, and the product
   owner's scope excludes adapters.
4. Fonts are deferred. At v0.5.0 the toolkit's TTF fonts totalled 1,348,788 B against the
   480,000 B Lighthouse `totalSizeBytes` budget. v0.6.0 ships 9 woff2 files totalling
   473,836 B against CRM's own 273,168 B; wiring the toolkit's `styles.css` would put about
   483 kB on `/sign-in`, over that budget, and add a second `@font-face` family. CRM keeps its
   own woff2 fonts and never imports the toolkit's `styles.css`.
5. Jest uses a subpath mapper instead of one pointed at `build/index.mjs`, because only
   per-subpath imports are sanctioned (the root barrel is forbidden); since v0.6.0 the mapper
   names the same file as the package's `default` export condition.
6. `crmColorTheme` is not adopted: it differs from CRM's palette in 10 keys.
7. Website PR #459 is the prior art instead of #458.

### Reversal triggers

- The colour seam stays local until a CRM consumer reads a toolkit-only palette key, or
  upstream ships a CRM-distinct palette.
- Fonts are revisited when the toolkit ships a subset woff2 set that fits the budget: about
  483 kB on `/sign-in` with the v0.6.0 set is over the 480,000 B `totalSizeBytes` budget.
- A local row is adopted when a toolkit release removes its reason in the keep-local register,
  through the bump recipe and a swap behind the same seam.
- The module-scope `createTheme` cost goes when a release carries lazy theme construction
  (the open ui-toolkit [#186](https://github.com/VilnaCRM-Org/ui-toolkit/pull/186)).

## Positive Consequences

- The dependency is governed: one exact URL, one SPDX id, one version string held equal in five
  machine-read places by the verifier and a tooling test.
- The adopted components are value-identical to the CRM ones they replace apart from the
  accepted deltas of the v0.6.0 adoption; the sub-1024 px back-to-main letter-spacing change
  re-records the affected baselines. No eager module imports the toolkit.
- Six CRM style modules (`ui-container/styles.ts`, `ui-back-to-main/styles.ts` and the four
  `skeletons/ui-skeleton-<leaf>/styles.ts`) and the skeleton-text style type file are gone,
  `skeletons/base/styles.ts` is trimmed, and CRM and `website` render the same container,
  typography, skeleton leaves and back-to-main.
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
- The adopted components carry about 26 kB raw of toolkit code, and three unused module-scope
  `createTheme` calls, into the lazily loaded auth, home, not-found and footer chunks.
- The adopted components change the accessibility tree (`aria-hidden` leaves and icon wrapper,
  an `aria-label` on back-to-main) and the back-to-main focus ring colour; each is recorded
  above as accepted.
- A future toolkit release can change an adopted component's values; only the visual baselines
  and the seams' direct unit tests would catch it, so every bump re-runs them.
- The breakpoints chunk also builds the unused website theme (upstream follow-up 1).
- Both allowlist widenings (the lockfile URL token and `CC0-1.0`) sit outside the gate ratchet
  and rely on CODEOWNERS review.

## Pros and Cons of the Options

### Release tarball with a digest gate

Pin the release URL, verify installed bytes offline, read toolkit values only behind CRM seams.

#### Good (release tarball)

- Installs the built output from a published release
- The committed manifest supplies the integrity evidence the lockfile lacks
- No visible change at installation, no new component, and every gate passes without
  suppression

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
- A `main` build has no release asset, no attestation and no asset digest, reports the same
  0.5.0 version, and Bun does not build a git dependency

## Links

- [Issue #250 — install the UI toolkit](https://github.com/VilnaCRM-Org/crm/issues/250)
- [website PR #459 — prior art](https://github.com/VilnaCRM-Org/website/pull/459)
- [ui-toolkit PR #185 — CRM opt-ins](https://github.com/VilnaCRM-Org/ui-toolkit/pull/185)
- [ui-toolkit PR #187 — CRM focus ring, typography and link tone](https://github.com/VilnaCRM-Org/ui-toolkit/pull/187)
- [ADR-004](./004-major-dependency-upgrade-cadence.md) — the Dependabot lanes
- [ADR-006](./006-browser-security-header-baseline.md) — the `font-src 'self'` baseline
- [ADR-013](./013-bun-package-manager.md) — the lockfile gate's one exception
- [`docs/ui-toolkit.md`](../ui-toolkit.md) — import rule, bump recipe, keep-local register,
  bundle cost
