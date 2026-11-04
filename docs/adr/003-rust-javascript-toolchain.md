# ADR-003: Move the toolchain to Bun 1.4, installing with either Bun or aube

- Status: Proposed
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-11-04

**Technical Story**: Rust-based alternatives to Node, Bun and `tsc` matured quickly in 2026, and
Bun itself moved from Zig to Rust in 1.4. Dependabot's
[#325](https://github.com/VilnaCRM-Org/crm/pull/325) (TypeScript 5.9 to 7.0) is the open change
that forces the question. No issue tracks this yet. Each candidate below was applied to a real
worktree of this repository at `db3db0f6` and measured there.

## Context and Problem Statement

The repository installs with Bun 1.3.5, runs everything on Node 24.8.0 and type-checks with `tsc`
5.9.3. RSBuild already brings a Rust bundler (Rspack). Every CI job installs inside a Docker build,
with no cache to reuse, and `make lint` runs a full type-check. Which installer, type-checker and
runtime are fastest on this repository, and what does it take to switch to them?

Speed decides this record. A failing check counts as migration work with a stated size, not as a
reason to stay.

## Decision Drivers

- **Measured speed on this repository**, not vendor benchmarks.
- **Cold install is what every CI job pays**, and warm install is what a developer pays.
- **Fewer tools to pin.** Each one is another version, digest and upgrade to keep in step.
- **Findings must stay identical.** A faster type-checker that misses errors is not faster.
- **The repository's own gates keep passing**, after fixes of a stated size.
- **The images are Alpine**, so a candidate needs a binary that starts on musl.
- **The project must have a future.** Deno's development ends in about a year: its team joined
  Cloudflare in October 2026, and the runtime gets one more year of monthly releases.

## Considered Options

1. **Variant A, Bun 1.4 only** — Bun installs, `bun check` type-checks, and Bun runs the tools.
2. **Variant B, aube and Bun 1.4** — as variant A, but aube installs.
3. **Deno** for the installer and the runtime.
4. **utoo** as the installer.
5. **`tsrs` or `tsc-rs` (ts-rust)** as the type-checker.
6. **`typescript` 7.0.2 as the package**, as in #325.
7. **No change.**

## Decision Outcome

Proposed: **move type-checking and the tools to Bun 1.4, and choose one of two installer variants**.
Both variants were run against the same checks and gave the same results, so the choice between
them is speed against a single stack. This record leaves that choice to the deciders.

| Layer                    | Today uses  | Switch to   | Today    | After    | Change |
| ------------------------ | ----------- | ----------- | -------- | -------- | ------ |
| Type-check, whole repo   | `tsc` 5.9.3 | `bun check` | 9.6 s    | 0.41 s   | -96%   |
| Focused unit Jest        | Node 24.8.0 | Bun 1.4.4   | 18.4 s   | 16.3 s   | -11%   |
| ESLint, four directories | Node 24.8.0 | Bun 1.4.4   | 8.3 s    | 7.1 s    | -14%   |
| Prettier, whole repo     | Node 24.8.0 | Bun 1.4.4   | 12.9 s   | 11.3 s   | -12%   |
| dependency-cruiser       | Node 24.8.0 | Bun 1.4.4   | 2.0 s    | 1.6 s    | -19%   |
| `serve`, HTML document   | Node 24.8.0 | Bun 1.4.4   | 3564 rps | 6026 rps | +69%   |

### The two installer variants

| Compared                  | Today, Bun 1.3.5 | Variant A, Bun 1.4.4 | Variant B, aube 2.9.0 |
| ------------------------- | ---------------- | -------------------- | --------------------- |
| Cold install              | 48.9 s           | 45.1 s               | 28.4 s                |
| Warm install              | 2.65 s           | 1.08 s               | 2.66 s                |
| No-op install             | 0.40 s           | 0.39 s               | 0.89 s                |
| Peak memory, cold         | 679 MiB          | 215 MiB              | 366 MiB               |
| Tools to pin and upgrade  | Bun              | Bun                  | Bun and aube          |
| `node_modules` layout     | hoisted          | hoisted, same tree   | isolated              |
| Combined stack, unit Jest | n/a              | 1413 of 1415         | 1413 of 1415          |

- **Choose variant A for one stack.** There is one tool to pin, the installed package versions match
  today's exactly, and it has the fastest warm install. It gives up 16.7 s on every cold install.
- **Choose variant B for the fastest CI.** It takes 20.5 s off every cold install, which is what
  every CI job pays. It costs a second pinned tool and the extra work marked below.

In both variants:

- **Bun 1.4.x writes `bun.lock`.** The file stays on `lockfileVersion: 1` and passes the provenance
  gate. In variant B, aube installs from that file. aube's own rewrite of it fails the gate and Bun
  1.3.5 refuses to parse it, so dependencies are still added with Bun, which also keeps Dependabot's
  `bun` lane in place.
- **`bun check` replaces `tsc` in `make lint-tsc`.** The `typescript` package stays on 5.x, because
  `ts-jest`, the Stryker checker and `typescript-eslint` call its compiler API. TypeScript 7's
  package no longer has `createProgram` or `createLanguageService`, and `typescript-eslint` exits
  with "does not support TS 7.0". This is why #325 is the wrong route.
- **Bun 1.4.x runs** Jest, ESLint, Prettier, dependency-cruiser, the gate scripts and, as the last
  step, `serve` in the production image.

Node stays for what was not measured here: Playwright, memlab, Lighthouse and Stryker. Each moves
only if its own CI job passes on Bun.

### Migration, in this order

Each step is its own pull request, and CI has to pass the suites this evaluation could not run.
Steps marked "variant B" apply only to that variant.

1. **Fix `main` first.** The Dockerfile does not build from scratch today: `curl=8.14.1-r2` and
   `python3=3.12.15-r0` are gone from Alpine's index. This is unrelated to any candidate.
2. **Remove `baseUrl`** from `tsconfig.json` and `tsconfig.paths.json`, and make `paths` start with
   `./`. Checks, focused Jest and the dev server all passed this on `tsc` 5.9.3.
3. **Upgrade Bun to 1.4.x:** `packageManager`, `ARG BUN_VERSION` in four Dockerfiles, the six
   digests in `scripts/docker/install-bun.sh`, and the version pinned in
   `tests/unit/tooling/bun-migration.test.ts`. Re-lock with a full `bun install`, which also records
   the SHA-512 the ui-toolkit tarball lacks today. Add the `.bun-tag` file Bun 1.4 writes to
   `UNHASHED_FILES` in `scripts/ci/ui-toolkit/ui-toolkit-policy.mjs`. The real installer and a frozen
   install of 2012 packages passed on the repository's Alpine Node image.
4. **Switch `make lint-tsc` to `bun check`.** Scripts must not compare its exit code against a
   specific value: it exits 1 on errors, where `tsc` exits 2.
5. **Variant B: install with aube.** This takes a one-line change to `transformIgnorePatterns` for
   `node_modules/.aube/`, `--ignore-scripts` (aube otherwise runs Puppeteer's postinstall, which Bun
   does not, and it fails fetching Chrome), a digest-verified install like Bun's, and an answer to
   `engine-strict=true`. aube enforces that setting and Bun never did: 38 packages want a newer Node
   than 24.8.0, up to `^24.15.0`. Either raise the Node pin or remove the setting. Declare
   `jest-environment-node` as a direct dev dependency too, since the isolated layout exposes it as
   undeclared once Jest runs on Bun.
6. **Run the tools on Bun 1.4.** Set globals with `Object.defineProperty` in
   `tests/jsdom-fetch-environment.cjs`, because plain assignment throws on Bun. Fix the one
   `page-reload-navigator` test that still fails.
7. **Run `serve` on Bun 1.4** in the production image, gated by `make check-security-headers`.
8. **Close a gap this evaluation found (security).** Bun 1.3.5, Bun 1.4.4 and aube all finish an
   install when a `bun.lock` integrity value is malformed, and
   `scripts/ci/check-lockfile-registries.sh` exits 0 on it. A wrong but well-formed hash is rejected
   by all three. The gate should reject any value of the wrong shape.

### Evidence

Every run used one x64 container at a time, capped at 4 CPUs and 4 GiB. Figures are medians.

**Combined stacks.** Each variant ran as a whole in its own worktree: Bun 1.4.4 lockfile and pins,
that variant's installer, `bun check`, and tools on Bun 1.4.4, with the fixes above except the two
test updates. The unmodified baseline passed everything.

| Check                                                  | Variant A      | Variant B      |
| ------------------------------------------------------ | -------------- | -------------- |
| Lockfile, ui-toolkit, licenses, i18n, serve.json gates | pass           | pass           |
| Browser-support and docs gates                         | pass           | pass           |
| Type-check: clean tree, and 17 seeded errors           | pass, 17 of 17 | pass, 17 of 17 |
| dependency-cruiser, jscpd, ESLint on four directories  | pass           | pass           |
| markdownlint, dev server with CSP                      | pass           | pass           |
| Prettier                                               | two files fail | two files fail |
| Unit Jest, four areas                                  | 1413 of 1415   | 1413 of 1415   |
| Integration Jest, focused                              | 52 of 52       | 52 of 52       |
| Apollo server Jest                                     | 118 of 118     | 118 of 118     |

In both, the Prettier failure is the JSON formatting of the evaluation's own tsconfig edit, and the
two unit failures are the Bun version pin and the `page-reload-navigator` test.

**Installers**, five interleaved rounds on the real `package.json` and `bun.lock`:

| Tool           | Cold   | Warm   | No-op  | Peak memory, cold | Alpine | Full checks |
| -------------- | ------ | ------ | ------ | ----------------- | ------ | ----------- |
| aube, isolated | 28.4 s | 2.66 s | 0.89 s | 366 MiB           | yes    | 22 of 22 \* |
| utoo 1.1.12    | 31.7 s | 5.30 s | 1.71 s | 958 MiB           | no     | 21 of 22    |
| aube, hoisted  | 34.9 s | 5.16 s | 6.14 s | 338 MiB           | yes    | 22 of 22    |
| Deno 2.9.8     | 43.7 s | 4.23 s | 0.06 s | 1393 MiB          | no     | 16 of 22    |
| Bun 1.4.4      | 45.1 s | 1.08 s | 0.39 s | 215 MiB           | yes    | 20 of 22    |
| Bun 1.3.5      | 48.9 s | 2.65 s | 0.40 s | 679 MiB           | in use | 22 of 22    |

\* With the one-line Jest change; 19 of 22 without it. "Full checks" here is each installer on its
own, before the fixes: Bun 1.4.4's two misses are `.bun-tag` and the version pin test. utoo ignores
`bun.lock` and resolves afresh, drifting 290 packages. Deno never installs the ui-toolkit tarball
(`Not implemented scheme 'https'`).

**Type-checkers**, seven rounds over 1,112 files:

| Tool              | Wall   | Peak memory | Seeded errors |
| ----------------- | ------ | ----------- | ------------- |
| `bun check` 1.4.4 | 0.41 s | 325 MiB     | 17 of 17      |
| `tsrs` `--fast`   | 0.44 s | 328 MiB     | not checked   |
| `tsrs` 0.21.0     | 0.50 s | 386 MiB     | 17 of 17      |
| `tsc-rs` 0.8.0    | 0.79 s | 712 MiB     | 17 of 17      |
| `tsc` 7.0.2 (Go)  | 1.97 s | 1254 MiB    | 17 of 17      |
| `tsc` 5.9.3       | 9.56 s | 1287 MiB    | baseline      |

Seeded errors cover the strictness flags, unresolved aliases, MUI overloads, `zustand` generics and
a decorated class, compared with `tsc` 5.9.3 by file, line and code. All report zero errors on the
clean tree. `bun check` needs no new dependency once Bun 1.4 lands.

**Runtimes**, with the Jest shim fixed so all three can run it:

| Workload                     | Node 24.8 | Bun 1.4.4 | Deno 2.9.8 |
| ---------------------------- | --------- | --------- | ---------- |
| Focused unit Jest, 5 rounds  | 18.4 s    | 16.3 s    | 23.9 s     |
| Those tests passing          | 1407/1407 | 1406/1407 | 1381/1383  |
| ESLint, 3 rounds             | 8.3 s     | 7.1 s     | 8.8 s      |
| Prettier, 3 rounds           | 12.9 s    | 11.3 s    | 11.7 s     |
| dependency-cruiser, 3 rounds | 2.0 s     | 1.6 s     | 1.9 s      |
| `tsc`, 3 rounds              | 9.7 s     | 10.5 s    | 9.7 s      |
| `serve`, document, rps       | 3564      | 6026      | 4839       |
| `serve`, gzip asset, rps     | 228       | 224       | 184        |
| Startup, hello world         | 21 ms     | 5 ms      | 16 ms      |

Andromeda 0.1.14 failed every check that actually ran on it, because it has no Node API layer.

**What this does not show:**

- Playwright, the full Jest suite, Stryker, a production RSBuild build, memlab, Lighthouse and
  Trivy's reading of a Bun 1.4 lockfile were not run, because they are CI-only on the machine used.
  The migration steps have to prove them.
- Local timings are not CI timings. Cold installs include network time, and CI's Docker builds run
  on musl, so the absolute saving there will differ.
- Jest timings exclude `tests/unit/tooling/console-gate-fixtures.test.ts`, 8 tests. Repeated runs
  back to back hung with a child Jest from that test, on Node as well. A single run passes. The
  cause is unknown and should be understood before relying on repeated runs.
- `--fast` on `tsrs` was timed but not compared on seeded errors. Upstream says it may differ.

## Positive Consequences

- Variant A: a warm install takes 1.08 s against 2.65 s, and a cold one takes 3.8 s less, with one
  tool and the same package versions as today.
- Variant B: a cold install takes 20.5 s less, on every image build. The isolated layout also
  surfaces undeclared dependencies such as `jest-environment-node`.
- A type-check takes about nine seconds less, with the same findings in this evaluation, and about
  a quarter of the memory.
- Jest, ESLint, Prettier and dependency-cruiser each get 11–19% faster.
- `serve` handles 69% more document requests per second on the same CPUs.
- The ui-toolkit tarball gains a recorded SHA-512.
- TypeScript 7's `baseUrl` blocker goes away, whichever checker is used later.

## Negative Consequences

- Variant A gives up 16.7 s per cold install against variant B, and improves only slightly on today
  (45.1 s against 48.9 s).
- Variant B has two pinned tools instead of one: aube installs, and Bun writes the lockfile and runs.
  Each bump needs a digest update, and its warm and no-op installs are slower than variant A's.
- Bun uses more memory on some workloads: ESLint peaks at 1665 MiB against 1354 MiB on Node.
- A `tsc` run on Bun is slower than on Node (10.5 s against 9.7 s). This stops mattering once
  `bun check` replaces it, but any tool still calling `tsc` pays it.
- Gzip-heavy serving gains nothing: 224 rps on Bun against 228 on Node.
- These projects are young. Bun's Rust line was released in August 2026 and its port was largely
  AI-driven, and its team reports 19 semantic regressions found during the port. This evaluation
  found a `.bun-tag` file and a `tsyringe` failure on 1.4.4 when decorated TypeScript runs directly.
  Application code goes through the bundler, so that path is not used today, but nothing should
  start depending on it.
- `bun check` is a second implementation of the TypeScript checker, and 17 seeded errors are a small
  sample. Its messages differ in wording, and one `TS2769` is reported 7 columns later, as `tsc` 7
  does. `tsrs` is the fallback if it ever disagrees with `tsc`.

## Pros and Cons of the Options

### Variant A, Bun 1.4 only

Bun installs, `bun check` type-checks, and Bun runs the tools.

#### Good (variant A)

- One stack: one tool to pin and upgrade, with the fastest warm install (1.08 s)
- The installed package versions match today's exactly
- No `transformIgnorePatterns` or `engine-strict` change is needed

#### Bad (variant A)

- 16.7 s slower than aube on every cold install, which is the case CI pays for

### Variant B, aube and Bun 1.4

As variant A, but aube installs from the `bun.lock` that Bun writes.

#### Good (variant B)

- The fastest cold install measured (28.4 s), 42% faster than today
- It honours `engine-strict`, and the isolated layout surfaces undeclared dependencies

#### Bad (variant B)

- A second tool to pin and upgrade, with an extra migration step
- Warm and no-op installs are slower than variant A's (2.66 s and 0.89 s, against 1.08 s and 0.39 s)
- Its own rewrite of `bun.lock` fails the provenance gate, so Bun has to stay the lockfile writer

### Deno

Deno 2.9.8 for the installer and the runtime.

#### Good (Deno)

- The fastest no-op install (62 ms)

#### Bad (Deno)

- Development ends in about a year, and there is no musl build for the Alpine images
- The slowest Jest here (23.9 s), and it skips the ui-toolkit tarball when installing

### utoo

utoo 1.1.12 as the installer.

#### Good (utoo)

- Second-fastest cold install (31.7 s)

#### Bad (utoo)

- Ignores `bun.lock`, so versions drift, and it does not start on Alpine

### `tsrs` or `tsc-rs`

The Rust ports of TypeScript 7 as the type-checker.

#### Good (`tsrs` or `tsc-rs`)

- `tsrs` is nearly as fast as `bun check`, and is the fallback named above

#### Bad (`tsrs` or `tsc-rs`)

- A new dependency, where `bun check` arrives with Bun 1.4 anyway
- `tsrs` is a `0.x` beta, and the `tsc-rs` README says "I've never read a line of this code"

### `typescript` 7.0.2 as the package

Dependabot's #325.

#### Good (`typescript` 7)

- The official compiler, and 4.8 times faster than 5.9.3

#### Bad (`typescript` 7)

- Breaks ESLint, Jest and dependency-cruiser today, and is slower than the Rust checkers

### No change

Stay on Bun 1.3.5, Node and `tsc` 5.9.3.

#### Good (no change)

- No migration work

#### Bad (no change)

- Keeps every number in the table above, and stays on the last Zig line of Bun

## Links

- [Dependabot #325 — TypeScript 7.0.2](https://github.com/VilnaCRM-Org/crm/pull/325)
- [Bun 1.4 release notes](https://bun.com/blog/bun-v1.4)
- [InfoQ — Bun's Zig to Rust rewrite](https://www.infoq.com/news/2026/09/bun-ai-rewrite-zig-rust-4-months/)
- [Deno is joining Cloudflare](https://deno.com/blog/cloudflare)
- [aube](https://github.com/aubepkg/aube) (npm's `aube` package is an unrelated project)
- [ts-rust (`tsc-rs`)](https://github.com/pingdotgg/ts-rust)
- [tsrs](https://github.com/oxc-project/tsrs)
- [utoo](https://github.com/utooland/utoo)
- [Andromeda](https://github.com/tryandromeda/andromeda)
