import '../../../../setup';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import {
  BaseAPI,
  createAuthClients,
  LoginAPI,
  RegistrationAPI,
} from '@/modules/User/features/Auth/repositories';

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

  it('should export a factory that creates auth API clients', () => {
    const clients = createAuthClients();

    expect(clients.loginAPI).toBeInstanceOf(LoginAPI);
    expect(clients.registrationAPI).toBeInstanceOf(RegistrationAPI);
  });
});
