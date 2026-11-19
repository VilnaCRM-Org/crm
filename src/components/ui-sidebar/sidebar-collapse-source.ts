export default class SidebarCollapseSource {
  private readonly storageKey = 'crm.sidebar.collapsed';

  public read(): boolean {
    return this.attempt(() => window.localStorage.getItem(this.storageKey) === 'true', false);
  }

  public write(collapsed: boolean): void {
    this.attempt(() => window.localStorage.setItem(this.storageKey, String(collapsed)), undefined);
  }

  private attempt<T>(action: () => T, fallback: T): T {
    try {
      return action();
    } catch {
      return fallback;
    }
  }
}
