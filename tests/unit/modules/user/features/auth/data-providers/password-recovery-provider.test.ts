import 'reflect-metadata';

import UserServiceErrorTransformer from '@/modules/user/transformers';
import type { ObservabilityService } from '@/services/types/observability/observability';
import PasswordRecoveryProvider from '@auth/data-providers/password-recovery-provider';
import type { GraphQLPasswordRecoveryRepository } from '@auth/repositories';
import PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import RecoveryFailureHandler from '@auth/utils/recovery-failure-handler';
import { buildEmail, buildPassword, buildResetToken } from '@tests/builders';

const setUp = (): {
  provider: PasswordRecoveryProvider;
  repository: jest.Mocked<GraphQLPasswordRecoveryRepository>;
  transformer: PasswordRecoveryTransformer;
  errors: UserServiceErrorTransformer;
  failures: RecoveryFailureHandler;
} => {
  const repository = {
    requestReset: jest.fn().mockResolvedValue(undefined),
    confirmReset: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<GraphQLPasswordRecoveryRepository>;
  const transformer = new PasswordRecoveryTransformer();
  const errors = new UserServiceErrorTransformer();
  const observability = { captureError: jest.fn() } as unknown as ObservabilityService;
  const failures = new RecoveryFailureHandler(errors, transformer, observability);
  return {
    provider: new PasswordRecoveryProvider(repository, transformer, failures),
    repository,
    transformer,
    errors,
    failures,
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
  ] as const)('%s hands a rejection to the failure handler once', async (method, step) => {
    const { provider, repository, failures } = setUp();
    const caught = new Error('boom');
    repository[method].mockRejectedValue(caught);
    const handle = jest.spyOn(failures, 'handle');
    const { signal } = new AbortController();
    const dto = { email: buildEmail(), token: buildResetToken(), newPassword: buildPassword() };

    const outcome = await provider[method](dto, signal);

    expect(handle).toHaveBeenCalledTimes(1);
    expect(handle).toHaveBeenCalledWith(step, caught, signal);
    expect(outcome).toBe(handle.mock.results[0]?.value);
  });
});
