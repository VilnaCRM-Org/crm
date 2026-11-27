import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import type { GraphQLSocialLinkTransformer } from '@/modules/user/features/settings/transformers';
import type UserServiceErrorTransformer from '@/modules/user/transformers';
import type { UserServiceFailure } from '@/modules/user/types/user-service/user-service-failure';
import { buildToken } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

const failureOf = (reason: UserServiceFailure['reason']): UserServiceFailure => ({
  reason,
  status: null,
  violations: { items: [], complete: true },
});

const normalized = failureOf('network');

const errors = { normalize: jest.fn((): UserServiceFailure => normalized) };

const isolatedTransformer = (): Promise<GraphQLSocialLinkTransformer> =>
  loadIsolated(async () => {
    const { GraphQLSocialLinkTransformer: Transformer } =
      await import('@/modules/user/features/settings/transformers');
    return new Transformer(errors as unknown as UserServiceErrorTransformer);
  });

const GENERIC = { kind: 'failed', reason: 'generic' };

const state = `link.${buildToken()}`;

const started = (authorizationUrl: string, issued = state): never =>
  ({ initiateSocialLinkUser: { user: { authorizationUrl, state: issued } } }) as never;

const refusal = (errorCode?: string): ApolloError =>
  new ApolloError({
    graphQLErrors: [
      { message: 'refused', ...(errorCode ? { extensions: { error_code: errorCode } } : {}) },
    ],
  });

describe('GraphQLSocialLinkTransformer', () => {
  let transformer: GraphQLSocialLinkTransformer;

  beforeEach(async () => {
    transformer = await isolatedTransformer();
  });

  it('reads the linked providers', () => {
    expect(
      transformer.toLinked({ linkedSocialProviders: ['google', 'facebook', 'github', 'twitter'] })
    ).toEqual({ kind: 'listed', linked: { items: ['google', 'facebook', 'github', 'twitter'] } });
  });

  it('ignores a provider the card does not show', () => {
    expect(transformer.toLinked({ linkedSocialProviders: ['apple', 'github'] })).toEqual({
      kind: 'listed',
      linked: { items: ['github'] },
    });
  });

  it('reads a failed list read as the end of the session only for a 401', () => {
    expect(transformer.toListFailure(failureOf('unauthenticated'))).toEqual({
      kind: 'failed',
      reason: 'session_ended',
    });
  });

  it.each(['aborted', 'network', 'server', 'access_denied', 'unknown'] as const)(
    'reads a %s list failure as unavailable',
    (reason) => {
      expect(transformer.toListFailure(failureOf(reason))).toEqual({
        kind: 'failed',
        reason: 'unavailable',
      });
    }
  );

  it('normalizes a caught error through the shared error transformer', () => {
    const caught = new Error('boom');
    const { signal } = new AbortController();

    expect(transformer.failure(caught, signal)).toBe(normalized);
    expect(errors.normalize.mock.calls).toEqual([[caught, signal]]);
  });

  it.each([undefined, null, {}, { linkedSocialProviders: [1] }])(
    'refuses the malformed list %j',
    (payload) => {
      expect(() => transformer.toLinked(payload as never)).toThrow();
    }
  );

  it.each(['https://provider.example/authorize?a=b', 'http://localhost:8080/consent'])(
    'starts at %s',
    (authorizationUrl) => {
      expect(transformer.toStart(started(authorizationUrl))).toEqual({
        kind: 'started',
        authorizationUrl,
        state,
      });
    }
  );

  it.each([
    ['a script URL', started('javascript:alert(1)')],
    ['a URL that only ends like http', started('xhttp://provider.example')],
    ['a URL that only starts like https', started('httpsx://provider.example')],
    ['a relative URL', started('/authorize')],
    ['an unmarked state', started('https://provider.example', buildToken())],
    ['a state that only contains the mark', started('https://provider.example', 'a-link.b')],
    ['a state that is the mark alone', started('https://provider.example', 'link.')],
    ['no payload field', {} as never],
  ])('refuses to start with %s', (_name, payload) => {
    expect(() => transformer.toStart(payload)).toThrow();
  });

  it.each([
    ['no user', { initiateSocialLinkUser: { user: null } } as never],
    ['no payload', { initiateSocialLinkUser: null } as never],
    ['nothing', null],
  ])('answers the contract-legal %s as a generic failure', (_name, payload) => {
    expect(transformer.toStart(payload)).toEqual(GENERIC);
  });

  it('reads a completed link', () => {
    expect(
      transformer.toCompleted({ completeSocialLinkUser: { user: { success: true } } })
    ).toEqual({ kind: 'changed' });
  });

  it('reads a removed link', () => {
    expect(
      transformer.toUnlinked({ unlinkSocialProviderUser: { user: { success: true } } })
    ).toEqual({ kind: 'changed' });
  });

  it.each([null, { user: null }, { user: { success: false } }])(
    'answers the unsuccessful answer %j as a generic failure',
    (answer) => {
      expect(transformer.toCompleted({ completeSocialLinkUser: answer })).toEqual(GENERIC);
      expect(transformer.toUnlinked({ unlinkSocialProviderUser: answer })).toEqual(GENERIC);
    }
  );

  it('answers an empty change as a generic failure', () => {
    expect(transformer.toCompleted(null)).toEqual(GENERIC);
    expect(transformer.toUnlinked(null)).toEqual(GENERIC);
  });

  it.each([{}, { user: {} }, { user: { success: 'yes' } }])(
    'refuses the malformed answer %j',
    (answer) => {
      expect(() => transformer.toCompleted({ completeSocialLinkUser: answer as never })).toThrow();
      expect(() => transformer.toUnlinked({ unlinkSocialProviderUser: answer as never })).toThrow();
    }
  );

  it.each([
    ['identity_linked_to_other_user', 'already_linked'],
    ['provider_already_linked', 'provider_linked'],
    ['last_sign_in_method', 'last_method'],
    ['invalid_state', 'expired'],
    ['state_expired', 'expired'],
    ['provider_unavailable', 'unavailable'],
    ['anything_else', 'generic'],
    [undefined, 'generic'],
  ])('reads the refusal %s as %s', (errorCode, reason) => {
    expect(transformer.toFailure(refusal(errorCode), failureOf('unknown'))).toEqual({
      kind: 'failed',
      reason,
    });
  });

  it('reads the refusal code before the status it came with', () => {
    expect(transformer.toFailure(refusal('invalid_state'), failureOf('server'))).toEqual({
      kind: 'failed',
      reason: 'expired',
    });
  });

  it.each([
    ['network', 'unavailable'],
    ['server', 'unavailable'],
    ['rate_limited', 'unavailable'],
    ['access_denied', 'generic'],
    ['unknown', 'generic'],
  ] as const)('reads a %s failure as %s', (cause, reason) => {
    expect(transformer.toFailure(new Error('boom'), failureOf(cause))).toEqual({
      kind: 'failed',
      reason,
    });
  });

  it.each([undefined, null, 'text', new ApolloError({})])('survives the error %s', (error) => {
    expect(transformer.toFailure(error, failureOf('unknown'))).toEqual({
      kind: 'failed',
      reason: 'generic',
    });
  });

  it.each(['aborted', 'unauthenticated'] as const)('shows nothing once %s', (reason) => {
    expect(transformer.toFailure(refusal('invalid_state'), failureOf(reason))).toEqual({
      kind: 'aborted',
    });
  });
});
