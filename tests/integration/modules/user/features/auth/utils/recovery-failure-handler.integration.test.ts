import 'reflect-metadata';

import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import observabilityCore from '@/services/observability/observability-core';
import type RecoveryFailureHandler from '@auth/utils/recovery-failure-handler';

const resolveHandler = (): RecoveryFailureHandler =>
  container.resolve<RecoveryFailureHandler>(AUTH_TOKENS.RecoveryFailureHandler);

describe('recovery failure handler (integration)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['a client error', new TypeError('client bug'), 'confirm'],
    ['a null rejection', null, 'request'],
    ['an Apollo error without GraphQL errors', { graphQLErrors: [] }, 'request'],
  ] as const)('reports %s through the observability boundary', (_label, caught, step) => {
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();

    const outcome = resolveHandler().handle(step, caught, new AbortController().signal);

    expect(captureError).toHaveBeenCalledWith(caught, {
      source: 'auth:password-recovery',
      stage: step,
    });
    expect(outcome).toEqual({ kind: 'failed', failure: { reason: 'server', retryable: true } });
  });

  it.each([
    ['a coded GraphQL error', { graphQLErrors: [{ message: 'x', extensions: { code: 'X' } }] }],
    ['an unmapped network status', { networkError: { statusCode: 404 } }],
    ['an abort', Object.assign(new Error('aborted'), { name: 'AbortError' })],
  ])('leaves %s to the Apollo link', (_label, caught) => {
    const captureError = jest.spyOn(observabilityCore, 'captureError').mockImplementation();

    resolveHandler().handle('request', caught, new AbortController().signal);

    expect(captureError).not.toHaveBeenCalled();
  });
});
