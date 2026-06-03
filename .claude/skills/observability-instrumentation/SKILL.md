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
