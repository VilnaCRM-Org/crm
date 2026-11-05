import { ApolloLink, Observable, execute, gql } from '@apollo/client';
import type { StoreApi } from 'zustand';

import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import UserServiceErrorTransformer from '@/modules/user/transformers';
import type { ObservabilityService } from '@/services/types/observability/observability';
import SessionLinkFactory from '@auth/repositories/session-link-factory';
import type { AuthState } from '@auth/types/auth-store';
import { buildEmail, buildToken } from '@tests/builders';

const operationOf = (name: string): ReturnType<typeof gql> => gql`
  query ${name} {
    field
  }
`;

interface SessionBox {
  token: string | null;
}

interface Harness {
  readonly link: ApolloLink;
  readonly clearUser: jest.Mock;
  readonly signOut: jest.Mock;
  readonly setState: jest.Mock;
  readonly signedOut: AuthState;
  readonly headers: Array<Record<string, string> | undefined>;
}

const harness = (session: SessionBox, terminal: ApolloLink | null = null): Harness => {
  const clearUser = jest.fn();
  const signOut = jest.fn();
  const setState = jest.fn();
  const signedOut = { email: buildEmail(), token: null } as AuthState;
  const headers: Harness['headers'] = [];
  const factory = new SessionLinkFactory({
    authStore: {
      getState: () => ({ token: session.token }),
      setState,
    } as unknown as StoreApi<AuthState>,
    signedOut,
    sandboxDemoSession: { signOut } as unknown as SandboxDemoSessionProvider,
    observability: { clearUser } as unknown as ObservabilityService,
    errors: new UserServiceErrorTransformer(),
  });
  const recorder = new ApolloLink((operation) => {
    headers.push(operation.getContext().headers as Record<string, string> | undefined);
    return Observable.of({ data: { field: 'value' } });
  });
  return {
    link: factory.build().concat(terminal ?? recorder),
    clearUser,
    signOut,
    setState,
    signedOut,
    headers,
  };
};

const send = (link: ApolloLink, name: string): Promise<unknown> =>
  new Promise((resolve) => {
    execute(link, { query: operationOf(name) }).subscribe({
      complete: () => resolve('complete'),
      error: (error: unknown) => resolve(error),
    });
  });

const unauthorizedError = (): Error =>
  Object.assign(new Error('Response not successful'), { statusCode: 401 });

const failing = (error: Error, beforeError: () => void = (): void => undefined): ApolloLink =>
  new ApolloLink(
    () =>
      new Observable((observer) => {
        beforeError();
        observer.error(error);
      })
  );

const unauthorized = failing(unauthorizedError());

describe('SessionLinkFactory', () => {
  it('sends the token read from the store as a Bearer header', async () => {
    const token = buildToken();
    const { link, headers } = harness({ token });

    await send(link, 'Profile');

    expect(headers[0]).toEqual({ Authorization: `Bearer ${token}` });
  });

  it('sends no Authorization header without a token', async () => {
    const { link, headers } = harness({ token: null });

    await send(link, 'Profile');

    expect(headers[0]).toBeUndefined();
  });

  it.each([
    'CreateUser',
    'RequestPasswordReset',
    'ConfirmPasswordReset',
    'SignInUser',
    'CompleteTwoFactorUser',
  ])('sends %s without an Authorization header', async (name) => {
    const { link, headers } = harness({ token: buildToken() });

    await send(link, name);

    expect(headers[0]).toBeUndefined();
  });

  it('ends the session like logout() on a transport 401 and passes the error on', async () => {
    const { link, clearUser, signOut, setState, signedOut } = harness(
      { token: buildToken() },
      unauthorized
    );

    const outcome = await send(link, 'Profile');

    expect(outcome).toBeInstanceOf(Error);
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledWith(signedOut);
    expect(clearUser.mock.invocationCallOrder[0]).toBeLessThan(
      signOut.mock.invocationCallOrder[0] as number
    );
    expect(signOut.mock.invocationCallOrder[0]).toBeLessThan(
      setState.mock.invocationCallOrder[0] as number
    );
  });

  it('ends the session on a status-only 401, the read the error transformer makes', async () => {
    const statusOnly = new ApolloLink(
      () =>
        new Observable((observer) =>
          observer.error(Object.assign(new Error('Unauthorized'), { status: 401 }))
        )
    );
    const { link, setState } = harness({ token: buildToken() }, statusOnly);

    await send(link, 'Profile');

    expect(setState).toHaveBeenCalledTimes(1);
  });

  it('leaves the session alone when an anonymous operation is answered with 401', async () => {
    const { link, clearUser, signOut, setState } = harness({ token: buildToken() }, unauthorized);

    await send(link, 'ConfirmPasswordReset');

    expect(clearUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });

  it("leaves a newer session alone when a 401 answers an earlier token's request", async () => {
    const session: SessionBox = { token: buildToken() };
    const later = buildToken();
    const rotating = failing(unauthorizedError(), () => {
      session.token = later;
    });
    const { link, clearUser, signOut, setState } = harness(session, rotating);

    await send(link, 'Profile');

    expect(clearUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });

  it('leaves a signed-out store alone when a 401 answers a pre-sign-out request', async () => {
    const session: SessionBox = { token: buildToken() };
    const signingOut = failing(unauthorizedError(), () => {
      session.token = null;
    });
    const { link, clearUser, signOut, setState } = harness(session, signingOut);

    await send(link, 'Profile');

    expect(clearUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });

  it('leaves the store alone when a 401 answers a request that carried no token', async () => {
    const { link, clearUser, signOut, setState } = harness({ token: null }, unauthorized);

    await send(link, 'Profile');

    expect(clearUser).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });

  it.each([403, 429, 503])('leaves the session alone on a transport %i', async (statusCode) => {
    const rejecting = failing(Object.assign(new Error('failed'), { statusCode }));
    const { link, setState } = harness({ token: buildToken() }, rejecting);

    await send(link, 'Profile');

    expect(setState).not.toHaveBeenCalled();
  });

  it('leaves the session alone on a GraphQL error at HTTP 200', async () => {
    const graphQLFailure = new ApolloLink(() =>
      Observable.of({
        data: null,
        errors: [{ message: 'Unauthorized', extensions: { status: 401 } }],
      })
    );
    const { link, setState } = harness({ token: buildToken() }, graphQLFailure);

    await send(link, 'Profile');

    expect(setState).not.toHaveBeenCalled();
  });

  it('leaves the session alone on a network error without a status', async () => {
    const rejecting = failing(new TypeError('Failed to fetch'));
    const { link, setState } = harness({ token: buildToken() }, rejecting);

    await send(link, 'Profile');

    expect(setState).not.toHaveBeenCalled();
  });
});
