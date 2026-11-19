import SidebarCollapseSource from '@/components/ui-sidebar/sidebar-collapse-source';

const STORAGE_KEY = 'crm.sidebar.collapsed';

describe('SidebarCollapseSource', () => {
  afterEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  it('reads expanded when nothing is stored', () => {
    expect(new SidebarCollapseSource().read()).toBe(false);
  });

  it('reads collapsed only from the stored string true under its own key', () => {
    const source = new SidebarCollapseSource();

    window.localStorage.setItem(STORAGE_KEY, 'true');
    expect(source.read()).toBe(true);

    window.localStorage.setItem(STORAGE_KEY, 'false');
    expect(source.read()).toBe(false);

    window.localStorage.setItem(STORAGE_KEY, 'TRUE');
    expect(source.read()).toBe(false);
  });

  it('ignores the value stored under any other key', () => {
    window.localStorage.setItem('crm.sidebar', 'true');

    expect(new SidebarCollapseSource().read()).toBe(false);
  });

  it('writes both positions as strings under its own key only', () => {
    const source = new SidebarCollapseSource();

    source.write(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('true');

    source.write(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('false');
    expect(Object.keys(window.localStorage)).toEqual([STORAGE_KEY]);
  });

  it('reads expanded when storage throws on read', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });

    expect(new SidebarCollapseSource().read()).toBe(false);
  });

  it('swallows a write that storage refuses', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });

    expect(() => new SidebarCollapseSource().write(true)).not.toThrow();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('keeps read, write and the private attempt on the prototype, with no static member', () => {
    const staticMembers = Object.getOwnPropertyNames(SidebarCollapseSource).filter(
      (name) => !['length', 'name', 'prototype'].includes(name)
    );

    expect(Object.getOwnPropertyNames(SidebarCollapseSource.prototype)).toEqual([
      'constructor',
      'read',
      'write',
      'attempt',
    ]);
    expect(staticMembers).toEqual([]);
  });
});
