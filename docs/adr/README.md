# Architecture Decision Records (ADRs)

This index lists the Architecture Decision Records for this repository.

- [ADR-001: Module Federation vs Single-SPA](./001-module-federation-vs-single-spa.md)
- [ADR-002: Zustand vs Redux for Client State Management](./002-zustand-over-redux.md)
- [ADR-003: Browser support matrix and polyfill strategy](./003-browser-support-matrix.md)
- [ADR-004: Major dependency upgrades arrive per lane, and coupled lanes move together](./004-major-dependency-upgrade-cadence.md)
- [ADR-005: Client security events leave through the observability boundary](./005-client-security-event-boundary.md)
- [ADR-006: One generated security-header baseline serves production and the dev server](./006-browser-security-header-baseline.md)
- [ADR-007: Reliability model: recoverable errors, route boundaries, and visible fallbacks](./007-reliability-model.md)
- [ADR-008: Frontend state architecture: server, client, and session state](./008-frontend-state-architecture.md)
- [ADR-009: Runtime resilience: request deadlines, bounded retry, offline state, chunk recovery](./009-runtime-resilience.md)
- [ADR-010: RSBuild is the bundler, configured in one file the gates read](./010-rsbuild-bundler.md)
- [ADR-011: tsyringe is the dependency-injection container, kept off the paint path](./011-tsyringe-dependency-injection.md)
- [ADR-012: Contract-driven API mocks: Mockoon for REST, Apollo Server for GraphQL](./012-contract-driven-api-mocks.md)
- [ADR-013: Bun manages dependencies and runs tooling; Node stays the runtime](./013-bun-package-manager.md)
- [ADR-014: Code health is gated by a committed metrics policy and a zero-clone duplication gate](./014-code-health-metric-gates.md)

## Writing a new ADR

Copy [`template.md`](./template.md) to `docs/adr/NNN-kebab-case-slug.md`, fill in every section,
and add a row to the list above. `make lint-adr` validates the filename, the metadata block, the
status vocabulary, the required sections, and that this index and the ADR directory agree.

Statuses are `Proposed`, `Approved`, `Rejected`, `Deprecated`, and `Superseded`; the vocabulary
and the required sections live in [`config/docs-policy.json`](../../config/docs-policy.json).
