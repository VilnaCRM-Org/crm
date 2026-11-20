describe('notifications feature barrels', () => {
  it('exports types only from the public barrel', async () => {
    const barrel = await import('@/modules/user/features/notifications');

    expect(Object.keys(barrel)).toEqual([]);
  });

  it('exports the class, seed and default instance from the repositories barrel', async () => {
    const barrel = await import('@/modules/user/features/notifications/repositories');

    expect(Object.keys(barrel).sort()).toEqual([
      'InMemoryNotificationRepository',
      'NOTIFICATION_SEED',
      'inMemoryNotificationRepository',
    ]);
    expect(barrel.inMemoryNotificationRepository).toBeInstanceOf(
      barrel.InMemoryNotificationRepository
    );
  });
});
