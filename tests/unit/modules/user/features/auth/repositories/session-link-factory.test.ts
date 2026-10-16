import { ApolloLink, Observable, execute, gql } from '@apollo/client';
import type { StoreApi } from 'zustand';

import type { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type { ObservabilityService } from '@/services/types/observability/observability';
import SessionLinkFactory from '@auth/repositories/session-link-factory';
import { CLEARED_AUTH_STATE } from '@auth/stores/use-auth-store';
import type { AuthState } from '@auth/types/auth-store';
import { buildToken } from '@tests/builders';

const operationOf = (name: string): ReturnType<typeof gql> => gql`
  query ${name} {
    field
  }
`;

interface Harness {
  readonly link: ApolloLink;
  readonly setState: jest.Mock;
  readonly clearUser: jest.Mock;
  readonly signOut: jest.Mock;
  readonly headers: Array<Record<string, string> | undefined>;
}

const harness = (token: string | null, terminal: ApolloLink | null = null): Harness => {
  const setState = jest.fn();
  const clearUser = jest.fn();
  const signOut = jest.fn();
  const headers: Harness['headers'] = [];
  const store = { getState: () => ({ token }), setState } as unknown as StoreApi<AuthState>;
  const factory = new SessionLinkFactory(
    store,
    { signOut } as unknown as SandboxDemoSessionProvider,
    { clearUser } as unknown as ObservabilityService
  );
  const recorder = new ApolloLink((operation) => {
    headers.push(operation.getContext().headers as Record<string, string> | undefined);
    return Observable.of({ data: { field: 'value' } });
  });
  return {
    link: factory.build().concat(terminal ?? recorder),
    setState,
    clearUser,
    signOut,
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

const unauthorized = new ApolloLink(
  () =>
    new Observable((observer) =>
      observer.error(Object.assign(new Error('Response not successful'), { statusCode: 401 }))
    )
);

describe('SessionLinkFactory', () => {
  it('sends the token read from the store as a Bearer header', async () => {
    const token = buildToken();
    const { link, headers } = harness(token);

    await send(link, 'Profile');

    expect(headers[0]).toEqual({ Authorization: `Bearer ${token}` });
  });

  it('sends no Authorization header without a token', async () => {
    const { link, headers } = harness(null);

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
    const { link, headers } = harness(buildToken());

    await send(link, name);

    expect(headers[0]).toBeUndefined();
  });

  it('ends the session on a transport 401 and keeps the error for the caller', async () => {
    const { link, setState, clearUser, signOut } = harness(buildToken(), unauthorized);

    const outcome = await send(link, 'Profile');

    expect(outcome).toBeInstanceOf(Error);
    expect(clearUser).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(setState).toHaveBeenCalledWith(CLEARED_AUTH_STATE);
  });

  it('ends the session into exactly the state a sign-out leaves', async () => {
    const { link, setState } = harness(buildToken(), unauthorized);

    await send(link, 'Profile');

    expect(setState.mock.calls[0]?.[0]).toStrictEqual(CLEARED_AUTH_STATE);
  });

  it('leaves the session alone when an anonymous operation is answered with 401', async () => {
    const { link, setState, clearUser, signOut } = harness(buildToken(), unauthorized);

    await send(link, 'ConfirmPasswordReset');

    expect([clearUser, signOut, setState].map((spy) => spy.mock.calls.length)).toEqual([0, 0, 0]);
  });

  it.each([403, 429, 503])('leaves the session alone on a transport %i', async (statusCode) => {
    const failing = new ApolloLink(
      () =>
        new Observable((observer) =>
          observer.error(Object.assign(new Error('failed'), { statusCode }))
        )
    );
    const { link, setState } = harness(buildToken(), failing);

    await send(link, 'Profile');

    expect(setState).not.toHaveBeenCalled();
  });

  it('leaves the session alone on a network error without a status', async () => {
    const failing = new ApolloLink(
      () => new Observable((observer) => observer.error(new TypeError('Failed to fetch')))
    );
    const { link, setState } = harness(buildToken(), failing);

    await send(link, 'Profile');

    expect(setState).not.toHaveBeenCalled();
  });
});
