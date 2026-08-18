import { HttpError } from '@/services/https-client/http-error';
import httpErrorThrower from '@/services/https-client/throw-if-http-error';

interface ErrorCause {
  [key: string]: unknown;
  bodyPreview?: string;
  bodyLength?: number;
}

const jsonResponse = (body: string): Response =>
  new Response(body, {
    status: 400,
    statusText: 'Bad Request',
    headers: { 'content-type': 'application/json' },
  });

async function captureHttpError(response: Response): Promise<HttpError> {
  try {
    await httpErrorThrower.throwIfError(response);
  } catch (error) {
    // A message probe that reads through a nullish body would surface here as a TypeError.
    expect(error).toBeInstanceOf(HttpError);
    return error as HttpError;
  }
  throw new Error('Expected throwIfError to reject');
}

describe('throwIfError with non-record JSON error bodies', () => {
  it('reports a literal JSON null body as a status-text error with a "null" preview', async () => {
    const error = await captureHttpError(jsonResponse('null'));
    const cause = error.cause as ErrorCause;

    expect(error.message).toBe('400 Bad Request');
    expect(cause.bodyPreview).toBe('null');
    expect(cause.bodyLength).toBe(4);
  });

  it('reports a JSON array body as a status-text error and previews the array', async () => {
    const error = await captureHttpError(jsonResponse('[1,2]'));
    const cause = error.cause as ErrorCause;

    expect(error.message).toBe('400 Bad Request');
    expect(cause.bodyPreview).toBe('[1,2]');
  });

  it('still prefers the message of a JSON object body', async () => {
    const error = await captureHttpError(jsonResponse('{"message":"boom"}'));

    expect(error.message).toBe('boom');
  });
});
