import 'reflect-metadata';

import { ApolloLink, Observable, execute, gql } from '@apollo/client';

import container from '@/config/dependency-injection-config';
import type ApolloLinkFactory from '@/services/observability/apollo-link-factory';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import type { ObservabilityService } from '@/services/types/observability/observability';

const query = gql`
  query {
    field
  }
`;

const privateLink = (
  factory: ApolloLinkFactory,
  method: 'correlationLink' | 'errorLink'
): ApolloLink => (factory as unknown as Record<typeof method, () => ApolloLink>)[method]();

const failingLink = (error: Error): ApolloLink =>
  new ApolloLink(() => new Observable((observer) => observer.error(error)));

describe('apollo link factory (integration)', () => {
  const factory = container.resolve<ApolloLinkFactory>(OBSERVABILITY_TOKENS.ApolloLinkFactory);
  const observability = container.resolve<ObservabilityService>(
    OBSERVABILITY_TOKENS.ObservabilityService
  );
  const captureError = jest.spyOn(observability, 'captureError');

  afterEach(() => captureError.mockClear());

  afterAll(() => captureError.mockRestore());

  it('tags a captured network error with the operation correlation id', (done) => {
    const networkError = new Error('offline');
    const chain = ApolloLink.from([
      privateLink(factory, 'correlationLink'),
      privateLink(factory, 'errorLink'),
      failingLink(networkError),
    ]);

    execute(chain, { query }).subscribe({
      error: () => {
        expect(captureError).toHaveBeenCalledWith(networkError, {
          source: 'apollo:network',
          'X-Request-Id': expect.any(String),
        });
        done();
      },
    });
  });

  it('captures a network error without a correlation id when headers are absent', (done) => {
    const networkError = new Error('offline');
    const chain = ApolloLink.from([privateLink(factory, 'errorLink'), failingLink(networkError)]);

    execute(chain, { query }).subscribe({
      error: () => {
        expect(captureError).toHaveBeenCalledWith(networkError, { source: 'apollo:network' });
        done();
      },
    });
  });
});
