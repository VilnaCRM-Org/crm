import { type JSX, lazy } from 'react';

import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';

import signUpFormSectionLoader from './form-section-loader';

const SignUpFormSection = lazy(() => signUpFormSectionLoader.load());

export default function SignUp(): JSX.Element {
  usePageTitle('sign_up.title');

  return (
    <AuthPageLayout>
      <SignUpFormSection />
    </AuthPageLayout>
  );
}
