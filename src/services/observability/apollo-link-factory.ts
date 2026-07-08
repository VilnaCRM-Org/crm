import { ApolloLink, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { inject, injectable } from 'tsyringe';

import TOKENS from '@/config/tokens';
import type { ObservabilityService } from '@/services/types/observability/observability';

import correlationIdProvider from './correlation-id-provider';

@injectable()
export default class ApolloLinkFactory {
  constructor(
    @inject(TOKENS.ObservabilityService) private readonly observability: ObservabilityService
  ) {}

  public build(uri: string): ApolloLink {
    return from([this.correlationLink(), this.errorLink(), new HttpLink({ uri })]);
  }

  private correlationLink(): ApolloLink {
    return setContext((_operation, previousContext: { headers?: Record<string, string> }) => ({
      headers: {
        ...previousContext.headers,
        [correlationIdProvider.header]: correlationIdProvider.next(),
      },
    }));
  }

  private errorLink(): ApolloLink {
    return onError(({ graphQLErrors, networkError }) => {
      if (networkError) {
        this.observability.captureError(networkError, { source: 'apollo:network' });
      }
      (graphQLErrors ?? []).forEach((graphQLError) => {
        this.observability.captureError(graphQLError, { source: 'apollo:graphql' });
      });
    });
  }
}
