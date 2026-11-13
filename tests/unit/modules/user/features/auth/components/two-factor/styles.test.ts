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
      toggleRow: {
        display: 'flex',
        justifyContent: 'center',
        marginTop: '1.25rem',
        fontFamily: 'Golos',
        fontSize: '1rem',
        lineHeight: '1.625rem',
      },
      toggle: {
        minHeight: '1.5rem',
        '&&:focus-visible': { outline: '2px solid #0074B5', outlineOffset: '2px' },
      },
      recoveryField: { flexDirection: 'column', marginBottom: '1rem' },
      recoveryInput: {
        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#80878A' },
        '& .MuiFormHelperText-root': { marginLeft: 0, color: '#404142' },
        '& .Mui-error ~ .MuiFormHelperText-root, & .MuiFormHelperText-root.Mui-error': {
          color: '#D63333',
        },
      },
    });
  });
});
