import { type JSX, Suspense } from 'react';

import type { RecoveryPageLayoutProps } from '@auth/types/recovery-page-layout';

type SectionModule = { default: () => JSX.Element };

function RecoveryPageLayoutStub({ titleKey, children }: RecoveryPageLayoutProps): JSX.Element {
  return (
    <main aria-label={titleKey}>
      <Suspense fallback={<p>loading section</p>}>{children}</Suspense>
    </main>
  );
}

/**
 * Stand-ins for the password-recovery route suite. Its `jest.mock` calls stay in the suite
 * (babel-plugin-jest-hoist lifts them above the imports) and reach these through
 * `jest.requireActual`. The layout stand-in exposes the `titleKey` a route hands
 * RecoveryPageLayout as the accessible name of its `<main>`, so the route suite asserts the
 * wiring while the real layout keeps its own suite.
 */
export const recoveryPageLayoutModule = {
  __esModule: true,
  default: RecoveryPageLayoutStub,
};

export const stubSectionLoader = (
  text: string
): { __esModule: true; default: { load: () => Promise<SectionModule> } } => ({
  __esModule: true,
  default: {
    load: async (): Promise<SectionModule> => ({
      default: (): JSX.Element => <p>{text}</p>,
    }),
  },
});
