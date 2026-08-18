import {
  fieldGapMargins,
  formSection,
  formWrapper,
} from '@/components/skeletons/base/auth-form-shared-styles';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('auth form shared skeleton styles', () => {
  it('pins every fieldGapMargins token', () => {
    expect(fieldGapMargins).toEqual({
      marginBottom: '0.5rem',
      '@media (min-width:480px)': {
        marginBottom: '1.125rem',
      },
      '@media (min-width:768px)': {
        marginBottom: '1.4375rem',
      },
      '@media (min-width:1024px)': {
        marginBottom: '1.125rem',
      },
      '@media (min-width:1440px)': {
        marginBottom: '1rem',
      },
    });
  });

  it('pins every formSection token', () => {
    expect(formSection).toEqual({
      flexGrow: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      paddingTop: '0.5rem',
      paddingX: '0.375rem',
      paddingBottom: '1.5rem',
      fontFamily: 'Golos',
      backgroundColor: '#FBFBFB',
      '@media (min-width:768px)': {
        paddingTop: '8.4375rem',
        paddingBottom: '8.4375rem',
      },
      '@media (min-width:1440px)': {
        paddingTop: '3.4375rem',
        paddingBottom: '3.4375rem',
      },
    });
  });

  it('pins every formWrapper token', () => {
    expect(formWrapper).toEqual({
      position: 'relative',
      width: '100%',
      padding: '1.5rem 1.5rem 1.375rem',
      margin: '0 auto',
      backgroundColor: '#FFFFFF',
      border: '1px solid #EAECEE',
      borderRadius: '16px',
      boxShadow: '0px 7px 40px 0px #E7E7E77D',
      maxWidth: '22.6875rem',
      '@media (min-width:768px)': {
        maxWidth: '39.5rem',
        paddingTop: '2.625rem',
        paddingLeft: '2.8125rem',
        paddingRight: '2.8125rem',
        paddingBottom: '2.1875rem',
      },
      '@media (min-width:1440px)': {
        maxWidth: '31.375rem',
        padding: '2.1rem 2.4375rem 1.9375rem',
      },
    });
  });
});
