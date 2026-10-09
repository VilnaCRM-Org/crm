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
      marginBottom: '0.4375rem',
      paddingRight: '0.75rem',
      '@media (min-width:768px)': {
        marginTop: '1.4375rem',
        marginBottom: '-0.5625rem',
        paddingRight: 0,
      },
      '@media (min-width:1024px)': {
        marginBottom: '-0.625rem',
      },
      '@media (min-width:1440px)': {
        marginTop: '-0.1875rem',
        marginBottom: 0,
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
        '@media (min-width:1440px)': {
          fontSize: '0.875rem',
          lineHeight: '1.2857',
        },
      },
      '& .MuiCheckbox-root .ui-checkbox-box': {
        width: '1.25rem',
        height: '1.25rem',
        '@media (min-width:768px)': {
          width: '1.5rem',
          height: '1.5rem',
        },
      },
    });
  });

  it('exposes exactly the two documented style slots', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles).sort()).toEqual(['authOptionsWrapper', 'rememberMeLabel']);
  });
});
