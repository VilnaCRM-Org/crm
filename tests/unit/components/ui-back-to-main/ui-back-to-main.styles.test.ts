import backToMainStyles from '@/components/ui-back-to-main/styles';
import colorTheme from '@/components/ui-color-theme';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('ui-back-to-main styles', () => {
  it('builds every token from the supplied theme', () => {
    expect(backToMainStyles.build(colorTheme)).toEqual({
      section: {
        paddingTop: '16px',
        paddingBottom: '16px',
        backgroundColor: '#fff',
        '@media (min-width:1024px)': {
          paddingTop: '1.25rem',
          paddingBottom: '1.25rem',
        },
      },
      backButton: {
        padding: 0,
        '&:hover': {
          backgroundColor: 'transparent',
        },
        '&:focus-visible': {
          backgroundColor: 'transparent',
          outline: '2px solid #1EAEFF',
          outlineOffset: '2px',
        },
      },
      icon: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fafafa',
        width: '24px',
        height: '24px',
      },
      backText: {
        marginLeft: '8px',
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontWeight: 500,
        fontSize: '0.9375rem',
        lineHeight: '1.125rem',
        textTransform: 'none',
        color: '#fafafa',
        '@media (min-width:1024px)': {
          lineHeight: '1.125rem',
          letterSpacing: 0,
        },
      },
    });
  });

  it('rebuilds an equal but independent object on each call', () => {
    const first = backToMainStyles.build(colorTheme);
    const second = backToMainStyles.build(colorTheme);

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });
});
