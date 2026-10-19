import loadIsolated from '@tests/unit/utils/isolated-module';

jest.mock('@/assets/icons/eye.svg', () => ({
  __esModule: true,
  ReactComponent: 'svg',
}));

jest.mock('@/assets/icons/eye-off.svg', () => ({
  __esModule: true,
  ReactComponent: 'svg',
}));

type PasswordFieldStyles = (typeof import('@/components/ui-password-field/styles'))['default'];

const loadStyles = (): Promise<PasswordFieldStyles> =>
  loadIsolated(async () => (await import('@/components/ui-password-field/styles')).default);

describe('ui password field styles', () => {
  it('pins the end adornment and password button tokens', async () => {
    const styles = await loadStyles();

    expect(styles.endAdornment).toEqual({ marginLeft: 0 });
    expect(styles.passwordButton).toEqual({
      minWidth: '2rem',
      minHeight: '2rem',
      marginInlineEnd: '-0.25rem',
      p: 0,
      '@media (min-width:768px)': {
        marginInlineEnd: '0.125rem',
      },
      '&:hover, &:focus-visible': {
        backgroundColor: 'transparent',
      },
      '&:focus-visible, &.Mui-focusVisible': {
        outline: '2px solid #404142',
        outlineOffset: '2px',
      },
    });
  });

  it('exposes exactly the two documented style slots', async () => {
    const styles = await loadStyles();

    expect(Object.keys(styles).sort()).toEqual(['endAdornment', 'passwordButton']);
  });
});
