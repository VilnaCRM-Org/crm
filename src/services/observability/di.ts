import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import ApolloLinkFactory from './apollo-link-factory';
import correlationIdProvider from './correlation-id-provider';
import observabilityCore from './observability-core';
import ObservabilityService from './observability-service';
import OBSERVABILITY_TOKENS from './tokens';

class ObservabilityRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(OBSERVABILITY_TOKENS.ObservabilityService, ObservabilityService);
    container.registerSingleton(OBSERVABILITY_TOKENS.ApolloLinkFactory, ApolloLinkFactory);
    this.registerRenderPathSingletons(container);
  }

  // The observability core and the correlation-id provider stay container-free module singletons
  // so the auth paint path can use them without loading tsyringe (issue #115). Registering the
  // existing instances as values is what lets container-resolved classes inject them instead of
  // value-importing them at the call site (issue #130).
  private registerRenderPathSingletons(container: DependencyContainer): void {
    container.register(OBSERVABILITY_TOKENS.ObservabilityCore, { useValue: observabilityCore });
    container.register(OBSERVABILITY_TOKENS.CorrelationIdProvider, {
      useValue: correlationIdProvider,
    });
  }
}

export default new ObservabilityRegistrar();
