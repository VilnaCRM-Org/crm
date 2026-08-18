import styles from '@auth/components/auth-switcher/styles';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('auth switcher styles', () => {
  it('pins every styles token', () => {
    expect(styles).toEqual({
      switcher: {
        display: 'block',
        padding: 0,
        margin: '1.4375rem auto 0',
        fontFamily: 'Golos',
        fontWeight: 500,
        fontSize: '0.9375rem',
        fontStyle: 'normal',
        lineHeight: 1.2,
        letterSpacing: 0,
        color: '#969B9D',
        textTransform: 'none',
        '@media (min-width:1024px)': {
          margin: '2.75rem auto 0',
          fontSize: '1.125rem',
        },
        '@media (min-width:1440px)': {
          margin: '1.5rem auto 0',
          fontWeight: 500,
          fontSize: '0.9375rem',
          lineHeight: 1.2,
        },
        '&:link, &:visited': {
          color: '#969B9D',
        },
        '&:focus-visible': {
          outline: '2px solid #404142',
          outlineOffset: '2px',
        },
      },
    });
  });
});
