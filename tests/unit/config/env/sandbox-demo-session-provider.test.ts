import sandboxDemoSessionProvider, {
  SandboxDemoSessionProvider,
} from '@/config/env/sandbox-demo-session-provider';
import type { SandboxDemoHost } from '@/config/env/types/sandbox-demo-session';
import { buildEmail, buildPassword } from '@tests/builders';

const DEMO_EMAIL = 'demo@vilnacrm.com';
const DEMO_PASSWORD = 'Demo1234';
const DEMO_SESSION = { email: DEMO_EMAIL, token: 'sandbox-demo-session-token' };
const STORAGE_KEY = 'vilnacrm.sandbox-demo-session';
const SANDBOX_HOST =
  'sandbox-crm-prod-feat-309-error-pages-f5c76b8f.s3-website.eu-central-1.amazonaws.com';
const demoCredentials = { email: DEMO_EMAIL, password: DEMO_PASSWORD };

type FakeStorage = SandboxDemoHost['localStorage'] & { readonly entries: Map<string, string> };

const fakeStorage = (initial: Record<string, string> = {}): FakeStorage => {
  const entries = new Map(Object.entries(initial));
  return {
    entries,
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      entries.set(key, value);
    },
    removeItem: (key: string): void => {
      entries.delete(key);
    },
  };
};

const throwingStorage = (): SandboxDemoHost['localStorage'] => ({
  getItem: (): never => {
    throw new Error('storage disabled');
  },
  setItem: (): never => {
    throw new Error('quota exceeded');
  },
  removeItem: (): never => {
    throw new Error('storage disabled');
  },
});

const providerOn = (
  hostname: string | null,
  localStorage: SandboxDemoHost['localStorage'] = fakeStorage()
): SandboxDemoSessionProvider =>
  new SandboxDemoSessionProvider(
    hostname === null ? { localStorage } : { location: { hostname }, localStorage }
  );

describe('SandboxDemoSessionProvider', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    Object.defineProperty(process, 'env', { configurable: true, value: originalEnv });
    localStorage.removeItem(STORAGE_KEY);
  });

  describe('outside a production build', () => {
    it('signs the published demo credentials in and remembers the demo email', () => {
      const storage = fakeStorage();

      expect(providerOn('localhost', storage).signIn(demoCredentials)).toEqual(DEMO_SESSION);
      expect(storage.entries.get(STORAGE_KEY)).toBe(DEMO_EMAIL);
      expect([...storage.entries.values()]).not.toContain(DEMO_PASSWORD);
    });

    it.each([
      ['another email', { email: buildEmail(), password: DEMO_PASSWORD }],
      ['another password', { email: DEMO_EMAIL, password: buildPassword() }],
      ['an upper-cased email', { email: DEMO_EMAIL.toUpperCase(), password: DEMO_PASSWORD }],
      ['a lower-cased password', { email: DEMO_EMAIL, password: DEMO_PASSWORD.toLowerCase() }],
    ])('rejects %s and remembers nothing', (_label, credentials) => {
      const storage = fakeStorage();

      expect(providerOn('localhost', storage).signIn(credentials)).toBeNull();
      expect(storage.entries.size).toBe(0);
    });

    it('still signs in when the browser refuses to store the marker', () => {
      expect(providerOn('localhost', throwingStorage()).signIn(demoCredentials)).toEqual(
        DEMO_SESSION
      );
    });

    it('restores only the remembered demo email', () => {
      expect(providerOn('localhost', fakeStorage({ [STORAGE_KEY]: DEMO_EMAIL })).restore()).toEqual(
        DEMO_SESSION
      );
      expect(
        providerOn('localhost', fakeStorage({ [STORAGE_KEY]: buildEmail() })).restore()
      ).toBeNull();
      expect(providerOn('localhost').restore()).toBeNull();
      expect(providerOn('localhost', throwingStorage()).restore()).toBeNull();
    });

    it('forgets the marker on sign-out and reports whether it could', () => {
      const storage = fakeStorage({ [STORAGE_KEY]: DEMO_EMAIL, other: 'kept' });

      expect(providerOn('localhost', storage).signOut()).toBe(true);
      expect(storage.entries.has(STORAGE_KEY)).toBe(false);
      expect(storage.entries.get('other')).toBe('kept');
      expect(providerOn('localhost', throwingStorage()).signOut()).toBe(false);
    });

    it('reads the browser location and storage by default', () => {
      expect(sandboxDemoSessionProvider.signIn(demoCredentials)).toEqual(DEMO_SESSION);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(DEMO_EMAIL);
      expect(sandboxDemoSessionProvider.restore()).toEqual(DEMO_SESSION);

      expect(sandboxDemoSessionProvider.signOut()).toBe(true);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(sandboxDemoSessionProvider.restore()).toBeNull();
    });
  });

  describe('in a production build', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it.each([
      ['the S3 website endpoint of a pull-request sandbox', SANDBOX_HOST],
      [
        'a dash-style S3 website endpoint',
        'sandbox-crm-prod-main.s3-website-us-east-1.amazonaws.com',
      ],
    ])('signs in and restores on %s', (_label, hostname) => {
      const storage = fakeStorage();
      const provider = providerOn(hostname, storage);

      expect(provider.signIn(demoCredentials)).toEqual(DEMO_SESSION);
      expect(provider.restore()).toEqual(DEMO_SESSION);
    });

    it.each([
      ['the production domain', 'crm.vilnacrm.com'],
      ['localhost', 'localhost'],
      ['a look-alike outside AWS', 'sandbox-crm-x.evil.com'],
      ['a path that only mentions the prefix', 'evil.com/sandbox-crm-'],
      ['an S3 website of another bucket', 'other-crm.s3-website.eu-central-1.amazonaws.com'],
      ['a sandbox bucket that is not a website', 'sandbox-crm-x.s3.eu-central-1.amazonaws.com'],
      ['a non-S3 AWS host', 'sandbox-crm-x.ec2.amazonaws.com'],
      ['a near-miss website label', 'sandbox-crm-x.s3-websites.eu-central-1.amazonaws.com'],
      ['an AWS-looking suffix', 'sandbox-crm-x.s3-website.eu-central-1.amazonaws.com.evil.com'],
      ['an empty hostname', ''],
    ])('is inert on %s', (_label, hostname) => {
      const storage = fakeStorage({ [STORAGE_KEY]: DEMO_EMAIL });
      const provider = providerOn(hostname, storage);

      expect(provider.signIn(demoCredentials)).toBeNull();
      expect(provider.restore()).toBeNull();
    });

    it('is inert where there is no location at all', () => {
      const provider = providerOn(null, fakeStorage({ [STORAGE_KEY]: DEMO_EMAIL }));

      expect(provider.signIn(demoCredentials)).toBeNull();
      expect(provider.restore()).toBeNull();
    });

    it('remembers nothing for a refused sign-in', () => {
      const storage = fakeStorage();

      expect(providerOn('crm.vilnacrm.com', storage).signIn(demoCredentials)).toBeNull();
      expect(storage.entries.size).toBe(0);
    });
  });
});
