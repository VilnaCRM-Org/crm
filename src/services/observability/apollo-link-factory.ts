import { ApolloLink, HttpLink, from } from '@apollo/client';
import type { Operation } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { inject, injectable } from 'tsyringe';

import type { ObservabilityService } from '@/services/types/observability/observability';

import type { CorrelationIdProvider } from './correlation-id-provider';
import OBSERVABILITY_TOKENS from './tokens';

@injectable()
export default class ApolloLinkFactory {
  constructor(
    @inject(OBSERVABILITY_TOKENS.ObservabilityService)
    private readonly observability: ObservabilityService,
    @inject(OBSERVABILITY_TOKENS.CorrelationIdProvider)
    private readonly correlationIds: CorrelationIdProvider
  ) {}

  public build(uri: string): ApolloLink {
    return from([this.correlationLink(), this.errorLink(), new HttpLink({ uri })]);
  }

  private correlationLink(): ApolloLink {
    return setContext((_operation, previousContext: { headers?: Record<string, string> }) => ({
      headers: {
        ...previousContext.headers,
        [this.correlationIds.header]: this.correlationIds.next(),
      },
    }));
  }

  private errorLink(): ApolloLink {
    return onError(({ operation, graphQLErrors, networkError }) => {
      const correlation = this.correlationOf(operation);
      if (networkError) {
        this.observability.captureError(networkError, { source: 'apollo:network', ...correlation });
      }
      (graphQLErrors ?? []).forEach((graphQLError) => {
        this.observability.captureError(graphQLError, { source: 'apollo:graphql', ...correlation });
      });
    });
  }

  private correlationOf(operation: Operation): Record<string, string> {
    const headers = operation.getContext().headers as Record<string, string> | undefined;
    const id = headers?.[this.correlationIds.header];
    return id ? { [this.correlationIds.header]: id } : {};
  }
}
