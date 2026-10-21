import loadIsolated from '@tests/unit/utils/isolated-module';

type AppLayoutStyles = (typeof import('@/components/layouts/app-layout.styles'))['default'];

const loadStyles = (): Promise<AppLayoutStyles> =>
  loadIsolated(async () => (await import('@/components/layouts/app-layout.styles')).default);

describe('app layout styles', () => {
  it('stretches main as a flex column and only drops the programmatic focus ring', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      main: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        '&:focus:not(:focus-visible)': { outline: 'none' },
      },
      footerSlot: { minHeight: '4.125rem' },
    });
  });
});
