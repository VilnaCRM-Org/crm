import { type JSX, lazy } from 'react';

import RecoveryPageLayout from '@auth/components/recovery-page-layout';

import createNewPasswordFormSectionLoader from './form-section-loader';

const CreateNewPasswordFormSection = lazy(() => createNewPasswordFormSectionLoader.load());

export default function CreateNewPassword(): JSX.Element {
  return (
    <RecoveryPageLayout titleKey="password_reset.title">
      <CreateNewPasswordFormSection />
    </RecoveryPageLayout>
  );
}
