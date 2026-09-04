import ROUTE_PATHS from '@/routes/route-paths';
import type { RedirectNavigationState } from '@/routes/types/navigation-state';

class LoginRedirectTarget {
  public resolve(state: unknown): string {
    const from = (state as RedirectNavigationState | null | undefined)?.from;
    if (!from || !this.isInternalPath(from.pathname)) return ROUTE_PATHS.home;
    return `${from.pathname}${this.part(from.search)}${this.part(from.hash)}`;
  }

  // A backslash disqualifies the path alongside the `//` form: WHATWG URL parsing normalises
  // `\` to `/` for http(s), so `/\evil.example` resolves as the cross-origin `//evil.example`.
  private isInternalPath(pathname: unknown): pathname is string {
    if (typeof pathname !== 'string') return false;
    if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\')) {
      return false;
    }
    return pathname !== ROUTE_PATHS.signIn;
  }

  private part(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}

const loginRedirectTarget = new LoginRedirectTarget();

export default loginRedirectTarget;
