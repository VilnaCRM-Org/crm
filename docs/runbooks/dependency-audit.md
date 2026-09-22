# Runbook: `dependency-audit`

**Signal.** The `full-tree dependency audit` job of `supply-chain security` runs
`make report-dependency-audit` weekly: Trivy over the whole `bun.lock`, dev tooling included,
with `--include-dev-deps` and `--exit-code 0`. Fixable HIGH and CRITICAL advisories are rendered
as a table and upserted into one issue labelled `dependency-audit`; a clean tree closes it.

**What it means.** Dev tooling in the lockfile carries known, fixable vulnerabilities. It is
not a blocking finding — the pull-request gate (`make scan-dependencies`) scores only the
production closure, because a ReDoS in a test runner never reaches a browser — but it is real
debt that the issue keeps visible in one place instead of letting it accumulate silently.

## Triage

1. Read the table in the issue body: package, installed version, fixed version, advisory.
2. Find who pins each vulnerable version. Most rows are transitive:

   ```bash
   grep -n '"<package>@' bun.lock
   ```

   The top-level dependency whose subtree resolves it is the one to move.

3. Check whether an open Dependabot pull request already carries the fix before bumping by
   hand; two lockfile changes in flight conflict.

## Fix

- Move the top-level dependency to a release that resolves the fixed version, in a pull
  request that passes every gate (`make lint`, `make test-unit-all`, and the browser suites
  when a build tool moved). Transitive-only advisories can sometimes be cleared with
  `bun update <package>` on the transitive name.
- A dependency that has no fixed release yet is not in the table (`--ignore-unfixed` is
  deliberate); it enters the week its fix ships.
- Never add a `.trivyignore`, lower `TRIVY_SEVERITY`, or move a package to `devDependencies`
  to take it out of the blocking scan unless nothing under `src/` imports it.

## Resolution

The next weekly run re-scores the lockfile. A clean scan closes the issue; a changed advisory
set comments with the new table. A scanner failure exits non-zero rather than reporting a clean
audit, so a run that could not scan is a red run, not a closed issue.
