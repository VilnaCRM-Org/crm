import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  formSection: {
    paddingTop: '0.5rem',
    paddingX: '0.375rem',
  },
  formWrapper: {
    padding: '1.5rem 1.5rem 1.375rem',
    margin: '0 auto',

    backgroundColor: '#FFFFFF',
    border: '1px solid #EAECEE',
    borderRadius: '16px',
    boxShadow: '0px 7px 40px 0px #E7E7E77D',

    maxWidth: '22.7rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      padding: '2rem 2.5rem 2.875rem',
      maxWidth: '39.5rem',
    },

    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      padding: '2rem, 2.5rem, 2.0625rem',

      maxWidth: '31.375rem',
    },
  },
};
