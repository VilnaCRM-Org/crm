# Welcome to contributing guide <!-- omit in toc -->

Thank you for investing your time in contributing to our project!

Read our
[Code of Conduct](https://www.contributor-covenant.org/version/2/0/code_of_conduct/)
to keep our community approachable and respectable.

In this guide you will
get an overview of the contribution
workflow from opening an issue, creating a PR, reviewing, and merging the PR.

Use the table of contents icon on the top left corner
of this document to get to a specific section of this guide quickly.

## New contributor guide

To get an overview of the project,
read the [README](README.md). Here are some resources
to help you get started with open source contributions:

- [Finding ways to contribute to open source on GitHub](https://docs.github.com/en/get-started/exploring-projects-on-github/finding-ways-to-contribute-to-open-source-on-github)
- [Set up Git](https://docs.github.com/en/get-started/quickstart/set-up-git)
- [GitHub flow](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Collaborating with pull requests](https://docs.github.com/en/github/collaborating-with-pull-requests)

### Issues

#### Create a new issue

If you spot a problem with this template,
[search if an issue already exists](https://docs.github.com/en/github/searching-for-information-on-github/searching-on-github/searching-issues-and-pull-requests#search-by-the-title-body-or-comments).
If a related issue doesn't exist, you can open a new issue using a relevant [issue form](https://github.com/VilnaCRM-Org/frontend-spa-template/issues/new).

#### Solve an issue

Scan through our [existing issues](https://github.com/VilnaCRM-Org/frontend-spa-template/issues)
to find one that interests you. You can narrow down the search using `labels` as filters.
As a general rule, we don’t assign issues to anyone.
If you find an issue to work on, you are welcome to open a PR with a fix.

### Make Changes

#### Make changes locally

1. Fork the repository.

- Using GitHub Desktop:
  - [Getting started with GitHub Desktop](https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/getting-started-with-github-desktop)
    will guide you through setting up Desktop.
  - Once Desktop is set up, you can use
    it to [fork the repo](https://docs.github.com/en/desktop/contributing-and-collaborating-using-github-desktop/cloning-and-forking-repositories-from-github-desktop)!

- Using the command line:
  - [Fork the repo](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo#fork-an-example-repository)
    so that you can make your changes without affecting the original project until
    you're ready to merge them.

1. Install or update to **Docker** and **Docker compose**. For more information, see [the README](README.md).

2. Install **GNU Make 4.0+** so the repository Make targets behave the same locally and in CI.
   On macOS, install it with Homebrew:

   ```bash
   brew install make
   ```

   If Homebrew installs GNU Make as `gmake`, use `gmake` in place of `make` for the commands
   below.

3. Create a working branch and start with your changes!

### Commit your update

Commit the changes once you are happy with them.
Don't forget to self-review to speed up the review process:zap:.

Our commits are based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

### Make targets as contracts

Repository `make` targets are public workflow contracts. A target must do what its name promises
completely and reliably instead of expecting contributors or CI to remember extra manual setup
steps.

When you change or add a public target:

- keep the target behavior aligned with its user-facing name
- prefer composing existing targets instead of duplicating shell logic
- keep `tests/bats/make-target-coverage.tsv` in sync with the current Makefile target list
- add or update Bats coverage for uncovered shell flows, or record the PR workflow that already
  exercises the target end to end
- update `make help` text when the user-facing behavior changes
- update README and CONTRIBUTING when the documented workflow changes
- preserve the canonical entrypoints contributors and CI already rely on, or document the migration
  explicitly in the same change

### Dockerfile build performance

If your change touches a configured Dockerfile path (or the gate's own config),
a CI gate rebuilds each configured image, measures its size and build time,
checks the size against a per-image budget (`.github/dockerfile-perf.json`), and
runs `dive` (layer efficiency, `.dive-ci`) and `hadolint` (best practice,
`.hadolint.yaml`) gates with their own thresholds. The check hard-fails a pull
request when a budget or gate is exceeded, unless a documented exception
applies. Exceptions are granted via an inline `# perf-exception: <reason>`
marker (its own comment line), the repo-wide `docker-perf-exception` PR label,
or a per-image `docker-perf-exception:<name>` PR label that waives only that
image. The decision logic is covered by `tests/bats/docker_perf.bats`
(run with `make test-bats`).

### CI speed and the mutation-testing gate

GitHub runs the pull-request workflows in parallel, so PR feedback is gated by the slowest single
job. Two things keep that fast without dropping or weakening any check — every gate still runs on
every PR, and no threshold (Stryker, metrics, jscpd, dependency-cruiser, Lighthouse) is relaxed.

**Cancel superseded runs.** Every workflow declares a `concurrency` group keyed on the workflow and
the PR (or ref) with `cancel-in-progress: true`, so pushing a new commit aborts the previous run for
that PR instead of letting it finish. The release and sandbox-lifecycle workflows
(`autorelease`, `sandbox-creating`, `sandbox-deleting`) use `cancel-in-progress: false` so an
in-flight release or sandbox trigger is never aborted.

**Mutation testing is sharded and incremental, not slowed.** Stryker mutates the whole logic layer
plus module UI — repositories, `src/services/**`, auth stores/state, validation policies, and the
module `.tsx` surface — not just `src/components/**/*.tsx`. The mutated set is the single source of
truth in [`scripts/ci/mutation-scope.mjs`](scripts/ci/mutation-scope.mjs), whose exclusions mirror
`jest.config.ts` `collectCoverageFrom` (types, styles, stories, generated code, DI-free i18n);
`stryker.config.mjs` (`mutate`) and `stryker.shard.config.mjs` (per-shard slice) both consume it, so
the union of every shard equals the full set exactly. Stryker runs a dedicated Jest config
([`jest.mutation.config.ts`](jest.mutation.config.ts)) that unions the unit **and** integration
suites, so a repository/service/store mutant is killed by the integration test that actually asserts
on it instead of being left uncovered. (Stryker's jest-runner can't use Jest `projects` with
`perTest` coverage, so the suites are unioned into one flat config; `tests/mutation/setup.ts` keys
off the test path so the unit fetch-stub and the integration MSW server never collide.) That config
excludes the `tests/unit/{tooling,scripts,performance,load}` meta-tests — they read source files as
text and break once Stryker instruments them — and runs ts-jest with `isolatedModules` (no per-file
type-check). `stryker.config.mjs` sets `ignoreStatic: true`. Those three keep the run affordable:
CI runners are 2-core, so parallelism comes from the shard count (currently 8), not from Stryker's
in-process concurrency.

`mutation-testing.yml` fans `make test-mutation-shard` across an 8-way matrix; each shard mutates a
deterministic, disjoint slice and uploads a per-shard JSON report. On pull requests the shards run
**incrementally** (`MUTATION_INCREMENTAL=1` → Stryker `--incremental`): each shard restores its own
`reports/stryker-incremental-<index>.json` from an `actions/cache` rolling key and only re-runs
mutants the diff touches — the report still lists every mutant, so the gate stays exact. The first
run (cold cache) is a full sharded pass that seeds the cache; a `push:` trigger on `main` refreshes
it so PRs branch off a warm base. A final `merge and enforce gate` job runs
`make merge-mutation-reports`, which unions the shard reports and enforces the Stryker `break`
threshold (read live from `stryker.config.mjs`) over the whole set. A missing shard report makes the
merge fail closed. The merge math is unit-tested in `tests/unit/mutation-report.test.ts`. Shards run
against a lean dev-only container (`make start-dev`) because mutation tests mock all backends and
need neither Mockoon nor Apollo.

`mutation-testing-full.yml` runs weekly (`schedule:` + `workflow_dispatch`) as the authoritative
pass: the same 8-way matrix, but **cold and from scratch** so the score can't inherit stale reused
results, and it saves a fresh incremental cache for PRs. Tune its cadence (e.g. nightly
`0 3 * * *`) against CI cost. It is not a pull-request required check.

**Scope, threshold band, and ratchet policy.** `stryker.config.mjs` sets
`thresholds: { high, low, break }` as a coherent band. `break` is the enforced floor, set at/just
below the measured baseline; `high`/`low` colour the HTML report. Ratchet policy: raise `break`
toward `high` as suites improve — **never lower it to make CI pass**, and never narrow the mutated
scope to dodge a survived mutant. Fix a survived mutant with a real assertion, not an exclusion or a
`// stryker disable` / `istanbul ignore` suppression. Excluding a file from
`scripts/ci/mutation-scope.mjs` is only legitimate for genuine non-logic (types, styles, stories,
generated code, i18n). The measured per-area baseline is recorded in
[`CLAUDE.md`](CLAUDE.md) under "Mutation testing scope and baseline".

Run it locally either way (heavy — prefer letting CI shard it):

```bash
make test-mutation                                   # full, gated, single-process run
# or reproduce the sharded CI flow against a running dev service:
make start-dev
make test-mutation-shard MUTATION_SHARD_INDEX=0 MUTATION_SHARD_TOTAL=8   # repeat for 1..7
# PR mode (incremental): only mutants the diff touches re-run
make test-mutation-shard MUTATION_SHARD_INDEX=0 MUTATION_SHARD_TOTAL=8 MUTATION_INCREMENTAL=1
make merge-mutation-reports MUTATION_SHARD_TOTAL=8
```

To change the shard count, keep the `index` matrix in both `mutation-testing.yml` and
`mutation-testing-full.yml` and the merge job's `MUTATION_SHARD_TOTAL` in lock-step (`index` must be
`[0 .. TOTAL-1]`); a mismatch fails closed at the merge gate rather than passing silently.

**Lighthouse runs as a matrix.** `performance-testing.yml` runs the desktop and mobile audits as two
parallel matrix cells (`lighthouse desktop` / `lighthouse mobile`) instead of sequentially in one
job.

**Required status checks (maintainer action).** Because the single `mutation testing` and
`performance testing` checks no longer exist as one job each, a maintainer must update
**Settings → Branches → Branch protection rules** to require these jobs in place of the old single
checks:

- `mutation testing / merge and enforce gate`
- `performance testing / lighthouse desktop`
- `performance testing / lighthouse mobile`

The merge job runs `if: ${{ !cancelled() }}` and fails closed if any shard did not succeed (a skipped
required check would otherwise count as a pass), so requiring the merge job alone is sufficient — a
crashed shard turns the gate red rather than bypassing it.

### Relaxing a gate threshold

The `gate ratchet` check compares every binding budget named in
[`config/gate-thresholds.manifest.json`](config/gate-thresholds.manifest.json) at your PR head
against the merge base. If a value moved in the weakening direction — a Lighthouse `minScore` or a
coverage/mutation threshold **lowered**, a metrics/jscpd/bundle ceiling **raised**, a coverage
exclusion list **grown**, or a guarded entry **deleted** — the job prints a
`FILE / KEY / BASE / HEAD / RULE / REASON` table and fails.

The first response is always to strengthen the value back. When a relaxation is genuinely the right
call, make it an explicit, reviewed decision: add the **`gate-relaxation`** label to the PR and state
the rationale in the PR body. The check then passes, and the same table is written to the job summary
and a sticky PR comment so the relaxation is visible in review rather than buried in a diff. Do not
satisfy the check by removing an entry from the manifest — the manifest guards itself.

**Required status check (maintainer action).** Add `gate ratchet / no binding threshold weakened` to
**Settings → Branches → Branch protection rules**. The job triggers on `labeled`/`unlabeled` in
addition to the default PR events, so applying the waiver label re-runs it without a manual retry.

### Pull Request

When you're finished with the changes, create a pull request, also known as a PR.

Before opening the PR, run the canonical local CI command:

```bash
make ci
```

`make ci` runs the same checks CI enforces across its workflows. At a high level it runs shared
environment setup, linting, dev-side tests, prod-side setup, and prod-side automated checks.

If you are updating older local scripts, aliases, or onboarding notes, migrate them to the current
contracts in the same change:

- treat `make start` as the full local stack entrypoint for both the frontend and Mockoon
- replace older ad hoc CI command chains with `make ci`
- point contributor-facing automation at those targets so local workflows stay aligned with CI

- Fill the "Ready for review" template so that we can
  review your PR. This template helps reviewers understand your changes as well
  as the purpose of your pull request.
- Don't forget to [link PR to issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue)
  if you are solving one.
- Enable the checkbox to [allow maintainer edits](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/allowing-changes-to-a-pull-request-branch-created-from-a-fork)
  so the branch can be updated for a merge. Once you submit your PR, our team member
  will review your proposal. We may ask questions or request additional information.
- We may ask for changes to be made before a PR can be merged, either using
  [suggested changes](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/incorporating-feedback-in-your-pull-request)
  or pull request comments. You can apply suggested changes directly through the UI.
  You can make any other changes in your fork, then commit them to your branch.
- As you update your PR and apply changes, mark each conversation as
  [resolved](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/commenting-on-a-pull-request#resolving-conversations).
- If you run into any merge issues, checkout this
  [git tutorial](https://github.com/skills/resolve-merge-conflicts) to help you
  resolve merge conflicts and other issues.

### Your PR is merged

Congratulations :tada::tada: The our team thanks you :sparkles:.

Now that you are part of the php service template community.

## Dependency updates

Dependencies are kept current by [Dependabot](.github/dependabot.yml), which opens pull
requests on a weekly schedule for two ecosystems:

- `bun` — the `package.json` JavaScript dependencies. The Bun ecosystem updates the manifest
  and `bun.lock` together in one pull request, so the `bun install --frozen-lockfile` step
  used across the Docker images and CI stays green.
- `github-actions` — the SHA-pinned actions in `.github/workflows/`.

To keep pull request volume low, minor and patch updates are grouped into a single request
per ecosystem while major bumps arrive individually, and `open-pull-requests-limit` is capped
at 5.

Dependabot commit headers use the conventional `chore(deps):` prefix (`chore(github-actions):`
for the actions entry). Our commitlint `check-task-number-rule` expects a `(#N)` scope, which
Dependabot cannot emit; that rule runs only in the local Husky `commit-msg` hook (there is no
commitlint CI gate), so Dependabot pull requests are not blocked. Because the repository is
squash-merge-only, add the task number to the squash commit title at merge time to keep
`main`'s history conformant.
