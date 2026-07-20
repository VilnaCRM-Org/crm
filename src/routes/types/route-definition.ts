import type { ComponentType, ReactElement } from 'react';

// A single code-split route (issue #117). Every page-level route in the manifest is
// declared as data: a dynamic `import()` loader and a non-null Suspense fallback. The
// route-manifest machine check enforces both, so an eagerly imported page or a null/empty
// fallback fails CI.
export interface RouteDefinition {
  id: string;
  path?: string;
  index?: boolean;
  protected?: boolean;
  load: () => Promise<{ default: ComponentType }>;
  // ReactElement, not ReactNode: ReactNode admits null/undefined/false, which would let a
  // route ship an empty Suspense fallback. This makes the non-null invariant a compile error
  // rather than only a test failure.
  fallback: ReactElement;
}
