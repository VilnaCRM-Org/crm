import breakpointsTheme from '@/components/UIColorTheme';


const containerPadding= {
  xs: '0.9375rem',   // 15px
  md: '1.625rem',    // 26px
  lg: '2rem',        // 32px
  xl: '7.75rem',
};


export default {
  container: {
    width: '100%',
    margin: '0 auto',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.xs}px)`]: {
      paddingLeft: containerPadding.xs,
      paddingRight: containerPadding.xs,
    },

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
