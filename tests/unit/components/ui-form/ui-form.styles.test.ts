/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('ui-form styles', () => {
  /**
   * The module is loaded inside the test, not at the top of the file. These are top-level object
   * literals, so importing them statically evaluates every value before any test runs and a mutant
   * there is never exercised by an assertion.
   */
  beforeEach(() => {
    jest.resetModules();
  });

  it('pins every styles token', async () => {
    const { default: styles } = await import('@/components/ui-form/styles');

    expect(styles).toEqual({
      errorBannerFocus: {
        outline: 'none',
        '&:focus-visible': {
          outline: '2px solid #DC3939',
          outlineOffset: '2px',
        },
      },
      formTitle: {
        fontSize: '1.375rem',
        fontFamily: 'Golos',
        fontWeight: '700',
        letterSpacing: 0,
        lineHeight: '1',
        marginBottom: '0.5rem',
        '@media (min-width:768px)': {
          marginBottom: '0.9375rem',
          fontWeight: 600,
          fontSize: '1.875rem',
        },
        '@media (min-width:1440px)': {
          marginBottom: '0.9375rem',
        },
      },
      formSubtitle: {
        fontFamily: 'Golos',
        fontWeight: 400,
        fontSize: '0.9375rem',
        lineHeight: '1.67',
        letterSpacing: 0,
        marginBottom: '1.0625rem',
        '@media (min-width:480px)': {
          fontSize: '1rem',
          lineHeight: '1.625',
        },
        '@media (min-width:1024px)': {
          marginBottom: '1.25rem',
        },
      },
      submitButton: {
        width: '100%',
        height: '3.125rem',
        marginTop: '1rem',
        paddingTop: '1rem',
        paddingBottom: '1rem',
        fontWeight: 500,
        fontStyle: 'normal',
        fontSize: '0.9375rem',
        lineHeight: 1.2,
        letterSpacing: 0,
        textTransform: 'none',
        boxShadow: 'none',
        '@media (min-width:375px)': {
          minWidth: '19.6875rem',
        },
        '@media (min-width:768px)': {
          minWidth: '33.75rem',
          height: '4.375rem',
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
          marginTop: '2.125rem',
          fontWeight: 600,
          fontSize: '1.125rem',
          lineHeight: 1,
        },
        '@media (min-width:1024px)': {
          minWidth: '26.375rem',
          maxHeight: '4.375rem',
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
          marginTop: '2.0625rem',
        },
        '@media (min-width:1440px)': {
          maxHeight: '3.875rem',
          paddingTop: '1.25rem',
          paddingBottom: '1.25rem',
          marginTop: '1.1875rem',
          fontFamily: 'Golos',
          fontWeight: 600,
          fontSize: '1.125rem',
          lineHeight: 1,
        },
      },
    });
  });
});
