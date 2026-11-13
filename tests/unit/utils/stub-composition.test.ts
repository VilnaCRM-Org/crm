import { stubProfile } from '../../e2e/modules/user/features/settings/utils/profile-stub';
import { stubChallenge, stubSignIn } from '../../e2e/utils/two-factor-responses';

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

const fakeRoute = (operationName: string): FakeRoute => ({
  request: () => ({
    postDataJSON: () => ({ operationName, variables: {} }),
    headers: () => ({}),
    url: () => 'http://localhost:4000/graphql',
  }),
  fulfill: jest.fn().mockResolvedValue(undefined),
  abort: jest.fn().mockResolvedValue(undefined),
  fallback: jest.fn().mockResolvedValue(undefined),
});

const handlers: RouteHandler[] = [];

const page = {
  route: jest.fn(async (_glob: string, handler: RouteHandler) => {
    handlers.push(handler);
  }),
};

type StubPage = Parameters<typeof stubSignIn>[0];

const dispatch = async (operationName: string): Promise<FakeRoute> => {
  const route = fakeRoute(operationName);
  const chain = [...handlers].reverse();
  const next = async (index: number): Promise<void> => {
    const handler = chain[index];
    if (handler === undefined) return;
    route.fallback.mockImplementationOnce(() => next(index + 1));
    await handler(route);
  };
  await next(0);
  return route;
};

describe.each([
  ['sign-in registered first', ['signIn', 'profile']],
  ['profile registered first', ['profile', 'signIn']],
] as const)('GraphQL stubs composed with %s', (_name, order) => {
  beforeEach(async () => {
    handlers.length = 0;
    for (const which of order) {
      if (which === 'signIn') await stubSignIn(page as unknown as StubPage);
      else await stubProfile(page as unknown as Parameters<typeof stubProfile>[0]);
    }
  });

  it('answers SignInUser through the sign-in stub only', async () => {
    const route = await dispatch('SignInUser');

    expect(route.fulfill).toHaveBeenCalledTimes(1);
    expect(JSON.parse((route.fulfill.mock.calls[0] as [{ body: string }])[0].body)).toHaveProperty(
      'data.signInUser'
    );
  });

  it('answers CurrentUser through the profile stub only', async () => {
    const route = await dispatch('CurrentUser');

    expect(route.fulfill).toHaveBeenCalledTimes(1);
    expect(JSON.parse((route.fulfill.mock.calls[0] as [{ body: string }])[0].body)).toHaveProperty(
      'data.users'
    );
  });

  it('lets an operation neither stub owns fall through every handler', async () => {
    const route = await dispatch('SomethingElse');

    expect(route.fulfill).not.toHaveBeenCalled();
    expect(route.fallback.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('stubChallenge composed with stubSignIn', () => {
  it('answers each operation only through its own stub', async () => {
    handlers.length = 0;
    await stubSignIn(page as unknown as StubPage, ['challenge']);
    await stubChallenge(page as unknown as StubPage);

    const signIn = await dispatch('SignInUser');
    const challenge = await dispatch('CompleteTwoFactorUser');

    expect(JSON.parse((signIn.fulfill.mock.calls[0] as [{ body: string }])[0].body)).toHaveProperty(
      'data.signInUser.user.pendingSessionId'
    );
    expect(
      JSON.parse((challenge.fulfill.mock.calls[0] as [{ body: string }])[0].body)
    ).toHaveProperty('data.completeTwoFactorUser.user.accessToken');
  });
});
