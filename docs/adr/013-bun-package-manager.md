# ADR-013: Bun manages dependencies and runs tooling; Node stays the runtime

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-20

**Technical Story**: Pull request [#38](https://github.com/VilnaCRM-Org/crm/pull/38) (issue
[#36](https://github.com/VilnaCRM-Org/crm/issues/36), 2025-12-29) moved the repository from
pnpm to Bun for installs, scripts and CI. The rationale lived in the pull-request body; the
enterprise readiness audit (issue [#136](https://github.com/VilnaCRM-Org/crm/issues/136),
section G) asked for it as an ADR, and the boundary it draws — Bun for dependencies, Node for
execution — is one that later work (the lockfile gate, the license gate, the Trivy closure, the
verified installer of issue [#139](https://github.com/VilnaCRM-Org/crm/issues/139)) depends on.

## Context and Problem Statement

pnpm was failing intermittently in CI and its store layout complicated the Docker dev image,
where the workspace is bind-mounted and `node_modules` lives in a named volume. Every install
happens inside a Docker build, so install speed is on the critical path of every CI job and of
every `make start`. At the same time the application, the Apollo mock, the Playwright and
memory-leak harnesses and the CI scripts all run on Node, and several of them (Jest with
`ts-jest`, Playwright, memlab, `winston`) are validated against Node semantics, not Bun's.

## Decision Drivers

- Install speed inside Docker, where a cold install runs on every image build
- A lockfile the supply-chain gates can parse: Trivy scores `bun.lock`'s production closure,
  `make lint-lockfile` checks its registry provenance, and Dependabot's `bun` ecosystem updates
  it with `package.json` in one pull request (ADR-004)
- No change to the runtime the test harnesses and the production `serve` image are validated
  against
- One pinned version, reproducible in Docker and CI

## Considered Options

1. **Bun as package manager and script runner, Node as runtime** — `bun install`, `bun x`
   for tooling; `node` executes the app, the mocks and the harnesses.
2. **Bun as runtime too** — run Jest, Playwright and the servers under Bun.
3. **Stay on pnpm** — fix the CI failures and keep the store layout.
4. **npm** — the runtime's own package manager, no extra toolchain.

## Decision Outcome

Chosen option: **"Bun for dependencies and tooling, Node for execution"**, because it took the
install-speed and lockfile benefits without moving any runtime-validated harness onto a second
engine. The artifacts that implement it:

- `packageManager: "bun@1.3.5"` and `engines.bun` in `package.json`; `engines.node` stays
  `>=24.8.0` with `engineStrict`, and `.nvmrc` pins the Node major that
  `tests/unit/tooling/ci-job-hygiene.test.ts` holds to one version across the runner, the
  Dockerfile base image and `engines.node`.
- `bun install --frozen-lockfile` in every image; `bun x jest`, `bun x rsbuild`,
  `bun x playwright` through the Makefile, which is the only sanctioned command surface.
- The Docker images install Bun through `scripts/docker/install-bun.sh` against a pinned
  SHA256 (issue #139), so the toolchain is reproducible and verified.
- `bun.lock` is the artifact the supply-chain, license and provenance gates read; Dependabot
  moves it together with `package.json`.

## Positive Consequences

- Cold installs inside the Docker build are measured in seconds, which is what keeps the
  every-job image rebuild affordable.
- One lockfile format that every dependency gate in the repository parses.
- The runtime contract is unchanged: anything validated against Node runs on Node.

## Negative Consequences

- Two toolchains are pinned instead of one; a Bun release is a `packageManager` bump, an
  `ARG BUN_VERSION` bump in four Dockerfiles and six digests in the installer, held together by
  `tests/unit/tooling/image-hardening.test.ts`.
- The dev container's `node_modules` is a named volume, so a host-side `bun add` is invisible
  inside the container until `bun install --frozen-lockfile` runs there too.
- Bun's lockfile has no equivalent of a lockfile-maintenance refresh; transitive drift is
  handled deliberately (ADR-004).

## Pros and Cons of the Options

### Bun for dependencies and tooling, Node for execution

Install and run scripts with Bun; execute with Node.

#### Good (Bun + Node)

- Fast installs; text lockfile the gates parse; no runtime migration

#### Bad (Bun + Node)

- Two pinned toolchains

### Bun as runtime too

Run everything under Bun.

#### Good (Bun runtime)

- One engine

#### Bad (Bun runtime)

- Jest, Playwright, memlab and the Apollo mock are validated against Node; running them under
  Bun moves every harness onto a compatibility layer the repository would have to own

### Stay on pnpm

Fix the CI failures and keep the store layout.

#### Good (pnpm)

- No migration

#### Bad (pnpm)

- The failures were in CI itself; the content-addressed store complicated the bind-mounted dev
  image

### npm

The runtime's own package manager.

#### Good (npm)

- No extra toolchain

#### Bad (npm)

- Slowest install of the four inside a Docker build

## Links

- [Issue #36 — Bun migration](https://github.com/VilnaCRM-Org/crm/issues/36)
- [Pull request #38 — the migration](https://github.com/VilnaCRM-Org/crm/pull/38)
- [Issue #139 — verified Bun installer](https://github.com/VilnaCRM-Org/crm/issues/139)
- [Issue #136 — enterprise readiness audit, section G](https://github.com/VilnaCRM-Org/crm/issues/136)
- [ADR-004](./004-major-dependency-upgrade-cadence.md) — the Dependabot lanes that move `bun.lock`
