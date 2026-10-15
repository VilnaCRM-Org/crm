import type { JSX } from 'react';

import i18n from '@/i18n';
import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';
import recoveryCatalogLoader from '@auth/routes/recovery-catalog/recovery-catalog-loader';
import type { RecoveryPageLayoutProps } from '@auth/types/recovery-page-layout';

recoveryCatalogLoader.register(i18n);

export default function RecoveryPageLayout({
  titleKey,
  children,
}: RecoveryPageLayoutProps): JSX.Element {
  usePageTitle(titleKey);

  return <AuthPageLayout>{children}</AuthPageLayout>;
}
