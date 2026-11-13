import type { SignUpDto } from '@/modules/user/types/user/sign-up-dto';

import type { SafeUserInfo } from './api-responses';
import type { AuthResult } from './auth-error';

export type RegisterResult = AuthResult<SafeUserInfo>;

export interface AuthRepository {
  register(credentials: SignUpDto, signal?: AbortSignal): Promise<RegisterResult>;
}
