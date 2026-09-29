# UI toolkit

CRM installs the shared VilnaCRM design-system package, `@vilnacrm/ui-toolkit`, and reads
exactly one value from it: the breakpoints theme. Every other CRM primitive stays local, with
its reason recorded below. The decision, its options and its deviations from issue
[#250](https://github.com/VilnaCRM-Org/crm/issues/250) are in
[ADR-016](./adr/016-ui-toolkit-installation.md).

## What is installed

- **Pin:** v0.5.0, the latest toolkit release, installed from its GitHub release tarball:
  `https://github.com/VilnaCRM-Org/ui-toolkit/releases/download/v0.5.0/vilnacrm-ui-toolkit-0.5.0.tgz`.
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
  - `react` and `react-dom` ^19 (19.2.8)
  - `@mui/material` and `@mui/system` ^9 (9.4.0)
  - `@emotion/react` ^11 (11.14.0) and `@emotion/styled` ^11 (11.14.1)
  - `react-hook-form` ^7 (7.88.0)
  - `i18next` `>=23 <27` (26.4.2) and `react-i18next` `>=14 <18` (17.0.15)
- **Lifecycle scripts:** the package is not in `trustedDependencies`, so Bun runs none of its
  scripts at install time.
- **License:** the toolkit is `CC0-1.0`, like CRM itself, and `ALLOWED_LICENSES` in the
  `Makefile` carries that one id for it. It vendors `swiper@14.0.6` (MIT), and its fonts carry
  OFL notices.

## Importing

Import named exports from a toolkit subpath, and nothing else:

```ts
import {
  crmBreakpointsTheme,
  heightBreakpoints as toolkitHeightBreakpoints,
} from '@vilnacrm/ui-toolkit/ui-breakpoints';
```

- **Allowed:** named exports from `@vilnacrm/ui-toolkit/<subpath>`. Today that is only
  `crmBreakpointsTheme` and `heightBreakpoints` from `ui-breakpoints`, imported by the one seam,
  `src/components/ui-breakpoints/index.ts`. Every other file keeps importing that seam.
- **Forbidden:** the root barrel `@vilnacrm/ui-toolkit` (346,575 B raw, about 60 chunks,
  including `swiper`); `@vilnacrm/ui-toolkit/styles.css` (the toolkit fonts, see
  [Fonts](#fonts)); the `default` export of any subpath (on the theme subpaths it is the website
  theme, with xs 375 and sm 640); and any `website*` or `Ui*` export.
- **Eager path:** no module in the `src/index.tsx` closure may import the toolkit, so the
  470,000 B initial-entrypoint budget is untouched. The seam is reached only from lazily loaded
  route and footer chunks.
- **Enforcement:** the rule is documented, not linted. The Jest mapper in `jest.config.ts`
  resolves only `[a-z-]+` subpaths, to `build/<subpath>.mjs`. An ESLint import-restriction rule
  is added by the first pull request that imports a second toolkit subpath.

## The digest gate

`make lint-ui-toolkit` runs inside `make lint`, in the dev container, and needs no network. It
reads [`config/ui-toolkit-checksums.json`](../config/ui-toolkit-checksums.json), which holds the
SHA-256 of 331 installed files (330 under `build/` plus `package.json`; `LICENSE` and
`README.md` are not hashed), the release tarball's digest (`tarballSha256`) and the outcome of
the published-checksum check (`releaseChecksum`). It fails closed, naming the class, on any of:

| Class      | Fails when                                                |
| ---------- | --------------------------------------------------------- |
| `manifest` | bad algorithm, list, path, hex or `releaseChecksum`       |
| `pin`      | `package.json` spec is not a release-tarball URL          |
| `drift`    | any of the five pin statements disagree                   |
| `install`  | package absent, or installed version differs from the pin |
| `digest`   | an installed file's sha256 differs from the manifest      |
| `missing`  | a manifest path is absent from the install                |
| `extra`    | an installed file is neither in the manifest nor unhashed |

On success it prints `ui-toolkit integrity: OK (v0.5.0, 331 artifacts verified, 0 extra files)`.

**What it proves, precisely:** installed build artifacts are verifiable offline;
`bun install --frozen-lockfile` itself fetches unverified bytes. `bun.lock` pins the tarball's
URL, not its bytes, so the gate cannot stop a tampered download from being installed; it
detects a tampered, drifted or stale install afterwards and fails `make lint`.

**The `.sha256` rule:** v0.5.0 has no published checksum asset, so its manifest records
`releaseChecksum: "absent"`. Every later pin must match its published
`vilnacrm-ui-toolkit-<version>.tgz.sha256` asset: `make update-ui-toolkit` refuses to write the
manifest unless that asset exists, names the pinned tarball and carries the same digest, and
records `releaseChecksum: "matched"`. The offline gate rejects `"absent"` for any version other
than 0.5.0, so the rule holds without network access.

**The release attestation:** this command passes on the pinned asset:

```bash
gh attestation verify vilnacrm-ui-toolkit-0.5.0.tgz -R VilnaCRM-Org/ui-toolkit
```

It proves that a build of the `v0.5.0` tag produced a tarball with that digest. It does not
prove the upload, the installed tree or the lockfile; the manifest and `make lint-ui-toolkit`
stay the offline proof.

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
   `package.json` and then runs a plain `bun install`; `bun add` does both in one step.
2. Edit `TOOLKIT_URL` in `scripts/ci/check-lockfile-registries.sh` to the same URL. This is
   the one manual edit, and the verifier's `drift` class fails until it matches.
3. Run the refresher, then both gates:

```bash
make update-ui-toolkit
make lint-lockfile lint-ui-toolkit
```

The refresher reads only the `package.json` pin (`readPackagePin()`) and the installed version,
so step 2 can come before or after it; doing it second keeps every pin statement consistent
before any digest is written. For any release after v0.5.0 the refresher also requires the
release's published `.sha256` asset to exist and to agree, and records
`releaseChecksum: "matched"`. The machine-read part of the diff is exactly: one `package.json`
line, the two `bun.lock` lines (plus any peer-range change the new release makes, which is then
a reviewed peer decision), the gate literal and the manifest. The bump also edits the version
named in `docs/ui-toolkit.md` and records the new pin in ADR-016: changing the `dependencies`
map trips the ADR drift gate (`config/docs-policy.json`, `architectureDrift.manifestKeys`),
which the ADR edit satisfies without the escape hatch. No script, test or constant changes.
Running `make update-ui-toolkit` to clear a red `lint-ui-toolkit` without re-reviewing the
release is forbidden.

## Keep-local register

This is the one register of the CRM primitives and themes that are not swapped, with the reason
each stays local. The reason codes R1 to R12 belong to this register only. Each holds for
v0.5.0; the last column gives the outlook once a toolkit release above 0.5.0, carrying
ui-toolkit [#185](https://github.com/VilnaCRM-Org/ui-toolkit/pull/185), is pinned.

- **R1** extra `role="status"` node changes the a11y tree and `UIForm` queries.
- **R2** module-scope fallback to the website theme (`chunk-WXH4AINV` guard).
- **R3** module-scope website breakpoints: `sm` moves from 480 to 640.
- **R4** render-time bare `process.env.REACT_APP_VILNACRM_USAGE_POLICY_URL` read.
- **R5** different API surface; would need an adapter (out of scope).
- **R6** no `src` importer; nothing to swap.
- **R7** eager path under the 470,000 B budget; ADR-007 reliability model not upstream.
- **R8** no toolkit counterpart.
- **R9** whole-object value differs: 10 palette keys differ (`success` changes, 9 keys are
  added), and the seam has no production consumer.
- **R10** the contained `UiButton` has no `:focus-visible` outline, which CRM's has; #185 left
  it out on purpose (it changes the website's visuals and needs a design-checked change).
- **R11** CRM's skeleton is a named `section[aria-label]`; the toolkit skeleton deliberately
  stays a nameless busy container.
- **R12** v0.5.0 `UiContainer` puts `aria-label="container"` on a generic `div`, which ARIA
  prohibits and CRM's container does not render. Its styles and props equal CRM's: its only
  media rules read `md`, `lg` and `xl`, which are 768, 1024 and 1440 as in CRM, so R3 does not
  apply to it.

In the last column, **adoptable** means keep-local in this change and adoptable through an
opt-in of ui-toolkit #185 as a follow-up swap behind the existing CRM seam and props; **local**
means the named reason still holds after #185.

| CRM primitive or theme                      | Importers  | Now   | Reason    | After #185     |
| ------------------------------------------- | ---------- | ----- | --------- | -------------- |
| `ui-breakpoints`                            | 21 (lazy)  | adopt | -         | adopted (bump) |
| `ui-color-theme`                            | 1 (orphan) | local | R9        | local: R9      |
| `ui-button`                                 | 8          | local | R1 R10    | local: R10     |
| `ui-typography`                             | 11         | local | R2        | adoptable      |
| `ui-link`                                   | 2          | local | R2 R5     | local: R2 R5   |
| `ui-container`                              | 3          | local | R12       | adoptable      |
| `ui-back-to-main`                           | 2          | local | R3        | local: R3      |
| `ui-form`                                   | 2          | local | R2 R3 R10 | local: R2 R10  |
| `auth-skeleton`, `ui-skeleton-*`            | 4          | local | R3 R11    | local: R11     |
| `ui-footer`                                 | 3          | local | R2 R3 R4  | local: R2      |
| `ui-form-input-field`, `ui-text-field-form` | 1          | local | R5        | local: R5      |
| `ui-text-field`, `ui-input`                 | 0          | local | R6        | local: R6      |
| `error-boundary`, `ui-error-boundary`       | 5 (eager)  | local | R7        | local: R7      |
| `ui-live-status`                            | eager      | local | R8        | local: R8      |
| `ui-offline-notice`                         | -          | local | R8        | local: R8      |
| `ui-async-section`, `route-fallback`        | -          | local | R8        | local: R8      |
| layouts, not-found                          | -          | local | R8        | local: R8      |
| `render-with-theme`                         | tests only | local | R8        | local: R8      |
| `src/styles/theme.ts` (app theme)           | eager      | local | R8        | local: R8      |

`ui-color-theme` stays local until a CRM consumer reads a toolkit-only palette key, or upstream
ships a CRM-distinct palette; either one reverses R9.

What #185 does and does not change, per row:

- `ui-button`: `loadingMode="native"` resolves R1 (native `disabled` grey, the consumer's
  `loadingIndicator`, no own status region, matching CRM's submit loader), but R10 remains.
- `ui-typography`: `inheritTheme` resolves R2 (variants come from the ambient MUI theme, so the
  kit theme need not sit on the eager path).
- `ui-link`, `ui-back-to-main`: unchanged by #185.
- `ui-container`: #185 drops the prohibited `aria-label="container"` (R12) and changes nothing
  else, so after the bump the toolkit `UiContainer` renders the same markup and styles as CRM's
  `UIContainer`.
- `ui-form`: the `sm` rule resolves at render time (R3, given a `crm` UI theme in scope), and
  `titleComponent`, `submitLoadingMode` and `offlineNotice` cover CRM's heading, loader and
  offline notice. Two reasons remain: its submit is still the contained `UiButton` (R10), and
  its title and error banner render through `UiTypography` without `inheritTheme` (R2).
- `auth-skeleton`, `ui-skeleton-*`: `idPrefix=""` gives CRM's bare `auth-skeleton-*` ids and
  the `sm` rules resolve at render time, but R11 remains.
- `ui-footer`: `variant="crm"` reads no `process.env` (R4) and renders the logo plus same-tab
  privacy and usage-policy links; its `md`, `lg` and `xl` rules equal CRM's (R3 does not bite).
  R2 remains: the variant renders each link label through `UiTypography` without
  `inheritTheme`, so the label takes the kit theme's `body1`, whose font family is MUI's
  default, not CRM's `Golos`.
- `ui-live-status`, `ui-offline-notice`: the #185 offline notice is internal to `UiForm`, not
  an exported primitive, so R8 stands.

The Storybook preview theme and the unit-test `testTheme` are not changed either: no toolkit
component renders in CRM, so neither needs the toolkit guard.

## Adopting ui-toolkit #185 (deferred)

ui-toolkit #185 merged to the toolkit's `main` after v0.5.0, and no release carries it yet.
Its adoption is a deferred follow-up, blocked on a toolkit release above 0.5.0, and is not part
of the installation. Each swap:

- happens behind an existing CRM seam and its current props: the CRM file keeps its path,
  export and props and renders the toolkit component with the opt-in set, so no importer
  changes and no component, module, `UI*` primitive or adapter is added;
- starts with the [bump recipe](#bumping-the-toolkit), which the checksum gate cross-checks
  against the release's published `.sha256`;
- carries its own value-diff and baseline evidence: 0 visual diffs, 0 new axe violations, the
  keyboard contract, the eager budget and the Lighthouse floors;
- keeps a row local, with a new reason, if that evidence shows any difference;
- amends the [import rule](#importing) for that one component subpath only: a toolkit component
  is its subpath's `default` export (for example `@vilnacrm/ui-toolkit/ui-container`), which the
  rule forbids today because the theme subpaths' defaults are the website themes. Theme-subpath
  defaults, the root barrel and `styles.css` stay forbidden.

The adoptable rows are `ui-typography` and `ui-container`; each is blocked only on the release.
`ui-footer`, `ui-button` and `ui-form` are blocked twice: on the release, and on an upstream
change. For the footer that change is `inheritTheme` on its link labels (R2); for the button and
the form it is a contained `:focus-visible` outline (R10), and for the form also `inheritTheme`
on its title and error banner (R2). `auth-skeleton` is not adopted: R11 is a deliberate toolkit
decision, not an open gap.

After the bump, the Jest mapper keeps working unchanged, because it names the same file the new
`default` condition names; removing it becomes optional and is proven by the focused breakpoints
test. The `transformIgnorePatterns` entry and the `.mjs` transform stay required.

## Fonts

The toolkit's fonts and `styles.css` are not wired. Its `styles.css` declares `Golos Text` and
`Inter` as TTF with no `font-display`, 1,348,788 B in total, against the 480,000 B Lighthouse
`totalSizeBytes` budget, and the `font-src 'self'` directive of the security-header baseline
([ADR-006](./adr/006-browser-security-header-baseline.md)) would require serving them locally.
CRM keeps `src/styles/fonts.css`: `Golos` and `Inter` as woff2 with `font-display: swap`,
273,168 B in total. Fonts are revisited when the toolkit ships a woff2 build that fits the
budget.

## Upstream follow-ups

Recorded here, not filed. This list is the one source for them. Statuses are as of 2026-09-29;
"merged in #185, unreleased" means fixed on the toolkit's `main` after v0.5.0, reaching CRM only
through the deferred adoption above.

1. Annotate the module-scope `createTheme` calls `/*#__PURE__*/`, or split the website and CRM
   themes into separate chunks. Status: open.
2. Stop exporting the website theme as the unnamed `default` of shared subpaths. Status: open.
3. Give CRM a distinct palette, or drop `crmColorTheme` (today value-identical to
   `websiteColorTheme`, a superset of CRM's palette, with a different `success`). Status: open.
4. Ship MUI module augmentation for the extra palette keys. Status: open.
5. Add a `default` or `require` export condition, or document the Jest mapper recipe. Status:
   merged in #185, unreleased.
6. Bind components to a theme variant instead of the module-scope website breakpoints
   (skeletons, container, footer, form, back-to-main, card list). Status: partly merged in
   #185, unreleased: the `ui-form` and skeleton `sm` rules resolve at render time. Open: the
   container, footer and back-to-main rules, and `UiForm`'s title and error banner, which render
   through `UiTypography` without `inheritTheme` (R2).
7. Fonts: woff2 with `font-display: swap`; reconcile the `Golos Text` and `Golos` names.
   Status: open.
8. Replace `UiFooter`'s render-time `process.env` read with a prop. Status: merged in #185 as
   `variant="crm"`, unreleased. Open: that variant renders its link labels through
   `UiTypography` without `inheritTheme`, so they take the kit `body1` (R2).
9. Remove `UiButton`'s extra `role="status"` node, or make it opt-in, and give the contained
   variant a `:focus-visible` outline. Status: the first half is merged in #185 as
   `loadingMode="native"`, unreleased; the outline is open (R10).
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
    `make lint-ui-toolkit` stay the offline proof. Merged in #185, unreleased: a `.sha256`
    sidecar uploaded in that same post-publication step, which `make update-ui-toolkit`
    cross-checks. Open: a registry that records integrity, so the lockfile pins bytes.
