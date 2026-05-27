import breakpointsTheme from '@/components/UIBreakpoints';
import { customColors, paletteColors } from '@/styles/colors';

export default {
  authOptionsWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '1rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginTop: '1.4375rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginTop: '0.8125rem',
    },
  },

  rememberMeLabel: {
    margin: 0,

    '& .MuiFormControlLabel-label': {
      fontFamily: `Inter, sans-serif`,
      fontStyle: 'normal',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: '1.2857',
      letterSpacing: 0,

      color: customColors.text.primary,

      [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
        fontSize: '1rem',
        lineHeight: '1.125',
      },
      [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
        fontSize: '0.875rem',
        lineHeight: '1.2857',
      },
    },
  },

  rememberMeCheckbox: {
    padding: 0,
    marginRight: '0.8125rem',
  },

  forgePassword: {
    padding: 0,

    fontFamily: `Inter, sans-serif`,
    fontStyle: 'normal',
    fontWeight: 500,
    fontSize: '0.9375rem',
    lineHeight: 1.2,
    letterSpacing: 0,
    textTransform: 'none',
    color: paletteColors.primary.main,

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      fontWeight: 500,
      fontSize: '0.9375rem',
      lineHeight: 1.2,
    },
  },
};
