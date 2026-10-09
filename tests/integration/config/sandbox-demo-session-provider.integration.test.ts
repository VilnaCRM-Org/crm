import '../setup';

import sandboxDemoSessionProvider, {
  SandboxDemoSessionProvider,
} from '@/config/env/sandbox-demo-session-provider';
import type { SandboxDemoHost } from '@/config/env/types/sandbox-demo-session';
import { AuthStateVar } from '@auth/stores/auth-var';

const STORAGE_KEY = 'vilnacrm.sandbox-demo-session';
const demoCredentials = { email: 'demo@vilnacrm.com', password: 'Demo1234' };
const sandboxHost = 'sandbox-crm-prod-main.s3-website.eu-central-1.amazonaws.com';

const refusingStorage: SandboxDemoHost['localStorage'] = {
  getItem: () => {
    throw new Error('storage disabled');
  },
  setItem: () => {
    throw new Error('storage disabled');
  },
  removeItem: () => {
    throw new Error('storage disabled');
  },
};

describe('sandbox demo session provider Integration', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('keeps a demo sign-in across a reload of the auth state until sign-out', () => {
    expect(sandboxDemoSessionProvider.signIn(demoCredentials)).not.toBeNull();
    expect(new AuthStateVar().get()).toMatchObject({ email: demoCredentials.email });

    expect(sandboxDemoSessionProvider.signOut()).toBe(true);
    expect(new AuthStateVar().get()).toMatchObject({ email: '', token: null });
  });

  it('is active in a production build only on a sandbox S3 website host', () => {
    process.env.NODE_ENV = 'production';
    const onHost = (hostname: string): SandboxDemoSessionProvider =>
      new SandboxDemoSessionProvider({ location: { hostname }, localStorage });

    expect(onHost(sandboxHost).signIn(demoCredentials)).not.toBeNull();
    expect(onHost(sandboxHost).restore()).not.toBeNull();
    expect(onHost('crm.vilnacrm.com').restore()).toBeNull();
    expect(onHost('sandbox-crm-x.evil.com').signIn(demoCredentials)).toBeNull();
    expect(new SandboxDemoSessionProvider({ localStorage }).signIn(demoCredentials)).toBeNull();
  });

  it('degrades to no persistence when storage refuses every call', () => {
    const provider = new SandboxDemoSessionProvider({ localStorage: refusingStorage });

    expect(provider.signIn(demoCredentials)).not.toBeNull();
    expect(provider.restore()).toBeNull();
    expect(provider.signOut()).toBe(false);
    expect(provider.signIn({ ...demoCredentials, password: 'Demo12345' })).toBeNull();
  });
});
