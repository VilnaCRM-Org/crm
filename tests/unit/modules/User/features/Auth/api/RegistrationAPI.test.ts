import 'reflect-metadata';

import container from '@/config/DependencyInjectionConfig';
import TOKENS from '@/config/tokens';
import RegistrationAPI from '@/modules/User/features/Auth/api/RegistrationAPI';
import type HttpsClient from '@/services/HttpsClient/HttpsClient';

const mockHttpsClient = {
  post: jest.fn(),
} as unknown as HttpsClient;

describe('RegistrationAPI', () => {
  let registrationAPI: RegistrationAPI;

  beforeEach(() => {
    container.clearInstances();
    container.registerInstance(TOKENS.HttpsClient, mockHttpsClient);
    registrationAPI = new RegistrationAPI(mockHttpsClient);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should call httpsClient.post with correct parameters', async () => {
      const mockResponse = { token: 'test-token' };
      (mockHttpsClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123', fullName: 'Test User' };
      const result = await registrationAPI.register(credentials);

      expect(mockHttpsClient.post).toHaveBeenCalledWith(
        '/api/users',
        credentials,
        undefined
      );
      expect(result).toEqual(mockResponse);
    });

    it('should pass options to httpsClient.post', async () => {
      const mockResponse = { token: 'test-token' };
      (mockHttpsClient.post as jest.Mock).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123', fullName: 'Test User' };
      const options = { signal: new AbortController().signal };
      await registrationAPI.register(credentials, options);

      expect(mockHttpsClient.post).toHaveBeenCalledWith(
        '/api/users',
        credentials,
        options
      );
    });

    it('should throw AbortError directly without handling', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError');
      (mockHttpsClient.post as jest.Mock).mockRejectedValue(abortError);

      const credentials = { email: 'test@example.com', password: 'password123', fullName: 'Test User' };

      await expect(registrationAPI.register(credentials)).rejects.toThrow(abortError);
    });

    it('should handle and throw API errors', async () => {
      const mockError = new Error('Network error');
      (mockHttpsClient.post as jest.Mock).mockRejectedValue(mockError);

      const credentials = { email: 'test@example.com', password: 'password123', fullName: 'Test User' };

      await expect(registrationAPI.register(credentials)).rejects.toThrow();
    });
  });
});
