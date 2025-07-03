import breakpointsTheme from '@/components/UIBreakpoints';
import colorTheme from '@/components/UIColorTheme';

export default {
  footerSection: {
    borderTop: `1px solid ${colorTheme.palette.grey['50']}`,
    backgroundColor: colorTheme.palette.background.default,

    [`@media (max-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingTop: '1.1rem',
      paddingBottom: '1.25rem',
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
