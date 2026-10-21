import loadIsolated from '@tests/unit/utils/isolated-module';

type HeaderStyles =
  (typeof import('@/modules/user/features/settings/components/profile-header/styles'))['default'];

const TABLET = '@media (min-width:768px)';

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
      [TABLET]: { width: '6.1875rem', height: '6.1875rem' },
    });
    expect(styles.greeting).toMatchObject({ color: '#969B9D', fontSize: '1rem' });
    expect(styles.header).toMatchObject({ gap: '1.25rem' });
  });

  it('sets the phone name in Inter Medium 18/22 and wider ones in Golos Bold 22/26', async () => {
    const { name } = await loadStyles();

    expect(name).toMatchObject({
      color: '#1A1C1E',
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '1.125rem',
      lineHeight: '1.375rem',
      [TABLET]: {
        fontFamily: 'Golos',
        fontWeight: 700,
        fontSize: '1.375rem',
        lineHeight: '1.625rem',
      },
    });
  });

  it('leaves 20 / 25 / 28 px between the header and the name row, as Figma does', async () => {
    const { header } = await loadStyles();

    expect(header).toMatchObject({
      alignItems: 'flex-start',
      marginBottom: '1.25rem',
      [TABLET]: { alignItems: 'center', gap: '3.625rem', marginBottom: '1.5625rem' },
      '@media (min-width:1025px)': { marginBottom: '1.75rem' },
    });
  });

  it('pins the pencil badge to the monogram corner, 5 px lower on a phone', async () => {
    const { monogram, badge, badgeIcon } = await loadStyles();

    expect(monogram).toMatchObject({ position: 'relative' });
    expect(badge).toEqual({
      position: 'absolute',
      right: 0,
      bottom: '-0.3125rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '1.625rem',
      height: '1.625rem',
      borderRadius: '50%',
      backgroundColor: '#1EAEFF',
      [TABLET]: { bottom: 0 },
    });
    expect(badgeIcon).toEqual({ width: '1rem', height: '1rem', fill: 'none' });
  });

  it('drops the phone text block 11 px below the monogram top, as Figma draws it', async () => {
    const { text } = await loadStyles();

    expect(text).toMatchObject({ paddingTop: '0.6875rem', [TABLET]: { paddingTop: 0 } });
  });
});
