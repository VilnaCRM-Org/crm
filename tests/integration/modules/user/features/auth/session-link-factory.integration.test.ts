import { gql, type ApolloClient, type NormalizedCacheObject } from '@apollo/client';
import { HttpResponse } from 'msw';
import { createStore } from 'zustand/vanilla';

import '../../../../setup';
import container from '@/config/dependency-injection-config';
import AUTH_TOKENS from '@/modules/user/config/tokens';
import OBSERVABILITY_TOKENS from '@/services/observability/tokens';
import SessionLinkFactory from '@auth/repositories/session-link-factory';
import { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type { AuthState } from '@auth/types/auth-store';
import { buildEmail, buildToken } from '@tests/builders';

import server, { userServiceGraphql } from '../../../../mocks/server';

const authStore = createStore<AuthState>()(() => ({ ...CLEARED_AUTH_STATE }));
const observability = { clearUser: jest.fn(), captureError: jest.fn() };
const sandboxDemoSession = { signOut: jest.fn() };
const scope = container.createChildContainer();
scope.register(AUTH_TOKENS.AuthStore, { useValue: authStore });
scope.register(OBSERVABILITY_TOKENS.ObservabilityService, { useValue: observability });
scope.register(AUTH_TOKENS.SandboxDemoSessionProvider, { useValue: sandboxDemoSession });

const client = scope.resolve<ApolloClient<NormalizedCacheObject>>(AUTH_TOKENS.ApolloClient);

const PROFILE = gql`
  query Profile {
    field
  }
`;

const mutationOf = (name: string): ReturnType<typeof gql> => gql`
  mutation ${name} {
    field
  }
`;

const answerQuery = (respond: () => Response): Array<string | null> => {
  const authorization: Array<string | null> = [];
  server.use(
    userServiceGraphql.query('Profile', ({ request }) => {
      authorization.push(request.headers.get('authorization'));
      return respond();
    })
  );
  return authorization;
};

const ok = (): Response => HttpResponse.json({ data: { field: 'value' } });

const problem = (status: number): Response =>
  HttpResponse.json({ title: 'An error occurred', status }, { status });

const sendProfile = (): Promise<unknown> =>
  client.query({ query: PROFILE, fetchPolicy: 'no-cache' }).catch((error: unknown) => error);

describe('SessionLinkFactory over the container Apollo client', () => {
  const { clearUser } = observability;
  const { signOut } = sandboxDemoSession;
  const setState = jest.spyOn(authStore, 'setState');

  beforeEach(() => {
    authStore.setState({ ...CLEARED_AUTH_STATE, token: buildToken() });
    jest.clearAllMocks();
  });

  it('resolves one singleton factory', () => {
    const factory = container.resolve<SessionLinkFactory>(AUTH_TOKENS.SessionLinkFactory);

    expect(factory).toBeInstanceOf(SessionLinkFactory);
    expect(container.resolve(AUTH_TOKENS.SessionLinkFactory)).toBe(factory);
  });

  it('sends the live token as a Bearer header and follows a token change', async () => {
    const first = buildToken();
    const second = buildToken();
    const authorization = answerQuery(ok);

    authStore.setState({ token: first });
    await sendProfile();
    authStore.setState({ token: second });
    await sendProfile();

    expect(authorization).toEqual([`Bearer ${first}`, `Bearer ${second}`]);
  });

  it('sends no Authorization header after a signed-out write', async () => {
    const authorization = answerQuery(ok);

    await sendProfile();
    authStore.setState({ token: null });
    await sendProfile();

    expect(authorization[1]).toBeNull();
  });

  it('keeps the correlation headers beside the Authorization header', async () => {
    const headers: Headers[] = [];
    server.use(
      userServiceGraphql.query('Profile', ({ request }) => {
        headers.push(request.headers);
        return ok();
      })
    );

    await sendProfile();

    expect(headers[0]?.get('x-request-id')).toEqual(expect.any(String));
    expect(headers[0]?.get('x-correlation-id')).toEqual(expect.any(String));
    expect(headers[0]?.get('authorization')).toMatch(/^Bearer /);
  });

  it.each([
    'CreateUser',
    'RequestPasswordReset',
    'ConfirmPasswordReset',
    'SignInUser',
    'CompleteTwoFactorUser',
  ])('sends %s anonymously and never ends the session on its 401', async (name) => {
    const token = buildToken();
    const authorization: Array<string | null> = [];
    server.use(
      userServiceGraphql.mutation(name, ({ request }) => {
        authorization.push(request.headers.get('authorization'));
        return problem(401);
      })
    );
    authStore.setState({ token });

    await client.mutate({ mutation: mutationOf(name) }).catch((error: unknown) => error);

    expect(authorization).toEqual([null]);
    expect(authStore.getState().token).toBe(token);
    expect(clearUser).not.toHaveBeenCalled();
  });

  it('ends the session on a transport 401 and still rejects the caller', async () => {
    answerQuery(() => problem(401));
    authStore.setState({ email: buildEmail() });
    setState.mockClear();

    const error = await sendProfile();

    expect(error).toBeInstanceOf(Error);
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenLastCalledWith(CLEARED_AUTH_STATE);
    expect(authStore.getState()).toEqual(CLEARED_AUTH_STATE);
    expect(clearUser.mock.invocationCallOrder[0]).toBeLessThan(
      signOut.mock.invocationCallOrder[0] as number
    );
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(
      setState.mock.invocationCallOrder[0] as number
    );
  });

  it("leaves a newer session alone when a 401 answers an earlier token's request", async () => {
    const later = buildToken();
    answerQuery(() => {
      authStore.setState({ token: later });
      return problem(401);
    });

    await sendProfile();

    expect(authStore.getState().token).toBe(later);
    expect(clearUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each([
    ['a GraphQL 401 at HTTP 200', { message: 'Unauthorized', extensions: { status: 401 } }],
    ['Access Denied. without a status', { message: 'Access Denied.' }],
    [
      'Access Denied. with status 403',
      { message: 'Access Denied.', extensions: { status: 403, code: 'FORBIDDEN' } },
    ],
  ])('keeps the token on %s', async (_name, graphQLError) => {
    const token = authStore.getState().token;
    answerQuery(() => HttpResponse.json({ data: null, errors: [graphQLError] }));

    await sendProfile();

    expect(authStore.getState().token).toBe(token);
    expect(clearUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });

  it.each([429, 503])('keeps the token on a transport %i', async (status) => {
    const token = authStore.getState().token;
    answerQuery(() => problem(status));

    await sendProfile();

    expect(authStore.getState().token).toBe(token);
    expect(clearUser).not.toHaveBeenCalled();
  });
});
