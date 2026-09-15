# Frontend Error Boundary Example

Report at a boundary, not scattered through presentational components — and never by calling
`@sentry/react` directly. The shell's boundary is `UIErrorBoundary`
(`src/components/error-boundary/ui-error-boundary.tsx`, issue #116); it takes its reporter by
**prop**, because the paint path cannot resolve the DI container:

```typescript
// src/index.tsx — the entrypoint is a #128 carve-out, so it may import the reporter
import UIErrorBoundary from '@/components/error-boundary/ui-error-boundary';
import boundaryErrorReporter from '@/services/error-reporting/boundary-error-reporter';

root.render(
  <UIErrorBoundary surface="app" reporter={boundaryErrorReporter}>
    <AppProviders>
      <App />
    </AppProviders>
  </UIErrorBoundary>
);
```

`boundaryErrorReporter` is a container-free singleton that emits the `error_boundary_catch`
security event for the surface and then captures through `observabilityCore`, so the catch
inherits the DSN gate, the PII scrubber, and both correlation ids:

```typescript
// src/services/error-reporting/boundary-error-reporter.ts
export class BoundaryErrorReporter implements ErrorReporter {
  public report(error: Error, context?: Record<string, unknown>): void {
    securityEventCore.boundaryCatch(String(context?.surface ?? 'app'));
    observabilityCore.captureError(error, context);
  }
}
```

The auth feature composes the same boundary with `surface="auth"` and its `authErrorReporter`
(which delegates to `boundaryErrorReporter`); route errors are reported once, at the
`<RouterProvider onError>` seam built by `routeComposer.routeErrorHandler()`, with
`surface: 'route'`. The boundary itself contains no `console.*` call — React 19 already logs
every caught error through `onCaughtError`, and a test that renders a throwing child passes
`onCaughtError` to `render` and asserts it.

Avoid recording tokens, passwords, raw form values, or full API payloads; `componentStack` and
the surface are the only context the boundaries add.
