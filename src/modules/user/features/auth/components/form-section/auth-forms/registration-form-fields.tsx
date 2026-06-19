import type { TFunction } from 'i18next';

import FormField from '@auth/components/form-section/components/form-field';
import PasswordField from '@auth/components/form-section/components/password-field';
import type { RegisterUserDto } from '@auth/types/credentials';

import type { Validators } from './registration-form-fields.types';

export default function RegistrationFormFields({
  t,
  validators,
}: {
  t: TFunction;
  validators: Validators;
}): JSX.Element {
  return (
    <>
      <FormField<RegisterUserDto>
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
      <FormField<RegisterUserDto>
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
      <PasswordField<RegisterUserDto>
        placeholder={t('sign_up.form.password_input.placeholder')}
        label={t('sign_up.form.password_input.label')}
        autoComplete="new-password"
      />
    </>
  );
}
