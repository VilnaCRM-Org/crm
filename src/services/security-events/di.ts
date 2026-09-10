import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import securityEventCore from './security-event-core';
import SecurityEventReporter from './security-event-reporter';
import SECURITY_EVENT_TOKENS from './tokens';

class SecurityEventRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(SECURITY_EVENT_TOKENS.SecurityEventReporter, SecurityEventReporter);
    this.registerRenderPathSingletons(container);
  }

  // The security-event core stays a container-free module singleton so the auth paint path can
  // record a signal without loading tsyringe (issue #115). Registering the existing instance as a
  // value is what lets container-resolved classes inject it instead of value-importing it
  // (issue #130).
  private registerRenderPathSingletons(container: DependencyContainer): void {
    container.register(SECURITY_EVENT_TOKENS.SecurityEventCore, { useValue: securityEventCore });
  }
}

export default new SecurityEventRegistrar();
