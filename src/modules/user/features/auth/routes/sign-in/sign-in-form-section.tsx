import type { JSX } from 'react';

import AuthFormSection from '@auth/components/auth-form-section';
import AuthSwitcher from '@auth/components/auth-switcher';
import LoginForm from '@auth/components/form-section/auth-forms/login-form';
import SignInNotice from '@auth/components/sign-in-notice';
import type { SignInFormSectionProps } from '@auth/types/sign-in/sign-in-form-section';

export default function SignInFormSection({ notice }: SignInFormSectionProps): JSX.Element {
  return (
    <AuthFormSection
      oauthInert={false}
      page="signIn"
      switcher={<AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account" />}
    >
      <SignInNotice notice={notice} />
      <LoginForm />
    </AuthFormSection>
  );
}
