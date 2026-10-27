import type { Page, Request, Route } from '@playwright/test';

const GRAPHQL_URL = '**/graphql';
const SIGN_IN_OPERATION = 'SignInUser';
const CHALLENGE_OPERATION = 'CompleteTwoFactorUser';

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

async function stubOperation<TOutcome extends string>(
  page: Page,
  operation: string,
  replies: Readonly<Record<TOutcome, SignInReply>>,
  fallback: TOutcome,
  outcomes: readonly (TOutcome | SignInReply)[]
): Promise<StubbedSignIn> {
  const calls: RecordedSignIn[] = [];
  const count = (): number => calls.length;
  const pick = (outcome: TOutcome | SignInReply | undefined): SignInReply =>
    typeof outcome === 'function' ? outcome : replies[outcome ?? fallback];

  await page.route(GRAPHQL_URL, async (route: Route) => {
    if (bodyOf(route.request())?.operationName !== operation) return route.fallback();
    calls.push(recordOf(route.request()));
    return pick(outcomes[Math.min(count(), outcomes.length) - 1])(route);
  });
  return { calls, count };
}

export function stubSignIn(
  page: Page,
  outcomes: readonly (SignInOutcome | SignInReply)[] = ['session']
): Promise<StubbedSignIn> {
  return stubOperation(page, SIGN_IN_OPERATION, SIGN_IN_REPLIES, 'session', outcomes);
}

export const CHALLENGE_ACCESS_TOKEN = 'e2e-challenge-token';

export type ChallengeOutcome =
  | 'completed'
  | 'invalid_code'
  | 'expired_session'
  | 'locked'
  | 'rate_limited'
  | 'unavailable'
  | 'network';

const completion = (user: Record<string, unknown>): unknown => ({
  data: { completeTwoFactorUser: { user: { twoFactorEnabled: true, ...user } } },
});

export const CHALLENGE_REPLIES: Record<ChallengeOutcome, SignInReply> = {
  completed: (route) =>
    json(
      route,
      200,
      completion({ accessToken: CHALLENGE_ACCESS_TOKEN, recoveryCodesRemaining: null })
    ),
  invalid_code: (route) => json(route, 200, graphQLFailure('Invalid two-factor code.', 401)),
  expired_session: (route) =>
    json(route, 200, graphQLFailure('Invalid or expired two-factor session.', 401)),
  locked: (route) => json(route, 200, graphQLFailure('Account is locked.', 423)),
  rate_limited: (route) => route.fulfill({ status: 429, body: '' }),
  unavailable: (route) => route.fulfill({ status: 503, body: '' }),
  network: (route) => route.abort('failed'),
};

export function stubChallenge(
  page: Page,
  outcomes: readonly (ChallengeOutcome | SignInReply)[] = ['completed']
): Promise<StubbedSignIn> {
  return stubOperation(page, CHALLENGE_OPERATION, CHALLENGE_REPLIES, 'completed', outcomes);
}
