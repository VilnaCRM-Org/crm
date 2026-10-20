import loadIsolated from '@tests/unit/utils/isolated-module';

type PageStyles =
  (typeof import('@/modules/user/features/settings/routes/user-profile/styles'))['default'];

const loadStyles = (): Promise<PageStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/routes/user-profile/styles')).default
  );

describe('user profile page styles', () => {
  it('pins the content insets and gaps, the heading ring and the type tokens', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.0625rem',
        paddingTop: '1.5rem',
        paddingBottom: '2rem',
        '@media (min-width:768px)': { gap: '1rem' },
        '@media (min-width:1025px)': {
          gap: '0.75rem',
          paddingTop: '1.75rem',
          width: 'fit-content',
          maxWidth: '100%',
          marginInline: 'auto',
        },
      },
      header: { display: 'flex', flexDirection: 'column', gap: '0.25rem' },
      heading: {
        margin: 0,
        fontFamily: 'Golos, sans-serif',
        fontWeight: 700,
        fontSize: '1.375rem',
        lineHeight: 'normal',
        color: '#1A1C1E',
        '&:focus:not(:focus-visible)': { outline: 'none' },
        '&:focus-visible': { outline: '2px solid #1A1C1E', outlineOffset: '2px' },
        '@media (min-width:1024px)': { fontSize: '1.75rem' },
        '@media (min-width:1440px)': { fontSize: '1.375rem' },
      },
      subtitle: {
        margin: 0,
        fontFamily: 'Golos, sans-serif',
        fontWeight: 400,
        fontSize: '0.9375rem',
        lineHeight: '1.5625rem',
        color: '#404142',
      },
    });
  });
});
