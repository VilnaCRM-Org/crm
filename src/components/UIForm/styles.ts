import breakpointsTheme from '@/components/UIBreakpoints';

export default {
  formTitle: {
    fontSize: '1.375rem',
    fontFamily: 'Golos',
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: '1',

    marginBottom: '0.5rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      marginBottom: '0.9375rem',

      fontWeight: 600,
      fontSize: '1.875rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      marginBottom: '0.9375rem',
    },
  },

  formSubtitle: {
    fontFamily: 'Golos',
    fontWeight: 400,
    fontSize: '0.9375rem',
    lineHeight: '1.67',
    letterSpacing: 0,

    marginBottom: '1.0625rem',

    [`@media (min-width:${breakpointsTheme.breakpoints.values.sm}px)`]: {
      fontSize: '1rem',
      lineHeight: '1.625',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      marginBottom: '1.25rem',
    },
  },

  submitButton: {
    width: '100%',
    height: '3.125rem',
    marginTop: '1rem',
    paddingTop: '1rem',
    paddingBottom: '1rem',

    fontWeight: 500,
    fontStyle: 'normal',
    fontSize: '0.9375rem',
    lineHeight: 1.2,
    letterSpacing: 0,
    textTransform: 'none',

    boxShadow: 'none',

    [`@media (min-width:375px)`]: {
      minWidth: '19.6875rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.md}px)`]: {
      minWidth: '33.75rem',
      height: '4.375rem',
      paddingTop: '1.5rem',
      paddingBottom: '1.5rem',
      marginTop: '2.125rem',

      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1,
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.lg}px)`]: {
      minWidth: '26.375rem',
      maxHeight: '4.375rem',

      paddingTop: '1.5rem',
      paddingBottom: '1.5rem',

      marginTop: '2.0625rem',
    },
    [`@media (min-width:${breakpointsTheme.breakpoints.values.xl}px)`]: {
      maxHeight: '3.875rem',
      paddingTop: '1.25rem',
      paddingBottom: '1.25rem',
      marginTop: '1.1875rem',

      fontFamily: 'Golos',
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1,
    },
  },
  loader: {
    position: 'absolute',
    top: '38%',
    left: '42%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
  },
};
