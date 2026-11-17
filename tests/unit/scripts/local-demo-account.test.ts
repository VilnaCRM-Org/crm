import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { SandboxDemoSessionProvider } from '@/config/env/sandbox-demo-session-provider';
import type { SandboxDemoHost } from '@/config/env/types/sandbox-demo-session';
import LocalDemoAccount from '@scripts/local-stack/local-demo-account.mjs';
import { buildEmail, buildPassword } from '@tests/builders';

const START_SCRIPT = resolve(__dirname, '../../../scripts/local-stack/start.sh');

const localStackHost = (): SandboxDemoHost => ({
  location: { hostname: 'vilnacrm.localhost' },
  localStorage: {
    getItem: () => null,
    setItem: (): void => undefined,
    removeItem: (): void => undefined,
  },
});

describe('LocalDemoAccount', () => {
  it('defaults to an account the development sandbox demo never intercepts', () => {
    const provider = new SandboxDemoSessionProvider(localStackHost());
    const { email, password } = new LocalDemoAccount({}).credentials();

    expect(provider.match({ email: 'demo@vilnacrm.com', password: 'Demo1234' })).not.toBeNull();
    expect(provider.match({ email, password })).toBeNull();
  });

  it('defaults to the local demo address and password', () => {
    expect(new LocalDemoAccount({}).credentials()).toEqual({
      email: 'local-demo@vilnacrm.com',
      password: 'Local1234',
      name: 'Demo User',
    });
  });

  it('takes the address and password from the environment when set', () => {
    const email = buildEmail();
    const password = buildPassword();

    const credentials = new LocalDemoAccount({
      LOCAL_DEMO_EMAIL: email,
      LOCAL_DEMO_PASSWORD: password,
    }).credentials();

    expect(credentials).toEqual({ email, password, name: 'Demo User' });
  });

  it('names the same default address in the start script', () => {
    const { email } = new LocalDemoAccount({}).credentials();

    expect(readFileSync(START_SCRIPT, 'utf8')).toContain(
      `sign in as \${LOCAL_DEMO_EMAIL:-${email}}`
    );
  });
});
