import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import { HttpError, isHttpError } from '@/services/HttpsClient/HttpError';
import ResponseMessages from '@/services/HttpsClient/responseMessages';

const TEST_URL = 'http://localhost:8080/api/test';

const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('FetchHttpsClient Integration', () => {
  let client: FetchHttpsClient;

  beforeAll(() => {
    global.fetch = mockFetch;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    client = new FetchHttpsClient();
    mockFetch.mockClear();
  });

  describe('GET requests', () => {
    it('should successfully make a GET request', async () => {
      const mockData = { id: 1, name: 'Test' };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.get<typeof mockData>(TEST_URL);

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    });

    it('should handle GET request with AbortSignal', async () => {
      const mockData = { id: 1 };
      const controller = new AbortController();

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.get<typeof mockData>(TEST_URL, { signal: controller.signal });

      expect(result).toEqual(mockData);
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
    });
  });

  describe('POST requests', () => {
    it('should successfully make a POST request', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.post<typeof requestData, typeof responseData>(
        TEST_URL,
        requestData
      );

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
    });
  });

  describe('PUT requests', () => {
    it('should successfully make a PUT request', async () => {
      const requestData = { id: 1, name: 'Updated Item' };
      const responseData = { ...requestData, updated: true };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.put<typeof requestData, typeof responseData>(
        TEST_URL,
        requestData
      );

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'PUT',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
    });
  });

  describe('PATCH requests', () => {
    it('should successfully make a PATCH request', async () => {
      const requestData = { name: 'Patched Item' };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.patch<typeof requestData, typeof responseData>(
        TEST_URL,
        requestData
      );

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'PATCH',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
    });
  });

  describe('DELETE requests', () => {
    it('should successfully make a DELETE request with data', async () => {
      const requestData = { id: 1 };
      const responseData = { deleted: true };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.delete<typeof requestData, typeof responseData>(
        TEST_URL,
        requestData
      );

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'DELETE',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
    });

    it('should successfully make a DELETE request without data', async () => {
      const responseData = { deleted: true };

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify(responseData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.delete<unknown, typeof responseData>(TEST_URL);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
    });
  });

  describe('status code handling', () => {
    it('should return undefined for 204 No Content', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

      const result = await client.get<unknown>(TEST_URL);

      expect(result).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    });

    it('should return undefined for 205 Reset Content', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 205 }));

      const result = await client.get<unknown>(TEST_URL);

      expect(result).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    });

    it('should return undefined for 304 Not Modified', async () => {
      mockFetch.mockResolvedValueOnce(new Response(null, { status: 304 }));

      const result = await client.get<unknown>(TEST_URL);

      expect(result).toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
    });
  });

  describe('error handling', () => {
    it('should throw HttpError on 400 Bad Request', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Bad Request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(client.get(TEST_URL)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Internal Server Error' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(client.get(TEST_URL)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError with message from response', async () => {
      const errorMessage = 'Custom error message';

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ message: errorMessage }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(client.get(TEST_URL)).rejects.toThrow(errorMessage);
    });

    it('should handle plain text error responses', async () => {
      const errorText = 'Plain text error';

      mockFetch.mockResolvedValueOnce(
        new Response(errorText, {
          status: 400,
          headers: { 'Content-Type': 'text/plain' },
        })
      );

      await expect(client.get(TEST_URL)).rejects.toThrow(errorText);
    });

    it('should handle empty response body with error status', async () => {
      mockFetch.mockResolvedValueOnce(new Response('', { status: 404 }));

      await expect(client.get(TEST_URL)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      const error = await client.get(TEST_URL).catch((err) => err);
      expect(isHttpError(error)).toBe(true);
      if (isHttpError(error)) {
        expect(error.status).toBe(0);
        expect(error.message).toBe(ResponseMessages.NETWORK_ERROR);
      }
    });

    it('should throw HttpError on non-JSON response when JSON expected', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('invalid json content', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      await expect(client.get(TEST_URL)).rejects.toThrow(ResponseMessages.JSON_PARSE_FAILED);
    });

    it('should handle empty JSON response', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('', {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.get(TEST_URL);
      expect(result).toBeUndefined();
    });

    it('should throw HttpError for non-JSON response with 200 status', async () => {
      mockFetch.mockResolvedValueOnce(
        new Response('<html></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        })
      );

      await expect(client.get(TEST_URL)).rejects.toThrow(ResponseMessages.RESPONSE_NOT_JSON);
    });

    it('should handle errors during body extraction for error responses', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        url: TEST_URL,
        headers: {
          get: (key: string) => {
            if (key === 'content-type') return 'application/json';
            return null;
          },
        },
        clone: () => ({
          json: (): Promise<never> => Promise.reject(new Error('JSON parse error')),
          text: (): Promise<never> => Promise.reject(new Error('Text parse error')),
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(client.get(TEST_URL)).rejects.toThrow(HttpError);
    });

    it('should use default error message when body extraction fails', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        url: TEST_URL,
        headers: {
          get: (key: string) => (key === 'content-type' ? 'application/json' : null),
        },
        clone: () => ({
          json: (): Promise<never> => Promise.reject(new Error('Cannot parse')),
          text: (): Promise<never> => Promise.reject(new Error('Cannot read')),
        }),
      } as unknown as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      try {
        await client.get(TEST_URL);
        fail('Should have thrown an error');
      } catch (error) {
        expect(isHttpError(error)).toBe(true);
        if (isHttpError(error)) {
          expect(error.status).toBe(500);
          expect(error.message).toContain('500');
        }
      }
    });
  });

  describe('request body types', () => {
    it('should handle FormData body', async () => {
      const formData = new FormData();
      formData.append('key', 'value');

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.post<FormData, { success: boolean }>(TEST_URL, formData);

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
    });

    it('should handle string body', async () => {
      const stringData = 'plain string';

      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const result = await client.post<string, { success: boolean }>(TEST_URL, stringData);

      expect(result).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledWith(TEST_URL, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: stringData,
      });
    });
  });

  describe('edge cases for complete coverage', () => {
    it('should handle response without content-type header', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (): null => null, // No content-type header
        },
        clone: () => ({
          text: (): Promise<string> => Promise.resolve('plain text'),
        }),
        text: (): Promise<string> => Promise.resolve('plain text'),
      } as unknown as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(client.get(TEST_URL)).rejects.toThrow(ResponseMessages.RESPONSE_NOT_JSON);
    });

    it('should return undefined for non-JSON response with empty body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: {
          get: (): string => 'text/plain',
        },
        clone: () => ({
          text: (): Promise<string> => Promise.resolve(''),
        }),
        text: (): Promise<string> => Promise.resolve(''),
      } as unknown as Response;

      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.get(TEST_URL);
      expect(result).toBeUndefined();
    });
  });
});

