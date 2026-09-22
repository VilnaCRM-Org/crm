# Branch protection and repository rulesets

This document records the `main` protection settings that live in GitHub repository settings
rather than in this repository. Settings outside the repo cannot be diffed in a pull request,
so every rule that gates merges is written down here and reviewed like code.

Keep this file in sync whenever a ruleset changes. If a setting below does not match the
repository, the mismatch is a defect: either restore the setting or amend this document with
the reason in the same pull request.

## Required status checks on `main`

A classic branch protection rule on `main` now requires status checks: the release App's push
on 2026-09-20 was declined with `GH006` and "11 of 11 required status checks are expected"
(issue #280). Which eleven is not readable back with a contributor-scope token — the
branch-protection endpoint answers `404` and `rules/branches/main` lists no ruleset — so this
document cannot yet name them, and no ruleset exists on `main` (the only ruleset targets the
`v*` tags). The checks a maintainer has to require, and why each one matters, are enumerated in
CONTRIBUTING.md under "Required status checks (maintainer action)", "Relaxing a gate threshold",
and "Workflow, YAML, and repository-posture gates"; the workflow files under
`.github/workflows/` are the source of truth for which checks exist. Until the list is read back
and recorded here, treat every gate not known to be among the eleven as advisory at the merge
boundary and binding only by convention.

### Supply-chain gates — issues #140 and #141

The supply-chain workflows added by issue #140 report on every pull request, so their jobs join
the list CONTRIBUTING.md enumerates. GitHub matches a required check by
`<workflow name> / <job name>`, which is the string to type into the required-checks search box:

| Required check                            | What a red run means                               |
| ----------------------------------------- | -------------------------------------------------- |
| `supply-chain security / secret scan`     | A committed secret, or a scanner that detects none |
| `supply-chain security / dependency scan` | A fixable HIGH/CRITICAL CVE in the production tree |
| `supply-chain security / image scan`      | The same policy over the deployable image          |
| `sbom / generate`                         | A release that could ship with no SBOM             |

Six jobs must **not** be required, because a check that never reports on a pull request either
leaves every pull request pending forever or gates nothing. `contract drift`,
`nightly flake audit`, and `scorecard / analysis` have no `pull_request` trigger, so a pull
request would wait on a status that never arrives.
`supply-chain security / full-tree dependency audit`, `sbom / attach to release` and
`sbom / report a release without SBOM` do trigger on the workflow's pull-request run but skip
themselves by their own `if:` — a skipped check counts as satisfied, so requiring any of them
would imply a gate that does not exist. The audit job
is skipped on purpose: the dev-tooling advisories it reports go to a `dependency-audit` tracking
issue rather than a red check.

> **Outstanding prerequisite.** These four rows extend the list in CONTRIBUTING.md. Whether the
> classic rule on `main` already requires any of them cannot be read back with a contributor
> token (see the top of this section), so treat them as not yet applied until the eleven
> required checks are recorded here. Adding them is a maintainer action.

## Merge queue — issue #185 (phase 2)

Pull-request checks run against the pull-request head, not against the tree that a merge
produces. Two individually green pull requests can still compose into a red `main` — a rename in
one, a consumer of the old name in the other — and until the merge queue exists the only thing
that notices is `main verification`, after the fact. A merge queue closes that hole at the merge
boundary: GitHub builds the speculative merge result on a `gh-readonly-queue/main/...` ref,
dispatches a `merge_group` event for it, and merges only once the required checks report green
on that ref.

The in-repo half is applied. Five workflows declare `merge_group:` beside their `pull_request`
trigger — `static testing`, `unit testing`, `bats testing`, `eslint suppressions` and
`dependency cruiser` — and their concurrency group keys on
`github.event.merge_group.head_ref` with `cancel-in-progress` true **only** for a pull-request
run, so a push to a pull request cannot cancel a queue entry that is already being verified.
`static testing` skips its three ADR-drift steps on a queue run: that gate diffs against
`github.base_ref` and reads the pull-request body and labels, none of which a `merge_group`
event carries, and its verdict was already decided on the pull request the entry was built from.
`tests/unit/tooling/merge-queue-gates.test.ts` pins the set both ways, so a sixth workflow
cannot join the queue silently and none of the five can leave it.

Every other workflow stays pull-request-only, each for a stated reason:

- **`mutation testing`** is a 16-way sharded matrix; queuing it would add its wall-clock and
  sixteen runners to every merge.
- **`e2e testing`, `visual tests`, `performance testing`, `load testing`,
  `memory-leak testing` and `integration testing`** are minutes of browser or measurement
  wall-clock each; the queue is for the fast, deterministic gates.
- **`gate ratchet`, `conventional commit contract`, `contract testing` and `codecov`** read the
  pull-request payload — the merge base and base tip, the title, the labels, the body — which a
  `merge_group` event does not carry.
- **`bundle size`, `dockerfile performance`, `storybook testing` and `image optimization`** are
  path-filtered; a filtered workflow can skip itself, and a skipped required check counts as
  satisfied.

### Ruleset: require merge queue

Enable this on `main` under **Settings → Rules → Rulesets** (admin), together with the review
and merge policy below. The classic branch-protection rule that declines direct pushes today
must be migrated into the same ruleset, because required checks and the merge queue are
evaluated by one rule set and a check required by the classic rule but absent from the queue
context leaves every queue entry waiting until its status-check timeout expires and fails.

| Setting                                  | Value                                  |
| ---------------------------------------- | -------------------------------------- |
| Ruleset name                             | `main merge queue`                     |
| Target                                   | Branch — default branch (`main`)       |
| Rule                                     | Require merge queue                    |
| Merge method                             | Squash and merge                       |
| Build concurrency                        | 1                                      |
| Minimum / maximum group size             | 1 / 5                                  |
| Wait time to meet minimum group size     | 5 minutes                              |
| Require all queue entries to pass checks | Enabled                                |
| Status check timeout                     | 60 minutes                             |
| Required status checks                   | Exactly the five contexts listed below |

A workflow is not a status-check context. GitHub matches a required check by
`<workflow name> / <job name>`, and only these five contexts report on `merge_group`:

| Required status-check context               | Workflow file             | On `merge_group` |
| ------------------------------------------- | ------------------------- | ---------------- |
| `static testing / static`                   | `static-testing.yml`      | Yes              |
| `unit testing / unit`                       | `unit-testing.yml`        | Yes              |
| `bats testing / bats`                       | `bats-testing.yml`        | Yes              |
| `eslint-suppressions / eslint-suppressions` | `eslint-suppressions.yml` | Yes              |
| `dependency cruiser / dependency-cruiser`   | `dependency-cruiser.yml`  | Yes              |

The required-check list is what makes or breaks the queue. GitHub applies one list to both the
pull-request and the queue context, and a required context that never reports on `merge_group`
leaves every queue entry pending until the status-check timeout expires and fails it. The
classic rule on `main` requires eleven contexts today, and this document cannot name them (see
the top of the file). **Enabling the queue therefore starts with an admin reading that list**:

```bash
gh api repos/VilnaCRM-Org/crm/branches/main/protection/required_status_checks --jq '.contexts[]'
```

and reconciling every context against the table above. A context that is one of the five stays
required. A context that is not — `mutation testing / merge and enforce gate`, the Lighthouse
jobs, the browser suites, `conventional commit contract`, or any other job listed as
pull-request-only earlier in this section — has exactly two honest futures, and the admin picks
one per context before the queue goes on:

- **Keep it required and give its workflow a real `merge_group` run.** That is a decision to
  spend its wall-clock on every merge, which this document deliberately does not make for the
  mutation matrix or the browser suites; it is available for a fast job whose event payload
  allows it.
- **Drop it from the required list.** The check still runs and still reports red on the pull
  request, but it no longer blocks the merge button; enforcement becomes review discipline on
  the pull request. `main verification` after the merge detects a breakage it would have caught
  and attributes it — it does not prevent it.

Until every one of the eleven has been placed in one of those two rows, the queue must stay off:
turning it on with an unreconciled list does not weaken a gate quietly, it stalls every merge.
Never satisfy a waiting queue by adding a `merge_group:` trigger to a workflow whose job then
skips itself — a skipped required check counts as a pass, which is a gate that does not exist.

Record the ruleset ID here once it is created:

- Ruleset ID: _not yet created_

> **Outstanding prerequisite.** The `merge_group:` triggers are inert until the ruleset exists:
> GitHub dispatches that event only for a branch with a merge queue, so nothing changes on a pull
> request today. Enabling the queue is an admin action with a cascade: the moment it is on, the
> merge button becomes "Merge when ready" and any required context that does not report on
> `merge_group` stalls the queue, which is why the eleven-context reconciliation above has to
> land in the same ruleset edit, and why its outcome — which contexts were kept, which were
> dropped — is recorded here. Verify it by queuing one pull request and confirming the five
> contexts reported once more on the `gh-readonly-queue/main/...` ref before it merged.

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

## Secret scanning and push protection

Secret detection has two halves, and only one of them lives in this repository. The in-repo half
is `make scan-secrets` — the `supply-chain security / secret scan` job — which runs gitleaks over
the full git history on every pull request and weekly, then proves the scanner still detects a
seeded synthetic key so a misconfigured run cannot pass vacuously. It is a detective control: by
the time it reports, the secret has already been pushed and is already compromised.

The preventive half is a repository setting. **Secret scanning** runs GitHub's own pattern set
over the history and every new push and opens alerts in the Security tab; **push protection**
rejects a push that contains a recognised secret before it reaches the repository, which is the
only point at which a credential can still be kept out of history. Both are available at no cost
on a public repository and are enabled per repository under
**Settings → Code security and analysis**.

| Setting         | Value   |
| --------------- | ------- |
| Secret scanning | Enabled |
| Push protection | Enabled |

- Enabled on: _not yet verified_

> **Outstanding prerequisite.** Neither setting is diffable, and neither can be read back with a
> contributor-scope token: the repository API returns `security_and_analysis: null` and the
> secret-scanning alerts endpoint answers `404` unless the caller has admin or security-manager
> access. Enabling and verifying them is therefore recorded here as a maintainer action, and the
> in-repo scan stays the only half that is known to run.

## Review and merge policy

The merge method is already settled at the repository level and was read back through the API:
squash merge is the only method enabled (`allow_squash_merge` true, `allow_merge_commit` and
`allow_rebase_merge` false), the squash title is `COMMIT_OR_PR_TITLE`, and the head branch is
deleted on merge. Everything else in this table is a branch protection or ruleset setting whose
state cannot be read back with a contributor token; the classic rule on `main` is known to
require status checks (see the top of this document) and nothing more is known about it, so
each "No" row is recorded as not yet verified rather than as absent.

| Setting                                         | Value                | Already applied |
| ----------------------------------------------- | -------------------- | --------------- |
| Allowed merge methods                           | Squash only          | Yes             |
| Squash commit title                             | `COMMIT_OR_PR_TITLE` | Yes             |
| Delete head branch on merge                     | Enabled              | Yes             |
| Require a pull request before merging           | Enabled              | No              |
| Required approving reviews                      | 1                    | No              |
| Require review from Code Owners                 | Enabled              | No              |
| Dismiss stale approvals when new commits arrive | Enabled              | No              |
| Require conversation resolution before merging  | Enabled              | No              |
| Require linear history                          | Enabled              | No              |

Squash-only merging is what makes the rest coherent. Linear history is satisfied structurally —
every merge produces exactly one commit on `main` — so the rule costs nothing and stops a merge
commit arriving through any other path. Code-owner review is what turns the path-scoped
[`.github/CODEOWNERS`](../../.github/CODEOWNERS) from a reviewer-suggestion into a gate: without
it, the file only auto-requests a reviewer and any approver still merges. Dismissing stale
approvals closes the gap where a change pushed after the approval merges on that approval, and
conversation resolution closes the one where a review comment is left unanswered.

One writer needs a bypass. `autorelease.yml` pushes the changelog and version-bump commit and the
release tag straight to `main` with the GitHub App token, and that push is rejected by a
pull-request requirement it cannot satisfy — and equally by the required status checks already
applied to `main`: a direct push carries no check runs, so the classic rule declines it with
`GH006` ("N of N required status checks are expected") whatever the actor's token can do. The
release workflow names this case in its failure annotation and stops before any tag is pushed
(issue #138). Grant the bypass to that App alone, as a ruleset bypass actor with `bypass_mode:
always`, and to no human role — including administrators — so the exemption is exactly as wide as
the automation that needs it.

> **Outstanding prerequisite.** Every "No" row is a maintainer action under **Settings → Rules →
> Rulesets** (preferred: rulesets carry an explicit bypass list, which classic branch protection
> lacks). Until it lands, one approving review is a convention and the code-owner assignment
> binds nothing.

## Commit and tag signing

| Setting                          | Value                                            |
| -------------------------------- | ------------------------------------------------ |
| Require signed commits on `main` | Enabled                                          |
| Tag ruleset for `v*`             | Creation restricted; update and deletion blocked |
| Bypass actors for both           | The release GitHub App only                      |

Requiring signed commits on `main` is satisfiable because of the squash-only policy: the commit
that lands is created by GitHub itself under the `web-flow` committer identity and signed with
GitHub's key, so a contributor's own commits do not need to be signed and the rule still
guarantees that every commit on `main` was
either written by GitHub through the merge UI or by an actor on the bypass list. That is the same
provenance the `commitlint` workflow already relies on to tell a bot commit from a human one. The
release App's commit is unsigned — the changelog action commits through plain `git`, not the
API — so the App must be on the bypass list for this rule as well, as it is for the pull-request
requirement above.

Release tags are created by the GitHub App in `autorelease.yml`: the changelog action pushes the
tag, and `gh release create` publishes the release the `sbom` workflow then attaches its SBOMs
to. A tag ruleset targeting `v*` that restricts creation to the App and blocks update and
deletion keeps a published tag from being moved onto other code after the fact.

Artifact signing and provenance — cosign signatures for the image, SLSA attestations for the
image and the SBOMs — are **not implemented**; issue #140 scopes them as a follow-up phase. No
workflow in this repository publishes the image to a registry, so there is no signed image to
verify yet, and the SBOMs attached to a release are authenticated only by the release that
carries them.

> **Outstanding prerequisite.** Both rulesets are maintainer actions. Record their IDs here once
> they exist so drift can be checked against `gh api repos/VilnaCRM-Org/crm/rulesets`, which
> currently returns an empty list.

- Commit-signing ruleset ID: _not yet created_
- Tag ruleset ID: _not yet created_

## Code ownership

[`.github/CODEOWNERS`](../../.github/CODEOWNERS) is path-scoped: a `*` fallback first, then an
explicit entry for every security-relevant surface — the workflows, `CODEOWNERS` itself,
`dependabot.yml`, the Dockerfiles and compose files, `docker/`, `scripts/`, `config/` (every gate
threshold and policy), the `Makefile`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `docs/governance/`,
`.gitleaks.toml`, and `src/modules/`. Later entries win, so the explicit rows override the
fallback for their paths and a scaffolded module's own row overrides `src/modules/`.

Every entry names the single maintainer login, `@Kravalg`, because the organisation has no team
to reference; the day one exists, the login is replaced by `@VilnaCRM-Org/<team>` in one pass.
The value of the file today is the path list, not the reviewer it resolves to: the ownership map
is what the issue-#188 gate ratchet and the issue-#158 auth-seed gate name as their complement,
since an author editing a gate, its manifest, and its workflow in one pull request defeats both
unless a second person has to approve exactly those paths.

The `*` line is load-bearing beyond review: `make new-module` defaults its `owner` to the second
field of that line (`SCAFFOLD_OWNER_DEFAULT` in the `Makefile`, `defaultOwner` in `plopfile.ts`),
and the scaffolder appends `/src/modules/<name>/ <owner>` at the end of the file. Keep the
fallback first, and never delete it.

> **Outstanding prerequisite.** Ownership only binds once **Require review from Code Owners** is
> enabled (see "Review and merge policy"); until then the file auto-requests a reviewer and
> nothing more.
