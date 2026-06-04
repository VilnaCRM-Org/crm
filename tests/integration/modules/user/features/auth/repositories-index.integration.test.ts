import '../../../../setup';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import { BaseAPI, LoginAPI, RegistrationAPI } from '@/modules/user/features/auth/repositories';

describe('Repositories index integration', () => {
  it('should export BaseAPI class', () => {
    const api = new BaseAPI();

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
});
