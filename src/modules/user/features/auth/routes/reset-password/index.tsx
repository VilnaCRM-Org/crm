import { type JSX, lazy } from 'react';

import RecoveryPageLayout from '@auth/components/recovery-page-layout';

import resetPasswordFormSectionLoader from './form-section-loader';

const ResetPasswordFormSection = lazy(() => resetPasswordFormSectionLoader.load());

export default function ResetPassword(): JSX.Element {
  return (
    <RecoveryPageLayout titleKey="password_recovery.title">
      <ResetPasswordFormSection />
    </RecoveryPageLayout>
  );
}
