import styles from '@/components/ui-footer/styles';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('ui-footer styles', () => {
  it('pins every styles token', () => {
    expect(styles).toEqual({
      footerSection: {
        borderTop: '1px solid #E1E7EA',
        backgroundColor: '#FFFFFF',
        boxShadow: '0px -5px 46px 0px rgba(198, 209, 220, 0.25)',
        '@media (max-width:768px)': {
          paddingTop: '1.1rem',
          paddingBottom: '1.25rem',
        },
        '@media (min-width:768px)': {
          width: '100%',
          paddingTop: '0.475625rem',
          paddingBottom: '0.725625rem',
        },
        '@media (min-width:1024px)': {
          width: '100%',
          maxHeight: '4.149375rem',
          paddingTop: '0.538125rem',
          paddingBottom: '0.725625rem',
        },
        '@media (min-width:1440px)': {
          maxHeight: '4.125rem',
          paddingTop: '0.5625rem',
          paddingBottom: '0.43375rem',
        },
      },
      uiMobile: {
        '@media (min-width: 768px)': {
          display: 'none',
        },
      },
      uiStandard: {
        '@media (max-width: 767px)': {
          display: 'none',
        },
      },
    });
  });
});
