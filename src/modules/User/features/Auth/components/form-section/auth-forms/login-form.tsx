import UIForm from '@/components/UIForm';
import { useTranslation } from 'react-i18next';

import { createValidators } from '@/modules/User/features/Auth/components/form-section/validations';
import { LoginUserDto } from '@/modules/User/features/Auth/types/Credentials';
import getSubmitLabelKey from '@/modules/User/features/Auth/utils/getSubmitLabelKey';

import normalizeLoginErrorMessage from './login-error-message';
import LoginFormFields from './login-form-fields';
import useLoginSubmitter from './use-login-submitter';

export { normalizeLoginErrorMessage };

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
