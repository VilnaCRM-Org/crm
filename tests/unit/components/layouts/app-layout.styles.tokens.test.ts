import { readFileSync } from 'node:fs';
import path from 'node:path';

import breakpointsTheme from '@/components/ui-breakpoints';
import loadIsolated from '@tests/unit/utils/isolated-module';

type AppLayoutStyles = (typeof import('@/components/layouts/app-layout.styles'))['default'];

const loadStyles = (): Promise<AppLayoutStyles> =>
  loadIsolated(async () => (await import('@/components/layouts/app-layout.styles')).default);

const FROM_SIDEBAR = '@media (min-width:1024px)';

describe('app layout styles', () => {
  it('pins the sidebar breakpoint to the toolkit lg value', async () => {
    const styles = await loadStyles();

    expect(styles.sidebarBreakpoint).toBe(1024);
    expect(styles.sidebarBreakpoint).toBe(breakpointsTheme.breakpoints.values.lg);
  });

  it('keeps the tablet-only media query below the toolkit xl value', async () => {
    const styles = await loadStyles();
    const [, query] = Object.keys(styles.navPlaceholder).filter((key) => key.startsWith('@media'));

    expect(query).toBe(`${FROM_SIDEBAR} and (max-width:1439.95px)`);
    expect(breakpointsTheme.breakpoints.values.xl).toBe(1440);
  });

  it('draws one grid column plus the navigation column from the breakpoint', async () => {
    const styles = await loadStyles();

    expect(styles.frame).toEqual({
      flexGrow: 1,
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gridTemplateRows: '64px 1fr auto',
      [FROM_SIDEBAR]: { gridTemplateColumns: 'auto minmax(0, 1fr)' },
    });
  });

  it('reserves a sticky 64px header slot that spans every row so it can stick', async () => {
    const styles = await loadStyles();

    expect(styles.headerSlot).toEqual({
      gridColumn: '1 / -1',
      gridRow: '1 / -1',
      alignSelf: 'start',
      position: 'sticky',
      top: 0,
      zIndex: 1100,
      boxSizing: 'border-box',
      height: '64px',
    });
  });

  it('exposes the header height the sticky slot and the first grid row share', async () => {
    const styles = await loadStyles();

    expect(styles.headerHeight).toBe('64px');
    expect(styles.headerSlot.height).toBe(styles.headerHeight);
    expect(styles.frame.gridTemplateRows).toBe(`${styles.headerHeight} 1fr auto`);
  });

  it('places the navigation slot and shows its placeholder only from the breakpoint', async () => {
    const styles = await loadStyles();

    expect(styles.navSlot).toEqual({ gridColumn: 1, gridRow: 2 });
    expect(styles.navPlaceholder).toEqual({
      display: 'none',
      width: '250px',
      [FROM_SIDEBAR]: { display: 'block' },
      [`${FROM_SIDEBAR} and (max-width:1439.95px)`]: { width: '251px' },
    });
  });

  it('puts main in the second row, beside the navigation from the breakpoint', async () => {
    const styles = await loadStyles();

    expect(styles.main).toEqual({
      gridColumn: 1,
      gridRow: 2,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
      '&:focus:not(:focus-visible)': { outline: 'none' },
      [FROM_SIDEBAR]: { gridColumn: 2 },
    });
  });

  it('puts the footer in the last row across every column', async () => {
    const styles = await loadStyles();

    expect(styles.footerArea).toEqual({ gridColumn: '1 / -1', gridRow: 3 });
    expect(styles.footerSlot).toEqual({ minHeight: '4.125rem' });
  });

  it('imports neither the toolkit breakpoint seam nor any @mui module (eager path)', () => {
    const source = readFileSync(
      path.resolve(__dirname, '../../../../src/components/layouts/app-layout.styles.ts'),
      'utf8'
    );

    expect(source).not.toContain('ui-breakpoints');
    expect(source).not.toContain('@mui/');
    expect(source).not.toMatch(/^import /m);
  });
});
