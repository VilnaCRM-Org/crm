import type { DependencyContainer } from 'tsyringe';

import type { ModuleRegistrar } from '@/config/types/module-registrar';

import boundaryErrorReporter from './boundary-error-reporter';
import ObservabilityErrorReporter from './observability-error-reporter';
import ERROR_REPORTING_TOKENS from './tokens';

class ErrorReportingRegistrar implements ModuleRegistrar {
  public register(container: DependencyContainer): void {
    container.registerSingleton(ERROR_REPORTING_TOKENS.ErrorReporter, ObservabilityErrorReporter);
    container.register(ERROR_REPORTING_TOKENS.BoundaryErrorReporter, {
      useValue: boundaryErrorReporter,
    });
  }
}

export default new ErrorReportingRegistrar();
