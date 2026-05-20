import { useTranslation } from 'react-i18next';

import UIForm from '@/components/UIForm';
import LoginErrorMessageNormalizer from '@auth/components/form-section/auth-forms/login-error-message';
import LoginFormFields from '@auth/components/form-section/auth-forms/login-form-fields';
import useLoginSubmitter from '@auth/components/form-section/auth-forms/use-login-submitter';
import { createValidators } from '@auth/components/form-section/validations';
import { LoginUserDto } from '@auth/types/Credentials';
import getSubmitLabelKey from '@auth/utils/getSubmitLabelKey';

export { LoginErrorMessageNormalizer };

const LOGIN_DEFAULTS: LoginUserDto = { email: '', password: '' };

export default function LoginForm(): JSX.Element {
  const { t } = useTranslation();
  const { error, isSubmitting, handleLogin } = useLoginSubmitter(t);
  const validators = createValidators(t);

  return (
    <UIForm<LoginUserDto>
      onSubmit={handleLogin}
      defaultValues={LOGIN_DEFAULTS}
      error={error}
      isSubmitting={isSubmitting}
      submitLabel={t(getSubmitLabelKey('sign_in', isSubmitting))}
      title={t('sign_in.title')}
      subtitle={t('sign_in.subtitle')}
    >
      <LoginFormFields t={t} validators={validators} />
    </UIForm>
  );
}
