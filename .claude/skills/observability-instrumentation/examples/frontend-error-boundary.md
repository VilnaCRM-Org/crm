# Frontend Error Boundary Example

Use Sentry at a boundary, not scattered through presentational components:

```typescript
import * as Sentry from '@sentry/react';

export const AppErrorBoundary = Sentry.withErrorBoundary(App, {
  fallback: <FallbackScreen />,
  beforeCapture(scope) {
    scope.setTag('surface', 'app');
  },
});
```

Avoid recording tokens, passwords, raw form values, or full API payloads.
