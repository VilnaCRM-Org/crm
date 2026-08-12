# Branch protection and repository rulesets

This document records the `main` protection settings that live in GitHub repository settings
rather than in this repository. Settings outside the repo cannot be diffed in a pull request,
so every rule that gates merges is written down here and reviewed like code.

Keep this file in sync whenever a ruleset changes. If a setting below does not match the
repository, the mismatch is a defect: either restore the setting or amend this document with
the reason in the same pull request.

## Required status checks on `main`

Every workflow that runs on `pull_request` to `main` is a required status check. The list is
maintained in repository settings; the workflow files under `.github/workflows/` are the
source of truth for which checks exist.

## Code scanning results (CodeQL) — issue #172

`.github/workflows/security-testing.yml` runs CodeQL with the `security-extended` query suite.
That suite adds the lower-precision security queries the default suite omits — DOM XSS,
client-side unvalidated URL redirection, prototype pollution, client-side request forgery —
which are exactly the classes that matter for a React SPA.

The workflow triggers are, in order of purpose:

| Trigger                  | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `pull_request` → `main`  | Analyze the merge result; produces the PR alert diff           |
| `push` → `main`          | Maintain the `main` baseline so PR alert diffing is meaningful |
| `schedule` (`0 6 * * 1`) | Re-scan weekly so new query-pack releases surface on old code  |

The `push` baseline is a prerequisite, not an optimization: without a `main` analysis, GitHub
has nothing to diff a pull request against, so every pre-existing alert reports as new and the
merge rule below cannot evaluate correctly.

Analysis errors fail the `Analyze` job. Findings do **not** fail that job — findings are
enforced by the ruleset below.

### Ruleset: require code scanning results

Enable this on `main` under **Settings → Rules → Rulesets** (requires admin; the repository
role needed to create it is higher than the `write` access a contributor has).

| Setting                   | Value                            |
| ------------------------- | -------------------------------- |
| Ruleset name              | `main code scanning`             |
| Target                    | Branch — default branch (`main`) |
| Rule                      | Require code scanning results    |
| Tool                      | CodeQL                           |
| Security alerts threshold | High or higher                   |
| Alerts threshold          | Errors                           |

Record the ruleset ID here once it is created, so drift can be checked against
`gh api repos/VilnaCRM-Org/crm/rulesets`:

- Ruleset ID: _not yet created_

> **Outstanding prerequisite.** Until this ruleset exists and is set to **Active**, CodeQL
> findings annotate a pull request but do not block merging into `main`. Creating it needs
> repository **admin**, which the contributor who landed the `security-extended` upgrade does not
> have, so it is tracked here as a post-merge action rather than silently assumed. The in-repo
> half — the extended query suite, the `main` baseline, and the weekly re-scan — is already in
> effect and is pinned by `tests/unit/tooling/codeql-security-suite.test.ts`.

The two thresholds are pinned deliberately. `security-extended` includes medium-precision
queries; pinning security alerts at **High or higher** and other alerts at **Errors** is what
keeps those queries from blocking merges on low-confidence findings while still binding the
classes this suite exists to catch. Lowering either threshold is a separate decision that
belongs in its own pull request, together with the triage of what it newly blocks.

### Handling a finding

Fix the code. A CodeQL finding is never resolved by widening `paths-ignore`, by dismissing the
alert as "won't fix", or by dropping back to the default query suite — the same
root-cause-not-suppression policy the repository applies to ESLint, TypeScript, metrics, and
duplication.
