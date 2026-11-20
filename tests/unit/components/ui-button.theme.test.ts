import { buttonClasses } from '@mui/material/Button';
import { circularProgressClasses } from '@mui/material/CircularProgress';

import UI_BUTTON_PHONE_MEDIA from '@/components/ui-button/phone-media';
import buttonTheme from '@/components/ui-button/theme';
import { customColors, paletteColors } from '@/styles/colors';
import loadIsolated from '@tests/unit/utils/isolated-module';

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

  it('greys the disabled fill with a white label (class selector beats MUI defaults)', () => {
    const contained = getContained();
    const disabledRule = contained['&&.Mui-disabled'] as CssBlock;

    expect(contained['&:disabled']).toBeUndefined();
    expect(disabledRule.backgroundColor).toBe(paletteColors.background.subtle);
    expect(disabledRule.backgroundColor).toBe('#E1E7EA');
    expect(disabledRule.color).toBe(paletteColors.background.default);
    expect(disabledRule.color).toBe('#FFFFFF');
  });

  it('hides the label while loading by making it transparent', () => {
    const loadingRule = getContained()['&&.Mui-disabled.MuiButton-loading'] as CssBlock;

    expect(loadingRule.color).toBe('transparent');
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

describe('ui-button outlined theme', () => {
  it('re-pads the outlined button under the shared phone query', () => {
    const overrides = buttonTheme.components?.MuiButton?.styleOverrides;
    const outlined = (overrides as { outlined: CssBlock }).outlined;

    expect(UI_BUTTON_PHONE_MEDIA).toBe('@media (max-width: 375px)');
    expect(outlined[UI_BUTTON_PHONE_MEDIA]).toEqual({ padding: '17px 65px', marginBottom: '8px' });
  });
});

describe('ui-button outlined pill variant', () => {
  it('declares the standard pill and its compact small size with every state', async () => {
    const { default: theme } = await loadIsolated(() => import('@/components/ui-button/theme'));

    expect(theme.components?.MuiButton?.variants).toEqual([
      {
        props: { variant: 'outlinedPill' },
        style: {
          minWidth: 0,
          minHeight: '2.5rem',
          margin: 0,
          padding: '0 1.5rem',
          borderRadius: '3.5625rem',
          border: '1px solid #80878A',
          backgroundColor: '#FFFFFF',
          color: '#1B2327',
          fontFamily: 'Golos',
          fontWeight: 500,
          fontSize: '0.9375rem',
          lineHeight: '1.125rem',
          letterSpacing: 0,
          textTransform: 'none',
          '&:hover': { backgroundColor: '#F4F5F6' },
          '&:focus-visible': { outline: '2px solid #404142', outlineOffset: '2px' },
          '&&.Mui-disabled': { borderColor: '#E1E7EA', color: '#969B9D' },
          '@media (forced-colors: active)': {
            borderColor: 'ButtonText',
            '&&.Mui-disabled': { borderColor: 'GrayText', color: 'GrayText' },
          },
        },
      },
      {
        props: { variant: 'outlinedPill', size: 'small' },
        style: {
          padding: '0 1.25rem',
          lineHeight: 1.75,
          letterSpacing: '0.02857em',
          '@media (max-width: 375px)': { marginBottom: '8px' },
        },
      },
    ]);
  });
});
