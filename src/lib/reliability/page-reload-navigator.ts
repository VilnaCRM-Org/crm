export class PageReloadNavigator {
  public reload(): void {
    window.location.reload();
  }
}

const pageReloadNavigator = new PageReloadNavigator();

export default pageReloadNavigator;
