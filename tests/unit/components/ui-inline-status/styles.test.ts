import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Styles = (typeof import('@/components/ui-inline-status/styles'))['default'];

const FORCED = '@media (forced-colors: active)';
const REDUCED = '@media (prefers-reduced-motion: reduce)';

const loadStyles = (): Promise<Styles> =>
  loadIsolated(async () => (await import('@/components/ui-inline-status/styles')).default);

describe('inline status styles', () => {
  it('sits 16 px below the action row with radius 8 and padding 12 16', async () => {
    const { block } = await loadStyles();

    expect(block).toMatchObject({
      marginTop: '1rem',
      borderRadius: '0.5rem',
      padding: '0.75rem 1rem',
      color: '#1A1C1E',
    });
  });

  it('has no border and no outer shadow in normal colours', async () => {
    const { block, tones } = await loadStyles();

    expect(block).not.toHaveProperty('border');
    expect(block).not.toHaveProperty('boxShadow');
    expect(tones.success.boxShadow).toBe('inset 4px 0 0 0 #2E7D32');
    expect(tones.error.boxShadow).toBe('inset 4px 0 0 0 #DC3939');
  });

  it('moves the e-mail placement up to 8 px', async () => {
    const { placements } = await loadStyles();

    expect(placements.email).toEqual({ marginTop: '0.5rem' });
    expect(placements.actions).toEqual({});
  });

  it('stacks the lines in a plain list with gap 8', async () => {
    const { list } = await loadStyles();

    expect(list).toMatchObject({
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      margin: 0,
      padding: 0,
      listStyle: 'none',
    });
  });

  it.each([
    ['success', '#E8F4EF', '#2E7D32', 15.15, 5.13, 4.55],
    ['error', '#FDECEC', '#DC3939', 14.96, 4.48, 3.92],
  ] as const)('keeps the %s tone readable', async (tone, fill, edge, text, edgeOnWhite, icon) => {
    const { block, tones } = await loadStyles();

    expect(tones[tone].backgroundColor).toBe(fill);
    expect(contrast(block.color, fill)).toBeCloseTo(text, 1);
    expect(contrast('#FFFFFF', edge)).toBeCloseTo(edgeOnWhite, 1);
    expect(contrast(edge, fill)).toBeCloseTo(icon, 1);
  });

  it('fades opacity 0 to 1 over 160 ms ease-out and animates no geometry', async () => {
    const { block } = await loadStyles();
    const animation = String(block.animation);

    expect(animation).toContain('160ms ease-out');
    expect(animation).toContain('opacity: 0');
    expect(animation).toContain('opacity: 1');
    expect(animation).not.toMatch(/transform|height|margin|padding/);
  });

  it('removes the animation under reduced motion', async () => {
    const { block } = await loadStyles();

    expect(Reflect.get(block, REDUCED)).toEqual({ animation: 'none' });
  });

  it('draws a CanvasText border and drops the accent in forced colors', async () => {
    const { block } = await loadStyles();

    expect(Reflect.get(block, FORCED)).toEqual({
      border: '1px solid CanvasText',
      boxShadow: 'none',
    });
  });

  it('declares no media query of its own besides motion and forced colors', async () => {
    const { block } = await loadStyles();

    expect(Object.keys(block).filter((key) => key.startsWith('@media'))).toEqual([REDUCED, FORCED]);
  });
});
