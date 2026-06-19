import { useTranslation } from 'react-i18next';

import UIForm from '@/components/ui-form';
import { createValidators } from '@auth/components/form-section/validations';
import type { LoginUserDto } from '@auth/types/credentials';
import getSubmitLabelKey from '@auth/utils/get-submit-label-key';

import LoginErrorMessageNormalizer from './login-error-message';
import LoginFormFields from './login-form-fields';
import useLoginSubmitter from './use-login-submitter';

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
