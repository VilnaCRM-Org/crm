import type { ApolloError } from '@apollo/client';
import type { GraphQLFormattedError } from 'graphql';
import { injectable } from 'tsyringe';

import type {
  FieldViolation,
  UserServiceFailure,
  UserServiceFailureReason,
} from '@/modules/user/types/user-service/user-service-failure';

const STATUS_REASONS = new Map<number, UserServiceFailureReason>([
  [0, 'network'],
  [401, 'unauthenticated'],
  [422, 'violation'],
  [429, 'rate_limited'],
]);

const MESSAGE_REASONS = new Map<string, UserServiceFailureReason>([
  ['Access Denied.', 'access_denied'],
  ['Old password is invalid', 'invalid_password'],
  ['Старий пароль невірний', 'invalid_password'],
]);

const TAKEN_MESSAGES: ReadonlySet<string> = new Set([
  'This email address is already registered',
  'Ця email-адреса вже зареєстрована',
]);

const VIOLATION_PROPERTIES: readonly string[] = [
  'email',
  'token',
  'newPassword',
  'initials',
  'password',
];

@injectable()
export default class UserServiceErrorTransformer {
  public normalize(error: unknown, signal?: AbortSignal): UserServiceFailure {
    const { networkError, graphQLErrors } = (error ?? {}) as Partial<ApolloError>;
    if (signal?.aborted || this.isAbortError(error) || this.isAbortError(networkError)) {
      return this.failure('aborted', null, null);
    }
    if (networkError) return this.fromStatus(this.statusOf(networkError));
    return this.fromGraphQLError(graphQLErrors?.[0]);
  }

  private fromGraphQLError(graphQLError: GraphQLFormattedError | undefined): UserServiceFailure {
    if (!graphQLError) return this.failure('unknown', null, null);
    const status = this.extensionStatus(graphQLError);
    const violation = this.violationOf(graphQLError.message);
    if (violation) return this.failure('violation', status, violation);
    return this.fromCode(graphQLError, status);
  }

  private fromCode(graphQLError: GraphQLFormattedError, status: number | null): UserServiceFailure {
    const reason = MESSAGE_REASONS.get(graphQLError.message);
    if (reason !== undefined) return this.failure(reason, status, null);
    if (status !== null) return this.fromStatus(status);
    const coded = graphQLError.extensions?.code !== undefined;
    return this.failure(coded ? 'unknown' : 'refused', null, null);
  }

  private fromStatus(status: number | null): UserServiceFailure {
    if (status === null) return this.failure('network', null, null);
    const isServer = status >= 500 && status <= 599;
    return this.failure(
      isServer ? 'server' : (STATUS_REASONS.get(status) ?? 'unknown'),
      status,
      null
    );
  }

  private violationOf(message: string): FieldViolation | null {
    const path = VIOLATION_PROPERTIES.find((property) => message.startsWith(`${property}:`));
    if (path === undefined) return null;
    const text = message.slice(path.length + 1).trim();
    return { path, reason: TAKEN_MESSAGES.has(text) ? 'taken' : 'other' };
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
    violation: FieldViolation | null
  ): UserServiceFailure {
    return { reason, status, violations: { items: violation === null ? [] : [violation] } };
  }
}
