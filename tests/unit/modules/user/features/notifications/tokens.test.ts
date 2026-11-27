import loadIsolated from '@tests/unit/utils/isolated-module';

describe('NOTIFICATION_TOKENS', () => {
  it('declares one frozen symbol for the repository', async () => {
    const tokens = await loadIsolated(
      async () => (await import('@/modules/user/features/notifications/tokens')).default
    );

    expect(Object.keys(tokens)).toEqual(['NotificationRepository']);
    expect(typeof tokens.NotificationRepository).toBe('symbol');
    expect(tokens.NotificationRepository.description).toBe('NotificationRepository');
    expect(Object.isFrozen(tokens)).toBe(true);
  });
});
