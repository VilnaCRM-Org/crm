# Runbook: `release-broken`

**Signal.** `.github/workflows/release-health.yml` runs `make check-release-health` daily. It
opens or updates one issue labelled `release-broken` when a `release / …` job of the newest
`main verification` push run failed (the release is the reusable `autorelease.yml`, called from
that run once `lint` and `unit` pass), when the newest `v*` tag has no GitHub release, or when
that release is missing its tarball or its GHCR image. The next green daily run closes it. A run
whose `lint` or `unit` job failed skips the release and is the `main-is-red` runbook instead.

**What it means.** The release train is not producing a consumable release. Nothing is
deployable from a tag, and the SBOM and image lanes that hang off a published release have
nothing to attach to. The issue body names the offence; the same tag can carry several.

## Triage

1. Open the `main verification` run named in the issue, then its failed `release / …` job, and
   find the first red step.
2. Match the step to its cause:
   - `Release only while main is still at the verified commit` — the tip of `main` could not be
     read; a GitHub API failure, safe to re-run. A tip that moved is a skip, not a failure.
   - `Check the release version cannot collide with an existing tag` — `package.json`'s
     version is below an existing `v*` tag; bump it (`make check-release-version` reproduces
     the check locally).
   - `Push the release commit, then its tag` with `GH006` — `main`'s branch protection declined
     the release App's direct push. This is a settings change, not a code change: grant the
     release App a bypass on the ruleset, as `docs/governance/branch-protection.md` ("Review
     and merge policy") specifies. Nothing was pushed and no tag exists, so a re-run is safe.
   - `Pack the release tarball` / `Create Release` / `Publish the production image` — the tag
     is already on the remote; reproduce with `make release-tarball` or `make publish-image` and
     fix the input. A publish that reports no manifest digest fails too, because the image
     attestation needs it.
   - `Attest the production image` / `Attest the release tarball` — the provenance signing or
     upload failed after the release, the tarball and the image were published; check that the
     calling `release` job still grants `id-token: write` and `attestations: write`.
   - `Install cosign` / `Sign the production image` / `Sign the release tarball` — the keyless
     cosign signing or the bundle upload failed after everything was published and attested:
     usually a Sigstore (Fulcio or Rekor) outage, or a missing `id-token: write` grant.
   - A tag without a release, tarball or image — the run died after the tag push.
3. For the full flow, versioning rules and the recovery sequence, read `CONTRIBUTING.md`,
   "Releases and the changelog".

## Fix

Which fix applies depends on whether the tag reached the remote.

- **Before the tag push** (the tip read, the version guard, `GH006`): nothing reached the remote.
  Repair the cause, then re-run the failed jobs of that run (`gh run rerun <run-id> --failed`), or
  let the next push to `main` verify and release afresh. Re-run only the failed jobs: a fresh
  `release / verify main tip` skips the release as soon as anything else has landed on `main`.
- **After the tag push** (every step from `Pack the release tarball` on): a re-run cannot finish
  the release. It checks out the verified commit, whose `package.json` still holds the old
  version while `v<version>` already exists, so `make check-release-version` fails it before the
  changelog action. Finish the tag by hand from a checkout of `v<version>` —
  `make release-tarball`, then `gh release create` or `gh release upload`, then
  `make publish-image` — publishing only what is missing; the commands are in
  `CONTRIBUTING.md`, "Releases and the changelog". A missing attestation or cosign signature
  cannot be recreated outside the workflow — a laptop signature names a person, not the workflow
  identity verification pins — so that version stays unattested or unsigned; say so in its
  release notes.

A missing SBOM on an otherwise complete release is the `sbom-missing` runbook, not this one.

## Resolution

The daily monitor closes the issue once no offence remains. Do not close it by hand: it would
reopen on the next run with the same body if anything is still missing.
