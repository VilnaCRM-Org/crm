import { type JSX, lazy } from 'react';

import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';

import createNewPasswordFormSectionLoader from './form-section-loader';

const CreateNewPasswordFormSection = lazy(() => createNewPasswordFormSectionLoader.load());

export default function CreateNewPassword(): JSX.Element {
  usePageTitle('password_reset.title');

  return (
    <AuthPageLayout>
      <CreateNewPasswordFormSection />
    </AuthPageLayout>
  );
}
