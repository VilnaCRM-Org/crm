import { rest } from 'msw';

import '../setup';
import FetchHttpsClient from '@/services/HttpsClient/FetchHttpsClient';
import { HttpError, isHttpError } from '@/services/HttpsClient/HttpError';
import ResponseMessages from '@/services/HttpsClient/responseMessages';

import server from '../mocks/server';

const TEST_URL = 'http://localhost:3000/api/test';

describe('FetchHttpsClient Integration', () => {
  let client: FetchHttpsClient;

  beforeEach(() => {
    client = new FetchHttpsClient();
  });

  describe('GET requests', () => {
    it('should successfully make a GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      server.use(rest.get(TEST_URL, (_, res, ctx) => res(ctx.status(200), ctx.json(mockData))));

      const result = await client.get<typeof mockData>(TEST_URL);

      expect(result).toEqual(mockData);
    });

    it('should handle GET request with AbortSignal', async () => {
      const mockData = { id: 1 };
      const controller = new AbortController();

      server.use(rest.get(TEST_URL, (_, res, ctx) => res(ctx.status(200), ctx.json(mockData))));

      const result = await client.get<typeof mockData>(TEST_URL, { signal: controller.signal });

      expect(result).toEqual(mockData);
    });
  });

  describe('POST requests', () => {
    it('should successfully make a POST request', async () => {
      const requestData = { name: 'New Item' };
      const responseData = { id: 1, ...requestData };

      server.use(
        rest.post(TEST_URL, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(requestData);
          return res(ctx.status(201), ctx.json(responseData));
        })
      );

      const result = await client.post<typeof requestData, typeof responseData>(
        TEST_URL,
        requestData
      );

      expect(result).toEqual(responseData);
    });
  });

  describe('PUT requests', () => {
    it('should successfully make a PUT request', async () => {
      const requestData = { id: 1, name: 'Updated Item' };
      const responseData = { ...requestData, updated: true };

      server.use(
        rest.put(TEST_URL, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(requestData);
          return res(ctx.status(200), ctx.json(responseData));
        })
      );

      const result = await client.put<typeof requestData, typeof responseData>(
        TEST_URL,
        requestData
      );

      expect(result).toEqual(responseData);
    });
  });

  describe('PATCH requests', () => {
    it('should successfully make a PATCH request', async () => {
      const requestData = { name: 'Patched Item' };
      const responseData = { id: 1, ...requestData };

      server.use(
        rest.patch(TEST_URL, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(requestData);
          return res(ctx.status(200), ctx.json(responseData));
        })
      );

      const result = await client.patch<typeof requestData, typeof responseData>(
        TEST_URL,
        requestData
      );

      expect(result).toEqual(responseData);
    });
  });

  describe('DELETE requests', () => {
    it('should successfully make a DELETE request with data', async () => {
      const requestData = { id: 1 };
      const responseData = { deleted: true };

      server.use(
        rest.delete(TEST_URL, async (req, res, ctx) => {
          const body = await req.json();
          expect(body).toEqual(requestData);
          return res(ctx.status(200), ctx.json(responseData));
        })
      );

      const result = await client.delete<typeof requestData, typeof responseData>(
        TEST_URL,
        requestData
      );

      expect(result).toEqual(responseData);
    });

    it('should successfully make a DELETE request without data', async () => {
      const responseData = { deleted: true };

      server.use(
        rest.delete(TEST_URL, (_, res, ctx) => res(ctx.status(200), ctx.json(responseData)))
      );

      const result = await client.delete<unknown, typeof responseData>(TEST_URL);

      expect(result).toEqual(responseData);
    });
  });

  describe('status code handling', () => {
    it('should return undefined for 204 No Content', async () => {
      server.use(rest.get(TEST_URL, (_, res, ctx) => res(ctx.status(204))));

      const result = await client.get<unknown>(TEST_URL);

      expect(result).toBeUndefined();
    });

    it('should return undefined for 205 Reset Content', async () => {
      server.use(rest.get(TEST_URL, (_, res, ctx) => res(ctx.status(205))));

      const result = await client.get<unknown>(TEST_URL);

      expect(result).toBeUndefined();
    });

    it('should return undefined for 304 Not Modified', async () => {
      server.use(rest.get(TEST_URL, (_, res, ctx) => res(ctx.status(304))));

      const result = await client.get<unknown>(TEST_URL);

      expect(result).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should throw HttpError on 400 Bad Request', async () => {
      server.use(
        rest.get(TEST_URL, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: 'Bad Request' }))
        )
      );

      await expect(client.get(TEST_URL)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on 500 Internal Server Error', async () => {
      server.use(
        rest.get(TEST_URL, (_, res, ctx) =>
          res(ctx.status(500), ctx.json({ message: 'Internal Server Error' }))
        )
      );

      await expect(client.get(TEST_URL)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError with message from response', async () => {
      const errorMessage = 'Custom error message';
      server.use(
        rest.get(TEST_URL, (_, res, ctx) =>
          res(ctx.status(400), ctx.json({ message: errorMessage }))
        )
      );

      try {
        await client.get(TEST_URL);
        fail('Expected to throw');
      } catch (error) {
        if (isHttpError(error)) {
          expect(error.message).toBe(errorMessage);
          expect(error.status).toBe(400);
        } else {
          fail('Expected HttpError');
        }
      }
    });

    it('should handle plain text error responses', async () => {
      const errorText = 'Plain text error';
      server.use(
        rest.get(TEST_URL, (_, res, ctx) =>
          res(ctx.status(400), ctx.set('Content-Type', 'text/plain'), ctx.body(errorText))
        )
      );

      try {
        await client.get(TEST_URL);
        fail('Expected to throw');
      } catch (error) {
        if (isHttpError(error)) {
          expect(error.message).toBe(errorText);
        } else {
          fail('Expected HttpError');
        }
      }
    });

    it('should handle empty response body with error status', async () => {
      server.use(rest.get(TEST_URL, (_, res, ctx) => res(ctx.status(404))));

      await expect(client.get(TEST_URL)).rejects.toThrow(HttpError);
    });

    it('should throw HttpError on network error', async () => {
      server.use(rest.get(TEST_URL, (_, res) => res.networkError('Network error')));

      try {
        await client.get(TEST_URL);
        fail('Expected to throw');
      } catch (error) {
        if (isHttpError(error)) {
          expect(error.status).toBe(0);
          expect(error.message).toBe(ResponseMessages.NETWORK_ERROR);
        } else {
          fail('Expected HttpError');
        }
      }
    });

    it('should throw HttpError on non-JSON response when JSON expected', async () => {
      server.use(
        rest.get(TEST_URL, (_, res, ctx) =>
          res(ctx.status(200), ctx.set('Content-Type', 'application/json'), ctx.body('not json'))
        )
      );

      try {
        await client.get(TEST_URL);
        fail('Expected to throw');
      } catch (error) {
        if (isHttpError(error)) {
          expect(error.message).toBe(ResponseMessages.JSON_PARSE_FAILED);
        } else {
          fail('Expected HttpError');
        }
      }
    });

    it('should handle empty JSON response', async () => {
      server.use(
        rest.get(TEST_URL, (_, res, ctx) =>
          res(ctx.status(200), ctx.set('Content-Type', 'application/json'), ctx.body(''))
        )
      );

      const result = await client.get(TEST_URL);
      expect(result).toBeUndefined();
    });

    it('should throw HttpError for non-JSON response with 200 status', async () => {
      server.use(
        rest.get(TEST_URL, (_, res, ctx) =>
          res(ctx.status(200), ctx.set('Content-Type', 'text/html'), ctx.body('<html></html>'))
        )
      );

      try {
        await client.get(TEST_URL);
        fail('Expected to throw');
      } catch (error) {
        if (isHttpError(error)) {
          expect(error.message).toBe(ResponseMessages.RESPONSE_NOT_JSON);
        } else {
          fail('Expected HttpError');
        }
      }
    });
  });

  describe('request body types', () => {
    it('should handle FormData body', async () => {
      const formData = new FormData();
      formData.append('key', 'value');

      server.use(
        rest.post(TEST_URL, async (req, res, ctx) => {
          // Check that Content-Type was not set to application/json for FormData
          expect(req.headers.get('Content-Type')).not.toContain('application/json');
          return res(ctx.status(200), ctx.json({ success: true }));
        })
      );

      const result = await client.post<FormData, { success: boolean }>(TEST_URL, formData);
      expect(result).toEqual({ success: true });
    });

    it('should handle string body', async () => {
      const stringData = 'plain string';

      server.use(
        rest.post(TEST_URL, async (req, res, ctx) => {
          const body = await req.text();
          expect(body).toBe(stringData);
          return res(ctx.status(200), ctx.json({ success: true }));
        })
      );

      const result = await client.post<string, { success: boolean }>(TEST_URL, stringData);
      expect(result).toEqual({ success: true });
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
