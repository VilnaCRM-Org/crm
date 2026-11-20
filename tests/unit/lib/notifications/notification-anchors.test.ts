import loadIsolated from '@tests/unit/utils/isolated-module';

describe('PRIMARY_NOTIFICATION_ANCHOR', () => {
  it('is the anchor a draft without one is stored under', async () => {
    const anchor = await loadIsolated(
      async () => (await import('@/lib/notifications/notification-anchors')).default
    );

    expect(anchor).toBe('primary');
  });
});
