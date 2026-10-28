import loadIsolated from '@tests/unit/utils/isolated-module';

describe('two-factor challenge styles', () => {
  it('pins every token, with the error helper in the accessible error text colour', async () => {
    const { default: styles } = await loadIsolated(
      () => import('@auth/components/two-factor/styles')
    );

    expect(styles).toEqual({
      note: {
        fontFamily: 'Golos',
        fontWeight: 400,
        fontSize: '0.875rem',
        lineHeight: '1.375rem',
        letterSpacing: 0,
        color: '#57595B',
        margin: '0 0 1rem',
        '@media (min-width:768px)': { marginBottom: '1.25rem' },
      },
      toggleRow: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '1.25rem',
        fontFamily: 'Golos',
        fontSize: '0.9375rem',
        lineHeight: '1.125rem',
      },
      recoveryField: { flexDirection: 'column', marginBottom: '1rem' },
      recoveryLabel: {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.29,
        letterSpacing: 0,
        marginBottom: '0.25rem',
        color: '#404142',
        '@media (min-width:480px)': { fontSize: '1rem', lineHeight: 1.125, letterSpacing: 0 },
        '@media (min-width:768px)': { fontSize: '0.875rem' },
        '@media (min-width:1024px)': {
          fontSize: '1rem',
          lineHeight: 1.125,
          marginBottom: '0.5625rem',
        },
        '@media (min-width:1440px)': {
          fontFamily: 'Inter, sans-serif',
          fontWeight: 500,
          fontSize: '0.875rem',
          lineHeight: 1.2857,
        },
      },
      recoveryInput: {
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#80878A' },
        '& .MuiFormHelperText-root': { marginLeft: 0, color: '#57595B' },
        '& .Mui-error ~ .MuiFormHelperText-root, & .MuiFormHelperText-root.Mui-error': {
          color: '#C62828',
        },
      },
    });
  });
});
