import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-notification-history/styles'))['default'];
type FrameStyles = (typeof import('@/components/ui-notification-history/frame-styles'))['default'];

const FORCED = '@media (forced-colors: active)';
const SM = '@media (min-width:480px)';
const TINT = '#E8F7FF';
const LINK = '#0074B5';

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-notification-history/styles')).default);

const loadFrame = (): Promise<FrameStyles> =>
  loadIsolated(
    async () => (await import('@/components/ui-notification-history/frame-styles')).default
  );

describe('notification history styles', () => {
  it('tints only the unread row and keeps the text readable on the tint', async () => {
    const { unread, row } = await loadStyles();

    expect(unread.backgroundColor).toBe(TINT);
    expect(row).not.toHaveProperty('backgroundColor');
    expect(contrast('#1A1C1E', TINT)).toBeCloseTo(15.61, 1);
    expect(contrast('#57595B', TINT)).toBeCloseTo(6.42, 1);
    expect(contrast('#DC3939', TINT)).toBeCloseTo(4.09, 1);
  });

  it('draws the unread dot 8 px in #0074B5, not the 2.46:1 brand blue', async () => {
    const { dot } = await loadStyles();

    expect(dot).toMatchObject({ width: '0.5rem', height: '0.5rem', borderRadius: '50%' });
    expect(dot.backgroundColor).toBe(LINK);
    expect(contrast(LINK, '#FFFFFF')).toBeCloseTo(5.04, 1);
    expect(contrast(LINK, TINT)).toBeCloseTo(4.6, 1);
    expect(contrast('#1EAEFF', '#FFFFFF')).toBeCloseTo(2.46, 1);
  });

  it('renders the dot as CanvasText in forced colors', async () => {
    const { dot } = await loadStyles();

    expect(Reflect.get(dot, FORCED)).toEqual({ backgroundColor: 'CanvasText' });
  });

  it('hides the unread text visually without removing it', async () => {
    const { hidden } = await loadStyles();

    expect(hidden).toMatchObject({
      position: 'absolute',
      width: '1px',
      height: '1px',
      overflow: 'hidden',
      clip: 'rect(0 0 0 0)',
    });
    expect(hidden).not.toHaveProperty('display');
  });

  it('draws the mark-all button as a #0074B5 text button at least 44 px tall', async () => {
    const { markAll } = await loadStyles();

    expect(markAll).toMatchObject({
      color: LINK,
      border: 0,
      background: 'none',
      width: '100%',
      minHeight: '3.125rem',
      cursor: 'pointer',
    });
    expect(markAll.minHeight).toBe('3.125rem');
    expect(Reflect.get(markAll, FORCED)).toEqual({ color: 'ButtonText' });
  });

  it('shows the empty state in #57595B at 7.03:1', async () => {
    const { empty } = await loadStyles();

    expect(empty.color).toBe('#57595B');
    expect(contrast(empty.color, '#FFFFFF')).toBeCloseTo(7.03, 1);
  });

  it('lays out the heading, the rows and the divider after the Figma panel', async () => {
    const { heading, row, list } = await loadStyles();

    expect(heading).toMatchObject({
      margin: 0,
      padding: '18px 16px 15px',
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: '22px',
      color: '#1A1C1E',
    });
    expect(row).toMatchObject({ position: 'relative', padding: '15px 2.5rem 15px 16px' });
    expect(list).toMatchObject({ listStyle: 'none', margin: 0, padding: 0 });
    expect(Reflect.get(list, '& > li + li')).toEqual({ borderTop: '1px solid #E1E7EA' });
  });

  it('shows a focus ring on the mark-all button inside the scroll area', async () => {
    const { markAll } = await loadStyles();

    expect(Reflect.get(markAll, '&:focus-visible')).toEqual({
      outline: '2px solid #1A1C1E',
      outlineOffset: '-2px',
    });
    expect(SM).toBe('@media (min-width:480px)');
  });
});

describe('notification history frame styles', () => {
  it('uses the caret-card geometry of the bell notice at every shell layout', async () => {
    const { frame, scroller } = await loadFrame();

    expect(frame).toMatchObject({
      position: 'fixed',
      width: 'min(313px, calc(100vw - 32px))',
      top: 'calc(var(--bell-bottom, 64px) + 10px)',
      borderRadius: '0.5rem',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 8px 27px rgba(49, 59, 67, 0.14)',
    });
    expect(frame).not.toHaveProperty('display');
    expect(scroller).toMatchObject({
      maxHeight: 'max(3.125rem, calc(100dvh - 80px - var(--toast-stack-clearance, 0px)))',
      overflowY: 'auto',
    });
  });

  it('draws a 26 by 6 caret on the bell centre with a white triangle inside it', async () => {
    const { frame } = await loadFrame();

    expect(Reflect.get(frame, '&::before')).toMatchObject({
      top: '-7px',
      width: '26px',
      height: '6px',
      clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
    });
    expect(Reflect.get(frame, '&::after')).toMatchObject({
      backgroundColor: '#FFFFFF',
      clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
    });
  });

  it('uses a CanvasText border and drops the shadow in forced colors', async () => {
    const { frame } = await loadFrame();

    expect(Reflect.get(frame, FORCED)).toMatchObject({
      border: '1px solid CanvasText',
      boxShadow: 'none',
    });
  });
});
