# Runbook: `release-broken`

**Signal.** `.github/workflows/release-health.yml` runs `make check-release-health` daily. It
opens or updates one issue labelled `release-broken` when the newest `autorelease.yml` run on
`main` is red, when the newest `v*` tag has no GitHub release, or when that release is missing
its tarball or its GHCR image. The next green daily run closes it.

**What it means.** The release train is not producing a consumable release. Nothing is
deployable from a tag, and the SBOM and image lanes that hang off a published release have
nothing to attach to. The issue body names the offence; the same tag can carry several.

## Triage

1. Open the failed `autorelease.yml` run named in the issue and find the first red step.
2. Match the step to its cause:
   - `Check the release version cannot collide with an existing tag` — `package.json`'s
     version is below an existing `v*` tag; bump it (`make check-release-version` reproduces
     the check locally).
   - `Push the release commit, then its tag` with `GH006` — `main`'s branch protection declined
     the release App's direct push. This is a settings change, not a code change: grant the
     release App a bypass on the ruleset, as `docs/governance/branch-protection.md` ("Review
     and merge policy") specifies. Nothing was pushed and no tag exists, so a re-run is safe.
   - `Pack the release tarball` / `Publish the production image` — a build failure; reproduce
     with `make release-tarball` or `make publish-image` and fix the input.
   - A tag without a release — the run died between the tag push and `gh release create`;
     re-run the failed job, which reads the version from `package.json` at that commit and is
     idempotent.
3. For the full flow, versioning rules and the recovery sequence, read `CONTRIBUTING.md`,
   "Releases and the changelog".

## Fix

Repair the cause and re-run the failed workflow (`gh run rerun <run-id>`), or let the next
push to `main` trigger a fresh release run. A missing SBOM on an otherwise complete release is
the `sbom-missing` runbook, not this one.

## Resolution

The daily monitor closes the issue once no offence remains. Do not close it by hand: it would
reopen on the next run with the same body if anything is still missing.
