import 'reflect-metadata';

import UserServiceErrorTransformer from '@/modules/user/transformers';
import PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import type { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import { buildEmail, buildPassword, buildResetToken } from '@tests/builders';

const setUp = (): {
  provider: PasswordRecoveryProvider;
  repository: jest.Mocked<GraphQLPasswordRecoveryRepository>;
  transformer: PasswordRecoveryTransformer;
  errors: UserServiceErrorTransformer;
} => {
  const repository = {
    requestReset: jest.fn().mockResolvedValue(undefined),
    confirmReset: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<GraphQLPasswordRecoveryRepository>;
  const transformer = new PasswordRecoveryTransformer();
  const errors = new UserServiceErrorTransformer();
  return {
    provider: new PasswordRecoveryProvider(repository, transformer, errors),
    repository,
    transformer,
    errors,
  };
};

describe('PasswordRecoveryProvider', () => {
  it('returns the sent outcome the transformer builds from the dto', async () => {
    const { provider, repository, transformer } = setUp();
    const toSent = jest.spyOn(transformer, 'toSentOutcome');
    const dto = { email: buildEmail() };
    const { signal } = new AbortController();

    const outcome = await provider.requestReset(dto, signal);

    expect(repository.requestReset).toHaveBeenCalledWith(dto, signal);
    expect(toSent).toHaveBeenCalledWith(dto);
    expect(outcome).toBe(toSent.mock.results[0]?.value);
  });

  it('returns the confirmed outcome after a resolved confirm', async () => {
    const { provider, repository } = setUp();
    const dto = { token: buildResetToken(), newPassword: buildPassword() };
    const { signal } = new AbortController();

    await expect(provider.confirmReset(dto, signal)).resolves.toEqual({ kind: 'confirmed' });
    expect(repository.confirmReset).toHaveBeenCalledWith(dto, signal);
  });

  it.each([
    ['requestReset', 'request'],
    ['confirmReset', 'confirm'],
  ] as const)('%s hands a rejection through both transformers once', async (method, step) => {
    const { provider, repository, transformer, errors } = setUp();
    const caught = new Error('boom');
    repository[method].mockRejectedValue(caught);
    const normalize = jest.spyOn(errors, 'normalize');
    const fromFailure = jest.spyOn(transformer, 'fromFailure');
    const { signal } = new AbortController();
    const dto = { email: buildEmail(), token: buildResetToken(), newPassword: buildPassword() };

    const outcome = await provider[method](dto, signal);

    expect(normalize).toHaveBeenCalledTimes(1);
    expect(normalize).toHaveBeenCalledWith(caught, signal);
    expect(fromFailure).toHaveBeenCalledTimes(1);
    expect(fromFailure).toHaveBeenCalledWith(step, normalize.mock.results[0]?.value);
    expect(outcome).toBe(fromFailure.mock.results[0]?.value);
  });
});
