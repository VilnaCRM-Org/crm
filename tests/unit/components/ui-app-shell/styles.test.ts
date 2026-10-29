import layoutStyles from '@/components/layouts/app-layout.styles';
import loadIsolated from '@tests/unit/utils/isolated-module';

type ShellStyles = (typeof import('@/components/ui-app-shell/styles'))['default'];

const loadStyles = (): Promise<ShellStyles> =>
  loadIsolated(async () => (await import('@/components/ui-app-shell/styles')).default);

describe('app shell styles', () => {
  it('reuses the eager header slot, so the header lands where the placeholder was', async () => {
    const styles = await loadStyles();

    expect(styles.header).toEqual(layoutStyles.headerSlot);
  });

  it('insets the desktop sidebar 12px from the left and 10px below the header', async () => {
    const styles = await loadStyles();

    expect(styles.nav.desktop).toEqual({
      ...layoutStyles.navSlot,
      boxSizing: 'border-box',
      paddingTop: '10px',
      paddingLeft: '12px',
    });
  });

  it('insets the tablet sidebar 13px from the left and 10px below the header', async () => {
    const styles = await loadStyles();

    expect(styles.nav.tablet).toEqual({
      ...layoutStyles.navSlot,
      boxSizing: 'border-box',
      paddingTop: '10px',
      paddingLeft: '13px',
    });
  });

  it('insets both sidebars by the layout inset the placeholder height includes', async () => {
    const styles = await loadStyles();

    expect(styles.nav.desktop.paddingTop).toBe(layoutStyles.navInsetTop);
    expect(styles.nav.tablet.paddingTop).toBe(layoutStyles.navInsetTop);
  });

  it('sticks the sidebar 74px from the top, under the 64px header', async () => {
    const styles = await loadStyles();

    expect(styles.sticky).toEqual({ position: 'sticky', top: '74px' });
  });

  it('builds a placeholder as wide as the loaded sidebar column it stands in for', async () => {
    const styles = await loadStyles();

    expect(layoutStyles.navPlaceholder.width).toBe('250px');
    expect(
      layoutStyles.navPlaceholder['@media (min-width:1024px) and (max-width:1439.95px)'].width
    ).toBe(`${13 + 238}px`);
    expect(styles.nav.desktop.paddingLeft).toBe('12px');
  });
});
