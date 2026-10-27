import {
  CONFIRM_REPLIES,
  RECOVERY_CODES,
  SETUP_REPLIES,
  SETUP_SECRET,
  SETUP_URI,
  stubConfirm,
  stubSetup,
} from '../../e2e/utils/two-factor-settings-responses';

type PageTarget = Parameters<typeof stubSetup>[0];
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

const fakeRoute = (operationName: string, variables: unknown = {}): FakeRoute => ({
  request: () => ({
    postDataJSON: () => ({ operationName, variables }),
    headers: () => ({ authorization: 'Bearer seeded' }),
    url: () => ENDPOINT,
  }),
  fulfill: jest.fn().mockResolvedValue(undefined),
  abort: jest.fn().mockResolvedValue(undefined),
  fallback: jest.fn().mockResolvedValue(undefined),
});

const bodyOf = (route: FakeRoute): unknown =>
  JSON.parse((route.fulfill.mock.calls[0] as [{ body: string }])[0].body);

interface Registered {
  readonly handler: RouteHandler;
  readonly route: jest.Mock;
}

const capture = (route: jest.Mock): Registered => {
  const [, handler] = route.mock.calls[0] as [unknown, RouteHandler];
  return { handler, route };
};

const registerSetup = async (outcomes?: Parameters<typeof stubSetup>[1]): Promise<Registered> => {
  const route = jest.fn().mockResolvedValue(undefined);
  await stubSetup({ route } as unknown as PageTarget, outcomes);
  return capture(route);
};

const registerConfirm = async (
  outcomes?: Parameters<typeof stubConfirm>[1]
): Promise<Registered> => {
  const route = jest.fn().mockResolvedValue(undefined);
  await stubConfirm({ route } as unknown as PageTarget, outcomes);
  return capture(route);
};

describe('stubSetup', () => {
  it('registers one handler on the graphql glob and answers setup with the secret', async () => {
    const { handler, route } = await registerSetup();
    const call = fakeRoute('SetupTwoFactorUser');

    await handler(call);

    expect(route).toHaveBeenCalledTimes(1);
    expect(route.mock.calls[0]?.[0]).toBe('**/graphql');
    expect(bodyOf(call)).toEqual({
      data: { setupTwoFactorUser: { user: { otpauthUri: SETUP_URI, secret: SETUP_SECRET } } },
    });
  });

  it('builds the otpauth URI around the exported secret', () => {
    expect(SETUP_URI).toContain(`secret=${SETUP_SECRET}`);
    expect(SETUP_URI.startsWith('otpauth://totp/')).toBe(true);
  });

  it('answers the 409 already-enabled failure as a GraphQL error with status 409', async () => {
    const { handler } = await registerSetup(['already_enabled']);
    const call = fakeRoute('SetupTwoFactorUser');

    await handler(call);

    expect(bodyOf(call)).toEqual({
      data: null,
      errors: [
        {
          message: 'Two-factor authentication is already enabled.',
          extensions: { status: 409 },
        },
      ],
    });
  });

  it.each([
    ['rate_limited', 429],
    ['unavailable', 503],
  ] as const)('answers %s with an empty HTTP %i response', async (outcome, status) => {
    const { handler } = await registerSetup([outcome]);
    const call = fakeRoute('SetupTwoFactorUser');

    await handler(call);

    expect(call.fulfill).toHaveBeenCalledWith({ status, body: '' });
  });

  it('aborts the request for the network outcome', async () => {
    const { handler } = await registerSetup(['network']);
    const call = fakeRoute('SetupTwoFactorUser');

    await handler(call);

    expect(call.abort).toHaveBeenCalledWith('failed');
  });

  it('records only setup calls, with the Authorization header, and passes others on', async () => {
    const { handler } = await registerSetup();
    const other = fakeRoute('ConfirmTwoFactorUser');

    await handler(other);

    expect(other.fallback).toHaveBeenCalledTimes(1);
    expect(other.fulfill).not.toHaveBeenCalled();
  });

  it('walks the outcomes per call and repeats the last one', async () => {
    const { handler } = await registerSetup(['rate_limited', 'created']);
    const calls = [
      fakeRoute('SetupTwoFactorUser'),
      fakeRoute('SetupTwoFactorUser'),
      fakeRoute('SetupTwoFactorUser'),
    ];
    for (const call of calls) await handler(call);

    expect(calls[0]?.fulfill).toHaveBeenCalledWith({ status: 429, body: '' });
    expect(bodyOf(calls[1] as FakeRoute)).toHaveProperty('data.setupTwoFactorUser');
    expect(bodyOf(calls[2] as FakeRoute)).toHaveProperty('data.setupTwoFactorUser');
  });

  it('covers every outcome with a reply', () => {
    expect(Object.keys(SETUP_REPLIES).sort()).toEqual(
      ['already_enabled', 'created', 'network', 'rate_limited', 'unavailable'].sort()
    );
  });
});

describe('stubConfirm', () => {
  it('answers confirm with the eight recovery codes by default', async () => {
    const { handler } = await registerConfirm();
    const call = fakeRoute('ConfirmTwoFactorUser', { input: { twoFactorCode: '123456' } });

    await handler(call);

    expect(RECOVERY_CODES).toHaveLength(8);
    for (const code of RECOVERY_CODES) expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(bodyOf(call)).toEqual({
      data: { confirmTwoFactorUser: { user: { recoveryCodes: [...RECOVERY_CODES] } } },
    });
  });

  it.each([
    ['invalid_code', 'Invalid two-factor code.', 401],
    ['setup_not_initiated', 'Two-factor setup not initiated.', 401],
  ] as const)(
    'answers %s as a GraphQL error carrying status %i',
    async (outcome, message, status) => {
      const { handler } = await registerConfirm([outcome]);
      const call = fakeRoute('ConfirmTwoFactorUser');

      await handler(call);

      expect(bodyOf(call)).toEqual({ data: null, errors: [{ message, extensions: { status } }] });
    }
  );

  it.each([
    ['rate_limited', 429],
    ['unavailable', 503],
  ] as const)('answers %s with an empty HTTP %i response', async (outcome, status) => {
    const { handler } = await registerConfirm([outcome]);
    const call = fakeRoute('ConfirmTwoFactorUser');

    await handler(call);

    expect(call.fulfill).toHaveBeenCalledWith({ status, body: '' });
  });

  it('aborts the request for the network outcome and ignores other operations', async () => {
    const { handler } = await registerConfirm(['network']);
    const call = fakeRoute('ConfirmTwoFactorUser');
    const other = fakeRoute('SetupTwoFactorUser');

    await handler(call);
    await handler(other);

    expect(call.abort).toHaveBeenCalledWith('failed');
    expect(other.fallback).toHaveBeenCalledTimes(1);
  });

  it('covers every outcome with a reply', () => {
    expect(Object.keys(CONFIRM_REPLIES).sort()).toEqual(
      [
        'confirmed',
        'invalid_code',
        'network',
        'rate_limited',
        'setup_not_initiated',
        'unavailable',
      ].sort()
    );
  });
});
