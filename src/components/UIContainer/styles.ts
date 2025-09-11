import breakpointsTheme from '@/components/UIBreakpoints';

const containerPadding = {
  xs: '0.9375rem', // 15px
  md: '1.625rem', // 26px
  lg: '2rem', // 32px
  xl: '7.75rem', // 124
};

export default {
  container: {
    width: '100%',

    paddingLeft: containerPadding.xs,
    paddingRight: containerPadding.xs,

    margin: '0 auto',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      paddingLeft: containerPadding.md,
      paddingRight: containerPadding.md,
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      paddingLeft: containerPadding.lg,
      paddingRight: containerPadding.lg,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      paddingLeft: containerPadding.xl,
      paddingRight: containerPadding.xl,
    },
  },
};
