import type {
  SandboxDemoCredentials,
  SandboxDemoHost,
  SandboxDemoSession,
} from './types/sandbox-demo-session';

export class SandboxDemoSessionProvider {
  private readonly session: SandboxDemoSession = {
    email: 'demo@vilnacrm.com',
    token: 'sandbox-demo-session-token',
  };

  private readonly storageKey = 'vilnacrm.sandbox-demo-session';

  constructor(private readonly host: SandboxDemoHost = globalThis) {}

  public signIn(credentials: SandboxDemoCredentials): SandboxDemoSession | null {
    if (
      !this.isActive() ||
      credentials.email !== this.session.email ||
      credentials.password !== 'Demo1234'
    ) {
      return null;
    }
    this.persist(this.session.email);
    return this.session;
  }

  public restore(): SandboxDemoSession | null {
    try {
      return this.isActive() &&
        this.host.localStorage.getItem(this.storageKey) === this.session.email
        ? this.session
        : null;
    } catch {
      return null;
    }
  }

  public signOut(): boolean {
    return this.persist(null);
  }

  private persist(email: string | null): boolean {
    try {
      if (email === null) this.host.localStorage.removeItem(this.storageKey);
      else this.host.localStorage.setItem(this.storageKey, email);
      return true;
    } catch {
      return false;
    }
  }

  private isActive(): boolean {
    const hostname = this.host.location?.hostname;

    return (
      process.env.NODE_ENV !== 'production' ||
      (hostname !== undefined && this.isSandboxHost(hostname))
    );
  }

  private isSandboxHost(hostname: string): boolean {
    return (
      hostname.startsWith('sandbox-crm-') &&
      hostname.endsWith('.amazonaws.com') &&
      hostname.split('.').some((label) => label === 's3-website' || label.startsWith('s3-website-'))
    );
  }
}

const sandboxDemoSessionProvider = new SandboxDemoSessionProvider();

export default sandboxDemoSessionProvider;
