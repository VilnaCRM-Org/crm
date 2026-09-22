# Runbook: `sbom-missing`

**Signal.** `.github/workflows/sbom.yml` runs `make sbom` on every published release and
uploads `sbom/crm-image.cdx.json` and `sbom/crm-dependencies.cdx.json` to the release. If the
`generate` or `attach to release` job fails, `scripts/ci/report-sbom-failure.sh` files one issue
labelled `sbom-missing` naming the tag and the retry command.

**What it means.** A release exists with no software bill of materials attached. Attachment is
best effort after publication — the release is created before this workflow starts — so the
release itself is intact; what is missing is its inventory.

## Triage

1. Open the failed run linked from the issue and read whether `generate` (the image build or
   the CycloneDX export) or `attach to release` (the `gh release upload`) failed.
2. Reproduce the generation locally; it builds the `production` image and writes both
   documents into `./sbom`:

   ```bash
   make sbom
   ```

## Fix

- A build failure is a Dockerfile or dependency problem: fix it as you would any red image
  build.
- An upload failure is usually the release event: a release created with `GITHUB_TOKEN`
  triggers no workflow, which is why `autorelease.yml` publishes with the GitHub App token.
- Regenerate and attach for the named tag with the retry command the issue quotes:

  ```bash
  gh workflow run sbom.yml -f release_tag=<tag>
  ```

## Resolution

The monitor does not close this issue. Close it once both documents are attached to the
release (`gh release view <tag>` lists the assets), linking the successful run.
