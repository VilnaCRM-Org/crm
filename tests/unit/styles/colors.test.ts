import contrast from '@tests/unit/utils/contrast-ratio';
import loadIsolated from '@tests/unit/utils/isolated-module';

type Colors = (typeof import('@/styles/colors'))['paletteColors'];

const loadPalette = (): Promise<Colors> =>
  loadIsolated(async () => (await import('@/styles/colors')).paletteColors);

describe('paletteColors.error', () => {
  it('keeps error.main for borders and adds error.text for field-error text', async () => {
    const palette = await loadPalette();

    expect(palette.error).toEqual({ main: '#DC3939', text: '#C62828', surface: '#FDECEC' });
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

describe('toast tokens', () => {
  it('pins the success surface beside the existing success tokens', async () => {
    const { success } = await loadPalette();

    expect(success).toEqual({
      main: '#4CAF50',
      text: '#2E7D32',
      surface: '#E8F4EF',
    });
  });

  it('gives the dark toast text 15.1:1 and 14.9:1 on the two surfaces', async () => {
    const { success, error } = await loadPalette();

    expect(contrast('#1A1C1E', success.surface)).toBeGreaterThanOrEqual(15.1);
    expect(contrast('#1A1C1E', error.surface)).toBeGreaterThanOrEqual(14.9);
  });

  it('keeps both toast icons at 3:1 or more on their surfaces', async () => {
    const { success, error } = await loadPalette();

    expect(contrast(success.text, success.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(error.main, error.surface)).toBeGreaterThanOrEqual(3);
  });
});
