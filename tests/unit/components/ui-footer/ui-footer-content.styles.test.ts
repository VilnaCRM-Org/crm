import styles from '@/components/ui-footer/ui-footer-content/styles';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('ui-footer content styles', () => {
  it('pins every styles token', () => {
    expect(styles).toEqual({
      footerDesktopWrapper: {
        '@media (min-width:768px)': {
          display: 'flex',
          justifyContent: 'space-between',
        },
      },
      footerLogo: {
        width: '8.125rem',
        height: '2.75rem',
        '@media (max-width:767.95px)': {
          display: 'block',
          margin: '0 auto 0.9375rem',
        },
        '@media (min-width:1024px)': {
          width: '8.6875rem',
          height: '2.92375rem',
        },
        '@media (min-width:1440px)': {
          width: '9rem',
          height: '3rem',
        },
      },
      uiInfoWrapper: {
        textAlign: 'center',
        '@media (min-width:768px)': {
          display: 'flex',
          alignItems: 'center',
        },
      },
      uiLinkTypography: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        '&:hover': {
          color: '#297FFF',
        },
        '&:focus-visible': {
          color: '#297FFF',
          outline: '2px solid #1EAEFF',
          outlineOffset: '2px',
        },
        '&:visited': {
          color: '#0399ED',
        },
        '& .MuiTypography-root': {
          fontWeight: 500,
          fontFamily: 'Golos, sans-serif',
          fontSize: '1rem',
          lineHeight: '1.125rem',
          letterSpacing: '0',
        },
        paddingTop: '1.0625rem',
        paddingBottom: '1.125rem',
        marginTop: '0.25rem',
        borderRadius: '8px',
        backgroundColor: '#F4F5F6',
        '@media (min-width:768px)': {
          maxHeight: '2.125rem',
          padding: '0.5rem 1rem',
          marginTop: '0rem',
          '&:not(:first-of-type)': {
            marginLeft: '0.5rem',
          },
        },
      },
    });
  });
});
