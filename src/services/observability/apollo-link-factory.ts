import { ApolloLink, HttpLink, from } from '@apollo/client';
import type { Operation } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { inject, injectable } from 'tsyringe';

import type { ApolloLinkDeps } from '@/services/types/observability/apollo-link-deps';

import OBSERVABILITY_TOKENS from './tokens';

@injectable()
export default class ApolloLinkFactory {
  constructor(
    @inject(OBSERVABILITY_TOKENS.ApolloLinkFactoryDeps) private readonly deps: ApolloLinkDeps
  ) {}

  // The deadline-bounded fetch is the only resilience GraphQL gets: a mutation is a create, and
  // an automatic retry of one could create twice (issue #147).
  public build(uri: string): ApolloLink {
    const fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> =>
      this.deps.deadlineFetch.fetch(input, init);
    return from([this.correlationLink(), this.errorLink(), new HttpLink({ uri, fetch })]);
  }

  private correlationLink(): ApolloLink {
    return setContext((_operation, previousContext: { headers?: Record<string, string> }) => ({
      headers: {
        ...previousContext.headers,
        [this.deps.correlationIds.header]: this.deps.correlationIds.next(),
        [this.deps.sessionCorrelation.header]: this.deps.sessionCorrelation.id(),
      },
    }));
  }

  private errorLink(): ApolloLink {
    return onError(({ operation, graphQLErrors, networkError }) => {
      const correlation = this.correlationOf(operation);
      if (networkError) {
        this.deps.observability.captureError(networkError, {
          source: 'apollo:network',
          ...correlation,
        });
      }
      (graphQLErrors ?? []).forEach((graphQLError) => {
        this.deps.observability.captureError(graphQLError, {
          source: 'apollo:graphql',
          ...correlation,
        });
      });
    });
  }

  private correlationOf(operation: Operation): Record<string, string> {
    const headers = operation.getContext().headers as Record<string, string> | undefined;
    const id = headers?.[this.deps.correlationIds.header];
    return id ? { [this.deps.correlationIds.header]: id } : {};
  }
}
