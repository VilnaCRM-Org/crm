# Runbook: `main-is-red`

**Signal.** `.github/workflows/main-verification.yml` runs `make lint`, `make codegen-check` and
`make test-unit-all` against the merged tree on every push to `main`, serialized so no merge is
skipped. A failure runs `scripts/ci/report-main-verification-failure.sh`, which opens — or
comments on — one issue labelled `main-is-red`; the next green run closes it.

**What it means.** Two individually green pull requests composed into a broken `main`, or a
push landed that no pull-request check saw. Every pull request opened after this point is
running its checks against a base that is already broken, so their failures are misattributed
until `main` is repaired. Treat it as stop-the-line.

## Triage

1. Open the run linked from the issue and read which of the two jobs failed and on what:
   `lint` (which runs `make lint` and `make codegen-check`) or `unit` (`make test-unit-all`).
2. Identify the merge that caused it: the issue names the commit SHA; `git log --oneline -5`
   on `main` shows the merges around it. A logical conflict typically pairs a rename in one
   pull request with a consumer of the old name in another.
3. Reproduce locally on a fresh checkout of `main`:

   ```bash
   git fetch origin && git switch -c fix/main-is-red origin/main
   make start
   make lint
   make codegen-check
   make test-unit-all
   ```

## Fix

- Open a pull request against `main` that repairs the composition — rename the consumer,
  regenerate the contract types, restore the assertion — and let the ordinary gates prove it.
- Do not revert both offending pull requests unless the repair is genuinely larger than either;
  a revert is a second merge whose own composition has to be verified.
- If the failure is environmental (a registry outage, a base-image tag that moved), fix the
  input — a digest pin, a re-pinned package — rather than re-running until it passes.

## Resolution

The next push to `main` re-runs the verification. A green run closes the issue through the
same script with `--resolve`; a red one comments with the new SHA. Do not close it by hand.

## Prevention

The merge queue is the preventive half of this signal: once enabled, the five fast gates
re-run against the speculative merge result before the squash lands (issue #185, phase 2;
see `docs/governance/branch-protection.md`, "Merge queue").
