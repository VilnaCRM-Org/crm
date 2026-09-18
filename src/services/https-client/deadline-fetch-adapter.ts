import { inject, injectable } from 'tsyringe';

import type RequestDeadline from '@/lib/reliability/request-deadline';
import type RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import { HttpError } from '@/services/https-client/http-error';
import ResponseMessages from '@/services/https-client/response-messages';

import HTTP_TOKENS from './tokens';

// A `fetch` whose wait for response headers is bounded by the request deadline. Apollo's
// HttpLink reads the body itself, so the deadline is released once headers arrive and the
// caller's own signal keeps governing the body read (issue #147).
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
      return await fetch(input, { ...init, signal: deadline.signal });
    } catch (error) {
      throw this.transportError(error, deadline);
    } finally {
      deadline.release();
    }
  }

  private transportError(error: unknown, deadline: RequestDeadline): unknown {
    if (!deadline.timedOut) return error;
    return new HttpError({ status: 0, message: ResponseMessages.REQUEST_TIMEOUT, cause: error });
  }
}
