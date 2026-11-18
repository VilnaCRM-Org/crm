export class BrowserNavigator {
  constructor(private readonly location: Location) {}

  // A same-tab navigation, not a new tab: the session token lives in this tab's memory only, so
  // a provider round trip has to come back to the same tab to sign it in (specs/social-sign-in).
  public assign(url: string): void {
    this.location.assign(url);
  }
}

const browserNavigator = new BrowserNavigator(window.location);

export default browserNavigator;
