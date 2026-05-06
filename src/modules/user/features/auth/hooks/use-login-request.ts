import useAppDispatch from '@/stores/hooks';

import type { LoginUserDto } from '@/modules/user/features/auth/types/credentials';
import { loginUser } from '@/modules/user/store';

type UseLoginRequestResult = {
  login: (data: LoginUserDto) => Promise<{ email: string; token: string }>;
};

export default function useLoginRequest(): UseLoginRequestResult {
  const dispatch = useAppDispatch();

  return {
    login: (data: LoginUserDto) => dispatch(loginUser(data)).unwrap(),
  };
}
