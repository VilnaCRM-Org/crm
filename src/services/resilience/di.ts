import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import ExponentialBackoffStrategy from './exponential-backoff-strategy';
import RequestRetryService from './request-retry-service';
import RESILIENCE_TOKENS from './tokens';
import TransientErrorDetector from './transient-error-detector';

class ResilienceRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(RESILIENCE_TOKENS.BackoffStrategy, ExponentialBackoffStrategy);
    container.registerSingleton(RESILIENCE_TOKENS.TransientErrorDetector, TransientErrorDetector);
    container.registerSingleton(RESILIENCE_TOKENS.RequestRetryService, RequestRetryService);
  }
}

export default new ResilienceRegistrar();
