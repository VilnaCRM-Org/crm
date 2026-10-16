import loadIsolated from '@tests/unit/utils/isolated-module';

type PageStyles =
  (typeof import('@/modules/user/features/settings/routes/user-profile/styles'))['default'];

const loadStyles = (): Promise<PageStyles> =>
  loadIsolated(
    async () =>
      (await import('@/modules/user/features/settings/routes/user-profile/styles')).default
  );

describe('user profile page styles', () => {
  it('pins the content, header, heading and subtitle tokens', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      content: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        paddingTop: '1.75rem',
        paddingBottom: '2rem',
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
