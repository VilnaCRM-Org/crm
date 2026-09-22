# Operational runbooks

Six scheduled or post-merge monitors in this repository file a GitHub issue when something an
automated check cannot fix on its own goes wrong. Each one keeps **exactly one open issue per
label**, comments only when the situation changes, and — where the monitor can observe the fix
— closes the issue itself. These runbooks say what each signal means, how to reproduce it
locally, what fixes it, and how the issue is expected to close. They are the operations half
of the gates `CLAUDE.md` describes; the gate itself is documented there.

| Runbook (issue label)                       | Monitor                             | Self-closing |
| ------------------------------------------- | ----------------------------------- | ------------ |
| [`main-is-red`](./main-is-red.md)           | `main verification`, push to `main` | Yes          |
| [`release-broken`](./release-broken.md)     | `release health`, daily             | Yes          |
| [`dependency-audit`](./dependency-audit.md) | `supply-chain security`, weekly     | Yes          |
| [`flaky-tests`](./flaky-tests.md)           | `nightly flake audit`, nightly      | No           |
| [`contract-drift`](./contract-drift.md)     | `contract drift`, weekly            | No           |
| [`sbom-missing`](./sbom-missing.md)         | `sbom`, on a published release      | No           |

Two rules hold for all of them:

- **Fix the cause, never the signal.** None of these issues is resolved by closing it, by
  re-running until green, by raising a budget, by adding an ignore entry, or by narrowing the
  scope the monitor watches. The same root-cause-not-suppression policy the ESLint, TypeScript,
  metrics, jscpd and performance gates follow applies to every runbook here.
- **A monitor that closes its own issue must be left to do so.** Closing `main-is-red`,
  `release-broken` or `dependency-audit` by hand hides whether the fix actually landed; the next
  scheduled run either closes it or comments that the offence persists.

The monitors share one helper, `scripts/ci/upsert-audit-issue.sh`, which is what guarantees
the one-issue-per-label invariant and the comment-only-on-change behaviour; a monitor that
cannot produce its report exits non-zero rather than reporting a clean state, so a silent
monitor is itself a red run.

A change that adds a monitor adds a row above and a runbook beside it; `make lint-docs`
verifies that every command a runbook names exists and that every link resolves.
