import { buildToken, buildUserId } from '@tests/builders';

const initiation = (user: Record<string, unknown>): unknown => ({
  initiateSocialSignInUser: { user },
});
const completion = (user: Record<string, unknown>): unknown => ({
  completeSocialSignInUser: { user },
});

/**
 * The schemas are module-level values; importing inside each test keeps their construction
 * under test (see response-schemas.test.ts).
 */
describe('social sign-in result schemas', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  describe('SocialInitiateResultSchema', () => {
    it('keeps an http(s) authorization URL and its state', async () => {
      const { SocialInitiateResultSchema } = await import('@auth/utils/response-schemas');
      const user = {
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?x=1',
        state: 's',
      };

      expect(SocialInitiateResultSchema.parse(initiation(user))).toEqual(initiation(user));
      expect(
        SocialInitiateResultSchema.parse(
          initiation({
            authorizationUrl: 'http://localhost:8080/__mock-oauth/google/authorize',
            state: 's',
          })
        )
      ).toBeTruthy();
    });

    it.each([
      ['a javascript: URL', { authorizationUrl: 'javascript:alert(1)', state: 's' }],
      ['a relative URL', { authorizationUrl: '/oauth', state: 's' }],
      [
        'an empty state',
        { authorizationUrl: 'https://github.com/login/oauth/authorize', state: '' },
      ],
      ['no state', { authorizationUrl: 'https://github.com/login/oauth/authorize' }],
    ])('rejects %s', async (_label, user) => {
      const { SocialInitiateResultSchema } = await import('@auth/utils/response-schemas');

      expect(() => SocialInitiateResultSchema.parse(initiation(user))).toThrow();
    });

    it('rejects a payload without its user node', async () => {
      const { SocialInitiateResultSchema } = await import('@auth/utils/response-schemas');

      expect(() =>
        SocialInitiateResultSchema.parse({ initiateSocialSignInUser: { user: null } })
      ).toThrow();
    });
  });

  describe('SocialCompleteResultSchema', () => {
    it('keeps the access token of a direct sign-in, with or without the 2FA flag', async () => {
      const { SocialCompleteResultSchema } = await import('@auth/utils/response-schemas');
      const accessToken = buildToken();

      expect(
        SocialCompleteResultSchema.parse(completion({ twoFactorEnabled: false, accessToken }))
      ).toEqual(completion({ twoFactorEnabled: false, accessToken }));
      expect(
        SocialCompleteResultSchema.parse(completion({ twoFactorEnabled: null, accessToken }))
      ).toEqual(completion({ twoFactorEnabled: null, accessToken }));
    });

    it('keeps the pending session of a 2FA account', async () => {
      const { SocialCompleteResultSchema } = await import('@auth/utils/response-schemas');
      const pendingSessionId = buildUserId();

      expect(
        SocialCompleteResultSchema.parse(
          completion({ twoFactorEnabled: true, pendingSessionId, accessToken: null })
        )
      ).toEqual(completion({ twoFactorEnabled: true, pendingSessionId }));
    });

    it.each([
      ['an empty access token', { twoFactorEnabled: false, accessToken: '' }],
      ['no access token', { twoFactorEnabled: false }],
      ['a 2FA account without its session', { twoFactorEnabled: true, pendingSessionId: '' }],
    ])('rejects %s', async (_label, user) => {
      const { SocialCompleteResultSchema } = await import('@auth/utils/response-schemas');

      expect(() => SocialCompleteResultSchema.parse(completion(user))).toThrow();
    });
  });
});
