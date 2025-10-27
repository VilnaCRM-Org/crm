import '../setup';
import { HttpError } from '@/services/HttpsClient/HttpError';
import throwIfHttpError from '@/services/HttpsClient/throwIfHttpError';

describe('throwIfHttpError Coverage Tests', () => {
  it('should handle errors during body extraction (catch block coverage)', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: {
        get: (key: string) => {
          if (key === 'content-type') return 'application/json';
          return null;
        },
      },
      clone: () => ({
        json: (): Promise<never> => Promise.reject(new Error('JSON parse failed')),
        text: (): Promise<never> => Promise.reject(new Error('Text parse failed')),
      }),
    } as unknown as Response;

    await expect(throwIfHttpError(mockResponse)).rejects.toThrow(HttpError);
  });

  it('should handle plain text error responses (text/plain branch)', async () => {
    const errorText = 'Plain text error message';
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: {
        get: (key: string) => {
          if (key === 'content-type') return 'text/plain';
          return null;
        },
      },
      clone: () => ({
        text: (): Promise<string> => Promise.resolve(errorText),
      }),
    } as unknown as Response;

    try {
      await throwIfHttpError(mockResponse);
      fail('Should have thrown HttpError');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      if (error instanceof HttpError) {
        expect(error.message).toBe(errorText);
      }
    }
  });

  it('should handle non-JSON content type', async () => {
    const mockResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      headers: {
        get: (key: string) => {
          if (key === 'content-type') return 'text/html';
          return null;
        },
      },
      clone: () => ({
        text: (): Promise<string> => Promise.resolve('<html>Error</html>'),
      }),
    } as unknown as Response;

    await expect(throwIfHttpError(mockResponse)).rejects.toThrow(HttpError);
  });
});
