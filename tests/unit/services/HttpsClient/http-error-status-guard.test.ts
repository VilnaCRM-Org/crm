/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import HttpErrorStatusGuard from '@/services/HttpsClient/http-error-status-guard';
import { HttpError } from '@/services/HttpsClient/HttpError';

function makeResponse(ok: boolean, status: number, statusText = ''): Response {
  return { ok, status, statusText, url: '/test', headers: new Headers() } as Response;
}

describe('HttpErrorStatusGuard', () => {
  it('resolves without throwing for a 200 response', async () => {
    const guard = new HttpErrorStatusGuard();
    await expect(guard.assertOk(makeResponse(true, 200))).resolves.toBeUndefined();
  });

  it('resolves without throwing for a 304 Not Modified response', async () => {
    const guard = new HttpErrorStatusGuard();
    await expect(guard.assertOk(makeResponse(false, 304))).resolves.toBeUndefined();
  });

  it('throws HttpError for a non-ok response', async () => {
    const guard = new HttpErrorStatusGuard();
    const response = { ok: false, status: 400, statusText: 'Bad Request', url: '/test', headers: new Headers() } as Response;
    await expect(guard.assertOk(response)).rejects.toThrow(HttpError);
  });

  it('uses an injected HttpErrorResponseParser', async () => {
    const parser = {
      parse: jest.fn().mockResolvedValue({ message: 'parsed error', body: undefined }),
    };
    const guard = new HttpErrorStatusGuard(parser as never);
    const response = makeResponse(false, 422, 'Unprocessable Entity');

    await expect(guard.assertOk(response)).rejects.toThrow(HttpError);
    expect(parser.parse).toHaveBeenCalledWith(response);
  });
});
