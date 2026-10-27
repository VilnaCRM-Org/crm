import type { Page, Request, Route } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';
const SIGN_IN_OPERATION = 'SignInUser';

export const SIGN_IN_ACCESS_TOKEN = 'e2e-access-token';
export const SIGN_IN_PENDING_SESSION_ID = '01JAQZ8M3K5N7P9R2T4V6X8Z0B';

export type SignInOutcome =
  | 'session'
  | 'challenge'
  | 'unauthenticated'
  | 'violation'
  | 'locked'
  | 'rate_limited'
  | 'unavailable'
  | 'network';

export type SignInReply = (route: Route) => Promise<void>;

export interface RecordedSignIn {
  readonly variables: Record<string, unknown>;
  readonly authorization: string | undefined;
  readonly url: string;
}

export interface StubbedSignIn {
  readonly calls: RecordedSignIn[];
  readonly count: () => number;
}

interface GraphQLRequestBody {
  readonly operationName?: string;
  readonly variables?: Record<string, unknown>;
}

const json = (route: Route, status: number, body: unknown): Promise<void> =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const signInUser = (user: Record<string, unknown>): unknown => ({
  data: { signInUser: { user: { success: true, ...user } } },
});

const graphQLFailure = (message: string, status: number): unknown => ({
  data: null,
  errors: [{ message, extensions: { status } }],
});

export const replyWithUnauthenticated =
  (message: string): SignInReply =>
  (route) =>
    json(route, 200, graphQLFailure(message, 401));

export const SIGN_IN_REPLIES: Record<SignInOutcome, SignInReply> = {
  session: (route) =>
    json(
      route,
      200,
      signInUser({
        twoFactorEnabled: false,
        accessToken: SIGN_IN_ACCESS_TOKEN,
        pendingSessionId: null,
      })
    ),
  challenge: (route) =>
    json(
      route,
      200,
      signInUser({
        twoFactorEnabled: true,
        accessToken: null,
        pendingSessionId: SIGN_IN_PENDING_SESSION_ID,
      })
    ),
  unauthenticated: replyWithUnauthenticated('Invalid credentials.'),
  violation: (route) =>
    json(route, 200, graphQLFailure('email: This value is not a valid email address.', 422)),
  locked: (route) => json(route, 200, graphQLFailure('Account is locked.', 423)),
  rate_limited: (route) => route.fulfill({ status: 429, body: '' }),
  unavailable: (route) => route.fulfill({ status: 503, body: '' }),
  network: (route) => route.abort('failed'),
};

const bodyOf = (request: Request): GraphQLRequestBody | null =>
  request.postDataJSON() as GraphQLRequestBody | null;

const recordOf = (request: Request): RecordedSignIn => ({
  variables: bodyOf(request)?.variables ?? {},
  authorization: request.headers().authorization,
  url: request.url(),
});

const replyOf = (outcome: SignInOutcome | SignInReply | undefined): SignInReply =>
  typeof outcome === 'function' ? outcome : SIGN_IN_REPLIES[outcome ?? 'session'];

export async function stubSignIn(
  page: Page,
  outcomes: readonly (SignInOutcome | SignInReply)[] = ['session']
): Promise<StubbedSignIn> {
  const calls: RecordedSignIn[] = [];
  const count = (): number => calls.length;

  await page.route(GRAPHQL_URL, async (route: Route) => {
    if (bodyOf(route.request())?.operationName !== SIGN_IN_OPERATION) return route.fallback();
    calls.push(recordOf(route.request()));
    return replyOf(outcomes[Math.min(count(), outcomes.length) - 1])(route);
  });
  return { calls, count };
}
