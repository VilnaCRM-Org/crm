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

#### Dev Containers and Codespaces

[`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) attaches VS Code, or a
GitHub Codespace, to the same `dev` service `make start` runs: it starts `dev`, `mockoon` and
`apollo` from `docker-compose.yml`, keeps the RSBuild dev server as the container's main
process, forwards ports 3000, 4000, 6006 and 8080, and installs the ESLint, Prettier,
EditorConfig, markdownlint and Playwright extensions with format-on-save. Its
`initializeCommand` bootstraps `.env` from the template and creates the external `crm-network`
before compose starts, the two steps any `make` invocation would otherwise do for you.

Inside the container the workspace is `/app` and `node_modules` is the named volume, so run
the tools directly — `bun x jest`, `bun x eslint .`, `bun x tsc --noEmit`, `bun x prettier`
— rather than through `make`: the Docker-backed targets (`make lint`, `make test-unit-all`,
`make lint-metrics`, the browser suites) shell out to `docker compose exec`, which needs the
host's Docker socket. Run those from a host terminal against the same containers, exactly as
CI does.

#### Local environment and the `.env` template

`.env` is gitignored and never committed (issue #142): this repository is the template for every
VilnaCRM microservice, and a tracked `.env` is where the first real credential of a downstream
fork would land straight in git history. The tracked file is `.env.example`, and the split is:

- **Keys go to `.env.example`**, with placeholder or template-default values. It is the only
  copy CI, the Docker image build and a fresh clone ever see, so a build-time value that must be
  reproducible (the `REACT_APP_*` URLs `serve.json`'s `connect-src` is generated from, the
  user-service contract pins `GRAPHQL_SCHEMA_VERSION` / `OPENAPI_SPEC_VERSION`) is changed there.
- **Values go to your local `.env`**: ports, hosts, a real Sentry DSN, anything secret. Any
  `make` invocation copies `.env.example` to `.env` when it is missing (`make env-bootstrap` does
  only that) and never overwrites an existing one, even when the template is newer. The local
  file reaches the dev server and the mock containers only: `.dockerignore` keeps it out of the
  image build, which copies the template instead, so a deployment repoints the API through the
  runtime `APP_CONFIG_*` variables rather than a build-time `.env`.
- **`make check-env-sync`** (part of `make lint`) fails when your `.env` no longer declares the
  template's keys — after a pull that added one — or when a contract pin in it differs from the
  template, because codegen and the contract gates read the pins from `.env.example` and the mock
  containers read them from `.env`. Copy the new line over; never bump a pin only locally.

The full-history secret scan (`make scan-secrets`, the `supply-chain security / secret scan`
check) is the backstop: a credential that does reach a commit fails the pull request.

#### Adding a module or feature

Do not create the folders by hand — generate them:

```bash
make new-module name=orders feature=order-list
make new-feature module=orders feature=order-detail
```

The generated skeleton passes every static gate with zero edits, and the generator prints
the two order-sensitive lines you must add yourself (the DI registrar entry and the route
contract entry). Allowed folder names come from `config/module-shape.json`, the single
source `.dependency-cruiser.js` also reads. `make verify-scaffold` (CI check `scaffold`)
generates a throwaway module, gates it, and removes it, so the templates can never silently
drift from the policy. See [`docs/scaffolding.md`](docs/scaffolding.md).

### Commit your update

Commit the changes once you are happy with them.
Don't forget to self-review to speed up the review process:zap:.

Our commits are based on [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)

#### The commit contract is enforced in CI, not only by the local hook

`.husky/commit-msg` still lints your commits locally, but it is opt-in (`make husky`), skipped
by `git commit --no-verify`, and never sees commits made through the GitHub web UI. Because the
repository is squash-merge-only with `squash_merge_commit_title=COMMIT_OR_PR_TITLE`, the string
that actually lands on `main` — and that drives the semver bump and changelog in
`autorelease.yml` — is the **pull request title**, which no hook can reach.

The `commitlint` workflow closes both holes on every pull request. It lints:

- `"<your PR title> (#<PR number>)"` — the header GitHub writes on squash merge — against
  `commitlint.config.js`. The repository uses `squash_merge_commit_title=COMMIT_OR_PR_TITLE`, so a
  single-commit pull request lands that **commit's** header instead; that path is covered by the
  commit check below, which lints it against the same strict config;
- every commit between the merge base with `main` and the PR head. Human commits get the same
  strict config; a commit falls back to `commitlint.bot.config.js` only when GitHub reports it
  signature-verified, its author identity a bot, and its committer an identity only GitHub
  writes (`web-flow`, or the app account). The bot config drops `check-task-number-rule` and adds
  one narrow ignore for the `Compressed Images` header that `calibreapp/image-actions` writes.
  That ignore matches on message text, but it is only ever reached for a commit GitHub itself
  wrote, so a human cannot reach it by copying the header — nor by signing a commit they authored
  under a bot's noreply address, since the signature attests the committer, not the author.

Fix a red check by editing the pull request title in the web UI (title failure) or by rewording
and force-pushing (`git rebase -i` + `git push --force-with-lease`, commit failure). Reproduce
either locally:

```bash
printf 'feat(#123): add a thing (#456)\n' | make lint-commit-message
make lint-commit-range COMMIT_RANGE_FROM="$(git merge-base origin/main HEAD)" COMMIT_RANGE_TO=HEAD
```

Do not relax `commitlint.config.js` to make a header pass — it is the contract the release
pipeline parses.

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

### Workflow, YAML, and repository-posture gates

The CI configuration is itself gated, because a regression there silently weakens every other
check. Four gates cover it. Each one turns its own check red on a regression; that only becomes
merge-blocking once the check is in the branch-protection required list (see the end of this
section for which ones belong there).

- **`workflow security / zizmor`** (pull-request gate) runs
  [zizmor](https://github.com/zizmorcore/zizmor) over `.github/workflows/` and the composite
  actions in `.github/actions/*/`. Reproduce it locally
  with `make lint-zizmor` (Docker, digest-pinned; deliberately not part of `make lint`, so it stays
  independent of the dev container). It fails on medium-or-higher findings: an action pinned to a
  mutable tag or branch instead of a reviewed release commit, an over-broad `permissions` block, a
  `pull_request_target` job that checks out the PR head, restored credential persistence, a
  `${{ github.event.* }}` value interpolated straight into a `run:` script, or an action from an
  archived repository.
  **Fix the workflow, never the gate.** Pin to a release commit, narrow the permission, or pass the
  value through `env:` and reference it as a shell variable. Do not add a `zizmor.yml` ignore, raise
  `--min-severity`, drop `--persona pedantic`, or shrink the audit scope.
- **`format yaml files / yamlfmt`** (pull-request gate) runs `prettier --check` over every
  `*.yml` / `*.yaml` file. It replaced a `norwd/fmtya` step that could not push its own fix and so
  verified nothing. It catches format drift and YAML that does not parse. It does **not** catch
  duplicate mapping keys — prettier's bundled YAML plugin passes `uniqueKeys: false`, so both keys
  survive `--write` and `--check` exits 0. Fix a red check with `make format`;
  `make lint-prettier` verifies the same files inside the dev container.
- **`make lint-compose`** (part of `make lint`, so it runs in `static testing`) validates every
  docker compose file combination the repository actually starts. Compose's own loader rejects a
  duplicate mapping key (`mapping key X already defined at line N`), which is how the
  last-key-wins defect — a silently discarded `healthcheck:` or `environment:` block — is covered
  for the compose surface; actionlint's `syntax-check` covers it for the workflows. The gate also
  catches schema and `${VAR}` interpolation errors before a container ever starts.
- **`scorecard / analysis`** (weekly cron plus push to `main`, monitoring) runs OpenSSF Scorecard
  and uploads SARIF to the Security tab. It watches repository _state_ that no pull-request diff
  can show — branch protection, required checks, dependency-update health, pin coverage on `main`.
  A scheduled run cannot block a merge; treat a score regression as a bug to file, not a warning to
  dismiss.

`workflow security / zizmor` and `format yaml files / yamlfmt` should be added to the
branch-protection required checks for `main`; until they are, they report but do not block. Do not
add `scorecard / analysis` — it has no `pull_request` trigger, so requiring it would leave every PR
waiting forever on a check that never reports.

The same standalone-Docker shape gates the supply chain (issue #140). `supply-chain security`
runs `make scan-secrets` (gitleaks over the full git history, then a seeded-credential positive
control that fails if the scanner detects nothing), `make scan-dependencies` (Trivy over the
production closure of `bun.lock`) and `make scan-image` (Trivy over the built `production`
image); the dependency and image scans block on a fixable HIGH/CRITICAL finding, while the
secret scan fails on any detected secret or a failed positive control. `sbom` runs `make sbom`
and uploads
the CycloneDX documents, attaching them to a release after it is published (a failed attachment
files an `sbom-missing` tracking issue; retry with `gh workflow run sbom.yml -f release_tag=<tag>`).
Reproduce any of them with
the same target — the Makefile owns the digest pins, severity floor and flags, so the local run
and CI cannot disagree. `make scan-secrets` needs a full-depth clone: the job checks out with
`fetch-depth: 0`, and a shallow clone (`--depth 1`, or a default GitHub checkout) scans only the
tip and passes on a secret that was committed and later removed. The weekly
`make report-dependency-audit` scans the full lockfile, dev tooling included, into one
`dependency-audit` tracking issue; it is reporting, not blocking, and never runs on a pull
request. Fix a finding by updating the dependency, rebuilding on a patched base image, or
removing and rotating the secret — never with a `.trivyignore`, a widened `.gitleaks.toml`
allowlist, or a lowered severity. Which of these jobs belong in the required list is in
"Required status checks (maintainer action)" below.

### Scheduled runs and extra scans

Some checks do work outside the pull-request lane, so it is worth knowing they exist before you
change the code they watch — the first two never run on a pull request at all, the third runs
there _and_ does more elsewhere:

- **`contract drift`** (weekly, no pull-request trigger) reports when the pinned `user-service`
  contract versions fall behind upstream by opening or updating one `contract-drift` issue. A bare
  version gap does not fail it; an upstream lookup failure does.
- **`nightly flake audit`** (nightly, no pull-request trigger) re-runs the full Playwright E2E and
  visual suites **with retries enabled** and a zero flake budget, so a test that fails and passes
  on retry turns the audit red and lands in a tracking issue naming the spec. Pull-request runs
  keep `retries: 0`, where a flake is already a hard failure.
- **`security testing`** _does_ run on every pull request. What is extra is its `push` to `main`
  and weekly re-scan: those maintain the CodeQL baseline that pull-request alert diffing compares
  against, and re-check old code against new query-pack releases.

Each of these monitors, and the post-merge and release monitors, files one tracking issue per
label and is paired with a runbook under [`docs/runbooks/`](docs/runbooks/README.md) that says
what the signal means, how to reproduce it, what fixes it, and whether the monitor closes the
issue itself.

Because `schedule` triggers only ever fire from the default branch, schedule-only behaviour cannot
be proven by the pull request that changes it — it is covered by Bats fixtures instead
(`tests/bats/contract_drift.bats`, `tests/bats/flake_budget.bats`), and verified after merge with
`gh workflow run <workflow>`. Note that GitHub disables scheduled workflows after 60 days without
repository activity.

The one contract check that _does_ run on every pull request is `contract testing`
(`make contract-diff`). It fast-exits when `OPENAPI_SPEC_VERSION` and `GRAPHQL_SCHEMA_VERSION`
are unchanged, and runs `oasdiff breaking` or `graphql-inspector diff` on the pin you bump; see
[`src/api/contracts/README.md`](src/api/contracts/README.md).

### Architecture decisions and documentation drift

Documentation is gated like code. `make lint-docs` (inside `make lint`) fails on an ADR that
breaks the policy in `config/docs-policy.json`, a module under `src/modules/` with no
`README.md`, a documented `make`/`bun run` command that does not exist, and a relative link or
heading anchor that does not resolve. Remote URLs are audited weekly by the `docs link audit`
workflow instead of on pull requests, because third-party reachability is not deterministic
enough for a required check.

On top of that, the `static testing` workflow runs `make check-adr-drift`: a pull request that
changes an architecturally significant surface — `.dependency-cruiser.js`, `rsbuild.config.ts`,
`config/browser-support.json`, `src/config/**`, the route registry or composer, or the
`dependencies` map in `package.json` — must also add or update a file under `docs/adr/`.

To record a decision, copy [`docs/adr/template.md`](docs/adr/template.md) to
`docs/adr/NNN-kebab-case-slug.md`, fill every section, and add the row to `docs/adr/README.md`.

If the change genuinely carries no architectural decision, waive the gate the one documented
way: add the `adr:not-required` label to the pull request, or put a `[no-adr]` line in its body.
Say why in the pull-request description — the waiver is a reviewed judgement, not a bypass.
Never silence a documentation gate with an ignore entry or by widening the policy file.

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

### The preloaded-auth seed gate

The Playwright, visual, and Lighthouse suites reach the protected `/` route by preloading an auth
token (`window.__PRELOADED_AUTH_TOKEN__` or `REACT_APP_LHCI_PRELOADED_AUTH_TOKEN`). Because
`isAuthenticated` is `!!token`, that seam is an auth bypass if it ever reaches a deployable build,
so it is compiled out of every build that did not explicitly opt in — see "Preloaded-auth-token seed
gate" in [`CLAUDE.md`](CLAUDE.md) and [`src/config/env/README.md`](src/config/env/README.md) for the
three invariants that keep the guard foldable.

Run it locally with `make check-auth-seed-gate`. It builds `--target production`, scans the image's
`dist` for the seam, and then re-scans a deliberately opted-in build that **must** still contain it,
so the check cannot pass against the wrong artifact. In CI it is the `preloaded-auth seed gate` job
of the `security testing` workflow, and it is the only job that exercises the deployable
`--target production` image — every other prod-side suite builds the ephemeral `test-harness` target.

Satisfy it by keeping the seam gated. Never relax the scan, narrow its file set, move a seed read
out of the guarded method, or set `ENABLE_PRELOADED_AUTH_TOKEN_SEED` anywhere but the Dockerfile's
`test-harness` stage.

### The browser security-header gate

Every production response carries the header baseline — `Content-Security-Policy`,
`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy` and `Cross-Origin-Resource-Policy` — declared once in
`config/security-headers.json`. The `headers` block of `serve.json` is generated from it and the
RSBuild dev server reads the same file, so the two cannot drift; the full directive table and the
`style-src` decision are in [`SECURITY.md`](SECURITY.md#browser-security-headers-issue-113).

Change a header by editing the policy, running `make security-headers-generate`, and committing the
regenerated `serve.json`. `make lint-security-headers` (part of `make lint`) fails when the two
disagree, and `make check-security-headers` — the `security headers` job of the `security testing`
workflow — builds `--target production`, boots it, asserts every header on the HTML shell, a deep
route, the manifest and a hashed asset, then boots it again with `APP_CONFIG_*` API overrides that
must reach `connect-src`. The policy loader refuses a weakened baseline outright (no `nosniff`, a
short HSTS, a widened `frame-ancestors`, `'unsafe-eval'` on scripts), so satisfy the gate by fixing
the policy, never by editing `serve.json` by hand or by relaxing a floor to make a run pass.

### CI speed and the mutation-testing gate

GitHub runs the pull-request workflows in parallel, so PR feedback is gated by the slowest single
job. Two things keep that fast without dropping or weakening any check — every gate still runs on
every PR, and no threshold (Stryker, metrics, jscpd, dependency-cruiser, Lighthouse) is relaxed.

**Cancel superseded runs.** Every workflow declares a `concurrency` group keyed on the workflow and
the PR (or ref) with `cancel-in-progress: true`, so pushing a new commit aborts the previous run for
that PR instead of letting it finish. The release and sandbox-lifecycle workflows
(`autorelease`, on its `build` job, `sandbox-creating`, `sandbox-deleting`) use
`cancel-in-progress: false` so an in-flight release or sandbox trigger is never aborted.

**The dev image comes from a layer cache.** Every job that runs `make start`, `make start-dev`,
`make ci-setup` or another target that runs the compose `dev` service (`make test-bats`,
`make check-auth-seed-gate`) first runs the
[`.github/actions/dev-image`](.github/actions/dev-image/action.yml) composite action, which builds
the compose `dev` image against a `type=gha` BuildKit cache and sets `DEV_IMAGE_PREBUILT=1` so the
Makefile's compose `up` skips `--build`. A warm run skips the `bun install` layer; a lockfile
change rebuilds it once and re-exports it. Pull-request runs read `main`'s cache and write only to
their own ref. The Chromium variant the Lighthouse jobs build has no `main` writer, so it is cold
on each pull request's first run and warm only for later pushes and re-runs of that pull request.
Locally nothing sets the variable, so `make start` builds exactly as before. A new job that needs
the dev image without the action fails
`tests/unit/tooling/dev-image-cache.test.ts`; see "Dev-image layer cache" in `CLAUDE.md` for the
scopes, eviction and the publishing-job exclusion.

**Mutation testing is sharded and incremental, not slowed.** Stryker mutates the whole logic layer
plus module UI — repositories, `src/services/**`, auth stores/state, validation policies, and the
module `.tsx` surface — not just `src/components/**/*.tsx`. The mutated set is the single source of
truth in [`scripts/ci/mutation-scope.mjs`](scripts/ci/mutation-scope.mjs), whose exclusions mirror
`jest.config.ts` `collectCoverageFrom` (types, styles, stories, generated code, DI-free i18n);
`stryker.config.mjs` (`mutate`) and `stryker.shard.config.mjs` (via `shardMutateFiles`) both consume
it, so the union of every shard equals the full set exactly. Stryker runs a dedicated Jest config
([`jest.mutation.config.ts`](jest.mutation.config.ts)) that unions the unit **and** integration
suites, so a repository/service/store mutant is killed by the integration test that actually asserts
on it instead of being left uncovered. (Stryker's jest-runner can't use Jest `projects` with
`perTest` coverage, so the suites are unioned into one flat config; `tests/mutation/setup.ts` keys
off the test path so the unit fetch-stub and the integration MSW server never collide.) That config
excludes the `tests/unit/{tooling,scripts,performance,load}` meta-tests — they read source files as
text and break once Stryker instruments them — and runs ts-jest with `isolatedModules` (no per-file
type-check). `stryker.config.mjs` sets `ignoreStatic: true`. Those three keep the run affordable:
CI runners are 2-core, so parallelism comes from the shard count (currently 16), not from Stryker's
in-process concurrency.

**Every mutant is classified on its merits.** A score is only worth enforcing when each status was
earned for the reason it names, so `stryker.config.mjs` runs the
`@stryker-mutator/typescript-checker` (`checkers: ['typescript']`) over
[`tsconfig.stryker.json`](tsconfig.stryker.json) — the root tsconfig narrowed to the mutated
`src/**/*` tree. Type-invalid mutants come back `CompileError` and drop out of the denominator
instead of executing and being miscounted as kills nobody's assertion earned. Two companion
settings make that real: `disableTypeChecks: false`, because Stryker's default writes
`// @ts-nocheck` into every sandbox file and would blind the checker completely, and
`jest.enableFindRelatedTests: true`, because with it off each mutant run reloaded the whole test
suite, blew past the timeout window, and came back `Timeout` — detected by hanging rather than by
an assertion. `typescriptChecker.prioritizePerformanceOverAccuracy: true` batches independent
mutants into one type-check pass and re-splits any group whose error cannot be pinned on a single
mutant. `tests/unit/tooling/mutation-checker-config.test.ts` fails the build if any of these
regresses; never relax them to buy wall-clock.

`mutation-testing.yml` fans `make test-mutation-shard` across a 16-way matrix; each shard mutates a
deterministic, disjoint slice and uploads a per-shard JSON report. The slice is bin-packed by
file size (heaviest file to the lightest shard), not sliced round-robin, because the run costs
whatever its slowest shard costs — round-robin left one shard carrying 1.54x the mean load.
On pull requests the shards run
**incrementally** (`MUTATION_INCREMENTAL=1` → Stryker `--incremental`): each shard restores its own
`reports/stryker-incremental-<index>.json` from an `actions/cache` rolling key and only re-runs
mutants the diff touches — the report still lists every mutant, so the gate stays exact. That key
carries a hash of the mutation configuration, because Stryker's incremental file invalidates only
on source and test changes: without it a shard would reuse statuses decided under different
classification settings and skip the checker for them entirely. The first
run (cold cache) is a full sharded pass that seeds the cache; a `push:` trigger on `main` refreshes
it so PRs branch off a warm base. A final `merge and enforce gate` job runs
`make merge-mutation-reports`, which unions the shard reports and enforces the Stryker `break`
threshold (read live from `stryker.config.mjs`) over the whole set. A missing shard report makes the
merge fail closed. The merge math is unit-tested in `tests/unit/mutation-report.test.ts`. Shards run
against a lean dev-only container (`make start-dev`) because mutation tests mock all backends and
need neither Mockoon nor Apollo.

`mutation-testing-full.yml` runs weekly (`schedule:` + `workflow_dispatch`) as the authoritative
pass: the same 16-way matrix, but **cold and from scratch** so the score can't inherit stale reused
results, and it saves a fresh incremental cache for PRs. Tune its cadence (e.g. nightly
`0 3 * * *`) against CI cost. It is not a pull-request required check.

**Scope, threshold band, and ratchet policy.** `stryker.config.mjs` sets
`thresholds: { high, low, break }` as a coherent band. `break` is the enforced floor, set at/just
below the measured baseline; `high`/`low` colour the HTML report. Ratchet policy: raise `break`
toward `high` as suites improve — **never lower it to make CI pass**, and never narrow the mutated
scope to dodge a survived mutant. Fix a survived mutant with a real assertion, not an exclusion or an
`istanbul ignore` suppression. The one exception is a **provably equivalent** mutant, which no test
can kill because the mutated program behaves identically: prefer deleting the source the mutant
proved irrelevant, and only where no such refactor exists annotate it with
`// Stryker disable next-line <Mutator>: <reason>` carrying the proof. See "Honest mutant
classification" in [`CLAUDE.md`](CLAUDE.md) for the full rule. Excluding a file from
`scripts/ci/mutation-scope.mjs` is only legitimate for genuine non-logic (types, styles, stories,
generated code, i18n). The measured per-area baseline is recorded in
[`CLAUDE.md`](CLAUDE.md) under "Mutation testing scope and baseline".

Run it locally either way (heavy — prefer letting CI shard it):

```bash
make test-mutation                                   # full, gated, single-process run
# or reproduce the sharded CI flow against a running dev service:
make start-dev
make test-mutation-shard MUTATION_SHARD_INDEX=0 MUTATION_SHARD_TOTAL=16  # repeat for 1..15
# PR mode (incremental): only mutants the diff touches re-run
make test-mutation-shard MUTATION_SHARD_INDEX=0 MUTATION_SHARD_TOTAL=16 MUTATION_INCREMENTAL=1
make merge-mutation-reports MUTATION_SHARD_TOTAL=16
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

- `conventional commit contract` (the job in `commitlint.yml` — issue #184; without a required
  status the `edited` trigger is decorative, since a title can be changed after the last green run)
- `memory-leak-testing` (the job in `memory-leak-testing.yml` — issue #183; the gate only became
  binding once it could fail)
- `mutation testing / merge and enforce gate`
- `performance testing / lighthouse desktop`
- `performance testing / lighthouse mobile`
- `security testing / preloaded-auth seed gate`
- `security testing / security headers` (issue #113; the header baseline is proven against the
  deployable image, so the check only protects a merge once it is required)
- `contract testing / OpenAPI breaking-change gate` (the job in `contract-testing.yml` — issue
  #177; it also runs the GraphQL schema diff from issue #178 phase 2 under the same name;
  `contract drift` and `nightly flake audit` must not be added, because neither has a
  `pull_request` trigger)
- `supply-chain security / secret scan`
- `supply-chain security / dependency scan`
- `supply-chain security / image scan`
- `sbom / generate` (with the three above, the issue-#140 jobs that run on every pull request;
  the same workflows' `full-tree dependency audit` and `attach to release` jobs are skipped on a
  pull request by their `if:`, and a skipped job satisfies a required check, so requiring them
  would gate nothing)

The first two are the check-run names GitHub reports, which is what the required-checks search box
matches: a job's check-run name is its `name:` when it declares one, and its job id otherwise.

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

The first response is always to strengthen the value back. When a relaxation is genuinely the
right call, make it an explicit, reviewed decision: add the **`gate-relaxation`** label to the PR
and state the rationale in the PR body. The check then passes, and the same table is written to the
job summary and a sticky PR comment so the relaxation is visible in review rather than buried in a
diff. Do not satisfy the check by removing an entry from the manifest — the manifest guards itself.

**Verification (run locally before pushing).** The check is a plain Node script, so you can
reproduce exactly what CI will say without opening a PR:

```bash
# What the gate will report for your branch against main.
GATE_RATCHET_BASE_SHA=origin/main GATE_RATCHET_HEAD_SHA=HEAD node scripts/ci/check-gate-ratchet.mjs
echo "exit=$?"   # 0 = held or waived, 1 = weakened, 2 = a guarded config failed to load

# Preview the sticky PR comment body.
GATE_RATCHET_BASE_SHA=origin/main GATE_RATCHET_HEAD_SHA=HEAD \
  GATE_RATCHET_REPORT_FILE=gate-ratchet-report.md node scripts/ci/check-gate-ratchet.mjs
cat gate-ratchet-report.md

# The extractors, directions, and waiver logic are unit-tested.
docker compose exec -T dev bun x jest tests/unit/tooling/gate-ratchet.test.ts
```

Exit code `2` means the ratchet could not evaluate a guarded config (an unparseable or newly broken
file). That is an evaluation failure, not a weakening, and the waiver label does **not** clear it.

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

### The memory-leak gate is binding

`make test-memory-leak` (workflow: `memory leak testing`) no longer just proves the scenarios
did not throw. `tests/memory-leak/run-memlab-tests.js` runs memlab's `findLeaks()` after every
scenario and exits non-zero when:

- an unallowlisted leak is detected,
- a file in `tests/memory-leak/tests/` exports no valid scenario, or
- no scenario executed at all — a vacuous pass is now a failure.

Discovery recurses into subfolders and accepts `.js`, `.mjs`, and `.cjs`, and
`tests/unit/memory-leak/scenario-inventory.test.ts` pins the committed scenario set, so renaming,
moving, or deleting a scenario fails a check instead of quietly shrinking coverage.

When you add or edit a scenario, dispose every puppeteer `ElementHandle` you obtain
(`const handle = await page.waitForSelector(...); await handle?.dispose();`). An undisposed
handle is held by the DevTools console object group, so the harness retains the element it is
supposed to be measuring and the gate reports a leak that does not exist in the app.

`MEMLAB_SKIP_WARMUP=true` remains set for the memlab stack. Issue #183 proposed removing it so
first-visit lazy-chunk allocations fall outside the measured window; that was tried and measured
to hang the second Chromium launch (`Network.enable` never returns, the run dies on memlab's
5-minute `protocolTimeout`), so it stays a follow-up on #183 rather than a broken gate.

If the gate flags a leak you believe is not yours to fix (for example retention inside a
third-party component), waive it with a reviewed entry in
`tests/memory-leak/leak-allowlist.json`, keyed on the reported detached-node summary:

```json
{
  "leaks": [{ "trace": "Detached <div id=\"reg-form-0\">", "reason": "<why this is safe>" }]
}
```

Both fields are required and the file is reviewed in the pull request diff. Never satisfy this
gate by deleting a scenario, skipping the `findLeaks()` call, or widening the allowlist to a
match-everything string — the same root-cause-not-suppression policy used for ESLint, metrics,
and jscpd applies. `tests/bats/memlab_gate.bats` pins every exit-code path.

### Post-merge verification of `main`

Every push to `main` runs `main verification`, which re-runs `make lint`, `make codegen-check`,
and `make test-unit-all` against the merged tree. Pull-request checks run against the PR branch,
so two individually green PRs can still compose into a broken `main`; this run catches that and
attributes it to the merge that caused it. Runs are serialized
(`concurrency: main-verification`, `cancel-in-progress: false`) so no merge is skipped.

A failure opens — or comments on — a single tracking issue labelled `main-is-red`, and the next
green run closes it, so the signal never outlives the breakage. Treat an open one as stop-the-line:
fix `main` before merging further pull requests, because their checks are running against a base
that is already broken.

The same run **gates the release** (issue #185). Its `release` job calls the reusable
`autorelease.yml` only after `lint` and `unit` succeed, so a red run releases nothing and a
release is only ever cut from a verified tree; see "Releases and the changelog".

The preventive half is the merge queue. `static testing`, `unit testing`, `bats testing`,
`eslint suppressions` and `dependency cruiser` also trigger on `merge_group`, so once a
maintainer enables the queue on `main`, GitHub re-runs those five against the speculative merge
result before the squash lands, and a pull request that is green on its branch but red against
the merged tree is rejected instead of breaking `main`. The event fires only for a branch with a
merge queue, so nothing changes on a pull request until then; the ruleset settings, the
required-check split, and the workflows that deliberately stay pull-request-only are recorded
in [`docs/governance/branch-protection.md`](docs/governance/branch-protection.md), "Merge
queue".

### Releases and the changelog

Every push to `main` runs `main verification`, and once its `lint` and `unit` jobs pass, its
`release` job calls `generate changelog and create release` (`autorelease.yml`, a reusable
workflow with no trigger of its own; the jobs show up in the run as `release / verify main tip`
and `release / build`). The release first checks that `main` still points at the commit that was
verified. If a newer push has landed meanwhile it skips with a notice, because the newer push is
verified and released by its own run; releasing here would either be refused as a
non-fast-forward push or cut a release from a tree nothing verified. It then reads
the conventional commits since the newest `v*` tag, bumps `version` in `package.json`, prepends
the section to `CHANGELOG.md`, commits both, tags the commit `v<version>`, and creates the GitHub
Release with the production bundle attached as `crm-dist-<version>.tar.gz`. The same run pushes
the deployable image to `ghcr.io/vilnacrm-org/crm:<version>` and `:sha-<commit>`, so a deployed
artifact can always be traced back to its release, its commit, and — through commitlint's
`(#N)` scope — its issues. The `sbom` workflow then attaches the CycloneDX documents, each with
its cosign signature bundle, on the `release: published` event.

The release commit (`chore(release): <version> [skip ci]`, the changelog action's default message
and `skip-ci` input) starts no workflow, so it is neither verified nor released again. That marker
replaced the old `paths-ignore` on `package.json` and `CHANGELOG.md`, with one behaviour change: a
merged pull request that touches only those two files is now verified and, if its commits call
for a bump, released like any other push.

**Build provenance (issue #136).** The same job attests the tarball and the image with SLSA build
provenance (`actions/attest-build-provenance`, signed through Sigstore with the workflow's OIDC
identity). The image is attested by the manifest digest `docker push` reported for the tags it
just pushed, which `make publish-image` records in `release/image-digest`, and that attestation is
also pushed to GHCR. Verify a downloaded tarball or a pulled image before deploying it:

```bash
gh attestation verify crm-dist-<version>.tar.gz --repo VilnaCRM-Org/crm
gh attestation verify oci://ghcr.io/vilnacrm-org/crm:<version> --repo VilnaCRM-Org/crm
```

A pass proves the artifact was built by this repository's `main verification` workflow from the
commit the attestation names.

**Signatures (issue #136).** After the attestations the job signs the same two artifacts with
keyless cosign (`sigstore/cosign-installer`, SHA-pinned, installing an exact cosign release): the
image by the digest `make publish-image` recorded, with the signature pushed to GHCR beside it,
and the tarball with `cosign sign-blob --bundle`, whose `crm-dist-<version>.tar.gz.sigstore.json`
bundle is uploaded to the release next to the tarball. The `sbom` workflow's `attach to release`
job signs each CycloneDX document the same way and uploads `<document>.sigstore.json` with it; a
failed signature fails that job and files the `sbom-missing` issue like any other attach failure.
No key or secret exists: Fulcio issues a short-lived certificate for the workflow's GitHub OIDC
identity and Rekor logs the signature publicly, so verification pins that identity and issuer:

```bash
workflows='https://github\.com/VilnaCRM-Org/crm/\.github/workflows'
release="^${workflows}/autorelease\.yml@refs/heads/main\$"
sbom="^${workflows}/sbom\.yml@refs/(tags/v[0-9]+\.[0-9]+\.[0-9]+|heads/main)\$"
issuer='https://token.actions.githubusercontent.com'

cosign verify ghcr.io/vilnacrm-org/crm@sha256:<digest> \
  --certificate-identity-regexp "$release" --certificate-oidc-issuer "$issuer"
cosign verify-blob crm-dist-<version>.tar.gz --bundle crm-dist-<version>.tar.gz.sigstore.json \
  --certificate-identity-regexp "$release" --certificate-oidc-issuer "$issuer"
cosign verify-blob crm-image.cdx.json --bundle crm-image.cdx.json.sigstore.json \
  --certificate-identity-regexp "$sbom" --certificate-oidc-issuer "$issuer"
```

The release identity is `autorelease.yml`, not `main-verification.yml`: a reusable workflow's
certificate names the called workflow. The SBOM identity admits a tag ref (the `release:
published` run) and `main` (a `workflow_dispatch` retry). `cosign verify` accepts a tag too, but
verifying the digest is what pins the bytes you deploy;
`docker buildx imagetools inspect ghcr.io/vilnacrm-org/crm:<version>` prints it. Verify with
cosign v3 or newer, the major the workflow pins (`v3.1.3`), which writes the signatures in the
Sigstore bundle format. The SBOMs are signed, not attested:
`actions/attest-sbom` binds a document to a subject digest, and the image `make sbom` scans is a
rebuild, not the published manifest, so such an attestation would name an artifact nobody ships.
Nothing enforces any of this at deploy time; that is the consumer's step.

**Versioning rules.** The bump follows the action's `angular` preset over the commits since the
last tag: `feat` is a minor, `fix`/`perf`/`revert` are a patch, and a `!` in the header or a
`BREAKING CHANGE` footer is a major. Commits of the hidden types (`chore`, `docs`, `ci`, `build`,
`refactor`, `style`, `test`) do not appear in the changelog, and a push made only of those is
skipped without a release (`skip-on-empty`). `package.json` is the version file and the invariant
the train relies on is simple: **its `version` is at least as high as every existing `v*` tag**,
so the next bump can never land on a tag that already exists.

**Guards, in order.** The tip guard (`scripts/ci/check-release-tip.sh`) skips the release when
`main` has moved past the verified commit, and fails closed when it cannot read the tip.
`make check-release-version` runs before the changelog action and fails
loudly when `package.json` sits below the highest tag, with the remedy in the message. The action
runs with `git-push: false`; the workflow pushes the branch ref first and the tag ref only after,
so a declined branch push leaves nothing on the remote. The workflow hands the tarball
to `gh release create`, and the health monitor detects a release that lacks it.
`make check-release-health` (`release health`, daily) reads the `release / …` jobs of the newest
`main verification` push run and files or updates one `release-broken` issue when one of them
failed, the newest tag has no release, or the release lacks its tarball or GHCR image, and closes
it when the train recovers. A run whose `lint` or `unit` job failed skips the release; that is
`main-is-red`'s signal, not this one's.

**Recovery.**

- `release-version:` failure — `package.json` fell behind a tag. Set `version` to the highest tag's
  version and merge that; the next push computes a version above it. Never delete a `v*` tag: the
  `Protect release tags` ruleset forbids it, and a tag that carries a published release is a
  contract downstream consumers may already pin. That is how the 2025 deadlock was resolved:
  `v0.3.0` pointed at a rewritten release commit while `package.json` stayed at `0.2.0`, so every
  push recomputed `v0.3.0` and died on `git tag`; the version was raised to `0.3.0` and the lost
  `0.3.0` changelog section restored.
- `GH006` on the branch push — `main`'s branch protection declined the release commit. A classic
  rule with required status checks rejects every direct push whose commit carries no check runs,
  and the release App cannot be an administrator, so the fix is a repository setting: move `main`
  to a **ruleset** whose `bypass_actors` lists the VilnaCRM release App with `bypass_mode: always`
  (or add it to the classic rule's bypass list where the plan allows), then re-run the failed
  jobs of that `main verification` run. Use **Re-run failed jobs**, not **Re-run all jobs**: the
  passed `release / verify main tip` job keeps its decision, while a fresh one would skip the
  release as soon as anything else has landed on `main`. Record the change in
  [`docs/governance/branch-protection.md`](docs/governance/branch-protection.md).
- A failure **after** the tag push (`Pack the release tarball`, `Create Release`, the GHCR login,
  `Publish the production image`, an `Attest …` step, or a cosign step) cannot be recovered by
  re-running the job. The re-run checks out the verified commit again, where `package.json` still
  holds the old version while `v<version>` already exists, so `make check-release-version` stops
  it before the changelog action. Only a failure before the tag push — the tip read, the version guard,
  `GH006` — is recovered the usual way above. Finish a stranded tag by hand from a checkout of
  the tag itself, whose `package.json` carries the new version, publishing only what is missing:

  ```bash
  git fetch --tags && git checkout v<version>
  make release-tarball
  # no release yet: body from the v<version> section of CHANGELOG.md
  gh release create v<version> release/crm-dist-<version>.tar.gz --title v<version> --notes-file <notes>
  # release exists, tarball missing
  gh release upload v<version> release/crm-dist-<version>.tar.gz
  # image missing: `docker login ghcr.io` with a token that can write packages first
  make publish-image
  ```

  Provenance and signatures cannot be recovered this way: both are made with the workflow's OIDC
  identity, and no workflow re-attests or re-signs an existing tag, so a hand-published or
  unsigned `v<version>` fails `gh attestation verify` and `cosign verify`. Do not sign it from a
  laptop either: that certificate names a person, not the workflow, and fails the identity pinned
  above. Say so in its release notes; the next release is attested and signed normally. Because
  the attest and sign steps run only after the release, the tarball and the image are all
  published, a Sigstore outage leaves a complete but unsigned release rather than a bare tag. The
  SBOM signatures are the exception: `gh workflow run sbom.yml -f release_tag=<tag>` regenerates,
  re-signs and re-attaches them under the `sbom.yml` identity.

- The `release-broken` issue stays open while any offence persists and is closed by the next green
  daily run; do not close it by hand.

## Dependency updates

Dependencies are kept current by [Dependabot](.github/dependabot.yml), which opens pull
requests on a weekly schedule for three ecosystems:

- `bun` — the `package.json` JavaScript dependencies. The Bun ecosystem updates the manifest
  and `bun.lock` together in one pull request, so the `bun install --frozen-lockfile` step
  used across the Docker images and CI stays green.
- `github-actions` — the SHA-pinned actions in `.github/workflows/` and in the composite
  actions under `.github/actions/*` (listed as a second directory, since `/` covers workflows
  only).
- `docker` — the digest-pinned `FROM` lines of every Dockerfile (issue #139), in `/` and in
  `tests/load`. A digest pin is a floor, not a freeze: this lane is what raises it when a tag
  is re-pushed. A Node major arriving here fails
  `tests/unit/tooling/ci-job-hygiene.test.ts`, which holds `.nvmrc`, the Dockerfile base image
  and `engines.node` to one version, so it is taken through the major-version playbook with
  all three moved together rather than merged as a lone image bump.

To keep pull request volume low, minor and patch updates are grouped into a single request
per ecosystem — that is what `update-types: ['minor', 'patch']` on each group means. Majors
match no group, so **every major opens its own pull request** and can be reviewed, gated, and
reverted on its own. `open-pull-requests-limit` is 10 for `bun` (the grouped minor/patch
request takes one slot and each pending major takes one) and 5 for `github-actions` and
`docker`.

Dependabot has no equivalent of Renovate's `lockFileMaintenance`, so `bun.lock` is never
re-resolved against unchanged ranges on its own. Refresh it deliberately when transitive
drift matters.

Dependabot commit headers use the conventional `chore(deps):` prefix (`chore(github-actions):`
for the actions entry). Our commitlint `check-task-number-rule` expects a `(#N)` scope, which
Dependabot cannot emit. The `commitlint` workflow therefore lints bot pull requests against
`commitlint.bot.config.js`, which relaxes that one rule and keeps every other conventional-commit
rule in force — type, scope shape, subject, and header length are still checked. The bot path is
selected from provenance GitHub reports (the PR author for the title; per commit for the range, a
verified signature plus a bot author under a GitHub-written committer), never from the message
text or from anything the contributor controls, so it cannot be reached by a human. The
exemption is a step-level condition, never a job-level one, so the check always reports and can
never leave a required status pending. Because the repository is squash-merge-only, add the task
number to the squash commit title at merge time to keep `main`'s history conformant.

### Dependency license policy (issue #191)

`make lint-licenses` gates the **license** of every production dependency (direct or transitive).
It runs as part of `make lint` (it is a member of `CI_LINT_TARGETS` and the `lint:` aggregate),
so the existing `static testing` workflow enforces it on every pull request.
`scripts/ci/check-licenses.mjs` enumerates the production tree
(`license-checker-rseidelsohn --json`) and evaluates each license
**semantically** with `spdx-satisfies`, so compound expressions are handled correctly — `(MIT OR
Apache-2.0)` passes, `(GPL-3.0 AND MIT)` fails (the AND binds you to GPL), and unknown/unparseable
strings fail closed. This is stricter than a literal allowlist match, which would wrongly accept an
AND-compound whenever one operand happened to be allowed. The allowlist of permitted SPDX operand
ids lives in the `Makefile` (`ALLOWED_LICENSES`), trimmed to exactly what the production tree
contains today; `--production` keeps devDependencies out of scope.

Because a dependency (or a transitive one) can **relicense between versions**, review the
`make lint-licenses` result whenever you add or bump a dependency. If it fails, follow the
root-cause-not-suppression remediation policy: first replace the offending dependency; only if
that is impossible, add its specific SPDX id to `ALLOWED_LICENSES` as a reviewed one-line diff.
Never bypass or weaken the gate.

## Unexpected console output fails Jest

Every Jest setup file installs `jest-fail-on-console`, so a `console.error` or `console.warn`
emitted while a test runs **fails that test** (the apollo-server node suite gates `error` only;
`log` / `info` / `debug` are never gated). This catches the runtime warnings ESLint cannot see —
React `act()` warnings, missing list `key`s, invalid DOM nesting, i18next `missingKey` — which
otherwise scroll past in a green log.

If your test legitimately drives a path the application logs on, spy on it **and assert it**,
scoped to that single test:

```ts
const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);

expect(consoleError).toHaveBeenCalledWith('Registration response validation failed', {
  issueCount: 2,
});
```

Do not put that spy in a file-wide `beforeEach` — it would swallow genuinely unexpected output in
the file's other tests. If the message is an `act()` warning, it is a real bug in the test: await
the update instead of spying it away.

`tests/console-gate/allowlist.ts` is the only escape hatch, and
`tests/unit/tooling/console-gate.test.ts` rejects any entry that is not `^`-anchored, lacks a
substantive reason, or has outlived the dependency major it declares it expires with. Adding to it
is reviewed as a defect suppression, exactly like an `eslint-disable`.

## Major-version upgrade playbook

Majors arrive one per pull request (see above). Run each one through these steps; they are the
sequence issue #143 was executed with, and they are ordered so a failure has exactly one
candidate cause.

1. **Establish the blast radius before installing anything.** Grep for every call site,
   `jest.mock` path, and golden-text assertion that names the package. A missed
   `jest.mock('<old-name>')` string leaves the real module loaded with no error, and a golden
   assertion on a string that can no longer appear keeps passing while enforcing nothing.
2. **Check the peer and engine ranges of the target**, and of everything that peers on it, with
   `npm view <pkg>@<major> peerDependencies engines`. Some upgrades are gated by another one —
   `@testing-library/react` 16 unbundles `@testing-library/dom`, which then has to become a
   direct devDependency because `user-event` peers on it too.
3. **Bump one lane at a time** and re-run `make test-unit-all` and `make test-integration`
   between lanes. Where a lane needs a code change first (the JSX namespace before
   `@types/react` 19), land the code change under the old version — it must compile on both
   sides.
4. **Verify the runner, not just the tests.** A test-infrastructure major can move a
   transitive dependency the manifest still advertises. Confirm the resolved tree with
   `find node_modules -name package.json -path '*<pkg>/package.json'`; a nested second copy
   means the upgrade did not take.
5. **Re-measure the budgets.** `bun x rsbuild build` fails on the raw byte budgets by itself;
   `node scripts/bundle-size-report.mjs --dir dist` enforces the gzip ones. Satisfy a breach by
   reducing the bundle — narrowing a namespace `import()` so unused exports tree-shake, or
   moving a CommonJS bootstrap to ESM so the bundler can analyse it — never by raising a limit.
6. **Run the whole static lane**: `make format` then `make lint`, plus `make lint-metrics`,
   `make lint-shell`, `make lint-actionlint`, and `make lint-lockfile`. Remove `dist/` first —
   ESLint and dependency-cruiser do not ignore it.
7. **Prove the SDK contract where the code casts around it.** Any boundary that reaches a
   vendor through `as unknown as` is invisible to the compiler, and tests that replace the
   module wholesale cannot fail on a real API break. Add a conformance test that imports the
   real package and asserts the members exist.
8. **Re-run the full mutation gate cold.** Every dependency change invalidates the incremental
   cache key, so the run is honest; check the merged `valid` and `compileError` counts, not only
   the score. A program that no longer type-checks turns every mutant into `compileError`,
   which the report excludes from the denominator — a vacuous pass, not a loud failure.
9. **Never satisfy a gate with a suppression.** No `eslint-disable`, no `@ts-ignore`, no
   threshold edit, no narrowed mutation scope, no regenerated visual baseline that hides a real
   rendering change.
