import type { JSX } from 'react';

import UIFormField from '@/components/ui-form-field';
import UIPasswordField from '@/components/ui-password-field';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import fieldStyles from '@auth/components/form-section/components/styles';
import UserOptions from '@auth/components/form-section/components/user-options';
import type { Props } from '@auth/types/auth-forms/login-form-fields';

export default function LoginFormFields({ t, validators }: Props): JSX.Element {
  return (
    <>
      <UIFormField<SignInDto>
        name="email"
        label={t('sign_in.form.email_input.label')}
        placeholder={t('sign_in.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        rules={{ required: t('sign_in.form.email_input.required'), validate: validators.email }}
        sx={fieldStyles.formFieldWrapper}
      />
      <UIPasswordField<SignInDto>
        placeholder={t('sign_in.form.password_input.placeholder')}
        label={t('sign_in.form.password_input.label')}
        autoComplete="current-password"
        rules={{
          required: t('sign_up.form.password_input.required'),
          validate: validators.password,
        }}
        sx={fieldStyles.formFieldWrapper}
      />
      <UserOptions />
    </>
  );
}
