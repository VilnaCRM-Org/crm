import { HttpError } from '@/services/HttpsClient/HttpError';
import throwIfHttpError from '@/services/HttpsClient/throwIfHttpError';

interface ErrorCause {
  [key: string]: unknown;
  url?: string;
  contentType?: string;
  body?: {
    [key: string]: unknown;
    fields?: Record<string, unknown>;
  };
}

// Mock Response for testing
class MockResponse {
  public ok: boolean;

  public status: number;

  public statusText: string;

  public url: string;

  public headers: Headers;

  private bodyContent: unknown;

  constructor(
    bodyContent: unknown,
    init: { status: number; statusText?: string; headers?: Record<string, string> }
  ) {
    this.ok = init.status >= 200 && init.status < 300;
    this.status = init.status;
    this.statusText = init.statusText || '';
    this.url = 'https://api.example.com/test';
    this.headers = new Headers(init.headers || {});
    this.bodyContent = bodyContent;
  }

  public async json(): Promise<unknown> {
    return this.bodyContent;
  }

  public async text(): Promise<string> {
    if (typeof this.bodyContent === 'string') {
      return this.bodyContent;
    }
    return JSON.stringify(this.bodyContent);
  }
}

const originalResponse = global.Response;
beforeAll(() => {
  global.Response = MockResponse as unknown as typeof Response;
});
afterAll(() => {
  global.Response = originalResponse;
});

const createMockResponse = (
  body: unknown,
  init: { status: number; statusText?: string; headers?: Record<string, string> }
): Response => new Response(body as BodyInit, init);

