import { type JSX, lazy } from 'react';

import useArrivalNotice from '@/hooks/use-arrival-notice';
import AuthPageLayout from '@auth/components/auth-page-layout';
import usePageTitle from '@auth/hooks/use-page-title';
import usePostLoginRedirect from '@auth/hooks/use-post-login-redirect';
import useTwoFactorRedirect from '@auth/hooks/use-two-factor-redirect';

import signInFormSectionLoader from './form-section-loader';

const SignInFormSection = lazy(() => signInFormSectionLoader.load());

export default function SignIn(): JSX.Element {
  usePageTitle('sign_in.title');
  useTwoFactorRedirect();
  const postLogin = usePostLoginRedirect();
  const notice = useArrivalNotice();

  return (
    <AuthPageLayout>
      <SignInFormSection notice={notice} postLogin={postLogin} />
    </AuthPageLayout>
  );
}
