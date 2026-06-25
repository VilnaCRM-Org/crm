import AuthFormSection from '@auth/components/auth-form-section';
import AuthSwitcher from '@auth/components/auth-switcher';
import LoginForm from '@auth/components/form-section/auth-forms/login-form';

export default function SignInFormSection(): JSX.Element {
  return (
    <AuthFormSection
      oauthInert={false}
      switcher={<AuthSwitcher to="/sign-up" labelKey="sign_up.form.switcher_text_no_account" />}
    >
      <LoginForm />
    </AuthFormSection>
  );
}
