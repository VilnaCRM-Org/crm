/** @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom */

import 'reflect-metadata';

import { z } from 'zod';

import RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import FetchHttpsClient from '@/services/https-client/fetch-https-client';
import HttpErrorResponseParser from '@/services/https-client/http-error-response-parser';
import HttpRequestConfigBuilder from '@/services/https-client/http-request-config-builder';
import HttpResponseProcessor from '@/services/https-client/http-response-processor';
import correlationIdProvider from '@/services/observability/correlation-id-provider';
import sessionCorrelation from '@/services/observability/session-correlation';
import type RequestRetryService from '@/services/resilience/request-retry-service';
import securityEventCore from '@/services/security-events/security-event-core';
import type { RetryOperation, RetryOptions } from '@/services/types/resilience/request-retry';

const singleAttempt: RequestRetryService = {
  execute: <T>(operation: RetryOperation<T>, options: RetryOptions): Promise<T> =>
    operation({ attempt: 1, remainingMs: options.budgetMs }),
} as RequestRetryService;

const okResponse = (): Response =>
  ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: async (): Promise<unknown> => ({ ok: true }),
    clone: () => ({ text: async (): Promise<string> => JSON.stringify({ ok: true }) }),
  }) as unknown as Response;

const createClient = (): FetchHttpsClient =>
  new FetchHttpsClient({
    requestConfigBuilder: new HttpRequestConfigBuilder(correlationIdProvider, sessionCorrelation),
    responseProcessor: new HttpResponseProcessor(new HttpErrorResponseParser(securityEventCore)),
    deadlines: new RequestDeadlineFactory(),
    retries: singleAttempt,
  });

const requestInitOf = (mockFetch: jest.Mock): RequestInit =>
  (mockFetch.mock.calls[0] as [string, RequestInit])[1];

describe('FetchHttpsClient credentials', () => {
  const originalFetch = global.fetch;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn().mockImplementation(async () => okResponse());
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('forwards an explicit credentials mode to fetch', async () => {
    await createClient().get('/api/auth/social/google/callback', {
      schema: z.unknown(),
      credentials: 'include',
    });

    expect(requestInitOf(mockFetch).credentials).toBe('include');
  });

  it('leaves credentials unset when the caller does not ask for them', async () => {
    await createClient().get('/api/users', { schema: z.unknown() });

    expect(requestInitOf(mockFetch)).not.toHaveProperty('credentials');
  });

  it('treats an explicit undefined like an omitted credentials mode', async () => {
    await createClient().get('/api/users', { schema: z.unknown(), credentials: undefined });

    expect(requestInitOf(mockFetch)).not.toHaveProperty('credentials');
  });
});
