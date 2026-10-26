import loader from '@/modules/user/features/settings/components/user-menu/current-user-menu-loader';

describe('loader', () => {
  it('loads the CurrentUserMenu module as its default export', async () => {
    const loaded = await loader.load();

    expect(loaded.default.name).toBe('CurrentUserMenu');
  });

  it('memoizes one import for every consumer', async () => {
    const first = loader.load();
    const second = loader.load();

    expect(second).toBe(first);
    await first;
  });
});
