import { type JSX, useState } from 'react';

import AuthFormSection from '@auth/components/auth-form-section';
import AuthSwitcher from '@auth/components/auth-switcher';
import LoginForm from '@auth/components/form-section/auth-forms/login-form';
import SignInNotice from '@auth/components/sign-in-notice';
import type { LoginView } from '@auth/types/auth-forms/use-login-view';
import type { SignInFormSectionProps } from '@auth/types/sign-in/sign-in-form-section';

export default function SignInFormSection({
  notice,
  postLogin,
}: SignInFormSectionProps): JSX.Element {
  const [view, setView] = useState<LoginView>('form');

  return (
    <AuthFormSection
      oauthInert={view !== 'form'}
      page="signIn"
      switcher={<AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account" />}
    >
      <LoginForm
        notice={<SignInNotice notice={notice} />}
        postLogin={postLogin}
        onViewChange={setView}
      />
    </AuthFormSection>
  );
}
