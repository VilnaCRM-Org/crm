import API_ENDPOINTS from '@/config/api-config';
import type { SocialProvider } from '@auth/types/social-sign-in/social-provider';
import browserNavigator from '@auth/utils/browser-navigator';
import socialSignInDestinationSource from '@auth/utils/social-sign-in-destination-source';

// Starts the user-service social OAuth flow in this tab (specs/social-sign-in).
class SocialSignInNavigator {
  public start(provider: SocialProvider, routerState: unknown): void {
    socialSignInDestinationSource.save(routerState);
    this.restart(provider);
  }

  // "Try again" on the callback page: the destination the first click saved is still stored (it
  // is only taken on success), so the retry navigates without overwriting it.
  public restart(provider: SocialProvider): void {
    browserNavigator.assign(`${API_ENDPOINTS.SOCIAL_AUTH}/${provider}`);
  }
}

const socialSignInNavigator = new SocialSignInNavigator();

export default socialSignInNavigator;
