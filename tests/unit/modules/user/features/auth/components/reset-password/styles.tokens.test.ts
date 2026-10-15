import loadIsolated from '@tests/unit/utils/isolated-module';

type ResetPasswordStyles = (typeof import('@auth/components/reset-password/styles'))['default'];

const loadStyles = (): Promise<ResetPasswordStyles> =>
  loadIsolated(async () => (await import('@auth/components/reset-password/styles')).default);

const TEXT_PRIMARY = '#404142';
const TEXT_DARK = '#1A1C1E';

describe('reset password styles', () => {
  it('pins every backControl token', async () => {
    const styles = await loadStyles();

    expect(styles.backControl).toEqual({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      minWidth: 0,
      minHeight: '1.5rem',
      padding: 0,
      position: 'relative',
      marginBottom: '0.625rem',
      fontFamily: 'Golos',
      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: '1.125rem',
      letterSpacing: 0,
      color: TEXT_PRIMARY,
      textTransform: 'none',
      '& svg': { flexShrink: 0, color: TEXT_PRIMARY },
      '&:visited': { color: TEXT_PRIMARY },
      '&:hover': { backgroundColor: 'transparent' },
      '&::before': {
        content: '""',
        position: 'absolute',
        inset: '-0.625rem 0',
      },
      '&:focus-visible, &.Mui-focusVisible': {
        outline: `2px solid ${TEXT_PRIMARY}`,
        outlineOffset: '2px',
        borderRadius: '0.25rem',
      },
      '@media (min-width:768px)': {
        marginBottom: '0.4375rem',
      },
      '@media (min-width:1440px)': {
        marginTop: '-0.1875rem',
      },
    });
  });

  it('pins every resultTitle token', async () => {
    const styles = await loadStyles();

    expect(styles.resultTitle).toEqual({
      marginTop: 0,
      marginBottom: '0.5rem',
      '&:focus': { outline: 'none' },
      '@media (min-width:768px)': {
        marginBottom: '0.9375rem',
      },
      '@media (min-width:1440px)': {
        marginTop: '0.75rem',
        marginBottom: '0.6875rem',
      },
    });
  });

  it('pins every resultBody token', async () => {
    const styles = await loadStyles();

    expect(styles.resultBody).toEqual({
      fontFamily: 'Golos',
      fontWeight: 400,
      fontSize: '0.9375rem',
      lineHeight: '1.5625rem',
      letterSpacing: 0,
      color: TEXT_DARK,
      marginBottom: '1rem',
      overflowWrap: 'anywhere',
      '@media (min-width:480px)': {
        fontSize: '1rem',
        lineHeight: '1.625rem',
      },
      '@media (min-width:768px)': {
        marginBottom: '1.5rem',
      },
    });
  });

  it('pins every resultAction token', async () => {
    const styles = await loadStyles();

    expect(styles.resultAction).toEqual({
      width: '100%',
      height: '3.125rem',
      borderRadius: '3.5625rem',
      paddingLeft: '1rem',
      paddingRight: '1rem',
      textAlign: 'center',
      '&:visited': { color: '#FFFFFF' },
      fontFamily: 'Golos',
      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: 1.2,
      letterSpacing: 0,
      textTransform: 'none',
      boxShadow: 'none',
      '@media (min-width:768px)': {
        height: '4.375rem',
        fontWeight: 600,
        fontSize: '1.125rem',
        lineHeight: 'normal',
      },
      '@media (min-width:1440px)': {
        height: '3.875rem',
      },
    });
  });

  it('declares no other style block', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles)).toEqual([
      'backControl',
      'resultTitle',
      'resultBody',
      'resultAction',
    ]);
  });
});
