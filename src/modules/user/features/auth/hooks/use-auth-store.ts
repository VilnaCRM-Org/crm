import { useMemo } from 'react';

import { createAuthClients } from '../repositories';
import type { SafeUserInfo } from '../types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '../types/credentials';

import useLoginRequest from './use-login-request';
import useRegistrationRequest from './use-registration-request';

type UseAuthStoreResult = {
  registrationError: string | null;
  registrationLoading: boolean;
  register: (data: RegisterUserDto) => Promise<SafeUserInfo>;
  login: (data: LoginUserDto) => Promise<{ email: string; token: string }>;
};

export default function useAuthStore(): UseAuthStoreResult {
  const { loginAPI, registrationAPI } = useMemo(() => createAuthClients(), []);
  const { login } = useLoginRequest(loginAPI);
  const { registrationError, registrationLoading, register } = useRegistrationRequest(
    registrationAPI
  );

  return {
    registrationError,
    registrationLoading,
    register,
    login,
  };
}
