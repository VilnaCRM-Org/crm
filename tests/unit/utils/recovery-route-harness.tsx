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
