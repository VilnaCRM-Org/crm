import type { LoginUserDto } from '@/modules/user/features/auth/types/credentials';

import { buildEmail, buildPassword } from './user';

export function buildCredentials(overrides: Partial<LoginUserDto> = {}): LoginUserDto {
  return {
    email: buildEmail(),
    password: buildPassword(),
    ...overrides,
  };
}
