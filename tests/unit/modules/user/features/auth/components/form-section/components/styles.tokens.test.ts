import { fieldGapMargins } from '@/components/skeletons/base/auth-form-shared-styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@auth/assets/eye.svg', () => ({
  __esModule: true,
  ReactComponent: 'svg',
}));

jest.mock('@auth/assets/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: 'svg',
}));

type ComponentStyles =
  (typeof import('@auth/components/form-section/components/styles'))['default'];

const loadStyles = (): Promise<ComponentStyles> =>
  loadIsolated(
    async () => (await import('@auth/components/form-section/components/styles')).default
  );

describe('form section component styles', () => {
  it('applies the shared field gap to the first two fields only', async () => {
    const styles = await loadStyles();

    expect(styles.formFieldWrapper).toEqual({
      '&:nth-of-type(-n+2)': { ...fieldGapMargins },
    });
  });

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

  it('pins every passwordFieldInput token', async () => {
    const styles = await loadStyles();

    expect(styles.passwordFieldInput).toEqual({
      paddingRight: '0.5625rem',
      '@media (min-width:375px)': {
        minWidth: '19.6875rem',
      },
      '@media (min-width:768px)': {
        minWidth: '33.75rem',
        paddingRight: '0.875rem',
      },
      '@media (min-width:1024px)': {
        minWidth: '26.375rem',
      },
      '@media (min-width:1440px)': {
        paddingRight: '0.9375rem',
      },
    });
  });

  it('pins the end adornment and password button tokens', async () => {
    const styles = await loadStyles();

    expect(styles.endAdornment).toEqual({ marginLeft: 0 });
    expect(styles.passwordButton).toEqual({
      minWidth: '2rem',
      minHeight: '2rem',
      marginInlineEnd: 0,
      p: 0,
      '&:hover, &:focus-visible': {
        backgroundColor: 'transparent',
      },
    });
  });

  it('exposes exactly the six documented style slots', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles).sort()).toEqual([
      'endAdornment',
      'formFieldInput',
      'formFieldLabel',
      'formFieldWrapper',
      'passwordButton',
      'passwordFieldInput',
    ]);
  });
});
