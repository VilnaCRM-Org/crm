import { type JSX, lazy } from 'react';

import i18n from '@/i18n';
import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';
import recoveryCatalogLoader from '@auth/routes/recovery-catalog/recovery-catalog-loader';

import resetPasswordFormSectionLoader from './form-section-loader';

recoveryCatalogLoader.register(i18n);

const ResetPasswordFormSection = lazy(() => resetPasswordFormSectionLoader.load());

export default function ResetPassword(): JSX.Element {
  usePageTitle('password_recovery.title');

  return (
    <AuthPageLayout>
      <ResetPasswordFormSection />
    </AuthPageLayout>
  );
}
