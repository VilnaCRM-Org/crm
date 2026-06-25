import { lazy } from 'react';

import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';

const SignInFormSection = lazy(() => import('./sign-in-form-section'));

export default function SignIn(): JSX.Element {
  usePageTitle('sign_in.title');

  return (
    <AuthPageLayout>
      <SignInFormSection />
    </AuthPageLayout>
  );
}
