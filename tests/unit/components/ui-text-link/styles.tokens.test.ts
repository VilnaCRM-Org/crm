import loadIsolated from '@tests/unit/utils/isolated-module';

type TextLinkStyles = (typeof import('@/components/ui-text-link/styles'))['default'];

const loadStyles = (): Promise<TextLinkStyles> =>
  loadIsolated(async () => (await import('@/components/ui-text-link/styles')).default);

describe('text link styles', () => {
  it('keeps the brand colour on a visited link outside hover and press', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      link: {
        '&:visited:not(:hover):not(:active)': {
          color: '#1EAEFF',
        },
      },
    });
  });
});
