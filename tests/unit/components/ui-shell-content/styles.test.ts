import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-shell-content/styles'))['default'];

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-shell-content/styles')).default);

describe('shell content styles', () => {
  it('pins the insets: 15 px, 26 px from 768 px, 12 px beside the sidebar from 1024', async () => {
    const styles = await loadStyles();

    expect(styles).toEqual({
      container: {
        boxSizing: 'border-box',
        width: '100%',
        paddingInline: '15px',
        '@media (min-width:768px)': { paddingInline: '26px' },
        '@media (min-width:1024px)': { paddingInline: '12px' },
      },
    });
  });
});
