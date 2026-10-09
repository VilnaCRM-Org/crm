# UI toolkit

CRM installs the shared VilnaCRM design-system package, `@vilnacrm/ui-toolkit`. Since v0.6.0 it
reads the breakpoints theme from it and renders seven toolkit components, each behind the CRM
seam it replaces: the container, typography, the four skeleton leaves and back-to-main. Since
v0.8.0 it also renders the toolkit checkbox and the toolkit text link, each behind its own seam
(see [Adoption in v0.8.0](#adoption-in-v080)). Every other CRM primitive stays local, with its
reason recorded below. The decision, its options and
its deviations from issue
[#250](https://github.com/VilnaCRM-Org/crm/issues/250) are in
[ADR-016](./adr/016-ui-toolkit-installation.md).

## What is installed

- **Pin:** v0.8.0, the latest toolkit release, installed from its GitHub release tarball:
  `https://github.com/VilnaCRM-Org/ui-toolkit/releases/download/v0.8.0/vilnacrm-ui-toolkit-0.8.0.tgz`.
  The first pin was v0.5.0, then v0.6.0.
  The toolkit is not published to a registry, and a git dependency cannot be used: its entry
  points live in a gitignored `build/`, and Bun does not build a git dependency.
- **Where the pin lives:** the same URL appears in five machine-read places: the `package.json`
  dependency, the `bun.lock` workspace line, the `bun.lock` packages entry, the `version` and
  `tarballUrl` of [`config/ui-toolkit-checksums.json`](../config/ui-toolkit-checksums.json), and
  the `TOOLKIT_URL` literal in
  [`scripts/ci/check-lockfile-registries.sh`](../scripts/ci/check-lockfile-registries.sh).
  `make lint-ui-toolkit` and a tooling test fail when any of them disagree.
- **Peers:** all nine required peers are already satisfied, so the install changed none of
  them:
  - `react` and `react-dom` ^19 (19.3.0)
  - `@mui/material` and `@mui/system` ^9 (9.4.0)
  - `@emotion/react` ^11 (11.14.0) and `@emotion/styled` ^11 (11.14.1)
  - `react-hook-form` ^7 (7.89.0)
  - `i18next` `>=23 <27` (26.4.2) and `react-i18next` `>=14 <18` (17.0.15)
- **Lifecycle scripts:** the package is not in `trustedDependencies`, so Bun runs none of its
  scripts at install time.
- **License:** the toolkit is `CC0-1.0`, like CRM itself, and `ALLOWED_LICENSES` in the
  `Makefile` carries that one id for it. It vendors `swiper@14.0.6` (MIT), and its fonts carry
  OFL notices.

## Importing

The toolkit is imported only by CRM seam files. Every other file imports the seam, whose path,
export and props did not change when it started rendering the toolkit:

```ts
import UiContainer from '@vilnacrm/ui-toolkit/ui-container';
import {
  crmBreakpointsTheme,
  heightBreakpoints as toolkitHeightBreakpoints,
} from '@vilnacrm/ui-toolkit/ui-breakpoints';
```

- **Adopted component subpaths:** each is imported by its `default` export only, and only inside
  its own seam:

  | Toolkit subpath                    | CRM seam                                       |
  | ---------------------------------- | ---------------------------------------------- |
  | `ui-container`                     | `src/components/ui-container/index.tsx`        |
  | `ui-typography`                    | `src/components/ui-typography/index.tsx`       |
  | `ui-skeleton-<leaf>` (four leaves) | `src/components/skeletons/ui-skeleton-<leaf>/` |
  | `ui-back-to-main`                  | `src/components/ui-back-to-main/index.tsx`     |
  | `ui-checkbox`                      | `src/components/ui-checkbox/index.tsx`         |
  | `ui-link` (`appearance="text"`)    | `src/components/ui-text-link/index.tsx`        |

  The four leaves are `text`, `block`, `button` and `input`; each seam is its folder's
  `index.tsx`. The `ui-link` subpath is adopted for the standalone text link only: its seam is
  `ui-text-link`, never CRM's own `src/components/ui-link`, which stays local (R2 R5 R17). A
  seam passes its props through `React.createElement` or by name, never as a JSX spread, which
  `react/jsx-props-no-spreading` rejects.

- **Theme subpath:** `ui-breakpoints` is read by named export only: `crmBreakpointsTheme` and
  `heightBreakpoints`, in `src/components/ui-breakpoints/index.ts`.
- **Forbidden:** the root barrel `@vilnacrm/ui-toolkit` (352,296 B raw across 69 files,
  including `swiper`); `@vilnacrm/ui-toolkit/styles.css` (the toolkit fonts, see
  [Fonts](#fonts)); the `ui-color-theme` subpath (R9); the `default` export of `ui-breakpoints`,
  which is the website theme with xs 375 and sm 640; any `website*` export; every subpath not
  listed above; and an adopted subpath imported anywhere but its own seam.
- **Eager path:** no module in the `src/index.tsx` closure may import the toolkit, so the
  470,000 B initial-entrypoint budget is untouched. Every seam is reached only from lazily
  loaded route and footer chunks.
- **Enforcement:** the ESLint `no-restricted-imports` gate in `eslint.config.mjs` fails
  `make lint-eslint` on the root barrel, `styles.css`, `ui-color-theme`, the `ui-breakpoints`
  `default` export, every subpath not adopted, and an adopted subpath imported anywhere but its
  own seam. It is set in each flat-config block that configures the rule, because flat config
  replaces a rule's options per file. `no-restricted-imports` only sees static `import` and
  `export` declarations, so a dynamic `import()` or a `require()` of a toolkit subpath is held
  by review; no `src` file does either today. The `website*` named exports are held by review. The Jest
  mapper in `jest.config.ts` resolves only `[a-z-]+` subpaths, to `build/<subpath>.mjs`. It
  names the same file as the `default` export condition v0.6.0 added, so removing it is
  optional; the `transformIgnorePatterns` entry and the `.mjs` transform stay required.

## The digest gate

`make lint-ui-toolkit` runs inside `make lint`, in the dev container, and needs no network. It
reads [`config/ui-toolkit-checksums.json`](../config/ui-toolkit-checksums.json), which holds the
SHA-256 of 338 installed files (337 under `build/` plus `package.json`; `LICENSE` and
`README.md` are not hashed), the release tarball's digest (`tarballSha256`) and the outcome of
the release-digest cross-check (`releaseChecksum`). It fails closed, naming the class, on any of:

| Class      | Fails when                                                |
| ---------- | --------------------------------------------------------- |
| `manifest` | bad algorithm, list, path, hex or `releaseChecksum`       |
| `pin`      | `package.json` spec is not a release-tarball URL          |
| `drift`    | any of the five pin statements disagree                   |
| `install`  | package absent, or installed version differs from the pin |
| `digest`   | an installed file's sha256 differs from the manifest      |
| `missing`  | a manifest path is absent from the install                |
| `extra`    | an installed file is neither in the manifest nor unhashed |

On success it prints `ui-toolkit integrity: OK (v0.8.0, 338 artifacts verified, 0 extra files)`.

**What it proves, precisely:** installed build artifacts are verifiable offline;
`bun install --frozen-lockfile` itself fetches unverified bytes. `bun.lock` pins the tarball's
URL, not its bytes, so the gate cannot stop a tampered download from being installed; it
detects a tampered, drifted or stale install afterwards and fails `make lint`.

**The release-digest rule:** every pin is cross-checked against the digest GitHub computes
server-side for each release asset. `make update-ui-toolkit` reads
`https://api.github.com/repos/VilnaCRM-Org/ui-toolkit/releases/tags/v<version>` (with
`Authorization: Bearer $GITHUB_TOKEN` when that variable is set) and refuses to write the
manifest unless the release is `immutable`, lists an asset named
`vilnacrm-ui-toolkit-<version>.tgz`, and that asset's `digest` is exactly `sha256:` plus the
digest of the downloaded tarball; only then does it record `releaseChecksum: "matched"`. An
immutable release cannot have its assets replaced, which is what makes the digest a stable
anchor. The offline gate accepts no other `releaseChecksum` value, so the rule holds without
network access. There is no exemption: v0.5.0's asset digest also equals its committed
`tarballSha256`. The rule replaces a published `.sha256` sidecar asset, which can never exist:
the toolkit's releases are immutable, so its post-publication upload is refused (ui-toolkit
[#190](https://github.com/VilnaCRM-Org/ui-toolkit/issues/190)).

**The tarball-derived digests:** the manifest's `artifacts` come from the verified tarball, not
from `node_modules`. After the release-digest check, `make update-ui-toolkit` decompresses the
downloaded bytes with `node:zlib` and reads the tar itself (`UiToolkitTarballParser`: ustar
headers and their `prefix` field, pax `path` overrides, regular files only, the later entry
winning a repeated path), strips the `package/` prefix, drops `LICENSE` and `README.md`, and
hashes every file whose path is `package.json` or under `build/`. It then compares the installed
tree with the tarball's files and refuses, leaving the manifest unchanged, on any difference, as
an `[install]` finding: `<path> differs from the verified release tarball`,
`<path> is missing from the installed tree` or `<path> is installed but not in the release
tarball`. A modified installed file can therefore never be baked into the manifest while
`package.json` keeps the pin. A downloaded body whose digest matches but which is not a
gzip-compressed tar is a `[download]` finding, because the asset itself is unusable.

**The release attestation:** `gh attestation verify` was verified for the first pin, v0.5.0,
only:

```bash
gh attestation verify vilnacrm-ui-toolkit-0.5.0.tgz -R VilnaCRM-Org/ui-toolkit
```

It proves that a build of the `v0.5.0` tag produced a tarball with that digest. It does not
prove the upload, the installed tree or the lockfile; the manifest and `make lint-ui-toolkit`
stay the offline proof.

The v0.6.0 asset digest,
`sha256:a4c92edf1caebf1f688c8ba70b31efb9ff5792202d228a2fb51c6d11ba76895c`, also has
build-provenance attestations in the toolkit repository:
`GET /repos/VilnaCRM-Org/ui-toolkit/attestations/sha256:<digest>` returns 2. They were produced
by its `release-provenance` workflow, which re-packs the tag byte-identically. That workflow's
asset upload fails on immutable releases (ui-toolkit
[#190](https://github.com/VilnaCRM-Org/ui-toolkit/issues/190)), which is why the refresher
reads the release API's server-side digest instead of a sidecar asset.

## Stale dev container

The dev container keeps `node_modules` in a named volume, which Docker seeds from the image only
when it is empty. After a host-side `bun add`, or on a worktree whose volume predates the pin,
the volume still holds the old tree, and `make lint` fails in `lint-ui-toolkit` with an
`[install]` finding. Run `make install`, which runs `bun install --frozen-lockfile` in the dev
container and refreshes the volume; the gate then passes. The gate never passes on a stale
tree.

## Bumping the toolkit

Dependabot cannot bump a URL dependency, so every bump is manual and follows this one recipe,
with no variant. Run it from a host terminal with the dev container up (`make start`), in this
order:

1. `docker compose exec -T dev bun add "<new release URL>"`. This is the bare-URL form the
   toolkit's CONSUMING.md and `website`'s docs use: bun names the dependency from the
   tarball's own manifest, rewrites `package.json` and both `bun.lock` lines, and installs the
   new tree into the dev container's `node_modules` volume. The recipe never hand-edits
   `package.json` and then runs a plain `bun install`; `bun add` does both in one step. Bun
   1.3.5 refuses the bare URL when it replaces an existing URL pin, with `DependencyLoop`
   naming the old and the new tarball; name the package instead,
   `bun add "@vilnacrm/ui-toolkit@<new release URL>"`. Keep `bun.lock` to the two toolkit
   lines: if the add also re-hoists unrelated packages, restore it, change only those two
   URLs, and confirm `bun install --frozen-lockfile` accepts the result unchanged.
2. Edit `TOOLKIT_URL` in `scripts/ci/check-lockfile-registries.sh` to the same URL. This is
   the one manual edit, and the verifier's `drift` class fails until it matches.
3. Run the refresher, then both gates:

```bash
make update-ui-toolkit
make lint-lockfile lint-ui-toolkit
```

The refresher reads only the `package.json` pin (`readPackagePin()`) and the installed version,
so step 2 can come before or after it; doing it second keeps every pin statement consistent
before any digest is written. For every release the refresher also requires the release API
to report the release immutable and the tarball asset's server-side digest to agree, and records
`releaseChecksum: "matched"`. It takes every artifact digest from that verified tarball and
refuses when the installed tree from step 1 differs from it, so a stale or modified
`node_modules` fails the bump instead of entering the manifest. The machine-read part of the
diff is exactly: one `package.json` line, the two `bun.lock` lines (plus any peer-range change
the new release makes, which is then a reviewed peer decision), the gate literal and the
manifest. The bump also edits the version named in `docs/ui-toolkit.md` and records the new pin
in ADR-016: changing the `dependencies` map trips the ADR drift gate (`config/docs-policy.json`,
`architectureDrift.manifestKeys`), which the ADR edit satisfies without the escape hatch. No
script, test or constant changes. Running `make update-ui-toolkit` to clear a red
`lint-ui-toolkit` without re-reviewing the release is forbidden.

## Keep-local register

This is the one register of the CRM primitives and themes, adopted or local, with the reason
each local one stays local. The reason codes belong to this register only, and each holds for
v0.6.0. A code keeps its number while its reason is true, and a retired code is never reused.
v0.7.0 closed the upstream issues behind several codes (ui-toolkit #186 closes #191 to #199);
the v0.8.0 bump adopted only the checkbox and the text link, and each local row stays local
until a design-checked swap re-measures its reason against the pinned release.

- **R2** website-theme fallback: CRM's app theme fails the toolkit's `isUiTheme` guard, so a
  component that styles from the toolkit theme without `inheritTheme` falls back to the
  module-scope website `uiTheme`.
- **R3** through that fallback, `sm` resolves to the website's 640 instead of CRM's 480, so an
  `sm` rule moves for viewports from 481 to 639 px. Only components with an `sm` rule are hit.
- **R5** different API surface: `UiLink` requires `href` and drops `component`, so the swap
  needs an adapter (out of scope).
- **R6** no `src` importer; nothing to swap.
- **R7** eager path under the 470,000 B budget; ADR-007 reliability model not upstream.
- **R8** no toolkit counterpart.
- **R9** whole-object value differs: 10 palette keys differ (`success` changes, 9 keys are
  added), and the seam has no production consumer.
- **R11** CRM's skeleton is a named `section[aria-label]`; the toolkit skeleton deliberately
  stays a nameless busy container.
- **R13** `UiButton`'s variant rules are `sx`, which beats the `MuiButton` `styleOverrides` in
  `src/styles/theme.ts`: the outlined pill radius and `#969B9D` border replace CRM's 12 px
  radius and `#E1E7EA` border, and the text variant loses MUI's `0.02857em` letter-spacing, so
  the not-found, auth-provider and home buttons change.
- **R14** `loadingMode="native"` never forwards `loading` to MUI, so the `MuiButton-loading`
  class that the login and registration e2e specs and the unit tests select is gone.
- **R15** `UiForm`'s submit differs: CRM's primary has no `contrastText`, so MUI gives the label
  on `#1EAEFF` the colour `rgba(0,0,0,0.87)`; the label drops to weight 400 below the website
  `sm` (640); the form forwards no spinner; and native mode announces nothing on submit.
- **R16** `UiFooter variant="crm"` values differ, and the variant takes no override: link colour
  `#404142` instead of `#1976D2`, the logo as an `<img>` instead of CRM's inline `<svg>`,
  letter-spacing, the `lg` max-height clamp, and the hover, focus and visited states.
- **R17** `UiLink` forces its colour through `sx` (tone `brand` `#1EAEFF` or `accessible`
  `#0074B5`, against CRM's `#1976D2`) and emits a fixed `@media (max-width:1130px)` 1rem
  font-size rule after the consumer's own.
- **R18** the field API is compatible; the blocker is visual. Input heights, placeholder size,
  value weight and colour, and the focus and error outlines differ at the 1280 and 1366 px
  baselines, and the toolkit error outline `#DF7878` is 2.96:1 on white, under the 3:1 of
  SC 1.4.11.
- **R19** `AuthSkeleton` layout: its form section has no `flexGrow` and no vertical centering,
  its card border is `#E1E7EA` instead of `#EAECEE`, and its static shadow differs.

Retired codes, resolved in v0.6.0: R1 (`UiButton`'s extra `role="status"` node, by
`loadingMode="native"`), R4 (`UiFooter`'s render-time `process.env` read, by `variant="crm"`),
R10 (no contained `:focus-visible` outline, by `focusOutline` and `submitFocusOutline`) and R12
(`aria-label="container"` on a generic `div`, dropped). An earlier revision listed
`ui-back-to-main` under R3; that was wrong: it and its container read only `md`, `lg` and `xl`,
which are 768, 1024 and 1440 in both breakpoint sets, and its text-variant button has no `sm`
rule.

| CRM primitive or theme                                  | Importers  | Status  | Reason        |
| ------------------------------------------------------- | ---------- | ------- | ------------- |
| `ui-breakpoints`                                        | 17 (lazy)  | adopted | named exports |
| `ui-container`                                          | 2          | adopted | -             |
| `ui-typography`                                         | 11         | adopted | -             |
| `ui-skeleton-text`, `-block`, `-button`, `-input`       | 1          | adopted | -             |
| `ui-back-to-main`                                       | 2          | adopted | -             |
| `ui-checkbox`                                           | 1          | adopted | -             |
| `ui-text-link` (toolkit `ui-link`, `appearance="text"`) | 1          | adopted | -             |
| `ui-button`                                             | 7          | local   | R2 R3 R13 R14 |
| `ui-form`                                               | 2          | local   | R3 R14 R15    |
| `ui-footer`                                             | 3          | local   | R16           |
| `ui-link`                                               | 1          | local   | R2 R5 R17     |
| `ui-form-input-field`, `ui-text-field-form`             | 1          | local   | R18           |
| `ui-text-field`, `ui-input`                             | 0          | local   | R6            |
| `auth-skeleton`                                         | 2          | local   | R3 R11 R19    |
| `ui-color-theme`                                        | 1 (orphan) | local   | R9            |
| `error-boundary`, `ui-error-boundary`                   | 5 (eager)  | local   | R7            |
| `ui-live-status`                                        | eager      | local   | R8            |
| `ui-offline-notice`                                     | -          | local   | R8            |
| `ui-async-section`, `route-fallback`                    | -          | local   | R8            |
| layouts, not-found, forbidden, server-error, error-page | -          | local   | R8            |
| `render-with-theme`                                     | tests only | local   | R8            |
| `src/styles/theme.ts` (app theme)                       | eager      | local   | R8            |

`ui-color-theme` stays local until a CRM consumer reads a toolkit-only palette key, or upstream
ships a CRM-distinct palette; either one reverses R9.

What each adopted row renders, and what it changes:

- `ui-container`: the same `Box`, with no role, `aria-*` or `id`, the same `sx` in the same key
  order (width 100%, `margin: 0 auto`, gutters of 15, 26, 32 and 124 px at 768, 1024 and
  1440 px), and the same single `children` prop. It reads no theme. No change.
- `ui-typography`: the seam always sets `inheritTheme`, so the toolkit passes `sx` through and
  every variant CRM uses resolves from the ambient CRM theme. The DOM, the serialized CSS and
  every selector stay the same. Without the flag, `h4` would turn 600, 1.875rem and `#484848`;
  the seam's direct unit test pins the ambient values.
- `ui-skeleton-text`, `-block`, `-button`, `-input`: geometry, colours, breakpoints, ids and the
  placeholder class are value-identical. Accepted non-pixel changes: each leaf is
  `aria-hidden="true"`, an empty decorative shape with no spoken content lost, and the shimmer
  stops under `prefers-reduced-motion: reduce` and gains a `GrayText` outline under forced
  colours. The recorded baselines stay identical, because the visual spec disables animations
  and emulates reduced motion. `AuthSkeleton` stays local, so the named `section` and the card
  pulse are still CRM's; the pulse still animates under reduced motion.
- `ui-back-to-main`: the seam passes the translated `buttons.back_to_main` label and CRM's own arrow
  `<img alt="" aria-hidden="true">` as the icon, so the layout, colours, font size, `href` and
  accessible name are CRM's. Accepted changes: the label's letter-spacing below 1024 px changes from
  `0.00938em`, an accident of CRM's old `UIButton` wrapping the children in a bare Roboto-default
  MUI theme, to `normal`, which matches Figma (node 15:1104 and the 15:999 band: Golos Text Medium
  15/18, letter-spacing 0), and the affected sub-1024 px visual baselines of sign-in, sign-up,
  not-found and the mobile lane are re-recorded for it; the keyboard focus ring is `#1A1C1E` (about
  17:1 on white) instead of `#1EAEFF` (2.46:1, under the 3:1 of SC 1.4.11); since v0.8.0 the link
  carries no `aria-label` and is named by its visible text alone (ui-toolkit [#199][tk199]), so
  label-in-name holds without the duplicate; the icon wrapper is `aria-hidden`,
  which leaves the accessibility tree unchanged because the image was already hidden; and the
  label's font stack, `var(--ui-toolkit-font-golos, 'Golos')`, has no generic fallback while Golos
  loads. No recorded baseline focuses the link, so the focus ring moves none. One CRM-side delta
  sits on the seam (#309): it wraps the toolkit band in a plain `div#back-to-main-band` whose rule
  top-aligns the inline-flex link, because inside the toolkit's block container the link sat on a
  line-box strut and the band measured 65.86 px instead of Figma's 64 px (56 px on mobile). The
  fix belongs upstream; the wrapper goes when a release removes the strut.

The Storybook preview theme and the unit-test `testTheme` stay CRM's. The adopted components
either read no toolkit theme or opt out of it with `inheritTheme`, and the fallback theme
`UiBackToMain` reads changes no computed value.

## Adoption in v0.6.0

v0.6.0 is the first release carrying the CRM opt-ins of ui-toolkit
[#185](https://github.com/VilnaCRM-Org/ui-toolkit/pull/185) and
[#187](https://github.com/VilnaCRM-Org/ui-toolkit/pull/187). Seven component subpaths were
adopted with it. Each swap:

- happens behind the existing CRM seam and its current props: the seam keeps its path, export
  and props and renders the toolkit component, so no importer changes and no component, module,
  `UI*` primitive or adapter is added;
- deletes the CRM style module the toolkit replaces: `ui-container/styles.ts`,
  `ui-back-to-main/styles.ts` and the four `skeletons/ui-skeleton-<leaf>/styles.ts`;
- has a unit test that imports the seam directly, so the 100% coverage and mutation gates
  reach it;
- is held to the same evidence: 0 visual diffs beyond the re-recorded sub-1024 px back-to-main
  baselines, 0 new axe violations,
  the keyboard contract, the eager budget and the Lighthouse floors.

**Bundle cost.** Measured on the installed v0.6.0 build, before CRM's bundler and before the
deleted CRM styles are subtracted, the seven subpaths add 26,469 B raw (8,098 B gzip) of
toolkit code beyond what `ui-breakpoints` already loads:

| Adopted subpaths                | Raw bytes | Gzip bytes |
| ------------------------------- | --------- | ---------- |
| `ui-container`, `ui-typography` | 5,660     | 2,122      |
| the four skeleton leaves        | 7,580     | 2,560      |
| `ui-back-to-main`               | 19,779    | 6,506      |
| all seven (shared chunks once)  | 26,469    | 8,098      |

`ui-back-to-main` is the heaviest because it renders `UiButton` and brings its field-control
chunk. The closure also runs three module-scope `createTheme` calls (the website `uiTheme` and
the two colour themes) that CRM never reads and cannot tree-shake. All of it lands in lazily
loaded chunks: sign-in, sign-up, home, not-found and the footer. No seam is in the
`src/index.tsx` closure, so the eager path and its 470,000 B budget are untouched; the
per-chunk gzip budget and the mobile Lighthouse floor are measured in CI.

**What remains blocked.** Every other row stays local for a reason v0.6.0 does not remove, and
none of these can be closed on the CRM side without an adapter or a wrapper, which the scope
excludes:

- `ui-button` needs variant rules that yield to a consumer theme's `styleOverrides` (R13), a
  loading state that keeps the `MuiButton-loading` class in native mode (R14), and a way for a
  non-toolkit theme such as CRM's to supply its breakpoints and typography (R2, R3).
- `ui-form` needs a submit label colour that does not depend on `contrastText`, a spinner prop,
  a status announcement in native mode (R15), the loading class (R14) and CRM breakpoints (R3).
- `ui-footer` needs its `crm` variant to match CRM's footer values, or to accept overrides
  (R16). Taking the toolkit's darker link colour instead is a separate, design-checked decision.
- `ui-link` needs a tone that leaves the consumer's colour alone, no fixed 1130 px font-size
  rule (R17), CRM breakpoints (R2) and the `component` prop with an optional `href` (R5).
- The fields need a design-checked geometry that matches CRM's inputs, and an error outline of
  at least 3:1 (R18).
- `auth-skeleton` stays local by design: its nameless container is a deliberate toolkit
  decision (R11), and its layout, border and shadow differ (R19) on top of R3.
- `ui-color-theme` waits for a CRM-distinct palette (R9); the open ui-toolkit
  [#186](https://github.com/VilnaCRM-Org/ui-toolkit/pull/186) adds one.

The module-scope theme work is the one cost shared by every adopted row. The open
ui-toolkit #186 builds the fallback theme lazily and moves component styles to plain token
objects; a release carrying it is a pin bump through the [recipe](#bumping-the-toolkit) that
removes those `createTheme` calls from CRM's chunks.

## Adoption in v0.8.0

v0.8.0 is pinned; it also carries v0.7.0 (ui-toolkit
[#186](https://github.com/VilnaCRM-Org/ui-toolkit/pull/186), the CRM swap blockers) and
[#204](https://github.com/VilnaCRM-Org/ui-toolkit/pull/204) (the checkbox tick and focus ring,
the text-link appearance). Its `package.json` changes only the version: no peer or exports-map
change.

**What the bump changes for the seams adopted in v0.6.0**, read from the source diff between
the two tags and held by each seam's unit test:

- `ui-container`, `ui-typography`, the four skeleton leaves and `ui-breakpoints`: no observable
  change. Their breakpoint values still resolve to 768, 1024 and 1440, and the fallback theme a
  non-toolkit theme falls back to is now built lazily instead of at module scope.
- `ui-back-to-main`: the link no longer copies its label into `aria-label`; it is named by its
  visible text alone, which is the fix CRM asked for in ui-toolkit [#199][tk199]. Markup and
  styles are otherwise unchanged.

**The checkbox.** `ui-checkbox` renders the Figma tick (node 7:94) itself, as an encoded
`data:image/svg+xml` background, and a 2 px `#404142` focus ring offset 2 px on keyboard focus
(`:focus-within` with a `:has(:focus-visible)` guard, so a pointer click draws none; Firefox
before 121 has no `:has()` and also draws it on click). Under forced colours the ring uses
`CanvasText` and the checked box keeps its fill. CRM's own tick and focus outline are deleted;
the seam keeps one delta through `sx`, the 20 px box below 768 px from the mobile frame 15:1043,
which the toolkit README ("Checkbox size and focus") documents as the consumer override.

**The text link.** `ui-link` with `appearance="text"` and `tone="brand"` is the Figma sign-in
link (nodes 15:793, 15:959, 19:855): Golos 500 15/18 below 768 px and from 1440 px, Golos 600
18/normal from 768 to 1439.95 px, `#1EAEFF`, no underline in any state, and a 2 px `#404142`
focus outline on `:focus-visible`. `appearance="text"` drops the fixed 1130 px font-size rule
(R17) and the `sm` rule, so neither applies to it. It is adopted behind a new narrow seam,
`src/components/ui-text-link` (`UITextLink`, `href` and `children` only), used by the
sign-in "Забули пароль?" link, which renders unconditionally since the `forgotPassword` flag was
removed (#309). It points at `/password-recovery`, which lands on the not-found page until #315
registers the route. CRM's `ui-link` keeps its local seam and stays on the register. One
CRM-side delta sits on the seam: `src/index.css` paints every `a:visited` with
`--mui-palette-deep-blue`, which outranks the toolkit's class-only colour, so the seam passes
`sx` that keeps `#1EAEFF` on `:visited:not(:hover):not(:active)` (the toolkit hover and active
colours still apply), as the error-page home link already does.

**Accepted accessibility conflict.** The brand tone is 2.45:1 on white, and its toolkit hover
`#297FFF` 3.77:1, both under the 4.5:1 of SC 1.4.3; the checked checkbox fill and its white tick
are 2.45:1 against the 3:1 of SC 1.4.11. This is the product owner's explicit choice (toolkit
DEV-67), and the conflict is accepted and recorded rather than open: the link now always renders
on `/sign-in`, by the user's decision to remove the `forgotPassword` flag (#309). The axe route
scan therefore sees it, and `A11Y_EXCEPTIONS` carries one `color-contrast` entry scoped to that
link alone (`form a.MuiLink-root[href="/password-recovery"]`), tracked by CRM issue #276 —
never a rule-wide exception. The entry is deleted when #276 closes or the link moves to the
accessible alternative, `tone="accessible"` (`#0074B5`, 5.04:1). The checkbox fill has no entry
because axe does not evaluate non-text contrast; it is tracked under #276 as a known gap and is
resolved when #276 closes or the toolkit checkbox fill reaches 3:1 against white.

## Fonts

The toolkit's fonts and `styles.css` are not wired. Since v0.6.0 its `styles.css` declares
`Golos` and `Inter` as woff2 with `font-display: swap`: the same font versions as CRM's, with
identical outlines for every character CRM covers, but 473,836 B in total against CRM's
273,168 B, because its Inter is not subset. Swapping would take `/sign-in` to about 483 kB,
over the 480,000 B Lighthouse `totalSizeBytes` budget, and a second `@font-face` for the same
family would silently replace CRM's files. CRM keeps `src/styles/fonts.css`. No font wiring is
needed for the adopted components: their styles read
`var(--ui-toolkit-font-golos, 'Golos')` and `var(--ui-toolkit-font-inter, Inter)`, which
resolve to CRM's own faces. Fonts are revisited when the toolkit ships a subset build that fits
the budget.

## Upstream follow-ups

This list is the one source for them. Statuses are as of 2026-09-30; v0.7.0 since closed the
issues in the table below (ui-toolkit #186) and #199 is taken in v0.8.0 (see
[Adoption in v0.8.0](#adoption-in-v080)). The blockers that keep
the remaining rows of the [keep-local register](#keep-local-register) local are filed upstream:

| Blocker                                                   | Reasons | Issue         |
| --------------------------------------------------------- | ------- | ------------- |
| `UiButton` `sx` precedence, loading class, letter-spacing | R13 R14 | [#191][tk191] |
| `UiForm` submit ink, mobile weight, spinner, announcement | R15     | [#192][tk192] |
| `UiFooter variant="crm"` value differences                | R16     | [#193][tk193] |
| `UiLink` forced colour, fixed 1130px font size            | R17     | [#194][tk194] |
| `UiInput` error outline `#DF7878` at 2.96:1               | R18     | [#195][tk195] |
| `UiInput` / `UiTextFieldForm` CRM geometry and type       | R18     | [#196][tk196] |
| `AuthSkeleton` named section, layout, border, shadow      | R11     | [#197][tk197] |
| Website-theme fallback under a non-toolkit theme          | R2 R3   | [#198][tk198] |
| `UiBackToMain` `aria-label` repeats the visible text      | adopted | [#199][tk199] |

1. Annotate the module-scope `createTheme` calls `/*#__PURE__*/`, or split the website and CRM
   themes into separate chunks. Status: open; the open ui-toolkit #186 builds the fallback
   theme lazily and keeps `createTheme` out of the chunk every component imports.
2. Stop exporting the website theme as the unnamed `default` of shared subpaths. Status: open;
   #186 keeps it on purpose.
3. Give CRM a distinct palette, or drop `crmColorTheme` (in v0.6.0 value-identical to
   `websiteColorTheme`, a superset of CRM's palette, with a different `success`). Status: open;
   #186 adds `crmPalette`.
4. Ship MUI module augmentation for the extra palette keys. Status: released in v0.6.0
   (`mui-augmentation.d.mts`, #187).
5. Add a `default` or `require` export condition, or document the Jest mapper recipe. Status:
   released in v0.6.0 (#185).
6. Bind components to a theme variant instead of the module-scope website breakpoints
   (skeletons, container, footer, form, back-to-main, card list). Status: partly released in
   v0.6.0: the `ui-form` and skeleton `sm` rules resolve at render time, but only against a
   toolkit theme, so in CRM they still resolve to 640 (R3). The container, footer and
   back-to-main rules are in #186. Open: a way for a non-toolkit theme to supply breakpoints.
7. Fonts: woff2 with `font-display: swap`; reconcile the `Golos Text` and `Golos` names.
   Status: released in v0.6.0 (#187), with the names reconciled through the
   `--ui-toolkit-font-*` properties. Open: a subset build that fits the budget.
8. Replace `UiFooter`'s render-time `process.env` read with a prop. Status: released in v0.6.0
   as `variant="crm"` (#185), whose labels take `inheritTheme` (#187). Open: the variant's
   values (R16).
9. Remove `UiButton`'s extra `role="status"` node, or make it opt-in, and give the contained
   variant a `:focus-visible` outline. Status: released in v0.6.0 as `loadingMode="native"`
   (#185) and `focusOutline` (#187). Open: the `sx` precedence (R13) and the loading class in
   native mode (R14).
10. Drop `scripts.prepare` from the published manifest; fix source maps pointing at
    `../../src`. Status: open.
11. Publish to a registry that records integrity, or attach a signed digest or attestation to
    each release, so consumers can verify the tarball itself. Status: attestation met for
    v0.5.0, by ui-toolkit #178 (before #185): `release-provenance.yml` ran on the v0.5.0
    publication, packed the tarball again from the `v0.5.0` tag (commit `2fb38e4e`) and attested
    it with `actions/attest-build-provenance`. That rebuild reproduced the published bytes, so
    `gh attestation verify` passes on the pinned asset (`sha256:bb3d61a6...`). It proves that
    the workflow at `refs/tags/v0.5.0` built a tarball with that digest from the tag's source.
    It does not prove that the asset was uploaded by that workflow: the job's later
    `gh release upload --clobber` was refused ("Cannot delete asset from an immutable
    release"), so the asset is the original upload, identical to the attested bytes by digest.
    Nor does it cover the installed tree or the lockfile; the committed manifest and
    `make lint-ui-toolkit` stay the offline proof. For v0.6.0 the asset digest
    `sha256:a4c92edf...` also has build-provenance attestations in the toolkit repository
    (`GET /repos/VilnaCRM-Org/ui-toolkit/attestations/sha256:<digest>` returns 2), produced by
    the same `release-provenance` workflow re-packing the tag byte-identically;
    `gh attestation verify` was run for v0.5.0 only. Not met: the `.sha256` sidecar #185 added
    to that same post-publication step, because an immutable release refuses the upload
    (HTTP 422, ui-toolkit [#190](https://github.com/VilnaCRM-Org/ui-toolkit/issues/190)), so the
    `release-provenance` asset upload fails on immutable releases;
    `make update-ui-toolkit` cross-checks the release API's server-side asset digest instead.
    Open: a registry that records integrity, so the lockfile pins bytes.

[tk191]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/191
[tk192]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/192
[tk193]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/193
[tk194]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/194
[tk195]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/195
[tk196]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/196
[tk197]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/197
[tk198]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/198
[tk199]: https://github.com/VilnaCRM-Org/ui-toolkit/issues/199
