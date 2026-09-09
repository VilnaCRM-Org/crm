import loadIsolated from '@tests/unit/utils/isolated-module';

type UserOptionsStyles =
  (typeof import('@auth/components/form-section/components/user-options/styles'))['default'];

const loadStyles = (): Promise<UserOptionsStyles> =>
  loadIsolated(
    async () =>
      (await import('@auth/components/form-section/components/user-options/styles')).default
  );

describe('user options styles', () => {
  it('pins every authOptionsWrapper token', async () => {
    const styles = await loadStyles();

    expect(styles.authOptionsWrapper).toEqual({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      columnGap: '1rem',
      rowGap: '0.5rem',
      marginTop: '1rem',
      '@media (min-width:768px)': {
        marginTop: '1.4375rem',
      },
      '@media (min-width:1024px)': {
        marginTop: '0.8125rem',
      },
    });
  });

  it('pins every rememberMeLabel token', async () => {
    const styles = await loadStyles();

    expect(styles.rememberMeLabel).toEqual({
      margin: 0,
      '& .MuiFormControlLabel-label': {
        fontFamily: 'Inter, sans-serif',
        fontStyle: 'normal',
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: '1.2857',
        letterSpacing: 0,
        color: '#404142',
        '@media (min-width:768px)': {
          fontSize: '1rem',
          lineHeight: '1.125',
        },
        '@media (min-width:1024px)': {
          fontSize: '0.875rem',
          lineHeight: '1.2857',
        },
      },
    });
  });

  it('pins every rememberMeCheckbox token', async () => {
    const styles = await loadStyles();

    expect(styles.rememberMeCheckbox).toEqual({
      padding: 0,
      marginRight: '0.8125rem',
    });
  });

  it('pins every forgotPasswordLink token', async () => {
    const styles = await loadStyles();

    expect(styles.forgotPasswordLink).toEqual({
      display: 'inline-flex',
      alignItems: 'center',
      minHeight: '1.5rem',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.2857',
      color: '#0074B5',
      textDecoration: 'underline',
      textDecorationThickness: '1px',
      textUnderlineOffset: '0.2em',
      '&:hover': {
        color: '#00588A',
        textDecorationThickness: '2px',
      },
      '&:focus-visible': {
        outline: '2px solid #404142',
        outlineOffset: '2px',
        borderRadius: '2px',
        textDecorationThickness: '2px',
      },
    });
  });

  it('exposes exactly the four documented style slots', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles).sort()).toEqual([
      'authOptionsWrapper',
      'forgotPasswordLink',
      'rememberMeCheckbox',
      'rememberMeLabel',
    ]);
  });
});
