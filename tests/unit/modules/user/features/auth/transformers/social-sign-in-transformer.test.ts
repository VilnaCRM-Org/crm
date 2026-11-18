import 'reflect-metadata';

import { HttpError } from '@/services/https-client/http-error';
import SocialSignInTransformer from '@auth/transformers/social-sign-in-transformer';
import { buildToken, buildUserId } from '@tests/builders';

const transformer = new SocialSignInTransformer();
const live = (): AbortSignal => new AbortController().signal;

const problemError = (status: number, body: unknown): HttpError =>
  new HttpError({ status, message: 'x', cause: { body } });

const problem = (status: number, errorCode: string): HttpError =>
  problemError(status, JSON.stringify({ status, error_code: errorCode, title: 't' }));

describe('SocialSignInTransformer', () => {
  describe('toOutcome', () => {
    it('reports a direct sign-in without exposing the token', () => {
      expect(transformer.toOutcome({ '2fa_enabled': false, access_token: buildToken() })).toEqual({
        kind: 'signed-in',
      });
    });

    it('carries the pending session of a 2FA account', () => {
      const pendingSessionId = buildUserId();

      expect(
        transformer.toOutcome({ '2fa_enabled': true, pending_session_id: pendingSessionId })
      ).toEqual({ kind: 'two-factor', pendingSessionId });
    });

    it('treats an empty success body as a generic failure', () => {
      expect(transformer.toOutcome(undefined)).toEqual({ kind: 'failed', error: 'generic' });
    });
  });

  describe('fromFailure', () => {
    it('reports an aborted relay as aborted, whatever the error', () => {
      const controller = new AbortController();
      controller.abort();

      expect(
        transformer.fromFailure(problem(503, 'provider_unavailable'), controller.signal)
      ).toEqual({ kind: 'aborted' });
    });

    it.each([
      ['missing_oauth_parameters', 400, 'missing_parameters'],
      ['provider_mismatch', 400, 'provider_mismatch'],
      ['unsupported_provider', 400, 'unsupported_provider'],
      ['duplicate_email', 409, 'duplicate_email'],
      ['invalid_state', 422, 'expired'],
      ['state_expired', 422, 'expired'],
      ['provider_email_unavailable', 422, 'email_unavailable'],
      ['unverified_provider_email', 422, 'email_unverified'],
      ['provider_unavailable', 503, 'unavailable'],
      ['something_new', 422, 'generic'],
    ])('maps error_code %s to %s', (code, status, kind) => {
      expect(transformer.fromFailure(problem(status, code), live())).toEqual({
        kind: 'failed',
        error: kind,
      });
    });

    it('maps a timeout or network failure to unavailable', () => {
      expect(
        transformer.fromFailure(new HttpError({ status: 0, message: 'Request timed out' }), live())
      ).toEqual({ kind: 'failed', error: 'unavailable' });
    });

    it.each([
      ['a non-HTTP error', new Error('boom')],
      ['a thrown non-object', 'boom'],
      ['nothing thrown at all', undefined],
      ['a body that is not JSON', problemError(500, '<html>')],
      ['a body that is not a string', problemError(500, { error_code: 'state_expired' })],
      ['a cause with no body', new HttpError({ status: 500, message: 'x' })],
      ['a problem without an error code', problemError(400, JSON.stringify({ status: 400 }))],
      ['an empty error code', problemError(400, JSON.stringify({ status: 400, error_code: '' }))],
    ])('maps %s to generic', (_label, error) => {
      expect(transformer.fromFailure(error, live())).toEqual({ kind: 'failed', error: 'generic' });
    });
  });
});
