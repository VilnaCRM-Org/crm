import { buildToken, buildUserId } from '@tests/builders';

/**
 * The schemas are module-level values; importing inside each test keeps their construction
 * under test (see response-schemas.test.ts).
 */
describe('social sign-in response schemas', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('SocialCallbackResponseSchema', () => {
    it('keeps the access token of a direct sign-in and drops the refresh token', async () => {
      const { SocialCallbackResponseSchema } = await import('@auth/utils/response-schemas');
      const accessToken = buildToken();

      expect(
        SocialCallbackResponseSchema.parse({
          '2fa_enabled': false,
          access_token: accessToken,
          refresh_token: buildToken(),
        })
      ).toEqual({ '2fa_enabled': false, access_token: accessToken });
    });

    it('keeps the pending session of an account that still owes its second factor', async () => {
      const { SocialCallbackResponseSchema } = await import('@auth/utils/response-schemas');
      const pendingSessionId = buildUserId();

      expect(
        SocialCallbackResponseSchema.parse({
          '2fa_enabled': true,
          pending_session_id: pendingSessionId,
        })
      ).toEqual({ '2fa_enabled': true, pending_session_id: pendingSessionId });
    });

    it('rejects an empty access token or an empty pending session', async () => {
      const { SocialCallbackResponseSchema } = await import('@auth/utils/response-schemas');

      expect(() =>
        SocialCallbackResponseSchema.parse({ '2fa_enabled': false, access_token: '' })
      ).toThrow();
      expect(() =>
        SocialCallbackResponseSchema.parse({ '2fa_enabled': true, pending_session_id: '' })
      ).toThrow();
    });

    it('rejects a body whose payload does not match its 2fa_enabled branch', async () => {
      const { SocialCallbackResponseSchema } = await import('@auth/utils/response-schemas');

      expect(() =>
        SocialCallbackResponseSchema.parse({ '2fa_enabled': false, pending_session_id: 'x' })
      ).toThrow();
      expect(() =>
        SocialCallbackResponseSchema.parse({ '2fa_enabled': true, access_token: buildToken() })
      ).toThrow();
    });

    it('rejects a body with no 2fa_enabled discriminator', async () => {
      const { SocialCallbackResponseSchema } = await import('@auth/utils/response-schemas');

      expect(() => SocialCallbackResponseSchema.parse({ access_token: buildToken() })).toThrow();
    });
  });

  describe('SocialAuthProblemSchema', () => {
    it('keeps the status and error code of a problem body', async () => {
      const { SocialAuthProblemSchema } = await import('@auth/utils/response-schemas');

      expect(
        SocialAuthProblemSchema.parse({
          type: '/errors/422',
          title: 'An error occurred',
          status: 422,
          error_code: 'state_expired',
        })
      ).toEqual({ status: 422, error_code: 'state_expired' });
    });

    it('rejects a missing or empty error code and a fractional status', async () => {
      const { SocialAuthProblemSchema } = await import('@auth/utils/response-schemas');

      expect(() => SocialAuthProblemSchema.parse({ status: 400 })).toThrow();
      expect(() => SocialAuthProblemSchema.parse({ status: 400, error_code: '' })).toThrow();
      expect(() =>
        SocialAuthProblemSchema.parse({ status: 400.5, error_code: 'invalid_state' })
      ).toThrow();
    });
  });
});
