import { type JSX, lazy } from 'react';

import i18n from '@/i18n';
import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';
import recoveryCatalogLoader from '@auth/routes/recovery-catalog/recovery-catalog-loader';

import createNewPasswordFormSectionLoader from './form-section-loader';

recoveryCatalogLoader.register(i18n);

const CreateNewPasswordFormSection = lazy(() => createNewPasswordFormSectionLoader.load());

export default function CreateNewPassword(): JSX.Element {
  usePageTitle('password_reset.title');

  return (
    <AuthPageLayout>
      <CreateNewPasswordFormSection />
    </AuthPageLayout>
  );
}
