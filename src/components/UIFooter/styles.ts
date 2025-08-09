import breakpointsTheme from '@/components/UIBreakpoints';
import { paletteColors } from '@/styles/colors';

export default {
  footerSection: {
    borderTop: `1px solid ${paletteColors.background.subtle}`,
    backgroundColor: paletteColors.background.default,

    boxShadow: '0px -5px 46px 0px rgba(198, 209, 220, 0.25)',

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingTop: '1.1rem',
      paddingBottom: '1.25rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      width: '100%',

      paddingTop: '0.475625rem',
      paddingBottom: '0.725625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      width: '100%',
      maxHeight: '4.149375rem',

      paddingTop: '0.538125rem',
      paddingBottom: '0.725625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxHeight: '4.125rem',
      paddingTop: '0.5625rem',
      paddingBottom: '0.43375rem',
    },
  },

  uiMobile: {
    '@media (min-width: 768px)': {
      display: 'none',
    },
  },
  uiStandard: {
    '@media (max-width: 767px)': {
      display: 'none',
    },
  },
};
