import type { TFunction } from 'i18next';

import FormField from '@auth/components/form-section/components/form-field';
import PasswordField from '@auth/components/form-section/components/password-field';
import UserOptions from '@auth/components/form-section/components/user-options';
import { createValidators } from '@auth/components/form-section/validations';
import { LoginUserDto } from '@auth/types/Credentials';

type Props = {
  t: TFunction;
  validators: ReturnType<typeof createValidators>;
};

export default function LoginFormFields({ t, validators }: Props): JSX.Element {
  return (
    <>
      <FormField<LoginUserDto>
        name="email"
        label={t('sign_in.form.email_input.label')}
        placeholder={t('sign_in.form.email_input.placeholder')}
        type="email"
        autoComplete="email"
        rules={{ required: t('sign_in.form.email_input.required'), validate: validators.email }}
      />
      <PasswordField<LoginUserDto>
        placeholder={t('sign_in.form.password_input.placeholder')}
        label={t('sign_in.form.password_input.label')}
        autoComplete="current-password"
      />
      <UserOptions />
    </>
  );
}
