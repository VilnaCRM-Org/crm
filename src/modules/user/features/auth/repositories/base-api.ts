import { ApiError } from '@/modules/user/lib/api-errors';

import ApiErrorFactory from './api-error-factory';

export default class BaseAPI {
  private readonly apiErrorFactory: ApiErrorFactory;

  constructor(apiErrorFactory: ApiErrorFactory = new ApiErrorFactory()) {
    this.apiErrorFactory = apiErrorFactory;
  }

  protected handleApiError(error: unknown, context: string): ApiError {
    return error instanceof ApiError ? error : this.apiErrorFactory.convert(error, context);
  }
}
