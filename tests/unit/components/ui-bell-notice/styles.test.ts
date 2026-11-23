import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-bell-notice/styles'))['default'];

const DESKTOP = '@media (min-width:1440px)';
const BELOW = '@media (max-width:1439.95px)';
const DESKTOP_COLOURS = '@media (min-width:1440px) and (forced-colors: none)';
const REDUCED = '@media (prefers-reduced-motion: reduce)';
const FORCED = '@media (forced-colors: active)';
const CARD_SHADOW = 'drop-shadow(0 8px 27px rgba(49, 59, 67, 0.05))';
const WIDTH = 'min(313px, calc(100vw - 32px))';
const CENTRED = `calc(var(--bell-centre-x, 100vw) - ${WIDTH} / 2)`;
const LEFT = `clamp(16px, ${CENTRED}, calc(100vw - 16px - ${WIDTH}))`;

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-bell-notice/styles')).default);

const at = (style: object, key: string): Record<string, unknown> =>
  Object.entries(style).find(([name]) => name === key)?.[1] as Record<string, unknown>;

describe('bell notice styles', () => {
  it('draws one neutral union outline as four 1 px drop shadows and the card shadow', async () => {
    const { root } = await loadStyles();

    expect(root['--bell-notice-edge']).toBe('#80878A');
    expect(at(root, DESKTOP_COLOURS)).toEqual({
      filter: [
        'drop-shadow(1px 0 0 var(--bell-notice-edge))',
        'drop-shadow(-1px 0 0 var(--bell-notice-edge))',
        'drop-shadow(0 1px 0 var(--bell-notice-edge))',
        'drop-shadow(0 -1px 0 var(--bell-notice-edge))',
        CARD_SHADOW,
      ].join(' '),
    });
    expect(root).not.toHaveProperty('filter');
    expect(at(root, DESKTOP)).not.toHaveProperty('filter');
  });

  it('keeps the edge at 3:1 or more on the page and on white', async () => {
    const { root } = await loadStyles();
    const edge = root['--bell-notice-edge'];

    expect(contrast(edge, '#FBFBFB')).toBeGreaterThanOrEqual(3);
    expect(contrast(edge, '#FFFFFF')).toBeGreaterThanOrEqual(3);
  });

  it('keeps the message, the time and the error icon readable on white', async () => {
    const { body } = await loadStyles();

    expect(body.color).toBe('#1A1C1E');
    expect(contrast(body.color, '#FFFFFF')).toBeCloseTo(17.09, 1);
    expect(contrast('#57595B', '#FFFFFF')).toBeCloseTo(7.03, 1);
    expect(contrast('#969B9D', '#FFFFFF')).toBeCloseTo(2.81, 1);
    expect(contrast('#DC3939', '#FFFFFF')).toBeCloseTo(4.48, 1);
  });

  it('fuses a 48 wide tab and a 279 wide card along one left edge on desktop', async () => {
    const { root, pill, card } = await loadStyles();

    expect(at(root, DESKTOP)).toMatchObject({ position: 'absolute', top: 0, left: 0 });
    expect(at(pill, DESKTOP)).toMatchObject({
      display: 'block',
      position: 'absolute',
      left: 0,
      top: 0,
      width: '48px',
      height: '67px',
      borderRadius: '24px 24px 0 0',
      backgroundColor: '#FFFFFF',
    });
    expect(at(card, DESKTOP)).toMatchObject({
      position: 'absolute',
      left: 0,
      top: '55px',
      width: '279px',
      minHeight: '62px',
      borderRadius: '0 0.75rem 0.75rem 0.75rem',
      border: 0,
      boxShadow: 'none',
    });
    expect(pill.display).toBe('none');
  });

  it('draws the caret card below desktop with the neutral border and a shadow', async () => {
    const { card } = await loadStyles();

    expect(card).toMatchObject({
      position: 'fixed',
      width: WIDTH,
      borderRadius: '0.5rem',
      border: '1px solid var(--bell-notice-edge)',
      boxShadow: '0 8px 27px rgba(49, 59, 67, 0.14)',
      backgroundColor: '#FFFFFF',
      left: LEFT,
      '--bell-card-left': LEFT,
      top: 'calc(var(--bell-bottom, 64px) + 10px)',
    });
  });

  it('draws a 26 by 6 caret on the bell centre with a white triangle inside it', async () => {
    const { caret } = await loadStyles();

    expect(caret).toMatchObject({
      position: 'absolute',
      top: '-7px',
      width: '26px',
      height: '6px',
      backgroundColor: 'var(--bell-notice-edge)',
      clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
      left: 'calc(var(--bell-centre-x, 0px) - var(--bell-card-left) - 14px)',
    });
    expect(Reflect.get(caret, '&::after')).toMatchObject({
      backgroundColor: '#FFFFFF',
      clipPath: 'polygon(50% 0, 0 100%, 100% 100%)',
    });
    expect(at(caret, DESKTOP)).toEqual({ display: 'none' });
  });

  it('lays the body out with padding 15 14 11, a height cap and scrolling', async () => {
    const { body, list } = await loadStyles();

    expect(body).toMatchObject({
      padding: '15px 14px 11px 14px',
      maxHeight: 'max(4rem, calc(50dvh - 4rem))',
      overflowY: 'auto',
    });
    expect(body).not.toHaveProperty(DESKTOP);
    expect(list).toMatchObject({ gap: '0.75rem', listStyle: 'none', margin: 0, padding: 0 });
    expect(Reflect.get(list, '& > li + li')).toEqual({
      borderTop: '1px solid #E1E7EA',
      paddingTop: '0.75rem',
    });
  });

  it('enters with translateY(-8px) and opacity over 180 ms from the bell', async () => {
    const { root, card } = await loadStyles();
    const desktop = String(at(root, DESKTOP).animation);
    const caret = String(at(card, BELOW).animation);

    for (const animation of [desktop, caret]) {
      expect(animation).toContain('translateY(-8px)');
      expect(animation).toContain('opacity: 0');
      expect(animation).toContain('180ms cubic-bezier(0.2, 0, 0, 1)');
    }
    expect(at(root, DESKTOP).transformOrigin).toBe('24px 0');
    expect(at(card, BELOW).transformOrigin).toBe(
      'calc(var(--bell-centre-x, 0px) - var(--bell-card-left)) 0'
    );
  });

  it('removes both animations under reduced motion', async () => {
    const { root, card } = await loadStyles();

    expect(Reflect.get(root, REDUCED)).toEqual({ animation: 'none' });
    expect(Reflect.get(card, REDUCED)).toEqual({ animation: 'none' });
  });

  it('uses a CanvasText border on the pill and the card in forced colors', async () => {
    const { pill, card } = await loadStyles();

    expect(Reflect.get(pill, FORCED)).toEqual({ border: '1px solid CanvasText' });
    expect(Reflect.get(card, FORCED)).toEqual({
      border: '1px solid CanvasText',
      boxShadow: 'none',
    });
  });

  it('gives the card the pointer back from the click-through root', async () => {
    const { root, card } = await loadStyles();

    expect(at(root, DESKTOP).pointerEvents).toBe('none');
    expect(at(card, DESKTOP).pointerEvents).toBe('auto');
  });
});
