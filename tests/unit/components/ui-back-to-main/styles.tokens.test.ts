import loadIsolated from '@tests/unit/utils/isolated-module';

describe('back-to-main band styles', () => {
  it('top-aligns the toolkit link so the band carries no line-box strut', async () => {
    const styles = await loadIsolated(
      async () => (await import('@/components/ui-back-to-main/styles')).default
    );

    expect(styles).toEqual({
      band: {
        '& .MuiButtonBase-root': {
          verticalAlign: 'top',
        },
      },
    });
  });
});
