import loadIsolated from '@tests/unit/utils/isolated-module';

describe('text link styles', () => {
  it('keeps the brand colour on a visited link outside hover and press', async () => {
    const styles = await loadIsolated(
      async () => (await import('@/components/ui-text-link/styles')).default
    );

    expect(styles).toEqual({
      link: {
        '&:visited:not(:hover):not(:active)': {
          color: '#1EAEFF',
        },
      },
    });
  });
});
