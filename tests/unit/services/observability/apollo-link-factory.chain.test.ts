import { ApolloLink, Observable, execute, gql } from '@apollo/client';
import type { FetchResult } from '@apollo/client';

import ApolloLinkFactory from '@/services/observability/apollo-link-factory';
import type { ObservabilityService } from '@/services/types/observability/observability';

const GRAPHQL_URI = 'https://api.example.test/graphql';

const query = gql`
  query {
    field
  }
`;

const createObservability = (): jest.Mocked<ObservabilityService> => ({
  init: jest.fn(),
  captureError: jest.fn(),
  setUser: jest.fn(),
  clearUser: jest.fn(),
  reportVital: jest.fn(),
});

const privateLink = (
  factory: ApolloLinkFactory,
  method: 'correlationLink' | 'errorLink'
): ApolloLink => (factory as unknown as Record<typeof method, () => ApolloLink>)[method]();

const runLink = (link: ApolloLink): Promise<FetchResult | undefined> =>
  new Promise((resolve, reject) => {
    let lastResult: FetchResult | undefined;
    execute(link, { query }).subscribe({
      next: (value) => {
        lastResult = value;
      },
      error: reject,
      complete: () => resolve(lastResult),
    });
  });

const rejectionOf = async (promise: Promise<unknown>): Promise<unknown> =>
  promise.then(
    () => undefined,
    (error: unknown) => error
  );

describe('ApolloLinkFactory — assembled chain', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sends operations to the configured endpoint with a correlation header', async () => {
    const calls: Array<[string, RequestInit]> = [];
    const fetchMock = jest.fn((input: string, init: RequestInit) => {
      calls.push([input, init]);
      return Promise.resolve(
        new Response(JSON.stringify({ data: { field: 1 } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const link = new ApolloLinkFactory(createObservability()).build(GRAPHQL_URI);
    const result = await runLink(link);

    expect(result).toEqual({ data: { field: 1 } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(calls[0][0]).toBe(GRAPHQL_URI);
    const sentHeaders = calls[0][1].headers as Record<string, string>;
    expect(sentHeaders['x-request-id']).toEqual(expect.any(String));
    expect(sentHeaders['x-request-id'].length).toBeGreaterThan(0);
  });

  it('captures a network failure exactly once when no graphql errors are present', async () => {
    const observability = createObservability();
    const factory = new ApolloLinkFactory(observability);
    const networkError = new Error('offline');
    const terminating = new ApolloLink(
      () => new Observable((observer) => observer.error(networkError))
    );

    const rejection = await rejectionOf(
      runLink(ApolloLink.from([privateLink(factory, 'errorLink'), terminating]))
    );

    expect(rejection).toBe(networkError);
    expect(observability.captureError).toHaveBeenCalledTimes(1);
    expect(observability.captureError).toHaveBeenCalledWith(networkError, {
      source: 'apollo:network',
    });
  });

  it('captures graphql errors exactly once when the transport succeeded', async () => {
    const observability = createObservability();
    const factory = new ApolloLinkFactory(observability);
    const graphQLError = { message: 'bad field' };
    const terminating = new ApolloLink(() => Observable.of({ errors: [graphQLError] }));

    await runLink(ApolloLink.from([privateLink(factory, 'errorLink'), terminating]));

    expect(observability.captureError).toHaveBeenCalledTimes(1);
    expect(observability.captureError).toHaveBeenCalledWith(graphQLError, {
      source: 'apollo:graphql',
    });
  });

  it('captures nothing when neither transport nor graphql errors occur', async () => {
    const observability = createObservability();
    const factory = new ApolloLinkFactory(observability);
    const terminating = new ApolloLink(() => Observable.of({ data: { field: 1 } }));

    await runLink(ApolloLink.from([privateLink(factory, 'errorLink'), terminating]));

    expect(observability.captureError).not.toHaveBeenCalled();
  });
});
