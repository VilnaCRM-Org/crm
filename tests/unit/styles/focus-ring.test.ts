import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Ring = (typeof import('@/styles/focus-ring'))['focusVisibleRing'];
type Palette = (typeof import('@/styles/colors'))['paletteColors'];

const loadRing = (): Promise<Ring> =>
  loadIsolated(async () => (await import('@/styles/focus-ring')).focusVisibleRing);

const loadPalette = (): Promise<Palette> =>
  loadIsolated(async () => (await import('@/styles/colors')).paletteColors);

describe('focusVisibleRing', () => {
  it('paints a 2px solid #404142 outline offset by 2px under :focus-visible', async () => {
    const ring = await loadRing();

    expect(ring).toEqual({
      '&:focus-visible': { outline: '2px solid #404142', outlineOffset: '2px' },
    });
  });

  it('holds 10.23:1 against white', async () => {
    const ring = await loadRing();
    const colour = ring['&:focus-visible'].outline.replace('2px solid ', '');

    expect(contrast(colour, '#FFFFFF')).toBeCloseTo(10.23, 2);
  });
});

describe('paletteColors.border.strong', () => {
  it('is #80878A beside the unchanged default border', async () => {
    const { border } = await loadPalette();

    expect(border).toEqual({ default: '#EAECEE', strong: '#80878A' });
  });

  it('holds 3.65:1 on white and 3.53:1 on #FBFBFB', async () => {
    const { border } = await loadPalette();

    expect(contrast(border.strong, '#FFFFFF')).toBeCloseTo(3.65, 2);
    expect(contrast(border.strong, '#FBFBFB')).toBeCloseTo(3.53, 2);
  });
});
