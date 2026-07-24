import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import type { AuthRepository } from '@auth/types/auth-repository';

describe('AuthRepository DI wiring (integration)', () => {
  it('resolves a working AuthRepository from the container', () => {
    const repo = container.resolve<AuthRepository>(AUTH_TOKENS.AuthRepository);

    expect(typeof repo.login).toBe('function');
    expect(typeof repo.register).toBe('function');
  });
});
