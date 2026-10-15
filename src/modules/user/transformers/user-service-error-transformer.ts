import type { ApolloError } from '@apollo/client';
import type { GraphQLFormattedError } from 'graphql';
import { injectable } from 'tsyringe';

import type {
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';

const STATUS_REASONS = new Map<number, UserServiceFailureReason>([
  [0, 'network'],
  [422, 'violation'],
  [429, 'rate_limited'],
]);

const VIOLATION_PROPERTIES: readonly string[] = ['email', 'token', 'newPassword'];

@injectable()
export default class UserServiceErrorTransformer {
  public normalize(error: unknown, signal?: AbortSignal): UserServiceFailure {
    const { networkError, graphQLErrors } = (error ?? {}) as Partial<ApolloError>;
    if (signal?.aborted || this.isAbortError(error) || this.isAbortError(networkError)) {
      return this.failure('aborted', null);
    }
    if (networkError) return this.fromStatus(this.statusOf(networkError));
    return this.fromGraphQLError(graphQLErrors?.[0]);
  }

  private fromGraphQLError(graphQLError: GraphQLFormattedError | undefined): UserServiceFailure {
    if (!graphQLError) return this.failure('unknown', null);
    const status = this.extensionStatus(graphQLError);
    const property = this.violatedProperty(graphQLError.message);
    if (property) return this.failure('violation', status, property);
    return status === null ? this.failure('refused', null) : this.fromStatus(status);
  }

  private fromStatus(status: number | null): UserServiceFailure {
    if (status === null) return this.failure('network', null);
    const isServer = status >= 500 && status <= 599;
    return this.failure(isServer ? 'server' : (STATUS_REASONS.get(status) ?? 'unknown'), status);
  }

  private violatedProperty(message: string): string | null {
    return VIOLATION_PROPERTIES.find((property) => message.startsWith(`${property}:`)) ?? null;
  }

  private extensionStatus(graphQLError: GraphQLFormattedError): number | null {
    const status = graphQLError.extensions?.status;
    return typeof status === 'number' ? status : null;
  }

  private statusOf(networkError: object): number | null {
    const { statusCode, status } = networkError as { statusCode?: unknown; status?: unknown };
    const value = statusCode ?? status;
    return typeof value === 'number' ? value : null;
  }

  private isAbortError(value: unknown): boolean {
    return (value as { name?: unknown } | null | undefined)?.name === 'AbortError';
  }

  private failure(
    reason: UserServiceFailureReason,
    status: number | null,
    property?: string
  ): UserServiceFailure {
    const items = property === undefined ? [] : [{ path: property, reason: 'other' as const }];
    return { reason, status, violations: { items } };
  }
}
