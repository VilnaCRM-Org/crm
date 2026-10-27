import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Sx = Record<string, Record<string, unknown>>;

const MD = 768;
const CELL = '& .ui-pin-input__cell';
const RING_SELECTOR = '&& .ui-pin-input__cell:focus-visible:not([aria-disabled="true"])';
const HOVER_SELECTOR = '&& .ui-pin-input__cell:hover:not([aria-disabled="true"])';
const ERROR_SELECTOR = '&& .ui-pin-input__cell[aria-invalid="true"]:not([aria-disabled="true"])';
const MEDIA = `@media (min-width:${MD}px)`;

const loadSx = (): Promise<Sx> =>
  loadIsolated(async () => (await import('@/components/ui-pin-input/styles')).default as Sx);

describe('ui-pin-input styles', () => {
  it('draws the rest border with border.strong and the digit in #1A1C1E', async () => {
    const sx = await loadSx();

    expect(sx[CELL]).toMatchObject({ borderColor: '#80878A', color: '#1A1C1E' });
    expect(contrast('#1A1C1E', '#FFFFFF')).toBeCloseTo(17.09, 2);
  });

  it('darkens the hover border to #57595B above the compiled hover rule', async () => {
    const sx = await loadSx();

    expect(sx[HOVER_SELECTOR]).toEqual({ borderColor: '#57595B' });
    expect(contrast('#57595B', '#FFFFFF')).toBeCloseTo(7.03, 2);
  });

  it('draws the error border in #DC3939 after the hover rule so it wins', async () => {
    const sx = await loadSx();

    expect(sx[ERROR_SELECTOR]).toEqual({ borderColor: '#DC3939' });
    const order = Object.keys(sx);
    expect(order.indexOf(ERROR_SELECTOR)).toBeGreaterThan(order.indexOf(HOVER_SELECTOR));
  });

  it('paints the focusVisibleRing values under an outranking selector', async () => {
    const sx = await loadSx();

    expect(sx[RING_SELECTOR]).toEqual({ outline: '2px solid #404142', outlineOffset: '2px' });
  });

  it('hides the toolkit placeholder with a transparent ::placeholder colour', async () => {
    const sx = await loadSx();

    expect(sx[`${CELL}::placeholder`]).toEqual({ color: 'transparent' });
  });

  it('lays the cells out below md as flexible 49 x 64 cells with a 4px gap', async () => {
    const sx = await loadSx();

    expect(sx['& [role="group"]']).toMatchObject({ gap: '4px', width: '100%' });
    expect(sx[CELL]).toMatchObject({
      flex: '1 1 0',
      minWidth: 0,
      width: 'auto',
      maxWidth: '49px',
      minHeight: '64px',
      height: '64px',
    });
  });

  it('restores 64 x 86 shrinkable cells with an 8px gap from md, by media query', async () => {
    const sx = await loadSx();
    const media = sx[MEDIA] as unknown as Sx;

    expect(media['& [role="group"]']).toEqual({ gap: '8px' });
    expect(media[CELL]).toEqual({
      flex: '0 1 auto',
      width: '64px',
      maxWidth: '64px',
      minWidth: 0,
      minHeight: '86px',
      height: '86px',
    });
  });

  it('uses a media query on the crm md width, never an sx breakpoint key', async () => {
    const sx = await loadSx();
    const keys = Object.keys(sx);

    expect(keys).toContain(MEDIA);
    expect(keys.filter((key) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(key))).toEqual([]);
  });

  it('makes the root full width so the cells can share it', async () => {
    const sx = await loadSx();

    expect(sx['&']).toEqual({ width: '100%' });
  });
});
