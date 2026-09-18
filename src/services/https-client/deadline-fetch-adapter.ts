import { inject, injectable } from 'tsyringe';

import type RequestDeadline from '@/lib/reliability/request-deadline';
import type RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import { HttpError } from '@/services/https-client/http-error';
import ResponseMessages from '@/services/https-client/response-messages';

import HTTP_TOKENS from './tokens';

// A `fetch` bounded by the request deadline from the first byte to the last: the wait for the
// response headers and the consumer's read of the body both run under the same timer, so a
// peer that answers the headers and then stalls cannot hang Apollo's HttpLink (issue #147).
@injectable()
export default class DeadlineFetchAdapter {
  constructor(
    @inject(HTTP_TOKENS.RequestDeadlineFactory) private readonly deadlines: RequestDeadlineFactory
  ) {}

  public async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const deadline = this.deadlines.create(
      init?.signal ?? undefined,
      this.deadlines.defaultTimeoutMs()
    );
    try {
      const response = await fetch(input, { ...init, signal: deadline.signal });
      return this.boundedBody(response, deadline);
    } catch (error) {
      deadline.release();
      throw this.transportError(error, deadline);
    }
  }

  // The body is re-streamed through the deadline: it is released once the last chunk has been
  // read or the consumer cancels, and a read the expired deadline cut short becomes the timeout.
  private boundedBody(response: Response, deadline: RequestDeadline): Response {
    if (!response.body) {
      deadline.release();
      return response;
    }
    const reader = response.body.getReader();
    const body = new ReadableStream<Uint8Array>({
      pull: (controller): Promise<void> => this.pump(reader, controller, deadline),
      cancel: (reason: unknown): void => {
        deadline.release();
        void reader.cancel(reason).catch(() => undefined);
      },
    });
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  private async pump(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    controller: ReadableStreamDefaultController<Uint8Array>,
    deadline: RequestDeadline
  ): Promise<void> {
    try {
      this.forward(await reader.read(), controller, deadline);
    } catch (error) {
      deadline.release();
      controller.error(this.transportError(error, deadline));
    }
  }

  private forward(
    chunk: ReadableStreamReadResult<Uint8Array>,
    controller: ReadableStreamDefaultController<Uint8Array>,
    deadline: RequestDeadline
  ): void {
    if (chunk.done) {
      deadline.release();
      controller.close();
      return;
    }
    controller.enqueue(chunk.value);
  }

  private transportError(error: unknown, deadline: RequestDeadline): unknown {
    if (!deadline.timedOut || !this.isAbortError(error)) return error;
    return new HttpError({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT, cause: error });
  }

  private isAbortError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { name?: unknown }).name === 'AbortError'
    );
  }
}
