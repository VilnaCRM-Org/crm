import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import type { AuthRepository } from '@auth/types/auth-repository';

describe('AuthRepository DI wiring (integration)', () => {
  it('resolves a working AuthRepository from the container', () => {
    const repo = container.resolve<AuthRepository>(TOKENS.AuthRepository);

    expect(typeof repo.login).toBe('function');
    expect(typeof repo.register).toBe('function');
  });
});
