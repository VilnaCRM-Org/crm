import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import formValidators from '@/modules/user/lib/validations';
import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';
import type { LoginFormProps } from '@auth/types/auth-forms/login-form';

import LoginErrorMessageNormalizer from './login-error-message';
import LoginFormFields from './login-form-fields';
import useLoginSubmitter from './use-login-submitter';

export { LoginErrorMessageNormalizer };

const LOGIN_DEFAULTS: SignInDto = { email: '', password: '' };

export default function LoginForm({ notice }: LoginFormProps): JSX.Element {
  const { t } = useTranslation();
  const { error, isSubmitting, handleLogin } = useLoginSubmitter(t);
  const validators = formValidators.create(t);

  return (
    <UIForm<SignInDto>
      onSubmit={handleLogin}
      defaultValues={LOGIN_DEFAULTS}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel={t('sign_in.form.submit_button')}
      submittingLabel={t('sign_in.form.submitting')}
      title={t('sign_in.title')}
      titleComponent="h1"
      subtitle={t('sign_in.subtitle')}
      notice={notice}
    >
      <LoginFormFields t={t} validators={validators} />
    </UIForm>
  );
}
