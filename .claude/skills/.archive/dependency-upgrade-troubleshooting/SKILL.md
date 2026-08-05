---
name: dependency-upgrade-troubleshooting
description: Resolve common CI failures and infrastructure issues when upgrading frontend dependencies like Playwright, Stryker, and test tooling.
---

# Dependency Upgrade Troubleshooting

Use this skill when upgrading dependencies causes CI test failures, visual baseline mismatches, or Docker-related infrastructure issues. Common triggers: Playwright/Jest/Stryker version bumps, E2E/visual test failures, mutation test configuration errors, or Docker volume stale-cache issues.

## Failure patterns and solutions

### 1. Playwright browser binary version mismatch

**Symptom:** E2E and visual tests fail to launch browsers after upgrading Playwright (e.g., `Executable doesn't exist at…`, browser binary not found).

**Root cause:** Playwright version bumps require newer browser binaries. The Playwright Docker image must be kept in sync with the Playwright npm package version.

**Solution:**

- Update `Playwright.Dockerfile` base image tag to match the new Playwright release version.
- Pin exact versions of system dependencies (`apt-get`) to avoid point-release incompatibilities (e.g., `curl=7.68.0-1ubuntu2.25`).
- Example: upgrading Playwright 1.57 → 1.61 requires bumping base image from `mcr.microsoft.com/playwright:v1.57.0-jammy` to `v1.61.1-jammy`.
- Verify the image builds: `docker compose --file Dockerfile.playwright build` (or equivalent in your CI).
- Re-run E2E and visual tests in the new container to confirm browser launch succeeds.

### 2. Stryker jest-runner testEnvironment module resolution failure

**Symptom:** Mutation tests fail with `MODULE_NOT_FOUND` for `testEnvironment` during Stryker's jest-runner initialization (appears in shard logs as Jest load error).

**Root cause:** Stryker's `@stryker-mutator/jest-runner` loads `testEnvironment` via raw `require.resolve()` without `<rootDir>` expansion or TypeScript transformation. It cannot resolve `.ts` paths or imports that need tsc compilation.

**Solution:**

- Write `testEnvironment` logic in **CommonJS** (`.cjs` extension) instead of TypeScript.
- In `jest.mutation.config.ts`, use `require.resolve()` explicitly to resolve the testEnvironment path at runtime.
- Do not attempt to import or reference a `.ts` testEnvironment file — Jest transformations do not apply to Stryker's require.
- Example: mutation config calls `require.resolve('./tests/mutation/setup.cjs')` to load CommonJS setup code.
- Verify locally on a single shard: `make test-mutation-shard MUTATION_SHARD_INDEX=0 MUTATION_SHARD_TOTAL=8`.

### 3. Visual test baseline drift on breaking releases

**Symptom:** Large numbers of visual test baselines fail (e.g., 50+ webkit diffs) after upgrading Playwright or browser engines, despite no UI code changes.

**Root cause:** WebKit, Chromium, and Firefox renderers improve pixel-level precision or font rendering in new versions, causing ~1–2 px shifts in layout, colors, or spacing. Baselines are immutable snapshots and must be regenerated.

**Solution:**

- Do **not** commit the broken baselines; instead, regenerate in the new container.
- Run `make test-visual-update` inside the new Playwright container to re-baseline the visuals.
- Inspect the diffs carefully before committing — they should be cosmetic (sub-pixel), not indicative of real layout regressions.
- Note which renderer changed (e.g., "only webkit affected" or "all three"). This can help anticipate issues in future updates.
- Commit the regenerated baselines alongside the version bump in the same PR.

### 4. Image-actions bot lossy PNG recompression

**Symptom:** Visual test baselines pass locally and in the initial CI run, but fail in a subsequent bot auto-commit or re-run against baselines that appear identical in the repo.

**Root cause:** The `calibreapp/image-actions` bot automatically compresses PNG images with lossy settings and commits the compressed files back to the PR. Visual test baselines become corrupted — the committed file no longer matches the bit-for-bit render.

**Solution:**

- Add `ignorePaths: ['tests/**']` (or the exact path to your visual snapshots) in the `image-actions` workflow configuration (typically `.github/workflows/image-actions.yml`).
- Force-push uncompressed baselines if they have already been auto-recompressed: `git push --force-with-lease`.
- Verify baselines are byte-identical: `md5sum tests/**/*snapshot*` before and after to confirm no silent corruption.
- Document the ignored path in the workflow so future maintainers know not to re-enable compression on test artifacts.

### 5. Docker anonymous volume cache stale

**Symptom:** Local tests pass but Docker containers show unexpected old tool versions after running `docker compose --force-recreate`, or npm/bun dependencies are out of sync.

**Root cause:** `docker compose --force-recreate` destroys and restarts containers but does **not** drop anonymous volumes defined in `docker-compose.yml` (e.g., `node_modules:/app/node_modules`). Old dependencies and binaries persist in the volume.

**Solution:**

- Use `docker compose down -v` to **destroy volumes** before rebuilding: `docker compose down -v && docker compose up -d`.
- Or explicitly list and remove a named volume: `docker volume rm <volume_name>`.
- Verify the new tool version: `docker compose exec <service> <tool> --version` (e.g., `docker compose exec dev bun --version`).
- Add this step to local troubleshooting playbooks: "if containers seem cached, run `down -v` first."

## Checklist for dependency upgrades

Before merging a dependency upgrade PR:

- [ ] **Playwright bumped?** Check the new version's browser requirements. Update `Playwright.Dockerfile` base image tag and system `apt-get` pins. Rebuild the image locally to verify.
- [ ] **Stryker or jest-runner updated?** Verify that any `testEnvironment` used by mutation tests is CommonJS and uses `require.resolve()` in the config.
- [ ] **E2E or visual tests failing?** Regenerate baselines in the new Playwright container via `make test-visual-update`. Inspect diffs before committing.
- [ ] **Visual baselines committed?** Ensure the `calibreapp/image-actions` bot is configured with `ignorePaths: ['tests/**']` to prevent automatic recompression.
- [ ] **Docker cache concerns?** Run `docker compose down -v` locally and in CI before re-testing with new images.
- [ ] **Full CI matrix passing?** Confirm Playwright E2E, visual tests, mutation shards (all 8), and any other affected suites pass before merge.

## References

- Playwright Docker images: https://mcr.microsoft.com/v2/playwright/tags/list
- Stryker jest-runner: https://github.com/stryker-mutator/stryker-js/tree/main/packages/jest-runner
- calibreapp/image-actions: https://github.com/calibreapp/image-actions
- Docker volumes: https://docs.docker.com/compose/compose-file/07-volumes/
