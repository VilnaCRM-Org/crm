import '../../../../setup';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import {
  ApiErrorFactory,
  ApiStatusErrorFactory,
  BaseAPI,
  LoginAPI,
  RegistrationAPI,
} from '@/modules/user/features/auth/repositories';
import { ApiErrorCodes } from '@/modules/user/types/api-errors';
import HttpErrorGuard from '@/services/https-client/http-error-guard';

describe('Repositories index integration', () => {
  it('should export BaseAPI class', () => {
    const api = new BaseAPI(new ApiErrorFactory(new ApiStatusErrorFactory(), new HttpErrorGuard()));

    expect(api).toBeInstanceOf(BaseAPI);
  });

  it('should export LoginAPI class resolvable from DI container', () => {
    const loginAPI = container.resolve<LoginAPI>(TOKENS.LoginAPI);

    expect(loginAPI).toBeInstanceOf(LoginAPI);
  });

  it('should export RegistrationAPI class resolvable from DI container', () => {
    const registrationAPI = container.resolve<RegistrationAPI>(TOKENS.RegistrationAPI);

    expect(registrationAPI).toBeInstanceOf(RegistrationAPI);
  });

  it('should export ApiStatusErrorFactory and produce a service-unavailable error for 503', () => {
    const error = new ApiStatusErrorFactory().fromHttpError(
      { status: 503, message: 'down' },
      'Login'
    );

    expect(error.code).toBe(ApiErrorCodes.SERVICE_UNAVAILABLE);
  });
});
