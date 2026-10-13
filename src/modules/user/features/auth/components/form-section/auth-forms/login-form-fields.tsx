import type { JSX } from 'react';

import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import FormField from '@auth/components/form-section/components/form-field';
import PasswordField from '@auth/components/form-section/components/password-field';
import UserOptions from '@auth/components/form-section/components/user-options';
import type { Props } from '@auth/types/auth-forms/login-form-fields';

export default function LoginFormFields({ t, validators }: Props): JSX.Element {
  return (
    <>
      <FormField<SignInDto>
        name="email"
        label={t('sign_in.form.email_input.label')}
        placeholder={t('sign_in.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        rules={{ required: t('sign_in.form.email_input.required'), validate: validators.email }}
      />
      <PasswordField<SignInDto>
        placeholder={t('sign_in.form.password_input.placeholder')}
        label={t('sign_in.form.password_input.label')}
        autoComplete="current-password"
      />
      <UserOptions />
    </>
  );
}
