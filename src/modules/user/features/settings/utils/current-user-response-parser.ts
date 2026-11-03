import ApiError from '@/modules/user/lib/api-errors/api-error';
import ApiErrorCodes from '@/modules/user/lib/api-errors/api-error-codes';

import type {
  CurrentUserErrorParse,
  CurrentUserFailureCause,
  CurrentUserParse,
  CurrentUserResponse,
} from '../types/current-user/current-user-read';

const ACCESS_DENIED = 'Access Denied.';

const UNAUTHENTICATED = 401;

const GRAPHQL_FAILED = 'The CurrentUser query returned GraphQL errors';

const PARSE_FAILED = 'Failed to parse JSON response';

const NOT_A_USER = 'Response did not match the expected schema';

const UNPARSEABLE = Symbol('unparseable');

export default class CurrentUserResponseParser {
  public parse({ status, text }: CurrentUserResponse): CurrentUserParse {
    if (status >= 300) return this.rejected(status);
    const body = this.json(text);

    return body === UNPARSEABLE
      ? this.unavailable(status, PARSE_FAILED)
      : this.fromBody(body, status);
  }

  private rejected(status: number): CurrentUserErrorParse {
    const message = `Response not successful: Received status code ${status}`;

    return {
      kind: 'failed',
      reason: status === UNAUTHENTICATED ? 'unauthorized' : 'unavailable',
      error: this.error(message, status),
    };
  }

  private fromBody(body: unknown, status: number): CurrentUserParse {
    const errors = this.field(body, 'errors');
    if (Array.isArray(errors) && errors.length > 0) return this.graphQLFailure(errors, status);
    const user = this.field(this.firstEdge(this.field(body, 'data')), 'node');
    const fullName = this.field(user, 'initials');

    return typeof fullName === 'string'
      ? { kind: 'ok', fullName }
      : this.unavailable(status, NOT_A_USER);
  }

  private graphQLFailure(errors: unknown[], status: number): CurrentUserErrorParse {
    const error = new ApiError({
      message: GRAPHQL_FAILED,
      code: ApiErrorCodes.UNKNOWN,
      status,
      cause: errors,
    });

    return { kind: 'failed', reason: this.reasonOf(errors[0]), error };
  }

  private reasonOf(error: unknown): CurrentUserFailureCause {
    const denied = this.field(error, 'message') === ACCESS_DENIED;
    const status = this.field(this.field(error, 'extensions'), 'status');

    return denied || status === UNAUTHENTICATED ? 'denied' : 'unavailable';
  }

  private unavailable(status: number, message: string): CurrentUserErrorParse {
    return { kind: 'failed', reason: 'unavailable', error: this.error(message, status) };
  }

  private error(message: string, status: number): ApiError {
    return new ApiError({ message, code: ApiErrorCodes.UNKNOWN, status });
  }

  private firstEdge(data: unknown): unknown {
    const edges = this.field(this.field(data, 'users'), 'edges');

    return Array.isArray(edges) ? edges[0] : undefined;
  }

  private field(value: unknown, key: string): unknown {
    return typeof value === 'object' && value !== null ? Reflect.get(value, key) : undefined;
  }

  private json(text: string): unknown {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return UNPARSEABLE;
    }
  }
}
