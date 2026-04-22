import ApiErrorConverter from './api-error-converter';
import { ApiError } from './ApiErrors';

export default class BaseAPI {
  private readonly apiErrorConverter: ApiErrorConverter;

  constructor(apiErrorConverter: ApiErrorConverter = new ApiErrorConverter()) {
    this.apiErrorConverter = apiErrorConverter;
  }

  protected handleApiError(error: unknown, context: string): ApiError {
    return error instanceof ApiError ? error : this.apiErrorConverter.convert(error, context);
  }
}
