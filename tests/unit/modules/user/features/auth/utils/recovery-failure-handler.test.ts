import 'reflect-metadata';

import UserServiceErrorTransformer from '@/modules/user/transformers';
import type { ObservabilityService } from '@/services/types/observability/observability';
import PasswordRecoveryTransformer from '@auth/transformers/password-recovery-transformer';
import RecoveryFailureHandler from '@auth/utils/recovery-failure-handler';

const setUp = (): {
  handler: RecoveryFailureHandler;
  transformer: PasswordRecoveryTransformer;
  errors: UserServiceErrorTransformer;
  captureError: jest.Mock;
} => {
  const transformer = new PasswordRecoveryTransformer();
  const errors = new UserServiceErrorTransformer();
  const captureError = jest.fn();
  const observability = { captureError } as unknown as ObservabilityService;
  return {
    handler: new RecoveryFailureHandler(errors, transformer, observability),
    transformer,
    errors,
    captureError,
  };
};

describe('RecoveryFailureHandler', () => {
  it.each(['request', 'confirm'] as const)(
    'hands a %s rejection through both transformers once',
    (step) => {
      const { handler, transformer, errors } = setUp();
      const caught = new Error('boom');
      const normalize = jest.spyOn(errors, 'normalize');
      const fromFailure = jest.spyOn(transformer, 'fromFailure');
      const { signal } = new AbortController();

      const outcome = handler.handle(step, caught, signal);

      expect(normalize).toHaveBeenCalledTimes(1);
      expect(normalize).toHaveBeenCalledWith(caught, signal);
      expect(fromFailure).toHaveBeenCalledTimes(1);
      expect(fromFailure).toHaveBeenCalledWith(step, normalize.mock.results[0]?.value);
      expect(outcome).toBe(fromFailure.mock.results[0]?.value);
    }
  );

  it.each(['request', 'confirm'] as const)(
    'reports a %s rejection the Apollo link never saw',
    (step) => {
      const { handler, captureError } = setUp();
      const caught = new TypeError('client bug');

      handler.handle(step, caught, new AbortController().signal);

      expect(captureError).toHaveBeenCalledTimes(1);
      expect(captureError).toHaveBeenCalledWith(caught, {
        source: 'auth:password-recovery',
        stage: step,
      });
    }
  );

  it.each([
    ['null', null],
    ['an Apollo error without GraphQL errors', { graphQLErrors: [] }],
  ])('reports %s as an unseen failure', (_label, caught) => {
    const { handler, captureError } = setUp();

    handler.handle('request', caught, new AbortController().signal);

    expect(captureError).toHaveBeenCalledWith(caught, {
      source: 'auth:password-recovery',
      stage: 'request',
    });
  });

  it.each([
    ['a coded GraphQL error', { graphQLErrors: [{ message: 'x', extensions: { code: 'X' } }] }],
    ['an unmapped network status', { networkError: { statusCode: 404 } }],
    ['a server status', { networkError: { statusCode: 503 } }],
    ['a violation', { graphQLErrors: [{ message: 'email: taken' }] }],
    ['an abort', Object.assign(new Error('aborted'), { name: 'AbortError' })],
  ])('does not report %s the link already handled', (_label, caught) => {
    const { handler, captureError } = setUp();

    handler.handle('request', caught, new AbortController().signal);

    expect(captureError).not.toHaveBeenCalled();
  });
});
