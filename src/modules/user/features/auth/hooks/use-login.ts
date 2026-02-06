import useAppDispatch from '@/stores/hooks';

import { loginUser } from '@/modules/user/store';

import { LoginUserDto } from '../types/credentials';

type UseLoginResult = {
  login: (data: LoginUserDto) => Promise<void>;
};

export default function useLogin(): UseLoginResult {
  const dispatch = useAppDispatch();

  return {
    login: async (data: LoginUserDto): Promise<void> => {
      await dispatch(loginUser(data)).unwrap();
    },
  };
}
