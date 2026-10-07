import type { SandboxDemoCredentials, SandboxDemoSession } from './types/sandbox-demo-session';

export class SandboxDemoSessionSeed {
  public sessionFor(credentials: SandboxDemoCredentials): SandboxDemoSession | null {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SANDBOX_DEMO !== 'true') {
      return null;
    }

    if (credentials.email !== 'demo@vilnacrm.com' || credentials.password !== 'Demo1234') {
      return null;
    }

    return { email: credentials.email, token: 'sandbox-demo-session-token' };
  }
}

const sandboxDemoSessionSeed = new SandboxDemoSessionSeed();

export default sandboxDemoSessionSeed;
