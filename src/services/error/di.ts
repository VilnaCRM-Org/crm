import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import { ErrorHandler } from './error-handler';
import ERROR_TOKENS from './tokens';

class ErrorRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(ERROR_TOKENS.ErrorHandler, ErrorHandler);
  }
}

export default new ErrorRegistrar();
