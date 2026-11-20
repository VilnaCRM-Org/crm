import loadIsolated from '@tests/unit/utils/isolated-module';

const loadTable = (): Promise<typeof import('@/lib/notifications/notification-surfaces').default> =>
  loadIsolated(async () => (await import('@/lib/notifications/notification-surfaces')).default);

describe('NOTIFICATION_SURFACES', () => {
  it('maps toast to page, inline to anchor and bell to header', async () => {
    const table = await loadTable();

    expect(table).toEqual({ toast: 'page', inline: 'anchor', bell: 'header' });
  });

  it('is frozen so a row cannot be rewritten at runtime', async () => {
    const table = await loadTable();

    expect(Object.isFrozen(table)).toBe(true);
  });

  it.each([
    ['toast', 'page'],
    ['inline', 'anchor'],
    ['bell', 'header'],
  ] as const)('reads %s as %s', async (style, surface) => {
    const table = await loadTable();

    expect(table[style]).toBe(surface);
  });
});
