import { z } from 'zod';

import { HttpError } from '@/services/https-client/http-error';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';

const passthrough = z.unknown();

const headerlessResponse = (body: string): Response =>
  ({
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://example.test/resource',
    headers: new Headers(),
    text: async (): Promise<string> => body,
    clone: (): Response => headerlessResponse(body),
  }) as unknown as Response;

describe('HttpResponseProcessor with no content-type header', () => {
  const processor = new HttpResponseProcessor(new HttpErrorResponseParser());

  it('treats an empty body with no declared content type as no body at all', async () => {
    await expect(processor.process(headerlessResponse(''), passthrough)).resolves.toBeUndefined();
  });

  it('treats a whitespace-only body with no declared content type as no body at all', async () => {
    await expect(
      processor.process(headerlessResponse('  \n'), passthrough)
    ).resolves.toBeUndefined();
  });

  it('rejects a headerless response that carries visible text', async () => {
    await expect(
      processor.process(headerlessResponse('<html>nope</html>'), passthrough)
    ).rejects.toBeInstanceOf(HttpError);
  });
});
