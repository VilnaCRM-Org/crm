export class BrowserNavigator {
  constructor(private readonly location: Location) {}

  // Replaces the current history entry, so Back from the destination returns to the page before
  // this one instead of to a page that would only send the browser forward again.
  public replace(url: string): void {
    this.location.replace(url);
  }
}

const browserNavigator = new BrowserNavigator(window.location);

export default browserNavigator;
