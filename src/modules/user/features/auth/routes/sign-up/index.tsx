import { lazy } from 'react';

import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';

const SignUpFormSection = lazy(() => import('./sign-up-form-section'));

export default function SignUp(): JSX.Element {
  usePageTitle('sign_up.title');

  return (
    <AuthPageLayout>
      <SignUpFormSection />
    </AuthPageLayout>
  );
}
