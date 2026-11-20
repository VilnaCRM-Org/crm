import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Sx = Record<string, Record<string, unknown>>;

const MD = 768;
const CELL = '& .ui-pin-input__cell';
const FOCUS_SELECTOR = '&& .ui-pin-input__cell:focus:not([aria-disabled="true"])';
const HOVER_SELECTOR = '&& .ui-pin-input__cell:hover:not([aria-disabled="true"])';
const ERROR_SELECTOR = '&& .ui-pin-input__cell[aria-invalid="true"]:not([aria-disabled="true"])';
const MEDIA = `@media (min-width:${MD}px)`;

const loadSx = (): Promise<Sx> =>
  loadIsolated(async () => (await import('@/components/ui-pin-input/styles')).default as Sx);

describe('ui-pin-input styles', () => {
  it('draws the Figma rest state: #E1E7EA border, #57595B digit, primary caret', async () => {
    const sx = await loadSx();

    expect(sx[CELL]).toMatchObject({
      borderColor: '#E1E7EA',
      color: '#57595B',
      caretColor: '#1EAEFF',
    });
    expect(contrast('#57595B', '#FFFFFF')).toBeCloseTo(7.03, 2);
  });

  it('draws the Figma hover border #D0D4D8 above the compiled hover rule', async () => {
    const sx = await loadSx();

    expect(sx[HOVER_SELECTOR]).toEqual({ borderColor: '#D0D4D8' });
  });

  it('draws the error border in #DC3939 after the hover rule so it wins', async () => {
    const sx = await loadSx();

    expect(sx[ERROR_SELECTOR]).toEqual({ borderColor: '#DC3939' });
    const order = Object.keys(sx);
    expect(order.indexOf(ERROR_SELECTOR)).toBeGreaterThan(order.indexOf(HOVER_SELECTOR));
  });

  it('paints the error helper text in #D63333 under an outranking selector', async () => {
    const sx = await loadSx();

    expect(sx['&& .MuiFormHelperText-root.Mui-error']).toEqual({ color: '#D63333' });
    expect(contrast('#D63333', '#FFFFFF')).toBeCloseTo(4.79, 2);
  });

  it('draws no outline on a focused cell and inks its digit #1A1C1E', async () => {
    const sx = await loadSx();

    expect(sx[FOCUS_SELECTOR]).toEqual({ color: '#1A1C1E', outline: 'none' });
    expect(contrast('#1A1C1E', '#FFFFFF')).toBeCloseTo(17.09, 2);
  });

  it('shows the toolkit placeholder as the Figma ghost digit #D0D4D8', async () => {
    const sx = await loadSx();

    expect(sx[`${CELL}::placeholder`]).toEqual({ color: '#D0D4D8', opacity: 1 });
  });

  it('sizes each cell from its group, up to 49 x 64, so focus cannot resize it', async () => {
    const sx = await loadSx();

    expect(sx['& [role="group"]']).toMatchObject({
      gap: '4px',
      width: '100%',
      containerType: 'inline-size',
    });
    expect(sx[CELL]).toMatchObject({
      '--pin-cell-width': 'min(49px, calc((100cqw - 20px) / 6))',
      boxSizing: 'border-box',
      flex: '0 0 auto',
      width: 'var(--pin-cell-width)',
      minWidth: 0,
      maxWidth: 'none',
      minHeight: '64px',
      height: '64px',
    });
  });

  it('keeps the focused ghost digit centred, with the caret at its left edge', async () => {
    const sx = await loadSx();
    const focus = '&& .ui-pin-input__cell:focus';

    expect(sx[`${focus}:placeholder-shown:not([aria-disabled="true"])`]).toEqual({
      paddingLeft: 'calc((var(--pin-cell-width) - 2px - 1ch) / 2)',
      paddingRight: 0,
    });
    expect(sx[`${focus}:not([aria-disabled="true"])::placeholder`]).toEqual({ textIndent: 0 });
  });

  it('raises the cells to 64 x 86 with an 8px gap from md, by media query', async () => {
    const sx = await loadSx();
    const media = sx[MEDIA] as unknown as Sx;

    expect(media['& [role="group"]']).toEqual({ gap: '8px' });
    expect(media[CELL]).toEqual({
      '--pin-cell-width': 'min(64px, calc((100cqw - 40px) / 6))',
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

  it('makes the group wrapper full width so the root can fill it', async () => {
    const wrapper = await loadIsolated(
      async () => (await import('@/components/ui-pin-input/styles')).PIN_GROUP_WRAPPER_SX
    );

    expect(wrapper).toEqual({ width: '100%' });
  });
});
