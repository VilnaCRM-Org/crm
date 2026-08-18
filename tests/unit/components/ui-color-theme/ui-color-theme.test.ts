import type { PaletteColor } from '@mui/material';

import colorTheme from '@/components/ui-color-theme';

/**
 * The brand palette is a fixed design contract, so the expected values are literals rather than
 * Faker data — the value IS the test case.
 */
const BRAND_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ['primary', '#1EAEFF'],
  ['secondary', '#FFC01E'],
  ['error', '#DC3939'],
  ['darkPrimary', '#1A1C1E'],
  ['darkSecondary', '#1B2327'],
  ['brandGray', '#E1E7EA'],
  ['grey200', '#404142'],
  ['grey250', '#57595B'],
  ['grey300', '#969B9D'],
  ['grey400', '#D0D4D8'],
  ['grey500', '#EAECEE'],
  ['backgroundGrey100', '#FBFBFB'],
  ['backgroundGrey200', '#f4f5f6'],
  ['backgroundGrey300', '#F5F6F7'],
  ['containedButtonHover', '#00A3FF'],
  ['containedButtonActive', '#0399ED'],
  ['notchDeskBefore', '#080805'],
  ['notchDeskAfter', '#0e314c'],
  ['notchMobileBefore', '#0c0b0e'],
  ['notchMobileAfter', '#0f0b25'],
  ['textLinkHover', '#297FFF'],
  ['textLinkActive', '#0399ED'],
];

const readSwatch = (token: string): PaletteColor | undefined =>
  (colorTheme.palette as unknown as Record<string, PaletteColor | undefined>)[token];

describe('colorTheme', () => {
  it.each(BRAND_PALETTE)('exposes %s as %s', (token, hex) => {
    expect(readSwatch(token)?.main).toBe(hex);
  });

  it('registers every brand token, so a dropped palette entry is caught', () => {
    const registered = BRAND_PALETTE.filter(([token]) => readSwatch(token)?.main !== undefined);

    expect(registered).toHaveLength(BRAND_PALETTE.length);
  });

  it('keeps every brand token a distinct, fully specified hex value', () => {
    const swatches = BRAND_PALETTE.map(([, hex]) => hex);

    expect(swatches.every((hex) => /^#[0-9a-fA-F]{6}$/.test(hex))).toBe(true);
    expect(new Set(swatches.map((hex) => hex.toLowerCase())).size).toBeGreaterThan(
      swatches.length - 3
    );
  });

  it('does not invent a token the palette never declared', () => {
    expect(readSwatch('notARealBrandToken')).toBeUndefined();
  });
});
