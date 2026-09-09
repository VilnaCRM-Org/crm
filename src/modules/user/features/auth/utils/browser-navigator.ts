class BrowserNavigator {
  // `window.open` is called for its side effect only. Its return value is deliberately ignored:
  // with `noopener` the opener is severed, and several browsers signal that by returning `null`
  // on a *successful* open. Treating `null` as "popup blocked" and navigating the current tab
  // therefore replaces a working sign-in page with the OAuth endpoint on those browsers.
  public openInNewTab(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

const browserNavigator = new BrowserNavigator();

export default browserNavigator;
