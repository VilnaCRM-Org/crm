import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-notification-content/styles'))['default'];

const SM = '@media (min-width:480px)';
const DESKTOP = '@media (min-width:1440px)';
const FORCED = '@media (forced-colors: active)';

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-notification-content/styles')).default);

describe('notification content styles', () => {
  it('draws the text, the action and the close control in the dark colour', async () => {
    const styles = await loadStyles();

    expect(styles.root.color).toBe('#1A1C1E');
    expect(styles.action.color).toBe('#1A1C1E');
    expect(styles.close.color).toBe('#1A1C1E');
    expect(styles.action.color).not.toBe('#0074B5');
  });

  it('keeps the dark text at 14.96:1 or better on the white card', async () => {
    const styles = await loadStyles();

    expect(contrast(styles.root.color, '#FFFFFF')).toBeGreaterThanOrEqual(14.96);
  });

  it('keeps the time muted at 7:1 on white', async () => {
    const styles = await loadStyles();

    expect(styles.time.color).toBe('#57595B');
    expect(contrast(styles.time.color, '#FFFFFF')).toBeGreaterThanOrEqual(7);
  });

  it('gives close and action a 44 px hit area below sm and 24 px from sm', async () => {
    const styles = await loadStyles();

    expect(styles.close).toMatchObject({
      margin: '-0.75rem',
      minWidth: '2.75rem',
      minHeight: '2.75rem',
    });
    expect(Reflect.get(styles.close, SM)).toMatchObject({
      margin: 0,
      minWidth: '1.5rem',
      minHeight: '1.5rem',
    });
    expect(styles.action).toMatchObject({
      margin: '-0.75rem 0',
      minWidth: 0,
      minHeight: '2.75rem',
    });
    expect(Reflect.get(styles.action, SM)).toMatchObject({ margin: 0, minHeight: '1.5rem' });
  });

  it('draws a 2 px dark focus ring at offset 2 on both controls', async () => {
    const styles = await loadStyles();
    const ring = { outline: '2px solid #1A1C1E', outlineOffset: '2px' };

    expect(styles.close['&:focus-visible']).toEqual(ring);
    expect(styles.action['&:focus-visible']).toEqual(ring);
  });

  it('keeps both controls transparent and draws no ripple in reduced motion', async () => {
    const styles = await loadStyles();

    for (const control of [styles.action, styles.close]) {
      expect(control['&:hover, &:focus-visible']).toEqual({ backgroundColor: 'transparent' });
      expect(control['@media (prefers-reduced-motion: reduce)']).toEqual({
        '& .MuiTouchRipple-root': { display: 'none' },
      });
    }
  });

  it('underlines the action and lays the grid out icon, message, close', async () => {
    const styles = await loadStyles();

    expect(styles.action.textDecoration).toBe('underline');
    expect(styles.root).toMatchObject({
      display: 'grid',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto',
      columnGap: '0.375rem',
      rowGap: '0.25rem',
    });
    expect(Reflect.get(styles.root, SM)).toEqual({ columnGap: '0.5rem' });
    expect(styles.close).toMatchObject({ gridColumn: 3, gridRow: 1 });
    expect(styles.time.gridColumn).toBe(2);
    expect(styles.action.gridColumn).toBe(2);
  });

  it('sizes the icon, the message and the close glyph', async () => {
    const styles = await loadStyles();

    expect(styles.icon).toEqual({
      gridColumn: 1,
      gridRow: 1,
      display: 'inline-flex',
      fontSize: '1.25rem',
      [SM]: { fontSize: '1.5rem' },
      [DESKTOP]: { margin: '-0.1875rem 0' },
    });
    expect(styles.message).toEqual({
      gridColumn: 2,
      gridRow: 1,
      minWidth: 0,
      overflowWrap: 'anywhere',
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      [SM]: { fontSize: '1rem', lineHeight: '1.5rem' },
      [DESKTOP]: { fontSize: '0.875rem', lineHeight: '1.125rem' },
    });
    expect(styles.close.fontSize).toBe('1.25rem');
    expect(Reflect.get(styles.close, SM)).toEqual({
      margin: 0,
      minWidth: '1.5rem',
      minHeight: '1.5rem',
      fontSize: '1.5rem',
    });
  });

  it('draws the desktop row as two 18 px lines, 36 px in all', async () => {
    const styles = await loadStyles();

    expect(Reflect.get(styles.root, DESKTOP)).toEqual({ rowGap: 0 });
    expect(Reflect.get(styles.time, DESKTOP)).toEqual({
      fontFamily: 'Inter',
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: '1.125rem',
    });
    expect(Reflect.get(styles.close, DESKTOP)).toEqual({ margin: '-0.1875rem 0' });
    expect(Reflect.get(styles.action, DESKTOP)).toEqual({
      marginTop: '0.25rem',
      fontSize: '0.875rem',
    });
  });

  it('uses system colours and keeps the focus ring visible in forced colors', async () => {
    const styles = await loadStyles();

    expect(styles.root[FORCED]).toEqual({ color: 'CanvasText' });
    expect(styles.time[FORCED]).toEqual({ color: 'CanvasText' });
    for (const control of [styles.action, styles.close]) {
      expect(control[FORCED]).toEqual({
        color: 'ButtonText',
        '&:focus-visible': { outlineColor: 'CanvasText' },
      });
    }
  });
});
