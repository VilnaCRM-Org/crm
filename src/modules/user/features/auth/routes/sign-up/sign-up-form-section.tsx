import { useState } from 'react';

import AuthFormSection from '@auth/components/auth-form-section';
import AuthSwitcher from '@auth/components/auth-switcher';
import RegistrationForm from '@auth/components/form-section/auth-forms/registration-form';
import type { RegistrationView } from '@auth/components/form-section/types';

export default function SignUpFormSection(): JSX.Element {
  const [view, setView] = useState<RegistrationView>('form');

  return (
    <AuthFormSection
      oauthInert={view !== 'form'}
      switcher={<AuthSwitcher to="/sign-in" labelKey="sign_up.form.switcher_text_have_account" />}
    >
      <RegistrationForm onViewChange={setView} />
    </AuthFormSection>
  );
}
