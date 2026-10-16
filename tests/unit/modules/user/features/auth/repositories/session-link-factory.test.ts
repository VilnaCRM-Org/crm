import { ApolloLink, Observable, execute, gql } from '@apollo/client';
import type { StoreApi } from 'zustand';

import SessionLinkFactory from '@auth/repositories/session-link-factory';
import type { AuthSessionEndHandler } from '@auth/stores/auth-session-end-handler';
import type { AuthState } from '@auth/types/auth-store';
import { buildToken } from '@tests/builders';

const operationOf = (name: string): ReturnType<typeof gql> => gql`
  query ${name} {
    field
  }
`;

interface Harness {
  readonly link: ApolloLink;
  readonly endSession: jest.Mock;
  readonly headers: Array<Record<string, string> | undefined>;
}

const harness = (token: string | null, terminal: ApolloLink | null = null): Harness => {
  const endSession = jest.fn();
  const headers: Harness['headers'] = [];
  const store = {
    getState: () => ({ token }),
    setState: jest.fn(),
  } as unknown as StoreApi<AuthState>;
  const factory = new SessionLinkFactory(store, {
    endSession,
  } as unknown as AuthSessionEndHandler);
  const recorder = new ApolloLink((operation) => {
    headers.push(operation.getContext().headers as Record<string, string> | undefined);
    return Observable.of({ data: { field: 'value' } });
  });
  return {
    link: factory.build().concat(terminal ?? recorder),
    endSession,
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

  it('ends the session through the sign-out handler on a transport 401', async () => {
    const { link, endSession } = harness(buildToken(), unauthorized);

    const outcome = await send(link, 'Profile');

    expect(outcome).toBeInstanceOf(Error);
    expect(endSession).toHaveBeenCalledTimes(1);
    expect(endSession).toHaveBeenCalledWith();
  });

  it('leaves the session alone when an anonymous operation is answered with 401', async () => {
    const { link, endSession } = harness(buildToken(), unauthorized);

    await send(link, 'ConfirmPasswordReset');

    expect(endSession).not.toHaveBeenCalled();
  });

  it.each([403, 429, 503])('leaves the session alone on a transport %i', async (statusCode) => {
    const failing = new ApolloLink(
      () =>
        new Observable((observer) =>
          observer.error(Object.assign(new Error('failed'), { statusCode }))
        )
    );
    const { link, endSession } = harness(buildToken(), failing);

    await send(link, 'Profile');

    expect(endSession).not.toHaveBeenCalled();
  });

  it('leaves the session alone on a network error without a status', async () => {
    const failing = new ApolloLink(
      () => new Observable((observer) => observer.error(new TypeError('Failed to fetch')))
    );
    const { link, endSession } = harness(buildToken(), failing);

    await send(link, 'Profile');

    expect(endSession).not.toHaveBeenCalled();
  });
});
