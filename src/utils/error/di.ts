import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import AbortErrorDetector from './abort-error-detector';
import ErrorParser from './error-parser';
import ERROR_UTILS_TOKENS from './tokens';

class ErrorUtilsRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(ERROR_UTILS_TOKENS.ErrorParser, ErrorParser);
    container.registerSingleton(ERROR_UTILS_TOKENS.AbortErrorDetector, AbortErrorDetector);
  }
}

export default new ErrorUtilsRegistrar();
