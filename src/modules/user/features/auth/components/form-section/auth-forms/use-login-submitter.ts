import type { TFunction } from 'i18next';
import { useCallback, useEffect } from 'react';

import { AuthStoreSelectors, useAuthStore } from '@auth/stores';
import { LoginUserDto } from '@auth/types/credentials';

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
  const isSubmitting = useAuthStore(AuthStoreSelectors.loginLoading);
  const rawError = useAuthStore(AuthStoreSelectors.loginError);

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

  return {
    error: formatLoginError(rawError?.displayMessage ?? null, t),
    isSubmitting,
    handleLogin,
  };
}
