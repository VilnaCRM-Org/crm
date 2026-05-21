import {
  BaseAPI,
  createAuthClients,
  LoginAPI,
  RegistrationAPI,
} from '@/modules/user/features/auth/repositories';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';

describe('createAuthClients integration', () => {
  it('builds auth API clients from the shared repository barrel export', () => {
    const clients = createAuthClients();

    expect(clients.loginAPI).toBeInstanceOf(LoginAPI);
    expect(clients.registrationAPI).toBeInstanceOf(RegistrationAPI);

    const loginHttpsClient = (clients.loginAPI as unknown as { httpsClient: unknown }).httpsClient;
    const registrationHttpsClient = (clients.registrationAPI as unknown as { httpsClient: unknown })
      .httpsClient;

    expect(loginHttpsClient).toBeInstanceOf(FetchHttpsClient);
    expect(registrationHttpsClient).toBe(loginHttpsClient);
  });

  it('exports the shared base API class from the repository barrel', () => {
    expect(new BaseAPI()).toBeInstanceOf(BaseAPI);
  });
});
