import type { SignInDto } from '@/modules/user/types/user/sign-in-dto';

export interface LoginSubmitter {
  error: string;
  isSubmitting: boolean;
  handleLogin: (data: SignInDto) => Promise<void>;
}

export type LoginUser = (data: SignInDto, signal?: AbortSignal) => Promise<void>;

export interface LoginActions {
  loginUser: LoginUser;
}
