import { useMemo } from 'react';

import useLoginRequest from '@/modules/user/features/auth/hooks/use-login-request';
import useRegistrationRequest from '@/modules/user/features/auth/hooks/use-registration-request';
import { createAuthClients } from '@/modules/user/features/auth/repositories';
import type { SafeUserInfo } from '@/modules/user/features/auth/types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '@/modules/user/features/auth/types/credentials';

type UseAuthStoreResult = {
  registrationError: string | null;
  registrationLoading: boolean;
  register: (data: RegisterUserDto) => Promise<SafeUserInfo>;
  login: (data: LoginUserDto) => Promise<{ email: string; token: string }>;
};

export default function useAuthStore(): UseAuthStoreResult {
  const { loginAPI, registrationAPI } = useMemo(() => createAuthClients(), []);
  const { login } = useLoginRequest(loginAPI);
  const { registrationError, registrationLoading, register } =
    useRegistrationRequest(registrationAPI);

  return {
    registrationError,
    registrationLoading,
    register,
    login,
  };
}
