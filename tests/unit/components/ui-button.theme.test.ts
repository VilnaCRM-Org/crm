import { buttonClasses } from '@mui/material/Button';
import { circularProgressClasses } from '@mui/material/CircularProgress';

import buttonTheme from '@/components/ui-button/theme';
import { customColors, paletteColors } from '@/styles/colors';

type CssBlock = Record<string, unknown>;

const getContained = (): CssBlock => {
  const overrides = buttonTheme.components?.MuiButton?.styleOverrides;
  return (overrides as { contained: CssBlock }).contained;
};

const reducedMotionQuery = '@media (prefers-reduced-motion: reduce)';
const svgSelector = `& .${circularProgressClasses.svg}`;

describe('ui-button contained theme', () => {
  it('shows the disabled grey while loading (no brand-fill loading override)', () => {
    expect(getContained()[`&.${buttonClasses.loading}`]).toBeUndefined();
  });

  it('keeps the validation-disabled grey scoped to the disabled rule only', () => {
    const disabledRule = getContained()['&:disabled'] as CssBlock;

    expect(disabledRule.backgroundColor).toBe(paletteColors.background.subtle);
    expect(disabledRule.backgroundColor).toBe('#E1E7EA');
  });

  it('draws a focus-visible outline distinct from hover that boxShadow does not remove', () => {
    const contained = getContained();
    const focusRule = contained['&:focus-visible'] as CssBlock;
    const hoverRule = contained['&:hover'] as CssBlock;

    expect(focusRule).not.toBe(hoverRule);
    expect(focusRule.outline).toBe(`2px solid ${customColors.text.primary}`);
    expect(focusRule.outline).toBe('2px solid #404142');
    expect(focusRule.outlineOffset).toBe('2px');
    expect(focusRule.boxShadow).toBe('none');
    expect(hoverRule.outline).toBeUndefined();
  });

  it('suppresses the indicator spin only under prefers-reduced-motion', () => {
    const contained = getContained();
    const reducedMotion = contained[reducedMotionQuery] as CssBlock;
    const svgRule = reducedMotion[svgSelector] as CssBlock;

    expect(svgRule.animation).toBe('none');
    expect(contained[svgSelector]).toBeUndefined();
  });

  it('preserves the pill geometry', () => {
    expect(getContained().borderRadius).toBe('57px');
  });
});
