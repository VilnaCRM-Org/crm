/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';

function makeResponse(ok: boolean, status: number, statusText = ''): Response {
  return { ok, status, statusText, url: '/test', headers: new Headers() } as Response;
}

describe('HttpErrorResponseParser', () => {
  it('resolves without throwing for a 200 response', async () => {
    const parser = new HttpErrorResponseParser();
    await expect(parser.assertOk(makeResponse(true, 200))).resolves.toBeUndefined();
  });

  it('resolves without throwing for a 304 Not Modified response', async () => {
    const parser = new HttpErrorResponseParser();
    await expect(parser.assertOk(makeResponse(false, 304))).resolves.toBeUndefined();
  });

  it('throws HttpError for a non-ok response', async () => {
    const parser = new HttpErrorResponseParser();
    const response = {
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      url: '/test',
      headers: new Headers(),
    } as Response;
    await expect(parser.assertOk(response)).rejects.toThrow(HttpError);
  });

  it('uses its parse method when building the HttpError payload', async () => {
    const parser = new HttpErrorResponseParser();
    const parseSpy = jest
      .spyOn(parser, 'parse')
      .mockResolvedValue({ message: 'parsed error', body: undefined });
    const response = makeResponse(false, 422, 'Unprocessable Entity');

    await expect(parser.assertOk(response)).rejects.toThrow(HttpError);
    expect(parseSpy).toHaveBeenCalledWith(response);
  });

  it('passes through the content-type value in the HttpError cause when set', async () => {
    const parser = new HttpErrorResponseParser();
    jest.spyOn(parser, 'parse').mockResolvedValue({ message: 'oops', body: undefined });
    const response = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      url: '/with-content-type',
      headers: { get: (): string => 'application/json' },
    } as unknown as Response;

    await expect(parser.assertOk(response)).rejects.toMatchObject({
      cause: { contentType: 'application/json' },
    });
  });

  it('uses undefined contentType in HttpError cause when header is missing', async () => {
    const parser = new HttpErrorResponseParser();
    jest.spyOn(parser, 'parse').mockResolvedValue({ message: 'oops', body: undefined });
    const response = {
      ok: false,
      status: 500,
      statusText: 'Server Error',
      url: '/no-content-type',
      headers: { get: (): null => null },
    } as unknown as Response;

    await expect(parser.assertOk(response)).rejects.toMatchObject({
      cause: { contentType: undefined, url: '/no-content-type' },
    });
  });

  it('uses response fallback data when parsed error text is empty', async () => {
    const parser = new HttpErrorResponseParser();
    jest.spyOn(parser, 'parse').mockResolvedValue({ message: null, body: 'problem' });
    const response = makeResponse(false, 500, 'Server Error');

    await expect(parser.assertOk(response)).rejects.toMatchObject({ status: 500 });
  });

  it('returns a readable parsed payload when cloning the response fails', async () => {
    const parser = new HttpErrorResponseParser();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await expect(
      parser.parse({
        headers: { get: () => 'application/json' },
        clone: () => {
          throw new Error('clone failed');
        },
      } as unknown as Response)
    ).resolves.toEqual({ message: 'clone failed', body: undefined });

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse HTTP error response',
      expect.objectContaining({
        message: 'clone failed',
      })
    );
    warnSpy.mockRestore();
  });

  it('handles a non-Error value thrown while cloning the response', async () => {
    const parser = new HttpErrorResponseParser();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const thrown: unknown = 'string failure';

    await expect(
      parser.parse({
        headers: { get: () => 'text/plain' },
        clone: () => {
          throw thrown;
        },
      } as unknown as Response)
    ).resolves.toEqual({ message: 'string failure', body: undefined });

    expect(warnSpy).toHaveBeenCalledWith(
      'Failed to parse HTTP error response',
      expect.objectContaining({ message: 'string failure', stack: undefined })
    );
    warnSpy.mockRestore();
  });

  it('extracts the JSON message and stringified body when content-type is JSON', async () => {
    const parser = new HttpErrorResponseParser();
    const payload = { message: 'invalid input', field: 'email' };
    const response = {
      headers: { get: (): string => 'application/json' },
      clone: () => ({ json: async (): Promise<unknown> => payload }),
    } as unknown as Response;

    const result = await parser.parse(response);

    expect(result.message).toBe('invalid input');
    expect(result.body).toBe(JSON.stringify(payload));
  });

  it('returns null message but undefined body when JSON parsing yields undefined', async () => {
    const parser = new HttpErrorResponseParser();
    const response = {
      headers: { get: (): string => 'application/json' },
      clone: () => ({ json: async (): Promise<unknown> => Promise.reject(new Error('bad json')) }),
    } as unknown as Response;

    await expect(parser.parse(response)).resolves.toEqual({ message: null, body: undefined });
  });

  it('truncates JSON message bodies that exceed 500 characters', async () => {
    const parser = new HttpErrorResponseParser();
    const longMessage = 'x'.repeat(600);
    const response = {
      headers: { get: (): string => 'application/json' },
      clone: () => ({ json: async (): Promise<unknown> => ({ message: longMessage }) }),
    } as unknown as Response;

    const result = await parser.parse(response);

    expect(result.message?.length).toBe(500);
  });

  it('returns the text body as the message when content-type is text/plain', async () => {
    const parser = new HttpErrorResponseParser();
    const response = {
      headers: { get: (): string => 'text/plain' },
      clone: () => ({ text: async (): Promise<string> => 'plain error text' }),
    } as unknown as Response;

    const result = await parser.parse(response);

    expect(result.message).toBe('plain error text');
    expect(result.body).toBe('plain error text');
  });

  it('returns null message but exposes the body for non-text/non-json responses', async () => {
    const parser = new HttpErrorResponseParser();
    const response = {
      headers: { get: (): string => 'application/octet-stream' },
      clone: () => ({ text: async (): Promise<string> => 'binary blob' }),
    } as unknown as Response;

    const result = await parser.parse(response);

    expect(result.message).toBeNull();
    expect(result.body).toBe('binary blob');
  });

  it('returns empty body when text extraction rejects', async () => {
    const parser = new HttpErrorResponseParser();
    const response = {
      headers: { get: (): string => 'text/plain' },
      clone: () => ({ text: async (): Promise<string> => Promise.reject(new Error('boom')) }),
    } as unknown as Response;

    const result = await parser.parse(response);

    expect(result.message).toBeNull();
    expect(result.body).toBeUndefined();
  });

  it('returns empty body when text extraction yields an empty string', async () => {
    const parser = new HttpErrorResponseParser();
    const response = {
      headers: { get: (): string => 'text/plain' },
      clone: () => ({ text: async (): Promise<string> => '' }),
    } as unknown as Response;

    const result = await parser.parse(response);

    expect(result.message).toBeNull();
    expect(result.body).toBeUndefined();
  });
});
