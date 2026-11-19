import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import type SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import { buildToken, buildUserId } from '@tests/builders';
import loadIsolated from '@tests/unit/utils/isolated-module';

// The error-code table is a module-level literal, so the transformer is loaded inside each test.
let transformer: SocialSignInTransformer;
const live = (): AbortSignal => new AbortController().signal;

const coded = (errorCode: unknown): ApolloError =>
  new ApolloError({
    graphQLErrors: [{ message: 'refused', extensions: { status: 422, error_code: errorCode } }],
  });

describe('SocialSignInTransformer', () => {
  beforeEach(async () => {
    transformer = await loadIsolated(async () => {
      const { default: Transformer } =
        await import('@auth/transformers/social-sign-in-transformer');
      return new Transformer();
    });
  });

  it('turns an initiation into the redirect it asks for', () => {
    const initiation = { authorizationUrl: 'https://github.com/login/oauth/authorize', state: 's' };

    expect(transformer.toStart(initiation)).toEqual({ kind: 'redirect', ...initiation });
  });

  it('reports a direct sign-in without exposing the token', () => {
    expect(transformer.toOutcome({ twoFactorEnabled: false, accessToken: buildToken() })).toEqual({
      kind: 'signed-in',
    });
    expect(transformer.toOutcome({ accessToken: buildToken() })).toEqual({ kind: 'signed-in' });
  });

  it('carries the pending session of a 2FA account', () => {
    const pendingSessionId = buildUserId();

    expect(transformer.toOutcome({ twoFactorEnabled: true, pendingSessionId })).toEqual({
      kind: 'two-factor',
      pendingSessionId,
    });
  });

  it('reports an aborted relay as aborted, whatever the error', () => {
    const controller = new AbortController();
    controller.abort();

    expect(transformer.fromFailure(coded('state_expired'), controller.signal)).toEqual({
      kind: 'aborted',
    });
  });

  it.each([
    ['missing_oauth_parameters', 'missing_parameters'],
    ['provider_mismatch', 'provider_mismatch'],
    ['unsupported_provider', 'unsupported_provider'],
    ['duplicate_email', 'duplicate_email'],
    ['invalid_state', 'expired'],
    ['state_expired', 'expired'],
    ['provider_email_unavailable', 'email_unavailable'],
    ['unverified_provider_email', 'email_unverified'],
    ['provider_unavailable', 'unavailable'],
    ['something_new', 'generic'],
  ])('maps extensions.error_code %s to %s', (code, kind) => {
    expect(transformer.fromFailure(coded(code), live())).toEqual({ kind: 'failed', error: kind });
  });

  it('maps a transport failure to unavailable', () => {
    const error = new ApolloError({ networkError: new Error('Failed to fetch') });

    expect(transformer.fromFailure(error, live())).toEqual({
      kind: 'failed',
      error: 'unavailable',
    });
  });

  it.each([
    ['a non-string error code', coded(42)],
    ['a GraphQL error without extensions', new ApolloError({ graphQLErrors: [{ message: 'x' }] })],
    ['an error with no GraphQL errors', new ApolloError({})],
    ['a plain Error', new Error('parse failed')],
    ['nothing thrown at all', undefined],
  ])('maps %s to generic', (_label, error) => {
    expect(transformer.fromFailure(error, live())).toEqual({ kind: 'failed', error: 'generic' });
  });
});
