import useAppDispatch, { useAppSelector } from '@/stores/hooks';

import { loginUser, registerUser } from '@/modules/user/store';
import {
  selectRegistrationError,
  selectRegistrationLoading,
} from '@/modules/user/store/registration-selectors';

import type { SafeUserInfo } from '../types/api-responses';
import type { LoginUserDto, RegisterUserDto } from '../types/credentials';

type UseAuthStoreResult = {
  registrationError: string | null;
  registrationLoading: boolean;
  register: (data: RegisterUserDto) => Promise<SafeUserInfo>;
  login: (data: LoginUserDto) => Promise<{ email: string; token: string }>;
};

export default function useAuthStore(): UseAuthStoreResult {
  const dispatch = useAppDispatch();

  const register = (data: RegisterUserDto): Promise<SafeUserInfo> =>
    dispatch(registerUser(data)).unwrap();
  const login = (data: LoginUserDto): Promise<{ email: string; token: string }> =>
    dispatch(loginUser(data)).unwrap();

  return {
    registrationError: useAppSelector(selectRegistrationError),
    registrationLoading: useAppSelector(selectRegistrationLoading),
    register,
    login,
  };
}
