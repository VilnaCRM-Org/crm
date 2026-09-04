import styles from '@/components/ui-container/styles';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('ui-container styles', () => {
  it('pins every styles token', () => {
    expect(styles).toEqual({
      container: {
        width: '100%',
        paddingLeft: '0.9375rem',
        paddingRight: '0.9375rem',
        margin: '0 auto',
        '@media (min-width:768px)': {
          paddingLeft: '1.625rem',
          paddingRight: '1.625rem',
        },
        '@media (min-width:1024px)': {
          paddingLeft: '2rem',
          paddingRight: '2rem',
        },
        '@media (min-width:1440px)': {
          paddingLeft: '7.75rem',
          paddingRight: '7.75rem',
        },
      },
    });
  });
});
