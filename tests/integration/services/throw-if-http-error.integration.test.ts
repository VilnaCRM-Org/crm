import '../setup';
import { HttpError } from '@/services/https-client/http-error';
import throwIfHttpError from '@/services/https-client/throw-if-http-error';

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

  it('should attach a bounded body preview and metadata to HttpError cause', async () => {
    const jsonBody = { message: 'Parsed error message', detail: 'details' };
    const serializedBody = JSON.stringify(jsonBody);
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
        text: (): Promise<string> => Promise.resolve(serializedBody),
      }),
    } as unknown as Response;

    await expect(throwIfHttpError(mockResponse)).rejects.toMatchObject({
      status: 422,
      message: jsonBody.message,
      cause: {
        url: 'http://localhost/api/test',
        contentType: 'application/json',
        bodyPreview: serializedBody,
        bodyLength: serializedBody.length,
      },
    });
    await expect(throwIfHttpError(mockResponse)).rejects.toMatchObject({
      cause: expect.not.objectContaining({ body: expect.anything() }),
    });
  });

  it('truncates oversized response bodies in the preview', async () => {
    const longField = 'x'.repeat(1000);
    const jsonBody = { message: 'too big', longField };
    const serializedBody = JSON.stringify(jsonBody);
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      url: 'http://localhost/api/test',
      headers: { get: () => 'application/json' },
      clone: () => ({
        json: (): Promise<typeof jsonBody> => Promise.resolve(jsonBody),
        text: (): Promise<string> => Promise.resolve(serializedBody),
      }),
    } as unknown as Response;

    let caught: unknown;
    try {
      await throwIfHttpError(mockResponse);
    } catch (err) {
      caught = err;
    }
    const cause = (caught as { cause: { bodyPreview: string; bodyLength: number } }).cause;
    expect(cause.bodyPreview.length).toBe(200);
    expect(cause.bodyLength).toBe(serializedBody.length);
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
