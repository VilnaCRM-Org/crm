import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import { HttpError } from '@/services/HttpsClient/HttpError';
import ResponseMessages from '@/services/HttpsClient/responseMessages';

describe('FetchHttpsClient', () => {
  const originalFetch = global.fetch;
  let client: FetchHttpsClient;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    client = new FetchHttpsClient();
    mockFetch = jest.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();

    global.fetch = originalFetch;
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const responseData = { id: 1, name: 'Test' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.get<typeof responseData>('/api/test');

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    });

    it('should handle GET request with AbortSignal', async () => {
      const controller = new AbortController();
      const responseData = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.get('/api/test', { signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith('/api/test', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: controller.signal,
      });
    });

    it('should return undefined for 204 No Content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await client.get('/api/test');

      expect(result).toBeUndefined();
    });

    it('should return undefined for 205 Reset Content', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 205,
        headers: new Headers(),
      });

      const result = await client.get('/api/test');

      expect(result).toBeUndefined();
    });

    it('should return undefined for 304 Not Modified', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 304,
        headers: new Headers(),
      });

      const result = await client.get('/api/test');

      expect(result).toBeUndefined();
    });

    it('should throw HttpError on 404', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        url: '/api/test',
        headers: new Headers(),
        json: async () => ({}),
      });

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
      await expect(client.get('/api/test')).rejects.toMatchObject({
        status: 0,
        message: ResponseMessages.NETWORK_ERROR,
      });
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request with JSON body', async () => {
      const requestData = { name: 'Test', email: 'test@example.com' };
      const responseData = { id: 1, ...requestData };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.post('/api/users', requestData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
    });

    it('should make POST request with FormData', async () => {
      const formData = new FormData();
      formData.append('file', 'test');
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.post('/api/upload', formData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: formData,
      });
    });

    it('should make POST request with string body', async () => {
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.post('/api/data', 'plain text');

      expect(mockFetch).toHaveBeenCalledWith('/api/data', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: 'plain text',
      });
    });

    it('should make POST request with AbortSignal', async () => {
      const controller = new AbortController();
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.post('/api/test', { data: 'test' }, { signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const requestData = { id: 1, name: 'Updated' };
      const responseData = { ...requestData, updated: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.put('/api/users/1', requestData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
    });

    it('should make PUT request with AbortSignal', async () => {
      const controller = new AbortController();
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.put('/api/test', { data: 'test' }, { signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const requestData = { name: 'Patched' };
      const responseData = { id: 1, name: 'Patched' };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.patch('/api/users/1', requestData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
    });

    it('should make PATCH request with AbortSignal', async () => {
      const controller = new AbortController();
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.patch('/api/test', { data: 'test' }, { signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });

  describe('DELETE requests', () => {
    it('should make successful DELETE request without body', async () => {
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.delete('/api/users/1');

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
        },
      });
    });

    it('should make DELETE request with body', async () => {
      const requestData = { reason: 'Spam' };
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.delete('/api/users/1', requestData);

      expect(result).toEqual(responseData);
      expect(mockFetch).toHaveBeenCalledWith('/api/users/1', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
    });

    it('should make DELETE request with AbortSignal', async () => {
      const controller = new AbortController();
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.delete('/api/test', undefined, { signal: controller.signal });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          signal: controller.signal,
        })
      );
    });
  });

  describe('response processing', () => {
    it('should handle JSON response', async () => {
      const responseData = { data: 'test' };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.get('/api/test');

      expect(result).toEqual(responseData);
    });

    it('should handle JSON response with charset', async () => {
      const responseData = { data: 'test' };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json; charset=utf-8' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.get('/api/test');

      expect(result).toEqual(responseData);
    });

    it('should return undefined for empty JSON response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => null,
        clone: () => ({
          text: async (): Promise<string> => '',
        }),
      });

      const result = await client.get('/api/test');

      expect(result).toBeUndefined();
    });

    it('should throw HttpError for non-JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async (): Promise<string> => '<html></html>',
      });

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on JSON parse failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => {
          throw new Error('Invalid JSON');
        },
        clone: () => ({
          text: async (): Promise<string> => 'invalid json{',
        }),
      });

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
    });

    it('should return undefined for whitespace-only response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => null,
        clone: () => ({
          text: async (): Promise<string> => '   ',
        }),
      });

      const result = await client.get('/api/test');

      expect(result).toBeUndefined();
    });

    it('should return undefined for response with no content-type header and empty body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await client.get('/api/test');
      expect(result).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw HttpError on 400 Bad Request', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        url: '/api/test',
        headers: new Headers(),
        json: async () => ({}),
      });

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on 401 Unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        url: '/api/test',
        headers: new Headers(),
        json: async () => ({}),
      });

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on 403 Forbidden', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        url: '/api/test',
        headers: new Headers(),
        json: async () => ({}),
      });

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        url: '/api/test',
        headers: new Headers(),
        json: async () => ({}),
      });

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
    });

    it('should throw HttpError with network error cause', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      try {
        await client.get('/api/test');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        if (error instanceof HttpError) {
          expect(error.status).toBe(0);
          expect(error.message).toBe(ResponseMessages.NETWORK_ERROR);
          expect(error.cause).toBe(networkError);
        }
      }
    });
  });

  describe('body types', () => {
    it('should handle Blob body', async () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.post('/api/upload', blob);

      expect(mockFetch).toHaveBeenCalledWith('/api/upload', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: blob,
      });
    });

    it('should handle ArrayBuffer body', async () => {
      const buffer = new ArrayBuffer(8);
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.post('/api/binary', buffer);

      expect(mockFetch).toHaveBeenCalledWith('/api/binary', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: buffer,
      });
    });

    it('should handle ReadableStream body', async () => {
      class MockReadableStream {
        public locked = false;

        public cancel(): Promise<void> {
          return Promise.resolve();
        }

        public getReader(): ReadableStreamDefaultReader {
          return {} as ReadableStreamDefaultReader;
        }
      }

      global.ReadableStream = MockReadableStream as unknown as typeof ReadableStream;

      const stream = new MockReadableStream();
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.post('/api/stream', stream as unknown as ReadableStream);

      expect(mockFetch).toHaveBeenCalledWith('/api/stream', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
        },
        body: stream,
      });

      delete (global as { ReadableStream?: unknown }).ReadableStream;
    });
  });

  describe('headers', () => {
    it('should set Content-Type for JSON body', async () => {
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.post('/api/test', { data: 'test' });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/json');
    });

    it('should not set Content-Type for FormData', async () => {
      const formData = new FormData();
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.post('/api/upload', formData);

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBeUndefined();
    });

    it('should always set Accept header', async () => {
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.get('/api/test');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers.Accept).toBe('application/json');
    });
  });

  describe('edge cases', () => {
    it('should handle undefined body in POST', async () => {
      const responseData = { success: true };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      await client.post('/api/test', undefined);

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });

    it('should handle very large response', async () => {
      const largeData = { data: 'A'.repeat(1000000) };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => largeData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(largeData),
        }),
      });

      const result = await client.get('/api/large');

      expect(result).toEqual(largeData);
    });

    it('should return undefined for response with missing content-type and empty text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
      });

      const result = await client.get('/api/test');
      expect(result).toBeUndefined();
    });

    it('should handle case-insensitive content-type', async () => {
      const responseData = { data: 'test' };

      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'Application/JSON' }),
        json: async () => responseData,
        clone: () => ({
          text: async (): Promise<string> => JSON.stringify(responseData),
        }),
      });

      const result = await client.get('/api/test');

      expect(result).toEqual(responseData);
    });

    it('should return undefined for non-JSON response with empty text', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: async (): Promise<string> => '',
      });

      const result = await client.get('/api/test');

      expect(result).toBeUndefined();
    });

    it('should handle missing content-type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        text: async (): Promise<string> => '<html>not json</html>',
      });

      await expect(client.get('/api/test')).rejects.toThrow(HttpError);
    });
  });
});
