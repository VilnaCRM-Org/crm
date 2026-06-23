import type { LoginUserDto } from '@auth/types/credentials';

export type LoginSubmitter = {
  error: string;
  isSubmitting: boolean;
  handleLogin: (data: LoginUserDto) => Promise<void>;
};

export type LoginUser = (data: LoginUserDto, signal?: AbortSignal) => Promise<void>;
