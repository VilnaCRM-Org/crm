import rawEnv from '@/config/env/raw-env';
import appConfigSource from '@/config/runtime/app-config-source';
import RequestDeadlineFactory from '@/lib/reliability/request-deadline-factory';
import ApiError from '@/modules/user/lib/api-errors/api-error';
import ApiErrorCodes from '@/modules/user/lib/api-errors/api-error-codes';
import correlationIdProvider from '@/services/observability/correlation-id-provider';
import sessionCorrelation from '@/services/observability/session-correlation';

import type {
  CurrentUserRequest,
  CurrentUserResponse,
} from '../types/current-user/current-user-read';

const FALLBACK_GRAPHQL_URL = 'http://localhost:4000/graphql';

const MISSING_PRODUCTION_URL =
  'A GraphQL URL must be defined in production environment. Cannot default to localhost.';

const CURRENT_USER_QUERY = `query CurrentUser {
  users(first: 1) {
    edges {
      node {
        id
        email
        initials
        confirmed
      }
    }
  }
}`;

const CURRENT_USER_BODY = JSON.stringify({
  operationName: 'CurrentUser',
  variables: {},
  query: CURRENT_USER_QUERY,
});

export default class CurrentUserClient {
  private readonly deadlines = new RequestDeadlineFactory(this.configuredTimeoutMs());

  public async send(request: CurrentUserRequest): Promise<CurrentUserResponse> {
    const deadline = this.deadlines.create(request.signal, this.deadlines.defaultTimeoutMs());
    try {
      const response = await fetch(this.endpoint(), this.init(request, deadline.signal));

      return { status: response.status, text: await response.text() };
    } catch (error) {
      throw deadline.timedOut ? this.timeout(error) : error;
    } finally {
      deadline.release();
    }
  }

  private init({ token, requestId }: CurrentUserRequest, signal: AbortSignal): RequestInit {
    return {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        [correlationIdProvider.header]: requestId,
        [sessionCorrelation.header]: sessionCorrelation.id(),
      },
      body: CURRENT_USER_BODY,
      signal,
    };
  }

  private timeout(cause: unknown): ApiError {
    return new ApiError({
      message: 'Request timed out',
      code: ApiErrorCodes.TIMEOUT,
      status: 0,
      cause,
    });
  }

  private endpoint(): string {
    const url = appConfigSource.url('graphqlUrl') ?? rawEnv.snapshot().graphqlUrl;
    if (url) return url;
    if (rawEnv.nodeEnv() === 'production') throw new Error(MISSING_PRODUCTION_URL);

    return FALLBACK_GRAPHQL_URL;
  }

  private configuredTimeoutMs(): number | undefined {
    const timeoutMs = Number(rawEnv.requestTimeoutMs());

    return Number.isInteger(timeoutMs) && timeoutMs > 0 ? timeoutMs : undefined;
  }
}
