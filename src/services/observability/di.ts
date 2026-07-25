import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import ApolloLinkFactory from './apollo-link-factory';
import ObservabilityService from './observability-service';
import OBSERVABILITY_TOKENS from './tokens';

class ObservabilityRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(OBSERVABILITY_TOKENS.ObservabilityService, ObservabilityService);
    container.registerSingleton(OBSERVABILITY_TOKENS.ApolloLinkFactory, ApolloLinkFactory);
  }
}

export default new ObservabilityRegistrar();
