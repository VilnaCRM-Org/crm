import ApiErrorFactory from '@/modules/User/features/Auth/api/api-error-factory';
import { ApiError } from '@/modules/User/features/Auth/api/ApiErrors';

export default class BaseAPI {
  private readonly apiErrorFactory: ApiErrorFactory;

  constructor(apiErrorFactory: ApiErrorFactory = new ApiErrorFactory()) {
    this.apiErrorFactory = apiErrorFactory;
  }

  protected handleApiError(error: unknown, context: string): ApiError {
    return error instanceof ApiError ? error : this.apiErrorFactory.convert(error, context);
  }
}
