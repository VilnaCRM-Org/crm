import '../setup';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import HttpResponseProcessor, {
  throwIfHttpError as throwIfHttpErrorFromProcessor,
} from '@/services/https-client/http-response-processor';

const createClient = (): FetchHttpsClient =>
  new FetchHttpsClient(new HttpRequestConfigBuilder(), new HttpResponseProcessor());

describe('FetchHttpsClient Response Processing Coverage', () => {
  let client: FetchHttpsClient;
  const originalFetch = global.fetch;

  beforeEach(() => {
    client = createClient();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (jest.isMockFunction(originalFetch)) {
      jest.restoreAllMocks();
    } else {
      jest.resetAllMocks?.();
    }
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
      await expect(client.get('/test')).rejects.toBeInstanceOf(HttpError);
      await client.get('/test').catch((e) => {
        expect(e).toBeInstanceOf(HttpError);
        expect((e as HttpError).status).toBe(200);
      });
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

    it('supports explicit client deps and the response processor parser fallback', async () => {
      const processorOnlyClient = new FetchHttpsClient(new HttpRequestConfigBuilder(), {
        process: jest.fn().mockResolvedValue({ ok: true }),
      } as never);
      global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, headers: new Headers() });

      await expect(processorOnlyClient.get('/test')).resolves.toEqual({ ok: true });

      const processor = new HttpResponseProcessor(undefined);
      await expect(
        processor.process({
          ok: true,
          status: 204,
          headers: new Headers(),
        } as Response)
      ).resolves.toBeUndefined();
    });

    it('returns a readable parsed error payload when cloning the response fails', async () => {
      const parser = new HttpErrorResponseParser();
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});

      try {
        await expect(
          parser.parse({
            headers: { get: () => 'application/json' },
            clone: () => {
              throw new Error('clone failed');
            },
          } as unknown as Response)
        ).resolves.toEqual({ message: 'clone failed', body: undefined });

        expect(debugSpy).toHaveBeenCalledWith(
          'Failed to parse HTTP error response',
          expect.objectContaining({
            message: 'clone failed',
          })
        );
      } finally {
        debugSpy.mockRestore();
      }
    });

    it('handles a non-Error value thrown while cloning the response', async () => {
      const parser = new HttpErrorResponseParser();
      const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
      const thrown: unknown = 'string failure';

      try {
        await expect(
          parser.parse({
            headers: { get: () => 'text/plain' },
            clone: () => {
              throw thrown;
            },
          } as unknown as Response)
        ).resolves.toEqual({ message: 'string failure', body: undefined });

        expect(debugSpy).toHaveBeenCalledWith(
          'Failed to parse HTTP error response',
          expect.objectContaining({ message: 'string failure', stack: undefined })
        );
      } finally {
        debugSpy.mockRestore();
      }
    });

    it('loads HTTP helpers when reflected constructor types are unavailable', () => {
      for (const mockPath of [
        '@/services/https-client/http-request-config-builder',
        '@/services/https-client/http-response-processor',
      ]) {
        jest.isolateModules(() => {
          jest.doMock(mockPath, () => ({ __esModule: true, default: undefined }));

          expect(require('@/services/https-client/fetch-https-client')).toBeDefined();

          jest.dontMock(mockPath);
        });
      }

      jest.isolateModules(() => {
        jest.doMock('@/services/https-client/http-error-response-parser', () => ({
          __esModule: true,
          default: undefined,
        }));

        expect(require('@/services/https-client/http-response-processor')).toBeDefined();

        jest.dontMock('@/services/https-client/http-error-response-parser');
      });
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

    it('throws an HttpError for non-ok responses via the response parser', async () => {
      const errorPayload = { message: 'Service down' };
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        url: '/svc',
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: () => ({ json: async (): Promise<unknown> => errorPayload }),
      } as unknown as Response);

      await expect(client.get('/svc')).rejects.toMatchObject({
        status: 503,
        message: 'Service down',
        cause: { contentType: 'application/json', url: '/svc' },
      });
    });

    it('uses the default HttpErrorResponseParser when none is injected', async () => {
      const processor = new HttpResponseProcessor();
      const okResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: () => ({ text: async (): Promise<string> => '{"value":42}' }),
        json: async (): Promise<unknown> => ({ value: 42 }),
      } as unknown as Response;

      await expect(processor.process<{ value: number }>(okResponse)).resolves.toEqual({
        value: 42,
      });
    });

    it('throwIfHttpError uses a default response parser when none is supplied', async () => {
      const errorResponse = {
        ok: false,
        status: 500,
        statusText: 'Server Error',
        url: '/api/x',
        headers: new Headers({ 'content-type': 'application/json' }),
        clone: () => ({ json: async (): Promise<unknown> => ({ message: 'kaboom' }) }),
      } as unknown as Response;

      await expect(throwIfHttpErrorFromProcessor(errorResponse)).rejects.toMatchObject({
        status: 500,
        message: 'kaboom',
      });
    });

    it('allows injecting a custom HttpErrorResponseParser', async () => {
      const parser = new HttpErrorResponseParser();
      const processor = new HttpResponseProcessor(parser);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
      } as Response);

      const response = await global.fetch('/test');
      await expect(processor.process(response)).resolves.toBeUndefined();
    });
  });
});
