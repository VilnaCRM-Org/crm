import type { JSX } from 'react';

import i18n from '@/i18n';
import lazyCatalogLoader from '@/lib/locale-catalog/lazy-catalog-loader';
import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';
import en from '@auth/routes/recovery-catalog/i18n/en.json';
import uk from '@auth/routes/recovery-catalog/i18n/uk.json';
import type { RecoveryPageLayoutProps } from '@auth/types/recovery-page-layout';

lazyCatalogLoader.register(i18n, { en, uk });

export default function RecoveryPageLayout({
  titleKey,
  children,
}: RecoveryPageLayoutProps): JSX.Element {
  usePageTitle(titleKey);

  return <AuthPageLayout>{children}</AuthPageLayout>;
}
