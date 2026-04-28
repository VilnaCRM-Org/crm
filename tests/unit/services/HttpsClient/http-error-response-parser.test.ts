/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import HttpErrorResponseParser from '@/services/HttpsClient/http-error-response-parser';
import { HttpError } from '@/services/HttpsClient/HttpError';

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
});
