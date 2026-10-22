import type { JSX } from 'react';

import UIFormField from '@/components/ui-form-field';
import UIPasswordField from '@/components/ui-password-field';
import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';
import fieldStyles from '@auth/components/form-section/components/styles';
import type { RegistrationFormFieldsProps } from '@auth/types/auth-forms/registration-form-fields';

function RegistrationPasswordField({ t, validators }: RegistrationFormFieldsProps): JSX.Element {
  return (
    <UIPasswordField<SignUpDto>
      placeholder={t('sign_up.form.password_input.placeholder')}
      label={t('sign_up.form.password_input.label')}
      autoComplete="new-password"
      rules={{
        required: t('sign_up.form.password_input.required'),
        validate: validators.password,
      }}
      sx={fieldStyles.formFieldWrapper}
    />
  );
}

export default function RegistrationFormFields({
  t,
  validators,
}: RegistrationFormFieldsProps): JSX.Element {
  return (
    <>
      <UIFormField<SignUpDto>
        name="fullName"
        label={t('sign_up.form.name_input.label')}
        placeholder={t('sign_up.form.name_input.placeholder')}
        type="text"
        autoComplete="name"
        rules={{
          required: t('sign_up.form.name_input.required'),
          validate: validators.fullName,
        }}
        sx={fieldStyles.formFieldWrapper}
      />
      <UIFormField<SignUpDto>
        name="email"
        label={t('sign_up.form.email_input.label')}
        placeholder={t('sign_up.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        rules={{
          required: t('sign_up.form.email_input.required'),
          validate: validators.email,
        }}
        sx={fieldStyles.formFieldWrapper}
      />
      <RegistrationPasswordField t={t} validators={validators} />
    </>
  );
}
