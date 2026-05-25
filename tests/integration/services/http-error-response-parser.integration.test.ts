import '../setup';
import container from '@/config/dependency-injection-config';
import TOKENS from '@/config/tokens';
import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';

describe('HttpErrorResponseParser Integration', () => {
  const parser = container.resolve<HttpErrorResponseParser>(TOKENS.HttpErrorResponseParser);

  it('resolves without throwing for an ok response', async () => {
    const response = { ok: true, status: 200 } as Response;
    await expect(parser.assertOk(response)).resolves.toBeUndefined();
  });

  it('skips throwing for 304 Not Modified', async () => {
    const response = { ok: false, status: 304 } as Response;
    await expect(parser.assertOk(response)).resolves.toBeUndefined();
  });

  it('throws an HttpError carrying the parsed JSON body', async () => {
    const response = {
      ok: false,
      status: 422,
      statusText: 'Unprocessable Entity',
      url: '/api/validate',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: () => ({ json: async (): Promise<unknown> => ({ message: 'Bad payload' }) }),
    } as unknown as Response;

    await expect(parser.assertOk(response)).rejects.toBeInstanceOf(HttpError);
    await expect(parser.assertOk(response)).rejects.toMatchObject({
      status: 422,
      message: 'Bad payload',
      cause: {
        url: '/api/validate',
        contentType: 'application/json',
      },
    });
  });

  it('falls back to undefined contentType when the content-type header is missing', async () => {
    const response = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      url: '/api/svc',
      headers: { get: (): null => null },
      clone: () => ({ text: async (): Promise<string> => '' }),
    } as unknown as Response;

    await expect(parser.assertOk(response)).rejects.toMatchObject({
      status: 500,
      cause: { contentType: undefined, url: '/api/svc' },
    });
  });

  it('treats missing content-type as empty when parsing', async () => {
    const response = {
      headers: { get: (): null => null },
      clone: () => ({ text: async (): Promise<string> => 'no header' }),
    } as unknown as Response;

    await expect(parser.parse(response)).resolves.toEqual({
      message: null,
      body: 'no header',
    });
  });

  it('uses status text fallback when JSON body has no message', async () => {
    const response = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      url: '/api/svc',
      headers: new Headers({ 'content-type': 'application/json' }),
      clone: () => ({ json: async (): Promise<unknown> => ({ data: [] }) }),
    } as unknown as Response;

    await expect(parser.assertOk(response)).rejects.toMatchObject({
      status: 500,
      message: '500 Server Error',
    });
  });

  it('extracts the text body for text/plain responses', async () => {
    const response = {
      headers: { get: (): string => 'text/plain' },
      clone: () => ({ text: async (): Promise<string> => 'plain failure' }),
    } as unknown as Response;

    await expect(parser.parse(response)).resolves.toEqual({
      message: 'plain failure',
      body: 'plain failure',
    });
  });

  it('returns null message for non-text, non-json content types', async () => {
    const response = {
      headers: { get: (): string => 'application/octet-stream' },
      clone: () => ({ text: async (): Promise<string> => 'binary' }),
    } as unknown as Response;

    await expect(parser.parse(response)).resolves.toEqual({
      message: null,
      body: 'binary',
    });
  });

  it('logs and recovers when cloning the response throws', async () => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation(() => undefined);
    const response = {
      headers: { get: (): string => 'application/json' },
      clone: () => {
        throw new Error('cannot clone');
      },
    } as unknown as Response;

    await expect(parser.parse(response)).resolves.toEqual({
      message: 'cannot clone',
      body: undefined,
    });
    expect(debugSpy).toHaveBeenCalled();
    debugSpy.mockRestore();
  });

  it('truncates long JSON messages and bodies', async () => {
    const longMessage = 'x'.repeat(700);
    const response = {
      headers: { get: (): string => 'application/json' },
      clone: () => ({ json: async (): Promise<unknown> => ({ message: longMessage }) }),
    } as unknown as Response;

    const result = await parser.parse(response);
    expect(result.message?.length).toBe(500);
  });

  it('returns undefined body when JSON parsing yields undefined', async () => {
    const response = {
      headers: { get: (): string => 'application/json' },
      clone: () => ({ json: async (): Promise<unknown> => Promise.reject(new Error('bad json')) }),
    } as unknown as Response;

    await expect(parser.parse(response)).resolves.toEqual({
      message: null,
      body: undefined,
    });
  });

  it('returns undefined body when text extraction rejects', async () => {
    const response = {
      headers: { get: (): string => 'text/plain' },
      clone: () => ({
        text: async (): Promise<string> => Promise.reject(new Error('text failed')),
      }),
    } as unknown as Response;

    await expect(parser.parse(response)).resolves.toEqual({
      message: null,
      body: undefined,
    });
  });

  it('returns undefined body when text extraction yields an empty string', async () => {
    const response = {
      headers: { get: (): string => 'text/plain' },
      clone: () => ({ text: async (): Promise<string> => '' }),
    } as unknown as Response;

    await expect(parser.parse(response)).resolves.toEqual({
      message: null,
      body: undefined,
    });
  });
});
