import loadIsolated from '@tests/unit/utils/isolated-module';

type Colors = (typeof import('@/styles/colors'))['paletteColors'];

const loadPalette = (): Promise<Colors> =>
  loadIsolated(async () => (await import('@/styles/colors')).paletteColors);

const channel = (hex: string, offset: number): number => {
  const value = Number.parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number =>
  0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);

const contrast = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
};

describe('paletteColors.error', () => {
  it('keeps error.main for borders and adds error.text for field-error text', async () => {
    const palette = await loadPalette();

    expect(palette.error).toEqual({ main: '#DC3939', text: '#C62828' });
  });

  it('gives error.text at least 5.6:1 on white and 4.9:1 on the error tint', async () => {
    const { error } = await loadPalette();

    expect(contrast(error.text, '#FFFFFF')).toBeGreaterThanOrEqual(5.6);
    expect(contrast(error.text, '#FDECEC')).toBeGreaterThanOrEqual(4.9);
  });

  it('keeps error.main above 3:1 for graphics but below 4.5:1 for text', async () => {
    const { error } = await loadPalette();

    expect(contrast(error.main, '#FFFFFF')).toBeGreaterThanOrEqual(3);
    expect(contrast(error.main, '#FFFFFF')).toBeLessThan(4.5);
  });
});
