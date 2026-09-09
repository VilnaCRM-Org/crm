import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import appConfig from './app-config';
import featureFlagService from './feature-flag-service';
import RUNTIME_TOKENS from './tokens';

class RuntimeConfigRegistrar implements ModuleRegistrar {
  // Both bindings are container-free module singletons registered as values, mirroring the
  // observability render-path leaves (issue #115). The auth page reads flags synchronously at
  // paint time, so neither may pull tsyringe into the eager chunk; registering the existing
  // instances is what lets container-resolved classes inject them instead of value-importing
  // them at the call site (issue #130).
  public register(container: DependencyContainer): void {
    container.register(RUNTIME_TOKENS.AppConfig, { useValue: appConfig });
    container.register(RUNTIME_TOKENS.FeatureFlagService, { useValue: featureFlagService });
  }
}

export default new RuntimeConfigRegistrar();
