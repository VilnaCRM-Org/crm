import '../setup';

import sandboxDemoSessionSeed from '@/config/env/sandbox-demo-session';

const demoCredentials = { email: 'demo@vilnacrm.com', password: 'Demo1234' };

describe('sandbox demo session seed Integration', () => {
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.ENABLE_SANDBOX_DEMO;
  });

  afterAll(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('issues the demo session for the demo credentials and nothing else', () => {
    expect(sandboxDemoSessionSeed.sessionFor(demoCredentials)).toEqual({
      email: 'demo@vilnacrm.com',
      token: 'sandbox-demo-session-token',
    });
    expect(
      sandboxDemoSessionSeed.sessionFor({ ...demoCredentials, password: 'Demo12345' })
    ).toBeNull();
  });

  it('issues nothing from a production build that did not opt in', () => {
    process.env.NODE_ENV = 'production';

    expect(sandboxDemoSessionSeed.sessionFor(demoCredentials)).toBeNull();

    process.env.ENABLE_SANDBOX_DEMO = 'true';

    expect(sandboxDemoSessionSeed.sessionFor(demoCredentials)).not.toBeNull();
  });
});
