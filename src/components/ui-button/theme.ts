import { createTheme } from '@mui/material';
import { circularProgressClasses } from '@mui/material/CircularProgress';

import breakpointsTheme from '@/components/ui-breakpoints';
import { customColors, paletteColors } from '@/styles/colors';
import { focusVisibleRing } from '@/styles/focus-ring';

import UI_BUTTON_PHONE_MEDIA from './phone-media';

const { lg } = breakpointsTheme.breakpoints.values;

const FORCED_COLORS = '@media (forced-colors: active)';

const outlinedPill = {
  minWidth: 0,
  minHeight: '2.5rem',
  margin: 0,
  padding: '0 1.5rem',
  borderRadius: '3.5625rem',
  border: `1px solid ${paletteColors.border.strong}`,
  backgroundColor: paletteColors.background.default,
  color: customColors.brand.darkPrimary,
  fontFamily: 'Golos',
  fontWeight: 500,
  fontSize: '0.9375rem',
  lineHeight: '1.125rem',
  letterSpacing: 0,
  textTransform: 'none',
  '&:hover': { backgroundColor: paletteColors.background.paper },
  ...focusVisibleRing,
  '&&.Mui-disabled': {
    borderColor: paletteColors.background.subtle,
    color: paletteColors.grey[50],
  },
  [FORCED_COLORS]: {
    borderColor: 'ButtonText',
    '&&.Mui-disabled': { borderColor: 'GrayText', color: 'GrayText' },
  },
} as const;

const outlinedPillCompact = {
  padding: '0 1.25rem',
  lineHeight: 1.75,
  letterSpacing: '0.02857em',
  [UI_BUTTON_PHONE_MEDIA]: { marginBottom: '8px' },
} as const;

export default createTheme({
  components: {
    MuiButton: {
      variants: [
        { props: { variant: 'outlinedPill' }, style: outlinedPill },
        { props: { variant: 'outlinedPill', size: 'small' }, style: outlinedPillCompact },
      ],
      styleOverrides: {
        root: {
          fontFamily: 'Golos, Inter',
        },
        contained: {
          backgroundColor: '#1EAEFF',
          borderRadius: '57px',
          padding: '20px 32px',

          '&:hover': {
            backgroundColor: paletteColors.primary.hover,
            boxShadow: 'none',
          },
          '&:focus-visible': {
            backgroundColor: paletteColors.primary.hover,
            boxShadow: 'none',
            outline: `2px solid ${customColors.text.primary}`,
            outlineOffset: '2px',
          },
          '&:active': {
            backgroundColor: paletteColors.primary.active,
            boxShadow: 'none',
          },
          '&&.Mui-disabled': {
            backgroundColor: paletteColors.background.subtle,
            color: paletteColors.background.default,
          },
          '&&.Mui-disabled.MuiButton-loading': {
            color: 'transparent',
          },
          [`@media (prefers-reduced-motion: reduce)`]: {
            [`& .${circularProgressClasses.svg}`]: {
              animation: 'none',
            },
          },
        },
        outlined: {
          padding: '17px 38px',
          borderRadius: '12px',
          borderColor: '#E1E7EA',
          [`@media (max-width: ${lg}px)`]: {
            padding: '26px 52px',
          },
          [UI_BUTTON_PHONE_MEDIA]: {
            padding: '17px 65px',
            marginBottom: '8px',
          },
        },
      },
    },
  },
});
