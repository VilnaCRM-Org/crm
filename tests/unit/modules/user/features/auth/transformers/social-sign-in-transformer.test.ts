import 'reflect-metadata';

import { ApolloError } from '@apollo/client';

import { HttpError } from '@/services/https-client/http-error';
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

const answeredOverHttp = (statusCode: unknown): ApolloError =>
  new ApolloError({ networkError: Object.assign(new Error('refused'), { statusCode }) });

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

  it.each([
    [200, 'unknown'],
    [399, 'unknown'],
    [401, 'authentication'],
    [403, 'authentication'],
    [409, 'conflict'],
    [400, 'validation'],
    [422, 'validation'],
    [423, 'validation'],
    [429, 'validation'],
    [499, 'validation'],
    [500, 'server'],
    [503, 'server'],
  ])('signals a %s answer as a %s failure with its status', (status, kind) => {
    const error = new ApolloError({
      graphQLErrors: [{ message: 'refused', extensions: { status, error_code: 'x' } }],
    });

    expect(transformer.signalOf(error)).toEqual({ kind, status });
    expect(transformer.signalOf(answeredOverHttp(status))).toEqual({ kind, status });
  });

  it.each([
    ['an unreachable user-service', new Error('offline')],
    ['an expired deadline', new HttpError({ status: 0, message: 'Request timed out' })],
    ['a non-numeric HTTP status', Object.assign(new Error('odd'), { statusCode: '500' })],
  ])('signals %s as a network failure', (_label, networkError) => {
    expect(transformer.signalOf(new ApolloError({ networkError }))).toEqual({
      kind: 'network',
      status: undefined,
    });
  });

  it.each([
    ['without a status', { error_code: 'state_expired' }],
    ['with a non-numeric status', { status: '503', error_code: 'provider_unavailable' }],
  ])('signals an answer %s as unknown', (_label, extensions) => {
    const error = new ApolloError({ graphQLErrors: [{ message: 'refused', extensions }] });

    expect(transformer.signalOf(error)).toEqual({ kind: 'unknown', status: undefined });
  });

  it('signals a value that is not an Apollo error as unknown', () => {
    expect(transformer.signalOf(new Error('zod'))).toEqual({ kind: 'unknown', status: undefined });
    expect(transformer.signalOf(null)).toEqual({ kind: 'unknown', status: undefined });
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

  it.each([
    ['a dropped connection', new Error('Failed to fetch')],
    ['an expired deadline', new HttpError({ status: 0, message: 'Request timed out' })],
  ])('maps %s to unavailable', (_label, networkError) => {
    const error = new ApolloError({ networkError });

    expect(transformer.fromFailure(error, live())).toEqual({
      kind: 'failed',
      error: 'unavailable',
    });
  });

  it.each([
    ['an HTTP 500 answer', answeredOverHttp(500)],
    ['an HTTP 503 answer', answeredOverHttp(503)],
    ['an HTTP 429 answer', answeredOverHttp(429)],
    ['an unparsable HTTP 200 answer', answeredOverHttp(200)],
    ['a non-string error code', coded(42)],
    ['a GraphQL error without extensions', new ApolloError({ graphQLErrors: [{ message: 'x' }] })],
    ['an error with no GraphQL errors', new ApolloError({})],
    ['a plain Error', new Error('parse failed')],
    ['nothing thrown at all', undefined],
  ])('maps %s to generic', (_label, error) => {
    expect(transformer.fromFailure(error, live())).toEqual({ kind: 'failed', error: 'generic' });
  });
});
