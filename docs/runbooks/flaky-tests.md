# Runbook: `flaky-tests`

**Signal.** `.github/workflows/nightly-flake-audit.yml` runs `make test-e2e-flake-audit` and
`make test-visual-flake-audit` nightly with `PLAYWRIGHT_FLAKE_RETRIES=2` and the JSON reporter,
then `make check-flakes` enforces `FLAKE_BUDGET` (0). `scripts/ci/report-flake-audit.sh` files
one issue labelled `flaky-tests` naming the offending specs and their flaky-or-hard split, and
comments only when that set changes. A suite that produced no summary is filed under
`audit-failure` instead, never treated as clean.

**What it means.** A spec failed and then passed on retry. Pull-request lanes run with
`retries: 0`, so the same spec is a hard red on the next pull request that happens to hit the
timing. Nondeterminism found by the audit is a defect in the test or in the page it drives.

## Triage

1. Read the issue body for the spec names and the flaky/hard classification.
2. Pull the JSON report and traces from the run's artifacts; the trace shows which step raced.
3. Reproduce locally against the production stack, with retries on so the classification is
   visible:

   ```bash
   make test-e2e-flake-audit
   make check-flakes
   ```

   `make print-flake-env` confirms the toggles reached the Playwright container.

## Fix

- Replace a clock wait with a condition: `waitForStableDom`, `expect(locator).toBeVisible()`,
  a network-idle or response wait. `waitForTimeout` is banned under `tests/e2e` and
  `tests/visual` for this reason.
- For a visual flake, stabilise the page (fonts loaded, animations settled, deterministic data
  from the seeded Faker builders) rather than re-baselining the snapshot.
- Raising `FLAKE_BUDGET`, adding retries to a pull-request lane, or `test.skip` are all out of
  policy; `playwright/no-skipped-test` is an error.

## Resolution

The monitor does not close this issue: a clean nightly run prints "no tracking issue needed"
and stops. Close it yourself once the fix has merged and the following nightly run reports
clean, linking the run.
