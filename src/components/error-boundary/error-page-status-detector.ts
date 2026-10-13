import { isRouteErrorResponse } from 'react-router';

import type { ErrorPageVariantId } from '@/components/types/error-page';

const SERVER_ERROR_MIN_STATUS = 500;
const SERVER_ERROR_MAX_STATUS = 599;
const DATA_WITH_RESPONSE_INIT = 'DataWithResponseInit';

export class ErrorPageStatusDetector {
  private readonly exact: ReadonlyMap<number, ErrorPageVariantId> = new Map<
    number,
    ErrorPageVariantId
  >([
    [403, 'forbidden'],
    [404, 'notFound'],
  ]);

  public detect(routeError: unknown): ErrorPageVariantId | null {
    const status = this.statusOf(routeError);
    return status === null ? null : this.byStatus(status);
  }

  private statusOf(error: unknown): number | null {
    if (isRouteErrorResponse(error)) return error.status;
    if (error instanceof Response) return error.status;
    return this.dataStatus(error);
  }

  private dataStatus(error: unknown): number | null {
    if (typeof error !== 'object' || error === null) return null;
    if (!('type' in error) || error.type !== DATA_WITH_RESPONSE_INIT) return null;
    return 'init' in error ? this.initStatus(error.init) : null;
  }

  private initStatus(init: unknown): number | null {
    if (typeof init !== 'object' || init === null) return null;
    if (!('status' in init) || typeof init.status !== 'number') return null;
    return init.status;
  }

  private byStatus(status: number): ErrorPageVariantId | null {
    if (status >= SERVER_ERROR_MIN_STATUS && status <= SERVER_ERROR_MAX_STATUS) {
      return 'serverError';
    }
    return this.exact.get(status) ?? null;
  }
}

const errorPageStatusDetector = new ErrorPageStatusDetector();

export default errorPageStatusDetector;
