import { z } from 'zod';

import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import ResponseMessages from '@/services/https-client/response-messages';

const passthrough = z.unknown();

function createTextResponse(text: string, contentType = 'text/plain'): Response {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': contentType }),
    text: async (): Promise<string> => text,
    clone: (): Response => ({ text: async (): Promise<string> => text }) as Response,
  } as unknown as Response;
}

describe('HttpResponseProcessor non-JSON bodies', () => {
  const processor = new HttpResponseProcessor(new HttpErrorResponseParser());

  it('treats a whitespace-only non-JSON body as no body at all', async () => {
    await expect(
      processor.process(createTextResponse('   \n\t  '), passthrough)
    ).resolves.toBeUndefined();
  });

  it('treats a single space non-JSON body as no body at all', async () => {
    await expect(processor.process(createTextResponse(' '), passthrough)).resolves.toBeUndefined();
  });

  it('treats an empty non-JSON body as no body at all', async () => {
    await expect(processor.process(createTextResponse(''), passthrough)).resolves.toBeUndefined();
  });

  it('rejects a non-JSON body that carries visible text', async () => {
    await expect(
      processor.process(createTextResponse('<html>nope</html>'), passthrough)
    ).rejects.toBeInstanceOf(HttpError);
  });

  it('reports the non-JSON body with the response status and message', async () => {
    await expect(
      processor.process(createTextResponse('plain text payload'), passthrough)
    ).rejects.toMatchObject({ status: 200, message: ResponseMessages.RESPONSE_NOT_JSON });
  });

  it('rejects a non-JSON body whose text is padded with whitespace', async () => {
    await expect(
      processor.process(createTextResponse('  padded  '), passthrough)
    ).rejects.toMatchObject({ message: ResponseMessages.RESPONSE_NOT_JSON });
  });
});
