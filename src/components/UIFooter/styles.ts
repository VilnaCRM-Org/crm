import breakpointsTheme from '@/components/UIBreakpoints';
import colorTheme from '@/components/UIColorTheme';

export default {
  footerSection: {
    borderTop: `1px solid ${colorTheme.palette.grey['50']}`,
    backgroundColor: colorTheme.palette.background.default,

    boxShadow: '0px -5px 46px 0px rgba(198, 209, 220, 0.25)',

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingTop: '1.1rem',
      paddingBottom: '1.25rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      position: 'fixed',
      bottom: 0,
      width: '100%',
      maxHeight: '3.9375rem',

      paddingTop: '0.538rem',
      paddingBottom: '0.726rem',
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
