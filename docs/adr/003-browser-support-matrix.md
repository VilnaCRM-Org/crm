# ADR-003: Browser support matrix and polyfill strategy

- Status: Approved
- Deciders: [@RudoiDmytro](https://github.com/RudoiDmytro)
- Date: 2026-08-13

**Technical Story**: The template declared a wide production browserslist range that the build
did not keep, so the supported-browser claim was aspirational. Tracked in
[#153](https://github.com/VilnaCRM-Org/crm/issues/153).

## Context and Problem Statement

`browserslist.production` was `>0.2%, not dead, not op_mini all`. Resolved against caniuse that
admitted **iOS Safari 11**, UC Browser 15.5, and Opera Mobile 80 into the supported set, while
`output.polyfill` was left at RSBuild's default (`off`), `core-js` was not a dependency, and no
polyfill entry existed.

SWC down-levels _syntax_ per browserslist, but it does not add missing _runtime APIs_. Any Web
API newer than the oldest admitted browser therefore throws at runtime on a browser the project
publicly claimed to support. Nothing detected this: Playwright only runs latest evergreen
engines, so CI could never observe the gap, and no document stated which browsers were actually
tested. An enterprise adopter could not tell what "supported" meant.

## Decision Drivers

- A support claim must be verifiable by a machine, not asserted in prose
- The auth page is already at the edge of its Lighthouse budget, so bundle weight added by
  polyfills is expensive (see `config/performance-budget.json`)
- The repository is the template for all VilnaCRM microservices — every fork inherits the claim
- The declared range must not drift silently when `caniuse-lite` is refreshed
- Consistency with the repository's existing "policy file plus a gate" pattern

## Considered Options

1. **Narrow the matrix to a modern interoperability line and keep `polyfill: "off"`** — publish
   a floor the build already satisfies, and enforce it.
2. **Keep the wide range and enable `output.polyfill: "usage"`** — inject `core-js` shims per
   browserslist so the existing claim becomes true.
3. **Leave the range as-is and document the caveat** — no build change, prose only.

## Decision Outcome

Chosen option: **"Narrow the matrix to a modern interoperability line and keep
`polyfill: "off"`"**, floored at **Baseline 2023 Widely available** — Chrome 111, Edge 111,
Firefox 111, Safari and iOS Safari 16.4, Samsung Internet 22, Opera 97, plus latest Chrome and
Firefox for Android.

The decision is implemented as data, not prose. [`config/browser-support.json`](../../config/browser-support.json)
holds the polyfill mode, the exact `browserslist.production` query, and the per-family floors;
`rsbuild.config.ts` reads `polyfill` from that file and refuses to build on an unknown value,
and three checks keep everything reconciled:

- `make check-browser-support` fails when the package.json query, the resolved per-family
  floors, or the README matrix drift apart from the policy.
- The `compat/compat` ESLint rule fails the build when `src/` reaches for a Web API missing from
  any browser in the same `browserslist.production` query.
- SWC down-levels syntax against that identical query during the production build.

A CRM is an authenticated workplace application on managed, evergreen browsers, so the traffic
this excludes is negligible — while option 2 would have spent initial-bundle budget on shims for
browsers no user of this product runs.

## Positive Consequences

- The published matrix is machine-checked in both directions, so it cannot rot into a false claim
- No `core-js` payload, so the initial-entrypoint budget keeps its headroom
- `caniuse-lite` refreshes can no longer widen the pinned floors silently. Chrome and Firefox
  for Android are the deliberate exception: browserslist tracks a single current release for
  each, so they are declared `trackLatest` and move with upstream by design — the gate asserts
  they resolve to exactly that current release rather than to a stale pin
- Reaching for an unsupported Web API fails at lint time rather than in a user's browser
- Downstream microservices inherit an enforced, stated matrix instead of an aspirational one

## Negative Consequences

- Browsers older than the floor are explicitly unsupported; that is now a stated product
  decision rather than an accident, and raising it requires editing the policy and the ADR
- Raising the floor later is a reviewed change across the policy, the README table, and this ADR
- `eslint-plugin-compat` adds a development dependency and a small amount of lint time

## Pros and Cons of the Options

### Narrow the matrix

Publish and enforce the floor the build already meets.

#### Good (narrow the matrix)

- Claim and artifact agree without shipping any extra bytes
- Both directions of drift are detectable by a deterministic, offline check

#### Bad (narrow the matrix)

- Drops reach that the previous query nominally advertised

### Enable usage polyfills

Keep the wide query and let RSBuild inject `core-js` per browserslist.

#### Good (enable usage polyfills)

- Preserves the widest advertised reach
- Requires no decision about which browsers matter

#### Bad (enable usage polyfills)

- Spends initial-entrypoint budget on browsers this product does not serve
- `core-js` shims ES built-ins but not every Web API, so the claim still would not be fully true
- Larger dependency and build surface to maintain and audit

### Document the caveat only

Leave the build untouched and describe the gap in prose.

#### Good (document the caveat only)

- Zero build risk and no dependency change

#### Bad (document the caveat only)

- Leaves an untrue claim in place, which is the defect being fixed
- Unenforced prose is exactly the failure mode the repository is eliminating

## Links

- [Issue #153: Align declared browser support with build transpilation targets](https://github.com/VilnaCRM-Org/crm/issues/153)
- [Baseline: Widely available](https://web.dev/baseline)
- [Browserslist query documentation](https://github.com/browserslist/browserslist#query-composition)
- [RSBuild output.polyfill](https://rsbuild.dev/config/output/polyfill)
- [eslint-plugin-compat](https://github.com/amilajack/eslint-plugin-compat)
