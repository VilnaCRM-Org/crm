import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-notification-history/styles'))['default'];
type FrameStyles = (typeof import('@/components/ui-notification-history/frame-styles'))['default'];

const FORCED = '@media (forced-colors: active)';
const TINT = '#FBFBFB';
const LINK = '#0074B5';

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-notification-history/styles')).default);

const loadFrame = (): Promise<FrameStyles> =>
  loadIsolated(
    async () => (await import('@/components/ui-notification-history/frame-styles')).default
  );

describe('notification history styles', () => {
  it('tints only the unread row #FBFBFB and keeps every text readable on it', async () => {
    const { unread, row } = await loadStyles();

    expect(unread.backgroundColor).toBe(TINT);
    expect(row).not.toHaveProperty('backgroundColor');
    expect(contrast('#404142', TINT)).toBeCloseTo(9.89, 1);
    expect(contrast('#57595B', TINT)).toBeCloseTo(6.8, 1);
  });

  it('sets unread titles in Inter Medium #404142, read ones in Regular #57595B', async () => {
    const { message, unreadMessage } = await loadStyles();

    expect(message).toMatchObject({
      fontFamily: 'Inter, sans-serif',
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: '18px',
      color: '#57595B',
    });
    expect(unreadMessage).toEqual({ fontWeight: 500, color: '#404142' });
    expect(Reflect.get(message, FORCED)).toEqual({ color: 'CanvasText' });
  });

  it('draws the 4 px unread dot after the title in #0074B5, not brand yellow', async () => {
    const { dot } = await loadStyles();

    expect(dot).toMatchObject({
      display: 'inline-block',
      marginLeft: '8px',
      verticalAlign: 'middle',
      width: '4px',
      height: '4px',
      borderRadius: '50%',
    });
    expect(dot.backgroundColor).toBe(LINK);
    expect(contrast(LINK, TINT)).toBeCloseTo(4.86, 1);
    expect(contrast('#FFC01E', TINT)).toBeCloseTo(1.6, 1);
  });

  it('renders the dot as CanvasText in forced colors', async () => {
    const { dot } = await loadStyles();

    expect(Reflect.get(dot, FORCED)).toEqual({ backgroundColor: 'CanvasText' });
  });

  it('sets the time in Inter Medium Italic 12 px #57595B, not the Figma grey', async () => {
    const { time } = await loadStyles();

    expect(time).toMatchObject({
      fontFamily: 'Inter, sans-serif',
      fontStyle: 'italic',
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: '18px',
      color: '#57595B',
    });
    expect(contrast('#969B9D', '#FFFFFF')).toBeCloseTo(2.8, 1);
    expect(Reflect.get(time, FORCED)).toEqual({ color: 'CanvasText' });
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

  it('draws mark-all as the Figma bordered button in Inter Medium #1B2327', async () => {
    const { markAll } = await loadStyles();

    expect(markAll).toMatchObject({
      boxSizing: 'border-box',
      width: '100%',
      minHeight: '3.125rem',
      padding: '14px 21px',
      border: '2px solid #E1E7EA',
      borderRadius: '0.75rem',
      backgroundColor: '#FFFFFF',
      cursor: 'pointer',
      fontFamily: 'Inter, sans-serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '18px',
      color: '#1B2327',
    });
    expect(Reflect.get(markAll, '&:hover')).toEqual({ backgroundColor: TINT });
    expect(Reflect.get(markAll, FORCED)).toEqual({
      color: 'ButtonText',
      border: '2px solid ButtonText',
    });
    expect(contrast('#1B2327', '#FFFFFF')).toBeGreaterThan(4.5);
  });

  it('keeps mark-all in a sticky footer over a white fade', async () => {
    const { footer } = await loadStyles();

    expect(footer).toEqual({
      position: 'sticky',
      bottom: 0,
      padding: '16px 15px 13px',
      background: 'linear-gradient(to top, #FFFFFF 70%, rgba(255, 255, 255, 0))',
    });
  });

  it('shows the empty state in #57595B at 7.03:1', async () => {
    const { empty } = await loadStyles();

    expect(empty.color).toBe('#57595B');
    expect(contrast(empty.color, '#FFFFFF')).toBeCloseTo(7.03, 1);
  });

  it('lays out the heading, the 71 px rows and the dividers after the Figma panel', async () => {
    const { heading, row, list } = await loadStyles();

    expect(heading).toMatchObject({
      margin: 0,
      padding: '18px 16px 15px',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: '22px',
      color: '#1A1C1E',
    });
    expect(row).toMatchObject({
      position: 'relative',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      minHeight: '71px',
      padding: '15px 16px',
    });
    expect(list).toMatchObject({
      listStyle: 'none',
      margin: 0,
      padding: 0,
      borderTop: '1px solid #E1E7EA',
    });
    expect(Reflect.get(list, '& > li')).toEqual({ borderBottom: '1px solid #E1E7EA' });
  });

  it('shows a focus ring outside the mark-all button', async () => {
    const { markAll } = await loadStyles();

    expect(Reflect.get(markAll, '&:focus-visible')).toEqual({
      outline: '2px solid #1A1C1E',
      outlineOffset: '2px',
    });
  });
});

describe('notification history frame styles', () => {
  it('uses the caret-card geometry of the bell notice at every shell layout', async () => {
    const { frame, scroller } = await loadFrame();

    expect(frame).toMatchObject({
      position: 'fixed',
      width: 'min(313px, calc(100vw - 32px))',
      top: 'calc(var(--bell-bottom, 64px) + 10px)',
      borderRadius: '0.75rem',
      border: '2px solid #E1E7EA',
      backgroundColor: '#FFFFFF',
      boxShadow: '0 8px 27px rgba(49, 59, 67, 0.14)',
    });
    expect(frame).not.toHaveProperty('display');
    expect(scroller).toMatchObject({
      maxHeight: 'max(3.125rem, calc(100dvh - 80px))',
      overflowY: 'auto',
    });
  });

  it('draws a 26 by 6 caret on the bell centre with a white triangle inside it', async () => {
    const { frame } = await loadFrame();

    expect(Reflect.get(frame, '&::before')).toMatchObject({
      top: '-8px',
      left: 'calc(var(--bell-centre-x, 0px) - var(--bell-card-left) - 15px)',
      backgroundColor: '#E1E7EA',
      width: '26px',
      height: '6px',
      clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
    });
    expect(Reflect.get(frame, '&::after')).toMatchObject({
      top: '-6px',
      width: '20px',
      left: 'calc(var(--bell-centre-x, 0px) - var(--bell-card-left) - 12px)',
      backgroundColor: '#FFFFFF',
      clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
    });
  });

  it('uses a CanvasText border and drops the shadow in forced colors', async () => {
    const { frame } = await loadFrame();

    expect(Reflect.get(frame, FORCED)).toMatchObject({
      border: '2px solid CanvasText',
      boxShadow: 'none',
    });
  });
});
