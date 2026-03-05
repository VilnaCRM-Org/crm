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

  it('should include content type and body in HttpError cause for JSON errors', async () => {
    const jsonBody = { message: 'Parsed error message', detail: 'details' };
    const mockResponse = {
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      url: 'http://localhost/api/test',
      headers: {
        get: (key: string) => {
          if (key === 'content-type') return 'application/json';
          return null;
        },
      },
      clone: () => ({
        json: (): Promise<typeof jsonBody> => Promise.resolve(jsonBody),
        text: (): Promise<string> => Promise.resolve(JSON.stringify(jsonBody)),
      }),
    } as unknown as Response;

    await expect(throwIfHttpError(mockResponse)).rejects.toMatchObject({
      status: 422,
      message: jsonBody.message,
      cause: {
        url: 'http://localhost/api/test',
        contentType: 'application/json',
        body: jsonBody,
      },
    });
  });

  it('should handle missing content-type header', async () => {
    const mockResponse = {
      ok: false,
      status: 502,
      statusText: 'Bad Gateway',
      url: 'http://localhost/api/test',
      headers: {
        get: () => null,
      },
      clone: () => ({
        text: (): Promise<string> => Promise.resolve(''),
      }),
    } as unknown as Response;

    await expect(throwIfHttpError(mockResponse)).rejects.toMatchObject({
      status: 502,
      cause: {
        contentType: undefined,
      },
    });
  });

  it('should handle failures when reading text bodies for non-JSON responses', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      headers: {
        get: (key: string) => {
          if (key === 'content-type') return 'text/plain';
          return null;
        },
      },
      clone: () => ({
        text: (): Promise<never> => Promise.reject(new Error('read failure')),
      }),
    } as unknown as Response;

    await expect(throwIfHttpError(mockResponse)).rejects.toBeInstanceOf(HttpError);
  });
});
