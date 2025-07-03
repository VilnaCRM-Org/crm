import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  uiLinksWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      gap: '8px',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      display: 'none',
    },
  },
  uiLinkItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  uiSvgItem: {
    color: '#1B2327',
    width: '40px',
    height: '40px',
  },
};
