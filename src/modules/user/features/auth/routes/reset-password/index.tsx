import { type JSX, lazy } from 'react';

import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';

import resetPasswordFormSectionLoader from './form-section-loader';

const ResetPasswordFormSection = lazy(() => resetPasswordFormSectionLoader.load());

export default function ResetPassword(): JSX.Element {
  usePageTitle('password_recovery.title');

  return (
    <AuthPageLayout>
      <ResetPasswordFormSection />
    </AuthPageLayout>
  );
}
