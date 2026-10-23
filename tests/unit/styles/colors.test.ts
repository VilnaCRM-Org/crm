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

type ColorsModule = typeof import('@/styles/colors');
type CustomColors = ColorsModule['customColors'];

const loadCustomColors = (): Promise<CustomColors> =>
  loadIsolated(async () => (await import('@/styles/colors')).customColors);

const loadColors = (): Promise<ColorsModule> => loadIsolated(async () => import('@/styles/colors'));

describe('shell tokens', () => {
  it('holds the Figma values the palette had no token for, exactly as drawn', async () => {
    const { shell } = await loadCustomColors();

    expect(shell).toEqual({
      currentTint: 'rgba(30, 174, 255, 0.1)',
      searchHoverShadow: '0 4px 9px rgba(74, 78, 95, 0.1)',
      cardShadow: '0 8px 27px rgba(49, 59, 67, 0.05)',
      popoverShadow: '0 8px 27px rgba(49, 59, 67, 0.14)',
    });
  });

  it('derives the current-row tint from the primary blue at 10 % alpha', async () => {
    const {
      paletteColors: palette,
      customColors: { shell },
    } = await loadColors();
    const [red, green, blue] = [1, 3, 5].map((start) =>
      Number.parseInt(palette.primary.main.slice(start, start + 2), 16)
    );

    expect(shell.currentTint).toBe(`rgba(${red}, ${green}, ${blue}, 0.1)`);
  });

  it('keeps the current-row text and the focus ring on their existing exact tokens', async () => {
    const { paletteColors: palette, customColors: custom } = await loadColors();

    expect(palette.primary.active).toBe('#0399ED');
    expect(custom.text.dark).toBe('#1A1C1E');
  });

  it('adds no second entry for a value the palette already names', async () => {
    const { paletteColors: palette, customColors: custom } = await loadColors();
    const named = JSON.stringify({ palette, custom: { ...custom, shell: undefined } });

    Object.values(custom.shell).forEach((value) => {
      expect(named).not.toContain(value);
    });
  });
});
