const LINK_STATE_PREFIX = 'link.';

class SocialLinkStateGuard {
  public isLinkState(state: string | null): boolean {
    return state !== null && state.startsWith(LINK_STATE_PREFIX);
  }
}

const socialLinkStateGuard = new SocialLinkStateGuard();

export default socialLinkStateGuard;
