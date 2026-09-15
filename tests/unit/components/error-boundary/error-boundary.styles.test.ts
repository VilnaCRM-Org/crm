import errorFallbackStyles from '@/components/error-boundary/styles';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
const action = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '2.75rem',
  lineHeight: 1.5,
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  fontWeight: 600,
  borderRadius: '8px',
  textDecoration: 'none',
  boxSizing: 'border-box',
  '&:focus-visible': { outline: '3px solid #005FCC', outlineOffset: '2px' },
  '@media (forced-colors: active)': { border: '1px solid ButtonText' },
};

describe('error fallback styles', () => {
  it('builds every token the fallback renders with', () => {
    expect(errorFallbackStyles.build()).toEqual({
      container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '1 1 auto',
        padding: '2rem',
        backgroundColor: '#FFFFFF',
        color: '#1A1C1E',
        fontFamily: 'sans-serif',
        boxSizing: 'border-box',
      },
      messageBlock: {
        textAlign: 'center',
        maxWidth: '36rem',
      },
      heading: {
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#1A1C1E',
        margin: '0 0 1rem',
        '&:focus:not(:focus-visible)': { outline: 'none' },
        '&:focus-visible': { outline: '3px solid #005FCC', outlineOffset: '2px' },
      },
      description: {
        fontSize: '1rem',
        color: '#1A1C1E',
        margin: '0 0 1.5rem',
        lineHeight: 1.5,
      },
      actions: {
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
      },
      button: {
        ...action,
        color: '#1A1C1E',
        backgroundColor: '#1EAEFF',
        border: 'none',
        cursor: 'pointer',
      },
      link: {
        ...action,
        color: '#0074B5',
        backgroundColor: '#FFFFFF',
        border: '2px solid currentColor',
      },
      details: {
        marginTop: '1.5rem',
        maxWidth: '36rem',
        textAlign: 'left',
        fontSize: '0.875rem',
        color: '#1A1C1E',
        '& pre': { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
      },
    });
  });

  it('never fills the viewport on its own, so a nested fallback stays in flow', () => {
    expect(errorFallbackStyles.build().container).not.toHaveProperty('minHeight');
  });

  it('draws the focus ring only under :focus-visible on both actions', () => {
    const { button, link } = errorFallbackStyles.build();

    for (const control of [button, link]) {
      expect(control).not.toHaveProperty('outline');
      expect(control['&:focus-visible']).toEqual({
        outline: '3px solid #005FCC',
        outlineOffset: '2px',
      });
      expect(control.minHeight).toBe('2.75rem');
      expect(control['@media (forced-colors: active)']).toEqual({
        border: '1px solid ButtonText',
      });
    }
  });

  it('rebuilds an equal but independent object on each call', () => {
    const first = errorFallbackStyles.build();
    const second = errorFallbackStyles.build();

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.button).not.toBe(first.button);
  });
});
