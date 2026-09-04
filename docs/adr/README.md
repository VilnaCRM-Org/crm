# Architecture Decision Records (ADRs)

This index lists the Architecture Decision Records for this repository.

- [ADR-001: Module Federation vs Single-SPA](./001-module-federation-vs-single-spa.md)
- [ADR-002: Zustand vs Redux for Client State Management](./002-zustand-over-redux.md)
- [ADR-003: Browser support matrix and polyfill strategy](./003-browser-support-matrix.md)

## Writing a new ADR

Copy [`template.md`](./template.md) to `docs/adr/NNN-kebab-case-slug.md`, fill in every section,
and add a row to the list above. `make lint-adr` validates the filename, the metadata block, the
status vocabulary, the required sections, and that this index and the ADR directory agree.

Statuses are `Proposed`, `Approved`, `Rejected`, `Deprecated`, and `Superseded`; the vocabulary
and the required sections live in [`config/docs-policy.json`](../../config/docs-policy.json).
