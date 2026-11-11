import type { ApolloError } from '@apollo/client';
import type { NetworkError } from '@apollo/client/errors';
import type { GraphQLFormattedError } from 'graphql';
import { inject, injectable } from 'tsyringe';

import AUTH_TOKENS from '@/modules/user/config/tokens';
import type FieldViolationParser from '@/modules/user/transformers/field-violation-parser';
import type {
  FieldViolationSet,
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';

const STATUS_REASONS = new Map<number, UserServiceFailureReason>([
  [0, 'network'],
  [401, 'unauthenticated'],
  [422, 'violation'],
  [423, 'locked'],
  [429, 'rate_limited'],
]);

const MESSAGE_REASONS = new Map<string, UserServiceFailureReason>([
  ['Access Denied.', 'access_denied'],
  ['Old password is invalid', 'invalid_password'],
  ['Старий пароль невірний', 'invalid_password'],
  ['Invalid two-factor code.', 'invalid_code'],
  ['Invalid or expired two-factor session.', 'expired_session'],
  ['Two-factor setup not initiated.', 'setup_not_initiated'],
  ['Two-factor authentication is already enabled.', 'already_enabled'],
  ['Two-factor authentication is not enabled.', 'not_enabled'],
  ['Re-authentication required.', 'reauth_required'],
]);

const NO_VIOLATIONS: FieldViolationSet = { items: [], complete: true };

@injectable()
export default class UserServiceErrorTransformer {
  constructor(
    @inject(AUTH_TOKENS.FieldViolationParser)
    private readonly violations: FieldViolationParser
  ) {}

  public normalize(error: unknown, signal?: AbortSignal): UserServiceFailure {
    const { networkError, graphQLErrors } = (error ?? {}) as Partial<ApolloError>;
    if (signal?.aborted || this.isAbortError(error) || this.isAbortError(networkError)) {
      return this.failure('aborted', null, NO_VIOLATIONS);
    }
    if (networkError) return this.fromStatus(this.statusOf(networkError));
    return this.fromGraphQLError(this.primaryError(graphQLErrors ?? []));
  }

  private primaryError(
    graphQLErrors: readonly GraphQLFormattedError[]
  ): GraphQLFormattedError | undefined {
    const tokenError = graphQLErrors.find((graphQLError) =>
      this.violations
        .parse(graphQLError.message)
        ?.items.some((violation) => violation.path === 'token')
    );
    return tokenError ?? graphQLErrors[0];
  }

  private fromGraphQLError(graphQLError: GraphQLFormattedError | undefined): UserServiceFailure {
    if (!graphQLError) return this.failure('unknown', null, NO_VIOLATIONS);
    const extensionStatus = graphQLError.extensions?.status;
    const status = typeof extensionStatus === 'number' ? extensionStatus : null;
    const violations = this.violations.parse(graphQLError.message);
    if (violations) return this.failure('violation', status, violations);
    return this.fromCode(graphQLError, status);
  }

  private fromCode(graphQLError: GraphQLFormattedError, status: number | null): UserServiceFailure {
    const reason = MESSAGE_REASONS.get(graphQLError.message);
    if (reason !== undefined) return this.failure(reason, status, NO_VIOLATIONS);
    if (status !== null) return this.fromStatus(status);
    const coded = graphQLError.extensions?.code !== undefined;
    return this.failure(coded ? 'unknown' : 'refused', null, NO_VIOLATIONS);
  }

  private fromStatus(status: number | null): UserServiceFailure {
    if (status === null) return this.failure('network', null, NO_VIOLATIONS);
    const isServer = status >= 500 && status <= 599;
    return this.failure(
      isServer ? 'server' : (STATUS_REASONS.get(status) ?? 'unknown'),
      status,
      NO_VIOLATIONS
    );
  }

  private statusOf(networkError: NonNullable<NetworkError>): number | null {
    if ('statusCode' in networkError && typeof networkError.statusCode === 'number') {
      return networkError.statusCode;
    }
    if ('status' in networkError && typeof networkError.status === 'number') {
      return networkError.status;
    }
    return null;
  }

  private isAbortError(value: unknown): boolean {
    return (value as { name?: unknown } | null | undefined)?.name === 'AbortError';
  }

  private failure(
    reason: UserServiceFailureReason,
    status: number | null,
    violations: FieldViolationSet
  ): UserServiceFailure {
    return { reason, status, violations };
  }
}
