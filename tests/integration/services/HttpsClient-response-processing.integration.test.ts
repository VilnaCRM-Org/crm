import '../setup';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import { HttpError } from '@/services/HttpsClient/HttpError';

describe('FetchHttpsClient Response Processing Coverage', () => {
  let client: FetchHttpsClient;

  beforeEach(() => {
    client = new FetchHttpsClient();
  });

  describe('response content type handling', () => {
    it('should handle 204 No Content responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
      } as Response);

      const result = await client.get('/test');

      expect(result).toBeUndefined();
    });

    it('should handle 205 Reset Content responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 205,
        headers: new Headers(),
      } as Response);

      const result = await client.get('/test');

      expect(result).toBeUndefined();
    });

    it('should handle 304 Not Modified responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 304,
        headers: new Headers(),
      } as Response);

      const result = await client.get('/test');

      expect(result).toBeUndefined();
    });

    it('should throw HttpError for non-JSON content type', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        clone() {
          return this;
        },
        text: jest.fn().mockResolvedValue('Plain text response'),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(client.get('/test')).rejects.toThrow(HttpError);
      await expect(client.get('/test')).rejects.toThrow('Response is not JSON');
    });

    it('should handle empty text response for non-JSON content type', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/xml' }),
        clone() {
          return this;
        },
        text: jest.fn().mockResolvedValue(''),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result).toBeUndefined();
    });

    it('should handle JSON parse failure with empty body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone() {
          return {
            text: jest.fn().mockResolvedValue(''),
            json: jest.fn().mockRejectedValue(new Error('Parse error')),
          };
        },
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result).toBeUndefined();
    });

    it('should throw HttpError for JSON parse failure with non-empty body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone() {
          return {
            text: jest.fn().mockResolvedValue('invalid json {'),
            json: jest.fn().mockRejectedValue(new Error('Parse error')),
          };
        },
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      await expect(client.get('/test')).rejects.toThrow(HttpError);
      await expect(client.get('/test')).rejects.toThrow('Failed to parse JSON response');
    });

    it('should handle whitespace-only JSON body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone() {
          return {
            text: jest.fn().mockResolvedValue('   '),
            json: jest.fn().mockRejectedValue(new Error('Parse error')),
          };
        },
        json: jest.fn().mockRejectedValue(new Error('Parse error')),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result).toBeUndefined();
    });

    it('should handle text.catch error gracefully', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: jest.fn().mockRejectedValue(new Error('Text read error')),
      } as unknown as Response;
      global.fetch = jest.fn().mockResolvedValue(mockResponse);
      const result = await client.get('/test');
      expect(result).toBeUndefined();
    });
  });

  describe('HTTP methods', () => {
    it('should handle POST requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone() {
          return {
            text: jest.fn().mockResolvedValue('{"success":true}'),
            json: jest.fn().mockResolvedValue({ success: true }),
          };
        },
        json: jest.fn().mockResolvedValue({ success: true }),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.post('/test', { data: 'test' });

      expect(result).toEqual({ success: true });
    });

    it('should handle PUT requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone() {
          return {
            text: jest.fn().mockResolvedValue('{"updated":true}'),
            json: jest.fn().mockResolvedValue({ updated: true }),
          };
        },
        json: jest.fn().mockResolvedValue({ updated: true }),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.put('/test', { data: 'test' });

      expect(result).toEqual({ updated: true });
    });

    it('should handle PATCH requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone() {
          return {
            text: jest.fn().mockResolvedValue('{"patched":true}'),
            json: jest.fn().mockResolvedValue({ patched: true }),
          };
        },
        json: jest.fn().mockResolvedValue({ patched: true }),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.patch('/test', { data: 'test' });

      expect(result).toEqual({ patched: true });
    });

    it('should handle DELETE requests with body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone() {
          return {
            text: jest.fn().mockResolvedValue('{"deleted":true}'),
            json: jest.fn().mockResolvedValue({ deleted: true }),
          };
        },
        json: jest.fn().mockResolvedValue({ deleted: true }),
      } as unknown as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.delete('/test', { id: 123 });

      expect(result).toEqual({ deleted: true });
    });

    it('should handle DELETE requests without body', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: new Headers(),
      } as Response;

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const result = await client.delete('/test');

      expect(result).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should wrap HttpError when thrown', async () => {
      const httpError = new HttpError({ status: 500, message: 'Server Error' });

      global.fetch = jest.fn().mockRejectedValue(httpError);

      await expect(client.get('/test')).rejects.toThrow(HttpError);
    });

    it('should wrap non-HttpError as network error', async () => {
      const networkError = new Error('Network failure');

      global.fetch = jest.fn().mockRejectedValue(networkError);

      await expect(client.get('/test')).rejects.toThrow(HttpError);
      await expect(client.get('/test')).rejects.toThrow('Network error');
    });
  });
});