describe('throwIfHttpError', () => {
  describe('successful responses', () => {
    it('should not throw for 200 OK', async () => {
      const response = createMockResponse(null, { status: 200 });

      await expect(throwIfHttpError(response)).resolves.toBeUndefined();
    });

    it('should not throw for 201 Created', async () => {
      const response = createMockResponse(null, { status: 201 });

      await expect(throwIfHttpError(response)).resolves.toBeUndefined();
    });

    it('should not throw for 204 No Content', async () => {
      const response = createMockResponse(null, { status: 204 });

      await expect(throwIfHttpError(response)).resolves.toBeUndefined();
    });

    it('should not throw for any 2xx status', async () => {
      const statuses = [200, 201, 202, 203, 204, 205, 206];

      await Promise.all(
        statuses.map(async (status) => {
          const response = createMockResponse(null, { status });
          await expect(throwIfHttpError(response)).resolves.toBeUndefined();
        })
      );
    });
  });

  describe('error responses', () => {
    it('should throw HttpError for 400 Bad Request', async () => {
      const response = createMockResponse(null, {
        status: 400,
        statusText: 'Bad Request',
      });

      await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError for 401 Unauthorized', async () => {
      const response = createMockResponse(null, {
        status: 401,
        statusText: 'Unauthorized',
      });

      await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError for 403 Forbidden', async () => {
      const response = createMockResponse(null, {
        status: 403,
        statusText: 'Forbidden',
      });

      await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError for 404 Not Found', async () => {
      const response = createMockResponse(null, {
        status: 404,
        statusText: 'Not Found',
      });

      await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError for 500 Internal Server Error', async () => {
      const response = createMockResponse(null, {
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError for 502 Bad Gateway', async () => {
      const response = createMockResponse(null, {
        status: 502,
        statusText: 'Bad Gateway',
      });

      await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError for 503 Service Unavailable', async () => {
      const response = createMockResponse(null, {
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
    });
  });

  describe('error message extraction', () => {
    it('should use default message format for no body', async () => {
      const response = createMockResponse(null, { status: 404, statusText: 'Not Found' });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('404 Not Found');
        }
      }
    });

    it('should extract message from JSON response body', async () => {
      const response = createMockResponse(
        { message: 'Custom error message' },
        { status: 400, statusText: 'Bad Request', headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('Custom error message');
        }
      }
    });

    it('should extract message from text/plain response', async () => {
      const response = createMockResponse('Plain text error message', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'content-type': 'text/plain' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('Plain text error message');
        }
      }
    });

    it('should truncate very long JSON message to 500 characters', async () => {
      const longMessage = 'A'.repeat(1000);
      const response = createMockResponse(
        { message: longMessage },
        { status: 400, headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message.length).toBe(500);
          expect(error.message).toBe(longMessage.slice(0, 500));
        }
      }
    });

    it('should truncate very long text message to 500 characters', async () => {
      const longMessage = 'B'.repeat(1000);
      const response = createMockResponse(longMessage, {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message.length).toBe(500);
        }
      }
    });

    it('should use status text when message is not in JSON body', async () => {
      const response = createMockResponse(
        { error: 'some error' },
        { status: 400, statusText: 'Bad Request', headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 Bad Request');
        }
      }
    });

    it('should ignore non-text content types', async () => {
      const response = createMockResponse('some data', {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'application/octet-stream' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 Bad Request');
        }
      }
    });
  });

  describe('error cause', () => {
    it('should include response details in cause', async () => {
      const response = createMockResponse(
        { error: 'details' },
        { status: 400, headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.cause).toBeDefined();
          expect((error.cause as ErrorCause).url).toBe('https://api.example.com/test');
          expect((error.cause as ErrorCause).contentType).toBe('application/json');
          expect((error.cause as ErrorCause).body).toEqual({ error: 'details' });
        }
      }
    });

    it('should include text body in cause for text/plain', async () => {
      const response = createMockResponse('Error text', {
        status: 500,
        headers: { 'content-type': 'text/plain' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect((error.cause as ErrorCause).body).toBe('Error text');
        }
      }
    });

    it('should include contentType in cause', async () => {
      const response = createMockResponse(null, {
        status: 404,
        headers: { 'content-type': 'application/json' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect((error.cause as ErrorCause).contentType).toBe('application/json');
        }
      }
    });

    it('should handle missing content-type header', async () => {
      const response = createMockResponse(null, { status: 404 });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect((error.cause as ErrorCause).contentType).toBeUndefined();
        }
      }
    });
  });

  describe('edge cases', () => {
    it('should handle JSON parse errors gracefully', async () => {
      const response = createMockResponse(null, {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'application/json' },
      });

      // Override json() to throw
      response.json = async (): Promise<unknown> => {
        throw new Error('Invalid JSON');
      };

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 Bad Request');
        }
      }
    });

    it('should handle JSON response that returns undefined from catch', async () => {
      const response = createMockResponse(null, {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'application/json' },
      });

      // Override json() to throw (will be caught and return undefined)
      response.json = async (): Promise<unknown> => {
        throw new Error('JSON parse failed');
      };

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 Bad Request');
          expect((error.cause as ErrorCause).body).toBeUndefined();
        }
      }
    });

    it('should handle undefined JSON data without message property', async () => {
      const response = createMockResponse(null, {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'application/json' },
      });

      // json() returns undefined
      response.json = async (): Promise<unknown> => undefined;

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 Bad Request');
        }
      }
    });

    it('should set body to text for non-JSON content types', async () => {
      const response = createMockResponse('Some error text', {
        status: 500,
        statusText: 'Server Error',
        headers: { 'content-type': 'application/xml' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('500 Server Error');
          expect((error.cause as ErrorCause).body).toBe('Some error text');
        }
      }
    });

    it('should handle text() errors gracefully', async () => {
      const response = createMockResponse(null, {
        status: 500,
        statusText: 'Server Error',
        headers: { 'content-type': 'text/plain' },
      });

      // Override text() to throw
      response.text = async (): Promise<string> => {
        throw new Error('Cannot read text');
      };

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('500 Server Error');
        }
      }
    });

    it('should handle empty text response', async () => {
      const response = createMockResponse('', {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'text/plain' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 Bad Request');
        }
      }
    });

    it('should handle undefined message in JSON', async () => {
      const response = createMockResponse(
        { message: undefined },
        { status: 400, headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 ');
        }
      }
    });

    it('should handle null message in JSON', async () => {
      const response = createMockResponse(
        { message: null },
        { status: 400, headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 ');
        }
      }
    });

    it('should handle non-string message in JSON', async () => {
      const response = createMockResponse(
        { message: 12345 },
        { status: 400, headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('400 ');
        }
      }
    });

    it('should handle content-type with charset', async () => {
      const response = createMockResponse(
        { message: 'Error' },
        { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('Error');
        }
      }
    });

    it('should handle case-insensitive content-type', async () => {
      const response = createMockResponse(
        { message: 'Error' },
        { status: 400, headers: { 'content-type': 'APPLICATION/JSON' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('Error');
        }
      }
    });
  });

  describe('HTTP status codes', () => {
    it('should throw for all 4xx client errors', async () => {
      const statuses = [400, 401, 402, 403, 404, 405, 409, 422, 429];

      await Promise.all(
        statuses.map(async (status) => {
          const response = createMockResponse(null, { status });
          await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
        })
      );
    });

    it('should throw for all 5xx server errors', async () => {
      const statuses = [500, 501, 502, 503, 504];

      await Promise.all(
        statuses.map(async (status) => {
          const response = createMockResponse(null, { status });
          await expect(throwIfHttpError(response)).rejects.toThrow(HttpError);
        })
      );
    });

    it('should include correct status in thrown error', async () => {
      const response = createMockResponse(null, { status: 418, statusText: "I'm a teapot" });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.status).toBe(418);
        }
      }
    });
  });

  describe('real-world scenarios', () => {
    it('should handle validation error response', async () => {
      const response = createMockResponse(
        { message: 'Email is invalid', fields: { email: 'Invalid format' } },
        { status: 422, headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('Email is invalid');
          expect(error.status).toBe(422);
          expect((error?.cause as ErrorCause)?.body?.fields).toBeDefined();
        }
      }
    });

    it('should handle authentication error', async () => {
      const response = createMockResponse(
        { message: 'Invalid credentials' },
        { status: 401, headers: { 'content-type': 'application/json' } }
      );

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('Invalid credentials');
          expect(error.status).toBe(401);
        }
      }
    });

    it('should handle server error with HTML response', async () => {
      const response = createMockResponse('<html><body>Internal Server Error</body></html>', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'content-type': 'text/html' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('500 Internal Server Error');
        }
      }
    });

    it('should handle non-JSON content with text successfully extracted', async () => {
      const response = createMockResponse('Custom error text for XML', {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'content-type': 'application/xml' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect((error.cause as ErrorCause).body).toBe('Custom error text for XML');
        }
      }
    });

    it('should handle text/plain without message when text is empty', async () => {
      const response = createMockResponse('', {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'content-type': 'text/plain' },
      });

      try {
        await throwIfHttpError(response);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.message).toBe('500 Internal Server Error');
          expect((error.cause as ErrorCause).body).toBe('');
        }
      }
    });
  });
});
