import type { Theme } from '@mui/material/styles';

import backToMainStyles from '@/components/ui-back-to-main/styles';
import colorTheme from '@/components/ui-color-theme';

/**
 * The focus ring is a design contract: it must stay visible even when a theme ships without a
 * primary colour, so both the themed value and the literal fallback are pinned here.
 */
const themeWithoutPrimary: Theme = {
  ...colorTheme,
  palette: {
    ...colorTheme.palette,
    primary: { ...colorTheme.palette.primary, main: '' },
  },
};

const focusRing = (theme: Theme): unknown =>
  (backToMainStyles.build(theme).backButton as Record<string, Record<string, unknown>>)[
    '&:focus-visible'
  ]?.outline;

describe('ui-back-to-main focus ring', () => {
  it('uses the themed primary colour when the palette provides one', () => {
    expect(focusRing(colorTheme)).toBe('2px solid #1EAEFF');
  });

  it('falls back to the default blue focus ring when the primary colour is empty', () => {
    expect(focusRing(themeWithoutPrimary)).toBe('2px solid #1976d2');
  });

  it('keeps the rest of the focus-visible block intact on the fallback path', () => {
    expect(backToMainStyles.build(themeWithoutPrimary).backButton).toEqual({
      padding: 0,
      '&:hover': { backgroundColor: 'transparent' },
      '&:focus-visible': {
        backgroundColor: 'transparent',
        outline: '2px solid #1976d2',
        outlineOffset: '2px',
      },
    });
  });
});
