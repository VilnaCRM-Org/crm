import ReloadOnceGuard from '@/lib/reliability/reload-once-guard';
import { buildToken } from '@tests/builders';

describe('ReloadOnceGuard', () => {
  afterEach(() => {
    window.sessionStorage.clear();
    jest.restoreAllMocks();
  });

  it('allows the first reload for a key and refuses the second in the same session', () => {
    const guard = new ReloadOnceGuard();
    const key = buildToken();

    expect(guard.allow(key)).toBe(true);
    expect(guard.allow(key)).toBe(false);
  });

  it('tracks keys independently', () => {
    const guard = new ReloadOnceGuard();

    expect(guard.allow('/sign-in')).toBe(true);
    expect(guard.allow('/sign-up')).toBe(true);
    expect(guard.allow('/sign-in')).toBe(false);
  });

  it('records the reload under a namespaced session-storage key', () => {
    const key = buildToken();

    new ReloadOnceGuard().allow(key);

    expect(window.sessionStorage.getItem(`crm:chunk-reload:${key}`)).toBe('1');
    expect(window.sessionStorage.length).toBe(1);
  });

  it('honours a flag left by a previous guard instance in the same session', () => {
    const key = buildToken();
    new ReloadOnceGuard().allow(key);

    expect(new ReloadOnceGuard().allow(key)).toBe(false);
  });

  it('reset() forgets the key so a later chunk failure may reload again', () => {
    const guard = new ReloadOnceGuard();
    const key = buildToken();
    guard.allow(key);

    guard.reset(key);

    expect(window.sessionStorage.getItem(`crm:chunk-reload:${key}`)).toBeNull();
    expect(guard.allow(key)).toBe(true);
  });

  it('refuses to reload when session storage throws on read', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(new ReloadOnceGuard().allow(buildToken())).toBe(false);
  });

  it('refuses to reload when session storage throws on write', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(new ReloadOnceGuard().allow(buildToken())).toBe(false);
  });

  it('reset() swallows a storage failure', () => {
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(() => new ReloadOnceGuard().reset(buildToken())).not.toThrow();
  });
});
