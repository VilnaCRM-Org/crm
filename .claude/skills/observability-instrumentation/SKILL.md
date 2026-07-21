---
name: observability-instrumentation
description: Use when adding frontend telemetry, logs, Sentry, or web-vitals signals.
---

# Observability Instrumentation

## Scope

This repo is a frontend SPA. Instrument client-side failures and user-impacting
signals; do not copy backend AWS EMF patterns from user-service.

## Supported Signals

- Sentry error boundaries and captured exceptions through `@sentry/react`.
- Web Vitals through the `web-vitals` package.
- Apollo or HTTP errors surfaced through existing service boundaries.
- Structured server-side mock logs where Apollo local development needs them.

## Rules

- Capture domain context without logging secrets, passwords, tokens, or PII.
- Keep instrumentation outside presentational components when possible.
- Use typed wrappers or existing services instead of scattered direct calls.
- Make telemetry resilient; observability failure must not break user flows.
- Add tests for wrappers or error handling branches when behavior changes.

## Paint-Path Constraints

The auth page enforces a hard mobile Lighthouse budget. Observability wiring must keep
SDKs and the DI container out of the render path:

- Split observability into two layers: (a) a **container-free core** of module-singleton
  instances under `src/services/observability/` (no tsyringe, no `@injectable()`) that the
  render path imports; (b) a thin `@injectable() ObservabilityService` adapter (behind a DI
  token) used only by the service layer (ErrorHandler, ApolloLinkFactory, AuthStoreActions).
- Load `@sentry/react` and `web-vitals` **only** via dynamic `import()` gated on
  `REACT_APP_SENTRY_DSN` being non-empty. Rsbuild still emits them as separate async
  chunks, but an empty DSN (dev, CI, Lighthouse) is a verified no-op: those chunks are
  never fetched or executed at runtime, so no SDK code runs and no telemetry network
  requests are made.
- Never static-import `@sentry/react` or `tsyringe` into anything the auth page renders.

## Coverage Enforcement Model

Jest coverage is "loaded-files-only" but global 100% is enforced **per suite**. Observability
files must reach 100% in both the unit and the integration suite:

- The integration suite imports the real `dependency-injection-config`, which transitively
  module-evals the whole observability tree, so those files are loaded and subject to the gate.
- Write real integration tests that mock only leaf SDK boundaries (`@sentry/react`,
  `web-vitals`) and resolve the service via the DI container. Do not mirror collaborator-mocked
  unit tests into integration — that is a coverage dodge.

## PII Scrubbing: Value-Level, Not Key-Only

A key-only Sentry `beforeSend` scrubber misses error strings that echo PII. Deep-walk the
entire event:

- Walk `event.exception`, `event.message`, `event.breadcrumbs`, and all nested values.
- Drop denied keys (passwords, tokens, cookies, auth headers, emails).
- Redact email, bearer-token, and JWT patterns inside **string values** with regex.
- Set `sendDefaultPii: false` in the Sentry init options.

## Code Metrics Constraints

rust-code-analysis hard-fails on per-file function counts:

- `nom_functions_file > 10` (named methods per file).
- `nom_total_file > 15` (methods plus closures per file).

Adding a helper method or a `.catch(() => {})` closure can tip a class over the limit. Extract
to a separate file or drop a closure — never skip or suppress.

## Dependency Structure: Feature UI to Services

dependency-cruiser enforces `no-feature-ui-to-services`:

- `src/modules/*/features/*/components|hooks|routes` must **not** import `src/services/*`.
- Route observability calls through a feature `utils/` bridge module (utils may import
  services), not directly from a component, hook, or route.

## Verification

```bash
make test-unit-client
make lint
```

Use browser verification for runtime-only telemetry paths when unit tests cannot
prove the integration.

## Related Guides

Before applying this skill, confirm the active task against
[../AI-AGENT-GUIDE.md](../AI-AGENT-GUIDE.md) and
[../SKILL-DECISION-GUIDE.md](../SKILL-DECISION-GUIDE.md) so every relevant
skill is consulted.

## Line Length Disclosure

Before presenting changes, check changed text files for lines longer than 100 characters.
If any exist, tell the user each `path:line` and measured character count.
Treat this as disclosure, not failure, unless a project gate fails.

## Supporting Files

- [examples/frontend-error-boundary.md](examples/frontend-error-boundary.md):
  Sentry boundary example.
- [reference/sentry-patterns.md](reference/sentry-patterns.md): capture points
  and safe context.
- [reference/web-vitals.md](reference/web-vitals.md): runtime performance
  signal guidance.
- [reference/privacy-checklist.md](reference/privacy-checklist.md): telemetry
  privacy guardrails.
