import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { UIAsyncSectionProps } from '@/components/types/ui-async-section';
import UILiveStatus from '@/components/ui-live-status';
import UITypography from '@/components/ui-typography';

function statusSuffix(isLoading: boolean, hasError: boolean, count: number): string {
  if (isLoading) {
    return 'loading';
  }
  if (hasError) {
    return 'error';
  }
  return count > 0 ? 'loaded' : 'empty';
}

export default function UIAsyncSection({
  namespace,
  isLoading,
  hasError,
  count,
  children,
  headingLevel = 'h1',
}: UIAsyncSectionProps): JSX.Element {
  const { t } = useTranslation();
  const [announce, setAnnounce] = useState(false);
  const status = t(`${namespace}.${statusSuffix(isLoading, hasError, count)}`);
  const isReady = !isLoading && !hasError && count > 0;

  useEffect(
    () => {
      setAnnounce(true);
    },
    // Stryker disable next-line ArrayDeclaration: equivalent, deps stay Object.is-equal
    []
  );

  return (
    <section>
      <UITypography component={headingLevel} variant="h4">
        {t(`${namespace}.title`)}
      </UITypography>
      {isReady ? children : <UITypography>{status}</UITypography>}
      <UILiveStatus message={announce ? status : ''} />
    </section>
  );
}
