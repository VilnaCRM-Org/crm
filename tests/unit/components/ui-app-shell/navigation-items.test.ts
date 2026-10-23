import loadIsolated from '@tests/unit/utils/isolated-module';

type ItemSet = (typeof import('@/components/ui-app-shell/navigation-items'))['default'];

const loadItems = (): Promise<ItemSet> =>
  loadIsolated(async () => (await import('@/components/ui-app-shell/navigation-items')).default);

describe('navigation items', () => {
  it('lists the five product rows and then the Settings group, in Figma order', async () => {
    const { items } = await loadItems();

    expect(items.map(({ id }) => id)).toEqual([
      'boards',
      'products',
      'orders',
      'contacts',
      'analytics',
      'settings',
    ]);
  });

  it('gives every item its route, its label key and the shell catalog namespace', async () => {
    const { items } = await loadItems();

    expect(items.map(({ href, labelKey }) => [href, labelKey])).toEqual([
      ['/boards', 'app_shell.items.boards'],
      ['/products', 'app_shell.items.products'],
      ['/orders', 'app_shell.items.orders'],
      ['/contacts', 'app_shell.items.contacts'],
      ['/analytics', 'app_shell.items.analytics'],
      ['/settings', 'app_shell.items.settings'],
    ]);
  });

  it('flags only the Settings group and its three sub-items with userSettings', async () => {
    const { items } = await loadItems();
    const settings = items.at(-1);

    expect(items.slice(0, 5).map(({ flag }) => flag)).toEqual([
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    expect(settings?.flag).toBe('userSettings');
  });

  it('nests Integrations, Webhooks and Billing in the Settings group, each flagged', async () => {
    const { items } = await loadItems();
    const settings = items.at(-1);

    expect(settings && 'children' in settings).toBe(true);
    const children = settings && 'children' in settings ? settings.children.items : [];
    expect(children.map(({ id, href, labelKey, flag }) => [id, href, labelKey, flag])).toEqual([
      ['integrations', '/settings/integrations', 'app_shell.items.integrations', 'userSettings'],
      ['webhooks', '/settings/webhooks', 'app_shell.items.webhooks', 'userSettings'],
      ['billing', '/settings/billing', 'app_shell.items.billing', 'userSettings'],
    ]);
  });

  it('gives every item and sub-item an icon and no group a Sign out entry', async () => {
    const { items } = await loadItems();
    const leaves = items.flatMap((item) =>
      'children' in item ? [item, ...item.children.items] : [item]
    );

    expect(leaves).toHaveLength(9);
    leaves.forEach((leaf) => expect(leaf.icon).toBeDefined());
    expect(leaves.map(({ id }) => id)).not.toContain('signOut');
  });

  it('holds only data: no function-valued property', async () => {
    const { items } = await loadItems();

    const functions = items
      .flatMap((item) => ('children' in item ? [item, ...item.children.items] : [item]))
      .flatMap((leaf) => Object.values(leaf))
      .filter((value) => typeof value === 'function');

    expect(functions).toEqual([]);
  });
});
