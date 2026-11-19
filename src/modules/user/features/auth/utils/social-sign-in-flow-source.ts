import ROUTE_PATHS from '@/routes/route-paths';
import type { SocialExpectedState } from '@auth/types/social-sign-in/social-sign-in-outcome';
import loginRedirectTarget from '@auth/utils/login-redirect-target';

const DESTINATION_KEY = 'crm.socialSignIn.destination';
const STATE_KEY = 'crm.socialSignIn.state';
const PARSE_BASE = 'http://destination.invalid';

// What a social sign-in round trip must remember while the browser is at the provider: where
// the user was heading (issue #150), and the state user-service issued, so the callback only
// accepts the state this tab started with (login-CSRF binding). Both live in sessionStorage,
// are read once, and the destination is validated by loginRedirectTarget on save and on read.
class SocialSignInFlowSource {
  public saveDestination(routerState: unknown): void {
    this.write(DESTINATION_KEY, loginRedirectTarget.resolve(routerState));
  }

  public takeDestination(): string {
    const stored = this.take(DESTINATION_KEY);
    if (stored === null || !stored.startsWith('/')) return ROUTE_PATHS.home;
    const { pathname, search, hash } = new URL(stored, PARSE_BASE);
    return loginRedirectTarget.resolve({ from: { pathname, search, hash } });
  }

  public saveState(expected: SocialExpectedState): void {
    this.write(STATE_KEY, `${expected.provider}:${expected.state}`);
  }

  // Read without consuming it, so StrictMode's repeated initializer sees the same answer; a stale
  // value is harmless because user-service accepts each state once.
  public matchesState(expected: SocialExpectedState): boolean {
    return this.read(STATE_KEY) === `${expected.provider}:${expected.state}`;
  }

  private write(key: string, value: string): void {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // Storage is unavailable (private mode, quota): the callback then cannot match its state.
    }
  }

  private read(key: string): string | null {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private take(key: string): string | null {
    const stored = this.read(key);
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Nothing to remove when storage is unavailable.
    }
    return stored;
  }
}

const socialSignInFlowSource = new SocialSignInFlowSource();

export default socialSignInFlowSource;
