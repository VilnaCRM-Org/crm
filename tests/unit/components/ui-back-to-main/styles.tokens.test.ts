import loadIsolated from '@tests/unit/utils/isolated-module';

type BackToMainStyles = (typeof import('@/components/ui-back-to-main/styles'))['default'];

const loadStyles = (): Promise<BackToMainStyles> =>
  loadIsolated(async () => (await import('@/components/ui-back-to-main/styles')).default);

describe('back-to-main band styles', () => {
  it('top-aligns the toolkit link so the band carries no line-box strut', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      band: {
        '& .MuiButtonBase-root': {
          verticalAlign: 'top',
        },
      },
    });
  });
});
