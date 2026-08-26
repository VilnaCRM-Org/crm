import { ApolloLink, Observable, execute, gql } from '@apollo/client';

import ApolloLinkFactory from '@/services/observability/apollo-link-factory';
import type { ObservabilityService } from '@/services/types/observability/observability';

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

describe('ApolloLinkFactory', () => {
  it('builds a link chain terminating in an HTTP link', () => {
    const link = new ApolloLinkFactory(createObservability()).build('http://localhost/graphql');

    expect(link).toBeInstanceOf(ApolloLink);
  });

  it('adds a generated correlation id header to each operation', (done) => {
    const factory = new ApolloLinkFactory(createObservability());
    let headers: Record<string, string> = {};
    const terminating = new ApolloLink((operation) => {
      headers = operation.getContext().headers ?? {};
      return Observable.of({ data: { field: 1 } });
    });

    execute(ApolloLink.from([privateLink(factory, 'correlationLink'), terminating]), {
      query,
    }).subscribe({
      complete: () => {
        const requestId = headers['X-Request-Id'];

        expect(requestId).toEqual(expect.any(String));
        expect(requestId ?? '').not.toHaveLength(0);
        done();
      },
    });
  });

  it('captures network errors through observability', (done) => {
    const observability = createObservability();
    const factory = new ApolloLinkFactory(observability);
    const networkError = new Error('offline');
    const terminating = new ApolloLink(
      () => new Observable((observer) => observer.error(networkError))
    );

    execute(ApolloLink.from([privateLink(factory, 'errorLink'), terminating]), { query }).subscribe(
      {
        error: () => {
          expect(observability.captureError).toHaveBeenCalledWith(networkError, {
            source: 'apollo:network',
          });
          done();
        },
      }
    );
  });

  it('attaches the operation correlation id to captured errors', (done) => {
    const observability = createObservability();
    const factory = new ApolloLinkFactory(observability);
    const networkError = new Error('offline');
    const terminating = new ApolloLink(
      () => new Observable((observer) => observer.error(networkError))
    );

    execute(
      ApolloLink.from([
        privateLink(factory, 'correlationLink'),
        privateLink(factory, 'errorLink'),
        terminating,
      ]),
      { query }
    ).subscribe({
      error: () => {
        expect(observability.captureError).toHaveBeenCalledWith(networkError, {
          source: 'apollo:network',
          'X-Request-Id': expect.any(String),
        });
        done();
      },
    });
  });

  it('captures graphql errors through observability', (done) => {
    const observability = createObservability();
    const factory = new ApolloLinkFactory(observability);
    const graphQLError = { message: 'bad field' };
    const terminating = new ApolloLink(() => Observable.of({ errors: [graphQLError] }));

    execute(ApolloLink.from([privateLink(factory, 'errorLink'), terminating]), { query }).subscribe(
      {
        next: () => {
          expect(observability.captureError).toHaveBeenCalledWith(graphQLError, {
            source: 'apollo:graphql',
          });
          done();
        },
      }
    );
  });
});
