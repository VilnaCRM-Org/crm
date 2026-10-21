import type { JSX } from 'react';

import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import FormField from '@auth/components/form-section/components/form-field';
import PasswordField from '@auth/components/form-section/components/password-field';
import type { RegistrationFormFieldsProps } from '@auth/types/auth-forms/registration-form-fields';

export default function RegistrationFormFields({
  t,
  validators,
}: RegistrationFormFieldsProps): JSX.Element {
  return (
    <>
      <FormField<SignUpDto>
        name="fullName"
        label={t('sign_up.form.name_input.label')}
        placeholder={t('sign_up.form.name_input.placeholder')}
        type="text"
        autoComplete="name"
        rules={{
          required: t('sign_up.form.name_input.required'),
          validate: validators.fullName,
        }}
      />
      <FormField<SignUpDto>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        rules={{
          required: t('sign_up.form.email_input.required'),
          validate: validators.email,
        }}
      />
      <PasswordField<SignUpDto>
        placeholder={t('sign_up.form.password_input.placeholder')}
        label={t('sign_up.form.password_input.label')}
        autoComplete="new-password"
      />
    </>
  );
}
