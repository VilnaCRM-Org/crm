import loadIsolated from '@tests/unit/utils/isolated-module';

const loadModule = (): Promise<typeof import('@/config/runtime/notification-styles')> =>
  loadIsolated(() => import('@/config/runtime/notification-styles'));

describe('notification styles', () => {
  it('lists exactly toast, inline and bell in that order', async () => {
    const { NOTIFICATION_STYLES } = await loadModule();

    expect([...NOTIFICATION_STYLES]).toEqual(['toast', 'inline', 'bell']);
  });

  it('is frozen so a consumer cannot add a fourth style', async () => {
    const { NOTIFICATION_STYLES } = await loadModule();

    expect(Object.isFrozen(NOTIFICATION_STYLES)).toBe(true);
  });

  it('defaults to toast, which is one of the listed styles', async () => {
    const { DEFAULT_NOTIFICATION_STYLE, NOTIFICATION_STYLES } = await loadModule();

    expect(DEFAULT_NOTIFICATION_STYLE).toBe('toast');
    expect(NOTIFICATION_STYLES).toContain(DEFAULT_NOTIFICATION_STYLE);
  });
});
