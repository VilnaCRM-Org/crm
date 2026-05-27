import type { TFunction } from 'i18next';
import { useCallback, useEffect } from 'react';

import { selectLoginError, selectLoginLoading, useAuthStore } from '@auth/stores/authStore';
import { LoginUserDto } from '@auth/types/Credentials';

import LoginErrorMessageNormalizer from './login-error-message';

type LoginSubmitter = {
  error: string;
  isSubmitting: boolean;
  handleLogin: (data: LoginUserDto) => Promise<void>;
};

const I18N_KEY_RE = /^[a-z0-9_]+(?:\.[a-z0-9_]+)+$/i;
const loginErrorMessageNormalizer = new LoginErrorMessageNormalizer();

function formatLoginError(raw: string | null, t: TFunction): string {
  if (!raw) return '';
  const normalized = loginErrorMessageNormalizer.normalize(raw);
  const reason = I18N_KEY_RE.test(normalized) ? t(normalized) : normalized;
  return t('sign_in.errors.login', { reason });
}

export default function useLoginSubmitter(t: TFunction): LoginSubmitter {
  const loginUser = useAuthStore((state) => state.loginUser);
  const isSubmitting = useAuthStore(selectLoginLoading);
  const rawError = useAuthStore(selectLoginError);

  useEffect(
    () => (): void => {
      useAuthStore.setState({ loginError: null });
    },
    []
  );

  const handleLogin = useCallback(
    async (data: LoginUserDto): Promise<void> => {
      await loginUser(data);
    },
    [loginUser]
  );

  return { error: formatLoginError(rawError, t), isSubmitting, handleLogin };
}
