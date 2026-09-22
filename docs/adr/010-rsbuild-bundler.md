# ADR-010: RSBuild is the bundler, configured in one file the gates read

- Status: Approved
- Deciders: [@kravalg](https://github.com/kravalg)
- Date: 2026-09-20

**Technical Story**: The build moved from Create React App with `craco` and
`react-app-rewired` overrides to RSBuild in pull request
[#40](https://github.com/VilnaCRM-Org/crm/pull/40) (issue
[#37](https://github.com/VilnaCRM-Org/crm/issues/37), 2026-01-08). The decision was recorded
only in that pull request; the enterprise readiness audit (issue
[#136](https://github.com/VilnaCRM-Org/crm/issues/136), section G) asked for it to be an ADR,
because every later gate that reads `rsbuild.config.ts` — the browser matrix, the bundle
budgets, the security headers, the preloaded-auth seed — assumes this choice without saying so.

## Context and Problem Statement

The template started on Create React App, whose webpack configuration is sealed behind
`react-scripts`. Every deviation the repository needed — path aliases, SVG-as-component,
Module Federation, a bundle analyzer, per-asset size hints — went through `craco` or
`react-app-rewired`, each of which patches the sealed config at runtime and breaks when
`react-scripts` changes. CRA itself stopped receiving updates, so the patch layer was
maintaining a dead upstream. Cold builds and dev-server restarts were slow enough to be the
dominant cost of the Docker-based workflow, and the configuration was split across three tools
with no single file a gate could read.

## Decision Drivers

- One configuration file that CI gates can read as data: the polyfill mode, the size hints, the
  dev-server headers and the `define` block all have to be checkable, not inferred
- Build and dev-server speed inside the Docker dev container, where every `make start` rebuilds
- Rspack compatibility with the webpack plugin ecosystem the repository already used
  (`webpack-bundle-analyzer`, Module Federation)
- No runtime patching of a sealed upstream config

## Considered Options

1. **RSBuild** — Rspack-based build tool with a declarative config, React and SVGR plugins,
   and webpack-plugin compatibility through `tools.rspack`.
2. **Vite** — esbuild-powered dev server with a Rollup production build.
3. **Stay on CRA with `craco`** — keep the sealed config and the override layer.

## Decision Outcome

Chosen option: **"RSBuild"**, because it kept the webpack-plugin ecosystem the repository
depended on while removing the override layer, and because its single `rsbuild.config.ts` is
what every later gate reads. The artifacts that implement it:

- `rsbuild.config.ts` — `pluginReact`, `pluginSvgr`, the `@/` and `@auth/*` aliases from
  `tsconfig.paths.json`, and `html.template` pointing at `public/index.html`.
- `output.polyfill` is read from `config/browser-support.json` and validated against its
  schema; the build refuses to start on an unknown mode (ADR-003).
- `performance.hints: 'error'` enforces the raw byte budgets from
  `config/performance-budget.json` on every production build (issue #117).
- `server.headers` applies the generated security-header baseline to the dev server (ADR-006).
- `source.define` inlines the preloaded-auth seed flag so Rspack can fold the seam out of every
  deployable bundle (issue #158).
- `make build`, `make build-out` and `make build-analyze` drive it inside Docker; the
  `bundle size` workflow diffs its output per pull request.

`rsbuild.config.ts` is one of the architecturally significant paths in
`config/docs-policy.json`, so a change to it without an ADR fails `make check-adr-drift`.

## Positive Consequences

- Production builds and dev-server restarts are Rspack-fast, which is what keeps the
  Docker-only workflow tolerable.
- One file holds the whole build contract, and four separate gates read it as data.
- The webpack plugin ecosystem still works, so the analyzer and Module Federation needed no
  replacement.

## Negative Consequences

- RSBuild is younger than webpack or Vite; a breaking release lands as its own major pull
  request under the cadence in ADR-004.
- Module Federation is configured but unwired (`@module-federation/enhanced` is a
  devDependency with empty `remotes` and `exposes`), a leftover of ADR-001 that this ADR does
  not resolve.
- Anything that needs a raw Rspack option goes through `tools.rspack`, which is the one place
  the declarative contract can be bypassed and is therefore a review-gate concern.

## Pros and Cons of the Options

### RSBuild

Rspack-based build with a declarative config and webpack-plugin compatibility.

#### Good (RSBuild)

- Rust-based bundling; measured builds are several times faster than the CRA path
- Keeps `webpack-bundle-analyzer` and Module Federation without adapters
- One config file that gates can parse

#### Bad (RSBuild)

- Smaller community than webpack or Vite
- Module Federation for Rspack is a separate plugin with its own release cadence

### Vite

esbuild dev server with a Rollup production build.

#### Good (Vite)

- Largest community and plugin catalogue of the three
- Very fast dev server

#### Bad (Vite)

- Dev and production use different bundlers, so a dev-only behaviour can differ from the
  shipped one
- Module Federation and the webpack analyzer need Vite-specific replacements

### Stay on CRA with `craco`

Keep `react-scripts` and the override layer.

#### Good (CRA)

- No migration cost

#### Bad (CRA)

- Upstream is unmaintained; every override patches a sealed config at runtime
- No single configuration file a gate can read

## Links

- [Issue #37 — RSBuild migration](https://github.com/VilnaCRM-Org/crm/issues/37)
- [Pull request #40 — the migration](https://github.com/VilnaCRM-Org/crm/pull/40)
- [Issue #136 — enterprise readiness audit, section G](https://github.com/VilnaCRM-Org/crm/issues/136)
- [ADR-001](./001-module-federation-vs-single-spa.md) — the Module Federation decision this
  build carries
- [ADR-003](./003-browser-support-matrix.md) — the polyfill mode the build reads
- [ADR-006](./006-browser-security-header-baseline.md) — the dev-server headers the build applies
