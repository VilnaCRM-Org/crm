import ROUTE_PATHS from '@/routes/route-paths';
import loginRedirectTarget from '@auth/utils/login-redirect-target';

const STORAGE_KEY = 'crm.socialSignIn.destination';
const PARSE_BASE = 'http://destination.invalid';

// Social sign-in leaves the SPA for the provider, so the router state that remembered where a
// protected route sent the user (issue #150) is gone when the callback page loads. The
// destination is therefore kept in sessionStorage for the round trip, and is validated by
// loginRedirectTarget both when it is saved and when it is read back: a value planted in storage
// is treated exactly like one planted in router state.
class SocialSignInDestinationSource {
  public save(routerState: unknown): void {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, loginRedirectTarget.resolve(routerState));
    } catch {
      // Storage is unavailable (private mode, quota): the callback then lands on the home page.
    }
  }

  public take(): string {
    const stored = this.read();
    if (stored === null || !stored.startsWith('/')) return ROUTE_PATHS.home;
    const { pathname, search, hash } = new URL(stored, PARSE_BASE);

    return loginRedirectTarget.resolve({ from: { pathname, search, hash } });
  }

  private read(): string | null {
    try {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
      return stored;
    } catch {
      return null;
    }
  }
}

const socialSignInDestinationSource = new SocialSignInDestinationSource();

export default socialSignInDestinationSource;
