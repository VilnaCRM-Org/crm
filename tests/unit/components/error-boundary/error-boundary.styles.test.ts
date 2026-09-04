import errorFallbackStyles from '@/components/error-boundary/styles';

/**
 * Style modules are design contracts: the literal IS the test case, so these are pinned values
 * rather than Faker data. A dropped or edited token fails here instead of silently shipping.
 */
describe('error fallback styles', () => {
  it('builds every token the fallback renders with', () => {
    expect(errorFallbackStyles.build()).toEqual({
      container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
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
        outline: 'none',
      },
      description: {
        fontSize: '1rem',
        color: '#1A1C1E',
        margin: '0 0 1.5rem',
        lineHeight: 1.5,
      },
      resetButton: {
        marginTop: '1.5rem',
        padding: '0.75rem 1.5rem',
        fontSize: '1rem',
        fontWeight: 600,
        color: '#1A1C1E',
        backgroundColor: '#1EAEFF',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        outline: '3px solid #005FCC',
        outlineOffset: '2px',
      },
      details: {
        marginTop: '1.5rem',
        maxWidth: '36rem',
        textAlign: 'left',
        fontSize: '0.875rem',
        color: '#1A1C1E',
      },
    });
  });

  it('rebuilds an equal but independent object on each call', () => {
    const first = errorFallbackStyles.build();
    const second = errorFallbackStyles.build();

    expect(second).toEqual(first);
    expect(second).not.toBe(first);
  });
});
