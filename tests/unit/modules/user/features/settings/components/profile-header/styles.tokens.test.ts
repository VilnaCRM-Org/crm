import loadIsolated from '@tests/unit/utils/isolated-module';

type HeaderStyles =
  (typeof import('@/modules/user/features/settings/components/profile-header/styles'))['default'];

const loadStyles = (): Promise<HeaderStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/components/profile-header/styles')).default
  );

describe('profile header styles', () => {
  it('pins the monogram disc, the greeting and the name tokens', async () => {
    const styles = await loadStyles();

    expect(styles.monogram).toMatchObject({
      backgroundColor: '#E1E7EA',
      color: '#1A1C1E',
      width: '4rem',
      height: '4rem',
      borderRadius: '50%',
      '@media (min-width:768px)': { width: '6.1875rem', height: '6.1875rem' },
    });
    expect(styles.greeting).toMatchObject({ color: '#57595B', fontSize: '1rem' });
    expect(styles.name).toMatchObject({ color: '#1A1C1E', fontSize: '1.125rem' });
    expect(styles.header).toMatchObject({ gap: '1.25rem' });
  });
});
