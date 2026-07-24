import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import NoopErrorReporter from './noop-error-reporter';
import ERROR_REPORTING_TOKENS from './tokens';

class ErrorReportingRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(ERROR_REPORTING_TOKENS.ErrorReporter, NoopErrorReporter);
  }
}

export default new ErrorReportingRegistrar();
