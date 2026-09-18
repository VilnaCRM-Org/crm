const STORAGE_KEY_PREFIX = 'crm:chunk-reload:';

// Remembers, per key, that a recovery reload already happened for this browsing session. A
// chunk that is still missing after the reload would otherwise reload the page forever; the
// second failure has to reach the error boundary instead. Storage may be unavailable (private
// mode, quota, a disabled API): then the guard says "no" and the boundary takes over at once.
export default class ReloadOnceGuard {
  public allow(key: string): boolean {
    try {
      const storage = window.sessionStorage;
      if (storage.getItem(STORAGE_KEY_PREFIX + key) !== null) return false;
      storage.setItem(STORAGE_KEY_PREFIX + key, '1');
      return true;
    } catch {
      return false;
    }
  }

  public reset(key: string): void {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY_PREFIX + key);
    } catch {
      // Nothing to forget when storage is unavailable: allow() already refuses without it.
    }
  }
}
