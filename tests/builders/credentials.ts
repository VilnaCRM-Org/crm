import type { SignInDto } from '@/modules/user';

import { buildEmail, buildPassword } from './user';

export function buildCredentials(overrides: Partial<SignInDto> = {}): SignInDto {
  return {
    email: buildEmail(),
    password: buildPassword(),
    ...overrides,
  };
}
