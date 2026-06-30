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

**Mutation testing is sharded, not slowed.** Stryker over the whole component surface
(`src/components/**/*.tsx`) took close to an hour as one job. `mutation-testing.yml` now fans
`make test-mutation-shard` across a 4-way matrix; each shard mutates a deterministic, disjoint slice
of the same file set (`stryker.shard.config.mjs`) and uploads a per-shard JSON report. A final
`merge and enforce gate` job runs `make merge-mutation-reports`, which unions the shard reports and
re-enforces the **unchanged** Stryker `break` threshold (read live from `stryker.config.mjs`) over
the whole set, computing the mutation score exactly as an unsharded run would. Sharding by file is
score-preserving: each mutant runs against the full suite regardless of which shard owns it. A
missing shard report makes the merge fail closed (it never passes the gate vacuously). The merge math
is unit-tested in `tests/unit/mutation-report.test.ts`. Shards run against a lean dev-only container
(`make start-dev`) because mutation tests mock all backends and need neither Mockoon nor Apollo.

Run it locally either way:

```bash
make test-mutation                                   # full, gated, single-process run
# or reproduce the sharded CI flow against a running dev service:
make start-dev
make test-mutation-shard MUTATION_SHARD_INDEX=0 MUTATION_SHARD_TOTAL=4   # repeat for 1..3
make merge-mutation-reports MUTATION_SHARD_TOTAL=4
```

To change the shard count, keep the `index` matrix in `mutation-testing.yml` and the merge job's
`MUTATION_SHARD_TOTAL` in lock-step (`index` must be `[0 .. TOTAL-1]`); a mismatch fails closed at
the merge gate rather than passing silently.

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
