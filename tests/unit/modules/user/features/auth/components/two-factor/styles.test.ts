import loadIsolated from '@tests/unit/utils/isolated-module';

describe('two-factor challenge styles', () => {
  it('pins every token, with the error helper in the accessible error text colour', async () => {
    const [{ default: styles }, { default: fieldStyles }] = await loadIsolated(() =>
      Promise.all([
        import('@auth/components/two-factor/styles'),
        import('@/components/ui-form-field/styles'),
      ])
    );
    const { recoveryLabel, ...ownStyles } = styles;

    expect(recoveryLabel).toBe(fieldStyles.formFieldLabel);
    expect(ownStyles).toEqual({
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
      toggle: {
        minHeight: '1.5rem',
        '&&:focus-visible': { outline: '2px solid #0074B5', outlineOffset: '2px' },
      },
      recoveryField: { flexDirection: 'column', marginBottom: '1rem' },
      recoveryInput: {
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#80878A' },
        '& .MuiFormHelperText-root': { marginLeft: 0, color: '#57595B' },
        '& .Mui-error ~ .MuiFormHelperText-root, & .MuiFormHelperText-root.Mui-error': {
          color: '#D63333',
        },
      },
    });
  });
});
