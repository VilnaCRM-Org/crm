import loadIsolated from '@tests/unit/utils/isolated-module';

type FieldStyles = (typeof import('@/components/ui-form-field/styles'))['default'];

const loadStyles = (): Promise<FieldStyles> =>
  loadIsolated(async () => (await import('@/components/ui-form-field/styles')).default);

describe('ui form field styles', () => {
  it('pins every formFieldLabel token', async () => {
    const styles = await loadStyles();

    expect(styles.formFieldLabel).toEqual({
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.29,
      letterSpacing: 0,
      marginBottom: '0.25rem',
      color: '#404142',
      '@media (min-width:480px)': {
        fontSize: '1rem',
        lineHeight: 1.125,
        letterSpacing: 0,
      },
      '@media (min-width:768px)': {
        fontSize: '0.875rem',
      },
      '@media (min-width:1024px)': {
        fontSize: '1rem',
        lineHeight: 1.125,
        marginBottom: '0.5625rem',
      },
      '@media (min-width:1440px)': {
        fontFamily: 'Inter, sans-serif',
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: 1.2857,
      },
    });
  });

  it('pins every formFieldInput token', async () => {
    const styles = await loadStyles();

    expect(styles.formFieldInput).toEqual({
      '@media (min-width:375px)': {
        minWidth: '19.6875rem',
      },
      '@media (min-width:768px)': {
        minWidth: '33.75rem',
      },
      '@media (min-width:1024px)': {
        minWidth: '26.375rem',
      },
    });
  });

  it('exposes exactly the two documented style slots', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles).sort()).toEqual(['formFieldInput', 'formFieldLabel']);
  });
});
