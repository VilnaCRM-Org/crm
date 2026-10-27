import { buildCredentials, buildToken } from '@tests/builders';

import {
  SIGN_IN_ACCESS_TOKEN,
  SIGN_IN_PENDING_SESSION_ID,
  SIGN_IN_REPLIES,
  replyWithUnauthenticated,
  stubSignIn,
} from '../../e2e/utils/two-factor-responses';

type PageTarget = Parameters<typeof stubSignIn>[0];
type RouteHandler = (route: unknown) => Promise<unknown>;

interface FakeRoute {
  request: () => {
    postDataJSON: () => unknown;
    headers: () => Record<string, string>;
    url: () => string;
  };
  fulfill: jest.Mock;
  abort: jest.Mock;
  fallback: jest.Mock;
}

const ENDPOINT = 'http://localhost:4000/graphql';

const fakeRoute = (body: unknown, headers: Record<string, string> = {}): FakeRoute => ({
  request: () => ({ postDataJSON: () => body, headers: () => headers, url: () => ENDPOINT }),
  fulfill: jest.fn().mockResolvedValue(undefined),
  abort: jest.fn().mockResolvedValue(undefined),
  fallback: jest.fn().mockResolvedValue(undefined),
});

const signInBody = (variables?: Record<string, unknown>): unknown => ({
  operationName: 'SignInUser',
  ...(variables === undefined ? {} : { variables }),
});

const register = async (
  outcomes?: Parameters<typeof stubSignIn>[1]
): Promise<{
  handler: RouteHandler;
  route: jest.Mock;
  stub: Awaited<ReturnType<typeof stubSignIn>>;
}> => {
  const route = jest.fn().mockResolvedValue(undefined);
  const stub = await stubSignIn({ route } as unknown as PageTarget, outcomes);
  const [, handler] = route.mock.calls[0] as [unknown, RouteHandler];
  return { handler, route, stub };
};

const bodyOf = (route: FakeRoute): unknown =>
  JSON.parse((route.fulfill.mock.calls[0] as [{ body: string }])[0].body);

describe('stubSignIn', () => {
  it('registers one handler on the graphql glob', async () => {
    const { route } = await register();

    expect(route).toHaveBeenCalledTimes(1);
    expect(route.mock.calls[0]?.[0]).toBe('**/graphql');
  });

  it('answers SignInUser with a session by default', async () => {
    const { handler } = await register();
    const route = fakeRoute(signInBody());

    await handler(route);

    expect(route.fulfill).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, contentType: 'application/json' })
    );
    expect(bodyOf(route)).toEqual({
      data: {
        signInUser: {
          user: {
            success: true,
            twoFactorEnabled: false,
            accessToken: SIGN_IN_ACCESS_TOKEN,
            pendingSessionId: null,
          },
        },
      },
    });
  });

  it('answers SignInUser with a challenge', async () => {
    const { handler } = await register(['challenge']);
    const route = fakeRoute(signInBody());

    await handler(route);

    expect(bodyOf(route)).toEqual({
      data: {
        signInUser: {
          user: {
            success: true,
            twoFactorEnabled: true,
            accessToken: null,
            pendingSessionId: SIGN_IN_PENDING_SESSION_ID,
          },
        },
      },
    });
  });

  it.each([
    ['unauthenticated', 'Invalid credentials.', 401],
    ['violation', 'email: This value is not a valid email address.', 422],
    ['locked', 'Account is locked.', 423],
  ] as const)(
    'answers a %s failure as a GraphQL error carrying status %i',
    async (outcome, message, status) => {
      const { handler } = await register([outcome]);
      const route = fakeRoute(signInBody());

      await handler(route);

      expect(route.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 200 }));
      expect(bodyOf(route)).toEqual({ data: null, errors: [{ message, extensions: { status } }] });
    }
  );

  it.each([
    ['rate_limited', 429],
    ['unavailable', 503],
  ] as const)('answers %s with an empty HTTP %i response', async (outcome, status) => {
    const { handler } = await register([outcome]);
    const route = fakeRoute(signInBody());

    await handler(route);

    expect(route.fulfill).toHaveBeenCalledWith({ status, body: '' });
  });

  it('aborts the request for the network outcome', async () => {
    const { handler } = await register(['network']);
    const route = fakeRoute(signInBody());

    await handler(route);

    expect(route.abort).toHaveBeenCalledWith('failed');
    expect(route.fulfill).not.toHaveBeenCalled();
  });

  it('walks the outcomes per call and repeats the last one', async () => {
    const { handler } = await register(['locked', 'challenge']);
    const first = fakeRoute(signInBody());
    const second = fakeRoute(signInBody());
    const third = fakeRoute(signInBody());

    await handler(first);
    await handler(second);
    await handler(third);

    expect(first.fulfill).toHaveBeenCalledWith(expect.objectContaining({ status: 200 }));
    expect(bodyOf(first)).toHaveProperty('errors');
    expect(bodyOf(second)).toHaveProperty('data.signInUser.user.twoFactorEnabled', true);
    expect(bodyOf(third)).toHaveProperty('data.signInUser.user.twoFactorEnabled', true);
  });

  it('falls back to a session when no outcome is given', async () => {
    const { handler } = await register([]);
    const route = fakeRoute(signInBody());

    await handler(route);

    expect(bodyOf(route)).toHaveProperty('data.signInUser.user.accessToken', SIGN_IN_ACCESS_TOKEN);
  });

  it('records the variables, Authorization header and url of every sign-in call', async () => {
    const { handler, stub } = await register();
    const variables = { input: buildCredentials() };
    const authorization = `Bearer ${buildToken()}`;

    await handler(fakeRoute(signInBody(variables), { authorization }));
    await handler(fakeRoute(signInBody()));

    expect(stub.count()).toBe(2);
    expect(stub.calls).toEqual([
      { variables, authorization, url: ENDPOINT },
      { variables: {}, authorization: undefined, url: ENDPOINT },
    ]);
  });

  it('falls back for every other operation without recording it', async () => {
    const { handler, stub } = await register();
    const other = fakeRoute({ operationName: 'CurrentUser' });

    await handler(other);

    expect(other.fallback).toHaveBeenCalledTimes(1);
    expect(other.fulfill).not.toHaveBeenCalled();
    expect(stub.count()).toBe(0);
  });

  it('falls back for a request without a body', async () => {
    const { handler, stub } = await register();
    const empty = fakeRoute(null);

    await handler(empty);

    expect(empty.fallback).toHaveBeenCalledTimes(1);
    expect(stub.count()).toBe(0);
  });

  it('answers with a caller-supplied reply in place of a named outcome', async () => {
    const message = 'Account bob@example.com is unknown';
    const { handler } = await register([replyWithUnauthenticated(message), 'challenge']);
    const first = fakeRoute(signInBody());
    const second = fakeRoute(signInBody());

    await handler(first);
    await handler(second);

    expect(bodyOf(first)).toEqual({
      data: null,
      errors: [{ message, extensions: { status: 401 } }],
    });
    expect(bodyOf(second)).toHaveProperty('data.signInUser.user.twoFactorEnabled', true);
  });

  it('covers every outcome with a reply', () => {
    expect(Object.keys(SIGN_IN_REPLIES).sort()).toEqual(
      [
        'challenge',
        'locked',
        'network',
        'rate_limited',
        'session',
        'unauthenticated',
        'unavailable',
        'violation',
      ].sort()
    );
  });
});
