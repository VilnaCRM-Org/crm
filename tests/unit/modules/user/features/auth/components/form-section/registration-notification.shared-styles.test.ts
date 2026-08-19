import colorTheme from '@/components/ui-color-theme';
import {
  centeredColumnFlex,
  compactViewport,
  notificationSection,
  notificationStyles,
} from '@auth/components/form-section/auth-forms/registration-notification.shared-styles';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('registration notification shared styles', () => {
  it('pins every centeredColumnFlex token', () => {
    expect(centeredColumnFlex).toEqual({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'column',
      width: '100%',
    });
  });

  it('pins every notificationSection token', () => {
    expect(notificationSection).toEqual({
      position: 'absolute',
      inset: 0,
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    });
  });

  it('pins the compact viewport media queries', () => {
    expect(compactViewport).toEqual('@media (max-width:479px) and (max-height:550px)');
  });

  it('builds the message button text style from the supplied theme', () => {
    expect(notificationStyles.messageButtonText(colorTheme)).toEqual({
      fontFamily: 'Golos, sans-serif',
      fontSize: '0.9375rem',
      lineHeight: '1.125rem',
      fontWeight: 500,
      '@media (min-width:900px)': {
        fontSize: '1.125rem',
        lineHeight: '1.35rem',
        fontWeight: 600,
      },
    });
  });
});
