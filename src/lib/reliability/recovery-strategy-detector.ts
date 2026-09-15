import { isRouteErrorResponse } from 'react-router';

import chunkLoadErrorDetector from './chunk-load-error-detector';
import recoverableErrorGuard from './recoverable-error-guard';
import type { RecoverableError } from './types/recoverable-error';

const SERVER_ERROR_STATUS = 500;

export const RECOVERIES = {
  retryable: {
    recoverable: true,
    strategy: 'retry',
    messageKey: 'error_boundary.retryable',
    severity: 'error',
  },
  unrecoverable: {
    recoverable: false,
    strategy: 'none',
    messageKey: 'error_boundary.unrecoverable',
    severity: 'error',
  },
  chunkLoad: {
    recoverable: true,
    strategy: 'reload',
    messageKey: 'error_boundary.chunk_load',
    severity: 'error',
  },
  route: {
    recoverable: true,
    strategy: 'navigate-home',
    messageKey: 'error_boundary.route',
    severity: 'warning',
  },
  unexpected: {
    recoverable: true,
    strategy: 'reset',
    messageKey: 'error_boundary.unexpected',
    severity: 'error',
  },
} satisfies Record<string, RecoverableError>;

export class RecoveryStrategyDetector {
  public classify(error: unknown): RecoverableError {
    return (
      this.fromRecoverable(error) ??
      this.fromRetryable(error) ??
      this.fromChunkLoad(error) ??
      this.fromRouteResponse(error) ?? { ...RECOVERIES.unexpected, cause: error }
    );
  }

  private fromRecoverable(error: unknown): RecoverableError | undefined {
    return recoverableErrorGuard.is(error) ? error : undefined;
  }

  private fromRetryable(error: unknown): RecoverableError | undefined {
    if (typeof error !== 'object' || error === null) return undefined;
    const { retryable } = error as { retryable?: unknown };
    if (typeof retryable !== 'boolean') return undefined;

    return retryable ? RECOVERIES.retryable : RECOVERIES.unrecoverable;
  }

  private fromChunkLoad(error: unknown): RecoverableError | undefined {
    return chunkLoadErrorDetector.is(error) ? RECOVERIES.chunkLoad : undefined;
  }

  private fromRouteResponse(error: unknown): RecoverableError | undefined {
    if (!isRouteErrorResponse(error)) return undefined;

    return error.status >= SERVER_ERROR_STATUS ? RECOVERIES.retryable : RECOVERIES.route;
  }
}

const recoveryStrategyDetector = new RecoveryStrategyDetector();

export default recoveryStrategyDetector;
