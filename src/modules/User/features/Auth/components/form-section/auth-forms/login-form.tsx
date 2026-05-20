import { useTranslation } from 'react-i18next';

import UIForm from '@/components/UIForm';
import { createValidators } from '@auth/components/form-section/validations';
import { LoginUserDto } from '@auth/types/Credentials';
import getSubmitLabelKey from '@auth/utils/getSubmitLabelKey';
import LoginErrorMessageNormalizer from '@auth-forms/login-error-message';
import LoginFormFields from '@auth-forms/login-form-fields';
import useLoginSubmitter from '@auth-forms/use-login-submitter';

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
