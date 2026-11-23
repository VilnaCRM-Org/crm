import type { SocialLinkWindow } from '../../types/social-link/social-link-callback';

const FEATURES = 'popup,width=520,height=680';

class SocialLinkWindowNavigator {
  public open(): SocialLinkWindow | null {
    const popup = window.open('', '_blank', FEATURES);
    if (popup !== null) popup.opener = null;
    return popup;
  }

  public leave(popup: SocialLinkWindow, url: string): void {
    popup.location.replace(url);
  }
}

const socialLinkWindowNavigator = new SocialLinkWindowNavigator();

export default socialLinkWindowNavigator;
