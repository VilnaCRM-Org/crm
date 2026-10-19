import type { ApolloError } from '@apollo/client';
import type { NetworkError } from '@apollo/client/errors';
import type { GraphQLFormattedError } from 'graphql';
import { injectable } from 'tsyringe';

import type {
  FieldViolation,
  FieldViolationSet,
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

const NO_VIOLATIONS: FieldViolationSet = { items: [], complete: true };

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
      return this.failure('aborted', null, NO_VIOLATIONS);
    }
    if (networkError) return this.fromStatus(this.statusOf(networkError));
    return this.fromGraphQLError(graphQLErrors?.[0]);
  }

  private fromGraphQLError(graphQLError: GraphQLFormattedError | undefined): UserServiceFailure {
    if (!graphQLError) return this.failure('unknown', null, NO_VIOLATIONS);
    const status = this.extensionStatus(graphQLError);
    const violations = this.violationsOf(graphQLError.message);
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

  private violationsOf(message: string): FieldViolationSet | null {
    const lines = message.split(/\r?\n/).filter((line) => line.trim() !== '');
    const items: FieldViolation[] = [];
    for (const line of lines) {
      const violation = this.violationOf(line);
      if (violation) items.push(violation);
    }
    if (items.length === 0) return null;
    return { items, complete: items.length === lines.length };
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
