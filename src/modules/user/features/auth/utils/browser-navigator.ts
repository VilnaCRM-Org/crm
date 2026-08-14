class BrowserNavigator {
  public openInNewTab(url: string): void {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (!win) this.assign(url);
  }

  public assign(url: string): void {
    window.location.href = url;
  }
}

const browserNavigator = new BrowserNavigator();

export default browserNavigator;