describe('HttpError class', () => {
  it('should create HttpError with all properties', () => {
    const params = {
      status: 404,
      message: 'Not Found',
      cause: new Error('Original error'),
    };

    const error = new HttpError(params);

    expect(error.status).toBe(404);
    expect(error.message).toBe('Not Found');
    expect(error.cause).toBe(params.cause);
    expect(error.name).toBe('HttpError');
  });

  it('should create HttpError without cause', () => {
    const params = {
      status: 500,
      message: 'Server Error',
    };

    const error = new HttpError(params);

    expect(error.status).toBe(500);
    expect(error.message).toBe('Server Error');
    expect(error.cause).toBeUndefined();
  });

  it('should serialize to JSON correctly', () => {
    const params = {
      status: 403,
      message: 'Forbidden',
      cause: { detail: 'Access denied' },
    };

    const error = new HttpError(params);
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'HttpError',
      message: 'Forbidden',
      status: 403,
      cause: { detail: 'Access denied' },
    });
  });

  it('should serialize to JSON without cause', () => {
    const params = {
      status: 401,
      message: 'Unauthorized',
    };

    const error = new HttpError(params);
    const json = error.toJSON();

    expect(json).toEqual({
      name: 'HttpError',
      message: 'Unauthorized',
      status: 401,
    });
  });

  it('should be instanceof HttpError', () => {
    const error = new HttpError({ status: 400, message: 'Bad Request' });

    expect(error instanceof HttpError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  describe('isHttpError type guard', () => {
    it('should return true for HttpError instance', () => {
      const error = new HttpError({ status: 500, message: 'Error' });
      expect(isHttpError(error)).toBe(true);
    });

    it('should return true for object with HttpError shape', () => {
      const error = {
        name: 'HttpError',
        status: 404,
        message: 'Not Found',
      };
      expect(isHttpError(error)).toBe(true);
    });

    it('should return false for regular Error', () => {
      const error = new Error('Regular error');
      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isHttpError(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isHttpError(undefined)).toBe(false);
    });

    it('should return false for string', () => {
      expect(isHttpError('error')).toBe(false);
    });

    it('should return false for object without status', () => {
      const error = {
        name: 'HttpError',
        message: 'Error',
      };
      expect(isHttpError(error)).toBe(false);
    });

    it('should return false for object with wrong name', () => {
      const error = {
        name: 'SomeOtherError',
        status: 500,
        message: 'Error',
      };
      expect(isHttpError(error)).toBe(false);
    });
  });
});
