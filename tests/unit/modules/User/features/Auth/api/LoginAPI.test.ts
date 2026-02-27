import 'reflect-metadata';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import LoginAPI from '@/modules/User/features/Auth/api/LoginAPI';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';

const mockHttpsClient = {
  post: jest.fn(),
} as unknown as HttpsClient;

describe('LoginAPI', () => {
  let loginAPI: LoginAPI;

  beforeEach(() => {
    container.clearInstances();
    container.registerInstance(TOKENS.HttpsClient, mockHttpsClient);
    loginAPI = new LoginAPI(mockHttpsClient);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should call httpsClient.post with correct parameters', async () => {
      const mockResponse = { token: 'test-token' };
      (mockHttpsClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await loginAPI.login(credentials);

      expect(mockHttpsClient.post).toHaveBeenCalledWith('/api/users', credentials, undefined);
      expect(result).toEqual(mockResponse);
    });

    it('should pass options to httpsClient.post', async () => {
      const mockResponse = { token: 'test-token' };
      (mockHttpsClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const options = { signal: new AbortController().signal };
      await loginAPI.login(credentials, options);

      expect(mockHttpsClient.post).toHaveBeenCalledWith('/api/users', credentials, options);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Network error');
      (mockHttpsClient.post as jest.Mock).mockRejectedValue(mockError);

      const credentials = { email: 'test@example.com', password: 'password123' };

      await expect(loginAPI.login(credentials)).rejects.toThrow();
    });
  });
});
