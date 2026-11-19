import type { NavigateFunction } from 'react-router';

import ROUTE_PATHS from '@/routes/route-paths';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import browserNavigator from '@auth/utils/browser-navigator';
import socialSignInFlowSource from '@auth/utils/social-sign-in-flow-source';

// Moves a social sign-in through its three hops (specs/social-sign-in): into the callback page,
// which asks user-service for the provider's authorization URL; out to that URL in this tab,
// because the session token lives in this tab's memory only; and back in for a retry.
class SocialSignInNavigator {
  public start(provider: SocialProvider, routerState: unknown, navigate: NavigateFunction): void {
    socialSignInFlowSource.saveDestination(routerState);
    void navigate(this.pathOf(provider), { state: { socialStart: true } });
  }

  // A retry keeps the destination the first click saved and replaces the failed attempt's entry:
  // the new entry still has a new key, so the page starts over, and Back never restarts an
  // earlier attempt.
  public restart(provider: SocialProvider, navigate: NavigateFunction): void {
    void navigate(this.pathOf(provider), { replace: true, state: { socialStart: true } });
  }

  // Replaces the start entry, so Back from the provider's screen returns to the sign-in page
  // instead of to a page that would send the browser straight back to the provider.
  public leave(authorizationUrl: string): void {
    browserNavigator.replace(authorizationUrl);
  }

  private pathOf(provider: SocialProvider): string {
    return ROUTE_PATHS.socialCallback.replace(':provider', provider);
  }
}

const socialSignInNavigator = new SocialSignInNavigator();

export default socialSignInNavigator;
