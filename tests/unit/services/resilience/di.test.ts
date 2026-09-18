import 'reflect-metadata';

import { container } from 'tsyringe';

import resilienceRegistrar from '@/services/resilience/di';
import ExponentialBackoffStrategy from '@/services/resilience/exponential-backoff-strategy';
import RequestRetryService from '@/services/resilience/request-retry-service';
import RESILIENCE_TOKENS from '@/services/resilience/tokens';
import TransientErrorDetector from '@/services/resilience/transient-error-detector';

describe('resilience registrar', () => {
  const scope = container.createChildContainer();

  beforeAll(() => {
    resilienceRegistrar.register(scope);
  });

  it.each([
    [RESILIENCE_TOKENS.BackoffStrategy, ExponentialBackoffStrategy],
    [RESILIENCE_TOKENS.TransientErrorDetector, TransientErrorDetector],
    [RESILIENCE_TOKENS.RequestRetryService, RequestRetryService],
  ])('registers %s as a singleton', (token, Class) => {
    const first = scope.resolve(token);

    expect(first).toBeInstanceOf(Class);
    expect(scope.resolve(token)).toBe(first);
  });
});
