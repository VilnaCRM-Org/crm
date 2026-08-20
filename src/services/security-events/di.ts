import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import SecurityEventReporter from './security-event-reporter';
import SECURITY_EVENT_TOKENS from './tokens';

class SecurityEventRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(SECURITY_EVENT_TOKENS.SecurityEventReporter, SecurityEventReporter);
  }
}

export default new SecurityEventRegistrar();
