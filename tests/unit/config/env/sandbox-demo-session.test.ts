import sandboxDemoSessionSeed from '@/config/env/sandbox-demo-session';
import { buildEmail, buildPassword } from '@tests/builders';

const OPT_IN_KEY = 'ENABLE_SANDBOX_DEMO';
const DEMO_EMAIL = 'demo@vilnacrm.com';
const DEMO_PASSWORD = 'Demo1234';
const DEMO_TOKEN = 'sandbox-demo-session-token';
const demoCredentials = { email: DEMO_EMAIL, password: DEMO_PASSWORD };

describe('sandboxDemoSessionSeed', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env[OPT_IN_KEY];
  });

  afterEach(() => {
    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
  });

  describe('outside a production build', () => {
    it('returns the demo session for the published demo credentials', () => {
      expect(sandboxDemoSessionSeed.sessionFor(demoCredentials)).toEqual({
        email: DEMO_EMAIL,
        token: DEMO_TOKEN,
      });
    });

    it('returns null for any other email with the demo password', () => {
      expect(
        sandboxDemoSessionSeed.sessionFor({ email: buildEmail(), password: DEMO_PASSWORD })
      ).toBeNull();
    });

    it('returns null for the demo email with any other password', () => {
      expect(
        sandboxDemoSessionSeed.sessionFor({ email: DEMO_EMAIL, password: buildPassword() })
      ).toBeNull();
    });

    it('matches the credentials exactly, with no case folding', () => {
      expect(
        sandboxDemoSessionSeed.sessionFor({
          email: DEMO_EMAIL.toUpperCase(),
          password: DEMO_PASSWORD,
        })
      ).toBeNull();
      expect(
        sandboxDemoSessionSeed.sessionFor({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD.toLowerCase(),
        })
      ).toBeNull();
    });
  });

  describe('in a production build', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('returns null for the demo credentials when the build did not opt in', () => {
      expect(sandboxDemoSessionSeed.sessionFor(demoCredentials)).toBeNull();
    });

    it('returns the demo session from an opted-in build, which only the sandbox makes', () => {
      process.env[OPT_IN_KEY] = 'true';

      expect(sandboxDemoSessionSeed.sessionFor(demoCredentials)).toEqual({
        email: DEMO_EMAIL,
        token: DEMO_TOKEN,
      });
    });

    it('still rejects other credentials in an opted-in build', () => {
      process.env[OPT_IN_KEY] = 'true';

      expect(
        sandboxDemoSessionSeed.sessionFor({ email: buildEmail(), password: buildPassword() })
      ).toBeNull();
    });

    it('treats any opt-in value other than the exact "true" flag as disabled', () => {
      process.env[OPT_IN_KEY] = '1';

      expect(sandboxDemoSessionSeed.sessionFor(demoCredentials)).toBeNull();
    });
  });
});
